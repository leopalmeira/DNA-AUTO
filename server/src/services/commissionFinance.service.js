/**
 * DNA AUTO — Motor Financeiro de Comissões, Competências, Políticas Comerciais e Fechamento (Fase 6)
 *
 * Princípios obrigatórios:
 * - Todos os cálculos monetários em CENTAVOS INTEIROS (zero ponto flutuante em somas/splits).
 * - Políticas comerciais versionadas em `commercial_policies` (jamais recalcula transações históricas).
 * - Status de comissão preservados: PROJECTED, CONFIRMED, PAID, REFUNDED.
 * - Confirmação exige atendimento integral das 6 regras comerciais e contratuais.
 * - "Próximo Pagamento" soma exclusivamente comissões CONFIRMED elegíveis (nunca PROJECTED/REFUNDED/DISPUTED).
 * - Fechamento de competência e marcação de pagamento são atômicos (db.transaction) e idempotentes/anti-duplicidade.
 * - Nenhum PIX automático nesta versão: marcação como PAID exige ação administrativa auditada com referência de transferência.
 */

const { logAudit } = require('../middlewares/audit');
const { publishSyncEvent } = require('./syncEvents.service');
const { addMonthsToYM } = require('../database/migrations/adminCentralV2.migration');

function formatBrl(cents) {
    const num = Math.round(Number(cents || 0));
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    const reais = Math.floor(abs / 100);
    const centavos = String(abs % 100).padStart(2, '0');
    return `${sign}R$ ${reais.toLocaleString('pt-BR')},${centavos}`;
}

function getCurrentYM(referenceDate = new Date()) {
    const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function extractYM(dateInput) {
    if (!dateInput) return getCurrentYM();
    const str = String(dateInput).trim();
    if (/^\d{4}-\d{2}/.test(str)) {
        return str.slice(0, 7);
    }
    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
        return getCurrentYM(parsed);
    }
    return getCurrentYM();
}

function isValidYM(ym) {
    return typeof ym === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym);
}

/**
 * Calcula split exato em centavos inteiros garantindo conservação: workshop + platform === total.
 */
function calculateExactSplitCents(registrationPriceCents, workshopSplitPercent = 50) {
    const total = Math.round(Number(registrationPriceCents || 0));
    if (!Number.isInteger(total) || total < 0) {
        throw new Error('Valor de cadastro em centavos inválido.');
    }
    const wsPct = Math.max(0, Math.min(100, Math.round(Number(workshopSplitPercent))));
    const workshopSplitCents = Math.floor((total * wsPct) / 100);
    const platformSplitCents = total - workshopSplitCents;
    return {
        registration_price_cents: total,
        workshop_split_percent: wsPct,
        platform_split_percent: 100 - wsPct,
        workshop_split_cents: workshopSplitCents,
        platform_split_cents: platformSplitCents
    };
}

/**
 * Retorna a política comercial ativa no momento (ou padrão seguro de fallback).
 */
function getActiveCommercialPolicy(db) {
    try {
        const policy = db.prepare(`
            SELECT * FROM commercial_policies
            WHERE is_active = 1
            ORDER BY effective_from DESC, created_at DESC
            LIMIT 1
        `).get();
        if (policy) return policy;
    } catch (_) {}

    return {
        id: 'pol_v1_4990',
        version_code: 'POLICY_2026_V1_4990',
        title: 'Política Vigente — Cadastro R$ 49,90 (50/50 + Rep R$ 5,90)',
        registration_price_cents: 4990,
        workshop_split_percent: 50,
        platform_split_percent: 50,
        workshop_split_cents: 2495,
        platform_split_cents: 2495,
        rep_commission_cents: 590,
        attendance_fee_cents: 690,
        referral_validity_months: 24,
        default_max_workshops_per_rep: 15,
        payout_cycle_offset_months: 1,
        payout_day_of_month: 10,
        is_active: 1
    };
}

function getPayoutConfig(db) {
    const policy = getActiveCommercialPolicy(db);
    let offsetMonths = Number(policy.payout_cycle_offset_months ?? 1);
    let payoutDay = Number(policy.payout_day_of_month ?? 10);

    try {
        const offRow = db.prepare(`SELECT value FROM admin_system_settings WHERE key = 'payout_cycle_offset_months'`).get();
        const dayRow = db.prepare(`SELECT value FROM admin_system_settings WHERE key = 'payout_day_of_month'`).get();
        if (offRow && !Number.isNaN(Number(offRow.value))) {
            offsetMonths = Math.max(0, Math.min(3, parseInt(offRow.value, 10)));
        }
        if (dayRow && !Number.isNaN(Number(dayRow.value))) {
            payoutDay = Math.max(1, Math.min(28, parseInt(dayRow.value, 10)));
        }
    } catch (_) {}

    return { offsetMonths, payoutDay, activePolicy: policy };
}

function computePayoutMonth(competenceMonth, offsetMonths = 1) {
    return addMonthsToYM(competenceMonth, offsetMonths);
}

function computeScheduledPayoutDate(payoutMonth, payoutDay = 10) {
    if (!isValidYM(payoutMonth)) return null;
    const clampedDay = String(Math.max(1, Math.min(28, Number(payoutDay) || 10))).padStart(2, '0');
    return `${payoutMonth}-${clampedDay}`;
}

function parseUtcDate(val) {
    if (!val) return null;
    if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;
    const str = String(val).trim();
    // Strings SQLite 'YYYY-MM-DD HH:MM:SS' sem timezone são sempre UTC
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)
        ? str.replace(' ', 'T') + 'Z'
        : str;
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Valida as 6 regras obrigatórias para elegibilidade de comissão de representante.
 */
