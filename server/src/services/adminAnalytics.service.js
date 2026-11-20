/**
 * DNA AUTO — Serviço de Analytics e Consolidação Administrativa V2 (Fases 3, 4, 5, 8)
 *
 * Princípios obrigatórios:
 * - Zero números fictícios ou fallbacks inventados.
 * - Zero multiplicação de valores por JOINs 1:N (usa subqueries independentes / CTEs).
 * - Desduplicação rigorosa de clientes únicos vs múltiplos veículos.
 * - SQL 100% parametrizado e ordenação por whitelist estrita.
 * - Proteção de dados sensíveis (nunca retorna password_hash, tokens ou segredos).
 */

const CommissionFinance = require('./commissionFinance.service');
const { getCachedOrCompute } = require('./syncEvents.service');

function maskDocument(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 11) {
        return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
    }
    if (digits.length === 14) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.***/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
    if (!raw) return 'Não informado';
    const str = String(raw);
    return str.length > 6 ? `${str.slice(0, 3)}***${str.slice(-2)}` : '***';
}

function maskPixKey(raw) {
    if (!raw) return 'Não cadastrada';
    const str = String(raw).trim();
    if (str.includes('@')) {
        const [u, d] = str.split('@');
        return `${u.slice(0, 2)}***@${d}`;
    }
    if (str.length > 6) {
        return `${str.slice(0, 3)}***${str.slice(-3)}`;
    }
    return '***';
}

/**
 * Converte filtro global de período (current_month, last_30_days, last_90_days, current_year, all, ou YYYY-MM)
 * em cláusula SQL parametrizada para uma coluna de data.
 */
function buildPeriodClause(columnExpr, period = 'current_month', month = null) {
    const cleanMonth = String(month || '').trim();
    if (CommissionFinance.isValidYM(cleanMonth)) {
        return { sql: `strftime('%Y-%m', ${columnExpr}) = ?`, params: [cleanMonth], label: cleanMonth, targetMonth: cleanMonth };
    }
    const p = String(period || 'current_month').toLowerCase();
    const curYM = CommissionFinance.getCurrentYM();
    if (p === 'current_month' || p === 'month') {
        return { sql: `strftime('%Y-%m', ${columnExpr}) = ?`, params: [curYM], label: curYM, targetMonth: curYM };
    }
    if (p === 'last_30_days' || p === '30d') {
        return { sql: `datetime(${columnExpr}) >= datetime('now', '-30 days')`, params: [], label: 'Últimos 30 dias', targetMonth: curYM };
    }
    if (p === 'last_90_days' || p === '90d') {
        return { sql: `datetime(${columnExpr}) >= datetime('now', '-90 days')`, params: [], label: 'Últimos 90 dias', targetMonth: curYM };
    }
    if (p === 'current_year' || p === 'year') {
        const curY = curYM.slice(0, 4);
        return { sql: `strftime('%Y', ${columnExpr}) = ?`, params: [curY], label: `Ano ${curY}`, targetMonth: curYM };
    }
    return { sql: '1=1', params: [], label: 'Todo o período', targetMonth: curYM };
}

/**
 * Expressão SQL que gera uma chave canônica única de cliente a partir da tabela `owners`
 * (evita contar o mesmo cliente múltiplas vezes quando tem vários veículos ou registros).
 */
const UNIQUE_CLIENT_KEY_SQL = `
    COALESCE(
        NULLIF(TRIM(o.user_id), ''),
        CASE WHEN NULLIF(LOWER(TRIM(o.email)), '') IS NOT NULL THEN 'email:' || LOWER(TRIM(o.email)) END,
        CASE WHEN LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(o.phone, ''), '(', ''), ')', ''), '-', ''), ' ', '')) >= 8
             THEN 'phone:' || SUBSTR(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(o.phone, ''), '(', ''), ')', ''), '-', ''), ' ', ''), -10) END,
        'owner:' || o.id
    )
`;

/**
 * FASE 3: Dashboard Executivo — 16 Cards Principais calculados no backend.
 */
