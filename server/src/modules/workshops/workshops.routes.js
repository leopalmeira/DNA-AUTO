const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// Listagem de oficinas com métricas consolidadas
router.get('/', (req, res) => {
    try {
        const workshops = db.prepare(`
            SELECT w.*,
                   COUNT(DISTINCT sr.id) as total_services,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                   COUNT(DISTINCT vd.id) as dna_activations_count,
                   COUNT(DISTINCT wu.id) as staff_count
            FROM workshops w
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            LEFT JOIN workshop_users wu ON wu.workshop_id = w.id
            GROUP BY w.id
            ORDER BY proven_services DESC, total_services DESC
        `).all();

        res.json({ workshops });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar oficinas.' });
    }
});

// Ranking de Oficinas Mais Ativas (Para o Dashboard Administrativo)
router.get('/ranking/most-active', (req, res) => {
    try {
        const ranking = db.prepare(`
            SELECT w.id, w.trade_name, w.cnpj, w.city, w.state, w.status, w.verified_badge,
                   COUNT(DISTINCT sr.id) as total_services,
                   SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                   COUNT(DISTINCT vd.id) as dnas_activated,
                   COUNT(DISTINCT sr.vehicle_id) as vehicles_served,
                   ROUND(
                       (CAST(SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) AS FLOAT) / 
                       MAX(1, COUNT(DISTINCT sr.id))) * 100, 1
                   ) as proof_rate_percentage
            FROM workshops w
            LEFT JOIN service_records sr ON sr.workshop_id = w.id
            LEFT JOIN vehicle_dna vd ON vd.activated_by_workshop_id = w.id
            GROUP BY w.id
            ORDER BY dnas_activated DESC, proven_services DESC
        `).all();

        res.json({ ranking });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar ranking de oficinas.' });
    }
});

// Dashboard Exclusivo da Oficina (Métricas da Oficina Logada ou Especificada)
router.get('/:id/dashboard', (req, res) => {
    try {
        const workshopId = req.params.id;
        const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);

        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // Estatísticas da oficina
        const stats = db.prepare(`
            SELECT
                COUNT(DISTINCT sr.vehicle_id) as attended_vehicles,
                COUNT(DISTINCT CASE WHEN vd.id IS NOT NULL THEN sr.vehicle_id END) as vehicles_with_dna,
                COUNT(DISTINCT CASE WHEN vd.id IS NULL THEN sr.vehicle_id END) as vehicles_without_dna,
                COUNT(sr.id) as total_services,
                SUM(CASE WHEN sr.proof_level = 4 THEN 1 ELSE 0 END) as proven_services,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'PENDING' THEN 1 ELSE 0 END) as pending_confirmations,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_services,
                SUM(CASE WHEN sr.workshop_confirmation_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_services,
                (SELECT COUNT(*) FROM vehicle_dna WHERE activated_by_workshop_id = ?) as dnas_activated,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM commissions WHERE workshop_id = ?) as commissions_cents
            FROM service_records sr
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = sr.vehicle_id
            WHERE sr.workshop_id = ?
        `).get(workshopId, workshopId, workshopId);

        // Lista de serviços aguardando confirmação da oficina
        const pendingConfirmations = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, v.manufacture_year,
                   vd.dna_code, o.name as declared_by_owner_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN owners o ON sr.declared_by_owner_id = o.id
            WHERE sr.workshop_id = ? AND sr.workshop_confirmation_status = 'PENDING'
            ORDER BY sr.service_date DESC
        `).all(workshopId);

        // Equipe da oficina
        const staff = db.prepare(`
            SELECT wu.*, u.name, u.email, u.phone, r.code as role_code, r.name as role_name
            FROM workshop_users wu
            JOIN users u ON wu.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE wu.workshop_id = ?
        `).all(workshopId);

        res.json({
            workshop,
            stats,
            pendingConfirmations,
            staff
        });
    } catch (err) {
        console.error('Erro no dashboard da oficina:', err);
        res.status(500).json({ error: 'Erro ao obter dados do painel da oficina.' });
    }
});

// Aprovar / Bloquear / Homologar Oficina (Administrador)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const { status } = req.body;
        if (!['APPROVED', 'BLOCKED', 'PENDING'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        const workshopId = req.params.id;
        const currentWorkshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
        if (!currentWorkshop) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        db.prepare(`UPDATE workshops SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, workshopId);

        logAudit({
            user: req.user,
            action: 'UPDATE_WORKSHOP_STATUS',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            ipAddress: req.ip,
            dataBefore: { status: currentWorkshop.status },
            dataAfter: { status }
        });

        res.json({ success: true, message: `Oficina atualizada para o status: ${status}.` });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status da oficina.' });
    }
});

module.exports = router;