function validateCommissionEligibility(db, {
    workshopId,
    sourcePaymentId,
    eventDateIso = null,
    isPaymentConfirmed = false,
    allowProjected = false
}) {
    const eventDate = eventDateIso ? parseUtcDate(eventDateIso) : new Date();
    const eventTimestamp = eventDate ? eventDate.getTime() : Date.now();

    // Regra 1: Pagamento confirmado (ou projeção explicitamente permitida para PROJECTED)
    if (!isPaymentConfirmed && !allowProjected) {
        return { eligible: false, reason: 'PAYMENT_NOT_CONFIRMED' };
    }

    // Regra 2: Oficina devidamente vinculada a representante ativo
    const referral = db.prepare(`
        SELECT wr.*, r.rep_code as active_rep_code, r.name as rep_name, r.status as rep_status
        FROM workshop_referrals wr
        JOIN representatives r ON wr.representative_id = r.id
        WHERE wr.workshop_id = ?
        LIMIT 1
    `).get(workshopId);

    if (!referral) {
        return { eligible: false, reason: 'WORKSHOP_NOT_REFERRED' };
    }
    if (referral.status !== 'ACTIVE' || referral.rep_status !== 'ACTIVE') {
        return { eligible: false, reason: 'REFERRAL_OR_REPRESENTATIVE_INACTIVE', referral };
    }

    // Regra 3: Evento dentro da validade contratual (24 meses)
    const validUntilDate = parseUtcDate(referral.valid_until);
    const linkedAtDate = parseUtcDate(referral.linked_at);
    const validUntilTs = validUntilDate ? validUntilDate.getTime() : 0;
    const linkedAtTs = linkedAtDate ? linkedAtDate.getTime() : 0;
    if (!validUntilTs || eventTimestamp > validUntilTs) {
        return { eligible: false, reason: 'REFERRAL_CONTRACT_EXPIRED', referral };
    }
    if (linkedAtTs && eventTimestamp + 60000 < linkedAtTs) {
        return { eligible: false, reason: 'EVENT_BEFORE_REFERRAL_LINK', referral };
    }

    // Regra 4: Regra comercial vigente na data do evento
    const policy = getActiveCommercialPolicy(db);
    if (!policy || Number(policy.rep_commission_cents || 0) <= 0) {
        return { eligible: false, reason: 'NO_ACTIVE_COMMISSION_POLICY', referral };
    }

    // Regra 5 e 6: Duplicidade e estorno/cancelamento
    if (sourcePaymentId) {
        const existing = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(sourcePaymentId);
        if (existing) {
            if (existing.status === 'REFUNDED') {
                return { eligible: false, reason: 'COMMISSION_ALREADY_REFUNDED', referral, existing };
            }
            if (existing.dispute_status === 'DISPUTED') {
                return { eligible: false, reason: 'COMMISSION_DISPUTED', referral, existing };
            }
            return { eligible: true, existing, referral, policy };
        }
    }

    return { eligible: true, existing: null, referral, policy };
}

/**
 * Cria (PROJECTED) ou confirma (CONFIRMED) uma comissão de representante com total idempotência e atomicidade.
 */