function getDashboardOverview(db, { period = 'current_month', month = null } = {}) {
    const cacheKey = `dashboard:overview:${period}:${month || ''}`;
    const { data } = getCachedOrCompute(cacheKey, 15000, () => {
        const curYM = CommissionFinance.isValidYM(month) ? month : CommissionFinance.getCurrentYM();
        const dnaPeriod = buildPeriodClause('activated_at', period, month);
        const pixPeriod = buildPeriodClause('COALESCE(paid_at, created_at)', period, month);
        const srvPeriod = buildPeriodClause('service_date', period, month);
        const appPeriod = buildPeriodClause('appointment_date', period, month);
        const feePeriod = buildPeriodClause('created_at', period, month);

        // 1-3. Representantes
        const repRow = db.prepare(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as suspended,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected
            FROM representatives
        `).get();

        // 4-6. Oficinas
        const wsRow = db.prepare(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status IN ('APPROVED', 'ACTIVE') THEN 1 END) as active,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
                COUNT(CASE WHEN status IN ('SUSPENDED', 'BLOCKED') THEN 1 END) as suspended,
                COUNT(DISTINCT CASE WHEN status IN ('APPROVED', 'ACTIVE') THEN state END) as states_count,
                COUNT(DISTINCT CASE WHEN status IN ('APPROVED', 'ACTIVE') THEN city END) as cities_count
            FROM workshops
        `).get();

        // 7. Clientes únicos (unificando owners e client_activations sem owner_id)
        const uniqueOwnersCount = db.prepare(`
            SELECT COUNT(DISTINCT ${UNIQUE_CLIENT_KEY_SQL}) as cnt
            FROM owners o
        `).get().cnt;

        const orphanActivationsClients = db.prepare(`
            SELECT COUNT(DISTINCT LOWER(COALESCE(NULLIF(TRIM(email), ''), NULLIF(TRIM(whatsapp), ''), TRIM(client_name)))) as cnt
            FROM client_activations
            WHERE owner_id IS NULL
        `).get().cnt;

        const uniqueClients = Number(uniqueOwnersCount || 0) + Number(orphanActivationsClients || 0);

        // 8-9. Veículos e DNA ativo
        const vehRow = db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM vehicles) as total_vehicles,
                (SELECT COUNT(*) FROM vehicle_dna WHERE status = 'ACTIVE') as active_dna_vehicles
        `).get();

        // 10-11. Cadastros pagos e Faturamento confirmado no período/mês
        const dnaPaidRow = db.prepare(`
            SELECT
                COUNT(*) as paid_count,
                COALESCE(SUM(amount_paid_cents), 0) as revenue_cents,
                COALESCE(SUM(commission_amount_cents), 0) as workshop_split_cents
            FROM dna_activations
            WHERE payment_status = 'COMPLETED' AND ${dnaPeriod.sql}
        `).get(...dnaPeriod.params);

        const pixPaidRow = db.prepare(`
            SELECT
                COUNT(*) as paid_count,
                COALESCE(SUM(customer_price_cents), 0) as gross_customer_cents,
                COALESCE(SUM(amount_cents), 0) as platform_received_cents,
                COALESCE(SUM(workshop_profit_cents), 0) as workshop_profit_cents
            FROM workshop_pix_charges
            WHERE status = 'PAID' AND ${pixPeriod.sql}
        `).get(...pixPeriod.params);

        const monthlyPaidRegistrations = Math.max(Number(dnaPaidRow.paid_count || 0), Number(pixPaidRow.paid_count || 0));
        const monthlyConfirmedRevenueCents = Math.max(Number(dnaPaidRow.revenue_cents || 0), Number(pixPaidRow.gross_customer_cents || 0));

        // 12-13. Comissões a pagar e programadas para o mês seguinte
        const financeOverview = CommissionFinance.getCommissionFinanceOverview(db, { competenceMonth: curYM });
        const nextPayoutForecast = CommissionFinance.getNextPayoutForecast(db, { competenceMonth: curYM });

        // 14. Repasses de oficinas pendentes
        const workshopPayoutsPendingCents = financeOverview.workshop_payouts.pending_cents;

        // 15. Taxas por atendimento confirmadas
        const attFeeRow = db.prepare(`
            SELECT
                COUNT(*) as total_count,
                COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN amount_cents ELSE 0 END), 0) as confirmed_cents,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount_cents ELSE 0 END), 0) as pending_cents
            FROM workshop_attendance_fees
            WHERE ${feePeriod.sql}
        `).get(...feePeriod.params);

        // 16. Atendimentos realizados no período/mês (service_records + appointments COMPLETED sem dupla contagem)
        const srvCountRow = db.prepare(`
            SELECT
                COUNT(*) as services_count,
                COUNT(CASE WHEN proof_level = 4 THEN 1 END) as proven_services_count,
                COALESCE(SUM(total_cost_cents), 0) as mechanical_volume_cents
            FROM service_records
            WHERE ${srvPeriod.sql}
        `).get(...srvPeriod.params);

        const completedAppCount = db.prepare(`
            SELECT COUNT(*) as cnt
            FROM workshop_appointments
            WHERE status = 'COMPLETED' AND ${appPeriod.sql}
        `).get(...appPeriod.params).cnt;

        const monthlyAttendancesCount = Math.max(Number(srvCountRow.services_count || 0), Number(completedAppCount || 0));

        // Suporte e alertas
        const openTicketsCount = db.prepare(`SELECT COUNT(*) as cnt FROM support_tickets WHERE status IN ('OPEN', 'IN_PROGRESS')`).get().cnt;
        const activeReferralsCount = db.prepare(`SELECT COUNT(*) as cnt FROM workshop_referrals WHERE status = 'ACTIVE' AND datetime(valid_until) >= datetime('now')`).get().cnt;

        // Metas globais configuradas
        const settingsRows = db.prepare(`SELECT key, value FROM admin_system_settings`).all();
        const settingsMap = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));

        return {
            period: {
                key: period,
                month: curYM,
                label: dnaPeriod.label,
                payout_month: nextPayoutForecast.payout_month,
                scheduled_payout_date: nextPayoutForecast.scheduled_payout_date
            },
            cards: {
                // 16 cards exatos da Fase 3
                total_representatives: Number(repRow.total || 0),
                active_representatives: Number(repRow.active || 0),
                pending_representatives: Number(repRow.pending || 0),
                total_workshops: Number(wsRow.total || 0),
                active_workshops: Number(wsRow.active || 0),
                pending_workshops: Number(wsRow.pending || 0),
                unique_clients: uniqueClients,
                total_vehicles: Number(vehRow.total_vehicles || 0),
                active_dna_vehicles: Number(vehRow.active_dna_vehicles || 0),
                monthly_paid_registrations: monthlyPaidRegistrations,
                monthly_confirmed_revenue_cents: monthlyConfirmedRevenueCents,
                rep_commissions_payable_cents: financeOverview.commissions.eligible_balance_cents,
                rep_commissions_next_month_cents: nextPayoutForecast.summary.next_payout_net_cents,
                workshop_payouts_pending_cents: workshopPayoutsPendingCents,
                attendance_fees_confirmed_cents: Number(attFeeRow.confirmed_cents || 0),
                monthly_attendances_count: monthlyAttendancesCount
            },
            supplementary: {
                suspended_representatives: Number(repRow.suspended || 0),
                rejected_representatives: Number(repRow.rejected || 0),
                suspended_workshops: Number(wsRow.suspended || 0),
                states_covered: Number(wsRow.states_count || 0),
                cities_covered: Number(wsRow.cities_count || 0),
                vehicles_without_dna: Math.max(0, Number(vehRow.total_vehicles || 0) - Number(vehRow.active_dna_vehicles || 0)),
                rep_commissions_projected_cents: financeOverview.commissions.projected_cents,
                rep_commissions_paid_cents: financeOverview.commissions.paid_cents,
                rep_commissions_refunded_cents: financeOverview.commissions.refunded_cents,
                rep_commissions_overdue_cents: financeOverview.commissions.overdue_cents,
                rep_commissions_blocked_cents: financeOverview.commissions.blocked_dispute_cents,
                mechanical_services_volume_cents: Number(srvCountRow.mechanical_volume_cents || 0),
                proven_services_count: Number(srvCountRow.proven_services_count || 0),
                attendance_fees_count: Number(attFeeRow.total_count || 0),
                open_support_tickets: Number(openTicketsCount || 0),
                active_referrals: Number(activeReferralsCount || 0),
                goals: {
                    monthly_workshops_goal: Number(settingsMap.global_monthly_workshops_goal || 50),
                    monthly_activations_goal: Number(settingsMap.global_monthly_activations_goal || 500),
                    monthly_revenue_goal_cents: Number(settingsMap.global_monthly_revenue_goal_cents || 2495000)
                }
            },
            generated_at: new Date().toISOString()
        };
    });

    return data;
}

/**
 * FASE 3: Séries temporais e distribuições para todos os 8 gráficos do Dashboard Executivo.
 */
function getDashboardTimeseries(db, { months = 6 } = {}) {
    const safeMonths = Math.max(3, Math.min(24, parseInt(months, 10) || 6));
    const cacheKey = `dashboard:timeseries:${safeMonths}`;

    const { data } = getCachedOrCompute(cacheKey, 20000, () => {
        const now = new Date();
        const ymList = [];
        for (let i = safeMonths - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            ymList.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
        }

        // 1, 2, 3, 6: Evolução mensal (cadastros, faturamento, crescimento oficinas, comissões por competência)
        const registrationsByMonth = [];
        const revenueByMonth = [];
        const workshopsGrowthByMonth = [];
        const commissionsByCompetence = [];

        let cumulativeWorkshopsBefore = db.prepare(`
            SELECT COUNT(*) as cnt FROM workshops WHERE strftime('%Y-%m', created_at) < ?
        `).get(ymList[0]).cnt;

        for (const ym of ymList) {
            const actRow = db.prepare(`
                SELECT
                    COUNT(*) as total_activations,
                    COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as paid_activations,
                    COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount_paid_cents ELSE 0 END), 0) as dna_revenue_cents
                FROM dna_activations
                WHERE strftime('%Y-%m', activated_at) = ?
            `).get(ym);

            const pixRow = db.prepare(`
                SELECT
                    COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_pix_count,
                    COALESCE(SUM(CASE WHEN status = 'PAID' THEN customer_price_cents ELSE 0 END), 0) as pix_gross_cents,
                    COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents ELSE 0 END), 0) as pix_platform_cents
                FROM workshop_pix_charges
                WHERE strftime('%Y-%m', COALESCE(paid_at, created_at)) = ?
            `).get(ym);

            const clientActCount = db.prepare(`
                SELECT COUNT(*) as cnt FROM client_activations WHERE strftime('%Y-%m', created_at) = ?
            `).get(ym).cnt;

            const wsNew = db.prepare(`
                SELECT COUNT(*) as cnt FROM workshops WHERE strftime('%Y-%m', created_at) = ?
            `).get(ym).cnt;
            cumulativeWorkshopsBefore += Number(wsNew || 0);

            const commRow = db.prepare(`
                SELECT
                    COALESCE(SUM(CASE WHEN status = 'PROJECTED' THEN commission_amount_cents ELSE 0 END), 0) as projected_cents,
                    COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN commission_amount_cents ELSE 0 END), 0) as confirmed_cents,
                    COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount_cents ELSE 0 END), 0) as paid_cents,
                    COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_cents
                FROM representative_commissions
                WHERE COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) = ?
            `).get(ym);

            const feeCents = db.prepare(`
                SELECT COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN amount_cents ELSE 0 END), 0) as total
                FROM workshop_attendance_fees
                WHERE strftime('%Y-%m', created_at) = ?
            `).get(ym).total;

            registrationsByMonth.push({
                month: ym,
                client_activations: Number(clientActCount || 0),
                paid_registrations: Math.max(Number(actRow.paid_activations || 0), Number(pixRow.paid_pix_count || 0)),
                total_activations: Number(actRow.total_activations || 0)
            });

            revenueByMonth.push({
                month: ym,
                confirmed_revenue_cents: Math.max(Number(actRow.dna_revenue_cents || 0), Number(pixRow.pix_gross_cents || 0)),
                platform_received_cents: Number(pixRow.pix_platform_cents || 0),
                attendance_fees_cents: Number(feeCents || 0)
            });

            workshopsGrowthByMonth.push({
                month: ym,
                new_workshops: Number(wsNew || 0),
                cumulative_workshops: cumulativeWorkshopsBefore
            });

            commissionsByCompetence.push({
                competence_month: ym,
                projected_cents: Number(commRow.projected_cents || 0),
                confirmed_cents: Number(commRow.confirmed_cents || 0),
                paid_cents: Number(commRow.paid_cents || 0),
                refunded_cents: Number(commRow.refunded_cents || 0)
            });
        }

        // 4. Representantes com maior captação (oficinas vinculadas)
        const topRepresentativesByWorkshops = db.prepare(`
            SELECT
                r.id, r.rep_code, r.name, r.state, r.status,
                (SELECT COUNT(*) FROM workshop_referrals wr WHERE wr.representative_id = r.id) as linked_workshops,
                (SELECT COUNT(*) FROM workshop_referrals wr JOIN workshops w ON wr.workshop_id = w.id WHERE wr.representative_id = r.id AND w.status IN ('APPROVED', 'ACTIVE')) as active_workshops
            FROM representatives r
            ORDER BY linked_workshops DESC, active_workshops DESC, r.name ASC
            LIMIT 10
        `).all();

        // 5. Cadastros pagos por representante
        const paidRegistrationsByRep = db.prepare(`
            SELECT
                r.id, r.rep_code, r.name,
                COUNT(CASE WHEN rc.status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_registrations,
                COALESCE(SUM(CASE WHEN rc.status IN ('CONFIRMED', 'PAID') THEN rc.commission_amount_cents ELSE 0 END), 0) as confirmed_commissions_cents
            FROM representatives r
            LEFT JOIN representative_commissions rc ON rc.representative_id = r.id
            GROUP BY r.id
            ORDER BY paid_registrations DESC, confirmed_commissions_cents DESC, r.name ASC
            LIMIT 10
        `).all();

        // 7. Distribuição geográfica de oficinas
        const workshopsByState = db.prepare(`
            SELECT
                COALESCE(NULLIF(UPPER(TRIM(state)), ''), 'N/I') as state,
                COUNT(*) as total_workshops,
                COUNT(CASE WHEN status IN ('APPROVED', 'ACTIVE') THEN 1 END) as active_workshops
            FROM workshops
            GROUP BY COALESCE(NULLIF(UPPER(TRIM(state)), ''), 'N/I')
            ORDER BY total_workshops DESC, state ASC
        `).all();

        // 8. Cadastros por origem (Indicação Representante vs Direto Oficina vs App Cliente/Orgânico)
        const refPaidCount = db.prepare(`
            SELECT COUNT(*) as cnt FROM dna_activations da
            WHERE da.workshop_id IN (SELECT workshop_id FROM workshop_referrals)
        `).get().cnt;
        const directWorkshopActCount = db.prepare(`
            SELECT COUNT(*) as cnt FROM dna_activations da
            WHERE da.workshop_id IS NOT NULL AND da.workshop_id NOT IN (SELECT workshop_id FROM workshop_referrals)
        `).get().cnt;
        const directClientCount = db.prepare(`
            SELECT COUNT(*) as cnt FROM vehicle_dna vd
            WHERE vd.activated_by_workshop_id IS NULL
        `).get().cnt;

        const registrationsByOrigin = [
            { origin: 'REPRESENTATIVE_REFERRAL', label: 'Oficina via Representante', count: Number(refPaidCount || 0) },
            { origin: 'DIRECT_WORKSHOP', label: 'Oficina Direta', count: Number(directWorkshopActCount || 0) },
            { origin: 'ORGANIC_CLIENT', label: 'App Cliente / Orgânico', count: Number(directClientCount || 0) }
        ];

        return {
            months: safeMonths,
            registrations_by_month: registrationsByMonth,
            revenue_by_month: revenueByMonth,
            workshops_growth_by_month: workshopsGrowthByMonth,
            top_representatives_by_workshops: topRepresentativesByWorkshops,
            paid_registrations_by_rep: paidRegistrationsByRep,
            commissions_by_competence: commissionsByCompetence,
            workshops_by_state: workshopsByState,
            registrations_by_origin: registrationsByOrigin,
            generated_at: new Date().toISOString()
        };
    });

    return data;
}

/**
 * FASE 4: Listagem completa de Representantes Comerciais com busca, filtros, paginação e ordenação.
 */
function getRepresentativesSummary(db, query = {}) {
    const q = String(query.q || query.search || '').trim();
    const status = String(query.status || 'ALL').toUpperCase();
    const state = String(query.state || '').trim().toUpperCase();
    const city = String(query.city || '').trim();
    const period = String(query.period || 'all').toLowerCase();
    const productivity = String(query.productivity || 'ALL').toUpperCase();
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(200, parseInt(query.page_size || query.limit, 10) || 25));

    const where = ['1=1'];
    const params = [];

    if (q) {
        where.push(`(UPPER(r.rep_code) LIKE ? OR unaccent(r.name) LIKE unaccent(?) OR LOWER(r.email) LIKE ? OR r.phone LIKE ? OR unaccent(r.city) LIKE unaccent(?))`);
        const likeQ = `%${q}%`;
        params.push(likeQ.toUpperCase(), likeQ, likeQ.toLowerCase(), likeQ, likeQ);
    }
    if (status && status !== 'ALL') {
        const mappedStatus = status === 'PENDING' ? 'PENDING_APPROVAL' : status;
        where.push(`r.status = ?`);
        params.push(mappedStatus);
    }
    if (state && state !== 'ALL') {
        where.push(`UPPER(r.state) = ?`);
        params.push(state);
    }
    if (city) {
        where.push(`unaccent(r.city) LIKE unaccent(?)`);
        params.push(`%${city}%`);
    }
    if (period && period !== 'all') {
        const pf = buildPeriodClause('r.created_at', period, query.month);
        where.push(pf.sql);
        params.push(...pf.params);
    }

    const curYM = CommissionFinance.isValidYM(query.month) ? query.month : CommissionFinance.getCurrentYM();
    const { offsetMonths, payoutDay } = CommissionFinance.getPayoutConfig(db);
    const payoutMonth = CommissionFinance.computePayoutMonth(curYM, offsetMonths);
    const scheduledDate = CommissionFinance.computeScheduledPayoutDate(payoutMonth, payoutDay);

    // Consulta base sem duplicidade usando subqueries correlacionadas independentes
    const rows = db.prepare(`
        SELECT
            r.id, r.user_id, r.rep_code, r.name, r.cpf_cnpj, r.email, r.phone,
            r.city, r.state, r.pix_key, r.experience, r.status,
            r.max_workshops_limit, r.monthly_goal_workshops, r.monthly_goal_activations,
            r.links_shared_count, r.training_completed, r.created_at, r.updated_at,

            (SELECT COUNT(*) FROM workshop_referrals wr WHERE wr.representative_id = r.id) as linked_workshops_count,
            (SELECT COUNT(*) FROM workshop_referrals wr JOIN workshops w ON wr.workshop_id = w.id
             WHERE wr.representative_id = r.id AND wr.status = 'ACTIVE' AND w.status IN ('APPROVED', 'ACTIVE')) as active_workshops_count,

            (SELECT COUNT(DISTINCT COALESCE(ca.owner_id, LOWER(COALESCE(NULLIF(TRIM(ca.email), ''), NULLIF(TRIM(ca.whatsapp), ''), ca.client_name))))
             FROM client_activations ca
             WHERE ca.workshop_id IN (SELECT wr2.workshop_id FROM workshop_referrals wr2 WHERE wr2.representative_id = r.id)) as clients_registered_count,

            (SELECT COUNT(*) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status IN ('CONFIRMED', 'PAID')) as paid_registrations_count,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status = 'PROJECTED') as projected_commissions_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status IN ('CONFIRMED', 'PAID')) as confirmed_commissions_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status = 'PAID') as paid_commissions_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status = 'REFUNDED') as refunded_commissions_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status = 'CONFIRMED' AND COALESCE(rc.dispute_status, 'NONE') = 'NONE') as pending_balance_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = r.id AND rc.status = 'CONFIRMED' AND COALESCE(rc.dispute_status, 'NONE') = 'NONE'
               AND COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?) as next_payout_gross_cents,

            (SELECT COALESCE(SUM(fa.amount_cents), 0) FROM financial_adjustments fa
             WHERE fa.representative_id = r.id AND fa.status = 'OPEN') as open_adjustments_cents
        FROM representatives r
        WHERE ${where.join(' AND ')}
    `).all(curYM, ...params);

    // Enriquecimento e filtro de produtividade
    let enriched = rows.map(r => {
        const pendingBalance = Math.max(0, Number(r.pending_balance_cents || 0) + Number(r.open_adjustments_cents || 0));
        const nextPayout = Math.max(0, Number(r.next_payout_gross_cents || 0) + Number(r.open_adjustments_cents || 0));
        return {
            id: r.id,
            rep_code: r.rep_code,
            name: r.name,
            cpf_cnpj_masked: maskDocument(r.cpf_cnpj),
            email: r.email,
            phone: r.phone,
            city: r.city,
            state: r.state,
            pix_key_masked: maskPixKey(r.pix_key),
            status: r.status,
            created_at: r.created_at,
            max_workshops_limit: Number(r.max_workshops_limit || 15),
            monthly_goal_workshops: Number(r.monthly_goal_workshops || 5),
            monthly_goal_activations: Number(r.monthly_goal_activations || 220),
            linked_workshops_count: Number(r.linked_workshops_count || 0),
            active_workshops_count: Number(r.active_workshops_count || 0),
            clients_registered_count: Number(r.clients_registered_count || 0),
            paid_registrations_count: Number(r.paid_registrations_count || 0),
            projected_commissions_cents: Number(r.projected_commissions_cents || 0),
            confirmed_commissions_cents: Number(r.confirmed_commissions_cents || 0),
            paid_commissions_cents: Number(r.paid_commissions_cents || 0),
            refunded_commissions_cents: Number(r.refunded_commissions_cents || 0),
            pending_balance_cents: pendingBalance,
            next_payout_cents: nextPayout,
            next_payout_month: payoutMonth,
            scheduled_payout_date: scheduledDate
        };
    });

    if (productivity === 'HIGH') {
        enriched = enriched.filter(r => r.paid_registrations_count >= 10 || r.active_workshops_count >= 3);
    } else if (productivity === 'WITH_SALES') {
        enriched = enriched.filter(r => r.paid_registrations_count > 0);
    } else if (productivity === 'ZERO_SALES') {
        enriched = enriched.filter(r => r.paid_registrations_count === 0);
    }

    // Ordenação por whitelist segura
    const sortBy = String(query.sort_by || 'created_at');
    const sortDir = String(query.sort_dir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const numericSortFields = new Set([
        'linked_workshops_count', 'active_workshops_count', 'clients_registered_count',
        'paid_registrations_count', 'projected_commissions_cents', 'confirmed_commissions_cents',
        'paid_commissions_cents', 'pending_balance_cents', 'next_payout_cents'
    ]);

    enriched.sort((a, b) => {
        // Pendentes de aprovação sobem por padrão quando sem ordenação explícita
        if (!query.sort_by) {
            const pa = a.status === 'PENDING_APPROVAL' ? 0 : 1;
            const pb = b.status === 'PENDING_APPROVAL' ? 0 : 1;
            if (pa !== pb) return pa - pb;
        }
        if (numericSortFields.has(sortBy)) {
            return (Number(a[sortBy] || 0) - Number(b[sortBy] || 0)) * sortDir;
        }
        if (['rep_code', 'name', 'city', 'state', 'status', 'created_at'].includes(sortBy)) {
            return String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) * sortDir;
        }
        return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });

    const total = enriched.length;
    const offset = (page - 1) * pageSize;
    const items = enriched.slice(offset, offset + pageSize);

    // Filtros disponíveis (estados e cidades reais)
    const statesAvailable = db.prepare(`SELECT DISTINCT UPPER(state) as state FROM representatives WHERE state IS NOT NULL AND TRIM(state) != '' ORDER BY state ASC`).all().map(r => r.state);
    const statusCounts = db.prepare(`
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as suspended,
            COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected
        FROM representatives
    `).get();

    return {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
        counts: statusCounts,
        states_available: statesAvailable,
        items,
        generated_at: new Date().toISOString()
    };
}

/**
 * FASE 4: Página Individual do Representante (7 blocos completos).
 */
function getRepresentativeOverview(db, repIdOrCode) {
    const rep = db.prepare(`
        SELECT * FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)
    `).get(repIdOrCode, repIdOrCode);
    if (!rep) return null;

    const curYM = CommissionFinance.getCurrentYM();
    const { offsetMonths, payoutDay } = CommissionFinance.getPayoutConfig(db);
    const payoutMonth = CommissionFinance.computePayoutMonth(curYM, offsetMonths);
    const scheduledDate = CommissionFinance.computeScheduledPayoutDate(payoutMonth, payoutDay);

    const workshops = getRepresentativeWorkshops(db, rep.id);
    const clients = getRepresentativeClients(db, rep.id);
    const commissions = getRepresentativeCommissions(db, rep.id, { pageSize: 100 });
    const payouts = getRepresentativePayouts(db, rep.id);

    // Produtividade mensal (últimos 6 meses)
    const now = new Date();
    const monthlyPerformance = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const wsCount = db.prepare(`SELECT COUNT(*) as cnt FROM workshop_referrals WHERE representative_id = ? AND strftime('%Y-%m', linked_at) = ?`).get(rep.id, ym).cnt;
        const commRow = db.prepare(`
            SELECT
                COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_regs,
                COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as confirmed_cents,
                COALESCE(SUM(CASE WHEN status = 'PROJECTED' THEN commission_amount_cents ELSE 0 END), 0) as projected_cents,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount_cents ELSE 0 END), 0) as paid_cents,
                COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_cents
            FROM representative_commissions
            WHERE representative_id = ?
              AND COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) = ?
        `).get(rep.id, ym);

        monthlyPerformance.push({
            month: ym,
            workshops_linked: Number(wsCount || 0),
            paid_registrations: Number(commRow.paid_regs || 0),
            confirmed_cents: Number(commRow.confirmed_cents || 0),
            projected_cents: Number(commRow.projected_cents || 0),
            paid_cents: Number(commRow.paid_cents || 0),
            refunded_cents: Number(commRow.refunded_cents || 0)
        });
    }

    const finTotals = db.prepare(`
        SELECT
            COALESCE(SUM(CASE WHEN status = 'PROJECTED' THEN commission_amount_cents ELSE 0 END), 0) as projected_cents,
            COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as confirmed_total_cents,
            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' THEN commission_amount_cents ELSE 0 END), 0) as eligible_open_cents,
            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'DISPUTED' THEN commission_amount_cents ELSE 0 END), 0) as blocked_dispute_cents,
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount_cents ELSE 0 END), 0) as paid_cents,
            COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_cents,
            COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as paid_registrations_count
        FROM representative_commissions
        WHERE representative_id = ?
    `).get(rep.id);

    const openAdjCents = db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total FROM financial_adjustments WHERE representative_id = ? AND status = 'OPEN'
    `).get(rep.id).total;

    const forecast = CommissionFinance.getNextPayoutForecast(db, { competenceMonth: curYM, representativeId: rep.id });
    const nextRepForecast = forecast.representatives[0] || null;

    const auditHistory = db.prepare(`
        SELECT * FROM representative_audit_logs
        WHERE representative_id = ?
        ORDER BY created_at DESC
        LIMIT 80
    `).all(rep.id).map(l => ({
        ...l,
        metadata: (() => { try { return l.metadata_json ? JSON.parse(l.metadata_json) : {}; } catch (_) { return {}; } })()
    }));

    return {
        personal_data: {
            id: rep.id,
            rep_code: rep.rep_code,
            name: rep.name,
            cpf_cnpj_masked: maskDocument(rep.cpf_cnpj),
            email: rep.email,
            phone: rep.phone,
            city: rep.city,
            state: rep.state,
            pix_key_masked: maskPixKey(rep.pix_key),
            has_pix_key: Boolean(rep.pix_key && String(rep.pix_key).trim()),
            experience: rep.experience,
            status: rep.status,
            max_workshops_limit: Number(rep.max_workshops_limit || 15),
            monthly_goal_workshops: Number(rep.monthly_goal_workshops || 5),
            monthly_goal_activations: Number(rep.monthly_goal_activations || 220),
            links_shared_count: Number(rep.links_shared_count || 0),
            training_completed: Boolean(rep.training_completed),
            created_at: rep.created_at,
            updated_at: rep.updated_at,
            privacy_notice: 'CPF/CNPJ e Chave PIX exibidos parcialmente mascarados conforme boas práticas LGPD.'
        },
        portfolio: {
            total_workshops: workshops.length,
            active_workshops: workshops.filter(w => w.workshop_status === 'APPROVED' || w.workshop_status === 'ACTIVE').length,
            max_limit: Number(rep.max_workshops_limit || 15),
            workshops
        },
        clients_acquired: {
            unique_clients_count: clients.unique_clients_count,
            total_activations_count: clients.total_activations_count,
            paid_activations_count: clients.paid_activations_count,
            by_workshop: clients.by_workshop
        },
        productivity: {
            monthly_performance: monthlyPerformance
        },
        financial: {
            projected_cents: Number(finTotals.projected_cents || 0),
            confirmed_total_cents: Number(finTotals.confirmed_total_cents || 0),
            eligible_open_cents: Number(finTotals.eligible_open_cents || 0),
            blocked_dispute_cents: Number(finTotals.blocked_dispute_cents || 0),
            paid_cents: Number(finTotals.paid_cents || 0),
            refunded_cents: Number(finTotals.refunded_cents || 0),
            open_adjustments_cents: Number(openAdjCents || 0),
            pending_net_balance_cents: Math.max(0, Number(finTotals.eligible_open_cents || 0) + Number(openAdjCents || 0)),
            paid_registrations_count: Number(finTotals.paid_registrations_count || 0),
            commissions: commissions.items
        },
        next_payout: {
            competence_month: curYM,
            payout_month: payoutMonth,
            scheduled_payout_date: scheduledDate,
            eligible_commissions_count: nextRepForecast ? nextRepForecast.eligible_commissions_count : 0,
            eligible_gross_cents: nextRepForecast ? nextRepForecast.eligible_gross_cents : 0,
            adjustments_cents: nextRepForecast ? nextRepForecast.adjustments_cents : 0,
            net_eligible_cents: nextRepForecast ? nextRepForecast.next_payout_net_cents : 0,
            projected_excluded_cents: nextRepForecast ? nextRepForecast.projected_cents : 0,
            batch_id: nextRepForecast ? nextRepForecast.batch_id : null,
            batch_status: nextRepForecast ? nextRepForecast.batch_status : 'OPEN_FORECAST'
        },
        payouts: payouts.batches,
        history: auditHistory,
        generated_at: new Date().toISOString()
    };
}

