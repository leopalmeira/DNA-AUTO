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

// Servir Uploads e Frontend Estático (sem cache para refletir modificações instantaneamente)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', '..', 'public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

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
app.post('/api/v1/clients/activate', (req, res) => {
    try {
        const db = require('./database/db');
        const code = (req.body.activation_code || req.body.code || '').trim().toUpperCase();

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

        // Se ainda estava pendente, marca como ativado
        if (activation.status === 'PENDING') {
            db.prepare(`
                UPDATE client_activations
                SET status = 'ACTIVATED',
                    activated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(activation.id);
        }

        // Busca dados do veículo
        const vehicle = db.prepare(`
            SELECT v.*, d.dna_code, d.status as dna_status
            FROM vehicles v
            LEFT JOIN vehicle_dna d ON v.id = d.vehicle_id
            WHERE v.id = ? OR v.license_plate = ?
        `).get(activation.vehicle_id, activation.license_plate);

        res.json({
            success: true,
            message: '🎉 Veículo ativado com sucesso!',
            activation_code: activation.activation_code,
            status: 'ACTIVATED',
            client: {
                name: activation.client_name,
                whatsapp: activation.whatsapp
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

