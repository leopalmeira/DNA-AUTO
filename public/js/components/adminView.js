// ==============================================================================
// DNA AUTO — PAINEL ADMINISTRATIVO GERAL (MATRIZ & GOVERNANÇA MULTI-TENANT)
// Gestão de Oficinas, Frota de Carros por Oficina, Faturamento Consolidado e Alertas WhatsApp
// ==============================================================================

const AdminView = {
    currentTab: 'dashboard', // 'dashboard', 'revenue', 'workshops', 'fleet', 'clients', 'whatsapp', 'audit'
    cacheData: null,
    fleetFilterWorkshopId: 'all',
    clientsFilterWorkshopId: 'all',

    async render(initialTab = null) {
        if (initialTab && typeof initialTab === 'string') {
            this.currentTab = initialTab;
        }

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="padding:50px 20px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                <strong style="color:#ffffff; font-size:15px;">Carregando ERP Central DNA AUTO...</strong>
                <p style="font-size:12px; margin-top:6px;">Consolidando métricas multi-tenant, frota, faturamento e oficinas.</p>
            </div>
        `;

        try {
            const [statsData, rankingData, plansData, alertsData, fleetData, clientsData] = await Promise.all([
                API.getNetworkStats(),
                API.getWorkshopRanking(),
                API.getPricingPlans(),
                API.getMaintenanceAlerts().catch(() => ({ totalAlerts: 0, alerts: [] })),
                API.getFleet().catch(() => ({ count: 0, vehicles: [] })),
                API.getAllClients().catch(() => ({ count: 0, clients: [] }))
            ]);

            this.cacheData = {
                stats: statsData,
                ranking: rankingData,
                plans: plansData,
                alerts: alertsData.alerts || [],
                fleet: fleetData.vehicles || [],
                clients: clientsData.clients || []
            };

            this.renderLayout();
            this.updateSidebarBadges();
        } catch (err) {
            console.error('Erro ao carregar dados do admin:', err);
            container.innerHTML = `
                <div class="panel-box" style="border:1px solid #ef4444; padding:30px; text-align:center;">
                    <div style="font-size:32px; margin-bottom:12px;">⚠️</div>
                    <h3 style="color:#ef4444; margin-bottom:8px;">Erro ao carregar o Painel Administrativo</h3>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">${err.message || 'Falha de comunicação com o servidor.'}</p>
                    <button class="btn btn-primary" onclick="AdminView.render()">Tentar Novamente</button>
                </div>
            `;
        }
    },

    updateSidebarBadges() {
        const net = this.cacheData?.stats?.network;
        if (!net) return;

        const elRev = document.getElementById('side-badge-revenue');
        if (elRev) elRev.textContent = `R$ ${((net.totalGrossRevenueCents || 0) / 100).toLocaleString('pt-BR', { notation: 'compact' })}`;

        const elWs = document.getElementById('side-badge-workshops');
        if (elWs) elWs.textContent = `${net.totalWorkshops || 0} Oficinas`;

        const elVeh = document.getElementById('side-badge-vehicles');
        if (elVeh) elVeh.textContent = `${net.totalVehicles || 0} Carros`;

        const elWa = document.getElementById('side-badge-whatsapp');
        if (elWa) elWa.textContent = `${this.cacheData.alerts.length} Alertas`;
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        // Atualiza botões da sidebar
        document.querySelectorAll('#nav-module-admin .nav-item[data-admin-tab]').forEach(item => {
            item.classList.toggle('active', item.dataset.adminTab === tabName);
        });

        // Atualiza abas no topo do painel
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        const content = document.getElementById('admin-tab-content');
        if (content && this.cacheData) {
            content.innerHTML = this.renderCurrentTabHtml();
        } else {
            this.renderLayout();
        }
    },

    renderLayout() {
        const container = document.getElementById('view-content');
        const net = this.cacheData.stats.network;

        container.innerHTML = `
            <!-- Topo do Módulo Administrativo -->
            <div class="view-header" style="margin-bottom:16px;">
                <div class="view-header-title">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="pulse-dot"></span>
                        <span style="font-size:11px; font-weight:800; letter-spacing:1px; color:var(--brand-gold); text-transform:uppercase;">MATRIZ DNA CENTRAL • GESTÃO MULTI-TENANT</span>
                    </div>
                    <h2 style="margin:4px 0;">Painel de Governança & Faturamento da Rede</h2>
                    <p style="margin:0; color:var(--text-muted); font-size:13px;">Supervisão de oficinas homologadas, carteira de clientes, faturamento em tempo real e automação WhatsApp.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <button class="btn btn-sm btn-cyan" onclick="App.switchView('landing')" title="Ver Landing Page pública">
                        🌟 Landing Page (R$ 59,90)
                    </button>
                    <button class="btn btn-sm" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')" style="background:rgba(255,210,28,0.15); color:var(--brand-gold); border:1px solid rgba(255,210,28,0.35);">
                        🔎 Dossiê 360° (Civic Demo)
                    </button>
                </div>
            </div>

            <!-- Navegação em Abas do Painel Administrativo -->
            <div class="admin-tabs-bar" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:10px; margin-bottom:20px; border-bottom:1px solid var(--border-subtle);">
                <button class="admin-tab-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard" onclick="AdminView.switchTab('dashboard')">
                    📊 Visão Executiva
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'revenue' ? 'active' : ''}" data-tab="revenue" onclick="AdminView.switchTab('revenue')">
                    💰 Faturamento (R$ ${(net.totalGrossRevenueCents / 100).toLocaleString('pt-BR', { notation: 'compact' })})
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'workshops' ? 'active' : ''}" data-tab="workshops" onclick="AdminView.switchTab('workshops')">
                    🏢 Oficinas Credenciadas (${net.totalWorkshops})
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'fleet' ? 'active' : ''}" data-tab="fleet" onclick="AdminView.switchTab('fleet')">
                    🚗 Frota por Oficina (${net.totalVehicles} Carros)
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'clients' ? 'active' : ''}" data-tab="clients" onclick="AdminView.switchTab('clients')">
                    👥 Carteira de Clientes (${this.cacheData.clients.length})
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'whatsapp' ? 'active' : ''}" data-tab="whatsapp" onclick="AdminView.switchTab('whatsapp')">
                    📲 Alertas WhatsApp (${this.cacheData.alerts.length})
                </button>
                <button class="admin-tab-btn ${this.currentTab === 'audit' ? 'active' : ''}" data-tab="audit" onclick="AdminView.switchTab('audit')">
                    🛡️ Auditoria
                </button>
            </div>

            <!-- Conteúdo Dinâmico da Aba Selecionada -->
            <div id="admin-tab-content">
                ${this.renderCurrentTabHtml()}
            </div>
        `;
    },

    renderCurrentTabHtml() {
        switch (this.currentTab) {
            case 'revenue':
                return this.renderRevenueTab();
            case 'workshops':
                return this.renderWorkshopsTab();
            case 'fleet':
                return this.renderFleetTab();
            case 'clients':
                return this.renderClientsTab();
            case 'whatsapp':
                return this.renderWhatsAppTab();
            case 'audit':
                return this.renderAuditTab();
            case 'dashboard':
            default:
                return this.renderDashboardTab();
        }
    },

    // ── 1. ABA DASHBOARD GERAL ──
    renderDashboardTab() {
        const net = this.cacheData.stats.network;
        const alerts = this.cacheData.alerts;

        return `
            <!-- 4 Cards Superiores de KPIs Estratégicos -->
            <div class="grid-kpi" style="margin-bottom:24px;">
                <!-- 1. Faturamento Total em R$ -->
                <div class="kpi-card accent-success" style="border-left: 4px solid #10b981; cursor:pointer;" onclick="AdminView.switchTab('revenue')">
                    <div class="kpi-header">
                        <span class="kpi-title">Faturamento da Plataforma</span>
                        <span class="kpi-icon" style="color:#10b981;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </span>
                    </div>
                    <div class="kpi-value" style="color:#10b981;">
                        R$ ${(net.totalGrossRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div class="kpi-footer" style="font-size:11.5px;">
                        DNA: R$ ${(net.dnaRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Serviços: R$ ${(net.servicesVolumeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <!-- 2. Total de Carros Cadastrados -->
                <div class="kpi-card accent-cyan" style="border-left: 4px solid #38bdf8; cursor:pointer;" onclick="AdminView.switchTab('fleet')">
                    <div class="kpi-header">
                        <span class="kpi-title">Total de Carros Cadastrados</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${net.totalVehicles}</div>
                    <div class="kpi-footer">
                        <strong style="color:var(--brand-gold);">${net.vehiclesWithDna}</strong> com DNA Ativo • ${net.vehiclesWithoutDna} aguardando ativação
                    </div>
                </div>

                <!-- 3. Oficinas Credenciadas -->
                <div class="kpi-card accent-primary" style="border-left: 4px solid var(--brand-cyan); cursor:pointer;" onclick="AdminView.switchTab('workshops')">
                    <div class="kpi-header">
                        <span class="kpi-title">Oficinas Credenciadas</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${net.totalWorkshops}</div>
                    <div class="kpi-footer">
                        <span style="color:#10b981; font-weight:600;">${net.activeWorkshops} Homologadas</span> • ${net.pendingWorkshops} Pendente
                    </div>
                </div>

                <!-- 4. Clientes na Rede -->
                <div class="kpi-card accent-warning" style="border-left: 4px solid #f59e0b; cursor:pointer;" onclick="AdminView.switchTab('clients')">
                    <div class="kpi-header">
                        <span class="kpi-title">Clientes Atendidos</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${net.totalClients || 3}</div>
                    <div class="kpi-footer">Proprietários com histórico ativo na rede</div>
                </div>
            </div>

            <!-- Resumo Rápido da Central WhatsApp -->
            <div class="panel-box" style="border: 1px solid rgba(37, 211, 102, 0.35); margin-bottom:24px;">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:18px;">📲</span>
                        <strong style="color:#25D366;">Alertas Preventivos WhatsApp Prontos (${alerts.length})</strong>
                    </span>
                    <button class="btn btn-sm btn-cyan" onclick="AdminView.switchTab('whatsapp')">
                        Ver Todos os Alertas →
                    </button>
                </div>
                <div style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
                    O sistema identificou veículos próximos da troca de óleo (intervalo >= 8.000 km) ou inspeção crítica de correia dentada (>= 50.000 km).
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    ${alerts.slice(0, 3).map(a => `
                        <div style="background:var(--bg-surface); padding:12px 16px; border-radius:8px; border:1px solid var(--border-subtle); flex:1; min-width:260px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <strong style="color:var(--brand-gold);">${a.licensePlate}</strong>
                                <span style="font-size:11px; color:#25D366; font-weight:700;">${a.serviceType}</span>
                            </div>
                            <div style="font-size:12px; color:#fff;">${a.ownerName} • ${a.vehicleModel}</div>
                            <div style="font-size:11px; color:var(--text-dim); margin:4px 0 10px;">${a.reason}</div>
                            <a href="${a.whatsappUrl}" target="_blank" class="btn btn-sm" style="background:#25D366; color:#05080D; font-weight:700; width:100%; text-decoration:none; display:flex; justify-content:center; gap:6px;">
                                <span>Disparar WhatsApp</span>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Tabela Rápida de Oficinas Credenciadas -->
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span>🏢</span>
                        <strong>Oficinas Homologadas na Rede (Multi-Tenant)</strong>
                    </span>
                    <button class="btn btn-sm btn-cyan" onclick="AdminView.switchTab('workshops')">
                        Gerenciar Oficinas →
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Oficina</th>
                                <th>Cidade/UF</th>
                                <th>Carros Atendidos</th>
                                <th>DNAs Emitidos</th>
                                <th>Faturamento Gerado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.cacheData.stats.growthByWorkshops.map(w => `
                                <tr>
                                    <td>
                                        <strong style="color:#ffffff;">${w.trade_name}</strong>
                                        <div class="mono" style="font-size:11px; color:var(--text-muted);">${w.cnpj}</div>
                                    </td>
                                    <td>${w.city}/${w.state}</td>
                                    <td class="mono" style="font-weight:700; color:var(--brand-cyan); font-size:14px;">${w.distinct_vehicles_serviced || 0} carros</td>
                                    <td class="mono" style="font-weight:700; color:var(--brand-gold); font-size:14px;">${w.dnas_activated}</td>
                                    <td class="mono" style="font-weight:700; color:#10b981; font-size:14px;">
                                        R$ ${((w.total_services_amount_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-cyan" onclick="AdminView.openWorkshopClientsModal('${w.id}')">
                                            👥 Clientes & Carros
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ── 2. ABA DE FATURAMENTO DETALHADO ──
    renderRevenueTab() {
        const net = this.cacheData.stats.network;
        const workshops = this.cacheData.stats.growthByWorkshops;

        return `
            <div class="panel-box" style="margin-bottom:24px;">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:22px;">💰</span>
                        <strong style="color:#10b981; font-size:16px;">Extrato Consolidado de Faturamento da Plataforma</strong>
                    </span>
                    <span class="badge-proof badge-proven">Atualizado em Tempo Real</span>
                </div>

                <div class="grid-kpi" style="margin-top:16px; margin-bottom:20px;">
                    <div class="kpi-card" style="border-left: 4px solid #10b981; background:rgba(16,185,129,0.06);">
                        <div class="kpi-title">Faturamento Bruto Consolidado</div>
                        <div class="kpi-value" style="color:#10b981; font-size:28px;">
                            R$ ${(net.totalGrossRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div class="kpi-footer">Total movimentado por ativações de DNA + serviços das oficinas</div>
                    </div>

                    <div class="kpi-card" style="border-left: 4px solid var(--brand-gold); background:rgba(255,210,28,0.06);">
                        <div class="kpi-title">Receita de Ativações DNA (R$ 59,90)</div>
                        <div class="kpi-value" style="color:var(--brand-gold); font-size:28px;">
                            R$ ${(net.dnaRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div class="kpi-footer">Passaportes digitais vitalícios emitidos</div>
                    </div>

                    <div class="kpi-card" style="border-left: 4px solid var(--brand-cyan); background:rgba(56,189,248,0.06);">
                        <div class="kpi-title">Volume de Serviços nas Oficinas</div>
                        <div class="kpi-value" style="color:var(--brand-cyan); font-size:28px;">
                            R$ ${(net.servicesVolumeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div class="kpi-footer">Movimentação mecânica total comprovada na rede</div>
                    </div>
                </div>

                <h4 style="color:#ffffff; margin:24px 0 12px; font-size:14px;">Divisão de Receitas e Desempenho Financeiro por Oficina Parceira</h4>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Oficina Credenciada</th>
                                <th>Cidade</th>
                                <th>Serviços Realizados</th>
                                <th>DNAs Emitidos</th>
                                <th>Volume de Serviços (R$)</th>
                                <th>Comissões Geradas (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workshops.map(w => {
                                const comm = (w.dnas_activated || 0) * 15; // R$ 15 de comissão por DNA
                                return `
                                    <tr>
                                        <td>
                                            <strong style="color:#fff;">${w.trade_name}</strong>
                                            <div class="mono" style="font-size:11px; color:var(--text-muted);">${w.cnpj}</div>
                                        </td>
                                        <td>${w.city}/${w.state}</td>
                                        <td class="mono" style="font-weight:700; color:var(--brand-cyan);">${w.services_recorded} ordens</td>
                                        <td class="mono" style="font-weight:700; color:var(--brand-gold);">${w.dnas_activated}</td>
                                        <td class="mono" style="font-weight:700; color:#10b981; font-size:14px;">
                                            R$ ${((w.total_services_amount_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td class="mono" style="font-weight:700; color:var(--brand-gold); font-size:14px;">
                                            R$ ${comm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ── 3. ABA DE OFICINAS MULTI-TENANT ──
    renderWorkshopsTab() {
        const workshops = this.cacheData.stats.growthByWorkshops;

        return `
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">🏢</span>
                        <strong>Gestão de Oficinas Credenciadas (Multi-Tenant)</strong>
                        <span class="badge-proof badge-proven">${workshops.length} Cadastradas</span>
                    </span>
                    <button class="btn btn-sm btn-cyan" onclick="App.switchView('login')">
                        + Cadastrar Nova Oficina
                    </button>
                </div>

                <div class="table-responsive" style="margin-top:16px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Oficina Parceira</th>
                                <th>Contato / Telefone</th>
                                <th>Localização</th>
                                <th>Carros Atendidos</th>
                                <th>Faturamento</th>
                                <th>Status de Homologação</th>
                                <th style="text-align:center;">Ações de Gestor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workshops.map(w => `
                                <tr>
                                    <td>
                                        <strong style="color:#ffffff; font-size:13.5px;">${w.trade_name}</strong>
                                        <div style="font-size:11px; color:var(--text-muted);">${w.company_name}</div>
                                        <div class="mono" style="font-size:10.5px; color:var(--brand-gold);">${w.cnpj}</div>
                                    </td>
                                    <td>
                                        <div style="font-size:12px; color:#fff;">${w.phone || '(11) 3456-7890'}</div>
                                        <div style="font-size:11px; color:var(--text-muted);">${w.email || 'contato@oficina.com.br'}</div>
                                    </td>
                                    <td>${w.city} / ${w.state}</td>
                                    <td class="mono" style="font-weight:700; color:var(--brand-cyan); font-size:14px;">
                                        ${w.distinct_vehicles_serviced || 0} veículos
                                    </td>
                                    <td class="mono" style="font-weight:700; color:#10b981; font-size:14px;">
                                        R$ ${((w.total_services_amount_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        ${w.status === 'APPROVED' ? `
                                            <span class="badge-proof badge-proven">✅ Homologada</span>
                                        ` : `
                                            <span class="badge-proof badge-warning">⏳ Pendente</span>
                                        `}
                                    </td>
                                    <td style="text-align:center;">
                                        <div style="display:flex; gap:6px; justify-content:center;">
                                            <button class="btn btn-sm btn-cyan" onclick="AdminView.openWorkshopClientsModal('${w.id}')" title="Ver clientes e carros atendidos">
                                                👥 Clientes & Carros
                                            </button>
                                            ${w.status === 'PENDING' ? `
                                                <button class="btn btn-sm btn-success" onclick="AdminView.approveWorkshop('${w.id}')" title="Homologar oficina na rede">
                                                    ✓ Homologar
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ── 4. ABA DE FROTA DE CARROS POR OFICINA (MULTI-TENANT) ──
    renderFleetTab() {
        const fleet = this.cacheData.fleet;
        const workshops = this.cacheData.stats.growthByWorkshops;

        const filteredFleet = this.fleetFilterWorkshopId === 'all'
            ? fleet
            : fleet.filter(v => v.workshop_id === this.fleetFilterWorkshopId);

        return `
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">🚗</span>
                        <strong>Frota Cadastrada por Oficina (Isolamento Multi-Tenant)</strong>
                        <span class="badge-proof badge-cyan">${filteredFleet.length} Veículos</span>
                    </span>

                    <!-- Filtro por Oficina Credenciada -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <label style="font-size:12px; color:var(--text-muted); font-weight:600;">Filtrar por Oficina:</label>
                        <select class="form-control" style="width:220px; padding:6px 10px; font-size:12px;" onchange="AdminView.changeFleetFilter(this.value)">
                            <option value="all" ${this.fleetFilterWorkshopId === 'all' ? 'selected' : ''}>Todas as Oficinas (Consolidado)</option>
                            ${workshops.map(w => `
                                <option value="${w.id}" ${this.fleetFilterWorkshopId === w.id ? 'selected' : ''}>${w.trade_name} (${w.city})</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="table-responsive" style="margin-top:16px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Veículo (Placa / Modelo)</th>
                                <th>Oficina Credenciada (Tenant)</th>
                                <th>Proprietário / Telefone</th>
                                <th>Código DNA</th>
                                <th>Km Atual</th>
                                <th>Serviços</th>
                                <th>Total Gasto</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredFleet.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">
                                        Nenhum veículo encontrado para a oficina selecionada.
                                    </td>
                                </tr>
                            ` : filteredFleet.map(v => `
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <div style="width:42px; height:32px; border-radius:4px; overflow:hidden; background:#111; flex-shrink:0;">
                                                <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=100'}" style="width:100%; height:100%; object-fit:cover;" />
                                            </div>
                                            <div>
                                                <strong style="color:var(--brand-gold); font-size:13.5px;">${v.license_plate}</strong>
                                                <div style="font-size:11.5px; color:#fff;">${v.brand} ${v.model} (${v.model_year})</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong style="color:var(--brand-cyan); font-size:12px;">${v.workshop_name}</strong>
                                        <div style="font-size:10.5px; color:var(--text-dim);">${v.workshop_city}</div>
                                    </td>
                                    <td>
                                        <div style="font-size:12px; color:#fff; font-weight:600;">${v.owner_name}</div>
                                        <div style="font-size:11px; color:#25D366; font-family:var(--font-mono);">${v.owner_phone}</div>
                                    </td>
                                    <td>
                                        ${v.dna_code ? `
                                            <span class="badge-proof badge-proven" style="font-family:var(--font-mono); font-size:11px;">
                                                ${v.dna_code}
                                            </span>
                                        ` : `
                                            <span class="badge-proof badge-warning">Aguardando Ativação</span>
                                        `}
                                    </td>
                                    <td class="mono" style="font-weight:700;">
                                        ${(v.current_mileage || 0).toLocaleString('pt-BR')} km
                                    </td>
                                    <td class="mono" style="color:var(--brand-cyan); font-weight:700;">
                                        ${v.services_count || 0}
                                    </td>
                                    <td class="mono" style="color:#10b981; font-weight:700;">
                                        R$ ${((v.total_maintenance_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('${v.dna_code || v.license_plate}')" title="Inspecionar Dossiê">
                                            🔎 Dossiê 360°
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    changeFleetFilter(workshopId) {
        this.fleetFilterWorkshopId = workshopId;
        this.switchTab('fleet');
    },

    // ── 5. ABA DE CARTEIRA DE CLIENTES ──
    renderClientsTab() {
        const clients = this.cacheData.clients;
        const workshops = this.cacheData.stats.growthByWorkshops;

        const filteredClients = this.clientsFilterWorkshopId === 'all'
            ? clients
            : clients.filter(c => c.workshop_id === this.clientsFilterWorkshopId);

        return `
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">👥</span>
                        <strong>Carteira de Clientes da Rede (Vinculados por Oficina)</strong>
                        <span class="badge-proof badge-warning">${filteredClients.length} Clientes</span>
                    </span>

                    <!-- Filtro por Oficina Credenciada -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <label style="font-size:12px; color:var(--text-muted); font-weight:600;">Filtrar por Oficina:</label>
                        <select class="form-control" style="width:220px; padding:6px 10px; font-size:12px;" onchange="AdminView.changeClientsFilter(this.value)">
                            <option value="all" ${this.clientsFilterWorkshopId === 'all' ? 'selected' : ''}>Todas as Oficinas</option>
                            ${workshops.map(w => `
                                <option value="${w.id}" ${this.clientsFilterWorkshopId === w.id ? 'selected' : ''}>${w.trade_name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="table-responsive" style="margin-top:16px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Nome do Cliente</th>
                                <th>E-mail</th>
                                <th>WhatsApp / Telefone</th>
                                <th>Oficina de Referência</th>
                                <th>Carros na Garagem</th>
                                <th>Serviços Feitos</th>
                                <th>Total Investido</th>
                                <th style="text-align:center;">Contato Rápido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredClients.map(c => {
                                const cleanPhone = String(c.phone || '').replace(/\D/g, '');
                                const waUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=Ol%C3%A1%20${encodeURIComponent(c.name)}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20do%20DNA%20AUTO!`;
                                return `
                                    <tr>
                                        <td><strong style="color:#fff;">${c.name}</strong></td>
                                        <td style="font-size:12px; color:var(--text-muted);">${c.email}</td>
                                        <td class="mono" style="color:#25D366; font-weight:700;">${c.phone || '(11) 98888-0000'}</td>
                                        <td><span style="color:var(--brand-cyan); font-weight:600;">${c.preferred_workshop_name}</span></td>
                                        <td class="mono" style="font-weight:700; color:var(--brand-gold);">${c.vehicles_count} veículo(s)</td>
                                        <td class="mono" style="font-weight:700;">${c.services_count}</td>
                                        <td class="mono" style="font-weight:700; color:#10b981;">
                                            R$ ${((c.total_spent_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style="text-align:center;">
                                            <a href="${waUrl}" target="_blank" class="btn btn-sm" style="background:#25D366; color:#05080D; font-weight:700; text-decoration:none; padding:4px 10px; border-radius:5px; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">
                                                <span>📲 WhatsApp</span>
                                            </a>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    changeClientsFilter(workshopId) {
        this.clientsFilterWorkshopId = workshopId;
        this.switchTab('clients');
    },

    // ── 6. ABA DE ALERTAS WHATSAPP ──
    renderWhatsAppTab() {
        const alerts = this.cacheData.alerts;

        return `
            <div class="panel-box" style="border: 1px solid rgba(37, 211, 102, 0.4);">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:22px;">📲</span>
                        <strong style="color:#25D366; font-size:16px;">Central de Alertas Preventivos WhatsApp (Óleo e Correias)</strong>
                        <span class="badge-proof badge-proven">${alerts.length} Notificações Prontas</span>
                    </span>
                    <span style="font-size:12px; color:var(--text-muted);">
                        Disparo direto sem custo de API externa via WhatsApp Web/App
                    </span>
                </div>

                <div class="table-responsive" style="margin-top:16px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Proprietário / WhatsApp</th>
                                <th>Veículo (Placa / Modelo)</th>
                                <th>Km Atual</th>
                                <th>Tipo de Revisão</th>
                                <th>Motivo Técnico do Alerta</th>
                                <th>Oficina Credenciada</th>
                                <th style="text-align:center;">Disparo Direto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alerts.map(a => `
                                <tr>
                                    <td>
                                        <strong style="color:#ffffff;">${a.ownerName}</strong>
                                        <div style="font-size:12px; color:#25D366; font-family:var(--font-mono);">${a.ownerPhone}</div>
                                    </td>
                                    <td>
                                        <strong style="color:var(--brand-gold);">${a.licensePlate}</strong>
                                        <div style="font-size:11.5px; color:var(--text-muted);">${a.vehicleModel}</div>
                                    </td>
                                    <td class="mono" style="font-weight:700;">
                                        ${a.currentMileage.toLocaleString('pt-BR')} km
                                    </td>
                                    <td>
                                        ${a.serviceType.includes('Óleo') ? `
                                            <span class="badge-proof badge-warning" style="background:rgba(255, 210, 28, 0.15); color:#FFD21C; border:1px solid #FFD21C;">
                                                🛢️ ${a.serviceType}
                                            </span>
                                        ` : `
                                            <span class="badge-proof badge-danger" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid #ef4444;">
                                                ⚙️ ${a.serviceType}
                                            </span>
                                        `}
                                    </td>
                                    <td style="font-size:12px; color:var(--text-muted); max-width:240px;">
                                        ${a.reason}
                                    </td>
                                    <td>
                                        <strong style="color:var(--brand-cyan); font-size:12px;">${a.workshopName}</strong>
                                    </td>
                                    <td style="text-align:center;">
                                        <a href="${a.whatsappUrl}" target="_blank" class="btn btn-sm"
                                           style="background:#25D366; color:#05080D; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px; border:none; padding:6px 14px; border-radius:6px; transition:all 0.2s; box-shadow:0 2px 8px rgba(37,211,102,0.3);">
                                            <span>📲 Disparar WhatsApp</span>
                                        </a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ── 7. ABA DE AUDITORIA E SEGURANÇA ──
    async renderAuditTab() {
        return `
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">🛡️</span>
                        <strong>Trilha de Auditoria Criptográfica & Conformidade</strong>
                    </span>
                    <span class="badge-proof badge-proven">Logs Imutáveis</span>
                </div>
                <div style="padding:20px 0; color:var(--text-muted); font-size:13px;" id="audit-log-container">
                    Carregando registros de auditoria em tempo real...
                </div>
            </div>
        `;
    },

    // Modal de Detalhes dos Clientes e Veículos da Oficina
    async openWorkshopClientsModal(workshopId) {
        let modal = document.getElementById('admin-workshop-clients-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'admin-workshop-clients-modal';
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-card" style="max-width:850px; width:95%; max-height:90vh; overflow-y:auto;">
                <div class="modal-header">
                    <div>
                        <h3 style="margin:0; color:#fff; font-size:18px;">👥 Clientes & Veículos Atendidos</h3>
                        <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);" id="modal-workshop-subtitle">Carregando dados da oficina...</p>
                    </div>
                    <button type="button" class="modal-close-btn" onclick="document.getElementById('admin-workshop-clients-modal').remove()">✕</button>
                </div>
                <div id="modal-workshop-body" style="padding:20px;">
                    <div style="text-align:center; padding:30px; color:var(--text-muted);">
                        <div class="pulse-dot" style="margin:0 auto 10px;"></div>
                        Carregando relação de clientes da oficina...
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        try {
            const data = await API.getWorkshopClients(workshopId);
            const w = data.workshop;
            const clients = data.clients || [];

            document.getElementById('modal-workshop-subtitle').textContent =
                `${w.trade_name} • CNPJ: ${w.cnpj} • ${w.city}/${w.state}`;

            const body = document.getElementById('modal-workshop-body');
            if (clients.length === 0) {
                body.innerHTML = `
                    <div style="text-align:center; padding:40px; color:var(--text-muted);">
                        <div style="font-size:32px; margin-bottom:10px;">🚗</div>
                        <p>Esta oficina ainda não realizou atendimentos para clientes cadastrados.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <span style="font-size:13px; color:#ffffff;">Total de Clientes Atendidos: <strong>${clients.length}</strong></span>
                    <span style="font-size:13px; color:#10b981; font-weight:700;">
                        Faturamento Total: R$ ${(clients.reduce((acc, c) => acc + (c.total_spent_cents || 0), 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Proprietário</th>
                                <th>WhatsApp</th>
                                <th>Veículo</th>
                                <th>Código DNA</th>
                                <th>Último Serviço</th>
                                <th>Km</th>
                                <th>Total Gasto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(c => `
                                <tr>
                                    <td><strong style="color:#ffffff;">${c.owner_name}</strong></td>
                                    <td class="mono" style="color:#25D366;">${c.owner_phone}</td>
                                    <td>
                                        <strong style="color:var(--brand-gold);">${c.license_plate}</strong>
                                        <div style="font-size:11px; color:var(--text-muted);">${c.brand} ${c.model}</div>
                                    </td>
                                    <td>
                                        ${c.dna_code ? `
                                            <span class="badge-proof badge-proven" style="font-family:var(--font-mono); font-size:10.5px;">${c.dna_code}</span>
                                        ` : `
                                            <span class="badge-proof badge-warning">Sem DNA</span>
                                        `}
                                    </td>
                                    <td>${c.last_service_date ? new Date(c.last_service_date).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td class="mono">${c.last_recorded_mileage ? c.last_recorded_mileage.toLocaleString('pt-BR') + ' km' : '-'}</td>
                                    <td class="mono" style="color:#10b981; font-weight:700;">
                                        R$ ${((c.total_spent_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            document.getElementById('modal-workshop-body').innerHTML = `
                <div style="color:#ef4444; padding:20px; text-align:center;">
                    Erro ao carregar clientes da oficina: ${err.message}
                </div>
            `;
        }
    },

    async approveWorkshop(workshopId) {
        if (!confirm('Deseja homologar esta oficina parceira na rede DNA AUTO?')) return;
        try {
            await API.setWorkshopStatus(workshopId, 'APPROVED');
            alert('✅ Oficina homologada com sucesso na rede!');
            this.render();
        } catch (err) {
            alert('Erro ao homologar oficina: ' + err.message);
        }
    }
};
