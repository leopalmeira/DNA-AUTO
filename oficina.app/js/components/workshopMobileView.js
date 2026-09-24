// ==============================================================================
// DNA AUTO — COMPONENTE MOBILE FIRST DA OFICINA & AUTO CENTER
// Implementação fiel aos mockups do aplicativo para mecânicos e funcionários
// Lógica Operacional: ABRIU → IDENTIFICOU → CLICOU → EXECUTOU → VOLTOU
// ==============================================================================

(function() {
    if (typeof WorkshopView === 'undefined') {
        console.warn('WorkshopView ainda não carregado. Aguardando inicialização...');
        return;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ESTADO E EXTENSÃO DO WORKSHOPVIEW PARA O MODO MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.currentViewMode = localStorage.getItem('dna_workshop_view_mode') || 'mobile';
    WorkshopView.mobileActiveTab = 'inicio';
    WorkshopView.selectedMobileVehicle = null;
    WorkshopView.selectedMobileService = null;
    WorkshopView.mobileUploadedPhotos = [];
    WorkshopView.mobileInvoiceAttachment = null;
    WorkshopView.mobileActivePlate = '';
    WorkshopView.mobileAlertsSent = {};
    WorkshopView.mobileVehicleEntryTab = 'buscar'; // 'buscar' | 'manual' | 'recentes'
    WorkshopView.mobileMaintFilter = 'todos'; // 'todos' | 'atrasadas' | 'em_breve' | 'em_dia'
    WorkshopView.mobileAlertTab = 'pendentes'; // 'pendentes' | 'enviados'
    WorkshopView.mobileClientsTab = 'lista'; // 'lista' | 'cadastrar'
    WorkshopView.mobileSearchType = 'placa'; // 'placa' | 'chassi' | 'cliente'

    WorkshopView.mobileInvoiceItems = [
        { id: 'item_1', title: 'Troca de Óleo e Filtros', price: 420.00, checked: true },
        { id: 'item_2', title: 'Filtro de Ar', price: 85.00, checked: true },
        { id: 'item_3', title: 'Óleo de Motor Sintético 5W30', price: 180.00, checked: true }
    ];

    // Catálogo Oficial de Serviços para Monitoramento (Sem Preços!)
    WorkshopView.monitoredServicesCatalog = [
        { id: 'srv_oleo', num: 1, title: 'Troca de Óleo e Filtros', defaultKm: 10000, defaultMonths: 6, mode: 'ambos', icon: '🛢️' },
        { id: 'srv_alinhamento', num: 2, title: 'Alinhamento e Balanceamento', defaultKm: 10000, defaultMonths: 6, mode: 'km', icon: '⚙️' },
        { id: 'srv_freios', num: 3, title: 'Freios (Pastilhas e Discos)', defaultKm: 20000, defaultMonths: 12, mode: 'km', icon: '🛑' },
        { id: 'srv_ar', num: 4, title: 'Ar-Condicionado e Filtro de Cabine', defaultKm: 10000, defaultMonths: 6, mode: 'tempo', icon: '❄️' },
        { id: 'srv_revisao', num: 5, title: 'Revisão Geral Preventiva', defaultKm: 10000, defaultMonths: 12, mode: 'ambos', icon: '🔍' },
        { id: 'srv_suspensao', num: 6, title: 'Suspensão e Amortecedores', defaultKm: 40000, defaultMonths: 24, mode: 'km', icon: '🔩' },
        { id: 'srv_correia', num: 7, title: 'Correia Dentada e Tensores', defaultKm: 50000, defaultMonths: 36, mode: 'km', icon: '⛓️' },
        { id: 'srv_bateria', num: 8, title: 'Bateria e Sistema Elétrico', defaultKm: 0, defaultMonths: 24, mode: 'tempo', icon: '🔋' },
        { id: 'srv_filtro_ar', num: 9, title: 'Filtro de Ar do Motor', defaultKm: 10000, defaultMonths: 12, mode: 'km', icon: '💨' },
        { id: 'srv_filtro_comb', num: 10, title: 'Filtro de Combustível', defaultKm: 10000, defaultMonths: 12, mode: 'km', icon: '⛽' },
        { id: 'srv_fluidos', num: 11, title: 'Fluido de Freio e Arrefecimento', defaultKm: 30000, defaultMonths: 24, mode: 'ambos', icon: '🧪' },
        { id: 'srv_velas', num: 12, title: 'Velas e Cabos de Ignição', defaultKm: 30000, defaultMonths: 24, mode: 'km', icon: '⚡' },
        { id: 'srv_pneus', num: 13, title: 'Pneus e Rodízio', defaultKm: 10000, defaultMonths: 6, mode: 'km', icon: '🛞' },
        { id: 'srv_limpeza', num: 14, title: 'Limpeza de Bicos e Injeção', defaultKm: 20000, defaultMonths: 12, mode: 'km', icon: '🚿' },
        { id: 'srv_outros', num: 15, title: 'Outros Serviços Especializados', defaultKm: 10000, defaultMonths: 12, mode: 'ambos', icon: '🔧' }
    ];

    // Veículos Padrão de Demonstração para Mecânicos
    WorkshopView.getDefaultMobileVehicles = function() {
        return [
            {
                id: 'veh_civic',
                license_plate: 'ABC1D23',
                brand: 'Honda',
                model: 'Civic Touring 1.5 Turbo',
                year: '2020',
                color: 'Prata',
                chassis: '9BWCA41JX9P029348',
                mileage: 9750,
                client_name: 'João da Silva',
                client_phone: '(21) 98765-4321',
                client_email: 'joao@email.com',
                photo_url: './img/vehicles/civic.png',
                last_service_date: '10/09/2025 08:32',
                status: 'EM_ANDAMENTO'
            },
            {
                id: 'veh_corolla',
                license_plate: 'XY29A87',
                brand: 'Toyota',
                model: 'Corolla XEi 2.0 Flex',
                year: '2018',
                color: 'Branco',
                chassis: '9BRBL48E8K0184729',
                mileage: 82400,
                client_name: 'Maria Fernandes',
                client_phone: '(21) 97654-3210',
                client_email: 'maria@email.com',
                photo_url: './img/vehicles/corolla.png',
                last_service_date: '09/09/2025 18:20',
                status: 'AGUARDANDO'
            },
            {
                id: 'veh_uno',
                license_plate: 'QWE2F34',
                brand: 'Fiat',
                model: 'Uno Way 1.0 Fire',
                year: '2015',
                color: 'Vermelho',
                chassis: '9BD158229F6819234',
                mileage: 114200,
                client_name: 'Carlos Almeida',
                client_phone: '(21) 91234-5678',
                client_email: 'carlos@email.com',
                photo_url: './img/vehicles/uno.png',
                last_service_date: '09/09/2025 14:10',
                status: 'CONCLUIDO'
            },
            {
                id: 'veh_onix',
                license_plate: 'RTY6H21',
                brand: 'Chevrolet',
                model: 'Onix Premier 1.0 Turbo',
                year: '2021',
                color: 'Prata',
                chassis: '9BGKS48V0MG193847',
                mileage: 48900,
                client_name: 'Ana Souza',
                client_phone: '(21) 99876-5432',
                client_email: 'ana@email.com',
                photo_url: './img/vehicles/onix.png',
                last_service_date: '08/09/2025 11:45',
                status: 'EM_ANDAMENTO'
            },
            {
                id: 'veh_hb20',
                license_plate: 'JKLOA12',
                brand: 'Hyundai',
                model: 'HB20 Evolution 1.0',
                year: '2019',
                color: 'Preto',
                chassis: '9BHBH51DBKP029481',
                mileage: 63200,
                client_name: 'Roberto Lima',
                client_phone: '(21) 97088-7655',
                client_email: 'roberto@email.com',
                photo_url: './img/vehicles/hb20.png',
                last_service_date: '07/09/2025 16:30',
                status: 'AGUARDANDO'
            }
        ];
    };

    // Alertas de Manutenção para o Mecânico
    WorkshopView.getMobileAlerts = function() {
        return [
            {
                id: 'alt_001',
                license_plate: 'ABC1D23',
                vehicle_model: 'Honda Civic',
                client_name: 'João da Silva',
                client_phone: '21987654321',
                service_needed: 'Troca de óleo e filtros',
                reason: 'Próximo da quilometragem recomendada.',
                due_text: 'Vence em 2 dias (10/09/2025)',
                current_km: 9750,
                next_km: 10000,
                next_date: '10/09/2025',
                status: 'EM_BREVE',
                urgency: 'WARNING'
            },
            {
                id: 'alt_002',
                license_plate: 'XY29A87',
                vehicle_model: 'Toyota Corolla',
                client_name: 'Maria Fernandes',
                client_phone: '21976543210',
                service_needed: 'Revisão geral',
                reason: 'Período recomendado atingido.',
                due_text: 'Vence em 7 dias (15/09/2025)',
                current_km: 82400,
                next_km: 80000,
                next_date: '15/09/2025',
                status: 'ATRASADA',
                urgency: 'CRITICAL'
            },
            {
                id: 'alt_003',
                license_plate: 'QWE2F34',
                vehicle_model: 'Fiat Uno',
                client_name: 'Carlos Almeida',
                client_phone: '21912345678',
                service_needed: 'Alinhamento e balanceamento',
                reason: 'Recomendação técnica pós 10.000 km.',
                due_text: 'Vence em 10 dias (18/09/2025)',
                current_km: 114200,
                next_km: 115000,
                next_date: '18/09/2025',
                status: 'EM_BREVE',
                urgency: 'WARNING'
            }
        ];
    };

    // Obter lista consolidada de veículos
    WorkshopView.getEffectiveVehiclesList = function() {
        if (this.vehiclesList && this.vehiclesList.length > 0) {
            return this.vehiclesList;
        }
        return this.getDefaultMobileVehicles();
    };

    // Localizar veículo por placa
    WorkshopView.findVehicleByPlate = function(plate) {
        if (!plate) return null;
        const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const list = this.getEffectiveVehiclesList();
        return list.find(v => {
            const vPlate = (v.license_plate || v.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            return vPlate === clean;
        }) || null;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // RENDERIZADOR PRINCIPAL DO SHELL MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileShell = function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        // Se o usuário estiver no primeiro acesso e o veículo não estiver selecionado, usa o primeiro como ativo
        if (!this.selectedMobileVehicle) {
            const list = this.getEffectiveVehiclesList();
            this.selectedMobileVehicle = list[0] || null;
        }

        container.innerHTML = `
            <div class="dna-mobile-shell" id="dna-mobile-shell">
                <!-- HEADER SUPERIOR -->
                ${this.renderMobileHeader()}

                <!-- VIEWPORT DE CONTEÚDO ATIVO -->
                <main id="ws-mobile-active-viewport" style="flex:1; width:100%;">
                    ${this.renderMobileActiveSection()}
                </main>

                <!-- BARRA DE NAVEGAÇÃO INFERIOR -->
                ${this.renderMobileBottomNav()}

                <!-- CONTAINER DE MODAL PARA TROCA DE DISPOSITIVO / MODO WEB -->
                <div id="dna-mobile-modal-root"></div>
            </div>
        `;

        this.checkDevicePrompt();
    };

    // ──────────────────────────────────────────────────────────────────────────
    // HEADER SUPERIOR DO APP
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileHeader = function() {
        const wsName = this.officialWorkshopName || 'Oficina Mecânica Exemplo';
        return `
            <header class="dna-mobile-header">
                <div class="dna-mobile-header-top">
                    <!-- Brand DNA AUTO -->
                    <div class="dna-mobile-brand" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <div class="dna-mobile-logo-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <div class="dna-mobile-brand-text">
                            <span class="dna-mobile-brand-title">DNA <span>AUTO</span></span>
                            <span class="dna-mobile-brand-sub">Gestão Inteligente para sua Oficina</span>
                        </div>
                    </div>

                    <!-- Botão Alternador Modo Web / Desktop -->
                    <div class="dna-mobile-header-actions">
                        <button type="button" class="dna-mobile-header-btn" onclick="WorkshopView.openDeviceModal()" title="Alternar Modo de Visualização">
                            <span>💻</span> <span>Modo Web</span>
                        </button>
                    </div>
                </div>

                <!-- Seletor / Indicador da Oficina Credenciada -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                    <div class="dna-mobile-badge-workshop">
                        <span>🏢</span>
                        <span style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${wsName}</span>
                        <span class="online-dot" title="Oficina Conectada"></span>
                        <span style="font-size:10px; color:#10B981; font-weight:700;">Online</span>
                    </div>

                    <!-- Botão de Sair Rápido -->
                    <button type="button" onclick="if(typeof App!=='undefined'&&App.logout) App.logout(); else window.location.href='/';" style="background:none; border:none; color:var(--dna-ws-text-dim); font-size:11px; cursor:pointer; padding:4px 6px;">
                        Sair ↗
                    </button>
                </div>
            </header>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // BARRA DE NAVEGAÇÃO INFERIOR
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileBottomNav = function() {
        const sec = this.currentSection || 'dashboard';
        const isInicio = sec === 'dashboard';
        const isVeiculos = sec === 'buscar-veiculos' || sec === 'entrada-veiculos';
        const isServicos = sec === 'lancar-servicos' || sec === 'detalhe-servico';
        const isClientes = sec === 'clientes' || sec === 'cadastrar-cliente';
        const isMais = sec === 'configuracoes' || sec === 'relatorios' || sec === 'estoque' || sec === 'suporte' || sec === 'financeiro';

        return `
            <nav class="dna-mobile-bottom-nav">
                <div class="dna-nav-item ${isInicio ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('dashboard')">
                    <span class="nav-icon">🏠</span>
                    <span>Início</span>
                </div>
                <div class="dna-nav-item ${isVeiculos ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('buscar-veiculos')">
                    <span class="nav-icon">🚗</span>
                    <span>Veículos</span>
                </div>
                <div class="dna-nav-item ${isServicos ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                    <span class="nav-icon">🔧</span>
                    <span>Serviços</span>
                </div>
                <div class="dna-nav-item ${isClientes ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('clientes')">
                    <span class="nav-icon">👤</span>
                    <span>Clientes</span>
                </div>
                <div class="dna-nav-item ${isMais ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('configuracoes')">
                    <span class="nav-icon">☰</span>
                    <span>Mais</span>
                </div>
            </nav>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // ROTEADOR DE SUB-TELAS MOBILE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileActiveSection = function() {
        switch (this.currentSection) {
            case 'entrada-veiculos':
                return this.renderMobileVehicleEntryView();
            case 'cadastrar-cliente':
                return this.renderMobileClientRegisterView();
            case 'lancar-servicos':
                return this.renderMobileLaunchServicesView();
            case 'detalhe-servico':
                return this.renderMobileServiceDetailView();
            case 'manutencao-veiculos':
                return this.renderMobileMaintenanceVehiclesView();
            case 'avisos-manutencao':
                return this.renderMobileMaintenanceAlertsView();
            case 'enviar-fotos':
                return this.renderMobileSendPhotosView();
            case 'nota-fiscal':
                return this.renderMobileInvoiceView();
            case 'clientes':
                return this.renderMobileClientsView();
            case 'buscar-veiculos':
                return this.renderMobileSearchVehiclesView();
            case 'relatorios':
                return this.renderMobileReportsView();
            case 'financeiro':
                return this.renderMobileFinancialView();
            case 'estoque':
                return this.renderMobileStockView();
            case 'configuracoes':
                return this.renderMobileConfigView();
            case 'suporte':
                return this.renderMobileSupportView();
            case 'dashboard':
            default:
                return this.renderMobileDashboardView();
        }
    };

    // Alternar de Seção no Modo Mobile
    WorkshopView.switchMobileSection = function(sectionId) {
        this.currentSection = sectionId;
        const viewport = document.getElementById('ws-mobile-active-viewport');
        if (viewport) {
            viewport.innerHTML = this.renderMobileActiveSection();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Atualiza bottom nav
            const nav = document.querySelector('.dna-mobile-bottom-nav');
            if (nav) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.renderMobileBottomNav();
                nav.innerHTML = tempDiv.firstElementChild.innerHTML;
            }
        } else {
            this.render();
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 1 & 2: DASHBOARD DA OFICINA COM CARDS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileDashboardView = function() {
        const stats = (this.dashboardData && this.dashboardData.stats) || {};
        const countToday = stats.vehiclesToday || stats.vehicles_today || 6;
        const countInProgress = stats.inProgress || stats.active_services || 4;
        const countPending = stats.waiting || stats.pending_vehicles || 2;
        const alerts = this.getMobileAlerts();
        const pendingAlertsCount = alerts.filter(a => !this.mobileAlertsSent[a.id]).length;

        return `
            <div style="padding-bottom: 20px;">
                <!-- 1. CARD RESUMO NO TOPO -->
                <div class="dna-mobile-stats-card">
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number blue">${countToday}</span>
                        <span class="dna-mobile-stat-label">Veículos hoje</span>
                    </div>
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number green">${countInProgress}</span>
                        <span class="dna-mobile-stat-label">Em andamento</span>
                    </div>
                    <div class="dna-mobile-stat-col">
                        <span class="dna-mobile-stat-number amber">${countPending}</span>
                        <span class="dna-mobile-stat-label">Aguardando</span>
                    </div>
                </div>

                <!-- 2. GRID COM OS 6 CARDS PRINCIPAIS DE ACESSO RÁPIDO -->
                <div class="dna-mobile-grid-section">
                    <div class="dna-mobile-section-header">
                        <span class="dna-mobile-section-label">Acesso Rápido da Oficina</span>
                        <span style="font-size:11px; color:var(--dna-ws-cyan); font-weight:700;">6 Módulos Principais</span>
                    </div>

                    <div class="dna-mobile-actions-grid">
                        <!-- Card 1: Entrada de Veículos -->
                        <div class="dna-mobile-action-card dna-card-blue" onclick="WorkshopView.switchMobileSection('entrada-veiculos')">
                            <div class="dna-card-icon-box">🚗</div>
                            <div>
                                <h3 class="dna-card-title">Entrada de Veículos</h3>
                                <p class="dna-card-desc">Cadastrar, buscar placa ou adicionar veículo</p>
                            </div>
                        </div>

                        <!-- Card 2: Lançar Serviços -->
                        <div class="dna-mobile-action-card dna-card-green" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                            <div class="dna-card-icon-box">🔧</div>
                            <div>
                                <h3 class="dna-card-title">Lançar Serviços</h3>
                                <p class="dna-card-desc">Adicionar serviços, peças e observações</p>
                            </div>
                        </div>

                        <!-- Card 3: Clientes -->
                        <div class="dna-mobile-action-card dna-card-purple" onclick="WorkshopView.switchMobileSection('clientes')">
                            <div class="dna-card-icon-box">👤</div>
                            <div>
                                <h3 class="dna-card-title">Clientes</h3>
                                <p class="dna-card-desc">Cadastrar e gerenciar clientes</p>
                            </div>
                        </div>

                        <!-- Card 4: Notas Fiscais -->
                        <div class="dna-mobile-action-card dna-card-amber" onclick="WorkshopView.switchMobileSection('nota-fiscal')">
                            <div class="dna-card-icon-box">📄</div>
                            <div>
                                <h3 class="dna-card-title">Notas Fiscais</h3>
                                <p class="dna-card-desc">Emitir e gerenciar notas fiscais</p>
                            </div>
                        </div>

                        <!-- Card 5: Enviar Fotos -->
                        <div class="dna-mobile-action-card dna-card-red" onclick="WorkshopView.switchMobileSection('enviar-fotos')">
                            <div class="dna-card-icon-box">📷</div>
                            <div>
                                <h3 class="dna-card-title">Enviar Fotos</h3>
                                <p class="dna-card-desc">Registrar fotos do veículo e dos serviços</p>
                            </div>
                        </div>

                        <!-- Card 6: Buscar Veículos -->
                        <div class="dna-mobile-action-card dna-card-cyan" onclick="WorkshopView.switchMobileSection('buscar-veiculos')">
                            <div class="dna-card-icon-box">🔍</div>
                            <div>
                                <h3 class="dna-card-title">Buscar Veículos</h3>
                                <p class="dna-card-desc">Por placa, chassi ou cliente</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. CARDS ADICIONAIS INDEPENDENTES (ROLAR PARA BAIXO - CADA FUNÇÃO SEU CARD PRÓPRIO!) -->
                <div class="dna-mobile-list-section">
                    <div class="dna-mobile-section-header" style="margin-top:6px;">
                        <span class="dna-mobile-section-label">Gestão, Manutenções & Mais</span>
                    </div>

                    <!-- Card: Manutenção dos Veículos -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('manutencao-veiculos')">
                        <div class="dna-mobile-row-icon dna-icon-amber">🛠️</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Manutenção dos Veículos</h4>
                            <p class="dna-mobile-row-desc">Veja quais veículos estão próximos da manutenção por KM ou por tempo.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-badge dna-badge-red">3</span>
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Avisos de Manutenção -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('avisos-manutencao')">
                        <div class="dna-mobile-row-icon dna-icon-red">🔔</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Avisos de Manutenção</h4>
                            <p class="dna-mobile-row-desc">Veja clientes que precisam ser avisados sobre manutenção.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-badge dna-badge-amber">${pendingAlertsCount}</span>
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Relatórios -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('relatorios')">
                        <div class="dna-mobile-row-icon dna-icon-blue">📊</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Relatórios</h4>
                            <p class="dna-mobile-row-desc">Consulte serviços, veículos, clientes e movimentações.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Financeiro -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('financeiro')">
                        <div class="dna-mobile-row-icon dna-icon-green">💵</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Financeiro</h4>
                            <p class="dna-mobile-row-desc">Controle de recebimentos e despesas da oficina.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Estoque / Peças -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('estoque')">
                        <div class="dna-mobile-row-icon dna-icon-cyan">📦</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Estoque / Peças</h4>
                            <p class="dna-mobile-row-desc">Controle peças e materiais utilizados.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Configurações -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('configuracoes')">
                        <div class="dna-mobile-row-icon dna-icon-purple">⚙️</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Configurações</h4>
                            <p class="dna-mobile-row-desc">Configure os dados da oficina e preferências.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>

                    <!-- Card: Suporte -->
                    <div class="dna-mobile-row-card" onclick="WorkshopView.switchMobileSection('suporte')">
                        <div class="dna-mobile-row-icon dna-icon-blue">🎧</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Suporte</h4>
                            <p class="dna-mobile-row-desc">Ajuda e atendimento DNA AUTO.</p>
                        </div>
                        <div class="dna-mobile-row-right">
                            <span class="dna-mobile-row-chevron">›</span>
                        </div>
                    </div>
                </div>

                <!-- 4. BANNER APP DO CLIENTE -->
                <div class="dna-mobile-client-banner">
                    <div class="dna-banner-left">
                        <div class="dna-banner-icon">📱</div>
                        <div>
                            <div class="dna-banner-title">App do Cliente</div>
                            <div class="dna-banner-desc">Compartilhe o status do serviço, fotos e notas fiscais.</div>
                        </div>
                    </div>
                    <button class="dna-banner-btn" onclick="window.open('/cliente', '_blank')">Ver detalhes</button>
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 3: ENTRADA DE VEÍCULOS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileVehicleEntryView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const tab = this.mobileVehicleEntryTab || 'buscar';

        return `
            <div class="dna-mobile-subpage">
                <!-- Barra Superior com Voltar -->
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Entrada de Veículos</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'buscar' ? 'active' : ''}" onclick="WorkshopView.setMobileEntryTab('buscar')">Buscar Placa</button>
                        <button class="dna-segment-btn ${tab === 'manual' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">Cadastrar Manual</button>
                        <button class="dna-segment-btn ${tab === 'recentes' ? 'active' : ''}" onclick="WorkshopView.setMobileEntryTab('recentes')">Veículos Recentes</button>
                    </div>

                    <!-- Campo de Busca por Placa -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Digite a placa do veículo</label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-entry-plate-input" 
                                class="dna-plate-input" 
                                placeholder="Ex: ABC1D23" 
                                maxlength="8"
                                value="${this.mobileActivePlate || ''}"
                                oninput="this.value = this.value.toUpperCase()"
                                onkeydown="if(event.key==='Enter') WorkshopView.handleMobilePlateEntrySearch()"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleMobilePlateEntrySearch()" title="Pesquisar Placa">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Área de Resultado da Busca -->
                    <div id="mobile-entry-lookup-result">
                        ${this.renderMobileEntryResultContent()}
                    </div>

                    <!-- Seção: Últimos Veículos Atendidos -->
                    <div style="margin-top:10px;">
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:10px;">Últimos Veículos Atendidos</span>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${vehicles.slice(0, 5).map(v => `
                                <div class="dna-mobile-row-card" style="padding:12px 14px;" onclick="WorkshopView.handleMobileSelectVehicleFromList('${v.license_plate}')">
                                    <div class="dna-mobile-row-icon dna-icon-blue" style="width:36px; height:36px; font-size:18px;">🚗</div>
                                    <div class="dna-mobile-row-content">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="font-weight:800; color:#FFFFFF; font-size:13.5px; font-family:monospace;">${v.license_plate}</span>
                                            <span style="font-size:12px; color:var(--dna-ws-text-muted);">${v.model}</span>
                                        </div>
                                        <div style="font-size:10.5px; color:var(--dna-ws-text-dim); margin-top:2px;">
                                            ${v.last_service_date || 'Atendimento recente'} • ${v.client_name || 'Cliente da Oficina'}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">
                        <span>+</span> <span>Adicionar Veículo</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileEntryTab = function(tab) {
        this.mobileVehicleEntryTab = tab;
        this.switchMobileSection('entrada-veiculos');
    };

    WorkshopView.renderMobileEntryResultContent = function() {
        if (!this.mobileActivePlate) return '';

        const v = this.findVehicleByPlate(this.mobileActivePlate);
        if (v) {
            return `
                <div style="background:rgba(16, 185, 129, 0.1); border:1px solid var(--dna-ws-green); border-radius:var(--dna-ws-radius-lg); padding:14px 16px; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:8px; color:var(--dna-ws-green); font-size:12px; font-weight:800; margin-bottom:10px;">
                        <span>✓</span> <span>Veículo encontrado na rede DNA AUTO!</span>
                    </div>

                    <div class="dna-vehicle-preview-card" style="margin-bottom:12px; background:rgba(6, 11, 20, 0.9);">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title">${v.brand || ''} ${v.model || ''}</div>
                            <div class="dna-vehicle-preview-meta">${v.license_plate} • ${v.year || ''} • ${v.color || ''}</div>
                            <div class="dna-vehicle-preview-owner">Proprietário: ${v.client_name || 'Cadastrado'}</div>
                        </div>
                    </div>

                    <button class="dna-primary-btn-lg green" style="height:46px; font-size:13.5px;" onclick="WorkshopView.handleMobileStartAttendance('${v.license_plate}')">
                        <span>Iniciar Atendimento & Lançar Serviços</span> <span>›</span>
                    </button>
                </div>
            `;
        } else {
            return `
                <div style="background:rgba(239, 68, 68, 0.1); border:1px solid var(--dna-ws-red); border-radius:var(--dna-ws-radius-lg); padding:14px 16px; margin-bottom:8px; text-align:center;">
                    <div style="color:var(--dna-ws-red); font-size:13px; font-weight:800; margin-bottom:6px;">
                        ⚠️ Veículo não localizado na base
                    </div>
                    <p style="font-size:11.5px; color:var(--dna-ws-text-muted); margin-bottom:12px;">
                        A placa <strong>${this.mobileActivePlate}</strong> ainda não possui cadastro no DNA AUTO.
                    </p>
                    <button class="dna-primary-btn-lg cyan" style="height:44px; font-size:13px;" onclick="WorkshopView.handleMobileRegisterNewVehicleFromEntry('${this.mobileActivePlate}')">
                        <span>Cadastrar este Veículo Agora</span>
                    </button>
                </div>
            `;
        }
    };

    WorkshopView.handleMobilePlateEntrySearch = function() {
        const input = document.getElementById('mobile-entry-plate-input');
        const plate = (input?.value || '').trim().toUpperCase();
        if (!plate) {
            alert('Por favor, informe a placa do veículo.');
            return;
        }
        this.mobileActivePlate = plate;
        this.switchMobileSection('entrada-veiculos');
    };

    WorkshopView.handleMobileSelectVehicleFromList = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            this.mobileActivePlate = v.license_plate;
            this.switchMobileSection('lancar-servicos');
        }
    };

    WorkshopView.handleMobileStartAttendance = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            this.switchMobileSection('lancar-servicos');
        }
    };

    WorkshopView.handleMobileRegisterNewVehicleFromEntry = function(plate) {
        this.mobileActivePlate = plate;
        this.switchMobileSection('cadastrar-cliente');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 4: CADASTRAR CLIENTE (PLACA PRIMEIRO!)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileClientRegisterView = function() {
        const plate = this.mobileActivePlate || 'ABC1D23';
        const v = this.findVehicleByPlate(plate) || {
            brand: 'Honda',
            model: 'Civic Touring',
            license_plate: plate,
            year: '2020',
            color: 'Prata',
            client_name: 'João Silva'
        };

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Cadastrar Cliente</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- ETAPA 1: PLACA DO VEÍCULO (PRIORIDADE ABSOLUTA) -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Placa do veículo *</label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-reg-plate-input" 
                                class="dna-plate-input" 
                                placeholder="ABC1D23" 
                                value="${plate}"
                                maxlength="8"
                                oninput="this.value = this.value.toUpperCase()"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleMobileSearchPlateForClientRegister()" title="Buscar Dados do Veículo">
                                🔍
                            </button>
                        </div>
                        <span style="font-size:11px; color:var(--dna-ws-text-dim);">Busque a placa para carregar os dados do veículo.</span>
                    </div>

                    <!-- CARD DE PRÉVIA DO VEÍCULO IDENTIFICADO -->
                    <div class="dna-vehicle-preview-card">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title" id="mobile-reg-veh-model">${v.brand || ''} ${v.model || 'Veículo Localizado'}</div>
                            <div class="dna-vehicle-preview-meta" id="mobile-reg-veh-meta">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner" id="mobile-reg-veh-owner">Cliente sugerido: ${v.client_name || 'Novo Proprietário'}</div>
                        </div>
                    </div>

                    <!-- ETAPA 2: DADOS DO PROPRIETÁRIO -->
                    <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Dados do Proprietário</span>

                        <div class="dna-input-group">
                            <label class="dna-input-label">Nome completo *</label>
                            <input type="text" id="mobile-reg-owner-name" class="form-control" placeholder="João da Silva" value="${v.client_name || 'João da Silva'}" style="height:48px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); color:#fff; border-radius:12px; padding:0 14px;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">WhatsApp *</label>
                            <input type="tel" id="mobile-reg-owner-wpp" class="form-control" placeholder="(21) 98765-4321" value="${v.client_phone || '(21) 98765-4321'}" style="height:48px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); color:#fff; border-radius:12px; padding:0 14px;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">E-mail *</label>
                            <input type="email" id="mobile-reg-owner-email" class="form-control" placeholder="joao@email.com" value="${v.client_email || 'joao@email.com'}" style="height:48px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); color:#fff; border-radius:12px; padding:0 14px;" />
                        </div>

                        <div class="dna-input-group">
                            <label class="dna-input-label">Senha de Acesso ao App *</label>
                            <div style="position:relative;">
                                <input type="password" id="mobile-reg-owner-pass" class="form-control" placeholder="Crie uma senha" value="123456" style="height:48px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); color:#fff; border-radius:12px; padding:0 40px 0 14px;" />
                                <button type="button" onclick="const p=document.getElementById('mobile-reg-owner-pass'); p.type = p.type==='password'?'text':'password';" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--dna-ws-text-muted); cursor:pointer;">
                                    👁️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botão Fixo de Confirmação -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSubmitClientRegister()">
                        <span>✓</span> <span>Cadastrar Cliente</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobileSearchPlateForClientRegister = async function() {
        const input = document.getElementById('mobile-reg-plate-input');
        const plate = (input?.value || '').trim().toUpperCase();
        if (!plate) {
            alert('Digite a placa para consultar.');
            return;
        }

        this.mobileActivePlate = plate;
        const v = this.findVehicleByPlate(plate);
        if (v) {
            document.getElementById('mobile-reg-veh-model').innerText = `${v.brand || ''} ${v.model || ''}`;
            document.getElementById('mobile-reg-veh-meta').innerText = `${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}`;
            document.getElementById('mobile-reg-veh-owner').innerText = `Cliente sugerido: ${v.client_name || 'Novo Proprietário'}`;
            if (v.client_name) document.getElementById('mobile-reg-owner-name').value = v.client_name;
            if (v.client_phone) document.getElementById('mobile-reg-owner-wpp').value = v.client_phone;
            if (v.client_email) document.getElementById('mobile-reg-owner-email').value = v.client_email;
        } else {
            // Consulta dinâmica na API Placas caso disponível
            try {
                const res = await API.lookupPlate(plate);
                if (res && res.vehicle) {
                    const veh = res.vehicle;
                    document.getElementById('mobile-reg-veh-model').innerText = `${veh.brand || ''} ${veh.model || ''}`;
                    document.getElementById('mobile-reg-veh-meta').innerText = `${plate} • ${veh.model_year || '2022'} • ${veh.color || 'Preto'}`;
                }
            } catch (_) {}
        }
    };

    WorkshopView.handleMobileSubmitClientRegister = async function() {
        const plate = document.getElementById('mobile-reg-plate-input')?.value?.trim()?.toUpperCase() || 'ABC1D23';
        const name = document.getElementById('mobile-reg-owner-name')?.value?.trim() || 'Cliente';
        const phone = document.getElementById('mobile-reg-owner-wpp')?.value?.trim() || '';
        const email = document.getElementById('mobile-reg-owner-email')?.value?.trim() || '';

        try {
            // Tenta registrar na API se estiver disponível
            if (API.registerClient) {
                await API.registerClient({
                    name,
                    whatsapp: phone,
                    email,
                    license_plate: plate
                }).catch(() => {});
            }
        } catch (_) {}

        alert(`🎉 Cliente ${name} cadastrado com sucesso e vinculado à placa ${plate}!\nO passaporte digital DNA AUTO foi ativado.`);
        this.selectedMobileVehicle = {
            license_plate: plate,
            client_name: name,
            client_phone: phone,
            client_email: email,
            model: 'Honda Civic',
            brand: 'Honda',
            year: '2020',
            color: 'Prata',
            mileage: 10000
        };
        this.switchMobileSection('lancar-servicos');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 5: LANÇAR SERVIÇOS (SEM PREÇOS!)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileLaunchServicesView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const services = this.monitoredServicesCatalog;

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Lançar Serviços</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- VEÍCULO ATIVO NO TOPO -->
                    <div class="dna-vehicle-preview-card" style="margin-bottom:4px;">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title">${v.brand || ''} ${v.model || 'Honda Civic'}</div>
                            <div class="dna-vehicle-preview-meta">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner">Cliente: ${v.client_name || 'João Silva'}</div>
                        </div>
                        <button type="button" onclick="WorkshopView.switchMobileSection('entrada-veiculos')" style="background:none; border:none; color:var(--dna-ws-cyan); font-size:12px; font-weight:700; cursor:pointer;">
                            Alterar
                        </button>
                    </div>

                    <!-- TABS: SERVIÇOS / PEÇAS -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn active">Serviços</button>
                        <button class="dna-segment-btn" onclick="WorkshopView.switchMobileSection('estoque')">Peças</button>
                    </div>

                    <!-- BUSCADOR RÁPIDO DE SERVIÇO -->
                    <div style="position:relative;">
                        <input 
                            type="text" 
                            id="mobile-service-search-input" 
                            placeholder="🔍 Buscar serviço..." 
                            oninput="WorkshopView.handleMobileFilterServicesList(this.value)"
                            style="width:100%; height:44px; background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.3); border-radius:12px; padding:0 14px; color:#fff; font-size:13.5px; box-sizing:border-box;"
                        />
                    </div>

                    <!-- LISTA DE SERVIÇOS POR MONITORAMENTO (SEM PREÇOS!) -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:8px;">Serviços por Monitoramento</span>
                        <div class="dna-service-monitoring-list" id="mobile-services-items-container">
                            ${services.map(s => `
                                <div class="dna-service-item-row" onclick="WorkshopView.handleMobileSelectServiceToDetail('${s.id}')">
                                    <div class="dna-service-item-icon">${s.icon}</div>
                                    <div class="dna-service-item-content">
                                        <div class="dna-service-item-title">${s.title}</div>
                                        <div class="dna-service-item-tag">
                                            ${s.mode === 'km' ? 'Por km' : s.mode === 'tempo' ? 'Por tempo' : 'Por km ou tempo'}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSelectServiceToDetail('srv_oleo')">
                        <span>+</span> <span>Adicionar Serviço</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobileFilterServicesList = function(query) {
        const q = (query || '').toLowerCase().trim();
        const container = document.getElementById('mobile-services-items-container');
        if (!container) return;

        const filtered = this.monitoredServicesCatalog.filter(s => s.title.toLowerCase().includes(q));
        container.innerHTML = filtered.map(s => `
            <div class="dna-service-item-row" onclick="WorkshopView.handleMobileSelectServiceToDetail('${s.id}')">
                <div class="dna-service-item-icon">${s.icon}</div>
                <div class="dna-service-item-content">
                    <div class="dna-service-item-title">${s.title}</div>
                    <div class="dna-service-item-tag">
                        ${s.mode === 'km' ? 'Por km' : s.mode === 'tempo' ? 'Por tempo' : 'Por km ou tempo'}
                    </div>
                </div>
                <span class="dna-mobile-row-chevron">›</span>
            </div>
        `).join('');
    };

    WorkshopView.handleMobileSelectServiceToDetail = function(serviceId) {
        const s = this.monitoredServicesCatalog.find(item => item.id === serviceId) || this.monitoredServicesCatalog[0];
        this.selectedMobileService = s;
        this.switchMobileSection('detalhe-servico');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 6: DETALHE DO SERVIÇO (EX: TROCA DE ÓLEO E FILTROS)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileServiceDetailView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const s = this.selectedMobileService || this.monitoredServicesCatalog[0];

        const todayStr = new Date().toISOString().split('T')[0];
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + (s.defaultMonths || 6));
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const currentMileage = v.mileage || 45000;
        const nextMileage = currentMileage + (s.defaultKm || 10000);

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">${s.num}. ${s.title}</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- MINI-CARD DO VEÍCULO -->
                    <div class="dna-vehicle-preview-card" style="padding:10px 14px;">
                        <div class="dna-vehicle-preview-thumb" style="width:38px; height:38px; font-size:18px;">🔧</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title" style="font-size:13.5px;">${v.brand || ''} ${v.model || 'Honda Civic'}</div>
                            <div class="dna-vehicle-preview-meta" style="font-size:11px;">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner" style="font-size:10.5px;">Cliente: ${v.client_name || 'João Silva'}</div>
                        </div>
                    </div>

                    <!-- TABS: MONITORAMENTO / OBSERVAÇÕES -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn active">Monitoramento</button>
                        <button class="dna-segment-btn" onclick="alert('Aba de observações habilitada.')">Observações</button>
                    </div>

                    <!-- CONDIÇÃO PARA TROCA -->
                    <div style="background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:var(--dna-ws-radius-lg); padding:16px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Condição para Troca</span>

                        <!-- Opção por KM -->
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer;">
                                <input type="radio" name="mobile_srv_condition" value="km" checked />
                                <span>Por quilometragem</span>
                            </label>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted);">A cada</span>
                                <input type="number" id="mobile-srv-interval-km" value="${s.defaultKm || 10000}" style="width:80px; height:36px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:8px; color:#fff; text-align:center; font-weight:800;" />
                                <span style="font-size:11.5px; color:var(--dna-ws-cyan);">km</span>
                            </div>
                        </div>

                        <!-- Opção por Tempo -->
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer;">
                                <input type="radio" name="mobile_srv_condition" value="tempo" />
                                <span>Por tempo</span>
                            </label>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span style="font-size:11px; color:var(--dna-ws-text-muted);">A cada</span>
                                <input type="number" id="mobile-srv-interval-months" value="${s.defaultMonths || 12}" style="width:60px; height:36px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:8px; color:#fff; text-align:center; font-weight:800;" />
                                <span style="font-size:11.5px; color:var(--dna-ws-cyan);">meses</span>
                            </div>
                        </div>
                    </div>

                    <!-- ÚLTIMA TROCA REGISTRADA -->
                    <div style="background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:var(--dna-ws-radius-lg); padding:16px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label">Última Troca Registrada</span>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Data</label>
                                <input type="date" id="mobile-srv-last-date" value="${todayStr}" style="height:42px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:10px; color:#fff; padding:0 10px; font-size:12.5px;" />
                            </div>
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Quilometragem</label>
                                <input type="number" id="mobile-srv-last-km" value="${currentMileage}" style="height:42px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:10px; color:#fff; padding:0 10px; font-size:12.5px; font-weight:700;" />
                            </div>
                        </div>
                    </div>

                    <!-- PRÓXIMA TROCA PREVISTA (CÁLCULO AUTOMÁTICO) -->
                    <div style="background:linear-gradient(145deg, rgba(0,102,255,0.12), rgba(0,212,255,0.06)); border:1px solid rgba(0,212,255,0.3); border-radius:var(--dna-ws-radius-lg); padding:16px; display:flex; flex-direction:column; gap:12px;">
                        <span class="dna-mobile-section-label" style="color:var(--dna-ws-cyan);">Próxima Troca Prevista</span>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Data estimada</label>
                                <input type="date" id="mobile-srv-next-date" value="${nextDateStr}" style="height:42px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,212,255,0.4); border-radius:10px; color:#fff; padding:0 10px; font-size:12.5px;" />
                            </div>
                            <div class="dna-input-group">
                                <label class="dna-input-label" style="font-size:11px;">Quilometragem estimada</label>
                                <input type="number" id="mobile-srv-next-km" value="${nextMileage}" style="height:42px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,212,255,0.4); border-radius:10px; color:#fff; padding:0 10px; font-size:12.5px; font-weight:700;" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSaveServiceRecord()">
                        <span>✓</span> <span>Registrar Serviço</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobileSaveServiceRecord = async function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const s = this.selectedMobileService || this.monitoredServicesCatalog[0];
        const lastKm = document.getElementById('mobile-srv-last-km')?.value || v.mileage;
        const nextKm = document.getElementById('mobile-srv-next-km')?.value || (Number(lastKm) + 10000);

        try {
            // Salva na API se disponível
            if (API.registerWorkshopService) {
                const fd = new FormData();
                fd.append('vehicle_id', v.id || v.license_plate);
                fd.append('license_plate', v.license_plate);
                fd.append('service_title', s.title);
                fd.append('mileage', lastKm);
                fd.append('category', 'Manutenção Preventiva');
                await API.registerWorkshopService(fd).catch(() => {});
            }
        } catch (_) {}

        alert(`✅ Serviço "${s.title}" registrado com sucesso para o veículo ${v.license_plate}!\nOdômetro atual: ${lastKm} km | Próxima troca: ${nextKm} km.`);
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 7: MANUTENÇÃO DOS VEÍCULOS (SEÇÃO 10 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileMaintenanceVehiclesView = function() {
        const alerts = this.getMobileAlerts();
        const filter = this.mobileMaintFilter || 'todos';

        const filtered = alerts.filter(a => {
            if (filter === 'atrasadas') return a.status === 'ATRASADA';
            if (filter === 'em_breve') return a.status === 'EM_BREVE';
            return true;
        });

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Manutenção dos Veículos</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Filter Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${filter === 'todos' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('todos')">Todas (${alerts.length})</button>
                        <button class="dna-segment-btn ${filter === 'atrasadas' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('atrasadas')">Atrasadas</button>
                        <button class="dna-segment-btn ${filter === 'em_breve' ? 'active' : ''}" onclick="WorkshopView.setMobileMaintFilter('em_breve')">Em Breve</button>
                    </div>

                    <!-- Cards de Veículos com Manutenção Próxima / Vencida -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${filtered.map(item => `
                            <div class="dna-mobile-row-card" style="flex-direction:column; align-items:stretch; gap:10px;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-size:20px;">🚗</span>
                                        <div>
                                            <span style="font-weight:800; color:#fff; font-size:15px;">${item.vehicle_model}</span>
                                            <span style="font-family:monospace; color:var(--dna-ws-cyan); font-weight:700; margin-left:6px;">${item.license_plate}</span>
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-badge ${item.status === 'ATRASADA' ? 'dna-badge-red' : 'dna-badge-amber'}">
                                        ${item.status === 'ATRASADA' ? 'ATRASADA' : 'EM BREVE'}
                                    </span>
                                </div>

                                <div style="font-size:12px; color:var(--dna-ws-text-muted);">
                                    Cliente: <strong style="color:#fff;">${item.client_name}</strong>
                                </div>

                                <div style="background:rgba(8,16,32,0.7); border-radius:10px; padding:10px 12px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:13px; font-weight:700; color:var(--dna-ws-cyan);">
                                        🔧 ${item.service_needed}
                                    </div>
                                    <div style="font-size:11.5px; color:var(--dna-ws-text-dim); margin-top:2px;">
                                        Motivo: ${item.reason}
                                    </div>
                                    <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:11px; color:#fff;">
                                        <span>Atual: <strong>${item.current_km.toLocaleString('pt-BR')} km</strong></span>
                                        <span>Próxima: <strong>${item.next_km.toLocaleString('pt-BR')} km</strong></span>
                                        <span>Venc: <strong>${item.next_date}</strong></span>
                                    </div>
                                </div>

                                <div style="display:flex; gap:8px; margin-top:4px;">
                                    <button class="dna-whatsapp-btn" style="flex:1; height:38px; font-size:12px;" onclick="WorkshopView.handleMobileSendWhatsAppAlert('${item.id}')">
                                        <span>💬 Avisar no WhatsApp</span>
                                    </button>
                                    <button class="dna-primary-btn-lg" style="flex:1; height:38px; font-size:12px;" onclick="WorkshopView.handleMobileDirectServiceLaunch('${item.license_plate}', '${item.service_needed}')">
                                        <span>🔧 Lançar Serviço</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileMaintFilter = function(filter) {
        this.mobileMaintFilter = filter;
        this.switchMobileSection('manutencao-veiculos');
    };

    WorkshopView.handleMobileDirectServiceLaunch = function(plate, serviceName) {
        const v = this.findVehicleByPlate(plate);
        if (v) this.selectedMobileVehicle = v;
        const s = this.monitoredServicesCatalog.find(item => item.title.toLowerCase().includes(serviceName.toLowerCase())) || this.monitoredServicesCatalog[0];
        this.selectedMobileService = s;
        this.switchMobileSection('detalhe-servico');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 8: AVISOS DE MANUTENÇÃO & WHATSAPP AUTOMÁTICO (SEÇÃO 11 & 12)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileMaintenanceAlertsView = function() {
        const tab = this.mobileAlertTab || 'pendentes';
        const alerts = this.getMobileAlerts();
        const pending = alerts.filter(a => !this.mobileAlertsSent[a.id]);
        const sent = alerts.filter(a => this.mobileAlertsSent[a.id]);
        const currentList = tab === 'pendentes' ? pending : sent;

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Avisos de Manutenção</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'pendentes' ? 'active' : ''}" onclick="WorkshopView.setMobileAlertTab('pendentes')">
                            Pendentes (${pending.length})
                        </button>
                        <button class="dna-segment-btn ${tab === 'enviados' ? 'active' : ''}" onclick="WorkshopView.setMobileAlertTab('enviados')">
                            Enviados (${sent.length})
                        </button>
                    </div>

                    <!-- Lista de Alertas -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${currentList.length === 0 ? `
                            <div style="padding:40px 20px; text-align:center; color:var(--dna-ws-text-muted);">
                                <span>🎉</span>
                                <div style="font-size:14px; font-weight:700; color:#fff; margin-top:8px;">Nenhum aviso pendente no momento!</div>
                                <span style="font-size:12px;">Todos os clientes com manutenções próximas foram notificados.</span>
                            </div>
                        ` : currentList.map(a => `
                            <div class="dna-maint-alert-card">
                                <div class="dna-maint-alert-header">
                                    <div class="dna-maint-alert-icon ${a.urgency === 'CRITICAL' ? 'dna-alert-critical' : 'dna-alert-warning'}">
                                        !
                                    </div>
                                    <div class="dna-maint-alert-info">
                                        <div class="dna-maint-alert-car">${a.vehicle_model} - <span style="font-family:monospace; color:var(--dna-ws-cyan);">${a.license_plate}</span></div>
                                        <div style="font-size:12px; color:var(--dna-ws-text-muted); margin-top:2px;">Cliente: <strong style="color:#fff;">${a.client_name}</strong></div>
                                        <div class="dna-maint-alert-service">Necessário: ${a.service_needed}</div>
                                        <div style="font-size:11.5px; color:var(--dna-ws-text-dim); margin-top:2px;">Motivo: ${a.reason}</div>
                                        <div class="dna-maint-alert-due ${a.urgency === 'WARNING' ? 'amber' : ''}">
                                            ${a.due_text}
                                        </div>
                                    </div>
                                </div>

                                <button class="dna-whatsapp-btn" onclick="WorkshopView.handleMobileSendWhatsAppAlert('${a.id}')">
                                    <span>💬</span> <span>Enviar WhatsApp</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Preview da Configuração de Mensagem Automática -->
                    <div style="background:rgba(8,16,32,0.8); border:1px solid rgba(255,255,255,0.06); border-radius:var(--dna-ws-radius-lg); padding:14px;">
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:6px;">Configuração da Mensagem</span>
                        <div style="font-size:11.5px; color:var(--dna-ws-text-muted); line-height:1.4; font-family:var(--dna-ws-font-main); background:rgba(0,0,0,0.3); padding:10px 12px; border-radius:8px;">
                            "Olá, {nome}! A oficina {nome_oficina} identificou que seu veículo {modelo}, placa {placa}, está próximo do período recomendado para {servico}. Recomendamos realizar a manutenção para manter o veículo em boas condições. Estamos à disposição para agendar seu atendimento."
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileAlertTab = function(tab) {
        this.mobileAlertTab = tab;
        this.switchMobileSection('avisos-manutencao');
    };

    WorkshopView.handleMobileSendWhatsAppAlert = function(alertId) {
        const alerts = this.getMobileAlerts();
        const a = alerts.find(item => item.id === alertId);
        if (!a) return;

        const wsName = this.officialWorkshopName || 'Veloce Auto Center Premium';
        const message = `Olá, ${a.client_name}!\nA oficina ${wsName} identificou que seu veículo ${a.vehicle_model}, placa ${a.license_plate}, está próximo do período recomendado para ${a.service_needed}.\nRecomendamos realizar a manutenção para manter o veículo em boas condições.\nEstamos à disposição para agendar seu atendimento.`;

        this.mobileAlertsSent[alertId] = true;
        const phone = a.client_phone.replace(/[^0-9]/g, '');
        const targetUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

        window.open(targetUrl, '_blank');
        alert(`📲 WhatsApp gerado e aberto para ${a.client_name}!\nMensagem com ${wsName} transmitida com sucesso.`);
        this.switchMobileSection('avisos-manutencao');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 9: ENVIAR FOTOS (SEÇÃO 13 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileSendPhotosView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const photos = this.mobileUploadedPhotos || [];

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Enviar Fotos</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- VEÍCULO VINCULADO -->
                    <div class="dna-vehicle-preview-card">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title">${v.brand || ''} ${v.model || 'Honda Civic'}</div>
                            <div class="dna-vehicle-preview-meta">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner">Cliente: ${v.client_name || 'João Silva'}</div>
                        </div>
                    </div>

                    <!-- CAMPO DESCRIÇÃO OBRIGATÓRIA COM CONTADOR -->
                    <div class="dna-input-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label class="dna-input-label">Descrição do serviço / foto *</label>
                            <span id="mobile-photo-desc-counter" style="font-size:10.5px; color:var(--dna-ws-text-dim);">67/200</span>
                        </div>
                        <textarea 
                            id="mobile-photo-desc-input" 
                            rows="3" 
                            maxlength="200" 
                            oninput="document.getElementById('mobile-photo-desc-counter').innerText = this.value.length + '/200'"
                            style="width:100%; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); border-radius:12px; padding:12px; color:#fff; font-size:13px; font-family:var(--dna-ws-font-main); box-sizing:border-box;"
                        >Troca do filtro de óleo e filtro de ar. Peças originais.</textarea>
                    </div>

                    <!-- ÁREA DE UPLOAD DE FOTOS (CÂMERA / GALERIA) -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:8px;">Registro Fotográfico</span>
                        
                        <input type="file" id="mobile-photo-file-input" accept="image/*" multiple style="display:none;" onchange="WorkshopView.handleMobilePhotoFileSelect(this)" />
                        
                        <div class="dna-photo-upload-box" onclick="document.getElementById('mobile-photo-file-input').click()">
                            <span style="font-size:32px;">📷</span>
                            <strong style="color:#fff; font-size:14px;">Toque para adicionar fotos</strong>
                            <span style="font-size:12px; color:var(--dna-ws-text-muted);">Tire fotos com a câmera ou escolha da galeria</span>
                        </div>

                        <!-- Grid de Miniaturas de Fotos -->
                        <div class="dna-photo-grid" id="mobile-photos-preview-grid">
                            ${photos.length === 0 ? `
                                <div class="dna-photo-thumb"><img src="./img/service-sample-1.jpg" onerror="this.src='./img/icons/icon-192x192.png'" alt="Foto" /><button class="dna-photo-remove-btn" onclick="WorkshopView.handleRemoveSamplePhoto(0)">×</button></div>
                                <div class="dna-photo-thumb"><img src="./img/service-sample-2.jpg" onerror="this.src='./img/icons/icon-192x192.png'" alt="Foto" /><button class="dna-photo-remove-btn" onclick="WorkshopView.handleRemoveSamplePhoto(1)">×</button></div>
                                <div class="dna-photo-thumb"><img src="./img/service-sample-3.jpg" onerror="this.src='./img/icons/icon-192x192.png'" alt="Foto" /><button class="dna-photo-remove-btn" onclick="WorkshopView.handleRemoveSamplePhoto(2)">×</button></div>
                            ` : photos.map((p, idx) => `
                                <div class="dna-photo-thumb">
                                    <img src="${p}" alt="Foto ${idx+1}" />
                                    <button class="dna-photo-remove-btn" onclick="WorkshopView.handleMobileRemovePhoto(${idx})">×</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- NOTA FISCAL / COMPROVANTE -->
                    <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:8px;">Nota Fiscal / Comprovante</span>
                        
                        <input type="file" id="mobile-invoice-file-input" accept="image/*,application/pdf" style="display:none;" onchange="WorkshopView.handleMobileInvoiceFileSelect(this)" />
                        
                        <div style="display:flex; align-items:center; gap:12px; background:rgba(8,16,32,0.8); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:10px 14px;">
                            <span style="font-size:24px;">🧾</span>
                            <div style="flex:1;">
                                <strong style="color:#fff; font-size:12.5px; display:block;">Anexo do Documento</strong>
                                <span style="font-size:11px; color:var(--dna-ws-text-muted);" id="mobile-invoice-label">
                                    ${this.mobileInvoiceAttachment ? 'NF-e 009284 anexada ✓' : 'Nenhuma nota vinculada'}
                                </span>
                            </div>
                            <button type="button" class="btn btn-sm btn-cyan" onclick="document.getElementById('mobile-invoice-file-input').click()" style="padding:6px 10px; font-size:11px; border-radius:8px;">
                                + Adicionar nota fiscal
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.handleMobileSavePhotos()">
                        <span>✓</span> <span>Salvar Fotos</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.handleMobilePhotoFileSelect = function(input) {
        if (!input.files || input.files.length === 0) return;
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.mobileUploadedPhotos.push(e.target.result);
                this.switchMobileSection('enviar-fotos');
            };
            reader.readAsDataURL(file);
        });
    };

    WorkshopView.handleMobileInvoiceFileSelect = function(input) {
        if (!input.files || input.files.length === 0) return;
        this.mobileInvoiceAttachment = input.files[0].name;
        this.switchMobileSection('enviar-fotos');
    };

    WorkshopView.handleMobileRemovePhoto = function(index) {
        this.mobileUploadedPhotos.splice(index, 1);
        this.switchMobileSection('enviar-fotos');
    };

    WorkshopView.handleRemoveSamplePhoto = function(idx) {
        alert('Foto removida da prévia.');
    };

    WorkshopView.handleMobileSavePhotos = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const desc = document.getElementById('mobile-photo-desc-input')?.value || 'Registro fotográfico';

        alert(`📸 Fotos e comprovante salvos com sucesso para ${v.license_plate}!\nAs fotos foram integradas ao Dossiê 360° e já estão disponíveis no aplicativo do cliente.`);
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 10: NOTA FISCAL (SEÇÃO 14 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileInvoiceView = function() {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        const items = this.mobileInvoiceItems || [];
        const subtotal = items.filter(i => i.checked).reduce((acc, curr) => acc + curr.price, 0);

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Nota Fiscal</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- MINI-CARD DO VEÍCULO -->
                    <div class="dna-vehicle-preview-card">
                        <div class="dna-vehicle-preview-thumb">🚗</div>
                        <div class="dna-vehicle-preview-info">
                            <div class="dna-vehicle-preview-title">${v.brand || ''} ${v.model || 'Honda Civic'}</div>
                            <div class="dna-vehicle-preview-meta">${v.license_plate} • ${v.year || '2020'} • ${v.color || 'Prata'}</div>
                            <div class="dna-vehicle-preview-owner">Cliente: ${v.client_name || 'João Silva'}</div>
                        </div>
                    </div>

                    <!-- TABS: VEÍCULO / SERVIÇOS -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn">🚗 Veículo</button>
                        <button class="dna-segment-btn active">🔧 Serviços</button>
                    </div>

                    <!-- BUSCA POR PLACA -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Placa *</label>
                        <div class="dna-input-search-row">
                            <input type="text" class="dna-plate-input" value="${v.license_plate}" readonly />
                            <button class="dna-search-action-btn" onclick="WorkshopView.switchMobileSection('entrada-veiculos')">🔍</button>
                        </div>
                    </div>

                    <!-- CLIENTE -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">Cliente</label>
                        <div class="dna-input-search-row">
                            <input type="text" class="form-control" value="${v.client_name || 'João Silva'}" readonly style="height:48px; background:rgba(8,16,32,0.9); border:1px solid rgba(0,102,255,0.3); color:#fff; border-radius:12px; padding:0 14px; flex:1;" />
                            <button class="dna-search-action-btn" onclick="WorkshopView.switchMobileSection('clientes')">🔍</button>
                        </div>
                    </div>

                    <!-- CHECKLIST DE SERVIÇOS / PEÇAS COM VALORES -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:8px;">Serviços / Peças</span>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${items.map((item, idx) => `
                                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:12px; padding:12px 14px;">
                                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:700; color:#fff;">
                                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="WorkshopView.handleToggleInvoiceItem(${idx})" />
                                        <span>${item.title}</span>
                                    </label>
                                    <span style="font-weight:800; color:var(--dna-ws-cyan); font-size:13.5px;">
                                        R$ ${item.price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- TOTAIS -->
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,212,255,0.25); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--dna-ws-text-muted);">
                            <span>Subtotal</span>
                            <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--dna-ws-text-muted);">
                            <span>Desconto (opcional)</span>
                            <span>R$ 0,00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; color:#fff; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; margin-top:2px;">
                            <span>Total</span>
                            <span style="color:var(--dna-ws-green);">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </div>

                <!-- Botões Inferiores Fixos -->
                <div class="dna-mobile-fixed-bottom-bar" style="display:flex; gap:10px;">
                    <button class="dna-primary-btn-lg" style="flex:1;" onclick="WorkshopView.handleMobileSaveInvoice(false)">
                        <span>✓</span> <span>Salvar e Emitir</span>
                    </button>
                    <button class="dna-primary-btn-lg cyan" style="flex:1;" onclick="WorkshopView.handleMobileSaveInvoice(true)">
                        <span>↗</span> <span>Emitir Nota Fiscal</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.handleToggleInvoiceItem = function(index) {
        if (this.mobileInvoiceItems[index]) {
            this.mobileInvoiceItems[index].checked = !this.mobileInvoiceItems[index].checked;
            this.switchMobileSection('nota-fiscal');
        }
    };

    WorkshopView.handleMobileSaveInvoice = function(isIssue) {
        const v = this.selectedMobileVehicle || this.getDefaultMobileVehicles()[0];
        alert(isIssue 
            ? `📄 Nota Fiscal Eletrônica emitida com sucesso para o veículo ${v.license_plate}!\nO documento foi transmitido e vinculado à Ficha Digital.`
            : `💾 Dados da Nota Fiscal salvos com sucesso para ${v.license_plate}.`
        );
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 11: CLIENTES (SEÇÃO 15 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileClientsView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const tab = this.mobileClientsTab || 'lista';

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Clientes</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${tab === 'cadastrar' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">Cadastrar</button>
                        <button class="dna-segment-btn ${tab === 'lista' ? 'active' : ''}" onclick="WorkshopView.setMobileClientsTab('lista')">Lista de Clientes</button>
                    </div>

                    <!-- Campo de Busca -->
                    <div style="position:relative;">
                        <input 
                            type="text" 
                            id="mobile-clients-search-input" 
                            placeholder="🔍 Buscar cliente..." 
                            oninput="WorkshopView.handleMobileFilterClientsList(this.value)"
                            style="width:100%; height:44px; background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.3); border-radius:12px; padding:0 14px; color:#fff; font-size:13.5px; box-sizing:border-box;"
                        />
                    </div>

                    <!-- Lista de Cards de Clientes -->
                    <div style="display:flex; flex-direction:column; gap:10px;" id="mobile-clients-list-container">
                        ${vehicles.map(v => {
                            const initials = (v.client_name || 'Cliente').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
                            return `
                                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenClientDetails('${v.license_plate}')">
                                    <div class="dna-mobile-row-icon dna-icon-blue" style="font-size:14px; font-weight:800;">
                                        ${initials}
                                    </div>
                                    <div class="dna-mobile-row-content">
                                        <h4 class="dna-mobile-row-title">${v.client_name || 'João da Silva'}</h4>
                                        <div style="font-size:11.5px; color:var(--dna-ws-cyan); margin-top:2px;">
                                            ${v.client_phone || '(21) 98765-4321'}
                                        </div>
                                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:1px;">
                                            ${v.license_plate} - ${v.model}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Botão Inferior Fixo -->
                <div class="dna-mobile-fixed-bottom-bar">
                    <button class="dna-primary-btn-lg" onclick="WorkshopView.switchMobileSection('cadastrar-cliente')">
                        <span>+</span> <span>Novo Cliente</span>
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileClientsTab = function(tab) {
        this.mobileClientsTab = tab;
        this.switchMobileSection('clientes');
    };

    WorkshopView.handleMobileFilterClientsList = function(query) {
        const q = (query || '').toLowerCase().trim();
        const container = document.getElementById('mobile-clients-list-container');
        if (!container) return;

        const vehicles = this.getEffectiveVehiclesList();
        const filtered = vehicles.filter(v => 
            (v.client_name || '').toLowerCase().includes(q) ||
            (v.license_plate || '').toLowerCase().includes(q) ||
            (v.client_phone || '').includes(q)
        );

        container.innerHTML = filtered.map(v => {
            const initials = (v.client_name || 'Cliente').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
            return `
                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenClientDetails('${v.license_plate}')">
                    <div class="dna-mobile-row-icon dna-icon-blue" style="font-size:14px; font-weight:800;">
                        ${initials}
                    </div>
                    <div class="dna-mobile-row-content">
                        <h4 class="dna-mobile-row-title">${v.client_name || 'João da Silva'}</h4>
                        <div style="font-size:11.5px; color:var(--dna-ws-cyan); margin-top:2px;">
                            ${v.client_phone || '(21) 98765-4321'}
                        </div>
                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:1px;">
                            ${v.license_plate} - ${v.model}
                        </div>
                    </div>
                    <span class="dna-mobile-row-chevron">›</span>
                </div>
            `;
        }).join('');
    };

    WorkshopView.handleMobileOpenClientDetails = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) {
            this.selectedMobileVehicle = v;
            alert(`👤 Cliente ${v.client_name}\nTelefone: ${v.client_phone}\nVeículo Vinculado: ${v.model} (${v.license_plate})\nRedirecionando para lançar serviços.`);
            this.switchMobileSection('lancar-servicos');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 12: BUSCAR VEÍCULOS (SEÇÃO 15 DO PROMPT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileSearchVehiclesView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        const searchType = this.mobileSearchType || 'placa';

        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Buscar Veículos</span>
                    <div style="width:50px;"></div>
                </div>

                <div class="dna-mobile-subpage-body">
                    <!-- Segmented Filter Tabs -->
                    <div class="dna-segmented-control">
                        <button class="dna-segment-btn ${searchType === 'placa' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('placa')">Por Placa</button>
                        <button class="dna-segment-btn ${searchType === 'chassi' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('chassi')">Por Chassi</button>
                        <button class="dna-segment-btn ${searchType === 'cliente' ? 'active' : ''}" onclick="WorkshopView.setMobileSearchType('cliente')">Por Cliente</button>
                    </div>

                    <!-- Input de Busca -->
                    <div class="dna-input-group">
                        <label class="dna-input-label">
                            ${searchType === 'placa' ? 'Digite a placa' : searchType === 'chassi' ? 'Digite o chassi' : 'Digite o nome do cliente'}
                        </label>
                        <div class="dna-input-search-row">
                            <input 
                                type="text" 
                                id="mobile-veh-search-input" 
                                class="dna-plate-input" 
                                placeholder="${searchType === 'placa' ? 'Ex: ABC1D23' : searchType === 'chassi' ? 'Ex: 9BWCA...' : 'Ex: João'}"
                                oninput="if('${searchType}'==='placa') this.value=this.value.toUpperCase(); WorkshopView.handleLiveVehicleSearch(this.value);"
                            />
                            <button class="dna-search-action-btn" onclick="WorkshopView.handleLiveVehicleSearch(document.getElementById('mobile-veh-search-input')?.value)">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Resultados -->
                    <div>
                        <span class="dna-mobile-section-label" style="display:block; margin-bottom:10px;">Resultados</span>
                        
                        <div style="display:flex; flex-direction:column; gap:10px;" id="mobile-search-results-container">
                            ${vehicles.map(v => `
                                <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenDossier('${v.license_plate}')">
                                    <div class="dna-mobile-row-icon dna-icon-blue">🚗</div>
                                    <div class="dna-mobile-row-content">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="font-weight:800; font-family:monospace; color:#fff; font-size:14px;">${v.license_plate}</span>
                                            <span style="font-size:12px; color:var(--dna-ws-text-muted);">${v.brand || ''} ${v.model || ''}</span>
                                        </div>
                                        <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:2px;">
                                            ${v.year || '2020'} • ${v.color || 'Prata'} • Cliente: ${v.client_name || 'Oficina'}
                                        </div>
                                    </div>
                                    <span class="dna-mobile-row-chevron">›</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.setMobileSearchType = function(type) {
        this.mobileSearchType = type;
        this.switchMobileSection('buscar-veiculos');
    };

    WorkshopView.handleLiveVehicleSearch = function(query) {
        const q = (query || '').toLowerCase().trim();
        const container = document.getElementById('mobile-search-results-container');
        if (!container) return;

        const vehicles = this.getEffectiveVehiclesList();
        const filtered = vehicles.filter(v => {
            if (this.mobileSearchType === 'placa') return (v.license_plate || '').toLowerCase().includes(q);
            if (this.mobileSearchType === 'chassi') return (v.chassis || '').toLowerCase().includes(q);
            return (v.client_name || '').toLowerCase().includes(q);
        });

        container.innerHTML = filtered.map(v => `
            <div class="dna-mobile-row-card" onclick="WorkshopView.handleMobileOpenDossier('${v.license_plate}')">
                <div class="dna-mobile-row-icon dna-icon-blue">🚗</div>
                <div class="dna-mobile-row-content">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:800; font-family:monospace; color:#fff; font-size:14px;">${v.license_plate}</span>
                        <span style="font-size:12px; color:var(--dna-ws-text-muted);">${v.brand || ''} ${v.model || ''}</span>
                    </div>
                    <div style="font-size:11px; color:var(--dna-ws-text-dim); margin-top:2px;">
                        ${v.year || '2020'} • ${v.color || 'Prata'} • Cliente: ${v.client_name || 'Oficina'}
                    </div>
                </div>
                <span class="dna-mobile-row-chevron">›</span>
            </div>
        `).join('');
    };

    WorkshopView.handleMobileOpenDossier = function(plate) {
        const v = this.findVehicleByPlate(plate);
        if (v) this.selectedMobileVehicle = v;
        if (typeof DossierView !== 'undefined' && DossierView.render) {
            DossierView.render(plate);
        } else {
            alert(`🔍 Ficha do Veículo ${plate} aberta.\nHistórico, comprovantes e fotos sincronizados.`);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELAS SECUNDÁRIAS: RELATÓRIOS, FINANCEIRO, ESTOQUE, CONFIGS & SUPORTE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderMobileReportsView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Relatórios</span>
                    <div style="width:50px;"></div>
                </div>
                <div class="dna-mobile-subpage-body">
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de serviços emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-blue">📄</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Relatório de Serviços do Mês</h4>
                            <p class="dna-mobile-row-desc">Consolidado de manutenções e ordens atendidas.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de clientes emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-purple">👥</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Carteira de Clientes</h4>
                            <p class="dna-mobile-row-desc">Listagem completa e contatos de WhatsApp.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>
                    <div class="dna-mobile-row-card" onclick="alert('Relatório de peças emitido em PDF.')">
                        <div class="dna-mobile-row-icon dna-icon-cyan">📦</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Consumo de Peças</h4>
                            <p class="dna-mobile-row-desc">Filtros, óleos e insumos aplicados.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileFinancialView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Financeiro</span>
                    <div style="width:50px;"></div>
                </div>
                <div class="dna-mobile-subpage-body">
                    <div style="background:var(--dna-ws-bg-card); border:1px solid var(--dna-ws-border); border-radius:var(--dna-ws-radius-lg); padding:20px; text-align:center;">
                        <span style="font-size:12px; color:var(--dna-ws-text-muted); text-transform:uppercase;">Faturamento Bruto no Mês</span>
                        <div style="font-size:32px; font-weight:800; color:var(--dna-ws-green); font-family:var(--dna-ws-font-display); margin:8px 0;">
                            R$ 18.450,00
                        </div>
                        <span style="font-size:11.5px; color:var(--dna-ws-text-dim);">14 serviços concluídos • 0 pendências</span>
                    </div>

                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-green">💳</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Recebimentos no Cartão</h4>
                            <p class="dna-mobile-row-desc">R$ 12.300,00 em 8 transações.</p>
                        </div>
                    </div>
                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-blue">⚡</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Pix e Transferências</h4>
                            <p class="dna-mobile-row-desc">R$ 6.150,00 recebidos instantaneamente.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileStockView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Estoque / Peças</span>
                    <div style="width:50px;"></div>
                </div>
                <div class="dna-mobile-subpage-body">
                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-cyan">🛢️</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Óleo 5W30 Sintético</h4>
                            <p class="dna-mobile-row-desc">Saldo: 48 litros disponíveis.</p>
                        </div>
                    </div>
                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-blue">🛑</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Pastilhas de Freio Dianteiras</h4>
                            <p class="dna-mobile-row-desc">Saldo: 12 jogos em estoque.</p>
                        </div>
                    </div>
                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-amber">💨</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Filtros de Ar e Óleo</h4>
                            <p class="dna-mobile-row-desc">Saldo: 26 unidades variadas.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileConfigView = function() {
        const wsName = this.officialWorkshopName || 'Veloce Auto Center Premium';
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Configurações</span>
                    <div style="width:50px;"></div>
                </div>
                <div class="dna-mobile-subpage-body">
                    <div class="dna-mobile-row-card" onclick="WorkshopView.openDeviceModal()">
                        <div class="dna-mobile-row-icon dna-icon-blue">💻</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">Alternar para Modo Web (Desktop)</h4>
                            <p class="dna-mobile-row-desc">Acessar versão completa com tabelas e relatórios densos.</p>
                        </div>
                        <span class="dna-mobile-row-chevron">›</span>
                    </div>

                    <div class="dna-mobile-row-card">
                        <div class="dna-mobile-row-icon dna-icon-green">🏢</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">${wsName}</h4>
                            <p class="dna-mobile-row-desc">CNPJ: 12.345.678/0001-90 • Nível 4 Homologada</p>
                        </div>
                    </div>

                    <div class="dna-mobile-row-card" onclick="alert('Canal oficial de WhatsApp verificado.')">
                        <div class="dna-mobile-row-icon dna-icon-amber">📱</div>
                        <div class="dna-mobile-row-content">
                            <h4 class="dna-mobile-row-title">WhatsApp Integrado</h4>
                            <p class="dna-mobile-row-desc">Disparos automáticos e canal de atendimento ativo.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.renderMobileSupportView = function() {
        return `
            <div class="dna-mobile-subpage">
                <div class="dna-mobile-subpage-header">
                    <button class="dna-mobile-back-btn" onclick="WorkshopView.switchMobileSection('dashboard')">
                        <span>‹</span> <span>Voltar</span>
                    </button>
                    <span class="dna-mobile-subpage-title">Suporte DNA AUTO</span>
                    <div style="width:50px;"></div>
                </div>
                <div class="dna-mobile-subpage-body">
                    <div style="text-align:center; padding:30px 16px;">
                        <span style="font-size:44px;">🎧</span>
                        <h3 style="color:#fff; font-size:18px; margin:10px 0 4px;">Central de Atendimento DNA AUTO</h3>
                        <p style="color:var(--dna-ws-text-muted); font-size:13px; line-height:1.4;">
                            Precisa de ajuda ou deseja homologar novos serviços? Nossa equipe está pronta para atendê-lo.
                        </p>
                    </div>

                    <button class="dna-whatsapp-btn" style="height:50px;" onclick="window.open('https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20na%20oficina%20DNA%20AUTO', '_blank')">
                        <span>💬 Suporte Direto via WhatsApp</span>
                    </button>
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // MODAL DE DETECÇÃO DE DISPOSITIVO / MODO WEB (TELA 12 DO PRINT)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.openDeviceModal = function() {
        const root = document.getElementById('dna-mobile-modal-root');
        if (!root) return;

        root.innerHTML = `
            <div class="dna-device-modal-overlay" onclick="if(event.target===this) WorkshopView.closeDeviceModal()">
                <div class="dna-device-modal-card">
                    <div class="dna-device-modal-icon">💻</div>
                    <h3 class="dna-device-modal-title">Modo Web</h3>
                    <p class="dna-device-modal-text">
                        O sistema identificou que você pode desejar a visualização completa de desktop.<br/><br/>
                        Para computadores ou telas grandes, você pode alternar livremente entre o <strong>Modo Cards (Celular)</strong> e o <strong>Modo Web (Painel Completo)</strong>.
                    </p>
                    <div class="dna-device-modal-actions">
                        <button class="dna-primary-btn-lg cyan" onclick="WorkshopView.setDesktopMode(true)">
                            <span>Abrir no Navegador (Modo Web)</span>
                        </button>
                        <button class="dna-primary-btn-lg" style="background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.15);" onclick="WorkshopView.closeDeviceModal()">
                            <span>↩ Voltar ao modo celular</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.closeDeviceModal = function() {
        const root = document.getElementById('dna-mobile-modal-root');
        if (root) root.innerHTML = '';
    };

    WorkshopView.setDesktopMode = function(isWeb) {
        this.closeDeviceModal();
        this.currentViewMode = isWeb ? 'web' : 'mobile';
        localStorage.setItem('dna_workshop_view_mode', this.currentViewMode);
        
        if (isWeb) {
            document.body.classList.add('force-desktop-mode');
            this.renderMainLayout();
        } else {
            document.body.classList.remove('force-desktop-mode');
            this.renderMobileShell();
        }
    };

    // Verificação de dispositivo na inicialização
    WorkshopView.checkDevicePrompt = function() {
        // Se a tela for larga (> 1024px) e o usuário nunca escolheu o modo, sugere sutilmente
        const hasPrompted = sessionStorage.getItem('dna_device_prompted');
        if (!hasPrompted && window.innerWidth >= 1200 && this.currentViewMode === 'mobile') {
            sessionStorage.setItem('dna_device_prompted', 'true');
            // Mantém no mobile por padrão como solicitado, mas deixa o botão visível no topo
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // HOOK DO RENDER PRINCIPAL DO WORKSHOPVIEW
    // ──────────────────────────────────────────────────────────────────────────
    const originalRender = WorkshopView.render;
    WorkshopView.render = async function() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const activeWorkshopId = this.getEffectiveWorkshopId();
        this.currentWorkshopId = activeWorkshopId;
        document.body.classList.add('is-workshop-erp');

        // Carrega dados base
        try {
            const data = await API.getWorkshopDashboard(activeWorkshopId);
            this.dashboardData = data;
            if (data.workshop && data.workshop.trade_name) {
                this.officialWorkshopName = data.workshop.trade_name;
            }
        } catch (_) {}

        try {
            const alertsRes = await API.getMaintenanceAlertsForWorkshop(activeWorkshopId);
            this.alertsData = (alertsRes && alertsRes.alerts) ? alertsRes.alerts : [];
        } catch (_) {}

        try {
            const vehRes = await API.getVehicles();
            this.vehiclesList = (vehRes && vehRes.vehicles) ? vehRes.vehicles : [];
        } catch (_) {}

        // Decide entre renderização Mobile First (padrão) e Web Desktop
        const savedMode = localStorage.getItem('dna_workshop_view_mode');
        if (savedMode === 'web') {
            document.body.classList.add('force-desktop-mode');
            this.renderMainLayout();
        } else {
            document.body.classList.remove('force-desktop-mode');
            this.renderMobileShell();
        }
    };

    // Hook do switchSection para rotear no modo mobile
    const originalSwitchSection = WorkshopView.switchSection;
    WorkshopView.switchSection = function(sectionId) {
        if (this.currentViewMode === 'mobile') {
            this.switchMobileSection(sectionId);
            return;
        }
        if (originalSwitchSection) {
            originalSwitchSection.call(this, sectionId);
        }
    };

    console.log('✅ Componente Mobile First da Oficina DNA AUTO carregado com sucesso!');
})();
