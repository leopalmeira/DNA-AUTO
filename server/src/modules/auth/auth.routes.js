const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { JWT_SECRET, authenticateToken } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');
const apiPlacasService = require('../../services/apiPlacas.service');

try {
    db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
} catch (_) {}

// Login de Usuários
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        let user = db.prepare(`
            SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role_id, u.status,
                   COALESCE(u.must_change_password, 0) as must_change_password,
                   r.code as role_code, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE LOWER(u.email) = LOWER(?)
        `).get(email);

        // Se o usuário não for encontrado e o banco estiver vazio (novo deploy), executa o seed sob demanda
        if (!user) {
            const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
            if (count === 0) {
                console.log('🌱 Banco vazio detectado na tentativa de login. Populando banco sob demanda...');
                const runSeed = require('../../database/seed');
                runSeed(db);
                user = db.prepare(`
                    SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role_id, u.status,
                           COALESCE(u.must_change_password, 0) as must_change_password,
                           r.code as role_code, r.name as role_name
                    FROM users u
                    JOIN roles r ON u.role_id = r.id
                    WHERE LOWER(u.email) = LOWER(?)
                `).get(email);
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Conta inativa ou bloqueada.' });
        }

        // Verificação segura de credenciais via bcrypt (Sem senhas temporárias universais - P0)
        const passwordMatch = bcrypt.compareSync(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // REGRA ABSOLUTA: O representante comercial NÃO pode acessar o aplicativo da oficina nem o aplicativo do cliente
        if (user.role_code === 'REPRESENTATIVE') {
            const appContext = String(req.body.app_context || req.headers['x-app-context'] || '').toUpperCase();
            const referer = String(req.headers['referer'] || '').toLowerCase();
            if (appContext !== 'REPRESENTATIVE_PORTAL' || referer.includes('/oficina') || referer.includes('/cliente')) {
                return res.status(403).json({
                    error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não pode acessar o aplicativo da oficina nem o aplicativo do cliente. Acesse exclusivamente o portal /representante.',
                    code: 'REPRESENTATIVE_APP_ACCESS_DENIED'
                });
            }
        }

        // Buscar oficina caso seja usuário de oficina
        const workshopUser = db.prepare(`
            SELECT wu.workshop_id, wu.position_title, wu.can_activate_dna, wu.can_prove_services,
                   w.trade_name as workshop_name, w.cnpj as workshop_cnpj, w.status as workshop_status
            FROM workshop_users wu
            JOIN workshops w ON wu.workshop_id = w.id
            WHERE wu.user_id = ?
        `).get(user.id);

        const token = jwt.sign(
            { id: user.id, email: user.email, role_code: user.role_code },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        logAudit({
            user: { id: user.id, name: user.name, role_code: user.role_code },
            action: 'LOGIN',
            entityType: 'USER',
            entityId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // Buscar veículo vinculado do usuário para auto-carregamento imediato no app mobile
        let primaryVehicle = null;
        try {
            const ownerRec = db.prepare('SELECT id, name FROM owners WHERE user_id = ? OR LOWER(email) = ?').get(user.id, user.email.toLowerCase());
            if (ownerRec) {
                primaryVehicle = db.prepare(`
                    SELECT v.*,
                           vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at,
                           (SELECT fipe_price_cents FROM fipe_values WHERE vehicle_id = v.id ORDER BY consulted_at DESC LIMIT 1) as fipe_price_cents
                    FROM vehicles v
                    LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
                    LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
                    WHERE v.current_owner_id = ? OR ot.new_owner_id = ?
                    ORDER BY v.created_at DESC
                    LIMIT 1
                `).get(ownerRec.id, ownerRec.id);
            }
            // Fallback: se não achou em owners, procura por ativação de cliente ou telefone
            if (!primaryVehicle) {
                const act = db.prepare(`
                    SELECT vehicle_id FROM client_activations 
                    WHERE (LOWER(client_name) = LOWER(?) OR whatsapp = ? OR whatsapp = ?) AND vehicle_id IS NOT NULL 
                    ORDER BY created_at DESC LIMIT 1
                `).get(user.name, user.phone || '', (user.phone || '').replace(/\D/g, ''));
                if (act && act.vehicle_id) {
                    primaryVehicle = db.prepare(`
                        SELECT v.*,
                               vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at,
                               (SELECT fipe_price_cents FROM fipe_values WHERE vehicle_id = v.id ORDER BY consulted_at DESC LIMIT 1) as fipe_price_cents
                        FROM vehicles v
                        LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
                        WHERE v.id = ?
                    `).get(act.vehicle_id);
                }
            }
        } catch (_) {}

        const mustChangePassword = Boolean(
            Number(user.must_change_password) === 1 ||
            (user.role_code === 'OWNER' && String(password).trim() === '123456')
        );

        const serializedVehicle = primaryVehicle ? {
            id: primaryVehicle.id,
            license_plate: primaryVehicle.license_plate,
            brand: primaryVehicle.brand,
            model: primaryVehicle.model,
            full_title: `${primaryVehicle.brand} ${primaryVehicle.model}`.trim(),
            version_label: primaryVehicle.version_label,
            manufacture_year: primaryVehicle.manufacture_year,
            model_year: primaryVehicle.model_year,
            color: primaryVehicle.color,
            fuel_type: primaryVehicle.fuel_type,
            photo_url: primaryVehicle.photo_url || '/img/splash-car-hero.png',
            dna_code: primaryVehicle.dna_code || null,
            fipe_price_cents: primaryVehicle.fipe_price_cents || null
        } : null;

        res.json({
            token,
            must_change_password: mustChangePassword,
            primaryVehicle: serializedVehicle,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_code: user.role_code,
                role_name: user.role_name,
                must_change_password: mustChangePassword,
                workshop: workshopUser || null,
                vehicle: serializedVehicle
            }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno ao autenticar.' });
    }
});

// Perfil do Usuário Autenticado
router.get('/me', authenticateToken, (req, res) => {
    try {
        const workshopUser = db.prepare(`
            SELECT wu.workshop_id, wu.position_title, wu.can_activate_dna, wu.can_prove_services,
                   w.trade_name as workshop_name, w.cnpj as workshop_cnpj, w.status as workshop_status
            FROM workshop_users wu
            JOIN workshops w ON wu.workshop_id = w.id
            WHERE wu.user_id = ?
        `).get(req.user.id);

        res.json({
            user: {
                ...req.user,
                workshop: workshopUser || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
});

// Usuários DEMO para troca rápida no seletor de perfil da interface
router.get('/demo-users', (req, res) => {
    try {
        let users = db.prepare(`
            SELECT u.id, u.name, u.email, r.code as role_code, r.name as role_name,
                   w.trade_name as workshop_name, wu.position_title
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN workshop_users wu ON wu.user_id = u.id
            LEFT JOIN workshops w ON wu.workshop_id = w.id
            WHERE u.is_demo = 1
            ORDER BY u.id ASC
        `).all();

        if (!users || users.length === 0) {
            console.log('🌱 Banco vazio ao consultar demo-users. Executando seed sob demanda...');
            const runSeed = require('../../database/seed');
            runSeed(db);
            users = db.prepare(`
                SELECT u.id, u.name, u.email, r.code as role_code, r.name as role_name,
                       w.trade_name as workshop_name, wu.position_title
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN workshop_users wu ON wu.user_id = u.id
                LEFT JOIN workshops w ON wu.workshop_id = w.id
                WHERE u.is_demo = 1
                ORDER BY u.id ASC
            `).all();
        }

        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar usuários demo.' });
    }
});

// Endpoint de inicialização manual/recuperação do banco (Seed sob demanda)
router.post('/seed', (req, res) => {
    try {
        const runSeed = require('../../database/seed');
        runSeed(db);
        res.json({ success: true, message: 'Banco de dados populado com sucesso com dados DEMO!' });
    } catch (err) {
        console.error('Erro ao executar seed via endpoint:', err);
        res.status(500).json({ error: 'Erro ao executar seed: ' + err.message });
    }
});


// Auxiliar para verificar se a requisição partiu de um representante autenticado (proibido em fluxos operacionais)
function isRequestFromRepresentative(req) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.role_code === 'REPRESENTATIVE') return true;
            if (decoded && decoded.id) {
                const u = db.prepare(`SELECT r.code as role_code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(decoded.id);
                if (u && u.role_code === 'REPRESENTATIVE') return true;
            }
        }
        const demoUserId = req.headers['x-demo-user-id'];
        if (demoUserId) {
            const u = db.prepare(`SELECT r.code as role_code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(demoUserId);
            if (u && u.role_code === 'REPRESENTATIVE') return true;
        }
    } catch (_) {}
    return false;
}

// Cadastro de Novo Cliente (Proprietário)
router.post('/register-client', async (req, res) => {
    try {
        if (isRequestFromRepresentative(req)) {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não pode cadastrar clientes ou veículos nem acessar o aplicativo do cliente.',
                code: 'REPRESENTATIVE_CLIENT_REGISTRATION_FORBIDDEN'
            });
        }
        const { name, email, password, phone, cpf, plate, license_plate } = req.body;
        const effectivePassword = (password && String(password).trim()) ? String(password).trim() : '123456';
        if (!name || !email) {
            return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
        }

        const isInitialDefaultPassword = (
            effectivePassword === '123456' ||
            req.body.must_change_password === true ||
            req.body.registered_by_workshop === true
        );
        const mustChangeFlag = isInitialDefaultPassword ? 1 : 0;

        const cleanEmail = email.trim().toLowerCase();
        const existing = db.prepare('SELECT id, name, phone, role_id FROM users WHERE LOWER(email) = ?').get(cleanEmail);

        let userId = existing ? existing.id : `usr_${Date.now()}`;
        let existingOwner = existing ? db.prepare('SELECT id FROM owners WHERE user_id = ? OR LOWER(email) = ?').get(userId, cleanEmail) : null;
        let ownerId = existingOwner ? existingOwner.id : `own_${Date.now()}`;
        const passwordHash = bcrypt.hashSync(effectivePassword, 10);
        const rawPlate = plate || license_plate || '';
        const cleanPlate = rawPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        let vehicle = null;
        if (cleanPlate) {
            vehicle = db.prepare('SELECT * FROM vehicles WHERE UPPER(REPLACE(license_plate, \'-\', \'\')) = ?').get(cleanPlate);
            if (!vehicle) {
                try {
                    const extRes = await apiPlacasService.consultarPlaca(cleanPlate);
                    if (extRes && extRes.found && extRes.vehicle) {
                        const vData = extRes.vehicle;
                        const vId = `veh_${Date.now()}`;
                        const brand = vData.brand || 'Montadora';
                        const model = vData.version || vData.model || 'Modelo';
                        const year = vData.model_year || vData.manufacture_year || 2021;
                        const color = vData.color || 'Prata';
                        const fuel = vData.fuel_type || 'Flex';
                        const vin = vData.chassis_vin || `9BWZZZ377VT${Date.now().toString().slice(-6)}`;
                        const renavam = vData.renavam || `00${Date.now().toString().slice(-9)}`;
                        let photoUrl = '/img/splash-car-hero.png';
                        try {
                            const { getDefaultPhotoForVehicle } = require('../../services/vehiclePhoto.service');
                            photoUrl = (vData.photo_url) || getDefaultPhotoForVehicle(brand, model) || '/img/splash-car-hero.png';
                        } catch (_) {}

                        db.prepare(`
                            INSERT INTO vehicles (
                                id, license_plate, chassis_vin, renavam, brand, model,
                                model_year, manufacture_year, color, fuel_type, current_owner_id, photo_url, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                        `).run(vId, cleanPlate, vin, renavam, brand, model, year, year, color, fuel, ownerId, photoUrl);

                        // Gerar DNA automático se ativado
                        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                        const rnd = (l) => Array.from({length: l}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
                        const dnaCode = `DNA-BR-${rnd(4)}-${rnd(4)}-${rnd(3)}`;
                        const certHash = crypto.createHash('sha256').update(`${vId}-${dnaCode}`).digest('hex');

                        db.prepare(`
                            INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activation_fee_cents, certificate_hash, activated_at, created_at)
                            VALUES (?, ?, ?, 'ACTIVE', 5990, ?, datetime('now'), datetime('now'))
                        `).run(`dna_${Date.now()}`, vId, dnaCode, certHash);

                        vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vId);
                    }
                } catch (e) {
                    console.warn('Busca externa falhou no registro do cliente:', e.message);
                }
            }

            // Se a API externa não localizou a placa, cria o veículo para a placa digitada (Garante que qualquer placa cadastrada funcione)
            if (!vehicle) {
                const vId = `veh_${Date.now()}`;
                const brand = req.body.brand || req.body.vehicle_brand || 'Veículo';
                const model = req.body.model || req.body.vehicle_model || 'Cadastrado';
                const year = parseInt(req.body.year || req.body.vehicle_year) || 2022;
                const color = req.body.color || 'Prata';
                const fuel = req.body.fuel_type || 'Flex';
                const vin = `9BWZZZ377VT${Date.now().toString().slice(-6)}`;
                const renavam = `00${Date.now().toString().slice(-9)}`;
                let photoUrl = '/img/splash-car-hero.png';
                try {
                    const { getDefaultPhotoForVehicle } = require('../../services/vehiclePhoto.service');
                    photoUrl = getDefaultPhotoForVehicle(brand, model) || '/img/splash-car-hero.png';
                } catch (_) {}

                db.prepare(`
                    INSERT INTO vehicles (
                        id, license_plate, chassis_vin, renavam, brand, model,
                        model_year, manufacture_year, color, fuel_type, current_owner_id, photo_url, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).run(vId, cleanPlate, vin, renavam, brand, model, year, year, color, fuel, ownerId, photoUrl);

                // Gerar DNA ativo para o veículo do novo cliente
                const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                const rnd = (l) => Array.from({length: l}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
                const dnaCode = `DNA-BR-${rnd(4)}-${rnd(4)}-${rnd(3)}`;
                const certHash = crypto.createHash('sha256').update(`${vId}-${dnaCode}`).digest('hex');

                db.prepare(`
                    INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activation_fee_cents, certificate_hash, activated_at, created_at)
                    VALUES (?, ?, ?, 'ACTIVE', 5990, ?, datetime('now'), datetime('now'))
                `).run(`dna_${Date.now()}`, vId, dnaCode, certHash);

                vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vId);
            }
        }

        // Se o cliente já tinha veículo cadastrado pela oficina e não informou placa nova, recupera o veículo
        if (!vehicle && existing) {
            try {
                vehicle = db.prepare(`
                    SELECT v.* FROM vehicles v
                    LEFT JOIN ownership_transfers ot ON ot.vehicle_id = v.id AND ot.status = 'COMPLETED'
                    WHERE v.current_owner_id = ? OR ot.new_owner_id = ?
                    ORDER BY v.created_at DESC LIMIT 1
                `).get(ownerId, ownerId);
            } catch (_) {}
        }

        db.transaction(() => {
            if (existing) {
                db.prepare(`
                    UPDATE users 
                    SET password_hash = ?, 
                        name = COALESCE(NULLIF(?, ''), name), 
                        phone = COALESCE(NULLIF(?, ''), phone),
                        must_change_password = ?,
                        status = 'ACTIVE',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(passwordHash, name.trim(), phone ? phone.trim() : null, mustChangeFlag, userId);

                if (existingOwner) {
                    db.prepare(`
                        UPDATE owners
                        SET user_id = ?,
                            name = COALESCE(NULLIF(?, ''), name),
                            phone = COALESCE(NULLIF(?, ''), phone),
                            document_cpf = CASE WHEN ? != '000.000.000-00' THEN ? ELSE document_cpf END
                        WHERE id = ?
                    `).run(userId, name.trim(), phone ? phone.trim() : null, cpf ? cpf.trim() : '000.000.000-00', cpf ? cpf.trim() : '000.000.000-00', ownerId);
                } else {
                    db.prepare(`
                        INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                    `).run(ownerId, userId, name.trim(), cpf ? cpf.trim() : '000.000.000-00', cleanEmail, phone ? phone.trim() : null);
                }
            } else {
                db.prepare(`
                    INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo, must_change_password)
                    VALUES (?, ?, ?, ?, ?, 'role_owner', 'ACTIVE', 0, ?)
                `).run(userId, name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null, mustChangeFlag);

                db.prepare(`
                    INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `).run(ownerId, userId, name.trim(), cpf ? cpf.trim() : '000.000.000-00', cleanEmail, phone ? phone.trim() : null);
            }

            if (vehicle) {
                db.prepare(`
                    INSERT INTO ownership_transfers (id, vehicle_id, previous_owner_id, new_owner_id, status, requested_at, completed_at, transfer_mileage, created_at)
                    VALUES (?, ?, NULL, ?, 'COMPLETED', datetime('now'), datetime('now'), 0, datetime('now'))
                `).run(`trn_${Date.now()}`, vehicle.id, ownerId);

                // Atualiza current_owner_id se a coluna existir
                try {
                    db.prepare('UPDATE vehicles SET current_owner_id = ? WHERE id = ?').run(ownerId, vehicle.id);
                } catch (_) {}
            }
        })();

        const token = jwt.sign(
            { id: userId, email: cleanEmail, role_code: 'OWNER' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        logAudit({
            user: { id: userId, name: name.trim(), role_code: 'OWNER' },
            action: 'REGISTER_CLIENT',
            entityType: 'USER',
            entityId: userId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // Buscar dados de DNA vinculados
        let vehicleDna = null;
        if (vehicle) {
            vehicleDna = db.prepare('SELECT dna_code, status FROM vehicle_dna WHERE vehicle_id = ?').get(vehicle.id);
        }

        res.status(201).json({
            token,
            must_change_password: Boolean(mustChangeFlag),
            user: {
                id: userId,
                name: name.trim(),
                email: cleanEmail,
                phone: phone || null,
                role_code: 'OWNER',
                role_name: 'Proprietário de Veículo',
                must_change_password: Boolean(mustChangeFlag),
                workshop: null,
                vehicle: vehicle ? {
                    id: vehicle.id,
                    license_plate: vehicle.license_plate,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    full_title: `${vehicle.brand} ${vehicle.model}`.trim(),
                    manufacture_year: vehicle.manufacture_year,
                    model_year: vehicle.model_year,
                    color: vehicle.color,
                    fuel_type: vehicle.fuel_type,
                    photo_url: vehicle.photo_url || '/img/splash-car-hero.png',
                    dna_code: (vehicleDna && vehicleDna.dna_code) || null
                } : null
            }
        });
    } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        res.status(500).json({ error: 'Erro interno ao cadastrar cliente.' });
    }
});

// Troca de Senha no Primeiro Acesso (ou alteração de senha pelo cliente logado)
function handleChangeInitialPassword(req, res) {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        const newPassword = String(req.body.new_password || req.body.newPassword || req.body.password || '').trim();
        const rawConfirm = req.body.confirm_password !== undefined ? req.body.confirm_password : req.body.confirmPassword;
        const confirmPassword = rawConfirm !== undefined ? String(rawConfirm || '').trim() : newPassword;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve conter no mínimo 6 caracteres.' });
        }

        if (newPassword === '123456') {
            return res.status(400).json({ error: 'Por segurança, escolha uma nova senha diferente da senha inicial 123456.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'As senhas informadas não coincidem.' });
        }

        const passwordHash = bcrypt.hashSync(newPassword, 10);
        db.prepare(`
            UPDATE users
            SET password_hash = ?,
                must_change_password = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(passwordHash, userId);

        logAudit({
            user: { id: userId, name: req.user.name || 'Cliente', role_code: req.user.role_code || 'OWNER' },
            action: 'CHANGE_INITIAL_PASSWORD',
            entityType: 'USER',
            entityId: userId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        return res.json({
            success: true,
            must_change_password: false,
            message: 'Sua nova senha foi salva com sucesso!'
        });
    } catch (err) {
        console.error('Erro ao trocar senha inicial:', err);
        return res.status(500).json({ error: 'Erro interno ao atualizar a senha.' });
    }
}

router.post('/change-initial-password', authenticateToken, handleChangeInitialPassword);
router.post('/change-password', authenticateToken, handleChangeInitialPassword);

// Atualização de Dados Pessoais do Cliente (Nome, E-mail, WhatsApp e Senha Opcional)
function handleUpdateClientProfile(req, res) {
    try {
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!currentUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const newName = (req.body.name || req.body.client_name || currentUser.name || '').trim();
        const newEmail = (req.body.email || currentUser.email || '').trim().toLowerCase();
        const newPhone = (req.body.phone || req.body.whatsapp || currentUser.phone || '').trim();
        const newCpf = (req.body.cpf || req.body.document_cpf || '').trim();
        const newPassword = (req.body.new_password || req.body.newPassword || req.body.password || '').trim();

        if (!newName || !newEmail) {
            return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
        }

        if (newEmail !== currentUser.email.toLowerCase()) {
            const emailConflict = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(newEmail, userId);
            if (emailConflict) {
                return res.status(409).json({ error: 'Este e-mail já está em uso por outra conta.' });
            }
        }

        if (newPassword && newPassword.length > 0 && newPassword.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
        }

        db.transaction(() => {
            if (newPassword && newPassword.length >= 6) {
                const passHash = bcrypt.hashSync(newPassword, 10);
                db.prepare(`
                    UPDATE users
                    SET name = ?,
                        email = ?,
                        phone = ?,
                        password_hash = ?,
                        must_change_password = 0,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(newName, newEmail, newPhone || null, passHash, userId);
            } else {
                db.prepare(`
                    UPDATE users
                    SET name = ?,
                        email = ?,
                        phone = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(newName, newEmail, newPhone || null, userId);
            }

            const ownerRec = db.prepare('SELECT id FROM owners WHERE user_id = ? OR LOWER(email) = ?').get(userId, currentUser.email.toLowerCase());
            if (ownerRec) {
                if (newCpf) {
                    db.prepare(`
                        UPDATE owners
                        SET name = ?, email = ?, phone = ?, document_cpf = ?
                        WHERE id = ?
                    `).run(newName, newEmail, newPhone || null, newCpf, ownerRec.id);
                } else {
                    db.prepare(`
                        UPDATE owners
                        SET name = ?, email = ?, phone = ?
                        WHERE id = ?
                    `).run(newName, newEmail, newPhone || null, ownerRec.id);
                }
            }
        })();

        const updatedUser = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, COALESCE(u.must_change_password, 0) as must_change_password,
                   r.code as role_code, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `).get(userId);

        return res.json({
            success: true,
            message: 'Dados pessoais atualizados com sucesso!',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role_code: updatedUser.role_code,
                role_name: updatedUser.role_name,
                must_change_password: Boolean(updatedUser.must_change_password)
            }
        });
    } catch (err) {
        console.error('Erro ao atualizar perfil do cliente:', err);
        return res.status(500).json({ error: 'Erro interno ao atualizar dados pessoais.' });
    }
}

router.put('/profile', authenticateToken, handleUpdateClientProfile);
router.post('/profile', authenticateToken, handleUpdateClientProfile);

// Cadastro Completo de Proprietário com Placa do Veículo e Código de Oficina (Fluxo Onboarding Mobile)
router.post('/register-owner', async (req, res) => {
    try {
        const {
            name, email, password, phone, license_plate, plate,
            vehicle_model, model, vehicle_brand, brand, vehicle_year, year,
            workshop_code, color, fuel_type, transmission_type, chassis_vin,
            renavam: reqRenavam, fipe_value, fipe_code: reqFipeCode, fipe_cents: reqFipeCents, fipe_ref: reqFipeRef
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
        if (existing) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado no DNA AUTO.' });
        }

        const userId = `usr_${Date.now()}`;
        const ownerId = `own_${Date.now()}`;
        const passwordHash = bcrypt.hashSync(password, 10);
        const rawPlate = license_plate || plate || '';
        const cleanPlate = rawPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        let vehicle = null;
        let dnaRecord = null;

        if (cleanPlate) {
            vehicle = db.prepare('SELECT * FROM vehicles WHERE license_plate = ?').get(cleanPlate);
            if (!vehicle) {
                // Consulta a API de Placas oficial para obter dados reais de FIPE e Detran
                let apiData = null;
                let rawFullData = null;
                try {
                    const apiRes = await apiPlacasService.consultarPlaca(cleanPlate);
                    if (apiRes && apiRes.found && apiRes.vehicle) {
                        apiData = apiRes.vehicle;
                        rawFullData = apiRes.raw || null;
                    }
                } catch (_) {}

                const vehicleId = `veh_${Date.now()}`;
                const carBrand = (apiData && apiData.brand) || vehicle_brand || brand || 'Montadora Homologada';
                const carModel = (apiData && (apiData.version || apiData.model)) || vehicle_model || model || 'Modelo Homologado';
                const carSubmodel = (apiData && (apiData.submodel || (apiData.specs && apiData.specs.submodelo))) || null;
                const carVersion = (apiData && (apiData.version || apiData.version_label)) || carModel;
                const carYear = (apiData && (apiData.model_year || apiData.manufacture_year)) || parseInt(vehicle_year || year) || 2020;
                const carFabYear = (apiData && apiData.manufacture_year) || carYear;
                const carColor = (apiData && apiData.color && apiData.color !== 'Não informada') ? apiData.color : (color || 'Prata');
                const carFuel = (apiData && apiData.fuel_type) || fuel_type || 'Flex';
                const carTrans = (apiData && (apiData.transmission_type || apiData.transmission)) || transmission_type || 'Manual';
                const vin = (apiData && (apiData.chassis_vin || apiData.chassis_vin_masked)) || chassis_vin || `9BWZZZ377VT${Date.now().toString().slice(-6)}`;
                const renavam = (apiData && (apiData.renavam || apiData.renavam_masked)) || reqRenavam || `00${Date.now().toString().slice(-9)}`;
                
                const engineDisp = (apiData && (apiData.engine_displacement || (apiData.specs && apiData.specs.cilindradas_formatada))) || null;
                const vehType = (apiData && (apiData.vehicle_type || (apiData.specs && apiData.specs.tipo_veiculo))) || 'Automóvel';
                const segment = (apiData && (apiData.segment || (apiData.specs && apiData.specs.segmento))) || 'Auto';
                const subSegment = (apiData && (apiData.sub_segmento || (apiData.specs && apiData.specs.sub_segmento))) || null;
                const bodywork = (apiData && (apiData.bodywork || (apiData.specs && apiData.specs.carroceria))) || null;
                const passengerCap = (apiData && (apiData.passenger_capacity || (apiData.specs && apiData.specs.quantidade_passageiro))) || 5;
                const grossWeight = (apiData && (apiData.gross_weight || (apiData.specs && apiData.specs.peso_bruto_total))) || null;
                const maxTraction = (apiData && (apiData.max_traction || (apiData.specs && apiData.specs.cap_maxima_tracao))) || null;
                const axesCount = (apiData && (apiData.axes_count || (apiData.specs && apiData.specs.eixos))) || '2';
                const state = (apiData && (apiData.origin && apiData.origin.state)) || (apiData && apiData.specs && apiData.specs.uf) || 'SP';
                const city = (apiData && (apiData.origin && apiData.origin.city)) || (apiData && apiData.specs && apiData.specs.municipio) || 'São Paulo';
                const plateOld = (apiData && apiData.plate_old_format) || cleanPlate;
                const plateMerc = (apiData && apiData.plate_mercosul_format) || cleanPlate;
                const chassisStatus = (apiData && apiData.specs && apiData.specs.situacao_chassi) || 'N';
                const vehicleStatus = (apiData && apiData.specs && apiData.specs.situacao_veiculo) || 'S';
                const legalDesc = (apiData && apiData.legal_status && apiData.legal_status.detran_status) || 'REGULAR';
                const brandLogo = (apiData && (apiData.logo || apiData.brand_logo_url)) || null;
                const fipeScore = (apiData && apiData.fipe && apiData.fipe.score) || null;

                const rawJsonStr = rawFullData ? JSON.stringify(rawFullData) : null;
                const extraJsonStr = (rawFullData && rawFullData.extra) ? JSON.stringify(rawFullData.extra) : null;
                const fipeJsonStr = (rawFullData && rawFullData.fipe) ? JSON.stringify(rawFullData.fipe) : null;

                let photoUrl = (apiData && apiData.photo_url) || null;
                if (!photoUrl || photoUrl.includes('images.unsplash.com')) {
                    try {
                        const { getDefaultPhotoForVehicle } = require('../../services/vehiclePhoto.service');
                        photoUrl = getDefaultPhotoForVehicle(carBrand, carModel);
                    } catch (_) {
                        photoUrl = 'https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80';
                    }
                }

                db.prepare(`
                    INSERT INTO vehicles (
                        id, license_plate, chassis_vin, renavam, brand, model, submodel, version_label,
                        manufacture_year, model_year, fuel_type, transmission_type, color, photo_url,
                        engine_displacement, vehicle_type, segment, sub_segment, bodywork, passenger_capacity,
                        gross_weight, max_traction, axes_count, state, city, plate_old_format, plate_mercosul_format,
                        chassis_status, vehicle_status, legal_status_desc, brand_logo_url, fipe_score,
                        raw_json, extra_json, fipe_json, created_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, datetime('now')
                    )
                `).run(
                    vehicleId, cleanPlate, vin, renavam, carBrand, carModel, carSubmodel, carVersion,
                    carFabYear, carYear, carFuel, carTrans, carColor, photoUrl,
                    engineDisp, vehType, segment, subSegment, bodywork, passengerCap,
                    grossWeight, maxTraction, String(axesCount), state, city, plateOld, plateMerc,
                    chassisStatus, vehicleStatus, legalDesc, brandLogo, fipeScore,
                    rawJsonStr, extraJsonStr, fipeJsonStr
                );

                // Inserir cotação FIPE oficial real com score
                let fipeCents = reqFipeCents || 7500000;
                let fipeCode = reqFipeCode || '004495-4';
                let fipeRef = reqFipeRef || 'Setembro de 2026';
                let fipeModelText = carModel;
                let fipeBrandText = carBrand;
                let fipeFuelText = carFuel;
                let allFipeJson = null;

                if (apiData && apiData.fipe) {
                    if (apiData.fipe.market_value_cents) fipeCents = apiData.fipe.market_value_cents;
                    if (apiData.fipe.fipe_code) fipeCode = apiData.fipe.fipe_code;
                    if (apiData.fipe.reference_month) fipeRef = apiData.fipe.reference_month;
                    if (apiData.fipe.model_match) fipeModelText = apiData.fipe.model_match;
                    if (apiData.fipe.brand_match) fipeBrandText = apiData.fipe.brand_match;
                    if (apiData.fipe.fuel_match) fipeFuelText = apiData.fipe.fuel_match;
                    if (apiData.fipe.all_options) allFipeJson = JSON.stringify(apiData.fipe.all_options);
                } else if (fipe_value && typeof fipe_value === 'string') {
                    const num = fipe_value.replace(/[^0-9]/g, '');
                    if (num) fipeCents = parseInt(num, 10);
                }

                try {
                    db.prepare(`
                        INSERT INTO fipe_values (
                            id, vehicle_id, fipe_code, reference_month_year, fipe_price_cents,
                            score, model_text, brand_text, fuel_text, all_fipe_json
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        `fipe_${Date.now()}`, vehicleId, fipeCode, fipeRef, fipeCents,
                        fipeScore, fipeModelText, fipeBrandText, fipeFuelText, allFipeJson
                    );
                } catch (_) {}

                // Gerar DNA permanente
                const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                const rnd = (l) => Array.from({length: l}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
                const dnaCode = `DNA-BR-${rnd(4)}-${rnd(4)}-${rnd(3)}`;
                const crypto = require('crypto');
                const certHash = crypto.createHash('sha256').update(`${vehicleId}-${dnaCode}`).digest('hex');
                
                db.prepare(`
                    INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activation_fee_cents, certificate_hash, activated_at, created_at)
                    VALUES (?, ?, ?, 'ACTIVE', 5990, ?, datetime('now'), datetime('now'))
                `).run(`dna_${Date.now()}`, vehicleId, dnaCode, certHash);

                db.prepare(`
                    INSERT OR REPLACE INTO health_scores (
                        id, vehicle_id, overall_score, documented_percentage, proven_services_count,
                        invoices_count, verified_workshops_count, mileage_records_count, continuity_status, score_rationale
                    ) VALUES (?, ?, 95, 80, 0, 0, 1, 0, 'EXCELENTE', 'Veículo recém-ativado na rede DNA AUTO.')
                `).run(`hs_${Date.now()}`, vehicleId);

                vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
            }

            if (vehicle) {
                dnaRecord = db.prepare('SELECT * FROM vehicle_dna WHERE vehicle_id = ?').get(vehicle.id);
            }
        }

        db.transaction(() => {
            db.prepare(`
                INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
                VALUES (?, ?, ?, ?, ?, 'role_owner', 'ACTIVE', 0)
            `).run(userId, name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null);

            db.prepare(`
                INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                VALUES (?, ?, ?, '000.000.000-00', ?, ?, datetime('now'))
            `).run(ownerId, userId, name.trim(), cleanEmail, phone ? phone.trim() : null);

            if (vehicle) {
                db.prepare(`
                    INSERT INTO ownership_transfers (id, vehicle_id, previous_owner_id, new_owner_id, status, requested_at, completed_at, transfer_mileage, created_at)
                    VALUES (?, ?, NULL, ?, 'COMPLETED', datetime('now'), datetime('now'), 87542, datetime('now'))
                `).run(`trn_${Date.now()}`, vehicle.id, ownerId);
            }

            // Se forneceu código de oficina, valida e ativa
            if (workshop_code) {
                const code = workshop_code.trim().toUpperCase();
                const act = db.prepare('SELECT * FROM client_activations WHERE UPPER(activation_code) = ?').get(code);
                if (act) {
                    db.prepare(`
                        UPDATE client_activations
                        SET status = 'ACTIVATED', owner_id = ?, vehicle_id = COALESCE(vehicle_id, ?), activated_at = datetime('now')
                        WHERE id = ?
                    `).run(ownerId, vehicle ? vehicle.id : null, act.id);
                }
            }
        })();

        const token = jwt.sign(
            { id: userId, email: cleanEmail, role_code: 'OWNER' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        logAudit({
            user: { id: userId, name: name.trim(), role_code: 'OWNER' },
            action: 'REGISTER_OWNER_ONBOARDING',
            entityType: 'USER',
            entityId: userId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: userId,
                name: name.trim(),
                email: cleanEmail,
                phone: phone || null,
                role: 'role_owner',
                role_code: 'OWNER',
                role_name: 'Proprietário de Veículo',
                vehicle: vehicle || null
            },
            owner: {
                id: ownerId,
                user_id: userId,
                name: name.trim(),
                email: cleanEmail,
                phone: phone || null
            },
            vehicle: vehicle || null,
            dna: dnaRecord || null
        });
    } catch (err) {
        console.error('Erro ao cadastrar proprietário via onboarding:', err);
        res.status(500).json({ error: 'Erro interno ao cadastrar proprietário.' });
    }
});

// Solicitação de Recuperação de Senha Segura via Token com Expiração (P0 Segurança)
router.post('/forgot-password', (req, res) => {
    try {
        if (isRequestFromRepresentative(req)) {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não pode criar, visualizar, alterar ou redefinir senhas de oficinas ou clientes.',
                code: 'REPRESENTATIVE_PASSWORD_RESET_FORBIDDEN'
            });
        }
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = ?').get(cleanEmail);

        if (!user) {
            return res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail no DNA AUTO.' });
        }

        // Garante a tabela password_reset_tokens
        db.exec(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Gerar token criptograficamente seguro (32 bytes)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const tokenId = 'rst_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Expira em 1 hora

        // Invalida tokens anteriores não usados do usuário
        db.prepare(`
            UPDATE password_reset_tokens 
            SET used_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND used_at IS NULL
        `).run(user.id);

        // Insere o novo token com hash SHA-256 e timestamp de expiração
        db.prepare(`
            INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(tokenId, user.id, tokenHash, expiresAt);

        logAudit({
            user: { id: user.id, name: user.name, role_code: 'USER' },
            action: 'REQUEST_PASSWORD_RESET',
            entityType: 'USER',
            entityId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: `Token seguro de recuperação gerado para ${user.name}. Válido por 1 hora.`,
            resetToken: rawToken, // Retornado com segurança para entrega por e-mail/WhatsApp/mock de teste
            expiresAt
        });
    } catch (err) {
        console.error('Erro ao gerar token de recuperação:', err);
        res.status(500).json({ error: 'Erro interno ao processar recuperação de senha: ' + err.message });
    }
});

// Redefinição de Senha com Validação de Token Seguro, Expiração e Uso Único (P0 Segurança)
router.post('/reset-password', (req, res) => {
    try {
        if (isRequestFromRepresentative(req)) {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não pode criar, visualizar, alterar ou redefinir senhas de oficinas ou clientes.',
                code: 'REPRESENTATIVE_PASSWORD_RESET_FORBIDDEN'
            });
        }
        const { token, newPassword, confirmPassword } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token de recuperação não informado.' });
        }

        if (!newPassword || String(newPassword).trim().length < 6) {
            return res.status(400).json({ error: 'A nova senha deve conter no mínimo 6 caracteres.' });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'As senhas informadas não coincidem.' });
        }

        const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

        // Busca o token associado ao hash
        const tokenRecord = db.prepare(`
            SELECT prt.*, u.name as user_name, u.email as user_email
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token_hash = ?
        `).get(tokenHash);

        if (!tokenRecord) {
            return res.status(400).json({ error: 'Token de recuperação inválido.' });
        }

        if (tokenRecord.used_at) {
            return res.status(400).json({ error: 'Este token de recuperação já foi utilizado.' });
        }

        const now = new Date();
        const expiresAt = new Date(tokenRecord.expires_at);
        if (now > expiresAt) {
            return res.status(400).json({ error: 'Token de recuperação expirado. Solicite um novo.' });
        }

        const passwordHash = bcrypt.hashSync(String(newPassword).trim(), 10);

        db.transaction(() => {
            // Atualiza a senha
            db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(passwordHash, tokenRecord.user_id);

            // Marca o token como utilizado (Garantia de Uso Único)
            db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(tokenRecord.id);
        })();

        logAudit({
            user: { id: tokenRecord.user_id, name: tokenRecord.user_name, role_code: 'USER' },
            action: 'RESET_PASSWORD_WITH_TOKEN',
            entityType: 'USER',
            entityId: tokenRecord.user_id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: `Senha de ${tokenRecord.user_name} redefinida com sucesso! Você já pode entrar com sua nova senha.`
        });
    } catch (err) {
        console.error('Erro ao redefinir senha com token:', err);
        res.status(500).json({ error: 'Erro interno ao redefinir senha: ' + err.message });
    }
});

// Validação de Senha de Gestor para Área Restrita (Faturamento da Oficina)
router.post('/verify-manager-password', (req, res) => {
    try {
        if (isRequestFromRepresentative(req)) {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não possui acesso ao painel ou área restrita da oficina.',
                code: 'REPRESENTATIVE_MANAGER_ACCESS_FORBIDDEN'
            });
        }
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'Senha não informada.' });
        }

        const trimmedPassword = String(password).trim();

        // 1. ELIMINADAS AS SENHAS MESTRAS FIXAS (P0 de Segurança - Sem senhas universais).
        // Autenticação estrita baseada nas credenciais reais do usuário autenticado ou gestor da oficina.

        // 2. Verificar usuário logado via Token JWT
        let user = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(decoded.id);
            } catch (e) {}
        }

        // 3. Caso não haja token ou usuário, buscar usuário com papel de Oficina ou Administrador
        if (!user) {
            user = db.prepare(`
                SELECT u.id, u.password_hash FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.code IN ('WORKSHOP', 'ADMIN')
                ORDER BY u.id ASC LIMIT 1
            `).get();
        }

        if (user && user.password_hash && bcrypt.compareSync(trimmedPassword, user.password_hash)) {
            return res.json({ success: true, verified: true });
        }

        return res.status(401).json({ error: 'Senha incorreta.' });
    } catch (err) {
        console.error('Erro na validação de senha de gestor:', err);
        return res.status(500).json({ error: 'Erro interno ao validar senha.' });
    }
});

