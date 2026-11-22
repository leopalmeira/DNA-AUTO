/**
 * DNA AUTO — Rotas da Central Administrativa Integrada V2
 *
 * Segurança: TODAS as rotas deste módulo exigem JWT válido + perfil ADMIN.
 * Compatibilidade: preserva 100% dos endpoints legados (com correção de agregações e proteção RBAC)
 * e adiciona os novos endpoints estruturados da Fase 8.
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth');
const { logAudit } = require('../../middlewares/audit');
const { createRateLimiter } = require('../../middlewares/rateLimit');
const AdminAnalytics = require('../../services/adminAnalytics.service');
const CommissionFinance = require('../../services/commissionFinance.service');
const SyncEvents = require('../../services/syncEvents.service');

// Blindagem obrigatória em TODAS as rotas administrativas (inclusive legadas)
router.use(authenticateToken, authorizeRoles('ADMIN'));

// Rate limiter dedicado para mutações financeiras e ações críticas
const criticalAdminLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    testMax: 5000,
    message: 'Limite de operações administrativas críticas atingido. Aguarde 1 minuto.'
});

// ==============================================================================
// 1. DASHBOARD EXECUTIVO & VISÃO GERAL (FASE 3 & FASE 8)
// ==============================================================================

router.get('/dashboard/overview', (req, res) => {
    try {
        const { period = 'current_month', month = null } = req.query;
        const overview = AdminAnalytics.getDashboardOverview(db, { period, month });
        res.json({ success: true, ...overview });
    } catch (err) {
        console.error('Erro em /admin/dashboard/overview:', err);
        res.status(500).json({ error: 'Erro ao calcular indicadores executivos.' });
    }
});

router.get('/dashboard/timeseries', (req, res) => {
    try {
        const months = req.query.months || 6;
        const series = AdminAnalytics.getDashboardTimeseries(db, { months });
        res.json({ success: true, ...series });
    } catch (err) {
        console.error('Erro em /admin/dashboard/timeseries:', err);
        res.status(500).json({ error: 'Erro ao calcular séries históricas do dashboard.' });
    }
});

router.get('/global-search', (req, res) => {
    try {
        const results = AdminAnalytics.globalAdminSearch(db, req.query.q);
        res.json({ success: true, ...results });
    } catch (err) {
        console.error('Erro em /admin/global-search:', err);
        res.status(500).json({ error: 'Erro ao executar busca global.' });
    }
});

router.get('/operations/overview', (req, res) => {
    try {
        const recentServices = db.prepare(`
            SELECT sr.id, sr.service_date, sr.service_title, sr.category, sr.mileage, sr.total_cost_cents,
                   sr.proof_level, sr.proof_status, sr.workshop_confirmation_status, sr.created_at,
                   v.license_plate, v.brand, v.model, vd.dna_code, w.trade_name as workshop_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            ORDER BY sr.created_at DESC
            LIMIT 25
        `).all();

        const recentAppointments = db.prepare(`
            SELECT wa.*, w.trade_name as workshop_name
            FROM workshop_appointments wa
            LEFT JOIN workshops w ON wa.workshop_id = w.id
            ORDER BY wa.appointment_date DESC, wa.appointment_time DESC
            LIMIT 25
        `).all();

        const recentActivations = db.prepare(`
            SELECT ca.*, w.trade_name as workshop_name
            FROM client_activations ca
            LEFT JOIN workshops w ON ca.workshop_id = w.id
            ORDER BY ca.created_at DESC
            LIMIT 25
        `).all();

        const pendingWorkshops = db.prepare(`
            SELECT id, trade_name, cnpj, city, state, phone, email, created_at
            FROM workshops WHERE status = 'PENDING'
            ORDER BY created_at DESC
        `).all();

        const pendingReps = db.prepare(`
            SELECT id, rep_code, name, email, phone, city, state, created_at
            FROM representatives WHERE status = 'PENDING_APPROVAL'
            ORDER BY created_at DESC
        `).all();

        const openTickets = db.prepare(`
            SELECT st.id, st.protocol, st.subject, st.priority, st.status, st.created_at, w.trade_name as workshop_name
            FROM support_tickets st
            LEFT JOIN workshops w ON st.workshop_id = w.id
            WHERE st.status IN ('OPEN', 'IN_PROGRESS')
            ORDER BY st.created_at DESC
            LIMIT 20
        `).all();

        res.json({
            success: true,
            recent_services: recentServices,
            recent_appointments: recentAppointments,
            recent_activations: recentActivations,
            pending_workshops: pendingWorkshops,
            pending_representatives: pendingReps,
            open_tickets: openTickets,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/operations/overview:', err);
        res.status(500).json({ error: 'Erro ao carregar operação da rede.' });
    }
});

router.get('/goals', (req, res) => {
    try {
        const month = CommissionFinance.isValidYM(req.query.month) ? req.query.month : CommissionFinance.getCurrentYM();
        const overview = AdminAnalytics.getDashboardOverview(db, { period: 'current_month', month });
        const newWsMonth = db.prepare(`SELECT COUNT(*) as cnt FROM workshops WHERE strftime('%Y-%m', created_at) = ?`).get(month).cnt;
        const repGoals = db.prepare(`
            SELECT
                r.id, r.rep_code, r.name, r.state, r.status,
                r.max_workshops_limit, r.monthly_goal_workshops, r.monthly_goal_activations,
                (SELECT COUNT(*) FROM workshop_referrals wr WHERE wr.representative_id = r.id AND strftime('%Y-%m', wr.linked_at) = ?) as month_workshops,
                (SELECT COUNT(*) FROM workshop_referrals wr WHERE wr.representative_id = r.id) as total_workshops,
                (SELECT COUNT(*) FROM representative_commissions rc
                 WHERE rc.representative_id = r.id AND rc.status IN ('CONFIRMED', 'PAID')
                   AND COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?) as month_paid_activations
            FROM representatives r
            WHERE r.status = 'ACTIVE'
            ORDER BY month_paid_activations DESC, month_workshops DESC
        `).all(month, month);

        res.json({
            success: true,
            month,
            global_goals: {
                workshops_target: overview.supplementary.goals.monthly_workshops_goal,
                workshops_actual: Number(newWsMonth || 0),
                activations_target: overview.supplementary.goals.monthly_activations_goal,
                activations_actual: overview.cards.monthly_paid_registrations,
                revenue_target_cents: overview.supplementary.goals.monthly_revenue_goal_cents,
                revenue_actual_cents: overview.cards.monthly_confirmed_revenue_cents
            },
            representatives_goals: repGoals,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/goals:', err);
        res.status(500).json({ error: 'Erro ao consultar indicadores e metas.' });
    }
});

// ==============================================================================
// 2. GESTÃO COMERCIAL & REPRESENTANTES (FASE 4 & FASE 8)
// ==============================================================================

router.get('/representatives/summary', (req, res) => {
    try {
        const result = AdminAnalytics.getRepresentativesSummary(db, req.query);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Erro em /admin/representatives/summary:', err);
        res.status(500).json({ error: 'Erro ao consultar resumo de representantes.' });
    }
});

router.get('/representatives/:id/overview', (req, res) => {
    try {
        const overview = AdminAnalytics.getRepresentativeOverview(db, req.params.id);
        if (!overview) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }
        res.json({ success: true, ...overview });
    } catch (err) {
        console.error('Erro em /admin/representatives/:id/overview:', err);
        res.status(500).json({ error: 'Erro ao consultar visão detalhada do representante.' });
    }
});

router.get('/representatives/:id/workshops', (req, res) => {
    try {
        const workshops = AdminAnalytics.getRepresentativeWorkshops(db, req.params.id);
        res.json({ success: true, count: workshops.length, workshops });
    } catch (err) {
        console.error('Erro em /admin/representatives/:id/workshops:', err);
        res.status(500).json({ error: 'Erro ao consultar carteira de oficinas do representante.' });
    }
});

router.get('/representatives/:id/clients', (req, res) => {
    try {
        const clients = AdminAnalytics.getRepresentativeClients(db, req.params.id);
        res.json({ success: true, ...clients });
    } catch (err) {
        console.error('Erro em /admin/representatives/:id/clients:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes captados pelo representante.' });
    }
});

router.get('/representatives/:id/commissions', (req, res) => {
    try {
        const comms = AdminAnalytics.getRepresentativeCommissions(db, req.params.id, {
            status: req.query.status,
            competenceMonth: req.query.competence_month || req.query.month,
            page: req.query.page,
            pageSize: req.query.page_size || req.query.limit
        });
        res.json({ success: true, ...comms });
    } catch (err) {
        console.error('Erro em /admin/representatives/:id/commissions:', err);
        res.status(500).json({ error: 'Erro ao consultar comissões do representante.' });
    }
});

router.get('/representatives/:id/payouts', (req, res) => {
    try {
        const payouts = AdminAnalytics.getRepresentativePayouts(db, req.params.id);
        res.json({ success: true, ...payouts });
    } catch (err) {
        console.error('Erro em /admin/representatives/:id/payouts:', err);
        res.status(500).json({ error: 'Erro ao consultar pagamentos do representante.' });
    }
});

function handleAdminRepStatusChange(req, res, targetStatus, actionName, defaultJustification) {
    try {
        const rep = db.prepare(`SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(req.params.id, req.params.id);
        if (!rep) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }
        const justification = String((req.body && req.body.justification) || defaultJustification).trim();
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

        db.transaction(() => {
            db.prepare(`UPDATE representatives SET status = ?, updated_at = ? WHERE id = ?`).run(targetStatus, nowIso, rep.id);
            if (rep.user_id) {
                const targetUserStatus = targetStatus === 'ACTIVE' ? 'ACTIVE' : (targetStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
                db.prepare(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`).run(targetUserStatus, nowIso, rep.user_id);
            }
            db.prepare(`
                INSERT INTO representative_audit_logs (
                    id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
            `).run(
                `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                rep.id,
                actionName,
                req.user.id,
                req.user.role_code,
                justification,
                JSON.stringify({ rep_code: rep.rep_code, previous_status: rep.status, new_status: targetStatus }),
                req.ip || '127.0.0.1'
            );
        })();

        logAudit({
            user: req.user,
            action: actionName,
            entityType: 'REPRESENTATIVE',
            entityId: rep.id,
            ipAddress: req.ip,
            dataBefore: { status: rep.status },
            dataAfter: { status: targetStatus, justification }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'REPRESENTATIVE_STATUS_CHANGED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'REPRESENTATIVE',
            entityId: rep.id,
            payload: { rep_code: rep.rep_code, previous_status: rep.status, new_status: targetStatus }
        });

        res.json({ success: true, id: rep.id, rep_code: rep.rep_code, status: targetStatus });
    } catch (err) {
        console.error(`Erro em ${actionName}:`, err);
        res.status(500).json({ error: 'Erro ao atualizar status do representante.' });
    }
}

router.post('/representatives/:id/approve', criticalAdminLimiter, (req, res) =>
    handleAdminRepStatusChange(req, res, 'ACTIVE', 'REPRESENTATIVE_APPROVED', 'Representante aprovado pela Central Administrativa')
);
router.post('/representatives/:id/reject', criticalAdminLimiter, (req, res) =>
    handleAdminRepStatusChange(req, res, 'REJECTED', 'REPRESENTATIVE_REJECTED', 'Cadastro de representante recusado pela Central Administrativa')
);
router.post('/representatives/:id/suspend', criticalAdminLimiter, (req, res) =>
    handleAdminRepStatusChange(req, res, 'SUSPENDED', 'REPRESENTATIVE_SUSPENDED', 'Representante suspenso pela Central Administrativa')
);
router.post('/representatives/:id/reactivate', criticalAdminLimiter, (req, res) =>
    handleAdminRepStatusChange(req, res, 'ACTIVE', 'REPRESENTATIVE_REACTIVATED', 'Representante reativado pela Central Administrativa')
);

router.patch('/representatives/:id/goals', criticalAdminLimiter, (req, res) => {
    try {
        const rep = db.prepare(`SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(req.params.id, req.params.id);
        if (!rep) return res.status(404).json({ error: 'Representante não encontrado.' });

        const maxWorkshops = req.body.max_workshops_limit !== undefined ? Math.max(1, parseInt(req.body.max_workshops_limit, 10)) : rep.max_workshops_limit;
        const goalWorkshops = req.body.monthly_goal_workshops !== undefined ? Math.max(1, parseInt(req.body.monthly_goal_workshops, 10)) : rep.monthly_goal_workshops;
        const goalActivations = req.body.monthly_goal_activations !== undefined ? Math.max(1, parseInt(req.body.monthly_goal_activations, 10)) : rep.monthly_goal_activations;

        db.prepare(`
            UPDATE representatives
            SET max_workshops_limit = ?, monthly_goal_workshops = ?, monthly_goal_activations = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(maxWorkshops, goalWorkshops, goalActivations, rep.id);

        logAudit({
            user: req.user,
            action: 'UPDATE_REPRESENTATIVE_GOALS',
            entityType: 'REPRESENTATIVE',
            entityId: rep.id,
            ipAddress: req.ip,
            dataBefore: { max_workshops_limit: rep.max_workshops_limit, monthly_goal_workshops: rep.monthly_goal_workshops, monthly_goal_activations: rep.monthly_goal_activations },
            dataAfter: { max_workshops_limit: maxWorkshops, monthly_goal_workshops: goalWorkshops, monthly_goal_activations: goalActivations }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'REPRESENTATIVE_GOALS_UPDATED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'REPRESENTATIVE',
            entityId: rep.id,
            payload: { max_workshops_limit: maxWorkshops, monthly_goal_workshops: goalWorkshops, monthly_goal_activations: goalActivations }
        });

        res.json({ success: true, id: rep.id, max_workshops_limit: maxWorkshops, monthly_goal_workshops: goalWorkshops, monthly_goal_activations: goalActivations });
    } catch (err) {
        console.error('Erro ao atualizar metas do representante:', err);
        res.status(500).json({ error: 'Erro ao atualizar metas do representante.' });
    }
});

router.get('/commercial/acquisition', (req, res) => {
    try {
        const period = String(req.query.period || 'all').toLowerCase();
        const pf = AdminAnalytics.buildPeriodClause('ca.created_at', period, req.query.month);

        const byWorkshop = db.prepare(`
            SELECT
                w.id as workshop_id, w.trade_name, w.city, w.state,
                wr.rep_code, r.name as representative_name,
                COUNT(ca.id) as activations_count,
                COUNT(DISTINCT COALESCE(ca.owner_id, LOWER(COALESCE(NULLIF(TRIM(ca.email), ''), NULLIF(TRIM(ca.whatsapp), ''), ca.client_name)))) as unique_clients,
                COUNT(CASE WHEN ca.billing_status = 'PAID' THEN 1 END) as paid_activations_count
            FROM workshops w
            LEFT JOIN workshop_referrals wr ON wr.workshop_id = w.id
            LEFT JOIN representatives r ON r.id = wr.representative_id
            LEFT JOIN client_activations ca ON ca.workshop_id = w.id AND ${pf.sql}
            GROUP BY w.id
            ORDER BY activations_count DESC, unique_clients DESC
            LIMIT 100
        `).all(...pf.params);

        const invitesFunnel = db.prepare(`
            SELECT
                COUNT(*) as total_invites,
                COALESCE(SUM(clicks_count), 0) as total_clicks,
                COUNT(CASE WHEN status IN ('ACCESSED', 'STARTED', 'COMPLETED', 'ACTIVATED') THEN 1 END) as accessed,
                COUNT(CASE WHEN status IN ('STARTED', 'COMPLETED', 'ACTIVATED') THEN 1 END) as started,
                COUNT(CASE WHEN status = 'ACTIVATED' THEN 1 END) as activated
            FROM representative_invites
        `).get();

        res.json({
            success: true,
            funnel: invitesFunnel,
            by_workshop: byWorkshop,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/commercial/acquisition:', err);
        res.status(500).json({ error: 'Erro ao carregar captação de clientes.' });
    }
});

router.get('/commercial/ranking', (req, res) => {
    try {
        const repSummary = AdminAnalytics.getRepresentativesSummary(db, {
            page: 1,
            page_size: 100,
            sort_by: 'paid_registrations_count',
            sort_dir: 'desc',
            month: req.query.month
        });
        const ranked = repSummary.items.map((r, idx) => ({
            rank: idx + 1,
            ...r
        }));
        res.json({ success: true, count: ranked.length, ranking: ranked, generated_at: new Date().toISOString() });
    } catch (err) {
        console.error('Erro em /admin/commercial/ranking:', err);
        res.status(500).json({ error: 'Erro ao carregar ranking de representantes.' });
    }
});

// ==============================================================================
// 3. REDE DNA AUTO: OFICINAS, CLIENTES ÚNICOS, VEÍCULOS, OS E MANUTENÇÃO (FASE 5)
// ==============================================================================

router.get('/workshops/summary', (req, res) => {
    try {
        const summary = AdminAnalytics.getWorkshopsSummary(db, req.query);
        res.json({ success: true, ...summary });
    } catch (err) {
        console.error('Erro em /admin/workshops/summary:', err);
        res.status(500).json({ error: 'Erro ao consultar carteira de oficinas.' });
    }
});

router.get('/workshops/:id/performance', (req, res) => {
    try {
        const perf = AdminAnalytics.getWorkshopPerformance(db, req.params.id);
        if (!perf) return res.status(404).json({ error: 'Oficina não encontrada.' });
        res.json({ success: true, ...perf });
    } catch (err) {
        console.error('Erro em /admin/workshops/:id/performance:', err);
        res.status(500).json({ error: 'Erro ao consultar desempenho detalhado da oficina.' });
    }
});

/**
 * Reatribuição administrativa de vínculo de oficina -> representante.
 * Regra Fase 5: exige autorização ADMIN, justificativa obrigatória, auditoria completa e
 * NUNCA altera retroativamente a titularidade de comissões já geradas.
 */
