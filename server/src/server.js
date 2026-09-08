const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicialização do Banco
require('./database/db');

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

// Fallback para SPA no Frontend
app.use((req, res) => {
    // Se a requisição não for de API, entrega o index.html
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint da API não encontrado.' });
    }
});

// Iniciar Servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 DNA AUTO Server rodando em http://localhost:${PORT}`);
        console.log(`🌐 Frontend disponível em http://localhost:${PORT}`);
    });
}

module.exports = app;
