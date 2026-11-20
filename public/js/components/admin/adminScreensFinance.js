// ==============================================================================
// DNA AUTO — CENTRAL ADMINISTRATIVA V2: MOTOR FINANCEIRO & COMISSÕES (FASE 6)
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
        const rev = fin.revenue || {};
        const comm = fin.commissions || {};
        const wp = fin.workshop_payouts || {};
        const fees = fin.attendance_fees || {};
        const pol = fin.payout_rules?.active_policy || {};
        const policies = policiesRes.policies || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Faturamento Geral & Estrutura Comercial</h2>
                    <p>Receitas confirmadas em centavos inteiros, política comercial vigente e divisão exata entre Plataforma, Oficinas e Representantes.</p>
                </div>
                <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('settings')">Gerenciar Políticas Comerciais →</button>
            </div>

            <div class="adm-chain-box">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span class="adm-badge adm-badge-success">POLÍTICA ATIVA: ${esc(pol.version_code || 'V1')}</span>
                        <strong style="margin-left:8px; color:#fff;">${esc(pol.title || 'Tabela Padrão')}</strong>
                    </div>
                    <div class="adm-mono" style="font-size:12px; color:#cbd5e1;">
                        Cadastro: <strong>${brl(pol.registration_price_cents)}</strong> • Oficina (${pol.workshop_split_percent || 50}%): <strong>${brl(pol.workshop_split_cents)}</strong> • Plataforma (${pol.platform_split_percent || 50}%): <strong>${brl(pol.platform_split_cents)}</strong> • Comissão Rep.: <strong style="color:#ffd21c;">${brl(pol.rep_commission_cents)}</strong> • Taxa Retorno: <strong>${brl(pol.attendance_fee_cents)}</strong>
                    </div>
                </div>
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Faturamento Confirmado (Bruto)</div><div class="adm-kpi-value">${brl(rev.confirmed_revenue_cents)}</div><div class="adm-kpi-sub">${rev.pix_paid_count || 0} PIX pagos • ${rev.dna_completed_count || 0} DNA liquidados</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Parcela Plataforma (PIX Liquidado)</div><div class="adm-kpi-value">${brl(rev.pix_paid_platform_cents)}</div><div class="adm-kpi-sub">PIX Pendentes: ${brl(rev.pix_pending_cents)} (${rev.pix_pending_count || 0})</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Comissões Representantes (Elegível)</div><div class="adm-kpi-value">${brl(comm.eligible_balance_cents)}</div><div class="adm-kpi-sub">Pagas: ${brl(comm.paid_cents)} • Projetadas: ${brl(comm.projected_cents)}</div></div>
                <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">Repasses Oficinas / Taxas Retorno</div><div class="adm-kpi-value">${brl(wp.pending_cents)}</div><div class="adm-kpi-sub">Já repassado: ${brl(wp.paid_cents)} • Taxas conf.: ${brl(fees.confirmed_cents)}</div></div>
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Evolução Mensal do Faturamento Confirmado</h3></div>
                    ${AdminCharts.renderLineChart(series.revenue_by_month || [], { valueKey: 'confirmed_revenue_cents', labelKey: 'month', color: '#10B981', isCurrency: true })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Políticas Comerciais Versionadas (${policies.length})</h3></div>
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Versão</th><th>Cadastro</th><th>Oficina / Plat.</th><th>Comissão Rep.</th><th>Status</th></tr></thead>
                            <tbody>
                                ${policies.map(p => `
                                    <tr>
                                        <td><strong class="adm-mono">${esc(p.version_code)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(p.title)}</div></td>
                                        <td class="adm-mono">${brl(p.registration_price_cents)}</td>
                                        <td class="adm-mono">${brl(p.workshop_split_cents)} / ${brl(p.platform_split_cents)}</td>
                                        <td class="adm-mono" style="color:#ffd21c;">${brl(p.rep_commission_cents)}</td>
                                        <td>${p.is_active ? '<span class="adm-badge adm-badge-success">ATIVA</span>' : '<span class="adm-badge adm-badge-muted">INATIVA</span>'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. COMISSÕES DE REPRESENTANTES (8 Indicadores + Demonstrativo em Árvore)
    // --------------------------------------------------------------------------
    async renderCommissions(ctx) {
        const f = ctx.params || {};
        const compMonth = f.competence_month || ctx.month || '';
        const [overview, listRes] = await Promise.all([
            API.getAdminFinanceOverview({ competence_month: compMonth }),
            API.getAdminFinanceCommissions({
                status: f.status || '',
                competence_month: compMonth,
                dispute_status: f.dispute_status || '',
                q: f.q || '',
                page: f.page || 1,
                page_size: 30
            })
        ]);
        const c = overview.commissions || {};
        const items = listRes.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Comissões de Representantes (${listRes.total || 0})</h2>
                    <p>Motor financeiro auditável (R$ 5,90 padrão por cadastro elegível e efetivamente pago dentro da vigência de 24 meses).</p>
                </div>
                <button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('payouts')">Ir para Próximos Pagamentos & Fechamento →</button>
            </div>

            <!-- 8 Indicadores Obrigatórios da Fase 6 -->
            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-muted"><div class="adm-kpi-label">1. Comissões Projetadas</div><div class="adm-kpi-value">${brl(c.projected_cents)}</div><div class="adm-kpi-sub">${c.projected_count || 0} reg. (PIX pendente — não entra em pagamento)</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">2. Comissões Confirmadas (Total)</div><div class="adm-kpi-value">${brl(c.confirmed_total_cents)}</div><div class="adm-kpi-sub">${c.confirmed_total_count || 0} elegíveis confirmadas</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">3. Comissões Já Pagas</div><div class="adm-kpi-value">${brl(c.paid_cents)}</div><div class="adm-kpi-sub">${c.paid_count || 0} repasse(s) liquidado(s)</div></div>
                <div class="adm-kpi-card tone-danger"><div class="adm-kpi-label">4. Comissões Estornadas</div><div class="adm-kpi-value">${brl(c.refunded_cents)}</div><div class="adm-kpi-sub">${c.refunded_count || 0} estorno(s) / reembolso(s)</div></div>
                <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">5. Comissões Vencidas (Ant.)</div><div class="adm-kpi-value">${brl(c.overdue_cents)}</div><div class="adm-kpi-sub">${c.overdue_count || 0} de competências anteriores</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">6. Comissões do Próximo Ciclo</div><div class="adm-kpi-value">${brl(c.next_cycle_eligible_cents)}</div><div class="adm-kpi-sub">${c.next_cycle_eligible_count || 0} na competência ${esc(overview.competence_month)} → ${esc(overview.payout_month)}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">7. Saldo Elegível Líquido</div><div class="adm-kpi-value">${brl(c.eligible_balance_cents)}</div><div class="adm-kpi-sub">Ajustes abertos: ${brl(c.open_adjustments_cents)}</div></div>
                <div class="adm-kpi-card tone-danger"><div class="adm-kpi-label">8. Bloqueado por Contestação</div><div class="adm-kpi-value">${brl(c.blocked_dispute_cents)}</div><div class="adm-kpi-sub">${c.blocked_dispute_count || 0} comissão(ões) em análise</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" id="comm-q" class="adm-input" style="min-width:210px;" placeholder="Buscar rep, oficina ou pagamento..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensFinance.applyCommFilters()" />
                    <input type="month" id="comm-month" class="adm-input" value="${esc(compMonth)}" onchange="AdminScreensFinance.applyCommFilters()" />
                    <select id="comm-status" class="adm-select" onchange="AdminScreensFinance.applyCommFilters()">
                        <option value="" ${!f.status ? 'selected' : ''}>Status: Todos</option>
                        <option value="CONFIRMED" ${f.status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED (Confirmada)</option>
                        <option value="PROJECTED" ${f.status === 'PROJECTED' ? 'selected' : ''}>PROJECTED (Projetada)</option>
                        <option value="PAID" ${f.status === 'PAID' ? 'selected' : ''}>PAID (Paga)</option>
                        <option value="REFUNDED" ${f.status === 'REFUNDED' ? 'selected' : ''}>REFUNDED (Estornada)</option>
                    </select>
                    <select id="comm-dispute" class="adm-select" onchange="AdminScreensFinance.applyCommFilters()">
                        <option value="" ${!f.dispute_status ? 'selected' : ''}>Contestação: Todas</option>
                        <option value="NONE" ${f.dispute_status === 'NONE' ? 'selected' : ''}>Sem contestação</option>
                        <option value="DISPUTED" ${f.dispute_status === 'DISPUTED' ? 'selected' : ''}>Bloqueadas / Contestadas</option>
                    </select>
                    <button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensFinance.applyCommFilters()">Filtrar</button>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('commissions')">Limpar</button>
                </div>

                ${items.length === 0 ? `<div class="adm-empty"><strong>Nenhuma comissão encontrada</strong>Não há lançamentos de comissão para os filtros aplicados.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Cadeia (Rep → Oficina → Placa/Pgto)</th><th>Política</th><th>Valor</th><th>Competência → Pgto</th><th>Status</th><th>Ações</th></tr></thead>
                            <tbody>
                                ${items.map(cm => `
                                    <tr>
                                        <td>
                                            <div class="adm-chain-flow">
                                                <span class="adm-chain-step"><strong style="color:#00d4ff;">${esc(cm.rep_code)}</strong> ${esc(cm.rep_name)}</span>
                                                <span class="adm-chain-arrow">→</span>
                                                <span class="adm-chain-step">${esc(cm.workshop_name)}</span>
                                                <span class="adm-chain-arrow">→</span>
                                                <span class="adm-chain-step adm-mono">${esc(cm.license_plate || cm.activation_code || cm.source_payment_id)} (${esc(cm.payment_status || cm.status)})</span>
                                            </div>
                                        </td>
                                        <td class="adm-mono" style="font-size:11px;">${esc(cm.policy_version_code || 'V1')}</td>
                                        <td class="adm-mono" style="font-weight:800; color:#ffd21c;">${brl(cm.commission_amount_cents)}</td>
                                        <td class="adm-mono">${esc(cm.competence_month || '-')} → ${esc(cm.payout_month || '-')}</td>
                                        <td>
                                            ${AdminView.statusBadge(cm.status)}
                                            ${cm.dispute_status === 'DISPUTED' ? `<div style="margin-top:3px;"><span class="adm-badge adm-badge-danger" title="${esc(cm.blocked_reason || '')}">BLOQUEADA</span></div>` : ''}
                                        </td>
                                        <td style="white-space:nowrap;">
                                            ${cm.status === 'CONFIRMED' && cm.dispute_status !== 'DISPUTED' ? `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensFinance.toggleDispute('${esc(cm.id)}', 'DISPUTED')">Contestar</button>` : ''}
                                            ${cm.status === 'CONFIRMED' && cm.dispute_status === 'DISPUTED' ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.toggleDispute('${esc(cm.id)}', 'NONE')">Desbloquear</button>` : ''}
                                            ${cm.status !== 'CONFIRMED' ? `<span style="font-size:11px; color:#64748b;">${cm.payout_batch_id ? esc(cm.payout_batch_id) : 'Encerrada'}</span>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${AdminView.renderPagination(listRes.page, listRes.total_pages, listRes.total)}
                `}
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

    async toggleDispute(commissionId, nextStatus) {
        let reason = '';
        if (nextStatus === 'DISPUTED') {
            reason = prompt('Informe o motivo do bloqueio/contestação desta comissão (mínimo 5 caracteres):');
            if (!reason || reason.trim().length < 5) return;
        }
        try {
            await API.updateAdminCommissionDispute(commissionId, { dispute_status: nextStatus, reason: reason.trim() });
            AdminView.toast(nextStatus === 'DISPUTED' ? 'Comissão bloqueada por contestação.' : 'Comissão liberada para pagamento.');
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
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
        const sum = forecast.summary || {};
        const reps = forecast.representatives || [];
        const batches = history.batches || [];
        const cycles = history.cycles || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Próximos Pagamentos & Fechamento de Ciclo</h2>
                    <p>Competência <strong>${esc(forecast.competence_month)}</strong> → Pagamento previsto em <strong>${esc(forecast.scheduled_payout_date)}</strong> (${esc(forecast.payout_month)}). Sem PIX automático: liquidação somente via registro administrativo auditado.</p>
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <input type="month" class="adm-input" value="${esc(forecast.competence_month)}" onchange="AdminView.updateParams({ competence_month: this.value })" />
                    ${forecast.can_close ? `
                        <button class="adm-btn adm-btn-gold" onclick="AdminScreensFinance.openCloseCycleModal('${esc(forecast.competence_month)}', ${sum.next_payout_net_cents || 0}, ${sum.eligible_representatives_count || 0})">Fechar Ciclo ${esc(forecast.competence_month)}</button>
                    ` : `
                        <span class="adm-badge ${forecast.cycle_status === 'OPEN' ? 'adm-badge-muted' : 'adm-badge-success'}">CICLO: ${esc(forecast.cycle_status)}</span>
                    `}
                </div>
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Próximo Pagamento (Líquido Elegível)</div><div class="adm-kpi-value">${brl(sum.next_payout_net_cents)}</div><div class="adm-kpi-sub">${sum.eligible_representatives_count || 0} rep(s) elegível(is) • Somente CONFIRMED</div></div>
                <div class="adm-kpi-card tone-muted"><div class="adm-kpi-label">Projetado (Excluído do Pagamento)</div><div class="adm-kpi-value">${brl(sum.projected_cents)}</div><div class="adm-kpi-sub">Aguardando confirmação de pagamento PIX</div></div>
                <div class="adm-kpi-card tone-danger"><div class="adm-kpi-label">Contestadas / Estornadas / Ajustes</div><div class="adm-kpi-value">${brl((sum.disputed_cents || 0) + (sum.refunded_cents || 0))}</div><div class="adm-kpi-sub">Ajustes aplicados: ${brl(sum.adjustments_cents)}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Já Liquidado na Competência</div><div class="adm-kpi-value">${brl(sum.paid_cents)}</div><div class="adm-kpi-sub">Política: ${esc(forecast.policy?.version_code || 'V1')} (dia ${forecast.policy?.payout_day_of_month || 10})</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Demonstrativo Detalhado por Representante — Competência ${esc(forecast.competence_month)}</h3>
                        <p class="adm-card-subtitle">Árvore completa: REPRESENTANTE → OFICINA → CADASTRO → PAGAMENTO CONFIRMADO → COMISSÃO → COMPETÊNCIA → PAGAMENTO AGENDADO</p>
                    </div>
                </div>

                ${reps.length === 0 ? `<div class="adm-empty"><strong>Nenhuma comissão na competência ${esc(forecast.competence_month)}</strong>Selecione outra competência ou aguarde confirmações de pagamento.</div>` : reps.map(r => `
                    <div class="adm-chain-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                            <div>
                                <strong style="color:#fff; font-size:14px;">${esc(r.rep_name)}</strong>
                                <span class="adm-mono" style="color:#00d4ff; margin-left:6px;">${esc(r.rep_code)}</span>
                                <span style="margin-left:8px;">${AdminView.statusBadge(r.batch_status)}</span>
                                <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">
                                    Elegíveis: <strong>${r.eligible_commissions_count}</strong> (${brl(r.eligible_gross_cents)}) • Projetadas (fora do ciclo): <strong>${brl(r.projected_cents)}</strong> • Ajustes: <strong>${brl(r.adjustments_cents)}</strong> • Líquido: <strong style="color:#ffd21c;">${brl(r.next_payout_net_cents)}</strong>
                                </div>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                ${r.batch_id && r.batch_status === 'SCHEDULED' ? `
                                    <button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.openMarkPaidModal('${esc(r.batch_id)}', '${esc(r.rep_name)}', ${r.batch_net_amount_cents || r.next_payout_net_cents})">Registrar Pagamento Realizado</button>
                                ` : r.batch_status === 'PAID' ? `
                                    <span class="adm-badge adm-badge-success">PAGO • REF: ${esc(r.transfer_reference || '-')} (${esc(r.transfer_date || '')})</span>
                                ` : ''}
                            </div>
                        </div>

                        ${(r.workshops || []).map(ws => `
                            <div style="margin-left:14px; padding-left:12px; border-left:2px solid rgba(0,212,255,0.28); margin-bottom:8px;">
                                <div style="font-size:12px; color:#e2e8f0; margin-bottom:4px;">
                                    <strong>Oficina:</strong> ${esc(ws.workshop_name)} (${esc(ws.workshop_city || '-')}/${esc(ws.workshop_state || '-')}) — Elegíveis: <strong>${ws.eligible_count}</strong> (${brl(ws.eligible_cents)})
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    ${(ws.items || []).map(it => `
                                        <div class="adm-chain-flow" style="font-size:11px;">
                                            <span class="adm-chain-step">Cadastro: ${esc(it.license_plate || it.activation_code || it.commission_id)}</span>
                                            <span class="adm-chain-arrow">→</span>
                                            <span class="adm-chain-step">Pgto: ${esc(it.payment_status)} (${esc(AdminView.formatDate(it.payment_paid_at))})</span>
                                            <span class="adm-chain-arrow">→</span>
                                            <span class="adm-chain-step">Comissão: <strong>${brl(it.commission_amount_cents)}</strong> (${esc(it.status)})</span>
                                            <span class="adm-chain-arrow">→</span>
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
                        <p class="adm-card-subtitle">Registro imutável de todos os fechamentos e pagamentos realizados manualmente</p>
                    </div>
                </div>
                ${batches.length === 0 ? `<div class="adm-empty"><strong>Nenhum lote fechado ainda</strong>Feche uma competência acima para gerar os lotes de pagamento auditáveis.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Lote</th><th>Competência → Prev.</th><th>Representante</th><th>Qtd. Com.</th><th>Bruto / Ajustes</th><th>Líquido</th><th>Status</th><th>Comprovante / Ação</th></tr></thead>
                            <tbody>
                                ${batches.map(b => `
                                    <tr>
                                        <td class="adm-mono" style="font-size:11px;">${esc(b.id)}</td>
                                        <td class="adm-mono">${esc(b.competence_month)} → ${esc(b.scheduled_payout_date)}</td>
                                        <td><strong>${esc(b.rep_name)}</strong> <span class="adm-mono" style="color:#00d4ff;">${esc(b.rep_code)}</span></td>
                                        <td class="adm-mono">${b.commissions_count}</td>
                                        <td class="adm-mono">${brl(b.gross_amount_cents)} / ${brl(b.adjustments_cents)}</td>
                                        <td class="adm-mono" style="font-weight:800; color:#ffd21c;">${brl(b.net_amount_cents)}</td>
                                        <td>${AdminView.statusBadge(b.status)}</td>
                                        <td style="white-space:nowrap;">
                                            ${b.status === 'SCHEDULED' ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.openMarkPaidModal('${esc(b.id)}', '${esc(b.rep_name)}', ${b.net_amount_cents})">Marcar Pago</button>` : `<span class="adm-mono" style="font-size:11px;">Ref: ${esc(b.transfer_reference || '-')} (${esc(b.transfer_date || '')})</span>`}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
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
                    • Valor líquido previsto (somente CONFIRMED sem contestação): <strong style="color:#ffd21c;">${brl(netCents)}</strong><br/>
                    • Comissões PROJECTED, REFUNDED e CONTESTADAS serão automaticamente excluídas.
                </div>
                <div class="adm-field">
                    <label>Observações do Fechamento (Auditoria)</label>
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
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Registrar Pagamento Manual — ${repName}`,
            body: `
                <div class="adm-chain-box" style="border-color:rgba(16,185,129,0.4);">
                    <strong>Atenção:</strong> O sistema não realiza PIX automático. Efetue a transferência bancária/PIX no valor de <strong style="color:#34d399;">${brl(netCents)}</strong> pelo seu banco e registre abaixo o comprovante para auditoria.
                </div>
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>Data da Transferência *</label>
                        <input type="date" id="pay-transfer-date" class="adm-input" value="${today}" />
                    </div>
                    <div class="adm-field">
                        <label>Referência / ID End-to-End do Comprovante *</label>
                        <input type="text" id="pay-transfer-ref" class="adm-input" placeholder="Ex: PIX-E2E-20261210-001" />
                    </div>
                </div>
                <div class="adm-field">
                    <label>Observações (Opcional)</label>
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
        const items = data.items || [];
        const t = data.totals || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Repasses às Oficinas Credenciadas</h2>
                    <p>Saldo de divisão 50% por ativação DNA liquidada. Registro manual auditado após transferência bancária.</p>
                </div>
            </div>

            <div class="adm-kpi-grid" style="grid-template-columns:repeat(2, minmax(0, 1fr));">
                <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">Total Pendente de Repasse</div><div class="adm-kpi-value">${brl(t.pending_cents)}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Total Já Repassado</div><div class="adm-kpi-value">${brl(t.paid_cents)}</div></div>
            </div>

            <div class="adm-card">
                ${items.length === 0 ? `<div class="adm-empty"><strong>Nenhuma oficina cadastrada</strong>Sem dados de repasse.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Oficina / CNPJ</th><th>Cidade/UF</th><th>Pendente</th><th>Pago</th><th>Último Repasse</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${items.map(w => `
                                    <tr>
                                        <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a><div class="adm-mono" style="font-size:11px; color:#64748b;">${esc(w.cnpj || '')}</div></td>
                                        <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                        <td class="adm-mono" style="color:${w.pending_cents > 0 ? '#fbbf24' : '#64748b'}; font-weight:700;">${brl(w.pending_cents)} (${w.pending_count || 0})</td>
                                        <td class="adm-mono" style="color:#34d399;">${brl(w.paid_cents)} (${w.paid_count || 0})</td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(w.last_paid_at))}</td>
                                        <td>
                                            ${w.pending_cents > 0 ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensFinance.markWorkshopPaid('${esc(w.workshop_id)}', '${esc(w.trade_name)}')">Registrar Repasse</button>` : '<span class="adm-badge adm-badge-muted">Quitado</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    async markWorkshopPaid(workshopId, workshopName) {
        const ref = prompt(`Informe o código/referência da transferência bancária para ${workshopName}:`);
        if (!ref || ref.trim().length < 3) return;
        try {
            await API.markAdminWorkshopPayoutPaid(workshopId, { transfer_reference: ref.trim() });
            AdminView.toast('Repasse à oficina registrado com sucesso.');
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
    },

    // --------------------------------------------------------------------------
    // 5. TAXAS POR ATENDIMENTO
    // --------------------------------------------------------------------------
    async renderAttendanceFees() {
        const data = await API.getAdminAttendanceFees();
        const s = data.summary || {};
        const items = data.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Taxas por Atendimento (Retornos Confirmados)</h2>
                    <p>Cobrança de taxa por atendimento de retorno agendado pelo sistema preventivo DNA AUTO (padrão R$ 6,90).</p>
                </div>
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Total de Lançamentos</div><div class="adm-kpi-value">${s.total_count || 0}</div><div class="adm-kpi-sub">Total bruto: ${brl(s.total_cents)}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Confirmadas</div><div class="adm-kpi-value">${brl(s.confirmed_cents)}</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Pagas</div><div class="adm-kpi-value">${brl(s.paid_cents)}</div></div>
                <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">Pendentes</div><div class="adm-kpi-value">${brl(s.pending_cents)}</div></div>
            </div>

            <div class="adm-card">
                ${items.length === 0 ? `<div class="adm-empty"><strong>Nenhuma taxa lançada</strong>As taxas aparecem quando agendamentos preventivos são confirmados nas oficinas.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data</th><th>Oficina</th><th>Placa / Veículo</th><th>Origem</th><th>Valor</th><th>Status</th></tr></thead>
                            <tbody>
                                ${items.map(f => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDateTime(f.created_at))}</td>
                                        <td><strong>${esc(f.workshop_name)}</strong> <span style="color:#64748b;">(${esc(f.workshop_city || '-')}/${esc(f.workshop_state || '-')})</span></td>
                                        <td class="adm-mono">${esc(f.license_plate || '-')} ${esc(f.brand || '')} ${esc(f.model || '')}</td>
                                        <td>${esc(f.origin || f.fee_type || 'RETORNO_BOT')}</td>
                                        <td class="adm-mono" style="font-weight:700;">${brl(f.amount_cents)}</td>
                                        <td>${AdminView.statusBadge(f.status)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. CONCILIAÇÃO FINANCEIRA
    // --------------------------------------------------------------------------
    async renderReconciliation(ctx) {
        const compMonth = (ctx.params && ctx.params.competence_month) || ctx.month || new Date().toISOString().slice(0, 7);
        const data = await API.getAdminFinancialReconciliation({ competence_month: compMonth });
        const s = data.summary || {};
        const items = data.items || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Conciliação Financeira — ${esc(data.competence_month)}</h2>
                    <p>Cruzamento automático entre cobranças PIX (AbacatePay), ativações DNA, vínculos comerciais e comissões geradas.</p>
                </div>
                <input type="month" class="adm-input" value="${esc(data.competence_month)}" onchange="AdminView.updateParams({ competence_month: this.value })" />
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Transações Auditadas</div><div class="adm-kpi-value">${s.total_transactions || 0}</div><div class="adm-kpi-sub">Conciliadas: ${s.reconciled_count || 0}</div></div>
                <div class="adm-kpi-card ${s.discrepancies_count > 0 ? 'tone-danger' : 'tone-success'}"><div class="adm-kpi-label">Divergências Encontradas</div><div class="adm-kpi-value">${s.discrepancies_count || 0}</div><div class="adm-kpi-sub">${s.discrepancies_count > 0 ? 'Requer conferência manual' : '100% íntegro'}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">PIX Liquidado (Cliente / Plat.)</div><div class="adm-kpi-value">${brl(s.paid_total_customer_cents)}</div><div class="adm-kpi-sub">Plataforma: ${brl(s.paid_total_platform_cents)} • Oficina: ${brl(s.paid_total_workshop_cents)}</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Comissões Rep. Conciliadas</div><div class="adm-kpi-value">${brl(s.paid_total_rep_comm_cents)}</div></div>
            </div>

            <div class="adm-card">
                ${items.length === 0 ? `<div class="adm-empty"><strong>Sem transações PIX na competência ${esc(data.competence_month)}</strong>Selecione outro mês para conciliar.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Pagamento</th><th>Oficina</th><th>Placa / Código</th><th>Valor Cliente</th><th>Status PIX</th><th>Rep / Comissão</th><th>Conciliação</th></tr></thead>
                            <tbody>
                                ${items.map(r => `
                                    <tr>
                                        <td class="adm-mono" style="font-size:11px;">${esc(r.payment_id)}<div style="color:#64748b;">${esc(AdminView.formatDateTime(r.paid_at || r.created_at))}</div></td>
                                        <td>${esc(r.workshop_name)}</td>
                                        <td class="adm-mono">${esc(r.license_plate || r.activation_code || '-')}</td>
                                        <td class="adm-mono">${brl(r.customer_price_cents)}</td>
                                        <td>${AdminView.statusBadge(r.payment_status)}</td>
                                        <td>${r.rep_code ? `<span class="adm-mono" style="color:#00d4ff;">${esc(r.rep_code)}</span> • ${r.commission_status ? `${brl(r.commission_amount_cents)} (${esc(r.commission_status)})` : 'Sem comissão'}` : '<span style="color:#64748b;">Direta</span>'}</td>
                                        <td>${r.reconciliation_status === 'CONCILIADO' ? '<span class="adm-badge adm-badge-success">CONCILIADO</span>' : `<span class="adm-badge adm-badge-danger" title="${esc(r.discrepancy_reason || '')}">DIVERGENTE</span><div style="font-size:10.5px; color:#fca5a5;">${esc(r.discrepancy_reason || '')}</div>`}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }
};
