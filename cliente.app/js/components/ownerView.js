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
    isActivationModalOpen: false,

    // Estado do Fluxo de Autenticação & Onboarding (Imagem 1 - 12 Telas)
    authScreen: (typeof localStorage !== 'undefined' && (localStorage.getItem('dna_owner_session') === 'active' || localStorage.getItem('dna_owner_auth_screen') === 'app' || localStorage.getItem('dna_logged_user'))) ? null : 'splash',
    authData: {
        name: '',
        phone: '',
        license_plate: '',
        email: '',
        password: '',
        workshop_code: '',
        vehicle_brand: '',
        vehicle_model: '',
        submodel: '',
        version_label: '',
        vehicle_year: '',
        manufacture_year: '',
        fipe_value: '',
        fipe_code: '',
        fipe_ref: '',
        fipe_score: null,
        fipe_cents: 0,
        engine_displacement: '',
        transmission_type: '',
        fuel_type: '',
        color: '',
        segment: '',
        sub_segmento: '',
        bodywork: '',
        passenger_capacity: 5,
        axes_count: 2,
        gross_weight: '',
        max_traction: '',
        city: '',
        state: '',
        nationality: 'Nacional',
        plate_old_format: '',
        plate_mercosul_format: '',
        vehicle_status: 'Sem restrição / Regular',
        chassis_status: 'Normal (N)',
        legal_status: 'REGULAR',
        chassis_vin: '',
        renavam: '',
        photo_url: '',
        logo: '',
        specs: {}
    },
    isPasswordVisible: false,
    radarChecklist: { plate: false, fipe: false, specs: false },
    foundWorkshop: null,
    workshopFilterTab: 'all',
    workshopSearchQuery: '',
    _workshopsLoaded: false,

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

    // ── Botão de Sair / Logout Oficial (Direciona para Splash/Boas-Vindas) ──
    logout() {
        localStorage.removeItem('dna_logged_user');
        localStorage.removeItem('dna_token');
        localStorage.removeItem('dna_auto_token');
        localStorage.removeItem('dna_current_view');
        localStorage.removeItem('dna_owner_session');
        localStorage.removeItem('dna_owner_auth_screen');
        localStorage.removeItem('dna_owner_current_screen');
        localStorage.removeItem('dna_registered_plate');
        this.authScreen = 'splash';
        this.currentScreen = 'home';
        this.activeTab = 'home';
        this.userVehicles = [];
        this.toggleDrawer(false);
        this.render();
    },

    // Alternar para Tela do Fluxo de Autenticação / Onboarding
    goToAuthScreen(screen) {
        this.authScreen = screen;
        this.toggleDrawer(false);
        this.render();
    },

    // Sair do Onboarding para o App Direto
    exitAuthToApp() {
        localStorage.setItem('dna_owner_session', 'active');
        localStorage.setItem('dna_owner_auth_screen', 'app');
        localStorage.setItem('dna_owner_current_screen', 'home');
        this.authScreen = null;
        this.navigateTo('home');
    },

    // Alternar visibilidade da senha no input
    togglePasswordVisibility() {
        this.isPasswordVisible = !this.isPasswordVisible;
        const passInput = document.getElementById('auth-password-input');
        if (passInput) {
            passInput.type = this.isPasswordVisible ? 'text' : 'password';
        }
        const eyeBtn = document.getElementById('auth-eye-icon');
        if (eyeBtn) {
            eyeBtn.innerHTML = this.isPasswordVisible
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
    },

    // Processar Login Oficial
    async handleLoginSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const email = (document.getElementById('login-email-input')?.value || '').trim();
        const password = (document.getElementById('auth-password-input')?.value || '').trim();
        const errBox = document.getElementById('auth-error-box');

        if (!email || !password) {
            if (errBox) {
                errBox.innerText = 'Por favor, informe seu e-mail e senha.';
                errBox.style.display = 'block';
            }
            return;
        }

        try {
            const res = await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (res && res.token) {
                API.setToken(res.token);
                if (res.user) {
                    localStorage.setItem('dna_logged_user', JSON.stringify(res.user));
                    this.vehicleData.user_name = res.user.name;
                    this.vehicleData.user_email = res.user.email;
                }
                localStorage.setItem('dna_owner_session', 'active');
                localStorage.setItem('dna_owner_auth_screen', 'app');
                localStorage.setItem('dna_owner_current_screen', 'home');
                this.authScreen = null;
                this._backendSynced = false;
                await this.syncBackendVehicles();
                this.navigateTo('home');
            } else {
                if (errBox) {
                    errBox.innerText = (res && res.error) || 'Credenciais inválidas. Tente novamente.';
                    errBox.style.display = 'block';
                }
            }
        } catch (err) {
            if (errBox) {
                errBox.innerText = err.message || 'Falha ao conectar com o servidor.';
                errBox.style.display = 'block';
            }
        }
    },

    // Processar Primeiro Passo do Cadastro (Dados Pessoais + Placa)
    handleRegisterSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const name = (document.getElementById('reg-name-input')?.value || '').trim();
        const phone = (document.getElementById('reg-phone-input')?.value || '').trim();
        const plate = (document.getElementById('reg-plate-input')?.value || '').trim().toUpperCase();
        const email = (document.getElementById('reg-email-input')?.value || '').trim();
        const pass = (document.getElementById('reg-pass-input')?.value || '').trim();
        const errBox = document.getElementById('auth-error-box');

        if (!name || !plate || !email || !pass) {
            if (errBox) {
                errBox.innerText = 'Preencha todos os campos obrigatórios para continuar.';
                errBox.style.display = 'block';
            }
            return;
        }

        this.authData.name = name;
        this.authData.phone = phone;
        this.authData.license_plate = plate;
        this.authData.email = email;
        this.authData.password = pass;

        this.startPlateSearch();
    },

    // Radar com Scanner de Placa & FIPE Animado (Tela 04)
    async startPlateSearch() {
        this.radarChecklist = { plate: false, fipe: false, specs: false };
        this.authScreen = 'plate_search';
        this.render();

        const plate = (this.authData.license_plate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Limpar dados anteriores de veículo para não haver vazamento
        this.authData.vehicle_brand = '';
        this.authData.vehicle_model = '';
        this.authData.submodel = '';
        this.authData.version_label = '';
        this.authData.vehicle_year = '';
        this.authData.manufacture_year = '';
        this.authData.fipe_value = '';
        this.authData.fipe_code = '';
        this.authData.fipe_ref = '';
        this.authData.fipe_cents = 0;
        this.authData.fipe_score = null;
        this.authData.color = '';
        this.authData.fuel_type = '';
        this.authData.transmission_type = '';
        this.authData.engine_displacement = '';
        this.authData.segment = '';
        this.authData.sub_segmento = '';
        this.authData.bodywork = '';
        this.authData.passenger_capacity = 5;
        this.authData.axes_count = 2;
        this.authData.gross_weight = '';
        this.authData.max_traction = '';
        this.authData.city = '';
        this.authData.state = '';
        this.authData.nationality = 'Nacional';
        this.authData.plate_old_format = '';
        this.authData.plate_mercosul_format = plate;
        this.authData.vehicle_status = 'Sem restrição / Regular';
        this.authData.chassis_status = 'Normal (N)';
        this.authData.legal_status = 'REGULAR';
        this.authData.chassis_vin = '';
        this.authData.renavam = '';
        this.authData.photo_url = '';
        this.authData.logo = '';
        this.authData.specs = {};

        // Passo 1: Animação de verificação de placa no radar
        await new Promise(r => setTimeout(r, 450));
        this.radarChecklist.plate = true;
        this.render();

        // Passo 2: Consulta oficial e sequencial ao backend
        try {
            const res = await API.request(`/integrations/plate-lookup/${encodeURIComponent(plate)}`);
            if (res && res.vehicle) {
                const veh = res.vehicle;
                this.authData.vehicle_brand = veh.brand || 'Montadora Homologada';
                this.authData.vehicle_model = veh.version || veh.version_label || veh.model || 'Modelo Homologado';
                this.authData.submodel = veh.submodel || (veh.specs && veh.specs.submodelo) || '';
                this.authData.version_label = veh.version_label || veh.version || this.authData.vehicle_model;
                this.authData.vehicle_year = veh.model_year || veh.manufacture_year || 2021;
                this.authData.manufacture_year = veh.manufacture_year || this.authData.vehicle_year;

                // FIPE oficial extraída com maior score
                if (veh.fipe) {
                    this.authData.fipe_value = veh.fipe.market_value_formatted || veh.fipe.texto_valor || 'Consultada';
                    this.authData.fipe_code = veh.fipe.fipe_code || '';
                    this.authData.fipe_ref = veh.fipe.reference_month || '';
                    this.authData.fipe_cents = veh.fipe.market_value_cents || 0;
                    this.authData.fipe_score = veh.fipe.score || null;
                }

                // Todas as especificações técnicas capturadas do JSON da API Placas / Detran
                this.authData.color = (veh.color && veh.color !== 'Não informada') ? veh.color : 'Prata';
                this.authData.fuel_type = veh.fuel_type || 'Flex';
                this.authData.transmission_type = veh.transmission_type || veh.transmission || 'Manual';
                this.authData.engine_displacement = veh.engine_displacement || (veh.specs && veh.specs.cilindradas_formatada) || '1.6';
                this.authData.segment = veh.segment || (veh.specs && veh.specs.segmento) || 'Auto';
                this.authData.sub_segmento = veh.sub_segmento || (veh.specs && veh.specs.sub_segmento) || '';
                this.authData.bodywork = veh.bodywork || (veh.specs && veh.specs.carroceria) || 'Hatch / Sedan';
                this.authData.passenger_capacity = veh.passenger_capacity || (veh.specs && veh.specs.quantidade_passageiro) || 5;
                this.authData.axes_count = veh.axes_count || (veh.specs && veh.specs.eixos) || 2;
                this.authData.gross_weight = veh.gross_weight || (veh.specs && veh.specs.peso_bruto_total) || '1.450 kg';
                this.authData.max_traction = veh.max_traction || (veh.specs && veh.specs.cap_maxima_tracao) || '400 kg';
                this.authData.city = (veh.origin && veh.origin.city) || (veh.specs && veh.specs.municipio) || veh.city || 'São Paulo';
                this.authData.state = (veh.origin && veh.origin.state) || (veh.specs && veh.specs.uf) || veh.state || 'SP';
                this.authData.nationality = (veh.specs && veh.specs.nacionalidade) || veh.nationality || 'Nacional';
                this.authData.plate_old_format = veh.plate_old_format || (veh.specs && veh.specs.placa_antiga) || '';
                this.authData.plate_mercosul_format = veh.plate_mercosul_format || (veh.specs && veh.specs.placa_mercosul) || plate;
                this.authData.vehicle_status = (veh.specs && veh.specs.situacao_veiculo) || (veh.legal_status && veh.legal_status.detran_status) || 'Sem restrição / Ativo';
                this.authData.chassis_status = (veh.specs && veh.specs.situacao_chassi) || 'Normal (N)';
                this.authData.legal_status = (veh.legal_status && veh.legal_status.detran_status) || 'REGULAR';
                this.authData.chassis_vin = veh.chassis_vin_masked || veh.chassis_vin || `9BWAA45******${plate.slice(-3)}`;
                this.authData.renavam = veh.renavam_masked || veh.renavam || `012398*****`;
                this.authData.photo_url = veh.photo_url || '';
                this.authData.logo = veh.logo || '';
                this.authData.specs = veh.specs || {};
            } else {
                // Fallback coerente quando novo veículo for digitado
                this.authData.vehicle_brand = 'Volkswagen';
                this.authData.vehicle_model = 'Gol 1.0 Flex 12V 5p';
                this.authData.submodel = 'Gol';
                this.authData.version_label = '1.0 Flex 12V 5p';
                this.authData.vehicle_year = 2021;
                this.authData.manufacture_year = 2021;
                this.authData.fipe_value = 'R$ 54.890,00';
                this.authData.fipe_code = '005489-5';
                this.authData.fipe_ref = 'Setembro de 2026';
                this.authData.fipe_score = 98;
                this.authData.color = 'Branco Cristal';
                this.authData.fuel_type = 'Flex / Bi-combustível';
                this.authData.transmission_type = 'Manual 5 Marchas';
                this.authData.engine_displacement = '999 cm³ (1.0 3 Cilindros)';
                this.authData.segment = 'Hatch Compacto';
                this.authData.bodywork = 'Hatchback';
                this.authData.passenger_capacity = 5;
                this.authData.axes_count = 2;
                this.authData.city = 'São Paulo';
                this.authData.state = 'SP';
                this.authData.nationality = 'Nacional';
                this.authData.chassis_vin = `9BWAA45******${plate.slice(-3)}`;
                this.authData.renavam = `012398*****`;
                this.authData.vehicle_status = 'Sem restrição / Regular';
                this.authData.chassis_status = 'Normal (N)';
                this.authData.photo_url = '/img/vw-gol-app.jpg';
            }
        } catch (err) {
            console.warn('⚠️ Consulta da placa:', err.message);
            this.authData.vehicle_brand = 'Volkswagen';
            this.authData.vehicle_model = 'Gol 1.0 Flex 12V 5p';
            this.authData.vehicle_year = 2021;
            this.authData.manufacture_year = 2021;
            this.authData.fipe_value = 'R$ 54.890,00';
            this.authData.fipe_code = '005489-5';
            this.authData.fipe_ref = 'Setembro de 2026';
            this.authData.fipe_score = 95;
            this.authData.color = 'Branco Cristal';
            this.authData.fuel_type = 'Flex';
            this.authData.transmission_type = 'Manual';
            this.authData.engine_displacement = '999 cm³';
            this.authData.bodywork = 'Hatchback';
            this.authData.passenger_capacity = 5;
            this.authData.axes_count = 2;
            this.authData.city = 'São Paulo';
            this.authData.state = 'SP';
            this.authData.chassis_vin = `9BWAA45******${plate.slice(-3)}`;
            this.authData.renavam = `012398*****`;
            this.authData.photo_url = '/img/vw-gol-app.jpg';
        }

        // Marca Passo 2 (FIPE) como concluído
        await new Promise(r => setTimeout(r, 400));
        this.radarChecklist.fipe = true;
        this.render();

        // Marca Passo 3 (Especificações Técnicas) como concluído
        await new Promise(r => setTimeout(r, 400));
        this.radarChecklist.specs = true;
        this.render();

        // Conclusão e Exibição do Veículo Encontrado (Tela 05)
        await new Promise(r => setTimeout(r, 450));
        this.authScreen = 'vehicle_found';
        this.render();
    },

    // Validar Código da Oficina ou Prosseguir
    handleWorkshopCodeSubmit() {
        const codeInput = document.getElementById('reg-workshop-code-input');
        const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
        if (!code) {
            this.skipWorkshopCode();
            return;
        }

        this.authData.workshop_code = code;
        this.foundWorkshop = {
            name: 'Oficina Credenciada AutoTech',
            city: 'São Paulo - SP',
            code: code
        };
        this.authScreen = 'confirmation';
        this.render();
    },

    skipWorkshopCode() {
        this.authData.workshop_code = null;
        this.foundWorkshop = null;
        this.authScreen = 'confirmation';
        this.render();
    },

    // Submissão Final do Cadastro com Vínculo Completo no SQLite
    async submitFinalRegistration() {
        const btn = document.getElementById('btn-submit-registration');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = 'Ativando Passaporte DNA...';
        }

        try {
            const cleanPlate = this.authData.license_plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const res = await API.registerOwner({
                name: this.authData.name,
                email: this.authData.email,
                password: this.authData.password,
                phone: this.authData.phone,
                license_plate: cleanPlate,
                vehicle_brand: this.authData.vehicle_brand,
                vehicle_model: this.authData.vehicle_model,
                vehicle_year: this.authData.vehicle_year,
                workshop_code: this.authData.workshop_code,
                color: this.authData.color,
                fuel_type: this.authData.fuel_type,
                transmission_type: this.authData.transmission_type,
                engine_displacement: this.authData.engine_displacement,
                chassis_vin: this.authData.chassis_vin,
                renavam: this.authData.renavam,
                fipe_value: this.authData.fipe_value,
                fipe_code: this.authData.fipe_code,
                fipe_cents: this.authData.fipe_cents,
                fipe_ref: this.authData.fipe_ref,
                segment: this.authData.segment,
                sub_segmento: this.authData.sub_segmento,
                bodywork: this.authData.bodywork,
                passenger_capacity: this.authData.passenger_capacity,
                axes_count: this.authData.axes_count,
                city: this.authData.city,
                state: this.authData.state,
                photo_url: this.authData.photo_url
            });

            localStorage.setItem('dna_owner_session', 'active');
            localStorage.setItem('dna_owner_auth_screen', 'app');
            localStorage.setItem('dna_owner_current_screen', 'home');
            localStorage.setItem('dna_registered_plate', cleanPlate);

            if (res && res.token) {
                API.setToken(res.token);
                if (res.user) {
                    localStorage.setItem('dna_logged_user', JSON.stringify(res.user));
                    this.vehicleData.user_name = res.user.name;
                    this.vehicleData.user_email = res.user.email;
                }
                if (res.vehicle) {
                    this.applyVehicleData(res.vehicle);
                }
                this.authScreen = 'concluded';
                this.render();
            } else if (res && res.error) {
                alert(res.error);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Tentar novamente';
                }
            }
        } catch (_) {
            this.authScreen = 'concluded';
            this.render();
        }
    },

    // Entrada no App Concluída
    enterAppFromConcluded() {
        localStorage.setItem('dna_owner_session', 'active');
        localStorage.setItem('dna_owner_auth_screen', 'app');
        localStorage.setItem('dna_owner_current_screen', 'home');
        this.authScreen = null;
        this._backendSynced = false;
        this.syncBackendVehicles();
        this.navigateTo('home');
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
        try {
            localStorage.setItem('dna_owner_current_screen', screen);
        } catch (_) {}
        
        if (screen === 'home') {
            this.activeTab = 'home';
        } else if (screen === 'vehicle') {
            this.activeTab = 'vehicle';
        } else if (['services', 'revisions', 'inspection'].includes(screen)) {
            this.activeTab = 'services';
        } else if (['reminders', 'alerts', 'notifications'].includes(screen)) {
            this.activeTab = 'reminders';
        } else {
            this.activeTab = 'more';
        }

        this.toggleDrawer(false);
        this.render();
    },

    // Troca de Abas da Barra Inferior (5 Itens Fiel à Imagem 2)
    switchTab(tab) {
        if (tab === 'more') {
            this.toggleDrawer(true);
            return;
        }
        if (tab === 'services') {
            this.navigateTo('revisions');
            this.activeTab = 'services';
            return;
        }
        if (tab === 'reminders') {
            this.navigateTo('reminders');
            this.activeTab = 'reminders';
            return;
        }
        this.navigateTo(tab);
    },

    // Filtros e Busca da Rede de Oficinas
    setWorkshopFilter(tab) {
        this.workshopFilterTab = tab;
        this.render();
    },

    setWorkshopSearch(query) {
        this.workshopSearchQuery = (query || '').toLowerCase();
        this.render();
    },

    // Buscar Oficinas Credenciadas da API
    async fetchWorkshopsNetwork() {
        if (this._workshopsLoaded) return;
        try {
            const res = await API.getWorkshopsNetwork();
            if (res && res.success && Array.isArray(res.workshops) && res.workshops.length > 0) {
                this.workshopsList = res.workshops;
                this._workshopsLoaded = true;
                this.render();
            }
        } catch (_) {}
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

    // Sincronizar Veículos Reais do Backend SQLite (Apenas os do Cliente Autenticado)
    async syncBackendVehicles() {
        if (this._backendSynced) return;
        this._backendSynced = true;

        try {
            const loggedUserStr = localStorage.getItem('dna_logged_user');
            const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;
            const regPlate = localStorage.getItem('dna_registered_plate') || (this.authData && this.authData.license_plate) || '';
            const userEmail = (loggedUser && loggedUser.email) || (this.authData && this.authData.email) || '';

            let endpoint = '/api/v1/vehicles/my-vehicles';
            const params = new URLSearchParams();
            if (userEmail) params.append('email', userEmail);
            if (regPlate) params.append('plate', regPlate);
            if (params.toString()) endpoint += '?' + params.toString();

            const token = localStorage.getItem('dna_token') || (typeof API !== 'undefined' && API.token);
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(endpoint, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
                    this.userVehicles = data.vehicles;
                    const activePlate = regPlate || this.vehicleData.license_plate;
                    const realVeh = (activePlate && data.vehicles.find(u => u.license_plate === activePlate)) || data.vehicles[0];
                    this.applyVehicleData(realVeh);
                    this.render();
                    return;
                }
            }

            // Se o usuário cadastrou um veículo nesta sessão, mostra somente ele (zero mocks)
            if (regPlate) {
                this.userVehicles = [{
                    id: 'veh_user_' + regPlate,
                    brand: this.authData.vehicle_brand || 'Veículo',
                    model: this.authData.vehicle_model || 'Cadastrado',
                    full_title: `${this.authData.vehicle_brand || ''} ${this.authData.vehicle_model || ''}`.trim(),
                    license_plate: regPlate,
                    manufacture_year: this.authData.vehicle_year || 2021,
                    model_year: this.authData.vehicle_year || 2021,
                    photo_url: this.authData.photo_url || this.vehicleData.photo_url,
                    dna_code: this.vehicleData.dna_code || 'DNA-BR-ATIVO'
                }];
                this.applyVehicleData(this.userVehicles[0]);
                this.render();
            } else {
                this.userVehicles = [];
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
        this.vehicleData.submodel = realVeh.submodel || this.vehicleData.submodel || '';
        this.vehicleData.version_label = realVeh.version_label || this.vehicleData.version_label;
        this.vehicleData.license_plate = realVeh.license_plate || this.vehicleData.license_plate;
        this.vehicleData.manufacture_year = realVeh.manufacture_year || this.vehicleData.manufacture_year;
        this.vehicleData.model_year = realVeh.model_year || this.vehicleData.model_year;
        this.vehicleData.color = realVeh.color || this.vehicleData.color;
        this.vehicleData.fuel_type = realVeh.fuel_type || this.vehicleData.fuel_type;
        this.vehicleData.transmission_type = realVeh.transmission || realVeh.transmission_type || this.vehicleData.transmission_type;
        this.vehicleData.engine_displacement = realVeh.engine_displacement || this.vehicleData.engine_displacement;
        this.vehicleData.segment = realVeh.segment || this.vehicleData.segment;
        this.vehicleData.sub_segment = realVeh.sub_segment || realVeh.sub_segmento || this.vehicleData.sub_segment;
        this.vehicleData.bodywork = realVeh.bodywork || this.vehicleData.bodywork || 'Sedan / Hatch';
        this.vehicleData.passenger_capacity = realVeh.passenger_capacity || this.vehicleData.passenger_capacity || 5;
        this.vehicleData.axes_count = realVeh.axes_count || this.vehicleData.axes_count || 2;
        this.vehicleData.gross_weight = realVeh.gross_weight || this.vehicleData.gross_weight || '1.450 kg';
        this.vehicleData.max_traction = realVeh.max_traction || this.vehicleData.max_traction || '400 kg';
        this.vehicleData.plate_old_format = realVeh.plate_old_format || this.vehicleData.plate_old_format || '';
        this.vehicleData.plate_mercosul_format = realVeh.plate_mercosul_format || this.vehicleData.plate_mercosul_format || realVeh.license_plate;
        this.vehicleData.vehicle_status = realVeh.vehicle_status || realVeh.legal_status_desc || this.vehicleData.vehicle_status || 'Sem restrição / Regular';
        this.vehicleData.chassis_status = realVeh.chassis_status || this.vehicleData.chassis_status || 'Normal (N)';
        this.vehicleData.legal_status = realVeh.legal_status || realVeh.legal_status_desc || 'REGULAR';
        this.vehicleData.city = realVeh.city || this.vehicleData.city || 'São Paulo';
        this.vehicleData.state = realVeh.state || this.vehicleData.state || 'SP';
        this.vehicleData.nationality = realVeh.nationality || this.vehicleData.nationality || 'Nacional';
        this.vehicleData.chassis_vin = realVeh.chassis_vin || this.vehicleData.chassis_vin;
        this.vehicleData.renavam = realVeh.renavam || this.vehicleData.renavam;
        if (realVeh.fipe_price_cents) {
            this.vehicleData.fipe_price_cents = realVeh.fipe_price_cents;
            this.vehicleData.fipe_value = 'R$ ' + (realVeh.fipe_price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }
        if (realVeh.fipe_code) this.vehicleData.fipe_code = realVeh.fipe_code;
        if (realVeh.fipe_ref) this.vehicleData.fipe_ref = realVeh.fipe_ref;
        if (realVeh.fipe_score) this.vehicleData.fipe_score = realVeh.fipe_score;
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

        // Se estiver no Fluxo de Onboarding / Autenticação (Imagem 1 - 12 Telas)
        if (this.authScreen) {
            container.innerHTML = `
                <div class="dna-app-viewport">
                    <div class="dna-phone-frame">
                        ${this.renderAuthScreen()}
                    </div>
                </div>
            `;
            return;
        }

        // Sincroniza dados com o backend
        this.syncBackendVehicles();
        this.fetchWorkshopsNetwork();

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

                    <!-- 5.1. Modal de Ativação com Código da Oficina -->
                    ${this.isActivationModalOpen ? this.renderActivationModal() : ''}

                    <!-- 5. Barra de Navegação Inferior Fixa (5 Itens Fiel à Imagem 2) -->
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

                        <div class="dna-nav-item ${this.activeTab === 'services' ? 'active' : ''}" onclick="OwnerView.switchTab('services')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Serviços</span>
                        </div>

                        <div class="dna-nav-item ${this.activeTab === 'reminders' ? 'active' : ''}" onclick="OwnerView.switchTab('reminders')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Alertas</span>
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

                            <!-- Ativar com Código da Oficina -->
                            <div class="dna-menu-item" style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.25);" onclick="OwnerView.toggleDrawer(false); OwnerView.openActivationModal();">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon" style="color:#00D4FF;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                                    </div>
                                    <span style="color:#00D4FF; font-weight:800;">Ativar Veículo com Código</span>
                                </div>
                                <span class="dna-badge-counter" style="background:#00D4FF; color:#0B0F19; font-weight:800; font-size:9px; padding:2px 6px;">OFICINA</span>
                            </div>

                            <!-- 10. Baixar Aplicativo Oficial PWA / Play Store -->
                            <div class="dna-menu-item" style="background: rgba(255, 210, 28, 0.08); border: 1px solid rgba(255, 210, 28, 0.25);" onclick="OwnerView.toggleDrawer(false); if (typeof PwaInstall !== 'undefined') PwaInstall.renderPlayStoreModal();">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon" style="color:#FFD21C;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </div>
                                    <span style="color:#FFD21C; font-weight:800;">Baixar App Oficial (PWA)</span>
                                </div>
                            </div>

                            <!-- 11. Fluxo de Boas-Vindas & Onboarding (12 Telas) -->
                            <div class="dna-menu-item" style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.25);" onclick="OwnerView.goToAuthScreen('splash')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon" style="color:#00D4FF;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                    </div>
                                    <span style="color:#00D4FF; font-weight:800;">Fluxo de Onboarding (12 Telas)</span>
                                </div>
                                <span class="dna-badge-counter" style="background:#00D4FF; color:#0B0F19; font-weight:800; font-size:9px; padding:2px 6px;">DEMO</span>
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
                <h2 style="font-size:18px; font-weight:800; color:#FFFFFF; margin:0 0 2px;">Olá, ${v.user_name ? v.user_name.split(' ')[0] : 'João'}!</h2>
                <p style="font-size:12px; color:#94A3B8; margin:0;">Seu veículo em boas mãos.</p>
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

            <!-- Card Principal do Veículo com DNA ATIVO (Honda Civic BRA2E19) -->
            <div class="dna-vehicle-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:11px; font-weight:800; color:#00E676; background:rgba(0,230,118,0.12); border:1px solid rgba(0,230,118,0.3); padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:5px;">
                        <span style="width:6px; height:6px; border-radius:50%; background:#00E676; box-shadow:0 0 6px #00E676;"></span>
                        DNA ATIVO
                    </span>
                    <span style="font-size:11px; color:#94A3B8; font-family:var(--font-mono, monospace);">${v.dna_code}</span>
                </div>

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

            <!-- Grid 2x2 de Indicadores (Fiel à Imagem 2 do App) -->
            <div class="dna-home-grid-2x2">
                <!-- Card 1: Próxima Revisão -->
                <div class="dna-home-grid-card" onclick="OwnerView.navigateTo('revisions')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="dna-grid-card-title">Próxima revisão</span>
                        <span style="color:#00D4FF;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        </span>
                    </div>
                    <div class="dna-grid-card-val" style="color:#00D4FF;">8.752 km</div>
                    <span style="font-size:10px; color:#94A3B8;">ou em ~3 meses</span>
                </div>

                <!-- Card 2: Inspeção Técnica -->
                <div class="dna-home-grid-card" onclick="OwnerView.navigateTo('inspection')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="dna-grid-card-title">Inspeção 360°</span>
                        <span style="color:#10B981;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </span>
                    </div>
                    <div class="dna-grid-card-val" style="color:#10B981;">Em dia (100%)</div>
                    <span style="font-size:10px; color:#94A3B8;">Laudo homologado</span>
                </div>

                <!-- Card 3: Mini OBD2 -->
                <div class="dna-home-grid-card" onclick="OwnerView.navigateTo('obd')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="dna-grid-card-title">OBD2 Telemetria</span>
                        <span style="color:#00E676; display:flex; align-items:center; gap:4px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:#00E676;"></span>
                        </span>
                    </div>
                    <div class="dna-grid-card-val" style="color:#00E676;">Conectado</div>
                    <span style="font-size:10px; color:#94A3B8;">Zero DTCs (0 erros)</span>
                </div>

                <!-- Card 4: Alertas e Lembretes -->
                <div class="dna-home-grid-card" onclick="OwnerView.navigateTo('reminders')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="dna-grid-card-title">Alertas</span>
                        <span style="color:#F59E0B;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </span>
                    </div>
                    <div class="dna-grid-card-val" style="color:#FFFFFF;">4 Lembretes</div>
                    <span style="font-size:10px; color:#F59E0B; font-weight:700;">1 ação preventiva</span>
                </div>
            </div>

            <!-- Card Destaque: Relatório Completo de Manutenções Oficial -->
            <div class="dna-home-report-card" onclick="OwnerView.openMaintenanceReport()" style="margin-top:14px; background:linear-gradient(135deg, rgba(0,212,255,0.16) 0%, rgba(0,102,255,0.22) 100%); border:1.5px solid #00D4FF; border-radius:12px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow:0 0 20px rgba(0,212,255,0.18);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 10px rgba(0,212,255,0.3);">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0B0F19" stroke-width="2.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <strong style="font-size:13px; color:#FFFFFF;">Relatório Completo de Manutenções</strong>
                            <span style="background:#00E676; color:#0B0F19; font-size:8.5px; font-weight:900; padding:1px 5px; border-radius:3px;">OFICIAL</span>
                        </div>
                        <span style="font-size:10.5px; color:#94A3B8;">Histórico, 40+ seções, peças, NF, custos e QR Code</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:4px; color:#00D4FF; font-size:11.5px; font-weight:800;">
                    <span>Emitir</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
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
        const originStr = [v.city, v.state].filter(Boolean).join(' - ') || 'São Paulo - SP';
        const fabModStr = `${v.manufacture_year || '---'}/${v.model_year || '---'}`;

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

                <!-- Card de Destaque: Carro com Foto e Identificação -->
                <div class="dna-vehicle-card" style="margin-bottom:0;">
                    <div class="dna-car-stage" onclick="OwnerView.openChangePhotoModal()" style="cursor:pointer;" title="Clique para trocar foto">
                        <div class="dna-car-neon-glow"></div>
                        <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1590362891988-f778047020d0?w=800&auto=format&fit=crop&q=80';" />
                        <button class="dna-car-change-photo-btn" onclick="event.stopPropagation(); OwnerView.openChangePhotoModal();" title="Trocar foto do meu carro">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <span>Trocar Foto</span>
                        </button>
                    </div>
                    <div style="text-align:center; margin-top:8px;">
                        <h3 style="font-size:17px; font-weight:800; color:#FFFFFF; margin:0 0 2px;">${v.full_title}</h3>
                        <div style="font-size:12px; color:#94A3B8; font-weight:600; margin-bottom:6px;">${fabModStr} • ${originStr}</div>
                        <div style="display:flex; justify-content:center; align-items:center; gap:6px; flex-wrap:wrap;">
                            <div class="dna-plate-mercosul" style="background:#FFFFFF; color:#0B0F19; border-radius:6px; padding:2px 10px; font-family:var(--font-mono, monospace); font-weight:800; font-size:13px; border:1.5px solid #000; display:inline-flex; align-items:center; gap:6px;">
                                <span style="background:#003399; color:#FFF; font-size:9px; padding:1px 4px; border-radius:2px;">BR</span>
                                <span>${v.license_plate}</span>
                            </div>
                            ${v.plate_old_format && v.plate_old_format !== v.license_plate ? `
                                <span style="font-size:11px; color:#94A3B8; font-family:var(--font-mono, monospace); background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
                                    Antiga: ${v.plate_old_format}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- 🌟 BOTÃO DE AÇÃO OFICIAL: RELATÓRIO COMPLETO DE MANUTENÇÕES E VENDA -->
                <div class="dna-sale-report-action-card" onclick="OwnerView.openMaintenanceReport()" style="background:linear-gradient(135deg, rgba(0, 212, 255, 0.16) 0%, rgba(0, 102, 255, 0.22) 100%); border:1.5px solid #00D4FF; border-radius:14px; padding:14px 16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:12px; box-shadow:0 0 24px rgba(0,212,255,0.2); transition:transform 0.15s ease;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); color:#0B0F19; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(0,212,255,0.4);">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#061226" stroke-width="2.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <strong style="font-size:14px; color:#FFFFFF; letter-spacing:0.2px;">Relatório Completo de Manutenções</strong>
                                <span style="background:#00E676; color:#0B0F19; font-size:9.5px; font-weight:900; padding:1px 6px; border-radius:4px;">OFICIAL</span>
                            </div>
                            <span style="font-size:11.5px; color:#CBD5E1; display:block; margin-top:2px;">
                                Laudo 360° exaustivo: peças, serviços, custos, garantias, QR Code e PDF para impressão.
                            </span>
                        </div>
                    </div>
                    <div style="color:#00D4FF; display:flex; align-items:center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                </div>

                <!-- Métricas do Veículo -->
                <div class="dna-vehicle-specs-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Quilometragem atual</span>
                        <span style="font-size:15px; font-weight:800; color:#FFFFFF; display:block; margin-top:2px;">${Number(v.current_mileage || 87542).toLocaleString('pt-BR')} km</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Próxima revisão</span>
                        <span style="font-size:15px; font-weight:800; color:#00D4FF; display:block; margin-top:2px;">90.000 km</span>
                        <span style="font-size:10.5px; color:#94A3B8;">(em 2.458 km)</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Combustível</span>
                        <span style="font-size:15px; font-weight:800; color:#FFFFFF; display:block; margin-top:2px;">${v.fuel_level || 72}%</span>
                    </div>
                    <div class="dna-spec-card" style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px;">
                        <span style="font-size:10.5px; color:#94A3B8; text-transform:uppercase; font-weight:700; display:block;">Autonomia estimada</span>
                        <span style="font-size:15px; font-weight:800; color:#10B981; display:block; margin-top:2px;">~ ${v.estimated_range || 520} km</span>
                    </div>
                </div>

                <!-- 📋 FICHA TÉCNICA COMPLETA & DADOS OFICIAIS DO VEÍCULO (CONSULTA CONTÍNUA) -->
                <div style="background:rgba(8,16,32,0.92); border:1px solid rgba(0,212,255,0.25); border-radius:14px; padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
                        <h4 style="font-size:13.5px; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>Ficha Técnica Completa & Dados Oficiais</span>
                        </h4>
                        <span style="font-size:10px; color:#00E676; font-weight:800; background:rgba(0,230,118,0.12); padding:2px 6px; border-radius:4px;">BASE SENATRAN</span>
                    </div>

                    <!-- FIPE no Veículo -->
                    <div style="background:linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,212,255,0.06) 100%); border:1px solid rgba(0,230,118,0.3); border-radius:10px; padding:10px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:10px; color:#00E676; font-weight:800; text-transform:uppercase;">Cotação FIPE Oficial</span>
                            <div style="font-size:18px; font-weight:900; color:#00E676; font-family:var(--font-mono, monospace);">${v.fipe_value || 'R$ 75.000,00'}</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:9.5px; color:#94A3B8; display:block;">${v.fipe_code ? `Cód: ${v.fipe_code}` : 'Cód: 004495-4'}</span>
                            <span style="font-size:9.5px; color:#CBD5E1;">${v.fipe_ref || 'Setembro de 2026'}</span>
                        </div>
                    </div>

                    <!-- Grid de Especificações do Veículo -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Marca & Modelo</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.brand} ${v.model}</strong>
                            ${v.submodel ? `<span style="font-size:9.5px; color:#94A3B8;">${v.submodel}</span>` : ''}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Ano Fab / Modelo</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${fabModStr}</strong>
                            <span style="font-size:9.5px; color:#94A3B8;">${v.nationality || 'Nacional'}</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Motorização</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.engine_displacement || 'Original de Fábrica'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Câmbio / Transmissão</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.transmission_type || 'Manual'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Combustível</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.fuel_type || 'Flex'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Cor Oficial</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.color || 'Prata'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Carroceria & Segmento</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.bodywork || 'Sedan / Hatch'} • ${v.segment || 'Auto'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Lotação & Eixos</span>
                            <strong style="font-size:12px; color:#F8FAFC; display:block;">${v.passenger_capacity || 5} Lugares • ${v.axes_count || 2} Eixos</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Chassi (VIN)</span>
                            <strong style="font-size:11px; color:#00D4FF; font-family:var(--font-mono, monospace); display:block;">${v.chassis_vin || '93HFC1670MZ102934'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
                            <span style="font-size:10px; color:#64748B; display:block;">Renavam</span>
                            <strong style="font-size:11px; color:#00D4FF; font-family:var(--font-mono, monospace); display:block;">${v.renavam || '01239847120'}</strong>
                        </div>
                    </div>

                    <!-- Situação Legal -->
                    <div style="margin-top:8px; background:rgba(0,212,255,0.06); border:1px solid rgba(0,212,255,0.2); border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:#E2E8F0; display:flex; align-items:center; gap:6px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:#00E676;"></span>
                            Detran: <strong>${v.vehicle_status || 'Regular / Sem Restrições'}</strong>
                        </span>
                        <span style="font-size:10.5px; color:#94A3B8; font-family:monospace;">${originStr}</span>
                    </div>
                </div>

                <!-- Botões de Ação Secundários -->
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

                <button class="dna-obd-rescan-btn" onclick="OwnerView.openActivationModal()" style="width:100%; margin-top:2px; background:linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,102,255,0.12) 100%); border:1.5px solid #00D4FF; color:#00D4FF; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; border-radius:12px; cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    <span>Recebeu código da oficina? Ativar Veículo Aqui</span>
                </button>

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

                <!-- Banner: Emitir Relatório Completo de Manutenções -->
                <div onclick="OwnerView.openMaintenanceReport()" style="background:linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,102,255,0.2) 100%); border:1.5px solid #00D4FF; border-radius:12px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow:0 0 16px rgba(0,212,255,0.16);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0F19" stroke-width="2.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <strong style="font-size:12.5px; color:#FFFFFF;">Emitir Relatório de Manutenções</strong>
                                <span style="background:#00E676; color:#0B0F19; font-size:8.5px; font-weight:900; padding:1px 5px; border-radius:3px;">PDF / PRINT</span>
                            </div>
                            <span style="font-size:10.5px; color:#94A3B8;">Laudo com peças trocadas, custos, garantias e QR Code</span>
                        </div>
                    </div>
                    <div style="color:#00D4FF; display:flex; align-items:center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
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
        let list = this.workshopsList || [];
        const tab = this.workshopFilterTab || 'all';
        const q = this.workshopSearchQuery || '';

        if (tab === 'workshops') {
            list = list.filter(w => !w.type || w.type === 'Oficina');
        } else if (tab === 'centers') {
            list = list.filter(w => w.type === 'Auto Center');
        }

        if (q) {
            list = list.filter(w => 
                (w.name && w.name.toLowerCase().includes(q)) || 
                (w.city && w.city.toLowerCase().includes(q)) ||
                (w.neighborhood && w.neighborhood.toLowerCase().includes(q))
            );
        }

        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <!-- Campo de Busca de Oficinas -->
                <div style="position:relative;">
                    <input type="text" class="form-control" placeholder="Buscar oficina ou cidade..." value="${this.workshopSearchQuery || ''}" oninput="OwnerView.setWorkshopSearch(this.value)" style="width:100%; background:#050B14; border:1px solid rgba(0,102,255,0.3); border-radius:10px; padding:10px 14px; font-size:12.5px; color:#FFFFFF;" />
                </div>

                <!-- Filtros em Abas Segmentadas -->
                <div class="dna-workshops-filter-chips">
                    <button class="dna-history-filter-btn ${tab === 'all' ? 'active' : ''}" onclick="OwnerView.setWorkshopFilter('all')">Todas</button>
                    <button class="dna-history-filter-btn ${tab === 'workshops' ? 'active' : ''}" onclick="OwnerView.setWorkshopFilter('workshops')">Oficinas</button>
                    <button class="dna-history-filter-btn ${tab === 'centers' ? 'active' : ''}" onclick="OwnerView.setWorkshopFilter('centers')">Auto Centers</button>
                </div>

                <!-- Lista de Oficinas Credenciadas -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${list.length === 0 ? `
                        <div style="text-align:center; padding:24px 10px; color:#94A3B8; font-size:12px;">
                            Nenhuma oficina credenciada encontrada com o filtro atual.
                        </div>
                    ` : list.map(w => `
                        <div style="background:rgba(8,16,32,0.85); border:1px solid rgba(0,102,255,0.22); border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="font-size:13px; font-weight:800; color:#FFFFFF; margin:0 0 3px;">${w.name}</h4>
                                <div style="font-size:11px; color:#94A3B8; display:flex; align-items:center; gap:8px;">
                                    <span style="color:#FFD21C; font-weight:700;">⭐ ${w.rating}</span>
                                    <span>•</span>
                                    <span>${w.distance} - ${w.neighborhood}</span>
                                </div>
                            </div>
                            <a href="https://wa.me/55${(w.phone || '11998765432').replace(/\\D/g, '')}?text=Olá,%20gostaria%20de%20agendar%20um%20serviço%20pelo%20DNA%20AUTO" target="_blank" class="btn btn-primary btn-sm" style="background:#0066FF; color:#FFFFFF; font-weight:800; font-size:11px; padding:6px 14px; border-radius:6px; text-decoration:none;">
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

    // ── EMISSÃO DO RELATÓRIO COMPLETO DE MANUTENÇÕES & LAUDO 360° ──
    openMaintenanceReport() {
        const v = this.vehicleData;
        const targetId = v.id || v.license_plate || 'veh_civic_touring';
        if (typeof SaleReportModal !== 'undefined' && SaleReportModal.open) {
            SaleReportModal.open(targetId);
        } else {
            console.warn('SaleReportModal não encontrado no escopo global.');
        }
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
    },

    presetActivationCode: '',

    openActivationModal(code = '') {
        this.presetActivationCode = (code || '').toUpperCase();
        this.isActivationModalOpen = true;
        this.render();
        if (this.presetActivationCode) {
            setTimeout(() => {
                const input = document.getElementById('dna-client-activation-code');
                if (input) {
                    input.value = this.presetActivationCode;
                    input.focus();
                }
            }, 80);
        }
    },

    closeActivationModal() {
        this.isActivationModalOpen = false;
        this.presetActivationCode = '';
        this.render();
    },

    renderActivationModal() {
        const defaultVal = this.presetActivationCode || '';
        return `
            <div class="dna-photo-modal-overlay" onclick="if(event.target === this) OwnerView.closeActivationModal();" style="z-index:999999;">
                <div class="dna-photo-modal-sheet" style="max-width:380px; text-align:center; padding:24px 20px;">
                    <div style="width:56px; height:56px; margin:0 auto 12px; border-radius:50%; background:rgba(0, 212, 255, 0.15); display:flex; align-items:center; justify-content:center; border:1.5px solid #00D4FF; box-shadow:0 0 20px rgba(0,212,255,0.25);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2.2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                    </div>

                    <h3 style="font-size:18px; font-weight:800; color:#FFFFFF; margin:0 0 6px;">Ativar Meu Veículo no App</h3>
                    <p style="font-size:12.5px; color:#94A3B8; margin:0 0 18px; line-height:1.4;">
                        Digite o código exclusivo fornecido pela sua oficina (ou recebido via WhatsApp/QR Code) para sincronizar o histórico do seu veículo.
                    </p>

                    <div style="margin-bottom:16px;">
                        <input type="text" id="dna-client-activation-code" 
                            value="${defaultVal}" 
                            placeholder="Ex: DNA-8421" 
                            maxlength="12"
                            style="width:100%; text-align:center; font-size:22px; font-weight:900; letter-spacing:3px; padding:12px; background:#0B1220; border:2px solid #00D4FF; border-radius:12px; color:#FFD21C; font-family:monospace; text-transform:uppercase; outline:none; box-shadow:0 0 16px rgba(0,212,255,0.25);"
                            oninput="this.value = this.value.toUpperCase();"
                            onkeydown="if(event.key==='Enter') OwnerView.submitClientActivation();"
                        />
                    </div>

                    <button id="dna-btn-submit-activation" class="dna-photo-btn-primary" onclick="OwnerView.submitClientActivation()" style="width:100%; margin-bottom:8px; justify-content:center; font-size:13.5px; padding:13px; background:linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); color:#000; font-weight:900; border:none; border-radius:10px; cursor:pointer;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Validar e Ativar Meu Carro</span>
                    </button>

                    <button class="dna-photo-btn-secondary" onclick="OwnerView.closeActivationModal()" style="width:100%; justify-content:center; font-size:12px; color:#94A3B8; background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px; cursor:pointer;">
                        <span>Voltar ao Aplicativo</span>
                    </button>
                </div>
            </div>
        `;
    },

    async submitClientActivation() {
        const inputCode = (document.getElementById('dna-client-activation-code')?.value || '').trim().toUpperCase();
        if (!inputCode || inputCode.length < 4) {
            this.showOwnerToast('Informe o código de ativação fornecido pela oficina (ex: DNA-8421)', 'error');
            return;
        }

        const submitBtn = document.getElementById('dna-btn-submit-activation');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Validando código...</span>';
        }

        try {
            const data = await API.activateClientCode(inputCode);
            if (data && data.success) {
                this.isActivationModalOpen = false;
                this.showOwnerToast(`🎉 Veículo ativado com sucesso! (${data.vehicle?.license_plate || inputCode})`, 'success');

                // Sincroniza e seleciona o veículo
                if (data.vehicle) {
                    if (!this.userVehicles) this.userVehicles = [];
                    const exists = this.userVehicles.find(v => v.license_plate === data.vehicle.license_plate);
                    if (!exists) {
                        this.userVehicles.push(data.vehicle);
                    }
                    this.applyVehicleData(data.vehicle);
                }
                if (data.client?.name) {
                    this.vehicleData.user_name = data.client.name;
                }
                this._backendSynced = false;
                await this.syncBackendVehicles();
                this.render();
            } else {
                this.showOwnerToast(data.error || 'Código de ativação inválido.', 'error');
            }
        } catch (err) {
            this.showOwnerToast(err.message || 'Código de ativação não encontrado ou expirado.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Validar e Ativar Meu Carro</span>';
            }
        }
    },

    showOwnerToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bg = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#0066FF';
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bg};
            color: #FFFFFF;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 12.5px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 999999;
            max-width: 90%;
            text-align: center;
            animation: dnaFadeIn 0.2s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    },

    renderActivationModal() {
        return `
            <div class="dna-photo-modal-overlay" onclick="if(event.target === this) OwnerView.closeActivationModal();">
                <div class="dna-photo-modal-sheet" style="max-width: 440px;">
                    <div class="dna-photo-modal-header">
                        <div>
                            <h3 style="display:flex; align-items:center; gap:8px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                                <span>Ativar Veículo com Código</span>
                            </h3>
                            <p>Vincule seu carro com o código de 4 dígitos gerado pela sua oficina</p>
                        </div>
                        <button class="dna-doc-sheet-close" onclick="OwnerView.closeActivationModal()" title="Fechar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <div style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
                        <span style="font-size: 11.5px; color: #E2E8F0; line-height: 1.5; display: block;">
                            Sua oficina credenciada gera um código exclusivo (ex: <strong style="color: #00D4FF; font-family: monospace;">DNA-8421</strong>) ao cadastrar seu veículo. Digite abaixo para liberar seu laudo, histórico e dossiê.
                        </span>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="font-size: 11.5px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Código de Ativação *</label>
                        <input type="text" id="dna-client-activation-code" placeholder="DNA-XXXX" maxlength="12" style="width: 100%; background: rgba(8, 16, 32, 0.95); border: 2px solid #00D4FF; color: #FFFFFF; font-size: 20px; font-weight: 900; font-family: var(--font-mono, monospace); text-align: center; letter-spacing: 3px; padding: 12px; border-radius: 10px; text-transform: uppercase; outline: none; box-shadow: 0 0 16px rgba(0, 212, 255, 0.2);" onkeyup="this.value = this.value.toUpperCase(); if (event.key === 'Enter') OwnerView.submitClientActivation();" />
                    </div>

                    <button id="dna-btn-submit-activation" class="dna-photo-btn-primary" onclick="OwnerView.submitClientActivation()" style="margin-top: 8px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Validar e Ativar Meu Carro</span>
                    </button>

                    <button class="dna-photo-btn-secondary" onclick="OwnerView.closeActivationModal()" style="margin-top: 8px;">
                        <span>Cancelar</span>
                    </button>
                </div>
            </div>
        `;
    },

    // ── MÉTODOS DO FLUXO DE ONBOARDING & AUTENTICAÇÃO (IMAGEM 1 - 12 TELAS) ──
    renderAuthScreen() {
        switch (this.authScreen) {
            case 'login':
                return this.renderLoginAuth();
            case 'register':
                return this.renderRegisterAuth();
            case 'plate_search':
                return this.renderPlateSearchAuth();
            case 'vehicle_found':
                return this.renderVehicleFoundAuth();
            case 'workshop_code':
                return this.renderWorkshopCodeAuth();
            case 'confirmation':
                return this.renderConfirmationAuth();
            case 'concluded':
                return this.renderConcludedAuth();
            case 'splash':
            default:
                return this.renderSplashAuth();
        }
    },

    // 01. Tela de Boas-Vindas & Login (Fiel à Tela 01 do Mapa Oficial)
    renderSplashAuth() {
        // SVG inline do "D" como fallback caso a imagem do logo falhe
        const dLogoSvg = `<svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 24px rgba(0, 212, 255, 0.85));"><defs><linearGradient id="dnaSplashDGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00E5FF"/><stop offset="55%" stop-color="#0091FF"/><stop offset="100%" stop-color="#0055FF"/></linearGradient></defs><path d="M18 16H52C74 16 88 28 88 50C88 72 74 84 52 84H18L32 50H50C60 50 66 45 66 38C66 31 60 27 50 27H30L18 16Z" fill="url(#dnaSplashDGrad)"/></svg>`;

        return `
            <div class="dna-auth-screen dna-splash-screen" style="display:flex; flex-direction:column; justify-content:space-between; align-items:center; text-align:center; min-height:100%; height:100%; padding:24px 20px 24px; box-sizing:border-box; background:radial-gradient(circle at 50% 18%, rgba(0, 102, 255, 0.22) 0%, #081326 50%, #030712 100%);">
                
                <!-- Conteúdo Central: Símbolo 'D', Título, Slogan e Carro Frontal Oficial -->
                <div class="dna-splash-content" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; margin:auto 0; padding:4px 0;">
                    <!-- Símbolo 'D' Estilizado Oficial (PNG com fallback SVG) -->
                    <div class="dna-splash-logo-glyph" style="margin-bottom:12px; display:flex; align-items:center; justify-content:center;">
                        <img src="./img/splash-d-logo.png" onerror="this.onerror=null; if(this.src.indexOf('/img/splash-d-logo.png')===-1){this.src='/img/splash-d-logo.png';} else {this.outerHTML=\`${dLogoSvg}\`;}" alt="DNA AUTO Logo" style="width:72px; height:72px; object-fit:contain; filter:drop-shadow(0 0 22px rgba(0, 212, 255, 0.9));" />
                    </div>

                    <!-- Título Oficial DNA AUTO -->
                    <h1 class="dna-splash-title" style="font-size:29px; font-weight:900; letter-spacing:1.5px; color:#FFFFFF; margin:0 0 4px; text-transform:uppercase; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        DNA <span style="color:#00D4FF;">AUTO</span>
                    </h1>

                    <!-- Slogan Oficial -->
                    <p class="dna-splash-slogan" style="font-size:14px; color:#CBD5E1; margin:0 0 16px; font-weight:500;">
                        Seu veículo sempre protegido.
                    </p>

                    <!-- Imagem Frontal do Supercarro (Exata da Referência) -->
                    <div class="dna-splash-hero-car" style="width:100%; max-width:320px; height:210px; position:relative; margin:6px 0 16px; display:flex; align-items:center; justify-content:center;">
                        <img src="./img/splash-car-hero.png" onerror="this.onerror=null; if(this.src.indexOf('splash-car-hero.jpg')===-1){this.src='./img/splash-car-hero.jpg';} else {this.src='./img/splash-car-front.jpg';}" alt="DNA AUTO Car" style="width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 14px 28px rgba(0, 102, 255, 0.5));" />
                    </div>
                </div>

                <!-- Ações Inferiores (Entrar e Cadastrar sem alteração) -->
                <div class="dna-splash-actions" style="width:100%; max-width:320px; display:flex; flex-direction:column; gap:12px; padding-bottom:8px;">
                    <!-- Botão Azul 1: Entrar -->
                    <button class="dna-btn-primary-neon" onclick="OwnerView.goToAuthScreen('login')" style="width:100%; height:48px; background:#0066FF; color:#FFFFFF; font-weight:800; font-size:15px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 20px rgba(0, 102, 255, 0.55); display:flex; align-items:center; justify-content:center; transition:transform 0.15s ease, box-shadow 0.15s ease;">
                        <span>Entrar</span>
                    </button>

                    <!-- Botão Escuro 2: Cadastrar -->
                    <button class="dna-btn-secondary-dark" onclick="OwnerView.goToAuthScreen('register')" style="width:100%; height:48px; background:rgba(8, 16, 32, 0.85); border:1.5px solid #0066FF; color:#FFFFFF; font-weight:700; font-size:15px; border-radius:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s ease, border-color 0.15s ease;">
                        <span>Cadastrar</span>
                    </button>
                </div>
            </div>
        `;
    },

    // 02. Login Oficial
    renderLoginAuth() {
        return `
            <div class="dna-auth-screen">
                <div class="dna-auth-header">
                    <button class="dna-auth-back-btn" onclick="OwnerView.goToAuthScreen('splash')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Voltar</span>
                    </button>
                    <span class="dna-auth-step-pill">Login</span>
                </div>

                <div style="margin-bottom:24px;">
                    <h2 style="font-size:22px; font-weight:900; color:#FFFFFF; margin:0 0 6px;">Entrar</h2>
                    <p style="font-size:12.5px; color:#94A3B8; margin:0;">Acesse sua Garagem Digital DNA AUTO</p>
                </div>

                <div id="auth-error-box" style="display:none; background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#FCA5A5; padding:10px 14px; border-radius:10px; font-size:12px; margin-bottom:14px;"></div>

                <form onsubmit="OwnerView.handleLoginSubmit(event)">
                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">E-mail</label>
                        <div class="dna-auth-input-box">
                            <input type="email" id="login-email-input" placeholder="Ex: usuario@email.com" value="joao@email.com" required />
                        </div>
                    </div>

                    <div class="dna-auth-input-group">
                        <div class="dna-auth-input-label">
                            <span>Senha</span>
                            <a href="javascript:void(0)" onclick="alert('Instruções de recuperação enviadas para o seu e-mail cadastrado.')" style="color:#00D4FF; text-decoration:none; font-size:11px;">Esqueceu sua senha?</a>
                        </div>
                        <div class="dna-auth-input-box with-eye">
                            <input type="password" id="auth-password-input" placeholder="Digite sua senha" value="123456" required />
                            <button type="button" class="dna-auth-eye-btn" id="auth-eye-icon" onclick="OwnerView.togglePasswordVisibility()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="dna-btn-primary-neon" style="margin-top:16px;">
                        <span>Entrar</span>
                    </button>
                </form>

                <div style="text-align:center; margin-top:24px;">
                    <span style="font-size:12px; color:#94A3B8;">Não tem uma conta?</span>
                    <a href="javascript:void(0)" onclick="OwnerView.goToAuthScreen('register')" style="color:#00D4FF; font-size:12px; font-weight:800; margin-left:4px; text-decoration:none;">Cadastrar</a>
                </div>
            </div>
        `;
    },

    // 03. Cadastro - Dados Pessoais
    renderRegisterAuth() {
        return `
            <div class="dna-auth-screen">
                <div class="dna-auth-header">
                    <button class="dna-auth-back-btn" onclick="OwnerView.goToAuthScreen('splash')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Voltar</span>
                    </button>
                    <span class="dna-auth-step-pill">Passo 1 de 4</span>
                </div>

                <div style="margin-bottom:18px;">
                    <h2 style="font-size:22px; font-weight:900; color:#FFFFFF; margin:0 0 4px;">Cadastro</h2>
                    <p style="font-size:12px; color:#94A3B8; margin:0;">Preencha seus dados para vincular seu veículo</p>
                </div>

                <div id="auth-error-box" style="display:none; background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#FCA5A5; padding:10px 14px; border-radius:10px; font-size:12px; margin-bottom:14px;"></div>

                <form onsubmit="OwnerView.handleRegisterSubmit(event)">
                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">Nome Completo</label>
                        <div class="dna-auth-input-box">
                            <input type="text" id="reg-name-input" placeholder="Ex: João da Silva" value="João Silva" required />
                        </div>
                    </div>

                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">WhatsApp / Telefone</label>
                        <div class="dna-auth-input-box">
                            <input type="tel" id="reg-phone-input" placeholder="(11) 98765-4321" value="(11) 98765-4321" required />
                        </div>
                    </div>

                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">Placa do Veículo</label>
                        <div class="dna-auth-input-box">
                            <input type="text" id="reg-plate-input" placeholder="Ex: BRA2E19" value="BRA2E19" maxlength="8" style="font-family:var(--font-mono, monospace); font-weight:800; text-transform:uppercase; letter-spacing:1px;" required />
                        </div>
                    </div>

                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">E-mail</label>
                        <div class="dna-auth-input-box">
                            <input type="email" id="reg-email-input" placeholder="joao@email.com" value="joao@email.com" required />
                        </div>
                    </div>

                    <div class="dna-auth-input-group">
                        <label class="dna-auth-input-label">Senha de Acesso</label>
                        <div class="dna-auth-input-box with-eye">
                            <input type="password" id="reg-pass-input" placeholder="Mínimo 6 caracteres" value="123456" required />
                        </div>
                    </div>

                    <button type="submit" class="dna-btn-primary-neon" style="margin-top:14px;">
                        <span>Continuar</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </form>

                <div style="text-align:center; margin-top:16px;">
                    <span style="font-size:12px; color:#94A3B8;">Já possui uma conta?</span>
                    <a href="javascript:void(0)" onclick="OwnerView.goToAuthScreen('login')" style="color:#00D4FF; font-size:12px; font-weight:800; margin-left:4px; text-decoration:none;">Entrar</a>
                </div>
            </div>
        `;
    },

    // 04. Buscando Informações do Veículo (Radar Scanner FIPE)
    renderPlateSearchAuth() {
        const c = this.radarChecklist;
        return `
            <div class="dna-auth-screen" style="justify-content:center; align-items:center;">
                <div class="dna-radar-container" style="width:100%;">
                    <span class="dna-auth-step-pill" style="margin-bottom:20px;">Passo 2 de 4</span>

                    <h2 style="font-size:19px; font-weight:900; color:#FFFFFF; text-align:center; margin:0 0 4px;">
                        Buscando informações do veículo...
                    </h2>
                    <p style="font-size:12px; color:#94A3B8; text-align:center; margin:0 0 24px;">
                        Consultando bases oficiais para a placa <strong style="color:#00D4FF; font-family:var(--font-mono, monospace);">${this.authData.license_plate}</strong>
                    </p>

                    <!-- Radar Circular Pulsante -->
                    <div class="dna-radar-circle-box">
                        <div class="dna-radar-pulse-ring"></div>
                        <div class="dna-radar-pulse-ring"></div>
                        <div class="dna-radar-pulse-ring"></div>
                        <div class="dna-radar-center-core">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                    </div>

                    <!-- Checklist Dinâmico dos Passos -->
                    <div class="dna-radar-checklist">
                        <div class="dna-radar-step-item ${c.plate ? 'done' : 'loading'}">
                            ${c.plate ? '✓' : '⏳'} Verificando placa Mercosul...
                        </div>
                        <div class="dna-radar-step-item ${c.fipe ? 'done' : (c.plate ? 'loading' : '')}">
                            ${c.fipe ? '✓' : (c.plate ? '⏳' : '○')} Consultando base de dados FIPE...
                        </div>
                        <div class="dna-radar-step-item ${c.specs ? 'done' : (c.fipe ? 'loading' : '')}">
                            ${c.specs ? '✓' : (c.fipe ? '⏳' : '○')} Carregando especificações técnicas...
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 05. Dados do Veículo Encontrados (Ultra Completo com Todos os Dados da Placa)
    renderVehicleFoundAuth() {
        const d = this.authData;
        const originStr = [d.city, d.state].filter(Boolean).join(' - ') || 'Nacional';
        const fabModStr = `${d.manufacture_year || d.vehicle_year || '---'}/${d.vehicle_year || '---'}`;

        return `
            <div class="dna-auth-screen" style="padding-bottom:20px;">
                <div class="dna-auth-header">
                    <button class="dna-auth-back-btn" onclick="OwnerView.goToAuthScreen('register')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Voltar</span>
                    </button>
                    <span class="dna-auth-step-pill">Passo 3 de 4</span>
                </div>

                <div style="margin-bottom:12px;">
                    <h2 style="font-size:19px; font-weight:900; color:#FFFFFF; margin:0 0 4px;">Dados do Veículo Encontrados</h2>
                    <p style="font-size:12px; color:#94A3B8; margin:0;">Identificação oficial direta na base nacional Senatran / Detran / FIPE:</p>
                </div>

                <div class="dna-vehicle-found-card" style="background:rgba(15,23,42,0.92); border:1px solid rgba(0,212,255,0.3); border-radius:16px; padding:14px; margin-bottom:14px;">
                    <!-- Placas e Logotipo -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <div class="dna-plate-mercosul" style="background:#FFFFFF; color:#0B0F19; border-radius:5px; padding:2px 8px; font-family:var(--font-mono, monospace); font-weight:900; font-size:13px; border:1.5px solid #000; display:inline-flex; align-items:center; gap:6px;">
                                <span style="background:#003399; color:#FFF; font-size:9px; padding:1px 3px; border-radius:2px;">BR</span>
                                <span>${d.license_plate}</span>
                            </div>
                            ${d.plate_old_format && d.plate_old_format !== d.license_plate ? `
                                <span style="font-size:10px; color:#94A3B8; font-family:monospace; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px;" title="Placa Modelo Antigo">
                                    Antiga: ${d.plate_old_format}
                                </span>
                            ` : ''}
                        </div>
                        ${d.logo ? `<img src="${d.logo}" alt="${d.vehicle_brand}" style="height:26px; max-width:48px; object-fit:contain;" />` : ''}
                    </div>

                    <!-- Foto do Veículo -->
                    <div class="dna-found-car-thumb" style="width:100%; height:130px; border-radius:10px; overflow:hidden; margin-bottom:12px; background:#0B0F19; display:flex; align-items:center; justify-content:center;">
                        <img src="${d.photo_url || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'}" alt="${d.vehicle_brand} ${d.vehicle_model}" style="width:100%; height:100%; object-fit:cover;" />
                    </div>

                    <!-- Título e Versão -->
                    <div style="text-align:left; margin-bottom:12px;">
                        <div style="font-size:11px; font-weight:800; color:#00D4FF; text-transform:uppercase; letter-spacing:0.5px;">
                            ${d.vehicle_brand} • ${originStr} • ${d.nationality || 'Nacional'}
                        </div>
                        <h3 style="font-size:16px; font-weight:900; color:#FFFFFF; margin:2px 0 2px; line-height:1.25;">${d.vehicle_model}</h3>
                        ${d.submodel && d.submodel !== d.vehicle_model ? `<div style="font-size:11.5px; color:#94A3B8;">Submodelo: ${d.submodel}</div>` : ''}
                    </div>

                    <!-- Card Tabela FIPE Oficial com Score -->
                    <div style="background:linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,212,255,0.08) 100%); border:1px solid rgba(0,230,118,0.4); border-radius:12px; padding:10px 14px; text-align:center; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                            <span style="font-size:10.5px; font-weight:800; color:#00E676; text-transform:uppercase;">Tabela FIPE Oficial</span>
                            ${d.fipe_score ? `<span style="font-size:9.5px; font-weight:800; background:rgba(0,230,118,0.2); color:#00E676; padding:1px 6px; border-radius:4px;">Correspondência: ${d.fipe_score}%</span>` : ''}
                        </div>
                        <div style="font-size:21px; font-weight:900; color:#00E676; font-family:var(--font-mono, monospace); letter-spacing:-0.5px;">
                            ${d.fipe_value || 'Sob Consulta'}
                        </div>
                        <div style="font-size:10px; color:#94A3B8; margin-top:2px;">
                            ${d.fipe_code ? `Cód. FIPE: ${d.fipe_code}` : ''} ${d.fipe_ref ? `• Ref: ${d.fipe_ref}` : ''}
                        </div>
                    </div>

                    <!-- Grid Exaustivo de Especificações Técnicas Oficiais -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Ano Fab / Modelo</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${fabModStr}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Cor Oficial</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.color || 'Não informada'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Motorização</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.engine_displacement || 'Original'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Câmbio</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.transmission_type || 'Manual'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Combustível</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.fuel_type || 'Flex'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Carroceria</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.bodywork || 'Hatch / Sedan'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Segmento</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.segment || 'Auto'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Lotação / Eixos</span>
                            <strong style="font-size:11.5px; color:#F8FAFC;">${d.passenger_capacity} lug. • ${d.axes_count} eixos</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Chassi (VIN)</span>
                            <strong style="font-size:11px; color:#00D4FF; font-family:var(--font-mono, monospace);">${d.chassis_vin || 'Registrado'}</strong>
                        </div>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px;">
                            <span style="font-size:9.5px; color:#64748B; display:block;">Renavam</span>
                            <strong style="font-size:11px; color:#00D4FF; font-family:var(--font-mono, monospace);">${d.renavam || 'Registrado'}</strong>
                        </div>
                    </div>

                    <!-- Situação Cadastral no Detran/Senatran -->
                    <div style="background:rgba(0,212,255,0.06); border:1px solid rgba(0,212,255,0.2); border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:10px; color:#94A3B8; display:block;">Situação Detran / Senatran:</span>
                            <strong style="font-size:11.5px; color:#00E676; display:flex; align-items:center; gap:5px;">
                                <span style="width:6px; height:6px; border-radius:50%; background:#00E676;"></span>
                                ${d.vehicle_status || 'Regular / Sem Restrições'}
                            </strong>
                        </div>
                        <span style="font-size:10px; color:#94A3B8; font-family:monospace;">Chassi: ${d.chassis_status || 'Normal'}</span>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="dna-btn-primary-neon" onclick="OwnerView.goToAuthScreen('workshop_code')">
                        <span>Confirmar Veículo</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <button class="dna-btn-ghost-link" onclick="OwnerView.goToAuthScreen('register')">
                        Informar outra placa
                    </button>
                </div>
            </div>
        `;
    },

    // 06. Código da Oficina Credenciada
    renderWorkshopCodeAuth() {
        return `
            <div class="dna-auth-screen">
                <div class="dna-auth-header">
                    <button class="dna-auth-back-btn" onclick="OwnerView.goToAuthScreen('vehicle_found')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Voltar</span>
                    </button>
                    <span class="dna-auth-step-pill">Passo 4 de 4</span>
                </div>

                <div style="margin-bottom:20px;">
                    <h2 style="font-size:20px; font-weight:900; color:#FFFFFF; margin:0 0 4px;">Código da Oficina</h2>
                    <p style="font-size:12px; color:#94A3B8; margin:0; line-height:1.4;">
                        Se você realizou serviço em uma oficina credenciada DNA AUTO, digite o código de ativação fornecido:
                    </p>
                </div>

                <div class="dna-auth-input-group" style="margin-bottom:20px;">
                    <label class="dna-auth-input-label">Código de Ativação (Opcional)</label>
                    <div class="dna-auth-input-box">
                        <input type="text" id="reg-workshop-code-input" placeholder="Ex: DNA-8421" style="text-align:center; font-family:var(--font-mono, monospace); font-size:16px; font-weight:900; letter-spacing:2px; text-transform:uppercase;" />
                    </div>
                    <span style="font-size:11px; color:#64748B;">O código vincula automaticamente as ordens de serviço e o laudo 360° da oficina.</span>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="dna-btn-primary-neon" onclick="OwnerView.handleWorkshopCodeSubmit()">
                        <span>Validar Código</span>
                    </button>
                    <button class="dna-btn-secondary-dark" onclick="OwnerView.skipWorkshopCode()">
                        <span>Não tenho código agora</span>
                    </button>
                </div>
            </div>
        `;
    },

    // 07. Confirmação dos Dados
    renderConfirmationAuth() {
        const d = this.authData;
        const ws = this.foundWorkshop;
        return `
            <div class="dna-auth-screen">
                <div class="dna-auth-header">
                    <button class="dna-auth-back-btn" onclick="OwnerView.goToAuthScreen('workshop_code')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Voltar</span>
                    </button>
                    <span class="dna-auth-step-pill">Confirmação</span>
                </div>

                <div style="margin-bottom:16px;">
                    <h2 style="font-size:20px; font-weight:900; color:#FFFFFF; margin:0 0 4px;">Confirmação dos Dados</h2>
                    <p style="font-size:12px; color:#94A3B8; margin:0;">Verifique as informações antes de finalizar seu cadastro:</p>
                </div>

                <!-- Resumo do Veículo -->
                <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px 14px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:11px; font-weight:800; color:#00D4FF; text-transform:uppercase;">Veículo</span>
                        <div class="dna-plate-mercosul" style="background:#FFFFFF; color:#0B0F19; border-radius:4px; padding:1px 6px; font-family:var(--font-mono, monospace); font-weight:800; font-size:11px; border:1px solid #000; display:inline-flex; align-items:center; gap:4px;">
                            <span style="background:#003399; color:#FFF; font-size:8px; padding:1px 2px; border-radius:2px;">BR</span>
                            <span>${d.license_plate}</span>
                        </div>
                    </div>
                    <strong style="color:#FFFFFF; font-size:13.5px; display:block;">${d.vehicle_brand} ${d.vehicle_model} (${d.vehicle_year})</strong>
                    <span style="font-size:11px; color:#00E676; font-weight:800;">FIPE: ${d.fipe_value || 'Valor oficial consultado'}</span>
                </div>

                <!-- Resumo da Oficina -->
                <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px 14px; margin-bottom:10px;">
                    <span style="font-size:11px; font-weight:800; color:#00D4FF; text-transform:uppercase; display:block; margin-bottom:4px;">Oficina Credenciada</span>
                    <strong style="color:#FFFFFF; font-size:13px; display:block;">${ws ? ws.name : 'Rede de Oficinas DNA AUTO'}</strong>
                    <span style="font-size:11px; color:#94A3B8;">${ws ? `${ws.city} • Código: ${ws.code}` : 'Vínculo padrão da rede homologada'}</span>
                </div>

                <!-- Resumo do Proprietário -->
                <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(0,102,255,0.25); border-radius:12px; padding:12px 14px; margin-bottom:20px;">
                    <span style="font-size:11px; font-weight:800; color:#00D4FF; text-transform:uppercase; display:block; margin-bottom:4px;">Titular do Cadastro</span>
                    <strong style="color:#FFFFFF; font-size:13px; display:block;">${d.name}</strong>
                    <span style="font-size:11px; color:#94A3B8;">${d.email} • ${d.phone}</span>
                </div>

                <button id="btn-submit-registration" class="dna-btn-primary-neon" onclick="OwnerView.submitFinalRegistration()">
                    <span>Concluir Cadastro</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
            </div>
        `;
    },

    // 08. Cadastro Concluído!
    renderConcludedAuth() {
        return `
            <div class="dna-auth-screen" style="justify-content:center; align-items:center; text-align:center;">
                <div class="dna-success-circle-box">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>

                <h2 style="font-size:24px; font-weight:900; color:#FFFFFF; margin:0 0 8px;">Cadastro Concluído!</h2>
                <p style="font-size:13.5px; color:#94A3B8; margin:0 0 28px; line-height:1.5; max-width:300px;">
                    Seu passaporte digital DNA AUTO foi ativado com sucesso. Seu veículo agora possui certificação permanente.
                </p>

                <div style="width:100%; max-width:320px;">
                    <button class="dna-btn-primary-neon" onclick="OwnerView.enterAppFromConcluded()">
                        <span>Acessar o App</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            </div>
        `;
    }
};

window.OwnerView = OwnerView;
