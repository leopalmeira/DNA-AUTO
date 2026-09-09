// ==============================================================================
// DNA AUTO — APLICATIVO MOBILE DO CLIENTE / PROPRIETÁRIO (PADRÃO APPLE & TOTVS)
// Fidelidade visual 100% à referência: Dark Obsidian, Neon Blue, Glassmorphism
// Zero popups nativos (alert) — Navegação interna SPA fluida e Enterprise
// ==============================================================================

const OwnerView = {
    isDrawerOpen: false,
    currentScreen: 'home', // 'home' | 'vehicle' | 'certification' | 'documents' | 'obd' | 'history' | 'reminders' | 'workshops' | 'settings' | 'notifications'
    activeTab: 'home', // 'home' | 'vehicle' | 'certification' | 'documents' | 'more'
    selectedDoc: null,
    isObdScanning: false,

    // Dados Oficiais do Veículo de Referência
    vehicleData: {
        brand: 'Volkswagen',
        model: 'Gol 1.0',
        full_title: 'Volkswagen Gol 1.0',
        version_label: 'MPI Flex 12V 5p',
        license_plate: 'ABC1D23',
        manufacture_year: 2021,
        model_year: 2022,
        current_mileage: 87542,
        fuel_level: 72,
        estimated_range: 520,
        fuel_type: 'Flex (Álcool/Gasolina)',
        transmission_type: 'Manual 5M',
        color: 'Prata Sirius Metálico',
        chassis_vin: '9BWCA05U8MP001842',
        renavam: '00539182741',
        dna_code: 'DNA-2026-000184',
        certification_date: '08/09/2026 às 14:32',
        certification_status: 'Válida',
        status_badge: 'EM DIA',
        status_subtext: '(Sem pendências)',
        photo_url: '/img/vw-gol-app.jpg',
        user_name: 'João Silva',
        user_role: 'Cliente >',
        notifications_count: 3,
        timeline: [
            { id: 1, title: 'Revisão Periódica', date: '15/08/2026', km: '85.200 km', dotColor: '#00E676', workshop: 'Veloce Auto Center Premium', details: 'Troca de fluidos, velas de ignição e inspeção geral de suspensão.' },
            { id: 2, title: 'Troca de Óleo e Filtro', date: '22/07/2026', km: '80.150 km', dotColor: '#0066FF', workshop: 'Veloce Auto Center Premium', details: 'Óleo sintético 5W40 502.00, filtro de óleo e filtro de ar do motor.' },
            { id: 3, title: 'Alinhamento e Balanceamento', date: '10/05/2026', km: '74.300 km', dotColor: '#0066FF', workshop: 'Bosch Car Service Centro', details: 'Geometria de suspensão 3D e balanceamento dinâmico das 4 rodas.' },
            { id: 4, title: 'Pastilhas de Freio', date: '18/02/2026', km: '69.800 km', dotColor: '#0066FF', workshop: 'Auto Mecânica Confiança', details: 'Substituição das pastilhas de freio dianteiras e sangria do fluido DOT 4.' }
        ]
    },

    // Dados do Módulo de Documentos Oficiais
    documentsData: [
        {
            id: 'doc_crlv_2026',
            title: 'CRLV-e Digital 2026',
            subtitle: 'Certificado de Registro e Licenciamento Eletrônico',
            category: 'SENATRAN / DETRAN',
            badge: 'LICENCIADO 2026',
            badge_color: '#00E676',
            badge_bg: 'rgba(0, 230, 118, 0.15)',
            doc_number: '2026.0481.9201-9',
            issue_date: '10/01/2026',
            valid_until: '31/10/2026',
            hash: 'SHA256:7a9f82d1c04e2893f4125bce892a40b1',
            issuer: 'Secretaria Nacional de Trânsito',
            file_size: '248 KB (PDF Assinado)',
            legal_validity: 'Válido em todo o território nacional (Lei 14.071/20)',
            description: 'Documento oficial de circulação com quitação integral de IPVA, Taxa de Licenciamento Anual e DPVAT.'
        },
        {
            id: 'doc_cert_dna',
            title: 'Certificação DNA AUTO',
            subtitle: 'Passaporte Digital de Procedência e Manutenção',
            category: 'CERTIFICAÇÃO OFICIAL',
            badge: 'VÁLIDA E HOMOLOGADA',
            badge_color: '#00D4FF',
            badge_bg: 'rgba(0, 212, 255, 0.15)',
            doc_number: 'DNA-2026-000184',
            issue_date: '08/09/2026 às 14:32',
            valid_until: 'VITALÍCIO COM ATUALIZAÇÃO CONTÍNUA',
            hash: 'SHA256:8f72a94bc7210e309bb2f1c8402a715e',
            issuer: 'Rede Homologada DNA AUTO Brasil',
            file_size: '1.4 MB (Certificado Criptográfico)',
            legal_validity: 'Autenticidade garantida por assinatura digital distribuída',
            description: 'Garantia de procedência com rastreabilidade total de manutenções, peças originais aplicadas e odômetro verificado.'
        },
        {
            id: 'doc_laudo_cautelar',
            title: 'Laudo Pericial Cautelar 360°',
            subtitle: 'Perícia Técnica e Análise Estrutural Completa',
            category: 'VISTORIA PERICIAL',
            badge: '100% APROVADO',
            badge_color: '#00E676',
            badge_bg: 'rgba(0, 230, 118, 0.15)',
            doc_number: 'LAUDO-9942-2026',
            issue_date: '05/08/2026',
            valid_until: '05/08/2027',
            hash: 'SHA256:b3d19f8021c379a29881fc04918e77a2',
            issuer: 'Perícias Técnicas Automotivas Homologadas',
            file_size: '3.8 MB (Laudo Fotográfico Completo)',
            legal_validity: 'Conformidade com resolução CONTRAN n° 466',
            description: 'Zero indícios de sinistro grave, enchente ou leilão. Estrutura monobloco, motor e numerações de chassi íntegras.'
        },
        {
            id: 'doc_apolice_seguro',
            title: 'Apólice de Seguro Auto Protegido',
            subtitle: 'Proteção Compreensiva e Assistência 24h',
            category: 'SEGURO AUTOMOTIVO',
            badge: 'VIGENTE',
            badge_color: '#38BDF8',
            badge_bg: 'rgba(56, 189, 248, 0.15)',
            doc_number: 'SEG-882190-26',
            issue_date: '15/03/2026',
            valid_until: '15/03/2027',
            hash: 'SHA256:92e4827bb100fae4119e88b201f810aa',
            issuer: 'Companhia de Seguros Gerais',
            file_size: '512 KB',
            legal_validity: 'Registro SUSEP n° 05886',
            description: 'Cobertura 100% Tabela FIPE contra colisão, furto/roubo, danos a terceiros e socorro guincho 24 horas.'
        }
    ],

    // Dados de Telemetria Mini OBD2 (Tempo Real)
    obdData: {
        device: {
            name: 'Mini OBD2 ELM327 BLE 5.2 AutoLink',
            protocol: 'ISO 15765-4 (CAN 11-bit / 500 kbaud)',
            connected: true,
            signal_strength_dbm: -62,
            firmware: 'v2.3b Turbo Enterprise'
        },
        telemetry: {
            engine_status_label: 'Motor em Marcha Lenta',
            rpm: 840,
            coolant_temp_c: 90,
            coolant_status: 'NORMAL (Ideal 85°C - 98°C)',
            battery_voltage: 14.2,
            battery_status: 'Alternador em Carga Plena',
            ecu_odometer_km: 87542,
            fuel_level_percent: 72,
            map_pressure_kpa: 32,
            lambda_ratio: '1.00 (Estequiométrico)',
            throttle_pos_percent: 12,
            intake_temp_c: 34
        },
        diagnostics: {
            mil_lamp: 'OFF (Apagada)',
            dtc_count: 0,
            ecu_name: 'Bosch Motronic ME17.5.24',
            system_health: '100% OPERACIONAL',
            last_scan: 'Hoje às 18:18'
        }
    },

    // Alternar o Menu Lateral Aberto / Fechado
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

    // Navegação Interna SPA Fluida (Sem Popups e Sem Alerts!)
    navigateTo(screen) {
        this.currentScreen = screen;
        
        // Sincroniza aba inferior se aplicável
        if (['home', 'vehicle', 'certification', 'documents'].includes(screen)) {
            this.activeTab = screen;
        } else {
            this.activeTab = 'more';
        }

        this.toggleDrawer(false);
        this.render();
    },

    // Troca de Abas da Bottom Navigation Bar
    switchTab(tab) {
        if (tab === 'more') {
            this.toggleDrawer(true);
            return;
        }
        this.navigateTo(tab);
    },

    // Visualizar Documento Dentro do App
    viewDocument(docId) {
        const doc = this.documentsData.find(d => d.id === docId);
        if (doc) {
            this.selectedDoc = doc;
            this.render();
        }
    },

    // Fechar Modal do Visualizador de Documentos
    closeDocumentViewer() {
        this.selectedDoc = null;
        this.render();
    },

    // Download Simulado do Documento
    downloadDocument(docId) {
        const doc = this.documentsData.find(d => d.id === docId);
        if (!doc) return;

        // Feedback toast nativo suave dentro do app
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: rgba(0, 230, 118, 0.95);
            color: #050B14;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 11.5px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            z-index: 99;
            animation: dnaFadeIn 0.2s ease;
        `;
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Download de <strong>${doc.title}</strong> concluído com sucesso!</span>
        `;
        const phone = document.querySelector('.dna-phone-frame');
        if (phone) {
            phone.appendChild(toast);
            setTimeout(() => toast.remove(), 2600);
        }
    },

    // Re-escanear ECU via Mini OBD2 em Tempo Real
    async rescanObd() {
        if (this.isObdScanning) return;
        this.isObdScanning = true;
        this.render();

        try {
            // Tenta consultar API oficial se disponível
            const res = await fetch(`/api/v1/vehicles/${this.vehicleData.license_plate}/obd`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.telemetry) {
                    this.obdData = data;
                }
            }
        } catch (_) {
            // Mantém telemetria local de alta precisão
        }

        setTimeout(() => {
            // Micro-variação de leitura em tempo real da injeção
            this.obdData.telemetry.rpm = Math.floor(830 + Math.random() * 25);
            this.obdData.telemetry.battery_voltage = (14.2 + (Math.random() * 0.1 - 0.05)).toFixed(1);
            this.obdData.diagnostics.last_scan = 'Agora mesmo (' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ')';
            this.isObdScanning = false;
            this.render();
        }, 800);
    },

    // Renderização do App
    async render() {
        const container = document.getElementById('view-content');
        if (!container) return;

        // Garante a aplicação do isolamento no body
        document.body.classList.add('is-owner-app');
        document.body.classList.remove('is-workshop-erp');

        const v = this.vehicleData;
        const activeDrawerClass = this.isDrawerOpen ? 'active' : '';

        // Carrega documentos do backend se ainda não carregados
        if (!this._docsLoaded) {
            this._docsLoaded = true;
            fetch(`/api/v1/vehicles/${v.license_plate}/documents`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.documents && data.documents.length) {
                        this.documentsData = data.documents;
                    }
                })
                .catch(() => {});
        }

        container.innerHTML = `
            <div class="dna-app-viewport">
                <!-- Frame do Smartphone Móvel -->
                <div class="dna-phone-frame">
                    
                    <!-- 1. Barra de Status Superior -->
                    <div class="dna-phone-statusbar">
                        <span>9:41</span>
                        <div class="dna-statusbar-notch"></div>
                        <div style="display:flex; align-items:center; gap:5px;">
                            <svg width="13" height="10" viewBox="0 0 16 12" fill="white"><path d="M0 8.5h2v3.5H0zm3.5-3h2v6.5h-2zm3.5-3h2v9.5h-2zm3.5-2.5h2v12h-2z"/></svg>
                            <svg width="13" height="10" viewBox="0 0 16 12" fill="white"><path d="M8 2.5a9.6 9.6 0 0 1 6.8 2.8l-1.4 1.4A7.6 7.6 0 0 0 8 4.5c-2 0-3.9.8-5.4 2.2L1.2 5.3A9.6 9.6 0 0 1 8 2.5zm0 4c1.7 0 3.3.7 4.4 1.8l-1.4 1.4A4.3 4.3 0 0 0 8 8.5c-1.2 0-2.3.5-3 1.2L3.6 8.3A6.2 6.2 0 0 1 8 6.5zm0 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>
                            <svg width="17" height="9" viewBox="0 0 24 12" fill="white"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="white" stroke-width="2"/><rect x="3" y="3" width="14" height="6" rx="1.5"/><path d="M22 4h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1z"/></svg>
                        </div>
                    </div>

                    <!-- 2. Header do App: Inteligente (Home vs Sub-tela) -->
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
                                <div class="dna-notification-btn" onclick="OwnerView.navigateTo('notifications')" title="Notificações">
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                    </svg>
                                    <span class="dna-badge-counter">${v.notifications_count}</span>
                                </div>
                                <div class="dna-user-avatar" onclick="OwnerView.toggleDrawer()" title="Perfil">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" onerror="this.src='/img/car-silhouette.svg'" />
                                </div>
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
                                <div class="dna-user-avatar" onclick="OwnerView.toggleDrawer()" title="Perfil">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" onerror="this.src='/img/car-silhouette.svg'" />
                                </div>
                            </div>
                        `}
                    </header>

                    <!-- 3. Área com Rolagem Suave: Conteúdo Conforme a Tela Ativa -->
                    <main class="dna-app-scroll-content">
                        ${this.renderCurrentScreenContent()}
                    </main>

                    <!-- 4. Visualizador de Documento Interno (Sheet Overlay) -->
                    ${this.selectedDoc ? this.renderDocumentViewerModal() : ''}

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

                        <div class="dna-nav-item ${this.activeTab === 'documents' ? 'active' : ''}" onclick="OwnerView.switchTab('documents')">
                            <div class="dna-nav-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            </div>
                            <span class="dna-nav-label">Documentos</span>
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

                    <!-- 7. Menu Lateral Aberto (9 Itens com Navegação Interna Real) -->
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
                                <a href="javascript:void(0)" class="dna-profile-role" onclick="OwnerView.navigateTo('settings')">${v.user_role}</a>
                            </div>
                        </div>

                        <div class="dna-drawer-menu-list">
                            <!-- 1. Início -->
                            <div class="dna-menu-item ${this.currentScreen === 'home' ? 'active' : ''}" onclick="OwnerView.navigateTo('home')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    </div>
                                    <span>Início</span>
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

                            <!-- 4. Histórico do Veículo -->
                            <div class="dna-menu-item ${this.currentScreen === 'history' ? 'active' : ''}" onclick="OwnerView.navigateTo('history')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    </div>
                                    <span>Histórico do Veículo</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 5. Documentos -->
                            <div class="dna-menu-item ${this.currentScreen === 'documents' ? 'active' : ''}" onclick="OwnerView.navigateTo('documents')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                    </div>
                                    <span>Documentos</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 6. Diagnóstico OBD -->
                            <div class="dna-menu-item ${this.currentScreen === 'obd' ? 'active' : ''}" onclick="OwnerView.navigateTo('obd')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>
                                    </div>
                                    <span>Diagnóstico OBD</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 7. Lembretes -->
                            <div class="dna-menu-item ${this.currentScreen === 'reminders' ? 'active' : ''}" onclick="OwnerView.navigateTo('reminders')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                    </div>
                                    <span>Lembretes</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 8. Oficinas Credenciadas -->
                            <div class="dna-menu-item ${this.currentScreen === 'workshops' ? 'active' : ''}" onclick="OwnerView.navigateTo('workshops')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    </div>
                                    <span>Oficinas Credenciadas</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 9. Configurações -->
                            <div class="dna-menu-item ${this.currentScreen === 'settings' ? 'active' : ''}" onclick="OwnerView.navigateTo('settings')">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                    </div>
                                    <span>Configurações</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </div>

                        <div class="dna-drawer-footer">
                            <div class="dna-footer-shield-box">
                                <div class="dna-footer-shield-icon">
                                    <svg viewBox="0 0 120 120" width="32" height="32" fill="none" stroke="#00D4FF" stroke-width="7">
                                        <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64"/>
                                        <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66"/>
                                        <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68"/>
                                    </svg>
                                </div>
                                <h4>DNA AUTO</h4>
                                <p class="dna-footer-slogan">Tecnologia e Segurança Veicular</p>
                                <p class="dna-footer-sub">Todos os dados criptografados e validados</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    },

    // Retorna Título Amigável para o Topo
    getScreenTitle(screen) {
        const titles = {
            'vehicle': 'Meu Veículo',
            'certification': 'Certificação DNA',
            'documents': 'Documentos',
            'obd': 'Telemetria Mini OBD2',
            'history': 'Histórico Completo',
            'reminders': 'Lembretes Preventivos',
            'workshops': 'Oficinas Credenciadas',
            'settings': 'Configurações',
            'notifications': 'Notificações'
        };
        return titles[screen] || 'DNA AUTO';
    },

    // Roteador de Telas Internas SPA
    renderCurrentScreenContent() {
        switch (this.currentScreen) {
            case 'documents':
                return this.renderDocumentsScreen();
            case 'obd':
                return this.renderObdScreen();
            case 'vehicle':
                return this.renderVehicleScreen();
            case 'certification':
                return this.renderCertificationScreen();
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

    // ── 1. TELA INICIAL (HOME) ──
    renderHomeScreen() {
        const v = this.vehicleData;
        return `
            <!-- Card Principal do Veículo -->
            <div class="dna-vehicle-card">
                
                <!-- Topo do Card -->
                <div class="dna-vehicle-header">
                    <div class="dna-mfr-block">
                        <div class="dna-brand-symbol">
                            <svg viewBox="0 0 100 100" width="26" height="26">
                                <circle cx="50" cy="50" r="46" stroke="#00D4FF" stroke-width="6" fill="none"/>
                                <circle cx="50" cy="50" r="41" stroke="#FFFFFF" stroke-width="2" fill="none"/>
                                <path d="M 28 34 L 50 78 L 72 34 M 40 34 L 50 56 L 60 34" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 class="dna-vehicle-name">${v.full_title}</h2>
                            <div class="dna-plate-year">${v.license_plate} • ${v.manufacture_year}/${v.model_year}</div>
                        </div>
                    </div>
                    <div class="dna-registered-tag" onclick="OwnerView.navigateTo('vehicle')" style="cursor:pointer;" title="Ver detalhes do veículo">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Cadastrado &gt;</span>
                    </div>
                </div>

                <!-- Imagem do Carro com Reflexo Neon Azul -->
                <div class="dna-car-stage" onclick="OwnerView.navigateTo('vehicle')" style="cursor:pointer;">
                    <div class="dna-car-neon-glow"></div>
                    <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.onerror=null; this.src='/img/car-silhouette.svg';" />
                </div>

                <!-- Círculo de Status de Saúde (EM DIA) -->
                <div class="dna-status-orb-container" onclick="OwnerView.navigateTo('obd')" style="cursor:pointer;" title="Abrir Telemetria OBD2">
                    <div class="dna-status-orb">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div class="dna-status-title-row">
                        <span class="dna-status-main">${v.status_badge}</span>
                        <span class="dna-status-sub">${v.status_subtext}</span>
                    </div>
                </div>

                <!-- 3 Medidores Rápidos em Grade -->
                <div class="dna-metrics-grid">
                    <div class="dna-metric-box" onclick="OwnerView.navigateTo('obd')" style="cursor:pointer;">
                        <div class="dna-metric-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Quilometragem
                        </div>
                        <div class="dna-metric-value">${Number(v.current_mileage).toLocaleString('pt-BR')} km</div>
                    </div>
                    <div class="dna-metric-box">
                        <div class="dna-metric-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M3 22h12M4 9h10M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                            Combustível
                        </div>
                        <div class="dna-metric-value">${v.fuel_level}%</div>
                        <div class="dna-fuel-bar"><div class="dna-fuel-fill" style="width:${v.fuel_level}%;"></div></div>
                    </div>
                    <div class="dna-metric-box">
                        <div class="dna-metric-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Autonomia
                        </div>
                        <div class="dna-metric-value">~ ${v.estimated_range} km</div>
                    </div>
                </div>
            </div>

            <!-- Card de Certificação DNA AUTO -->
            <div class="dna-cert-card">
                <div class="dna-cert-left">
                    <div class="dna-cert-badge-row">
                        <div class="dna-cert-shield-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD21C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                        </div>
                        <div class="dna-cert-title-block">
                            <h3>Certificação DNA AUTO</h3>
                            <span class="dna-valid-pill">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                ${v.certification_status}
                            </span>
                        </div>
                    </div>
                    <div class="dna-cert-code">${v.dna_code}</div>
                    <div class="dna-cert-date">Última validação: ${v.certification_date}</div>
                    
                    <button class="dna-cert-action-btn" onclick="OwnerView.navigateTo('certification')">
                        <span>Ver certificação completa</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                <!-- QR Code Escaneável de Autenticidade -->
                <div class="dna-cert-qr-container" onclick="OwnerView.navigateTo('certification')" title="Clique para abrir Laudo Oficial">
                    <svg class="dna-qr-code" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#0A1428" rx="8"/>
                        <rect x="10" y="10" width="24" height="24" fill="none" stroke="#00D4FF" stroke-width="4" rx="3"/>
                        <rect x="16" y="16" width="12" height="12" fill="#00D4FF" rx="2"/>
                        <rect x="66" y="10" width="24" height="24" fill="none" stroke="#00D4FF" stroke-width="4" rx="3"/>
                        <rect x="72" y="16" width="12" height="12" fill="#00D4FF" rx="2"/>
                        <rect x="10" y="66" width="24" height="24" fill="none" stroke="#00D4FF" stroke-width="4" rx="3"/>
                        <rect x="16" y="72" width="12" height="12" fill="#00D4FF" rx="2"/>
                        <rect x="42" y="12" width="6" height="6" fill="#00D4FF"/>
                        <rect x="52" y="12" width="6" height="12" fill="#00D4FF"/>
                        <rect x="42" y="24" width="14" height="6" fill="#00D4FF"/>
                        <rect x="12" y="42" width="12" height="6" fill="#00D4FF"/>
                        <rect x="40" y="40" width="20" height="20" fill="#0066FF" rx="3"/>
                        <circle cx="50" cy="50" r="5" fill="#FFFFFF"/>
                        <rect x="68" y="42" width="18" height="6" fill="#00D4FF"/>
                        <rect x="42" y="68" width="8" height="18" fill="#00D4FF"/>
                        <rect x="78" y="78" width="10" height="10" fill="#00D4FF"/>
                    </svg>
                    <span class="dna-qr-label">AUTENTICIDADE</span>
                </div>
            </div>

            <!-- Seção Últimos Registros (Timeline Horizontal Conectada) -->
            <div class="dna-timeline-section">
                <div class="dna-timeline-header">
                    <span class="dna-timeline-title">ÚLTIMOS REGISTROS</span>
                    <a href="javascript:void(0)" class="dna-timeline-more-link" onclick="OwnerView.navigateTo('history')">
                        Ver histórico completo &gt;
                    </a>
                </div>

                <div class="dna-horizontal-timeline">
                    <div class="dna-timeline-track"></div>
                    <div class="dna-timeline-nodes">
                        ${v.timeline.map(item => `
                            <div class="dna-timeline-node" onclick="OwnerView.navigateTo('history')" title="Ver detalhes deste serviço">
                                <div class="dna-node-dot" style="background-color:${item.dotColor}; box-shadow: 0 0 8px ${item.dotColor};">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <div class="dna-node-label">${item.title}</div>
                                <div class="dna-node-date">${item.date}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Card de Proteção Inferior -->
            <div class="dna-protection-card" onclick="OwnerView.navigateTo('certification')" style="cursor:pointer;">
                <div class="dna-prot-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2.2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <div class="dna-prot-text">
                    <strong>Veículo Protegido pelo DNA AUTO</strong>
                    <span>Histórico criptografado e validado em rede distribuída.</span>
                </div>
            </div>

            <div style="height:10px;"></div>
        `;
    },

    // ── 2. TELA DE DOCUMENTOS DIGITAIS (DENTRO DO APP, ZERO POPUPS!) ──
    renderDocumentsScreen() {
        return `
            <div class="dna-documents-container">
                <!-- Cabeçalho Informativo TOTVS Enterprise -->
                <div style="background: rgba(0, 102, 255, 0.08); border: 1px solid rgba(0, 102, 255, 0.25); border-radius: 14px; padding: 12px 14px; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <h3 style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin: 0;">Carteira Digital Veicular</h3>
                        <span style="background: rgba(0, 230, 118, 0.15); border: 1px solid #00E676; color: #00E676; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">
                            ${this.documentsData.length} DOCUMENTOS ATIVOS
                        </span>
                    </div>
                    <p style="font-size: 10.5px; color: #94A3B8; margin: 0; line-height: 1.3;">
                        Documentos oficiais homologados com assinatura digital, regularidade fiscal e laudos de integridade veicular.
                    </p>
                </div>

                <!-- Lista de Cards de Documentos -->
                ${this.documentsData.map(doc => `
                    <div class="dna-doc-card">
                        <div class="dna-doc-card-top">
                            <div class="dna-doc-title-group">
                                <div class="dna-doc-icon-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                    </svg>
                                </div>
                                <div>
                                    <h4 class="dna-doc-title">${doc.title}</h4>
                                    <span class="dna-doc-issuer">${doc.category} • ${doc.issuer}</span>
                                </div>
                            </div>
                            <span class="dna-doc-badge" style="color:${doc.badge_color}; background:${doc.badge_bg || 'rgba(0, 230, 118, 0.15)'}; border-color:${doc.badge_color};">
                                ${doc.badge}
                            </span>
                        </div>

                        <!-- Metadados em Grade -->
                        <div class="dna-doc-meta-grid">
                            <div class="dna-doc-meta-item">
                                <span class="dna-doc-meta-lbl">Número do Documento</span>
                                <span class="dna-doc-meta-val">${doc.doc_number}</span>
                            </div>
                            <div class="dna-doc-meta-item">
                                <span class="dna-doc-meta-lbl">Vigência / Validade</span>
                                <span class="dna-doc-meta-val">${doc.valid_until}</span>
                            </div>
                        </div>

                        <p class="dna-doc-desc">${doc.description}</p>

                        <!-- Ações Dentro do App -->
                        <div class="dna-doc-actions">
                            <button class="dna-btn-doc-view" onclick="OwnerView.viewDocument('${doc.id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>Visualizar</span>
                            </button>
                            <button class="dna-btn-doc-dl" onclick="OwnerView.downloadDocument('${doc.id}')" title="Salvar cópia">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>PDF</span>
                            </button>
                        </div>
                    </div>
                `).join('')}

                <div style="height: 12px;"></div>
            </div>
        `;
    },

    // ── 3. VISUALIZADOR INTERNO DE DOCUMENTO (SHEET NATIVO NO SMARTPHONE) ──
    renderDocumentViewerModal() {
        const doc = this.selectedDoc;
        const v = this.vehicleData;
        if (!doc) return '';

        return `
            <div class="dna-doc-modal-overlay" onclick="if(event.target === this) OwnerView.closeDocumentViewer();">
                <div class="dna-doc-sheet">
                    <div class="dna-doc-sheet-header">
                        <div>
                            <span style="font-size: 9.5px; color: #00D4FF; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Visualizador Oficial</span>
                            <h3 class="dna-doc-sheet-title">${doc.title}</h3>
                        </div>
                        <button class="dna-doc-sheet-close" onclick="OwnerView.closeDocumentViewer()" title="Fechar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <!-- Papel Digital do Documento -->
                    <div class="dna-doc-paper-preview">
                        <span class="dna-doc-paper-badge">${doc.badge}</span>
                        
                        <div class="dna-doc-paper-header">
                            <h4>REPÚBLICA FEDERATIVA DO BRASIL</h4>
                            <p>${doc.issuer}</p>
                            <p style="font-size: 9px; color: #64748B; margin-top: 2px;">DOCUMENTO DIGITAL COM VALIDADE JURÍDICA NACIONAL</p>
                        </div>

                        <!-- Tabela de Dados Oficiais -->
                        <table class="dna-doc-data-table">
                            <tr><td class="label">Veículo:</td><td class="val">${v.brand} ${v.model}</td></tr>
                            <tr><td class="label">Placa:</td><td class="val">${v.license_plate}</td></tr>
                            <tr><td class="label">Chassi / VIN:</td><td class="val">${v.chassis_vin}</td></tr>
                            <tr><td class="label">Renavam:</td><td class="val">${v.renavam}</td></tr>
                            <tr><td class="label">Exercício:</td><td class="val">${v.model_year} (Licenciado 2026)</td></tr>
                            <tr><td class="label">Proprietário:</td><td class="val">${v.user_name}</td></tr>
                            <tr><td class="label">N° do Registro:</td><td class="val">${doc.doc_number}</td></tr>
                            <tr><td class="label">Data Emissão:</td><td class="val">${doc.issue_date}</td></tr>
                            <tr><td class="label">Situação Legal:</td><td class="val" style="color:#00E676;">Sem Débitos / Regular</td></tr>
                        </table>

                        <!-- Selo e QR Code Oficial de Validação -->
                        <div class="dna-doc-validation-stamp">
                            <svg class="dna-stamp-qr" viewBox="0 0 100 100">
                                <rect width="100" height="100" fill="#000" rx="4"/>
                                <rect x="8" y="8" width="28" height="28" fill="none" stroke="#00D4FF" stroke-width="5" rx="3"/>
                                <rect x="15" y="15" width="14" height="14" fill="#00D4FF"/>
                                <rect x="64" y="8" width="28" height="28" fill="none" stroke="#00D4FF" stroke-width="5" rx="3"/>
                                <rect x="71" y="15" width="14" height="14" fill="#00D4FF"/>
                                <rect x="8" y="64" width="28" height="28" fill="none" stroke="#00D4FF" stroke-width="5" rx="3"/>
                                <rect x="15" y="71" width="14" height="14" fill="#00D4FF"/>
                                <rect x="42" y="12" width="16" height="8" fill="#00D4FF"/>
                                <rect x="40" y="40" width="20" height="20" fill="#0066FF"/>
                                <rect x="64" y="64" width="24" height="24" fill="#00D4FF"/>
                            </svg>
                            <div class="dna-stamp-info">
                                <strong>AUTENTICAÇÃO DIGITAL VIO / SERPRO</strong>
                                <span>Hash: ${doc.hash}</span>
                                <span style="display:block; margin-top:2px; font-size:8.5px; color:#64748B;">Documento assinado digitalmente conforme MP 2.200-2/2001.</span>
                            </div>
                        </div>
                    </div>

                    <!-- Botão de Ação -->
                    <button class="dna-obd-rescan-btn" onclick="OwnerView.downloadDocument('${doc.id}'); OwnerView.closeDocumentViewer();">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>Salvar Cópia Oficial no Celular</span>
                    </button>
                </div>
            </div>
        `;
    },

    // ── 4. TELA DE DIAGNÓSTICO MINI OBD2 (INSTRUMENTAÇÃO EM TEMPO REAL) ──
    renderObdScreen() {
        const o = this.obdData;
        const scanningText = this.isObdScanning ? 'Lendo sensores da central ECU...' : 'Escanear Central ECU Novamente';

        return `
            <div class="dna-obd-container">
                
                <!-- Status de Conexão com o Mini OBD2 Dongle -->
                <div class="dna-obd-conn-banner">
                    <div class="dna-obd-conn-left">
                        <div class="dna-obd-live-pulse"></div>
                        <div>
                            <h4 class="dna-obd-device-name">${o.device.name}</h4>
                            <span class="dna-obd-protocol">${o.device.protocol}</span>
                        </div>
                    </div>
                    <span class="dna-obd-latency-pill">CONECTADO</span>
                </div>

                <!-- 4 Gauges Digitais de Instrumentação em Tempo Real -->
                <div class="dna-obd-gauges-grid">
                    
                    <!-- 1. RPM (Rotações por Minuto) -->
                    <div class="dna-obd-gauge-card">
                        <div class="dna-obd-gauge-icon" style="background: rgba(0, 212, 255, 0.15); color: #00D4FF;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
                        </div>
                        <span class="dna-obd-gauge-label">Rotação Motor</span>
                        <div class="dna-obd-gauge-value">${o.telemetry.rpm} <span class="dna-obd-gauge-unit">RPM</span></div>
                        <div class="dna-obd-rpm-bar">
                            <div class="dna-obd-rpm-fill" style="width: ${Math.min(100, (o.telemetry.rpm / 6500) * 100)}%;"></div>
                        </div>
                        <span class="dna-obd-gauge-status" style="color:#00E676;">Marcha Lenta Estável</span>
                    </div>

                    <!-- 2. Temperatura da Água / Arrefecimento -->
                    <div class="dna-obd-gauge-card">
                        <div class="dna-obd-gauge-icon" style="background: rgba(0, 230, 118, 0.15); color: #00E676;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                        </div>
                        <span class="dna-obd-gauge-label">Temperatura Motor</span>
                        <div class="dna-obd-gauge-value">${o.telemetry.coolant_temp_c} <span class="dna-obd-gauge-unit">°C</span></div>
                        <span class="dna-obd-gauge-status" style="color:#00E676;">Ideal (85°C - 98°C)</span>
                    </div>

                    <!-- 3. Tensão da Bateria / Alternador -->
                    <div class="dna-obd-gauge-card">
                        <div class="dna-obd-gauge-icon" style="background: rgba(0, 102, 255, 0.15); color: #0066FF;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="13" rx="2"/><line x1="6" y1="11" x2="10" y2="11"/><line x1="14" y1="11" x2="18" y2="11"/><line x1="16" y1="9" x2="16" y2="13"/></svg>
                        </div>
                        <span class="dna-obd-gauge-label">Alternador / Bateria</span>
                        <div class="dna-obd-gauge-value">${o.telemetry.battery_voltage} <span class="dna-obd-gauge-unit">V</span></div>
                        <span class="dna-obd-gauge-status" style="color:#00D4FF;">Carga Plena (14.2V)</span>
                    </div>

                    <!-- 4. Odômetro Sincronizado via ECU -->
                    <div class="dna-obd-gauge-card">
                        <div class="dna-obd-gauge-icon" style="background: rgba(255, 210, 28, 0.15); color: #FFD21C;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="16" y2="8"/></svg>
                        </div>
                        <span class="dna-obd-gauge-label">Odômetro ECU</span>
                        <div class="dna-obd-gauge-value" style="font-size: 16px;">${Number(o.telemetry.ecu_odometer_km).toLocaleString('pt-BR')} <span class="dna-obd-gauge-unit">km</span></div>
                        <span class="dna-obd-gauge-status" style="color:#00E676;">100% Autenticado</span>
                    </div>
                </div>

                <!-- Scanner de Erros da Injeção (DTC) -->
                <div class="dna-obd-dtc-card">
                    <div class="dna-obd-dtc-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="dna-obd-dtc-info">
                        <h4>Zero Falhas Detectadas (0 DTC)</h4>
                        <p>Central de Injeção <strong>${o.diagnostics.ecu_name}</strong> sem códigos de avaria ativos. Luz de injeção apagada.</p>
                        <span style="font-size: 9.5px; color: #38BDF8; display: block; margin-top: 4px;">Última verificação: ${o.diagnostics.last_scan}</span>
                    </div>
                </div>

                <!-- Tabela de Sensores ao Vivo (Padrão TOTVS) -->
                <div class="dna-obd-sensors-table">
                    <div class="dna-obd-table-header">
                        <h4>Telemetria dos Sensores do Motor</h4>
                        <span style="font-size: 9.5px; color: #00D4FF; font-weight: 700;">CAN BUS 500 KBPS</span>
                    </div>
                    <div class="dna-obd-sensor-row">
                        <span class="dna-sensor-name">Sonda Lambda (Mistura Ar/Combustível)</span>
                        <span class="dna-sensor-val" style="color: #00E676;">λ = ${o.telemetry.lambda_ratio}</span>
                    </div>
                    <div class="dna-obd-sensor-row">
                        <span class="dna-sensor-name">Pressão no Coletor de Admissão (MAP)</span>
                        <span class="dna-sensor-val">${o.telemetry.map_pressure_kpa} kPa</span>
                    </div>
                    <div class="dna-obd-sensor-row">
                        <span class="dna-sensor-name">Abertura da Borboleta (TPS)</span>
                        <span class="dna-sensor-val">${o.telemetry.throttle_pos_percent}%</span>
                    </div>
                    <div class="dna-obd-sensor-row">
                        <span class="dna-sensor-name">Temperatura do Ar Admitido (IAT)</span>
                        <span class="dna-sensor-val">${o.telemetry.intake_temp_c} °C</span>
                    </div>
                    <div class="dna-obd-sensor-row">
                        <span class="dna-sensor-name">Nível de Combustível no Tanque</span>
                        <span class="dna-sensor-val">${o.telemetry.fuel_level_percent}% (~ 39.6 Litros)</span>
                    </div>
                </div>

                <!-- Botão de Re-escaneamento -->
                <button class="dna-obd-rescan-btn" onclick="OwnerView.rescanObd()" ${this.isObdScanning ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ${this.isObdScanning ? 'style="animation: spin 1s linear infinite;"' : ''}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    <span>${scanningText}</span>
                </button>

                <div style="height: 12px;"></div>
            </div>
        `;
    },

    // ── 5. SUB-TELA: MEU VEÍCULO (FICHA TÉCNICA) ──
    renderVehicleScreen() {
        const v = this.vehicleData;
        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="dna-vehicle-card" style="margin-bottom:0;">
                    <div class="dna-car-stage">
                        <div class="dna-car-neon-glow"></div>
                        <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.src='/img/car-silhouette.svg';" />
                    </div>
                    <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; text-align: center; margin: 4px 0 2px;">${v.full_title}</h3>
                    <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0 0 10px;">${v.version_label} • Placa: ${v.license_plate}</p>
                </div>

                <div class="dna-vehicle-specs-grid">
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Ano / Modelo</span>
                        <span class="dna-spec-value">${v.manufacture_year} / ${v.model_year}</span>
                    </div>
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Cor Oficial</span>
                        <span class="dna-spec-value">${v.color}</span>
                    </div>
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Combustível</span>
                        <span class="dna-spec-value">${v.fuel_type}</span>
                    </div>
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Câmbio</span>
                        <span class="dna-spec-value">${v.transmission_type}</span>
                    </div>
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Chassi (VIN)</span>
                        <span class="dna-spec-value" style="font-size: 11px; font-family: monospace;">${v.chassis_vin}</span>
                    </div>
                    <div class="dna-spec-card">
                        <span class="dna-spec-label">Renavam</span>
                        <span class="dna-spec-value" style="font-size: 11px; font-family: monospace;">${v.renavam}</span>
                    </div>
                </div>

                <div style="background: rgba(8, 16, 32, 0.88); border: 1.5px solid rgba(0, 102, 255, 0.25); border-radius: 14px; padding: 14px;">
                    <h4 style="font-size: 12px; font-weight: 800; color: #FFFFFF; margin: 0 0 8px; text-transform: uppercase;">Proprietário Cadastrado</h4>
                    <p style="font-size: 11.5px; color: #E2E8F0; margin: 0 0 2px;"><strong>${v.user_name}</strong></p>
                    <p style="font-size: 10.5px; color: #94A3B8; margin: 0;">Registro ativo na plataforma DNA AUTO com certificação de procedência válida.</p>
                </div>

                <button class="dna-obd-rescan-btn" onclick="OwnerView.navigateTo('documents')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                    <span>Acessar Documentos do Veículo</span>
                </button>
            </div>
        `;
    },

    // ── 6. SUB-TELA: CERTIFICAÇÃO DNA AUTO ──
    renderCertificationScreen() {
        const v = this.vehicleData;
        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="background: radial-gradient(circle at 50% 20%, rgba(12, 30, 65, 0.95) 0%, rgba(6, 14, 28, 0.98) 100%); border: 2px solid #00D4FF; border-radius: 18px; padding: 18px; text-align: center; box-shadow: 0 0 25px rgba(0, 212, 255, 0.25);">
                    <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                        <svg viewBox="0 0 120 120" width="48" height="48" fill="none" stroke="#00D4FF" stroke-width="7">
                            <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64"/>
                            <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66"/>
                            <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68"/>
                        </svg>
                    </div>
                    <span style="background: rgba(0, 230, 118, 0.15); border: 1px solid #00E676; color: #00E676; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">CERTIFICAÇÃO OFICIAL VÁLIDA</span>
                    <h3 style="font-size: 18px; font-weight: 900; color: #FFFFFF; margin: 10px 0 4px; letter-spacing: 0.5px;">${v.dna_code}</h3>
                    <p style="font-size: 11px; color: #94A3B8; margin: 0 0 14px;">Emitida e homologada em ${v.certification_date}</p>

                    <div style="background: #050B14; border: 1px solid rgba(0, 102, 255, 0.3); border-radius: 12px; padding: 12px; text-align: left; font-size: 11px; line-height: 1.5; color: #CBD5E1; margin-bottom: 14px;">
                        <p style="margin:0 0 6px;">• <strong>Autenticidade:</strong> Registrado na rede distribuída DNA AUTO.</p>
                        <p style="margin:0 0 6px;">• <strong>Quilometragem:</strong> ${Number(v.current_mileage).toLocaleString('pt-BR')} km verificados via ECU e ordens de serviço.</p>
                        <p style="margin:0;">• <strong>Hash SHA-256:</strong> <code style="font-size:9.5px; color:#00D4FF;">8f72a94bc7210e309bb2f1c8402a715e</code></p>
                    </div>

                    <button class="dna-btn-doc-view" style="width:100%;" onclick="OwnerView.viewDocument('doc_cert_dna')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>Abrir Certificado em Tela Cheia</span>
                    </button>
                </div>
            </div>
        `;
    },

    // ── 7. SUB-TELA: HISTÓRICO COMPLETO DE SERVIÇOS ──
    renderHistoryScreen() {
        const v = this.vehicleData;
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">Linha do Tempo de Intervenções</span>
                    <span style="font-size: 10px; color: #00D4FF; font-weight: 700;">4 Registros Homologados</span>
                </div>

                <div class="dna-history-list">
                    ${v.timeline.map(t => `
                        <div class="dna-history-item-card">
                            <div class="dna-history-card-header">
                                <h4 class="dna-history-title">${t.title}</h4>
                                <span class="dna-history-km-pill">${t.km}</span>
                            </div>
                            <p class="dna-history-details">${t.details}</p>
                            <div class="dna-history-footer">
                                <span>Oficina: <strong>${t.workshop}</strong></span>
                                <span>Data: ${t.date}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ── 8. SUB-TELA: LEMBRETES PREVENTIVOS ──
    renderRemindersScreen() {
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="dna-history-item-card" style="border-left: 4px solid #00D4FF;">
                    <div class="dna-history-card-header">
                        <h4 class="dna-history-title">Próxima Troca de Óleo e Filtro</h4>
                        <span class="dna-subscreen-badge">EM 2.458 KM</span>
                    </div>
                    <p class="dna-history-details">Recomendado para 90.000 km ou até Novembro de 2026. Utilizar especificação VW 502 00 (5W40 Sintético).</p>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #00E676;">
                    <div class="dna-history-card-header">
                        <h4 class="dna-history-title">Rodízio e Calibragem dos Pneus</h4>
                        <span class="dna-subscreen-badge">EM 7.458 KM</span>
                    </div>
                    <p class="dna-history-details">Próximo alinhamento 3D e rodízio em X com 95.000 km para desgaste homogêneo da banda de rodagem.</p>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #FFD21C;">
                    <div class="dna-history-card-header">
                        <h4 class="dna-history-title">Renovação do Licenciamento Anual</h4>
                        <span class="dna-subscreen-badge" style="color:#FFD21C; border-color:#FFD21C; background:rgba(255,210,28,0.15);">OUTUBRO/2026</span>
                    </div>
                    <p class="dna-history-details">Final de placa 3. Quitação via Senatran / Detran digital.</p>
                </div>
            </div>
        `;
    },

    // ── 9. SUB-TELA: OFICINAS CREDENCIADAS ──
    renderWorkshopsScreen() {
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="dna-history-item-card">
                    <div class="dna-history-card-header">
                        <h4 class="dna-history-title">Veloce Auto Center Premium</h4>
                        <span class="dna-subscreen-badge">A 2.4 KM</span>
                    </div>
                    <p class="dna-history-details">Av. Brasil, 1500 • Especialista Volkswagen e Injeção Eletrônica. Nota 4.9 ★★★★★ (184 avaliações).</p>
                    <div class="dna-history-footer">
                        <span>Tel: (11) 3456-7890</span>
                        <span style="color:#00D4FF; font-weight:700;">Credenciada DNA AUTO</span>
                    </div>
                </div>

                <div class="dna-history-item-card">
                    <div class="dna-history-card-header">
                        <h4 class="dna-history-title">Bosch Car Service Centro</h4>
                        <span class="dna-subscreen-badge">A 4.1 KM</span>
                    </div>
                    <p class="dna-history-details">Rua das Flores, 420 • Diagnóstico Computadorizado e Geometria 3D. Nota 4.8 ★★★★★.</p>
                    <div class="dna-history-footer">
                        <span>Tel: (11) 3122-8800</span>
                        <span style="color:#00D4FF; font-weight:700;">Credenciada DNA AUTO</span>
                    </div>
                </div>
            </div>
        `;
    },

    // ── 10. SUB-TELA: CONFIGURAÇÕES ──
    renderSettingsScreen() {
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Perfil do Usuário</h4>
                    <p class="dna-history-details">Proprietário: João Silva<br>E-mail: joao.silva@exemplo.com.br<br>Status: Cliente Verificado</p>
                </div>

                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Pareamento Mini OBD2</h4>
                    <p class="dna-history-details">Dispositivo: Mini OBD2 ELM327 BLE 5.2<br>Sincronização: Automática ao ligar a ignição<br>Frequência: Leituras a cada 2 segundos</p>
                </div>

                <div class="dna-history-item-card">
                    <h4 class="dna-history-title" style="margin-bottom:6px;">Padrão Visual</h4>
                    <p class="dna-history-details">Tema: Dark Obsidian & Neon Blue (Padrão TOTVS Enterprise & Apple)</p>
                </div>
            </div>
        `;
    },

    // ── 11. SUB-TELA: NOTIFICAÇÕES ──
    renderNotificationsScreen() {
        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="dna-history-item-card" style="border-left: 4px solid #00E676;">
                    <h4 class="dna-history-title">Certificação Homologada</h4>
                    <p class="dna-history-details">O certificado digital #DNA-2026-000184 do seu Volkswagen Gol foi revalidado pela rede com sucesso.</p>
                    <span style="font-size:9px; color:#64748B;">Há 2 horas</span>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #00D4FF;">
                    <h4 class="dna-history-title">CRLV-e 2026 Disponível</h4>
                    <p class="dna-history-details">Seu documento de licenciamento digital 2026 está pronto para visualização na aba de documentos.</p>
                    <span style="font-size:9px; color:#64748B;">Hoje</span>
                </div>

                <div class="dna-history-item-card" style="border-left: 4px solid #38BDF8;">
                    <h4 class="dna-history-title">Telemetria Mini OBD2 Ativa</h4>
                    <p class="dna-history-details">Dongle conectado via Bluetooth Low Energy. Zero falhas detectadas na central do motor.</p>
                    <span style="font-size:9px; color:#64748B;">Agora</span>
                </div>
            </div>
        `;
    }
};

window.OwnerView = OwnerView;
