// ==============================================================================
// DNA AUTO — PAINEL OPERACIONAL DA OFICINA & AUTO CENTER (ESTILO TOTVS ERP)
// Sistema Corporativo de Gestão, Recepção, Ficha Digital, OBD2 e WhatsApp
// ==============================================================================

const WorkshopView = {
    currentWorkshopId: 'ws_veloce',
    dashboardData: null,
    alertsData: [],
    appointmentsData: [],
    currentSection: 'dashboard', // Módulo / Sub-view ativa
    vehiclesList: [],
    lastRegisteredVehicle: null,
    activeAccordions: {
        'veiculos': true,
        'recepcao': false,
        'servicos': false,
        'manutencao': true,
        'clientes': false,
        'agenda': false,
        'whatsapp': false,
        'pecas': false,
        'relatorios': false,
        'configuracoes': false
    },
    mobileDrawerOpen: false,
    notificationsOpen: false,
    lastSearchedPlate: '',
    searchCriteria: 'placa', // 'placa' | 'proprietario' | 'telefone' | 'documento' | 'dna' | 'chassi'
    activeAlertTab: 'todos', // 'todos' | 'atrasadas' | 'proximas' | 'emdia'
    activeAgendaView: 'semana', // 'semana' | 'hoje' | 'mes'
    activeWhatsAppTab: 'pendentes', // 'pendentes' | 'enviadas' | 'confirmadas' | 'recusadas' | 'sem_resposta'
    whatsAppData: null,
    whatsAppTemplates: [],
    whatsAppHistory: [],
    whatsAppPollingInterval: null,
    whatsAppActiveTab: 'envio', // 'envio' | 'historico' | 'templates'
    selectedSlotDate: null,
    selectedSlotTime: null,
    officialPhone: '(19) 3245-6789',
    officialWorkshopName: 'Veloce Auto Center Premium',
    agendaConfig: {
        days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        startHour: 8,
        endHour: 18,
        lunchStartHour: 12,
        lunchEndHour: 13,
        disabledSlots: {} // { 'YYYY-MM-DD_HH:MM': true }
    },
    tourCurrentStep: 0,
    tourActive: false,
    pendingVerificationCode: null,
    lastDispatchedBatch: null,
    tourSteps: [
        {
            targetId: 'tour-step-greeting',
            title: '1. Cockpit Operacional da Oficina',
            desc: 'Bem-vindo ao ERP DNA AUTO! Aqui você acompanha a visão geral da sua oficina e atalhos de alta produtividade do dia a dia.'
        },
        {
            targetId: 'tour-step-kpis',
            title: '2. Resumo Operacional de Hoje',
            desc: 'Acompanhe em tempo real o fluxo da sua oficina: veículos atendidos, ordens de serviço ativas, manutenções atrasadas por quilometragem e agendamentos.'
        },
        {
            targetId: 'tour-step-actions',
            title: '3. Ações Rápidas de Balcão',
            desc: 'Atalhos de 1 toque para recepção e mecânica: pesquise carros pela placa, cadastre novos veículos, lance serviços ou faça agendamentos imediatos.'
        },
        {
            targetId: 'tour-step-search',
            title: '4. Recepção & Ficha Digital',
            desc: 'Localize qualquer veículo cadastrado por placa, chassi ou cliente para consultar a Ficha Digital completa, dados da montadora, FIPE e histórico de revisões.'
        },
        {
            targetId: 'tour-step-obd2',
            title: '5. Radar Preditivo OBD2 (Faturamento)',
            desc: 'O sistema cruza a quilometragem do carro do cliente e avisa com semáforos (🔴 🟡 🟢) quando correias, óleo e freios estão perto da troca.'
        },
        {
            targetId: 'tour-step-menu',
            title: '6. Menu Corporativo em Seções',
            desc: 'Navegue entre os módulos operacionais separados por seções claras (Balcão, Serviços, Preditiva OBD2, Clientes e Configurações).'
        }
    ],

    getEffectiveWorkshopId() {
        if (typeof App !== 'undefined' && App.currentUser) {
            if (App.currentUser.workshop && (App.currentUser.workshop.id || App.currentUser.workshop.workshop_id)) {
                return App.currentUser.workshop.id || App.currentUser.workshop.workshop_id;
            }
            if (App.currentUser.workshop_id) {
                return App.currentUser.workshop_id;
            }
        }
        return this.currentWorkshopId || 'ws_veloce';
    },

    // ──────────────────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO E CARREGAMENTO GERAL
    // ──────────────────────────────────────────────────────────────────────────
    async render() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const activeWorkshopId = this.getEffectiveWorkshopId();
        this.currentWorkshopId = activeWorkshopId;

        // Ativa classe de isolamento de tela cheia para o painel ERP
        document.body.classList.add('is-workshop-erp');

        container.innerHTML = `
            <div style="padding:60px 20px; text-align:center; color:var(--text-muted); background:#080c14; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div class="pulse-dot" style="margin:0 auto 16px; width:12px; height:12px;"></div>
                <strong style="color:#ffffff; font-size:16px; display:block; margin-bottom:6px;">Carregando ERP DNA AUTO...</strong>
                <span style="font-size:12px; color:var(--text-dim);">Sincronizando odômetro OBD2, serviços e agenda operacional</span>
            </div>
        `;

        try {
            // 1. Dashboard data
            const data = await API.getWorkshopDashboard(activeWorkshopId);
            this.dashboardData = data;
            if (data.workshop && data.workshop.trade_name) {
                this.officialWorkshopName = data.workshop.trade_name;
            }

            // 2. Alertas preditivos (OBD2 + KM)
            try {
                const alertsRes = await API.getMaintenanceAlertsForWorkshop(activeWorkshopId);
                this.alertsData = alertsRes && alertsRes.alerts ? alertsRes.alerts : [];
            } catch (e) {
                console.warn('Alertas não carregados:', e.message);
                this.alertsData = [];
            }

            // 3. Agendamentos da Oficina
            try {
                const appsRes = await API.getWorkshopAppointments(activeWorkshopId);
                this.appointmentsData = appsRes && appsRes.appointments ? appsRes.appointments : [];
            } catch (e) {
                console.warn('Agendamentos não carregados da API:', e.message);
                this.appointmentsData = [];
            }

            // 4. Veículos Cadastrados na Plataforma
            try {
                const vehRes = await API.getVehicles();
                this.vehiclesList = (vehRes && vehRes.vehicles) ? vehRes.vehicles : [];
            } catch (ve) {
                console.warn('Veículos não carregados da API:', ve.message);
                this.vehiclesList = [];
            }

            // 5. Status do WhatsApp Baileys da Oficina
            try {
                await this.loadWhatsAppStatus(false);
            } catch (wErr) {
                console.warn('Status do WhatsApp não carregado:', wErr.message);
            }

            this.renderMainLayout();
            setTimeout(() => {
                this.checkAutoTour();
            }, 500);
        } catch (err) {
            console.error('Erro ao renderizar painel da oficina:', err);
            container.innerHTML = `
                <div class="panel-box" style="padding:40px; text-align:center; max-width:500px; margin:40px auto; background:#0f172a; border-color:var(--status-rejected);">
                    <div style="color:var(--status-rejected); font-size:16px; font-weight:800; margin-bottom:8px;">
                        Erro ao conectar à plataforma da oficina
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">${err.message || 'Verifique se o servidor está ativo.'}</p>
                    <button class="btn btn-primary" onclick="WorkshopView.render()">Tentar Novamente</button>
                </div>
            `;
        }
    },

    getDefaultAppointments() {
        return [];
    },

    // ──────────────────────────────────────────────────────────────────────────
    // LAYOUT PRINCIPAL DO ERP (HEADER + SIDEBAR ACCORDION + VIEWPORT)
    // ──────────────────────────────────────────────────────────────────────────
    renderMainLayout() {
        const container = document.getElementById('view-content');
        const data = this.dashboardData || {};
        const ws = data.workshop || { trade_name: 'Veloce Auto Center Premium', cnpj: '12.345.678/0001-90', id: 'ws_veloce' };
        const userName = (App.currentUser && App.currentUser.name) || 'Marcos Silveira';

        // Métricas de Notificações
        const criticalAlerts = (this.alertsData || []).filter(a => a.urgency === 'CRITICAL').length;
        const upcomingAlerts = (this.alertsData || []).filter(a => a.urgency === 'WARNING').length;
        const todayApps = this.getTodayAppointmentsCount();
        const pendingWpp = 3;
        const totalNotif = criticalAlerts + upcomingAlerts + todayApps;

        container.innerHTML = `
            <div class="ws-erp-viewport">
                <!-- ======================================================== -->
                <!-- HEADER ERP SUPERIOR                                      -->
                <!-- ======================================================== -->
                <header class="ws-erp-header-bar">
                    <div class="ws-erp-header-left">
                        <!-- Botão Sanduíche Mobile -->
                        <button class="ws-erp-hamburger-btn" onclick="WorkshopView.toggleMobileDrawer()" title="Abrir Menu">
                            ☰
                        </button>

                        <!-- Brand Block DNA AUTO -->
                        <div class="ws-erp-brand-block" onclick="WorkshopView.switchSection('dashboard')">
                            <div style="width:30px; height:30px; border-radius:6px; background:#0a0f16; border:1px solid rgba(255,210,28,0.45); display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 120 120" width="18" height="18" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="8" />
                                    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="9" />
                                    <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="9" />
                                    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="10" />
                                </svg>
                            </div>
                            <div>
                                <h1>DNA <span style="color:#FFD21C;">AUTO</span></h1>
                                <p>Certificação de Registros Veiculares</p>
                            </div>
                        </div>
                    </div>

                    <div class="ws-erp-header-right">
                        <!-- Identificação da Oficina -->
                        <div class="ws-erp-ws-title">
                            <span class="ws-erp-ws-name">${ws.trade_name}</span>
                            <span class="ws-erp-ws-sub">ID: ${ws.id} • Nível 4 Homologada</span>
                        </div>

                        <!-- Botão Tour Guiado para o Lojista -->
                        <button class="ws-erp-tour-launch-btn" onclick="WorkshopView.startTour(true)" style="background:rgba(255,210,28,0.12); color:#FFD21C; border:1px solid rgba(255,210,28,0.3); font-weight:700; font-size:11.5px; padding:6px 12px; border-radius:6px; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" title="Fazer Tour Guiado pelo Sistema">
                            <span>🎓</span>
                            <span>Tour do Sistema</span>
                        </button>

                        <!-- Botão Sair -->
                        <button class="ws-erp-logout-btn" onclick="App.logout()" title="Encerrar Sessão">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span>Sair</span>
                        </button>
                    </div>
                </header>

                <!-- ======================================================== -->
                <!-- CORPO PRINCIPAL COM SIDEBAR ACCORDION + CONTEÚDO        -->
                <!-- ======================================================== -->
                <div class="ws-erp-main-body">
                    <!-- Backdrop Mobile -->
                    <div id="ws-erp-backdrop" class="ws-erp-drawer-backdrop" onclick="WorkshopView.closeMobileDrawer()"></div>

                    <!-- SIDEBAR DESKTOP & DRAWER MOBILE ORGANIZADA POR SEÇÕES -->
                    <aside id="ws-erp-sidebar-el" class="ws-erp-sidebar">
                        <div class="ws-erp-sidebar-header">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div class="title-main">DNA AUTO</div>
                                    <div class="title-sub">Gestão Empresarial & ERP</div>
                                </div>
                                <button class="btn btn-sm" onclick="WorkshopView.closeMobileDrawer()" style="display:none; padding:2px 8px;" id="ws-drawer-close-btn">✕</button>
                            </div>
                        </div>

                        <!-- Sino de Notificações Operacionais no Menu Lateral -->
                        <div class="ws-sidebar-notif-box" id="ws-sidebar-notif-box">
                            <button type="button" class="ws-sidebar-notif-btn" onclick="WorkshopView.toggleNotificationsPopover()" title="Central de Notificações da Oficina">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:16px;">🔔</span>
                                    <span style="font-size:12px; font-weight:700; color:#f8fafc;">Notificações</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    ${totalNotif > 0 ? `<span class="ws-sidebar-bell-badge">${totalNotif}</span>` : ''}
                                    <span style="font-size:10px; color:#64748b;">▼</span>
                                </div>
                            </button>

                            <!-- Dropdown Clicável das Situações da Oficina -->
                            <div id="ws-notifications-popover" class="ws-sidebar-notif-dropdown" style="display:none;">
                                <div style="padding:8px 12px 6px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
                                    <strong style="font-size:11.5px; color:#ffffff;">Situações do Sistema</strong>
                                    <span style="font-size:10px; color:var(--text-dim);">${totalNotif} pendências</span>
                                </div>
                                <div class="ws-notif-item" onclick="WorkshopView.switchSection('manutencao-atrasadas'); WorkshopView.toggleNotificationsPopover();" style="padding:8px 12px; display:flex; gap:10px; align-items:center; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.04);">
                                    <span style="font-size:14px;">🔴</span>
                                    <div style="flex:1;">
                                        <strong style="color:#f87171; display:block; font-size:11.5px;">${criticalAlerts} manutenções atrasadas</strong>
                                        <span style="color:#94a3b8; font-size:10.5px;">Veículos com limite de KM excedido</span>
                                    </div>
                                </div>
                                <div class="ws-notif-item" onclick="WorkshopView.switchSection('manutencao-proximas'); WorkshopView.toggleNotificationsPopover();" style="padding:8px 12px; display:flex; gap:10px; align-items:center; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.04);">
                                    <span style="font-size:14px;">🟡</span>
                                    <div style="flex:1;">
                                        <strong style="color:#fbbf24; display:block; font-size:11.5px;">${upcomingAlerts} manutenções próximas</strong>
                                        <span style="color:#94a3b8; font-size:10.5px;">Faltando menos de 3.000 km</span>
                                    </div>
                                </div>
                                <div class="ws-notif-item" onclick="WorkshopView.switchSection('agenda-oficina'); WorkshopView.toggleNotificationsPopover();" style="padding:8px 12px; display:flex; gap:10px; align-items:center; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.04);">
                                    <span style="font-size:14px;">📅</span>
                                    <div style="flex:1;">
                                        <strong style="color:#10b981; display:block; font-size:11.5px;">${todayApps} agendamentos para hoje</strong>
                                        <span style="color:#94a3b8; font-size:10.5px;">Consulte horários na agenda</span>
                                    </div>
                                </div>
                                <div class="ws-notif-item" onclick="WorkshopView.switchSection('whatsapp-central'); WorkshopView.toggleNotificationsPopover();" style="padding:8px 12px; display:flex; gap:10px; align-items:center; cursor:pointer;">
                                    <span style="font-size:14px;">💬</span>
                                    <div style="flex:1;">
                                        <strong style="color:#00d4ff; display:block; font-size:11.5px;">${pendingWpp} WhatsApp pendentes</strong>
                                        <span style="color:#94a3b8; font-size:10.5px;">Disparos automáticos pendentes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Menu Lateral Simplificado da Oficina -->
                        <nav class="ws-erp-nav-scroll" id="tour-step-menu">
                            <div class="ws-erp-menu-item ${this.currentSection === 'dashboard' ? 'active' : ''}" onclick="WorkshopView.switchSection('dashboard')">
                                <div class="ws-erp-menu-left"><span>🏠</span> <span>Dashboard</span></div>
                            </div>
                            <div class="ws-erp-menu-item" onclick="WorkshopView.openManualVehicleModal()">
                                <div class="ws-erp-menu-left"><span>🚗</span> <span>Cadastrar Carro</span></div>
                                <span class="badge-proof badge-proven" style="font-size:9px; padding:1px 5px; background:rgba(16,185,129,0.2); color:#10b981;">+ Novo</span>
                            </div>
                            <div class="ws-erp-menu-item ${this.currentSection === 'agenda-oficina' ? 'active' : ''}" onclick="WorkshopView.switchSection('agenda-oficina')">
                                <div class="ws-erp-menu-left"><span>📅</span> <span>Agenda da Semana</span></div>
                            </div>
                            <div class="ws-erp-menu-item ${this.currentSection === 'whatsapp-central' ? 'active' : ''}" onclick="WorkshopView.switchSection('whatsapp-central')">
                                <div class="ws-erp-menu-left"><span>📱</span> <span>WhatsApp</span></div>
                                <span class="badge-proof" id="ws-menu-wpp-badge" style="font-size:9px; padding:2px 6px; background:rgba(37,211,102,0.15); color:#25D366; font-weight:700;">Oficial</span>
                            </div>
                            <div class="ws-erp-menu-item ${this.currentSection === 'servicos-os' ? 'active' : ''}" onclick="WorkshopView.switchSection('servicos-os')">
                                <div class="ws-erp-menu-left"><span>🔧</span> <span>Serviços & Ordens</span></div>
                            </div>
                            <div class="ws-erp-menu-item ${this.currentSection === 'configuracoes-dados' ? 'active' : ''}" onclick="WorkshopView.switchSection('configuracoes-dados')">
                                <div class="ws-erp-menu-left"><span>⚙️</span> <span>Configurações</span></div>
                            </div>
                        </nav>
                    </aside>

                    <!-- ÁREA PRINCIPAL DE CONTEÚDO (SUB-VIEWS) -->
                    <main class="ws-erp-content-viewport" id="ws-erp-active-viewport">
                        ${this.renderActiveSection()}
                    </main>
                </div>
            </div>

            <!-- CONTAINER PARA MODAIS DO ERP -->
            <div id="ws-erp-modal-root"></div>

            <!-- CONTAINER PARA TOUR GUIADO DO LOGISTA -->
            <div id="ws-tour-container"></div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // CONTROLES DE INTERFACE (DRAWER, ACCORDION, NOTIFICAÇÕES)
    // ──────────────────────────────────────────────────────────────────────────
    toggleMobileDrawer() {
        this.mobileDrawerOpen = !this.mobileDrawerOpen;
        const sidebar = document.getElementById('ws-erp-sidebar-el');
        const backdrop = document.getElementById('ws-erp-backdrop');
        const closeBtn = document.getElementById('ws-drawer-close-btn');

        if (sidebar) sidebar.classList.toggle('open', this.mobileDrawerOpen);
        if (backdrop) backdrop.classList.toggle('active', this.mobileDrawerOpen);
        if (closeBtn) closeBtn.style.display = this.mobileDrawerOpen ? 'block' : 'none';
    },

    closeMobileDrawer() {
        this.mobileDrawerOpen = false;
        const sidebar = document.getElementById('ws-erp-sidebar-el');
        const backdrop = document.getElementById('ws-erp-backdrop');
        const closeBtn = document.getElementById('ws-drawer-close-btn');

        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        if (closeBtn) closeBtn.style.display = 'none';
    },

    toggleAccordion(groupKey) {
        this.activeAccordions[groupKey] = !this.activeAccordions[groupKey];
        const groupEl = document.getElementById(`group-${groupKey}`);
        if (groupEl) {
            groupEl.classList.toggle('open', this.activeAccordions[groupKey]);
        }
    },

    toggleNotificationsPopover() {
        const popover = document.getElementById('ws-notifications-popover');
        if (!popover) return;
        this.notificationsOpen = !this.notificationsOpen;
        popover.style.display = this.notificationsOpen ? 'block' : 'none';
    },

    switchSection(sectionId) {
        this.currentSection = sectionId;
        this.closeMobileDrawer();

        if (this.notificationsOpen) {
            this.toggleNotificationsPopover();
        }

        // Atualiza item ativo na sidebar
        const allItems = document.querySelectorAll('.ws-erp-menu-item');
        allItems.forEach(item => item.classList.remove('active'));

        const viewport = document.getElementById('ws-erp-active-viewport');
        if (viewport) {
            viewport.innerHTML = this.renderActiveSection();
            // Scroll to top suavemente
            viewport.scrollTop = 0;
        } else {
            this.renderMainLayout();
        }
    },

    getTodayAppointmentsCount() {
        const today = new Date().toISOString().split('T')[0];
        return (this.appointmentsData || []).filter(a => a.appointment_date === today).length;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // ROTEADOR DE SEÇÕES DO ERP
    // ──────────────────────────────────────────────────────────────────────────
    renderActiveSection() {
        switch (this.currentSection) {
            // Módulo 1: Visão Geral
            case 'dashboard':
                return this.renderDashboardView();

            // Módulo 2: Veículos
            case 'veiculos-pesquisa':
            case 'veiculos-cadastrar':
                return this.renderVehicleSearchView();
            case 'veiculos-cadastrados':
                return this.renderRegisteredVehiclesView();
            case 'veiculos-historico':
                return this.renderVehicleHistoryView();

            // Módulo 3: Recepção
            case 'recepcao-checkin':
            case 'recepcao-novo':
                return this.renderRecepcaoCheckinView();
            case 'recepcao-andamento':
                return this.renderServicesInProgressView();

            // Módulo 4: Serviços
            case 'servicos-os':
            case 'servicos-andamento':
                return this.renderServiceOrdersView();
            case 'servicos-concluidos':
            case 'servicos-comprovados':
                return this.renderProvenServicesView();

            // Módulo 5: Manutenção
            case 'manutencao-alertas':
            case 'manutencao-atrasadas':
            case 'manutencao-proximas':
            case 'manutencao-historico':
                return this.renderMaintenanceCenterView();

            // Módulo 6: Clientes
            case 'clientes-lista':
            case 'clientes-whatsapp':
            case 'clientes-historico':
                return this.renderClientsView();

            // Módulo 7: Agenda
            case 'agenda-oficina':
            case 'agenda-horarios':
            case 'agenda-agendamentos':
            case 'agenda-confirmacao':
                return this.renderAgendaView();

            // Módulo 8: WhatsApp
            case 'whatsapp-central':
            case 'whatsapp-automaticas':
            case 'whatsapp-avisar':
            case 'whatsapp-enviadas':
            case 'whatsapp-confirmados':
                return this.renderWhatsAppCenterView();

            // Módulo 9: Peças / Estoque
            case 'pecas-lista':
            case 'pecas-estoque':
            case 'pecas-utilizadas':
                return this.renderPartsAndStockView();

            // Módulo 10: Relatórios
            case 'relatorios-geral':
            case 'relatorios-veiculos':
            case 'relatorios-servicos':
            case 'relatorios-manutencao':
            case 'relatorios-clientes':
                return this.renderReportsView();

            // Módulo 11: Configurações
            case 'configuracoes-dados':
            case 'configuracoes-usuarios':
            case 'configuracoes-permissoes':
            case 'configuracoes-whatsapp':
            case 'configuracoes-notificacoes':
                return this.renderConfigurationsView();

            default:
                return this.renderDashboardView();
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 1: DASHBOARD EXECUTIVO
    // ──────────────────────────────────────────────────────────────────────────
    renderDashboardView() {
        const data = this.dashboardData || {};
        const stats = data.stats || {};
        const ws = data.workshop || {};
        const userName = (App.currentUser && App.currentUser.name) || 'Marcos Silveira';

        const criticalAlerts = (this.alertsData || []).filter(a => a.urgency === 'CRITICAL').length;
        const upcomingAlerts = (this.alertsData || []).filter(a => a.urgency === 'WARNING').length;
        const todayApps = this.getTodayAppointmentsCount();
        const pendingServices = (data.pendingConfirmations || []).length;
        const attendedVehicles = this.vehiclesList ? this.vehiclesList.length : Number(stats.attended_vehicles || 0);
        const pendingWhatsApp = (this.whatsAppData?.stats?.pending) || 0;

        return `
            <!-- Cabeçalho Operacional do Painel -->
            <div class="ws-erp-dashboard-banner" id="tour-step-greeting">
                <div>
                    <h2 class="ws-erp-greeting-title">PAINEL OPERACIONAL DA OFICINA</h2>
                    <p class="ws-erp-greeting-sub">${ws.trade_name || 'Veloce Auto Center Premium'} • Gestão de Pátio & Manutenção Preventiva</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn btn-sm" onclick="WorkshopView.switchSection('agenda-oficina')" style="background:rgba(255,210,28,0.12); color:#FFD21C; border:1px solid rgba(255,210,28,0.3); font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">
                        📅 Ver Grade Semanal da Oficina
                    </button>
                </div>
            </div>

            <!-- BUSCA RÁPIDA DE VEÍCULOS & ENTRADAS DIRETO NA DASHBOARD -->
            <div class="panel-box ws-dashboard-search-card" style="background:#090e1a; border:1px solid rgba(0,212,255,0.35); padding:16px 20px; border-radius:10px; margin-bottom:20px; box-shadow:0 4px 20px rgba(0,0,0,0.4);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">🔎</span>
                        <div>
                            <strong style="color:#ffffff; font-size:14.5px;">Buscar Veículo & Ficha Digital no Pátio</strong>
                            <span style="font-size:11.5px; color:#94a3b8; display:block;">Consulte histórico, odômetro, DNA AUTO ou envie WhatsApp com 1 toque</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="WorkshopView.openManualVehicleModal()" style="font-weight:800; background:#10b981; border:none; display:inline-flex; align-items:center; gap:6px;">
                        <span>🚗</span> <span>+ Cadastrar Novo Carro</span>
                    </button>
                </div>

                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <div style="flex:1; min-width:240px; position:relative;">
                        <input type="text" id="ws-dashboard-search-input" class="form-control" placeholder="Digite a placa, chassi ou cliente..." style="font-size:13.5px; padding:10px 14px; text-transform:uppercase; font-family:var(--font-mono); color:var(--brand-cyan); font-weight:700; background:#050811; border-color:rgba(255,255,255,0.15);" onkeyup="if(event.key==='Enter') WorkshopView.handleDashboardSearch()" />
                    </div>
                    <button class="btn btn-cyan" onclick="WorkshopView.handleDashboardSearch()" style="font-weight:800; font-size:12.5px; padding:10px 20px;">
                        🔎 Buscar Carro
                    </button>
                </div>

                <!-- Atalhos Rápidos Dinâmicos do Pátio Real -->
                <div style="margin-top:10px; font-size:11px; color:#64748b;">
                    ${(this.vehiclesList && this.vehiclesList.length > 0) ? `
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span>Atalhos rápidos do pátio:</span>
                            ${this.vehiclesList.slice(0, 5).map(v => `
                                <span class="mono" onclick="WorkshopView.quickDashboardSearch('${v.license_plate}')" style="cursor:pointer; color:var(--brand-cyan); background:#0c1526; padding:2px 8px; border-radius:4px; border:1px solid rgba(0,212,255,0.2);">${v.license_plate} (${v.model || v.brand})</span>
                            `).join('')}
                        </div>
                    ` : `
                        <span>Nenhum veículo no pátio ainda. Cadastre o primeiro carro para ativar atalhos rápidos de busca.</span>
                    `}
                </div>

                <!-- Container de Resultado Dinâmico da Busca na Dashboard -->
                <div id="ws-dashboard-search-result" style="margin-top:14px; display:none;"></div>
            </div>

            <!-- RESUMO DE HOJE (6 CARDS SOLICITADOS) -->
            <div class="ws-erp-section-title">
                <span>📊 Resumo de Hoje</span>
            </div>

            <div class="ws-erp-kpi-grid" id="tour-step-kpis">
                <!-- 1. Veículos Atendidos -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('veiculos-cadastrados')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">Veículos Atendidos</span>
                        <span>🚗</span>
                    </div>
                    <div class="ws-erp-kpi-num">${attendedVehicles}</div>
                    <div class="ws-erp-kpi-foot">${attendedVehicles === 1 ? '1 veículo registrado' : `${attendedVehicles} veículos registrados`}</div>
                </div>

                <!-- 2. Serviços em Andamento -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('servicos-os')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">Serviços em Andamento</span>
                        <span>🔧</span>
                    </div>
                    <div class="ws-erp-kpi-num" style="color:#00d4ff;">${pendingServices}</div>
                    <div class="ws-erp-kpi-foot">${pendingServices} aguardando análise</div>
                </div>
                    <div class="ws-erp-kpi-foot">${pendingServices} aguardando análise</div>
                </div>

                <!-- 3. Manutenções Próximas -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('manutencao-proximas')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">Manutenções Próximas</span>
                        <span>⚠️</span>
                    </div>
                    <div class="ws-erp-kpi-num" style="color:#fbbf24;">${upcomingAlerts}</div>
                    <div class="ws-erp-kpi-foot">Faltando menos de 3.000 km</div>
                </div>

                <!-- 4. Manutenções Atrasadas -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('manutencao-atrasadas')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">Manutenções Atrasadas</span>
                        <span>🔴</span>
                    </div>
                    <div class="ws-erp-kpi-num" style="color:#ef4444;">${criticalAlerts}</div>
                    <div class="ws-erp-kpi-foot">KM limite excedido</div>
                </div>

                <!-- 5. Agendamentos Hoje -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('agenda-oficina')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">Agendamentos Hoje</span>
                        <span>📅</span>
                    </div>
                    <div class="ws-erp-kpi-num" style="color:#10b981;">${todayApps}</div>
                    <div class="ws-erp-kpi-foot">Horários reservados</div>
                </div>

                <!-- 6. WhatsApp Pendentes -->
                <div class="ws-erp-kpi-box" onclick="WorkshopView.switchSection('whatsapp-central')">
                    <div class="ws-erp-kpi-top">
                        <span class="ws-erp-kpi-label">WhatsApp Pendentes</span>
                        <span>💬</span>
                    </div>
                    <div class="ws-erp-kpi-num" style="color:#FFD21C;">${pendingWhatsApp}</div>
                    <div class="ws-erp-kpi-foot">Aguardando resposta do cliente</div>
                </div>
            </div>

            <!-- AÇÕES RÁPIDAS (6 BOTÕES SOLICITADOS) -->
            <div class="ws-erp-section-title">
                <span>⚡ Ações Rápidas</span>
            </div>

            <div class="ws-erp-quick-actions-grid" id="tour-step-actions">
                <button class="ws-erp-quick-btn primary-highlight" id="tour-step-search" onclick="WorkshopView.switchSection('veiculos-pesquisa')">
                    <span style="font-size:16px;">🔎</span>
                    <span>PESQUISAR CARRO</span>
                </button>
                <button class="ws-erp-quick-btn" onclick="WorkshopView.openManualVehicleModal()">
                    <span style="font-size:16px;">🚗</span>
                    <span>CADASTRAR CARRO</span>
                </button>
                <button class="ws-erp-quick-btn" onclick="WorkshopView.switchSection('recepcao-checkin')">
                    <span style="font-size:16px;">🚘</span>
                    <span>NOVA RECEPÇÃO</span>
                </button>
                <button class="ws-erp-quick-btn" onclick="WorkshopView.openNewServiceModal()">
                    <span style="font-size:16px;">🔧</span>
                    <span>NOVO SERVIÇO</span>
                </button>
                <button class="ws-erp-quick-btn" onclick="WorkshopView.openSmartScheduleModal()">
                    <span style="font-size:16px;">📅</span>
                    <span>NOVO AGENDAMENTO</span>
                </button>
                <button class="ws-erp-quick-btn" onclick="WorkshopView.switchSection('whatsapp-central')">
                    <span style="font-size:16px;">💬</span>
                    <span>WHATSAPP</span>
                </button>
            </div>

            <!-- FILA DE ATIVIDADES E PENDÊNCIAS DA OFICINA -->
            <div class="panel-box" style="margin-bottom:16px;">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Ordens de Serviço Recentes & Declarações de Clientes
                    </span>
                    <button class="btn btn-sm btn-secondary" onclick="WorkshopView.switchSection('servicos-os')">Ver Todas</button>
                </div>

                ${(data.pendingConfirmations || []).length === 0 ? `
                    <div style="padding:22px; text-align:center; color:var(--text-muted); font-size:12.5px;">
                        Nenhum serviço declarado por cliente pendente de análise no momento.
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Veículo / Placa</th>
                                    <th>Cliente</th>
                                    <th>Serviço Declarado</th>
                                    <th>Odômetro</th>
                                    <th>Ação Técnica</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.pendingConfirmations.slice(0, 4).map(s => `
                                    <tr>
                                        <td><strong>${s.brand} ${s.model}</strong> <span class="mono" style="color:var(--brand-cyan); font-size:11px;">(${s.license_plate})</span></td>
                                        <td>${s.declared_by_owner_name || 'Cliente Cadastrado'}</td>
                                        <td>${s.service_title}</td>
                                        <td class="mono">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                        <td>
                                            <button class="btn btn-sm btn-success" style="font-size:11px; font-weight:700;" onclick="WorkshopView.submitConfirmation('${s.id}', 'CONFIRMAR')">Homologar Nível 3</button>
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
    // SEÇÃO 2: PESQUISAR VEÍCULO & RESULTADO (SEÇÕES 11 E 12)
    // ──────────────────────────────────────────────────────────────────────────
    renderVehicleSearchView() {
        return `
            <div class="panel-box" style="border-color:var(--brand-cyan); background:linear-gradient(135deg, rgba(0,212,255,0.04), rgba(15,23,42,0.7));">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Pesquisar Veículo no DNA AUTO
                    </span>
                    <span style="font-size:11px; color:var(--text-dim);">Consulta por Placa, Proprietário, Telefone, CPF/CNPJ, DNA ou Chassi</span>
                </div>

                <!-- Seletor do Critério de Busca -->
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
                    <button class="btn btn-sm ${this.searchCriteria === 'placa' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('placa')">Placa</button>
                    <button class="btn btn-sm ${this.searchCriteria === 'proprietario' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('proprietario')">Proprietário</button>
                    <button class="btn btn-sm ${this.searchCriteria === 'telefone' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('telefone')">Telefone</button>
                    <button class="btn btn-sm ${this.searchCriteria === 'documento' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('documento')">CPF / CNPJ</button>
                    <button class="btn btn-sm ${this.searchCriteria === 'dna' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('dna')">Código DNA</button>
                    <button class="btn btn-sm ${this.searchCriteria === 'chassi' ? 'btn-cyan' : 'btn-secondary'}" onclick="WorkshopView.setSearchCriteria('chassi')">Chassi</button>
                </div>

                <!-- Barra de Pesquisa com os DOIS BOTÕES -->
                <div class="ws-search-toolbar">
                    <input type="text" id="ws-vehicle-search" class="form-control ws-search-input"
                           placeholder="Digite a placa (Ex: LQZ9A42, BRA2E19, STR1A99)..."
                           value="${this.lastSearchedPlate || 'PWL4I85'}"
                           onkeydown="if(event.key==='Enter') WorkshopView.handleSearchVehicle()" />
                    <div class="ws-search-dual-actions">
                        <button class="btn btn-cyan ws-btn-search" onclick="WorkshopView.handleSearchVehicle()" style="font-weight:800; display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            🔎 PESQUISAR
                        </button>
                        <button class="ws-btn-cadastrar-carro" onclick="WorkshopView.handleCadastrarCarroBtn()">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            🚗 CADASTRAR CARRO
                        </button>
                    </div>
                </div>

                <!-- Atalhos rápidos de teste -->
                <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:11.5px; color:var(--text-dim);">
                    <span>Atalhos rápidos:</span>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('PWL4I85')">PWL4I85 (VW Fox 1.0)</button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('BRA2E19')">BRA2E19 (Civic 360°)</button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('STR1A99')">STR1A99 (Strada)</button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('ABC1D23')">ABC1D23 (Corolla)</button>
                    <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('KXZ9012')">KXZ9012 (Gol MSI)</button>
                </div>

                <!-- Container do Resultado da Pesquisa -->
                <div id="ws-plate-lookup-result" style="display:none; margin-top:16px;"></div>
            </div>
        `;
    },

    setSearchCriteria(criteria) {
        this.searchCriteria = criteria;
        const input = document.getElementById('ws-vehicle-search');
        if (!input) return;

        const placeholders = {
            placa: 'Digite a placa (Ex: PWL4I85, BRA2E19)...',
            proprietario: 'Digite o nome do cliente (Ex: João da Silva, Carlos Silva)...',
            telefone: 'Digite o telefone/WhatsApp (Ex: 11988881111, 19987654321)...',
            documento: 'Digite o CPF ou CNPJ do proprietário...',
            dna: 'Digite o código DNA AUTO (Ex: DNA-BR-8F72-29A4-X91)...',
            chassi: 'Digite os dígitos do Chassi do veículo...'
        };
        input.placeholder = placeholders[criteria] || 'Digite o termo de busca...';
    },

    // ──────────────────────────────────────────────────────────────────────────
    // RESULTADO DA PESQUISA DO VEÍCULO (SEÇÃO 12)
    // ──────────────────────────────────────────────────────────────────────────
    renderFoundVehicleCard(v, hasDna = true) {
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        const km = Number(v.latest_mileage || v.mileage || 85430);
        const ownerName = v.owner_name || 'João da Silva';
        const ownerPhone = v.owner_phone || '(19) 98765-4321';
        const lastServiceDate = v.last_service_date || '10/08/2026';
        const nextMaintenanceDate = v.next_maintenance_date || '10/11/2026';

        // Alertas associados ao carro
        const alertsForCar = (this.alertsData || []).filter(a => a.licensePlate === v.license_plate || a.vehicleId === v.id);
        const isCritical = alertsForCar.some(a => a.urgency === 'CRITICAL');
        const statusLabel = isCritical ? '🔴 MANUTENÇÃO ATRASADA' : '🟡 MANUTENÇÃO PRÓXIMA';
        const statusColor = isCritical ? '#ef4444' : '#fbbf24';

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="background:#0d1524; border:1px solid ${statusColor}; border-radius:10px; padding:18px; box-shadow:0 10px 30px rgba(0,0,0,0.6);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                    <div>
                        <div style="display:inline-flex; align-items:center; gap:6px; background:${isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}; color:${statusColor}; font-size:11px; font-weight:800; padding:3px 8px; border-radius:4px; margin-bottom:4px;">
                            ${statusLabel}
                        </div>
                        <h3 style="font-size:18px; color:#ffffff; margin:0 0 2px; font-weight:800;">
                            ${v.brand || 'VW'} ${v.model || 'FOX 1.0'} ${v.version_label ? '• ' + v.version_label : ''}
                        </h3>
                        <div style="font-size:12px; color:var(--text-dim);">
                            Placa: <strong class="mono" style="color:var(--brand-cyan); font-size:13px;">${v.license_plate || 'PWL4I85'}</strong>
                            • Ano: <strong>${v.manufacture_year || '2016'}/${v.model_year || '2017'}</strong>
                            • Chassi: <strong class="mono">${v.chassis_vin_masked || v.chassis_vin || '9BW...4810'}</strong>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                </div>

                <!-- Detalhes do Veículo e Proprietário -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(180px, 100%), 1fr)); gap:10px; margin-bottom:16px;">
                    <div style="background:#090e18; padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; display:block;">Proprietário</span>
                        <strong style="font-size:13px; color:#ffffff;">${ownerName}</strong>
                        <div style="font-size:11px; color:var(--brand-cyan);">${ownerPhone}</div>
                    </div>

                    <div style="background:#090e18; padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; display:block;">Quilometragem</span>
                        <strong style="font-size:14px; color:#ffffff; font-family:var(--font-mono);">${km.toLocaleString('pt-BR')} km</strong>
                        <div style="font-size:10.5px; color:#10b981;">Telemetria OBD2 Conectada</div>
                    </div>

                    <div style="background:#090e18; padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; display:block;">Último Serviço</span>
                        <strong style="font-size:12.5px; color:#ffffff;">${lastServiceDate}</strong>
                        <div style="font-size:10.5px; color:var(--text-dim);">Troca de óleo & filtros</div>
                    </div>

                    <div style="background:#090e18; padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; display:block;">Próxima Manutenção</span>
                        <strong style="font-size:12.5px; color:${statusColor}; font-weight:800;">${nextMaintenanceDate}</strong>
                        <div style="font-size:10.5px; color:${statusColor}; font-weight:600;">Kit Correia & Pastilhas</div>
                    </div>
                </div>

                <!-- Alerta Preventivo de Desgaste -->
                ${alertsForCar.length > 0 ? `
                    <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:10px 14px; margin-bottom:14px; font-size:12px;">
                        <strong style="color:#fbbf24;">⚠️ Itens para Revisar Imediatamente:</strong>
                        <ul style="margin:4px 0 0 16px; padding:0; color:#cbd5e1;">
                            ${alertsForCar.map(a => `<li><strong>${a.component}:</strong> ${a.statusText}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- OS 4 BOTÕES OBRIGATÓRIOS DO ITEM 12 -->
                <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
                    <!-- BOTÃO 1: ABRIR FICHA -->
                    <button class="btn btn-secondary" onclick="WorkshopView.openDigitalVehicleSheet('${v.id || 'veh_fox'}', '${v.license_plate || 'PWL4I85'}')" style="font-weight:700;">
                        📋 ABRIR FICHA
                    </button>

                    <!-- BOTÃO 2: NOVO SERVIÇO -->
                    <button class="btn btn-primary" onclick="WorkshopView.openNewServiceModal('${v.id || 'veh_fox'}')" style="font-weight:700;">
                        🔧 NOVO SERVIÇO
                    </button>

                    <!-- BOTÃO 3: AGENDAR (FLUXO 3 DATAS) -->
                    <button class="btn btn-cyan" onclick="WorkshopView.openSmartScheduleModal('${v.id || 'veh_fox'}', '${v.license_plate || 'PWL4I85'}', '${v.brand || 'VW'} ${v.model || 'Fox'}', '${ownerName}')" style="font-weight:700;">
                        📅 AGENDAR
                    </button>

                    <!-- BOTÃO 4: WHATSAPP -->
                    <button class="btn" onclick="WorkshopView.openWhatsAppModal('${ownerName}', '${ownerPhone}', '${v.brand || 'VW'} ${v.model || 'Fox'}', '${v.license_plate || 'PWL4I85'}', 'Kit Correia Dentada & Óleo')" style="background:#25D366; color:#000; font-weight:800; display:inline-flex; align-items:center; gap:5px;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>
                        💬 WHATSAPP
                    </button>
                </div>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // FICHA DIGITAL DO VEÍCULO (SEÇÃO 13)
    // ──────────────────────────────────────────────────────────────────────────
    openDigitalVehicleSheet(vehicleId, plate) {
        const modalRoot = document.getElementById('ws-erp-modal-root');
        if (!modalRoot) return;

        modalRoot.innerHTML = `
            <div class="ws-erp-modal-overlay" onclick="if(event.target===this) WorkshopView.closeModal()">
                <div class="ws-erp-modal-window" style="max-width:720px;">
                    <div class="ws-erp-modal-header">
                        <div>
                            <span style="font-size:10px; font-weight:800; color:var(--brand-cyan); text-transform:uppercase; letter-spacing:0.8px;">DNA AUTO • Registro Oficial</span>
                            <h3 style="font-size:17px; color:#ffffff; margin:2px 0 0; font-weight:900;">FICHA DIGITAL DO VEÍCULO</h3>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="WorkshopView.closeModal()">✕</button>
                    </div>
                    <div class="ws-erp-modal-body">
                        <!-- IDENTIFICAÇÃO -->
                        <div style="background:#0a0f18; padding:14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:14px;">
                            <div style="font-size:11px; font-weight:800; color:#FFD21C; text-transform:uppercase; margin-bottom:8px;">🚗 Identificação do Veículo</div>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(140px, 100%), 1fr)); gap:10px; font-size:12px;">
                                <div><span style="color:#64748b;">Marca:</span> <strong style="color:#ffffff;">Volkswagen</strong></div>
                                <div><span style="color:#64748b;">Modelo:</span> <strong style="color:#ffffff;">Fox 1.0 GII</strong></div>
                                <div><span style="color:#64748b;">Ano Fab/Mod:</span> <strong style="color:#ffffff;">2016 / 2017</strong></div>
                                <div><span style="color:#64748b;">Placa:</span> <strong class="mono" style="color:var(--brand-cyan);">${plate}</strong></div>
                                <div><span style="color:#64748b;">Chassi:</span> <strong class="mono" style="color:#ffffff;">9BW...48109</strong></div>
                                <div><span style="color:#64748b;">Quilometragem:</span> <strong class="mono" style="color:#ffffff;">85.430 km</strong></div>
                            </div>
                        </div>

                        <!-- PROPRIETÁRIO -->
                        <div style="background:#0a0f18; padding:14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:14px;">
                            <div style="font-size:11px; font-weight:800; color:#FFD21C; text-transform:uppercase; margin-bottom:8px;">👤 Dados do Proprietário</div>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(160px, 100%), 1fr)); gap:10px; font-size:12px;">
                                <div><span style="color:#64748b;">Nome:</span> <strong style="color:#ffffff;">João da Silva</strong></div>
                                <div><span style="color:#64748b;">Telefone:</span> <strong style="color:#ffffff;">(19) 98765-4321</strong></div>
                                <div><span style="color:#64748b;">WhatsApp:</span> <strong style="color:#10b981;">(19) 98765-4321</strong></div>
                            </div>
                        </div>

                        <!-- HISTÓRICO COMPLETO 360° -->
                        <div style="background:#0a0f18; padding:14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                            <div style="font-size:11px; font-weight:800; color:#FFD21C; text-transform:uppercase; margin-bottom:10px;">📜 Histórico de Serviços Comprovados</div>

                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <div style="padding:10px; background:#0f172a; border-radius:6px; border-left:3px solid #10b981; font-size:12px;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                        <strong style="color:#ffffff;">🔧 Troca de óleo do motor e filtros</strong>
                                        <span class="mono" style="color:#94a3b8;">10/08/2026</span>
                                    </div>
                                    <div style="color:var(--brand-cyan); font-size:11px; font-family:var(--font-mono);">Odômetro: 85.430 km • Nível 4 Comprovado</div>
                                    <div style="font-size:11px; color:#64748b; margin-top:2px;">Óleo 5W-40 Sintético 502.00 + Filtros Fram</div>
                                </div>

                                <div style="padding:10px; background:#0f172a; border-radius:6px; border-left:3px solid #10b981; font-size:12px;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                        <strong style="color:#ffffff;">🔧 Substituição das pastilhas de freio dianteiras</strong>
                                        <span class="mono" style="color:#94a3b8;">02/06/2026</span>
                                    </div>
                                    <div style="color:var(--brand-cyan); font-size:11px; font-family:var(--font-mono);">Odômetro: 82.100 km • Nível 4 Comprovado</div>
                                    <div style="font-size:11px; color:#64748b; margin-top:2px;">Pastilhas cerâmica Ferodo + Fluido DOT 4</div>
                                </div>

                                <div style="padding:10px; background:#0f172a; border-radius:6px; border-left:3px solid #10b981; font-size:12px;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                        <strong style="color:#ffffff;">🔧 Alinhamento 3D e balanceamento</strong>
                                        <span class="mono" style="color:#94a3b8;">15/03/2026</span>
                                    </div>
                                    <div style="color:var(--brand-cyan); font-size:11px; font-family:var(--font-mono);">Odômetro: 79.500 km • Nível 4 Comprovado</div>
                                    <div style="font-size:11px; color:#64748b; margin-top:2px;">Geometria de suspensão dianteira e traseira</div>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                            <button class="btn btn-secondary" onclick="WorkshopView.closeModal()">Fechar</button>
                            <button class="btn btn-primary" onclick="WorkshopView.closeModal(); WorkshopView.openNewServiceModal('${vehicleId}')" style="font-weight:700;">+ Novo Serviço para este Carro</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    closeModal() {
        const modalRoot = document.getElementById('ws-erp-modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
    },

    // ──────────────────────────────────────────────────────────────────────────
    // CENTRAL DE MANUTENÇÃO PREDITIVA (SEÇÕES 14 E 15)
    // ──────────────────────────────────────────────────────────────────────────
    renderMaintenanceCenterView() {
        const alerts = this.alertsData || [];
        const critical = alerts.filter(a => a.urgency === 'CRITICAL');
        const upcoming = alerts.filter(a => a.urgency === 'WARNING');

        let filteredList = alerts;
        if (this.currentSection === 'manutencao-atrasadas') filteredList = critical;
        else if (this.currentSection === 'manutencao-proximas') filteredList = upcoming;

        return `
            <div class="panel-box" style="border-color:rgba(245,158,11,0.3); background:linear-gradient(135deg, rgba(245,158,11,0.04), rgba(15,23,42,0.7));">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Central de Manutenção Preventiva & Telemetria OBD2
                    </span>
                    <span style="font-size:11px; color:var(--text-dim);">Automatização baseada no KM real do veículo</span>
                </div>

                <!-- Categorias: ATRASADAS, PRÓXIMAS, EM DIA -->
                <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
                    <button class="btn btn-sm ${this.currentSection === 'manutencao-alertas' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.switchSection('manutencao-alertas')">
                        Todas (${alerts.length})
                    </button>
                    <button class="btn btn-sm ${this.currentSection === 'manutencao-atrasadas' ? 'btn-danger' : 'btn-secondary'}" onclick="WorkshopView.switchSection('manutencao-atrasadas')" style="${this.currentSection === 'manutencao-atrasadas' ? 'background:#ef4444; color:#fff;' : ''}">
                        🔴 Atrasadas (${critical.length})
                    </button>
                    <button class="btn btn-sm ${this.currentSection === 'manutencao-proximas' ? 'btn-warning' : 'btn-secondary'}" onclick="WorkshopView.switchSection('manutencao-proximas')" style="${this.currentSection === 'manutencao-proximas' ? 'background:#f59e0b; color:#000;' : ''}">
                        🟡 Próximas (${upcoming.length})
                    </button>
                    <button class="btn btn-sm ${this.currentSection === 'manutencao-historico' ? 'btn-success' : 'btn-secondary'}" onclick="WorkshopView.switchSection('manutencao-historico')">
                        🟢 Em Dia (4)
                    </button>
                </div>

                <!-- Tabela de Alertas de Manutenção -->
                ${filteredList.length === 0 ? `
                    <div style="padding:28px; text-align:center; color:var(--text-muted); font-size:13px;">
                        Nenhuma manutenção pendente nesta categoria.
                    </div>
                ` : `
                    <div class="ws-parts-table-wrap">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Cliente</th>
                                    <th>Veículo / Placa</th>
                                    <th>Manutenção</th>
                                    <th>KM Atual</th>
                                    <th>KM Previsto</th>
                                    <th>Ações Operacionais</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredList.map(a => {
                                    const isCrit = a.urgency === 'CRITICAL';
                                    return `
                                        <tr class="${isCrit ? 'ws-alert-row-critical' : 'ws-alert-row-warning'}">
                                            <td>
                                                <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:10.5px; font-weight:800; background:${isCrit ? '#ef4444' : '#f59e0b'}; color:${isCrit ? '#ffffff' : '#000000'};">
                                                    ${isCrit ? 'ATRASADA' : 'PRÓXIMA'}
                                                </span>
                                            </td>
                                            <td>
                                                <strong style="color:#ffffff;">${a.ownerName}</strong>
                                                <div style="font-size:11px; color:#94a3b8;">${a.ownerPhone}</div>
                                            </td>
                                            <td>
                                                <strong style="color:#ffffff;">${a.vehicleModel}</strong>
                                                <div class="mono" style="font-size:11px; color:var(--brand-cyan);">${a.licensePlate}</div>
                                            </td>
                                            <td>
                                                <strong style="color:${isCrit ? '#f87171' : '#fbbf24'}; font-size:12px;">${a.component}</strong>
                                                <div style="font-size:10px; color:#64748b;">Intervalo: ${Number(a.intervalKm).toLocaleString('pt-BR')} km</div>
                                            </td>
                                            <td class="mono" style="font-weight:700; color:#ffffff;">
                                                ${Number(a.currentKm).toLocaleString('pt-BR')} km
                                            </td>
                                            <td class="mono" style="font-weight:700; color:${isCrit ? '#f87171' : '#fbbf24'};">
                                                ${Number(a.nextServiceKm).toLocaleString('pt-BR')} km
                                            </td>
                                            <td>
                                                <div style="display:flex; gap:6px;">
                                                    <button class="btn btn-sm btn-cyan" onclick="WorkshopView.openSmartScheduleModal('${a.vehicleId}', '${a.licensePlate}', '${a.vehicleModel}', '${a.ownerName}', '${a.component}')" style="font-size:11px; font-weight:700;">
                                                        📅 Agendar
                                                    </button>
                                                    <button class="btn btn-sm" onclick="WorkshopView.openWhatsAppModal('${a.ownerName}', '${a.ownerPhone}', '${a.vehicleModel}', '${a.licensePlate}', '${a.component}')" style="background:#25D366; color:#000; font-size:11px; font-weight:800;">
                                                        💬 WhatsApp
                                                    </button>
                                                </div>
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
    // BUSCA RÁPIDA DE VEÍCULOS DIRETO NA DASHBOARD (SEÇÃO 1)
    // ──────────────────────────────────────────────────────────────────────────
    async handleDashboardSearch() {
        const input = document.getElementById('ws-dashboard-search-input');
        const term = (input?.value || '').trim();
        const resultContainer = document.getElementById('ws-dashboard-search-result');
        if (!term) {
            alert('Digite uma placa, chassi ou nome do cliente para pesquisar.');
            return;
        }

        if (resultContainer) {
            resultContainer.style.display = 'block';
            resultContainer.innerHTML = `
                <div style="padding:16px; text-align:center; background:#0d1527; border-radius:8px; border:1px solid rgba(0,212,255,0.25);">
                    <div class="pulse-dot" style="margin:0 auto 8px;"></div>
                    <strong style="color:#ffffff; font-size:13px;">Localizando Veículo ${term}...</strong>
                    <span style="display:block; font-size:11px; color:#94a3b8; margin-top:2px;">Consultando base DNA AUTO e conectores oficiais</span>
                </div>
            `;
        }

        try {
            const clean = term.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const res = await API.searchVehicle(clean.length >= 3 ? clean : term);

            if (res && res.found && res.vehicle) {
                const v = res.vehicle;
                const ownerName = v.owner_name || 'Proprietário Cadastrado';
                const ownerPhone = v.owner_phone || '(19) 98765-4321';
                const km = Number(v.current_mileage || v.mileage || 85000).toLocaleString('pt-BR');

                resultContainer.innerHTML = `
                    <div style="background:#0c1424; border:1px solid #10b981; border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${v.photo_url || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=120'}" alt="${v.model}" style="width:60px; height:44px; object-fit:cover; border-radius:6px; border:1px solid rgba(255,255,255,0.15);" />
                            <div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <strong style="color:#ffffff; font-size:15px;">${v.brand} ${v.model}</strong>
                                    <span class="mono" style="background:rgba(0,212,255,0.15); color:var(--brand-cyan); font-weight:800; font-size:12px; padding:2px 7px; border-radius:4px; border:1px solid rgba(0,212,255,0.3);">${v.license_plate}</span>
                                    <span class="badge-proof badge-proven" style="font-size:10px;">${v.dna_code || 'DNA-ATIVO'}</span>
                                </div>
                                <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px;">
                                    👤 <strong>${ownerName}</strong> • WhatsApp: <span style="color:#25D366; font-weight:700;">${ownerPhone}</span> • Odômetro: <strong>${km} km</strong>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn btn-sm" onclick="WorkshopView.openWhatsAppModal('${ownerName}', '${ownerPhone}', '${v.brand} ${v.model}', '${v.license_plate}', 'Revisão Preventiva')" style="background:#25D366; color:#000; font-weight:800; font-size:11.5px; display:inline-flex; align-items:center; gap:5px; border:none;">
                                <span>📱</span> <span>Enviar WhatsApp</span>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="WorkshopView.openNewServiceModal('${v.id}')" style="background:#10b981; border:none; font-weight:800; font-size:11.5px;">
                                🔧 Novo Serviço
                            </button>
                            <button class="btn btn-sm btn-cyan" onclick="DossierView.render('${v.dna_code || v.license_plate}')" style="font-size:11.5px;">
                                Ficha / Dossiê
                            </button>
                        </div>
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `
                    <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <strong style="color:#fbbf24; font-size:13px; display:block;">⚠️ Veículo "${term}" não encontrado na base local</strong>
                            <span style="font-size:11.5px; color:#94a3b8;">Cadastre o carro com proprietário e foto agora para iniciar o atendimento.</span>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="WorkshopView.openManualVehicleModal('${term}')" style="background:#10b981; border:none; font-weight:800; font-size:12px;">
                            + Cadastrar Carro Agora
                        </button>
                    </div>
                `;
            }
        } catch (err) {
            resultContainer.innerHTML = `
                <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:12px; color:#f87171; font-size:12px;">
                    Erro na busca: ${err.message}
                </div>
            `;
        }
    },

    quickDashboardSearch(plate) {
        const input = document.getElementById('ws-dashboard-search-input');
        if (input) {
            input.value = plate;
            this.handleDashboardSearch();
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 8: CENTRAL OFICIAL DE WHATSAPP BAILEYS (MULTI-TENANT POR OFICINA)
    // ──────────────────────────────────────────────────────────────────────────
    async loadWhatsAppStatus(shouldRender = true) {
        try {
            const res = await API.getWhatsAppStatus(this.currentWorkshopId);
            this.whatsAppData = res || { status: 'DISCONNECTED' };

            // Se estiver em pareamento, ativa polling suave a cada 3 segundos
            if (this.whatsAppData.status === 'PAIRING' && !this.whatsAppPollingInterval) {
                this.whatsAppPollingInterval = setInterval(() => {
                    this.pollWhatsAppStatus();
                }, 3000);
            } else if (this.whatsAppData.status !== 'PAIRING' && this.whatsAppPollingInterval) {
                clearInterval(this.whatsAppPollingInterval);
                this.whatsAppPollingInterval = null;
            }

            // Atualiza badge no menu
            const badge = document.getElementById('ws-menu-wpp-badge');
            if (badge) {
                if (this.whatsAppData.status === 'CONNECTED') {
                    badge.textContent = '🟢 Online';
                    badge.style.color = '#10b981';
                    badge.style.background = 'rgba(16,185,129,0.15)';
                } else if (this.whatsAppData.status === 'PAIRING') {
                    badge.textContent = '🟡 Pareando';
                    badge.style.color = '#fbbf24';
                    badge.style.background = 'rgba(251,191,36,0.15)';
                } else {
                    badge.textContent = 'Oficial';
                    badge.style.color = '#25D366';
                    badge.style.background = 'rgba(37,211,102,0.15)';
                }
            }

            // Carrega templates se ainda não carregados
            if (this.whatsAppTemplates.length === 0) {
                try {
                    const tRes = await API.getWhatsAppTemplates(this.currentWorkshopId);
                    this.whatsAppTemplates = (tRes && tRes.templates) ? tRes.templates : [];
                } catch (_) {}
            }

            // Carrega histórico se conectado
            if (this.whatsAppData.status === 'CONNECTED') {
                try {
                    const hRes = await API.getWhatsAppHistory(this.currentWorkshopId);
                    this.whatsAppHistory = (hRes && hRes.history) ? hRes.history : [];
                } catch (_) {}
            }

            if (shouldRender && this.currentSection === 'whatsapp-central') {
                const viewport = document.getElementById('ws-erp-active-viewport');
                if (viewport) viewport.innerHTML = this.renderWhatsAppCenterView();
            }
        } catch (e) {
            console.warn('Erro ao carregar status do WhatsApp:', e.message);
        }
    },

    async pollWhatsAppStatus() {
        try {
            const res = await API.getWhatsAppStatus(this.currentWorkshopId);
            if (res && res.status !== this.whatsAppData?.status) {
                this.whatsAppData = res;
                if (res.status === 'CONNECTED') {
                    clearInterval(this.whatsAppPollingInterval);
                    this.whatsAppPollingInterval = null;
                }
                const viewport = document.getElementById('ws-erp-active-viewport');
                if (viewport && this.currentSection === 'whatsapp-central') {
                    viewport.innerHTML = this.renderWhatsAppCenterView();
                }
            }
        } catch (_) {}
    },

    renderWhatsAppCenterView() {
        const session = this.whatsAppData || { status: 'DISCONNECTED' };
        const status = session.status || 'DISCONNECTED';
        const isConnected = status === 'CONNECTED';
        const isPairing = status === 'PAIRING';
        const displayPhone = session.display_phone || session.phone_number || this.officialPhone || '+55 (19) 3245-6789';

        // 1. ESTADO: DESCONECTADO (TELA LIMPA CONFORME SOLICITADO)
        if (!isConnected && !isPairing) {
            return `
                <div style="padding:20px;">
                    <div class="panel-box" style="max-width:560px; margin:30px auto; padding:38px 32px; text-align:center; background:#0a0f1d; border:1px solid rgba(37,211,102,0.35); border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,0.6);">
                        <div style="width:68px; height:68px; margin:0 auto 16px; border-radius:50%; background:rgba(37,211,102,0.12); display:flex; align-items:center; justify-content:center; border:1px solid rgba(37,211,102,0.4);">
                            <span style="font-size:34px;">📱</span>
                        </div>
                        <h3 style="color:#ffffff; font-size:20px; font-weight:800; margin:0 0 6px;">Conecte o WhatsApp da sua oficina</h3>
                        <p style="color:#94a3b8; font-size:13px; margin:0 0 24px;">Envie mensagens aos seus clientes diretamente pelo DNA AUTO.</p>
                        
                        <form onsubmit="WorkshopView.startWhatsAppConnect(event)" style="max-width:340px; margin:0 auto; text-align:left;">
                            <label style="display:block; font-size:12px; color:#cbd5e1; font-weight:700; margin-bottom:6px;">Número do WhatsApp</label>
                            <input type="text" id="ws-wpp-phone-input" class="form-control" placeholder="+55 (__) _____-____" value="${displayPhone !== '(19) 3245-6789' ? displayPhone : ''}" style="font-size:15px; text-align:center; font-weight:800; letter-spacing:1px; background:#050811; border-color:rgba(255,255,255,0.18); padding:12px;" required />
                            
                            <button type="submit" id="ws-wpp-connect-btn" class="btn btn-primary" style="width:100%; margin-top:14px; padding:12px; font-weight:800; font-size:14px; background:#25D366; color:#000; border:none; letter-spacing:0.5px; cursor:pointer;">
                                CONTINUAR →
                            </button>
                        </form>

                        <div style="margin-top:26px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.06); font-size:12px; color:#64748b; line-height:1.5;">
                            "Você poderá enviar avisos sobre veículos, serviços, orçamentos, revisões e certificações."
                        </div>
                    </div>
                </div>
            `;
        }

        // 2. ESTADO: PROCESSO DE AUTENTICAÇÃO / PAREAMENTO
        if (isPairing) {
            const pairingCode = session.pairing_code || '8492-3105';
            return `
                <div style="padding:20px;">
                    <div class="panel-box" style="max-width:620px; margin:20px auto; padding:32px 28px; text-align:center; background:#0a0f1d; border:1px solid rgba(0,212,255,0.45); border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,0.6);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                            <span style="font-size:11px; font-weight:800; color:var(--brand-cyan); text-transform:uppercase; letter-spacing:0.5px;">CONEXÃO BAILEYS • OFICINA EXCLUSIVA</span>
                            <button class="btn btn-xs btn-secondary" onclick="WorkshopView.disconnectWhatsAppNow()">Cancelar</button>
                        </div>

                        <h3 style="color:#ffffff; font-size:19px; font-weight:800; margin:0 0 6px;">Conecte seu WhatsApp</h3>
                        <p style="color:#94a3b8; font-size:12.5px; margin:0 0 20px;">Abra o WhatsApp no seu celular e siga as instruções para vincular este dispositivo.</p>

                        <!-- Bloco do Código de Pareamento de 8 Dígitos -->
                        <div style="background:#060a14; border:1px solid rgba(255,210,28,0.45); border-radius:10px; padding:18px; margin-bottom:20px;">
                            <span style="font-size:12px; color:#cbd5e1; display:block; margin-bottom:8px; font-weight:600;">
                                Digite o código exibido abaixo no WhatsApp para confirmar a conexão:
                            </span>
                            <div style="font-size:34px; font-weight:900; letter-spacing:4px; font-family:var(--font-mono); color:#FFD21C; text-shadow:0 0 15px rgba(255,210,28,0.35); margin:6px 0;">
                                ${pairingCode}
                            </div>
                            <button class="btn btn-xs" onclick="navigator.clipboard.writeText('${pairingCode}'); alert('Código ${pairingCode} copiado com sucesso!');" style="margin-top:8px; background:rgba(255,210,28,0.12); color:#FFD21C; border:1px solid rgba(255,210,28,0.3); font-weight:700; padding:4px 12px; border-radius:4px; cursor:pointer;">
                                📋 Copiar Código
                            </button>
                        </div>

                        <!-- QR Code Alternativo para Leitura Direta -->
                        ${session.qr_code_url ? `
                            <div style="margin:16px 0;">
                                <span style="font-size:11.5px; color:#64748b; display:block; margin-bottom:8px;">Ou aponte a câmera do WhatsApp para escanear o QR Code:</span>
                                <img src="${session.qr_code_url}" alt="QR Code WhatsApp" style="width:180px; height:180px; border-radius:8px; border:3px solid #ffffff; background:#ffffff; padding:4px;" />
                            </div>
                        ` : ''}

                        <!-- Indicador de Espera Pulsante -->
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:20px; color:#38bdf8; font-size:12.5px;">
                            <span class="pulse-dot" style="width:8px; height:8px;"></span>
                            <span>Estamos aguardando a confirmação...</span>
                        </div>

                        <div style="margin-top:18px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:center; gap:10px;">
                            <button class="btn btn-sm btn-primary" onclick="WorkshopView.confirmWhatsAppNow()" style="background:#10b981; border:none; font-weight:800; font-size:12px; padding:7px 18px; cursor:pointer;">
                                ✓ Confirmar Conexão Realizada
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 3. ESTADO: CONEXÃO CONCLUÍDA (ONLINE COM CONTROLES COMPLETOS)
        const lastConn = session.last_connected_at ? new Date(session.last_connected_at).toLocaleString('pt-BR') : 'Hoje às 16:00';
        const activeTab = this.whatsAppActiveTab || 'envio';

        return `
            <div style="padding:10px 16px;">
                <!-- Card de Sucesso da Conexão Ativa -->
                <div class="panel-box" style="background:#090f1d; border:1px solid rgba(16,185,129,0.35); border-radius:12px; padding:20px 24px; margin-bottom:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
                        <div style="display:flex; align-items:center; gap:14px;">
                            <div style="width:52px; height:52px; border-radius:50%; background:rgba(16,185,129,0.12); display:flex; align-items:center; justify-content:center; border:1px solid rgba(16,185,129,0.4);">
                                <span style="font-size:26px;">🟢</span>
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <strong style="color:#ffffff; font-size:17px;">WhatsApp Conectado</strong>
                                    <span class="badge-proof badge-proven" style="font-size:10px; font-weight:800;">🟢 Online</span>
                                </div>
                                <div style="font-size:13px; color:#10b981; font-weight:700; margin-top:2px;">
                                    WhatsApp da oficina: <span class="mono">${displayPhone}</span>
                                </div>
                                <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">
                                    "Seu WhatsApp está conectado ao DNA AUTO." • Última conexão: <strong>${lastConn}</strong>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn btn-sm" onclick="WorkshopView.switchWhatsAppTab('envio')" style="background:#25D366; color:#000; font-weight:800; font-size:12px; padding:7px 16px; border:none; display:inline-flex; align-items:center; gap:5px; cursor:pointer;">
                                <span>💬</span> <span>ENVIAR MENSAGEM</span>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="WorkshopView.disconnectWhatsAppNow()" style="font-size:11.5px; padding:7px 14px; border-color:rgba(255,255,255,0.15); cursor:pointer;">
                                ⚙️ Desconectar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Sub-Abas da Central do WhatsApp -->
                <div style="display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
                    <button class="btn btn-sm ${activeTab === 'envio' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.switchWhatsAppTab('envio')" style="font-weight:700;">
                        📨 Enviar Mensagem Avulsa ou por Template
                    </button>
                    <button class="btn btn-sm ${activeTab === 'historico' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.switchWhatsAppTab('historico')" style="font-weight:700;">
                        📜 Histórico de Mensagens (${this.whatsAppHistory.length})
                    </button>
                    <button class="btn btn-sm ${activeTab === 'templates' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.switchWhatsAppTab('templates')" style="font-weight:700;">
                        📋 Modelos de Mensagens (${this.whatsAppTemplates.length})
                    </button>
                </div>

                <!-- Conteúdo da Aba Selecionada -->
                ${activeTab === 'envio' ? this.renderWhatsAppSendTab() : ''}
                ${activeTab === 'historico' ? this.renderWhatsAppHistoryTab() : ''}
                ${activeTab === 'templates' ? this.renderWhatsAppTemplatesTab() : ''}
            </div>
        `;
    },

    // Sub-Aba 1: Enviar Mensagem por Template ou Personalizada
    renderWhatsAppSendTab() {
        const templates = this.whatsAppTemplates || [];
        const vehicles = this.vehiclesList || [];

        return `
            <div class="panel-box" style="background:#0b111e; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:22px;">
                <div style="font-size:13.5px; font-weight:800; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
                    <span>💬</span> <span>Nova Mensagem Oficial para Cliente</span>
                </div>

                <form onsubmit="WorkshopView.submitDirectWhatsAppMessage(event)" style="display:flex; flex-direction:column; gap:14px;">
                    <!-- Selecionar Veículo / Cliente Cadastrado (Opcional para preenchimento automático) -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label" style="font-size:11.5px;">Selecionar Veículo do Pátio (Preenche dados automaticamente)</label>
                            <select id="ws-wpp-veh-select" class="form-control" onchange="WorkshopView.onVehicleSelectForWhatsApp(this.value)" style="background:#060a14; border-color:rgba(255,255,255,0.15); font-size:12.5px;">
                                <option value="">-- Selecione ou digite manualmente abaixo --</option>
                                ${vehicles.map(v => `
                                    <option value="${v.id}" data-name="${v.owner_name || ''}" data-phone="${v.owner_phone || ''}" data-brand="${v.brand || ''}" data-model="${v.model || ''}" data-plate="${v.license_plate || ''}">
                                        ${v.brand} ${v.model} (${v.license_plate}) — ${v.owner_name || 'Cliente'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-size:11.5px;">Modelo Automático (Template)</label>
                            <select id="ws-wpp-template-select" class="form-control" onchange="WorkshopView.onTemplateSelected(this.value)" style="background:#060a14; border-color:rgba(255,210,28,0.3); font-size:12.5px; color:#FFD21C; font-weight:700;">
                                <option value="">-- Escolha um modelo de mensagem pronto --</option>
                                ${templates.map(t => `
                                    <option value="${t.id}">${t.name} (${t.category})</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label" style="font-size:11.5px;">Nome do Cliente *</label>
                            <input type="text" id="ws-wpp-dest-name" class="form-control" placeholder="Ex: João da Silva" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="font-size:11.5px;">WhatsApp do Destinatário *</label>
                            <input type="text" id="ws-wpp-dest-phone" class="form-control" placeholder="+55 (19) 99999-9999" required />
                        </div>
                    </div>

                    <!-- Mensagem com Variáveis Editáveis -->
                    <div class="form-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <label class="form-label" style="font-size:11.5px;">Mensagem Formatada *</label>
                            <span style="font-size:10.5px; color:#64748b;">Variáveis suportadas: {cliente}, {veiculo}, {marca}, {modelo}, {placa}, {oficina}, {servico}, {valor}, {data}, {link}</span>
                        </div>
                        <textarea id="ws-wpp-dest-msg" class="form-control" rows="6" placeholder="Digite a mensagem ou selecione um modelo acima..." style="font-size:13px; line-height:1.5; padding:12px; background:#060a14; border-color:rgba(37,211,102,0.35);" required></textarea>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:10px;">
                        <span style="font-size:11.5px; color:#94a3b8;">
                            🛡️ Fila de envio protegida: o sistema controla a taxa de envio para garantir comunicação legítima e segura.
                        </span>
                        <button type="submit" class="btn btn-primary" style="background:#25D366; color:#000; font-weight:800; font-size:13px; padding:9px 24px; border:none; display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
                            <span>📱</span> <span>ENVIAR WHATSAPP AGORA</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    // Sub-Aba 2: Histórico de Mensagens Transmitidas
    renderWhatsAppHistoryTab() {
        const history = this.whatsAppHistory || [];

        return `
            <div class="panel-box" style="background:#0b111e; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
                    <div style="font-size:13.5px; font-weight:800; color:#ffffff; display:flex; align-items:center; gap:8px;">
                        <span>📜</span> <span>Histórico de Mensagens da Oficina</span>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="WorkshopView.loadWhatsAppStatus()" style="font-size:11px;">🔄 Atualizar Histórico</button>
                </div>

                ${history.length === 0 ? `
                    <div style="padding:30px; text-align:center; color:#64748b; font-size:12.5px;">
                        Nenhuma mensagem transmitida até o momento. Envie avisos aos seus clientes para registrar o histórico.
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Destinatário</th>
                                    <th>Telefone</th>
                                    <th>Veículo / Placa</th>
                                    <th>Mensagem</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(m => {
                                    const dateObj = new Date(m.created_at);
                                    const dateStr = dateObj.toLocaleDateString('pt-BR');
                                    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    const isSent = m.status === 'SENT';
                                    const isPending = m.status === 'PENDING' || m.status === 'PROCESSING';

                                    return `
                                        <tr>
                                            <td>
                                                <strong style="color:#ffffff; font-family:var(--font-mono); font-size:11px;">${dateStr}</strong>
                                                <div style="font-size:10.5px; color:#94a3b8; font-family:var(--font-mono);">${timeStr}</div>
                                            </td>
                                            <td><strong style="color:#ffffff;">${m.client_name || 'Cliente'}</strong></td>
                                            <td class="mono" style="color:#25D366; font-size:11.5px;">${m.phone_number}</td>
                                            <td>
                                                ${m.model ? `${m.brand || ''} ${m.model} <span class="mono" style="color:var(--brand-cyan); font-size:10.5px;">(${m.license_plate})</span>` : '<span style="color:#64748b;">-</span>'}
                                            </td>
                                            <td style="max-width:280px; font-size:11.5px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${m.message}">
                                                ${m.message}
                                            </td>
                                            <td>
                                                ${isSent ? `
                                                    <span class="badge-proof badge-proven" style="font-size:9.5px; padding:2px 7px;">🟢 Enviada</span>
                                                ` : isPending ? `
                                                    <span class="badge-proof badge-pending" style="font-size:9.5px; padding:2px 7px;">🟡 Aguardando</span>
                                                ` : `
                                                    <span class="badge-proof badge-rejected" style="font-size:9.5px; padding:2px 7px;">🔴 Falhou</span>
                                                `}
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

    // Sub-Aba 3: Modelos de Mensagens Pré-Configurados (Templates)
    renderWhatsAppTemplatesTab() {
        const templates = this.whatsAppTemplates || [];

        return `
            <div class="panel-box" style="background:#0b111e; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:20px;">
                <div style="font-size:13.5px; font-weight:800; color:#ffffff; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                    <span>📋</span> <span>Modelos Automáticos de WhatsApp Homologados</span>
                </div>
                <p style="font-size:12px; color:#94a3b8; margin:0 0 16px 0;">
                    Estes modelos utilizam as variáveis dinâmicas do veículo e do cliente para gerar mensagens personalizadas e profissionais em 1 clique.
                </p>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px;">
                    ${templates.map(t => `
                        <div style="background:#060a14; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <strong style="color:#ffffff; font-size:13px;">${t.name}</strong>
                                    <span class="mono" style="font-size:9.5px; color:#FFD21C; background:rgba(255,210,28,0.1); padding:1px 6px; border-radius:3px;">${t.category}</span>
                                </div>
                                <p style="font-size:11.5px; color:#94a3b8; line-height:1.4; margin:0 0 10px 0; background:#080c18; padding:8px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                                    "${t.content}"
                                </p>
                            </div>
                            <div style="display:flex; justify-content:flex-end;">
                                <button class="btn btn-xs btn-cyan" onclick="WorkshopView.useTemplateInSend('${t.id}')" style="font-size:11px; font-weight:700;">
                                    Usar Este Modelo →
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Handlers da Central do WhatsApp
    switchWhatsAppTab(tabName) {
        this.whatsAppActiveTab = tabName;
        const viewport = document.getElementById('ws-erp-active-viewport');
        if (viewport) viewport.innerHTML = this.renderWhatsAppCenterView();
    },

    useTemplateInSend(templateId) {
        this.switchWhatsAppTab('envio');
        setTimeout(() => {
            const select = document.getElementById('ws-wpp-template-select');
            if (select) {
                select.value = templateId;
                this.onTemplateSelected(templateId);
            }
        }, 50);
    },

    onVehicleSelectForWhatsApp(vehicleId) {
        if (!vehicleId) return;
        const select = document.getElementById('ws-wpp-veh-select');
        const opt = select?.selectedOptions[0];
        if (!opt) return;

        const nameInput = document.getElementById('ws-wpp-dest-name');
        const phoneInput = document.getElementById('ws-wpp-dest-phone');

        if (nameInput) nameInput.value = opt.getAttribute('data-name') || '';
        if (phoneInput) phoneInput.value = opt.getAttribute('data-phone') || '';

        // Se já tiver template selecionado, re-aplica com os novos dados
        const templateSelect = document.getElementById('ws-wpp-template-select');
        if (templateSelect && templateSelect.value) {
            this.onTemplateSelected(templateSelect.value);
        }
    },

    onTemplateSelected(templateId) {
        if (!templateId) return;
        const template = (this.whatsAppTemplates || []).find(t => t.id === templateId);
        if (!template) return;

        const vehSelect = document.getElementById('ws-wpp-veh-select');
        const opt = vehSelect?.selectedOptions[0];

        const clientName = document.getElementById('ws-wpp-dest-name')?.value || opt?.getAttribute('data-name') || 'Cliente';
        const brand = opt?.getAttribute('data-brand') || 'Veículo';
        const model = opt?.getAttribute('data-model') || '';
        const plate = opt?.getAttribute('data-plate') || 'ABC1D23';
        const vehicle = `${brand} ${model}`.trim();
        const workshop = this.officialWorkshopName || 'DNA AUTO Centro Automotivo';

        let filled = template.content
            .replace(/{cliente}/gi, clientName)
            .replace(/{veiculo}/gi, vehicle)
            .replace(/{marca}/gi, brand)
            .replace(/{modelo}/gi, model)
            .replace(/{placa}/gi, plate)
            .replace(/{oficina}/gi, workshop)
            .replace(/{servico}/gi, 'Revisão Preventiva')
            .replace(/{valor}/gi, '450,00')
            .replace(/{data}/gi, new Date().toLocaleDateString('pt-BR'))
            .replace(/{link}/gi, 'https://dnaauto.com.br');

        const msgBox = document.getElementById('ws-wpp-dest-msg');
        if (msgBox) msgBox.value = filled;
    },

    async startWhatsAppConnect(e) {
        if (e) e.preventDefault();
        const input = document.getElementById('ws-wpp-phone-input');
        const phone = (input?.value || '').trim();
        if (!phone) {
            alert('Informe o número de WhatsApp da oficina.');
            return;
        }

        const btn = document.getElementById('ws-wpp-connect-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'INICIALIZANDO BAILEYS...';
        }

        try {
            const res = await API.connectWhatsApp(this.currentWorkshopId, phone);
            this.whatsAppData = res;
            this.loadWhatsAppStatus(true);
        } catch (err) {
            alert('Erro ao iniciar conexão: ' + err.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'CONTINUAR →';
            }
        }
    },

    async confirmWhatsAppNow() {
        try {
            const res = await API.confirmWorkshopWhatsapp(this.currentWorkshopId, '123456');
            this.whatsAppData = {
                status: 'CONNECTED',
                phone_number: res.session?.phone_number || this.whatsAppData?.phone_number,
                display_phone: this.whatsAppData?.display_phone,
                last_connected_at: new Date().toISOString()
            };
            alert('🟢 WhatsApp conectado com sucesso ao DNA AUTO!');
            await this.loadWhatsAppStatus(true);
        } catch (err) {
            alert('Erro ao confirmar WhatsApp: ' + err.message);
        }
    },

    async disconnectWhatsAppNow() {
        if (!confirm('Deseja desconectar o WhatsApp da oficina?')) return;
        try {
            await API.disconnectWhatsApp(this.currentWorkshopId);
            this.whatsAppData = { status: 'DISCONNECTED' };
            await this.loadWhatsAppStatus(true);
        } catch (err) {
            alert('Erro ao desconectar: ' + err.message);
        }
    },

    async submitDirectWhatsAppMessage(e) {
        e.preventDefault();
        const name = document.getElementById('ws-wpp-dest-name')?.value || '';
        const phone = document.getElementById('ws-wpp-dest-phone')?.value || '';
        const message = document.getElementById('ws-wpp-dest-msg')?.value || '';
        const vehSelect = document.getElementById('ws-wpp-veh-select');

        if (!phone || !message) {
            alert('Telefone e mensagem são obrigatórios.');
            return;
        }

        try {
            const res = await API.sendWhatsAppMessage(this.currentWorkshopId, {
                recipient_name: name,
                recipient_phone: phone,
                message: message,
                vehicle_id: vehSelect?.value || null
            });

            alert(`✅ Mensagem enviada com sucesso!\n\nDestinatário: ${name} (${phone})\nProtocolo: ${res.protocol || res.message_id}\n\nA mensagem foi inserida no histórico.`);
            await this.loadWhatsAppStatus(false);
            this.switchWhatsAppTab('historico');
        } catch (err) {
            alert('Erro ao enviar mensagem: ' + err.message);
        }
    },

    // Modal de Envio Direto de WhatsApp pelo Cadastro do Cliente e Veículo
    openWhatsAppModal(clientName = 'Cliente', clientPhone = '(19) 99999-9999', vehicleName = 'Veículo', plate = 'ABC1D23', serviceName = 'Revisão Preventiva') {
        const modalRoot = document.getElementById('ws-erp-modal-root');
        if (!modalRoot) return;

        const templates = this.whatsAppTemplates || [];
        const defaultText = `Olá ${clientName}, seu veículo ${vehicleName} está pronto para retirada na oficina ${this.officialWorkshopName}. Foi finalizado o serviço de ${serviceName}. Ficamos à disposição!`;

        modalRoot.innerHTML = `
            <div class="ws-erp-modal-overlay" onclick="if(event.target===this) WorkshopView.closeModal()">
                <div class="ws-erp-modal-window" style="max-width:580px;">
                    <div class="ws-erp-modal-header" style="background:#0a0f1d; border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 20px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:20px;">📱</span>
                            <div>
                                <strong style="color:#ffffff; font-size:15px; display:block;">Enviar WhatsApp</strong>
                                <span style="font-size:11.5px; color:#10b981;">Transmissão Direta pelo DNA AUTO</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="WorkshopView.closeModal()">✕</button>
                    </div>

                    <div class="ws-erp-modal-body" id="ws-whatsapp-modal-body" style="padding:20px;">
                        <div style="background:#060a14; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px 14px; margin-bottom:14px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:12px; color:#94a3b8;">Para:</span>
                                <strong style="color:#ffffff; font-size:12.5px;">${clientName}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:12px; color:#94a3b8;">WhatsApp:</span>
                                <strong style="color:#25D366; font-size:12.5px; font-family:var(--font-mono);">${clientPhone}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="font-size:12px; color:#94a3b8;">Veículo / Placa:</span>
                                <strong style="color:var(--brand-cyan); font-size:12px;">${vehicleName} (${plate})</strong>
                            </div>
                        </div>

                        <!-- Seletor Rápido de Template -->
                        <div class="form-group" style="margin-bottom:12px;">
                            <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">Modelo de Mensagem (Opcional):</label>
                            <select id="ws-modal-template-select" class="form-control" onchange="WorkshopView.applyModalTemplate(this.value, '${clientName}', '${vehicleName}', '${plate}', '${serviceName}')" style="background:#060a14; border-color:rgba(255,210,28,0.3); font-size:12px; color:#FFD21C; font-weight:700;">
                                <option value="">-- Personalizado / Selecione um template --</option>
                                ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">Mensagem:</label>
                            <textarea id="ws-whatsapp-message-text" class="form-control" rows="6" style="font-family:sans-serif; font-size:13px; line-height:1.5; padding:12px; background:#060a14; border-color:rgba(37,211,102,0.4);">${defaultText}</textarea>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                            <button class="btn btn-secondary btn-sm" onclick="WorkshopView.closeModal()">CANCELAR</button>
                            <button class="btn btn-sm" style="background:#25D366; color:#000; font-weight:800; padding:8px 20px; border:none; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" onclick="WorkshopView.sendWhatsAppInPlatform('${clientName}', '${clientPhone}', '${vehicleName}', '${plate}', '${serviceName}')">
                                <span>📱</span> <span>ENVIAR</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    applyModalTemplate(templateId, clientName, vehicleName, plate, serviceName) {
        if (!templateId) return;
        const template = (this.whatsAppTemplates || []).find(t => t.id === templateId);
        if (!template) return;

        const filled = template.content
            .replace(/{cliente}/gi, clientName)
            .replace(/{veiculo}/gi, vehicleName)
            .replace(/{marca}/gi, vehicleName.split(' ')[0] || 'Veículo')
            .replace(/{modelo}/gi, vehicleName)
            .replace(/{placa}/gi, plate)
            .replace(/{oficina}/gi, this.officialWorkshopName || 'DNA AUTO')
            .replace(/{servico}/gi, serviceName)
            .replace(/{valor}/gi, '380,00')
            .replace(/{data}/gi, new Date().toLocaleDateString('pt-BR'))
            .replace(/{link}/gi, 'https://dnaauto.com.br');

        const txt = document.getElementById('ws-whatsapp-message-text');
        if (txt) txt.value = filled;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // FLUXO DE AGENDAMENTO INTELIGENTE (3 DATAS FUTURAS - 08H ÀS 18H COM ALMOÇO CINZA)
    // ──────────────────────────────────────────────────────────────────────────
    openSmartScheduleModal(vehicleId = 'veh_demo', plate = 'PWL4I85', vehicleName = 'VW Fox 1.0', clientName = 'João da Silva', serviceName = 'Troca de Óleo & Kit Correia') {
        const modalRoot = document.getElementById('ws-erp-modal-root');
        if (!modalRoot) return;

        // Calcula as 3 próximas datas úteis a partir de hoje
        const dates = this.calculateNext3AvailableDates();

        modalRoot.innerHTML = `
            <div class="ws-erp-modal-overlay" onclick="if(event.target===this) WorkshopView.closeModal()">
                <div class="ws-erp-modal-window" style="max-width:700px;">
                    <div class="ws-erp-modal-header">
                        <div>
                            <span style="font-size:10px; font-weight:800; color:#10b981; text-transform:uppercase;">DNA AUTO • Agendamento Operacional da Oficina</span>
                            <h3 style="font-size:16px; color:#ffffff; margin:2px 0 0; font-weight:900;">ESCOLHA O MELHOR DIA E HORÁRIO</h3>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="WorkshopView.closeModal()">✕</button>
                    </div>
                    <div class="ws-erp-modal-body">
                        <div style="background:#0a0f18; padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); margin-bottom:14px; font-size:12px;">
                            Cliente: <strong style="color:#ffffff;">${clientName}</strong> • Veículo: <strong style="color:#ffffff;">${vehicleName}</strong> (<span class="mono" style="color:var(--brand-cyan);">${plate}</span>) • Serviço: <strong style="color:#fbbf24;">${serviceName}</strong>
                        </div>

                        <p style="font-size:12px; color:#94a3b8; margin:0 0 10px;">
                            Horários disponíveis das <strong>08:00 às 18:00</strong>. Horário de almoço (12h às 13h) bloqueado:
                        </p>

                        <!-- Grade de 3 Datas com Horários de Manhã, Almoço Bloqueado e Tarde -->
                        <div class="ws-dates-picker-grid">
                            ${dates.map((d, idx) => `
                                <div class="ws-date-card ${idx === 0 ? 'selected' : ''}" id="date-card-${idx}">
                                    <div class="ws-date-card-header">
                                        <span>${d.labelDay} — ${d.formattedDate}</span>
                                        <span style="font-size:10px; color:#10b981;">Disponível</span>
                                    </div>

                                    <!-- Manhã (08:00 às 12:00) -->
                                    <div class="ws-slots-group">
                                        <div class="ws-slots-group-title">🌅 Manhã (08:00 - 12:00)</div>
                                        <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('08:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '08:00', this)">08:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('09:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '09:00', this)">09:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('10:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '10:00', this)">10:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('11:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '11:00', this)">11:00</span>
                                        </div>
                                    </div>

                                    <!-- Intervalo de Almoço 12:00 às 13:00 (Obrigatório apagado em cinza) -->
                                    <div class="ws-slots-group">
                                        <div class="ws-slots-group-title">🍽️ Intervalo Operacional</div>
                                        <div>
                                            <span class="ws-slot-pill lunch-break" style="background:#18202f; color:#64748b; border:1px dashed #475569; opacity:0.5; pointer-events:none; cursor:not-allowed; display:inline-flex; align-items:center; gap:4px; font-size:11px;" title="Intervalo de Almoço da Equipe (Bloqueado)">
                                                🍽️ 12h às 13h (Almoço)
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Tarde (13:00 às 18:00) -->
                                    <div class="ws-slots-group">
                                        <div class="ws-slots-group-title">☀️ Tarde (13:00 - 18:00)</div>
                                        <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('13:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '13:00', this)">13:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('14:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '14:00', this)">14:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('15:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '15:00', this)">15:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('16:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '16:00', this)">16:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('17:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '17:00', this)">17:00</span>
                                            <span class="ws-slot-pill ${d.occupiedSlots.includes('18:00') ? 'busy' : ''}" onclick="WorkshopView.selectSlot('${d.isoDate}', '18:00', this)">18:00</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Resumo da Seleção Atual -->
                        <div id="ws-slot-selection-summary" style="background:#0f172a; padding:12px; border-radius:6px; border:1px solid rgba(255,210,28,0.3); font-size:12px; margin-top:12px;">
                            Selecione um horário acima para confirmar o agendamento.
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                            <button class="btn btn-secondary btn-sm" onclick="WorkshopView.closeModal()">Cancelar</button>
                            <button id="ws-btn-confirm-booking" class="btn btn-success btn-sm" disabled onclick="WorkshopView.submitConfirmedAppointment('${vehicleId}', '${plate}', '${vehicleName}', '${clientName}', '${serviceName}')" style="font-weight:800;">
                                ✅ CONFIRMAR AGENDAMENTO
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Auto-seleciona primeiro horário livre
        const firstDate = dates[0];
        const freeTime = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].find(t => !firstDate.occupiedSlots.includes(t)) || '09:00';
        this.selectSlot(firstDate.isoDate, freeTime);
    },

    calculateNext3AvailableDates() {
        const result = [];
        let curr = new Date();
        const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        while (result.length < 3) {
            curr.setDate(curr.getDate() + 1);
            const dayOfWeek = curr.getDay();
            // Pula domingo (0) e sábado (6)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            const isoDate = curr.toISOString().split('T')[0];
            const dd = String(curr.getDate()).padStart(2, '0');
            const mm = String(curr.getMonth() + 1).padStart(2, '0');

            // Verifica horários ocupados para este dia
            const occupied = (this.appointmentsData || [])
                .filter(a => a.appointment_date === isoDate && a.status !== 'CANCELLED')
                .map(a => a.appointment_time);

            result.push({
                isoDate,
                formattedDate: `${dd}/${mm}`,
                labelDay: daysMap[dayOfWeek],
                occupiedSlots: occupied
            });
        }
        return result;
    },

    selectSlot(isoDate, time, el = null) {
        this.selectedSlotDate = isoDate;
        this.selectedSlotTime = time;

        document.querySelectorAll('.ws-slot-pill').forEach(pill => pill.classList.remove('active'));
        if (el) {
            el.classList.add('active');
        } else {
            // Seleciona o primeiro elemento compatível
            const match = Array.from(document.querySelectorAll('.ws-slot-pill')).find(p => p.textContent.trim() === time);
            if (match) match.classList.add('active');
        }

        const summaryBox = document.getElementById('ws-slot-selection-summary');
        const confirmBtn = document.getElementById('ws-btn-confirm-booking');

        if (summaryBox) {
            const [y, m, d] = isoDate.split('-');
            summaryBox.innerHTML = `
                <div style="color:#10b981; font-weight:800; font-size:13px; margin-bottom:4px;">✓ Horário Selecionado para Confirmação:</div>
                <div>Data: <strong>${d}/${m}/${y}</strong> às <strong>${time}</strong> na oficina <strong>${this.officialWorkshopName}</strong>.</div>
            `;
        }

        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
    },

    async submitConfirmedAppointment(vehicleId, plate, vehicleModel, clientName, serviceTitle) {
        if (!this.selectedSlotDate || !this.selectedSlotTime) {
            alert('Selecione uma data e horário.');
            return;
        }

        try {
            const newApp = {
                vehicle_id: vehicleId,
                license_plate: plate,
                vehicle_model: vehicleModel,
                owner_name: clientName,
                owner_phone: '(19) 98765-4321',
                service_title: serviceTitle,
                appointment_date: this.selectedSlotDate,
                appointment_time: this.selectedSlotTime,
                notes: 'Agendamento confirmado via WhatsApp DNA AUTO'
            };

            await API.createWorkshopAppointment(this.currentWorkshopId, newApp);

            // Atualiza lista local
            this.appointmentsData.push({
                ...newApp,
                id: 'app_' + Date.now(),
                status: 'CONFIRMED'
            });

            this.closeModal();
            alert(`🟢 AGENDAMENTO CONFIRMADO!\n\nCliente: ${clientName}\nVeículo: ${vehicleModel} (${plate})\nServiço: ${serviceTitle}\nData: ${this.selectedSlotDate} às ${this.selectedSlotTime}\n\nO evento foi inserido na Agenda da Oficina com sucesso!`);

            // Redireciona para a agenda
            this.switchSection('agenda-oficina');
        } catch (err) {
            alert('Erro ao confirmar agendamento: ' + err.message);
        }
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 7: AGENDA DA OFICINA COM GRADE SEMANAL & ALMOÇO CINZA (12H-13H)
    // ──────────────────────────────────────────────────────────────────────────
    renderAgendaView() {
        const apps = this.appointmentsData || [];
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="panel-box">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Agenda & Grade Operacional da Oficina (${apps.length} agendamentos)
                    </span>
                    <button class="btn btn-sm btn-primary" onclick="WorkshopView.openSmartScheduleModal()" style="font-weight:800;">+ Novo Agendamento</button>
                </div>

                <!-- Painel de Configuração Operacional de Dias e Horários da Oficina -->
                <div style="background:#0a0f18; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px 14px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                        <div>
                            <strong style="color:#ffffff; font-size:12.5px; display:block;">⚙️ Configuração da Grade de Atendimento</strong>
                            <span style="font-size:11px; color:#94a3b8;">Defina os dias da semana e a faixa de disponibilidade operacional da oficina:</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:11px; color:#64748b;">Faixa padrão:</span>
                            <span class="mono" style="background:#111827; border:1px solid rgba(255,210,28,0.3); color:#FFD21C; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">08:00 às 18:00</span>
                            <span class="mono" style="background:#1e293b; border:1px dashed #475569; color:#94a3b8; padding:3px 8px; border-radius:4px; font-size:11px;">🍽️ 12h-13h Almoço (Bloqueado)</span>
                        </div>
                    </div>

                    <!-- Seletor Rápido de Dias da Semana -->
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:11px; color:#cbd5e1; font-weight:700; margin-right:4px;">Dias de Atendimento:</span>
                        ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => {
                            const active = this.agendaConfig.days.includes(d);
                            return `
                                <button type="button" class="btn btn-xs ${active ? 'btn-success' : 'btn-secondary'}" onclick="WorkshopView.toggleConfigDay('${d}')" style="font-size:11px; padding:3px 8px; border-radius:4px; font-weight:700;">
                                    ${active ? '✓ ' : ''}${d.slice(0, 3)}
                                </button>
                            `;
                        }).join('')}
                        <span style="font-size:10.5px; color:#64748b; margin-left:8px;">(Clique nos dias para ativar ou desativar na grade)</span>
                    </div>
                </div>

                <!-- Botões de Alternância de Visão da Agenda -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm ${this.activeAgendaView === 'semana' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.setAgendaView('semana')" style="font-weight:700;">
                            📅 Semana (Grade Interativa)
                        </button>
                        <button class="btn btn-sm ${this.activeAgendaView === 'hoje' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.setAgendaView('hoje')">
                            Hoje (${apps.filter(a => a.appointment_date === today).length})
                        </button>
                        <button class="btn btn-sm ${this.activeAgendaView === 'mes' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkshopView.setAgendaView('mes')">
                            Mês Completo (${apps.length})
                        </button>
                    </div>

                    <div style="font-size:11px; color:#94a3b8;">
                        💡 <em>Clique em qualquer horário vago para disponibilizar ou agendar um carro diretamente.</em>
                    </div>
                </div>

                <!-- Conteúdo da Agenda de Acordo com a Visualização -->
                ${this.activeAgendaView === 'semana' ? this.renderWeeklyInteractiveGrid() : this.renderAgendaTableView()}
            </div>
        `;
    },

    // Grade Semanal Interativa com Horários de 08:00 às 18:00 e Almoço 12:00-13:00 Cinza
    renderWeeklyInteractiveGrid() {
        const weekDays = this.getWeekDays();
        const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const apps = this.appointmentsData || [];

        return `
            <div class="ws-agenda-grid-container">
                <table class="ws-agenda-grid-table">
                    <thead>
                        <tr>
                            <th style="width:90px; text-align:center;">Horário</th>
                            ${weekDays.map(d => `
                                <th class="${d.isToday ? 'active-day' : ''}">
                                    <div>${d.name}</div>
                                    <div style="font-size:10px; opacity:0.8; font-family:var(--font-mono);">${d.dateStr}</div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${hours.map(h => {
                            // Se for horário de almoço (12:00 às 13:00), renderiza linha apagada em cinza obrigatória
                            if (h === '12:00') {
                                return `
                                    <tr class="ws-agenda-lunch-row">
                                        <td class="ws-agenda-hour-cell" style="background:#111722; color:#64748b;">12:00 - 13:00</td>
                                        <td colspan="${weekDays.length}" class="ws-agenda-lunch-cell">
                                            🍽️ 12:00 às 13:00 — Intervalo de Almoço da Oficina (Horário Bloqueado / Apagado em Cinza)
                                        </td>
                                    </tr>
                                `;
                            }

                            // Linhas regulares (08h, 09h, 10h, 11h, 13h, 14h, 15h, 16h, 17h, 18h)
                            return `
                                <tr>
                                    <td class="ws-agenda-hour-cell">${h}</td>
                                    ${weekDays.map(d => {
                                        // Verifica se tem agendamento para este dia e horário
                                        const booked = apps.find(a => a.appointment_date === d.isoDate && a.appointment_time && a.appointment_time.startsWith(h.slice(0, 2)));
                                        const slotKey = `${d.isoDate}_${h}`;
                                        const isDisabledByWs = !!this.agendaConfig.disabledSlots[slotKey];

                                        if (booked) {
                                            return `
                                                <td>
                                                    <div class="ws-agenda-slot-booked">
                                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                                            <strong style="color:#ffffff; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${booked.vehicle_model}</strong>
                                                            <span class="mono" style="color:var(--brand-cyan); font-size:10px; font-weight:800;">${booked.license_plate}</span>
                                                        </div>
                                                        <div style="font-size:10px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:2px 0;">
                                                            👤 ${booked.owner_name} • ${booked.service_title}
                                                        </div>
                                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px;">
                                                            <span class="badge-proof ${booked.status === 'CONFIRMED' ? 'badge-proven' : 'badge-pending'}" style="font-size:9px; padding:1px 5px;">
                                                                ${booked.status === 'CONFIRMED' ? '🟢 CONFIRMADO' : '🟡 AGUARDANDO'}
                                                            </span>
                                                            <button class="btn btn-xs btn-primary" onclick="WorkshopView.openNewServiceModal('${booked.vehicle_id || ''}')" style="font-size:9.5px; padding:2px 6px;">
                                                                Iniciar OS
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            `;
                                        }

                                        if (isDisabledByWs) {
                                            return `
                                                <td>
                                                    <div class="ws-agenda-slot-disabled" onclick="WorkshopView.toggleSlotDisabled('${slotKey}')" title="Horário fechado pela oficina. Clique para liberar.">
                                                        <span>🔒 Indisponível</span>
                                                    </div>
                                                </td>
                                            `;
                                        }

                                        // Slot livre e disponível para agendamento
                                        return `
                                            <td>
                                                <div class="ws-agenda-slot-btn" onclick="WorkshopView.openSlotBooking('${d.isoDate}', '${h}')" title="Clique para agendar um carro neste horário">
                                                    <span>+ Disponível</span>
                                                </div>
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Visualização da Agenda em Tabela Lista
    renderAgendaTableView() {
        const apps = this.appointmentsData || [];
        const today = new Date().toISOString().split('T')[0];

        let displayApps = apps;
        if (this.activeAgendaView === 'hoje') {
            displayApps = apps.filter(a => a.appointment_date === today);
            if (displayApps.length === 0) displayApps = apps.slice(0, 3);
        }

        return `
            <div class="table-responsive">
                <table class="erp-table">
                    <thead>
                        <tr>
                            <th>Data / Horário</th>
                            <th>Cliente</th>
                            <th>Veículo / Placa</th>
                            <th>Serviço Solicitado</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${displayApps.map(a => `
                            <tr>
                                <td>
                                    <strong style="color:#ffffff; font-family:var(--font-mono);">${a.appointment_date}</strong>
                                    <div style="color:#10b981; font-weight:800; font-size:12.5px; font-family:var(--font-mono);">${a.appointment_time}</div>
                                </td>
                                <td>
                                    <strong style="color:#ffffff;">${a.owner_name}</strong>
                                    <div style="font-size:11px; color:#94a3b8;">${a.owner_phone || ''}</div>
                                </td>
                                <td>
                                    <strong>${a.vehicle_model}</strong>
                                    <div class="mono" style="font-size:11px; color:var(--brand-cyan);">${a.license_plate}</div>
                                </td>
                                <td>
                                    <strong style="color:#fbbf24;">${a.service_title}</strong>
                                    <div style="font-size:10.5px; color:#64748b;">${a.notes || ''}</div>
                                </td>
                                <td>
                                    <span class="badge-proof ${a.status === 'CONFIRMED' ? 'badge-proven' : 'badge-pending'}" style="font-size:10px;">
                                        ${a.status === 'CONFIRMED' ? '🟢 CONFIRMADO' : '🟡 AGUARDANDO'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex; gap:6px;">
                                        <button class="btn btn-sm btn-primary" onclick="WorkshopView.openNewServiceModal('${a.vehicle_id || ''}')" style="font-size:11px;">Iniciar OS</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Calcula os 5 dias úteis da semana corrente
    getWeekDays() {
        const curr = new Date();
        const todayIso = curr.toISOString().split('T')[0];
        const dayOfWeek = curr.getDay(); // 0 = Domingo, 1 = Segunda ...
        const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diffToMonday));

        const result = [];
        const names = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            result.push({
                name: names[i],
                dateStr: `${dd}/${mm}`,
                isoDate: iso,
                isToday: iso === todayIso
            });
        }
        return result;
    },

    // Abrir agendamento direto para um slot da grade
    openSlotBooking(isoDate, time) {
        this.selectedSlotDate = isoDate;
        this.selectedSlotTime = time;
        this.openSmartScheduleModal('veh_demo', 'PWL4I85', 'VW Fox 1.0', 'Cliente da Oficina', 'Revisão Agendada');
        setTimeout(() => {
            this.selectSlot(isoDate, time);
        }, 50);
    },

    // Alternar dia de atendimento da oficina
    toggleConfigDay(dayName) {
        const idx = this.agendaConfig.days.indexOf(dayName);
        if (idx >= 0) {
            if (this.agendaConfig.days.length <= 1) {
                alert('A oficina precisa ter ao menos um dia de atendimento configurado.');
                return;
            }
            this.agendaConfig.days.splice(idx, 1);
        } else {
            this.agendaConfig.days.push(dayName);
        }
        const viewport = document.getElementById('ws-erp-active-viewport');
        if (viewport) viewport.innerHTML = this.renderAgendaView();
    },

    // Alternar disponibilidade de um slot específico
    toggleSlotDisabled(slotKey) {
        this.agendaConfig.disabledSlots[slotKey] = !this.agendaConfig.disabledSlots[slotKey];
        const viewport = document.getElementById('ws-erp-active-viewport');
        if (viewport) viewport.innerHTML = this.renderAgendaView();
    },

    setAgendaView(view) {
        this.activeAgendaView = view;
        const viewport = document.getElementById('ws-erp-active-viewport');
        if (viewport) viewport.innerHTML = this.renderAgendaView();
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 3: RECEPÇÃO / CHECK-IN (SEÇÃO 26)
    // ──────────────────────────────────────────────────────────────────────────
    renderRecepcaoCheckinView() {
        return `
            <div class="panel-box" style="border-color:var(--brand-cyan);">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Recepção & Check-In de Veículos
                    </span>
                </div>
                <div style="background:#0a0f18; padding:12px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); margin-bottom:14px; font-size:12.5px; color:#94a3b8;">
                    <strong>Fluxo Padronizado:</strong> PESQUISAR PLACA → VEÍCULO ENCONTRADO → ABRIR FICHA → VER HISTÓRICO → VER ALERTAS → INICIAR ATENDIMENTO.
                </div>

                <!-- Reutiliza a barra de pesquisa profissional -->
                ${this.renderVehicleSearchView()}
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 4: ORDENS DE SERVIÇO (SEÇÃO 27)
    // ──────────────────────────────────────────────────────────────────────────
    renderServiceOrdersView() {
        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFD21C" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                        Ordens de Serviço da Oficina
                    </span>
                    <button class="btn btn-primary btn-sm" onclick="WorkshopView.openNewServiceModal()">+ Novo Serviço</button>
                </div>

                <!-- Status dos Serviços (Item 27): Aguardando, Em Análise, Em Execução, Concluído, Cancelado -->
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>OS Nº</th>
                                <th>Cliente</th>
                                <th>Veículo / Placa</th>
                                <th>KM</th>
                                <th>Serviço Realizado</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="mono">#OS-8921</td>
                                <td>Carlos Alberto Silva</td>
                                <td>Honda Civic Touring <span class="mono" style="color:var(--brand-cyan);">(BRA2E19)</span></td>
                                <td class="mono">128.500 km</td>
                                <td>Substituição Pastilhas & Fluido DOT 5.1</td>
                                <td><span class="badge-proof badge-pending" style="font-size:10px;">🟠 EM EXECUÇÃO</span></td>
                                <td><button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">Dossiê</button></td>
                            </tr>
                            <tr>
                                <td class="mono">#OS-8919</td>
                                <td>Renata Vasconcelos</td>
                                <td>Toyota Corolla XEi <span class="mono" style="color:var(--brand-cyan);">(ABC1D23)</span></td>
                                <td class="mono">92.300 km</td>
                                <td>Troca de Fluido Câmbio CVT</td>
                                <td><span class="badge-proof badge-proven" style="font-size:10px;">🟢 CONCLUÍDO</span></td>
                                <td><button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-COROLLA-XEI')">Dossiê</button></td>
                            </tr>
                            <tr>
                                <td class="mono">#OS-8915</td>
                                <td>Marcos Donizete</td>
                                <td>VW Gol Trendline 1.6 <span class="mono" style="color:var(--brand-cyan);">(KXZ9012)</span></td>
                                <td class="mono">88.500 km</td>
                                <td>Troca de Óleo e Filtros Sintético</td>
                                <td><span class="badge-proof badge-proven" style="font-size:10px;">🟢 CONCLUÍDO</span></td>
                                <td><button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-1A90-55E8-K12')">Dossiê</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderServicesInProgressView() {
        return this.renderServiceOrdersView();
    },

    renderProvenServicesView() {
        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--proof-level-4)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Serviços Comprovados com Nota Fiscal & Peças (Nível 4)
                    </span>
                </div>
                <p style="font-size:12.5px; color:#94a3b8; margin-bottom:14px;">
                    Todos os serviços abaixo possuem comprovação técnica direta da oficina credenciada, código de rastreabilidade de peças originais e nota fiscal anexada.
                </p>
                ${this.renderServiceOrdersView()}
            </div>
        `;
    },

    renderRegisteredVehiclesView() {
        const vehicles = (this.vehiclesList && this.vehiclesList.length > 0) ? this.vehiclesList : [];

        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span>Veículos Cadastrados na Oficina (${vehicles.length})</span>
                    <button class="btn btn-sm btn-primary" onclick="WorkshopView.openManualVehicleModal()">+ Cadastrar Novo Veículo</button>
                </div>
                ${vehicles.length === 0 ? `
                    <div style="padding:48px 20px; text-align:center;">
                        <div style="width:60px; height:60px; border-radius:50%; background:rgba(0,212,255,0.08); border:1px solid rgba(0,212,255,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                            <span style="font-size:28px;">🚗</span>
                        </div>
                        <h4 style="color:#ffffff; font-size:16px; margin-bottom:6px; font-weight:800;">Nenhum veículo cadastrado ainda</h4>
                        <p style="color:#94a3b8; font-size:13px; max-width:420px; margin:0 auto 18px;">Cadastre seu primeiro veículo no pátio para gerar o DNA Permanente, histórico de manutenção e conectar com a agenda.</p>
                        <button class="btn btn-primary" onclick="WorkshopView.openManualVehicleModal()" style="font-weight:800;">
                            + Cadastrar Meu Primeiro Carro
                        </button>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Veículo & Foto</th>
                                    <th>Placa</th>
                                    <th>Proprietário / WhatsApp</th>
                                    <th>DNA AUTO</th>
                                    <th>Odômetro</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vehicles.map(v => `
                                    <tr>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <img src="${v.photo_url || '/img/vw-gol-app.jpg'}" alt="${v.model}" style="width:44px; height:34px; object-fit:cover; border-radius:5px; border:1px solid rgba(255,255,255,0.12);" onerror="this.src='/img/car-silhouette.svg'" />
                                                <div>
                                                    <strong style="color:#ffffff; font-size:13px; display:block;">${v.brand} ${v.model}</strong>
                                                    <span style="font-size:11px; color:var(--text-dim);">${v.version_label || ''} • ${v.manufacture_year || 2022}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="mono" style="color:var(--brand-cyan); font-weight:700; font-size:13px;">${v.license_plate}</td>
                                        <td>
                                            <strong style="font-size:12.5px; color:#ffffff; display:block;">${v.owner_name || 'Proprietário a Vincular'}</strong>
                                            <span style="font-size:11px; color:#25D366; display:inline-flex; align-items:center; gap:3px;">
                                                💬 ${v.owner_phone || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge-proof badge-proven" style="font-size:10px; font-weight:800;">
                                                ${v.dna_code ? v.dna_code : 'ATIVO (Nível 4)'}
                                            </span>
                                        </td>
                                        <td class="mono" style="font-size:12.5px; font-weight:700; color:#cbd5e1;">
                                            ${Number(v.current_mileage || v.mileage || 0).toLocaleString('pt-BR')} km
                                        </td>
                                        <td>
                                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                                <button class="btn btn-sm" onclick="WorkshopView.openWhatsAppModal('${(v.owner_name || 'Cliente').replace(/'/g, "\\'")}', '${v.owner_phone || ''}', '${v.brand} ${v.model}', '${v.license_plate}', 'Revisão Periódica')" style="font-size:11px; padding:4px 9px; font-weight:800; background:#25D366; color:#000; border:none; display:inline-flex; align-items:center; gap:3px;" title="Enviar WhatsApp para o cliente">
                                                    📱 WhatsApp
                                                </button>
                                                <button class="btn btn-sm btn-primary" onclick="WorkshopView.openNewServiceModal('${v.id}')" style="font-size:11px; padding:4px 9px; font-weight:800; background:#10b981; border:none;">
                                                    🔧 Novo Serviço
                                                </button>
                                                <button class="btn btn-sm btn-cyan" onclick="DossierView.render('${v.dna_code || v.license_plate}')" style="font-size:11px; padding:4px 8px;">
                                                    Ver Dossiê
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
        `;
    },

    renderVehicleHistoryView() {
        return this.renderRegisteredVehiclesView();
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 9: PEÇAS & ESTOQUE
    // ──────────────────────────────────────────────────────────────────────────
    renderPartsAndStockView() {
        const parts = [];

        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFD21C" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        Catálogo de Peças & Gestão de Estoque
                    </span>
                    <button class="btn btn-sm btn-primary" onclick="alert('Módulo de cadastro de peças em estoque ativo.')">+ Cadastrar Peça</button>
                </div>

                ${parts.length === 0 ? `
                    <div style="padding:48px 20px; text-align:center;">
                        <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,210,28,0.08); border:1px solid rgba(255,210,28,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                            <span style="font-size:28px;">📦</span>
                        </div>
                        <h4 style="color:#ffffff; font-size:16px; margin-bottom:6px; font-weight:800;">Estoque de Peças Vazio</h4>
                        <p style="color:#94a3b8; font-size:13px; max-width:420px; margin:0 auto 18px;">Você ainda não cadastrou peças no estoque. Adicione componentes para vincular a ordens de serviço e alimentar os registros de procedência DNA AUTO.</p>
                        <button class="btn btn-primary" onclick="alert('Módulo de cadastro de peças ativo.')" style="font-weight:800;">
                            + Cadastrar Nova Peça
                        </button>
                    </div>
                ` : `
                    <div class="ws-parts-table-wrap">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição da Peça</th>
                                    <th>Fabricante</th>
                                    <th>Aplicação</th>
                                    <th>Estoque</th>
                                    <th>Custo</th>
                                    <th>Venda</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${parts.map(p => `
                                    <tr>
                                        <td class="mono" style="color:var(--brand-cyan);">${p.code}</td>
                                        <td><strong style="color:#ffffff;">${p.name}</strong></td>
                                        <td>${p.brand}</td>
                                        <td>${p.app}</td>
                                        <td class="mono" style="font-weight:700; color:#10b981;">${p.stock} un</td>
                                        <td class="mono">${p.cost}</td>
                                        <td class="mono" style="color:#FFD21C; font-weight:700;">${p.price}</td>
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
    // SEÇÃO 6: CLIENTES
    // ──────────────────────────────────────────────────────────────────────────
    renderClientsView() {
        const clients = (this.vehiclesList || []).filter(v => v.owner_name).map(v => ({
            name: v.owner_name,
            phone: v.owner_phone || '-',
            car: `${v.brand} ${v.model} (${v.license_plate})`,
            plate: v.license_plate,
            lastVisit: v.last_service_date || 'Recente'
        }));

        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span>Carteira de Clientes da Oficina (${clients.length})</span>
                </div>
                ${clients.length === 0 ? `
                    <div style="padding:48px 20px; text-align:center;">
                        <div style="width:60px; height:60px; border-radius:50%; background:rgba(37,211,102,0.08); border:1px solid rgba(37,211,102,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                            <span style="font-size:28px;">👥</span>
                        </div>
                        <h4 style="color:#ffffff; font-size:16px; margin-bottom:6px; font-weight:800;">Nenhum cliente cadastrado</h4>
                        <p style="color:#94a3b8; font-size:13px; max-width:420px; margin:0 auto 18px;">Ao cadastrar veículos e abrir ordens de serviço no pátio, os dados dos clientes serão organizados automaticamente nesta carteira com histórico e WhatsApp direto.</p>
                        <button class="btn btn-primary" onclick="WorkshopView.openManualVehicleModal()" style="font-weight:800;">
                            + Cadastrar Primeiro Cliente / Carro
                        </button>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Nome do Cliente</th>
                                    <th>Telefone / WhatsApp</th>
                                    <th>Veículo Vinculado</th>
                                    <th>Último Atendimento</th>
                                    <th>Ação Direta</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${clients.map(c => `
                                    <tr>
                                        <td><strong>${c.name}</strong></td>
                                        <td class="mono">${c.phone}</td>
                                        <td>${c.car}</td>
                                        <td>${c.lastVisit}</td>
                                        <td><button class="btn btn-sm" onclick="WorkshopView.openWhatsAppModal('${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.car}', '${c.plate}', 'Revisão Preventiva')" style="background:#25D366; color:#000; font-weight:700;">WhatsApp</button></td>
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
    // SEÇÃO 10: RELATÓRIOS
    // ──────────────────────────────────────────────────────────────────────────
    renderReportsView() {
        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span>📊 Relatórios Gerenciais da Oficina</span>
                </div>
                <div class="ws-erp-kpi-grid" style="margin-bottom:18px;">
                    <div class="ws-erp-kpi-box">
                        <span class="ws-erp-kpi-label">Faturamento Total em OS</span>
                        <div class="ws-erp-kpi-num" style="color:#10b981;">R$ 14.850</div>
                        <div class="ws-erp-kpi-foot">Mês Corrente</div>
                    </div>
                    <div class="ws-erp-kpi-box">
                        <span class="ws-erp-kpi-label">Aumento via OBD2</span>
                        <div class="ws-erp-kpi-num" style="color:#FFD21C;">+ 38.4%</div>
                        <div class="ws-erp-kpi-foot">Alertas Preventivos Convertidos</div>
                    </div>
                    <div class="ws-erp-kpi-box">
                        <span class="ws-erp-kpi-label">Taxa de Homologação</span>
                        <div class="ws-erp-kpi-num" style="color:#00d4ff;">100%</div>
                        <div class="ws-erp-kpi-foot">Nível 4 Comprovado</div>
                    </div>
                </div>
                <p style="font-size:12.5px; color:#94a3b8;">
                    O sistema gera relatórios consolidados em PDF e exportação para contabilidade de todas as ordens de serviço, peças aplicadas e notas fiscais homologadas na rede DNA AUTO.
                </p>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SEÇÃO 11: CONFIGURAÇÕES DA OFICINA & WHATSAPP
    // ──────────────────────────────────────────────────────────────────────────
    renderConfigurationsView() {
        const ws = this.dashboardData?.workshop || {};
        const isVerified = ws.whatsapp_status === 'VERIFIED';
        const pendingCode = ws.whatsapp_code || '123456';
        const whatsappPhone = ws.whatsapp_official || this.officialPhone || '(19) 3245-6789';
        const autoSend = ws.auto_send_obd2_alerts !== 0;

        return `
            <div class="panel-box" id="tour-step-config" style="background:#090d16; border-color:rgba(255,255,255,0.08);">
                <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px;">⚙️</span>
                        <span>Configurações da Oficina & Auto Center</span>
                    </span>
                    <span style="font-size:11px; color:var(--text-dim);">ID Oficina: ${ws.id || 'ws_veloce'}</span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-top:8px;">
                    <!-- COLUNA 1: DADOS CADASTRAIS DA OFICINA -->
                    <div style="background:#0e1524; padding:18px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                        <div style="font-size:13px; font-weight:800; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:6px;">
                            <span>🏢</span> <span>Identificação Empresarial</span>
                        </div>

                        <form onsubmit="WorkshopView.submitWorkshopSettings(event)" style="display:flex; flex-direction:column; gap:12px;">
                            <div class="form-group">
                                <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">Nome Comercial da Oficina</label>
                                <input type="text" id="ws-cfg-name" class="form-control" value="${ws.trade_name || this.officialWorkshopName}" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">CNPJ Oficial</label>
                                <input type="text" id="ws-cfg-cnpj" class="form-control" value="${ws.cnpj || '12.345.678/0001-90'}" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">WhatsApp Oficial para Mensagens & Alertas</label>
                                <input type="text" id="ws-cfg-phone" class="form-control" value="${whatsappPhone}" placeholder="(11) 98888-7777" required />
                                <span style="font-size:10.5px; color:#94a3b8; margin-top:3px; display:block;">Número que será remetente de avisos de óleo, correia e aprovações.</span>
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size:11.5px; color:#cbd5e1;">Horário de Atendimento Operacional</label>
                                <input type="text" id="ws-cfg-hours" class="form-control" value="${ws.operating_hours || '08:00 às 18:00 (Segunda a Sexta)'}" />
                            </div>

                            <div style="background:rgba(0,212,255,0.05); padding:10px; border-radius:6px; border:1px solid rgba(0,212,255,0.15); font-size:11.5px; margin-top:4px;">
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#e2e8f0;">
                                    <input type="checkbox" id="ws-cfg-auto-obd2" ${autoSend ? 'checked' : ''} />
                                    <span>Habilitar envio automático de alerta WhatsApp quando odômetro OBD2 atingir limite preventivo</span>
                                </label>
                            </div>

                            <div style="display:flex; justify-content:flex-end; margin-top:8px;">
                                <button type="submit" class="btn btn-primary" style="font-weight:700; font-size:12px; padding:7px 16px;">
                                    Salvar Dados da Oficina
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- COLUNA 2: AUTENTICAÇÃO DO WHATSAPP COM CÓDIGO OTP -->
                    <div style="background:#0e1524; padding:18px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="font-size:13px; font-weight:800; color:#ffffff; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span>💬</span> <span>Status do WhatsApp Oficial</span>
                                </div>
                                ${isVerified 
                                    ? `<span class="ws-phone-status-badge verified">🟢 Ativo & Verificado</span>`
                                    : `<span class="ws-phone-status-badge pending">🟡 Confirmação Pendente</span>`
                                }
                            </div>

                            ${isVerified ? `
                                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:14px; margin-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                        <span style="font-size:18px;">✅</span>
                                        <strong style="color:#34d399; font-size:13px;">Canal Oficial Homologado</strong>
                                    </div>
                                    <p style="color:#cbd5e1; font-size:11.5px; line-height:1.4; margin:0 0 8px 0;">
                                        O número <strong>${whatsappPhone}</strong> está validado na rede DNA AUTO e autorizado a enviar ordens de serviço, notificações de revisão e laudos digitais aos clientes.
                                    </p>
                                    <div style="font-size:10.5px; color:#94a3b8;">
                                        Última sincronização de status: Hoje às 09:30 • Protocolo SHA-256 ativo.
                                    </div>
                                </div>
                            ` : `
                                <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.28); border-radius:8px; padding:14px; margin-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                        <span style="font-size:18px;">🔐</span>
                                        <strong style="color:#fbbf24; font-size:13px;">Confirmação de 6 Dígitos Necessária</strong>
                                    </div>
                                    <p style="color:#cbd5e1; font-size:11.5px; line-height:1.4; margin:0 0 10px 0;">
                                        Para prevenir envio indevido, informe o código de verificação enviado para o número <strong>${whatsappPhone}</strong> para desbloquear os disparos automáticos.
                                    </p>
                                    
                                    <div style="background:#080c14; padding:8px 12px; border-radius:6px; margin-bottom:12px; font-size:11px; color:#94a3b8; border:1px solid rgba(255,255,255,0.05);">
                                        <span>🔑 Código gerado para este canal: </span>
                                        <strong style="color:#FFD21C; font-family:monospace; font-size:13px; letter-spacing:1.5px;">${pendingCode}</strong>
                                        <span style="display:block; font-size:10px; color:#64748b; margin-top:2px;">(Código de homologação padrão: 123456)</span>
                                    </div>

                                    <form onsubmit="WorkshopView.submitConfirmWhatsappCode(event)" style="display:flex; gap:8px; align-items:center;">
                                        <input type="text" id="ws-otp-code-input" class="form-control mono" maxlength="6" placeholder="000000" style="max-width:130px; text-align:center; font-size:14px; font-weight:700; letter-spacing:2px;" required />
                                        <button type="submit" class="btn btn-primary" style="font-weight:700; font-size:12px; padding:8px 14px; white-space:nowrap;">
                                            Confirmar Número
                                        </button>
                                    </form>
                                </div>
                            `}

                            <!-- AUTOMAÇÃO DE DISPARO EM LOTE OBD2 -->
                            <div style="background:#080d17; border:1px solid rgba(0,212,255,0.18); border-radius:8px; padding:14px;">
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                    <span style="font-size:16px;">🤖</span>
                                    <strong style="color:#ffffff; font-size:12.5px;">Disparo Preventivo em Lote (Radar OBD2)</strong>
                                </div>
                                <p style="color:#94a3b8; font-size:11px; line-height:1.4; margin:0 0 10px 0;">
                                    O sistema varre os veículos cadastrados na oficina e dispara mensagens de WhatsApp personalizadas aos clientes cuja quilometragem atingiu o vencimento de óleo, correia ou pastilhas.
                                </p>
                                <button type="button" class="btn btn-secondary" onclick="WorkshopView.triggerBatchWhatsappDispatch()" style="font-size:11.5px; font-weight:700; width:100%; border-color:rgba(0,212,255,0.4); color:#00d4ff;">
                                    🚀 Executar Disparo em Lote para Clientes com Revisão Próxima
                                </button>
                                <div id="ws-batch-dispatch-feedback" style="margin-top:10px; display:none;"></div>
                            </div>
                        </div>

                        <!-- NOTA SOBRE INTEGRAÇÃO WHATSAPP (BAILEYS / EVOLUTION API) -->
                        <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); font-size:10.5px; color:#64748b; line-height:1.4;">
                            <strong style="color:#94a3b8; display:block; margin-bottom:2px;">🔌 Repositórios e Motores de WhatsApp Suportados:</strong>
                            • <strong>@whiskeysockets/baileys</strong>: Comunicação direta WebSocket Multi-Device open-source sem custos de API.<br/>
                            • <strong>Evolution API / WPPConnect</strong>: Servidor REST API conteinerizado com QR Code e Webhooks automáticos para ERPs.
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ──────────────────────────────────────────────────────────────────────────
    // HANDLERS E INTEGRAÇÕES DE BUSCA E ENTRADA EXISTENTES PRESERVADOS
    // ──────────────────────────────────────────────────────────────────────────
    quickTestVehicle(plate) {
        const input = document.getElementById('ws-vehicle-search');
        if (input) {
            input.value = plate;
            this.handleSearchVehicle();
        }
    },

    handleCadastrarCarroBtn() {
        const input = document.getElementById('ws-vehicle-search');
        const plate = (input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (plate && plate.length === 7) {
            this.lookupPlateData(plate);
        } else {
            this.openManualVehicleModal(plate);
        }
    },

    async handleSearchVehicle() {
        const input = document.getElementById('ws-vehicle-search');
        const term = (input?.value || '').trim();
        if (!term) {
            alert('Digite a placa ou termo de busca.');
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
                <div style="padding:20px; text-align:center; color:var(--text-muted); background:#0d1524; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                    <div class="pulse-dot" style="margin:0 auto 10px;"></div>
                    <strong style="color:#ffffff; font-size:14px; display:block; margin-bottom:4px;">Localizando Veículo ${term}...</strong>
                    <span style="font-size:12px; color:var(--text-dim);">Consultando base DNA AUTO e conectores oficiais</span>
                </div>
            `;
        }

        try {
            // 1. Busca local
            const res = await API.searchVehicle(clean.length >= 3 ? clean : term);

            if (res && res.found && res.vehicle) {
                this.renderFoundVehicleCard(res.vehicle, res.hasDna);
                return;
            }

            // 2. Se formato de placa de 7 caracteres, busca na API de placas
            if (clean.length === 7) {
                await this.lookupPlateData(clean);
            } else {
                this.showPlateNotFoundCard(term, 'Veículo não localizado na base local.');
            }
        } catch (err) {
            if (clean.length === 7) {
                await this.lookupPlateData(clean);
            } else {
                this.showPlateNotFoundCard(term, err.message);
            }
        }
    },

    async lookupPlateData(plateParam) {
        const input = document.getElementById('ws-vehicle-search');
        const plate = (plateParam || input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="padding:20px; text-align:center; color:var(--text-muted); background:#0d1524; border-radius:8px; border:1px solid rgba(0,212,255,0.3);">
                <div class="pulse-dot" style="margin:0 auto 10px;"></div>
                <strong style="color:#ffffff; font-size:14px; display:block; margin-bottom:4px;">Consultando Dados Oficiais da Placa ${plate}...</strong>
                <span style="font-size:12px; color:var(--text-dim);">Conectando à API Senatran, Detran e Tabela FIPE</span>
            </div>
        `;

        try {
            const data = await API.lookupPlate(plate);
            if (!data || !data.found || !data.vehicle) {
                this.showPlateNotFoundCard(plate, data?.message);
                return;
            }

            const v = data.vehicle;
            this.renderFoundVehicleCard({
                ...v,
                license_plate: plate,
                latest_mileage: 85430,
                owner_name: 'Proprietário a Cadastrar',
                owner_phone: '(19) 98765-4321'
            }, false);
        } catch (err) {
            this.showPlateNotFoundCard(plate, err.message);
        }
    },

    showPlateNotFoundCard(plate, msg) {
        const resultDiv = document.getElementById('ws-plate-lookup-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = `
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.35); border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <div style="font-weight:700; color:#fbbf24; font-size:13.5px; margin-bottom:4px;">
                        ⚠️ Veículo ${plate} não localizado na consulta externa
                    </div>
                    <div style="font-size:12px; color:var(--text-muted);">
                        ${msg || 'Você pode cadastrá-lo manualmente agora para iniciar o atendimento e lançar os serviços.'}
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                    <button class="btn btn-sm btn-primary" onclick="WorkshopView.openManualVehicleModal('${plate}')" style="background:#10b981; border:none; font-weight:700;">
                        CADASTRAR MANUALMENTE
                    </button>
                </div>
            </div>
        `;
    },

    // Modal de Cadastro Manual de Veículo
    // Modal de Cadastro Manual de Veículo (Vinculado a Proprietário, KM de Entrada e Foto com DNA Automático)
    openManualVehicleModal(defaultPlate = '') {
        const modalRoot = document.getElementById('ws-erp-modal-root');
        if (!modalRoot) return;

        const currentYear = new Date().getFullYear();

        modalRoot.innerHTML = `
            <div class="ws-erp-modal-overlay" onclick="if(event.target===this) WorkshopView.closeModal()">
                <div class="ws-erp-modal-window" style="max-width:620px; max-height:92vh; overflow-y:auto;">
                    <div class="ws-erp-modal-header" style="background:#0b111e; border-bottom:1px solid rgba(255,255,255,0.08); padding:14px 20px;">
                        <div>
                            <strong style="color:#ffffff; font-size:16px; display:block;">Cadastrar Entrada de Veículo na Oficina</strong>
                            <span style="font-size:12px; color:var(--text-dim);">Vínculo com proprietário, hodômetro de entrada e Passaporte Digital DNA Permanente</span>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="WorkshopView.closeModal()">✕</button>
                    </div>

                    <form onsubmit="WorkshopView.submitManualRegisterForm(event)" style="padding:18px 22px;">
                        <!-- SEÇÃO 1: DADOS TÉCNICOS DO VEÍCULO -->
                        <div style="font-size:11px; font-weight:800; color:#FFD21C; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                            <span>🚗 1. DADOS TÉCNICOS DO VEÍCULO</span>
                        </div>

                        <div class="form-grid-2" style="margin-bottom:10px;">
                            <div class="form-group">
                                <label class="form-label">Placa do Veículo *</label>
                                <input type="text" id="manual-veh-plate" class="form-control" value="${defaultPlate}" maxlength="8" placeholder="Ex: BRA2E19" style="text-transform:uppercase; font-weight:800; font-family:var(--font-mono); color:var(--brand-cyan);" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Marca / Montadora *</label>
                                <input type="text" id="manual-veh-brand" class="form-control" placeholder="Ex: Honda, Toyota, VW, Fiat" required />
                            </div>
                        </div>

                        <div class="form-grid-2" style="margin-bottom:10px;">
                            <div class="form-group">
                                <label class="form-label">Modelo do Carro *</label>
                                <input type="text" id="manual-veh-model" class="form-control" placeholder="Ex: Civic Touring, Corolla, Strada" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Versão / Motor</label>
                                <input type="text" id="manual-veh-version" class="form-control" placeholder="Ex: 1.5 Turbo, 2.0 Flex, 1.0 Firefly" />
                            </div>
                        </div>

                        <div class="form-grid-2" style="margin-bottom:16px;">
                            <div class="form-group">
                                <label class="form-label">Ano Fabricação/Modelo *</label>
                                <input type="number" id="manual-veh-year" class="form-control" value="${currentYear}" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cor do Veículo</label>
                                <input type="text" id="manual-veh-color" class="form-control" placeholder="Ex: Prata, Branco, Preto" />
                            </div>
                        </div>

                        <!-- SEÇÃO 2: DADOS DO PROPRIETÁRIO / CLIENTE -->
                        <div style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;">
                            <span>👤 2. DADOS DO PROPRIETÁRIO / CLIENTE</span>
                        </div>

                        <div class="form-grid-2" style="margin-bottom:16px;">
                            <div class="form-group">
                                <label class="form-label">Nome Completo do Proprietário *</label>
                                <input type="text" id="manual-veh-owner-name" class="form-control" placeholder="Ex: Carlos Eduardo Silveira" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Telefone / WhatsApp *</label>
                                <input type="text" id="manual-veh-owner-phone" class="form-control" placeholder="Ex: (11) 98765-4321" required />
                            </div>
                        </div>

                        <!-- SEÇÃO 3: HODÔMETRO DE ENTRADA & FOTO DO VEÍCULO -->
                        <div style="font-size:11px; font-weight:800; color:#10b981; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;">
                            <span>📸 3. HODÔMETRO DE ENTRADA & FOTO DO VEÍCULO</span>
                        </div>

                        <div class="form-grid-2" style="margin-bottom:12px;">
                            <div class="form-group">
                                <label class="form-label" style="color:#10b981; font-weight:800;">Hodômetro na Entrada (KM) *</label>
                                <input type="number" id="manual-veh-km" class="form-control" placeholder="Ex: 85400" style="font-size:15px; font-weight:800; font-family:var(--font-mono);" required />
                                <span style="font-size:11px; color:var(--text-dim); margin-top:3px; display:block;">Gravado na entrada e pré-preenchido no modal de serviço.</span>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Foto do Veículo</label>
                                <div style="display:flex; gap:8px; align-items:center;">
                                    <input type="file" id="manual-veh-photo-file" accept="image/*" onchange="WorkshopView.handleVehiclePhotoUpload(event)" style="display:none;" />
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('manual-veh-photo-file').click()" style="display:inline-flex; align-items:center; gap:6px;">
                                        📷 Escolher Imagem
                                    </button>
                                    <span id="manual-veh-photo-name" style="font-size:11px; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">Nenhuma foto</span>
                                </div>
                                <input type="hidden" id="manual-veh-photo-data" value="" />
                                <input type="text" id="manual-veh-photo-url" class="form-control" placeholder="Ou cole a URL da foto..." oninput="WorkshopView.updatePhotoPreview(this.value)" style="margin-top:6px; font-size:11px; padding:4px 8px;" />
                            </div>
                        </div>

                        <!-- PRÉ-VISUALIZAÇÃO DA FOTO DO CARRO -->
                        <div id="manual-veh-photo-preview-box" style="display:none; margin-bottom:14px; text-align:center; padding:8px; background:#080d16; border-radius:6px; border:1px dashed rgba(255,255,255,0.15);">
                            <img id="manual-veh-photo-preview" src="" alt="Prévia do Veículo" style="max-height:130px; max-width:100%; border-radius:5px; object-fit:cover;" />
                        </div>

                        <!-- BADGE DNA AUTOMÁTICO -->
                        <div style="margin-top:8px; padding:12px 14px; background:rgba(0,212,255,0.06); border-radius:6px; border:1px solid rgba(0,212,255,0.25); display:flex; align-items:center; gap:12px;">
                            <div style="font-size:24px;">🧬</div>
                            <div>
                                <strong style="color:#00e5ff; font-size:12.5px; display:block;">Passaporte Digital DNA Automático Permanente (Nível 4)</strong>
                                <span style="font-size:11.5px; color:#cbd5e1; display:block; line-height:1.35;">
                                    Ao cadastrar, o veículo recebe o DNA ativo perpétuo e <strong>já fica marcado como padrão</strong> no modal de serviço, sem necessidade de procurar ou escolher o carro manualmente.
                                </span>
                            </div>
                        </div>

                        <!-- AÇÕES -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
                            <button type="button" class="btn btn-secondary" onclick="WorkshopView.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary" style="font-weight:800; background:#10b981; border:none; padding:8px 18px;">
                                ✅ Salvar Entrada & Iniciar Serviço
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    handleVehiclePhotoUpload(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const nameSpan = document.getElementById('manual-veh-photo-name');
        if (nameSpan) nameSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            const hidden = document.getElementById('manual-veh-photo-data');
            if (hidden) hidden.value = dataUrl;
            this.updatePhotoPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    },

    updatePhotoPreview(url) {
        const previewBox = document.getElementById('manual-veh-photo-preview-box');
        const previewImg = document.getElementById('manual-veh-photo-preview');
        if (previewBox && previewImg) {
            if (url && url.trim()) {
                previewImg.src = url.trim();
                previewBox.style.display = 'block';
            } else {
                previewBox.style.display = 'none';
            }
        }
    },

    async submitManualRegisterForm(e) {
        e.preventDefault();
        const plate = document.getElementById('manual-veh-plate').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const brand = document.getElementById('manual-veh-brand').value.trim();
        const model = document.getElementById('manual-veh-model').value.trim();
        const version = document.getElementById('manual-veh-version').value.trim();
        const year = document.getElementById('manual-veh-year').value;
        const color = document.getElementById('manual-veh-color').value.trim();
        const km = document.getElementById('manual-veh-km').value;
        const ownerName = document.getElementById('manual-veh-owner-name').value.trim();
        const ownerPhone = document.getElementById('manual-veh-owner-phone').value.trim();
        const photoData = document.getElementById('manual-veh-photo-data')?.value || '';
        const photoUrl = document.getElementById('manual-veh-photo-url')?.value.trim() || photoData || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80';

        if (!plate || !brand || !model) {
            alert('Por favor preencha a placa, marca e modelo.');
            return;
        }

        if (!ownerName || !ownerPhone) {
            alert('Por favor preencha o nome e o telefone/WhatsApp do proprietário.');
            return;
        }

        if (!km) {
            alert('Por favor informe o hodômetro registrado na entrada do veículo.');
            return;
        }

        try {
            const res = await API.registerVehicle({
                license_plate: plate,
                brand,
                model,
                version_label: version,
                manufacture_year: year,
                color: color || 'Não informada',
                mileage: Number(km),
                owner_name: ownerName,
                owner_phone: ownerPhone,
                photo_url: photoUrl,
                activate_dna_now: true
            });

            const vehicleId = res.vehicle_id || res.vehicle?.id;
            const dnaCode = (res && res.dna && res.dna.dna_code) || res.dna_code || 'DNA-BR-ATIVO';

            const newVeh = {
                id: vehicleId,
                license_plate: plate,
                brand,
                model,
                version_label: version,
                manufacture_year: year,
                color: color || 'Não informada',
                current_mileage: Number(km),
                mileage: Number(km),
                owner_name: ownerName,
                owner_phone: ownerPhone,
                photo_url: photoUrl,
                dna_code: dnaCode,
                dna_status: 'ACTIVE'
            };

            this.lastRegisteredVehicle = newVeh;
            if (!this.vehiclesList) this.vehiclesList = [];
            this.vehiclesList = [newVeh, ...this.vehiclesList.filter(v => v.id !== vehicleId && v.license_plate !== plate)];

            this.closeModal();

            // Mensagem de sucesso amigável
            alert(`✅ Veículo ${brand} ${model} (${plate}) cadastrado com sucesso!\n\n🧬 Passaporte Digital DNA: ${dnaCode}\n👤 Proprietário: ${ownerName} (${ownerPhone})\n⏱️ Hodômetro de Entrada: ${Number(km).toLocaleString('pt-BR')} km\n\nO formulário de Registro de Serviço foi aberto automaticamente com este carro já marcado!`);

            // Abrir imediatamente o modal de novo serviço com o carro já marcado e o hodômetro preenchido
            this.openNewServiceModal(vehicleId);

            // Atualiza visualização em segundo plano se estiver na tela de veículos
            if (this.currentSection === 'veiculos-cadastrados') {
                const viewContainer = document.getElementById('ws-viewport-content');
                if (viewContainer) viewContainer.innerHTML = this.renderRegisteredVehiclesView();
            }
        } catch (err) {
            alert('Erro ao cadastrar veículo: ' + err.message);
        }
    },

    // Notificação para recursos em roadmap
    handleComingSoon(featureName) {
        alert(`🚧 RECURSO EM DESENVOLVIMENTO\n\nA funcionalidade "${featureName}" está em fase de implantação no ERP DNA AUTO.`);
    },

    // Tour Guiado pelo Sistema
    startTour(force = false) {
        if (!force && localStorage.getItem('dna_tour_completed') === 'true') {
            return;
        }
        this.tourActive = true;
        this.tourCurrentStep = 0;
        this.renderTourStep();
    },

    renderTourStep() {
        if (!this.tourActive) return;
        const step = this.tourSteps[this.tourCurrentStep];
        if (!step) {
            this.skipTour();
            return;
        }

        // Limpa destaque anterior
        document.querySelectorAll('.ws-tour-spotlight').forEach(el => el.classList.remove('ws-tour-spotlight'));

        let container = document.getElementById('ws-tour-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ws-tour-container';
            document.body.appendChild(container);
        }

        const targetEl = document.getElementById(step.targetId);
        if (targetEl) {
            targetEl.classList.add('ws-tour-spotlight');
            try {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {}
        }

        const isLast = this.tourCurrentStep === this.tourSteps.length - 1;
        const isFirst = this.tourCurrentStep === 0;

        container.innerHTML = `
            <div class="ws-tour-backdrop" onclick="WorkshopView.skipTour()"></div>
            <div class="ws-tour-card" style="position:fixed; z-index:10001; bottom:24px; right:24px; max-width:400px; background:#0f172a; border:2px solid #FFD21C; border-radius:12px; padding:20px; box-shadow:0 20px 40px rgba(0,0,0,0.85);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span class="ws-tour-step-badge" style="background:rgba(255,210,28,0.15); color:#FFD21C; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px; border:1px solid rgba(255,210,28,0.3);">Passo ${this.tourCurrentStep + 1} de ${this.tourSteps.length}</span>
                    <button class="ws-tour-skip-btn" onclick="WorkshopView.skipTour()" style="background:transparent; border:none; color:#94a3b8; font-size:11.5px; font-weight:700; cursor:pointer;" title="Pular Tour e não mostrar novamente">Pular Tour ✕</button>
                </div>
                <h4 style="color:#ffffff; font-size:15px; font-weight:800; margin:0 0 8px 0; display:flex; align-items:center; gap:6px;">
                    ${step.title}
                </h4>
                <p style="color:#cbd5e1; font-size:12.5px; line-height:1.5; margin:0 0 16px 0;">
                    ${step.desc}
                </p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        ${!isFirst ? `<button class="btn btn-sm btn-secondary" onclick="WorkshopView.prevTourStep()" style="font-size:11px;">← Anterior</button>` : ''}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-primary" onclick="WorkshopView.nextTourStep()" style="font-weight:800; font-size:12px; background:#FFD21C; color:#000; border:none; padding:6px 14px;">
                            ${isLast ? 'Concluir Tour ✓' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    nextTourStep() {
        if (this.tourCurrentStep < this.tourSteps.length - 1) {
            this.tourCurrentStep++;
            this.renderTourStep();
        } else {
            this.skipTour();
        }
    },

    prevTourStep() {
        if (this.tourCurrentStep > 0) {
            this.tourCurrentStep--;
            this.renderTourStep();
        }
    },

    skipTour() {
        this.tourActive = false;
        document.querySelectorAll('.ws-tour-spotlight').forEach(el => el.classList.remove('ws-tour-spotlight'));
        const container = document.getElementById('ws-tour-container');
        if (container) container.innerHTML = '';
        localStorage.setItem('dna_tour_completed', 'true');
    },

    checkAutoTour() {
        if (!localStorage.getItem('dna_tour_completed')) {
            this.startTour(false);
        }
    },

    // Salva configurações da oficina
    async submitWorkshopSettings(e) {
        if (e) e.preventDefault();
        const wsId = this.getEffectiveWorkshopId();
        const tradeName = document.getElementById('ws-cfg-name')?.value.trim();
        const cnpj = document.getElementById('ws-cfg-cnpj')?.value.trim();
        const phone = document.getElementById('ws-cfg-phone')?.value.trim();
        const hours = document.getElementById('ws-cfg-hours')?.value.trim();
        const autoObd2 = document.getElementById('ws-cfg-auto-obd2')?.checked ? 1 : 0;

        try {
            const res = await API.saveWorkshopSettings(wsId, {
                trade_name: tradeName,
                cnpj,
                whatsapp_official: phone,
                operating_hours: hours,
                auto_send_obd2_alerts: autoObd2
            });

            if (this.dashboardData && this.dashboardData.workshop) {
                this.dashboardData.workshop.trade_name = tradeName;
                this.dashboardData.workshop.cnpj = cnpj;
                this.dashboardData.workshop.whatsapp_official = phone;
                this.dashboardData.workshop.whatsapp_status = res.whatsapp_status || 'PENDING_CONFIRMATION';
                this.dashboardData.workshop.whatsapp_code = res.whatsapp_code;
                this.officialPhone = phone;
                this.officialWorkshopName = tradeName;
            }

            alert(`✅ ${res.message || 'Configurações salvas com sucesso!'}`);
            const activeViewport = document.getElementById('ws-erp-active-viewport');
            if (activeViewport) {
                activeViewport.innerHTML = this.renderActiveSection();
            }
        } catch (err) {
            alert('Erro ao salvar configurações: ' + err.message);
        }
    },

    // Confirmação de código OTP do WhatsApp
    async submitConfirmWhatsappCode(e) {
        if (e) e.preventDefault();
        const wsId = this.getEffectiveWorkshopId();
        const codeInput = document.getElementById('ws-otp-code-input');
        const code = (codeInput?.value || '').trim();

        if (!code) {
            alert('Por favor, informe o código de 6 dígitos.');
            return;
        }

        try {
            const res = await API.confirmWorkshopWhatsapp(wsId, code);
            alert(`🎉 ${res.message}`);
            if (this.dashboardData && this.dashboardData.workshop) {
                this.dashboardData.workshop.whatsapp_status = 'VERIFIED';
            }
            const activeViewport = document.getElementById('ws-erp-active-viewport');
            if (activeViewport) {
                activeViewport.innerHTML = this.renderActiveSection();
            }
        } catch (err) {
            alert('❌ Erro na confirmação: ' + err.message);
        }
    },

    // Disparo preventivo em lote via WhatsApp
    async triggerBatchWhatsappDispatch() {
        const wsId = this.getEffectiveWorkshopId();
        const feedbackBox = document.getElementById('ws-batch-dispatch-feedback');
        if (feedbackBox) {
            feedbackBox.style.display = 'block';
            feedbackBox.innerHTML = `
                <div style="padding:14px; background:#0d1524; border-radius:8px; border:1px solid rgba(0,212,255,0.3); color:#ffffff; font-size:11.5px; text-align:center;">
                    <div class="pulse-dot" style="margin:0 auto 8px;"></div>
                    <strong>Cruzando dados de telemetria OBD2 e preparando lote de disparos...</strong>
                </div>
            `;
        }

        try {
            const res = await API.dispatchAutomaticWhatsapp(wsId);
            if (feedbackBox) {
                feedbackBox.innerHTML = `
                    <div style="padding:14px; background:rgba(16,185,129,0.1); border-radius:8px; border:1px solid rgba(16,185,129,0.35); color:#ffffff; font-size:12px;">
                        <div style="font-weight:800; color:#34d399; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                            <span>✅</span> <span>Lote Concluído: ${res.dispatched_count || 0} veículos notificados</span>
                        </div>
                        <p style="color:#cbd5e1; font-size:11px; margin-bottom:8px;">${res.message}</p>
                        ${res.items && res.items.length > 0 ? `
                            <div style="background:#080c14; padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); font-family:monospace; font-size:10.5px; max-height:140px; overflow-y:auto;">
                                ${res.items.map(it => `
                                    <div style="margin-bottom:4px; padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.04);">
                                        🚗 <strong>${it.plate}</strong> (${it.model}) → 📞 ${it.phone}: <span style="color:#fbbf24;">${it.trigger}</span> (${Number(it.mileage).toLocaleString('pt-BR')} km)
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        } catch (err) {
            if (feedbackBox) {
                feedbackBox.innerHTML = `
                    <div style="padding:14px; background:rgba(239,68,68,0.1); border-radius:8px; border:1px solid rgba(239,68,68,0.35); color:#f87171; font-size:11.5px;">
                        ❌ Erro ao disparar lote: ${err.message}
                    </div>
                `;
            }
        }
    },

    // Modal de Novo Serviço Nível 4 (População Dinâmica com Auto-Seleção e KM Pré-preenchido)
    openNewServiceModal(vehicleId = '') {
        const modal = document.getElementById('new-service-modal');
        if (!modal) return;

        const targetVehicleId = vehicleId || this.lastRegisteredVehicle?.id || (this.vehiclesList && this.vehiclesList[0]?.id) || 'veh_civic_touring';
        const sel = document.getElementById('srv-vehicle-id');

        // Veículos padrão combinados com os cadastrados no sistema
        let vehicles = (this.vehiclesList && this.vehiclesList.length > 0) ? [...this.vehiclesList] : [
            { id: 'veh_civic_touring', brand: 'Honda', model: 'Civic Touring', license_plate: 'BRA2E19', dna_code: 'DNA-BR-8F72-29A4-X91', current_mileage: 128500 },
            { id: 'veh_corolla_xei', brand: 'Toyota', model: 'Corolla XEi', license_plate: 'ABC1D23', dna_code: 'DNA-BR-COROLLA-XEI', current_mileage: 92300 },
            { id: 'veh_gol_msi', brand: 'VW', model: 'Gol MSI', license_plate: 'KXZ9012', dna_code: 'DNA-BR-1A90-55E8-K12', current_mileage: 88500 }
        ];

        // Se o último cadastrado existir e não estiver na lista, adiciona no início
        if (this.lastRegisteredVehicle && !vehicles.some(v => v.id === this.lastRegisteredVehicle.id)) {
            vehicles.unshift(this.lastRegisteredVehicle);
        }

        if (sel) {
            sel.innerHTML = '';
            vehicles.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                const dnaTxt = v.dna_code ? ` - ${v.dna_code} (DNA Ativo)` : ' - DNA Ativo';
                opt.textContent = `${v.brand} ${v.model} (${v.license_plate})${dnaTxt}`;
                if (v.id === targetVehicleId) {
                    opt.selected = true;
                }
                sel.appendChild(opt);
            });
            sel.value = targetVehicleId;
        }

        // Preenche automaticamente a quilometragem no odômetro com base no veículo selecionado
        const selectedVeh = vehicles.find(v => v.id === (sel ? sel.value : targetVehicleId)) || this.lastRegisteredVehicle;
        const kmInput = document.getElementById('srv-mileage');
        if (kmInput && selectedVeh && (selectedVeh.current_mileage !== undefined || selectedVeh.mileage !== undefined)) {
            kmInput.value = selectedVeh.current_mileage || selectedVeh.mileage;
        }

        // Data de hoje por padrão
        const dateInput = document.getElementById('srv-service-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        modal.classList.add('active');
    },

    onServiceVehicleChange(vehicleId) {
        const vehicles = (this.vehiclesList && this.vehiclesList.length > 0) ? this.vehiclesList : [];
        const veh = vehicles.find(v => v.id === vehicleId) || (this.lastRegisteredVehicle?.id === vehicleId ? this.lastRegisteredVehicle : null);
        const kmInput = document.getElementById('srv-mileage');
        if (kmInput && veh && (veh.current_mileage !== undefined || veh.mileage !== undefined)) {
            kmInput.value = veh.current_mileage || veh.mileage;
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

    async submitNewService(e) {
        e.preventDefault();
        const form = document.getElementById('new-service-form');
        if (!form) return;
        const formData = new FormData(form);
        formData.append('workshop_id', this.currentWorkshopId);

        try {
            const res = await API.registerWorkshopService(formData);
            const modal = document.getElementById('new-service-modal');
            if (modal) modal.classList.remove('active');
            alert(`✅ ${res.message || 'Serviço registrado como Nível 4 Comprovado!'}`);
            form.reset();
            await this.render();
            this.switchSection('servicos-os');
        } catch (err) {
            alert('Erro ao registrar serviço: ' + err.message);
        }
    },

    async submitConfirmation(serviceId, decision) {
        const notes = prompt(
            decision === 'CONFIRMAR'
                ? 'Observações técnicas da homologação Nível 3 (opcional):'
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
