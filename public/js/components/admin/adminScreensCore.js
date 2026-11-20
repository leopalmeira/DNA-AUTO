// ==============================================================================
// DNA AUTO — CENTRAL ADMINISTRATIVA V2: TELAS VISÃO GERAL & REDE DNA AUTO
// Fases 2, 3 e 5
// ==============================================================================

const AdminScreensCore = {
    // --------------------------------------------------------------------------
    // 1. DASHBOARD GERAL (FASE 3 — 16 Cards Principais + 8 Gráficos Reais)
    // --------------------------------------------------------------------------
    async renderDashboard(ctx) {
        const [overview, timeseries] = await Promise.all([
            API.getAdminDashboardOverview({ period: ctx.period, month: ctx.month }),
            API.getAdminDashboardTimeseries({ months: 6 })
        ]);
        const c = overview.cards || {};
        const s = overview.supplementary || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        // 16 Cards Principais exatos da Fase 3 (calculados 100% no backend)
        const kpiCards = [
            { label: '1. Representantes Cadastrados', val: num(c.total_representatives), sub: `${num(s.suspended_representatives)} suspensos • ${num(s.rejected_representatives)} recusados`, tone: 'tone-blue', route: 'representatives' },
            { label: '2. Representantes Ativos', val: num(c.active_representatives), sub: `${num(s.active_referrals)} vínculos comerciais vigentes (24m)`, tone: 'tone-success', route: 'representatives' },
            { label: '3. Reps. Aguardando Aprovação', val: num(c.pending_representatives), sub: c.pending_representatives > 0 ? 'Ação administrativa pendente' : 'Nenhuma pendência na fila', tone: c.pending_representatives > 0 ? 'tone-warning' : 'tone-success', route: 'representatives' },
            { label: '4. Total de Oficinas', val: num(c.total_workshops), sub: `${num(s.cities_covered)} cidades • ${num(s.states_covered)} estados`, tone: 'tone-blue', route: 'workshops' },
            { label: '5. Oficinas Ativas', val: num(c.active_workshops), sub: `${num(s.suspended_workshops)} suspensas / bloqueadas`, tone: 'tone-success', route: 'workshops' },
            { label: '6. Oficinas Aguardando Aprovação', val: num(c.pending_workshops), sub: c.pending_workshops > 0 ? 'Requer credenciamento' : 'Fila de credenciamento limpa', tone: c.pending_workshops > 0 ? 'tone-warning' : 'tone-success', route: 'workshops' },
            { label: '7. Total de Clientes Únicos', val: num(c.unique_clients), sub: 'Desduplicados (múltiplos carros = 1 cliente)', tone: 'tone-cyan', route: 'clients' },
            { label: '8. Total de Veículos Cadastrados', val: num(c.total_vehicles), sub: `${num(s.vehicles_without_dna)} ainda sem DNA ativo`, tone: 'tone-blue', route: 'vehicles' },
            { label: '9. Veículos com DNA Ativo', val: num(c.active_dna_vehicles), sub: c.total_vehicles > 0 ? `${Math.round((c.active_dna_vehicles / c.total_vehicles) * 100)}% da frota certificada` : '0% da frota', tone: 'tone-success', route: 'vehicles' },
            { label: '10. Cadastros Pagos no Período', val: num(c.monthly_paid_registrations), sub: `Período: ${esc(overview.period?.label || '-')}`, tone: 'tone-gold', route: 'revenue' },
            { label: '11. Faturamento Confirmado', val: brl(c.monthly_confirmed_revenue_cents), sub: `Volume mecânico OS: ${brl(s.mechanical_services_volume_cents)}`, tone: 'tone-success', route: 'revenue' },
            { label: '12. Comissões Reps. a Pagar', val: brl(c.rep_commissions_payable_cents), sub: `Projetadas (não elegíveis): ${brl(s.rep_commissions_projected_cents)}`, tone: 'tone-gold', route: 'commissions' },
            { label: '13. Comissões Próximo Ciclo', val: brl(c.rep_commissions_next_month_cents), sub: `Previsto p/ ${esc(overview.period?.scheduled_payout_date || overview.period?.payout_month || '-')}`, tone: 'tone-cyan', route: 'payouts' },
            { label: '14. Repasses Oficinas Pendentes', val: brl(c.workshop_payouts_pending_cents), sub: 'Saldo disponível para repasse 50%', tone: 'tone-warning', route: 'workshop-payouts' },
            { label: '15. Taxas por Atendimento Conf.', val: brl(c.attendance_fees_confirmed_cents), sub: `${num(s.attendance_fees_count)} retorno(s) contabilizado(s)`, tone: 'tone-blue', route: 'attendance-fees' },
            { label: '16. Atendimentos no Período', val: num(c.monthly_attendances_count), sub: `${num(s.proven_services_count)} OS comprovadas Nível 4`, tone: 'tone-success', route: 'service-orders' }
        ];

        const charts = timeseries || {};
        const updatedLabel = AdminView.formatDateTime(overview.generated_at);

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Dashboard Executivo — Central DNA AUTO</h2>
                    <p>Visão consolidada em tempo real dos aplicativos Cliente, Oficina, Representante Comercial e Financeiro. Período ativo: <strong>${esc(overview.period?.label || '-')}</strong></p>
                </div>
                <div class="adm-updated-stamp">Última atualização (API): <strong>${esc(updatedLabel)}</strong></div>
            </div>

            ${(c.pending_representatives > 0 || c.pending_workshops > 0 || s.open_support_tickets > 0) ? `
                <div class="adm-card" style="padding:12px 16px; border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.06); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                    <div style="font-size:12.5px; color:#fde68a;">
                        <strong>Pendências operacionais:</strong>
                        ${c.pending_representatives > 0 ? `• <strong>${num(c.pending_representatives)}</strong> representante(s) aguardando aprovação ` : ''}
                        ${c.pending_workshops > 0 ? `• <strong>${num(c.pending_workshops)}</strong> oficina(s) aguardando credenciamento ` : ''}
                        ${s.open_support_tickets > 0 ? `• <strong>${num(s.open_support_tickets)}</strong> chamado(s) de suporte em aberto` : ''}
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${c.pending_representatives > 0 ? `<button class="adm-btn adm-btn-sm adm-btn-gold" onclick="AdminView.navigate('representatives', { status: 'PENDING_APPROVAL' })">Aprovar Representantes</button>` : ''}
                        ${c.pending_workshops > 0 ? `<button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('workshops', { status: 'PENDING' })">Revisar Oficinas</button>` : ''}
                        ${s.open_support_tickets > 0 ? `<button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('support')">Abrir Suporte</button>` : ''}
                    </div>
                </div>
            ` : ''}

            <div class="adm-kpi-grid" data-testid="dashboard-kpi-grid">
                ${kpiCards.map(k => `
                    <div class="adm-kpi-card clickable ${k.tone}" onclick="AdminView.navigate('${k.route}')">
                        <div class="adm-kpi-label">${esc(k.label)}</div>
                        <div class="adm-kpi-value">${esc(k.val)}</div>
                        <div class="adm-kpi-sub">${esc(k.sub)}</div>
                    </div>
                `).join('')}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">1. Evolução de Cadastros por Mês</h3>
                            <p class="adm-card-subtitle">Cadastros pagos (ciano) vs Ativações de cliente iniciadas (verde)</p>
                        </div>
                    </div>
                    ${AdminCharts.renderBarChart(charts.registrations_by_month || [], { valueKey: 'paid_registrations', secondaryKey: 'client_activations', labelKey: 'month', color: '#00D4FF', secondaryColor: '#10B981' })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">2. Evolução de Faturamento Confirmado</h3>
                            <p class="adm-card-subtitle">Receita confirmada de ativações DNA nos últimos ${charts.months || 6} meses</p>
                        </div>
                    </div>
                    ${AdminCharts.renderLineChart(charts.revenue_by_month || [], { valueKey: 'confirmed_revenue_cents', labelKey: 'month', color: '#10B981', isCurrency: true })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">3. Crescimento da Rede de Oficinas</h3>
                            <p class="adm-card-subtitle">Base acumulada de oficinas credenciadas por mês</p>
                        </div>
                    </div>
                    ${AdminCharts.renderLineChart(charts.workshops_growth_by_month || [], { valueKey: 'cumulative_workshops', labelKey: 'month', color: '#FFD21C' })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">4. Representantes com Maior Captação</h3>
                            <p class="adm-card-subtitle">Ranking de oficinas vinculadas à carteira comercial</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.top_representatives_by_workshops || [], { labelKey: 'name', subKey: 'rep_code', valueKey: 'linked_workshops', color: '#00D4FF', suffix: ' oficina(s)' })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">5. Cadastros Pagos por Representante</h3>
                            <p class="adm-card-subtitle">Cadastros efetivamente liquidados e comissionados</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.paid_registrations_by_rep || [], { labelKey: 'name', subKey: 'rep_code', valueKey: 'paid_registrations', color: '#10B981', suffix: ' pago(s)' })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">6. Comissões por Competência</h3>
                            <p class="adm-card-subtitle">Confirmadas em aberto (dourado) vs Pagas (verde)</p>
                        </div>
                    </div>
                    ${AdminCharts.renderBarChart(charts.commissions_by_competence || [], { valueKey: 'confirmed_cents', secondaryKey: 'paid_cents', labelKey: 'competence_month', color: '#FFD21C', secondaryColor: '#10B981', isCurrency: true })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">7. Distribuição Geográfica de Oficinas</h3>
                            <p class="adm-card-subtitle">Total de oficinas credenciadas por Estado (UF)</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.workshops_by_state || [], { labelKey: 'state', valueKey: 'total_workshops', color: '#3B82F6', suffix: ' oficina(s)' })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">8. Cadastros por Origem</h3>
                            <p class="adm-card-subtitle">Oficina via Representante × Oficina Direta × App Cliente</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.registrations_by_origin || [], { labelKey: 'label', valueKey: 'count', color: '#A855F7', suffix: ' registro(s)' })}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. OPERAÇÃO DA REDE
    // --------------------------------------------------------------------------
    async renderOperations() {
        const data = await API.getAdminOperationsOverview();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Operação da Rede em Tempo Real</h2>
                    <p>Monitoramento contínuo de credenciamentos pendentes, ativações recentes, ordens de serviço e agendamentos das oficinas.</p>
                </div>
                <div class="adm-updated-stamp">Atualizado: ${esc(AdminView.formatDateTime(data.generated_at))}</div>
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Oficinas Aguardando Aprovação (${(data.pending_workshops || []).length})</h3>
                            <p class="adm-card-subtitle">Credenciamentos recebidos pelo portal e links de representantes</p>
                        </div>
                    </div>
                    ${(data.pending_workshops || []).length === 0 ? `<div class="adm-empty"><strong>Fila vazia</strong>Nenhuma oficina aguardando aprovação no momento.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Oficina</th><th>Cidade/UF</th><th>CNPJ</th><th>Ação</th></tr></thead>
                                <tbody>
                                    ${data.pending_workshops.map(w => `
                                        <tr>
                                            <td><strong>${esc(w.trade_name)}</strong><div style="font-size:11px; color:#64748b;">${esc(w.email || w.phone || '')}</div></td>
                                            <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                            <td class="adm-mono">${esc(w.cnpj || '-')}</td>
                                            <td style="white-space:nowrap;">
                                                <button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED')">Aprovar</button>
                                                <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED')">Recusar</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Representantes Aguardando Aprovação (${(data.pending_representatives || []).length})</h3>
                            <p class="adm-card-subtitle">Representantes sem carteira ativa até validação administrativa</p>
                        </div>
                    </div>
                    ${(data.pending_representatives || []).length === 0 ? `<div class="adm-empty"><strong>Fila vazia</strong>Nenhum representante aguardando aprovação.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Código</th><th>Nome</th><th>Região</th><th>Ação</th></tr></thead>
                                <tbody>
                                    ${data.pending_representatives.map(r => `
                                        <tr>
                                            <td class="adm-mono" style="color:#00d4ff; font-weight:700;">${esc(r.rep_code)}</td>
                                            <td><strong>${esc(r.name)}</strong><div style="font-size:11px; color:#64748b;">${esc(r.email)}</div></td>
                                            <td>${esc(r.city || '-')}/${esc(r.state || '-')}</td>
                                            <td style="white-space:nowrap;">
                                                <button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'approve')">Aprovar</button>
                                                <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reject')">Rejeitar</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Últimas Ordens de Serviço Registradas (${(data.recent_services || []).length})</h3>
                        <p class="adm-card-subtitle">Sincronizado diretamente com o App Oficina e App Cliente</p>
                    </div>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('service-orders')">Ver Todas as OS →</button>
                </div>
                ${(data.recent_services || []).length === 0 ? `<div class="adm-empty"><strong>Sem ordens de serviço</strong>Nenhum registro de manutenção lançado até o momento.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data</th><th>Placa / Veículo</th><th>Serviço</th><th>Oficina</th><th>Nível</th><th>Valor</th></tr></thead>
                            <tbody>
                                ${data.recent_services.map(s => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDate(s.service_date || s.created_at))}</td>
                                        <td><strong class="adm-mono">${esc(s.license_plate)}</strong> <span style="color:#94a3b8;">${esc(s.brand || '')} ${esc(s.model || '')}</span></td>
                                        <td>${esc(s.service_title || s.category)}</td>
                                        <td>${esc(s.workshop_name || 'Declaração Cliente')}</td>
                                        <td>${AdminView.proofBadge(s.proof_level)}</td>
                                        <td class="adm-mono">${brl(s.total_cost_cents)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Ativações de Clientes Recentes (${(data.recent_activations || []).length})</h3></div>
                    ${(data.recent_activations || []).length === 0 ? `<div class="adm-empty"><strong>Sem ativações</strong>Nenhuma ativação registrada.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Código</th><th>Cliente</th><th>Placa</th><th>Oficina</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${data.recent_activations.slice(0, 12).map(a => `
                                        <tr>
                                            <td class="adm-mono" style="color:#00d4ff;">${esc(a.activation_code)}</td>
                                            <td>${esc(a.client_name)}</td>
                                            <td class="adm-mono">${esc(a.license_plate || '-')}</td>
                                            <td>${esc(a.workshop_name || '-')}</td>
                                            <td>${AdminView.statusBadge(a.billing_status || a.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Agendamentos Recentes (${(data.recent_appointments || []).length})</h3></div>
                    ${(data.recent_appointments || []).length === 0 ? `<div class="adm-empty"><strong>Sem agendamentos</strong>Nenhum agendamento registrado nas oficinas.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Data/Hora</th><th>Cliente</th><th>Placa</th><th>Oficina</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${data.recent_appointments.slice(0, 12).map(a => `
                                        <tr>
                                            <td class="adm-mono">${esc(a.appointment_date || '-')} ${esc(a.appointment_time || '')}</td>
                                            <td>${esc(a.owner_name || '-')}</td>
                                            <td class="adm-mono">${esc(a.license_plate || '-')}</td>
                                            <td>${esc(a.workshop_name || '-')}</td>
                                            <td>${AdminView.statusBadge(a.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 3. INDICADORES E METAS
    // --------------------------------------------------------------------------
    async renderGoals(ctx) {
        const data = await API.getAdminGoals({ month: ctx.month });
        const g = data.global_goals || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const pct = (actual, target) => target > 0 ? Math.min(100, Math.round((Number(actual || 0) / Number(target)) * 100)) : 0;

        const wsPct = pct(g.workshops_actual, g.workshops_target);
        const actPct = pct(g.activations_actual, g.activations_target);
        const revPct = pct(g.revenue_actual_cents, g.revenue_target_cents);

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Indicadores e Metas — Competência ${esc(data.month)}</h2>
                    <p>Acompanhamento de metas mensais globais da plataforma e desempenho individual por representante comercial.</p>
                </div>
                <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('settings')">Configurar Metas Globais</button>
            </div>

            <div class="adm-kpi-grid" style="grid-template-columns:repeat(3, minmax(0, 1fr));">
                <div class="adm-kpi-card tone-cyan">
                    <div class="adm-kpi-label">Meta de Novas Oficinas (${esc(data.month)})</div>
                    <div class="adm-kpi-value">${g.workshops_actual || 0} / ${g.workshops_target || 0}</div>
                    <div class="adm-progress-track"><div class="adm-progress-fill" style="width:${wsPct}%"></div></div>
                    <div class="adm-kpi-sub">${wsPct}% atingido no mês</div>
                </div>
                <div class="adm-kpi-card tone-gold">
                    <div class="adm-kpi-label">Meta de Cadastros Pagos (${esc(data.month)})</div>
                    <div class="adm-kpi-value">${g.activations_actual || 0} / ${g.activations_target || 0}</div>
                    <div class="adm-progress-track"><div class="adm-progress-fill" style="width:${actPct}%"></div></div>
                    <div class="adm-kpi-sub">${actPct}% atingido no mês</div>
                </div>
                <div class="adm-kpi-card tone-success">
                    <div class="adm-kpi-label">Meta de Faturamento Confirmado</div>
                    <div class="adm-kpi-value">${brl(g.revenue_actual_cents)}</div>
                    <div class="adm-progress-track"><div class="adm-progress-fill" style="width:${revPct}%"></div></div>
                    <div class="adm-kpi-sub">Meta: ${brl(g.revenue_target_cents)} (${revPct}%)</div>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Acompanhamento de Metas por Representante Ativo</h3>
                        <p class="adm-card-subtitle">Oficinas captadas e ativações pagas no mês ${esc(data.month)}</p>
                    </div>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('commercial-goals')">Editar Metas Individuais →</button>
                </div>
                ${(data.representatives_goals || []).length === 0 ? `<div class="adm-empty"><strong>Nenhum representante ativo</strong>Aprove representantes comerciais para monitorar suas metas mensais.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Código</th><th>Representante</th><th>UF</th><th>Carteira / Limite</th><th>Meta Oficinas (Mês)</th><th>Meta Ativações Pagas (Mês)</th></tr></thead>
                            <tbody>
                                ${data.representatives_goals.map(r => {
                                    const pWs = pct(r.month_workshops, r.monthly_goal_workshops);
                                    const pAct = pct(r.month_paid_activations, r.monthly_goal_activations);
                                    return `
                                        <tr>
                                            <td class="adm-mono" style="color:#00d4ff; font-weight:700;">${esc(r.rep_code)}</td>
                                            <td><a href="javascript:void(0)" style="color:#fff; font-weight:600; text-decoration:none;" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a></td>
                                            <td>${esc(r.state || '-')}</td>
                                            <td class="adm-mono">${r.total_workshops} / ${r.max_workshops_limit}</td>
                                            <td>
                                                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;"><span>${r.month_workshops} / ${r.monthly_goal_workshops}</span><span>${pWs}%</span></div>
                                                <div class="adm-progress-track"><div class="adm-progress-fill" style="width:${pWs}%"></div></div>
                                            </td>
                                            <td>
                                                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;"><span>${r.month_paid_activations} / ${r.monthly_goal_activations}</span><span>${pAct}%</span></div>
                                                <div class="adm-progress-track"><div class="adm-progress-fill" style="width:${pAct}%"></div></div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 4. OFICINAS CREDENCIADAS (FASE 5)
    // --------------------------------------------------------------------------
    async renderWorkshops(ctx) {
        const f = ctx.params || {};
        const data = await API.getAdminWorkshopsSummary({
            q: f.q || '',
            status: f.status || 'ALL',
            state: f.state || 'ALL',
            referral: f.referral || 'ALL',
            page: f.page || 1,
            page_size: 25
        });
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Oficinas Credenciadas (${data.total || 0})</h2>
                    <p>Cadeia completa Representante → Oficina → Clientes Únicos → Veículos → Pagamentos → Comissões.</p>
                </div>
                <div class="adm-updated-stamp">Atualizado: ${esc(AdminView.formatDateTime(data.generated_at))}</div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" class="adm-input" style="min-width:240px;" placeholder="Buscar nome fantasia, CNPJ, cidade, código rep..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <select class="adm-select" onchange="AdminView.updateParams({ status: this.value, page: 1 })">
                        <option value="ALL" ${(!f.status || f.status === 'ALL') ? 'selected' : ''}>Status: Todos</option>
                        <option value="APPROVED" ${f.status === 'APPROVED' ? 'selected' : ''}>Aprovadas</option>
                        <option value="PENDING" ${f.status === 'PENDING' ? 'selected' : ''}>Pendentes</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensas</option>
                    </select>
                    <select class="adm-select" onchange="AdminView.updateParams({ state: this.value, page: 1 })">
                        <option value="ALL">Estado: Todos</option>
                        ${(data.states_available || []).map(uf => `<option value="${esc(uf)}" ${f.state === uf ? 'selected' : ''}>${esc(uf)}</option>`).join('')}
                    </select>
                    <select class="adm-select" onchange="AdminView.updateParams({ referral: this.value, page: 1 })">
                        <option value="ALL" ${(!f.referral || f.referral === 'ALL') ? 'selected' : ''}>Vínculo: Todos</option>
                        <option value="LINKED" ${f.referral === 'LINKED' ? 'selected' : ''}>Indicadas por Representante</option>
                        <option value="DIRECT" ${f.referral === 'DIRECT' ? 'selected' : ''}>Diretas (sem representante)</option>
                    </select>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ q: this.parentNode.querySelector('input').value, page: 1 })">Filtrar</button>
                </div>

                ${(data.items || []).length === 0 ? `<div class="adm-empty"><strong>Nenhuma oficina encontrada</strong>Ajuste os filtros ou aguarde novos credenciamentos.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead>
                                <tr>
                                    <th>Oficina / CNPJ</th>
                                    <th>Cidade/UF</th>
                                    <th>Telefone</th>
                                    <th>Credenciamento</th>
                                    <th>Status</th>
                                    <th>Representante / Validade</th>
                                    <th>Clientes Únicos</th>
                                    <th>Veículos</th>
                                    <th>Pagos / Pend.</th>
                                    <th>Fat. Atribuído</th>
                                    <th>Comissões Rep.</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(w => `
                                    <tr>
                                        <td>
                                            <a href="javascript:void(0)" style="color:#fff; font-weight:700; text-decoration:none;" onclick="AdminView.openWorkshop('${esc(w.id)}')">${esc(w.trade_name)}</a>
                                            <div class="adm-mono" style="font-size:11px; color:#64748b;">${esc(w.cnpj || 'CNPJ não informado')}</div>
                                        </td>
                                        <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                        <td class="adm-mono">${esc(w.phone || '-')}</td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(w.created_at))}</td>
                                        <td>${AdminView.statusBadge(w.status)}</td>
                                        <td>
                                            ${w.rep_code ? `
                                                <a href="javascript:void(0)" style="color:#00d4ff; font-weight:700; text-decoration:none;" onclick="AdminView.openRepresentative('${esc(w.representative_id)}')">${esc(w.rep_code)}</a>
                                                <div style="font-size:11px; color:#94a3b8;">${esc(w.representative_name || '')}</div>
                                                <div style="font-size:10.5px; color:#64748b;">Vínculo: ${esc(AdminView.formatDate(w.referral_linked_at))} → ${esc(AdminView.formatDate(w.referral_valid_until))}</div>
                                            ` : `<span class="adm-badge adm-badge-muted">Direta</span>`}
                                        </td>
                                        <td class="adm-mono" style="font-weight:700; color:#38bdf8;">${w.unique_clients_count || 0}</td>
                                        <td class="adm-mono">${w.vehicles_count || 0} <span style="color:#64748b; font-size:11px;">(${w.active_dna_count || 0} DNA)</span></td>
                                        <td class="adm-mono"><span style="color:#34d399; font-weight:700;">${w.paid_registrations_count || 0}</span> / <span style="color:#fbbf24;">${w.pending_registrations_count || 0}</span></td>
                                        <td class="adm-mono" style="font-weight:700;">${brl(w.attributed_revenue_cents)}</td>
                                        <td class="adm-mono" style="color:#ffd21c;">${brl(w.rep_commissions_generated_cents)}</td>
                                        <td style="white-space:nowrap;">
                                            <button class="adm-btn adm-btn-sm" onclick="AdminView.openWorkshop('${esc(w.id)}')">Abrir</button>
                                            ${w.status !== 'APPROVED' ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED')">Aprovar</button>` : `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED')">Suspender</button>`}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${AdminView.renderPagination(data.page, data.total_pages, data.total)}
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 4B. DETALHE INDIVIDUAL DA OFICINA (Separação rigorosa Clientes Únicos × Veículos)
    // --------------------------------------------------------------------------
    async renderWorkshopDetail(ctx) {
        const workshopId = ctx.params?.id;
        if (!workshopId) return this.renderWorkshops(ctx);
        const data = await API.getAdminWorkshopPerformance(workshopId);
        const w = data.workshop;
        const m = data.metrics || {};
        const ref = data.referral;
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <div style="margin-bottom:6px;">
                        <button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('workshops')">← Voltar para Oficinas</button>
                    </div>
                    <h2>${esc(w.trade_name)} ${AdminView.statusBadge(w.status)}</h2>
                    <p>${esc(w.company_name || '')} • CNPJ: <span class="adm-mono">${esc(w.cnpj || '-')}</span> • ${esc(w.city || '-')}/${esc(w.state || '-')} • Tel: ${esc(w.phone || '-')}</p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="adm-btn adm-btn-sm adm-btn-gold" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(ref ? ref.rep_code : 'Nenhum')}')">Reatribuir Representante</button>
                    ${w.status !== 'APPROVED' ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED')">Aprovar Oficina</button>` : `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED')">Suspender Oficina</button>`}
                </div>
            </div>

            <div class="adm-chain-box">
                <div style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Cadeia Comercial Auditável</div>
                <div class="adm-chain-flow">
                    <span class="adm-chain-step"><strong>Representante:</strong> ${ref ? `<a href="javascript:void(0)" style="color:#00d4ff;" onclick="AdminView.openRepresentative('${esc(ref.representative_id)}')">${esc(ref.rep_code)} — ${esc(ref.representative_name)}</a>` : 'Cadastro Direto'}</span>
                    <span class="adm-chain-arrow">→</span>
                    <span class="adm-chain-step"><strong>Oficina:</strong> ${esc(w.trade_name)} ${ref ? `(Validade: ${esc(AdminView.formatDate(ref.valid_until))})` : ''}</span>
                    <span class="adm-chain-arrow">→</span>
                    <span class="adm-chain-step"><strong>Clientes Únicos:</strong> ${m.unique_clients_count || 0} (${m.vehicles_count || 0} veículos)</span>
                    <span class="adm-chain-arrow">→</span>
                    <span class="adm-chain-step"><strong>Pagos:</strong> ${m.paid_registrations_count || 0} (${brl(m.attributed_revenue_cents)})</span>
                    <span class="adm-chain-arrow">→</span>
                    <span class="adm-chain-step"><strong>Comissão Rep.:</strong> ${brl(m.rep_commissions_confirmed_cents)} conf.</span>
                </div>
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Clientes Únicos</div><div class="adm-kpi-value">${m.unique_clients_count || 0}</div><div class="adm-kpi-sub">Desduplicados por conta/e-mail/tel</div></div>
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Veículos Cadastrados</div><div class="adm-kpi-value">${m.vehicles_count || 0}</div><div class="adm-kpi-sub">${m.active_dna_count || 0} com DNA ativo</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Cadastros Pagos / Ativações</div><div class="adm-kpi-value">${m.paid_registrations_count || 0}</div><div class="adm-kpi-sub">${m.pending_registrations_count || 0} pendente(s) • Fat.: ${brl(m.attributed_revenue_cents)}</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Atendimentos (OS / Agenda)</div><div class="adm-kpi-value">${m.service_orders_count || 0}</div><div class="adm-kpi-sub">${m.appointments_count || 0} agendamentos • OS: ${brl(m.mechanical_volume_cents)}</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Clientes Únicos desta Oficina (${(data.unique_clients || []).length})</h3>
                        <p class="adm-card-subtitle">Clientes com múltiplos veículos aparecem uma única vez com toda a frota agrupada</p>
                    </div>
                </div>
                ${(data.unique_clients || []).length === 0 ? `<div class="adm-empty"><strong>Nenhum cliente vinculado</strong>Esta oficina ainda não cadastrou ou atendeu clientes.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Cliente</th><th>Contato</th><th>Qtd. Veículos</th><th>Veículos / Placas / DNA</th><th>OS Realizadas</th><th>Volume Serviços</th></tr></thead>
                            <tbody>
                                ${data.unique_clients.map(cl => `
                                    <tr>
                                        <td><strong>${esc(cl.name)}</strong></td>
                                        <td style="font-size:11.5px; color:#94a3b8;">${esc(cl.email || '-')}<br/>${esc(cl.phone || '-')}</td>
                                        <td class="adm-mono" style="font-weight:700; color:#38bdf8;">${cl.vehicles_count}</td>
                                        <td>
                                            ${(cl.vehicles || []).map(v => `
                                                <span class="adm-badge adm-badge-cyan" style="margin:2px; cursor:pointer;" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">
                                                    ${esc(v.license_plate)} (${esc(v.brand || '')} ${esc(v.model || '')}) ${v.dna_code ? `• ${esc(v.dna_code)}` : ''}
                                                </span>
                                            `).join('')}
                                        </td>
                                        <td class="adm-mono">${cl.services_count || 0}</td>
                                        <td class="adm-mono">${brl(cl.services_total_cents)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Cobranças PIX da Oficina (${(data.pix_charges || []).length})</h3></div>
                    ${(data.pix_charges || []).length === 0 ? `<div class="adm-empty"><strong>Sem cobranças PIX</strong>Nenhuma cobrança gerada por esta oficina.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Data</th><th>Tipo</th><th>Código</th><th>Valor Cliente</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${data.pix_charges.slice(0, 15).map(p => `
                                        <tr>
                                            <td class="adm-mono">${esc(AdminView.formatDate(p.paid_at || p.created_at))}</td>
                                            <td>${esc(p.charge_type)}</td>
                                            <td class="adm-mono">${esc(p.activation_code || p.id)}</td>
                                            <td class="adm-mono">${brl(p.customer_price_cents)}</td>
                                            <td>${AdminView.statusBadge(p.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Comissões de Representante Geradas (${(data.representative_commissions || []).length})</h3></div>
                    ${(data.representative_commissions || []).length === 0 ? `<div class="adm-empty"><strong>Sem comissões</strong>Nenhuma comissão vinculada a esta oficina.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Competência</th><th>Representante</th><th>Valor</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${data.representative_commissions.slice(0, 15).map(rc => `
                                        <tr>
                                            <td class="adm-mono">${esc(rc.competence_month || '-')}</td>
                                            <td><span class="adm-mono" style="color:#00d4ff;">${esc(rc.rep_code)}</span> ${esc(rc.rep_name)}</td>
                                            <td class="adm-mono" style="font-weight:700;">${brl(rc.commission_amount_cents)}</td>
                                            <td>${AdminView.statusBadge(rc.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 5. CLIENTES CADASTRADOS (CLIENTES ÚNICOS)
    // --------------------------------------------------------------------------
    async renderClients(ctx) {
        const f = ctx.params || {};
        const data = await API.getAdminUniqueClients({
            q: f.q || '',
            workshop_id: f.workshop_id || 'all',
            page: f.page || 1,
            page_size: 25
        });
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Clientes Cadastrados — Base Única (${data.total || 0})</h2>
                    <p>Proprietários desduplicados da rede DNA AUTO. Um cliente com múltiplos veículos é contabilizado apenas uma vez.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" class="adm-input" style="min-width:260px;" placeholder="Buscar nome, e-mail, telefone, placa ou DNA..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ q: this.parentNode.querySelector('input').value, page: 1 })">Buscar</button>
                </div>

                ${(data.items || []).length === 0 ? `<div class="adm-empty"><strong>Nenhum cliente encontrado</strong>Não há clientes cadastrados para os filtros informados.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Cliente / CPF</th><th>Contato</th><th>Oficina Principal</th><th>Veículos</th><th>Frota (Placa / DNA)</th><th>OS</th><th>Gasto Total OS</th><th>Status</th></tr></thead>
                            <tbody>
                                ${data.items.map(c => `
                                    <tr>
                                        <td><strong>${esc(c.name)}</strong><div class="adm-mono" style="font-size:11px; color:#64748b;">${esc(c.cpf_masked)}</div></td>
                                        <td style="font-size:11.5px; color:#94a3b8;">${esc(c.email || '-')}<br/>${esc(c.phone || '-')}</td>
                                        <td>${esc(c.preferred_workshop_name)}</td>
                                        <td class="adm-mono" style="font-weight:700; color:#00d4ff;">${c.vehicles_count}</td>
                                        <td>
                                            ${(c.vehicles || []).length === 0 ? '<span style="color:#64748b;">Sem veículo</span>' : c.vehicles.map(v => `
                                                <span class="adm-badge adm-badge-cyan" style="margin:2px; cursor:pointer;" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">${esc(v.license_plate)} ${v.dna_code ? `• ${esc(v.dna_code)}` : ''}</span>
                                            `).join('')}
                                        </td>
                                        <td class="adm-mono">${c.services_count || 0}</td>
                                        <td class="adm-mono">${brl(c.total_spent_cents)}</td>
                                        <td>${AdminView.statusBadge(c.status)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${AdminView.renderPagination(data.page, data.total_pages, data.total)}
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. VEÍCULOS E DNA
    // --------------------------------------------------------------------------
    async renderVehicles(ctx) {
        const f = ctx.params || {};
        const qs = API._qs({ q: f.q || '', dna_status: f.dna_status || '', workshop_id: f.workshop_id || 'all', page_size: 100 });
        const data = await API.request(`/admin/fleet${qs}`);
        const vehicles = data.vehicles || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Veículos e DNA (${vehicles.length})</h2>
                    <p>Frota completa sincronizada entre App Cliente e App Oficina com código DNA permanente e acesso direto ao Dossiê.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" class="adm-input" style="min-width:250px;" placeholder="Buscar placa, código DNA, marca ou modelo..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value })" />
                    <select class="adm-select" onchange="AdminView.updateParams({ dna_status: this.value })">
                        <option value="" ${!f.dna_status ? 'selected' : ''}>DNA: Todos</option>
                        <option value="ACTIVE" ${f.dna_status === 'ACTIVE' ? 'selected' : ''}>Apenas DNA Ativo</option>
                        <option value="NONE" ${f.dna_status === 'NONE' ? 'selected' : ''}>Sem DNA Ativo</option>
                    </select>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ q: this.parentNode.querySelector('input').value })">Filtrar</button>
                </div>

                ${vehicles.length === 0 ? `<div class="adm-empty"><strong>Nenhum veículo encontrado</strong>Não existem veículos para o filtro selecionado.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Placa</th><th>Veículo</th><th>Código DNA</th><th>Proprietário</th><th>Oficina Vinculada</th><th>KM Atual</th><th>OS / Total</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${vehicles.map(v => `
                                    <tr>
                                        <td class="adm-mono" style="font-weight:800; color:#fff;">${esc(v.license_plate)}</td>
                                        <td><strong>${esc(v.brand)} ${esc(v.model)}</strong><div style="font-size:11px; color:#64748b;">${esc(v.model_year || '')} • ${esc(v.color || '-')}</div></td>
                                        <td>${v.dna_code ? `<span class="adm-badge adm-badge-success">${esc(v.dna_code)}</span>` : `<span class="adm-badge adm-badge-muted">Sem DNA</span>`}</td>
                                        <td>${esc(v.owner_name)}<div style="font-size:11px; color:#64748b;">${esc(v.owner_phone || '')}</div></td>
                                        <td>${esc(v.workshop_name)}</td>
                                        <td class="adm-mono">${v.current_mileage ? `${Number(v.current_mileage).toLocaleString('pt-BR')} km` : '-'}</td>
                                        <td class="adm-mono">${v.services_count || 0} • ${brl(v.total_maintenance_cents)}</td>
                                        <td><button class="adm-btn adm-btn-sm" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">Dossiê →</button></td>
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
    // 7. ORDENS DE SERVIÇO
    // --------------------------------------------------------------------------
    async renderServiceOrders(ctx) {
        const f = ctx.params || {};
        const data = await API.getAdminServiceOrders({
            q: f.q || '',
            proof_level: f.proof_level || '',
            page: f.page || 1,
            page_size: 25
        });
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Ordens de Serviço da Rede (${data.total || 0})</h2>
                    <p>Serviços executados e declarados em toda a rede com nível de comprovação documental.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" class="adm-input" style="min-width:250px;" placeholder="Buscar placa, título do serviço ou oficina..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <select class="adm-select" onchange="AdminView.updateParams({ proof_level: this.value, page: 1 })">
                        <option value="" ${!f.proof_level ? 'selected' : ''}>Comprovação: Todos</option>
                        <option value="4" ${f.proof_level === '4' ? 'selected' : ''}>Nível 4 — Comprovado Oficina</option>
                        <option value="3" ${f.proof_level === '3' ? 'selected' : ''}>Nível 3 — Confirmado</option>
                        <option value="2" ${f.proof_level === '2' ? 'selected' : ''}>Nível 2 — Nota Anexada</option>
                        <option value="1" ${f.proof_level === '1' ? 'selected' : ''}>Nível 1 — Declarado Cliente</option>
                    </select>
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ q: this.parentNode.querySelector('input').value, page: 1 })">Filtrar</button>
                </div>

                ${(data.items || []).length === 0 ? `<div class="adm-empty"><strong>Nenhuma ordem de serviço</strong>Não foram encontradas ordens de serviço para os filtros aplicados.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data</th><th>Placa / Veículo</th><th>Serviço / Categoria</th><th>Oficina</th><th>KM</th><th>Comprovação</th><th>Valor</th></tr></thead>
                            <tbody>
                                ${data.items.map(s => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDate(s.service_date || s.created_at))}</td>
                                        <td><strong class="adm-mono" style="cursor:pointer; color:#00d4ff;" onclick="App.switchView('dossier', '${esc(s.license_plate)}')">${esc(s.license_plate)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(s.brand || '')} ${esc(s.model || '')}</div></td>
                                        <td><strong>${esc(s.service_title || '-')}</strong><div style="font-size:11px; color:#64748b;">${esc(s.category || '')}</div></td>
                                        <td>${esc(s.workshop_name || 'Declaração do Cliente')}</td>
                                        <td class="adm-mono">${s.mileage ? `${Number(s.mileage).toLocaleString('pt-BR')} km` : '-'}</td>
                                        <td>${AdminView.proofBadge(s.proof_level)}</td>
                                        <td class="adm-mono" style="font-weight:700;">${brl(s.total_cost_cents)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${AdminView.renderPagination(data.page, data.total_pages, data.total)}
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 8. HISTÓRICO DE MANUTENÇÃO
    // --------------------------------------------------------------------------
    async renderMaintenanceHistory() {
        const data = await API.getAdminMaintenanceHistory();
        const preds = data.predictions || [];
        const srvs = data.services || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Histórico e Previsões de Manutenção</h2>
                    <p>Monitoramento preditivo da frota (itens vencidos/próximos) e linha do tempo consolidada de manutenções.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Previsões Preditivas da Frota (${preds.length})</h3>
                        <p class="adm-card-subtitle">Baseado no motor de manutenção preditiva por quilometragem e tempo</p>
                    </div>
                </div>
                ${preds.length === 0 ? `<div class="adm-empty"><strong>Sem previsões registradas</strong>Nenhuma previsão preditiva calculada ainda para a frota.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Placa / Veículo</th><th>Item / Regra</th><th>Status Alerta</th><th>Próx. KM</th><th>Próx. Data</th></tr></thead>
                            <tbody>
                                ${preds.slice(0, 30).map(p => `
                                    <tr>
                                        <td><strong class="adm-mono">${esc(p.license_plate)}</strong> ${esc(p.brand || '')} ${esc(p.model || '')}</td>
                                        <td>${esc(p.item_name || p.rule_code || '-')}</td>
                                        <td>${AdminView.statusBadge(p.alert_status)}</td>
                                        <td class="adm-mono">${p.next_due_km ? `${Number(p.next_due_km).toLocaleString('pt-BR')} km` : '-'}</td>
                                        <td class="adm-mono">${esc(p.next_due_date || '-')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Linha do Tempo de Manutenções (${srvs.length})</h3></div>
                ${srvs.length === 0 ? `<div class="adm-empty"><strong>Sem histórico</strong>Nenhum registro de manutenção encontrado.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data</th><th>Placa / DNA</th><th>Serviço</th><th>Oficina</th><th>KM</th><th>Valor</th></tr></thead>
                            <tbody>
                                ${srvs.slice(0, 35).map(s => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDate(s.service_date))}</td>
                                        <td class="adm-mono"><strong>${esc(s.license_plate)}</strong> <span style="color:#64748b;">${esc(s.dna_code || '')}</span></td>
                                        <td>${esc(s.service_title || s.category)}</td>
                                        <td>${esc(s.workshop_name || 'Cliente')}</td>
                                        <td class="adm-mono">${s.mileage ? `${Number(s.mileage).toLocaleString('pt-BR')} km` : '-'}</td>
                                        <td class="adm-mono">${brl(s.total_cost_cents)}</td>
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
