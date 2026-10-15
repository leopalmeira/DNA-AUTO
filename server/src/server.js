const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicialização do Banco
require('./database/db');

// Serviço Anti-Sleep / Keep-Alive (Render Free Tier)
const { startKeepAlive } = require('./services/keepAlive.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Configuração padrão de cache para frontend estático
const staticHeaders = {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
};

// Servir Uploads e Frontend Estático
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', '..', 'public'), staticHeaders));
app.use('/cliente.app', express.static(path.join(__dirname, '..', '..', 'cliente.app'), staticHeaders));
app.use('/oficina.app', express.static(path.join(__dirname, '..', '..', 'oficina.app'), staticHeaders));
app.use('/cliente', express.static(path.join(__dirname, '..', '..', 'cliente.app'), staticHeaders));
app.use('/oficina', express.static(path.join(__dirname, '..', '..', 'oficina.app'), staticHeaders));

// Registro dos Módulos da API REST
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const vehiclesRoutes = require('./modules/vehicles/vehicles.routes');
const dossierRoutes = require('./modules/dossier/dossier.routes');
const workshopsRoutes = require('./modules/workshops/workshops.routes');
const servicesRoutes = require('./modules/services/services.routes');
const transfersRoutes = require('./modules/transfers/transfers.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const integrationsRoutes = require('./modules/integrations/integrations.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/dossier', dossierRoutes);
app.use('/api/v1/workshops', workshopsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/transfers', transfersRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/reports', reportsRoutes);

// Healthcheck
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'DNA AUTO Platform',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de Ativação do Cliente via Código da Oficina
// Endpoint de Consulta do Código da Oficina (Verifica código e identifica dados faltantes)
app.get('/api/v1/clients/activation-code/:code', (req, res) => {
    try {
        const db = require('./database/db');
        const code = (req.params.code || '').trim().toUpperCase();

        if (!code) {
            return res.status(400).json({ error: 'Código de ativação é obrigatório.' });
        }

        const activation = db.prepare(`
            SELECT a.*, w.trade_name as workshop_name, w.phone as workshop_phone
            FROM client_activations a
            LEFT JOIN workshops w ON a.workshop_id = w.id
            WHERE UPPER(a.activation_code) = ?
        `).get(code);

        if (!activation) {
            return res.status(404).json({ error: 'Código de ativação não encontrado. Verifique com a sua oficina.' });
        }

        const vehicle = db.prepare(`
            SELECT v.*, d.dna_code, d.status as dna_status
            FROM vehicles v
            LEFT JOIN vehicle_dna d ON v.id = d.vehicle_id
            WHERE v.id = ? OR v.license_plate = ?
        `).get(activation.vehicle_id, activation.license_plate);

        const clientName = (activation.client_name || '').trim();
        const clientEmail = (activation.email || '').trim();
        const clientWhatsapp = (activation.whatsapp || '').trim();

        const missingFields = [];
        if (!clientName) missingFields.push('name');
        if (!clientEmail) missingFields.push('email');
        if (!clientWhatsapp) missingFields.push('whatsapp');

        res.json({
            success: true,
            valid: true,
            activation_code: activation.activation_code,
            status: activation.status,
            workshop_name: activation.workshop_name || 'Oficina Credenciada DNA AUTO',
            vehicle: vehicle || {
                license_plate: activation.license_plate,
                brand: 'Veículo',
                model: 'Cadastrado'
            },
            client: {
                name: clientName,
                email: clientEmail,
                whatsapp: clientWhatsapp
            },
            missing_fields: missingFields,
            needs_completion: missingFields.length > 0
        });
    } catch (err) {
        console.error('Erro ao consultar código de ativação:', err);
        res.status(500).json({ error: 'Erro ao verificar código com o servidor.' });
    }
});

// Endpoint de Ativação do Cliente via Código da Oficina (com suporte a completar dados e login automático)
app.post('/api/v1/clients/activate', (req, res) => {
    try {
        const db = require('./database/db');
        const jwt = require('jsonwebtoken');
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');
        const JWT_SECRET = process.env.JWT_SECRET || 'dna_auto_secret_jwt_key_2026_super_secure';

        const code = (req.body.activation_code || req.body.code || '').trim().toUpperCase();
        const newName = (req.body.name || req.body.client_name || '').trim();
        const newEmail = (req.body.email || '').trim().toLowerCase();
        const newWhatsapp = (req.body.whatsapp || req.body.phone || '').trim();
        const newPassword = (req.body.password || req.body.client_password || '').trim();

        if (!code) {
            return res.status(400).json({ error: 'Código de ativação é obrigatório.' });
        }

        const activation = db.prepare(`
            SELECT a.*, w.trade_name as workshop_name, w.phone as workshop_phone
            FROM client_activations a
            LEFT JOIN workshops w ON a.workshop_id = w.id
            WHERE UPPER(a.activation_code) = ?
        `).get(code);

        if (!activation) {
            return res.status(404).json({ error: 'Código de ativação não encontrado. Verifique o código com a sua oficina.' });
        }

        const finalName = newName || activation.client_name || 'Cliente DNA AUTO';
        const finalEmail = newEmail || activation.email || '';
        const finalWhatsapp = newWhatsapp || activation.whatsapp || '';

        // Atualiza campos e marca como ativado
        db.prepare(`
            UPDATE client_activations
            SET status = 'ACTIVATED',
                activated_at = CURRENT_TIMESTAMP,
                client_name = ?,
                email = ?,
                whatsapp = ?
            WHERE id = ?
        `).run(finalName, finalEmail, finalWhatsapp, activation.id);

        // Busca dados do veículo
        let vehicle = db.prepare(`
            SELECT v.*, d.dna_code, d.status as dna_status
            FROM vehicles v
            LEFT JOIN vehicle_dna d ON v.id = d.vehicle_id
            WHERE v.id = ? OR v.license_plate = ?
        `).get(activation.vehicle_id, activation.license_plate);

        // Se o veículo não tiver DNA, gera o DNA ativo oficial zerado
        if (vehicle && !vehicle.dna_code) {
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            const randomBlock = (len) => {
                let str = '';
                const bytes = crypto.randomBytes(len);
                for (let i = 0; i < len; i++) {
                    str += chars[bytes[i] % chars.length];
                }
                return str;
            };
            const generatedDna = `DNA-BR-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(3)}`;
            const dnaId = `dna_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const certHash = crypto.createHash('sha256').update(generatedDna + (vehicle.chassis_vin || vehicle.license_plate)).digest('hex');
            
            db.prepare(`
                INSERT INTO vehicle_dna (id, vehicle_id, dna_code, status, activated_at, activated_by_workshop_id, activation_modality, activation_fee_cents, certificate_hash)
                VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, ?, 'NORMAL', 5990, ?)
            `).run(dnaId, vehicle.id, generatedDna, activation.workshop_id, certHash);

            const existsScore = db.prepare('SELECT id FROM health_scores WHERE vehicle_id = ?').get(vehicle.id);
            if (!existsScore) {
                db.prepare(`
                    INSERT INTO health_scores (id, vehicle_id, overall_score, documented_percentage, score_rationale)
                    VALUES (?, ?, 100, 100, 'Passaporte DNA AUTO ativado na oficina.')
                `).run(`hs_${Date.now()}`, vehicle.id);
            }
            vehicle.dna_code = generatedDna;
            vehicle.dna_status = 'ACTIVE';
        }

        // Criar ou atualizar usuário
        let user = null;
        let userId = null;

        if (finalEmail && finalEmail.includes('@')) {
            const existingUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(finalEmail);
            if (existingUser) {
                userId = existingUser.id;
                user = existingUser;
                if (newPassword && newPassword.length >= 6) {
                    const passHash = bcrypt.hashSync(newPassword, 10);
                    db.prepare('UPDATE users SET password_hash = ?, name = COALESCE(NULLIF(?, ""), name), phone = COALESCE(NULLIF(?, ""), phone), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passHash, finalName, finalWhatsapp, userId);
                } else {
                    db.prepare('UPDATE users SET name = COALESCE(NULLIF(?, ""), name), phone = COALESCE(NULLIF(?, ""), phone), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(finalName, finalWhatsapp, userId);
                }
            } else {
                userId = 'usr_' + Date.now();
                const phoneDigits = finalWhatsapp.replace(/\D/g, '');
                const effectivePass = (newPassword && newPassword.length >= 6) ? newPassword : (phoneDigits.length >= 6 ? phoneDigits.slice(-6) : '123456');
                const passHash = bcrypt.hashSync(effectivePass, 10);
                db.prepare(`
                    INSERT INTO users (id, name, email, password_hash, phone, role_id, status, is_demo)
                    VALUES (?, ?, ?, ?, ?, 'role_owner', 'ACTIVE', 0)
                `).run(userId, finalName, finalEmail, passHash, finalWhatsapp || null);
            }
            user = db.prepare('SELECT id, name, email, phone, role_id, status FROM users WHERE id = ?').get(userId);
        }

        // Vincular ou atualizar Proprietário
        let owner = null;
        if (userId) {
            owner = db.prepare('SELECT * FROM owners WHERE user_id = ? OR (email IS NOT NULL AND LOWER(email) = ?)').get(userId, finalEmail);
        }
        if (!owner && finalWhatsapp) {
            owner = db.prepare('SELECT * FROM owners WHERE phone = ?').get(finalWhatsapp);
        }

        if (owner) {
            db.prepare(`
                UPDATE owners
                SET user_id = COALESCE(user_id, ?),
                    name = COALESCE(NULLIF(?, ''), name),
                    phone = COALESCE(NULLIF(?, ''), phone),
                    email = COALESCE(NULLIF(?, ''), email)
                WHERE id = ?
            `).run(userId, finalName, finalWhatsapp, finalEmail, owner.id);
        } else {
            const ownerId = 'own_' + Date.now();
            db.prepare(`
                INSERT INTO owners (id, user_id, name, document_cpf, email, phone, created_at)
                VALUES (?, ?, ?, '000.000.000-00', ?, ?, CURRENT_TIMESTAMP)
            `).run(ownerId, userId, finalName, finalEmail || null, finalWhatsapp);
            owner = { id: ownerId };
        }

        if (owner && vehicle) {
            db.prepare('UPDATE vehicles SET current_owner_id = ? WHERE id = ?').run(owner.id, vehicle.id);
            const existsTrf = db.prepare('SELECT id FROM ownership_transfers WHERE vehicle_id = ? AND new_owner_id = ?').get(vehicle.id, owner.id);
            if (!existsTrf) {
                db.prepare(`
                    INSERT INTO ownership_transfers (id, vehicle_id, new_owner_id, status, requested_at, completed_at, transfer_mileage, notes)
                    VALUES (?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Ativação via código da oficina')
                `).run(`trf_${Date.now()}`, vehicle.id, owner.id);
            }
        }

        // Gerar token JWT se tivermos usuário
        let token = null;
        if (user) {
            token = jwt.sign(
                { id: user.id, email: user.email, name: user.name, role: 'OWNER' },
                JWT_SECRET,
                { expiresIn: '30d' }
            );
        }

        res.json({
            success: true,
            message: '🎉 Veículo ativado com sucesso!',
            activation_code: activation.activation_code,
            status: 'ACTIVATED',
            token: token,
            user: user ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'OWNER',
                vehicle: vehicle
            } : null,
            client: {
                name: finalName,
                email: finalEmail,
                whatsapp: finalWhatsapp
            },
            vehicle: vehicle || {
                license_plate: activation.license_plate,
                brand: 'Veículo',
                model: 'Ativado'
            },
            workshop: {
                id: activation.workshop_id,
                trade_name: activation.workshop_name,
                phone: activation.workshop_phone
            }
        });
    } catch (err) {
        console.error('Erro ao ativar cliente via código:', err);
        res.status(500).json({ error: 'Erro ao processar ativação do veículo.' });
    }
});

// ── Rotas Dedicadas para Arquivos Separados (App do Cliente & Painel da Oficina) ──
app.get(['/dna-auto-login.html', '/dna-auto-login', '/login'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, '..', '..', 'cliente.app', 'dna-auto-login.html'));
});

app.get(['/cliente', '/cliente.html', '/app', '/meucarro', '/cliente.app'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, '..', '..', 'cliente.app', 'index.html'));
});

app.get(['/oficina', '/oficina.html', '/painel', '/workshop', '/erp', '/oficina.app', '/oficinal.app'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, '..', '..', 'oficina.app', 'index.html'));
});

// Rota Dedicada para a Landing de Oficinas Parceiras (/parceiro, /autocenter)
app.get(['/parceiro', '/parceiros', '/seja-parceiro', '/autocenter', '/autocente', '/oficinas', '/parceiro.html', '/autocenter.html'], (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'parceiro.html'));
});

// Fallback para SPA no Frontend
app.use((req, res) => {
    // Se a requisição não for de API, entrega o index.html com anti-cache
    if (!req.path.startsWith('/api/')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint da API não encontrado.' });
    }
});

// Função para iniciar o servidor
function startServer() {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 DNA AUTO Server rodando na porta ${PORT}`);
        console.log(`🌐 Frontend disponível em http://0.0.0.0:${PORT}`);
        startKeepAlive();
    });
    return server;
}

// Iniciar Servidor automaticamente se executado diretamente
if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.startServer = startServer;

