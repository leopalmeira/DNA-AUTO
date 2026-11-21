// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — MÓDULO FINANCEIRO & COMISSÕES
// Faturamento Geral, Comissões, Próximos Pagamentos, Repasses, Taxas, Conciliação
// ==============================================================================

const AdminScreensFinance = {
    // --------------------------------------------------------------------------
    // 1. FATURAMENTO GERAL
    // --------------------------------------------------------------------------
    async renderRevenue(ctx) {
        const [fin, series, policiesRes] = await Promise.all([
            API.getAdminFinanceOverview({ competence_month: ctx.month }),
            API.getAdminDashboardTimeseries({ months: 6 }),
            API.getAdminCommercialPolicies()
        ]);
        const UI = AdminView.ui();
        const rev = fin.revenue || {};
        const comm = fin.commissions || {};
        const wp = fin.workshop_payouts || {};
        const fees = fin.attendance_fees || {};
        const pol = fin.payout_rules?.active_policy || {};
        const policies = policiesRes.policies || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Faturamento Geral & Estrutura Comercial',
                subtitle: 'Receitas confirmadas em centavos inteiros, política comercial vigente e divisão exata entre Plataforma, Oficinas e Representantes.',
                actionsHtml: `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('settings')">Gerenciar Políticas Comerciais →</button>`
            })}

            <div class="adm-chain-box">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <span class="adm-badge adm-badge-success"><span class="adm-badge-dot" aria-hidden="true"></span>POLÍTICA ATIVA: ${esc(pol.version_code || 'V1')}</span>
                        <strong class="adm-text-primary">${esc(pol.title || 'Tabela Padrão')}</strong>
                    </div>
                    <div class="adm-mono adm-text-secondary" style="font-size:13px;">
                        Cadastro: <strong class="adm-text-primary">${brl(pol.registration_price_cents)}</strong> • Oficina (${pol.workshop_split_percent || 50}%): <strong class="adm-text-primary">${brl(pol.workshop_split_cents)}</strong> • Plataforma (${pol.platform_split_percent || 50}%): <strong class="adm-text-primary">${brl(pol.platform_split_cents)}</strong> • Comissão Rep.: <strong class="adm-text-accent">${brl(pol.rep_commission_cents)}</strong> • Taxa Retorno: <strong class="adm-text-primary">${brl(pol.attendance_fee_cents)}</strong>
                    </div>
                </div>
            </div>

            <div class="adm-kpi-grid">
                ${UI.FinancialMetric({ label: 'Faturamento Confirmado (Bruto)', cents: rev.confirmed_revenue_cents, classification: 'Confirmado', sub: `${rev.pix_paid_count || 0} PIX pagos • ${rev.dna_completed_count || 0} DNA liquidados`, tone: 'tone-success' })}
                ${UI.FinancialMetric({ label: 'Parcela Plataforma (PIX Liquidado)', cents: rev.pix_paid_platform_cents, classification: 'Recebido', sub: `PIX Pendentes: ${brl(rev.pix_pending_cents)} (${rev.pix_pending_count || 0})`, tone: 'tone-cyan' })}
                ${UI.FinancialMetric({ label: 'Comissões Representantes (Elegível)', cents: comm.eligible_balance_cents, classification: 'A Pagar', sub: `Pagas: ${brl(comm.paid_cents)} • Projetadas: ${brl(comm.projected_cents)}`, tone: 'tone-gold' })}
                ${UI.FinancialMetric({ label: 'Repasses Oficinas Pendentes', cents: wp.pending_cents, classification: 'A Repassar', sub: `Já repassado: ${brl(wp.paid_cents)} • Taxas conf.: ${brl(fees.confirmed_cents)}`, tone: 'tone-warning' })}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Evolução Mensal do Faturamento Confirmado</h3></div>
                    ${AdminCharts.renderLineChart(series.revenue_by_month || [], {
                        valueKey: 'confirmed_revenue_cents',
                        labelKey: 'month',
                        seriesLabel: 'Faturamento Confirmado (BRL)',
                        color: 'var(--adm-chart-2)',
                        isCurrency: true
                    })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Políticas Comerciais Versionadas (${policies.length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: policies,
                        emptyTitle: 'Nenhuma política cadastrada',
                        columns: [
                            { key: 'version_code', label: 'Versão', render: p => `<strong class="adm-mono">${esc(p.version_code)}</strong><div class="adm-cell-sub">${esc(p.title)}</div>` },
                            { key: 'registration_price_cents', label: 'Cadastro', align: 'right', tdClass: 'adm-money', render: p => brl(p.registration_price_cents) },
                            { key: 'workshop_split_cents', label: 'Oficina / Plat.', align: 'right', tdClass: 'adm-mono', render: p => `${brl(p.workshop_split_cents)} / ${brl(p.platform_split_cents)}` },
                            { key: 'rep_commission_cents', label: 'Comissão Rep.', align: 'right', tdClass: 'adm-money adm-text-accent', render: p => brl(p.rep_commission_cents) },
                            { key: 'is_active', label: 'Status', render: p => p.is_active ? AdminView.statusBadge('ACTIVE', 'Ativa') : AdminView.statusBadge('INACTIVE', 'Inativa') }
                        ]
                    })}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. COMISSÕES DE REPRESENTANTES (8 Indicadores + Extrato Auditável)
    // --------------------------------------------------------------------------
    async renderCommissions(ctx) {
        const f = ctx.params || {};
        const compMonth = f.competence_month || ctx.month || '';
        const pageSize = Number(f.page_size || 30);
        const [overview, listRes] = await Promise.all([
            API.getAdminFinanceOverview({ competence_month: compMonth }),
            API.getAdminFinanceCommissions({
                status: f.status || '',
                competence_month: compMonth,
                dispute_status: f.dispute_status || '',
                q: f.q || '',
                page: f.page || 1,
                page_size: pageSize
            })
        ]);
        const UI = AdminView.ui();
        const c = overview.commissions || {};
        const items = listRes.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: `Comissões de Representantes (${AdminView.formatNum(listRes.total)})`,
                subtitle: 'Motor financeiro auditável por cadastro elegível e efetivamente pago dentro da vigência contratual de 24 meses.',
                actionsHtml: `<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('payouts')">Próximos Pagamentos & Fechamento →</button>`
            })}

            <div class="adm-kpi-grid">
                ${UI.FinancialMetric({ label: 'Comissões Projetadas', cents: c.projected_cents, classification: 'Projetado', sub: `${c.projected_count || 0} reg. (PIX pendente — fora de pagamento)`, tone: 'tone-muted' })}
                ${UI.FinancialMetric({ label: 'Comissões Confirmadas (Total)', cents: c.confirmed_total_cents, classification: 'Confirmado', sub: `${c.confirmed_total_count || 0} elegíveis confirmadas`, tone: 'tone-success' })}
                ${UI.FinancialMetric({ label: 'Comissões Já Pagas', cents: c.paid_cents, classification: 'Liquidado', sub: `${c.paid_count || 0} repasse(s) liquidado(s)`, tone: 'tone-cyan' })}
                ${UI.FinancialMetric({ label: 'Comissões Estornadas', cents: c.refunded_cents, classification: 'Estorno', sub: `${c.refunded_count || 0} estorno(s) / reembolso(s)`, tone: 'tone-danger' })}
                ${UI.FinancialMetric({ label: 'Comissões Vencidas (Ant.)', cents: c.overdue_cents, classification: 'Pendente', sub: `${c.overdue_count || 0} de competências anteriores`, tone: 'tone-warning' })}
                ${UI.FinancialMetric({ label: 'Comissões do Próximo Ciclo', cents: c.next_cycle_eligible_cents, classification: 'Previsto', sub: `${c.next_cycle_eligible_count || 0} na comp. ${overview.competence_month} → ${overview.payout_month}`, tone: 'tone-gold' })}
                ${UI.FinancialMetric({ label: 'Saldo Elegível Líquido', cents: c.eligible_balance_cents, classification: 'A Pagar', sub: `Ajustes abertos: ${brl(c.open_adjustments_cents)}`, tone: 'tone-success' })}
                ${UI.FinancialMetric({ label: 'Bloqueado por Contestação', cents: c.blocked_dispute_cents, classification: 'Bloqueado', sub: `${c.blocked_dispute_count || 0} comissão(ões) em análise`, tone: 'tone-danger' })}
            </div>

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="comm-q" class="adm-input adm-filter-search" aria-label="Buscar comissão"
                           placeholder="Buscar representante, oficina ou ID de pagamento..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensFinance.applyCommFilters()" />
                    <input type="month" id="comm-month" class="adm-input" aria-label="Competência" value="${esc(compMonth)}" onchange="AdminScreensFinance.applyCommFilters()" />
                    <select id="comm-status" class="adm-select" aria-label="Status da comissão" onchange="AdminScreensFinance.applyCommFilters()">
                        <option value="" ${!f.status ? 'selected' : ''}>Status: Todos</option>
                        <option value="CONFIRMED" ${f.status === 'CONFIRMED' ? 'selected' : ''}>Confirmada</option>
                        <option value="PROJECTED" ${f.status === 'PROJECTED' ? 'selected' : ''}>Projetada</option>
                        <option value="PAID" ${f.status === 'PAID' ? 'selected' : ''}>Paga</option>
                        <option value="REFUNDED" ${f.status === 'REFUNDED' ? 'selected' : ''}>Estornada</option>
                    </select>
                    <select id="comm-dispute" class="adm-select" aria-label="Status de contestação" onchange="AdminScreensFinance.applyCommFilters()">
                        <option value="" ${!f.dispute_status ? 'selected' : ''}>Contestação: Todas</option>
                        <option value="NONE" ${f.dispute_status === 'NONE' ? 'selected' : ''}>Sem contestação</option>
                        <option value="DISPUTED" ${f.dispute_status === 'DISPUTED' ? 'selected' : ''}>Bloqueadas / Contestadas</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensFinance.applyCommFilters()">Aplicar Filtros</button>
                    <button type="button" class="adm-btn" onclick="AdminView.navigate('commissions')">Limpar</button>
                `)}

                ${UI.EnterpriseDataTable({
                    rows: items,
                    emptyTitle: 'Nenhuma comissão encontrada',
                    emptySubtitle: 'Não há lançamentos de comissão para os filtros aplicados.',
                    pagination: { page: listRes.page, totalPages: listRes.total_pages, total: listRes.total, pageSize },
                    columns: [
                        {
                            key: 'rep_code', label: 'Cadeia Auditável (Rep → Oficina → Pagamento)',
                            render: cm => `
                                <div class="adm-chain-flow">
                                    <span class="adm-chain-step"><strong class="adm-text-accent adm-mono">${esc(cm.rep_code)}</strong> ${esc(cm.rep_name)}</span>
                                    <span class="adm-chain-arrow" aria-hidden="true">→</span>
                                    <span class="adm-chain-step">${esc(cm.workshop_name)}</span>
                                    <span class="adm-chain-arrow" aria-hidden="true">→</span>
                                    <span class="adm-chain-step adm-mono">${esc(cm.license_plate || cm.activation_code || cm.source_payment_id)} (${esc(cm.payment_status || cm.status)})</span>
                                </div>
                            `
                        },
                        { key: 'policy_version_code', label: 'Política', tdClass: 'adm-mono', render: cm => esc(cm.policy_version_code || 'V1') },
                        { key: 'commission_amount_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: cm => brl(cm.commission_amount_cents) },
                        { key: 'competence_month', label: 'Competência → Pgto', tdClass: 'adm-mono', render: cm => `${esc(cm.competence_month || '-')} → ${esc(cm.payout_month || '-')}` },
                        {
                            key: 'status', label: 'Status',
                            render: cm => `
                                ${AdminView.statusBadge(cm.status)}
                                ${cm.dispute_status === 'DISPUTED' ? `<div style="margin-top:4px;" title="${esc(cm.blocked_reason || '')}">${AdminView.statusBadge('DISPUTED', 'Bloqueada')}</div>` : ''}
                            `
                        },
                        {
                            key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                            render: cm => {
                                if (cm.status === 'CONFIRMED' && cm.dispute_status !== 'DISPUTED') {
                                    return `<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensFinance.toggleDispute('${esc(cm.id)}', 'DISPUTED')">Contestar</button>`;
                                }
                                if (cm.status === 'CONFIRMED' && cm.dispute_status === 'DISPUTED') {
                                    return `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.toggleDispute('${esc(cm.id)}', 'NONE')">Desbloquear</button>`;
                                }
                                return `<span class="adm-text-muted adm-mono" style="font-size:12px;">${cm.payout_batch_id ? esc(cm.payout_batch_id) : 'Encerrada'}</span>`;
                            }
                        }
                    ]
                })}
            </div>
        `;
    },

    applyCommFilters() {
        AdminView.updateParams({
            q: document.getElementById('comm-q')?.value || '',
            competence_month: document.getElementById('comm-month')?.value || '',
            status: document.getElementById('comm-status')?.value || '',
            dispute_status: document.getElementById('comm-dispute')?.value || '',
            page: 1
        });
    },

    toggleDispute(commissionId, nextStatus) {
        const isDispute = nextStatus === 'DISPUTED';
        AdminView.openConfirmDialog({
            title: isDispute ? 'Contestar e Bloquear Comissão' : 'Desbloquear Comissão para Pagamento',
            message: isDispute
                ? 'Esta comissão ficará bloqueada e será excluída automaticamente do fechamento financeiro até que seja liberada.'
                : 'A comissão contestada voltará a ficar elegível para composição do próximo ciclo financeiro.',
            confirmLabel: isDispute ? 'Confirmar Bloqueio' : 'Confirmar Liberação',
            tone: isDispute ? 'danger' : 'success',
            inputConfig: isDispute ? {
                id: 'comm-dispute-reason',
                label: 'Motivo da Contestação / Bloqueio',
                placeholder: 'Informe o motivo técnico ou divergência encontrada (mínimo 5 caracteres)...',
                required: true,
                minLength: 5
            } : null,
            onConfirm: async (reason) => {
                await API.updateAdminCommissionDispute(commissionId, { dispute_status: nextStatus, reason: reason || '' });
                AdminView.toast(isDispute ? 'Comissão bloqueada por contestação.' : 'Comissão liberada para pagamento.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 3. PRÓXIMOS PAGAMENTOS, FECHAMENTO FINANCEIRO & HISTÓRICO DE CICLOS
    // --------------------------------------------------------------------------
    async renderPayouts(ctx) {
        const defaultYM = new Date().toISOString().slice(0, 7);
        const compMonth = (ctx.params && ctx.params.competence_month) || ctx.month || defaultYM;
        const [forecast, history] = await Promise.all([
            API.getAdminNextPayouts({ competence_month: compMonth }),
            API.getAdminPayoutsHistory({ page: 1, page_size: 25 })
        ]);
        const UI = AdminView.ui();
        const sum = forecast.summary || {};
        const reps = forecast.representatives || [];
        const batches = history.batches || [];
        const cycles = history.cycles || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Próximos Pagamentos & Fechamento de Ciclo',
                subtitle: `Competência <strong>${esc(forecast.competence_month)}</strong> → Pagamento previsto em <strong>${esc(forecast.scheduled_payout_date)}</strong> (${esc(forecast.payout_month)}). Liquidação exclusivamente via registro administrativo auditado.`,
                actionsHtml: `
                    <input type="month" class="adm-input" aria-label="Competência do ciclo" value="${esc(forecast.competence_month)}" onchange="AdminView.updateParams({ competence_month: this.value })" />
                    ${forecast.can_close
                        ? `<button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensFinance.openCloseCycleModal('${esc(forecast.competence_month)}', ${sum.next_payout_net_cents || 0}, ${sum.eligible_representatives_count || 0})">Fechar Ciclo ${esc(forecast.competence_month)}</button>`
                        : `<span class="adm-badge ${forecast.cycle_status === 'OPEN' ? 'adm-badge-muted' : 'adm-badge-success'}"><span class="adm-badge-dot" aria-hidden="true"></span>CICLO: ${esc(forecast.cycle_status)}</span>`}
                `
            })}

            <div class="adm-kpi-grid">
                ${UI.FinancialMetric({ label: 'Próximo Pagamento (Líquido Elegível)', cents: sum.next_payout_net_cents, classification: 'Previsto', sub: `${sum.eligible_representatives_count || 0} rep(s) elegível(is) • Somente CONFIRMED`, tone: 'tone-gold' })}
                ${UI.FinancialMetric({ label: 'Projetado (Excluído do Pagamento)', cents: sum.projected_cents, classification: 'Projetado', sub: 'Aguardando confirmação de pagamento PIX', tone: 'tone-muted' })}
                ${UI.FinancialMetric({ label: 'Contestadas / Estornadas', cents: (sum.disputed_cents || 0) + (sum.refunded_cents || 0), classification: 'Bloqueado', sub: `Ajustes aplicados: ${brl(sum.adjustments_cents)}`, tone: 'tone-danger' })}
                ${UI.FinancialMetric({ label: 'Já Liquidado na Competência', cents: sum.paid_cents, classification: 'Liquidado', sub: `Política: ${forecast.policy?.version_code || 'V1'} (dia ${forecast.policy?.payout_day_of_month || 10})`, tone: 'tone-success' })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Demonstrativo Detalhado por Representante — Competência ${esc(forecast.competence_month)}</h3>
                        <p class="adm-card-subtitle">Árvore completa: Representante → Oficina → Cadastro → Pagamento Confirmado → Comissão → Competência → Agendamento</p>
                    </div>
                </div>

                ${reps.length === 0
                    ? UI.EmptyState({ title: `Nenhuma comissão na competência ${forecast.competence_month}`, subtitle: 'Selecione outra competência ou aguarde confirmações de pagamento.' })
                    : reps.map(r => `
                        <div class="adm-chain-box">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                <div>
                                    <strong class="adm-text-primary" style="font-size:15px;">${esc(r.rep_name)}</strong>
                                    <span class="adm-mono adm-text-accent" style="margin-left:8px; font-weight:700;">${esc(r.rep_code)}</span>
                                    <span style="margin-left:8px;">${AdminView.statusBadge(r.batch_status)}</span>
                                    <div class="adm-text-secondary" style="font-size:13px; margin-top:4px;">
                                        Elegíveis: <strong>${r.eligible_commissions_count}</strong> (${brl(r.eligible_gross_cents)}) • Projetadas (fora do ciclo): <strong>${brl(r.projected_cents)}</strong> • Ajustes: <strong>${brl(r.adjustments_cents)}</strong> • Líquido: <strong class="adm-text-accent">${brl(r.next_payout_net_cents)}</strong>
                                    </div>
                                </div>
                                <div class="adm-actions-group">
                                    ${r.batch_id && r.batch_status === 'SCHEDULED'
                                        ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.openMarkPaidModal('${esc(r.batch_id)}', '${esc(r.rep_name)}', ${r.batch_net_amount_cents || r.next_payout_net_cents})">Registrar Pagamento Realizado</button>`
                                        : r.batch_status === 'PAID'
                                            ? `<span class="adm-badge adm-badge-success"><span class="adm-badge-dot" aria-hidden="true"></span>PAGO • REF: ${esc(r.transfer_reference || '-')} (${esc(r.transfer_date || '')})</span>`
                                            : ''}
                                </div>
                            </div>

                            ${(r.workshops || []).map(ws => `
                                <div style="margin-left:14px; padding-left:14px; border-left:2px solid var(--adm-primary-border); margin-bottom:10px;">
                                    <div style="font-size:13px; color:var(--adm-text-primary); margin-bottom:6px;">
                                        <strong>Oficina:</strong> ${esc(ws.workshop_name)} (${esc(ws.workshop_city || '-')}/${esc(ws.workshop_state || '-')}) — Elegíveis: <strong>${ws.eligible_count}</strong> (<span class="adm-money">${brl(ws.eligible_cents)}</span>)
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:5px;">
                                        ${(ws.items || []).map(it => `
                                            <div class="adm-chain-flow">
                                                <span class="adm-chain-step">Cadastro: <strong>${esc(it.license_plate || it.activation_code || it.commission_id)}</strong></span>
                                                <span class="adm-chain-arrow" aria-hidden="true">→</span>
                                                <span class="adm-chain-step">Pgto: ${esc(it.payment_status)} (${esc(AdminView.formatDate(it.payment_paid_at))})</span>
                                                <span class="adm-chain-arrow" aria-hidden="true">→</span>
                                                <span class="adm-chain-step">Comissão: <strong class="adm-money">${brl(it.commission_amount_cents)}</strong> (${esc(it.status)})</span>
                                                <span class="adm-chain-arrow" aria-hidden="true">→</span>
                                                <span class="adm-chain-step">Comp. ${esc(it.competence_month)} → Agendado ${esc(it.scheduled_payout_date)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Histórico de Lotes & Ciclos Fechados (${batches.length} lotes / ${cycles.length} ciclos)</h3>
                        <p class="adm-card-subtitle">Registro imutável de todos os fechamentos e liquidações realizadas manualmente</p>
                    </div>
                </div>
                ${UI.EnterpriseDataTable({
                    rows: batches,
                    emptyTitle: 'Nenhum lote fechado ainda',
                    emptySubtitle: 'Feche uma competência acima para gerar os lotes de pagamento auditáveis.',
                    columns: [
                        { key: 'id', label: 'Lote', tdClass: 'adm-mono', render: b => esc(b.id) },
                        { key: 'competence_month', label: 'Competência → Prev.', tdClass: 'adm-mono', render: b => `${esc(b.competence_month)} → ${esc(b.scheduled_payout_date)}` },
                        { key: 'rep_name', label: 'Representante', render: b => `<span class="adm-cell-title">${esc(b.rep_name)}</span><div class="adm-cell-sub adm-mono">${esc(b.rep_code)}</div>` },
                        { key: 'commissions_count', label: 'Qtd. Com.', align: 'right', tdClass: 'adm-num', render: b => AdminView.formatNum(b.commissions_count) },
                        { key: 'gross_amount_cents', label: 'Bruto / Ajustes', align: 'right', tdClass: 'adm-mono', render: b => `${brl(b.gross_amount_cents)} / ${brl(b.adjustments_cents)}` },
                        { key: 'net_amount_cents', label: 'Líquido', align: 'right', tdClass: 'adm-money', render: b => brl(b.net_amount_cents) },
                        { key: 'status', label: 'Status', render: b => AdminView.statusBadge(b.status) },
                        {
                            key: 'action', label: 'Comprovante / Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: b => b.status === 'SCHEDULED'
                                ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.openMarkPaidModal('${esc(b.id)}', '${esc(b.rep_name)}', ${b.net_amount_cents})">Marcar Pago</button>`
                                : `<span class="adm-mono adm-text-secondary" style="font-size:12px;">Ref: ${esc(b.transfer_reference || '-')} (${esc(b.transfer_date || '')})</span>`
                        }
                    ]
                })}
            </div>
        `;
    },

    openCloseCycleModal(competenceMonth, netCents, repsCount) {
        const brl = AdminView.formatBrl;
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Fechar Ciclo Financeiro — Competência ${competenceMonth}`,
            body: `
                <div class="adm-chain-box">
                    <strong>Resumo do Fechamento Atômico:</strong><br/>
                    • Competência: <span class="adm-mono">${esc(competenceMonth)}</span><br/>
                    • Representantes elegíveis: <strong>${repsCount}</strong><br/>
                    • Valor líquido previsto (somente CONFIRMED sem contestação): <strong class="adm-money adm-text-accent">${brl(netCents)}</strong><br/>
                    • Comissões PROJECTED, REFUNDED e CONTESTADAS serão automaticamente excluídas.
                </div>
                <div class="adm-field">
                    <label for="close-cycle-notes">Observações do Fechamento (Auditoria)</label>
                    <textarea id="close-cycle-notes" placeholder="Ex: Conferido extrato AbacatePay da competência..."></textarea>
                </div>
            `,
            confirmLabel: `Confirmar Fechamento ${competenceMonth}`,
            onConfirm: async () => {
                const notes = document.getElementById('close-cycle-notes')?.value || '';
                await API.closeAdminPayoutCycle({ competence_month: competenceMonth, notes });
                AdminView.toast(`Ciclo ${competenceMonth} fechado com sucesso!`);
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    openMarkPaidModal(batchId, repName, netCents) {
        const today = new Date().toISOString().slice(0, 10);
        const brl = AdminView.formatBrl;
        AdminView.openModal({
            title: `Registrar Pagamento Manual — ${repName}`,
            confirmTone: 'success',
            body: `
                <div class="adm-chain-box is-success">
                    <strong>Atenção:</strong> O sistema não realiza PIX automático. Efetue a transferência bancária/PIX no valor de <strong class="adm-money">${brl(netCents)}</strong> pelo seu banco e registre abaixo o comprovante para auditoria.
                </div>
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label for="pay-transfer-date">Data da Transferência *</label>
                        <input type="date" id="pay-transfer-date" class="adm-input" value="${today}" />
                    </div>
                    <div class="adm-field">
                        <label for="pay-transfer-ref">Referência / ID End-to-End do Comprovante *</label>
                        <input type="text" id="pay-transfer-ref" class="adm-input" placeholder="Ex: PIX-E2E-20261210-001" />
                    </div>
                </div>
                <div class="adm-field">
                    <label for="pay-transfer-notes">Observações (Opcional)</label>
                    <textarea id="pay-transfer-notes" placeholder="Banco de origem, observações financeiras..."></textarea>
                </div>
            `,
            confirmLabel: 'Confirmar Pagamento Auditado',
            onConfirm: async () => {
                const transfer_reference = (document.getElementById('pay-transfer-ref')?.value || '').trim();
                const transfer_date = (document.getElementById('pay-transfer-date')?.value || '').trim();
                const payment_notes = (document.getElementById('pay-transfer-notes')?.value || '').trim();
                if (transfer_reference.length < 3) throw new Error('Informe a referência do comprovante (mínimo 3 caracteres).');
                await API.markAdminPayoutPaid(batchId, { transfer_reference, transfer_date, payment_notes });
                AdminView.toast('Pagamento registrado e comissões atualizadas para PAID!');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 4. REPASSES ÀS OFICINAS
    // --------------------------------------------------------------------------
    async renderWorkshopPayouts() {
        const data = await API.getAdminWorkshopPayouts();
        const UI = AdminView.ui();
        const items = data.items || [];
        const t = data.totals || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Repasses às Oficinas Credenciadas',
                subtitle: 'Saldo de divisão contratual por ativação DNA liquidada. Registro manual auditado após transferência bancária.'
            })}

            <div class="adm-kpi-grid cols-2">
                ${UI.FinancialMetric({ label: 'Total Pendente de Repasse', cents: t.pending_cents, classification: 'A Repassar', tone: 'tone-warning' })}
                ${UI.FinancialMetric({ label: 'Total Já Repassado', cents: t.paid_cents, classification: 'Liquidado', tone: 'tone-success' })}
            </div>

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: items,
                    emptyTitle: 'Nenhuma oficina com movimentação de repasse',
                    emptySubtitle: 'Os saldos de repasse aparecem aqui conforme ativações DNA forem liquidadas.',
                    columns: [
                        { key: 'trade_name', label: 'Oficina / CNPJ', render: w => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a><div class="adm-cell-sub adm-mono">${esc(w.cnpj || '')}</div>` },
                        { key: 'city', label: 'Cidade/UF', render: w => `${esc(w.city || '-')}/${esc(w.state || '-')}` },
                        { key: 'pending_cents', label: 'Pendente', align: 'right', tdClass: 'adm-money', render: w => `<span class="${w.pending_cents > 0 ? 'adm-text-warning' : 'adm-text-muted'}">${brl(w.pending_cents)} (${w.pending_count || 0})</span>` },
                        { key: 'paid_cents', label: 'Repassado', align: 'right', tdClass: 'adm-money adm-text-success', render: w => `${brl(w.paid_cents)} (${w.paid_count || 0})` },
                        { key: 'last_paid_at', label: 'Último Repasse', tdClass: 'adm-mono', render: w => esc(AdminView.formatDate(w.last_paid_at)) },
                        {
                            key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: w => w.pending_cents > 0
                                ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.markWorkshopPaid('${esc(w.workshop_id)}', '${esc(w.trade_name)}', ${w.pending_cents})">Registrar Repasse</button>`
                                : '<span class="adm-badge adm-badge-muted">Quitado</span>'
                        }
                    ]
                })}
            </div>
        `;
    },

    markWorkshopPaid(workshopId, workshopName, pendingCents = 0) {
        AdminView.openConfirmDialog({
            title: `Registrar Repasse — ${workshopName}`,
            message: `Informe a referência do comprovante da transferência bancária/PIX realizada no valor de ${AdminView.formatBrl(pendingCents)}.`,
            confirmLabel: 'Confirmar Repasse',
            tone: 'success',
            inputConfig: {
                id: 'ws-payout-ref',
                type: 'text',
                label: 'Código / Referência da Transferência',
                placeholder: 'Ex: TED-20261121-001 ou EndToEnd PIX',
                required: true,
                minLength: 3
            },
            onConfirm: async (ref) => {
                await API.markAdminWorkshopPayoutPaid(workshopId, { transfer_reference: ref });
                AdminView.toast('Repasse à oficina registrado com sucesso.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 5. TAXAS POR ATENDIMENTO
    // --------------------------------------------------------------------------
    async renderAttendanceFees() {
        const data = await API.getAdminAttendanceFees();
        const UI = AdminView.ui();
        const s = data.summary || {};
        const items = data.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Taxas por Atendimento (Retornos Confirmados)',
                subtitle: 'Cobrança de taxa por atendimento de retorno agendado pelo sistema preventivo DNA AUTO.'
            })}

            <div class="adm-kpi-grid">
                ${UI.KPIStatCard({ label: 'Total de Lançamentos', value: AdminView.formatNum(s.total_count), sub: `Total bruto: ${brl(s.total_cents)}`, tone: 'tone-blue' })}
                ${UI.FinancialMetric({ label: 'Taxas Confirmadas', cents: s.confirmed_cents, classification: 'Confirmado', tone: 'tone-success' })}
                ${UI.FinancialMetric({ label: 'Taxas Pagas', cents: s.paid_cents, classification: 'Recebido', tone: 'tone-cyan' })}
                ${UI.FinancialMetric({ label: 'Taxas Pendentes', cents: s.pending_cents, classification: 'Pendente', tone: 'tone-warning' })}
            </div>

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: items,
                    emptyTitle: 'Nenhuma taxa lançada',
                    emptySubtitle: 'As taxas aparecem quando agendamentos preventivos são confirmados nas oficinas.',
                    columns: [
                        { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: f => esc(AdminView.formatDateTime(f.created_at)) },
                        { key: 'workshop_name', label: 'Oficina', render: f => `<span class="adm-cell-title">${esc(f.workshop_name)}</span><div class="adm-cell-sub">${esc(f.workshop_city || '-')}/${esc(f.workshop_state || '-')}</div>` },
                        { key: 'license_plate', label: 'Placa / Veículo', tdClass: 'adm-mono', render: f => `${esc(f.license_plate || '-')} ${esc(f.brand || '')} ${esc(f.model || '')}` },
                        { key: 'origin', label: 'Origem', render: f => esc(f.origin || f.fee_type || 'RETORNO_BOT') },
                        { key: 'amount_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: f => brl(f.amount_cents) },
                        { key: 'status', label: 'Status', render: f => AdminView.statusBadge(f.status) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. CONCILIAÇÃO FINANCEIRA
    // --------------------------------------------------------------------------
    async renderReconciliation(ctx) {
        const compMonth = (ctx.params && ctx.params.competence_month) || ctx.month || new Date().toISOString().slice(0, 7);
        const data = await API.getAdminFinancialReconciliation({ competence_month: compMonth });
        const UI = AdminView.ui();
        const s = data.summary || {};
        const items = data.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: `Conciliação Financeira — ${data.competence_month || ''}`,
                subtitle: 'Cruzamento automático entre cobranças PIX (AbacatePay), ativações DNA, vínculos comerciais e comissões geradas.',
                actionsHtml: `<input type="month" class="adm-input" aria-label="Competência para conciliação" value="${esc(data.competence_month)}" onchange="AdminView.updateParams({ competence_month: this.value })" />`
            })}

            <div class="adm-kpi-grid">
                ${UI.KPIStatCard({ label: 'Transações Auditadas', value: AdminView.formatNum(s.total_transactions), sub: `Conciliadas: ${s.reconciled_count || 0}`, tone: 'tone-blue' })}
                ${UI.KPIStatCard({ label: 'Divergências Encontradas', value: AdminView.formatNum(s.discrepancies_count), sub: s.discrepancies_count > 0 ? 'Requer conferência manual' : '100% íntegro', tone: s.discrepancies_count > 0 ? 'tone-danger' : 'tone-success' })}
                ${UI.FinancialMetric({ label: 'PIX Liquidado (Bruto)', cents: s.paid_total_customer_cents, classification: 'Recebido', sub: `Plataforma: ${brl(s.paid_total_platform_cents)} • Oficina: ${brl(s.paid_total_workshop_cents)}`, tone: 'tone-success' })}
                ${UI.FinancialMetric({ label: 'Comissões Rep. Conciliadas', cents: s.paid_total_rep_comm_cents, classification: 'Confirmado', tone: 'tone-gold' })}
            </div>

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: items,
                    emptyTitle: `Sem transações PIX na competência ${data.competence_month}`,
                    emptySubtitle: 'Selecione outro mês para realizar a conciliação financeira.',
                    columns: [
                        { key: 'payment_id', label: 'Pagamento', tdClass: 'adm-mono', render: r => `<strong>${esc(r.payment_id)}</strong><div class="adm-cell-sub">${esc(AdminView.formatDateTime(r.paid_at || r.created_at))}</div>` },
                        { key: 'workshop_name', label: 'Oficina', render: r => esc(r.workshop_name) },
                        { key: 'license_plate', label: 'Placa / Código', tdClass: 'adm-mono', render: r => esc(r.license_plate || r.activation_code || '-') },
                        { key: 'customer_price_cents', label: 'Valor Cliente', align: 'right', tdClass: 'adm-money', render: r => brl(r.customer_price_cents) },
                        { key: 'payment_status', label: 'Status PIX', render: r => AdminView.statusBadge(r.payment_status) },
                        { key: 'rep_code', label: 'Rep / Comissão', render: r => r.rep_code ? `<span class="adm-mono adm-text-accent" style="font-weight:700;">${esc(r.rep_code)}</span> • ${r.commission_status ? `${brl(r.commission_amount_cents)} (${esc(r.commission_status)})` : 'Sem comissão'}` : '<span class="adm-text-muted">Direta</span>' },
                        {
                            key: 'reconciliation_status', label: 'Conciliação',
                            render: r => r.reconciliation_status === 'CONCILIADO'
                                ? AdminView.statusBadge('CONCILIADO')
                                : `${AdminView.statusBadge('DIVERGENTE')}<div class="adm-cell-sub adm-text-danger">${esc(r.discrepancy_reason || '')}</div>`
                        }
                    ]
                })}
            </div>
        `;
    }
};
