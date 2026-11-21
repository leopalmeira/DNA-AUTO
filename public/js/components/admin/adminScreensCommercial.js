// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — GESTÃO COMERCIAL & REPRESENTANTES
// Representantes Comerciais (17 colunas + Ficha em 7 blocos), Carteiras,
// Captação de Clientes, Ranking de Representantes e Metas Comerciais
// ==============================================================================

const AdminScreensCommercial = {
    lastRepsData: [],

    // --------------------------------------------------------------------------
    // 1. REPRESENTANTES COMERCIAIS (Tabela Completa + Filtros + CSV + Ações Auditadas)
    // --------------------------------------------------------------------------
    async renderRepresentatives(ctx) {
        const f = ctx.params || {};
        const pageSize = Number(f.page_size || 25);
        const data = await API.getAdminRepresentativesSummary({
            q: f.q || '',
            status: f.status || 'ALL',
            state: f.state || 'ALL',
            city: f.city || '',
            period: f.period || 'all',
            productivity: f.productivity || 'ALL',
            sort_by: f.sort_by || '',
            sort_dir: f.sort_dir || 'desc',
            page: f.page || 1,
            page_size: pageSize
        });
        this.lastRepsData = data.items || [];
        const cnt = data.counts || {};
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        const hasFilters = Boolean(
            f.q || (f.status && f.status !== 'ALL') || (f.state && f.state !== 'ALL') ||
            f.city || (f.period && f.period !== 'all') || (f.productivity && f.productivity !== 'ALL')
        );

        return `
            ${UI.PageHeader({
                title: `Representantes Comerciais (${num(cnt.total)})`,
                subtitle: 'Gestão comercial completa da rede de representantes, homologação, carteira de oficinas e rastreabilidade de comissões.',
                actionsHtml: `
                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.exportRepresentativesCsv()">⬇ Exportar CSV</button>
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.reloadCurrentScreen()">↻ Atualizar Dados</button>
                `
            })}

            <div class="adm-kpi-grid cols-4">
                ${UI.KPIStatCard({ label: 'Total Cadastrado', value: num(cnt.total), sub: 'Base comercial completa', tone: 'tone-blue', onClick: "AdminView.updateParams({ status: 'ALL', page: 1 })" })}
                ${UI.KPIStatCard({ label: 'Representantes Ativos', value: num(cnt.active), sub: 'Com carteira comercial habilitada', tone: 'tone-success', onClick: "AdminView.updateParams({ status: 'ACTIVE', page: 1 })" })}
                ${UI.KPIStatCard({ label: 'Aguardando Aprovação', value: num(cnt.pending), sub: cnt.pending > 0 ? 'Requer análise administrativa' : 'Nenhuma pendência', tone: cnt.pending > 0 ? 'tone-warning' : 'tone-success', onClick: "AdminView.updateParams({ status: 'PENDING_APPROVAL', page: 1 })" })}
                ${UI.KPIStatCard({ label: 'Suspensos / Recusados', value: num((cnt.suspended || 0) + (cnt.rejected || 0)), sub: `${num(cnt.suspended)} susp. • ${num(cnt.rejected)} rec.`, tone: 'tone-danger', onClick: "AdminView.updateParams({ status: 'SUSPENDED', page: 1 })" })}
            </div>

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="rep-search-q" class="adm-input adm-filter-search" aria-label="Buscar representante"
                           placeholder="Buscar código, nome, e-mail ou telefone..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensCommercial.applyRepFilters()" />
                    <select id="rep-filter-status" class="adm-select" aria-label="Status do representante">
                        <option value="ALL" ${(!f.status || f.status === 'ALL') ? 'selected' : ''}>Status: Todos</option>
                        <option value="ACTIVE" ${f.status === 'ACTIVE' ? 'selected' : ''}>Ativos</option>
                        <option value="PENDING_APPROVAL" ${(f.status === 'PENDING_APPROVAL' || f.status === 'PENDING') ? 'selected' : ''}>Pendentes</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensos</option>
                        <option value="REJECTED" ${f.status === 'REJECTED' ? 'selected' : ''}>Rejeitados</option>
                    </select>
                    <select id="rep-filter-state" class="adm-select" aria-label="Estado do representante">
                        <option value="ALL">UF: Todos</option>
                        ${(data.states_available || []).map(uf => `<option value="${esc(uf)}" ${f.state === uf ? 'selected' : ''}>${esc(uf)}</option>`).join('')}
                    </select>
                    <input type="text" id="rep-filter-city" class="adm-input" style="width:140px;" aria-label="Cidade" placeholder="Cidade..." value="${esc(f.city || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensCommercial.applyRepFilters()" />
                    <select id="rep-filter-period" class="adm-select" aria-label="Período">
                        <option value="all" ${(!f.period || f.period === 'all') ? 'selected' : ''}>Período: Todos</option>
                        <option value="current_month" ${f.period === 'current_month' ? 'selected' : ''}>Mês Atual</option>
                        <option value="last_30_days" ${f.period === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="last_90_days" ${f.period === 'last_90_days' ? 'selected' : ''}>Últimos 90 dias</option>
                        <option value="current_year" ${f.period === 'current_year' ? 'selected' : ''}>Ano Atual</option>
                    </select>
                    <select id="rep-filter-prod" class="adm-select" aria-label="Produtividade">
                        <option value="ALL" ${(!f.productivity || f.productivity === 'ALL') ? 'selected' : ''}>Produtividade: Todas</option>
                        <option value="HIGH" ${f.productivity === 'HIGH' ? 'selected' : ''}>Alta Produtividade</option>
                        <option value="WITH_SALES" ${f.productivity === 'WITH_SALES' ? 'selected' : ''}>Com Cadastros Pagos</option>
                        <option value="ZERO_SALES" ${f.productivity === 'ZERO_SALES' ? 'selected' : ''}>Sem Vendas</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensCommercial.applyRepFilters()">Aplicar Filtros</button>
                    ${hasFilters ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('representatives')">Limpar</button>` : ''}
                `, { ariaLabel: 'Filtros de representantes comerciais' })}

                ${UI.EnterpriseDataTable({
                    testId: 'representatives-table',
                    rows: data.items || [],
                    sortBy: f.sort_by || '',
                    sortDir: f.sort_dir || 'desc',
                    onSortExpr: (field, dir) => `AdminView.updateParams({ sort_by: '${field}', sort_dir: '${dir}', page: 1 })`,
                    emptyTitle: 'Nenhum representante encontrado',
                    emptySubtitle: 'Não há representantes comerciais que correspondam aos filtros aplicados.',
                    pagination: { page: data.page, totalPages: data.total_pages, total: data.total, pageSize },
                    columns: [
                        { key: 'rep_code', label: 'Código', sortable: true, tdClass: 'adm-mono', render: r => `<a href="javascript:void(0)" class="adm-link adm-mono" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.rep_code)}</a>` },
                        { key: 'name', label: 'Representante', sortable: true, render: r => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a>` },
                        { key: 'email', label: 'E-mail', render: r => `<span class="adm-text-secondary">${esc(r.email)}</span>` },
                        { key: 'phone', label: 'Telefone', tdClass: 'adm-mono', render: r => esc(r.phone || '-') },
                        { key: 'city', label: 'Cidade', sortable: true, render: r => esc(r.city || '-') },
                        { key: 'state', label: 'UF', sortable: true, render: r => esc(r.state || '-') },
                        { key: 'created_at', label: 'Cadastro', sortable: true, tdClass: 'adm-mono', render: r => esc(AdminView.formatDate(r.created_at)) },
                        { key: 'status', label: 'Status', sortable: true, render: r => AdminView.statusBadge(r.status) },
                        { key: 'linked_workshops_count', label: 'Ofic. Vinc.', align: 'right', sortable: true, tdClass: 'adm-num', render: r => num(r.linked_workshops_count) },
                        { key: 'active_workshops_count', label: 'Ofic. Ativas', align: 'right', sortable: true, tdClass: 'adm-num adm-text-success', render: r => num(r.active_workshops_count) },
                        { key: 'clients_registered_count', label: 'Clientes', align: 'right', sortable: true, tdClass: 'adm-num', render: r => num(r.clients_registered_count) },
                        { key: 'paid_registrations_count', label: 'Elegíveis Pagos', align: 'right', sortable: true, tdClass: 'adm-num', render: r => num(r.paid_registrations_count) },
                        { key: 'projected_commissions_cents', label: 'Com. Projetada', align: 'right', sortable: true, tdClass: 'adm-money adm-text-muted', render: r => brl(r.projected_commissions_cents) },
                        { key: 'confirmed_commissions_cents', label: 'Com. Confirmada', align: 'right', sortable: true, tdClass: 'adm-money adm-text-success', render: r => brl(r.confirmed_commissions_cents) },
                        { key: 'paid_commissions_cents', label: 'Total Pago', align: 'right', sortable: true, tdClass: 'adm-money adm-text-accent', render: r => brl(r.paid_commissions_cents) },
                        { key: 'pending_balance_cents', label: 'Saldo Pendente', align: 'right', sortable: true, tdClass: 'adm-money adm-text-warning', render: r => brl(r.pending_balance_cents) },
                        { key: 'next_payout_cents', label: 'Próx. Pagamento', align: 'right', sortable: true, tdClass: 'adm-money', render: r => brl(r.next_payout_cents) },
                        {
                            key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                            render: r => `
                                <div class="adm-actions-group">
                                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.openRepresentative('${esc(r.id)}')">Ficha</button>
                                    ${r.status === 'PENDING_APPROVAL' ? `
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'approve', '${esc(r.name)}')">Aprovar</button>
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reject', '${esc(r.name)}')">Rejeitar</button>
                                    ` : r.status === 'ACTIVE' ? `
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'suspend', '${esc(r.name)}')">Suspender</button>
                                    ` : `
                                        <button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reactivate', '${esc(r.name)}')">Reativar</button>
                                    `}
                                </div>
                            `
                        }
                    ]
                })}
            </div>
        `;
    },

    applyRepFilters() {
        AdminView.updateParams({
            q: document.getElementById('rep-search-q')?.value || '',
            status: document.getElementById('rep-filter-status')?.value || 'ALL',
            state: document.getElementById('rep-filter-state')?.value || 'ALL',
            city: document.getElementById('rep-filter-city')?.value || '',
            period: document.getElementById('rep-filter-period')?.value || 'all',
            productivity: document.getElementById('rep-filter-prod')?.value || 'ALL',
            page: 1
        });
    },

    exportRepresentativesCsv() {
        const rows = this.lastRepsData || [];
        if (rows.length === 0) {
            AdminView.toast('Não há representantes listados para exportar.', 'error');
            return;
        }
        const headers = [
            'Codigo', 'Nome', 'Email', 'Telefone', 'Cidade', 'UF', 'DataCadastro', 'Status',
            'OficinasVinculadas', 'OficinasAtivas', 'ClientesCadastrados', 'CadastrosPagos',
            'ComissaoPrevistaBRL', 'ComissaoConfirmadaBRL', 'TotalPagoBRL', 'SaldoPendenteBRL', 'ProximoPagamentoBRL'
        ];
        const fmt = c => (Number(c || 0) / 100).toFixed(2).replace('.', ',');
        const csvLines = [
            headers.join(';'),
            ...rows.map(r => [
                r.rep_code, r.name, r.email, r.phone || '', r.city || '', r.state || '',
                r.created_at || '', r.status, r.linked_workshops_count, r.active_workshops_count,
                r.clients_registered_count, r.paid_registrations_count,
                fmt(r.projected_commissions_cents), fmt(r.confirmed_commissions_cents),
                fmt(r.paid_commissions_cents), fmt(r.pending_balance_cents), fmt(r.next_payout_cents)
            ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
        ];
        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dna-auto-representantes-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        AdminView.toast(`Exportação CSV concluída (${rows.length} representante(s)).`);
    },

    changeRepStatus(id, action, repName = '') {
        const cfg = {
            approve: {
                title: `Aprovar Representante${repName ? ` — ${repName}` : ''}`,
                message: 'O representante terá sua carteira comercial habilitada e poderá captar oficinas credenciadas DNA AUTO.',
                confirmLabel: 'Confirmar Aprovação',
                tone: 'success'
            },
            reject: {
                title: `Rejeitar Cadastro${repName ? ` — ${repName}` : ''}`,
                message: 'O cadastro comercial será marcado como rejeitado e registrado em auditoria.',
                confirmLabel: 'Confirmar Rejeição',
                tone: 'danger'
            },
            suspend: {
                title: `Suspender Representante${repName ? ` — ${repName}` : ''}`,
                message: 'O representante será suspenso temporariamente. Comissões já confirmadas e vínculos históricos permanecem rastreáveis em auditoria.',
                confirmLabel: 'Confirmar Suspensão',
                tone: 'danger'
            },
            reactivate: {
                title: `Reativar Representante${repName ? ` — ${repName}` : ''}`,
                message: 'O representante voltará ao status ativo na rede comercial.',
                confirmLabel: 'Confirmar Reativação',
                tone: 'success'
            }
        }[action] || { title: 'Alterar Status', message: '', confirmLabel: 'Confirmar', tone: 'primary' };

        AdminView.openConfirmDialog({
            title: cfg.title,
            message: cfg.message,
            confirmLabel: cfg.confirmLabel,
            tone: cfg.tone,
            inputConfig: {
                id: 'rep-status-justification',
                label: 'Justificativa Administrativa (Auditoria)',
                placeholder: 'Descreva o motivo da decisão administrativa...',
                defaultValue: `Ação executada via Central Administrativa (${action})`,
                required: true,
                minLength: 5
            },
            onConfirm: async (justification) => {
                if (action === 'approve') await API.approveRepresentative(id, justification);
                else if (action === 'reject') await API.rejectRepresentative(id, justification);
                else if (action === 'suspend') await API.suspendRepresentative(id, justification);
                else if (action === 'reactivate') await API.reactivateRepresentative(id, justification);
                AdminView.toast('Status do representante atualizado com auditoria.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 1B. FICHA INDIVIDUAL DO REPRESENTANTE (7 BLOCOS + FILTROS FINANCEIROS)
    // --------------------------------------------------------------------------
    async renderRepresentativeDetail(ctx) {
        const repId = ctx.params?.id;
        if (!repId) return this.renderRepresentatives(ctx);
        const tab = ctx.params?.subtab || 'personal';
        const data = await API.getAdminRepresentativeOverview(repId);
        const p = data.personal_data || {};
        const pf = data.portfolio || {};
        const ca = data.clients_acquired || {};
        const pr = data.productivity || {};
        const fin = data.financial || {};
        const np = data.next_payout || {};
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        const tabs = [
            { id: 'personal', label: '1. Dados Pessoais' },
            { id: 'portfolio', label: `2. Carteira Comercial (${pf.total_workshops || 0})` },
            { id: 'clients', label: `3. Clientes Captados (${ca.unique_clients_count || 0})` },
            { id: 'productivity', label: '4. Produtividade' },
            { id: 'financial', label: '5. Financeiro' },
            { id: 'next_payout', label: '6. Próximo Pagamento' },
            { id: 'history', label: `7. Histórico (${(data.history || []).length})` }
        ];

        let tabHtml = '';
        if (tab === 'personal') {
            tabHtml = `
                <div class="adm-card">
                    <div class="adm-card-header">
                        <div>
                            <h3 class="adm-card-title">Dados Pessoais e Proteção LGPD</h3>
                            <p class="adm-card-subtitle">${esc(p.privacy_notice || '')}</p>
                        </div>
                        <button type="button" class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.openGoalsModal('${esc(p.id)}', '${esc(p.name)}', ${p.max_workshops_limit}, ${p.monthly_goal_workshops}, ${p.monthly_goal_activations})">Editar Metas / Limite</button>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-chain-box"><strong>Código:</strong> <span class="adm-mono adm-text-accent">${esc(p.rep_code)}</span><br/><strong>Nome:</strong> ${esc(p.name)}<br/><strong>Documento (Mascarado):</strong> <span class="adm-mono">${esc(p.cpf_cnpj_masked)}</span><br/><strong>Status:</strong> ${AdminView.statusBadge(p.status)}</div>
                        <div class="adm-chain-box"><strong>E-mail:</strong> ${esc(p.email)}<br/><strong>Telefone:</strong> <span class="adm-mono">${esc(p.phone || '-')}</span><br/><strong>Cidade/UF:</strong> ${esc(p.city || '-')}/${esc(p.state || '-')}<br/><strong>Chave PIX (Mascarada):</strong> <span class="adm-mono">${esc(p.pix_key_masked)}</span></div>
                        <div class="adm-chain-box"><strong>Limite de Carteira:</strong> ${p.max_workshops_limit} oficinas<br/><strong>Meta Mensal Oficinas:</strong> ${p.monthly_goal_workshops}<br/><strong>Meta Mensal Ativações:</strong> ${p.monthly_goal_activations}</div>
                        <div class="adm-chain-box"><strong>Cadastro em:</strong> ${esc(AdminView.formatDateTime(p.created_at))}<br/><strong>Links Compartilhados:</strong> ${num(p.links_shared_count)}<br/><strong>Treinamento:</strong> ${p.training_completed ? 'Concluído' : 'Em andamento'}</div>
                    </div>
                </div>
            `;
        } else if (tab === 'portfolio') {
            const wsList = pf.workshops || [];
            tabHtml = `
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Carteira Comercial (${wsList.length} / ${pf.max_limit} oficinas)</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: wsList,
                        emptyTitle: 'Carteira vazia',
                        emptySubtitle: 'Este representante ainda não possui oficinas vinculadas.',
                        columns: [
                            { key: 'trade_name', label: 'Oficina', render: w => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a><div class="adm-cell-sub adm-mono">${esc(w.cnpj || '')}</div>` },
                            { key: 'city', label: 'Cidade/UF', render: w => `${esc(w.city || '-')}/${esc(w.state || '-')}` },
                            { key: 'workshop_status', label: 'Status', render: w => AdminView.statusBadge(w.workshop_status) },
                            { key: 'linked_at', label: 'Vínculo / Validade 24m', tdClass: 'adm-mono', render: w => `${esc(AdminView.formatDate(w.linked_at))} → ${esc(AdminView.formatDate(w.valid_until))}` },
                            { key: 'unique_clients_count', label: 'Clientes Únicos', align: 'right', tdClass: 'adm-num', render: w => num(w.unique_clients_count) },
                            { key: 'vehicles_count', label: 'Veículos', align: 'right', tdClass: 'adm-num', render: w => num(w.vehicles_count) },
                            { key: 'paid_registrations_count', label: 'Pagos', align: 'right', tdClass: 'adm-num adm-text-success', render: w => num(w.paid_registrations_count) },
                            { key: 'confirmed_commissions_cents', label: 'Comissões Conf.', align: 'right', tdClass: 'adm-money', render: w => brl(w.confirmed_commissions_cents) }
                        ]
                    })}
                </div>
            `;
        } else if (tab === 'clients') {
            const byWs = ca.by_workshop || [];
            tabHtml = `
                <div class="adm-kpi-grid cols-3">
                    ${UI.KPIStatCard({ label: 'Clientes Únicos Captados', value: num(ca.unique_clients_count), sub: 'Desduplicados na carteira', tone: 'tone-cyan' })}
                    ${UI.KPIStatCard({ label: 'Total de Ativações', value: num(ca.total_activations_count), sub: 'Incluindo múltiplos veículos', tone: 'tone-blue' })}
                    ${UI.KPIStatCard({ label: 'Cadastros Efetivamente Pagos', value: num(ca.paid_activations_count), sub: 'Elegíveis conforme regras do backend', tone: 'tone-success' })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Captação de Clientes por Oficina da Carteira</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: byWs,
                        emptyTitle: 'Sem captação registrada',
                        emptySubtitle: 'Nenhuma oficina vinculada registrou clientes ainda.',
                        columns: [
                            { key: 'trade_name', label: 'Oficina', render: w => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a>` },
                            { key: 'city', label: 'Cidade/UF', render: w => `${esc(w.city || '-')}/${esc(w.state || '-')}` },
                            { key: 'unique_clients_count', label: 'Clientes Únicos', align: 'right', tdClass: 'adm-num', render: w => num(w.unique_clients_count) },
                            { key: 'total_activations_count', label: 'Ativações Totais', align: 'right', tdClass: 'adm-num', render: w => num(w.total_activations_count) },
                            { key: 'paid_activations_count', label: 'Cadastros Pagos', align: 'right', tdClass: 'adm-num adm-text-success', render: w => num(w.paid_activations_count) }
                        ]
                    })}
                </div>
            `;
        } else if (tab === 'productivity') {
            const mp = pr.monthly_performance || [];
            tabHtml = `
                <div class="adm-charts-grid">
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Cadastros Pagos vs Oficinas Vinculadas (6 meses)</h3></div>
                        ${AdminCharts.renderBarChart(mp, {
                            valueKey: 'paid_registrations',
                            secondaryKey: 'workshops_linked',
                            labelKey: 'month',
                            primaryLabel: 'Cadastros Pagos',
                            secondaryLabel: 'Oficinas Vinculadas',
                            color: 'var(--adm-chart-1)',
                            secondaryColor: 'var(--adm-chart-4)'
                        })}
                    </div>
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Comissões Confirmadas vs Pagas por Mês</h3></div>
                        ${AdminCharts.renderBarChart(mp, {
                            valueKey: 'confirmed_cents',
                            secondaryKey: 'paid_cents',
                            labelKey: 'month',
                            primaryLabel: 'Confirmadas',
                            secondaryLabel: 'Pagas',
                            color: 'var(--adm-chart-2)',
                            secondaryColor: 'var(--adm-chart-3)',
                            isCurrency: true
                        })}
                    </div>
                </div>
            `;
        } else if (tab === 'financial') {
            const compFilter = ctx.params?.comm_month || '';
            const statusFilter = ctx.params?.comm_status || '';
            const allComms = fin.commissions || [];
            const comms = allComms.filter(c => {
                if (compFilter && c.competence_month !== compFilter) return false;
                if (statusFilter && c.status !== statusFilter) return false;
                return true;
            });

            tabHtml = `
                <div class="adm-kpi-grid">
                    ${UI.FinancialMetric({ label: 'Previstas (Projetadas)', cents: fin.projected_cents, classification: 'Projetado', sub: 'PIX ainda pendente — não elegível', tone: 'tone-muted' })}
                    ${UI.FinancialMetric({ label: 'Confirmadas (Total)', cents: fin.confirmed_total_cents, classification: 'Confirmado', sub: `Elegível em aberto: ${brl(fin.eligible_open_cents)}`, tone: 'tone-success' })}
                    ${UI.FinancialMetric({ label: 'Já Pagas', cents: fin.paid_cents, classification: 'Liquidado', sub: 'Repasses efetivados', tone: 'tone-cyan' })}
                    ${UI.FinancialMetric({ label: 'Estornadas / Bloqueadas', cents: fin.refunded_cents, classification: 'Estorno', sub: `Contestadas: ${brl(fin.blocked_dispute_cents)} • Ajustes: ${brl(fin.open_adjustments_cents)}`, tone: 'tone-danger' })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Extrato de Comissões do Representante (${comms.length})</h3></div>
                    ${UI.FilterToolbar(`
                        <input type="month" id="rep-comm-month" class="adm-input" aria-label="Filtrar competência" value="${esc(compFilter)}" onchange="AdminView.updateParams({ comm_month: this.value })" />
                        <select id="rep-comm-status" class="adm-select" aria-label="Filtrar status" onchange="AdminView.updateParams({ comm_status: this.value })">
                            <option value="" ${!statusFilter ? 'selected' : ''}>Status: Todos</option>
                            <option value="CONFIRMED" ${statusFilter === 'CONFIRMED' ? 'selected' : ''}>Confirmada</option>
                            <option value="PROJECTED" ${statusFilter === 'PROJECTED' ? 'selected' : ''}>Projetada</option>
                            <option value="PAID" ${statusFilter === 'PAID' ? 'selected' : ''}>Paga</option>
                            <option value="REFUNDED" ${statusFilter === 'REFUNDED' ? 'selected' : ''}>Estornada</option>
                        </select>
                        ${(compFilter || statusFilter) ? `<button type="button" class="adm-btn" onclick="AdminView.updateParams({ comm_month: '', comm_status: '' })">Limpar Filtros</button>` : ''}
                    `)}
                    ${UI.EnterpriseDataTable({
                        rows: comms,
                        emptyTitle: 'Sem comissões para o filtro selecionado',
                        emptySubtitle: 'Ainda não existem lançamentos de comissão correspondentes.',
                        columns: [
                            { key: 'competence_month', label: 'Competência', tdClass: 'adm-mono', render: c => esc(c.competence_month || '-') },
                            { key: 'workshop_name', label: 'Oficina', render: c => esc(c.workshop_name) },
                            { key: 'license_plate', label: 'Placa', tdClass: 'adm-mono', render: c => esc(c.license_plate || '-') },
                            { key: 'policy_version_code', label: 'Política', tdClass: 'adm-mono', render: c => esc(c.policy_version_code || 'V1') },
                            { key: 'commission_amount_cents', label: 'Valor', align: 'right', tdClass: 'adm-money', render: c => brl(c.commission_amount_cents) },
                            { key: 'status', label: 'Status', render: c => `${AdminView.statusBadge(c.status)} ${c.dispute_status === 'DISPUTED' ? AdminView.statusBadge('DISPUTED') : ''}` },
                            { key: 'payout_month', label: 'Ciclo Pgto', tdClass: 'adm-mono', render: c => esc(c.payout_month || '-') }
                        ]
                    })}
                </div>
            `;
        } else if (tab === 'next_payout') {
            const batches = data.payouts || [];
            tabHtml = `
                <div class="adm-kpi-grid">
                    ${UI.FinancialMetric({ label: `Líquido Elegível (${np.competence_month})`, cents: np.net_eligible_cents, classification: 'Previsto', sub: `Previsto p/ ${np.scheduled_payout_date}`, tone: 'tone-gold' })}
                    ${UI.KPIStatCard({ label: 'Comissões Confirmadas', value: num(np.eligible_commissions_count), sub: `Bruto elegível: ${brl(np.eligible_gross_cents)}`, tone: 'tone-success' })}
                    ${UI.FinancialMetric({ label: 'Projetadas (Fora do Ciclo)', cents: np.projected_excluded_cents, classification: 'Projetado', sub: 'Aguardando confirmação PIX', tone: 'tone-muted' })}
                    ${UI.FinancialMetric({ label: 'Ajustes / Status Lote', cents: np.adjustments_cents, classification: np.batch_status || 'Aberto', sub: `Situação: ${np.batch_status}`, tone: 'tone-blue' })}
                </div>
                <div class="adm-card">
                    <div class="adm-card-header">
                        <h3 class="adm-card-title">Histórico de Lotes de Pagamento (${batches.length})</h3>
                        <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('payouts')">Ir para Fechamento & Pagamentos →</button>
                    </div>
                    ${UI.EnterpriseDataTable({
                        rows: batches,
                        emptyTitle: 'Nenhum lote fechado',
                        emptySubtitle: 'Os lotes aparecem aqui após o fechamento financeiro da competência.',
                        columns: [
                            { key: 'id', label: 'Lote', tdClass: 'adm-mono', render: b => esc(b.id) },
                            { key: 'competence_month', label: 'Competência → Pgto', tdClass: 'adm-mono', render: b => `${esc(b.competence_month)} → ${esc(b.payout_month)}` },
                            { key: 'commissions_count', label: 'Comissões', align: 'right', tdClass: 'adm-num', render: b => num(b.commissions_count) },
                            { key: 'net_amount_cents', label: 'Líquido', align: 'right', tdClass: 'adm-money', render: b => brl(b.net_amount_cents) },
                            { key: 'status', label: 'Status', render: b => AdminView.statusBadge(b.status) },
                            { key: 'transfer_reference', label: 'Referência / Data', tdClass: 'adm-mono', render: b => `${esc(b.transfer_reference || '-')} ${b.transfer_date ? `(${esc(b.transfer_date)})` : ''}` }
                        ]
                    })}
                </div>
            `;
        } else {
            const hist = data.history || [];
            tabHtml = `
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Histórico Cronológico e Auditoria (${hist.length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: hist,
                        emptyTitle: 'Sem eventos registrados',
                        emptySubtitle: 'Nenhuma movimentação auditada para este representante.',
                        columns: [
                            { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: h => esc(AdminView.formatDateTime(h.created_at)) },
                            { key: 'action', label: 'Ação', render: h => `<span class="adm-badge adm-badge-info">${esc(h.action)}</span>` },
                            { key: 'actor_id', label: 'Responsável', tdClass: 'adm-mono', render: h => `${esc(h.actor_role || '')} (${esc(h.actor_id || '-')})` },
                            { key: 'justification', label: 'Justificativa', render: h => esc(h.justification || '-') }
                        ]
                    })}
                </div>
            `;
        }

        return `
            ${UI.PageHeader({
                title: `${p.name || 'Representante'} (${p.rep_code || '-'})`,
                badgeHtml: AdminView.statusBadge(p.status),
                subtitle: `${esc(p.city || '-')}/${esc(p.state || '-')} • ${esc(p.email)} • <span class="adm-mono">${esc(p.phone || '-')}</span>`,
                backAction: "AdminView.navigate('representatives')",
                backLabel: 'Voltar para Representantes',
                actionsHtml: `
                    ${p.status === 'PENDING_APPROVAL' ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'approve', '${esc(p.name)}')">Aprovar</button><button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'reject', '${esc(p.name)}')">Rejeitar</button>` : ''}
                    ${p.status === 'ACTIVE' ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'suspend', '${esc(p.name)}')">Suspender</button>` : ''}
                    ${(p.status === 'SUSPENDED' || p.status === 'REJECTED') ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'reactivate', '${esc(p.name)}')">Reativar</button>` : ''}
                `
            })}

            <div class="adm-subtabs" role="tablist" aria-label="Blocos do representante">
                ${tabs.map(t => `<button type="button" role="tab" aria-selected="${tab === t.id}" class="adm-subtab ${tab === t.id ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: '${t.id}' })">${esc(t.label)}</button>`).join('')}
            </div>

            ${tabHtml}
        `;
    },

    // --------------------------------------------------------------------------
    // 2. CARTEIRA DE OFICINAS (Vínculos + Reatribuição Auditada)
    // --------------------------------------------------------------------------
    async renderPortfolios(ctx) {
        const f = ctx.params || {};
        const pageSize = Number(f.page_size || 25);
        const data = await API.getAdminWorkshopsSummary({ referral: f.referral || 'LINKED', q: f.q || '', page: f.page || 1, page_size: pageSize });
        const UI = AdminView.ui();
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Carteira de Oficinas — Vínculos Comerciais',
                subtitle: 'Controle auditável da cadeia <strong>Representante → Oficina → Cadastro → Pagamento → Comissão</strong>. Reatribuições exigem justificativa e preservam comissões históricas.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <select class="adm-select" aria-label="Tipo de vínculo" onchange="AdminView.updateParams({ referral: this.value, page: 1 })">
                        <option value="LINKED" ${(!f.referral || f.referral === 'LINKED') ? 'selected' : ''}>Somente Vinculadas a Representantes</option>
                        <option value="ALL" ${f.referral === 'ALL' ? 'selected' : ''}>Todas as Oficinas</option>
                        <option value="DIRECT" ${f.referral === 'DIRECT' ? 'selected' : ''}>Sem Representante (Diretas)</option>
                    </select>
                    <input type="text" id="port-filter-q" class="adm-input adm-filter-search" aria-label="Buscar carteira" placeholder="Buscar oficina ou código do representante..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminView.updateParams({ q: document.getElementById('port-filter-q')?.value || '', page: 1 })">Aplicar Filtros</button>
                `)}

                ${UI.EnterpriseDataTable({
                    rows: data.items || [],
                    emptyTitle: 'Nenhum vínculo comercial encontrado',
                    emptySubtitle: 'Não existem oficinas vinculadas para o filtro selecionado.',
                    pagination: { page: data.page, totalPages: data.total_pages, total: data.total, pageSize },
                    columns: [
                        { key: 'rep_code', label: 'Representante', render: w => w.rep_code ? `<a href="javascript:void(0)" class="adm-link adm-mono" onclick="AdminView.openRepresentative('${esc(w.representative_id)}')">${esc(w.rep_code)}</a><div class="adm-cell-sub">${esc(w.representative_name || '')}</div>` : '<span class="adm-badge adm-badge-muted">Direta</span>' },
                        { key: 'trade_name', label: 'Oficina', render: w => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openWorkshop('${esc(w.id)}')">${esc(w.trade_name)}</a><div class="adm-cell-sub">${esc(w.city || '-')}/${esc(w.state || '-')}</div>` },
                        { key: 'referral_linked_at', label: 'Início Vínculo', tdClass: 'adm-mono', render: w => esc(AdminView.formatDate(w.referral_linked_at)) },
                        { key: 'referral_valid_until', label: 'Validade (24m)', tdClass: 'adm-mono', render: w => esc(AdminView.formatDate(w.referral_valid_until)) },
                        { key: 'unique_clients_count', label: 'Clientes Únicos', align: 'right', tdClass: 'adm-num', render: w => num(w.unique_clients_count) },
                        { key: 'paid_registrations_count', label: 'Pagos', align: 'right', tdClass: 'adm-num adm-text-success', render: w => num(w.paid_registrations_count) },
                        { key: 'rep_commissions_generated_cents', label: 'Comissões', align: 'right', tdClass: 'adm-money', render: w => brl(w.rep_commissions_generated_cents) },
                        {
                            key: 'actions', label: 'Ações', align: 'right', tdClass: 'adm-actions-cell',
                            render: w => `
                                <div class="adm-actions-group">
                                    <button type="button" class="adm-btn adm-btn-sm" onclick="AdminView.openWorkshop('${esc(w.id)}')">Abrir</button>
                                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(w.rep_code || 'Nenhum')}')">Reatribuir</button>
                                </div>
                            `
                        }
                    ]
                })}
            </div>
        `;
    },

    async openReassignModal(workshopId, workshopName, currentRepCode) {
        const repsRes = await API.getAdminRepresentativesSummary({ status: 'ACTIVE', page_size: 100 });
        const reps = repsRes.items || [];
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Reatribuir Vínculo Comercial — ${workshopName}`,
            body: `
                <div class="adm-chain-box is-warning">
                    <strong>Regra de Integridade:</strong> Uma oficina nunca pode possuir dois representantes simultâneos. Esta operação grava auditoria completa e <strong>preserva intacta a titularidade de todas as comissões históricas anteriores</strong>.
                </div>
                <div class="adm-field">
                    <label for="reassign-current-rep">Vínculo Atual</label>
                    <input id="reassign-current-rep" class="adm-input" value="${esc(currentRepCode)}" disabled />
                </div>
                <div class="adm-field">
                    <label for="reassign-new-rep">Novo Representante Responsável *</label>
                    <select id="reassign-new-rep" class="adm-select" style="width:100%;">
                        <option value="">Selecione um representante ativo...</option>
                        ${reps.map(r => `<option value="${esc(r.id)}">${esc(r.rep_code)} — ${esc(r.name)} (${esc(r.city || '-')}/${esc(r.state || '-')})</option>`).join('')}
                    </select>
                </div>
                <div class="adm-field">
                    <label for="reassign-justification">Justificativa Administrativa Obrigatória (mínimo 10 caracteres) *</label>
                    <textarea id="reassign-justification" placeholder="Descreva o motivo autorizado da transferência de carteira..."></textarea>
                </div>
            `,
            confirmLabel: 'Confirmar Reatribuição Auditada',
            onConfirm: async () => {
                const newRepId = document.getElementById('reassign-new-rep')?.value;
                const justification = (document.getElementById('reassign-justification')?.value || '').trim();
                if (!newRepId) throw new Error('Selecione o representante de destino.');
                if (justification.length < 10) throw new Error('Informe uma justificativa de pelo menos 10 caracteres.');
                await API.reassignWorkshopRepresentative(workshopId, { new_representative_id: newRepId, justification });
                AdminView.toast('Vínculo atualizado com auditoria. Histórico financeiro preservado.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 3. CAPTAÇÃO DE CLIENTES
    // --------------------------------------------------------------------------
    async renderAcquisition(ctx) {
        const data = await API.getAdminCommercialAcquisition({ period: ctx.period, month: ctx.month });
        const UI = AdminView.ui();
        const fn = data.funnel || {};
        const list = data.by_workshop || [];
        const esc = AdminView.esc;
        const num = AdminView.formatNum;

        const convPct = fn.total_clicks > 0
            ? `${Math.round((Number(fn.activated || 0) / Number(fn.total_clicks)) * 100)}%`
            : null;

        return `
            ${UI.PageHeader({
                title: 'Captação de Clientes & Funil de Convites',
                subtitle: 'Conversão real de links de indicação comercial e desempenho de captação por oficina.'
            })}

            <div class="adm-kpi-grid cols-5">
                ${UI.KPIStatCard({ label: 'Convites Emitidos', value: num(fn.total_invites), tone: 'tone-blue' })}
                ${UI.KPIStatCard({ label: 'Cliques em Links', value: num(fn.total_clicks), tone: 'tone-cyan' })}
                ${UI.KPIStatCard({ label: 'Acessados', value: num(fn.accessed), tone: 'tone-warning' })}
                ${UI.KPIStatCard({ label: 'Cadastros Iniciados', value: num(fn.started), tone: 'tone-gold' })}
                ${UI.KPIStatCard({ label: 'Ativados', value: num(fn.activated), sub: convPct ? `Conversão sobre cliques: ${convPct}` : '', tone: 'tone-success' })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Captação por Oficina (${list.length})</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: list,
                    emptyTitle: 'Sem dados de captação no período',
                    emptySubtitle: 'Nenhuma ativação registrada no período selecionado.',
                    columns: [
                        { key: 'trade_name', label: 'Oficina', render: w => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a>` },
                        { key: 'city', label: 'Cidade/UF', render: w => `${esc(w.city || '-')}/${esc(w.state || '-')}` },
                        { key: 'rep_code', label: 'Representante', render: w => w.rep_code ? `<span class="adm-mono adm-text-accent" style="font-weight:700;">${esc(w.rep_code)}</span> ${esc(w.representative_name || '')}` : '<span class="adm-badge adm-badge-muted">Direta</span>' },
                        { key: 'unique_clients', label: 'Clientes Únicos', align: 'right', tdClass: 'adm-num', render: w => num(w.unique_clients) },
                        { key: 'activations_count', label: 'Ativações', align: 'right', tdClass: 'adm-num', render: w => num(w.activations_count) },
                        { key: 'paid_activations_count', label: 'Pagos', align: 'right', tdClass: 'adm-num adm-text-success', render: w => num(w.paid_activations_count) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 4. RANKING DE REPRESENTANTES
    // --------------------------------------------------------------------------
    async renderRanking(ctx) {
        const data = await API.getAdminCommercialRanking({ month: ctx.month });
        const UI = AdminView.ui();
        const list = data.ranking || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Ranking de Representantes Comerciais',
                subtitle: 'Classificação por cadastros efetivamente pagos, oficinas ativas na carteira e comissões confirmadas.'
            })}

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: list,
                    emptyTitle: 'Ranking vazio',
                    emptySubtitle: 'Nenhum representante cadastrado até o momento.',
                    columns: [
                        { key: 'rank', label: 'Pos.', tdClass: 'adm-mono', render: r => `<strong class="${r.rank <= 3 ? 'adm-text-accent' : 'adm-text-muted'}">#${r.rank}</strong>` },
                        { key: 'rep_code', label: 'Código', tdClass: 'adm-mono adm-text-accent', render: r => `<strong>${esc(r.rep_code)}</strong>` },
                        { key: 'name', label: 'Representante', render: r => `<a href="javascript:void(0)" class="adm-link" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a>` },
                        { key: 'state', label: 'UF', render: r => esc(r.state || '-') },
                        { key: 'status', label: 'Status', render: r => AdminView.statusBadge(r.status) },
                        { key: 'active_workshops_count', label: 'Oficinas Ativas', align: 'right', tdClass: 'adm-mono', render: r => `${num(r.active_workshops_count)} / ${num(r.linked_workshops_count)}` },
                        { key: 'clients_registered_count', label: 'Clientes Únicos', align: 'right', tdClass: 'adm-num', render: r => num(r.clients_registered_count) },
                        { key: 'paid_registrations_count', label: 'Cadastros Pagos', align: 'right', tdClass: 'adm-num adm-text-success', render: r => num(r.paid_registrations_count) },
                        { key: 'confirmed_commissions_cents', label: 'Comissões Confirmadas', align: 'right', tdClass: 'adm-money', render: r => brl(r.confirmed_commissions_cents) },
                        { key: 'next_payout_cents', label: 'Próx. Pagamento', align: 'right', tdClass: 'adm-money adm-text-accent', render: r => brl(r.next_payout_cents) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 5. METAS COMERCIAIS
    // --------------------------------------------------------------------------
    async renderCommercialGoals() {
        const data = await API.getAdminRepresentativesSummary({ page: 1, page_size: 100 });
        const UI = AdminView.ui();
        const list = data.items || [];
        const esc = AdminView.esc;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Metas Comerciais & Limites de Carteira',
                subtitle: 'Defina o limite de oficinas por representante e as metas mensais de expansão e ativações pagas.'
            })}

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: list,
                    emptyTitle: 'Sem representantes cadastrados',
                    emptySubtitle: 'Cadastre ou aprove representantes para configurar metas individuais.',
                    columns: [
                        { key: 'rep_code', label: 'Código', tdClass: 'adm-mono adm-text-accent', render: r => `<strong>${esc(r.rep_code)}</strong>` },
                        { key: 'name', label: 'Representante', render: r => `<span class="adm-cell-title">${esc(r.name)}</span>` },
                        { key: 'status', label: 'Status', render: r => AdminView.statusBadge(r.status) },
                        { key: 'linked_workshops_count', label: 'Carteira Atual', align: 'right', tdClass: 'adm-num', render: r => num(r.linked_workshops_count) },
                        { key: 'max_workshops_limit', label: 'Limite Máx. Oficinas', align: 'right', tdClass: 'adm-num', render: r => num(r.max_workshops_limit) },
                        { key: 'monthly_goal_workshops', label: 'Meta Mensal Oficinas', align: 'right', tdClass: 'adm-num', render: r => num(r.monthly_goal_workshops) },
                        { key: 'monthly_goal_activations', label: 'Meta Mensal Ativações', align: 'right', tdClass: 'adm-num', render: r => num(r.monthly_goal_activations) },
                        { key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell', render: r => `<button type="button" class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.openGoalsModal('${esc(r.id)}', '${esc(r.name)}', ${r.max_workshops_limit}, ${r.monthly_goal_workshops}, ${r.monthly_goal_activations})">Editar Metas</button>` }
                    ]
                })}
            </div>
        `;
    },

    openGoalsModal(repId, repName, maxWs, goalWs, goalAct) {
        AdminView.openModal({
            title: `Metas Comerciais — ${repName}`,
            body: `
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label for="goal-max-ws">Limite Máximo de Oficinas na Carteira</label>
                        <input type="number" id="goal-max-ws" class="adm-input" min="1" value="${maxWs || 15}" />
                    </div>
                    <div class="adm-field">
                        <label for="goal-mo-ws">Meta Mensal de Novas Oficinas</label>
                        <input type="number" id="goal-mo-ws" class="adm-input" min="1" value="${goalWs || 5}" />
                    </div>
                    <div class="adm-field">
                        <label for="goal-mo-act">Meta Mensal de Ativações Pagas</label>
                        <input type="number" id="goal-mo-act" class="adm-input" min="1" value="${goalAct || 220}" />
                    </div>
                </div>
            `,
            confirmLabel: 'Salvar Metas',
            onConfirm: async () => {
                await API.updateRepresentativeGoals(repId, {
                    max_workshops_limit: Number(document.getElementById('goal-max-ws')?.value || 15),
                    monthly_goal_workshops: Number(document.getElementById('goal-mo-ws')?.value || 5),
                    monthly_goal_activations: Number(document.getElementById('goal-mo-act')?.value || 220)
                });
                AdminView.toast('Metas comerciais atualizadas com sucesso.');
                await AdminView.reloadCurrentScreen();
            }
        });
    }
};
