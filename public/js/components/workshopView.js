// ==============================================================================
// DNA AUTO — PAINEL OPERACIONAL DA OFICINA CREDENCIADA (ESTILO TOTVS ERP)
// Plataforma Integrada de Gestão, Recepção, Lançamento de OS e Telemetria OBD2
// ==============================================================================

const WorkshopView = {
    currentWorkshopId: 'ws_veloce',
    dashboardData: null,
    alertsData: null,
    currentTab: 'dashboard', // 'dashboard' | 'recepcao' | 'servicos' | 'alertas' | 'equipe'
    lastSearchedPlate: '',

    getEffectiveWorkshopId() {
        if (App.currentUser) {
            if (App.currentUser.workshop && (App.currentUser.workshop.id || App.currentUser.workshop.workshop_id)) {
                return App.currentUser.workshop.id || App.currentUser.workshop.workshop_id;
            }
            if (App.currentUser.workshop_id) {
                return App.currentUser.workshop_id;
            }
        }
        return this.currentWorkshopId || 'ws_veloce';
    },

    async render() {
        const container = document.getElementById('view-content');
        const activeWorkshopId = this.getEffectiveWorkshopId();
        this.currentWorkshopId = activeWorkshopId;

        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Plataforma ERP da Oficina Credenciada...
            </div>
        `;

        try {
            const data = await API.getWorkshopDashboard(activeWorkshopId);
            this.dashboardData = data;

            // Busca alertas de manutenção preditiva (OBD2 + KM)
            try {
                const alertsRes = await API.getMaintenanceAlertsForWorkshop(activeWorkshopId);
                this.alertsData = alertsRes && alertsRes.alerts ? alertsRes.alerts : [];
            } catch (e) {
                console.warn('Alertas de manutenção não puderam ser carregados:', e.message);
                this.alertsData = [];
            }

            this.renderMainLayout();
        } catch (err) {
            console.error('Erro ao renderizar painel da oficina:', err);
            container.innerHTML = `
                <div class="panel-box" style="padding:30px; text-align:center;">
                    <div style="color:var(--status-rejected); font-size:16px; font-weight:700; margin-bottom:8px;">
                        Erro ao carregar dados da oficina
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">${err.message || 'Verifique sua conexão.'}</p>
                    <button class="btn btn-secondary" onclick="WorkshopView.render()">Tentar Novamente</button>
                </div>
            `;
        }
    },

    renderMainLayout() {
        const container = document.getElementById('view-content');
        const data = this.dashboardData;
        const ws = data.workshop;
        const pendingCount = (data.pendingConfirmations || []).length;
        const criticalAlertsCount = (this.alertsData || []).filter(a => a.urgency === 'CRITICAL').length;
        const totalAlertsCount = (this.alertsData || []).length;

        container.innerHTML = `
            <div class="ws-erp-container">
                <!-- ========================================== -->
                <!-- CABEÇALHO EXECUTIVO COMPACTO TOTVS ERP      -->
                <!-- ========================================== -->
                <div class="ws-erp-header">
                    <div class="ws-erp-header-title">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                            <span class="badge-proof badge-proven" style="font-size:10px; padding:3px 8px; font-weight:700;">
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px;"><polyline points="20 6 9 17 4 12"/></svg>
                                OFICINA HOMOLOGADA NÍVEL 4
                            </span>
                            <span style="font-size:11px; color:var(--brand-cyan); font-family:var(--font-mono); font-weight:600;">ID: ${ws.id}</span>
                            <span style="font-size:11px; color:var(--text-dim);">• Sistema Conectado ao OBD2</span>
                        </div>
                        <h2>${ws.trade_name}</h2>
                        <p>${ws.company_name} • CNPJ: ${ws.cnpj} • ${ws.address_street}, ${ws.address_number} - ${ws.city}/${ws.state}</p>
                    </div>

                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" onclick="WorkshopView.openNewServiceModal()" style="font-weight:700; display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            LANÇAR SERVIÇO & PEÇAS
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="PosterGenerator.open('${ws.id}')" style="display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            CARTAZ QR CODE
                        </button>
                    </div>
                </div>

                <!-- ========================================== -->
                <!-- ESTRUTURA ERP: MENU LATERAL + CONTEÚDO     -->
                <!-- ========================================== -->
                <div class="ws-erp-body">
                    <!-- Menu Lateral Interno Estilo TOTVS -->
                    <nav class="ws-erp-sidebar">
                        <div class="ws-erp-nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="WorkshopView.switchTab('dashboard')">
                            <div class="ws-erp-nav-left">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
                                <span>Dashboard</span>
                            </div>
                        </div>

                        <div class="ws-erp-nav-item ${this.currentTab === 'recepcao' ? 'active' : ''}" onclick="WorkshopView.switchTab('recepcao')">
                            <div class="ws-erp-nav-left">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <span>Recepção & Entrada</span>
                            </div>
                            <span class="ws-erp-badge">Check-in</span>
                        </div>

                        <div class="ws-erp-nav-item ${this.currentTab === 'servicos' ? 'active' : ''}" onclick="WorkshopView.switchTab('servicos')">
                            <div class="ws-erp-nav-left">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                                <span>Serviços & Peças</span>
                            </div>
                            ${pendingCount > 0 ? `<span class="ws-erp-badge alert-pulse">${pendingCount} pend.</span>` : ''}
                        </div>

                        <div class="ws-erp-nav-item ${this.currentTab === 'alertas' ? 'active' : ''}" onclick="WorkshopView.switchTab('alertas')">
                            <div class="ws-erp-nav-left">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                <span>Alertas de Manutenção</span>
                            </div>
                            ${totalAlertsCount > 0 ? `<span class="ws-erp-badge alert-pulse">${criticalAlertsCount > 0 ? criticalAlertsCount + ' críticos' : totalAlertsCount}</span>` : ''}
                        </div>

                        <div class="ws-erp-nav-item ${this.currentTab === 'equipe' ? 'active' : ''}" onclick="WorkshopView.switchTab('equipe')">
                            <div class="ws-erp-nav-left">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                <span>Equipe Técnica</span>
                            </div>
                            <span class="ws-erp-badge">${(data.staff || []).length}</span>
                        </div>
                    </nav>

                    <!-- Área de Conteúdo da Sub-View Ativa -->
                    <main class="ws-erp-content" id="ws-erp-active-content">
                        ${this.renderCurrentTabContent()}
                    </main>
                </div>
            </div>
        `;
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        const navItems = document.querySelectorAll('.ws-erp-nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        const targetContent = document.getElementById('ws-erp-active-content');
        if (targetContent) {
            targetContent.innerHTML = this.renderCurrentTabContent();
        } else {
            this.renderMainLayout();
        }

        // Re-atualiza o active na sidebar
        const tabs = ['dashboard', 'recepcao', 'servicos', 'alertas', 'equipe'];
        const index = tabs.indexOf(tabName);
        if (index >= 0 && navItems[index]) {
            navItems[index].classList.add('active');
        }
    },

    renderCurrentTabContent() {
        switch (this.currentTab) {
            case 'recepcao':
                return this.renderRecepcao();
            case 'servicos':
                return this.renderServicos();
            case 'alertas':
                return this.renderAlertas();
            case 'equipe':
                return this.renderEquipe();
            case 'dashboard':
            default:
                return this.renderDashboard();
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 1: DASHBOARD OPERACIONAL
    // ──────────────────────────────────────────────────────────────────────────
    renderDashboard() {
        const data = this.dashboardData;
        const stats = data.stats;
        const criticalCount = (this.alertsData || []).filter(a => a.urgency === 'CRITICAL').length;

        return `
            <!-- KPIs Operacionais -->
            <div class="grid-kpi" style="margin-bottom:0;">
                <div class="kpi-card accent-primary">
                    <div class="kpi-header">
                        <span class="kpi-title">Veículos Atendidos</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${stats.attended_vehicles}</div>
                    <div class="kpi-footer">Passagens registradas na oficina</div>
                </div>

                <div class="kpi-card accent-cyan">
                    <div class="kpi-header">
                        <span class="kpi-title">DNAs Ativados</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${stats.dnas_activated}</div>
                    <div class="kpi-footer">Veículos na rede DNA AUTO</div>
                </div>

                <div class="kpi-card accent-success">
                    <div class="kpi-header">
                        <span class="kpi-title">Serviços Comprovados</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                    </div>
                    <div class="kpi-value">${stats.proven_services}</div>
                    <div class="kpi-footer">Nível 4 com peças e notas fiscais</div>
                </div>

                <div class="kpi-card accent-warning" onclick="WorkshopView.switchTab('alertas')" style="cursor:pointer;">
                    <div class="kpi-header">
                        <span class="kpi-title">Alertas Preventivos (OBD2)</span>
                        <span class="kpi-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                        </span>
                    </div>
                    <div class="kpi-value" style="color:${criticalCount > 0 ? 'var(--status-rejected)' : 'var(--proof-level-1)'};">${(this.alertsData || []).length}</div>
                    <div class="kpi-footer">${criticalCount > 0 ? `${criticalCount} trocas críticas imediatas` : 'Monitoramento por KM ativo'}</div>
                </div>
            </div>

            <!-- Card de Acesso Rápido de Recepção -->
            <div class="panel-box" style="background:linear-gradient(135deg, rgba(255, 210, 28, 0.05), rgba(15, 23, 42, 0.7)); border-color:rgba(255, 210, 28, 0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div>
                        <strong style="font-size:15px; color:#fff; display:block;">Recepção Rápida de Veículos</strong>
                        <p style="font-size:12.5px; color:var(--text-muted); margin:4px 0 0;">Dê entrada por placa ou cadastre carros na plataforma com dados da API oficial ou formulário instantâneo.</p>
                    </div>
                    <button class="btn btn-primary" onclick="WorkshopView.switchTab('recepcao')" style="font-weight:700;">
                        Ir para Recepção / Check-In →
                    </button>
                </div>
            </div>

            <!-- Resumo das Pendências e Fila de Análise -->
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Atividades Recentes & Pendências da Oficina
                    </span>
                    <button class="btn btn-sm btn-secondary" onclick="WorkshopView.switchTab('servicos')">Ver Todos os Serviços</button>
                </div>

                ${(data.pendingConfirmations || []).length === 0 ? `
                    <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12.5px;">
                        Nenhum serviço declarado por cliente aguardando análise no momento.
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Veículo</th>
                                    <th>Cliente</th>
                                    <th>Serviço Declarado</th>
                                    <th>Km</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.pendingConfirmations.slice(0, 3).map(s => `
                                    <tr>
                                        <td><strong>${s.brand} ${s.model}</strong> <span class="mono" style="color:var(--brand-cyan); font-size:11px;">(${s.license_plate})</span></td>
                                        <td>${s.declared_by_owner_name || 'Cliente Cadastrado'}</td>
                                        <td>${s.service_title}</td>
                                        <td class="mono">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                        <td>
                                            <button class="btn btn-sm btn-success" style="font-size:11px;" onclick="WorkshopView.switchTab('servicos')">Analisar</button>
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

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 2: RECEPÇÃO & ENTRADA DE VEÍCULOS (2 BOTÕES NA PARTE DE PESQUISA)
    // ──────────────────────────────────────────────────────────────────────────
    renderRecepcao() {
        return `
            <div class="panel-box" style="background:linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(15, 23, 42, 0.6)); border-color:var(--brand-cyan);">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Recepção / Check-In: Identificar ou Cadastrar Veículo na Entrada
                    </span>
                </div>
                <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
                    Digite a <strong>Placa</strong> do veículo. O sistema carrega o histórico 360°, verifica o alerta preventivo de correia/óleo pelo odômetro OBD2 ou permite cadastrar o carro imediatamente na base oficial.
                </p>

                <!-- Barra de Pesquisa com os DOIS BOTÕES solicitados -->
                <div class="ws-search-toolbar">
                    <input type="text" id="ws-vehicle-search" class="form-control ws-search-input"
                           placeholder="Digite a placa (Ex: LQZ9A42, BRA2E19, STR1A99)..."
                           value="${this.lastSearchedPlate || 'LQZ9A42'}"
                           onkeydown="if(event.key==='Enter') WorkshopView.handleSearchVehicle()" />
                    <div class="ws-search-dual-actions">
                        <!-- BOTÃO 1: CONSULTAR / ENTRADA -->
                        <button class="btn btn-cyan ws-btn-search" onclick="WorkshopView.handleSearchVehicle()" style="font-weight:700; display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            CONSULTAR / ENTRADA
                        </button>

                        <!-- BOTÃO 2: CADASTRAR CARRO -->
                        <button class="ws-btn-cadastrar-carro" onclick="WorkshopView.handleCadastrarCarroBtn()">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            CADASTRAR CARRO
                        </button>
                    </div>
                </div>

                <!-- Container do Resultado da Busca / Entrada -->
                <div id="ws-plate-lookup-result" style="display:none; margin-top:16px;"></div>

                <!-- Atalhos rápidos para demonstração -->
                <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:11.5px; color:var(--text-dim);">
                    <span>Atalhos rápidos para teste de placas:</span>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('LQZ9A42')">
                        LQZ9A42 (VW Fox GII 1.0)
                    </button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('BRA2E19')">
                        BRA2E19 (Civic Touring 360°)
                    </button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('STR1A99')">
                        STR1A99 (Strada Endurance)
                    </button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('ABC1D23')">
                        ABC1D23 (Corolla Altis)
                    </button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('KXZ9012')">
                        KXZ9012 (Gol MSI)
                    </button>
                </div>
            </div>

            <!-- Modal / Formulário de Cadastro Manual Direto (se necessário) -->
            <div id="ws-manual-register-modal" class="modal-overlay">
                <div class="modal-content" style="max-width:540px;">
                    <div class="modal-header">
                        <h3 style="font-size:16px; font-weight:800; color:#fff;">Cadastrar Novo Veículo na Oficina</h3>
                        <button class="modal-close" onclick="WorkshopView.closeManualVehicleModal()">&times;</button>
                    </div>
                    <form id="ws-manual-register-form" onsubmit="WorkshopView.submitManualRegister(event)" style="padding:16px 20px;">
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label class="form-label">Placa do Veículo *</label>
                                <input type="text" id="manual-veh-plate" class="form-control" maxlength="8" style="text-transform:uppercase; font-weight:700; font-family:var(--font-mono);" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Marca / Montadora *</label>
                                <input type="text" id="manual-veh-brand" class="form-control" placeholder="Ex: VW, Honda, Fiat, Toyota" required />
                            </div>
                        </div>

                        <div class="form-grid-2">
                            <div class="form-group">
                                <label class="form-label">Modelo do Carro *</label>
                                <input type="text" id="manual-veh-model" class="form-control" placeholder="Ex: Fox 1.0 GII, Civic, Strada" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Versão / Motor</label>
                                <input type="text" id="manual-veh-version" class="form-control" placeholder="Ex: 1.0 Total Flex, 1.5 Turbo" />
                            </div>
                        </div>

                        <div class="form-grid-3">
                            <div class="form-group">
                                <label class="form-label">Ano Fab/Mod *</label>
                                <input type="number" id="manual-veh-year" class="form-control" value="2018" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cor</label>
                                <input type="text" id="manual-veh-color" class="form-control" placeholder="Ex: Prata, Vermelho" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Km Atual</label>
                                <input type="number" id="manual-veh-km" class="form-control" placeholder="Ex: 85000" />
                            </div>
                        </div>

                        <div class="form-group" style="margin-top:14px; padding:12px; background:rgba(255,210,28,0.06); border-radius:6px; border:1px solid rgba(255,210,28,0.2);">
                            <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#fff; cursor:pointer;">
                                <input type="checkbox" id="manual-veh-activate-dna" checked />
                                <span>Ativar Passaporte DNA Digital Imediato para este veículo</span>
                            </label>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                            <button type="button" class="btn btn-secondary" onclick="WorkshopView.closeManualVehicleModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary" style="font-weight:700;">Salvar e Dar Entrada</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 3: LANÇAR SERVIÇOS & PEÇAS (NÍVEL 4)
    // ──────────────────────────────────────────────────────────────────────────
    renderServicos() {
        const data = this.dashboardData;

        return `
            <!-- Botão de Ação Direta -->
            <div class="panel-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="font-size:16px; font-weight:800; color:#fff; margin:0 0 4px;">Lançar e Comprovar Serviços com Peças</h3>
                    <p style="font-size:12.5px; color:var(--text-muted); margin:0;">
                        Registre ordens de serviço executadas, anexe notas fiscais e informe os códigos das peças originais para certificação Nível 4.
                    </p>
                </div>
                <button class="btn btn-primary" onclick="WorkshopView.openNewServiceModal()" style="font-weight:700;">
                    + LANÇAR NOVO SERVIÇO NÍVEL 4
                </button>
            </div>

            <!-- Fila de Análise: Serviços Declarados por Clientes -->
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--proof-level-1)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        Fila de Análise: Serviços Declarados por Clientes (${(data.pendingConfirmations || []).length} pendentes)
                    </span>
                </div>

                ${(data.pendingConfirmations || []).length === 0 ? `
                    <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12.5px;">
                        Nenhum serviço declarado por cliente aguardando análise no momento.
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Veículo</th>
                                    <th>Proprietário</th>
                                    <th>Data Declarada</th>
                                    <th>Km</th>
                                    <th>Serviço & Peças</th>
                                    <th>Ações Técnicas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.pendingConfirmations.map(s => `
                                    <tr>
                                        <td>
                                            <strong style="color:#fff;">${s.brand} ${s.model}</strong>
                                            <div class="mono" style="font-size:11px; color:var(--brand-cyan);">${s.license_plate}</div>
                                        </td>
                                        <td>
                                            <div style="font-weight:600; color:var(--text-main); font-size:12px;">${s.declared_by_owner_name || 'Proprietário'}</div>
                                            <div style="font-size:11px; color:var(--text-dim);">Via App Mobile</div>
                                        </td>
                                        <td>${s.service_date}</td>
                                        <td class="mono">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                        <td>
                                            <strong>${s.service_title}</strong>
                                            <div style="font-size:11px; color:var(--text-dim);">${s.description || ''}</div>
                                        </td>
                                        <td>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-sm btn-success" style="font-size:11px; font-weight:700;" onclick="WorkshopView.submitConfirmation('${s.id}', 'CONFIRMAR')">
                                                    HOMOLOGAR NÍVEL 3
                                                </button>
                                                <button class="btn btn-sm btn-secondary" style="font-size:11px; color:var(--status-rejected);" onclick="WorkshopView.submitConfirmation('${s.id}', 'NAO_RECONHECO')">
                                                    NÃO RECONHEÇO
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>

            <!-- Histórico de Ordens de Serviço Executadas na Oficina -->
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--proof-level-4)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Histórico de Ordens de Serviço Comprovadas (Nível 4)
                    </span>
                </div>

                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Veículo / Placa</th>
                                <th>Km</th>
                                <th>Serviço Realizado</th>
                                <th>Peças Aplicadas</th>
                                <th>Certificação</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2024-11-04</td>
                                <td>
                                    <strong>Honda Civic Touring</strong>
                                    <div class="mono" style="font-size:11px; color:var(--brand-cyan);">BRA2E19</div>
                                </td>
                                <td class="mono">120.450 km</td>
                                <td>
                                    <strong>Revisão dos 120.000 km</strong>
                                    <div style="font-size:11px; color:var(--text-dim);">Velas de irídio e filtro combustível</div>
                                </td>
                                <td><span class="badge-proof badge-confirmed" style="font-size:10px;">NGK Laser Iridium + Filtro Honda</span></td>
                                <td><span class="badge-proof badge-proven">NÍVEL 4 COMPROVADO</span></td>
                                <td>
                                    <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">Dossiê</button>
                                </td>
                            </tr>
                            <tr>
                                <td>2025-05-18</td>
                                <td>
                                    <strong>Honda Civic Touring</strong>
                                    <div class="mono" style="font-size:11px; color:var(--brand-cyan);">BRA2E19</div>
                                </td>
                                <td class="mono">125.200 km</td>
                                <td>
                                    <strong>Substituição Pastilhas Dianteiras e Traseiras</strong>
                                    <div style="font-size:11px; color:var(--text-dim);">Fluido de freio DOT 5.1</div>
                                </td>
                                <td><span class="badge-proof badge-confirmed" style="font-size:10px;">Brembo Ceramic P28026N</span></td>
                                <td><span class="badge-proof badge-proven">NÍVEL 4 COMPROVADO</span></td>
                                <td>
                                    <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">Dossiê</button>
                                </td>
                            </tr>
                            <tr>
                                <td>2025-11-10</td>
                                <td>
                                    <strong>VW Gol Trendline 1.6</strong>
                                    <div class="mono" style="font-size:11px; color:var(--brand-cyan);">KXZ9012</div>
                                </td>
                                <td class="mono">88.500 km</td>
                                <td>
                                    <strong>Troca de Óleo e Filtros + Ativação DNA</strong>
                                    <div style="font-size:11px; color:var(--text-dim);">Óleo 5W-40 502.00 sintético e filtro Fram</div>
                                </td>
                                <td><span class="badge-proof badge-confirmed" style="font-size:10px;">Castrol Magnatec + PH5548</span></td>
                                <td><span class="badge-proof badge-proven">NÍVEL 4 COMPROVADO</span></td>
                                <td>
                                    <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-1A90-55E8-K12')">Dossiê</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 4: ALERTAS DE MANUTENÇÃO PREDITIVA (OBD2 + KM RODADOS)
    // ──────────────────────────────────────────────────────────────────────────
    renderAlertas() {
        const alerts = this.alertsData || [];
        const criticalList = alerts.filter(a => a.urgency === 'CRITICAL');
        const warningList = alerts.filter(a => a.urgency === 'WARNING');

        return `
            <!-- Painel Explicativo da Telemetria OBD2 -->
            <div class="panel-box" style="background:linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.7)); border-color:rgba(245, 158, 11, 0.3);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap;">
                    <div style="max-width:720px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span class="totvs-pulse-green"></span>
                            <strong style="font-size:15px; color:#fff;">Monitoramento Preditivo por KM & Telemetria OBD2</strong>
                            <span class="totvs-badge-tag cyan" style="font-size:10px; padding:2px 8px;">Módulo de Faturamento B2B</span>
                        </div>
                        <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin:0;">
                            O aplicativo DNA AUTO instalado no smartphone do proprietário pareia via Bluetooth com o scanner OBD2 do veículo, transmitindo continuamente a quilometragem real e status dos sensores. O algoritmo calcula o desgaste de cada componente e alerta a oficina quando a troca preventiva está no momento exato, <strong>gerando aumento de mais de 35% no faturamento da oficina</strong>.
                        </p>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:22px; font-weight:800; color:#FFD21C; font-family:var(--font-mono);">${alerts.length} Alertas</div>
                        <div style="font-size:11px; color:var(--text-dim);">${criticalList.length} críticos • ${warningList.length} preventivos</div>
                    </div>
                </div>
            </div>

            <!-- Tabela dos Itens Monitorados (Correia Dentada, Óleo Câmbio AT, Pastilhas, Óleo Motor) -->
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--proof-level-1)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                        Veículos com Manutenções Próximas do Vencimento
                    </span>
                    <span style="font-size:11px; color:var(--text-dim);">Disparo de WhatsApp em 1 Toque</span>
                </div>

                ${alerts.length === 0 ? `
                    <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:12.5px;">
                        Nenhum veículo com alertas de manutenção no momento. Todos os veículos cadastrados estão em dia com a quilometragem!
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Veículo / Placa</th>
                                    <th>Proprietário</th>
                                    <th>KM Atual (OBD2)</th>
                                    <th>Item Monitorado</th>
                                    <th>Próxima Troca</th>
                                    <th>Status de Desgaste</th>
                                    <th>Ação de Faturamento</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${alerts.map(a => {
                                    const isCritical = a.urgency === 'CRITICAL';
                                    return `
                                        <tr class="${isCritical ? 'ws-alert-row-critical' : 'ws-alert-row-warning'}">
                                            <td>
                                                <strong style="color:#fff;">${a.vehicleModel}</strong>
                                                <div class="mono" style="font-size:11px; color:var(--brand-cyan);">${a.licensePlate}</div>
                                            </td>
                                            <td>
                                                <div style="font-weight:600; font-size:12px; color:var(--text-main);">${a.ownerName}</div>
                                                <div class="mono" style="font-size:11px; color:var(--text-dim);">${a.ownerPhone}</div>
                                            </td>
                                            <td class="mono" style="font-weight:700; color:#fff;">
                                                ${Number(a.currentKm).toLocaleString('pt-BR')} km
                                                <div style="font-size:10px; color:var(--proof-level-4);">Sincronizado</div>
                                            </td>
                                            <td>
                                                <strong style="color:${isCritical ? '#f87171' : '#f59e0b'}; font-size:12.5px;">
                                                    ${a.component}
                                                </strong>
                                                <div style="font-size:10.5px; color:var(--text-dim);">Intervalo: a cada ${Number(a.intervalKm).toLocaleString('pt-BR')} km</div>
                                            </td>
                                            <td class="mono" style="font-size:11.5px;">
                                                ${Number(a.nextServiceKm).toLocaleString('pt-BR')} km
                                            </td>
                                            <td>
                                                <span class="badge-proof ${isCritical ? 'badge-rejected' : 'badge-pending'}" style="font-size:10.5px; padding:3px 8px;">
                                                    ${a.statusText}
                                                </span>
                                            </td>
                                            <td>
                                                <a href="${a.whatsappUrl}" target="_blank" class="btn btn-sm btn-primary" style="background:#25D366; color:#000; border:none; font-weight:700; display:inline-flex; align-items:center; gap:5px; font-size:11px; padding:6px 12px; text-decoration:none;">
                                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>
                                                    AVISAR NO WHATSAPP
                                                </a>
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

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 5: EQUIPE TÉCNICA
    // ──────────────────────────────────────────────────────────────────────────
    renderEquipe() {
        const data = this.dashboardData;
        const staff = data.staff || [];

        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        Equipe Técnica e Usuários Autorizados (${staff.length})
                    </span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap:16px;">
                    ${staff.map(m => `
                        <div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); display:flex; gap:14px; align-items:flex-start;">
                            <div style="width:40px; height:40px; border-radius:8px; background:rgba(0, 212, 255, 0.1); border:1px solid rgba(0, 212, 255, 0.25); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <div style="flex:1;">
                                <strong style="font-size:14px; color:#fff;">${m.name}</strong>
                                <div style="font-size:12px; color:var(--brand-cyan); margin-top:2px; font-weight:600;">${m.position_title}</div>
                                <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">${m.email} • ${m.phone || ''}</div>
                                <div style="margin-top:10px; font-size:11px; color:var(--proof-level-4); display:flex; align-items:center; gap:4px; font-weight:600;">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    Autorizado a comprovar serviços & emitir Nível 4
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // AÇÕES DE BUSCA, ENTRADA E CADASTRO
    // ──────────────────────────────────────────────────────────────────────────
    quickTestVehicle(plate) {
        const input = document.getElementById('ws-vehicle-search');
        if (input) {
            input.value = plate;
            this.handleSearchVehicle();
        }
    },

    // Ação do Botão CADASTRAR CARRO na barra de pesquisa
    handleCadastrarCarroBtn() {
        const input = document.getElementById('ws-vehicle-search');
        const plate = (input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (plate && plate.length === 7) {
            // Se já tem placa digitada, consulta na API de placas para preenchimento automático
            this.lookupPlateData(plate);
        } else {
            // Se vazio ou incompleto, abre o modal de cadastro manual direto
            this.openManualVehicleModal(plate);
        }
    },

    // Ação do Botão CONSULTAR / ENTRADA
    async handleSearchVehicle() {
        const input = document.getElementById('ws-vehicle-search');
        const term = (input?.value || '').trim();
        if (!term) {
            alert('Digite a placa para consultar ou dar entrada no veículo.');
            return;
        }

        const clean = term.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.lastSearchedPlate = clean;

        if (term.toUpperCase().startsWith('DNA-BR-')) {
            DossierView.render(term.toUpperCase());
            return;
        }

        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="padding:20px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                    <div class="pulse-dot" style="margin:0 auto 10px;"></div>
                    <strong style="color:#fff; font-size:14px; display:block; margin-bottom:4px;">Localizando Veículo ${clean}...</strong>
                    <span style="font-size:12px; color:var(--text-dim);">Verificando base DNA AUTO e conectores oficiais</span>
                </div>
            `;
        }

        try {
            // 1. Busca primeiro se o veículo já está registrado na plataforma
            const res = await API.searchVehicle(clean);

            if (res && res.found && res.vehicle) {
                this.renderEntryVehicleCard(res.vehicle, res.hasDna);
                return;
            }

            // 2. Se não encontrado localmente e for formato de 7 caracteres, busca na API de placas oficial
            if (clean.length === 7) {
                await this.lookupPlateData(clean);
            } else {
                this.showPlateNotFoundCard(clean, 'Informe uma placa de 7 caracteres (Ex: LQZ9A42 ou BRA2E19).');
            }
        } catch (err) {
            console.warn('Busca local falhou, tentando API de placas:', err.message);
            if (clean.length === 7) {
                await this.lookupPlateData(clean);
            } else {
                this.showPlateNotFoundCard(clean, err.message);
            }
        }
    },

    // Exibe Card de Entrada Imediata para Carro Já Cadastrado na Plataforma
    renderEntryVehicleCard(v, hasDna) {
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        const km = Number(v.latest_mileage || 85000);
        // Verifica se há alertas para este veículo
        const alertsForThisCar = (this.alertsData || []).filter(a => a.licensePlate === v.license_plate || a.vehicleId === v.id);

        let predictiveAlertHtml = '';
        if (alertsForThisCar.length > 0) {
            predictiveAlertHtml = `
                <div class="ws-entry-alert-box">
                    <div class="ws-entry-alert-header">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                        ALERTA PREDITIVO DE ENTRADA (TELEMETRIA OBD2)
                    </div>
                    <div class="ws-entry-alert-body">
                        ${alertsForThisCar.map(a => `
                            <div>• <strong>${a.component}:</strong> ${a.statusText}. Ofereça este serviço na abertura da OS para aumentar o ticket!</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        resultDiv.innerHTML = `
            <div style="background:linear-gradient(135deg, rgba(16,185,129,0.06), rgba(15,23,42,0.85)); border:1px solid rgba(16,185,129,0.4); border-radius:var(--radius-md); padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                    <div>
                        <span class="badge-proof badge-proven" style="font-size:10.5px; font-weight:700;">VEÍCULO NA REDE DNA AUTO</span>
                        <h3 style="font-size:17px; color:#fff; margin:4px 0 2px;">${v.brand} ${v.model} ${v.version_label ? '• ' + v.version_label : ''}</h3>
                        <div style="font-size:11.5px; color:var(--text-dim);">Placa: <strong class="mono" style="color:var(--brand-cyan);">${v.license_plate}</strong> • Ano: ${v.manufacture_year}/${v.model_year} • Odômetro: <strong class="mono" style="color:#fff;">${km.toLocaleString('pt-BR')} km</strong></div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                </div>

                ${predictiveAlertHtml}

                <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:12px;">
                    <button class="btn btn-sm btn-primary" onclick="WorkshopView.openNewServiceModal('${v.id}')" style="font-weight:700;">
                        📝 ABRIR ORDEM DE SERVIÇO
                    </button>
                    ${hasDna && v.dna_code ? `
                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('${v.dna_code}')">
                            🔎 VER HISTÓRICO COMPLETO 360° (${v.dna_code})
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-gold" onclick="WorkshopView.openDnaOfferModal('${v.id}', '${v.license_plate}', '${v.brand} ${v.model}')" style="background:#FFD21C; color:#000; font-weight:800;">
                            ✨ ATIVAR PASSAPORTE DNA
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    // Consulta de dados do veículo via API de placas (WDAPI2)
    async lookupPlateData(plateParam) {
        const input = document.getElementById('ws-vehicle-search');
        const plate = (plateParam || input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        if (!plate || plate.length !== 7) {
            alert('Informe uma placa válida no formato brasileiro (7 caracteres, Ex: LQZ9A42 ou BRA2E19).');
            return;
        }

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="padding:20px; text-align:center; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div class="pulse-dot" style="margin:0 auto 10px;"></div>
                <strong style="color:#fff; font-size:14px; display:block; margin-bottom:4px;">Consultando Dados Oficiais da Placa ${plate}...</strong>
                <span style="font-size:12px; color:var(--text-dim);">Buscando Senatran Nacional, Detran Estadual e Tabela FIPE</span>
            </div>
        `;

        try {
            const data = await API.lookupPlate(plate);

            if (!data || !data.found || !data.vehicle) {
                this.showPlateNotFoundCard(plate, data?.message);
                return;
            }

            const v = data.vehicle;
            const fipe = v.fipe || {};
            const legal = v.legal_status || {};
            const origin = v.origin || {};

            resultDiv.innerHTML = `
                <div style="background:linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(15, 23, 42, 0.85)); border:1px solid var(--brand-cyan); border-radius:var(--radius-md); padding:18px; box-shadow:0 8px 30px rgba(0,0,0,0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            ${v.logo ? `
                                <img src="${v.logo}" alt="${v.brand}" style="height:38px; max-width:60px; object-fit:contain; background:#fff; border-radius:6px; padding:3px;" />
                            ` : `
                                <div style="width:36px; height:36px; border-radius:6px; background:rgba(16,185,129,0.15); display:flex; align-items:center; justify-content:center; border:1px solid rgba(16,185,129,0.3);">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--proof-level-4)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            `}
                            <div>
                                <strong style="font-size:16px; color:#fff; display:block;">${v.brand || ''} ${v.model || ''} ${v.version ? '• ' + v.version : ''}</strong>
                                <div style="font-size:11px; color:var(--text-dim);">${data.source || 'Base Oficial Homologada'}${fipe.score ? ` • Precisão FIPE: ${fipe.score} pts` : ''}</div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap:10px; margin-bottom:14px;">
                        <!-- Identificação -->
                        <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-subtle); font-size:11.5px; line-height:1.7;">
                            <div style="font-size:10px; font-weight:700; color:var(--brand-cyan); text-transform:uppercase; margin-bottom:4px;">Identificação</div>
                            <div>Placa: <strong class="mono" style="color:#fff;">${v.license_plate}</strong></div>
                            <div>Ano: <strong style="color:#fff;">${v.manufacture_year || '—'}/${v.model_year || '—'}</strong></div>
                            <div>Cor: <strong style="color:#fff;">${v.color || '—'}</strong></div>
                            <div>Chassi: <strong class="mono" style="color:#fff;">${v.chassis_vin_masked || v.chassis_vin || '—'}</strong></div>
                        </div>

                        <!-- FIPE -->
                        <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-subtle); font-size:11.5px; line-height:1.7;">
                            <div style="font-size:10px; font-weight:700; color:var(--proof-level-4); text-transform:uppercase; margin-bottom:4px;">Tabela FIPE Oficial</div>
                            <div>Código: <strong class="mono" style="color:#fff;">${fipe.fipe_code || '—'}</strong></div>
                            <div style="font-size:14px; font-weight:800; color:var(--proof-level-4); font-family:var(--font-mono); margin:2px 0;">${fipe.market_value_formatted || 'R$ —'}</div>
                            <div>Mês: <strong style="color:#fff;">${fipe.reference_month || '—'}</strong></div>
                        </div>

                        <!-- Situação Legal -->
                        <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-subtle); font-size:11.5px; line-height:1.7;">
                            <div style="font-size:10px; font-weight:700; color:var(--proof-level-1); text-transform:uppercase; margin-bottom:4px;">Detran & Tributos</div>
                            <div>Status: <strong style="color:var(--proof-level-4);">${legal.detran_status || 'REGULAR'}</strong></div>
                            <div>IPVA: <strong style="color:#fff;">${legal.ipva_status || 'QUITADO'}</strong></div>
                            <div>Jurisdição: <strong style="color:#fff;">${origin.city || ''}/${origin.state || 'BR'}</strong></div>
                        </div>
                    </div>

                    <!-- Botão de Cadastro Direto -->
                    <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">
                        <button class="btn btn-primary" id="btn-register-from-lookup" onclick="WorkshopView.registerVehicleFromLookup('${v.license_plate}')" style="background:linear-gradient(135deg, #ffd21c, #f59e0b); color:#000; font-weight:800; padding:8px 18px; font-size:12.5px; display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            SALVAR E CADASTRAR VEÍCULO NA PLATAFORMA
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            this.showPlateNotFoundCard(plate, err.message);
        }
    },

    // Card amigável exibido quando a API não localiza a placa, dando opção de cadastrar manualmente sem erro
    showPlateNotFoundCard(plate, message) {
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = `
            <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.35); border-radius:var(--radius-md); padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <div style="font-weight:700; color:#fbbf24; font-size:13.5px; margin-bottom:4px;">
                        ⚠️ Veículo ${plate} não localizado automaticamente na consulta externa
                    </div>
                    <div style="font-size:12px; color:var(--text-muted);">
                        ${message || 'O veículo pode ser novo ou ainda não constar na base pública.'} Você pode cadastrá-lo manualmente agora para dar entrada e lançar os serviços.
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                    <button class="btn btn-sm btn-primary" onclick="WorkshopView.openManualVehicleModal('${plate}')" style="background:#10b981; border:none; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        CADASTRAR MANUALMENTE ESTA PLACA
                    </button>
                </div>
            </div>
        `;
    },

    // Cadastrar Veículo na Plataforma a partir do retorno da API
    async registerVehicleFromLookup(plate) {
        const btn = document.getElementById('btn-register-from-lookup');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = 'Salvando na plataforma...';
        }

        try {
            const res = await API.registerVehicleFromApi(plate);
            alert(`🎉 ${res.message}`);

            // Atualiza a visualização com sucesso
            await this.render();
            // Mantém na aba de recepção
            this.switchTab('recepcao');
        } catch (err) {
            alert('Erro ao cadastrar veículo: ' + err.message);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'SALVAR E CADASTRAR VEÍCULO NA PLATAFORMA';
            }
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // MODAL DE CADASTRO MANUAL DE VEÍCULO
    // ──────────────────────────────────────────────────────────────────────────
    openManualVehicleModal(defaultPlate = '') {
        const modal = document.getElementById('ws-manual-register-modal');
        if (!modal) return;

        const plateInput = document.getElementById('manual-veh-plate');
        if (plateInput) plateInput.value = defaultPlate || '';

        modal.classList.add('active');
    },

    closeManualVehicleModal() {
        const modal = document.getElementById('ws-manual-register-modal');
        if (modal) modal.classList.remove('active');
    },

    async submitManualRegister(e) {
        e.preventDefault();
        const plate = document.getElementById('manual-veh-plate').value.trim().toUpperCase();
        const brand = document.getElementById('manual-veh-brand').value.trim();
        const model = document.getElementById('manual-veh-model').value.trim();
        const version = document.getElementById('manual-veh-version').value.trim();
        const year = document.getElementById('manual-veh-year').value;
        const color = document.getElementById('manual-veh-color').value.trim();
        const km = document.getElementById('manual-veh-km').value;
        const activateDna = document.getElementById('manual-veh-activate-dna').checked;

        try {
            const res = await API.registerVehicle({
                license_plate: plate,
                brand,
                model,
                version_label: version,
                manufacture_year: year,
                color,
                mileage: km,
                activate_dna_now: activateDna
            });

            this.closeManualVehicleModal();
            alert(`✅ Veículo ${brand} ${model} (${plate}) cadastrado com sucesso!`);

            await this.render();
            this.switchTab('recepcao');

            // Exibe o check-in do veículo recém-cadastrado
            const input = document.getElementById('ws-vehicle-search');
            if (input) input.value = plate;
            this.handleSearchVehicle();
        } catch (err) {
            alert('Erro ao cadastrar veículo: ' + err.message);
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // MODAL DE NOVO SERVIÇO & ATIVAÇÃO DNA (MÉTODOS EXISTENTES PRESERVADOS)
    // ──────────────────────────────────────────────────────────────────────────
    openNewServiceModal(vehicleId = '') {
        const modal = document.getElementById('new-service-modal');
        if (!modal) return;

        if (vehicleId) {
            const sel = document.getElementById('srv-vehicle-id');
            if (sel) sel.value = vehicleId;
        }
        modal.classList.add('active');
    },

    async submitNewService(e) {
        e.preventDefault();
        const form = document.getElementById('new-service-form');
        const formData = new FormData(form);
        formData.append('workshop_id', this.currentWorkshopId);

        try {
            const res = await API.registerWorkshopService(formData);
            document.getElementById('new-service-modal').classList.remove('active');
            alert(`✅ ${res.message}`);
            form.reset();
            this.render();
        } catch (err) {
            alert('Erro ao registrar serviço: ' + err.message);
        }
    },

    openDnaOfferModal(vehicleId, plate, modelName = 'Veículo') {
        const modal = document.getElementById('dna-offer-modal');
        if (!modal) return;
        document.getElementById('dna-offer-vehicle-id').value = vehicleId;
        document.getElementById('dna-offer-plate-label').textContent = plate;
        document.getElementById('dna-offer-model-label').textContent = modelName;
        modal.classList.add('active');
    },

    async confirmDnaActivation() {
        const vehicleId = document.getElementById('dna-offer-vehicle-id').value;
        const modality = document.getElementById('dna-offer-modality').value;
        const planId = document.getElementById('dna-offer-plan').value;

        try {
            const res = await API.activateDna({
                vehicle_id: vehicleId,
                workshop_id: this.currentWorkshopId,
                pricing_plan_id: planId,
                modality
            });

            document.getElementById('dna-offer-modal').classList.remove('active');
            alert(`🎉 ${res.message}\nCódigo Gerado: ${res.dna_code}`);
            DossierView.render(res.dna_code);
        } catch (err) {
            alert('Erro ao ativar DNA: ' + err.message);
        }
    },

    async submitConfirmation(serviceId, decision) {
        const notes = prompt(
            decision === 'CONFIRMAR'
                ? 'Observações técnicas da confirmação (opcional):'
                : 'Motivo do não reconhecimento (será registrado em auditoria):'
        );

        try {
            const res = await API.confirmServiceDecision(serviceId, decision, notes);
            alert(`✅ ${res.message}`);
            this.render();
        } catch (err) {
            alert('Erro ao registrar decisão: ' + err.message);
        }
    }
};
