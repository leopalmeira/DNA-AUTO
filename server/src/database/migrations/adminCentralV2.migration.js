/**
 * DNA AUTO — Migração Incremental e Idempotente: Central Administrativa Integrada V2
 *
 * Preserva integralmente os dados existentes e adiciona:
 * - Políticas comerciais versionadas (commercial_policies)
 * - Ciclos e lotes de fechamento/pagamento de comissões (commission_payout_cycles, commission_payout_batches, commission_payout_items)
 * - Ajustes financeiros auditáveis (financial_adjustments)
 * - Eventos de sincronização multi-app (sync_events)
 * - Configurações administrativas (admin_system_settings)
 * - Colunas de rastreabilidade por competência em representative_commissions
 * - Índices estratégicos para consultas de alto volume
 */

function safeAddColumn(db, tableName, columnName, columnDef) {
    try {
        const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
        if (!cols.some(c => c.name === columnName)) {
            db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        }
    } catch (err) {
        console.warn(`[Migration V2] Aviso ao adicionar coluna ${tableName}.${columnName}:`, err.message);
    }
}

function addMonthsToYM(ym, offsetMonths = 1) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return null;
    const [y, m] = ym.split('-').map(Number);
    const date = new Date(Date.UTC(y, (m - 1) + Number(offsetMonths || 0), 1));
    const ny = date.getUTCFullYear();
    const nm = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${ny}-${nm}`;
}

function runAdminCentralV2Migration(db) {
    // 1. Novas tabelas complementares (idempotentes)
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Políticas Comerciais Versionadas (Sem preços espalhados em constantes)
        CREATE TABLE IF NOT EXISTS commercial_policies (
            id TEXT PRIMARY KEY,
            version_code TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            description TEXT,
            registration_price_cents INTEGER NOT NULL,
            workshop_split_percent INTEGER NOT NULL DEFAULT 50,
            platform_split_percent INTEGER NOT NULL DEFAULT 50,
            workshop_split_cents INTEGER NOT NULL,
            platform_split_cents INTEGER NOT NULL,
            rep_commission_cents INTEGER NOT NULL DEFAULT 590,
            attendance_fee_cents INTEGER NOT NULL DEFAULT 690,
            referral_validity_months INTEGER NOT NULL DEFAULT 24,
            default_max_workshops_per_rep INTEGER NOT NULL DEFAULT 15,
            payout_cycle_offset_months INTEGER NOT NULL DEFAULT 1,
            payout_day_of_month INTEGER NOT NULL DEFAULT 10,
            effective_from DATETIME NOT NULL,
            effective_until DATETIME,
            is_active INTEGER NOT NULL DEFAULT 0,
            created_by TEXT DEFAULT 'SYSTEM',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Fechamentos de Competência Financeira (1 por mês YYYY-MM)
        CREATE TABLE IF NOT EXISTS commission_payout_cycles (
            id TEXT PRIMARY KEY,
            competence_month TEXT NOT NULL UNIQUE,
            payout_month TEXT NOT NULL,
            scheduled_payout_date DATE,
            status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'PAID'
            total_representatives INTEGER NOT NULL DEFAULT 0,
            total_commissions_count INTEGER NOT NULL DEFAULT 0,
            total_amount_cents INTEGER NOT NULL DEFAULT 0,
            total_adjustments_cents INTEGER NOT NULL DEFAULT 0,
            net_amount_cents INTEGER NOT NULL DEFAULT 0,
            policy_snapshot_json TEXT,
            closed_by TEXT,
            closed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Lotes de Pagamento por Representante dentro de uma Competência
        CREATE TABLE IF NOT EXISTS commission_payout_batches (
            id TEXT PRIMARY KEY,
            cycle_id TEXT NOT NULL REFERENCES commission_payout_cycles(id) ON DELETE RESTRICT,
            competence_month TEXT NOT NULL,
            payout_month TEXT NOT NULL,
            scheduled_payout_date DATE,
            representative_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE RESTRICT,
            rep_code TEXT NOT NULL,
            commissions_count INTEGER NOT NULL DEFAULT 0,
            gross_amount_cents INTEGER NOT NULL DEFAULT 0,
            adjustments_cents INTEGER NOT NULL DEFAULT 0,
            net_amount_cents INTEGER NOT NULL DEFAULT 0,
            pix_key_snapshot TEXT,
            status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'PAID', 'CANCELLED'
            paid_at DATETIME,
            paid_by TEXT,
            transfer_reference TEXT,
            transfer_date DATE,
            payment_notes TEXT,
            statement_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(competence_month, representative_id)
        );

        -- Itens do Lote (UNIQUE em commission_id impede pagamento duplicado a nível de SGBD)
        CREATE TABLE IF NOT EXISTS commission_payout_items (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL REFERENCES commission_payout_batches(id) ON DELETE CASCADE,
            commission_id TEXT NOT NULL UNIQUE REFERENCES representative_commissions(id) ON DELETE RESTRICT,
            workshop_id TEXT NOT NULL,
            source_payment_id TEXT NOT NULL,
            amount_cents INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Ajustes Financeiros (Clawback de estorno pós-pago, bonificação, retenção por contestação)
        CREATE TABLE IF NOT EXISTS financial_adjustments (
            id TEXT PRIMARY KEY,
            representative_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE RESTRICT,
            commission_id TEXT REFERENCES representative_commissions(id) ON DELETE SET NULL,
            batch_id TEXT REFERENCES commission_payout_batches(id) ON DELETE SET NULL,
            competence_month TEXT NOT NULL,
            adjustment_type TEXT NOT NULL, -- 'CLAWBACK', 'BONUS', 'DISPUTE_HOLD', 'CORRECTION'
            amount_cents INTEGER NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'APPLIED', 'CANCELLED'
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Eventos de Sincronização Multi-App (Cliente, Oficina, Representante, Admin, Webhook)
        CREATE TABLE IF NOT EXISTS sync_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            event_type TEXT NOT NULL,
            source_app TEXT NOT NULL DEFAULT 'SYSTEM',
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            payload_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Configurações Administrativas da Plataforma
        CREATE TABLE IF NOT EXISTS admin_system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'GENERAL',
            description TEXT,
            updated_by TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Colunas complementares em tabelas existentes (idempotentes)
    safeAddColumn(db, 'representative_commissions', 'policy_id', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'competence_month', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'payout_month', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'payout_batch_id', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'payout_item_id', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'dispute_status', "TEXT NOT NULL DEFAULT 'NONE'");
    safeAddColumn(db, 'representative_commissions', 'blocked_reason', 'TEXT');
    safeAddColumn(db, 'representative_commissions', 'updated_at', 'DATETIME');

    safeAddColumn(db, 'client_activations', 'billing_status', "TEXT DEFAULT 'PENDING'");
    safeAddColumn(db, 'commissions', 'paid_at', 'DATETIME');
    safeAddColumn(db, 'commissions', 'payout_reference', 'TEXT');
    safeAddColumn(db, 'commissions', 'paid_by', 'TEXT');
    safeAddColumn(db, 'workshops', 'whatsapp_official', 'TEXT');
    safeAddColumn(db, 'workshops', 'whatsapp_status', "TEXT DEFAULT 'UNVERIFIED'");

    // 3. Índices estratégicos (idempotentes)
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_rep_comm_comp_status ON representative_commissions(competence_month, status);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_payout_month ON representative_commissions(payout_month, status);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_batch ON representative_commissions(payout_batch_id);
        CREATE INDEX IF NOT EXISTS idx_rep_comm_rep_ws_status ON representative_commissions(representative_id, workshop_id, status);
        CREATE INDEX IF NOT EXISTS idx_payout_batches_comp ON commission_payout_batches(competence_month, status);
        CREATE INDEX IF NOT EXISTS idx_payout_batches_rep ON commission_payout_batches(representative_id, status);
        CREATE INDEX IF NOT EXISTS idx_payout_items_batch ON commission_payout_items(batch_id);
        CREATE INDEX IF NOT EXISTS idx_fin_adj_rep_comp ON financial_adjustments(representative_id, competence_month, status);
        CREATE INDEX IF NOT EXISTS idx_sync_events_type_created ON sync_events(event_type, created_at);
        CREATE INDEX IF NOT EXISTS idx_sync_events_created ON sync_events(created_at);
        CREATE INDEX IF NOT EXISTS idx_dna_act_ws_status_date ON dna_activations(workshop_id, payment_status, activated_at);
        CREATE INDEX IF NOT EXISTS idx_pix_ws_status_paid ON workshop_pix_charges(workshop_id, status, paid_at);
        CREATE INDEX IF NOT EXISTS idx_ws_status_state ON workshops(status, state);
        CREATE INDEX IF NOT EXISTS idx_reps_status_state ON representatives(status, state);
        CREATE INDEX IF NOT EXISTS idx_att_fees_ws_created ON workshop_attendance_fees(workshop_id, created_at);
    `);

    // 4. Seed idempotente das Políticas Comerciais Versionadas
    const policyCount = db.prepare(`SELECT COUNT(*) AS cnt FROM commercial_policies`).get().cnt;
    if (policyCount === 0) {
        const insertPolicy = db.prepare(`
            INSERT OR IGNORE INTO commercial_policies (
                id, version_code, title, description,
                registration_price_cents, workshop_split_percent, platform_split_percent,
                workshop_split_cents, platform_split_cents,
                rep_commission_cents, attendance_fee_cents,
                referral_validity_months, default_max_workshops_per_rep,
                payout_cycle_offset_months, payout_day_of_month,
                effective_from, effective_until, is_active, created_by
            ) VALUES (
                @id, @version_code, @title, @description,
                @registration_price_cents, @workshop_split_percent, @platform_split_percent,
                @workshop_split_cents, @platform_split_cents,
                @rep_commission_cents, @attendance_fee_cents,
                @referral_validity_months, @default_max_workshops_per_rep,
                @payout_cycle_offset_months, @payout_day_of_month,
                @effective_from, @effective_until, @is_active, 'SYSTEM_MIGRATION'
            )
        `);

        insertPolicy.run({
            id: 'pol_v1_4990',
            version_code: 'POLICY_2026_V1_4990',
            title: 'Política Vigente — Cadastro R$ 49,90 (50/50 + Rep R$ 5,90)',
            description: 'Cadastro R$ 49,90 com 50% Oficina (R$ 24,95), 50% Plataforma (R$ 24,95), comissão comercial de R$ 5,90 custeada pela plataforma e vínculo de 24 meses.',
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
            effective_from: '2026-01-01 00:00:00',
            effective_until: null,
            is_active: 1
        });

        insertPolicy.run({
            id: 'pol_v2_5990',
            version_code: 'POLICY_2026_V2_5990',
            title: 'Política Nova Tabela — Cadastro R$ 59,90 (50/50 + Rep R$ 5,90)',
            description: 'Nova tabela configurável de R$ 59,90 com divisão 50% Oficina (R$ 29,95), 50% Plataforma (R$ 29,95), comissão comercial de R$ 5,90 custeada pela plataforma e vínculo de 24 meses. Pronta para ativação sem recalcular histórico.',
            registration_price_cents: 5990,
            workshop_split_percent: 50,
            platform_split_percent: 50,
            workshop_split_cents: 2995,
            platform_split_cents: 2995,
            rep_commission_cents: 590,
            attendance_fee_cents: 690,
            referral_validity_months: 24,
            default_max_workshops_per_rep: 15,
            payout_cycle_offset_months: 1,
            payout_day_of_month: 10,
            effective_from: '2026-12-01 00:00:00',
            effective_until: null,
            is_active: 0
        });
    }

    // 5. Configurações administrativas padrão (idempotentes)
    const ensureSetting = db.prepare(`
        INSERT OR IGNORE INTO admin_system_settings (key, value, category, description, updated_by)
        VALUES (?, ?, ?, ?, 'SYSTEM_MIGRATION')
    `);
    ensureSetting.run('payout_cycle_offset_months', '1', 'FINANCE', 'Meses de deslocamento entre competência confirmada e mês de pagamento (ex: 1 = mês seguinte)');
    ensureSetting.run('payout_day_of_month', '10', 'FINANCE', 'Dia previsto do mês para liquidação do ciclo de comissões');
    ensureSetting.run('global_monthly_workshops_goal', '50', 'GOALS', 'Meta global mensal de novas oficinas credenciadas');
    ensureSetting.run('global_monthly_activations_goal', '500', 'GOALS', 'Meta global mensal de cadastros pagos DNA AUTO');
    ensureSetting.run('global_monthly_revenue_goal_cents', '2495000', 'GOALS', 'Meta global mensal de faturamento confirmado (centavos)');
    ensureSetting.run('sync_polling_interval_seconds', '30', 'SYNC', 'Intervalo de fallback de sincronização do painel administrativo (segundos)');
    ensureSetting.run('pix_auto_payout_enabled', 'false', 'FINANCE', 'Transferência PIX automática desativada por governança (exige registro administrativo auditado)');

    // 6. Backfill idempotente de competence_month e payout_month em comissões legadas
    const missingCompRows = db.prepare(`
        SELECT id, confirmed_at, created_at, policy_id
        FROM representative_commissions
        WHERE competence_month IS NULL OR payout_month IS NULL OR policy_id IS NULL
    `).all();

    if (missingCompRows.length > 0) {
        const activePolicy = db.prepare(`SELECT id, payout_cycle_offset_months FROM commercial_policies WHERE is_active = 1 LIMIT 1`).get();
        const offsetMonths = activePolicy ? Number(activePolicy.payout_cycle_offset_months || 1) : 1;
        const defaultPolicyId = activePolicy ? activePolicy.id : 'pol_v1_4990';
        const updateComm = db.prepare(`
            UPDATE representative_commissions
            SET competence_month = COALESCE(competence_month, ?),
                payout_month = COALESCE(payout_month, ?),
                policy_id = COALESCE(policy_id, ?)
            WHERE id = ?
        `);
        db.transaction(() => {
            for (const row of missingCompRows) {
                const refDate = String(row.confirmed_at || row.created_at || new Date().toISOString());
                const ym = refDate.slice(0, 7);
                const compMonth = /^\d{4}-\d{2}$/.test(ym) ? ym : new Date().toISOString().slice(0, 7);
                const payMonth = addMonthsToYM(compMonth, offsetMonths);
                updateComm.run(compMonth, payMonth, defaultPolicyId, row.id);
            }
        })();
    }

    // 7. Registra aplicação da migração
    db.prepare(`
        INSERT OR IGNORE INTO schema_migrations (id, description)
        VALUES ('20261120_admin_central_v2', 'Central Administrativa Integrada V2: políticas versionadas, fechamento de comissões, ajustes, sync e índices')
    `).run();
}

module.exports = {
    runAdminCentralV2Migration,
    addMonthsToYM
};
