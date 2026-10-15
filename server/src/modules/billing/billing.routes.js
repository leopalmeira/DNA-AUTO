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

// ── COBRANÇA DA OFICINA & PIX VIA ABACATEPAY (CICLO 22) ──
const AbacatePayService = require('../../services/abacatePay.service');

// 1. Status Financeiro & Créditos da Oficina
router.get('/workshop/:workshopId/status', (req, res) => {
    try {
        const status = AbacatePayService.getWorkshopStatus(db, req.params.workshopId);
        res.json({ success: true, ...status });
    } catch (err) {
        console.error('Erro ao consultar status financeiro da oficina:', err);
        res.status(500).json({ error: 'Erro ao consultar balanço da oficina.' });
    }
});

// 2. Criar Cobrança PIX (Avulso, Pós-pago 10 ou Pacote Pré-pago)
router.post('/workshop/:workshopId/pix-charge', async (req, res) => {
    try {
        const { charge_type, credits_quantity, vehicle_id, activation_code, client_name, client_phone } = req.body;
        const charge = await AbacatePayService.createPixCharge(db, {
            workshopId: req.params.workshopId,
            chargeType: charge_type || 'SINGLE',
            creditsQuantity: credits_quantity || 1,
            vehicleId: vehicle_id || null,
            activationCode: activation_code || null,
            clientName: client_name || 'Oficina DNA AUTO',
            clientPhone: client_phone || null
        });

        res.status(201).json({
            success: true,
            message: 'Cobrança PIX gerada via AbacatePay!',
            charge
        });
    } catch (err) {
        console.error('Erro ao gerar PIX AbacatePay:', err);
        res.status(500).json({ error: 'Erro ao gerar cobrança PIX.' });
    }
});

// 3. Comprar Pacote de Créditos Pré-Pagos (R$ 29 para 10+, R$ 28 para 30+)
router.post('/workshop/:workshopId/buy-credits', async (req, res) => {
    try {
        const quantity = parseInt(req.body.quantity, 10) || 10;
        const charge = await AbacatePayService.createPixCharge(db, {
            workshopId: req.params.workshopId,
            chargeType: 'PREPAID_PACKAGE',
            creditsQuantity: quantity,
            clientName: req.body.client_name || 'Oficina Credenciada DNA AUTO',
            clientPhone: req.body.client_phone || null
        });

        res.status(201).json({
            success: true,
            message: `PIX para compra de ${quantity} créditos pré-pagos gerado com sucesso!`,
            package: AbacatePayService.calculatePrepaidPackage(quantity),
            charge
        });
    } catch (err) {
        console.error('Erro ao gerar PIX para créditos pré-pagos:', err);
        res.status(500).json({ error: 'Erro ao gerar pacote de créditos pré-pagos.' });
    }
});

// 4. Quitar Lote Consolidado de 10 Carros Pós-Pagos (R$ 300,00)
router.post('/workshop/:workshopId/pay-postpaid-10', async (req, res) => {
    try {
        const charge = await AbacatePayService.createPixCharge(db, {
            workshopId: req.params.workshopId,
            chargeType: 'POSTPAID_10',
            clientName: req.body.client_name || 'Oficina Credenciada DNA AUTO',
            clientPhone: req.body.client_phone || null
        });

        res.status(201).json({
            success: true,
            message: 'PIX de R$ 300,00 gerado para quitação do lote de 10 carros pós-pagos.',
            charge
        });
    } catch (err) {
        console.error('Erro ao gerar PIX de quitação pós-pago:', err);
        res.status(500).json({ error: 'Erro ao gerar quitação de lote pós-pago.' });
    }
});

// 5. Confirmar Pagamento do PIX (Manual ou Teste)
router.post('/pix/:chargeId/confirm', (req, res) => {
    try {
        const result = AbacatePayService.confirmPixCharge(db, req.params.chargeId);
        res.json(result);
    } catch (err) {
        console.error('Erro ao confirmar PIX:', err);
        res.status(400).json({ error: err.message || 'Erro ao confirmar pagamento PIX.' });
    }
});

// 6. Webhook Oficial da AbacatePay (Notificação em Tempo Real)
router.post('/webhook/abacatepay', (req, res) => {
    try {
        const result = AbacatePayService.processWebhook(db, req.body, req.headers);
        res.json({ received: true, ...result });
    } catch (err) {
        console.error('Erro ao processar Webhook AbacatePay:', err);
        res.status(500).json({ error: 'Erro ao processar webhook.' });
    }
});

module.exports = router;