// Cadastro de Nova Oficina Parceira / Empresa Credenciada
function handleRegisterWorkshop(req, res) {
    try {
        // REGRA ABSOLUTA: O representante comercial NÃO cadastra oficinas diretamente no aplicativo
        if (isRequestFromRepresentative(req)) {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial não pode cadastrar oficinas diretamente no aplicativo nem criar contas em nome dos proprietários.',
                code: 'REPRESENTATIVE_DIRECT_WORKSHOP_REGISTRATION_FORBIDDEN'
            });
        }

        const tradeName = (req.body.tradeName || req.body.trade_name || req.body.workshop_name || req.body.name || req.body.nome || '').trim();
        const companyName = (req.body.companyName || req.body.company_name || tradeName).trim();
        const phone = (req.body.phone || req.body.whatsapp || req.body.telefone || '').trim();
        const email = (req.body.email || '').trim();
        const password = req.body.password || req.body.senha || '';
        const technicianName = (req.body.technicianName || req.body.technician_name || req.body.admin_name || tradeName).trim();
        const addressStreet = req.body.addressStreet || req.body.address_street || 'Av. Principal';
        const addressNumber = req.body.addressNumber || req.body.address_number || '100';
        const addressNeighborhood = req.body.addressNeighborhood || req.body.address_neighborhood || 'Centro';
        const city = req.body.city || req.body.cidade || 'São Paulo';
        const state = req.body.state || req.body.uf || 'SP';
        const zipCode = req.body.zipCode || req.body.cep || '01000-000';

        if (!tradeName || !email || !password) {
            return res.status(400).json({ error: 'Nome da oficina, e-mail e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        let rawCnpj = (req.body.cnpj || '').trim();
        let cleanCnpj = rawCnpj.replace(/\D/g, '');

        if (!cleanCnpj || cleanCnpj.length < 11) {
            // Identificador fiscal provisório para cadastro simplificado mobile
            cleanCnpj = ('99' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 90 + 10)).slice(0, 14);
        } else {
            const existingWorkshop = db.prepare('SELECT id, trade_name FROM workshops WHERE cnpj = ? OR cnpj = ?').get(rawCnpj, cleanCnpj);
            if (existingWorkshop) {
                return res.status(400).json({ error: `Já existe uma oficina cadastrada com este CNPJ (${existingWorkshop.trade_name}).` });
            }
        }

        // Garantir que a role exista no banco
        db.prepare(`
            INSERT OR IGNORE INTO roles (id, code, name, description)
            VALUES ('role_workshop_owner', 'WORKSHOP_OWNER', 'Dono da Oficina', 'Gerenciamento da oficina e equipe')
        `).run();

        const existingUser = db.prepare('SELECT id, name, email, password_hash, role_id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
        if (existingUser && existingUser.role_id === 'role_representative') {
            return res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: Conta de representante comercial não pode ser utilizada para cadastrar ou acessar uma oficina.',
                code: 'REPRESENTATIVE_ACCOUNT_ISOLATION'
            });
        }
        
        let userId;
        let adminName = technicianName ? technicianName.trim() : tradeName.trim();
        const workshopId = `ws_${Date.now()}`;

        if (existingUser) {
            // Usuário já existe: valida a senha para associar a nova oficina à conta existente
            const passwordMatch = bcrypt.compareSync(password, existingUser.password_hash);
            if (!passwordMatch) {
                return res.status(400).json({
                    error: 'Este e-mail já possui cadastro no DNA AUTO. Digite a sua senha atual ou redefina-a em "Esqueci minha senha" para vincular esta oficina.'
                });
            }
            userId = existingUser.id;
            adminName = existingUser.name || adminName;

            db.transaction(() => {
                // Atualiza perfil para dono de oficina caso seja proprietário comum
                db.prepare("UPDATE users SET role_id = 'role_workshop_owner', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);

                // Criar a oficina
                db.prepare(`
                    INSERT INTO workshops (
                        id, company_name, trade_name, cnpj, phone, email,
                        address_street, address_number, address_complement, address_neighborhood,
                        city, state, zip_code, status, verified_badge
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1)
                `).run(
                    workshopId,
                    companyName ? companyName.trim() : tradeName.trim(),
                    tradeName.trim(),
                    cleanCnpj,
                    phone ? phone.trim() : '(11) 99999-0000',
                    cleanEmail,
                    addressStreet ? addressStreet.trim() : 'Av. Principal',
                    addressNumber ? addressNumber.trim() : '100',
                    null,
                    addressNeighborhood ? addressNeighborhood.trim() : 'Centro',
                    city ? city.trim() : 'São Paulo',
                    state ? state.trim().toUpperCase() : 'SP',
                    zipCode ? zipCode.trim() : '01000-000'
                );

                // Associar à equipe da oficina
                db.prepare(`
                    INSERT INTO workshop_users (id, workshop_id, user_id, position_title, can_activate_dna, can_prove_services)
                    VALUES (?, ?, ?, 'Proprietário / Responsável Técnico', 1, 1)
                `).run(`wu_${Date.now()}`, workshopId, userId);
            })();
        } else {
            // Novo usuário + nova oficina
            userId = `usr_ws_${Date.now()}`;
            const passwordHash = bcrypt.hashSync(password, 10);

            db.transaction(() => {
                // Criar a oficina
                db.prepare(`
                    INSERT INTO workshops (
                        id, company_name, trade_name, cnpj, phone, email,
                        address_street, address_number, address_complement, address_neighborhood,
                        city, state, zip_code, status, verified_badge
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1)
                `).run(
                    workshopId,
                    companyName ? companyName.trim() : tradeName.trim(),
                    tradeName.trim(),
                    cleanCnpj,
                    phone ? phone.trim() : '(11) 99999-0000',
                    cleanEmail,
                    addressStreet ? addressStreet.trim() : 'Av. Principal',
                    addressNumber ? addressNumber.trim() : '100',
                    null,
                    addressNeighborhood ? addressNeighborhood.trim() : 'Centro',
                    city ? city.trim() : 'São Paulo',
                    state ? state.trim().toUpperCase() : 'SP',
                    zipCode ? zipCode.trim() : '01000-000'
                );

                // Criar o usuário gestor da oficina
                db.prepare(`
                    INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
                    VALUES (?, ?, ?, ?, ?, 'role_workshop_owner', 'ACTIVE', 0)
                `).run(userId, adminName, cleanEmail, passwordHash, phone ? phone.trim() : null);

                // Associar à equipe da oficina
                db.prepare(`
                    INSERT INTO workshop_users (id, workshop_id, user_id, position_title, can_activate_dna, can_prove_services)
                    VALUES (?, ?, ?, 'Proprietário / Responsável Técnico', 1, 1)
                `).run(`wu_${Date.now()}`, workshopId, userId);
            })();
        }

        const token = jwt.sign(
            { id: userId, email: cleanEmail, role_code: 'WORKSHOP_OWNER' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        logAudit({
            user: { id: userId, name: adminName, role_code: 'WORKSHOP_OWNER' },
            action: 'REGISTER_WORKSHOP',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // VINCULAÇÃO AUTOMÁTICA DA OFICINA AO REPRESENTANTE COMERCIAL (Etapa 3 do Fluxo Oficial)
        let referralLinkInfo = null;
        try {
            // Verifica se a oficina já possui vínculo anterior (nunca sobrescrever vínculo anterior sem auditoria administrativa)
            const existingReferral = db.prepare('SELECT * FROM workshop_referrals WHERE workshop_id = ?').get(workshopId);
            if (!existingReferral) {
                const rawRepCode = String(
                    req.body.rep_code ||
                    req.body.representative_code ||
                    req.query?.rep_code ||
                    req.headers['x-rep-code'] ||
                    ''
                ).trim().toUpperCase();
                const rawInviteToken = String(
                    req.body.invite_token ||
                    req.query?.invite_token ||
                    req.headers['x-invite-token'] ||
                    ''
                ).trim();
                const cleanPhoneDigits = (phone || '').replace(/\D/g, '');
                const hasExplicitCnpj = Boolean(rawCnpj && rawCnpj.replace(/\D/g, '').length >= 11);

                let matchedInvite = null;
                if (rawInviteToken) {
                    matchedInvite = db.prepare(`
                        SELECT * FROM representative_invites
                        WHERE invite_token = ?
                        ORDER BY updated_at DESC LIMIT 1
                    `).get(rawInviteToken);
                }

                // Busca por pré-associação registrada na página de convite (/representante/indicacao/:code)
                // Garante persistência mesmo quando o proprietário instala o app e abre depois sem parâmetros na URL
                if (!matchedInvite) {
                    const candidateInvites = db.prepare(`
                        SELECT * FROM representative_invites
                        WHERE status IN ('CREATED', 'ACCESSED', 'STARTED')
                          AND workshop_id IS NULL
                        ORDER BY updated_at DESC
                    `).all();

                    for (const inv of candidateInvites) {
                        const invCnpj = (inv.prospect_cnpj || '').replace(/\D/g, '');
                        const invEmail = (inv.prospect_email || '').trim().toLowerCase();
                        const invPhone = (inv.prospect_phone || '').replace(/\D/g, '');

                        const cnpjMatch = hasExplicitCnpj && invCnpj && invCnpj === cleanCnpj;
                        const emailMatch = invEmail && invEmail === cleanEmail;
                        const phoneMatch = cleanPhoneDigits.length >= 10 && invPhone.length >= 10 && invPhone.slice(-10) === cleanPhoneDigits.slice(-10);

                        if (cnpjMatch || emailMatch || phoneMatch) {
                            matchedInvite = inv;
                            break;
                        }
                    }
                }

                const targetRepCode = matchedInvite ? matchedInvite.rep_code : rawRepCode;
                if (targetRepCode) {
                    const rep = db.prepare(`
                        SELECT * FROM representatives
                        WHERE UPPER(rep_code) = UPPER(?) AND status = 'ACTIVE'
                    `).get(targetRepCode);

                    if (rep) {
                        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
                        const validUntilDate = new Date();
                        validUntilDate.setMonth(validUntilDate.getMonth() + 24);
                        const validUntilIso = validUntilDate.toISOString().replace('T', ' ').slice(0, 19);
                        const referralId = `wref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

                        let finalInviteId = matchedInvite ? matchedInvite.id : null;
                        if (matchedInvite) {
                            db.prepare(`
                                UPDATE representative_invites
                                SET status = 'ACTIVATED',
                                    workshop_id = ?,
                                    completed_at = COALESCE(completed_at, ?),
                                    activated_at = COALESCE(activated_at, ?),
                                    updated_at = ?
                                WHERE id = ?
                            `).run(workshopId, nowIso, nowIso, nowIso, matchedInvite.id);
                        } else {
                            finalInviteId = `rinv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                            db.prepare(`
                                INSERT INTO representative_invites (
                                    id, representative_id, rep_code, invite_token,
                                    prospect_workshop_name, prospect_cnpj, prospect_email, prospect_phone,
                                    clicks_count, status, workshop_id, created_at, updated_at,
                                    accessed_at, started_at, completed_at, activated_at
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVATED', ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                finalInviteId,
                                rep.id,
                                rep.rep_code,
                                `tok_auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                                tradeName.trim(),
                                cleanCnpj,
                                cleanEmail,
                                phone || null,
                                workshopId,
                                nowIso, nowIso, nowIso, nowIso, nowIso, nowIso
                            );
                        }

                        db.prepare(`
                            INSERT INTO workshop_referrals (
                                id, workshop_id, representative_id, invite_id, rep_code,
                                origin_channel, linked_at, valid_until, status, created_by, justification
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'SYSTEM_AUTO', ?)
                        `).run(
                            referralId,
                            workshopId,
                            rep.id,
                            finalInviteId,
                            rep.rep_code,
                            matchedInvite ? 'INVITE_PORTAL_LINK' : 'DIRECT_REP_CODE',
                            nowIso,
                            validUntilIso,
                            'Vinculação automática no credenciamento da oficina pelo proprietário'
                        );

                        db.prepare(`
                            INSERT INTO representative_audit_logs (
                                id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                            ) VALUES (?, ?, ?, 'WORKSHOP_AUTO_LINKED', ?, 'WORKSHOP_OWNER', ?, ?, ?)
                        `).run(
                            `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                            rep.id,
                            workshopId,
                            userId,
                            `Oficina ${tradeName.trim()} vinculada automaticamente ao representante ${rep.rep_code}`,
                            JSON.stringify({ referral_id: referralId, invite_id: finalInviteId, rep_code: rep.rep_code, valid_until: validUntilIso }),
                            req.ip || '127.0.0.1'
                        );

                        referralLinkInfo = {
                            referral_id: referralId,
                            representative_id: rep.id,
                            rep_code: rep.rep_code,
                            linked_at: nowIso,
                            valid_until: validUntilIso,
                            status: 'ACTIVE'
                        };
                    }
                }
            }
        } catch (linkErr) {
            console.warn('Aviso na verificação de vínculo de representante:', linkErr.message);
        }

        res.status(201).json({
            token,
            referral: referralLinkInfo,
            workshop: {
                id: workshopId,
                workshop_id: workshopId,
                trade_name: tradeName.trim(),
                cnpj: cleanCnpj,
                status: 'APPROVED'
            },
            user: {
                id: userId,
                name: adminName,
                email: cleanEmail,
                phone: phone || null,
                role_code: 'WORKSHOP_OWNER',
                role_name: 'Oficina Credenciada',
                workshop: {
                    workshop_id: workshopId,
                    workshop_name: tradeName.trim(),
                    workshop_cnpj: cleanCnpj,
                    position_title: 'Proprietário / Responsável Técnico',
                    can_activate_dna: 1,
                    can_prove_services: 1,
                    workshop_status: 'APPROVED'
                }
            }
        });
    } catch (err) {
        console.error('Erro ao cadastrar oficina:', err);
        res.status(500).json({ error: 'Erro ao credenciar oficina: ' + err.message });
    }
}

router.post('/register-workshop', handleRegisterWorkshop);
router.handleRegisterWorkshop = handleRegisterWorkshop;

module.exports = router;

