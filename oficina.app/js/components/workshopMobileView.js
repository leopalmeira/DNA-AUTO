/**
 * DNA AUTO - WORKSHOP MOBILE VIEW (DNA AUTO V2 - 12 TELAS OFICIAIS COM CARROSSEL 3D)
 * Reprodução fiel do layout oficial do Figma para o aplicativo mobile da oficina:
 * 1. Acesso da Oficina (Login Dark Automotivo)
 * 2. Início / Home (Header com hamburger, sino e logo; Olá Leandro; Banner; Ações Rápidas; Categorias 4x2; Outros serviços; Alerta Manutenções; Bottom Nav)
 * 3 a 7. Lançar Serviço com Stepper de 5 Passos (Veículo -> Serviço com Carrossel Vertical 3D Oficial -> Detalhes -> Fotos -> Confirmar)
 * 8. Clientes (Busca, cards detalhados, Ver histórico)
 * 9. Agenda (Carrossel semanal horizontal, horários e badges de status)
 * 10. Serviços Realizados (Busca, abas Todos/Andamento/Concluídos, histórico)
 * 11. Manutenções dos Clientes (Cards preventivos com badges coloridos de urgência)
 * 12. Menu Lateral Drawer (Tema obsidian, perfil, atalhos, rodapé com CNPJ)
 */

