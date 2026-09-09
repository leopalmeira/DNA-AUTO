// ==============================================================================
// DNA AUTO — APLICATIVO MOBILE DO CLIENTE / PROPRIETÁRIO (PADRÃO APPLE & TOTVS)
// Fidelidade visual 100% à referência: Dark Obsidian, Neon Blue, Glassmorphism
// ==============================================================================

const OwnerView = {
    isDrawerOpen: false,
    activeTab: 'home', // 'home' | 'vehicle' | 'certification' | 'documents' | 'more'
    currentVehicleDna: null,

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
            { id: 1, title: 'Revisão Periódica', date: '15/08/2026', km: '85.200 km', dotColor: '#00E676' },
            { id: 2, title: 'Troca de Óleo e Filtro', date: '22/07/2026', km: '80.150 km', dotColor: '#0066FF' },
            { id: 3, title: 'Alinhamento e Balanceamento', date: '10/05/2026', km: '74.300 km', dotColor: '#0066FF' },
            { id: 4, title: 'Pastilhas de Freio', date: '18/02/2026', km: '69.800 km', dotColor: '#0066FF' }
        ]
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

    // Troca de Abas da Bottom Navigation Bar
    switchTab(tab) {
        this.activeTab = tab;
        if (tab === 'more') {
            this.toggleDrawer(true);
            return;
        }
        if (tab === 'vehicle') {
            this.showVehicleModal();
            return;
        }
        if (tab === 'certification') {
            this.showCertificationModal();
            return;
        }
        if (tab === 'documents') {
            this.showDocumentsModal();
            return;
        }
        this.render();
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

                    <!-- 2. Header Superior do App -->
                    <header class="dna-app-header">
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

                        <!-- Notificações e Avatar com Trava de Tamanho -->
                        <div class="dna-header-right">
                            <div class="dna-notification-btn" onclick="OwnerView.showNotificationsModal()">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                <span class="dna-badge-counter">${v.notifications_count}</span>
                            </div>
                            <div class="dna-user-avatar" onclick="OwnerView.toggleDrawer()">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" onerror="this.src='/img/car-silhouette.svg'" />
                            </div>
                        </div>
                    </header>

                    <!-- 3. Área com Rolagem Suave -->
                    <main class="dna-app-scroll-content">
                        
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
                                <div class="dna-registered-tag">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Veículo cadastrado</span>
                                </div>
                            </div>

                            <!-- Imagem do Carro com Reflexo Neon Azul -->
                            <div class="dna-car-stage">
                                <div class="dna-car-neon-glow"></div>
                                <img class="dna-car-image" src="${v.photo_url}" alt="${v.full_title}" onerror="this.onerror=null; this.src='/img/car-silhouette.svg';" />
                            </div>

                            <!-- Círculo de Status de Saúde (EM DIA) -->
                            <div class="dna-status-orb-container">
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
                                <div class="dna-metric-box">
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
                                
                                <button class="dna-cert-action-btn" onclick="OwnerView.showCertificationModal()">
                                    <span>Ver certificação</span>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </div>

                            <!-- QR Code Escaneável de Autenticidade -->
                            <div class="dna-cert-qr-container" onclick="OwnerView.showCertificationModal()" title="Clique para abrir Laudo Oficial">
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
                                <a href="javascript:void(0)" class="dna-timeline-more-link" onclick="OwnerView.showHistoryModal()">
                                    Ver histórico completo &gt;
                                </a>
                            </div>

                            <div class="dna-horizontal-timeline">
                                <div class="dna-timeline-track"></div>
                                <div class="dna-timeline-nodes">
                                    ${v.timeline.map(item => `
                                        <div class="dna-timeline-node" onclick="OwnerView.showHistoryItemDetails(${item.id})">
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
                        <div class="dna-protection-card">
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
                    </main>

                    <!-- 4. Barra de Navegação Inferior Fixa (5 Itens) -->
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

                    <!-- 5. Backdrop Escurecido do Menu Lateral -->
                    <div id="dna-drawer-backdrop" class="dna-drawer-backdrop ${activeDrawerClass}" onclick="OwnerView.toggleDrawer(false)"></div>

                    <!-- 6. Menu Lateral Aberto (Drawer Fiel à Imagem) -->
                    <aside id="dna-owner-drawer" class="dna-app-drawer ${activeDrawerClass}">
                        
                        <!-- Topo do Drawer com Botão Fechar -->
                        <div class="dna-drawer-header">
                            <button class="dna-drawer-close-btn" onclick="OwnerView.toggleDrawer(false)" title="Fechar Menu">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <!-- Card de Perfil do Usuário -->
                        <div class="dna-drawer-profile-card">
                            <div class="dna-profile-avatar-box">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" onerror="this.src='/img/car-silhouette.svg'" />
                            </div>
                            <div class="dna-profile-info">
                                <h3 class="dna-profile-name">${v.user_name}</h3>
                                <a href="javascript:void(0)" class="dna-profile-role" onclick="OwnerView.toggleDrawer(false)">${v.user_role}</a>
                            </div>
                        </div>

                        <!-- 9 Itens do Menu com Ícones e Setas > -->
                        <div class="dna-drawer-menu-list">
                            
                            <!-- 1. Início (Ativo) -->
                            <div class="dna-menu-item active" onclick="OwnerView.switchTab('home'); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    </div>
                                    <span>Início</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 2. Meu Veículo -->
                            <div class="dna-menu-item" onclick="OwnerView.showVehicleModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="13" rx="3"/><path d="M16 2l3 5H5l3-5z"/><circle cx="7" cy="15" r="2"/><circle cx="17" cy="15" r="2"/></svg>
                                    </div>
                                    <span>Meu Veículo</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 3. Certificação DNA AUTO -->
                            <div class="dna-menu-item" onclick="OwnerView.showCertificationModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                                    </div>
                                    <span>Certificação DNA AUTO</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 4. Histórico do Veículo -->
                            <div class="dna-menu-item" onclick="OwnerView.showHistoryModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    </div>
                                    <span>Histórico do Veículo</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 5. Documentos -->
                            <div class="dna-menu-item" onclick="OwnerView.showDocumentsModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                    </div>
                                    <span>Documentos</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 6. Diagnóstico OBD -->
                            <div class="dna-menu-item" onclick="OwnerView.showObdModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>
                                    </div>
                                    <span>Diagnóstico OBD</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 7. Lembretes -->
                            <div class="dna-menu-item" onclick="OwnerView.showRemindersModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                    </div>
                                    <span>Lembretes</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 8. Oficinas Credenciadas -->
                            <div class="dna-menu-item" onclick="OwnerView.showWorkshopsModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    </div>
                                    <span>Oficinas Credenciadas</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>

                            <!-- 9. Configurações -->
                            <div class="dna-menu-item" onclick="OwnerView.showSettingsModal(); OwnerView.toggleDrawer(false);">
                                <div class="dna-menu-item-left">
                                    <div class="dna-menu-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                    </div>
                                    <span>Configurações</span>
                                </div>
                                <svg class="dna-menu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </div>

                        <!-- Rodapé Inferior com Card de Segurança DNA AUTO -->
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

    // ── Modais de Detalhes e Ações ──
    showCertificationModal() {
        alert('🛡️ Certificação DNA AUTO #DNA-2026-000184\n\n• Status: Válida e Homologada\n• Emissão: 08/09/2026 às 14:32\n• Hash Criptográfico: 8f72a94bc7210e3\n• Validador: Rede Credenciada DNA AUTO\n\nO certificado digital possui validade jurídica nacional e garante a integridade de todas as intervenções registradas.');
    },

    showVehicleModal() {
        alert('🚗 Meu Veículo:\n\n• Modelo: Volkswagen Gol 1.0 MPI Flex 12V 5p\n• Placa: ABC1D23\n• Ano: 2021/2022\n• Cor: Prata Sirius Metálico\n• Quilometragem: 87.542 km\n• Câmbio: Manual 5 marchas\n• Combustível: Flex (Álcool/Gasolina)\n• Status Geral: EM DIA (Sem pendências)');
    },

    showDocumentsModal() {
        alert('📄 Documentos do Veículo:\n\n1. CRLV-e Digital (Certificado de Registro e Licenciamento 2026): Regularizado\n2. Certificado DNA AUTO de Manutenção: Válido\n3. Laudo Cautelar e Histórico de Sinistros: Zero Apontamentos');
    },

    showHistoryModal() {
        alert('📜 Histórico Completo de Manutenções:\n\n1. 15/08/2026 - 85.200 km: Revisão Periódica (Veloce Auto Center)\n2. 22/07/2026 - 80.150 km: Troca de Óleo 5W40 e Filtros de Ar e Combustível\n3. 10/05/2026 - 74.300 km: Alinhamento Computadorizado 3D e Balanceamento\n4. 18/02/2026 - 69.800 km: Substituição de Pastilhas de Freio Dianteiras');
    },

    showHistoryItemDetails(id) {
        const item = this.vehicleData.timeline.find(t => t.id === id);
        if (item) {
            alert(`🔧 Registro de Serviço: ${item.title}\n\n• Data: ${item.date}\n• Odômetro: ${item.km}\n• Oficina: Veloce Auto Center Premium\n• Status: Registro Nível 3 Homologado com Peças e NF.`);
        }
    },

    showNotificationsModal() {
        alert('🔔 Suas Notificações:\n\n1. Revisão Periódica: Em dia (realizada em 15/08/2026)\n2. Certificação DNA AUTO: Validada com sucesso\n3. Lembrete: Próxima calibragem dos pneus recomendada');
    },

    showObdModal() {
        alert('⚡ Diagnóstico OBD-II:\n\n• Sensores: Temperatura e Pressão normais\n• Códigos de Falha (DTC): 0 códigos detectados\n• Injeção Eletrônica: 100% calibrada\n• Emissões: Em conformidade legal');
    },

    showRemindersModal() {
        alert('🔔 Lembretes Preventivos:\n\n1. Próxima Troca de Óleo: 90.000 km ou Novembro/2026\n2. Rodízio de Pneus: 95.000 km\n3. Renovação do Licenciamento: Outubro/2026');
    },

    showWorkshopsModal() {
        alert('📍 Oficinas Credenciadas DNA AUTO:\n\n• Veloce Auto Center Premium (Av. Brasil, 1500) - A 2.4 km\n• Bosch Car Service Centro - A 4.1 km\n• Auto Mecânica Confiança - A 5.8 km\n\nTodas as oficinas credenciadas registram com chancela digital oficial.');
    },

    showSettingsModal() {
        alert('⚙️ Configurações da Conta:\n\n• Usuário: João Silva (Cliente)\n• Notificações Push: Ativadas\n• Sincronização em Nuvem: Ativa\n• Modo Visual: Dark Obsidian Neon');
    }
};
