// ==============================================================================
// DNA AUTO — PAINEL ADMINISTRATIVO GERAL
// ==============================================================================

const AdminView = {
    async render() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Painel Administrativo da Rede DNA AUTO...
            </div>
        `;

        try {
            const [statsData, rankingData, plansData] = await Promise.all([
                API.getNetworkStats(),
                API.getWorkshopRanking(),
                API.getPricingPlans()
            ]);

            const net = statsData.network;

            container.innerHTML = `
                <!-- Cabeçalho Administrativo -->
                <div class="view-header">
                    <div class="view-header-title">
                        <h2>Painel Administrativo da Rede DNA AUTO</h2>
                        <p>Visão global, auditoria, governança de oficinas e métricas consolidadas da rede.</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                            🔎 ABRIR DOSSIÊ DO DNA (360°)
                        </button>
                    </div>
                </div>

                <!-- KPIs da Rede DNA AUTO -->
                <div class="grid-kpi">
                    <div class="kpi-card accent-cyan">
                        <div class="kpi-header">
                            <span class="kpi-title">Veículos na Rede</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.totalVehicles}</div>
                        <div class="kpi-footer">${net.vehiclesWithDna} com DNA Permanente Ativo</div>
                    </div>

                    <div class="kpi-card accent-primary">
                        <div class="kpi-header">
                            <span class="kpi-title">Oficinas Credenciadas</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.activeWorkshops}</div>
                        <div class="kpi-footer">${net.pendingWorkshops} aguardando homologação</div>
                    </div>

                    <div class="kpi-card accent-success">
                        <div class="kpi-header">
                            <span class="kpi-title">Serviços Comprovados</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.provenServices}</div>
                        <div class="kpi-footer">${net.totalServices} serviços registrados no total</div>
                    </div>

                    <div class="kpi-card accent-warning">
                        <div class="kpi-header">
                            <span class="kpi-title">Cidades Atendidas</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.citiesCount || 2}</div>
                        <div class="kpi-footer">Presença em expansão contínua</div>
                    </div>
                </div>

                <!-- Ranking das Oficinas Mais Ativas -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34c3.2-1.12 5.5-4.14 5.5-7.66H4.5c0 3.52 2.3 6.54 5.5 7.66Z"/></svg>
                            Ranking: Oficinas que Mais Expandem e Alimentam a Rede
                        </span>
                    </div>
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Oficina</th>
                                    <th>Cidade/UF</th>
                                    <th>DNAs Ativados</th>
                                    <th>Serviços Comprovados</th>
                                    <th>Taxa de Comprovação</th>
                                    <th>Status / Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rankingData.ranking.map(w => `
                                    <tr>
                                        <td>
                                            <strong style="color:#fff;">${w.trade_name}</strong>
                                            <div class="mono" style="font-size:11px; color:var(--text-muted);">${w.cnpj}</div>
                                        </td>
                                        <td>${w.city}/${w.state}</td>
                                        <td class="mono" style="font-size:15px; font-weight:700; color:var(--brand-cyan);">${w.dnas_activated}</td>
                                        <td class="mono" style="font-size:15px; font-weight:700; color:var(--proof-level-4);">${w.proven_services}</td>
                                        <td>
                                            <span class="badge-proof badge-proven">${w.proof_rate_percentage || 100}%</span>
                                        </td>
                                        <td>
                                            ${w.status === 'APPROVED' ? `
                                                <span class="badge-proof badge-proven">Credenciada</span>
                                            ` : `
                                                <button class="btn btn-sm btn-success" onclick="AdminView.approveWorkshop('${w.id}')">
                                                    Homologar Credenciamento
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modelo Comercial: Planos e Preços Configuráveis -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            Modelo Comercial: Planos de Ativação Configuráveis
                        </span>
                    </div>
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Plano</th>
                                    <th>Preço Balcão</th>
                                    <th>Preço Oficina</th>
                                    <th>Desconto</th>
                                    <th>Comissão Oficina</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${plansData.plans.map(p => `
                                    <tr>
                                        <td class="mono">${p.code}</td>
                                        <td>
                                            <strong>${p.title}</strong>
                                            <div style="font-size:11px; color:var(--text-dim);">${p.description || ''}</div>
                                        </td>
                                        <td class="mono">R$ ${(p.price_cents / 100).toFixed(2)}</td>
                                        <td class="mono" style="color:var(--brand-cyan);">R$ ${(p.workshop_price_cents / 100).toFixed(2)}</td>
                                        <td>${p.discount_percentage}%</td>
                                        <td>${p.commission_percentage}%</td>
                                        <td><span class="badge-proof badge-proven">Ativo</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Auditoria Geral do Sistema -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Auditoria Geral: Últimas Mutações no Sistema
                        </span>
                    </div>
                    <div id="admin-audit-table-box">
                        <button class="btn btn-sm btn-secondary" onclick="AdminView.loadAuditLogs()">
                            Atualizar Logs de Auditoria
                        </button>
                    </div>
                </div>
            `;

            // Carrega logs de auditoria
            this.loadAuditLogs();
        } catch (err) {
            console.error('Erro ao renderizar painel admin:', err);
            container.innerHTML = `<div class="panel-box">Erro ao carregar dados administrativos.</div>`;
        }
    },

    async approveWorkshop(workshopId) {
        if (!confirm('Deseja homologar o credenciamento desta oficina na rede DNA AUTO?')) return;
        try {
            await API.updateWorkshopStatus(workshopId, 'APPROVED');
            alert('Oficina credenciada com sucesso na rede!');
            this.render();
        } catch (err) {
            alert('Erro ao homologar oficina: ' + err.message);
        }
    },

    async loadAuditLogs() {
        const box = document.getElementById('admin-audit-table-box');
        if (!box) return;

        try {
            const res = await API.getAuditLogs({ limit: 8 });
            box.innerHTML = `
                <div class="table-responsive" style="margin-top:12px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Entidade</th>
                                <th>DNA Envolvido</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${res.logs.map(l => `
                                <tr>
                                    <td>${l.created_at}</td>
                                    <td><strong>${l.user_name || 'Sistema'}</strong> (${l.user_role})</td>
                                    <td><span class="mono" style="color:var(--brand-cyan);">${l.action}</span></td>
                                    <td>${l.entity_type}</td>
                                    <td class="mono">${l.vehicle_dna_code || '-'}</td>
                                    <td class="mono">${l.ip_address}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            box.innerHTML = `<div style="color:var(--status-rejected);">Erro ao carregar auditoria.</div>`;
        }
    }
};