function getRepresentativeWorkshops(db, repIdOrCode) {
    const rep = db.prepare(`SELECT id FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(repIdOrCode, repIdOrCode);
    if (!rep) return [];

    return db.prepare(`
        SELECT
            wr.id as referral_id, wr.workshop_id, wr.rep_code, wr.origin_channel,
            wr.linked_at, wr.valid_until, wr.status as referral_status, wr.justification,
            w.trade_name, w.company_name, w.cnpj, w.phone, w.email, w.city, w.state,
            w.status as workshop_status, w.created_at as workshop_created_at,

            (SELECT COUNT(DISTINCT COALESCE(ca.owner_id, LOWER(COALESCE(NULLIF(TRIM(ca.email), ''), NULLIF(TRIM(ca.whatsapp), ''), ca.client_name))))
             FROM client_activations ca WHERE ca.workshop_id = w.id) as unique_clients_count,

            (SELECT COUNT(DISTINCT v.id) FROM vehicles v
             WHERE v.id IN (
                 SELECT vehicle_id FROM vehicle_dna WHERE activated_by_workshop_id = w.id
                 UNION SELECT vehicle_id FROM client_activations WHERE workshop_id = w.id AND vehicle_id IS NOT NULL
                 UNION SELECT vehicle_id FROM service_records WHERE workshop_id = w.id
             )) as vehicles_count,

            (SELECT COUNT(*) FROM representative_commissions rc
             WHERE rc.representative_id = wr.representative_id AND rc.workshop_id = w.id AND rc.status IN ('CONFIRMED', 'PAID')) as paid_registrations_count,

            (SELECT COUNT(*) FROM representative_commissions rc
             WHERE rc.representative_id = wr.representative_id AND rc.workshop_id = w.id AND rc.status = 'PROJECTED') as projected_registrations_count,

            (SELECT COALESCE(SUM(rc.registration_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = wr.representative_id AND rc.workshop_id = w.id AND rc.status IN ('CONFIRMED', 'PAID')) as attributed_revenue_cents,

            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.representative_id = wr.representative_id AND rc.workshop_id = w.id AND rc.status IN ('CONFIRMED', 'PAID')) as confirmed_commissions_cents
        FROM workshop_referrals wr
        JOIN workshops w ON wr.workshop_id = w.id
        WHERE wr.representative_id = ?
        ORDER BY wr.linked_at DESC
    `).all(rep.id);
}

function getRepresentativeClients(db, repIdOrCode) {
    const rep = db.prepare(`SELECT id FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(repIdOrCode, repIdOrCode);
    if (!rep) return { unique_clients_count: 0, total_activations_count: 0, paid_activations_count: 0, by_workshop: [], items: [] };

    const byWorkshop = db.prepare(`
        SELECT
            w.id as workshop_id, w.trade_name, w.city, w.state,
            COUNT(ca.id) as total_activations_count,
            COUNT(DISTINCT COALESCE(ca.owner_id, LOWER(COALESCE(NULLIF(TRIM(ca.email), ''), NULLIF(TRIM(ca.whatsapp), ''), ca.client_name)))) as unique_clients_count,
            (SELECT COUNT(*) FROM representative_commissions rc
             WHERE rc.representative_id = wr.representative_id AND rc.workshop_id = w.id AND rc.status IN ('CONFIRMED', 'PAID')) as paid_activations_count
        FROM workshop_referrals wr
        JOIN workshops w ON wr.workshop_id = w.id
        LEFT JOIN client_activations ca ON ca.workshop_id = w.id
        WHERE wr.representative_id = ?
        GROUP BY w.id
        ORDER BY paid_activations_count DESC, unique_clients_count DESC
    `).all(rep.id);

    const uniqueGlobal = db.prepare(`
        SELECT COUNT(DISTINCT COALESCE(ca.owner_id, LOWER(COALESCE(NULLIF(TRIM(ca.email), ''), NULLIF(TRIM(ca.whatsapp), ''), ca.client_name)))) as cnt,
               COUNT(ca.id) as total_acts
        FROM client_activations ca
        WHERE ca.workshop_id IN (SELECT workshop_id FROM workshop_referrals WHERE representative_id = ?)
    `).get(rep.id);

    const paidTotal = db.prepare(`
        SELECT COUNT(*) as cnt FROM representative_commissions
        WHERE representative_id = ? AND status IN ('CONFIRMED', 'PAID')
    `).get(rep.id).cnt;

    const recentActivations = db.prepare(`
        SELECT
            ca.id, ca.workshop_id, w.trade_name as workshop_name,
            ca.client_name, ca.license_plate, ca.activation_code,
            ca.status as activation_status, ca.billing_status, ca.created_at,
            v.brand, v.model
        FROM client_activations ca
        JOIN workshops w ON ca.workshop_id = w.id
        LEFT JOIN vehicles v ON v.id = ca.vehicle_id
        WHERE ca.workshop_id IN (SELECT workshop_id FROM workshop_referrals WHERE representative_id = ?)
        ORDER BY ca.created_at DESC
        LIMIT 100
    `).all(rep.id);

    return {
        unique_clients_count: Number(uniqueGlobal.cnt || 0),
        total_activations_count: Number(uniqueGlobal.total_acts || 0),
        paid_activations_count: Number(paidTotal || 0),
        by_workshop: byWorkshop,
        items: recentActivations
    };
}

function getRepresentativeCommissions(db, repIdOrCode, { status = null, competenceMonth = null, page = 1, pageSize = 50 } = {}) {
    const rep = db.prepare(`SELECT id FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(repIdOrCode, repIdOrCode);
    if (!rep) return { page: 1, page_size: pageSize, total: 0, items: [] };

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeSize = Math.max(1, Math.min(200, parseInt(pageSize, 10) || 50));
    const offset = (safePage - 1) * safeSize;

    const where = ['rc.representative_id = ?'];
    const params = [rep.id];
    if (status && ['PROJECTED', 'CONFIRMED', 'PAID', 'REFUNDED'].includes(String(status).toUpperCase())) {
        where.push('rc.status = ?');
        params.push(String(status).toUpperCase());
    }
    if (competenceMonth && CommissionFinance.isValidYM(competenceMonth)) {
        where.push(`COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?`);
        params.push(competenceMonth);
    }

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM representative_commissions rc WHERE ${where.join(' AND ')}`).get(...params).cnt;
    const items = db.prepare(`
        SELECT rc.*, w.trade_name as workshop_name, w.cnpj as workshop_cnpj,
               v.license_plate, v.brand as vehicle_brand, v.model as vehicle_model,
               pc.status as payment_status, pc.paid_at as payment_paid_at,
               cp.version_code as policy_version_code
        FROM representative_commissions rc
        JOIN workshops w ON rc.workshop_id = w.id
        LEFT JOIN vehicles v ON v.id = rc.vehicle_id
        LEFT JOIN workshop_pix_charges pc ON pc.id = rc.source_payment_id
        LEFT JOIN commercial_policies cp ON cp.id = rc.policy_id
        WHERE ${where.join(' AND ')}
        ORDER BY rc.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, safeSize, offset);

    return {
        page: safePage,
        page_size: safeSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / safeSize)),
        items
    };
}

function getRepresentativePayouts(db, repIdOrCode) {
    const rep = db.prepare(`SELECT id FROM representatives WHERE id = ? OR UPPER(rep_code) = UPPER(?)`).get(repIdOrCode, repIdOrCode);
    if (!rep) return { batches: [], adjustments: [] };

    const history = CommissionFinance.getPayoutHistory(db, { representativeId: rep.id, pageSize: 50 });
    const adjustments = db.prepare(`
        SELECT * FROM financial_adjustments WHERE representative_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(rep.id);

    return {
        batches: history.batches,
        adjustments
    };
}

/**
 * FASE 5: Carteira de Oficinas com cadeia completa REPRESENTANTE -> OFICINA -> CLIENTE -> PAGAMENTO -> COMISSÃO.
 * Sem duplicação por JOINs e sem contar o mesmo cliente múltiplas vezes.
 */
function getWorkshopsSummary(db, query = {}) {
    const q = String(query.q || query.search || '').trim();
    const status = String(query.status || 'ALL').toUpperCase();
    const state = String(query.state || '').trim().toUpperCase();
    const repId = String(query.representative_id || '').trim();
    const referralFilter = String(query.referral || 'ALL').toUpperCase(); // ALL, LINKED, DIRECT
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(200, parseInt(query.page_size || query.limit, 10) || 25));
    const offset = (page - 1) * pageSize;

    const where = ['1=1'];
    const params = [];

    if (q) {
        where.push(`(unaccent(w.trade_name) LIKE unaccent(?) OR unaccent(w.company_name) LIKE unaccent(?) OR w.cnpj LIKE ? OR unaccent(w.city) LIKE unaccent(?) OR UPPER(COALESCE(wr.rep_code, '')) LIKE ?)`);
        const likeQ = `%${q}%`;
        params.push(likeQ, likeQ, likeQ, likeQ, likeQ.toUpperCase());
    }
    if (status && status !== 'ALL') {
        where.push(`w.status = ?`);
        params.push(status);
    }
    if (state && state !== 'ALL') {
        where.push(`UPPER(w.state) = ?`);
        params.push(state);
    }
    if (repId) {
        where.push(`wr.representative_id = ?`);
        params.push(repId);
    }
    if (referralFilter === 'LINKED') {
        where.push(`wr.id IS NOT NULL`);
    } else if (referralFilter === 'DIRECT') {
        where.push(`wr.id IS NULL`);
    }

    const whereSql = where.join(' AND ');
    const total = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM workshops w
        LEFT JOIN workshop_referrals wr ON wr.workshop_id = w.id
        WHERE ${whereSql}
    `).get(...params).cnt;

    const rows = db.prepare(`
        SELECT
            w.id, w.company_name, w.trade_name, w.cnpj, w.city, w.state, w.phone, w.email,
            w.status, w.verified_badge, w.created_at,
            wr.id as referral_id, wr.representative_id, wr.rep_code, wr.origin_channel,
            wr.linked_at as referral_linked_at, wr.valid_until as referral_valid_until, wr.status as referral_status,
            r.name as representative_name,

            -- Clientes únicos (não conta mesmo cliente várias vezes se tiver múltiplos veículos)
            (SELECT COUNT(DISTINCT client_key) FROM (
                SELECT ${UNIQUE_CLIENT_KEY_SQL} as client_key
                FROM owners o
                WHERE o.id IN (
                    SELECT DISTINCT v.current_owner_id FROM vehicles v
                    WHERE v.current_owner_id IS NOT NULL AND v.id IN (
                        SELECT vehicle_id FROM vehicle_dna WHERE activated_by_workshop_id = w.id
                        UNION SELECT vehicle_id FROM client_activations WHERE workshop_id = w.id AND vehicle_id IS NOT NULL
                        UNION SELECT vehicle_id FROM service_records WHERE workshop_id = w.id
                    )
                    UNION SELECT DISTINCT ca.owner_id FROM client_activations ca WHERE ca.workshop_id = w.id AND ca.owner_id IS NOT NULL
                    UNION SELECT DISTINCT ot.new_owner_id FROM ownership_transfers ot
                          WHERE ot.status = 'COMPLETED' AND ot.new_owner_id IS NOT NULL AND ot.vehicle_id IN (
                              SELECT vehicle_id FROM vehicle_dna WHERE activated_by_workshop_id = w.id
                              UNION SELECT vehicle_id FROM service_records WHERE workshop_id = w.id
                          )
                )
                UNION
                SELECT 'ca:' || LOWER(COALESCE(NULLIF(TRIM(ca2.email), ''), NULLIF(TRIM(ca2.whatsapp), ''), ca2.client_name)) as client_key
                FROM client_activations ca2
                WHERE ca2.workshop_id = w.id AND ca2.owner_id IS NULL
            )) as unique_clients_count,

            -- Veículos cadastrados/atendidos
            (SELECT COUNT(DISTINCT v.id) FROM vehicles v WHERE v.id IN (
                SELECT vehicle_id FROM vehicle_dna WHERE activated_by_workshop_id = w.id
                UNION SELECT vehicle_id FROM client_activations WHERE workshop_id = w.id AND vehicle_id IS NOT NULL
                UNION SELECT vehicle_id FROM service_records WHERE workshop_id = w.id
            )) as vehicles_count,

            -- Ativações DNA ativas
            (SELECT COUNT(*) FROM vehicle_dna vd WHERE vd.activated_by_workshop_id = w.id AND vd.status = 'ACTIVE') as active_dna_count,

            -- Cadastros pagos (dna_activations COMPLETED ou pix PAID)
            MAX(
                (SELECT COUNT(*) FROM dna_activations da WHERE da.workshop_id = w.id AND da.payment_status = 'COMPLETED'),
                (SELECT COUNT(*) FROM workshop_pix_charges pc WHERE pc.workshop_id = w.id AND pc.status = 'PAID')
            ) as paid_registrations_count,

            -- Cadastros pendentes
            MAX(
                (SELECT COUNT(*) FROM dna_activations da WHERE da.workshop_id = w.id AND da.payment_status = 'PENDING'),
                (SELECT COUNT(*) FROM workshop_pix_charges pc WHERE pc.workshop_id = w.id AND pc.status = 'PENDING')
            ) as pending_registrations_count,

            -- Faturamento atribuído (em centavos)
            MAX(
                (SELECT COALESCE(SUM(da.amount_paid_cents), 0) FROM dna_activations da WHERE da.workshop_id = w.id AND da.payment_status = 'COMPLETED'),
                (SELECT COALESCE(SUM(pc.customer_price_cents), 0) FROM workshop_pix_charges pc WHERE pc.workshop_id = w.id AND pc.status = 'PAID')
            ) as attributed_revenue_cents,

            -- Volume mecânico (serviços) separado
            (SELECT COUNT(*) FROM service_records sr WHERE sr.workshop_id = w.id) as services_count,
            (SELECT COALESCE(SUM(sr.total_cost_cents), 0) FROM service_records sr WHERE sr.workshop_id = w.id) as mechanical_volume_cents,

            -- Comissões de representante geradas
            (SELECT COALESCE(SUM(rc.commission_amount_cents), 0) FROM representative_commissions rc
             WHERE rc.workshop_id = w.id AND rc.status IN ('CONFIRMED', 'PAID')) as rep_commissions_generated_cents,

            -- Comissões da própria oficina (repasse 50%)
            (SELECT COALESCE(SUM(c.amount_cents), 0) FROM commissions c
             WHERE c.workshop_id = w.id AND c.status != 'CANCELLED') as workshop_commissions_cents,

            -- Taxas por atendimento
            (SELECT COALESCE(SUM(af.amount_cents), 0) FROM workshop_attendance_fees af
             WHERE af.workshop_id = w.id) as attendance_fees_cents

        FROM workshops w
        LEFT JOIN workshop_referrals wr ON wr.workshop_id = w.id
        LEFT JOIN representatives r ON r.id = wr.representative_id
        WHERE ${whereSql}
        ORDER BY paid_registrations_count DESC, vehicles_count DESC, w.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const statesAvailable = db.prepare(`SELECT DISTINCT UPPER(state) as state FROM workshops WHERE state IS NOT NULL AND TRIM(state) != '' ORDER BY state ASC`).all().map(r => r.state);

    return {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
        states_available: statesAvailable,
        items: rows,
        generated_at: new Date().toISOString()
    };
}

/**
 * FASE 5: Desempenho detalhado de uma Oficina (Clientes únicos com seus múltiplos veículos agrupados + cadeia comercial + financeiro).
 */
function getWorkshopPerformance(db, workshopId) {
    const workshop = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(workshopId);
    if (!workshop) return null;

    const referral = db.prepare(`
        SELECT wr.*, r.name as representative_name, r.email as representative_email, r.phone as representative_phone, r.status as representative_status
        FROM workshop_referrals wr
        JOIN representatives r ON wr.representative_id = r.id
        WHERE wr.workshop_id = ?
    `).get(workshopId) || null;

    // Veículos vinculados à oficina
    const vehicles = db.prepare(`
        SELECT DISTINCT
            v.id as vehicle_id, v.license_plate, v.brand, v.model, v.version_label, v.model_year, v.color, v.photo_url,
            vd.dna_code, vd.status as dna_status, vd.activated_at as dna_activated_at, vd.activation_fee_cents,
            COALESCE(o_curr.id, o_ca.id, o_trf.id) as owner_id,
            COALESCE(o_curr.user_id, o_ca.user_id, o_trf.user_id) as owner_user_id,
            COALESCE(o_curr.name, o_ca.name, o_trf.name, ca_last.client_name, 'Proprietário não identificado') as owner_name,
            COALESCE(o_curr.email, o_ca.email, o_trf.email, ca_last.email, '') as owner_email,
            COALESCE(o_curr.phone, o_ca.phone, o_trf.phone, ca_last.whatsapp, '') as owner_phone,
            (SELECT COUNT(*) FROM service_records sr WHERE sr.vehicle_id = v.id AND sr.workshop_id = ?) as services_count,
            (SELECT COALESCE(SUM(sr.total_cost_cents), 0) FROM service_records sr WHERE sr.vehicle_id = v.id AND sr.workshop_id = ?) as services_total_cents,
            (SELECT MAX(sr.service_date) FROM service_records sr WHERE sr.vehicle_id = v.id AND sr.workshop_id = ?) as last_service_date,
            (SELECT MAX(mileage) FROM mileage_records mr WHERE mr.vehicle_id = v.id) as last_mileage,
            (SELECT pc.status FROM workshop_pix_charges pc WHERE pc.workshop_id = ? AND pc.vehicle_id = v.id ORDER BY pc.created_at DESC LIMIT 1) as latest_pix_status
        FROM vehicles v
        LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
        LEFT JOIN owners o_curr ON o_curr.id = v.current_owner_id
        LEFT JOIN (
            SELECT ca.* FROM client_activations ca
            WHERE ca.workshop_id = ? AND ca.id IN (
                SELECT MAX(id) FROM client_activations WHERE workshop_id = ? GROUP BY COALESCE(vehicle_id, license_plate)
            )
        ) ca_last ON ca_last.vehicle_id = v.id OR UPPER(ca_last.license_plate) = UPPER(v.license_plate)
        LEFT JOIN owners o_ca ON o_ca.id = ca_last.owner_id
        LEFT JOIN (
            SELECT ot.vehicle_id, ot.new_owner_id FROM ownership_transfers ot
            WHERE ot.status = 'COMPLETED' AND ot.id IN (
                SELECT MAX(id) FROM ownership_transfers WHERE status = 'COMPLETED' GROUP BY vehicle_id
            )
        ) trf_last ON trf_last.vehicle_id = v.id
        LEFT JOIN owners o_trf ON o_trf.id = trf_last.new_owner_id
        WHERE vd.activated_by_workshop_id = ?
           OR v.id IN (SELECT vehicle_id FROM client_activations WHERE workshop_id = ? AND vehicle_id IS NOT NULL)
           OR v.id IN (SELECT vehicle_id FROM service_records WHERE workshop_id = ?)
        ORDER BY COALESCE(vd.activated_at, v.created_at) DESC
    `).all(workshopId, workshopId, workshopId, workshopId, workshopId, workshopId, workshopId, workshopId, workshopId);

    // Agrupamento rigoroso de clientes únicos (1 cliente com 3 veículos = 1 cliente único, 3 veículos)
    const uniqueClientsMap = new Map();
    for (const v of vehicles) {
        const emailNorm = String(v.owner_email || '').trim().toLowerCase();
        const phoneNorm = String(v.owner_phone || '').replace(/\D/g, '').slice(-10);
        const key = v.owner_user_id
            ? `usr:${v.owner_user_id}`
            : (emailNorm ? `email:${emailNorm}` : (phoneNorm.length >= 8 ? `phone:${phoneNorm}` : (v.owner_id ? `own:${v.owner_id}` : `veh:${v.vehicle_id}`)));

        if (!uniqueClientsMap.has(key)) {
            uniqueClientsMap.set(key, {
                client_key: key,
                owner_id: v.owner_id || null,
                name: v.owner_name,
                email: v.owner_email || null,
                phone: v.owner_phone || null,
                vehicles_count: 0,
                services_count: 0,
                services_total_cents: 0,
                vehicles: []
            });
        }
        const cl = uniqueClientsMap.get(key);
        cl.vehicles_count += 1;
        cl.services_count += Number(v.services_count || 0);
        cl.services_total_cents += Number(v.services_total_cents || 0);
        cl.vehicles.push({
            vehicle_id: v.vehicle_id,
            license_plate: v.license_plate,
            brand: v.brand,
            model: v.model,
            model_year: v.model_year,
            dna_code: v.dna_code,
            dna_status: v.dna_status,
            latest_pix_status: v.latest_pix_status,
            services_count: Number(v.services_count || 0),
            last_service_date: v.last_service_date
        });
    }

    const uniqueClients = Array.from(uniqueClientsMap.values());

    // Métricas separadas: clientes únicos, veículos, ativações, atendimentos, pagamentos e comissões
    const dnaActSummary = db.prepare(`
        SELECT
            COUNT(*) as total_activations,
            COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as paid_activations,
            COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_activations,
            COUNT(CASE WHEN payment_status = 'REFUNDED' THEN 1 END) as refunded_activations,
            COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount_paid_cents ELSE 0 END), 0) as paid_revenue_cents,
            COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN commission_amount_cents ELSE 0 END), 0) as workshop_share_cents
        FROM dna_activations
        WHERE workshop_id = ?
    `).get(workshopId);

    const pixCharges = db.prepare(`
        SELECT id, vehicle_id, activation_code, charge_type, amount_cents, customer_price_cents, workshop_profit_cents,
               cars_count, status, created_at, paid_at
        FROM workshop_pix_charges
        WHERE workshop_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `).all(workshopId);

    const repCommissions = db.prepare(`
        SELECT rc.*, r.rep_code, r.name as rep_name
        FROM representative_commissions rc
        JOIN representatives r ON rc.representative_id = r.id
        WHERE rc.workshop_id = ?
        ORDER BY rc.created_at DESC
        LIMIT 50
    `).all(workshopId);

    const attendancesSummary = db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM service_records WHERE workshop_id = ?) as service_orders_count,
            (SELECT COUNT(*) FROM service_records WHERE workshop_id = ? AND proof_level = 4) as proven_services_count,
            (SELECT COALESCE(SUM(total_cost_cents), 0) FROM service_records WHERE workshop_id = ?) as mechanical_volume_cents,
            (SELECT COUNT(*) FROM workshop_appointments WHERE workshop_id = ?) as appointments_count,
            (SELECT COUNT(*) FROM workshop_attendance_fees WHERE workshop_id = ?) as attendance_fees_count,
            (SELECT COALESCE(SUM(amount_cents), 0) FROM workshop_attendance_fees WHERE workshop_id = ?) as attendance_fees_cents
    `).get(workshopId, workshopId, workshopId, workshopId, workshopId, workshopId);

    const staff = db.prepare(`
        SELECT wu.id, wu.position_title, wu.can_activate_dna, wu.can_prove_services,
               u.id as user_id, u.name, u.email, u.phone, u.status, r.code as role_code
        FROM workshop_users wu
        JOIN users u ON wu.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        WHERE wu.workshop_id = ?
    `).all(workshopId);

    return {
        workshop,
        referral,
        metrics: {
            unique_clients_count: uniqueClients.length,
            vehicles_count: vehicles.length,
            active_dna_count: vehicles.filter(v => v.dna_status === 'ACTIVE').length,
            total_activations_count: Number(dnaActSummary.total_activations || 0),
            paid_registrations_count: Math.max(Number(dnaActSummary.paid_activations || 0), pixCharges.filter(p => p.status === 'PAID').length),
            pending_registrations_count: Math.max(Number(dnaActSummary.pending_activations || 0), pixCharges.filter(p => p.status === 'PENDING').length),
            attributed_revenue_cents: Math.max(
                Number(dnaActSummary.paid_revenue_cents || 0),
                pixCharges.filter(p => p.status === 'PAID').reduce((a, p) => a + Number(p.customer_price_cents || 0), 0)
            ),
            workshop_share_cents: Number(dnaActSummary.workshop_share_cents || 0),
            rep_commissions_confirmed_cents: repCommissions.filter(c => ['CONFIRMED', 'PAID'].includes(c.status)).reduce((a, c) => a + Number(c.commission_amount_cents || 0), 0),
            rep_commissions_projected_cents: repCommissions.filter(c => c.status === 'PROJECTED').reduce((a, c) => a + Number(c.commission_amount_cents || 0), 0),
            service_orders_count: Number(attendancesSummary.service_orders_count || 0),
            proven_services_count: Number(attendancesSummary.proven_services_count || 0),
            mechanical_volume_cents: Number(attendancesSummary.mechanical_volume_cents || 0),
            appointments_count: Number(attendancesSummary.appointments_count || 0),
            attendance_fees_count: Number(attendancesSummary.attendance_fees_count || 0),
            attendance_fees_cents: Number(attendancesSummary.attendance_fees_cents || 0)
        },
        unique_clients: uniqueClients,
        vehicles,
        pix_charges: pixCharges,
        representative_commissions: repCommissions,
        staff,
        generated_at: new Date().toISOString()
    };
}

/**
 * Listagem global de Clientes Únicos (desduplicados mesmo com múltiplos veículos).
 */
function getUniqueClientsDirectory(db, { q = '', workshopId = 'all', page = 1, pageSize = 25 } = {}) {
    const cleanQ = String(q || '').trim().toLowerCase();
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeSize = Math.max(1, Math.min(200, parseInt(pageSize, 10) || 25));

    const ownersRows = db.prepare(`
        SELECT
            o.id as owner_id, o.user_id, o.name, o.document_cpf, o.email, o.phone, o.created_at,
            u.status as user_status
        FROM owners o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
    `).all();

    const vehiclesRows = db.prepare(`
        SELECT
            v.id, v.license_plate, v.brand, v.model, v.model_year, v.current_owner_id,
            vd.dna_code, vd.status as dna_status, vd.activated_by_workshop_id,
            w.trade_name as workshop_name,
            (SELECT new_owner_id FROM ownership_transfers WHERE vehicle_id = v.id AND status = 'COMPLETED' ORDER BY completed_at DESC LIMIT 1) as transfer_owner_id,
            (SELECT COUNT(*) FROM service_records sr WHERE sr.vehicle_id = v.id) as services_count,
            (SELECT COALESCE(SUM(sr.total_cost_cents), 0) FROM service_records sr WHERE sr.vehicle_id = v.id) as spent_cents
        FROM vehicles v
        LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
        LEFT JOIN workshops w ON w.id = vd.activated_by_workshop_id
    `).all();

    const activationsRows = db.prepare(`
        SELECT ca.*, w.trade_name as workshop_name
        FROM client_activations ca
        LEFT JOIN workshops w ON w.id = ca.workshop_id
    `).all();

    // Agrupa owners em clientes únicos
    const clientMap = new Map();
    const ownerIdToClientKey = new Map();

    for (const o of ownersRows) {
        const emailNorm = String(o.email || '').trim().toLowerCase();
        const phoneNorm = String(o.phone || '').replace(/\D/g, '').slice(-10);
        const key = o.user_id
            ? `usr:${o.user_id}`
            : (emailNorm ? `email:${emailNorm}` : (phoneNorm.length >= 8 ? `phone:${phoneNorm}` : `own:${o.owner_id}`));

        ownerIdToClientKey.set(o.owner_id, key);

        if (!clientMap.has(key)) {
            clientMap.set(key, {
                client_key: key,
                owner_id: o.owner_id,
                user_id: o.user_id || null,
                name: o.name,
                cpf_masked: maskDocument(o.document_cpf),
                email: o.email || null,
                phone: o.phone || null,
                status: o.user_status || 'ACTIVE',
                created_at: o.created_at,
                workshop_ids: new Set(),
                workshop_names: new Set(),
                vehicles_map: new Map(),
                services_count: 0,
                total_spent_cents: 0
            });
        }
    }

    for (const v of vehiclesRows) {
        const oid = v.current_owner_id || v.transfer_owner_id;
        const cKey = oid ? ownerIdToClientKey.get(oid) : null;
        if (!cKey || !clientMap.has(cKey)) continue;
        const cl = clientMap.get(cKey);
        if (!cl.vehicles_map.has(v.id)) {
            cl.vehicles_map.set(v.id, {
                id: v.id,
                license_plate: v.license_plate,
                brand: v.brand,
                model: v.model,
                model_year: v.model_year,
                dna_code: v.dna_code,
                dna_status: v.dna_status,
                workshop_id: v.activated_by_workshop_id || null,
                workshop_name: v.workshop_name || null
            });
            cl.services_count += Number(v.services_count || 0);
            cl.total_spent_cents += Number(v.spent_cents || 0);
        }
        if (v.activated_by_workshop_id) cl.workshop_ids.add(v.activated_by_workshop_id);
        if (v.workshop_name) cl.workshop_names.add(v.workshop_name);
    }

    for (const ca of activationsRows) {
        let cKey = ca.owner_id ? ownerIdToClientKey.get(ca.owner_id) : null;
        if (!cKey) {
            const emailNorm = String(ca.email || '').trim().toLowerCase();
            const phoneNorm = String(ca.whatsapp || '').replace(/\D/g, '').slice(-10);
            cKey = emailNorm ? `email:${emailNorm}` : (phoneNorm.length >= 8 ? `phone:${phoneNorm}` : `ca:${ca.id}`);
            if (!clientMap.has(cKey)) {
                clientMap.set(cKey, {
                    client_key: cKey,
                    owner_id: ca.owner_id || null,
                    user_id: null,
                    name: ca.client_name,
                    cpf_masked: 'Não informado',
                    email: ca.email || null,
                    phone: ca.whatsapp || null,
                    status: ca.status,
                    created_at: ca.created_at,
                    workshop_ids: new Set(),
                    workshop_names: new Set(),
                    vehicles_map: new Map(),
                    services_count: 0,
                    total_spent_cents: 0
                });
            }
        }
        const cl = clientMap.get(cKey);
        if (ca.workshop_id) cl.workshop_ids.add(ca.workshop_id);
        if (ca.workshop_name) cl.workshop_names.add(ca.workshop_name);
    }

    let list = Array.from(clientMap.values()).map(c => ({
        client_key: c.client_key,
        owner_id: c.owner_id,
        user_id: c.user_id,
        name: c.name,
        cpf_masked: c.cpf_masked,
        email: c.email,
        phone: c.phone,
        status: c.status,
        created_at: c.created_at,
        workshop_ids: Array.from(c.workshop_ids),
        preferred_workshop_name: Array.from(c.workshop_names)[0] || 'Sem oficina vinculada',
        vehicles_count: c.vehicles_map.size,
        vehicles: Array.from(c.vehicles_map.values()),
        services_count: c.services_count,
        total_spent_cents: c.total_spent_cents
    }));

    if (workshopId && workshopId !== 'all') {
        list = list.filter(c => c.workshop_ids.includes(workshopId));
    }
    if (cleanQ) {
        list = list.filter(c =>
            String(c.name || '').toLowerCase().includes(cleanQ) ||
            String(c.email || '').toLowerCase().includes(cleanQ) ||
            String(c.phone || '').toLowerCase().includes(cleanQ) ||
            c.vehicles.some(v => String(v.license_plate || '').toLowerCase().includes(cleanQ) || String(v.dna_code || '').toLowerCase().includes(cleanQ))
        );
    }

    list.sort((a, b) => b.vehicles_count - a.vehicles_count || String(b.created_at || '').localeCompare(String(a.created_at || '')));

    const total = list.length;
    const offset = (safePage - 1) * safeSize;
    return {
        page: safePage,
        page_size: safeSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / safeSize)),
        items: list.slice(offset, offset + safeSize),
        generated_at: new Date().toISOString()
    };
}

/**
 * Busca global administrativa em todas as entidades principais.
 */
function globalAdminSearch(db, rawQuery) {
    const q = String(rawQuery || '').trim();
    if (!q || q.length < 2) {
        return { query: q, representatives: [], workshops: [], vehicles: [], clients: [], tickets: [] };
    }
    const likeQ = `%${q}%`;

    const representatives = db.prepare(`
        SELECT id, rep_code, name, email, city, state, status
        FROM representatives
        WHERE UPPER(rep_code) LIKE ? OR unaccent(name) LIKE unaccent(?) OR LOWER(email) LIKE ?
        LIMIT 8
    `).all(likeQ.toUpperCase(), likeQ, likeQ.toLowerCase());

    const workshops = db.prepare(`
        SELECT id, trade_name, cnpj, city, state, status
        FROM workshops
        WHERE unaccent(trade_name) LIKE unaccent(?) OR unaccent(company_name) LIKE unaccent(?) OR cnpj LIKE ? OR unaccent(city) LIKE unaccent(?)
        LIMIT 8
    `).all(likeQ, likeQ, likeQ, likeQ);

    const vehicles = db.prepare(`
        SELECT v.id, v.license_plate, v.brand, v.model, v.model_year, vd.dna_code, vd.status as dna_status
        FROM vehicles v
        LEFT JOIN vehicle_dna vd ON vd.vehicle_id = v.id
        WHERE UPPER(v.license_plate) LIKE ? OR UPPER(COALESCE(vd.dna_code, '')) LIKE ? OR unaccent(v.brand || ' ' || v.model) LIKE unaccent(?)
        LIMIT 8
    `).all(likeQ.toUpperCase(), likeQ.toUpperCase(), likeQ);

    const clients = db.prepare(`
        SELECT id, name, email, phone
        FROM owners
        WHERE unaccent(name) LIKE unaccent(?) OR LOWER(COALESCE(email, '')) LIKE ? OR COALESCE(phone, '') LIKE ?
        LIMIT 8
    `).all(likeQ, likeQ.toLowerCase(), likeQ);

    const tickets = db.prepare(`
        SELECT st.id, st.protocol, st.subject, st.status, w.trade_name as workshop_name
        FROM support_tickets st
        LEFT JOIN workshops w ON w.id = st.workshop_id
        WHERE UPPER(st.protocol) LIKE ? OR unaccent(st.subject) LIKE unaccent(?)
        LIMIT 5
    `).all(likeQ.toUpperCase(), likeQ);

    return { query: q, representatives, workshops, vehicles, clients, tickets };
}

/**
 * Conciliação Financeira (Fase 2 / Financeiro): compara cobranças PIX, ativações DNA, comissões de oficinas e comissões de representantes.
 */
function getFinancialReconciliation(db, { competenceMonth = null } = {}) {
    const targetComp = CommissionFinance.isValidYM(competenceMonth) ? competenceMonth : CommissionFinance.getCurrentYM();

    const charges = db.prepare(`
        SELECT
            pc.id as payment_id, pc.workshop_id, w.trade_name as workshop_name,
            pc.vehicle_id, v.license_plate, pc.activation_code, pc.charge_type,
            pc.amount_cents, pc.customer_price_cents, pc.workshop_profit_cents,
            pc.status as payment_status, pc.created_at, pc.paid_at,
            wr.representative_id, wr.rep_code, wr.valid_until as referral_valid_until,
            rc.id as commission_id, rc.status as commission_status, rc.commission_amount_cents, rc.payout_batch_id
        FROM workshop_pix_charges pc
        JOIN workshops w ON pc.workshop_id = w.id
        LEFT JOIN vehicles v ON v.id = pc.vehicle_id
        LEFT JOIN workshop_referrals wr ON wr.workshop_id = pc.workshop_id
        LEFT JOIN representative_commissions rc ON rc.source_payment_id = pc.id
        WHERE strftime('%Y-%m', COALESCE(pc.paid_at, pc.created_at)) = ?
        ORDER BY COALESCE(pc.paid_at, pc.created_at) DESC
        LIMIT 150
    `).all(targetComp);

    const discrepancies = [];
    let reconciledCount = 0;

    const rows = charges.map(ch => {
        let reconciliationStatus = 'CONCILIADO';
        let discrepancyReason = null;

        if (ch.payment_status === 'PAID' && ch.representative_id && !ch.commission_id) {
            const eventTs = new Date(ch.paid_at || ch.created_at).getTime();
            const validTs = ch.referral_valid_until ? new Date(ch.referral_valid_until).getTime() : 0;
            if (validTs && eventTs <= validTs && ch.charge_type === 'SINGLE') {
                reconciliationStatus = 'DIVERGENTE';
                discrepancyReason = 'Pagamento PIX liquidado em oficina indicada dentro dos 24m sem registro de comissão.';
            }
        } else if (ch.payment_status === 'PENDING' && ch.commission_status === 'CONFIRMED') {
            reconciliationStatus = 'DIVERGENTE';
            discrepancyReason = 'Comissão confirmada com pagamento PIX ainda pendente.';
        } else if (ch.payment_status === 'REFUNDED' && ch.commission_status && ch.commission_status !== 'REFUNDED') {
            reconciliationStatus = 'DIVERGENTE';
            discrepancyReason = 'Pagamento estornado sem estorno correspondente na comissão.';
        }

        if (reconciliationStatus === 'CONCILIADO') reconciledCount += 1;
        else discrepancies.push({ payment_id: ch.payment_id, workshop_name: ch.workshop_name, reason: discrepancyReason });

        return { ...ch, reconciliation_status: reconciliationStatus, discrepancy_reason: discrepancyReason };
    });

    return {
        competence_month: targetComp,
        summary: {
            total_transactions: rows.length,
            reconciled_count: reconciledCount,
            discrepancies_count: discrepancies.length,
            paid_total_customer_cents: rows.filter(r => r.payment_status === 'PAID').reduce((a, r) => a + Number(r.customer_price_cents || 0), 0),
            paid_total_platform_cents: rows.filter(r => r.payment_status === 'PAID').reduce((a, r) => a + Number(r.amount_cents || 0), 0),
            paid_total_workshop_cents: rows.filter(r => r.payment_status === 'PAID').reduce((a, r) => a + Number(r.workshop_profit_cents || 0), 0),
            paid_total_rep_comm_cents: rows.filter(r => ['CONFIRMED', 'PAID'].includes(r.commission_status)).reduce((a, r) => a + Number(r.commission_amount_cents || 0), 0)
        },
        discrepancies,
        items: rows,
        generated_at: new Date().toISOString()
    };
}

module.exports = {
    maskDocument,
    maskPixKey,
    buildPeriodClause,
    getDashboardOverview,
    getDashboardTimeseries,
    getRepresentativesSummary,
    getRepresentativeOverview,
    getRepresentativeWorkshops,
    getRepresentativeClients,
    getRepresentativeCommissions,
    getRepresentativePayouts,
    getWorkshopsSummary,
    getWorkshopPerformance,
    getUniqueClientsDirectory,
    globalAdminSearch,
    getFinancialReconciliation
};