(function(window) {
    'use strict';

    const WorkshopView = {
        currentSection: 'dashboard',
        isMobileMode: true,
        selectedMobileVehicle: null,
        selectedMobileService: null,
        mobileActivePlate: '',
        wizardStep: 1, // 1: Veículo, 2: Serviço (Carrossel 3D), 3: Detalhes, 4: Fotos, 5: Confirmar
        servicePrice: '120,00',
        serviceDescription: '',
        serviceFinalNotes: '',
        attachedPhotos: [],
        invoicePhoto: null,
        drawerOpen: false,
        activeAgendaDate: '29',
        activeFilterTab: 'todos',
        _carouselCurrentIndex: 0,

        // Mockups oficiais de veículos cadastrados (Figma)
        mockupVehicles: [
            {
                id: 'veh_civic_touring',
                license_plate: 'ABC1D23',
                plate: 'ABC1D23',
                brand: 'Honda',
                model: 'Honda Civic Touring 1.5 Turbo',
                year: '2023',
                client_name: 'João da Silva',
                owner_name: 'João da Silva',
                client_phone: '(11) 98765-4321',
                photo_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80',
                mileage: 38200,
                status: 'Concluído'
            },
            {
                id: 'veh_corolla',
                license_plate: 'XYZ2E34',
                plate: 'XYZ2E34',
                brand: 'Toyota',
                model: 'Toyota Corolla 2.0',
                year: '2022',
                client_name: 'Maria Souza',
                owner_name: 'Maria Souza',
                client_phone: '(11) 91234-5678',
                photo_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80',
                mileage: 45000,
                status: 'Concluído'
            },
            {
                id: 'veh_palio',
                license_plate: 'DEF5F56',
                plate: 'DEF5F56',
                brand: 'Fiat',
                model: 'Fiat Palio 1.0',
                year: '2016',
                client_name: 'Carlos Pereira',
                owner_name: 'Carlos Pereira',
                client_phone: '(11) 99876-5432',
                photo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
                mileage: 98400,
                status: 'Em andamento'
            },
            {
                id: 'veh_onix',
                license_plate: 'GHI7H99',
                plate: 'GHI7H99',
                brand: 'Chevrolet',
                model: 'Chevrolet Onix 1.0',
                year: '2021',
                client_name: 'Roberto Lima',
                owner_name: 'Roberto Lima',
                client_phone: '(11) 98654-3210',
                photo_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
                mileage: 52100,
                status: 'Concluído'
            },
            {
                id: 'veh_fiesta',
                license_plate: 'JKL0A12',
                plate: 'JKL0A12',
                brand: 'Ford',
                model: 'Ford Fiesta',
                year: '2018',
                client_name: 'Ana Costa',
                owner_name: 'Ana Costa',
                client_phone: '(11) 97321-6547',
                photo_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80',
                mileage: 74200,
                status: 'Concluído'
            }
        ],

        // Catálogo oficial de serviços para o Carrossel Vertical 3D
        carouselServices: [
            {
                id: 'troca-oleo',
                title: 'Troca de óleo do motor',
                category: 'Motor',
                catKey: 'motor',
                desc: 'Substituição do lubrificante sintético e filtro de óleo conforme especificação do fabricante.',
                price: '120,00',
                icon: '🛢️'
            },
            {
                id: 'filtro-oleo',
                title: 'Filtro de óleo',
                category: 'Motor',
                catKey: 'motor',
                desc: 'Substituição do elemento filtrante para retenção de impurezas do cárter.',
                price: '45,00',
                icon: '⚙️'
            },
            {
                id: 'filtro-ar',
                title: 'Filtro de ar',
                category: 'Motor',
                catKey: 'motor',
                desc: 'Substituição do filtro de ar do motor para garantir admissão e queima eficiente.',
                price: '55,00',
                icon: '💨'
            },
            {
                id: 'correia-dentada',
                title: 'Correia dentada',
                category: 'Motor',
                catKey: 'motor',
                desc: 'Troca do kit de correia dentada e tensor para prevenção de colisão de válvulas.',
                price: '380,00',
                icon: '🔄'
            },
            {
                id: 'pastilhas-freio',
                title: 'Pastilhas de freio',
                category: 'Freios',
                catKey: 'freios',
                desc: 'Substituição das pastilhas de freio dianteiras e medição da espessura dos discos.',
                price: '160,00',
                icon: '🛑'
            },
            {
                id: 'amortecedores',
                title: 'Amortecedores e Suspensão',
                category: 'Suspensão',
                catKey: 'suspensao',
                desc: 'Inspeção e troca dos amortecedores, batentes, coifas e pivôs dianteiros.',
                price: '420,00',
                icon: '🛞'
            },
            {
                id: 'bateria',
                title: 'Bateria e Sistema Elétrico',
                category: 'Elétrica',
                catKey: 'eletrica',
                desc: 'Teste de CCA, tensão do alternador e instalação de bateria nova com selo Inmetro.',
                price: '390,00',
                icon: '⚡'
            },
            {
                id: 'ar-condicionado',
                title: 'Higienização de Ar-Condicionado',
                category: 'Ar-condicionado',
                catKey: 'ar',
                desc: 'Oxi-sanitização da cabine e troca do filtro de pólen/ar-condicionado.',
                price: '110,00',
                icon: '❄️'
            }
        ],

        // Categorias da Home
        categoriesList: [
            { id: 'motor', title: 'Motor e Lubrificação', icon: '🛢️' },
            { id: 'freios', title: 'Freios', icon: '🛑' },
            { id: 'suspensao', title: 'Suspensão', icon: '🛞' },
            { id: 'eletrica', title: 'Elétrica', icon: '⚡' },
            { id: 'ar', title: 'Ar-condicionado', icon: '❄️' },
            { id: 'pneus', title: 'Pneus', icon: '🔘' },
            { id: 'bateria', title: 'Bateria', icon: '🔋' },
            { id: 'direcao', title: 'Direção', icon: '🎯' }
        ],

        // Outros serviços
        otherServicesList: [
            { id: 'injecao', title: 'Injeção Eletrônica', icon: '💻' },
            { id: 'transmissao', title: 'Transmissão', icon: '⚙️' },
            { id: 'escapamento', title: 'Escapamento', icon: '💨' },
            { id: 'funilaria', title: 'Funilaria e Pintura', icon: '🎨' }
        ],

        // Agenda semanal (Mockup Figma)
        agendaItems: [
            { time: '08:00', client: 'João da Silva', plate: 'ABC1D23', model: 'Honda Civic', status: 'Em andamento', statusClass: 'dna-v2-badge-info' },
            { time: '10:30', client: 'Maria Souza', plate: 'XYZ2E34', model: 'Toyota Corolla', status: 'Pendente', statusClass: 'dna-v2-badge-warning' },
            { time: '13:45', client: 'Carlos Pereira', plate: 'DEF5F56', model: 'Fiat Palio', status: 'Confirmado', statusClass: 'dna-v2-badge-success' },
            { time: '16:20', client: 'Roberto Lima', plate: 'GHI7H99', model: 'Volkswagen Fox', status: 'Em andamento', statusClass: 'dna-v2-badge-info' }
        ],

        // Manutenções preventivas dos clientes (Mockup Figma)
        preventiveMaintenances: [
            { client: 'João da Silva', model: 'Revisão de 30 mil km', details: 'Troca de óleo, filtros e pastilhas', badge: 'Vence em 5 dias', badgeClass: 'dna-v2-badge-danger' },
            { client: 'Maria Souza', model: 'Revisão de 40 mil km', details: 'Troca de óleo e filtros', badge: 'Em 20 dias', badgeClass: 'dna-v2-badge-warning' },
            { client: 'Carlos Pereira', model: 'Revisão de 50 mil km', details: 'Pastilhas e fluido de freio', badge: 'Em 45 dias', badgeClass: 'dna-v2-badge-success' },
            { client: 'Roberto Lima', model: 'Revisão de 60 mil km', details: 'Alinhamento e balanceamento', badge: 'Em 60 dias', badgeClass: 'dna-v2-badge-info' },
            { client: 'Promoção especial', model: 'Troca de óleo com 20% de desconto até o final do mês', details: 'Válido para clientes cadastrados', badge: 'Seg 08:45', badgeClass: 'dna-v2-badge-info' }
        ]
    };

    // Stubs de compatibilidade com módulos legados
    WorkshopView.monitoredServicesCatalog = WorkshopView.carouselServices;
    WorkshopView.launchCarouselServices = WorkshopView.carouselServices;

    // Recupera lista de veículos unificada
    WorkshopView.getEffectiveVehiclesList = function() {
        const local = (this.dashboardData && this.dashboardData.vehicles) || [];
        const merged = [...this.mockupVehicles];
        local.forEach(lv => {
            const exists = merged.some(m => (m.license_plate || m.plate) === (lv.license_plate || lv.plate));
            if (!exists) merged.unshift(lv);
        });
        return merged;
    };

    // Localiza veículo por placa
    WorkshopView.findVehicleByPlate = function(plate) {
        if (!plate) return null;
        const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return this.getEffectiveVehiclesList().find(v => (v.license_plate || v.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === clean) || null;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL DO APP DA OFICINA
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.render = function() {
        const root = document.getElementById('ws-mobile-active-viewport') || 
                     document.getElementById('mobile-viewport') || 
                     document.getElementById('app') || 
                     document.body;

        const token = localStorage.getItem('dna_token');
        const user = localStorage.getItem('dna_logged_user');

        // Se não autenticado, exibe Tela 1 (Login Dark)
        if (!token || !user) {
            root.innerHTML = this.renderLoginView();
            return;
        }

        root.innerHTML = `
            <div class="dna-v2-shell">
                <!-- Header Top Bar -->
                ${this.renderHeader()}

                <!-- Conteúdo da Seção Ativa -->
                <main id="dna-v2-main-content">
                    ${this.renderActiveSection()}
                </main>

                <!-- Bottom Navigation Bar Fixa -->
                ${this.renderBottomNav()}

                <!-- Menu Drawer Lateral Obsidian -->
                ${this.renderDrawer()}
            </div>
        `;

        // Se estiver na etapa de carrossel, inicializa a física 3D
        if (this.currentSection === 'lancar-servicos' && this.wizardStep === 2) {
            setTimeout(() => this.initVerticalCardCarousel(), 50);
        }
    };

    // Alternador de Seção
    WorkshopView.switchMobileSection = function(sectionId, step = 1) {
        this.currentSection = sectionId;
        if (sectionId === 'lancar-servicos') {
            this.wizardStep = step;
        }
        this.closeDrawer();
        const main = document.getElementById('dna-v2-main-content');
        if (main) {
            main.innerHTML = this.renderActiveSection();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (sectionId === 'lancar-servicos' && this.wizardStep === 2) {
                setTimeout(() => this.initVerticalCardCarousel(), 50);
            }
            this.updateBottomNavState();
        } else {
            this.render();
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 1: LOGIN OFICIAL DA OFICINA (DARK COM DIAMANTE LUMINOSO)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderLoginView = function() {
        return `
            <div class="dna-v2-login-wrap">
                <div style="text-align:center; margin-bottom:28px;">
                    <div style="font-size:48px; filter:drop-shadow(0 0 16px #00D4FF); margin-bottom:6px;">🔷</div>
                    <div style="font-size:24px; font-weight:900; letter-spacing:2px; color:#FFFFFF;">DNA AUTO</div>
                    <div style="font-size:10px; font-weight:700; color:#00D4FF; letter-spacing:3px; margin-top:2px;">TECNOLOGIA QUE PROTEGE</div>
                </div>

                <div class="dna-v2-login-card">
                    <h2 style="font-size:16px; font-weight:800; color:#FFFFFF; margin-bottom:18px;">Acesso da Oficina</h2>

                    <form onsubmit="event.preventDefault(); WorkshopView.handleLoginSubmit();">
                        <div style="margin-bottom:14px;">
                            <div style="position:relative;">
                                <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">✉️</span>
                                <input 
                                    type="email" 
                                    id="ws-v2-login-email" 
                                    class="dna-input-field" 
                                    value="leandro2703palmeira@gmail.com" 
                                    placeholder="E-mail da oficina" 
                                    required 
                                    style="width:100%; padding:14px 14px 14px 42px; border-radius:12px; font-size:13px;"
                                />
                            </div>
                        </div>

                        <div style="margin-bottom:18px;">
                            <div style="position:relative;">
                                <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">🔒</span>
                                <input 
                                    type="password" 
                                    id="ws-v2-login-pass" 
                                    class="dna-input-field" 
                                    value="123456" 
                                    placeholder="Senha de acesso" 
                                    required 
                                    style="width:100%; padding:14px 42px 14px 42px; border-radius:12px; font-size:13px;"
                                />
                                <span onclick="WorkshopView.togglePassVisibility()" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B; cursor:pointer;">👁️</span>
                            </div>
                        </div>

                        <button type="submit" class="dna-primary-btn" style="width:100%; height:48px; border-radius:12px; font-size:15px; font-weight:800; background:#0066FF; box-shadow:0 4px 14px rgba(0, 102, 255, 0.4);">
                            Entrar
                        </button>
                    </form>

                    <div style="text-align:center; margin-top:16px; font-size:12px;">
                        <a href="javascript:void(0)" onclick="alert('Instruções de redefinição enviadas para seu e-mail cadastrado.')" style="color:#00D4FF; text-decoration:none;">Esqueceu sua senha?</a>
                        <div style="margin-top:6px;">
                            <a href="javascript:void(0)" onclick="WorkshopView.showOficinaRegisterScreen()" style="color:#94A3B8; text-decoration:underline;">Cadastre-se</a>
                        </div>
                    </div>
                </div>

                <div style="margin-top:32px; font-size:11px; color:#475569; display:flex; align-items:center; gap:6px;">
                    <span>🔷</span> <span>DNA AUTO v1.0.0</span>
                </div>
            </div>
        `;
    };

    WorkshopView.togglePassVisibility = function() {
        const input = document.getElementById('ws-v2-login-pass');
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    };

    WorkshopView.handleLoginSubmit = function() {
        const email = (document.getElementById('ws-v2-login-email') || {}).value || 'leandro2703palmeira@gmail.com';
        localStorage.setItem('dna_token', 'token_oficina_conectada_leandro');
        localStorage.setItem('dna_logged_user', JSON.stringify({
            name: 'Leandro',
            email: email,
            role: 'WORKSHOP',
            trade_name: 'Oficina Exemplo'
        }));
        localStorage.setItem('dna_workshop_id', 'ws_veloce');
        this.render();
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TOP BAR NAVEGACIONAL
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderHeader = function() {
        const isHome = this.currentSection === 'dashboard';
        const titleMap = {
            'dashboard': 'DNA AUTO',
            'lancar-servicos': 'Lançar Serviço',
            'clientes': 'Clientes',
            'agenda': 'Agenda',
            'servicos-realizados': 'Serviços Realizados',
            'manutencoes-clientes': 'Manutenções dos Clientes',
            'entrada-veiculos': 'Entrada de Veículos'
        };
        const title = titleMap[this.currentSection] || 'DNA AUTO';

        if (isHome) {
            return `
                <header class="dna-v2-top-bar">
                    <button type="button" class="dna-v2-top-bar-btn" onclick="WorkshopView.openDrawer()" title="Menu">
                        ☰
                    </button>
                    <div class="dna-v2-brand-center">
                        <span class="dna-v2-brand-diamond">🔷</span>
                        <span>DNA AUTO</span>
                    </div>
                    <button type="button" class="dna-v2-top-bar-btn" onclick="WorkshopView.switchMobileSection('manutencoes-clientes')" title="Notificações" style="position:relative;">
                        🔔
                        <span style="position:absolute; top:6px; right:6px; width:8px; height:8px; background:#EF4444; border-radius:50%;"></span>
                    </button>
                </header>
            `;
        }

        return `
            <header class="dna-v2-top-bar light">
                <button type="button" class="dna-v2-top-bar-btn" onclick="WorkshopView.handleHeaderBack()" title="Voltar">
                    ←
                </button>
                <div style="font-size:15px; font-weight:800; color:#0F172A;">
                    ${title}
                </div>
                <div style="width:32px;"></div>
            </header>
        `;
    };

    WorkshopView.handleHeaderBack = function() {
        if (this.currentSection === 'lancar-servicos') {
            if (this.wizardStep > 1) {
                this.wizardStep--;
                this.switchMobileSection('lancar-servicos', this.wizardStep);
                return;
            }
        }
        this.switchMobileSection('dashboard');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // BOTTOM NAVIGATION BAR FIXA (5 ABAS)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderBottomNav = function() {
        const s = this.currentSection;
        return `
            <nav class="dna-v2-bottom-nav">
                <button type="button" class="dna-v2-nav-btn ${s === 'dashboard' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('dashboard')">
                    <span class="nav-icon">🏠</span>
                    <span>Início</span>
                </button>
                <button type="button" class="dna-v2-nav-btn ${s === 'lancar-servicos' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)">
                    <span class="nav-icon">🔧</span>
                    <span>Serviços</span>
                </button>
                <button type="button" class="dna-v2-nav-btn ${s === 'clientes' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('clientes')">
                    <span class="nav-icon">👥</span>
                    <span>Clientes</span>
                </button>
                <button type="button" class="dna-v2-nav-btn ${s === 'agenda' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('agenda')">
                    <span class="nav-icon">📅</span>
                    <span>Agenda</span>
                </button>
                <button type="button" class="dna-v2-nav-btn" onclick="WorkshopView.openDrawer()">
                    <span class="nav-icon">☰</span>
                    <span>Menu</span>
                </button>
            </nav>
        `;
    };

    WorkshopView.updateBottomNavState = function() {
        const nav = document.querySelector('.dna-v2-bottom-nav');
        if (nav) {
            nav.outerHTML = this.renderBottomNav();
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // MENU DRAWER OBSIDIAN (TELA 12)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderDrawer = function() {
        const s = this.currentSection;
        return `
            <div class="dna-v2-drawer-overlay ${this.drawerOpen ? 'open' : ''}" onclick="WorkshopView.closeDrawer()">
                <div class="dna-v2-drawer-panel" onclick="event.stopPropagation()">
                    <div class="dna-v2-drawer-header">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="color:#00D4FF; font-size:20px;">🔷</span>
                            <strong style="font-size:16px; letter-spacing:1px;">DNA AUTO</strong>
                        </div>
                        <button type="button" onclick="WorkshopView.closeDrawer()" style="background:transparent; border:none; color:#94A3B8; font-size:20px; cursor:pointer;">
                            ✕
                        </button>
                    </div>

                    <div class="dna-v2-drawer-user">
                        <div class="dna-v2-drawer-avatar">L</div>
                        <div>
                            <div style="font-size:14px; font-weight:800; color:#FFFFFF;">Leandro</div>
                            <div style="font-size:11px; color:#10B981; display:flex; align-items:center; gap:4px; margin-top:2px;">
                                <span style="display:inline-block; width:6px; height:6px; background:#10B981; border-radius:50%;"></span>
                                Oficina Conectada
                            </div>
                        </div>
                    </div>

                    <div class="dna-v2-drawer-menu">
                        <div class="dna-v2-drawer-link ${s === 'dashboard' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('dashboard')">
                            <span>🏠</span> <span>Início</span>
                        </div>
                        <div class="dna-v2-drawer-link ${s === 'entrada-veiculos' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('entrada-veiculos')">
                            <span>🚗</span> <span>Entrada de Veículo</span>
                        </div>
                        <div class="dna-v2-drawer-link ${s === 'lancar-servicos' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)">
                            <span>🔧</span> <span>Lançar Serviço</span>
                        </div>
                        <div class="dna-v2-drawer-link ${s === 'servicos-realizados' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('servicos-realizados')">
                            <span>📋</span> <span>Serviços Realizados</span>
                        </div>
                        <div class="dna-v2-drawer-link ${s === 'manutencoes-clientes' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('manutencoes-clientes')">
                            <span>👤</span> <span>Manutenção dos Clientes</span>
                        </div>
                        <div class="dna-v2-drawer-link ${s === 'agenda' ? 'active' : ''}" onclick="WorkshopView.switchMobileSection('agenda')">
                            <span>📅</span> <span>Agenda</span>
                        </div>
                        <div class="dna-v2-drawer-link" onclick="window.open('https://web.whatsapp.com', '_blank')">
                            <span>💬</span> <span>WhatsApp</span>
                        </div>
                        <div class="dna-v2-drawer-link" onclick="alert('Configurações da Oficina: Emissão de Nota Fiscal, Dados Cadastrais e Integrações ativas.')">
                            <span>⚙️</span> <span>Configurações</span>
                        </div>
                    </div>

                    <div class="dna-v2-drawer-footer">
                        <div style="font-weight:700; color:#FFFFFF; margin-bottom:2px;">🏢 Oficina Exemplo</div>
                        <div>CNPJ: 12.345.678/0001-90</div>
                    </div>
                </div>
            </div>
        `;
    };

    WorkshopView.openDrawer = function() {
        this.drawerOpen = true;
        const overlay = document.querySelector('.dna-v2-drawer-overlay');
        if (overlay) overlay.classList.add('open');
    };

    WorkshopView.closeDrawer = function() {
        this.drawerOpen = false;
        const overlay = document.querySelector('.dna-v2-drawer-overlay');
        if (overlay) overlay.classList.remove('open');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // ROTEADOR DE SEÇÃO ATIVA
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderActiveSection = function() {
        switch (this.currentSection) {
            case 'lancar-servicos':
                return this.renderLancarServicosStepperView();
            case 'clientes':
                return this.renderClientesView();
            case 'agenda':
                return this.renderAgendaView();
            case 'servicos-realizados':
                return this.renderServicosRealizadosView();
            case 'manutencoes-clientes':
                return this.renderManutencoesClientesView();
            case 'entrada-veiculos':
                return this.renderEntradaVeiculosView();
            case 'dashboard':
            default:
                return this.renderHomeDashboardView();
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 2: INÍCIO / HOME (OFICIAL DO FIGMA)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderHomeDashboardView = function() {
        return `
            <div style="padding: 16px 0 20px;">
                <!-- Saudação do Usuário com Selo Oficina Conectada -->
                <div style="padding: 0 16px; margin-bottom: 12px;">
                    <h1 style="font-size:18px; font-weight:900; color:#0F172A; margin:0 0 2px;">Olá, Leandro</h1>
                    <div style="font-size:12px; font-weight:700; color:#10B981; display:flex; align-items:center; gap:6px;">
                        <span style="width:7px; height:7px; background:#10B981; border-radius:50%; box-shadow:0 0 6px #10B981;"></span>
                        Oficina Conectada
                    </div>
                </div>

                <!-- Banner Card Informativo -->
                <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:14px 16px; margin:0 16px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:#0066FF; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px;">
                            ⭐
                        </div>
                        <div>
                            <div style="font-size:13px; font-weight:800; color:#1E3A8A;">Sua oficina em boas mãos!</div>
                            <div style="font-size:11px; color:#3B82F6; margin-top:2px;">Mais organização, agilidade e controle de todos os serviços</div>
                        </div>
                    </div>
                    <span style="font-size:18px; color:#3B82F6; font-weight:bold;">›</span>
                </div>

                <!-- Ações Rápidas: Cadastrar Veículo & Lançar Serviço -->
                <div class="dna-v2-actions-grid">
                    <div class="dna-v2-action-card" onclick="WorkshopView.switchMobileSection('entrada-veiculos')">
                        <div class="dna-v2-action-card-icon">🚗</div>
                        <div>
                            <div class="dna-v2-action-card-title">Cadastrar Veículo</div>
                            <div class="dna-v2-action-card-sub">Registrar novo veículo ›</div>
                        </div>
                    </div>

                    <div class="dna-v2-action-card secondary" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)">
                        <div class="dna-v2-action-card-icon">🔧</div>
                        <div>
                            <div class="dna-v2-action-card-title">Lançar Serviço</div>
                            <div class="dna-v2-action-card-sub">Registrar manutenção ›</div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Serviços por Categoria (Grade 4x2) -->
                <div style="padding: 0 16px; margin-top: 14px;">
                    <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">Serviços por categoria</div>
                </div>
                <div class="dna-v2-cat-grid">
                    ${this.categoriesList.map(cat => `
                        <div class="dna-v2-cat-item" onclick="WorkshopView.handleCategorySelect('${cat.id}')">
                            <div class="dna-v2-cat-icon">${cat.icon}</div>
                            <div class="dna-v2-cat-title">${cat.title}</div>
                        </div>
                    `).join('')}
                </div>

                <!-- Seção: Outros Serviços (Chips) -->
                <div style="padding: 0 16px; margin-top: 4px;">
                    <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">Outros serviços</div>
                </div>
                <div class="dna-v2-chips-grid">
                    ${this.otherServicesList.map(item => `
                        <button type="button" class="dna-v2-chip-btn" onclick="WorkshopView.handleCategorySelect('${item.id}')">
                            <span>${item.icon}</span>
                            <span>${item.title}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Alerta: Manutenções dos Clientes -->
                <div class="dna-v2-alert-card" onclick="WorkshopView.switchMobileSection('manutencoes-clientes')">
                    <div class="dna-v2-alert-icon-box">🛡️</div>
                    <div style="flex:1;">
                        <div class="dna-v2-alert-title">Manutenções dos Clientes</div>
                        <div class="dna-v2-alert-desc">Você tem 5 veículos com manutenções pendentes.</div>
                    </div>
                    <span style="font-size:18px; color:#94A3B8;">›</span>
                </div>
            </div>
        `;
    };

    WorkshopView.handleCategorySelect = function(catId) {
        const found = this.carouselServices.find(s => s.catKey === catId || s.id === catId) || this.carouselServices[0];
        this.selectedMobileService = found;
        if (!this.selectedMobileVehicle) {
            this.selectedMobileVehicle = this.mockupVehicles[0];
        }
        // Direciona para o Stepper na etapa do Carrossel 3D
        this.switchMobileSection('lancar-servicos', 2);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELAS 3 A 7: FLUXO LANÇAR SERVIÇO COM STEPPER DE 5 PASSOS
    // E CARROSSEL VERTICAL 3D OFICIAL NA ETAPA 2!
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderLancarServicosStepperView = function() {
        return `
            <div style="background:#FFFFFF; min-height:calc(100vh - 120px);">
                <!-- Componente Stepper de 5 Passos -->
                <div class="dna-v2-stepper-wrap">
                    <div class="dna-v2-stepper">
                        <div class="dna-v2-step-line">
                            <div class="dna-v2-step-line-fill" style="width:${(this.wizardStep - 1) * 25}%;"></div>
                        </div>

                        <div class="dna-v2-step-node ${this.wizardStep === 1 ? 'active' : (this.wizardStep > 1 ? 'completed' : '')}" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)">
                            <div class="dna-v2-step-circle">${this.wizardStep > 1 ? '✓' : '1'}</div>
                            <div class="dna-v2-step-label">Veículo</div>
                        </div>

                        <div class="dna-v2-step-node ${this.wizardStep === 2 ? 'active' : (this.wizardStep > 2 ? 'completed' : '')}" onclick="if(WorkshopView.selectedMobileVehicle) WorkshopView.switchMobileSection('lancar-servicos', 2)">
                            <div class="dna-v2-step-circle">${this.wizardStep > 2 ? '✓' : '2'}</div>
                            <div class="dna-v2-step-label">Serviço</div>
                        </div>

                        <div class="dna-v2-step-node ${this.wizardStep === 3 ? 'active' : (this.wizardStep > 3 ? 'completed' : '')}" onclick="if(WorkshopView.selectedMobileService) WorkshopView.switchMobileSection('lancar-servicos', 3)">
                            <div class="dna-v2-step-circle">${this.wizardStep > 3 ? '✓' : '3'}</div>
                            <div class="dna-v2-step-label">Detalhes</div>
                        </div>

                        <div class="dna-v2-step-node ${this.wizardStep === 4 ? 'active' : (this.wizardStep > 4 ? 'completed' : '')}" onclick="if(WorkshopView.selectedMobileService) WorkshopView.switchMobileSection('lancar-servicos', 4)">
                            <div class="dna-v2-step-circle">${this.wizardStep > 4 ? '✓' : '4'}</div>
                            <div class="dna-v2-step-label">Fotos</div>
                        </div>

                        <div class="dna-v2-step-node ${this.wizardStep === 5 ? 'active' : ''}" onclick="if(WorkshopView.selectedMobileService) WorkshopView.switchMobileSection('lancar-servicos', 5)">
                            <div class="dna-v2-step-circle">5</div>
                            <div class="dna-v2-step-label">Confirmar</div>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo do Passo Atual -->
                <div style="padding: 16px;">
                    ${this.renderCurrentWizardStepContent()}
                </div>
            </div>
        `;
    };

    WorkshopView.renderCurrentWizardStepContent = function() {
        switch (this.wizardStep) {
            case 1:
                return this.renderWizardStep1();
            case 2:
                return this.renderWizardStep2();
            case 3:
                return this.renderWizardStep3();
            case 4:
                return this.renderWizardStep4();
            case 5:
                return this.renderWizardStep5();
            default:
                return this.renderWizardStep1();
        }
    };

    // ETAPA 1: SELEÇÃO / BUSCA DE VEÍCULO
    WorkshopView.renderWizardStep1 = function() {
        const vehicles = this.getEffectiveVehiclesList();
        return `
            <div>
                <!-- Busca de Placa -->
                <div style="position:relative; margin-bottom:16px;">
                    <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">🔍</span>
                    <input 
                        type="text" 
                        id="wizard-step1-search-input" 
                        class="dna-input-field" 
                        placeholder="Digite a placa do veículo" 
                        oninput="WorkshopView.filterWizardVehicles(this.value)"
                        style="width:100%; padding:14px 14px 14px 40px; border-radius:12px; font-size:13px; text-transform:uppercase;"
                    />
                </div>

                <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:12px;">Veículos cadastrados</div>

                <!-- Lista de Veículos -->
                <div id="wizard-step1-vehicles-list" style="display:flex; flex-direction:column; gap:10px;">
                    ${vehicles.map(v => `
                        <div 
                            style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:12px; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.03);"
                            onclick="WorkshopView.selectVehicleForWizard('${v.license_plate || v.plate}')"
                        >
                            <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:68px; height:48px; border-radius:8px; object-fit:cover; border:1px solid #E2E8F0;" />
                            <div style="flex:1;">
                                <div style="font-size:13px; font-weight:800; color:#0F172A;">${v.model}</div>
                                <div style="font-size:11px; font-weight:700; color:#0066FF; margin-top:2px;">${v.license_plate || v.plate}</div>
                                <div style="font-size:11px; color:#64748B; margin-top:1px;">Cliente: ${v.client_name || v.owner_name || 'Cliente da Rede'}</div>
                            </div>
                            <span style="color:#94A3B8; font-size:18px;">›</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    WorkshopView.selectVehicleForWizard = function(plate) {
        const v = this.findVehicleByPlate(plate) || this.mockupVehicles[0];
        this.selectedMobileVehicle = v;
        this.switchMobileSection('lancar-servicos', 2);
    };

    WorkshopView.filterWizardVehicles = function(query) {
        const clean = (query || '').trim().toUpperCase();
        const listEl = document.getElementById('wizard-step1-vehicles-list');
        if (!listEl) return;
        const all = this.getEffectiveVehiclesList();
        const filtered = all.filter(v => (v.license_plate || v.plate || '').toUpperCase().includes(clean) || (v.model || '').toUpperCase().includes(clean) || (v.client_name || '').toUpperCase().includes(clean));
        listEl.innerHTML = filtered.map(v => `
            <div 
                style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:12px; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.03);"
                onclick="WorkshopView.selectVehicleForWizard('${v.license_plate || v.plate}')"
            >
                <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:68px; height:48px; border-radius:8px; object-fit:cover; border:1px solid #E2E8F0;" />
                <div style="flex:1;">
                    <div style="font-size:13px; font-weight:800; color:#0F172A;">${v.model}</div>
                    <div style="font-size:11px; font-weight:700; color:#0066FF; margin-top:2px;">${v.license_plate || v.plate}</div>
                    <div style="font-size:11px; color:#64748B; margin-top:1px;">Cliente: ${v.client_name || v.owner_name || 'Cliente da Rede'}</div>
                </div>
                <span style="color:#94A3B8; font-size:18px;">›</span>
            </div>
        `).join('');
    };

    // ETAPA 2: SELEÇÃO DE SERVIÇO COM O CARROSSEL VERTICAL 3D OFICIAL!
    WorkshopView.renderWizardStep2 = function() {
        const v = this.selectedMobileVehicle || this.mockupVehicles[0];
        const services = this.carouselServices;
        const currentService = this.selectedMobileService || services[0];

        return `
            <div>
                <!-- Card do Veículo Selecionado -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:54px; height:40px; border-radius:8px; object-fit:cover;" />
                        <div>
                            <div style="font-size:12.5px; font-weight:800; color:#0F172A;">${v.model}</div>
                            <div style="font-size:11px; color:#64748B;">${v.license_plate || v.plate} • Cliente: ${v.client_name || v.owner_name || 'João da Silva'}</div>
                        </div>
                    </div>
                    <button type="button" onclick="WorkshopView.switchMobileSection('lancar-servicos', 1)" style="background:transparent; border:none; color:#0066FF; font-size:11px; font-weight:700; cursor:pointer; text-decoration:underline;">
                        Trocar veículo
                    </button>
                </div>

                <!-- Título da Seção do Carrossel 3D -->
                <div style="text-align:center; margin-bottom:8px;">
                    <span style="font-size:15px; font-weight:800; color:#0F172A;">
                        Selecione o serviço no Carrossel
                    </span>
                    <div style="font-size:11px; color:#64748B; margin-top:2px;">
                        Deslize verticalmente ↕ e toque no serviço desejado
                    </div>
                </div>

                <!-- O CARROSSEL VERTICAL 3D OFICIAL DNA AUTO (PERFEITAMENTE CENTRALIZADO & AURA CYBER) -->
                <div class="carousel" id="dna-vertical-carousel" style="background:#0A0F1D; border-radius:16px; border:1px solid rgba(0,212,255,0.2); box-shadow:0 8px 24px rgba(0,0,0,0.3);">
                    <div class="viewport">
                        <div class="cards" id="dna-carousel-cards-track">
                            ${services.map((s, idx) => `
                                <div class="card ${idx === 0 ? 'active' : ''}" data-service-id="${s.id}" data-index="${idx}" onclick="WorkshopView.selectCarouselCard(${idx})">
                                    <div class="icon">${s.icon}</div>
                                    <div class="info">
                                        <h2>${s.title}</h2>
                                        <p>${s.desc}</p>
                                    </div>
                                    <div class="arrow">›</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="fade top"></div>
                        <div class="fade bottom"></div>
                    </div>

                    <div class="indicator" id="dna-carousel-indicator"></div>

                    <div class="controls">
                        <button type="button" class="control" id="carousel-up-btn" onclick="WorkshopView.moveCarousel(-1)" title="Subir">↑</button>
                        <button type="button" class="control" id="carousel-down-btn" onclick="WorkshopView.moveCarousel(1)" title="Descer">↓</button>
                    </div>
                </div>

                <!-- Botão de Confirmação e Avanço para Etapa 3 -->
                <button 
                    type="button" 
                    class="dna-primary-btn" 
                    id="carousel-action-btn"
                    onclick="WorkshopView.confirmCarouselServiceAndAdvance()"
                    style="width:100%; height:48px; border-radius:12px; font-size:14px; font-weight:800; background:#0066FF; color:#FFFFFF; margin-top:14px; box-shadow:0 4px 14px rgba(0,102,255,0.3);"
                >
                    <span id="carousel-action-btn-text">Confirmar Serviço: ${currentService.title} →</span>
                </button>
            </div>
        `;
    };

    WorkshopView.confirmCarouselServiceAndAdvance = function() {
        const current = this._carouselCurrentIndex || 0;
        const s = this.carouselServices[current] || this.carouselServices[0];
        this.selectedMobileService = s;
        this.serviceDescription = s.desc;
        this.servicePrice = s.price || '120,00';
        this.switchMobileSection('lancar-servicos', 3);
    };

    // ETAPA 3: DETALHES DO SERVIÇO (RESUMO, PREÇO, FOTOS DA PEÇA E DESCRIÇÃO)
    WorkshopView.renderWizardStep3 = function() {
        const v = this.selectedMobileVehicle || this.mockupVehicles[0];
        const s = this.selectedMobileService || this.carouselServices[0];

        return `
            <div>
                <!-- Resumo Veículo -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:54px; height:40px; border-radius:8px; object-fit:cover;" />
                    <div style="flex:1;">
                        <div style="font-size:12.5px; font-weight:800; color:#0F172A;">${v.model}</div>
                        <div style="font-size:11px; color:#64748B;">${v.license_plate || v.plate} • Cliente: ${v.client_name || v.owner_name || 'João da Silva'}</div>
                    </div>
                </div>

                <!-- Resumo do Serviço Escolhido com Preço -->
                <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:24px;">${s.icon}</span>
                            <div>
                                <div style="font-size:13px; font-weight:800; color:#0F172A;">${s.title}</div>
                                <div style="font-size:11px; color:#0066FF; font-weight:600;">${s.category}</div>
                            </div>
                        </div>
                        <div style="font-size:15px; font-weight:900; color:#0F172A;">
                            R$ ${this.servicePrice}
                        </div>
                    </div>
                </div>

                <!-- Fotos da Peça (Slots + Adicionar Foto) -->
                <div style="margin-bottom:16px;">
                    <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">Fotos da peça</div>
                    <div style="display:flex; gap:10px; align-items:center; overflow-x:auto; padding:4px 0;">
                        <div style="width:72px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0; position:relative; flex-shrink:0;">
                            <img src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=200&q=80" alt="Peça 1" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <div style="width:72px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0; position:relative; flex-shrink:0;">
                            <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80" alt="Peça 2" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <label style="width:72px; height:72px; border-radius:10px; border:1.5px dashed #0066FF; background:#F0F7FF; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
                            <span style="font-size:20px; color:#0066FF; font-weight:bold;">+</span>
                            <span style="font-size:9px; color:#0066FF; font-weight:700; text-align:center; padding:0 4px;">Adicionar foto</span>
                            <input type="file" accept="image/*" style="display:none;" onchange="WorkshopView.handlePhotoUpload(this)" />
                        </label>
                    </div>
                </div>

                <!-- Descrição do Serviço com Contador 0/500 -->
                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                        <label style="font-size:12.5px; font-weight:800; color:#0F172A;">Descrição do serviço</label>
                        <span id="wizard-step3-counter" style="font-size:11px; color:#94A3B8;">0/500</span>
                    </div>
                    <textarea 
                        id="wizard-step3-desc"
                        class="dna-input-field" 
                        rows="4" 
                        maxlength="500"
                        placeholder="Descreva o que foi feito, condições do veículo, etc..."
                        oninput="WorkshopView.updateStep3Desc(this.value)"
                        style="width:100%; padding:12px; border-radius:12px; font-size:12.5px;"
                    >${this.serviceDescription || 'Troca de óleo do motor e substituição do filtro de óleo. Serviço realizado conforme recomendação do fabricante.'}</textarea>
                </div>

                <!-- Botões de Navegação (Voltar / Próximo) -->
                <div style="display:flex; gap:12px;">
                    <button type="button" class="dna-secondary-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos', 2)" style="flex:1; height:46px; border-radius:12px; font-weight:700; background:#F1F5F9; color:#334155; border:1px solid #CBD5E1;">
                        ← Voltar
                    </button>
                    <button type="button" class="dna-primary-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos', 4)" style="flex:1; height:46px; border-radius:12px; font-weight:800; background:#0066FF; color:#FFFFFF;">
                        Próximo →
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.updateStep3Desc = function(val) {
        this.serviceDescription = val;
        const counter = document.getElementById('wizard-step3-counter');
        if (counter) counter.textContent = (val.length) + '/500';
    };

    // ETAPA 4: FOTOS ADICIONAIS E NOTA FISCAL (OPCIONAL)
    WorkshopView.renderWizardStep4 = function() {
        return `
            <div>
                <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:12px;">Fotos do serviço (opcional)</div>

                <!-- Fotos da Peça Substituída -->
                <div style="margin-bottom:16px;">
                    <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:6px;">Fotos da peça substituída</div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div style="width:72px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=200&q=80" alt="Foto 1" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <div style="width:72px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80" alt="Foto 2" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <label style="width:72px; height:72px; border-radius:10px; border:1.5px dashed #CBD5E1; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                            <span style="font-size:24px; color:#0066FF;">+</span>
                            <input type="file" accept="image/*" style="display:none;" onchange="WorkshopView.handlePhotoUpload(this)" />
                        </label>
                    </div>
                </div>

                <!-- Foto da Nota Fiscal (Opcional) -->
                <div style="margin-bottom:18px;">
                    <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:6px;">Foto da nota fiscal (opcional)</div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div style="width:72px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=200&q=80" alt="Nota Fiscal" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <label style="width:72px; height:72px; border-radius:10px; border:1.5px dashed #CBD5E1; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                            <span style="font-size:24px; color:#0066FF;">+</span>
                            <input type="file" accept="image/*,application/pdf" style="display:none;" onchange="WorkshopView.handleInvoiceUpload(this)" />
                        </label>
                    </div>
                </div>

                <!-- Observações Finais com Contador 0/500 -->
                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                        <label style="font-size:12.5px; font-weight:800; color:#0F172A;">Observações finais</label>
                        <span id="wizard-step4-counter" style="font-size:11px; color:#94A3B8;">0/500</span>
                    </div>
                    <textarea 
                        id="wizard-step4-obs"
                        class="dna-input-field" 
                        rows="3" 
                        maxlength="500"
                        placeholder="Observações adicionais..."
                        oninput="WorkshopView.updateStep4Obs(this.value)"
                        style="width:100%; padding:12px; border-radius:12px; font-size:12.5px;"
                    >${this.serviceFinalNotes || ''}</textarea>
                </div>

                <!-- Botões Voltar / Próximo -->
                <div style="display:flex; gap:12px;">
                    <button type="button" class="dna-secondary-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos', 3)" style="flex:1; height:46px; border-radius:12px; font-weight:700; background:#F1F5F9; color:#334155; border:1px solid #CBD5E1;">
                        ← Voltar
                    </button>
                    <button type="button" class="dna-primary-btn" onclick="WorkshopView.switchMobileSection('lancar-servicos', 5)" style="flex:1; height:46px; border-radius:12px; font-weight:800; background:#0066FF; color:#FFFFFF;">
                        Próximo →
                    </button>
                </div>
            </div>
        `;
    };

    WorkshopView.updateStep4Obs = function(val) {
        this.serviceFinalNotes = val;
        const counter = document.getElementById('wizard-step4-counter');
        if (counter) counter.textContent = (val.length) + '/500';
    };

    WorkshopView.handlePhotoUpload = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.attachedPhotos.push(e.target.result);
                alert('Foto anexada com sucesso!');
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    WorkshopView.handleInvoiceUpload = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.invoicePhoto = e.target.result;
                alert('Nota fiscal anexada com sucesso!');
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // ETAPA 5: CONFIRMAR E FINALIZAR SERVIÇO
    WorkshopView.renderWizardStep5 = function() {
        const v = this.selectedMobileVehicle || this.mockupVehicles[0];
        const s = this.selectedMobileService || this.carouselServices[0];

        return `
            <div>
                <!-- Card do Veículo -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:54px; height:40px; border-radius:8px; object-fit:cover;" />
                    <div>
                        <div style="font-size:12.5px; font-weight:800; color:#0F172A;">${v.model}</div>
                        <div style="font-size:11px; color:#64748B;">${v.license_plate || v.plate} • Cliente: ${v.client_name || v.owner_name || 'João da Silva'}</div>
                    </div>
                </div>

                <!-- Resumo do Serviço e Preço -->
                <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px; margin-bottom:14px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:24px;">${s.icon}</span>
                            <div>
                                <div style="font-size:13px; font-weight:800; color:#0F172A;">${s.title}</div>
                                <div style="font-size:11px; color:#0066FF; font-weight:600;">${s.category}</div>
                            </div>
                        </div>
                        <div style="font-size:15px; font-weight:900; color:#0F172A;">
                            R$ ${this.servicePrice}
                        </div>
                    </div>
                </div>

                <!-- Fotos Anexadas -->
                <div style="margin-bottom:14px;">
                    <div style="font-size:12.5px; font-weight:800; color:#0F172A; margin-bottom:8px;">Fotos anexadas</div>
                    <div style="display:flex; gap:8px;">
                        <div style="width:68px; height:68px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=200&q=80" alt="Foto 1" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <div style="width:68px; height:68px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80" alt="Foto 2" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                        <div style="width:68px; height:68px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
                            <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=200&q=80" alt="Nota Fiscal" style="width:100%; height:100%; object-fit:cover;" />
                        </div>
                    </div>
                </div>

                <!-- Bloco de Descrição do Serviço -->
                <div style="margin-bottom:20px;">
                    <div style="font-size:12.5px; font-weight:800; color:#0F172A; margin-bottom:6px;">Descrição do serviço</div>
                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px; font-size:12px; color:#334155; line-height:1.4;">
                        ${this.serviceDescription || 'Troca de óleo do motor e substituição do filtro de óleo. Serviço realizado conforme recomendação do fabricante.'}
                    </div>
                </div>

                <!-- Botão de Finalização Oficial em Largura Total -->
                <button 
                    type="button" 
                    class="dna-primary-btn" 
                    onclick="WorkshopView.handleFinalizeService()"
                    style="width:100%; height:50px; border-radius:12px; font-size:15px; font-weight:800; background:#0066FF; color:#FFFFFF; box-shadow:0 4px 16px rgba(0,102,255,0.4);"
                >
                    ✓ Finalizar Serviço
                </button>
            </div>
        `;
    };

    WorkshopView.handleFinalizeService = function() {
        const v = this.selectedMobileVehicle || this.mockupVehicles[0];
        const s = this.selectedMobileService || this.carouselServices[0];
        alert(`🎉 Serviço de ${s.title} registrado com sucesso para o veículo ${v.license_plate || v.plate}! O DNA permanente foi atualizado.`);
        this.wizardStep = 1;
        this.switchMobileSection('servicos-realizados');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 8: CLIENTES (OFICIAL FIGMA)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderClientesView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        return `
            <div style="padding: 16px;">
                <div style="position:relative; margin-bottom:14px;">
                    <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">🔍</span>
                    <input 
                        type="text" 
                        class="dna-input-field" 
                        placeholder="Buscar cliente ou placa..." 
                        style="width:100%; padding:14px 14px 14px 40px; border-radius:12px; font-size:13px;"
                    />
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${vehicles.map(v => `
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                            <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:60px; height:44px; border-radius:8px; object-fit:cover;" />
                            <div style="flex:1;">
                                <div style="font-size:13px; font-weight:800; color:#0F172A;">${v.client_name || v.owner_name}</div>
                                <div style="font-size:11px; color:#64748B;">${v.license_plate || v.plate} • ${v.model}</div>
                                <div style="font-size:11px; color:#0066FF; margin-top:2px;">📞 ${v.client_phone || '(11) 98765-4321'}</div>
                            </div>
                            <button type="button" onclick="WorkshopView.viewClientHistory('${v.license_plate || v.plate}')" style="background:transparent; border:none; color:#0066FF; font-size:11px; font-weight:700; cursor:pointer;">
                                Ver histórico ›
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    WorkshopView.viewClientHistory = function(plate) {
        const v = this.findVehicleByPlate(plate) || this.mockupVehicles[0];
        this.selectedMobileVehicle = v;
        this.switchMobileSection('servicos-realizados');
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 9: AGENDA COM CARROSSEL HORIZONTAL DE DIAS E TIMELINE
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderAgendaView = function() {
        const days = [
            { day: 'Seg', date: '26' },
            { day: 'Ter', date: '27' },
            { day: 'Qua', date: '28' },
            { day: 'Qui', date: '29', active: true },
            { day: 'Sex', date: '30' },
            { day: 'Sáb', date: '31' },
            { day: 'Dom', date: '01' }
        ];

        return `
            <div style="padding: 16px;">
                <!-- Carrossel Semanal de Dias -->
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:8px 6px;">
                    ${days.map(d => `
                        <div 
                            onclick="WorkshopView.activeAgendaDate = '${d.date}'; WorkshopView.render();"
                            style="flex:1; text-align:center; padding:8px 4px; border-radius:10px; cursor:pointer; background:${this.activeAgendaDate === d.date ? '#0066FF' : 'transparent'}; color:${this.activeAgendaDate === d.date ? '#FFFFFF' : '#64748B'};"
                        >
                            <div style="font-size:10px; font-weight:600; text-transform:uppercase;">${d.day}</div>
                            <div style="font-size:14px; font-weight:800; margin-top:2px;">${d.date}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:12px;">
                    Horários de hoje - ${this.activeAgendaDate}/09/2026
                </div>

                <!-- Timeline de Agendamentos -->
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${this.agendaItems.map(item => `
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="font-size:13px; font-weight:900; color:#0F172A; width:44px;">${item.time}</div>
                                <div>
                                    <div style="font-size:13px; font-weight:800; color:#0F172A;">${item.client}</div>
                                    <div style="font-size:11px; color:#64748B;">${item.plate} • ${item.model}</div>
                                </div>
                            </div>
                            <span class="${item.statusClass}">${item.status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 10: SERVIÇOS REALIZADOS COM ABAS DE FILTRO
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderServicosRealizadosView = function() {
        const vehicles = this.getEffectiveVehiclesList();
        return `
            <div style="padding: 16px;">
                <!-- Campo de Busca -->
                <div style="position:relative; margin-bottom:12px;">
                    <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">🔍</span>
                    <input 
                        type="text" 
                        class="dna-input-field" 
                        placeholder="Buscar cliente ou placa..." 
                        style="width:100%; padding:14px 14px 14px 40px; border-radius:12px; font-size:13px;"
                    />
                </div>

                <!-- Abas de Filtro: Todos, Em andamento, Concluídos -->
                <div style="display:flex; gap:8px; margin-bottom:14px;">
                    <button type="button" onclick="WorkshopView.activeFilterTab = 'todos'; WorkshopView.render();" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:${this.activeFilterTab === 'todos' ? '#0066FF' : '#E2E8F0'}; color:${this.activeFilterTab === 'todos' ? '#FFFFFF' : '#475569'};">
                        Todos
                    </button>
                    <button type="button" onclick="WorkshopView.activeFilterTab = 'andamento'; WorkshopView.render();" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:${this.activeFilterTab === 'andamento' ? '#0066FF' : '#E2E8F0'}; color:${this.activeFilterTab === 'andamento' ? '#FFFFFF' : '#475569'};">
                        Em andamento
                    </button>
                    <button type="button" onclick="WorkshopView.activeFilterTab = 'concluidos'; WorkshopView.render();" style="flex:1; padding:8px; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:${this.activeFilterTab === 'concluidos' ? '#0066FF' : '#E2E8F0'}; color:${this.activeFilterTab === 'concluidos' ? '#FFFFFF' : '#475569'};">
                        Concluídos
                    </button>
                </div>

                <!-- Lista de Serviços Realizados -->
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${vehicles.map(v => `
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:12px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                            <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:60px; height:44px; border-radius:8px; object-fit:cover;" />
                            <div style="flex:1;">
                                <div style="font-size:12px; font-weight:800; color:#0F172A;">${v.license_plate || v.plate} • ${v.model}</div>
                                <div style="font-size:11px; color:#64748B; margin-top:2px;">Troca de óleo do motor</div>
                                <div style="font-size:10px; color:#94A3B8; margin-top:2px;">📅 29/09/2026 10:24</div>
                            </div>
                            <span class="${v.status === 'Em andamento' ? 'dna-v2-badge-info' : 'dna-v2-badge-success'}">
                                ${v.status || 'Concluído'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA 11: MANUTENÇÕES DOS CLIENTES COM BADGES COLORIDOS
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderManutencoesClientesView = function() {
        return `
            <div style="padding: 16px;">
                <div style="position:relative; margin-bottom:14px;">
                    <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; color:#64748B;">🔍</span>
                    <input 
                        type="text" 
                        class="dna-input-field" 
                        placeholder="Buscar cliente ou placa..." 
                        style="width:100%; padding:14px 14px 14px 40px; border-radius:12px; font-size:13px;"
                    />
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${this.preventiveMaintenances.map(m => `
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                <div style="font-size:13px; font-weight:800; color:#0F172A;">${m.client}</div>
                                <span class="${m.badgeClass}">${m.badge}</span>
                            </div>
                            <div style="font-size:11.5px; font-weight:700; color:#0066FF;">${m.model}</div>
                            <div style="font-size:11px; color:#64748B; margin-top:2px;">${m.details}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // TELA DE ENTRADA DE VEÍCULOS (INTEGRADA COM O CARROSSEL VERTICAL 3D OFICIAL!)
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.renderEntradaVeiculosView = function() {
        const v = this.selectedMobileVehicle;
        return `
            <div style="padding: 16px;">
                <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; padding:16px; margin-bottom:16px;">
                    <div style="font-size:14px; font-weight:800; color:#0F172A; margin-bottom:8px;">🚗 Digite a Placa do Veículo</div>
                    <div style="display:flex; gap:8px;">
                        <input 
                            type="text" 
                            id="entry-plate-v2-input" 
                            class="dna-input-field" 
                            placeholder="EX: BRA2E19" 
                            maxlength="8" 
                            style="flex:1; padding:14px; border-radius:12px; font-size:14px; text-transform:uppercase; font-weight:800;"
                        />
                        <button type="button" class="dna-primary-btn" onclick="WorkshopView.handleEntryPlateSearch()" style="width:48px; border-radius:12px; background:#0066FF; color:#fff; font-size:18px;">
                            🔍
                        </button>
                    </div>
                </div>

                ${v ? `
                    <!-- Card do Veículo Identificado -->
                    <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; padding:16px; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <img src="${v.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'}" alt="${v.model}" style="width:68px; height:50px; border-radius:10px; object-fit:cover;" />
                            <div>
                                <div style="font-size:14px; font-weight:800; color:#0F172A;">${v.model}</div>
                                <div style="font-size:12px; font-weight:700; color:#0066FF; margin-top:2px;">${v.license_plate || v.plate}</div>
                                <div style="font-size:11px; color:#64748B;">Cliente: ${v.client_name || v.owner_name}</div>
                            </div>
                        </div>

                        <div style="border-top:1px solid #E2E8F0; padding-top:12px; text-align:center;">
                            <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:4px;">Selecione o serviço no Carrossel</div>
                            <div style="font-size:11px; color:#64748B; margin-bottom:12px;">Deslize verticalmente ↕ e escolha o serviço para ${v.license_plate || v.plate}</div>

                            <!-- O CARROSSEL VERTICAL 3D OFICIAL (SUBSTITUINDO OS CARDS HORIZONTAIS!) -->
                            <div class="carousel" id="dna-vertical-carousel" style="background:#0A0F1D; border-radius:16px; border:1px solid rgba(0,212,255,0.2);">
                                <div class="viewport">
                                    <div class="cards" id="dna-carousel-cards-track">
                                        ${this.carouselServices.map((s, idx) => `
                                            <div class="card ${idx === 0 ? 'active' : ''}" data-service-id="${s.id}" data-index="${idx}" onclick="WorkshopView.selectCarouselCard(${idx})">
                                                <div class="icon">${s.icon}</div>
                                                <div class="info">
                                                    <h2>${s.title}</h2>
                                                    <p>${s.desc}</p>
                                                </div>
                                                <div class="arrow">›</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="fade top"></div>
                                    <div class="fade bottom"></div>
                                </div>
                                <div class="indicator" id="dna-carousel-indicator"></div>
                                <div class="controls">
                                    <button type="button" class="control" id="carousel-up-btn" onclick="WorkshopView.moveCarousel(-1)">↑</button>
                                    <button type="button" class="control" id="carousel-down-btn" onclick="WorkshopView.moveCarousel(1)">↓</button>
                                </div>
                            </div>

                            <button type="button" class="dna-primary-btn" onclick="WorkshopView.confirmCarouselServiceAndAdvance()" style="width:100%; height:48px; border-radius:12px; background:#0066FF; color:#fff; font-weight:800; margin-top:14px;">
                                Confirmar e Avançar para Detalhes →
                            </button>
                        </div>
                    </div>
                ` : `
                    <div style="background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:14px; padding:24px; text-align:center; color:#64748B; font-size:12px;">
                        👆 Digite a placa do veículo acima para carregar os dados e selecionar o serviço no Carrossel Vertical 3D.
                    </div>
                `}
            </div>
        `;
    };

    WorkshopView.handleEntryPlateSearch = function() {
        const input = document.getElementById('entry-plate-v2-input');
        if (!input || !input.value) return;
        const plate = input.value.trim().toUpperCase();
        const found = this.findVehicleByPlate(plate) || {
            id: 'veh_' + plate,
            license_plate: plate,
            plate: plate,
            brand: 'Veículo',
            model: 'Veículo ' + plate,
            year: '2023',
            client_name: 'Cliente Cadastrado',
            owner_name: 'Cliente Cadastrado',
            client_phone: '(11) 98765-4321',
            photo_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'
        };
        this.selectedMobileVehicle = found;
        this.render();
        setTimeout(() => this.initVerticalCardCarousel(), 50);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // MOTOR DE FÍSICA E ANIMAÇÃO DO CARROSSEL VERTICAL 3D OFICIAL
    // ──────────────────────────────────────────────────────────────────────────
    WorkshopView.initVerticalCardCarousel = function() {
        const carousel = document.getElementById("dna-vertical-carousel");
        if (!carousel) return;

        const cards = [...carousel.querySelectorAll(".card")];
        const indicator = document.getElementById("dna-carousel-indicator");
        if (!cards.length) return;

        if (indicator) indicator.innerHTML = '';
        let current = this._carouselCurrentIndex || 0;
        if (current >= cards.length) current = 0;
        this._carouselCurrentIndex = current;
        let wheelLocked = false;

        if (indicator) {
            cards.forEach((card, index) => {
                const dot = document.createElement("div");
                dot.classList.add("dot");
                dot.addEventListener("click", (e) => {
                    e.stopPropagation();
                    WorkshopView.selectCarouselCard(index);
                });
                indicator.appendChild(dot);
            });
        }

        const dots = indicator ? [...indicator.querySelectorAll(".dot")] : [];

        const render = () => {
            cards.forEach((card, index) => {
                const distance = index - current;
                const absDistance = Math.abs(distance);
                const y = distance * 88;
                const scale = 1 - Math.min(absDistance * 0.10, 0.38);
                let opacity = 1 - absDistance * 0.25;
                opacity = Math.max(opacity, 0.12);
                const blur = Math.min(absDistance * 1.15, 4);
                const rotateX = distance * -3;

                if (absDistance > 3) {
                    opacity = 0;
                }

                card.style.transform = `
                    translateY(${y}px)
                    scale(${scale})
                    rotateX(${rotateX}deg)
                `;
                card.style.opacity = opacity;
                card.style.filter = `blur(${blur}px)`;
                card.style.zIndex = (index === current) ? 60 : (40 - absDistance);

                if (index === current) {
                    card.classList.add("active");
                } else {
                    card.classList.remove("active");
                }
            });

            dots.forEach((dot, index) => {
                dot.classList.toggle("active", index === current);
            });

            const activeCard = cards[current];
            if (activeCard) {
                const titleEl = activeCard.querySelector(".info h2");
                const actionBtnText = document.getElementById("carousel-action-btn-text");
                if (actionBtnText && titleEl) {
                    actionBtnText.textContent = "Confirmar Serviço: " + titleEl.textContent + " →";
                }
            }
        };

        this._renderCarousel = render;

        WorkshopView.selectCarouselCard = (index) => {
            if (index < 0 || index >= cards.length) return;
            current = index;
            WorkshopView._carouselCurrentIndex = current;
            render();
        };

        WorkshopView.moveCarousel = (direction) => {
            if (direction > 0 && current < cards.length - 1) {
                current++;
            } else if (direction < 0 && current > 0) {
                current--;
            }
            WorkshopView._carouselCurrentIndex = current;
            render();
        };

        // Suporte a Mouse Wheel
        carousel.onwheel = (event) => {
            event.preventDefault();
            if (wheelLocked) return;
            wheelLocked = true;
            if (event.deltaY > 0) {
                WorkshopView.moveCarousel(1);
            } else {
                WorkshopView.moveCarousel(-1);
            }
            setTimeout(() => { wheelLocked = false; }, 300);
        };

        // Suporte a Touch / Swipe Vertical no Celular
        let touchStartY = 0;
        carousel.ontouchstart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        carousel.ontouchend = (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            if (diff > 35) {
                WorkshopView.moveCarousel(1);
            } else if (diff < -35) {
                WorkshopView.moveCarousel(-1);
            }
        };

        render();
    };

    // Stubs para rotas e cadastros auxiliares
    WorkshopView.showOficinaRegisterScreen = function() {
        alert('Para cadastrar uma nova oficina, informe seus dados ao suporte da DNA AUTO.');
    };

    WorkshopView.showOficinaLoginScreen = function() {
        this.renderLoginView();
    };

    // Inicialização ao carregar a página
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('/oficina') || window.location.hash.includes('oficina')) {
            WorkshopView.render();
        }
    });

    window.WorkshopView = WorkshopView;

})(window);