function upsertRepresentativeCommission(db, {
    workshopId,
    sourcePaymentId,
    dnaActivationId = null,
    vehicleId = null,
    targetStatus = 'CONFIRMED',
    eventDateIso = null,
    notes = null
}) {
    const isConfirmed = targetStatus === 'CONFIRMED';
    const check = validateCommissionEligibility(db, {
        workshopId,
        sourcePaymentId,
        eventDateIso,
        isPaymentConfirmed: isConfirmed,
        allowProjected: !isConfirmed
    });

    if (!check.eligible) {
        return { created: false, updated: false, commission: check.existing || null, reason: check.reason };
    }

    const { referral, policy, existing } = check;
    const { offsetMonths } = getPayoutConfig(db);
    const nowIso = (eventDateIso ? new Date(eventDateIso) : new Date()).toISOString().replace('T', ' ').slice(0, 19);
    const competenceMonth = extractYM(nowIso);
    const payoutMonth = computePayoutMonth(competenceMonth, offsetMonths);

    if (existing) {
        if (existing.status === 'PAID' || existing.status === 'CONFIRMED') {
            return { created: false, updated: false, idempotent: true, commission: existing };
        }
        if (isConfirmed && existing.status === 'PROJECTED') {
            db.prepare(`
                UPDATE representative_commissions
                SET status = 'CONFIRMED',
                    confirmed_at = ?,
                    competence_month = ?,
                    payout_month = ?,
                    dna_activation_id = COALESCE(dna_activation_id, ?),
                    updated_at = CURRENT_TIMESTAMP,
                    notes = COALESCE(?, 'Comissão confirmada mediante pagamento liquidado')
                WHERE id = ?
            `).run(nowIso, competenceMonth, payoutMonth, dnaActivationId, notes, existing.id);
            const updated = db.prepare(`SELECT * FROM representative_commissions WHERE id = ?`).get(existing.id);
            return { created: false, updated: true, commission: updated };
        }
        return { created: false, updated: false, idempotent: true, commission: existing };
    }

    const repCommId = `rcomm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const regAmount = Math.round(Number(policy.registration_price_cents || 4990));
    const wsSplit = Math.round(Number(policy.workshop_split_cents || Math.floor(regAmount / 2)));
    const platSplit = regAmount - wsSplit;
    const commAmount = Math.round(Number(policy.rep_commission_cents || 590));

    db.prepare(`
        INSERT OR IGNORE INTO representative_commissions (
            id, representative_id, workshop_id, referral_id, dna_activation_id,
            source_payment_id, vehicle_id, registration_amount_cents,
            workshop_split_cents, platform_split_cents, commission_amount_cents,
            status, policy_id, competence_month, payout_month,
            dispute_status, created_at, confirmed_at, updated_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NONE', ?, ?, CURRENT_TIMESTAMP, ?)
    `).run(
        repCommId,
        referral.representative_id,
        workshopId,
        referral.id,
        dnaActivationId,
        sourcePaymentId,
        vehicleId,
        regAmount,
        wsSplit,
        platSplit,
        commAmount,
        isConfirmed ? 'CONFIRMED' : 'PROJECTED',
        policy.id,
        competenceMonth,
        payoutMonth,
        nowIso,
        isConfirmed ? nowIso : null,
        notes || (isConfirmed ? 'Comissão confirmada mediante pagamento PIX liquidado' : 'Comissão prevista — aguardando confirmação do pagamento do cadastro')
    );

    const created = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(sourcePaymentId);
    return { created: true, updated: false, commission: created };
}

/**
 * Estorna comissão ligada a um pagamento. Se já estava PAID, lança ajuste CLAWBACK na próxima competência aberta.
 */
function refundCommissionByPayment(db, { sourcePaymentId, reason = 'Estorno de pagamento', actorId = 'SYSTEM_PAYMENT' }) {
    const repComm = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(sourcePaymentId);
    if (!repComm) return null;

    if (repComm.status === 'REFUNDED') {
        return { commission: repComm, clawbackAdjustment: null, idempotent: true };
    }

    const wasPaid = repComm.status === 'PAID';
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let clawbackAdjustment = null;

    db.prepare(`
        UPDATE representative_commissions
        SET status = 'REFUNDED',
            refunded_at = ?,
            updated_at = CURRENT_TIMESTAMP,
            notes = ?
        WHERE id = ?
    `).run(nowIso, reason, repComm.id);

    // Se já tinha sido paga ao representante, cria ajuste negativo (clawback) para compensação no ciclo atual
    if (wasPaid) {
        const adjId = `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const currentYM = getCurrentYM();
        db.prepare(`
            INSERT INTO financial_adjustments (
                id, representative_id, commission_id, batch_id, competence_month,
                adjustment_type, amount_cents, reason, status, created_by
            ) VALUES (?, ?, ?, ?, ?, 'CLAWBACK', ?, ?, 'OPEN', ?)
        `).run(
            adjId,
            repComm.representative_id,
            repComm.id,
            repComm.payout_batch_id || null,
            currentYM,
            -Math.abs(Math.round(repComm.commission_amount_cents || 0)),
            `Estorno pós-pagamento da comissão ${repComm.id} (${reason})`,
            actorId
        );
        clawbackAdjustment = db.prepare(`SELECT * FROM financial_adjustments WHERE id = ?`).get(adjId);
    }

    const updated = db.prepare(`SELECT * FROM representative_commissions WHERE id = ?`).get(repComm.id);

    db.prepare(`
        INSERT INTO representative_audit_logs (
            id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
        ) VALUES (?, ?, ?, 'COMMISSION_REFUNDED', ?, 'SYSTEM', ?, ?, '127.0.0.1')
    `).run(
        `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        repComm.representative_id,
        repComm.workshop_id,
        actorId,
        reason,
        JSON.stringify({
            source_payment_id: sourcePaymentId,
            commission_id: repComm.id,
            was_paid: wasPaid,
            clawback_adjustment_id: clawbackAdjustment ? clawbackAdjustment.id : null
        })
    );

    return { commission: updated, clawbackAdjustment, idempotent: false };
}

/**
 * Retorna indicadores financeiros consolidados de comissões (Fase 6).
 */
function getCommissionFinanceOverview(db, { competenceMonth = null } = {}) {
    const { offsetMonths, payoutDay, activePolicy } = getPayoutConfig(db);
    const currentYM = getCurrentYM();
    const targetComp = isValidYM(competenceMonth) ? competenceMonth : currentYM;
    const nextPayoutMonth = computePayoutMonth(targetComp, offsetMonths);
    const scheduledDate = computeScheduledPayoutDate(nextPayoutMonth, payoutDay);

    const totals = db.prepare(`
        SELECT
            COALESCE(SUM(CASE WHEN status = 'PROJECTED' THEN commission_amount_cents ELSE 0 END), 0) as projected_cents,
            COUNT(CASE WHEN status = 'PROJECTED' THEN 1 END) as projected_count,

            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN commission_amount_cents ELSE 0 END), 0) as confirmed_open_cents,
            COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_open_count,

            COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN commission_amount_cents ELSE 0 END), 0) as confirmed_total_cents,
            COUNT(CASE WHEN status IN ('CONFIRMED', 'PAID') THEN 1 END) as confirmed_total_count,

            COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount_cents ELSE 0 END), 0) as paid_cents,
            COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,

            COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN commission_amount_cents ELSE 0 END), 0) as refunded_cents,
            COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded_count,

            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'DISPUTED' THEN commission_amount_cents ELSE 0 END), 0) as blocked_dispute_cents,
            COUNT(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'DISPUTED' THEN 1 END) as blocked_dispute_count,

            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' AND COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) < ? THEN commission_amount_cents ELSE 0 END), 0) as overdue_cents,
            COUNT(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' AND COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) < ? THEN 1 END) as overdue_count,

            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' AND COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) = ? THEN commission_amount_cents ELSE 0 END), 0) as next_cycle_eligible_cents,
            COUNT(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' AND COALESCE(competence_month, strftime('%Y-%m', COALESCE(confirmed_at, created_at))) = ? THEN 1 END) as next_cycle_eligible_count,

            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' AND COALESCE(dispute_status, 'NONE') = 'NONE' THEN commission_amount_cents ELSE 0 END), 0) as total_eligible_balance_cents
        FROM representative_commissions
    `).get(targetComp, targetComp, targetComp, targetComp);

    const openAdjustments = db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total_cents, COUNT(*) as cnt
        FROM financial_adjustments
        WHERE status = 'OPEN'
    `).get();

    const scheduledBatches = db.prepare(`
        SELECT COALESCE(SUM(net_amount_cents), 0) as total_cents, COUNT(*) as cnt
        FROM commission_payout_batches
        WHERE status = 'SCHEDULED'
    `).get();

    // Faturamento confirmado e repasses de oficinas
    const pixStats = db.prepare(`
        SELECT
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN customer_price_cents ELSE 0 END), 0) as paid_gross_customer_cents,
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents ELSE 0 END), 0) as paid_platform_cents,
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN workshop_profit_cents ELSE 0 END), 0) as paid_workshop_cents,
            COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount_cents ELSE 0 END), 0) as pending_pix_cents,
            COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount_cents ELSE 0 END), 0) as refunded_pix_cents,
            COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_charges_count,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_charges_count
        FROM workshop_pix_charges
    `).get();

    const dnaActStats = db.prepare(`
        SELECT
            COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount_paid_cents ELSE 0 END), 0) as completed_gross_cents,
            COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN commission_amount_cents ELSE 0 END), 0) as completed_workshop_split_cents,
            COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as completed_count,
            COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_count
        FROM dna_activations
    `).get();

    const workshopCommStats = db.prepare(`
        SELECT
            COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN amount_cents ELSE 0 END), 0) as pending_payout_cents,
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents ELSE 0 END), 0) as paid_payout_cents,
            COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN amount_cents ELSE 0 END), 0) as cancelled_payout_cents
        FROM commissions
    `).get();

    const attendanceFees = db.prepare(`
        SELECT
            COUNT(*) as total_count,
            COALESCE(SUM(amount_cents), 0) as total_cents,
            COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN amount_cents ELSE 0 END), 0) as confirmed_cents,
            COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount_cents ELSE 0 END), 0) as paid_cents,
            COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount_cents ELSE 0 END), 0) as pending_cents
        FROM workshop_attendance_fees
    `).get();

    const totalEligibleNetCents = Math.max(0, Number(totals.total_eligible_balance_cents || 0) + Number(openAdjustments.total_cents || 0));

    return {
        competence_month: targetComp,
        payout_month: nextPayoutMonth,
        scheduled_payout_date: scheduledDate,
        payout_rules: {
            offset_months: offsetMonths,
            payout_day_of_month: payoutDay,
            auto_pix_enabled: false,
            active_policy: activePolicy
        },
        commissions: {
            projected_cents: Number(totals.projected_cents || 0),
            projected_count: Number(totals.projected_count || 0),
            confirmed_open_cents: Number(totals.confirmed_open_cents || 0),
            confirmed_open_count: Number(totals.confirmed_open_count || 0),
            confirmed_total_cents: Number(totals.confirmed_total_cents || 0),
            confirmed_total_count: Number(totals.confirmed_total_count || 0),
            paid_cents: Number(totals.paid_cents || 0),
            paid_count: Number(totals.paid_count || 0),
            refunded_cents: Number(totals.refunded_cents || 0),
            refunded_count: Number(totals.refunded_count || 0),
            overdue_cents: Number(totals.overdue_cents || 0),
            overdue_count: Number(totals.overdue_count || 0),
            next_cycle_eligible_cents: Number(totals.next_cycle_eligible_cents || 0),
            next_cycle_eligible_count: Number(totals.next_cycle_eligible_count || 0),
            eligible_balance_cents: totalEligibleNetCents,
            blocked_dispute_cents: Number(totals.blocked_dispute_cents || 0),
            blocked_dispute_count: Number(totals.blocked_dispute_count || 0),
            open_adjustments_cents: Number(openAdjustments.total_cents || 0),
            scheduled_batches_cents: Number(scheduledBatches.total_cents || 0),
            scheduled_batches_count: Number(scheduledBatches.cnt || 0)
        },
        revenue: {
            pix_paid_gross_customer_cents: Number(pixStats.paid_gross_customer_cents || 0),
            pix_paid_platform_cents: Number(pixStats.paid_platform_cents || 0),
            pix_paid_workshop_cents: Number(pixStats.paid_workshop_cents || 0),
            pix_pending_cents: Number(pixStats.pending_pix_cents || 0),
            pix_refunded_cents: Number(pixStats.refunded_pix_cents || 0),
            pix_paid_count: Number(pixStats.paid_charges_count || 0),
            pix_pending_count: Number(pixStats.pending_charges_count || 0),
            dna_completed_gross_cents: Number(dnaActStats.completed_gross_cents || 0),
            dna_completed_count: Number(dnaActStats.completed_count || 0),
            dna_pending_count: Number(dnaActStats.pending_count || 0),
            confirmed_revenue_cents: Math.max(Number(dnaActStats.completed_gross_cents || 0), Number(pixStats.paid_gross_customer_cents || 0))
        },
        workshop_payouts: {
            pending_cents: Number(workshopCommStats.pending_payout_cents || 0),
            paid_cents: Number(workshopCommStats.paid_payout_cents || 0),
            cancelled_cents: Number(workshopCommStats.cancelled_payout_cents || 0)
        },
        attendance_fees: {
            total_count: Number(attendanceFees.total_count || 0),
            total_cents: Number(attendanceFees.total_cents || 0),
            confirmed_cents: Number(attendanceFees.confirmed_cents || 0),
            paid_cents: Number(attendanceFees.paid_cents || 0),
            pending_cents: Number(attendanceFees.pending_cents || 0)
        },
        generated_at: new Date().toISOString()
    };
}