router.post('/workshops/:id/reassign-representative', criticalAdminLimiter, (req, res) => {
    try {
        const workshopId = req.params.id;
        const { new_representative_id, justification } = req.body || {};

        if (!new_representative_id || !justification || String(justification).trim().length < 10) {
            return res.status(400).json({
                error: 'Informe new_representative_id e uma justificativa administrativa detalhada (mínimo 10 caracteres).'
            });
        }

        const workshop = db.prepare(`SELECT id, trade_name FROM workshops WHERE id = ?`).get(workshopId);
        if (!workshop) return res.status(404).json({ error: 'Oficina não encontrada.' });

        const newRep = db.prepare(`SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(new_representative_id, new_representative_id);
        if (!newRep) return res.status(404).json({ error: 'Representante destino não encontrado.' });

        const prevRef = db.prepare(`SELECT * FROM workshop_referrals WHERE workshop_id = ?`).get(workshopId);
        const policy = CommissionFinance.getActiveCommercialPolicy(db);
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const validUntilDate = new Date();
        validUntilDate.setMonth(validUntilDate.getMonth() + Number(policy.referral_validity_months || 24));
        const validUntilIso = validUntilDate.toISOString().replace('T', ' ').slice(0, 19);

        db.transaction(() => {
            if (prevRef) {
                db.prepare(`
                    UPDATE workshop_referrals
                    SET representative_id = ?, rep_code = ?, justification = ?, updated_at = ?
                    WHERE workshop_id = ?
                `).run(newRep.id, newRep.rep_code, String(justification).trim(), nowIso, workshopId);
            } else {
                db.prepare(`
                    INSERT INTO workshop_referrals (
                        id, workshop_id, representative_id, rep_code, origin_channel,
                        linked_at, valid_until, status, created_by, justification
                    ) VALUES (?, ?, ?, ?, 'ADMIN_ASSIGNMENT', ?, ?, 'ACTIVE', ?, ?)
                `).run(`wref_${Date.now()}`, workshopId, newRep.id, newRep.rep_code, nowIso, validUntilIso, req.user.id, String(justification).trim());
            }

            // IMPORTANTE: NÃO atualiza representative_commissions históricas (proteção contra alteração retroativa silenciosa!)
            db.prepare(`
                INSERT INTO representative_audit_logs (
                    id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
                ) VALUES (?, ?, ?, 'ADMIN_REFERRAL_REASSIGNED', ?, ?, ?, ?, ?)
            `).run(
                `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                newRep.id,
                workshopId,
                req.user.id,
                req.user.role_code,
                String(justification).trim(),
                JSON.stringify({
                    previous_representative_id: prevRef ? prevRef.representative_id : null,
                    new_representative_id: newRep.id,
                    new_rep_code: newRep.rep_code,
                    retroactive_commissions_unchanged: true
                }),
                req.ip || '127.0.0.1'
            );
        })();

        logAudit({
            user: req.user,
            action: 'REASSIGN_WORKSHOP_REPRESENTATIVE',
            entityType: 'WORKSHOP_REFERRAL',
            entityId: workshopId,
            ipAddress: req.ip,
            dataBefore: prevRef || null,
            dataAfter: { representative_id: newRep.id, rep_code: newRep.rep_code, justification: String(justification).trim() }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'WORKSHOP_REFERRAL_CHANGED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            payload: { representative_id: newRep.id, rep_code: newRep.rep_code }
        });

        res.json({
            success: true,
            message: 'Vínculo comercial atualizado com auditoria. Comissões históricas anteriores foram preservadas intactas.',
            workshop_id: workshopId,
            representative_id: newRep.id,
            rep_code: newRep.rep_code
        });
    } catch (err) {
        console.error('Erro ao reatribuir representante da oficina:', err);
        res.status(500).json({ error: 'Erro ao atualizar vínculo comercial.' });
    }
});

