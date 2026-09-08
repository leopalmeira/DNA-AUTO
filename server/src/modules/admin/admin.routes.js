const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Estatísticas Globais da Rede DNA AUTO (Item 41 e 42)
router.get('/network-stats', (req, res) => {
    try {
        const totalVehicles = db.prepare(`SELECT COUNT(*) as count FROM vehicles`).get().count;
        const vehiclesWithDna = db.prepare(`SELECT COUNT(*) as count FROM vehicle_dna WHERE status = 'ACTIVE'`).get().count;
        const totalWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops`).get().count;
        const activeWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE status = 'APPROVED'`).get().count;
        const pendingWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE status = 'PENDING'`).get().count;

        const totalServices = db.prepare(`SELECT COUNT(*) as count FROM service_records`).get().count;
        const provenServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 4`).get().count;
        const confirmedServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 3`).get().count;
        const declaredServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE proof_level = 1`).get().count;
        const pendingServices = db.prepare(`SELECT COUNT(*) as count FROM service_records WHERE workshop_confirmation_status = 'PENDING'`).get().count;

        const totalOwners = db.prepare(`SELECT COUNT(*) as count FROM owners`).get().count;
        const totalTransfers = db.prepare(`SELECT COUNT(*) as count FROM ownership_transfers WHERE status = 'COMPLETED'`).get().count;
        const totalInvoices = db.prepare(`SELECT COUNT(*) as count FROM invoices`).get().count;
        const totalPhotos = db.prepare(`SELECT COUNT(*) as count FROM vehicle_photos`).get().count;

        const totalRevenueCents = db.prepare(`SELECT COALESCE(SUM(amount_paid_cents), 0) as total FROM dna_activations`).get().total;
        const totalCommissionsCents = db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) as total FROM commissions`).get().total;

        // Cidades atendidas
        const citiesCount = db.prepare(`SELECT COUNT(DISTINCT city) as count FROM workshops WHERE status = 'APPROVED'`).get().count;

        // Crescimento recente (serviços e DNAs por categoria)
        const recentServices = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, vd.dna_code, w.trade_name as workshop_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            ORDER BY sr.service_date DESC, sr.created_at DESC
            LIMIT 10
        `).all();

        // DNA Ativados por oficina (Crescimento por Oficinas - Item 42)
        const growthByWorkshops = db.prepare(`
            SELECT w.id, w.trade_name, w.city, w.state,
                   COUNT(DISTINCT vd.id) as dnas_activated,
                   COUNT(DISTINCT sr.id) as services_recorded,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services
            FROM workshops w
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            GROUP BY w.id
            ORDER BY dnas_activated DESC, proven_services DESC
        `).all();

        res.json({
            network: {
                totalVehicles,
                vehiclesWithDna,
                vehiclesWithoutDna: totalVehicles - vehiclesWithDna,
                totalWorkshops,
                activeWorkshops,
                pendingWorkshops,
                totalServices,
                provenServices,
                confirmedServices,
                declaredServices,
                pendingServices,
                totalOwners,
                totalTransfers,
                totalInvoices,
                totalPhotos,
                citiesCount,
                totalRevenueCents,
                totalCommissionsCents
            },
            recentServices,
            growthByWorkshops
        });
    } catch (err) {
        console.error('Erro ao obter estatísticas da rede:', err);
        res.status(500).json({ error: 'Erro ao gerar métricas da rede DNA AUTO.' });
    }
});

// Logs de Auditoria Globais com Filtros
router.get('/audit-logs', (req, res) => {
    try {
        const { action, dna_code, entity_type, limit } = req.query;
        let query = `SELECT * FROM audit_logs WHERE 1=1`;
        const params = [];

        if (action) {
            query += ` AND action = ?`;
            params.push(action);
        }
        if (dna_code) {
            query += ` AND UPPER(vehicle_dna_code) LIKE ?`;
            params.push(`%${dna_code.toUpperCase()}%`);
        }
        if (entity_type) {
            query += ` AND entity_type = ?`;
            params.push(entity_type);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(Number(limit) || 50);

        const logs = db.prepare(query).all(...params);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar auditoria.' });
    }
});

module.exports = router;
