// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — VISÃO EXECUTIVA & REDE DNA AUTO
// Dashboard Executivo, Operação, Indicadores Estratégicos, Oficinas Credenciadas
// (com Detalhamento em 7 Abas), Clientes, Veículos, Atendimentos e Manutenções
// ==============================================================================

const AdminScreensCore = {
    lastWorkshopsData: [],

    // Helper seguro para ordenação client-side em listagens compatíveis
    sortItems(items, sortBy, sortDir = 'desc') {
        if (!sortBy || !Array.isArray(items)) return items || [];
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...items].sort((a, b) => {
            const va = a?.[sortBy];
            const vb = b?.[sortBy];
            if (typeof va === 'number' || typeof vb === 'number') {
                return (Number(va || 0) - Number(vb || 0)) * dir;
            }
            return String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { numeric: true, sensitivity: 'base' }) * dir;
        });
    },

    filterByCredenciamentoPeriod(items, periodKey) {
        if (!periodKey || periodKey === 'ALL') return items || [];
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
        const days = daysMap[periodKey];
        if (!days) return items || [];
        const cutoff = Date.now() - days * 86400000;
        return (items || []).filter(item => {
            if (!item.created_at) return false;
            const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(item.created_at))
                ? `${String(item.created_at).replace(' ', 'T')}Z`
                : String(item.created_at);
            const t = new Date(iso).getTime();
            return !Number.isNaN(t) && t >= cutoff;
        });
    },

    // --------------------------------------------------------------------------
    // 1. DASHBOARD EXECUTIVO (Seções Operacional, Comercial, Financeira + 8 Gráficos)
    // --------------------------------------------------------------------------
    async renderDashboard(ctx) {
        const finPromise = typeof API.getAdminFinanceOverview === 'function'
            ? API.getAdminFinanceOverview({ competence_month: ctx.month }).catch(() => null)
            : Promise.resolve(null);

        const [overview, timeseries, finOverview] = await Promise.all([
            API.getAdminDashboardOverview({ period: ctx.period, month: ctx.month }),
            API.getAdminDashboardTimeseries({ months: 6 }),
            finPromise
        ]);

        AdminView.updateLiveBadgesFromOverview(overview);

        const UI = AdminView.ui();
        const c = overview.cards || {};
        const s = overview.supplementary || {};
        const finRev = (finOverview && finOverview.revenue) || {};
        const finWp = (finOverview && finOverview.workshop_payouts) || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;
        const charts = timeseries || {};
        const updatedLabel = AdminView.formatDateTime(overview.generated_at);

        const dnaAdoptionPct = c.total_vehicles > 0
            ? Math.round((Number(c.active_dna_vehicles || 0) / Number(c.total_vehicles)) * 100)
            : null;

        const hasPendencies = (c.pending_representatives > 0 || c.pending_workshops > 0 || s.open_support_tickets > 0);

        return `
            ${UI.PageHeader({
                title: 'Dashboard Executivo',
                subtitle: `Central gerencial consolidada em tempo real — Cliente, Oficina, Representante Comercial e Financeiro. Período ativo: <strong>${esc(overview.period?.label || '-')}</strong>.`,
                updatedAt: updatedLabel,
                actionsHtml: `
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('revenue')">Visão Financeira →</button>
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('workshops')">Gerenciar Oficinas</button>
                `
            })}

            ${hasPendencies ? `
                <div class="adm-alert-banner" role="region" aria-label="Pendências operacionais">
                    <div>
                        <strong>Pendências operacionais da rede:</strong>
                        ${c.pending_representatives > 0 ? ` • <strong>${num(c.pending_representatives)}</strong> representante(s) aguardando aprovação` : ''}
                        ${c.pending_workshops > 0 ? ` • <strong>${num(c.pending_workshops)}</strong> oficina(s) aguardando credenciamento` : ''}
                        ${s.open_support_tickets > 0 ? ` • <strong>${num(s.open_support_tickets)}</strong> chamado(s) de suporte em aberto` : ''}
                    </div>
                    <div class="adm-header-actions">
                        ${c.pending_representatives > 0 ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('representatives', { status: 'PENDING_APPROVAL' })">Aprovar Representantes</button>` : ''}
                        ${c.pending_workshops > 0 ? `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('workshops', { status: 'PENDING' })">Revisar Oficinas</button>` : ''}
                        ${s.open_support_tickets > 0 ? `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('support')">Abrir Suporte</button>` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- SEÇÃO 1: INDICADORES OPERACIONAIS -->
            <div class="adm-block-header">
                <h3 class="adm-block-title">Indicadores Operacionais da Rede</h3>
                <span class="adm-block-subtitle">Base real de oficinas, clientes desduplicados, frota certificada e atendimentos</span>
            </div>
            <div class="adm-kpi-grid" data-testid="dashboard-kpi-grid">
                ${UI.KPIStatCard({
                    label: 'Oficinas Cadastradas',
                    value: num(c.total_workshops),
                    sub: `${num(s.cities_covered)} cidades • ${num(s.states_covered)} estados`,
                    tone: 'tone-blue',
                    onClick: "AdminView.navigate('workshops')"
                })}
                ${UI.KPIStatCard({
                    label: 'Oficinas Ativas',
                    value: num(c.active_workshops),
                    sub: `${num(c.pending_workshops)} pendente(s) • ${num(s.suspended_workshops)} suspensa(s)`,
                    tone: 'tone-success',
                    onClick: "AdminView.navigate('workshops', { status: 'APPROVED' })"
                })}
                ${UI.KPIStatCard({
                    label: 'Clientes Registrados (Únicos)',
                    value: num(c.unique_clients),
                    sub: 'Desduplicados (múltiplos veículos = 1 cliente)',
                    tone: 'tone-cyan',
                    onClick: "AdminView.navigate('clients')"
                })}
                ${UI.KPIStatCard({
                    label: 'Veículos Registrados',
                    value: num(c.total_vehicles),
                    sub: `${num(c.active_dna_vehicles)} com DNA ativo • ${num(s.vehicles_without_dna)} sem DNA`,
                    tone: 'tone-blue',
                    onClick: "AdminView.navigate('vehicles')"
                })}
                ${UI.KPIStatCard({
                    label: 'Veículos com DNA Ativo',
                    value: num(c.active_dna_vehicles),
                    sub: dnaAdoptionPct !== null ? `${dnaAdoptionPct}% da frota certificada` : 'Sem veículos cadastrados',
                    tone: 'tone-success',
                    progressPct: dnaAdoptionPct,
                    onClick: "AdminView.navigate('vehicles', { dna_status: 'ACTIVE' })"
                })}
                ${UI.KPIStatCard({
                    label: 'Atendimentos no Período',
                    value: num(c.monthly_attendances_count),
                    sub: `${num(s.proven_services_count)} OS comprovadas Nível 4`,
                    tone: 'tone-cyan',
                    onClick: "AdminView.navigate('service-orders')"
                })}
                ${UI.KPIStatCard({
                    label: 'Oficinas Aguardando Aprovação',
                    value: num(c.pending_workshops),
                    sub: c.pending_workshops > 0 ? 'Requer homologação administrativa' : 'Fila de credenciamento em dia',
                    tone: c.pending_workshops > 0 ? 'tone-warning' : 'tone-success',
                    onClick: "AdminView.navigate('workshops', { status: 'PENDING' })"
                })}
                ${UI.KPIStatCard({
                    label: 'Chamados de Suporte Abertos',
                    value: num(s.open_support_tickets),
                    sub: s.open_support_tickets > 0 ? 'Aguardando resposta da matriz' : 'Nenhum chamado pendente',
                    tone: s.open_support_tickets > 0 ? 'tone-danger' : 'tone-success',
                    onClick: "AdminView.navigate('support')"
                })}
            </div>

            <!-- SEÇÃO 2: INDICADORES COMERCIAIS -->
            <div class="adm-block-header">
                <h3 class="adm-block-title">Indicadores Comerciais</h3>
                <span class="adm-block-subtitle">Expansão da rede via representantes e cadastros liquidados no período</span>
            </div>
            <div class="adm-kpi-grid">
                ${UI.KPIStatCard({
                    label: 'Representantes Cadastrados',
                    value: num(c.total_representatives),
                    sub: `${num(s.suspended_representatives)} suspensos • ${num(s.rejected_representatives)} recusados`,
                    tone: 'tone-blue',
                    onClick: "AdminView.navigate('representatives')"
                })}
                ${UI.KPIStatCard({
                    label: 'Representantes Ativos',
                    value: num(c.active_representatives),
                    sub: `${num(s.active_referrals)} vínculos comerciais vigentes (24m)`,
                    tone: 'tone-success',
                    onClick: "AdminView.navigate('representatives', { status: 'ACTIVE' })"
                })}
                ${UI.KPIStatCard({
                    label: 'Reps. Aguardando Aprovação',
                    value: num(c.pending_representatives),
                    sub: c.pending_representatives > 0 ? 'Ação administrativa pendente' : 'Nenhuma pendência na fila',
                    tone: c.pending_representatives > 0 ? 'tone-warning' : 'tone-success',
                    onClick: "AdminView.navigate('representatives', { status: 'PENDING_APPROVAL' })"
                })}
                ${UI.KPIStatCard({
                    label: 'Cadastros Pagos no Período',
                    value: num(c.monthly_paid_registrations),
                    sub: `Período: ${overview.period?.label || '-'}`,
                    tone: 'tone-cyan',
                    onClick: "AdminView.navigate('acquisition')"
                })}
            </div>

            <!-- SEÇÃO 3: INDICADORES FINANCEIROS -->
            <div class="adm-block-header">
                <h3 class="adm-block-title">Indicadores Financeiros</h3>
                <span class="adm-block-subtitle">Separação rigorosa entre valores faturados, recebidos, pendentes, previstos e a repassar</span>
            </div>
            <div class="adm-kpi-grid">
                ${UI.FinancialMetric({
                    label: 'Faturamento Bruto Confirmado',
                    cents: c.monthly_confirmed_revenue_cents,
                    classification: 'Confirmado',
                    sub: `Volume mecânico OS: ${brl(s.mechanical_services_volume_cents)}`,
                    tone: 'tone-success',
                    onClick: "AdminView.navigate('revenue')"
                })}
                ${UI.FinancialMetric({
                    label: 'Receita Líquida Plataforma (PIX)',
                    cents: finRev.pix_paid_platform_cents || 0,
                    classification: 'Recebido',
                    sub: finOverview ? `${num(finRev.pix_paid_count)} PIX liquidados • Repassado ofic.: ${brl(finWp.paid_cents)}` : 'Consulte Faturamento Geral para detalhamento',
                    tone: 'tone-cyan',
                    onClick: "AdminView.navigate('revenue')"
                })}
                ${UI.FinancialMetric({
                    label: 'Valores Pendentes (PIX em Aberto)',
                    cents: finRev.pix_pending_cents || 0,
                    classification: 'Pendente',
                    sub: `${num(finRev.pix_pending_count || 0)} cobrança(s) aguardando compensação`,
                    tone: 'tone-warning',
                    onClick: "AdminView.navigate('reconciliation')"
                })}
                ${UI.FinancialMetric({
                    label: 'Comissões a Pagar (Elegível)',
                    cents: c.rep_commissions_payable_cents,
                    classification: 'A Pagar',
                    sub: `Projetadas (não elegíveis): ${brl(s.rep_commissions_projected_cents)}`,
                    tone: 'tone-gold',
                    onClick: "AdminView.navigate('commissions')"
                })}
                ${UI.FinancialMetric({
                    label: 'Comissões Próximo Ciclo',
                    cents: c.rep_commissions_next_month_cents,
                    classification: 'Previsto',
                    sub: `Previsão p/ ${overview.period?.scheduled_payout_date || overview.period?.payout_month || '-'}`,
                    tone: 'tone-blue',
                    onClick: "AdminView.navigate('payouts')"
                })}
                ${UI.FinancialMetric({
                    label: 'Repasses Pendentes às Oficinas',
                    cents: c.workshop_payouts_pending_cents,
                    classification: 'A Repassar',
                    sub: `Já repassado: ${brl(finWp.paid_cents || 0)}`,
                    tone: 'tone-warning',
                    onClick: "AdminView.navigate('workshop-payouts')"
                })}
                ${UI.FinancialMetric({
                    label: 'Taxas por Atendimento',
                    cents: c.attendance_fees_confirmed_cents,
                    classification: 'Confirmado',
                    sub: `${num(s.attendance_fees_count)} retorno(s) contabilizado(s)`,
                    tone: 'tone-success',
                    onClick: "AdminView.navigate('attendance-fees')"
                })}
                ${UI.FinancialMetric({
                    label: 'Comissões já Pagas (Histórico)',
                    cents: s.rep_commissions_paid_cents || 0,
                    classification: 'Liquidado',
                    sub: `Estornadas: ${brl(s.rep_commissions_refunded_cents || 0)} • Bloq.: ${brl(s.rep_commissions_blocked_cents || 0)}`,
                    tone: 'tone-cyan',
                    onClick: "AdminView.navigate('payouts')"
                })}
            </div>

            <!-- SEÇÃO 4: ANÁLISE GRÁFICA EXECUTIVA -->
            <div class="adm-block-header">
                <h3 class="adm-block-title">Evolução Histórica e Distribuição da Rede</h3>
                <span class="adm-block-subtitle">Séries reais dos últimos ${charts.months || 6} meses alimentadas diretamente pelo banco de dados</span>
            </div>
            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Evolução Mensal de Cadastramentos</h3>
                            <p class="adm-card-subtitle">Comparativo entre cadastros pagos e ativações iniciadas</p>
                        </div>
                    </div>
                    ${AdminCharts.renderBarChart(charts.registrations_by_month || [], {
                        valueKey: 'paid_registrations',
                        secondaryKey: 'client_activations',
                        labelKey: 'month',
                        primaryLabel: 'Cadastros Pagos',
                        secondaryLabel: 'Ativações Iniciadas',
                        color: 'var(--adm-chart-1)',
                        secondaryColor: 'var(--adm-chart-2)'
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Faturamento Mensal Confirmado</h3>
                            <p class="adm-card-subtitle">Receita efetivamente confirmada de ativações DNA</p>
                        </div>
                    </div>
                    ${AdminCharts.renderLineChart(charts.revenue_by_month || [], {
                        valueKey: 'confirmed_revenue_cents',
                        labelKey: 'month',
                        seriesLabel: 'Faturamento Confirmado (BRL)',
                        color: 'var(--adm-chart-2)',
                        isCurrency: true
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Crescimento da Rede de Oficinas</h3>
                            <p class="adm-card-subtitle">Base acumulada de oficinas credenciadas por mês</p>
                        </div>
                    </div>
                    ${AdminCharts.renderLineChart(charts.workshops_growth_by_month || [], {
                        valueKey: 'cumulative_workshops',
                        labelKey: 'month',
                        seriesLabel: 'Oficinas Acumuladas',
                        color: 'var(--adm-chart-3)'
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Comissões por Competência</h3>
                            <p class="adm-card-subtitle">Valores confirmados em aberto versus liquidados</p>
                        </div>
                    </div>
                    ${AdminCharts.renderBarChart(charts.commissions_by_competence || [], {
                        valueKey: 'confirmed_cents',
                        secondaryKey: 'paid_cents',
                        labelKey: 'competence_month',
                        primaryLabel: 'Confirmadas em Aberto',
                        secondaryLabel: 'Comissões Pagas',
                        color: 'var(--adm-chart-4)',
                        secondaryColor: 'var(--adm-chart-2)',
                        isCurrency: true
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Representantes com Maior Carteira</h3>
                            <p class="adm-card-subtitle">Oficinas vinculadas por representante comercial</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.top_representatives_by_workshops || [], {
                        labelKey: 'name',
                        subKey: 'rep_code',
                        valueKey: 'linked_workshops',
                        color: 'var(--adm-chart-1)',
                        suffix: ' oficina(s)'
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Cadastros Pagos por Representante</h3>
                            <p class="adm-card-subtitle">Ativações efetivamente liquidadas e comissionadas</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.paid_registrations_by_rep || [], {
                        labelKey: 'name',
                        subKey: 'rep_code',
                        valueKey: 'paid_registrations',
                        color: 'var(--adm-chart-2)',
                        suffix: ' pago(s)'
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Distribuição Geográfica da Rede</h3>
                            <p class="adm-card-subtitle">Oficinas credenciadas por unidade federativa (UF)</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.workshops_by_state || [], {
                        labelKey: 'state',
                        valueKey: 'total_workshops',
                        color: 'var(--adm-chart-3)',
                        suffix: ' oficina(s)'
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Cadastros por Canal de Origem</h3>
                            <p class="adm-card-subtitle">Oficina via Representante × Oficina Direta × App Cliente</p>
                        </div>
                    </div>
                    ${AdminCharts.renderHorizontalBars(charts.registrations_by_origin || [], {
                        labelKey: 'label',
                        valueKey: 'count',
                        color: 'var(--adm-chart-5)',
                        suffix: ' registro(s)'
                    })}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. OPERAÇÃO DA REDE
    // --------------------------------------------------------------------------
    async renderOperations() {
        const data = await API.getAdminOperationsOverview();
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Operação da Rede em Tempo Real',
                subtitle: 'Fila de aprovações pendentes, ordens de serviço lançadas pelas oficinas, ativações e agendamentos.',
                updatedAt: AdminView.formatDateTime(data.generated_at)
            })}

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Oficinas Aguardando Aprovação (${(data.pending_workshops || []).length})</h3>
                            <p class="adm-card-subtitle">Credenciamentos recebidos pelo portal e links de representantes</p>
                        </div>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: data.pending_workshops || [],
                        emptyTitle: 'Fila de oficinas vazia',
                        emptySubtitle: 'Nenhuma oficina aguardando aprovação no momento.',
                        columns: [
                            { key: 'trade_name', label: 'Oficina', render: w => `<span class="adm-cell-title">${esc(w.trade_name)}</span><div class="adm-cell-sub">${esc(w.email || w.phone || '')}</div>` },
                            { key: 'city', label: 'Cidade/UF', render: w => `${esc(w.city || '-')}/${esc(w.state || '-')}` },
                            { key: 'cnpj', label: 'CNPJ', tdClass: 'adm-mono', render: w => esc(w.cnpj || '-') },
                            {
                                key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                                render: w => `
                                    <div class="adm-actions-group">
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED', '${esc(w.trade_name)}')">Aprovar</button>
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED', '${esc(w.trade_name)}')">Recusar</button>
                                    </div>
                                `
                            }
                        ]
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Representantes Aguardando Aprovação (${(data.pending_representatives || []).length})</h3>
                            <p class="adm-card-subtitle">Representantes sem carteira ativa até homologação</p>
                        </div>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: data.pending_representatives || [],
                        emptyTitle: 'Fila de representantes vazia',
                        emptySubtitle: 'Nenhum representante aguardando aprovação.',
                        columns: [
                            { key: 'rep_code', label: 'Código', tdClass: 'adm-mono adm-text-accent', render: r => `<strong>${esc(r.rep_code)}</strong>` },
                            { key: 'name', label: 'Nome', render: r => `<span class="adm-cell-title">${esc(r.name)}</span><div class="adm-cell-sub">${esc(r.email)}</div>` },
                            { key: 'city', label: 'Região', render: r => `${esc(r.city || '-')}/${esc(r.state || '-')}` },
                            {
                                key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                                render: r => `
                                    <div class="adm-actions-group">
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'approve', '${esc(r.name)}')">Aprovar</button>
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reject', '${esc(r.name)}')">Rejeitar</button>
                                    </div>
                                `
                            }
                        ]
                    })}
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Últimas Ordens de Serviço Registradas (${(data.recent_services || []).length})</h3>
                        <p class="adm-card-subtitle">Sincronizado diretamente com o App Oficina e App Cliente</p>
                    </div>
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('service-orders')">Ver Todas as OS →</button>
                </div>
                ${UI.EnterpriseDataTable({
                    rows: data.recent_services || [],
                    emptyTitle: 'Sem ordens de serviço',
                    emptySubtitle: 'Nenhum registro de manutenção lançado até o momento.',
                    columns: [
                        { key: 'service_date', label: 'Data', tdClass: 'adm-mono', render: s => esc(AdminView.formatDate(s.service_date || s.created_at)) },
                        { key: 'license_plate', label: 'Placa / Veículo', render: s => `<strong class="adm-mono">${esc(s.license_plate)}</strong> <span class="adm-text-secondary">${esc(s.brand || '')} ${esc(s.model || '')}</span>` },
                        { key: 'service_title', label: 'Serviço', render: s => esc(s.service_title || s.category) },
                        { key: 'workshop_name', label: 'Oficina', render: s => esc(s.workshop_name || 'Declaração Cliente') },
                        { key: 'proof_level', label: 'Nível', render: s => AdminView.proofBadge(s.proof_level) },
                        { key: 'total_cost_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: s => brl(s.total_cost_cents) }
                    ]
                })}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Ativações de Clientes Recentes (${(data.recent_activations || []).length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: (data.recent_activations || []).slice(0, 12),
                        emptyTitle: 'Sem ativações',
                        emptySubtitle: 'Nenhuma ativação registrada.',
                        columns: [
                            { key: 'activation_code', label: 'Código', tdClass: 'adm-mono adm-text-accent', render: a => esc(a.activation_code) },
                            { key: 'client_name', label: 'Cliente', render: a => esc(a.client_name) },
                            { key: 'license_plate', label: 'Placa', tdClass: 'adm-mono', render: a => esc(a.license_plate || '-') },
                            { key: 'workshop_name', label: 'Oficina', render: a => esc(a.workshop_name || '-') },
                            { key: 'status', label: 'Status', render: a => AdminView.statusBadge(a.billing_status || a.status) }
                        ]
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Agendamentos Recentes (${(data.recent_appointments || []).length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: (data.recent_appointments || []).slice(0, 12),
                        emptyTitle: 'Sem agendamentos',
                        emptySubtitle: 'Nenhum agendamento registrado nas oficinas.',
                        columns: [
                            { key: 'appointment_date', label: 'Data / Hora', tdClass: 'adm-mono', render: a => `${esc(AdminView.formatDate(a.appointment_date))} ${esc(a.appointment_time || '')}` },
                            { key: 'owner_name', label: 'Cliente', render: a => esc(a.owner_name || '-') },
                            { key: 'license_plate', label: 'Placa', tdClass: 'adm-mono', render: a => esc(a.license_plate || '-') },
                            { key: 'workshop_name', label: 'Oficina', render: a => esc(a.workshop_name || '-') },
                            { key: 'status', label: 'Status', render: a => AdminView.statusBadge(a.status) }
                        ]
                    })}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 3. INDICADORES ESTRATÉGICOS E METAS
    // --------------------------------------------------------------------------
    async renderGoals(ctx) {
        const data = await API.getAdminGoals({ month: ctx.month });
        const UI = AdminView.ui();
        const g = data.global_goals || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const pct = (actual, target) => target > 0 ? Math.min(100, Math.round((Number(actual || 0) / Number(target)) * 100)) : 0;

        const wsPct = pct(g.workshops_actual, g.workshops_target);
        const actPct = pct(g.activations_actual, g.activations_target);
        const revPct = pct(g.revenue_actual_cents, g.revenue_target_cents);

        return `
            ${UI.PageHeader({
                title: `Indicadores Estratégicos — ${data.month || ''}`,
                subtitle: 'Acompanhamento de metas mensais globais da plataforma e desempenho individual por representante comercial.',
                actionsHtml: `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('settings')">Configurar Metas Globais</button>`
            })}

            <div class="adm-kpi-grid cols-3">
                ${UI.KPIStatCard({
                    label: `Meta de Novas Oficinas (${data.month})`,
                    value: `${g.workshops_actual || 0} / ${g.workshops_target || 0}`,
                    sub: `${wsPct}% atingido na competência`,
                    tone: 'tone-cyan',
                    progressPct: wsPct
                })}
                ${UI.KPIStatCard({
                    label: `Meta de Cadastros Pagos (${data.month})`,
                    value: `${g.activations_actual || 0} / ${g.activations_target || 0}`,
                    sub: `${actPct}% atingido na competência`,
                    tone: 'tone-blue',
                    progressPct: actPct
                })}
                ${UI.KPIStatCard({
                    label: 'Meta de Faturamento Confirmado',
                    value: brl(g.revenue_actual_cents),
                    sub: `Meta: ${brl(g.revenue_target_cents)} (${revPct}%)`,
                    tone: 'tone-success',
                    progressPct: revPct,
                    isMoney: true
                })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Acompanhamento de Metas por Representante Ativo</h3>
                        <p class="adm-card-subtitle">Oficinas captadas e ativações pagas no mês ${esc(data.month)}</p>
                    </div>
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.navigate('commercial-goals')">Editar Metas Individuais →</button>
                </div>
                ${UI.EnterpriseDataTable({
                    rows: data.representatives_goals || [],
                    emptyTitle: 'Nenhum representante ativo',
                    emptySubtitle: 'Aprove representantes comerciais para monitorar suas metas mensais.',
                    columns: [
                        { key: 'rep_code', label: 'Código', tdClass: 'adm-mono adm-text-accent', render: r => `<strong>${esc(r.rep_code)}</strong>` },
                        { key: 'name', label: 'Representante', render: r => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a>` },
                        { key: 'state', label: 'UF', render: r => esc(r.state || '-') },
                        { key: 'total_workshops', label: 'Carteira / Limite', align: 'right', tdClass: 'adm-mono', render: r => `${r.total_workshops} / ${r.max_workshops_limit}` },
                        {
                            key: 'month_workshops', label: 'Meta Oficinas (Mês)',
                            render: r => {
                                const pWs = pct(r.month_workshops, r.monthly_goal_workshops);
                                return `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span>${r.month_workshops} / ${r.monthly_goal_workshops}</span><strong>${pWs}%</strong></div><div class="adm-progress-track"><div class="adm-progress-fill" style="width:${pWs}%"></div></div>`;
                            }
                        },
                        {
                            key: 'month_paid_activations', label: 'Meta Ativações Pagas (Mês)',
                            render: r => {
                                const pAct = pct(r.month_paid_activations, r.monthly_goal_activations);
                                return `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span>${r.month_paid_activations} / ${r.monthly_goal_activations}</span><strong>${pAct}%</strong></div><div class="adm-progress-track"><div class="adm-progress-fill" style="width:${pAct}%"></div></div>`;
                            }
                        }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 4. OFICINAS CREDENCIADAS (FASE 4 — Redesign Completo ERP Corporativo)
    // --------------------------------------------------------------------------
    async renderWorkshops(ctx) {
        const f = ctx.params || {};
        const pageSize = Number(f.page_size || 25);
        const periodFilter = f.cred_period || 'ALL';
        const needsClientWindow = periodFilter !== 'ALL';

        const overviewPromise = typeof API.getAdminDashboardOverview === 'function'
            ? API.getAdminDashboardOverview({ period: 'all' }).catch(() => null)
            : Promise.resolve(null);

        const [data, overview] = await Promise.all([
            API.getAdminWorkshopsSummary({
                q: f.q || '',
                status: f.status || 'ALL',
                state: f.state || 'ALL',
                referral: f.referral || 'ALL',
                page: needsClientWindow ? 1 : (f.page || 1),
                page_size: needsClientWindow ? 200 : pageSize
            }),
            overviewPromise
        ]);

        if (overview) AdminView.updateLiveBadgesFromOverview(overview);

        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;
        const ovCards = (overview && overview.cards) || null;

        let items = data.items || [];
        if (needsClientWindow) {
            items = this.filterByCredenciamentoPeriod(items, periodFilter);
        }
        items = this.sortItems(items, f.sort_by || '', f.sort_dir || 'desc');

        const totalFiltered = needsClientWindow ? items.length : Number(data.total || 0);
        const curPage = Number(f.page || 1);
        const totalPages = needsClientWindow ? Math.max(1, Math.ceil(totalFiltered / pageSize)) : Number(data.total_pages || 1);
        const displayItems = needsClientWindow ? items.slice((curPage - 1) * pageSize, curPage * pageSize) : items;

        this.lastWorkshopsData = displayItems;

        const hasFilters = Boolean(f.q || (f.status && f.status !== 'ALL') || (f.state && f.state !== 'ALL') || (f.referral && f.referral !== 'ALL') || periodFilter !== 'ALL');

        return `
            ${UI.PageHeader({
                title: 'Oficinas Credenciadas',
                subtitle: 'Gerenciamento completo da rede de oficinas parceiras DNA AUTO.',
                updatedAt: AdminView.formatDateTime(data.generated_at),
                actionsHtml: `
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminScreensCore.exportWorkshopsCsv()">⬇ Exportar CSV</button>
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.reloadCurrentScreen()">↻ Atualizar Dados</button>
                `
            })}

            ${ovCards ? `
                <div class="adm-kpi-grid cols-6">
                    ${UI.KPIStatCard({
                        label: 'Total de Oficinas',
                        value: num(ovCards.total_workshops),
                        sub: `${num(overview.supplementary?.cities_covered || 0)} cidades`,
                        tone: 'tone-blue',
                        onClick: "AdminView.updateParams({ status: 'ALL', page: 1 })"
                    })}
                    ${UI.KPIStatCard({
                        label: 'Oficinas Ativas',
                        value: num(ovCards.active_workshops),
                        sub: 'Homologadas na rede',
                        tone: 'tone-success',
                        onClick: "AdminView.updateParams({ status: 'APPROVED', page: 1 })"
                    })}
                    ${UI.KPIStatCard({
                        label: 'Oficinas Pendentes',
                        value: num(ovCards.pending_workshops),
                        sub: ovCards.pending_workshops > 0 ? 'Aguardando aprovação' : 'Sem pendências',
                        tone: ovCards.pending_workshops > 0 ? 'tone-warning' : 'tone-success',
                        onClick: "AdminView.updateParams({ status: 'PENDING', page: 1 })"
                    })}
                    ${UI.KPIStatCard({
                        label: 'Clientes Vinculados',
                        value: num(ovCards.unique_clients),
                        sub: 'Base única da rede',
                        tone: 'tone-cyan',
                        onClick: "AdminView.navigate('clients')"
                    })}
                    ${UI.KPIStatCard({
                        label: 'Veículos Registrados',
                        value: num(ovCards.total_vehicles),
                        sub: `${num(ovCards.active_dna_vehicles)} com DNA ativo`,
                        tone: 'tone-blue',
                        onClick: "AdminView.navigate('vehicles')"
                    })}
                    ${UI.KPIStatCard({
                        label: 'Faturamento Atribuído',
                        value: brl(ovCards.monthly_confirmed_revenue_cents),
                        sub: 'Receita confirmada acumulada',
                        tone: 'tone-success',
                        isMoney: true,
                        onClick: "AdminView.navigate('revenue')"
                    })}
                </div>
            ` : ''}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="ws-filter-q" class="adm-input adm-filter-search" aria-label="Pesquisar oficina"
                           placeholder="Pesquisar por nome fantasia, razão social, CNPJ ou cidade..."
                           value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensCore.applyWorkshopFilters()" />
                    <select id="ws-filter-state" class="adm-select" aria-label="Filtrar por estado">
                        <option value="ALL">Estado: Todos</option>
                        ${(data.states_available || []).map(uf => `<option value="${esc(uf)}" ${f.state === uf ? 'selected' : ''}>UF: ${esc(uf)}</option>`).join('')}
                    </select>
                    <select id="ws-filter-status" class="adm-select" aria-label="Filtrar por status">
                        <option value="ALL" ${(!f.status || f.status === 'ALL') ? 'selected' : ''}>Status: Todos</option>
                        <option value="APPROVED" ${f.status === 'APPROVED' ? 'selected' : ''}>Aprovadas</option>
                        <option value="PENDING" ${f.status === 'PENDING' ? 'selected' : ''}>Pendentes</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensas</option>
                    </select>
                    <select id="ws-filter-referral" class="adm-select" aria-label="Filtrar por vínculo comercial">
                        <option value="ALL" ${(!f.referral || f.referral === 'ALL') ? 'selected' : ''}>Vínculo: Todos</option>
                        <option value="LINKED" ${f.referral === 'LINKED' ? 'selected' : ''}>Indicadas por Representante</option>
                        <option value="DIRECT" ${f.referral === 'DIRECT' ? 'selected' : ''}>Diretas (sem representante)</option>
                    </select>
                    <select id="ws-filter-period" class="adm-select" aria-label="Filtrar por período de credenciamento">
                        <option value="ALL" ${periodFilter === 'ALL' ? 'selected' : ''}>Credenciamento: Todos</option>
                        <option value="7d" ${periodFilter === '7d' ? 'selected' : ''}>Últimos 7 dias</option>
                        <option value="30d" ${periodFilter === '30d' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="90d" ${periodFilter === '90d' ? 'selected' : ''}>Últimos 90 dias</option>
                        <option value="365d" ${periodFilter === '365d' ? 'selected' : ''}>Últimos 12 meses</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensCore.applyWorkshopFilters()">Aplicar Filtros</button>
                    <button type="button" class="adm-btn ${hasFilters ? '' : 'adm-btn-ghost'}" onclick="AdminView.navigate('workshops')">Limpar Filtros</button>
                `, { ariaLabel: 'Filtros de oficinas credenciadas' })}

                ${UI.EnterpriseDataTable({
                    testId: 'workshops-table',
                    rows: displayItems,
                    sortBy: f.sort_by || '',
                    sortDir: f.sort_dir || 'desc',
                    onSortExpr: (field, dir) => `AdminView.updateParams({ sort_by: '${field}', sort_dir: '${dir}' })`,
                    emptyTitle: 'Nenhuma oficina encontrada',
                    emptySubtitle: hasFilters
                        ? 'Nenhuma oficina corresponde aos filtros selecionados. Limpe os filtros para visualizar toda a rede.'
                        : 'Aguardando novos credenciamentos de oficinas parceiras.',
                    emptyActionHtml: hasFilters ? `<button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.navigate('workshops')">Limpar Filtros</button>` : '',
                    pagination: {
                        page: curPage,
                        totalPages,
                        total: totalFiltered,
                        pageSize
                    },
                    columns: [
                        {
                            key: 'trade_name', label: 'Oficina / CNPJ', sortable: true,
                            render: w => `
                                <a href="javascript:void(0)" class="adm-link" title="${esc(w.company_name || w.trade_name)}" onclick="AdminView.openWorkshop('${esc(w.id)}')">${esc(w.trade_name)}</a>
                                <div class="adm-cell-sub adm-mono">${esc(w.cnpj || 'CNPJ não informado')}</div>
                            `
                        },
                        {
                            key: 'city', label: 'Cidade / UF', sortable: true,
                            render: w => `<span title="${esc(w.city || '-')}/${esc(w.state || '-')}">${esc(w.city || '-')}/${esc(w.state || '-')}</span>`
                        },
                        {
                            key: 'phone', label: 'Telefone', tdClass: 'adm-mono',
                            render: w => esc(w.phone || '-')
                        },
                        {
                            key: 'created_at', label: 'Credenciamento', sortable: true, tdClass: 'adm-mono',
                            render: w => esc(AdminView.formatDate(w.created_at))
                        },
                        {
                            key: 'status', label: 'Status', sortable: true,
                            render: w => AdminView.statusBadge(w.status)
                        },
                        {
                            key: 'representative_name', label: 'Representante',
                            render: w => w.rep_code ? `
                                <a href="javascript:void(0)" class="adm-link adm-mono" title="Validade do vínculo: ${esc(AdminView.formatDate(w.referral_linked_at))} até ${esc(AdminView.formatDate(w.referral_valid_until))}" onclick="AdminView.openRepresentative('${esc(w.representative_id)}')">${esc(w.rep_code)}</a>
                                <div class="adm-cell-sub">${esc(w.representative_name || '')}</div>
                            ` : `<span class="adm-badge adm-badge-muted"><span class="adm-badge-dot" aria-hidden="true"></span>Direta</span>`
                        },
                        {
                            key: 'unique_clients_count', label: 'Clientes Únicos', align: 'right', sortable: true, tdClass: 'adm-num',
                            render: w => num(w.unique_clients_count)
                        },
                        {
                            key: 'vehicles_count', label: 'Veículos', align: 'right', sortable: true, tdClass: 'adm-num',
                            render: w => `<span>${num(w.vehicles_count)}</span><div class="adm-cell-sub">${num(w.active_dna_count)} DNA</div>`
                        },
                        {
                            key: 'paid_registrations_count', label: 'Pagos / Pend.', align: 'right', sortable: true, tdClass: 'adm-mono',
                            render: w => `<span class="adm-text-success" style="font-weight:700;">${num(w.paid_registrations_count)}</span> <span class="adm-text-muted">/</span> <span class="adm-text-warning" style="font-weight:600;">${num(w.pending_registrations_count)}</span>`
                        },
                        {
                            key: 'attributed_revenue_cents', label: 'Fat. Atribuído', align: 'right', sortable: true, tdClass: 'adm-money',
                            render: w => brl(w.attributed_revenue_cents)
                        },
                        {
                            key: 'rep_commissions_generated_cents', label: 'Comissões', align: 'right', sortable: true, tdClass: 'adm-money adm-text-accent',
                            render: w => brl(w.rep_commissions_generated_cents)
                        },
                        {
                            key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                            render: w => {
                                const menuId = `ws-menu-${esc(w.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
                                return `
                                    <div class="adm-actions-group">
                                        <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.openWorkshop('${esc(w.id)}')">Abrir</button>
                                        ${w.status !== 'APPROVED'
                                            ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED', '${esc(w.trade_name)}')">Aprovar</button>`
                                            : `<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED', '${esc(w.trade_name)}')">Suspender</button>`}
                                        <div class="adm-action-menu-wrap">
                                            <button type="button" class="adm-btn adm-btn-sm" style="padding:0 9px;" aria-label="Mais ações para ${esc(w.trade_name)}" title="Mais ações" onclick="AdminView.toggleActionMenu('${menuId}', event)">⋮</button>
                                            <div id="${menuId}" class="adm-action-menu-dropdown" style="display:none;" role="menu">
                                                <button type="button" class="adm-action-menu-item" role="menuitem" onclick="AdminView.closeAllPopovers(); AdminScreensCore.openWorkshopQuickDrawer('${esc(w.id)}')">Resumo Rápido (Gaveta)</button>
                                                <button type="button" class="adm-action-menu-item" role="menuitem" onclick="AdminView.closeAllPopovers(); AdminView.openWorkshop('${esc(w.id)}', 'clients')">Ver Clientes Vinculados</button>
                                                <button type="button" class="adm-action-menu-item" role="menuitem" onclick="AdminView.closeAllPopovers(); AdminView.openWorkshop('${esc(w.id)}', 'vehicles')">Ver Veículos Registrados</button>
                                                <button type="button" class="adm-action-menu-item" role="menuitem" onclick="AdminView.closeAllPopovers(); AdminView.openWorkshop('${esc(w.id)}', 'attendances')">Ver Atendimentos (OS)</button>
                                                <button type="button" class="adm-action-menu-item" role="menuitem" onclick="AdminView.closeAllPopovers(); AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(w.rep_code || 'Nenhum')}')">Reatribuir Representante</button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }
                    ]
                })}
            </div>
        `;
    },

    applyWorkshopFilters() {
        AdminView.updateParams({
            q: document.getElementById('ws-filter-q')?.value || '',
            state: document.getElementById('ws-filter-state')?.value || 'ALL',
            status: document.getElementById('ws-filter-status')?.value || 'ALL',
            referral: document.getElementById('ws-filter-referral')?.value || 'ALL',
            cred_period: document.getElementById('ws-filter-period')?.value || 'ALL',
            page: 1
        });
    },

    exportWorkshopsCsv() {
        const rows = this.lastWorkshopsData || [];
        if (rows.length === 0) {
            AdminView.toast('Não há oficinas listadas para exportar no filtro atual.', 'error');
            return;
        }
        const headers = [
            'Oficina', 'RazaoSocial', 'CNPJ', 'Cidade', 'UF', 'Telefone', 'Credenciamento', 'Status',
            'RepresentanteCodigo', 'RepresentanteNome', 'ClientesUnicos', 'Veiculos', 'DnaAtivo',
            'Pagos', 'Pendentes', 'FaturamentoAtribuidoBRL', 'ComissoesRepBRL'
        ];
        const fmt = c => (Number(c || 0) / 100).toFixed(2).replace('.', ',');
        const csvLines = [
            headers.join(';'),
            ...rows.map(w => [
                w.trade_name || '', w.company_name || '', w.cnpj || '', w.city || '', w.state || '',
                w.phone || '', AdminView.formatDate(w.created_at), w.status || '',
                w.rep_code || 'DIRETA', w.representative_name || '',
                w.unique_clients_count || 0, w.vehicles_count || 0, w.active_dna_count || 0,
                w.paid_registrations_count || 0, w.pending_registrations_count || 0,
                fmt(w.attributed_revenue_cents), fmt(w.rep_commissions_generated_cents)
            ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
        ];
        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dna-auto-oficinas-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        AdminView.toast(`Exportação CSV concluída (${rows.length} oficina(s)).`);
    },

    async openWorkshopQuickDrawer(workshopId) {
        AdminView.openDetailDrawer({
            title: 'Carregando oficina...',
            subtitle: 'Consultando indicadores reais na API DNA AUTO',
            bodyHtml: AdminView.ui().LoadingSkeleton('Carregando detalhes da oficina...')
        });
        try {
            const data = await API.getAdminWorkshopPerformance(workshopId);
            const w = data.workshop || {};
            const m = data.metrics || {};
            const ref = data.referral;
            const esc = AdminView.esc;
            const brl = AdminView.formatBrl;
            const UI = AdminView.ui();

            AdminView.openDetailDrawer({
                title: w.trade_name || 'Oficina',
                subtitle: `${w.city || '-'}/${w.state || '-'} • CNPJ: ${w.cnpj || '-'}`,
                bodyHtml: `
                    <div style="margin-bottom:14px;">${AdminView.statusBadge(w.status)}</div>
                    <div class="adm-kpi-grid cols-2">
                        ${UI.KPIStatCard({ label: 'Clientes Únicos', value: AdminView.formatNum(m.unique_clients_count), tone: 'tone-cyan' })}
                        ${UI.KPIStatCard({ label: 'Veículos / DNA', value: `${m.vehicles_count || 0} (${m.active_dna_count || 0})`, tone: 'tone-blue' })}
                        ${UI.KPIStatCard({ label: 'Faturamento Atribuído', value: brl(m.attributed_revenue_cents), tone: 'tone-success', isMoney: true })}
                        ${UI.KPIStatCard({ label: 'OS Realizadas', value: AdminView.formatNum(m.service_orders_count), sub: brl(m.mechanical_volume_cents), tone: 'tone-gold' })}
                    </div>
                    <div class="adm-chain-box">
                        <div style="font-weight:700; margin-bottom:6px;">Dados Cadastrais</div>
                        <div><strong>Razão Social:</strong> ${esc(w.company_name || '-')}</div>
                        <div><strong>Telefone:</strong> <span class="adm-mono">${esc(w.phone || '-')}</span></div>
                        <div><strong>E-mail:</strong> ${esc(w.email || '-')}</div>
                        <div><strong>Credenciamento:</strong> ${esc(AdminView.formatDate(w.created_at))}</div>
                    </div>
                    <div class="adm-chain-box">
                        <div style="font-weight:700; margin-bottom:6px;">Vínculo Comercial</div>
                        ${ref
                            ? `<div><strong>Representante:</strong> <span class="adm-mono adm-text-accent">${esc(ref.rep_code)}</span> — ${esc(ref.representative_name)}</div>
                               <div><strong>Vigência:</strong> ${esc(AdminView.formatDate(ref.linked_at))} até ${esc(AdminView.formatDate(ref.valid_until))}</div>`
                            : `<div>Oficina cadastrada diretamente (sem representante vinculado).</div>`}
                    </div>
                `,
                footerHtml: `
                    <button type="button" class="adm-btn" onclick="AdminView.closeDetailDrawer()">Fechar</button>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.closeDetailDrawer(); AdminView.openWorkshop('${esc(w.id)}')">Abrir Detalhamento Completo →</button>
                `
            });
        } catch (err) {
            AdminView.openDetailDrawer({
                title: 'Erro ao consultar oficina',
                bodyHtml: AdminView.ui().ErrorState({ title: 'Falha ao consultar dados atualizados da API', message: err.message })
            });
        }
    },

    // --------------------------------------------------------------------------
    // 4B. DETALHAMENTO COMPLETO DA OFICINA (7 Abas Empresariais)
    // Abas: Resumo | Clientes | Veículos | Atendimentos | Financeiro | Representante | Auditoria
    // --------------------------------------------------------------------------
    async renderWorkshopDetail(ctx) {
        const workshopId = ctx.params?.id;
        if (!workshopId) return this.renderWorkshops(ctx);

        const activeTab = ctx.params?.subtab || 'summary';
        const data = await API.getAdminWorkshopPerformance(workshopId);
        const w = data.workshop || {};
        const m = data.metrics || {};
        const ref = data.referral;
        const staff = data.staff || [];
        const uniqueClients = data.unique_clients || [];
        const vehicles = data.vehicles || [];
        const pixCharges = data.pix_charges || [];
        const repComms = data.representative_commissions || [];
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        const tabs = [
            { id: 'summary', label: 'Resumo' },
            { id: 'clients', label: `Clientes (${uniqueClients.length})` },
            { id: 'vehicles', label: `Veículos (${vehicles.length})` },
            { id: 'attendances', label: `Atendimentos (${m.service_orders_count || 0})` },
            { id: 'financial', label: `Financeiro (${pixCharges.length})` },
            { id: 'representative', label: 'Representante' },
            { id: 'audit', label: 'Auditoria' }
        ];

        const renderClientsTable = (list) => UI.EnterpriseDataTable({
            rows: list,
            emptyTitle: 'Nenhum cliente vinculado',
            emptySubtitle: 'Esta oficina ainda não cadastrou ou atendeu clientes.',
            columns: [
                { key: 'name', label: 'Cliente', render: cl => `<span class="adm-cell-title">${esc(cl.name)}</span>` },
                { key: 'email', label: 'Contato', render: cl => `<div>${esc(cl.email || '-')}</div><div class="adm-cell-sub adm-mono">${esc(cl.phone || '-')}</div>` },
                { key: 'vehicles_count', label: 'Qtd. Veículos', align: 'right', tdClass: 'adm-num adm-text-accent', render: cl => num(cl.vehicles_count) },
                {
                    key: 'vehicles', label: 'Veículos / Placas / DNA',
                    render: cl => (cl.vehicles || []).map(v => `
                        <span class="adm-badge adm-badge-info" style="margin:2px; cursor:pointer;" title="Abrir Dossiê de ${esc(v.license_plate)}" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">
                            ${esc(v.license_plate)} (${esc(v.brand || '')} ${esc(v.model || '')})${v.dna_code ? ` • ${esc(v.dna_code)}` : ''}
                        </span>
                    `).join('')
                },
                { key: 'services_count', label: 'OS Realizadas', align: 'right', tdClass: 'adm-num', render: cl => num(cl.services_count) },
                { key: 'services_total_cents', label: 'Volume Serviços', align: 'right', tdClass: 'adm-money', render: cl => brl(cl.services_total_cents) }
            ]
        });

        let tabContent = '';

        if (activeTab === 'summary') {
            tabContent = `
                <div class="adm-chain-box">
                    <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--adm-text-secondary); margin-bottom:10px;">Cadeia Comercial e Operacional Auditável</div>
                    <div class="adm-chain-flow">
                        <span class="adm-chain-step"><strong>Representante:</strong> ${ref ? `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openRepresentative('${esc(ref.representative_id)}')">${esc(ref.rep_code)} — ${esc(ref.representative_name)}</a>` : 'Cadastro Direto'}</span>
                        <span class="adm-chain-arrow" aria-hidden="true">→</span>
                        <span class="adm-chain-step"><strong>Oficina:</strong> ${esc(w.trade_name)} ${ref ? `(Validade: ${esc(AdminView.formatDate(ref.valid_until))})` : ''}</span>
                        <span class="adm-chain-arrow" aria-hidden="true">→</span>
                        <span class="adm-chain-step"><strong>Clientes Únicos:</strong> ${num(m.unique_clients_count)} (${num(m.vehicles_count)} veículos)</span>
                        <span class="adm-chain-arrow" aria-hidden="true">→</span>
                        <span class="adm-chain-step"><strong>Pagos:</strong> ${num(m.paid_registrations_count)} (${brl(m.attributed_revenue_cents)})</span>
                        <span class="adm-chain-arrow" aria-hidden="true">→</span>
                        <span class="adm-chain-step"><strong>Comissão Rep.:</strong> ${brl(m.rep_commissions_confirmed_cents)} conf.</span>
                    </div>
                </div>

                <div class="adm-kpi-grid">
                    ${UI.KPIStatCard({ label: 'Clientes Únicos', value: num(m.unique_clients_count), sub: 'Desduplicados por conta/e-mail/tel', tone: 'tone-cyan', onClick: `AdminView.updateParams({ subtab: 'clients' })` })}
                    ${UI.KPIStatCard({ label: 'Veículos Cadastrados', value: num(m.vehicles_count), sub: `${num(m.active_dna_count)} com DNA ativo`, tone: 'tone-blue', onClick: `AdminView.updateParams({ subtab: 'vehicles' })` })}
                    ${UI.FinancialMetric({ label: 'Faturamento Atribuído', cents: m.attributed_revenue_cents, classification: 'Confirmado', sub: `${num(m.paid_registrations_count)} pago(s) • ${num(m.pending_registrations_count)} pendente(s)`, tone: 'tone-success', onClick: `AdminView.updateParams({ subtab: 'financial' })` })}
                    ${UI.KPIStatCard({ label: 'Atendimentos (OS / Agenda)', value: num(m.service_orders_count), sub: `${num(m.appointments_count)} agendamentos • OS: ${brl(m.mechanical_volume_cents)}`, tone: 'tone-gold', onClick: `AdminView.updateParams({ subtab: 'attendances' })` })}
                </div>

                <div class="adm-charts-grid">
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Informações Cadastrais</h3></div>
                        <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; font-size:13.5px;">
                            <div><span class="adm-text-muted">Nome Fantasia</span><div style="font-weight:600;">${esc(w.trade_name || '-')}</div></div>
                            <div><span class="adm-text-muted">Razão Social</span><div style="font-weight:600;">${esc(w.company_name || '-')}</div></div>
                            <div><span class="adm-text-muted">CNPJ</span><div class="adm-mono" style="font-weight:600;">${esc(w.cnpj || '-')}</div></div>
                            <div><span class="adm-text-muted">Credenciamento</span><div class="adm-mono">${esc(AdminView.formatDateTime(w.created_at))}</div></div>
                            <div><span class="adm-text-muted">Cidade / UF</span><div>${esc(w.city || '-')}/${esc(w.state || '-')}</div></div>
                            <div><span class="adm-text-muted">Telefone</span><div class="adm-mono">${esc(w.phone || '-')}</div></div>
                            <div><span class="adm-text-muted">E-mail</span><div>${esc(w.email || '-')}</div></div>
                            <div><span class="adm-text-muted">WhatsApp Oficial</span><div class="adm-mono">${esc(w.whatsapp_official || w.phone || '-')}</div></div>
                        </div>
                    </div>

                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Equipe da Oficina (${staff.length})</h3></div>
                        ${UI.EnterpriseDataTable({
                            rows: staff,
                            emptyTitle: 'Nenhum usuário operacional vinculado',
                            emptySubtitle: 'Os usuários administrativos e mecânicos vinculados à oficina aparecem aqui.',
                            columns: [
                                { key: 'name', label: 'Colaborador', render: u => `<span class="adm-cell-title">${esc(u.name)}</span><div class="adm-cell-sub">${esc(u.email)}</div>` },
                                { key: 'position_title', label: 'Função', render: u => esc(u.position_title || u.role_code || '-') },
                                { key: 'status', label: 'Status', render: u => AdminView.statusBadge(u.status) }
                            ]
                        })}
                    </div>
                </div>

                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Clientes Únicos Vinculados (${uniqueClients.length})</h3>
                            <p class="adm-card-subtitle">Resumo operacional dos clientes e veículos efetivamente atendidos por esta oficina</p>
                        </div>
                        ${uniqueClients.length > 0 ? `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ subtab: 'clients' })">Ver Aba Clientes →</button>` : ''}
                    </div>
                    ${renderClientsTable(uniqueClients.slice(0, 10))}
                </div>
            `;
        } else if (activeTab === 'clients') {
            tabContent = `
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Clientes Efetivamente Vinculados à Oficina (${uniqueClients.length})</h3>
                            <p class="adm-card-subtitle">Clientes com múltiplos veículos aparecem consolidados em um único registro</p>
                        </div>
                    </div>
                    ${renderClientsTable(uniqueClients)}
                </div>
            `;
        } else if (activeTab === 'vehicles') {
            tabContent = `
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Veículos Atendidos e Cadastrados (${vehicles.length})</h3>
                            <p class="adm-card-subtitle">Relação real de veículos com DNA ativado ou histórico de serviço nesta oficina</p>
                        </div>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: vehicles,
                        emptyTitle: 'Nenhum veículo vinculado',
                        emptySubtitle: 'Ainda não há veículos registrados ou atendidos por esta oficina.',
                        columns: [
                            { key: 'license_plate', label: 'Placa', tdClass: 'adm-mono', render: v => `<strong>${esc(v.license_plate)}</strong>` },
                            { key: 'brand', label: 'Veículo', render: v => `<span class="adm-cell-title">${esc(v.brand || '')} ${esc(v.model || '')}</span><div class="adm-cell-sub">${esc(v.model_year || '-')} • ${esc(v.color || '-')}</div>` },
                            { key: 'dna_code', label: 'Código DNA', render: v => v.dna_code ? `<span class="adm-badge adm-badge-success"><span class="adm-badge-dot" aria-hidden="true"></span>${esc(v.dna_code)}</span>` : `<span class="adm-badge adm-badge-muted">Sem DNA</span>` },
                            { key: 'owner_name', label: 'Proprietário', render: v => `<div>${esc(v.owner_name || '-')}</div><div class="adm-cell-sub adm-mono">${esc(v.owner_phone || v.owner_email || '')}</div>` },
                            { key: 'last_mileage', label: 'Último KM', align: 'right', tdClass: 'adm-mono', render: v => v.last_mileage ? `${num(v.last_mileage)} km` : '-' },
                            { key: 'services_count', label: 'OS / Total', align: 'right', tdClass: 'adm-mono', render: v => `${num(v.services_count)} • ${brl(v.services_total_cents)}` },
                            { key: 'latest_pix_status', label: 'PIX', render: v => v.latest_pix_status ? AdminView.statusBadge(v.latest_pix_status) : '<span class="adm-text-muted">-</span>' },
                            { key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell', render: v => `<button type="button" class="adm-btn adm-btn-sm" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">Dossiê →</button>` }
                        ]
                    })}
                </div>
            `;
        } else if (activeTab === 'attendances') {
            const osData = await API.getAdminServiceOrders({ workshop_id: workshopId, page: 1, page_size: 50 }).catch(() => ({ items: [], total: 0 }));
            const osItems = osData.items || [];
            tabContent = `
                <div class="adm-kpi-grid cols-4">
                    ${UI.KPIStatCard({ label: 'Ordens de Serviço', value: num(m.service_orders_count), tone: 'tone-blue' })}
                    ${UI.KPIStatCard({ label: 'Serviços Comprovados (N4)', value: num(m.proven_services_count), tone: 'tone-success' })}
                    ${UI.KPIStatCard({ label: 'Agendamentos Registrados', value: num(m.appointments_count), tone: 'tone-cyan' })}
                    ${UI.FinancialMetric({ label: 'Volume Mecânico OS', cents: m.mechanical_volume_cents, classification: 'Registrado', tone: 'tone-gold' })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Histórico de Atendimentos da Oficina (${osItems.length})</h3>
                            <p class="adm-card-subtitle">Registros reais de serviços lançados no sistema para esta oficina</p>
                        </div>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: osItems,
                        emptyTitle: 'Nenhum atendimento registrado',
                        emptySubtitle: 'Esta oficina ainda não possui ordens de serviço lançadas.',
                        columns: [
                            { key: 'service_date', label: 'Data', tdClass: 'adm-mono', render: s => esc(AdminView.formatDate(s.service_date || s.created_at)) },
                            { key: 'license_plate', label: 'Placa / Veículo', render: s => `<a href="javascript:void(0)" class="adm-link adm-mono" onclick="App.switchView('dossier', '${esc(s.license_plate)}')">${esc(s.license_plate)}</a><div class="adm-cell-sub">${esc(s.brand || '')} ${esc(s.model || '')}</div>` },
                            { key: 'service_title', label: 'Serviço / Categoria', render: s => `<span class="adm-cell-title">${esc(s.service_title || '-')}</span><div class="adm-cell-sub">${esc(s.category || '')}</div>` },
                            { key: 'mileage', label: 'KM', align: 'right', tdClass: 'adm-mono', render: s => s.mileage ? `${num(s.mileage)} km` : '-' },
                            { key: 'proof_level', label: 'Comprovação', render: s => AdminView.proofBadge(s.proof_level) },
                            { key: 'total_cost_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: s => brl(s.total_cost_cents) }
                        ]
                    })}
                </div>
            `;
        } else if (activeTab === 'financial') {
            tabContent = `
                <div class="adm-kpi-grid cols-4">
                    ${UI.FinancialMetric({ label: 'Faturamento Atribuído', cents: m.attributed_revenue_cents, classification: 'Confirmado', sub: `${num(m.paid_registrations_count)} pago(s)`, tone: 'tone-success' })}
                    ${UI.FinancialMetric({ label: 'Parcela Oficina (Repasse)', cents: m.workshop_share_cents, classification: 'Repasse', tone: 'tone-cyan' })}
                    ${UI.FinancialMetric({ label: 'Comissões Rep. Confirmadas', cents: m.rep_commissions_confirmed_cents, classification: 'Confirmado', sub: `Projetadas: ${brl(m.rep_commissions_projected_cents)}`, tone: 'tone-gold' })}
                    ${UI.FinancialMetric({ label: 'Taxas por Atendimento', cents: m.attendance_fees_cents, classification: 'Cobrança', sub: `${num(m.attendance_fees_count)} registro(s)`, tone: 'tone-blue' })}
                </div>
                <div class="adm-charts-grid">
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Cobranças PIX da Oficina (${pixCharges.length})</h3></div>
                        ${UI.EnterpriseDataTable({
                            rows: pixCharges.slice(0, 25),
                            emptyTitle: 'Sem cobranças PIX',
                            emptySubtitle: 'Nenhuma cobrança gerada por esta oficina.',
                            columns: [
                                { key: 'created_at', label: 'Data', tdClass: 'adm-mono', render: p => esc(AdminView.formatDate(p.paid_at || p.created_at)) },
                                { key: 'charge_type', label: 'Tipo', render: p => esc(p.charge_type) },
                                { key: 'activation_code', label: 'Código', tdClass: 'adm-mono', render: p => esc(p.activation_code || p.id) },
                                { key: 'customer_price_cents', label: 'Valor Cliente', align: 'right', tdClass: 'adm-money', render: p => brl(p.customer_price_cents) },
                                { key: 'status', label: 'Status', render: p => AdminView.statusBadge(p.status) }
                            ]
                        })}
                    </div>

                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Comissões de Representante Geradas (${repComms.length})</h3></div>
                        ${UI.EnterpriseDataTable({
                            rows: repComms.slice(0, 25),
                            emptyTitle: 'Sem comissões',
                            emptySubtitle: 'Nenhuma comissão vinculada a esta oficina.',
                            columns: [
                                { key: 'competence_month', label: 'Competência', tdClass: 'adm-mono', render: rc => esc(rc.competence_month || '-') },
                                { key: 'rep_code', label: 'Representante', render: rc => `<span class="adm-mono adm-text-accent" style="font-weight:700;">${esc(rc.rep_code)}</span> ${esc(rc.rep_name)}` },
                                { key: 'commission_amount_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: rc => brl(rc.commission_amount_cents) },
                                { key: 'status', label: 'Status', render: rc => AdminView.statusBadge(rc.status) }
                            ]
                        })}
                    </div>
                </div>
            `;
        } else if (activeTab === 'representative') {
            tabContent = ref ? `
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Representante Comercial Responsável</h3>
                            <p class="adm-card-subtitle">Vínculo contratual vigente de captação comercial desta oficina</p>
                        </div>
                        <div class="adm-header-actions">
                            <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.openRepresentative('${esc(ref.representative_id)}')">Abrir Ficha do Representante →</button>
                            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(ref.rep_code)}')">Reatribuir Vínculo</button>
                        </div>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-chain-box">
                            <div><strong>Código:</strong> <span class="adm-mono adm-text-accent">${esc(ref.rep_code)}</span></div>
                            <div><strong>Nome:</strong> ${esc(ref.representative_name)}</div>
                            <div><strong>Status do Representante:</strong> ${AdminView.statusBadge(ref.representative_status)}</div>
                            <div><strong>Canal de Origem:</strong> ${esc(ref.origin_channel || '-')}</div>
                        </div>
                        <div class="adm-chain-box">
                            <div><strong>E-mail:</strong> ${esc(ref.representative_email || '-')}</div>
                            <div><strong>Telefone:</strong> <span class="adm-mono">${esc(ref.representative_phone || '-')}</span></div>
                            <div><strong>Início do Vínculo:</strong> <span class="adm-mono">${esc(AdminView.formatDate(ref.linked_at))}</span></div>
                            <div><strong>Validade Contratual (24m):</strong> <span class="adm-mono">${esc(AdminView.formatDate(ref.valid_until))}</span></div>
                        </div>
                    </div>
                    ${ref.justification ? `<div class="adm-chain-box"><strong>Justificativa / Histórico do Vínculo:</strong> ${esc(ref.justification)}</div>` : ''}
                </div>
            ` : `
                <div class="adm-card">
                    ${UI.EmptyState({
                        title: 'Oficina sem representante comercial vinculado',
                        subtitle: 'Esta oficina realizou cadastro direto na plataforma DNA AUTO. Caso aplicável, vincule um representante comercial com justificativa auditada.',
                        actionHtml: `<button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', 'Nenhum')">Vincular Representante</button>`
                    })}
                </div>
            `;
        } else {
            // Aba Auditoria — consulta eventos reais e filtra pela oficina atual
            const [finAud, sysAud] = await Promise.all([
                typeof API.getAdminFinancialAudit === 'function' ? API.getAdminFinancialAudit({ limit: 150 }).catch(() => ({})) : Promise.resolve({}),
                typeof API.getAuditLogs === 'function' ? API.getAuditLogs({ limit: 150 }).catch(() => ({})) : Promise.resolve({})
            ]);
            const wsRepLogs = (finAud.representative_audit || []).filter(l => l.workshop_id === workshopId);
            const wsSysLogs = (sysAud.logs || []).filter(l => l.entity_id === workshopId || String(l.data_after_json || '').includes(workshopId));
            const combined = [
                ...wsRepLogs.map(l => ({
                    created_at: l.created_at,
                    action: l.action,
                    actor: `${l.actor_role || 'ADMIN'} (${l.actor_id || '-'})`,
                    details: l.justification || '-'
                })),
                ...wsSysLogs.map(l => ({
                    created_at: l.created_at,
                    action: l.action,
                    actor: l.user_name || l.user_id || 'Sistema',
                    details: l.data_after_json || l.entity_type || '-'
                }))
            ].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

            tabContent = `
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Trilha de Auditoria da Oficina (${combined.length})</h3>
                            <p class="adm-card-subtitle">Aprovações, suspensões, alterações de vínculo comercial e eventos financeiros registrados</p>
                        </div>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: combined,
                        emptyTitle: 'Sem eventos de auditoria específicos',
                        emptySubtitle: 'Nenhuma alteração auditada registrada recentemente para esta oficina.',
                        columns: [
                            { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: l => esc(AdminView.formatDateTime(l.created_at)) },
                            { key: 'action', label: 'Evento / Ação', render: l => `<span class="adm-badge adm-badge-info">${esc(l.action)}</span>` },
                            { key: 'actor', label: 'Responsável', tdClass: 'adm-mono', render: l => esc(l.actor) },
                            { key: 'details', label: 'Detalhes / Justificativa', render: l => `<div class="adm-truncate" title="${esc(l.details)}">${esc(l.details)}</div>` }
                        ]
                    })}
                </div>
            `;
        }

        return `
            ${UI.PageHeader({
                title: w.trade_name || 'Detalhamento da Oficina',
                badgeHtml: AdminView.statusBadge(w.status),
                subtitle: `${esc(w.company_name || '')} • CNPJ: <span class="adm-mono">${esc(w.cnpj || '-')}</span> • ${esc(w.city || '-')}/${esc(w.state || '-')} • Tel: <span class="adm-mono">${esc(w.phone || '-')}</span>`,
                backAction: "AdminView.navigate('workshops')",
                backLabel: 'Voltar para Oficinas Credenciadas',
                actionsHtml: `
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(ref ? ref.rep_code : 'Nenhum')}')">Reatribuir Representante</button>
                    ${w.status !== 'APPROVED'
                        ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'APPROVED', '${esc(w.trade_name)}')">Aprovar Oficina</button>`
                        : `<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.changeWorkshopStatus('${esc(w.id)}', 'SUSPENDED', '${esc(w.trade_name)}')">Suspender Oficina</button>`}
                `
            })}

            <div class="adm-subtabs" role="tablist" aria-label="Seções da oficina">
                ${tabs.map(t => `
                    <button type="button"
                            role="tab"
                            aria-selected="${activeTab === t.id}"
                            class="adm-subtab ${activeTab === t.id ? 'active' : ''}"
                            onclick="AdminView.updateParams({ subtab: '${t.id}' })">
                        ${esc(t.label)}
                    </button>
                `).join('')}
            </div>

            ${tabContent}
        `;
    },

    // --------------------------------------------------------------------------
    // 5. CLIENTES CADASTRADOS (CLIENTES ÚNICOS)
    // --------------------------------------------------------------------------
    async renderClients(ctx) {
        const f = ctx.params || {};
        const pageSize = Number(f.page_size || 25);
        const data = await API.getAdminUniqueClients({
            q: f.q || '',
            workshop_id: f.workshop_id || 'all',
            page: f.page || 1,
            page_size: pageSize
        });
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;
        const items = this.sortItems(data.items || [], f.sort_by || '', f.sort_dir || 'desc');

        return `
            ${UI.PageHeader({
                title: `Clientes Cadastrados (${num(data.total)})`,
                subtitle: 'Proprietários desduplicados da rede DNA AUTO. Um cliente com múltiplos veículos é contabilizado uma única vez.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="cli-filter-q" class="adm-input adm-filter-search" aria-label="Buscar cliente"
                           placeholder="Buscar por nome, e-mail, telefone, placa ou código DNA..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.updateParams({ q: document.getElementById('cli-filter-q')?.value || '', page: 1 })">Aplicar Filtros</button>
                    ${f.q ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('clients')">Limpar</button>` : ''}
                `)}

                ${UI.EnterpriseDataTable({
                    rows: items,
                    sortBy: f.sort_by || '',
                    sortDir: f.sort_dir || 'desc',
                    onSortExpr: (field, dir) => `AdminView.updateParams({ sort_by: '${field}', sort_dir: '${dir}' })`,
                    emptyTitle: 'Nenhum cliente encontrado',
                    emptySubtitle: 'Não há clientes cadastrados para os filtros informados.',
                    pagination: { page: data.page, totalPages: data.total_pages, total: data.total, pageSize },
                    columns: [
                        { key: 'name', label: 'Cliente / CPF', sortable: true, render: c => `<span class="adm-cell-title">${esc(c.name)}</span><div class="adm-cell-sub adm-mono">${esc(c.cpf_masked)}</div>` },
                        { key: 'email', label: 'Contato', render: c => `<div>${esc(c.email || '-')}</div><div class="adm-cell-sub adm-mono">${esc(c.phone || '-')}</div>` },
                        { key: 'preferred_workshop_name', label: 'Oficina Principal', sortable: true, render: c => esc(c.preferred_workshop_name || '-') },
                        { key: 'vehicles_count', label: 'Veículos', align: 'right', sortable: true, tdClass: 'adm-num adm-text-accent', render: c => num(c.vehicles_count) },
                        {
                            key: 'vehicles', label: 'Frota (Placa / DNA)',
                            render: c => (c.vehicles || []).length === 0
                                ? '<span class="adm-text-muted">Sem veículo</span>'
                                : c.vehicles.map(v => `<span class="adm-badge adm-badge-info" style="margin:2px; cursor:pointer;" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">${esc(v.license_plate)}${v.dna_code ? ` • ${esc(v.dna_code)}` : ''}</span>`).join('')
                        },
                        { key: 'services_count', label: 'OS', align: 'right', sortable: true, tdClass: 'adm-num', render: c => num(c.services_count) },
                        { key: 'total_spent_cents', label: 'Volume Serviços', align: 'right', sortable: true, tdClass: 'adm-money', render: c => brl(c.total_spent_cents) },
                        { key: 'status', label: 'Status', render: c => AdminView.statusBadge(c.status) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. VEÍCULOS REGISTRADOS E DNA
    // --------------------------------------------------------------------------
    async renderVehicles(ctx) {
        const f = ctx.params || {};
        const qs = API._qs({ q: f.q || '', dna_status: f.dna_status || '', workshop_id: f.workshop_id || 'all', page_size: 100 });
        const data = await API.request(`/admin/fleet${qs}`);
        const UI = AdminView.ui();
        const vehicles = this.sortItems(data.vehicles || [], f.sort_by || '', f.sort_dir || 'desc');
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: `Veículos Registrados (${num(vehicles.length)})`,
                subtitle: 'Frota completa sincronizada entre App Cliente e App Oficina com código DNA permanente e acesso ao Dossiê.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="veh-filter-q" class="adm-input adm-filter-search" aria-label="Buscar veículo"
                           placeholder="Buscar por placa, código DNA, marca ou modelo..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value })" />
                    <select id="veh-filter-dna" class="adm-select" aria-label="Filtrar por status DNA" onchange="AdminView.updateParams({ dna_status: this.value })">
                        <option value="" ${!f.dna_status ? 'selected' : ''}>DNA: Todos</option>
                        <option value="ACTIVE" ${f.dna_status === 'ACTIVE' ? 'selected' : ''}>Apenas DNA Ativo</option>
                        <option value="NONE" ${f.dna_status === 'NONE' ? 'selected' : ''}>Sem DNA Ativo</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.updateParams({ q: document.getElementById('veh-filter-q')?.value || '' })">Aplicar Filtros</button>
                    ${(f.q || f.dna_status) ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('vehicles')">Limpar</button>` : ''}
                `)}

                ${UI.EnterpriseDataTable({
                    rows: vehicles,
                    sortBy: f.sort_by || '',
                    sortDir: f.sort_dir || 'desc',
                    onSortExpr: (field, dir) => `AdminView.updateParams({ sort_by: '${field}', sort_dir: '${dir}' })`,
                    emptyTitle: 'Nenhum veículo encontrado',
                    emptySubtitle: 'Não existem veículos para os filtros selecionados.',
                    columns: [
                        { key: 'license_plate', label: 'Placa', sortable: true, tdClass: 'adm-mono', render: v => `<strong>${esc(v.license_plate)}</strong>` },
                        { key: 'brand', label: 'Veículo', sortable: true, render: v => `<span class="adm-cell-title">${esc(v.brand)} ${esc(v.model)}</span><div class="adm-cell-sub">${esc(v.model_year || '-')} • ${esc(v.color || '-')}</div>` },
                        { key: 'dna_code', label: 'Código DNA', render: v => v.dna_code ? `<span class="adm-badge adm-badge-success"><span class="adm-badge-dot" aria-hidden="true"></span>${esc(v.dna_code)}</span>` : `<span class="adm-badge adm-badge-muted">Sem DNA</span>` },
                        { key: 'owner_name', label: 'Proprietário', sortable: true, render: v => `<div>${esc(v.owner_name || '-')}</div><div class="adm-cell-sub adm-mono">${esc(v.owner_phone || '')}</div>` },
                        { key: 'workshop_name', label: 'Oficina Vinculada', sortable: true, render: v => esc(v.workshop_name || '-') },
                        { key: 'current_mileage', label: 'KM Atual', align: 'right', sortable: true, tdClass: 'adm-mono', render: v => v.current_mileage ? `${num(v.current_mileage)} km` : '-' },
                        { key: 'total_maintenance_cents', label: 'OS / Total', align: 'right', sortable: true, tdClass: 'adm-mono', render: v => `${num(v.services_count)} • ${brl(v.total_maintenance_cents)}` },
                        { key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell', render: v => `<button type="button" class="adm-btn adm-btn-sm" onclick="App.switchView('dossier', '${esc(v.license_plate)}')">Dossiê →</button>` }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 7. HISTÓRICO DE ATENDIMENTOS (ORDENS DE SERVIÇO)
    // --------------------------------------------------------------------------
    async renderServiceOrders(ctx) {
        const f = ctx.params || {};
        const pageSize = Number(f.page_size || 25);
        const data = await API.getAdminServiceOrders({
            q: f.q || '',
            proof_level: f.proof_level || '',
            page: f.page || 1,
            page_size: pageSize
        });
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;
        const items = this.sortItems(data.items || [], f.sort_by || '', f.sort_dir || 'desc');

        return `
            ${UI.PageHeader({
                title: `Histórico de Atendimentos (${num(data.total)})`,
                subtitle: 'Ordens de serviço executadas e declaradas em toda a rede com nível de comprovação documental.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="os-filter-q" class="adm-input adm-filter-search" aria-label="Buscar atendimento"
                           placeholder="Buscar por placa, título do serviço ou oficina..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <select id="os-filter-proof" class="adm-select" aria-label="Filtrar por comprovação" onchange="AdminView.updateParams({ proof_level: this.value, page: 1 })">
                        <option value="" ${!f.proof_level ? 'selected' : ''}>Comprovação: Todos</option>
                        <option value="4" ${f.proof_level === '4' ? 'selected' : ''}>Nível 4 — Comprovado Oficina</option>
                        <option value="3" ${f.proof_level === '3' ? 'selected' : ''}>Nível 3 — Confirmado</option>
                        <option value="2" ${f.proof_level === '2' ? 'selected' : ''}>Nível 2 — Nota Anexada</option>
                        <option value="1" ${f.proof_level === '1' ? 'selected' : ''}>Nível 1 — Declarado Cliente</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.updateParams({ q: document.getElementById('os-filter-q')?.value || '', page: 1 })">Aplicar Filtros</button>
                    ${(f.q || f.proof_level) ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('service-orders')">Limpar</button>` : ''}
                `)}

                ${UI.EnterpriseDataTable({
                    rows: items,
                    sortBy: f.sort_by || '',
                    sortDir: f.sort_dir || 'desc',
                    onSortExpr: (field, dir) => `AdminView.updateParams({ sort_by: '${field}', sort_dir: '${dir}' })`,
                    emptyTitle: 'Nenhuma ordem de serviço encontrada',
                    emptySubtitle: 'Não foram encontrados atendimentos para os filtros aplicados.',
                    pagination: { page: data.page, totalPages: data.total_pages, total: data.total, pageSize },
                    columns: [
                        { key: 'service_date', label: 'Data', sortable: true, tdClass: 'adm-mono', render: s => esc(AdminView.formatDate(s.service_date || s.created_at)) },
                        { key: 'license_plate', label: 'Placa / Veículo', sortable: true, render: s => `<a href="javascript:void(0)" class="adm-link adm-mono" onclick="App.switchView('dossier', '${esc(s.license_plate)}')">${esc(s.license_plate)}</a><div class="adm-cell-sub">${esc(s.brand || '')} ${esc(s.model || '')}</div>` },
                        { key: 'service_title', label: 'Serviço / Categoria', sortable: true, render: s => `<span class="adm-cell-title">${esc(s.service_title || '-')}</span><div class="adm-cell-sub">${esc(s.category || '')}</div>` },
                        { key: 'workshop_name', label: 'Oficina', sortable: true, render: s => esc(s.workshop_name || 'Declaração do Cliente') },
                        { key: 'mileage', label: 'KM', align: 'right', sortable: true, tdClass: 'adm-mono', render: s => s.mileage ? `${num(s.mileage)} km` : '-' },
                        { key: 'proof_level', label: 'Comprovação', sortable: true, render: s => AdminView.proofBadge(s.proof_level) },
                        { key: 'total_cost_cents', label: 'Valor', align: 'right', sortable: true, tdClass: 'adm-money', render: s => brl(s.total_cost_cents) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 8. SERVIÇOS E MANUTENÇÕES (PREVISÕES PREDITIVAS + LINHA DO TEMPO)
    // --------------------------------------------------------------------------
    async renderMaintenanceHistory() {
        const data = await API.getAdminMaintenanceHistory();
        const UI = AdminView.ui();
        const preds = data.predictions || [];
        const srvs = data.services || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Serviços e Manutenções',
                subtitle: 'Monitoramento preditivo da frota (itens vencidos ou próximos) e linha do tempo consolidada de manutenções.'
            })}

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Previsões Preditivas da Frota (${preds.length})</h3>
                        <p class="adm-card-subtitle">Baseado no motor de manutenção preditiva por quilometragem e tempo</p>
                    </div>
                </div>
                ${UI.EnterpriseDataTable({
                    rows: preds.slice(0, 35),
                    emptyTitle: 'Sem previsões registradas',
                    emptySubtitle: 'Nenhuma previsão preditiva calculada ainda para a frota.',
                    columns: [
                        { key: 'license_plate', label: 'Placa / Veículo', render: p => `<strong class="adm-mono">${esc(p.license_plate)}</strong> <span class="adm-text-secondary">${esc(p.brand || '')} ${esc(p.model || '')}</span>` },
                        { key: 'item_name', label: 'Item / Regra', render: p => esc(p.item_name || p.rule_code || '-') },
                        { key: 'alert_status', label: 'Status Alerta', render: p => AdminView.statusBadge(p.alert_status) },
                        { key: 'next_due_km', label: 'Próximo KM', align: 'right', tdClass: 'adm-mono', render: p => p.next_due_km ? `${num(p.next_due_km)} km` : '-' },
                        { key: 'next_due_date', label: 'Próxima Data', tdClass: 'adm-mono', render: p => esc(AdminView.formatDate(p.next_due_date)) }
                    ]
                })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Linha do Tempo de Manutenções (${srvs.length})</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: srvs.slice(0, 35),
                    emptyTitle: 'Sem histórico de manutenções',
                    emptySubtitle: 'Nenhum registro de manutenção encontrado.',
                    columns: [
                        { key: 'service_date', label: 'Data', tdClass: 'adm-mono', render: s => esc(AdminView.formatDate(s.service_date)) },
                        { key: 'license_plate', label: 'Placa / DNA', tdClass: 'adm-mono', render: s => `<strong>${esc(s.license_plate)}</strong> <span class="adm-text-muted">${esc(s.dna_code || '')}</span>` },
                        { key: 'service_title', label: 'Serviço', render: s => esc(s.service_title || s.category) },
                        { key: 'workshop_name', label: 'Oficina', render: s => esc(s.workshop_name || 'Cliente') },
                        { key: 'mileage', label: 'KM', align: 'right', tdClass: 'adm-mono', render: s => s.mileage ? `${num(s.mileage)} km` : '-' },
                        { key: 'total_cost_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: s => brl(s.total_cost_cents) }
                    ]
                })}
            </div>
        `;
    }
};