router.get('/clients/unique', (req, res) => {
    try {
        const result = AdminAnalytics.getUniqueClientsDirectory(db, {
            q: req.query.q,
            workshopId: req.query.workshop_id || 'all',
            page: req.query.page,
            pageSize: req.query.page_size || req.query.limit
        });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Erro em /admin/clients/unique:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes únicos.' });
    }
});

router.get('/service-orders', (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.max(1, Math.min(100, parseInt(req.query.page_size || req.query.limit, 10) || 25));
        const offset = (page - 1) * pageSize;
        const { workshop_id, proof_level, q } = req.query;

        const where = ['1=1'];
        const params = [];
        if (workshop_id && workshop_id !== 'all') {
            where.push('sr.workshop_id = ?');
            params.push(workshop_id);
        }
        if (proof_level && ['1', '2', '3', '4'].includes(String(proof_level))) {
            where.push('sr.proof_level = ?');
            params.push(Number(proof_level));
        }
        if (q) {
            where.push('(UPPER(v.license_plate) LIKE ? OR unaccent(sr.service_title) LIKE unaccent(?) OR unaccent(COALESCE(w.trade_name, "")) LIKE unaccent(?))');
            const like = `%${String(q).trim()}%`;
            params.push(like.toUpperCase(), like, like);
        }

        const whereSql = where.join(' AND ');
        const total = db.prepare(`
            SELECT COUNT(*) as cnt
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE ${whereSql}
        `).get(...params).cnt;

        const items = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, v.model_year,
                   vd.dna_code, w.trade_name as workshop_name, w.city as workshop_city, w.state as workshop_state
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            WHERE ${whereSql}
            ORDER BY sr.service_date DESC, sr.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, pageSize, offset);

        res.json({
            success: true,
            page,
            page_size: pageSize,
            total,
            total_pages: Math.max(1, Math.ceil(total / pageSize)),
            items
        });
    } catch (err) {
        console.error('Erro em /admin/service-orders:', err);
        res.status(500).json({ error: 'Erro ao listar ordens de serviço.' });
    }
});