/**
 * Apuração do próximo pagamento por competência (Fase 6).
 * Monta demonstrativo completo: REPRESENTANTE -> OFICINA -> CADASTRO -> PAGAMENTO CONFIRMADO -> COMISSÃO -> COMPETÊNCIA -> PAGAMENTO AGENDADO.
 */
function getNextPayoutForecast(db, { competenceMonth = null, representativeId = null } = {}) {
    const { offsetMonths, payoutDay, activePolicy } = getPayoutConfig(db);
    const targetComp = isValidYM(competenceMonth) ? competenceMonth : getCurrentYM();
    const payoutMonth = computePayoutMonth(targetComp, offsetMonths);
    const scheduledDate = computeScheduledPayoutDate(payoutMonth, payoutDay);

    const existingCycle = db.prepare(`
        SELECT * FROM commission_payout_cycles WHERE competence_month = ?
    `).get(targetComp);

    const repFilterSql = representativeId ? ` AND rc.representative_id = ?` : '';
    const baseParams = representativeId ? [targetComp, representativeId] : [targetComp];

    // Todas as comissões da competência (separando elegíveis CONFIRMED das PROJECTED, REFUNDED, DISPUTED e PAID)
    const commRows = db.prepare(`
        SELECT
            rc.*,
            r.rep_code, r.name as rep_name, r.email as rep_email, r.phone as rep_phone, r.pix_key as rep_pix_key, r.status as rep_status,
            w.trade_name as workshop_name, w.cnpj as workshop_cnpj, w.city as workshop_city, w.state as workshop_state,
            pc.status as payment_status, pc.paid_at as payment_paid_at, pc.activation_code, pc.charge_type, pc.abacate_id,
            v.license_plate, v.brand as vehicle_brand, v.model as vehicle_model,
            cp.version_code as policy_version_code
        FROM representative_commissions rc
        JOIN representatives r ON rc.representative_id = r.id
        JOIN workshops w ON rc.workshop_id = w.id
        LEFT JOIN workshop_pix_charges pc ON pc.id = rc.source_payment_id
        LEFT JOIN vehicles v ON v.id = rc.vehicle_id
        LEFT JOIN commercial_policies cp ON cp.id = rc.policy_id
        WHERE COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?
        ${repFilterSql}
        ORDER BY r.name ASC, w.trade_name ASC, rc.created_at DESC
    `).all(...baseParams);

    // Ajustes financeiros abertos/aplicados para a competência
    const adjParams = representativeId ? [targetComp, representativeId] : [targetComp];
    const adjustments = db.prepare(`
        SELECT * FROM financial_adjustments
        WHERE competence_month = ? AND status != 'CANCELLED'
        ${representativeId ? 'AND representative_id = ?' : ''}
    `).all(...adjParams);

    // Lotes já criados (caso ciclo esteja fechado)
    const existingBatches = db.prepare(`
        SELECT * FROM commission_payout_batches
        WHERE competence_month = ?
        ${representativeId ? 'AND representative_id = ?' : ''}
    `).all(...adjParams);
    const batchByRep = new Map(existingBatches.map(b => [b.representative_id, b]));

    const repMap = new Map();

    for (const row of commRows) {
        if (!repMap.has(row.representative_id)) {
            const batch = batchByRep.get(row.representative_id) || null;
            repMap.set(row.representative_id, {
                representative_id: row.representative_id,
                rep_code: row.rep_code,
                rep_name: row.rep_name,
                rep_email: row.rep_email,
                rep_phone: row.rep_phone,
                rep_status: row.rep_status,
                pix_key: batch ? batch.pix_key_snapshot : row.rep_pix_key,
                competence_month: targetComp,
                payout_month: payoutMonth,
                scheduled_payout_date: scheduledDate,
                batch_id: batch ? batch.id : null,
                batch_status: batch ? batch.status : (existingCycle ? 'CLOSED_EMPTY' : 'OPEN_FORECAST'),
                transfer_reference: batch ? batch.transfer_reference : null,
                transfer_date: batch ? batch.transfer_date : null,
                paid_at: batch ? batch.paid_at : null,
                eligible_commissions_count: 0,
                eligible_gross_cents: 0,
                projected_count: 0,
                projected_cents: 0,
                paid_count: 0,
                paid_cents: 0,
                refunded_count: 0,
                refunded_cents: 0,
                disputed_count: 0,
                disputed_cents: 0,
                adjustments_cents: 0,
                next_payout_net_cents: 0,
                workshops_map: new Map(),
                adjustments: []
            });
        }

        const repEntry = repMap.get(row.representative_id);
        const amount = Math.round(Number(row.commission_amount_cents || 0));
        const isDisputed = String(row.dispute_status || 'NONE') === 'DISPUTED';

        if (row.status === 'CONFIRMED' && !isDisputed) {
            repEntry.eligible_commissions_count += 1;
            repEntry.eligible_gross_cents += amount;
        } else if (row.status === 'CONFIRMED' && isDisputed) {
            repEntry.disputed_count += 1;
            repEntry.disputed_cents += amount;
        } else if (row.status === 'PROJECTED') {
            repEntry.projected_count += 1;
            repEntry.projected_cents += amount;
        } else if (row.status === 'PAID') {
            repEntry.paid_count += 1;
            repEntry.paid_cents += amount;
        } else if (row.status === 'REFUNDED') {
            repEntry.refunded_count += 1;
            repEntry.refunded_cents += amount;
        }

        // Agrupa demonstrativo por oficina
        if (!repEntry.workshops_map.has(row.workshop_id)) {
            repEntry.workshops_map.set(row.workshop_id, {
                workshop_id: row.workshop_id,
                workshop_name: row.workshop_name,
                workshop_cnpj: row.workshop_cnpj,
                workshop_city: row.workshop_city,
                workshop_state: row.workshop_state,
                eligible_count: 0,
                eligible_cents: 0,
                projected_count: 0,
                projected_cents: 0,
                items: []
            });
        }
        const wsEntry = repEntry.workshops_map.get(row.workshop_id);
        if (row.status === 'CONFIRMED' && !isDisputed) {
            wsEntry.eligible_count += 1;
            wsEntry.eligible_cents += amount;
        } else if (row.status === 'PROJECTED') {
            wsEntry.projected_count += 1;
            wsEntry.projected_cents += amount;
        }

        wsEntry.items.push({
            commission_id: row.id,
            source_payment_id: row.source_payment_id,
            dna_activation_id: row.dna_activation_id,
            activation_code: row.activation_code || null,
            license_plate: row.license_plate || null,
            vehicle_label: row.vehicle_brand ? `${row.vehicle_brand} ${row.vehicle_model || ''}`.trim() : null,
            payment_status: row.payment_status || (row.status === 'PROJECTED' ? 'PENDING' : 'PAID'),
            payment_paid_at: row.payment_paid_at || row.confirmed_at || null,
            registration_amount_cents: Math.round(Number(row.registration_amount_cents || 0)),
            workshop_split_cents: Math.round(Number(row.workshop_split_cents || 0)),
            platform_split_cents: Math.round(Number(row.platform_split_cents || 0)),
            commission_amount_cents: amount,
            status: row.status,
            dispute_status: row.dispute_status || 'NONE',
            policy_version_code: row.policy_version_code || 'POLICY_2026_V1_4990',
            competence_month: row.competence_month || targetComp,
            payout_month: row.payout_month || payoutMonth,
            scheduled_payout_date: scheduledDate,
            payout_batch_id: row.payout_batch_id || null,
            confirmed_at: row.confirmed_at,
            paid_at: row.paid_at,
            refunded_at: row.refunded_at
        });
    }

    for (const adj of adjustments) {
        if (!repMap.has(adj.representative_id)) continue;
        const repEntry = repMap.get(adj.representative_id);
        repEntry.adjustments.push(adj);
        repEntry.adjustments_cents += Math.round(Number(adj.amount_cents || 0));
    }

    const representatives = [];
    let totalEligibleGrossCents = 0;
    let totalProjectedCents = 0;
    let totalDisputedCents = 0;
    let totalPaidCents = 0;
    let totalRefundedCents = 0;
    let totalAdjustmentsCents = 0;
    let totalNextPayoutNetCents = 0;

    for (const entry of repMap.values()) {
        const batch = batchByRep.get(entry.representative_id);
        // Próximo pagamento considera SOMENTE valores confirmados elegíveis + ajustes aplicáveis (ou valor congelado do lote se já fechado)
        if (batch) {
            entry.next_payout_net_cents = batch.status === 'PAID' ? 0 : Math.round(Number(batch.net_amount_cents || 0));
            entry.batch_net_amount_cents = Math.round(Number(batch.net_amount_cents || 0));
        } else {
            entry.next_payout_net_cents = Math.max(0, entry.eligible_gross_cents + entry.adjustments_cents);
            entry.batch_net_amount_cents = entry.next_payout_net_cents;
        }
        entry.workshops = Array.from(entry.workshops_map.values());
        delete entry.workshops_map;

        totalEligibleGrossCents += entry.eligible_gross_cents;
        totalProjectedCents += entry.projected_cents;
        totalDisputedCents += entry.disputed_cents;
        totalPaidCents += entry.paid_cents;
        totalRefundedCents += entry.refunded_cents;
        totalAdjustmentsCents += entry.adjustments_cents;
        totalNextPayoutNetCents += entry.next_payout_net_cents;

        representatives.push(entry);
    }

    representatives.sort((a, b) => b.next_payout_net_cents - a.next_payout_net_cents);

    return {
        competence_month: targetComp,
        payout_month: payoutMonth,
        scheduled_payout_date: scheduledDate,
        cycle: existingCycle || null,
        cycle_status: existingCycle ? existingCycle.status : 'OPEN',
        can_close: !existingCycle && representatives.some(r => r.eligible_commissions_count > 0),
        policy: {
            id: activePolicy.id,
            version_code: activePolicy.version_code,
            offset_months: offsetMonths,
            payout_day_of_month: payoutDay
        },
        summary: {
            representatives_count: representatives.length,
            eligible_representatives_count: representatives.filter(r => r.eligible_commissions_count > 0).length,
            eligible_gross_cents: totalEligibleGrossCents,
            projected_cents: totalProjectedCents,
            disputed_cents: totalDisputedCents,
            paid_cents: totalPaidCents,
            refunded_cents: totalRefundedCents,
            adjustments_cents: totalAdjustmentsCents,
            next_payout_net_cents: totalNextPayoutNetCents
        },
        representatives,
        generated_at: new Date().toISOString()
    };
}

