const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');

// Listar Planos e Preços Ativos
router.get('/plans', (req, res) => {
    try {
        const plans = db.prepare(`SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY price_cents DESC`).all();
        res.json({ plans });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar planos de preços.' });
    }
});

// Atualizar ou Criar Plano de Preço (Administrador - Item 17)
router.post('/plans', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    try {
        const {
            id, code, title, description, price_cents,
            workshop_price_cents, discount_percentage,
            is_courtesy, commission_percentage
        } = req.body;

        if (!title || price_cents === undefined) {
            return res.status(400).json({ error: 'Título e preço são obrigatórios.' });
        }

        const planId = id || ('plan_' + Date.now());
        const planCode = code || ('PLAN_' + Date.now());

        const existing = db.prepare(`SELECT * FROM pricing_plans WHERE id = ?`).get(planId);

        if (existing) {
            db.prepare(`
                UPDATE pricing_plans
                SET title = ?, description = ?, price_cents = ?, workshop_price_cents = ?,
                    discount_percentage = ?, is_courtesy = ?, commission_percentage = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                title, description || '', Number(price_cents), Number(workshop_price_cents) || 0,
                Number(discount_percentage) || 0, is_courtesy ? 1 : 0, Number(commission_percentage) || 15,
                planId
            );

            logAudit({
                user: req.user,
                action: 'UPDATE_PRICING_PLAN',
                entityType: 'PRICE',
                entityId: planId,
                ipAddress: req.ip,
                dataBefore: existing,
                dataAfter: req.body
            });
        } else {
            db.prepare(`
                INSERT INTO pricing_plans (
                    id, code, title, description, price_cents, workshop_price_cents,
                    discount_percentage, is_courtesy, commission_percentage, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `).run(
                planId, planCode, title, description || '', Number(price_cents),
                Number(workshop_price_cents) || 0, Number(discount_percentage) || 0,
                is_courtesy ? 1 : 0, Number(commission_percentage) || 15
            );

            logAudit({
                user: req.user,
                action: 'CREATE_PRICING_PLAN',
                entityType: 'PRICE',
                entityId: planId,
                ipAddress: req.ip,
                dataAfter: req.body
            });
        }

        res.json({ success: true, message: 'Plano de preços salvo com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar plano:', err);
        res.status(500).json({ error: 'Erro ao salvar plano de preços.' });
    }
});

module.exports = router;