router.get('/maintenance-history', (req, res) => {
    try {
        const predictions = db.prepare(`
            SELECT p.*, v.license_plate, v.brand, v.model, vd.dna_code
            FROM vehicle_maintenance_predictions p
            JOIN vehicles v ON p.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            ORDER BY CASE p.alert_status WHEN 'VENCIDA' THEN 1 WHEN 'RECOMENDADA' THEN 2 WHEN 'APROXIMANDO' THEN 3 ELSE 4 END ASC, p.updated_at DESC
            LIMIT 100
        `).all();

        const recentServices = db.prepare(`
            SELECT sr.id, sr.service_date, sr.mileage, sr.category, sr.service_title, sr.proof_level, sr.total_cost_cents,
                   v.license_plate, v.brand, v.model, vd.dna_code, w.trade_name as workshop_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            ORDER BY sr.service_date DESC, sr.created_at DESC
            LIMIT 100
        `).all();

        res.json({
            success: true,
            predictions,
            services: recentServices,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/maintenance-history:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de manutenção.' });
    }
});

// ==============================================================================
// 4. FINANCEIRO, COMISSÕES, FECHAMENTO & POLÍTICAS COMERCIAIS (FASE 6 & FASE 8)
// ==============================================================================

router.get('/finance/overview', (req, res) => {
    try {
        const overview = CommissionFinance.getCommissionFinanceOverview(db, {
            competenceMonth: req.query.competence_month || req.query.month
        });
        res.json({ success: true, ...overview });
    } catch (err) {
        console.error('Erro em /admin/finance/overview:', err);
        res.status(500).json({ error: 'Erro ao gerar visão geral financeira.' });
    }
});

router.get('/finance/commissions', (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.max(1, Math.min(200, parseInt(req.query.page_size || req.query.limit, 10) || 50));
        const offset = (page - 1) * pageSize;

        const { status, representative_id, workshop_id, competence_month, month, dispute_status, q } = req.query;
        const where = ['1=1'];
        const params = [];

        if (status && ['PROJECTED', 'CONFIRMED', 'PAID', 'REFUNDED'].includes(String(status).toUpperCase())) {
            where.push('rc.status = ?');
            params.push(String(status).toUpperCase());
        }
        if (representative_id) {
            where.push('(rc.representative_id = ? OR UPPER(r.rep_code) = UPPER(?))');
            params.push(representative_id, representative_id);
        }
        if (workshop_id) {
            where.push('rc.workshop_id = ?');
            params.push(workshop_id);
        }
        const comp = competence_month || month;
        if (comp && CommissionFinance.isValidYM(comp)) {
            where.push(`COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?`);
            params.push(comp);
        }
        if (dispute_status && ['NONE', 'DISPUTED', 'RESOLVED'].includes(String(dispute_status).toUpperCase())) {
            where.push(`COALESCE(rc.dispute_status, 'NONE') = ?`);
            params.push(String(dispute_status).toUpperCase());
        }
        if (q) {
            where.push(`(UPPER(r.rep_code) LIKE ? OR unaccent(r.name) LIKE unaccent(?) OR unaccent(w.trade_name) LIKE unaccent(?) OR rc.source_payment_id LIKE ?)`);
            const like = `%${String(q).trim()}%`;
            params.push(like.toUpperCase(), like, like, like);
        }

        const whereSql = where.join(' AND ');
        const total = db.prepare(`
            SELECT COUNT(*) as cnt
            FROM representative_commissions rc
            JOIN representatives r ON rc.representative_id = r.id
            JOIN workshops w ON rc.workshop_id = w.id
            WHERE ${whereSql}
        `).get(...params).cnt;

        const items = db.prepare(`
            SELECT rc.*,
                   r.rep_code, r.name as rep_name,
                   w.trade_name as workshop_name, w.cnpj as workshop_cnpj,
                   v.license_plate, v.brand as vehicle_brand, v.model as vehicle_model,
                   pc.status as payment_status, pc.paid_at as payment_paid_at, pc.activation_code,
                   cp.version_code as policy_version_code
            FROM representative_commissions rc
            JOIN representatives r ON rc.representative_id = r.id
            JOIN workshops w ON rc.workshop_id = w.id
            LEFT JOIN vehicles v ON v.id = rc.vehicle_id
            LEFT JOIN workshop_pix_charges pc ON pc.id = rc.source_payment_id
            LEFT JOIN commercial_policies cp ON cp.id = rc.policy_id
            WHERE ${whereSql}
            ORDER BY rc.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, pageSize, offset);

        res.json({
            success: true,
            page,
            page_size: pageSize,
            total,
            total_pages: Math.max(1, Math.ceil(total / pageSize)),
            items,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/finance/commissions:', err);
        res.status(500).json({ error: 'Erro ao listar comissões de representantes.' });
    }
});

router.post('/finance/commissions/:id/dispute', criticalAdminLimiter, (req, res) => {
    try {
        const comm = db.prepare(`SELECT * FROM representative_commissions WHERE id = ?`).get(req.params.id);
        if (!comm) return res.status(404).json({ error: 'Comissão não encontrada.' });
        if (comm.status === 'PAID') {
            return res.status(400).json({ error: 'Comissões já liquidadas não podem ser bloqueadas; utilize estorno ou ajuste financeiro.' });
        }

        const nextDispute = String(req.body.dispute_status || 'DISPUTED').toUpperCase();
        if (!['NONE', 'DISPUTED', 'RESOLVED'].includes(nextDispute)) {
            return res.status(400).json({ error: 'dispute_status inválido. Use NONE, DISPUTED ou RESOLVED.' });
        }
        const reason = String(req.body.reason || '').trim();
        if (nextDispute === 'DISPUTED' && reason.length < 5) {
            return res.status(400).json({ error: 'Informe o motivo da contestação (mínimo 5 caracteres).' });
        }

        db.prepare(`
            UPDATE representative_commissions
            SET dispute_status = ?, blocked_reason = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nextDispute, reason || null, comm.id);

        logAudit({
            user: req.user,
            action: 'UPDATE_COMMISSION_DISPUTE',
            entityType: 'COMMISSION',
            entityId: comm.id,
            ipAddress: req.ip,
            dataBefore: { dispute_status: comm.dispute_status },
            dataAfter: { dispute_status: nextDispute, reason }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'COMMISSION_DISPUTE_UPDATED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'COMMISSION',
            entityId: comm.id,
            payload: { dispute_status: nextDispute }
        });

        res.json({ success: true, id: comm.id, dispute_status: nextDispute, blocked_reason: reason || null });
    } catch (err) {
        console.error('Erro ao atualizar contestação da comissão:', err);
        res.status(500).json({ error: 'Erro ao atualizar contestação da comissão.' });
    }
});

router.get('/finance/payouts/next', (req, res) => {
    try {
        const forecast = CommissionFinance.getNextPayoutForecast(db, {
            competenceMonth: req.query.competence_month || req.query.month,
            representativeId: req.query.representative_id || null
        });
        res.json({ success: true, ...forecast });
    } catch (err) {
        console.error('Erro em /admin/finance/payouts/next:', err);
        res.status(500).json({ error: 'Erro ao calcular previsão do próximo pagamento.' });
    }
});

router.get('/finance/payouts/history', (req, res) => {
    try {
        const history = CommissionFinance.getPayoutHistory(db, {
            representativeId: req.query.representative_id || null,
            competenceMonth: req.query.competence_month || req.query.month || null,
            status: req.query.status || null,
            page: req.query.page,
            pageSize: req.query.page_size || req.query.limit
        });
        res.json({ success: true, ...history });
    } catch (err) {
        console.error('Erro em /admin/finance/payouts/history:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de fechamentos e pagamentos.' });
    }
});

router.post('/finance/payouts/close', criticalAdminLimiter, (req, res) => {
    try {
        const competenceMonth = String((req.body && (req.body.competence_month || req.body.month)) || '').trim();
        const notes = String((req.body && req.body.notes) || '').trim();
        const result = CommissionFinance.closeCompetenceCycle(db, {
            competenceMonth,
            notes,
            actor: req.user,
            ipAddress: req.ip || '127.0.0.1'
        });
        res.status(201).json({
            success: true,
            message: `Competência ${competenceMonth} fechada com sucesso! ${result.batches.length} lote(s) gerado(s) para pagamento.`,
            ...result
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message, code: err.code || 'PAYOUT_CLOSE_ERROR' });
    }
});

router.post('/finance/payouts/:id/mark-paid', criticalAdminLimiter, (req, res) => {
    try {
        const result = CommissionFinance.markPayoutBatchPaid(db, {
            batchId: req.params.id,
            transferReference: req.body && (req.body.transfer_reference || req.body.reference),
            transferDate: req.body && (req.body.transfer_date || req.body.date),
            paymentNotes: req.body && (req.body.payment_notes || req.body.notes),
            actor: req.user,
            ipAddress: req.ip || '127.0.0.1'
        });
        res.json({
            success: true,
            message: 'Pagamento registrado com sucesso e trilha de auditoria gravada.',
            ...result
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message, code: err.code || 'PAYOUT_MARK_PAID_ERROR' });
    }
});