/**
 * Fechamento financeiro atômico de uma competência (Fase 6).
 * Protegido contra fechamento duplicado e pagamento duplicado.
 */
function closeCompetenceCycle(db, { competenceMonth, notes = '', actor, ipAddress = '127.0.0.1' }) {
    if (!isValidYM(competenceMonth)) {
        const err = new Error('Competência inválida. Informe no formato YYYY-MM (ex: 2026-11).');
        err.statusCode = 400;
        err.code = 'INVALID_COMPETENCE_MONTH';
        throw err;
    }

    const existingCycle = db.prepare(`SELECT * FROM commission_payout_cycles WHERE competence_month = ?`).get(competenceMonth);
    if (existingCycle) {
        const err = new Error(`A competência ${competenceMonth} já foi fechada anteriormente (ciclo ${existingCycle.id}).`);
        err.statusCode = 409;
        err.code = 'CYCLE_ALREADY_CLOSED';
        throw err;
    }

    const { offsetMonths, payoutDay, activePolicy } = getPayoutConfig(db);
    const payoutMonth = computePayoutMonth(competenceMonth, offsetMonths);
    const scheduledDate = computeScheduledPayoutDate(payoutMonth, payoutDay);

    const result = db.transaction(() => {
        // Revalidação dentro da transação
        const lockedCycle = db.prepare(`SELECT id FROM commission_payout_cycles WHERE competence_month = ?`).get(competenceMonth);
        if (lockedCycle) {
            const err = new Error(`A competência ${competenceMonth} já foi fechada.`);
            err.statusCode = 409;
            err.code = 'CYCLE_ALREADY_CLOSED';
            throw err;
        }

        const eligibleComms = db.prepare(`
            SELECT rc.*, r.rep_code, r.name as rep_name, r.pix_key as rep_pix_key, w.trade_name as workshop_name
            FROM representative_commissions rc
            JOIN representatives r ON rc.representative_id = r.id
            JOIN workshops w ON rc.workshop_id = w.id
            WHERE rc.status = 'CONFIRMED'
              AND COALESCE(rc.dispute_status, 'NONE') = 'NONE'
              AND rc.payout_batch_id IS NULL
              AND COALESCE(rc.competence_month, strftime('%Y-%m', COALESCE(rc.confirmed_at, rc.created_at))) = ?
            ORDER BY rc.representative_id ASC, rc.created_at ASC
        `).all(competenceMonth);

        if (eligibleComms.length === 0) {
            const err = new Error(`Não há comissões confirmadas e elegíveis na competência ${competenceMonth} para fechamento.`);
            err.statusCode = 400;
            err.code = 'NO_ELIGIBLE_COMMISSIONS';
            throw err;
        }

        const cycleId = `cyc_${competenceMonth.replace('-', '')}_${Date.now()}`;
        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

        // Agrupa comissões por representante
        const byRep = new Map();
        for (const c of eligibleComms) {
            if (!byRep.has(c.representative_id)) {
                byRep.set(c.representative_id, {
                    representative_id: c.representative_id,
                    rep_code: c.rep_code,
                    rep_name: c.rep_name,
                    pix_key: c.rep_pix_key,
                    commissions: [],
                    gross_amount_cents: 0
                });
            }
            const g = byRep.get(c.representative_id);
            g.commissions.push(c);
            g.gross_amount_cents += Math.round(Number(c.commission_amount_cents || 0));
        }

        // Insere o ciclo inicialmente
        db.prepare(`
            INSERT INTO commission_payout_cycles (
                id, competence_month, payout_month, scheduled_payout_date, status,
                total_representatives, total_commissions_count, total_amount_cents,
                total_adjustments_cents, net_amount_cents, policy_snapshot_json,
                closed_by, closed_at, notes
            ) VALUES (?, ?, ?, ?, 'CLOSED', 0, 0, 0, 0, 0, ?, ?, ?, ?)
        `).run(
            cycleId,
            competenceMonth,
            payoutMonth,
            scheduledDate,
            JSON.stringify({
                policy_id: activePolicy.id,
                version_code: activePolicy.version_code,
                offset_months: offsetMonths,
                payout_day_of_month: payoutDay
            }),
            actor ? actor.id : 'usr_admin',
            nowIso,
            String(notes || '').trim() || `Fechamento financeiro da competência ${competenceMonth}`
        );

        let cycleTotalComms = 0;
        let cycleTotalGrossCents = 0;
        let cycleTotalAdjCents = 0;
        let cycleTotalNetCents = 0;
        const createdBatches = [];

        const insertBatchStmt = db.prepare(`
            INSERT INTO commission_payout_batches (
                id, cycle_id, competence_month, payout_month, scheduled_payout_date,
                representative_id, rep_code, commissions_count, gross_amount_cents,
                adjustments_cents, net_amount_cents, pix_key_snapshot, status, statement_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
        `);

        const insertItemStmt = db.prepare(`
            INSERT INTO commission_payout_items (
                id, batch_id, commission_id, workshop_id, source_payment_id, amount_cents
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const linkCommStmt = db.prepare(`
            UPDATE representative_commissions
            SET payout_batch_id = ?, payout_item_id = ?, payout_month = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        for (const repGroup of byRep.values()) {
            const batchId = `bat_${competenceMonth.replace('-', '')}_${repGroup.rep_code}_${Math.random().toString(36).slice(2, 6)}`;

            const openAdjs = db.prepare(`
                SELECT * FROM financial_adjustments
                WHERE representative_id = ? AND status = 'OPEN' AND competence_month <= ?
            `).all(repGroup.representative_id, competenceMonth);

            const adjCents = openAdjs.reduce((sum, a) => sum + Math.round(Number(a.amount_cents || 0)), 0);
            const netCents = Math.max(0, repGroup.gross_amount_cents + adjCents);

            const statement = {
                cycle_id: cycleId,
                batch_id: batchId,
                competence_month: competenceMonth,
                payout_month: payoutMonth,
                scheduled_payout_date: scheduledDate,
                representative: {
                    id: repGroup.representative_id,
                    rep_code: repGroup.rep_code,
                    name: repGroup.rep_name,
                    pix_key: repGroup.pix_key
                },
                commissions_count: repGroup.commissions.length,
                gross_amount_cents: repGroup.gross_amount_cents,
                adjustments_cents: adjCents,
                net_amount_cents: netCents,
                items: repGroup.commissions.map(c => ({
                    commission_id: c.id,
                    workshop_id: c.workshop_id,
                    workshop_name: c.workshop_name,
                    source_payment_id: c.source_payment_id,
                    amount_cents: Math.round(Number(c.commission_amount_cents || 0)),
                    confirmed_at: c.confirmed_at
                })),
                adjustments: openAdjs
            };

            insertBatchStmt.run(
                batchId,
                cycleId,
                competenceMonth,
                payoutMonth,
                scheduledDate,
                repGroup.representative_id,
                repGroup.rep_code,
                repGroup.commissions.length,
                repGroup.gross_amount_cents,
                adjCents,
                netCents,
                repGroup.pix_key || null,
                JSON.stringify(statement)
            );

            for (const c of repGroup.commissions) {
                const itemId = `bit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const amt = Math.round(Number(c.commission_amount_cents || 0));
                insertItemStmt.run(itemId, batchId, c.id, c.workshop_id, c.source_payment_id, amt);
                linkCommStmt.run(batchId, itemId, payoutMonth, c.id);
            }

            if (openAdjs.length > 0) {
                const applyAdj = db.prepare(`
                    UPDATE financial_adjustments
                    SET status = 'APPLIED', batch_id = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `);
                for (const a of openAdjs) {
                    applyAdj.run(batchId, a.id);
                }
            }

            cycleTotalComms += repGroup.commissions.length;
            cycleTotalGrossCents += repGroup.gross_amount_cents;
            cycleTotalAdjCents += adjCents;
            cycleTotalNetCents += netCents;
            createdBatches.push(db.prepare(`SELECT * FROM commission_payout_batches WHERE id = ?`).get(batchId));
        }

        db.prepare(`
            UPDATE commission_payout_cycles
            SET total_representatives = ?,
                total_commissions_count = ?,
                total_amount_cents = ?,
                total_adjustments_cents = ?,
                net_amount_cents = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(byRep.size, cycleTotalComms, cycleTotalGrossCents, cycleTotalAdjCents, cycleTotalNetCents, cycleId);

        db.prepare(`
            INSERT INTO representative_audit_logs (
                id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
            ) VALUES (?, NULL, NULL, 'PAYOUT_CYCLE_CLOSED', ?, ?, ?, ?, ?)
        `).run(
            `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            actor ? actor.id : 'usr_admin',
            actor ? (actor.role_code || 'ADMIN') : 'ADMIN',
            `Fechamento financeiro da competência ${competenceMonth} (${byRep.size} representante(s), ${cycleTotalComms} comissões, líquido ${formatBrl(cycleTotalNetCents)})`,
            JSON.stringify({
                cycle_id: cycleId,
                competence_month: competenceMonth,
                payout_month: payoutMonth,
                total_representatives: byRep.size,
                total_commissions_count: cycleTotalComms,
                net_amount_cents: cycleTotalNetCents
            }),
            ipAddress
        );

        const cycle = db.prepare(`SELECT * FROM commission_payout_cycles WHERE id = ?`).get(cycleId);
        return { cycle, batches: createdBatches };
    })();

    logAudit({
        user: actor,
        action: 'CLOSE_COMMISSION_CYCLE',
        entityType: 'PAYOUT_CYCLE',
        entityId: result.cycle.id,
        ipAddress,
        dataAfter: {
            competence_month: competenceMonth,
            payout_month: payoutMonth,
            batches_count: result.batches.length,
            net_amount_cents: result.cycle.net_amount_cents
        }
    });

    publishSyncEvent(db, {
        eventType: 'PAYOUT_CYCLE_CLOSED',
        sourceApp: 'ADMIN_PANEL',
        entityType: 'PAYOUT_CYCLE',
        entityId: result.cycle.id,
        payload: {
            competence_month: competenceMonth,
            payout_month: payoutMonth,
            batches_count: result.batches.length,
            net_amount_cents: result.cycle.net_amount_cents
        }
    });

    return result;
}

/**
 * Marca um lote de pagamento como PAID após transferência realizada externamente e registrada pelo Admin.
 * Blindado contra pagamento duplicado (retorna 409 BATCH_ALREADY_PAID).
 */
function markPayoutBatchPaid(db, {
    batchId,
    transferReference,
    transferDate,
    paymentNotes = '',
    actor,
    ipAddress = '127.0.0.1'
}) {
    const cleanRef = String(transferReference || '').trim();
    if (!cleanRef || cleanRef.length < 3) {
        const err = new Error('Informe a referência/comprovante da transferência bancária ou PIX (mínimo 3 caracteres).');
        err.statusCode = 400;
        err.code = 'MISSING_TRANSFER_REFERENCE';
        throw err;
    }

    const cleanDate = String(transferDate || new Date().toISOString().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const err = new Error('Data da transferência inválida. Use o formato YYYY-MM-DD.');
        err.statusCode = 400;
        err.code = 'INVALID_TRANSFER_DATE';
        throw err;
    }

    const result = db.transaction(() => {
        const batch = db.prepare(`SELECT * FROM commission_payout_batches WHERE id = ?`).get(batchId);
        if (!batch) {
            const err = new Error('Lote de pagamento não encontrado.');
            err.statusCode = 404;
            err.code = 'BATCH_NOT_FOUND';
            throw err;
        }
        if (batch.status === 'PAID') {
            const err = new Error(`O lote ${batchId} já foi marcado como pago anteriormente (ref: ${batch.transfer_reference}). Pagamento duplicado bloqueado.`);
            err.statusCode = 409;
            err.code = 'BATCH_ALREADY_PAID';
            throw err;
        }
        if (batch.status === 'CANCELLED') {
            const err = new Error(`O lote ${batchId} está cancelado e não pode ser liquidado.`);
            err.statusCode = 400;
            err.code = 'BATCH_CANCELLED';
            throw err;
        }

        const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

        db.prepare(`
            UPDATE commission_payout_batches
            SET status = 'PAID',
                paid_at = ?,
                paid_by = ?,
                transfer_reference = ?,
                transfer_date = ?,
                payment_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nowIso,
            actor ? actor.id : 'usr_admin',
            cleanRef,
            cleanDate,
            String(paymentNotes || '').trim() || null,
            batchId
        );

        // Atualiza todas as comissões vinculadas ao lote para PAID
        const updateComms = db.prepare(`
            UPDATE representative_commissions
            SET status = 'PAID',
                paid_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (SELECT commission_id FROM commission_payout_items WHERE batch_id = ?)
              AND status = 'CONFIRMED'
        `).run(nowIso, batchId);

        // Verifica se todos os lotes do ciclo já foram pagos para promover o ciclo a PAID
        const remainingUnpaid = db.prepare(`
            SELECT COUNT(*) as cnt FROM commission_payout_batches
            WHERE cycle_id = ? AND status != 'PAID'
        `).get(batch.cycle_id).cnt;

        if (remainingUnpaid === 0) {
            db.prepare(`
                UPDATE commission_payout_cycles
                SET status = 'PAID', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(batch.cycle_id);
        }

        db.prepare(`
            INSERT INTO representative_audit_logs (
                id, representative_id, workshop_id, action, actor_id, actor_role, justification, metadata_json, ip_address
            ) VALUES (?, ?, NULL, 'PAYOUT_BATCH_PAID', ?, ?, ?, ?, ?)
        `).run(
            `ral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            batch.representative_id,
            actor ? actor.id : 'usr_admin',
            actor ? (actor.role_code || 'ADMIN') : 'ADMIN',
            `Pagamento de comissões registrado manualmente (${formatBrl(batch.net_amount_cents)} — Ref: ${cleanRef} em ${cleanDate})`,
            JSON.stringify({
                batch_id: batchId,
                cycle_id: batch.cycle_id,
                competence_month: batch.competence_month,
                net_amount_cents: batch.net_amount_cents,
                transfer_reference: cleanRef,
                transfer_date: cleanDate,
                commissions_marked_paid: updateComms.changes
            }),
            ipAddress
        );

        return {
            batch: db.prepare(`SELECT * FROM commission_payout_batches WHERE id = ?`).get(batchId),
            commissions_marked_paid: updateComms.changes,
            cycle_fully_paid: remainingUnpaid === 0
        };
    })();

    logAudit({
        user: actor,
        action: 'MARK_PAYOUT_BATCH_PAID',
        entityType: 'PAYOUT_BATCH',
        entityId: batchId,
        ipAddress,
        dataAfter: {
            batch_id: batchId,
            transfer_reference: cleanRef,
            transfer_date: cleanDate,
            net_amount_cents: result.batch.net_amount_cents,
            commissions_marked_paid: result.commissions_marked_paid
        }
    });

    publishSyncEvent(db, {
        eventType: 'PAYOUT_BATCH_PAID',
        sourceApp: 'ADMIN_PANEL',
        entityType: 'PAYOUT_BATCH',
        entityId: batchId,
        payload: {
            representative_id: result.batch.representative_id,
            competence_month: result.batch.competence_month,
            net_amount_cents: result.batch.net_amount_cents,
            transfer_reference: cleanRef
        }
    });

    return result;
}

/**
 * Histórico paginado de ciclos e lotes de pagamento.
 */
function getPayoutHistory(db, { representativeId = null, competenceMonth = null, status = null, page = 1, pageSize = 25 } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeSize = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 25));
    const offset = (safePage - 1) * safeSize;

    const where = ['1=1'];
    const params = [];
    if (representativeId) {
        where.push('b.representative_id = ?');
        params.push(representativeId);
    }
    if (competenceMonth && isValidYM(competenceMonth)) {
        where.push('b.competence_month = ?');
        params.push(competenceMonth);
    }
    if (status && ['SCHEDULED', 'PAID', 'CANCELLED'].includes(String(status).toUpperCase())) {
        where.push('b.status = ?');
        params.push(String(status).toUpperCase());
    }

    const whereSql = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM commission_payout_batches b WHERE ${whereSql}`).get(...params).cnt;

    const batches = db.prepare(`
        SELECT b.*, r.name as rep_name, r.email as rep_email, r.phone as rep_phone,
               u.name as paid_by_name
        FROM commission_payout_batches b
        JOIN representatives r ON b.representative_id = r.id
        LEFT JOIN users u ON u.id = b.paid_by
        WHERE ${whereSql}
        ORDER BY b.competence_month DESC, b.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, safeSize, offset).map(b => ({
        ...b,
        statement: (() => { try { return b.statement_json ? JSON.parse(b.statement_json) : null; } catch (_) { return null; } })()
    }));

    const cycles = db.prepare(`
        SELECT c.*, u.name as closed_by_name
        FROM commission_payout_cycles c
        LEFT JOIN users u ON u.id = c.closed_by
        ORDER BY c.competence_month DESC
        LIMIT 24
    `).all();

    return {
        page: safePage,
        page_size: safeSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / safeSize)),
        cycles,
        batches
    };
}

