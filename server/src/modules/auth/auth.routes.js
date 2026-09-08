const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { JWT_SECRET, authenticateToken } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// Login de Usuários
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        let user = db.prepare(`
            SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role_id, u.status,
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

        const passwordMatch = bcrypt.compareSync(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
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

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_code: user.role_code,
                role_name: user.role_name,
                workshop: workshopUser || null
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


// Cadastro de Novo Cliente (Proprietário)
router.post('/register-client', (req, res) => {
    try {
        const { name, email, password, phone, cpf } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
        if (existing) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado no DNA AUTO.' });
        }

        const userId = `usr_${Date.now()}`;
        const passwordHash = bcrypt.hashSync(password, 10);

        db.transaction(() => {
            db.prepare(`
                INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
                VALUES (?, ?, ?, ?, ?, 'role_owner', 'ACTIVE', 0)
            `).run(userId, name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null);

            db.prepare(`
                INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).run(`own_${Date.now()}`, userId, name.trim(), cpf ? cpf.trim() : '000.000.000-00', cleanEmail, phone ? phone.trim() : null);
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

        res.status(201).json({
            token,
            user: {
                id: userId,
                name: name.trim(),
                email: cleanEmail,
                phone: phone || null,
                role_code: 'OWNER',
                role_name: 'Proprietário de Veículo',
                workshop: null
            }
        });
    } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        res.status(500).json({ error: 'Erro interno ao cadastrar cliente.' });
    }
});

// Cadastro de Nova Oficina Parceira / Empresa Credenciada
router.post('/register-workshop', (req, res) => {
    try {
        const {
            tradeName, companyName, cnpj, technicianName,
            phone, email, password, addressStreet, addressNumber,
            addressNeighborhood, city, state, zipCode
        } = req.body;

        if (!tradeName || !cnpj || !email || !password) {
            return res.status(400).json({ error: 'Nome da oficina, CNPJ, e-mail e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanCnpj = cnpj.trim().replace(/\D/g, '');

        const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado como usuário.' });
        }

        const existingWorkshop = db.prepare('SELECT id FROM workshops WHERE cnpj = ? OR cnpj = ?').get(cnpj.trim(), cleanCnpj);
        if (existingWorkshop) {
            return res.status(400).json({ error: 'Já existe uma oficina cadastrada com este CNPJ.' });
        }

        const workshopId = `ws_${Date.now()}`;
        const userId = `usr_ws_${Date.now()}`;
        const passwordHash = bcrypt.hashSync(password, 10);
        const adminName = technicianName ? technicianName.trim() : tradeName.trim();

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
                cnpj.trim(),
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

        res.status(201).json({
            token,
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
                    workshop_cnpj: cnpj.trim(),
                    position_title: 'Proprietário / Responsável Técnico',
                    can_activate_dna: 1,
                    can_prove_services: 1,
                    workshop_status: 'APPROVED'
                }
            }
        });
    } catch (err) {
        console.error('Erro ao cadastrar oficina:', err);
        res.status(500).json({ error: 'Erro interno ao credenciar oficina.' });
    }
});

module.exports = router;