router.get('/finance/workshop-payouts', (req, res) => {
    try {
        const items = db.prepare(`
            SELECT
                w.id as workshop_id, w.trade_name, w.cnpj, w.city, w.state, w.status as workshop_status,
                COUNT(CASE WHEN c.status = 'AVAILABLE' THEN 1 END) as pending_count,
                COALESCE(SUM(CASE WHEN c.status = 'AVAILABLE' THEN c.amount_cents ELSE 0 END), 0) as pending_cents,
                COUNT(CASE WHEN c.status = 'PAID' THEN 1 END) as paid_count,
                COALESCE(SUM(CASE WHEN c.status = 'PAID' THEN c.amount_cents ELSE 0 END), 0) as paid_cents,
                COUNT(CASE WHEN c.status = 'CANCELLED' THEN 1 END) as cancelled_count,
                MAX(c.paid_at) as last_paid_at
            FROM workshops w
            LEFT JOIN commissions c ON c.workshop_id = w.id
            GROUP BY w.id
            ORDER BY pending_cents DESC, paid_cents DESC, w.trade_name ASC
        `).all();

        res.json({
            success: true,
            totals: {
                pending_cents: items.reduce((a, i) => a + Number(i.pending_cents || 0), 0),
                paid_cents: items.reduce((a, i) => a + Number(i.paid_cents || 0), 0)
            },
            items,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/finance/workshop-payouts:', err);
        res.status(500).json({ error: 'Erro ao listar repasses às oficinas.' });
    }
});

router.post('/finance/workshop-payouts/:workshopId/mark-paid', criticalAdminLimiter, (req, res) => {
    try {
        const workshopId = req.params.workshopId;
        const ref = String((req.body && req.body.transfer_reference) || '').trim();
        if (!ref || ref.length < 3) {
            return res.status(400).json({ error: 'Informe a referência da transferência bancária/PIX (mínimo 3 caracteres).' });
        }

        const avail = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount_cents), 0) as total FROM commissions WHERE workshop_id = ? AND status = 'AVAILABLE'`).get(workshopId);
        if (!avail || avail.cnt === 0) {
            return res.status(409).json({ error: 'Não há saldo pendente de repasse para esta oficina.' });
        }

        db.transaction(() => {
            db.prepare(`
                UPDATE commissions
                SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, payout_reference = ?, paid_by = ?
                WHERE workshop_id = ? AND status = 'AVAILABLE'
            `).run(ref, req.user.id, workshopId);
        })();

        logAudit({
            user: req.user,
            action: 'MARK_WORKSHOP_PAYOUT_PAID',
            entityType: 'WORKSHOP_PAYOUT',
            entityId: workshopId,
            ipAddress: req.ip,
            dataAfter: { workshop_id: workshopId, count: avail.cnt, amount_cents: avail.total, transfer_reference: ref }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'WORKSHOP_PAYOUT_PAID',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            payload: { count: avail.cnt, amount_cents: avail.total, transfer_reference: ref }
        });

        res.json({ success: true, workshop_id: workshopId, count: avail.cnt, paid_cents: avail.total, transfer_reference: ref });
    } catch (err) {
        console.error('Erro ao registrar repasse para oficina:', err);
        res.status(500).json({ error: 'Erro ao registrar repasse para oficina.' });
    }
});

router.get('/finance/attendance-fees', (req, res) => {
    try {
        const items = db.prepare(`
            SELECT af.*, w.trade_name as workshop_name, w.city as workshop_city, w.state as workshop_state,
                   v.license_plate, v.brand, v.model
            FROM workshop_attendance_fees af
            JOIN workshops w ON af.workshop_id = w.id
            LEFT JOIN vehicles v ON v.id = af.vehicle_id
            ORDER BY af.created_at DESC
            LIMIT 200
        `).all();

        const summary = db.prepare(`
            SELECT
                COUNT(*) as total_count,
                COALESCE(SUM(amount_cents), 0) as total_cents,
                COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN amount_cents ELSE 0 END), 0) as confirmed_cents,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents ELSE 0 END), 0) as paid_cents,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount_cents ELSE 0 END), 0) as pending_cents
            FROM workshop_attendance_fees
        `).get();

        res.json({ success: true, summary, items, generated_at: new Date().toISOString() });
    } catch (err) {
        console.error('Erro em /admin/finance/attendance-fees:', err);
        res.status(500).json({ error: 'Erro ao consultar taxas por atendimento.' });
    }
});

router.get('/finance/reconciliation', (req, res) => {
    try {
        const rec = AdminAnalytics.getFinancialReconciliation(db, {
            competenceMonth: req.query.competence_month || req.query.month
        });
        res.json({ success: true, ...rec });
    } catch (err) {
        console.error('Erro em /admin/finance/reconciliation:', err);
        res.status(500).json({ error: 'Erro ao executar conciliação financeira.' });
    }
});

router.get('/commercial-policies', (req, res) => {
    try {
        const policies = CommissionFinance.listCommercialPolicies(db);
        res.json({ success: true, policies });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar políticas comerciais.' });
    }
});

router.post('/commercial-policies', criticalAdminLimiter, (req, res) => {
    try {
        const created = CommissionFinance.createCommercialPolicy(db, req.body || {}, req.user, req.ip || '127.0.0.1');
        res.status(201).json({ success: true, policy: created });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.post('/commercial-policies/:id/activate', criticalAdminLimiter, (req, res) => {
    try {
        const activated = CommissionFinance.activateCommercialPolicy(db, req.params.id, req.user, req.ip || '127.0.0.1');
        res.json({ success: true, policy: activated, message: 'Política comercial ativada para futuras operações. Transações históricas não foram alteradas.' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

// ==============================================================================
// 5. COMUNICAÇÃO & SUPORTE: CENTRAL WHATSAPP, ALERTAS E CHAMADOS
// ==============================================================================

router.get('/whatsapp/overview', (req, res) => {
    try {
        const sessions = db.prepare(`
            SELECT ws.id, ws.workshop_id, ws.phone_number, ws.status, ws.last_connected_at, ws.updated_at,
                   w.trade_name as workshop_name, w.city, w.state
            FROM whatsapp_sessions ws
            JOIN workshops w ON ws.workshop_id = w.id
            ORDER BY ws.updated_at DESC
        `).all();

        const recentMessages = db.prepare(`
            SELECT wm.id, wm.workshop_id, wm.phone_number, wm.message, wm.status, wm.error, wm.sent_at, wm.created_at,
                   w.trade_name as workshop_name
            FROM whatsapp_messages wm
            LEFT JOIN workshops w ON wm.workshop_id = w.id
            ORDER BY wm.created_at DESC
            LIMIT 60
        `).all();

        const campaigns = db.prepare(`
            SELECT c.*, w.trade_name as workshop_name
            FROM maintenance_bot_campaigns c
            LEFT JOIN workshops w ON c.workshop_id = w.id
            ORDER BY c.sent_at DESC
            LIMIT 60
        `).all();

        const messageSummary = db.prepare(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status IN ('SENT', 'DELIVERED', 'DELIVERED_IN_PLATFORM') THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
            FROM whatsapp_messages
        `).get();

        res.json({
            success: true,
            summary: {
                connected_sessions: sessions.filter(s => s.status === 'CONNECTED').length,
                total_sessions: sessions.length,
                messages: messageSummary,
                active_bot_campaigns: campaigns.filter(c => ['SENT', 'IN_CONVERSATION'].includes(c.status)).length,
                confirmed_bot_appointments: campaigns.filter(c => c.status === 'CONFIRMED').length
            },
            sessions,
            recent_messages: recentMessages,
            campaigns,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/whatsapp/overview:', err);
        res.status(500).json({ error: 'Erro ao carregar Central WhatsApp.' });
    }
});

// ==============================================================================
// 6. SISTEMA: SINCRONIZAÇÃO (SSE + STATUS), AUDITORIA FINANCEIRA, SETTINGS & USUÁRIOS
// ==============================================================================

router.get('/sync/status', (req, res) => {
    try {
        const status = SyncEvents.getSyncStatus(db);
        res.json({ success: true, ...status });
    } catch (err) {
        console.error('Erro em /admin/sync/status:', err);
        res.status(500).json({ error: 'Erro ao consultar status de sincronização.' });
    }
});

router.get('/sync/stream', (req, res) => {
    SyncEvents.attachSseClient(req, res);
});