/**
 * Gerenciamento de Políticas Comerciais Versionadas (sem recalcular retroativamente histórico).
 */
function listCommercialPolicies(db) {
    return db.prepare(`
        SELECT * FROM commercial_policies
        ORDER BY is_active DESC, effective_from DESC, created_at DESC
    `).all();
}

function createCommercialPolicy(db, payload, actor, ipAddress = '127.0.0.1') {
    const versionCode = String(payload.version_code || '').trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    const title = String(payload.title || '').trim();
    const registrationPriceCents = Math.round(Number(payload.registration_price_cents));
    const workshopSplitPercent = payload.workshop_split_percent !== undefined ? Math.round(Number(payload.workshop_split_percent)) : 50;
    const repCommissionCents = payload.rep_commission_cents !== undefined ? Math.round(Number(payload.rep_commission_cents)) : 590;
    const attendanceFeeCents = payload.attendance_fee_cents !== undefined ? Math.round(Number(payload.attendance_fee_cents)) : 690;
    const validityMonths = payload.referral_validity_months !== undefined ? Math.max(1, parseInt(payload.referral_validity_months, 10)) : 24;
    const maxWorkshops = payload.default_max_workshops_per_rep !== undefined ? Math.max(1, parseInt(payload.default_max_workshops_per_rep, 10)) : 15;
    const payoutOffset = payload.payout_cycle_offset_months !== undefined ? Math.max(0, Math.min(3, parseInt(payload.payout_cycle_offset_months, 10))) : 1;
    const payoutDay = payload.payout_day_of_month !== undefined ? Math.max(1, Math.min(28, parseInt(payload.payout_day_of_month, 10))) : 10;
    const activateNow = Boolean(payload.activate_now);

    if (!versionCode || !title || !Number.isInteger(registrationPriceCents) || registrationPriceCents <= 0) {
        const err = new Error('version_code, title e registration_price_cents (> 0) são obrigatórios.');
        err.statusCode = 400;
        throw err;
    }

    const split = calculateExactSplitCents(registrationPriceCents, workshopSplitPercent);
    if (repCommissionCents < 0 || repCommissionCents > split.platform_split_cents) {
        const err = new Error('A comissão do representante deve ser >= 0 e não pode exceder a parcela da plataforma.');
        err.statusCode = 400;
        throw err;
    }

    const policyId = `pol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.transaction(() => {
        if (activateNow) {
            db.prepare(`UPDATE commercial_policies SET is_active = 0, effective_until = COALESCE(effective_until, ?), updated_at = CURRENT_TIMESTAMP WHERE is_active = 1`).run(nowIso);
        }
        db.prepare(`
            INSERT INTO commercial_policies (
                id, version_code, title, description,
                registration_price_cents, workshop_split_percent, platform_split_percent,
                workshop_split_cents, platform_split_cents,
                rep_commission_cents, attendance_fee_cents,
                referral_validity_months, default_max_workshops_per_rep,
                payout_cycle_offset_months, payout_day_of_month,
                effective_from, effective_until, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `).run(
            policyId, versionCode, title, String(payload.description || '').trim() || null,
            split.registration_price_cents, split.workshop_split_percent, split.platform_split_percent,
            split.workshop_split_cents, split.platform_split_cents,
            repCommissionCents, attendanceFeeCents, validityMonths, maxWorkshops,
            payoutOffset, payoutDay, payload.effective_from || nowIso, activateNow ? 1 : 0,
            actor ? actor.id : 'usr_admin'
        );
    })();

    const created = db.prepare(`SELECT * FROM commercial_policies WHERE id = ?`).get(policyId);
    logAudit({
        user: actor,
        action: 'CREATE_COMMERCIAL_POLICY',
        entityType: 'COMMERCIAL_POLICY',
        entityId: policyId,
        ipAddress,
        dataAfter: created
    });
    publishSyncEvent(db, {
        eventType: 'COMMERCIAL_POLICY_UPDATED',
        sourceApp: 'ADMIN_PANEL',
        entityType: 'COMMERCIAL_POLICY',
        entityId: policyId,
        payload: { version_code: versionCode, is_active: activateNow }
    });
    return created;
}

function activateCommercialPolicy(db, policyId, actor, ipAddress = '127.0.0.1') {
    const target = db.prepare(`SELECT * FROM commercial_policies WHERE id = ?`).get(policyId);
    if (!target) {
        const err = new Error('Política comercial não encontrada.');
        err.statusCode = 404;
        throw err;
    }
    const previous = getActiveCommercialPolicy(db);
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.transaction(() => {
        db.prepare(`UPDATE commercial_policies SET is_active = 0, effective_until = COALESCE(effective_until, ?), updated_at = CURRENT_TIMESTAMP WHERE is_active = 1 AND id != ?`).run(nowIso, policyId);
        db.prepare(`UPDATE commercial_policies SET is_active = 1, effective_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(policyId);
    })();

    const activated = db.prepare(`SELECT * FROM commercial_policies WHERE id = ?`).get(policyId);
    logAudit({
        user: actor,
        action: 'ACTIVATE_COMMERCIAL_POLICY',
        entityType: 'COMMERCIAL_POLICY',
        entityId: policyId,
        ipAddress,
        dataBefore: previous,
        dataAfter: activated
    });
    publishSyncEvent(db, {
        eventType: 'COMMERCIAL_POLICY_ACTIVATED',
        sourceApp: 'ADMIN_PANEL',
        entityType: 'COMMERCIAL_POLICY',
        entityId: policyId,
        payload: { version_code: activated.version_code, registration_price_cents: activated.registration_price_cents }
    });
    return activated;
}

module.exports = {
    formatBrl,
    getCurrentYM,
    extractYM,
    isValidYM,
    calculateExactSplitCents,
    getActiveCommercialPolicy,
    getPayoutConfig,
    computePayoutMonth,
    computeScheduledPayoutDate,
    validateCommissionEligibility,
    upsertRepresentativeCommission,
    refundCommissionByPayment,
    getCommissionFinanceOverview,
    getNextPayoutForecast,
    closeCompetenceCycle,
    markPayoutBatchPaid,
    getPayoutHistory,
    listCommercialPolicies,
    createCommercialPolicy,
    activateCommercialPolicy
};
