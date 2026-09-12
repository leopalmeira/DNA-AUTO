// ==============================================================================
// DNA AUTO — APLICATIVO MOBILE DO CLIENTE / PROPRIETÁRIO
// Interface de Alta Precisão: Letras Claras, Dados Reais do Backend,
// Zero Popups (Alert) e Botão de Logout / Sair da Conta
// ==============================================================================

const OwnerView = {
    isDrawerOpen: false,
    currentScreen: 'home',
    activeTab: 'home',
    inspectionTab: 'inspection',
    isObdScanning: false,
    userVehicles: [],
    selectedVehicleId: null,
    isPhotoModalOpen: false,
    tempPhotoPreview: null,
    historyFilter: 'all',
    expandedModules: {},
    isAddVehicleOpen: false,

    // Dados Oficiais do Veículo Padrão (Fiel ao Mapa Oficial: Honda Civic BRA2E19)
    vehicleData: {
        id: 'veh_civic_touring',
        brand: 'Honda',
        model: 'Civic',
        full_title: 'Honda Civic Touring 1.5 Turbo',
        version_label: 'Touring 1.5 Turbo 173cv',
        license_plate: 'BRA2E19',
        manufacture_year: 2021,
        model_year: 2022,
        current_mileage: 87542,
        fuel_level: 72,
        estimated_range: 520,
        fuel_type: 'Gasolina',
        transmission_type: 'Automático CVT',
        color: 'Cinza Barium Metálico',
        chassis_vin: '93HFC1670MZ102934',
        renavam: '01239847120',
        dna_code: 'DNA-BR-BF72-29A4-X91',
        certification_date: '12/03/2025',
        certification_status: 'Permanente',
        status_badge: 'EM DIA',
        status_subtext: '(Sem pendências)',
        photo_url: 'https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80',
        user_name: 'João Silva',
        user_email: 'joao@email.com',
        user_role: 'Cliente Proprietário',
        notifications_count: 4,
        timeline: [
            { id: 1, title: 'Revisão periódica - 80.000 km', date: '12/04/2025', km: '80.000 km', dotColor: '#00E676', workshop: 'Oficina AutoTech', details: 'Revisão periódica completa com troca de fluidos, velas de ignição e inspeção técnica.' },
            { id: 2, title: 'Troca de correia dentada', date: '10/10/2024', km: '70.000 km', dotColor: '#0066FF', workshop: 'Oficina AutoTech', details: 'Substituição preventiva da correia dentada, tensores e bomba d\'água.' },
            { id: 3, title: 'Suspensão e direção', date: '05/04/2024', km: '60.000 km', dotColor: '#0066FF', workshop: 'Oficina AutoTech', details: 'Geometria 3D, alinhamento, balanceamento dinâmico e revisão de buchas.' },
            { id: 4, title: 'Troca de óleo e filtros', date: '15/12/2023', km: '50.000 km', dotColor: '#0066FF', workshop: 'Oficina AutoTech', details: 'Óleo sintético 0W20 Honda HAMP, filtro de óleo, filtro de ar e combustível.' }
        ]
    },

    // Dados da Inspeção Técnica 360° Homologada (Tela 4 do Mapa)
    inspectionData: {
        score: 98,
        status: '100% APROVADO / LAUDO CONFORME',
        inspection_code: 'INSP-2026-8819',
        inspected_at: '10/02/2025',
        valid_until: 'Permanente',
        workshop: 'Oficina AutoTech / DNA AUTO',
        technical_lead: 'Eng. Marcelo Antunes (CREA 506.892-SP)',
        modules: [
            {
                id: 'mod_engine',
                name: 'Motor & Transmissão',
                score: 99,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83l-2.83 2.83M6 18l-2.83 2.83m0-13.66L6 6m12 12l2.83 2.83"/></svg>',
                items: [
                    { name: 'Nível e Viscosidade do Óleo', status: 'OK', detail: 'Óleo sintético 0W20 no nível máximo' },
                    { name: 'Correia / Corrente de Comando', status: 'OK', detail: 'Tensão ideal sem trincas ou folgas' },
                    { name: 'Sistema de Arrefecimento', status: 'OK', detail: 'Pressão 1.4 bar • Proporção 50% aditivo' },
                    { name: 'Transmissão Automática CVT', status: 'OK', detail: 'Fluido HCF-2 translúcido, acoplamento suave' }
                ]
            },
            {
                id: 'mod_brakes',
                name: 'Sistema de Freios',
                score: 96,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>',
                items: [
                    { name: 'Pastilhas Dianteiras', status: 'OK', detail: '8.5 mm de espessura (Desgaste 25% - Seguro)' },
                    { name: 'Pastilhas Traseiras', status: 'OK', detail: '7.0 mm de espessura (Desgaste 30%)' },
                    { name: 'Discos de Freio Ventilados', status: 'OK', detail: 'Espessura dentro da tolerância de fábrica' },
                    { name: 'Fluido de Freio DOT 4', status: 'OK', detail: 'Ponto de ebulição 242°C • Umidade 0.7%' }
                ]
            },
            {
                id: 'mod_suspension',
                name: 'Suspensão & Direção',
                score: 97,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M5 7l7-5 7 5M5 17l7 5 7-5"/></svg>',
                items: [
                    { name: 'Amortecedores Dianteiros/Traseiros', status: 'OK', detail: 'Eficiência 88% no dinamômetro • Sem vazamentos' },
                    { name: 'Buchas, Pivôs e Terminais', status: 'OK', detail: 'Coifas íntegras e zero folgas mecânicas' },
                    { name: 'Geometria 3D & Direção Elétrica', status: 'OK', detail: 'Alinhamento conforme tolerância original' }
                ]
            },
            {
                id: 'mod_tires',
                name: 'Pneus & Rodas',
                score: 98,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>',
                items: [
                    { name: 'Pneus Dianteiros (215/50 R17)', status: 'OK', detail: 'Sulco 6.5 mm (Mínimo legal 1.6 mm)' },
                    { name: 'Pneus Traseiros (215/50 R17)', status: 'OK', detail: 'Sulco 6.8 mm • Calibrados em 32 PSI' },
                    { name: 'Rodas de Liga Leve Diamantadas', status: 'OK', detail: 'Sem trincas ou deformações' }
                ]
            },
            {
                id: 'mod_electric',
                name: 'Elétrica & Módulos',
                score: 100,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="13" rx="2"/><line x1="6" y1="11" x2="10" y2="11"/><line x1="14" y1="11" x2="18" y2="11"/></svg>',
                items: [
                    { name: 'Bateria 60Ah Heliar', status: 'OK', detail: '12.6V em repouso • 14.2V em carga plena' },
                    { name: 'Módulos Eletrônicos (ECU/BCM)', status: 'OK', detail: 'Zero DTC / Sem falhas registradas' },
                    { name: 'Faróis Full LED e Lanternas', status: 'OK', detail: 'Iluminação 100% calibrada' }
                ]
            },
            {
                id: 'mod_fluids',
                name: 'Fluidos & Arrefecimento',
                score: 98,
                status: 'CONFORME',
                icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
                items: [
                    { name: 'Líquido de Arrefecimento', status: 'OK', detail: 'Proporção ideal, ponto de congelamento -35°C' },
                    { name: 'Filtro de Ar do Motor & Cabine', status: 'OK', detail: 'Elementos limpos e desobstruídos' },
                    { name: 'Fluido de Freio e Lavador', status: 'OK', detail: 'Níveis plenos e sem contaminação' }
                ]
            }
        ]
    },

    // Plano de Revisões Preventivas (Tela 5 do Mapa)
    revisionsData: {
        next_revision: {
            target_mileage: 90000,
            current_mileage: 87542,
            remaining_km: 2458,
            estimated_days: 45,
            status: 'PRÓXIMA REVISÃO',
            items: [
                'Óleo do motor',
                'Filtro de óleo',
                'Filtro de ar',
                'Pastilhas de freio'
            ]
        },
        history: [
            {
                revision_label: '80.000 km',
                performed_at: '12/04/2025',
                mileage_at_service: 80000,
                workshop: 'AutoTech',
                proof_level: 'Nível 4',
                items_summary: 'Revisão periódica programada, troca de fluidos, velas de ignição e inspeção geral de suspensão.'
            },
            {
                revision_label: '70.000 km',
                performed_at: '10/10/2024',
                mileage_at_service: 70000,
                workshop: 'AutoTech',
                proof_level: 'Nível 4',
                items_summary: 'Troca de correia dentada, tensores auxiliares e bomba d\'água.'
            },
            {
                revision_label: '60.000 km',
                performed_at: '05/04/2024',
                mileage_at_service: 60000,
                workshop: 'AutoTech',
                proof_level: 'Nível 4',
                items_summary: 'Revisão completa do sistema de suspensão e direção, alinhamento e balanceamento.'
            }
        ]
    },

    // Dados de Telemetria Mini OBD2 (Tela 6 do Mapa)
    obdData: {
        device: {
            name: 'Mini OBD2 ELM327 BLE 5.2 AutoLink',
            protocol: 'ISO 15765-4 (CAN 11-bit / 500 kbaud)',
            connected: true,
            status_label: 'Conectado via BLE / Escaneamento ativo'
        },
        telemetry: {
            rpm: 2480,
            coolant_temp_c: 90,
            battery_voltage: 14.2,
            ecu_odometer_km: 87542,
            fuel_level_percent: 72,
            lambda_ratio: '1.00',
            map_pressure_kpa: 32,
            throttle_pos_percent: 14,
            intake_temp_c: 34
        },
        diagnostics: {
            mil_lamp: 'OFF',
            dtc_count: 0,
            dtc_label: '0 erros detectados',
            ecu_name: 'Bosch Honda Motronic',
            system_health: '100% OPERACIONAL',
            last_scan: 'Hoje às 18:20'
        }
    },

    // Alertas e Lembretes Preventivos (Tela 8 do Mapa)
    remindersList: [
        {
            id: 'rem_1',
            severity: 'URGENTE',
            severity_color: '#EF4444',
            title: 'Troca da correia dentada',
            subtitle: 'Venceu há 12 dias',
            action_text: 'Agendar agora'
        },
        {
            id: 'rem_2',
            severity: 'ATENÇÃO',
            severity_color: '#F59E0B',
            title: 'Revisão dos 90.000 km',
            subtitle: 'Faltam 2.458 km',
            action_text: null
        },
        {
            id: 'rem_3',
            severity: 'EM DIA',
            severity_color: '#10B981',
            title: 'Óleo do motor',
            subtitle: 'Próxima em 10.458 km',
            action_text: null
        },
        {
            id: 'rem_4',
            severity: 'EM DIA',
            severity_color: '#10B981',
            title: 'Freios',
            subtitle: 'Inspeção em 5.000 km',
            action_text: null
        }
    ],

    // Oficinas da Rede Credenciadas (Tela 9 do Mapa)
    workshopsList: [
        {
            id: 'ws_autotech',
            name: 'AutoTech Centro Automotivo',
            rating: '4.9',
            distance: '1.2 km',
            neighborhood: 'Centro',
            phone: '(11) 99876-5432'
        },
        {
            id: 'ws_speedcar',
            name: 'Speed Car Oficina',
            rating: '4.7',
            distance: '3.4 km',
            neighborhood: 'Jd. das Flores',
            phone: '(11) 98765-4321'
        },
        {
            id: 'ws_topmotors',
            name: 'Top Motors',
            rating: '4.5',
            distance: '4.1 km',
            neighborhood: 'Brasil',
            phone: '(11) 97654-3210'
        },
        {
            id: 'ws_marcelo',
            name: 'Oficina do Marcelo',
            rating: '4.8',
            distance: '7.8 km',
            neighborhood: 'Centro',
            phone: '(11) 96543-2109'
        }
    ],

    // ── Botão de Sair / Logout Oficial ──
    logout() {
        if (typeof App !== 'undefined' && App.logout) {
            App.logout();
        } else {
            localStorage.removeItem('dna_logged_user');
            localStorage.removeItem('dna_token');
            localStorage.removeItem('dna_current_view');
            window.location.href = '/';
        }
    },

    // Alternar Menu Lateral (Drawer)
    toggleDrawer(forceState) {
        if (typeof forceState === 'boolean') {
            this.isDrawerOpen = forceState;
        } else {
            this.isDrawerOpen = !this.isDrawerOpen;
        }

        const drawer = document.getElementById('dna-owner-drawer');
        const backdrop = document.getElementById('dna-drawer-backdrop');

        if (drawer && backdrop) {
            if (this.isDrawerOpen) {
                drawer.classList.add('active');
                backdrop.classList.add('active');
            } else {
                drawer.classList.remove('active');
                backdrop.classList.remove('active');
            }
        }
    },

    // Navegação Interna SPA Fluida (Sem Popups)
    navigateTo(screen) {
        this.currentScreen = screen;
        
        if (['home', 'vehicle', 'certification', 'inspection'].includes(screen)) {
            this.activeTab = screen;
        } else {
            this.activeTab = 'more';
        }

        this.toggleDrawer(false);
        this.render();
    },

    // Troca de Abas da Barra Inferior
    switchTab(tab) {
        if (tab === 'more') {
            this.toggleDrawer(true);
            return;
        }
        this.navigateTo(tab);
    },

    // Alternar entre Inspeção Técnica e Plano de Revisões
    setInspectionTab(tab) {
        this.inspectionTab = tab;
        this.render();
    },

    // Re-escanear ECU via Mini OBD2 em Tempo Real
    async rescanObd() {
        if (this.isObdScanning) return;
        this.isObdScanning = true;
        this.render();

        try {
            const res = await fetch(`/api/v1/vehicles/${this.vehicleData.license_plate}/obd`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.telemetry) {
                    this.obdData = data;
                }
            }
        } catch (_) {}

        setTimeout(() => {
            this.obdData.telemetry.rpm = Math.floor(830 + Math.random() * 25);
            this.obdData.telemetry.battery_voltage = (14.2 + (Math.random() * 0.1 - 0.05)).toFixed(1);
            this.obdData.diagnostics.last_scan = 'Agora mesmo (' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ')';
            this.isObdScanning = false;
            this.render();
        }, 700);
    },

    // Sincronizar Veículos Reais do Backend SQLite
    async syncBackendVehicles() {
        if (this._backendSynced) return;
        this._backendSynced = true;

        try {
            const res = await fetch('/api/v1/vehicles');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
                    this.userVehicles = data.vehicles;
                    
                    // Se houver veículo cadastrado, prioriza o atualmente selecionado
                    const activePlate = this.vehicleData.license_plate;
                    const realVeh = (activePlate && data.vehicles.find(u => u.license_plate === activePlate)) || data.vehicles[0];
                    this.applyVehicleData(realVeh);
                }
            }
        } catch (_) {}
    },

    // Aplicar dados de um veículo selecionado
    applyVehicleData(realVeh) {
        if (!realVeh) return;
        this.vehicleData.id = realVeh.id;
        this.vehicleData.brand = realVeh.brand || this.vehicleData.brand;
        this.vehicleData.model = realVeh.model || this.vehicleData.model;
        this.vehicleData.full_title = `${realVeh.brand} ${realVeh.model}`.trim();
        this.vehicleData.version_label = realVeh.version_label || this.vehicleData.version_label;
        this.vehicleData.license_plate = realVeh.license_plate || this.vehicleData.license_plate;
        this.vehicleData.manufacture_year = realVeh.manufacture_year || this.vehicleData.manufacture_year;
        this.vehicleData.model_year = realVeh.model_year || this.vehicleData.model_year;
        this.vehicleData.color = realVeh.color || this.vehicleData.color;
        this.vehicleData.chassis_vin = realVeh.chassis_vin || this.vehicleData.chassis_vin;
        this.vehicleData.renavam = realVeh.renavam || this.vehicleData.renavam;
        if (realVeh.photo_url) this.vehicleData.photo_url = realVeh.photo_url;
        if (realVeh.dna_code) this.vehicleData.dna_code = realVeh.dna_code;
        if (realVeh.current_mileage) this.vehicleData.current_mileage = realVeh.current_mileage;
        if (realVeh.owner_name) this.vehicleData.user_name = realVeh.owner_name;

        // Buscar Inspeção e OBD2 para o Veículo Ativo
        this.fetchVehicleExtras(this.vehicleData.license_plate);
    },

    // Alternar entre veículos da conta
    selectVehicle(plate) {
        if (!this.userVehicles) return;
        const realVeh = this.userVehicles.find(u => u.license_plate === plate);
        if (realVeh) {
            this.applyVehicleData(realVeh);
            this.render();
        }
    },

    // Buscar Documentos e OBD2 para o Veículo Ativo
    async fetchVehicleExtras(plate) {
        try {
            const [rInsp, rObd] = await Promise.all([
                fetch(`/api/v1/vehicles/${plate}/inspection`),
                fetch(`/api/v1/vehicles/${plate}/obd`)
            ]);
            if (rInsp.ok) {
                const dInsp = await rInsp.json();
                if (dInsp.success) {
                    if (dInsp.inspection) this.inspectionData = dInsp.inspection;
                    if (dInsp.revisions) this.revisionsData = dInsp.revisions;
                }
            }
            if (rObd.ok) {
                const dObd = await rObd.json();
                if (dObd.success && dObd.telemetry) {
                    this.obdData = dObd;
                }
            }
            this.render();
        } catch (_) {}
    },

    // Renderização do App
    async render() {
        const container = document.getElementById('view-content');
        if (!container) return;

        // Garante a aplicação do isolamento no body
        document.body.classList.add('is-owner-app');
        document.body.classList.remove('is-workshop-erp');

        // Sincroniza dados com o backend
        this.syncBackendVehicles();

        const v = this.vehicleData;
        const activeDrawerClass = this.isDrawerOpen ? 'active' : '';

        container.innerHTML = `
            <div class="dna-app-viewport">
                <!-- App Fullscreen (sem frame de celular) -->
                <div class="dna-phone-frame">

                    <!-- 2. Header do App com BOTÃO DE SAIR VISÍVEL -->
                    <header class="dna-app-header">
                        ${this.currentScreen === 'home' ? `
                            <div class="dna-brand-left" onclick="OwnerView.toggleDrawer()">
                                <button class="dna-menu-burger-btn" title="Abrir Menu">
                                    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round">
                                        <line x1="1" y1="2" x2="21" y2="2"/>
                                        <line x1="1" y1="9" x2="21" y2="9"/>
                                        <line x1="1" y1="16" x2="21" y2="16"/>
                                    </svg>
                                </button>
                                <div class="dna-brand-logo-icon">
                                    <svg viewBox="0 0 120 120" width="28" height="28" fill="none" stroke="#00D4FF" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="8" />
                                        <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="9" />
                                        <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="9" />
                                        <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="10" />
                                    </svg>
                                </div>
                                <div class="dna-brand-text">
                                    <h1>DNA <span style="color:#00D4FF;">AUTO</span></h1>
                                </div>
                            </div>

                            <div class="dna-header-right">
                                <!-- Botão de Notificações com badge -->
                                <div class="dna-notification-btn" onclick="OwnerView.navigateTo('notifications')" title="Notificações">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                    </svg>
                                    <span class="dna-badge-counter">${v.notifications_count}</span>
                                </div>

                                <!-- BOTÃO DE SAIR / LOGOUT (SOLICITAÇÃO DO CLIENTE) -->
                                <button class="dna-logout-header-btn" onclick="OwnerView.logout()" title="Encerrar Sessão e Sair">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                        <polyline points="16 17 21 12 16 7"/>
                                        <line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                    <span>Sair</span>
                                </button>
                            </div>
                        ` : `
                            <div class="dna-brand-left" onclick="OwnerView.navigateTo('home')">
                                <button class="dna-back-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                    <span>Voltar</span>
                                </button>
                                <span style="font-size: 14px; font-weight: 800; color: #FFFFFF; margin-left: 4px;">
                                    ${this.getScreenTitle(this.currentScreen)}
                                </span>
                            </div>

                            <div class="dna-header-right">
                                <!-- BOTÃO DE SAIR / LOGOUT NAS SUB-TELAS -->
                                <button class="dna-logout-header-btn" onclick="OwnerView.logout()" title="Encerrar Sessão e Sair">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    <span>Sair</span>
                                </button>
                            </div>
                        `}
                    </header>

                    <!-- 3. Área com Rolagem Suave: Conteúdo Conforme a Tela Ativa -->
                    <main class="dna-app-scroll-content">
                        ${this.renderCurrentScreenContent()}
                    </main>

                    <!-- 4. Visualizador de Documento Interno (Sheet Overlay) -->
                    ${this.selectedDoc ? this.renderDocumentViewerModal() : ''}

                    <!-- 5. Modal de Troca de Foto do Veículo pelo Dono -->
                    ${this.isPhotoModalOpen ? this.renderChangePhotoModal() : ''}

                    <!-- 5. Barra de Navegação Inferior Fixa (5 Itens) -->
                    <nav class="dna-bottom-nav">
                        <div class="dna-nav-item ${this.activeTab === 'home' ? 'active' : ''}" onclick="OwnerView.switchTab('home')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Início</span>
                        </div>

                        <div class="dna-nav-item ${this.activeTab === 'vehicle' ? 'active' : ''}" onclick="OwnerView.switchTab('vehicle')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="7" width="20" height="13" rx="3"/>
                                    <path d="M16 2l3 5H5l3-5z"/>
                                    <circle cx="7" cy="15" r="2"/>
                                    <circle cx="17" cy="15" r="2"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Veículo</span>
                        </div>

                        <div class="dna-nav-item ${this.activeTab === 'certification' ? 'active' : ''}" onclick="OwnerView.switchTab('certification')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Certificação</span>
                        </div>

                        <div class="dna-nav-item ${this.activeTab === 'inspection' ? 'active' : ''}" onclick="OwnerView.switchTab('inspection')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 11l3 3L22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Inspeção</span>
                        </div>

                        <div class="dna-nav-item ${this.activeTab === 'more' ? 'active' : ''}" onclick="OwnerView.switchTab('more')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="1.5"/>
                                    <circle cx="19" cy="12" r="1.5"/>
                                    <circle cx="5" cy="12" r="1.5"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Mais</span>
                        </div>
                    </nav>

                    <!-- 6. Backdrop Escurecido do Menu Lateral -->
                    <div id="dna-drawer-backdrop" class="dna-drawer-backdrop ${activeDrawerClass}" onclick="OwnerView.toggleDrawer(false)"></div>

                    <!-- 7. Menu Lateral Aberto (Drawer com Logout) -->
                    <aside id="dna-owner-drawer" class="dna-app-drawer ${activeDrawerClass}">
                        <div class="dna-drawer-header">
                            <button class="dna-drawer-close-btn" onclick="OwnerView.toggleDrawer(false)" title="Fechar Menu">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <div class="dna-drawer-profile-card">
                            <div class="dna-profile-avatar-box">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" onerror="this.src='/img/car-silhouette.svg'" />
                            </div>
                            <div class="dna-profile-info">
                                <h3 class="dna-profile-name">${v.user_name}</h3>
                                <span style="font-size: 11.5px; color: #38BDF8; font-weight: 700;">${v.user_role}</span>
                            </div>
                        </div>

                        <div class="dna-drawer-menu-list">
                            <!-- 1. Início -->
                            <div class="dna-menu-item ${this.currentScreen === 'home' ? 'active' : ''}" onclick="OwnerView.navigateTo('home')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    </div>
                                    <span>Início (Dashboard)</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 2. Meu Veículo -->
                            <div class="dna-menu-item ${this.currentScreen === 'vehicle' ? 'active' : ''}" onclick="OwnerView.navigateTo('vehicle')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="13" rx="3"/><path d="M16 2l3 5H5l3-5z"/><circle cx="7" cy="15" r="2"/><circle cx="17" cy="15" r="2"/></svg>
                                    </div>
                                    <span>Meu Veículo</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 3. Certificação DNA AUTO -->
                            <div class="dna-menu-item ${this.currentScreen === 'certification' ? 'active' : ''}" onclick="OwnerView.navigateTo('certification')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                                    </div>
                                    <span>Certificação DNA AUTO</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 4. Inspeção Técnica 360° -->
                            <div class="dna-menu-item ${this.currentScreen === 'inspection' ? 'active' : ''}" onclick="OwnerView.navigateTo('inspection')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                            <path d="M9 11l3 3L22 4"/>
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                        </svg>
                                    </div>
                                    <span>Inspeção Técnica 360°</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 5. Revisões Preventivas -->
                            <div class="dna-menu-item ${this.currentScreen === 'revisions' ? 'active' : ''}" onclick="OwnerView.navigateTo('revisions')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                    </div>
                                    <span>Revisões Preventivas</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 6. Diagnóstico OBD2 (Telemetria) -->
                            <div class="dna-menu-item ${this.currentScreen === 'obd' ? 'active' : ''}" onclick="OwnerView.navigateTo('obd')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>
                                    </div>
                                    <span>Diagnóstico OBD2 (Telemetria)</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 7. Histórico / Dossiê -->
                            <div class="dna-menu-item ${this.currentScreen === 'history' ? 'active' : ''}" onclick="OwnerView.navigateTo('history')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    </div>
                                    <span>Histórico / Dossiê Oficial</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 8. Alertas / Lembretes -->
                            <div class="dna-menu-item ${this.currentScreen === 'reminders' ? 'active' : ''}" onclick="OwnerView.navigateTo('reminders')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                    </div>
                                    <span>Alertas / Lembretes</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 9. Oficinas da Rede -->
                            <div class="dna-menu-item ${this.currentScreen === 'workshops' ? 'active' : ''}" onclick="OwnerView.navigateTo('workshops')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    </div>
                                    <span>Oficinas da Rede</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 10. Configurações -->
                            <div class="dna-menu-item ${this.currentScreen === 'settings' ? 'active' : ''}" onclick="OwnerView.navigateTo('settings')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                    </div>
                                    <span>Configurações</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 10. Baixar Aplicativo Oficial PWA / Play Store -->
                            <div class="dna-menu-item" style="background: rgba(255, 210, 28, 0.08); border: 1px solid rgba(255, 210, 28, 0.25);" onclick="OwnerView.toggleDrawer(false); if (typeof PwaInstall !== 'undefined') PwaInstall.renderPlayStoreModal();">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon" style="color:#FFD21C;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </div>
                                    <span style="color:#FFD21C; font-weight:800;">Baixar App Oficial (PWA)</span>
                                </div>
                                <span class="dna-badge-counter" style="background:#FFD21C; color:#0B0F19; font-weight:800; font-size:9px; padding:2px 6px;">PLAY STORE</span>
                            </div>

                            <!-- BOTÃO DE SAIR NO MENU LATERAL (LOGOUT) -->
                            <div class="dna-drawer-logout-item" onclick="OwnerView.logout()" title="Sair do aplicativo">
                                <div class="dna-menu-item-left">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    <span>Sair da Conta (Logout)</span>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </div>

                        <div class="dna-drawer-footer">
                            <div class="dna-footer-shield-box">
                                <div class="dna-footer-shield-icon">
                                    <svg viewBox="0 0 120 120" width="28" height="28" fill="none" stroke="#00D4FF" stroke-width="7">
                                        <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64"/>
                                        <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66"/>
                                        <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68"/>
                                    </svg>
                                </div>
                                <h4>DNA AUTO</h4>
                                <p class="dna-footer-slogan">Certificação de Registros Veiculares</p>
                                <p class="dna-footer-sub">Dados do motor e histórico oficial com validade jurídica</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;

        // Dispara automaticamente o download / prompt de instalação do PWA
        if (typeof PwaInstall !== 'undefined' && PwaInstall.triggerAutoPromptForClient) {
            PwaInstall.triggerAutoPromptForClient();
        }
    },

    // Retorna Título Amigável para o Topo (10 Telas Oficiais)
    getScreenTitle(screen) {
        const titles = {
            'vehicle': 'Meu Veículo',
            'certification': 'Certificação DNA AUTO',
            'inspection': 'Inspeção Técnica 360°',
            'revisions': 'Revisões Preventivas',
            'obd': 'OBD2 (Telemetria)',
            'history': 'Histórico / Dossiê',
            'reminders': 'Alertas / Lembretes',
            'workshops': 'Oficinas da Rede',
            'settings': 'Configurações',
            'notifications': 'Notificações'
        };
        return titles[screen] || 'DNA AUTO';
    },

    // Roteador de Telas Internas SPA
    renderCurrentScreenContent() {
        switch (this.currentScreen) {
            case 'vehicle':
                return this.renderVehicleScreen();
            case 'certification':
                return this.renderCertificationScreen();
            case 'inspection':
                return this.renderInspectionScreen();
            case 'revisions':
                return this.renderRevisionsScreen();
            case 'obd':
                return this.renderObdScreen();
            case 'history':
                return this.renderHistoryScreen();
            case 'reminders':
                return this.renderRemindersScreen();
            case 'workshops':
                return this.renderWorkshopsScreen();
            case 'settings':
                return this.renderSettingsScreen();
            case 'notifications':
                return this.renderNotificationsScreen();
            case 'home':
            default:
                return this.renderHomeScreen();
        }
    },

    // ── 1. TELA INICIAL (HOME) — FIEL AO MAPA VISUAL OFICIAL ──
    renderHomeScreen() {
        const v = this.vehicleData;
        return `
            <!-- Saudação Oficial do Usuário -->
            <div class="dna-owner-welcome-bar" style="margin-bottom:12px;">
                <h2 style="font-size:18px; font-weight:800; color:#FFFFFF; margin:0 0 2px;">Olá, João!</h2>
                <p style="font-size:12px; color:#94A3B8; margin:0;">Seu veículo sempre protegido.</p>
            </div>

            ${this.userVehicles && this.userVehicles.length > 1 ? `
                <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:12px; padding-bottom:4px;">
                    ${this.userVehicles.map(veh => `
                        <button onclick="OwnerView.selectVehicle('${veh.license_plate}')" style="background:${veh.license_plate === v.license_plate ? '#0066FF' : 'rgba(15,23,42,0.85)'}; color:#FFFFFF; border:1px solid ${veh.license_plate === v.license_plate ? '#00D4FF' : 'rgba(255,255,255,0.15)'}; padding:5px 12px; border-radius:14px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px; white-space:nowrap; transition:all 0.2s;">
                            <span>${veh.brand} ${veh.model}</span>
                            <span style="font-size:9.5px; opacity:0.8; font-family:var(--font-mono, monospace);">(${veh.license_plate})</span>
                        </button>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Card Principal do Veículo (Honda Civic BRA2E19) -->
            <div class="dna-vehicle-card">
                <!-- Foto do Carro com Botão de Trocar Foto -->
                <div class="dna-car-stage" onclick="OwnerView.openChangePhotoModal()" style="cursor:pointer;" title="Clique para trocar foto">
                    <div class="dna-car-neon-glow"></div>
                    <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80';" />
                    <button class="dna-car-change-photo-btn" onclick="event.stopPropagation(); OwnerView.openChangePhotoModal();" title="Trocar foto do meu carro">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span>Trocar Foto</span>
                    </button>
                </div>

                <!-- Título do Veículo, Ano e Placa Mercosul -->
                <div style="margin: 10px 0 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <h3 style="font-size:16px; font-weight:800; color:#FFFFFF; margin:0 0 2px;">${v.full_title}</h3>
                        <div style="font-size:12px; color:#94A3B8; font-weight:600;">${v.manufacture_year}/${v.model_year}</div>
                    </div>
                    <div class="dna-plate-mercosul" style="background:#FFFFFF; color:#0B0F19; border-radius:6px; padding:2px 8px; font-family:var(--font-mono, monospace); font-weight:800; font-size:12px; border:1.5px solid #000; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
                        <span style="background:#003399; color:#FFF; font-size:8px; padding:1px 3px; border-radius:2px;">BR</span>
                        <span>${v.license_plate}</span>
                    </div>
                </div>

                <!-- Box de Certificação DNA AUTO Integrado -->
                <div class="dna-cert-box-card" onclick="OwnerView.navigateTo('certification')" style="background:rgba(15,23,42,0.9); border:1px solid rgba(0,212,255,0.3); border-radius:12px; padding:12px; margin-bottom:12px; cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="color:#00D4FF; display:flex; align-items:center;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                            </div>
                            <div>
                                <strong style="color:#FFFFFF; font-size:12.5px; display:block;">Certificação DNA AUTO</strong>
                                <span style="color:#94A3B8; font-size:11px; font-family:var(--font-mono, monospace);">Código permanente: <strong style="color:#00D4FF;">${v.dna_code}</strong></span>
                            </div>
                        </div>
                        <button class="btn btn-sm" onclick="event.stopPropagation(); OwnerView.navigateTo('certification')" style="background:#0066FF; color:#FFFFFF; font-size:11px; font-weight:700; border-radius:6px; padding:4px 10px; border:none; cursor:pointer;">
                            Ver certificação
                        </button>
                    </div>
                </div>

                <!-- 3 Medidores em Grade (Quilometragem | Combustível | Autonomia) -->
                <div class="dna-metrics-grid" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                    <div class="dna-metric-box" onclick="OwnerView.navigateTo('obd')" style="cursor:pointer;" title="Ver odômetro da ECU">
                        <div class="dna-metric-label" style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Quilometragem</div>
                        <div class="dna-metric-value" style="font-size:13.5px; font-weight:800; color:#FFFFFF;">${Number(v.current_mileage).toLocaleString('pt-BR')} km</div>
                    </div>
                    <div class="dna-metric-box">
                        <div class="dna-metric-label" style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Combustível</div>
                        <div class="dna-metric-value" style="font-size:13.5px; font-weight:800; color:#00D4FF;">${v.fuel_level}%</div>
                        <div class="dna-fuel-bar" style="height:3px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:4px;"><div class="dna-fuel-fill" style="width:${v.fuel_level}%; height:100%; background:#00D4FF; border-radius:2px;"></div></div>
                    </div>
                    <div class="dna-metric-box">
                        <div class="dna-metric-label" style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Autonomia</div>
                        <div class="dna-metric-value" style="font-size:13.5px; font-weight:800; color:#10B981;">~ ${v.estimated_range} km</div>
                    </div>
                </div>
            </div>

            <!-- Seção Últimos Eventos (Fiel ao Mapa Oficial) -->
            <div class="dna-events-section" style="margin-top:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:12px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Últimos eventos</span>
                    <a href="javascript:void(0)" onclick="OwnerView.navigateTo('history')" style="font-size:11px; color:#00D4FF; font-weight:700; text-decoration:none;">Ver todos &gt;</a>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div class="dna-event-item" onclick="OwnerView.navigateTo('history')" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.22); border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.15); display:flex; align-items:center; justify-content:center; color:#10B981; flex-shrink:0;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style="flex:1;">
                            <strong style="color:#FFFFFF; font-size:12.5px; display:block;">Revisão realizada - 80.000 km</strong>
                            <span style="color:#94A3B8; font-size:11px;">12/04/2025 - Oficina AutoTech</span>
                        </div>
                    </div>
                    <div class="dna-event-item" onclick="OwnerView.navigateTo('inspection')" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.22); border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(0,212,255,0.15); display:flex; align-items:center; justify-content:center; color:#00D4FF; flex-shrink:0;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div style="flex:1;">
                            <strong style="color:#FFFFFF; font-size:12.5px; display:block;">Inspeção técnica - Aprovada</strong>
                            <span style="color:#94A3B8; font-size:11px;">10/02/2025 - DNA AUTO</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card de Proteção Inferior -->
            <div class="dna-protection-card" onclick="OwnerView.navigateTo('certification')" style="cursor:pointer; margin-top:14px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:12px 14px; display:flex; align-items:center; gap:12px;">
                <div class="dna-prot-icon" style="color:#10B981; display:flex; align-items:center;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                    </svg>
                </div>
                <div class="dna-prot-text">
                    <strong style="color:#FFFFFF; font-size:12.5px; display:block;">Seu veículo protegido</strong>
                    <span style="color:#10B981; font-size:11px; font-weight:700;">Com a certificação DNA AUTO</span>
                </div>
            </div>

            <div style="height:10px;"></div>
        `;
    },

    // ── 2. TELA: MEU VEÍCULO (TELA 2 DO MAPA) ──
    renderVehicleScreen() {
        const v = this.vehicleData;
        return `
            <div style="display:flex; flex-direction:column; gap:14px;">
                ${this.userVehicles && this.userVehicles.length > 1 ? `
                    <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:2px;">
                        ${this.userVehicles.map(veh => `
                            <button onclick="OwnerView.selectVehicle('${veh.license_plate}')" style="background:${veh.license_plate === v.license_plate ? '#0066FF' : 'rgba(15,23,42,0.85)'}; color:#FFFFFF; border:1px solid ${veh.license_plate === v.license_plate ? '#00D4FF' : 'rgba(255,255,255,0.15)'}; padding:5px 12px; border-radius:14px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px; white-space:nowrap; transition:all 0.2s;">
                                <span>${veh.brand} ${veh.model}</span>
                                <span style="font-size:9.5px; opacity:0.8; font-family:var(--font-mono, monospace);">(${veh.license_plate})</span>
                            </button>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="dna-vehicle-card" style="margin-bottom:0;">
                    <div class="dna-car-stage">
                        <div class="dna-car-neon-glow"></div>
                        <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80';" />
                    </div>
                    <div style="text-align:center; margin-top:8px;">
                        <h3 style="font-size:17px; font-weight:800; color:#FFFFFF; margin:0 0 2px;">${v.full_title}</h3>
                        <div style="font-size:12px; color:#94A3B8; font-weight:600; margin-bottom:6px;">${v.manufacture_year}/${v.model_year}</div>
                        <div class="dna-plate-mercosul" style="background:#FFFFFF; color:#0B0F19; border-radius:6px; padding:2px 10px; font-family:var(--font-mono, monospace); font-weight:800; font-size:13px; border:1.5px solid #000; display:inline-flex; align-items:center; gap:6px;">
                            <span style="background:#003399; color:#FFF; font-size:9px; padding:1px 4px; border-radius:2px;">BR</span>
                            <span>${v.license_plate}</span>
                        </div>
                    </div>
                </div>

                <!-- Métricas do Veículo -->
                <div class="dna-vehicle-specs-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Quilometragem atual</span>
                        <span style="font-size:15px; font-weight:800; color:#FFFFFF; display:block; margin-top:2px;">${Number(v.current_mileage).toLocaleString('pt-BR')} km</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Próxima revisão</span>
                        <span style="font-size:15px; font-weight:800; color:#00D4FF; display:block; margin-top:2px;">90.000 km</span>
                        <span style="font-size:10.5px; color:#94A3B8;">(em 2.458 km)</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Combustível</span>
                        <span style="font-size:15px; font-weight:800; color:#FFFFFF; display:block; margin-top:2px;">${v.fuel_level}%</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Autonomia estimada</span>
                        <span style="font-size:15px; font-weight:800; color:#10B981; display:block; margin-top:2px;">~ ${v.estimated_range} km</span>
                    </div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button class="dna-obd-rescan-btn" onclick="OwnerView.navigateTo('inspection')" style="flex:1; background:#0066FF;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        <span>Ver Inspeção</span>
                    </button>
                    <button class="dna-obd-rescan-btn" onclick="OwnerView.toggleAddVehicleForm()" style="flex:1; background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        <span>Inserir Outro Veículo</span>
                    </button>
                </div>

                ${this.isAddVehicleOpen ? this.renderAddVehicleForm() : ''}
            </div>
        `;
    },

    // Toggle do formulário de adicionar veículo
    toggleAddVehicleForm() {
        this.isAddVehicleOpen = !this.isAddVehicleOpen;
        this.render();
    },

    // Formulário de inserir outro veículo
    renderAddVehicleForm() {
        return `
            <div style="background:rgba(8,16,32,0.9); border:1.5px solid rgba(0,212,255,0.3); border-radius:14px; padding:16px; margin-top:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <h4 style="font-size:14px; font-weight:800; color:#FFFFFF; margin:0;">Inserir Novo Veículo</h4>
                    <button onclick="OwnerView.toggleAddVehicleForm()" style="background:none; border:none; color:#94A3B8; cursor:pointer; font-size:18px;">&times;</button>
                </div>

                <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:10px 12px; margin-bottom:14px;">
                    <span style="font-size:11px; color:#F59E0B; font-weight:700; display:flex; align-items:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Será necessário adquirir um novo leitor OBD para o veículo adicional.
                    </span>
                </div>

                <div class="dna-add-vehicle-form">
                    <div class="dna-form-group">
                        <label class="dna-form-label">Placa do Veículo *</label>
                        <input type="text" id="add-veh-plate" class="dna-form-input" placeholder="Ex: ABC1D23" maxlength="7" />
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div class="dna-form-group">
                            <label class="dna-form-label">Marca</label>
                            <input type="text" id="add-veh-brand" class="dna-form-input" placeholder="Ex: Toyota" />
                        </div>
                        <div class="dna-form-group">
                            <label class="dna-form-label">Modelo</label>
                            <input type="text" id="add-veh-model" class="dna-form-input" placeholder="Ex: Corolla" />
                        </div>
                    </div>
                    <div class="dna-form-group">
                        <label class="dna-form-label">Ano de Fabricação/Modelo</label>
                        <input type="text" id="add-veh-year" class="dna-form-input" placeholder="Ex: 2023/2024" />
                    </div>
                    <button onclick="OwnerView.submitAddVehicle()" style="width:100%; background:#0066FF; color:#FFFFFF; font-weight:800; font-size:13px; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        <span>Cadastrar Veículo</span>
                    </button>
                </div>
            </div>
        `;
    },

    // Submeter novo veículo
    async submitAddVehicle() {
        const plate = (document.getElementById('add-veh-plate')?.value || '').trim().toUpperCase();
        const brand = (document.getElementById('add-veh-brand')?.value || '').trim();
        const model = (document.getElementById('add-veh-model')?.value || '').trim();
        const year = (document.getElementById('add-veh-year')?.value || '').trim();

        if (!plate || plate.length < 7) {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#EF4444; color:#fff; padding:10px 20px; border-radius:10px; font-size:12px; font-weight:700; z-index:99999; box-shadow:0 4px 16px rgba(0,0,0,0.4);';
            toast.textContent = 'Informe a placa do veículo (7 caracteres)';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
            return;
        }

        try {
            const res = await fetch('/api/v1/vehicles/register-from-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plate, customData: { brand, model, year_label: year }, activate_dna_now: true })
            });
            const data = await res.json();
            if (data.success || data.vehicle) {
                this.isAddVehicleOpen = false;
                this._backendSynced = false;
                this.render();
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#10B981; color:#fff; padding:10px 20px; border-radius:10px; font-size:12px; font-weight:700; z-index:99999; box-shadow:0 4px 16px rgba(0,0,0,0.4);';
                toast.textContent = `Veículo ${plate} cadastrado com sucesso!`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }
        } catch (e) {
            console.error('Erro ao cadastrar veículo:', e);
        }
    },

    // ── 3. TELA: CERTIFICAÇÃO DNA AUTO (TELA 3 DO MAPA) ──
    renderCertificationScreen() {
        const v = this.vehicleData;
        const timeline = v.timeline || [];
        return `
            <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="background: radial-gradient(circle at 50% 20%, rgba(12, 30, 65, 0.95) 0%, rgba(6, 14, 28, 0.98) 100%); border: 2px solid #00D4FF; border-radius: 18px; padding: 22px 18px; text-align: center; box-shadow: 0 0 25px rgba(0, 212, 255, 0.25);">
                    <div style="width:56px; height:56px; border-radius:50%; background:rgba(0,212,255,0.15); border:1.5px solid #00D4FF; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; color:#00D4FF;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <polyline points="9 12 11 14 15 10"/>
                        </svg>
                    </div>

                    <span style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#10B981; font-size:11px; font-weight:800; padding:4px 10px; border-radius:6px; text-transform:uppercase;">
                        Veículo certificado
                    </span>

                    <h3 style="font-size: 19px; font-weight: 900; color: #FFFFFF; margin: 12px 0 4px; letter-spacing: 0.5px; font-family: var(--font-mono, monospace);">
                        ${v.dna_code}
                    </h3>
                    <p style="font-size: 11.5px; color: #94A3B8; margin: 0 0 16px;">
                        Autenticidade verificada • Dados protegidos na blockchain
                    </p>

                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
                        <button class="btn btn-primary" onclick="OwnerView.navigateTo('history')" style="background:#0066FF; color:#FFFFFF; font-weight:800; font-size:13px; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <span>Ver relatório completo</span>
                        </button>
                        <button class="btn btn-secondary" onclick="window.print()" style="background:rgba(15,23,42,0.8); color:#FFFFFF; border:1px solid rgba(255,255,255,0.2); font-weight:700; font-size:12.5px; padding:10px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <span>Baixar certificado (PDF)</span>
                        </button>
                    </div>

                    <!-- Bloco Informações -->
                    <div style="background: #050B14; border: 1px solid rgba(0, 102, 255, 0.25); border-radius: 12px; padding: 12px 14px; text-align: left; font-size: 11.5px;">
                        <span style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:800; display:block; margin-bottom:8px;">Informações</span>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                            <span style="color:#94A3B8;">Emitido em:</span>
                            <strong style="color:#FFFFFF;">${v.certification_date}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#94A3B8;">Validade:</span>
                            <strong style="color:#10B981;">Permanente</strong>
                        </div>
                    </div>
                </div>

                <!-- Serviços Realizados -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:12px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Serviços realizados</span>
                    ${timeline.map(t => `
                        <div class="dna-service-done-card" onclick="OwnerView.navigateTo('history')">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div style="flex:1;">
                                    <span style="font-size:10.5px; color:#00D4FF; font-weight:700;">${t.date}</span>
                                    <h4 style="font-size:13px; font-weight:800; color:#FFFFFF; margin:2px 0 0;">${t.title}</h4>
                                </div>
                                <span style="background:rgba(16,185,129,0.15); color:#10B981; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; flex-shrink:0;">${t.km}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:#94A3B8;">
                                <span>Oficina: <strong style="color:#FFFFFF;">${t.workshop}</strong></span>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span style="color:#10B981; font-weight:700;">Comprovado</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Peças Trocadas com Nota Fiscal -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:12px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Peças trocadas</span>
                    <div class="dna-service-done-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="flex:1;">
                                <span style="font-size:12.5px; font-weight:700; color:#FFFFFF;">Correia Dentada Continental</span>
                                <span style="font-size:11px; color:#94A3B8; display:block;">Ref: CT1192 • Instalada em 10/10/2024</span>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:10px; color:#FFD21C; font-weight:700; background:rgba(255,210,28,0.1); padding:2px 6px; border-radius:4px;">📷 Foto</span>
                                <span style="font-size:10px; color:#00D4FF; font-weight:700; background:rgba(0,212,255,0.1); padding:2px 6px; border-radius:4px;">🧾 NF</span>
                            </div>
                        </div>
                    </div>
                    <div class="dna-service-done-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="flex:1;">
                                <span style="font-size:12.5px; font-weight:700; color:#FFFFFF;">Pastilhas de Freio Bosch</span>
                                <span style="font-size:11px; color:#94A3B8; display:block;">Ref: BP1234 • Instalada em 12/04/2025</span>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:10px; color:#FFD21C; font-weight:700; background:rgba(255,210,28,0.1); padding:2px 6px; border-radius:4px;">📷 Foto</span>
                                <span style="font-size:10px; color:#00D4FF; font-weight:700; background:rgba(0,212,255,0.1); padding:2px 6px; border-radius:4px;">🧾 NF</span>
                            </div>
                        </div>
                    </div>
                    <div class="dna-service-done-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="flex:1;">
                                <span style="font-size:12.5px; font-weight:700; color:#FFFFFF;">Óleo Sintético 0W20 Honda HAMP</span>
                                <span style="font-size:11px; color:#94A3B8; display:block;">4L • Trocado em 15/12/2023</span>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:10px; color:#00D4FF; font-weight:700; background:rgba(0,212,255,0.1); padding:2px 6px; border-radius:4px;">🧾 NF</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gastos nos Últimos 6 Meses -->
                <div class="dna-expense-summary">
                    <div class="dna-expense-summary-title">Gastos nos últimos 6 meses</div>
                    <div class="dna-expense-row">
                        <span class="dna-expense-label">Revisão periódica - 80.000 km</span>
                        <span class="dna-expense-value">R$ 1.450,00</span>
                    </div>
                    <div class="dna-expense-bar"><div class="dna-expense-bar-fill" style="width:58%; background:#0066FF;"></div></div>
                    <div class="dna-expense-row" style="margin-top:6px;">
                        <span class="dna-expense-label">Troca de correia dentada</span>
                        <span class="dna-expense-value">R$ 980,00</span>
                    </div>
                    <div class="dna-expense-bar"><div class="dna-expense-bar-fill" style="width:39%; background:#00D4FF;"></div></div>
                    <div class="dna-expense-row" style="margin-top:6px;">
                        <span class="dna-expense-label">Suspensão e direção</span>
                        <span class="dna-expense-value">R$ 720,00</span>
                    </div>
                    <div class="dna-expense-bar"><div class="dna-expense-bar-fill" style="width:29%; background:#10B981;"></div></div>
                    <div class="dna-expense-row" style="margin-top:6px;">
                        <span class="dna-expense-label">Peças avulsas</span>
                        <span class="dna-expense-value">R$ 350,00</span>
                    </div>
                    <div class="dna-expense-bar"><div class="dna-expense-bar-fill" style="width:14%; background:#F59E0B;"></div></div>

                    <div class="dna-expense-total">
                        <span class="dna-expense-label">Total (6 meses)</span>
                        <span class="dna-expense-value">R$ 3.500,00</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Toggle de expansão de módulo de inspeção
    toggleInspModule(moduleId) {
        this.expandedModules[moduleId] = !this.expandedModules[moduleId];
        const el = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (el) el.classList.toggle('expanded');
    },

    // ── 4. TELA: INSPEÇÃO TÉCNICA 360° (TELA 4 DO MAPA) ──
    renderInspectionScreen() {
        const insp = this.inspectionData;
        const v = this.vehicleData;
        return `
            <div class="dna-insp-container" style="display:flex; flex-direction:column; gap:12px;">
                <!-- Seletor de Segmented Tabs -->
                <div class="dna-insp-segmented-tabs">
                    <button class="dna-insp-tab-btn active" onclick="OwnerView.navigateTo('inspection')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        <span>Inspeção 360°</span>
                    </button>
                    <button class="dna-insp-tab-btn" onclick="OwnerView.navigateTo('revisions')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Plano de Revisões</span>
                    </button>
                </div>

                <!-- Banner 100% APROVADO / LAUDO CONFORME -->
                <div style="background:rgba(16,185,129,0.12); border:1.5px solid #10B981; border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:12px;">
                    <div style="width:36px; height:36px; border-radius:50%; background:#10B981; color:#0B0F19; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style="flex:1;">
                        <strong style="color:#10B981; font-size:14px; display:block; letter-spacing:0.4px;">100% APROVADO</strong>
                        <span style="color:#FFFFFF; font-size:12px; font-weight:700;">LAUDO CONFORME</span>
                    </div>
                </div>

                <!-- Score Pericial & Código da Inspeção -->
                <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Score Pericial</span>
                        <div style="font-size:20px; font-weight:900; color:#FFFFFF;">${insp.score}/100</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Código da inspeção</span>
                        <div style="font-size:13px; font-weight:800; color:#00D4FF; font-family:var(--font-mono, monospace);">${insp.inspection_code}</div>
                    </div>
                </div>

                <!-- Áreas Auditadas (6 Módulos Expansíveis) -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:12px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Áreas auditadas — toque para ver detalhes</span>
                    ${insp.modules.map(m => `
                        <div class="dna-insp-module ${this.expandedModules[m.id] ? 'expanded' : ''}" data-module-id="${m.id}">
                            <div class="dna-insp-module-header" onclick="OwnerView.toggleInspModule('${m.id}')">
                                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                                    <div style="color:#10B981;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    <div>
                                        <span style="font-size:13px; font-weight:700; color:#FFFFFF; display:block;">${m.name}</span>
                                        <span style="font-size:10.5px; color:#94A3B8; font-weight:600;">Score: ${m.score}/100</span>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:10.5px; color:#10B981; font-weight:800; background:rgba(16,185,129,0.1); padding:3px 8px; border-radius:4px;">CONFORME</span>
                                    <svg class="dna-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                </div>
                            </div>
                            <div class="dna-insp-module-body">
                                ${(m.items || []).map(item => `
                                    <div class="dna-insp-detail-item">
                                        <div style="flex:1;">
                                            <div class="dna-insp-detail-name">${item.name}</div>
                                            <div class="dna-insp-detail-status">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                ${item.status}
                                            </div>
                                        </div>
                                        <div class="dna-insp-detail-info">${item.detail}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Odômetro auditado -->
                <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; color:#94A3B8; font-weight:600;">Odômetro auditado</span>
                    <strong style="font-size:14px; color:#00D4FF; font-weight:800;">${Number(v.current_mileage).toLocaleString('pt-BR')} km</strong>
                </div>
            </div>
        `;
    },

    // ── 5. TELA: REVISÕES PREVENTIVAS (TELA 5 DO MAPA) ──
    renderRevisionsScreen() {
        const rev = this.revisionsData;
        return `
            <div class="dna-insp-container" style="display:flex; flex-direction:column; gap:12px;">
                <!-- Seletor de Segmented Tabs -->
                <div class="dna-insp-segmented-tabs">
                    <button class="dna-insp-tab-btn" onclick="OwnerView.navigateTo('inspection')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        <span>Inspeção 360°</span>
                    </button>
                    <button class="dna-insp-tab-btn active" onclick="OwnerView.navigateTo('revisions')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Plano de Revisões</span>
                    </button>
                </div>

                <!-- Card Próxima Revisão -->
                <div class="dna-rev-next-card" style="background:radial-gradient(circle at 50% 20%, rgba(12,30,65,0.9) 0%, rgba(6,14,28,0.95) 100%); border:1.5px solid rgba(0,102,255,0.35); border-radius:14px; padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div>
                            <span style="font-size:10px; color:#00D4FF; font-weight:800; text-transform:uppercase;">Próxima revisão</span>
                            <h3 style="font-size:18px; font-weight:900; color:#FFFFFF; margin:2px 0 0;">${Number(rev.next_revision.target_mileage).toLocaleString('pt-BR')} km</h3>
                        </div>
                        <span style="background:rgba(245,158,11,0.15); border:1px solid #F59E0B; color:#F59E0B; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px;">
                            Faltam ${Number(rev.next_revision.remaining_km).toLocaleString('pt-BR')} km (~${rev.next_revision.estimated_days} dias)
                        </span>
                    </div>

                    <!-- Itens para substituição -->
                    <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
                        <span style="font-size:11px; font-weight:800; color:#CBD5E1; display:block; margin-bottom:6px;">Itens para substituição</span>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            ${rev.next_revision.items.map(it => `
                                <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:#FFFFFF;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>${it}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary" onclick="OwnerView.navigateTo('workshops')" style="width:100%; margin-top:14px; background:#0066FF; color:#FFFFFF; font-weight:800; font-size:12px; padding:10px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <span>Agendar Revisão na Rede homologada</span>
                    </button>
                </div>

                <!-- Histórico de revisões -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:11px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Histórico de revisões</span>
                    ${rev.history.map(h => `
                        <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.2); border-radius:10px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:#FFFFFF; font-size:12.5px; display:block;">${h.revision_label}</strong>
                                <span style="color:#94A3B8; font-size:11px;">${h.performed_at} - ${h.workshop}</span>
                            </div>
                            <span style="background:rgba(255,210,28,0.12); color:#FFD21C; border:1px solid rgba(255,210,28,0.3); font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px;">
                                ${h.proof_level}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ── 6. TELA: OBD2 TELEMETRIA (TELA 6 DO MAPA) ──
    renderObdScreen() {
        const o = this.obdData;
        const scanningText = this.isObdScanning ? 'Lendo sensores da central ECU...' : 'Escanear Central ECU Novamente';

        return `
            <div class="dna-obd-container" style="display:flex; flex-direction:column; gap:12px;">
                <!-- Status de Conexão com o Mini OBD2 Dongle -->
                <div class="dna-obd-conn-banner" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:10px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981;"></div>
                        <span style="font-size:11.5px; color:#10B981; font-weight:700;">Conectado via BLE / Escaneamento ativo</span>
                    </div>
                    <span style="font-size:10px; color:#94A3B8; font-family:var(--font-mono, monospace);">500 kbaud</span>
                </div>

                <!-- 4 Gauges Dials Circulares (RPM | Temp | Bateria | Odômetro) -->
                <div class="dna-obd-gauges-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <!-- 1. RPM -->
                    <div class="dna-obd-gauge-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:14px; padding:14px; text-align:center;">
                        <span style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">RPM</span>
                        <div style="font-size:22px; font-weight:900; color:#00D4FF; margin:4px 0 2px;">${Number(o.telemetry.rpm).toLocaleString('pt-BR')}</div>
                        <span style="font-size:10px; color:#10B981; font-weight:700;">Marcha Lenta</span>
                    </div>

                    <!-- 2. Temp -->
                    <div class="dna-obd-gauge-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:14px; padding:14px; text-align:center;">
                        <span style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Temp</span>
                        <div style="font-size:22px; font-weight:900; color:#10B981; margin:4px 0 2px;">${o.telemetry.coolant_temp_c}°C</div>
                        <span style="font-size:10px; color:#10B981; font-weight:700;">Ideal (90°C)</span>
                    </div>

                    <!-- 3. Bateria -->
                    <div class="dna-obd-gauge-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:14px; padding:14px; text-align:center;">
                        <span style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Bateria</span>
                        <div style="font-size:22px; font-weight:900; color:#00D4FF; margin:4px 0 2px;">${o.telemetry.battery_voltage}V</div>
                        <span style="font-size:10px; color:#00D4FF; font-weight:700;">Carga Plena</span>
                    </div>

                    <!-- 4. Odômetro ECU -->
                    <div class="dna-obd-gauge-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:14px; padding:14px; text-align:center;">
                        <span style="font-size:10px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Odômetro ECU</span>
                        <div style="font-size:17px; font-weight:900; color:#FFFFFF; margin:6px 0 2px;">${Number(o.telemetry.ecu_odometer_km).toLocaleString('pt-BR')} <span style="font-size:11px;">km</span></div>
                        <span style="font-size:10px; color:#10B981; font-weight:700;">Autenticado</span>
                    </div>
                </div>

                <!-- DTC - Erros -->
                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:10px;">
                    <div style="color:#10B981;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    </div>
                    <div>
                        <strong style="color:#FFFFFF; font-size:12px; display:block;">DTC - Erros</strong>
                        <span style="color:#10B981; font-size:11px; font-weight:700;">0 erros detectados</span>
                    </div>
                </div>

                <!-- Sensores em tempo real -->
                <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.2); border-radius:12px; padding:12px 14px;">
                    <span style="font-size:11px; font-weight:800; color:#CBD5E1; text-transform:uppercase; display:block; margin-bottom:8px;">Sensores em tempo real</span>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11.5px;">
                        <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="color:#94A3B8;">Lambda</span>
                            <strong style="color:#10B981;">${o.telemetry.lambda_ratio}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="color:#94A3B8;">MAP</span>
                            <strong style="color:#FFFFFF;">${o.telemetry.map_pressure_kpa} kPa</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:4px 0;">
                            <span style="color:#94A3B8;">TPS</span>
                            <strong style="color:#FFFFFF;">${o.telemetry.throttle_pos_percent}%</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:4px 0;">
                            <span style="color:#94A3B8;">IAT</span>
                            <strong style="color:#FFFFFF;">${o.telemetry.intake_temp_c}°C</strong>
                        </div>
                    </div>
                </div>

                <!-- Botão de Re-escaneamento -->
                <button class="dna-obd-rescan-btn" onclick="OwnerView.rescanObd()" ${this.isObdScanning ? 'disabled' : ''} style="background:#0066FF; color:#FFFFFF; font-weight:800; font-size:12px; padding:10px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ${this.isObdScanning ? 'style="animation: spin 1s linear infinite;"' : ''}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    <span>${scanningText}</span>
                </button>
            </div>
        `;
    },

    // Alterar filtro do histórico
    setHistoryFilter(filter) {
        this.historyFilter = filter;
        this.render();
    },

    // ── 7. TELA: HISTÓRICO / DOSSIÊ (TELA 7 DO MAPA) ──
    renderHistoryScreen() {
        const v = this.vehicleData;
        const filter = this.historyFilter || 'all';

        // Dados de peças e fotos para os filtros
        const partsData = [
            { name: 'Correia Dentada Continental', ref: 'CT1192', date: '10/10/2024', workshop: 'Oficina AutoTech' },
            { name: 'Pastilhas de Freio Bosch', ref: 'BP1234', date: '12/04/2025', workshop: 'Oficina AutoTech' },
            { name: 'Óleo Sintético 0W20 Honda HAMP', ref: '4L', date: '15/12/2023', workshop: 'Oficina AutoTech' },
            { name: 'Filtro de Ar Motor K&N', ref: 'FA3301', date: '12/04/2025', workshop: 'Oficina AutoTech' },
            { name: 'Velas de Ignição NGK Iridium', ref: 'ILZKR7B-11S', date: '12/04/2025', workshop: 'Oficina AutoTech' }
        ];

        const photosData = [
            { title: 'Correia Dentada Nova Instalada', date: '10/10/2024', type: 'Peça Instalada' },
            { title: 'Odômetro 80.000 km', date: '12/04/2025', type: 'Registro' },
            { title: 'Pastilhas Dianteiras Novas', date: '12/04/2025', type: 'Peça Nova' },
            { title: 'Nota Fiscal NF-e 009284', date: '12/04/2025', type: 'Nota Fiscal' }
        ];

        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <!-- Filtros em Chips: Todos, Serviços, Peças, Fotos -->
                <div class="dna-history-pill-filters" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;">
                    <button class="dna-history-filter-btn ${filter === 'all' ? 'active' : ''}" onclick="OwnerView.setHistoryFilter('all')">Todos</button>
                    <button class="dna-history-filter-btn ${filter === 'services' ? 'active' : ''}" onclick="OwnerView.setHistoryFilter('services')">Serviços</button>
                    <button class="dna-history-filter-btn ${filter === 'parts' ? 'active' : ''}" onclick="OwnerView.setHistoryFilter('parts')">Peças</button>
                    <button class="dna-history-filter-btn ${filter === 'photos' ? 'active' : ''}" onclick="OwnerView.setHistoryFilter('photos')">Fotos</button>
                </div>

                <!-- Conteúdo Filtrado -->
                <div class="dna-history-list" style="display:flex; flex-direction:column; gap:10px;">
                    ${filter === 'all' || filter === 'services' ? v.timeline.map(t => `
                        <div class="dna-history-item-clickable">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div>
                                    <span style="font-size:10.5px; color:#00D4FF; font-weight:700;">${t.date}</span>
                                    <h4 style="font-size:13px; font-weight:800; color:#FFFFFF; margin:2px 0 0;">${t.title}</h4>
                                </div>
                                <span style="background:rgba(16,185,129,0.15); color:#10B981; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px;">
                                    ${t.km}
                                </span>
                            </div>
                            <p style="font-size:11.5px; color:#CBD5E1; margin:0 0 8px; line-height:1.4;">${t.details}</p>
                            <div style="font-size:10.5px; color:#94A3B8; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; display:flex; justify-content:space-between;">
                                <span>Oficina: <strong style="color:#FFFFFF;">${t.workshop}</strong></span>
                                <span style="color:#10B981; font-weight:700;">Comprovado Nível 4</span>
                            </div>
                        </div>
                    `).join('') : ''}

                    ${filter === 'all' || filter === 'parts' ? `
                        ${filter === 'parts' ? '<span style="font-size:11px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Peças Utilizadas</span>' : ''}
                        ${partsData.map(p => `
                            <div class="dna-history-item-clickable">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div style="flex:1;">
                                        <span style="font-size:13px; font-weight:700; color:#FFFFFF; display:block;">${p.name}</span>
                                        <span style="font-size:11px; color:#94A3B8;">Ref: ${p.ref} • ${p.date}</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:6px;">
                                        <span style="font-size:10px; color:#FFD21C; font-weight:700; background:rgba(255,210,28,0.1); padding:2px 6px; border-radius:4px;">📷</span>
                                        <span style="font-size:10px; color:#00D4FF; font-weight:700; background:rgba(0,212,255,0.1); padding:2px 6px; border-radius:4px;">🧾</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    ` : ''}

                    ${filter === 'photos' ? `
                        <span style="font-size:11px; font-weight:800; color:#CBD5E1; text-transform:uppercase; letter-spacing:0.5px;">Registros Fotográficos</span>
                        ${photosData.map(ph => `
                            <div class="dna-history-item-clickable">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div style="width:40px; height:40px; border-radius:8px; background:rgba(0,102,255,0.15); display:flex; align-items:center; justify-content:center; color:#00D4FF; flex-shrink:0;">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                        </div>
                                        <div>
                                            <span style="font-size:13px; font-weight:700; color:#FFFFFF; display:block;">${ph.title}</span>
                                            <span style="font-size:11px; color:#94A3B8;">${ph.date} • ${ph.type}</span>
                                        </div>
                                    </div>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
            </div>
        `;
    },

    // ── 8. TELA: ALERTAS / LEMBRETES (TELA 8 DO MAPA) ──
    renderRemindersScreen() {
        const rems = this.remindersList || [];
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- Lista de Alertas e Lembretes por Severidade -->
                ${rems.map(r => `
                    <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.22); border-left:4px solid ${r.severity_color}; border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:9.5px; font-weight:900; color:${r.severity_color}; text-transform:uppercase; letter-spacing:0.5px;">${r.severity}</span>
                            <h4 style="font-size:13px; font-weight:800; color:#FFFFFF; margin:2px 0 2px;">${r.title}</h4>
                            <span style="font-size:11px; color:#94A3B8;">${r.subtitle}</span>
                        </div>
                        ${r.action_text ? `
                            <button class="btn btn-sm" onclick="OwnerView.navigateTo('workshops')" style="background:${r.severity_color}; color:#FFFFFF; font-weight:800; font-size:11px; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">
                                ${r.action_text}
                            </button>
                        ` : ''}
                    </div>
                `).join('')}

                <button class="btn btn-secondary" onclick="OwnerView.navigateTo('history')" style="background:rgba(15,23,42,0.8); color:#FFFFFF; border:1px solid rgba(255,255,255,0.15); font-weight:700; font-size:12px; padding:10px; border-radius:8px; cursor:pointer; margin-top:4px;">
                    Ver todos os lembretes
                </button>

                <!-- Botão Flutuante / Fixo Agendar pelo WhatsApp -->
                <a href="https://wa.me/5511998765432?text=Olá,%20gostaria%20de%20agendar%20a%20revisão%20do%20meu%20Civic%20BRA2E19" target="_blank" class="btn btn-success" style="background:#10B981; color:#0B0F19; font-weight:800; font-size:13px; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; margin-top:6px; box-shadow:0 4px 16px rgba(16,185,129,0.3);">
                    <span>💬</span>
                    <span>Agendar pelo WhatsApp</span>
                </a>
            </div>
        `;
    },

    // ── 9. TELA: OFICINAS DA REDE (TELA 9 DO MAPA) ──
    renderWorkshopsScreen() {
        const list = this.workshopsList || [];
        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <!-- Campo de Busca de Oficinas -->
                <div style="position:relative;">
                    <input type="text" class="form-control" placeholder="Buscar oficina ou cidade..." style="width:100%; background:#050B14; border:1px solid rgba(0,102,255,0.3); border-radius:10px; padding:10px 14px; font-size:12.5px; color:#FFFFFF;" />
                </div>

                <!-- Lista de Oficinas Credenciadas -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${list.map(w => `
                        <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.22); border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="font-size:13px; font-weight:800; color:#FFFFFF; margin:0 0 3px;">${w.name}</h4>
                                <div style="font-size:11px; color:#94A3B8; display:flex; align-items:center; gap:8px;">
                                    <span style="color:#FFD21C; font-weight:700;">⭐ ${w.rating}</span>
                                    <span>•</span>
                                    <span>${w.distance} - ${w.neighborhood}</span>
                                </div>
                            </div>
                            <a href="https://wa.me/55${w.phone.replace(/\\D/g, '')}?text=Olá,%20gostaria%20de%20agendar%20um%20serviço%20pelo%20DNA%20AUTO" target="_blank" class="btn btn-primary btn-sm" style="background:#0066FF; color:#FFFFFF; font-weight:800; font-size:11px; padding:6px 14px; border-radius:6px; text-decoration:none;">
                                Agendar
                            </a>
                        </div>
                    `).join('')}
                </div>

                <button class="btn btn-secondary" onclick="OwnerView.navigateTo('reminders')" style="background:rgba(15,23,42,0.8); color:#FFFFFF; border:1px solid rgba(255,255,255,0.15); font-weight:700; font-size:12px; padding:10px; border-radius:8px; cursor:pointer;">
                    Agendar mais próximo
                </button>
            </div>
        `;
    },

    // ── 10. SUB-TELA: CONFIGURAÇÕES COM BOTÃO DE SAIR ──
    renderSettingsScreen() {
        const v = this.vehicleData;
        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Perfil do Usuário</h4>
                    <p class="dna-history-details">Proprietário: <strong>${v.user_name}</strong><br>Status: ${v.user_role}</p>
                </div>

                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Pareamento Mini OBD2</h4>
                    <p class="dna-history-details">Dispositivo: Mini OBD2 ELM327 BLE 5.2<br>Sincronização: Automática com a ignição<br>Frequência: Leituras a cada 2 segundos</p>
                </div>

                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Aparência</h4>
                    <p class="dna-history-details">Tema: Dark Obsidian & Neon Blue</p>
                </div>

                <!-- Botão de Sair com Destaque -->
                <button class="dna-drawer-logout-btn" onclick="OwnerView.logout()" style="margin-top:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Sair da Garagem Digital (Logout)</span>
                </button>
            </div>
        `;
    },

    // ── 11. SUB-TELA: NOTIFICAÇÕES ──
    renderNotificationsScreen() {
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:11.5px; font-weight:800; color:#FFFFFF; text-transform:uppercase;">Central de Avisos</span>
                    <span style="font-size:10px; color:#00E676; font-weight:700;">3 Notificações</span>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #00E676;">
                    <h4 class="dna-history-title">Certificação Homologada</h4>
                    <p class="dna-history-details">O certificado digital #DNA-2026-000184 do seu Volkswagen Gol foi revalidado pela rede com sucesso.</p>
                    <span style="font-size:9.5px; color:#94A3B8;">Hoje às 14:32</span>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #00D4FF;">
                    <h4 class="dna-history-title">Inspeção Veicular 360° Conforme</h4>
                    <p class="dna-history-details">Laudo pericial com score 98/100 e 6 sistemas inspecionados homologado pela rede credenciada.</p>
                    <span style="font-size:9.5px; color:#94A3B8;">Hoje</span>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #38BDF8;">
                    <h4 class="dna-history-title">Telemetria Mini OBD2 Ativa</h4>
                    <p class="dna-history-details">Dongle conectado via Bluetooth Low Energy. Zero falhas detectadas na central do motor.</p>
                    <span style="font-size:9.5px; color:#94A3B8;">Agora</span>
                </div>
            </div>
        `;
    },

    // ── GESTÃO E TROCA DA FOTO DO CARRO PELO PROPRIETÁRIO ──
    openChangePhotoModal() {
        this.isPhotoModalOpen = true;
        this.tempPhotoPreview = this.vehicleData.photo_url;
        this.render();
    },

    closeChangePhotoModal() {
        this.isPhotoModalOpen = false;
        this.tempPhotoPreview = null;
        this._selectedPhotoFile = null;
        this.render();
    },

    handlePhotoFileSelect(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        this._selectedPhotoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.tempPhotoPreview = e.target.result;
            const previewImg = document.getElementById('dna-modal-photo-preview');
            if (previewImg) previewImg.src = this.tempPhotoPreview;
            const badge = document.getElementById('dna-modal-photo-badge');
            if (badge) {
                badge.textContent = 'Nova Foto do Celular Selecionada';
                badge.style.color = '#00E676';
                badge.style.borderColor = '#00E676';
            }
        };
        reader.readAsDataURL(file);
    },

    async saveVehiclePhoto(customUrl) {
        const plate = this.vehicleData.license_plate;
        const fileInput = document.getElementById('dna-photo-file-input');
        const fileToUpload = (fileInput && fileInput.files && fileInput.files[0]) || this._selectedPhotoFile;

        try {
            if (fileToUpload) {
                // Upload real via multipart/form-data
                const formData = new FormData();
                formData.append('photo', fileToUpload);
                const res = await fetch(`/api/v1/vehicles/${plate}/photo-upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success && data.photo_url) {
                    this.vehicleData.photo_url = data.photo_url;
                    if (this.userVehicles) {
                        const match = this.userVehicles.find(u => u.license_plate === plate);
                        if (match) match.photo_url = data.photo_url;
                    }
                }
            } else {
                // URL externa ou preview
                const photoToSave = customUrl || this.tempPhotoPreview || this.vehicleData.photo_url;
                if (!photoToSave) return;
                const res = await fetch(`/api/v1/vehicles/${plate}/photo`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photo_url: photoToSave })
                });
                const data = await res.json();
                if (data.success && data.photo_url) {
                    this.vehicleData.photo_url = data.photo_url;
                    if (this.userVehicles) {
                        const match = this.userVehicles.find(u => u.license_plate === plate);
                        if (match) match.photo_url = data.photo_url;
                    }
                } else {
                    this.vehicleData.photo_url = photoToSave;
                }
            }
        } catch (e) {
            console.error('Erro ao salvar foto:', e);
        }

        this.closeChangePhotoModal();

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: #10B981;
            color: #FFFFFF;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 11.5px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            z-index: 9999;
            animation: dnaFadeIn 0.2s ease;
        `;
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Foto do veículo atualizada com sucesso!</span>
        `;
        const phone = document.querySelector('.dna-phone-frame');
        if (phone) {
            phone.appendChild(toast);
            setTimeout(() => toast.remove(), 2600);
        }
    },

    async restoreDefaultModelPhoto() {
        const plate = this.vehicleData.license_plate;
        try {
            const res = await fetch(`/api/v1/vehicles/${plate}/photo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_url: 'default' })
            });
            const data = await res.json();
            if (data.success && data.photo_url) {
                this.vehicleData.photo_url = data.photo_url;
                if (this.userVehicles) {
                    const match = this.userVehicles.find(u => u.license_plate === plate);
                    if (match) match.photo_url = data.photo_url;
                }
            } else {
                this.vehicleData.photo_url = '/img/vw-gol-app.jpg';
            }
        } catch (e) {
            this.vehicleData.photo_url = '/img/vw-gol-app.jpg';
        }

        this.closeChangePhotoModal();

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: #0066FF;
            color: #FFFFFF;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 11.5px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            z-index: 9999;
            animation: dnaFadeIn 0.2s ease;
        `;
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span>Foto oficial do modelo restaurada com sucesso!</span>
        `;
        const phone = document.querySelector('.dna-phone-frame');
        if (phone) {
            phone.appendChild(toast);
            setTimeout(() => toast.remove(), 2600);
        }
    },

    renderChangePhotoModal() {
        const v = this.vehicleData;
        const currentImg = this.tempPhotoPreview || v.photo_url || '/img/vw-gol-app.jpg';
        return `
            <div class="dna-photo-modal-overlay" onclick="if(event.target === this) OwnerView.closeChangePhotoModal();">
                <div class="dna-photo-modal-sheet">
                    <div class="dna-photo-modal-header">
                        <div>
                            <h3>Trocar Foto do Veículo</h3>
                            <p>${v.full_title} • ${v.license_plate}</p>
                        </div>
                        <button class="dna-doc-sheet-close" onclick="OwnerView.closeChangePhotoModal()" title="Fechar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <!-- Prévia da Foto Atual / Nova -->
                    <div class="dna-photo-preview-box">
                        <span id="dna-modal-photo-badge" class="dna-photo-status-badge">Foto Atual do Veículo</span>
                        <img id="dna-modal-photo-preview" class="dna-photo-preview-img" src="${currentImg}" alt="${v.full_title}" onerror="this.onerror=null; this.src='/img/vw-gol-app.jpg';" />
                    </div>

                    <!-- Opção 1: Upload de Foto Real do Carro do Dono -->
                    <input type="file" id="dna-photo-file-input" accept="image/*" style="display:none;" onchange="OwnerView.handlePhotoFileSelect(this)" />
                    <div class="dna-photo-upload-zone" onclick="document.getElementById('dna-photo-file-input').click()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2" style="margin-bottom:4px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <div style="font-size:12px; font-weight:800; color:#FFFFFF;">Escolher Foto do Celular / Galeria</div>
                        <div style="font-size:10.5px; color:#94A3B8; margin-top:2px;">Envie uma foto real do seu carro (JPG, PNG ou HEIC)</div>
                    </div>

                    <!-- Opção 2: URL Externa -->
                    <div>
                        <label style="font-size:11px; font-weight:700; color:#CBD5E1; display:block; margin-bottom:4px;">Ou informe o link de uma imagem online:</label>
                        <input type="text" id="dna-photo-url-input" class="dna-photo-url-input" placeholder="https://exemplo.com/minha-foto.jpg" onchange="document.getElementById('dna-modal-photo-preview').src = this.value; OwnerView.tempPhotoPreview = this.value;" />
                    </div>

                    <!-- Botão Salvar e Restaurar -->
                    <button class="dna-photo-btn-primary" onclick="const customUrl = document.getElementById('dna-photo-url-input').value.trim(); OwnerView.saveVehiclePhoto(customUrl);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Salvar Foto do Veículo</span>
                    </button>

                    <button class="dna-photo-btn-secondary" onclick="OwnerView.restoreDefaultModelPhoto()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/></svg>
                        <span>Restaurar Foto Oficial do Modelo</span>
                    </button>
                </div>
            </div>
        `;
    }
};

window.OwnerView = OwnerView;