router.get('/audit/financial', (req, res) => {
    try {
        const limit = Math.max(10, Math.min(300, parseInt(req.query.limit, 10) || 100));

        const repAudit = db.prepare(`
            SELECT ral.*, r.rep_code, r.name as rep_name, w.trade_name as workshop_name
            FROM representative_audit_logs ral
            LEFT JOIN representatives r ON r.id = ral.representative_id
            LEFT JOIN workshops w ON w.id = ral.workshop_id
            ORDER BY ral.created_at DESC
            LIMIT ?
        `).all(limit).map(l => ({
            ...l,
            metadata: (() => { try { return l.metadata_json ? JSON.parse(l.metadata_json) : {}; } catch (_) { return {}; } })()
        }));

        const sysFinancialAudit = db.prepare(`
            SELECT * FROM audit_logs
            WHERE entity_type IN ('PAYOUT_CYCLE', 'PAYOUT_BATCH', 'COMMISSION', 'COMMERCIAL_POLICY', 'PRICE', 'WORKSHOP_PAYOUT', 'WORKSHOP_REFERRAL')
               OR action LIKE '%PAYOUT%' OR action LIKE '%COMMISSION%' OR action LIKE '%POLICY%' OR action LIKE '%PRICE%'
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit);

        res.json({
            success: true,
            representative_audit: repAudit,
            system_financial_audit: sysFinancialAudit,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro em /admin/audit/financial:', err);
        res.status(500).json({ error: 'Erro ao consultar auditoria financeira.' });
    }
});

router.get('/settings', (req, res) => {
    try {
        const settings = db.prepare(`SELECT * FROM admin_system_settings ORDER BY category ASC, key ASC`).all();
        const policies = CommissionFinance.listCommercialPolicies(db);
        const integrations = db.prepare(`
            SELECT id, service_code, service_name, is_enabled, is_connected, endpoint_url, api_key_masked, status_message, last_sync_at
            FROM integrations ORDER BY service_name ASC
        `).all();
        res.json({ success: true, settings, policies, integrations });
    } catch (err) {
        console.error('Erro em /admin/settings:', err);
        res.status(500).json({ error: 'Erro ao carregar configurações.' });
    }
});

router.put('/settings', criticalAdminLimiter, (req, res) => {
    try {
        const updates = (req.body && req.body.settings) || req.body || {};
        const allowedKeys = new Set([
            'payout_cycle_offset_months',
            'payout_day_of_month',
            'global_monthly_workshops_goal',
            'global_monthly_activations_goal',
            'global_monthly_revenue_goal_cents',
            'sync_polling_interval_seconds'
        ]);

        const entries = Object.entries(updates).filter(([k]) => allowedKeys.has(k));
        if (entries.length === 0) {
            return res.status(400).json({ error: 'Nenhuma configuração válida fornecida para atualização.' });
        }

        const stmt = db.prepare(`
            INSERT INTO admin_system_settings (key, value, category, updated_by, updated_at)
            VALUES (?, ?, 'GENERAL', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
        `);

        db.transaction(() => {
            for (const [k, v] of entries) {
                stmt.run(k, String(v).trim(), req.user.id);
            }
        })();

        logAudit({
            user: req.user,
            action: 'UPDATE_ADMIN_SETTINGS',
            entityType: 'SYSTEM_SETTINGS',
            entityId: 'global',
            ipAddress: req.ip,
            dataAfter: Object.fromEntries(entries)
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'SETTINGS_UPDATED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'SYSTEM_SETTINGS',
            entityId: 'global',
            payload: Object.fromEntries(entries)
        });

        const settings = db.prepare(`SELECT * FROM admin_system_settings ORDER BY category ASC, key ASC`).all();
        res.json({ success: true, message: 'Configurações atualizadas com sucesso.', settings });
    } catch (err) {
        console.error('Erro em PUT /admin/settings:', err);
        res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
});

router.get('/users', (req, res) => {
    try {
        const { role, status, q } = req.query;
        const where = ['1=1'];
        const params = [];

        if (role && role !== 'ALL') {
            where.push('r.code = ?');
            params.push(String(role).toUpperCase());
        }
        if (status && status !== 'ALL') {
            where.push('u.status = ?');
            params.push(String(status).toUpperCase());
        }
        if (q) {
            where.push('(unaccent(u.name) LIKE unaccent(?) OR LOWER(u.email) LIKE ?)');
            const like = `%${String(q).trim()}%`;
            params.push(like, like.toLowerCase());
        }

        // Nunca retorna password_hash!
        const users = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, u.role_id, u.status, u.is_demo, u.created_at, u.updated_at,
                   r.code as role_code, r.name as role_name,
                   w.trade_name as workshop_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN workshop_users wu ON wu.user_id = u.id
            LEFT JOIN workshops w ON wu.workshop_id = w.id
            WHERE ${where.join(' AND ')}
            ORDER BY u.created_at DESC
            LIMIT 200
        `).all(...params);

        const roles = db.prepare(`SELECT id, code, name, description FROM roles ORDER BY code ASC`).all();
        const permissions = db.prepare(`SELECT id, name, category, description FROM permissions ORDER BY category ASC, name ASC`).all();

        res.json({ success: true, count: users.length, users, roles, permissions });
    } catch (err) {
        console.error('Erro em /admin/users:', err);
        res.status(500).json({ error: 'Erro ao listar usuários e permissões.' });
    }
});

router.patch('/users/:id/status', criticalAdminLimiter, (req, res) => {
    try {
        const targetId = req.params.id;
        if (targetId === req.user.id) {
            return res.status(400).json({ error: 'Você não pode alterar o status da própria conta administrativa logada.' });
        }
        const nextStatus = String((req.body && req.body.status) || '').toUpperCase();
        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'].includes(nextStatus)) {
            return res.status(400).json({ error: 'Status inválido. Use ACTIVE, INACTIVE, SUSPENDED ou BLOCKED.' });
        }
        const existing = db.prepare(`SELECT id, name, email, status FROM users WHERE id = ?`).get(targetId);
        if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });

        db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(nextStatus, targetId);
        logAudit({
            user: req.user,
            action: 'UPDATE_USER_STATUS',
            entityType: 'USER',
            entityId: targetId,
            ipAddress: req.ip,
            dataBefore: { status: existing.status },
            dataAfter: { status: nextStatus }
        });

        res.json({ success: true, id: targetId, status: nextStatus });
    } catch (err) {
        console.error('Erro em PATCH /admin/users/:id/status:', err);
        res.status(500).json({ error: 'Erro ao atualizar status do usuário.' });
    }
});

// ==============================================================================
// 7. ENDPOINTS LEGADOS PRESERVADOS (COM RBAC ADMIN E CORREÇÃO DE JOINs 1:N)
// ==============================================================================

