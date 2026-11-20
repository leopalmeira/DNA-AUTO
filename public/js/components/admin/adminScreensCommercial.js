// ==============================================================================
// DNA AUTO — CENTRAL ADMINISTRATIVA V2: GESTÃO COMERCIAL & REPRESENTANTES
// Fases 2, 4 e 5
// ==============================================================================

const AdminScreensCommercial = {
    lastRepsData: [],

    // --------------------------------------------------------------------------
    // 1. REPRESENTANTES COMERCIAIS (FASE 4 — Tabela com 17 colunas + CSV + Ações)
    // --------------------------------------------------------------------------
    async renderRepresentatives(ctx) {
        const f = ctx.params || {};
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
            page_size: 25
        });
        this.lastRepsData = data.items || [];
        const cnt = data.counts || {};
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        const sortHeader = (field, label) => {
            const isActive = f.sort_by === field;
            const nextDir = isActive && f.sort_dir === 'desc' ? 'asc' : 'desc';
            const arrow = isActive ? (f.sort_dir === 'asc' ? ' ▲' : ' ▼') : '';
            return `<th style="cursor:pointer;" onclick="AdminView.updateParams({ sort_by: '${field}', sort_dir: '${nextDir}', page: 1 })">${esc(label)}${arrow}</th>`;
        };

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Representantes Comerciais (${cnt.total || 0})</h2>
                    <p>Gestão comercial completa da rede de representantes, aprovação, carteira de oficinas e extrato de comissões.</p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.exportRepresentativesCsv()">⬇ Exportar CSV</button>
                </div>
            </div>

            <div class="adm-kpi-grid" style="grid-template-columns:repeat(4, minmax(0, 1fr));">
                <div class="adm-kpi-card clickable tone-blue" onclick="AdminView.updateParams({ status: 'ALL', page: 1 })"><div class="adm-kpi-label">Todos</div><div class="adm-kpi-value">${cnt.total || 0}</div><div class="adm-kpi-sub">Total cadastrado</div></div>
                <div class="adm-kpi-card clickable tone-success" onclick="AdminView.updateParams({ status: 'ACTIVE', page: 1 })"><div class="adm-kpi-label">Ativos</div><div class="adm-kpi-value">${cnt.active || 0}</div><div class="adm-kpi-sub">Com carteira habilitada</div></div>
                <div class="adm-kpi-card clickable tone-warning" onclick="AdminView.updateParams({ status: 'PENDING_APPROVAL', page: 1 })"><div class="adm-kpi-label">Pendentes</div><div class="adm-kpi-value">${cnt.pending || 0}</div><div class="adm-kpi-sub">Aguardando aprovação</div></div>
                <div class="adm-kpi-card clickable tone-danger" onclick="AdminView.updateParams({ status: 'SUSPENDED', page: 1 })"><div class="adm-kpi-label">Suspensos / Recusados</div><div class="adm-kpi-value">${(cnt.suspended || 0) + (cnt.rejected || 0)}</div><div class="adm-kpi-sub">${cnt.suspended || 0} susp. • ${cnt.rejected || 0} rec.</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" id="rep-search-q" class="adm-input" style="min-width:220px;" placeholder="Buscar código, nome, e-mail, tel..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensCommercial.applyRepFilters()" />
                    <select id="rep-filter-status" class="adm-select" onchange="AdminScreensCommercial.applyRepFilters()">
                        <option value="ALL" ${(!f.status || f.status === 'ALL') ? 'selected' : ''}>Status: Todos</option>
                        <option value="ACTIVE" ${f.status === 'ACTIVE' ? 'selected' : ''}>Ativos</option>
                        <option value="PENDING_APPROVAL" ${(f.status === 'PENDING_APPROVAL' || f.status === 'PENDING') ? 'selected' : ''}>Pendentes</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensos</option>
                        <option value="REJECTED" ${f.status === 'REJECTED' ? 'selected' : ''}>Rejeitados</option>
                    </select>
                    <select id="rep-filter-state" class="adm-select" onchange="AdminScreensCommercial.applyRepFilters()">
                        <option value="ALL">Estado: Todos</option>
                        ${(data.states_available || []).map(uf => `<option value="${esc(uf)}" ${f.state === uf ? 'selected' : ''}>${esc(uf)}</option>`).join('')}
                    </select>
                    <input type="text" id="rep-filter-city" class="adm-input" style="width:130px;" placeholder="Cidade..." value="${esc(f.city || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensCommercial.applyRepFilters()" />
                    <select id="rep-filter-period" class="adm-select" onchange="AdminScreensCommercial.applyRepFilters()">
                        <option value="all" ${(!f.period || f.period === 'all') ? 'selected' : ''}>Período: Todos</option>
                        <option value="current_month" ${f.period === 'current_month' ? 'selected' : ''}>Mês Atual</option>
                        <option value="last_30_days" ${f.period === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="last_90_days" ${f.period === 'last_90_days' ? 'selected' : ''}>Últimos 90 dias</option>
                        <option value="current_year" ${f.period === 'current_year' ? 'selected' : ''}>Ano Atual</option>
                    </select>
                    <select id="rep-filter-prod" class="adm-select" onchange="AdminScreensCommercial.applyRepFilters()">
                        <option value="ALL" ${(!f.productivity || f.productivity === 'ALL') ? 'selected' : ''}>Produtividade: Todas</option>
                        <option value="HIGH" ${f.productivity === 'HIGH' ? 'selected' : ''}>Alta Produtividade</option>
                        <option value="WITH_SALES" ${f.productivity === 'WITH_SALES' ? 'selected' : ''}>Com Cadastros Pagos</option>
                        <option value="ZERO_SALES" ${f.productivity === 'ZERO_SALES' ? 'selected' : ''}>Sem Vendas</option>
                    </select>
                    <button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensCommercial.applyRepFilters()">Aplicar</button>
                </div>

                ${(data.items || []).length === 0 ? `<div class="adm-empty"><strong>Nenhum representante encontrado</strong>Não há representantes comerciais que correspondam aos filtros aplicados.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table" data-testid="representatives-table">
                            <thead>
                                <tr>
                                    ${sortHeader('rep_code', 'Código')}
                                    ${sortHeader('name', 'Nome Completo')}
                                    <th>E-mail</th>
                                    <th>Telefone</th>
                                    ${sortHeader('city', 'Cidade')}
                                    ${sortHeader('state', 'UF')}
                                    ${sortHeader('created_at', 'Cadastro')}
                                    ${sortHeader('status', 'Status')}
                                    ${sortHeader('linked_workshops_count', 'Ofic. Vinc.')}
                                    ${sortHeader('active_workshops_count', 'Ofic. Ativas')}
                                    ${sortHeader('clients_registered_count', 'Clientes')}
                                    ${sortHeader('paid_registrations_count', 'Pagos')}
                                    ${sortHeader('projected_commissions_cents', 'Com. Prevista')}
                                    ${sortHeader('confirmed_commissions_cents', 'Com. Confirmada')}
                                    ${sortHeader('paid_commissions_cents', 'Total Pago')}
                                    ${sortHeader('pending_balance_cents', 'Saldo Pendente')}
                                    ${sortHeader('next_payout_cents', 'Próx. Pagamento')}
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(r => `
                                    <tr>
                                        <td class="adm-mono" style="color:#00d4ff; font-weight:700; cursor:pointer;" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.rep_code)}</td>
                                        <td><a href="javascript:void(0)" style="color:#fff; font-weight:700; text-decoration:none;" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a></td>
                                        <td style="font-size:11.5px;">${esc(r.email)}</td>
                                        <td class="adm-mono" style="font-size:11.5px;">${esc(r.phone || '-')}</td>
                                        <td>${esc(r.city || '-')}</td>
                                        <td>${esc(r.state || '-')}</td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(r.created_at))}</td>
                                        <td>${AdminView.statusBadge(r.status)}</td>
                                        <td class="adm-mono">${r.linked_workshops_count}</td>
                                        <td class="adm-mono" style="color:#34d399;">${r.active_workshops_count}</td>
                                        <td class="adm-mono">${r.clients_registered_count}</td>
                                        <td class="adm-mono" style="font-weight:700;">${r.paid_registrations_count}</td>
                                        <td class="adm-mono" style="color:#94a3b8;">${brl(r.projected_commissions_cents)}</td>
                                        <td class="adm-mono" style="color:#34d399;">${brl(r.confirmed_commissions_cents)}</td>
                                        <td class="adm-mono" style="color:#38bdf8;">${brl(r.paid_commissions_cents)}</td>
                                        <td class="adm-mono" style="color:#fbbf24; font-weight:700;">${brl(r.pending_balance_cents)}</td>
                                        <td class="adm-mono" style="color:#ffd21c; font-weight:800;">${brl(r.next_payout_cents)}</td>
                                        <td style="white-space:nowrap;">
                                            <button class="adm-btn adm-btn-sm" onclick="AdminView.openRepresentative('${esc(r.id)}')">Ficha</button>
                                            ${r.status === 'PENDING_APPROVAL' ? `
                                                <button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'approve')">Aprovar</button>
                                                <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reject')">Rejeitar</button>
                                            ` : r.status === 'ACTIVE' ? `
                                                <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'suspend')">Suspender</button>
                                            ` : `
                                                <button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(r.id)}', 'reactivate')">Reativar</button>
                                            `}
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
            alert('Não há representantes listados para exportar.');
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
    },

    async changeRepStatus(id, action) {
        const labels = {
            approve: 'aprovar este representante (habilitar carteira comercial)',
            reject: 'rejeitar o cadastro deste representante',
            suspend: 'suspender este representante',
            reactivate: 'reativar este representante'
        };
        const justification = prompt(`Confirme o motivo administrativo para ${labels[action] || action}:`, `Ação executada via Central Administrativa (${action})`);
        if (justification === null) return;
        try {
            if (action === 'approve') await API.approveRepresentative(id, justification);
            else if (action === 'reject') await API.rejectRepresentative(id, justification);
            else if (action === 'suspend') await API.suspendRepresentative(id, justification);
            else if (action === 'reactivate') await API.reactivateRepresentative(id, justification);
            AdminView.toast('Status do representante atualizado com auditoria.');
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
    },

    // --------------------------------------------------------------------------
    // 1B. PÁGINA INDIVIDUAL DO REPRESENTANTE (FASE 4 — 7 BLOCOS OBRIGATÓRIOS)
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
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

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
                        <button class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.openGoalsModal('${esc(p.id)}', '${esc(p.name)}', ${p.max_workshops_limit}, ${p.monthly_goal_workshops}, ${p.monthly_goal_activations})">Editar Metas / Limite</button>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-chain-box"><strong>Código:</strong> <span class="adm-mono" style="color:#00d4ff;">${esc(p.rep_code)}</span><br/><strong>Nome:</strong> ${esc(p.name)}<br/><strong>Documento (Mascarado):</strong> <span class="adm-mono">${esc(p.cpf_cnpj_masked)}</span><br/><strong>Status:</strong> ${AdminView.statusBadge(p.status)}</div>
                        <div class="adm-chain-box"><strong>E-mail:</strong> ${esc(p.email)}<br/><strong>Telefone:</strong> <span class="adm-mono">${esc(p.phone || '-')}</span><br/><strong>Cidade/UF:</strong> ${esc(p.city || '-')}/${esc(p.state || '-')}<br/><strong>Chave PIX (Mascarada):</strong> <span class="adm-mono">${esc(p.pix_key_masked)}</span></div>
                        <div class="adm-chain-box"><strong>Limite de Carteira:</strong> ${p.max_workshops_limit} oficinas<br/><strong>Meta Mensal Oficinas:</strong> ${p.monthly_goal_workshops}<br/><strong>Meta Mensal Ativações:</strong> ${p.monthly_goal_activations}</div>
                        <div class="adm-chain-box"><strong>Cadastro em:</strong> ${esc(AdminView.formatDateTime(p.created_at))}<br/><strong>Links Compartilhados:</strong> ${p.links_shared_count || 0}<br/><strong>Treinamento:</strong> ${p.training_completed ? 'Concluído' : 'Em andamento'}</div>
                    </div>
                </div>
            `;
        } else if (tab === 'portfolio') {
            const wsList = pf.workshops || [];
            tabHtml = `
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Carteira Comercial (${wsList.length} / ${pf.max_limit} oficinas)</h3></div>
                    ${wsList.length === 0 ? `<div class="adm-empty"><strong>Carteira vazia</strong>Este representante ainda não possui oficinas vinculadas.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Oficina</th><th>Cidade/UF</th><th>Status</th><th>Vínculo / Validade 24m</th><th>Clientes Únicos</th><th>Veículos</th><th>Pagos</th><th>Comissões Conf.</th></tr></thead>
                                <tbody>
                                    ${wsList.map(w => `
                                        <tr>
                                            <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a><div class="adm-mono" style="font-size:11px; color:#64748b;">${esc(w.cnpj || '')}</div></td>
                                            <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                            <td>${AdminView.statusBadge(w.workshop_status)}</td>
                                            <td class="adm-mono" style="font-size:11.5px;">${esc(AdminView.formatDate(w.linked_at))} → ${esc(AdminView.formatDate(w.valid_until))}</td>
                                            <td class="adm-mono">${w.unique_clients_count || 0}</td>
                                            <td class="adm-mono">${w.vehicles_count || 0}</td>
                                            <td class="adm-mono" style="color:#34d399; font-weight:700;">${w.paid_registrations_count || 0}</td>
                                            <td class="adm-mono" style="color:#ffd21c; font-weight:700;">${brl(w.confirmed_commissions_cents)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        } else if (tab === 'clients') {
            const byWs = ca.by_workshop || [];
            tabHtml = `
                <div class="adm-kpi-grid" style="grid-template-columns:repeat(3, minmax(0, 1fr));">
                    <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Clientes Únicos Captados</div><div class="adm-kpi-value">${ca.unique_clients_count || 0}</div><div class="adm-kpi-sub">Desduplicados na carteira</div></div>
                    <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Total de Ativações</div><div class="adm-kpi-value">${ca.total_activations_count || 0}</div><div class="adm-kpi-sub">Incluindo múltiplos veículos</div></div>
                    <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Cadastros Efetivamente Pagos</div><div class="adm-kpi-value">${ca.paid_activations_count || 0}</div><div class="adm-kpi-sub">Liquidados e comissionados</div></div>
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Captação de Clientes por Oficina da Carteira</h3></div>
                    ${byWs.length === 0 ? `<div class="adm-empty"><strong>Sem captação</strong>Nenhuma oficina vinculada registrou clientes ainda.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Oficina</th><th>Cidade/UF</th><th>Clientes Únicos</th><th>Ativações Totais</th><th>Cadastros Pagos</th></tr></thead>
                                <tbody>
                                    ${byWs.map(w => `
                                        <tr>
                                            <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a></td>
                                            <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                            <td class="adm-mono">${w.unique_clients_count || 0}</td>
                                            <td class="adm-mono">${w.total_activations_count || 0}</td>
                                            <td class="adm-mono" style="color:#34d399; font-weight:700;">${w.paid_activations_count || 0}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        } else if (tab === 'productivity') {
            const mp = pr.monthly_performance || [];
            tabHtml = `
                <div class="adm-charts-grid">
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Cadastros Pagos por Mês (Últimos 6 meses)</h3></div>
                        ${AdminCharts.renderBarChart(mp, { valueKey: 'paid_registrations', secondaryKey: 'workshops_linked', labelKey: 'month', color: '#00D4FF', secondaryColor: '#FFD21C' })}
                    </div>
                    <div class="adm-card">
                        <div class="adm-card-header"><h3 class="adm-card-title">Comissões Confirmadas vs Pagas por Mês</h3></div>
                        ${AdminCharts.renderBarChart(mp, { valueKey: 'confirmed_cents', secondaryKey: 'paid_cents', labelKey: 'month', color: '#10B981', secondaryColor: '#3B82F6', isCurrency: true })}
                    </div>
                </div>
            `;
        } else if (tab === 'financial') {
            const comms = fin.commissions || [];
            tabHtml = `
                <div class="adm-kpi-grid">
                    <div class="adm-kpi-card tone-muted"><div class="adm-kpi-label">Previstas (Projetadas)</div><div class="adm-kpi-value">${brl(fin.projected_cents)}</div><div class="adm-kpi-sub">PIX ainda pendente</div></div>
                    <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Confirmadas (Total)</div><div class="adm-kpi-value">${brl(fin.confirmed_total_cents)}</div><div class="adm-kpi-sub">Elegível aberto: ${brl(fin.eligible_open_cents)}</div></div>
                    <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Já Pagas</div><div class="adm-kpi-value">${brl(fin.paid_cents)}</div><div class="adm-kpi-sub">Repasses liquidados</div></div>
                    <div class="adm-kpi-card tone-danger"><div class="adm-kpi-label">Estornadas / Contestadas</div><div class="adm-kpi-value">${brl(fin.refunded_cents)}</div><div class="adm-kpi-sub">Bloqueadas: ${brl(fin.blocked_dispute_cents)} • Ajustes: ${brl(fin.open_adjustments_cents)}</div></div>
                </div>
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Extrato de Comissões do Representante (${comms.length})</h3></div>
                    ${comms.length === 0 ? `<div class="adm-empty"><strong>Sem comissões lançadas</strong>Ainda não existem lançamentos de comissão para este representante.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Competência</th><th>Oficina</th><th>Placa</th><th>Política</th><th>Valor</th><th>Status</th><th>Pagamento</th></tr></thead>
                                <tbody>
                                    ${comms.map(c => `
                                        <tr>
                                            <td class="adm-mono">${esc(c.competence_month || '-')}</td>
                                            <td>${esc(c.workshop_name)}</td>
                                            <td class="adm-mono">${esc(c.license_plate || '-')}</td>
                                            <td class="adm-mono" style="font-size:11px;">${esc(c.policy_version_code || 'V1')}</td>
                                            <td class="adm-mono" style="font-weight:700;">${brl(c.commission_amount_cents)}</td>
                                            <td>${AdminView.statusBadge(c.status)} ${c.dispute_status === 'DISPUTED' ? '<span class="adm-badge adm-badge-danger">CONTESTADA</span>' : ''}</td>
                                            <td class="adm-mono">${esc(c.payout_month || '-')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        } else if (tab === 'next_payout') {
            const batches = data.payouts || [];
            tabHtml = `
                <div class="adm-kpi-grid">
                    <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Valor Líquido Elegível (${esc(np.competence_month)})</div><div class="adm-kpi-value">${brl(np.net_eligible_cents)}</div><div class="adm-kpi-sub">Previsto p/ ${esc(np.scheduled_payout_date)}</div></div>
                    <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Comissões Confirmadas</div><div class="adm-kpi-value">${np.eligible_commissions_count || 0}</div><div class="adm-kpi-sub">Bruto elegível: ${brl(np.eligible_gross_cents)}</div></div>
                    <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">Projetadas (Excluídas do Ciclo)</div><div class="adm-kpi-value">${brl(np.projected_excluded_cents)}</div><div class="adm-kpi-sub">Aguardando confirmação PIX</div></div>
                    <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Ajustes / Status Lote</div><div class="adm-kpi-value">${brl(np.adjustments_cents)}</div><div class="adm-kpi-sub">${esc(np.batch_status)}</div></div>
                </div>
                <div class="adm-card">
                    <div class="adm-card-header">
                        <h3 class="adm-card-title">Histórico de Lotes de Pagamento (${batches.length})</h3>
                        <button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.navigate('payouts')">Ir para Fechamento & Pagamentos →</button>
                    </div>
                    ${batches.length === 0 ? `<div class="adm-empty"><strong>Nenhum lote fechado</strong>Os lotes aparecem aqui após o fechamento da competência.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Lote</th><th>Competência</th><th>Comissões</th><th>Líquido</th><th>Status</th><th>Referência / Data</th></tr></thead>
                                <tbody>
                                    ${batches.map(b => `
                                        <tr>
                                            <td class="adm-mono">${esc(b.id)}</td>
                                            <td class="adm-mono">${esc(b.competence_month)} → ${esc(b.payout_month)}</td>
                                            <td class="adm-mono">${b.commissions_count}</td>
                                            <td class="adm-mono" style="font-weight:700;">${brl(b.net_amount_cents)}</td>
                                            <td>${AdminView.statusBadge(b.status)}</td>
                                            <td class="adm-mono">${esc(b.transfer_reference || '-')} ${b.transfer_date ? `(${esc(b.transfer_date)})` : ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        } else {
            const hist = data.history || [];
            tabHtml = `
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Histórico Cronológico e Auditoria (${hist.length})</h3></div>
                    ${hist.length === 0 ? `<div class="adm-empty"><strong>Sem eventos registrados</strong>Nenhuma movimentação auditada para este representante.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Data/Hora</th><th>Ação</th><th>Ator</th><th>Justificativa</th></tr></thead>
                                <tbody>
                                    ${hist.map(h => `
                                        <tr>
                                            <td class="adm-mono">${esc(AdminView.formatDateTime(h.created_at))}</td>
                                            <td><span class="adm-badge adm-badge-cyan">${esc(h.action)}</span></td>
                                            <td class="adm-mono">${esc(h.actor_role || '')} (${esc(h.actor_id || '-')})</td>
                                            <td>${esc(h.justification || '-')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        }

        return `
            <div class="adm-section-head">
                <div>
                    <div style="margin-bottom:6px;"><button class="adm-btn adm-btn-sm" onclick="AdminView.navigate('representatives')">← Voltar para Representantes</button></div>
                    <h2>${esc(p.name)} <span class="adm-mono" style="color:#00d4ff; font-size:16px;">${esc(p.rep_code)}</span> ${AdminView.statusBadge(p.status)}</h2>
                    <p>${esc(p.city || '-')}/${esc(p.state || '-')} • ${esc(p.email)} • ${esc(p.phone || '-')}</p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${p.status === 'PENDING_APPROVAL' ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'approve')">Aprovar</button><button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'reject')">Rejeitar</button>` : ''}
                    ${p.status === 'ACTIVE' ? `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'suspend')">Suspender</button>` : ''}
                    ${(p.status === 'SUSPENDED' || p.status === 'REJECTED') ? `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensCommercial.changeRepStatus('${esc(p.id)}', 'reactivate')">Reativar</button>` : ''}
                </div>
            </div>

            <div class="adm-subtabs">
                ${tabs.map(t => `<button class="adm-subtab ${tab === t.id ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: '${t.id}' })">${esc(t.label)}</button>`).join('')}
            </div>

            ${tabHtml}
        `;
    },

    // --------------------------------------------------------------------------
    // 2. CARTEIRAS DE OFICINAS (Vínculos + Reatribuição Administrativa Auditada)
    // --------------------------------------------------------------------------
    async renderPortfolios(ctx) {
        const f = ctx.params || {};
        const data = await API.getAdminWorkshopsSummary({ referral: f.referral || 'LINKED', q: f.q || '', page: f.page || 1, page_size: 25 });
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Carteiras de Oficinas — Vínculos Comerciais</h2>
                    <p>Controle da cadeia <strong>REPRESENTANTE → OFICINA → CADASTRO → PAGAMENTO → COMISSÃO</strong>. Reatribuições exigem justificativa auditada e não alteram retroativamente comissões já geradas.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <select class="adm-select" onchange="AdminView.updateParams({ referral: this.value, page: 1 })">
                        <option value="LINKED" ${(!f.referral || f.referral === 'LINKED') ? 'selected' : ''}>Somente Vinculadas a Representantes</option>
                        <option value="ALL" ${f.referral === 'ALL' ? 'selected' : ''}>Todas as Oficinas</option>
                        <option value="DIRECT" ${f.referral === 'DIRECT' ? 'selected' : ''}>Sem Representante (Diretas)</option>
                    </select>
                    <input type="text" class="adm-input" style="min-width:220px;" placeholder="Buscar oficina ou código..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminView.updateParams({ q: this.value, page: 1 })" />
                    <button class="adm-btn adm-btn-sm" onclick="AdminView.updateParams({ q: this.parentNode.querySelector('input').value, page: 1 })">Filtrar</button>
                </div>

                ${(data.items || []).length === 0 ? `<div class="adm-empty"><strong>Nenhum vínculo comercial encontrado</strong>Não existem oficinas vinculadas para o filtro selecionado.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Representante</th><th>Oficina</th><th>Início Vínculo</th><th>Validade (24m)</th><th>Clientes Únicos</th><th>Pagos</th><th>Comissões</th><th>Ações</th></tr></thead>
                            <tbody>
                                ${data.items.map(w => `
                                    <tr>
                                        <td>${w.rep_code ? `<a href="javascript:void(0)" style="color:#00d4ff; font-weight:700;" onclick="AdminView.openRepresentative('${esc(w.representative_id)}')">${esc(w.rep_code)}</a><div style="font-size:11px; color:#94a3b8;">${esc(w.representative_name || '')}</div>` : '<span class="adm-badge adm-badge-muted">Direta</span>'}</td>
                                        <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openWorkshop('${esc(w.id)}')">${esc(w.trade_name)}</a><div style="font-size:11px; color:#64748b;">${esc(w.city || '-')}/${esc(w.state || '-')}</div></td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(w.referral_linked_at))}</td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(w.referral_valid_until))}</td>
                                        <td class="adm-mono">${w.unique_clients_count || 0}</td>
                                        <td class="adm-mono" style="color:#34d399; font-weight:700;">${w.paid_registrations_count || 0}</td>
                                        <td class="adm-mono" style="color:#ffd21c;">${brl(w.rep_commissions_generated_cents)}</td>
                                        <td style="white-space:nowrap;">
                                            <button class="adm-btn adm-btn-sm" onclick="AdminView.openWorkshop('${esc(w.id)}')">Detalhe</button>
                                            <button class="adm-btn adm-btn-sm adm-btn-gold" onclick="AdminScreensCommercial.openReassignModal('${esc(w.id)}', '${esc(w.trade_name)}', '${esc(w.rep_code || 'Nenhum')}')">Reatribuir</button>
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

    async openReassignModal(workshopId, workshopName, currentRepCode) {
        const repsRes = await API.getAdminRepresentativesSummary({ status: 'ACTIVE', page_size: 100 });
        const reps = repsRes.items || [];
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Reatribuir Vínculo Comercial — ${workshopName}`,
            body: `
                <div class="adm-chain-box" style="border-color:rgba(245,158,11,0.4);">
                    <strong>Regra de Integridade:</strong> Uma oficina nunca pode ter dois representantes simultâneos. Esta alteração grava auditoria completa e <strong>preserva intacta a titularidade de todas as comissões históricas anteriores</strong>.
                </div>
                <div class="adm-field">
                    <label>Vínculo Atual</label>
                    <input class="adm-input" value="${esc(currentRepCode)}" disabled />
                </div>
                <div class="adm-field">
                    <label>Novo Representante Responsável *</label>
                    <select id="reassign-new-rep" class="adm-select" style="width:100%;">
                        <option value="">Selecione um representante ativo...</option>
                        ${reps.map(r => `<option value="${esc(r.id)}">${esc(r.rep_code)} — ${esc(r.name)} (${esc(r.city || '-')}/${esc(r.state || '-')})</option>`).join('')}
                    </select>
                </div>
                <div class="adm-field">
                    <label>Justificativa Administrativa Obrigatória (mínimo 10 caracteres) *</label>
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
        const fn = data.funnel || {};
        const list = data.by_workshop || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Captação de Clientes & Funil de Convites</h2>
                    <p>Conversão de links de indicação comercial e desempenho de captação de clientes por oficina.</p>
                </div>
            </div>

            <div class="adm-kpi-grid" style="grid-template-columns:repeat(5, minmax(0, 1fr));">
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Convites Emitidos</div><div class="adm-kpi-value">${fn.total_invites || 0}</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Cliques em Links</div><div class="adm-kpi-value">${fn.total_clicks || 0}</div></div>
                <div class="adm-kpi-card tone-warning"><div class="adm-kpi-label">Acessados</div><div class="adm-kpi-value">${fn.accessed || 0}</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Cadastros Iniciados</div><div class="adm-kpi-value">${fn.started || 0}</div></div>
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Ativados</div><div class="adm-kpi-value">${fn.activated || 0}</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Captação por Oficina</h3></div>
                ${list.length === 0 ? `<div class="adm-empty"><strong>Sem dados de captação</strong>Nenhuma ativação registrada no período.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Oficina</th><th>Cidade/UF</th><th>Representante</th><th>Clientes Únicos</th><th>Ativações</th><th>Pagos</th></tr></thead>
                            <tbody>
                                ${list.map(w => `
                                    <tr>
                                        <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openWorkshop('${esc(w.workshop_id)}')">${esc(w.trade_name)}</a></td>
                                        <td>${esc(w.city || '-')}/${esc(w.state || '-')}</td>
                                        <td>${w.rep_code ? `<span class="adm-mono" style="color:#00d4ff;">${esc(w.rep_code)}</span> ${esc(w.representative_name || '')}` : 'Direta'}</td>
                                        <td class="adm-mono" style="font-weight:700;">${w.unique_clients || 0}</td>
                                        <td class="adm-mono">${w.activations_count || 0}</td>
                                        <td class="adm-mono" style="color:#34d399; font-weight:700;">${w.paid_activations_count || 0}</td>
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
    // 4. RANKING DE REPRESENTANTES
    // --------------------------------------------------------------------------
    async renderRanking(ctx) {
        const data = await API.getAdminCommercialRanking({ month: ctx.month });
        const list = data.ranking || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Ranking de Representantes Comerciais</h2>
                    <p>Classificação por cadastros efetivamente pagos, oficinas ativas na carteira e comissões confirmadas.</p>
                </div>
            </div>

            <div class="adm-card">
                ${list.length === 0 ? `<div class="adm-empty"><strong>Ranking vazio</strong>Nenhum representante cadastrado até o momento.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Pos.</th><th>Código</th><th>Representante</th><th>UF</th><th>Status</th><th>Oficinas Ativas</th><th>Clientes Únicos</th><th>Cadastros Pagos</th><th>Comissões Confirmadas</th><th>Próx. Pagamento</th></tr></thead>
                            <tbody>
                                ${list.map(r => `
                                    <tr>
                                        <td class="adm-mono" style="font-weight:800; color:${r.rank <= 3 ? '#ffd21c' : '#94a3b8'};">#${r.rank}</td>
                                        <td class="adm-mono" style="color:#00d4ff; font-weight:700;">${esc(r.rep_code)}</td>
                                        <td><a href="javascript:void(0)" style="color:#fff; font-weight:700;" onclick="AdminView.openRepresentative('${esc(r.id)}')">${esc(r.name)}</a></td>
                                        <td>${esc(r.state || '-')}</td>
                                        <td>${AdminView.statusBadge(r.status)}</td>
                                        <td class="adm-mono">${r.active_workshops_count} / ${r.linked_workshops_count}</td>
                                        <td class="adm-mono">${r.clients_registered_count}</td>
                                        <td class="adm-mono" style="color:#34d399; font-weight:800;">${r.paid_registrations_count}</td>
                                        <td class="adm-mono" style="font-weight:700;">${brl(r.confirmed_commissions_cents)}</td>
                                        <td class="adm-mono" style="color:#ffd21c;">${brl(r.next_payout_cents)}</td>
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
    // 5. METAS COMERCIAIS (Configuração por Representante)
    // --------------------------------------------------------------------------
    async renderCommercialGoals() {
        const data = await API.getAdminRepresentativesSummary({ page: 1, page_size: 100 });
        const list = data.items || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Metas Comerciais & Limites de Carteira</h2>
                    <p>Defina o limite de oficinas por representante e as metas mensais de expansão e ativações pagas.</p>
                </div>
            </div>

            <div class="adm-card">
                ${list.length === 0 ? `<div class="adm-empty"><strong>Sem representantes</strong>Cadastre ou aprove representantes para configurar metas individuais.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Código</th><th>Representante</th><th>Status</th><th>Carteira Atual</th><th>Limite Máx. Oficinas</th><th>Meta Mensal Oficinas</th><th>Meta Mensal Ativações</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${list.map(r => `
                                    <tr>
                                        <td class="adm-mono" style="color:#00d4ff; font-weight:700;">${esc(r.rep_code)}</td>
                                        <td><strong>${esc(r.name)}</strong></td>
                                        <td>${AdminView.statusBadge(r.status)}</td>
                                        <td class="adm-mono">${r.linked_workshops_count}</td>
                                        <td class="adm-mono">${r.max_workshops_limit}</td>
                                        <td class="adm-mono">${r.monthly_goal_workshops}</td>
                                        <td class="adm-mono">${r.monthly_goal_activations}</td>
                                        <td><button class="adm-btn adm-btn-sm" onclick="AdminScreensCommercial.openGoalsModal('${esc(r.id)}', '${esc(r.name)}', ${r.max_workshops_limit}, ${r.monthly_goal_workshops}, ${r.monthly_goal_activations})">Editar Metas</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    openGoalsModal(repId, repName, maxWs, goalWs, goalAct) {
        AdminView.openModal({
            title: `Metas Comerciais — ${repName}`,
            body: `
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>Limite Máximo de Oficinas na Carteira</label>
                        <input type="number" id="goal-max-ws" class="adm-input" min="1" value="${maxWs || 15}" />
                    </div>
                    <div class="adm-field">
                        <label>Meta Mensal de Novas Oficinas</label>
                        <input type="number" id="goal-mo-ws" class="adm-input" min="1" value="${goalWs || 5}" />
                    </div>
                    <div class="adm-field">
                        <label>Meta Mensal de Ativações Pagas</label>
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