router.get('/network-stats', (req, res) => {
    try {
        const totalVehicles = db.prepare(`SELECT COUNT(*) as count FROM vehicles`).get().count;
        const vehiclesWithDna = db.prepare(`SELECT COUNT(*) as count FROM vehicle_dna WHERE status = 'ACTIVE'`).get().count;
        const totalWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops`).get().count;
        const activeWorkshops = db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE status IN ('APPROVED', 'ACTIVE')`).get().count;
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

        const dnaRevenueCents = db.prepare(`SELECT COALESCE(SUM(activation_fee_cents), 0) as total FROM vehicle_dna WHERE status = 'ACTIVE'`).get().total;
        const servicesVolumeCents = db.prepare(`SELECT COALESCE(SUM(total_cost_cents), 0) as total FROM service_records`).get().total;
        const totalCommissionsCents = db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) as total FROM commissions WHERE status != 'CANCELLED'`).get().total;

        const totalGrossRevenueCents = dnaRevenueCents + servicesVolumeCents;
        const averageServiceTicketCents = totalServices > 0 ? Math.round(servicesVolumeCents / totalServices) : 0;
        const citiesCount = db.prepare(`SELECT COUNT(DISTINCT city) as count FROM workshops WHERE status IN ('APPROVED', 'ACTIVE')`).get().count;

        const recentServices = db.prepare(`
            SELECT sr.*, v.license_plate, v.brand, v.model, vd.dna_code, w.trade_name as workshop_name
            FROM service_records sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w ON sr.workshop_id = w.id
            ORDER BY sr.service_date DESC, sr.created_at DESC
            LIMIT 10
        `).all();

        // Corrigido: subqueries independentes eliminam multiplicação por JOIN 1:N entre vehicle_dna e service_records!
        const growthByWorkshops = db.prepare(`
            SELECT w.id, w.company_name, w.trade_name, w.cnpj, w.phone, w.email, w.city, w.state, w.status,
                   (SELECT COUNT(*) FROM vehicle_dna vd WHERE vd.activated_by_workshop_id = w.id) as dnas_activated,
                   (SELECT COUNT(*) FROM service_records sr WHERE sr.workshop_id = w.id) as services_recorded,
                   (SELECT COUNT(*) FROM service_records sr WHERE sr.workshop_id = w.id AND sr.proof_level = 4) as proven_services,
                   (SELECT COALESCE(SUM(sr.total_cost_cents), 0) FROM service_records sr WHERE sr.workshop_id = w.id) as total_services_amount_cents,
                   (SELECT COUNT(DISTINCT sr.vehicle_id) FROM service_records sr WHERE sr.workshop_id = w.id) as distinct_vehicles_serviced
            FROM workshops w
            ORDER BY dnas_activated DESC, proven_services DESC, total_services_amount_cents DESC
        `).all();

        res.json({
            network: {
                totalVehicles,
                vehiclesWithDna,
                vehiclesWithoutDna: Math.max(0, totalVehicles - vehiclesWithDna),
                totalWorkshops,
                activeWorkshops,
                pendingWorkshops,
                totalClients: totalOwners,
                totalServices,
                provenServices,
                confirmedServices,
                declaredServices,
                pendingServices,
                totalTransfers,
                totalInvoices,
                totalPhotos,
                citiesCount,
                dnaRevenueCents,
                servicesVolumeCents,
                totalGrossRevenueCents,
                averageServiceTicketCents,
                totalCommissionsCents
            },
            financial: {
                totalGrossRevenueCents,
                dnaRevenueCents,
                servicesVolumeCents,
                averageServiceTicketCents,
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

router.get('/workshops/:id/clients', (req, res) => {
    try {
        const workshopId = req.params.id;
        const perf = AdminAnalytics.getWorkshopPerformance(db, workshopId);
        if (!perf) {
            return res.status(404).json({ error: 'Oficina não encontrada.' });
        }

        // Mantém formato compatível `clients` (por veículo) + adiciona `uniqueClients` e `uniqueClientsCount` sem duplicação
        const clients = perf.vehicles.map(v => ({
            vehicle_id: v.vehicle_id,
            license_plate: v.license_plate,
            brand: v.brand,
            model: v.model,
            version_label: v.version_label,
            model_year: v.model_year,
            color: v.color,
            photo_url: v.photo_url,
            dna_code: v.dna_code,
            dna_status: v.dna_status,
            dna_activated_at: v.dna_activated_at,
            owner_name: v.owner_name,
            owner_phone: v.owner_phone,
            owner_email: v.owner_email,
            last_service_date: v.last_service_date,
            last_recorded_mileage: v.last_mileage,
            workshop_services_count: v.services_count,
            total_spent_cents: v.services_total_cents
        }));

        res.json({
            success: true,
            workshop: perf.workshop,
            clientsCount: perf.unique_clients.length,
            vehiclesCount: clients.length,
            uniqueClients: perf.unique_clients,
            clients
        });
    } catch (err) {
        console.error('Erro ao buscar clientes da oficina:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes da oficina.' });
    }
});

// Teste de push direcionado: aceite FCM não equivale a recebimento no aparelho.
router.get('/push/devices', (req,res) => {
    try {
        const push = require('../../services/pushNotifications.service');
        res.json({success:true, configured:push.configured(), vehicles:push.devices(), deliveries:push.deliveries()});
    } catch(error) { res.status(500).json({error:'Falha ao consultar dispositivos.'}); }
});
router.post('/push/test', criticalAdminLimiter, async (req,res) => {
    try {
        const {vehicle_id,service_title,remaining_km} = req.body || {};
        const km=Number(remaining_km);
        const service=String(service_title||'').trim();
        if (!vehicle_id || !service || service.length>120 || !Number.isInteger(km) || km<0 || km>5000) return res.status(400).json({error:'Veículo, serviço e km entre 0 e 5000 são obrigatórios.'});
        const push=require('../../services/pushNotifications.service');
        const result=await push.send({vehicleId:String(vehicle_id),service,km,source:'ADMIN_TEST'});
        res.status(result.success?200:409).json(result);
    } catch(error) {
        console.error('Push Admin:',error.message);
        res.status(502).json({success:false,error:'Falha no envio pelo Firebase: '+error.message});
    }
});

router.get('/maintenance-alerts', (req, res) => {
    try {
        const vehicles = db.prepare(`
            SELECT v.id, v.license_plate, v.brand, v.model, v.version_label, v.model_year, v.color,
                   vd.dna_code, vd.status as dna_status,
                   COALESCE(o.name, u.name, 'Proprietário') as owner_name,
                   COALESCE(o.phone, u.phone, '') as owner_phone,
                   COALESCE(o.email, u.email, '') as owner_email,
                   w.trade_name as preferred_workshop_name,
                   w.phone as preferred_workshop_phone,
                   COALESCE(
                       (SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id),
                       (SELECT MAX(mileage) FROM service_records sr WHERE sr.vehicle_id = v.id),
                       0
                   ) as current_mileage
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN owners o ON o.id = COALESCE(
                v.current_owner_id,
                (SELECT ot.new_owner_id FROM ownership_transfers ot WHERE ot.vehicle_id = v.id AND ot.status = 'COMPLETED' ORDER BY ot.completed_at DESC LIMIT 1)
            )
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN workshops w ON w.id = COALESCE(
                vd.activated_by_workshop_id,
                (SELECT sr2.workshop_id FROM service_records sr2 WHERE sr2.vehicle_id = v.id AND sr2.workshop_id IS NOT NULL ORDER BY sr2.service_date DESC LIMIT 1)
            )
        `).all();

        const alerts = [];

        for (const veh of vehicles) {
            const currentKm = Number(veh.current_mileage) || 0;
            if (currentKm <= 0) continue;

            const lastOil = db.prepare(`
                SELECT service_date, mileage, service_title
                FROM service_records
                WHERE vehicle_id = ? AND (LOWER(category) LIKE '%lubrific%' OR LOWER(service_title) LIKE '%óleo%' OR LOWER(service_title) LIKE '%oleo%')
                ORDER BY service_date DESC, mileage DESC
                LIMIT 1
            `).get(veh.id);

            const lastOilKm = lastOil ? Number(lastOil.mileage) : (currentKm > 10000 ? currentKm - 11000 : 0);
            const kmSinceOil = currentKm - lastOilKm;

            if (kmSinceOil >= 8000) {
                const urgency = kmSinceOil >= 10000 ? 'CRITICAL' : 'WARNING';
                const formattedPhone = String(veh.owner_phone || '').replace(/\D/g, '');
                const cleanPhone = formattedPhone ? (formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`) : '';
                const workshopName = veh.preferred_workshop_name || 'Rede DNA AUTO';
                const message = `Olá ${veh.owner_name}! Tudo bem?\n\nAqui é do DNA AUTO em parceria com a oficina *${workshopName}*.\n\nConstatamos que o seu *${veh.brand} ${veh.model}* (Placa: *${veh.license_plate}*) atingiu *${currentKm.toLocaleString('pt-BR')} km*.\n\nJá se passaram *${kmSinceOil.toLocaleString('pt-BR')} km* desde a última revisão de óleo. Recomendamos agendar a *Troca Preventiva de Óleo e Filtros*.`;

                alerts.push({
                    id: `alert_oil_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    currentMileage: currentKm,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone || 'Não informado',
                    workshopName,
                    serviceType: 'Troca de Óleo e Filtros',
                    urgency,
                    reason: `${kmSinceOil.toLocaleString('pt-BR')} km rodados desde a última troca de lubrificante`,
                    recommendation: 'Recomendada troca a cada 10.000 km ou 6 meses.',
                    whatsappUrl: cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}` : null,
                    whatsappMessage: message
                });
            }

            const lastBelt = db.prepare(`
                SELECT service_date, mileage, service_title
                FROM service_records
                WHERE vehicle_id = ? AND (LOWER(category) LIKE '%correia%' OR LOWER(service_title) LIKE '%correia%' OR LOWER(service_title) LIKE '%dentada%')
                ORDER BY service_date DESC, mileage DESC
                LIMIT 1
            `).get(veh.id);

            const lastBeltKm = lastBelt ? Number(lastBelt.mileage) : 0;
            const kmSinceBelt = currentKm - lastBeltKm;

            if (currentKm >= 50000 && kmSinceBelt >= 50000) {
                const urgency = kmSinceBelt >= 60000 ? 'CRITICAL' : 'WARNING';
                const formattedPhone = String(veh.owner_phone || '').replace(/\D/g, '');
                const cleanPhone = formattedPhone ? (formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`) : '';
                const workshopName = veh.preferred_workshop_name || 'Rede DNA AUTO';
                const message = `Olá ${veh.owner_name}! Aqui é da equipe técnica DNA AUTO / *${workshopName}*.\n\nSeu *${veh.brand} ${veh.model}* (Placa: *${veh.license_plate}*) está com *${currentKm.toLocaleString('pt-BR')} km* rodados. Recomendamos inspeção preventiva do *Kit Correia Dentada e Tensores*.`;

                alerts.push({
                    id: `alert_belt_${veh.id}`,
                    vehicleId: veh.id,
                    licensePlate: veh.license_plate,
                    vehicleModel: `${veh.brand} ${veh.model}`,
                    currentMileage: currentKm,
                    ownerName: veh.owner_name,
                    ownerPhone: veh.owner_phone || 'Não informado',
                    workshopName,
                    serviceType: 'Kit Correia Dentada & Tensores',
                    urgency,
                    reason: `Veículo com ${currentKm.toLocaleString('pt-BR')} km sem registro recente de troca de correia`,
                    recommendation: 'Troca preventiva recomendada a cada 50.000 a 60.000 km.',
                    whatsappUrl: cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}` : null,
                    whatsappMessage: message
                });
            }
        }

        res.json({ success: true, totalAlerts: alerts.length, alerts });
    } catch (err) {
        console.error('Erro ao gerar alertas de manutenção:', err);
        res.status(500).json({ error: 'Erro ao processar alertas preventivos.' });
    }
});

router.get('/fleet', (req, res) => {
    try {
        const { workshop_id, q, dna_status } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.max(1, Math.min(500, parseInt(req.query.page_size || req.query.limit, 10) || 200));
        const offset = (page - 1) * pageSize;

        let query = `
            SELECT
                v.id as vehicle_id, v.license_plate, v.brand, v.model, v.version_label,
                v.model_year, v.manufacture_year, v.color, v.photo_url, v.created_at,
                vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at,
                COALESCE(w_act.trade_name, w_srv.trade_name, 'Sem Oficina Vinculada') as workshop_name,
                COALESCE(w_act.id, w_srv.id, 'none') as workshop_id,
                COALESCE(w_act.city, w_srv.city, '-') as workshop_city,
                COALESCE(o.name, u.name, 'Proprietário não identificado') as owner_name,
                COALESCE(o.phone, u.phone, '') as owner_phone,
                (SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id) as current_mileage,
                (SELECT COUNT(*) FROM service_records sr WHERE sr.vehicle_id = v.id) as services_count,
                (SELECT COALESCE(SUM(total_cost_cents), 0) FROM service_records sr WHERE sr.vehicle_id = v.id) as total_maintenance_cents
            FROM vehicles v
            LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
            LEFT JOIN workshops w_act ON vd.activated_by_workshop_id = w_act.id
            LEFT JOIN workshops w_srv ON w_srv.id = (
                SELECT sr_last.workshop_id FROM service_records sr_last
                WHERE sr_last.vehicle_id = v.id AND sr_last.workshop_id IS NOT NULL
                ORDER BY sr_last.service_date DESC LIMIT 1
            )
            LEFT JOIN owners o ON o.id = COALESCE(
                v.current_owner_id,
                (SELECT ot.new_owner_id FROM ownership_transfers ot WHERE ot.vehicle_id = v.id AND ot.status = 'COMPLETED' ORDER BY ot.completed_at DESC LIMIT 1)
            )
            LEFT JOIN users u ON u.id = o.user_id
            WHERE 1=1
        `;
        const params = [];
        if (workshop_id && workshop_id !== 'all') {
            query += ` AND (w_act.id = ? OR w_srv.id = ?)`;
            params.push(workshop_id, workshop_id);
        }
        if (dna_status === 'ACTIVE') {
            query += ` AND vd.status = 'ACTIVE'`;
        } else if (dna_status === 'NONE') {
            query += ` AND vd.id IS NULL`;
        }
        if (q) {
            query += ` AND (UPPER(v.license_plate) LIKE ? OR UPPER(COALESCE(vd.dna_code, '')) LIKE ? OR unaccent(v.brand || ' ' || v.model) LIKE unaccent(?))`;
            const like = `%${String(q).trim()}%`;
            params.push(like.toUpperCase(), like.toUpperCase(), like);
        }
        query += ` ORDER BY v.created_at DESC, v.brand ASC LIMIT ? OFFSET ?`;

        const vehicles = db.prepare(query).all(...params, pageSize, offset);
        res.json({ success: true, count: vehicles.length, vehicles });
    } catch (err) {
        console.error('Erro ao listar frota da rede:', err);
        res.status(500).json({ error: 'Erro ao consultar veículos da rede.' });
    }
});

router.get('/clients-all', (req, res) => {
    try {
        const result = AdminAnalytics.getUniqueClientsDirectory(db, {
            q: req.query.q,
            workshopId: req.query.workshop_id || 'all',
            page: req.query.page || 1,
            pageSize: req.query.page_size || 200
        });
        res.json({ success: true, count: result.total, clients: result.items });
    } catch (err) {
        console.error('Erro ao listar clientes da rede:', err);
        res.status(500).json({ error: 'Erro ao consultar clientes da rede.' });
    }
});

router.post('/workshops/:id/status', criticalAdminLimiter, (req, res) => {
    try {
        const { status, justification } = req.body || {};
        const workshopId = req.params.id;
        if (!['APPROVED', 'PENDING', 'SUSPENDED', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido. Use APPROVED, PENDING, SUSPENDED ou BLOCKED.' });
        }
        const existing = db.prepare(`SELECT id, trade_name, status FROM workshops WHERE id = ?`).get(workshopId);
        if (!existing) return res.status(404).json({ error: 'Oficina não encontrada.' });

        db.prepare(`UPDATE workshops SET status = ?, verified_badge = CASE WHEN ? = 'APPROVED' THEN 1 ELSE verified_badge END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, status, workshopId);

        logAudit({
            user: req.user,
            action: 'UPDATE_WORKSHOP_STATUS',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            ipAddress: req.ip,
            dataBefore: { status: existing.status },
            dataAfter: { status, justification: justification || null }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'WORKSHOP_STATUS_CHANGED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'WORKSHOP',
            entityId: workshopId,
            payload: { trade_name: existing.trade_name, previous_status: existing.status, new_status: status }
        });

        res.json({ success: true, message: `Status da oficina atualizado para ${status}.`, workshopId, status });
    } catch (err) {
        console.error('Erro ao atualizar status da oficina:', err);
        res.status(500).json({ error: 'Erro ao atualizar oficina.' });
    }
});

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
            params.push(`%${String(dna_code).toUpperCase()}%`);
        }
        if (entity_type) {
            query += ` AND entity_type = ?`;
            params.push(entity_type);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(Math.max(1, Math.min(300, Number(limit) || 80)));

        const logs = db.prepare(query).all(...params);
        res.json({ success: true, count: logs.length, logs });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar auditoria.' });
    }
});

router.get('/support-tickets', (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT st.*,
                   w.trade_name AS workshop_name,
                   w.city AS workshop_city,
                   w.state AS workshop_state,
                   w.phone AS workshop_phone
            FROM support_tickets st
            LEFT JOIN workshops w ON st.workshop_id = w.id
            WHERE 1=1
        `;
        const params = [];
        if (status && status !== 'ALL') {
            query += ` AND st.status = ?`;
            params.push(String(status).toUpperCase());
        }
        query += ` ORDER BY CASE st.status WHEN 'OPEN' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'RESOLVED' THEN 3 ELSE 4 END ASC, st.created_at DESC LIMIT 200`;

        const tickets = db.prepare(query).all(...params);
        res.json({ success: true, count: tickets.length, tickets });
    } catch (err) {
        console.error('Erro ao listar tickets no admin:', err);
        res.status(500).json({ error: 'Erro ao listar chamados de suporte.' });
    }
});

router.patch('/support-tickets/:ticketId', (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const existing = db.prepare(`SELECT * FROM support_tickets WHERE id = ?`).get(ticketId);
        if (!existing) {
            return res.status(404).json({ error: 'Chamado não encontrado.' });
        }

        const { status, admin_reply, replied_by } = req.body || {};
        const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
        const nextStatus = status ? String(status).toUpperCase() : existing.status;

        if (!allowedStatuses.includes(nextStatus)) {
            return res.status(400).json({ error: 'Status inválido. Use OPEN, IN_PROGRESS, RESOLVED ou CLOSED.' });
        }

        const actorName = replied_by || (req.user && req.user.name) || 'Administrador DNA AUTO';
        const nextReply = admin_reply !== undefined ? String(admin_reply).trim() : existing.admin_reply;
        db.prepare(`
            UPDATE support_tickets
            SET status = ?,
                admin_reply = ?,
                replied_by = ?,
                replied_at = CASE WHEN ? IS NOT NULL AND ? != '' THEN CURRENT_TIMESTAMP ELSE replied_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nextStatus, nextReply || null, actorName, nextReply || '', nextReply || '', ticketId);

        const updated = db.prepare(`
            SELECT st.*, w.trade_name AS workshop_name
            FROM support_tickets st
            LEFT JOIN workshops w ON st.workshop_id = w.id
            WHERE st.id = ?
        `).get(ticketId);

        logAudit({
            user: req.user,
            action: 'UPDATE_SUPPORT_TICKET',
            entityType: 'SUPPORT_TICKET',
            entityId: ticketId,
            ipAddress: req.ip,
            dataBefore: { status: existing.status },
            dataAfter: { status: nextStatus, admin_reply: nextReply }
        });

        SyncEvents.publishSyncEvent(db, {
            eventType: 'SUPPORT_TICKET_UPDATED',
            sourceApp: 'ADMIN_PANEL',
            entityType: 'SUPPORT_TICKET',
            entityId: ticketId,
            payload: { protocol: existing.protocol, status: nextStatus }
        });

        res.json({ success: true, ticket: updated });
    } catch (err) {
        console.error('Erro ao atualizar ticket no admin:', err);
        res.status(500).json({ error: 'Erro ao atualizar chamado de suporte.' });
    }
});

module.exports = router;
