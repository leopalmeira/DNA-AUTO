// ==============================================================================
// DNA AUTO — APLICAÇÃO PRINCIPAL (ORQUESTRADOR DE TELAS, SESSÃO & CONTROLE DE ACESSO RBAC)
// Regra: Login obrigatório. Admin acessa apenas por /admin. Sidebar/header escondidos no login.
// ==============================================================================

const App = {
    currentView: 'login',
    currentRole: null,   // 'OWNER', 'WORKSHOP', 'ADMIN' ou null
    currentUser: null,

    async init() {
        console.log('🚀 Inicializando DNA AUTO Platform...');
        this.setupModals();

        // 1. Ouvintes reativos para navegação SPA e histórico (Voltar/Avançar)
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // 2. Verificar se há sessão ativa salva no navegador
        const savedUser = this.getLoggedUser();
        let savedToken = localStorage.getItem('dna_token') || localStorage.getItem('dna_auto_token');
        const savedView = localStorage.getItem('dna_current_view');
        const pathname = (window.location.pathname.toLowerCase().replace(/\/+$/, '')) || '/';
        const hash = window.location.hash.toLowerCase();
        const isExplicitLogin = pathname === '/login' || hash === '#login';

        // Se houver usuário salvo na sessão e não for um pedido explícito de tela de login
        if (savedUser && savedUser.role_code && !isExplicitLogin) {
            if (!savedToken) {
                savedToken = 'sess_' + savedUser.role_code.toLowerCase() + '_' + (savedUser.id || Date.now());
                localStorage.setItem('dna_token', savedToken);
                localStorage.setItem('dna_auto_token', savedToken);
            }
            API.setToken(savedToken);
            if (savedUser.id) API.setDemoUser(savedUser.id);
            console.log('👤 Restaurando sessão ativa:', savedUser.name, `[${savedUser.role_code}]`);

            // Restaura o usuário e sincroniza interface
            this.currentUser = savedUser;
            this.currentRole = savedUser.role_code;
            this.syncProfileState(savedUser.role_code);
            this.setupNavigation();
            if (typeof LoginView !== 'undefined' && LoginView.restoreLayout) {
                LoginView.restoreLayout();
            }

            // Identificar qual módulo exibir sem desconectar no F5:
            // A. Se a URL possui hash específico
            if (hash === '#workshop' || hash === '#oficina' || hash === '#erp') {
                this.switchView('workshop');
            } else if (hash === '#owner' || hash === '#app' || hash === '#meucarro') {
                this.switchView('owner');
            } else if (hash === '#admin') {
                this.switchView('admin');
            } else if (hash === '#dossier') {
                this.switchView('dossier');
            } else if (hash === '#sales') {
                this.switchView('sales');
            } else if (hash === '#cliente' && savedUser.role_code !== 'WORKSHOP') {
                this.switchView('owner');
            } else if ((hash === '#autocente' || hash === '#autocenter') && savedUser.role_code !== 'WORKSHOP') {
                this.switchView('landing-workshop');
            // B. Se a URL possui pathname específico
            } else if (pathname === '/workshop' || pathname === '/oficina' || pathname === '/erp') {
                this.switchView('workshop');
            } else if (pathname === '/owner' || pathname === '/app' || pathname === '/meucarro') {
                this.switchView('owner');
            } else if (pathname === '/admin') {
                this.switchView('admin');
            } else if (pathname === '/dossier') {
                this.switchView('dossier');
            } else if (pathname === '/sales') {
                this.switchView('sales');
            // C. Se havia uma view salva anteriormente condizente com o perfil
            } else if (savedView === 'workshop' && savedUser.role_code === 'WORKSHOP') {
                this.switchView('workshop');
            } else if (savedView === 'owner' && savedUser.role_code === 'OWNER') {
                this.switchView('owner');
            } else if (savedView === 'admin' && savedUser.role_code === 'ADMIN') {
                this.switchView('admin');
            // D. Fallback seguro baseado no perfil do usuário autenticado (Mantém conectado no F5!)
            } else if (savedUser.role_code === 'WORKSHOP') {
                this.switchView('workshop');
            } else if (savedUser.role_code === 'ADMIN') {
                this.switchView('admin');
            } else {
                this.switchView('owner');
            }
            return;
        }

        // 3. Roteamento padrão caso não haja sessão autenticada ativa
        this.handleRoute();
    },

    // ── Roteador Central SPA por Pathname e Hash ──
    handleRoute() {
        const pathname = (window.location.pathname.toLowerCase().replace(/\/+$/, '')) || '/';
        const rawHash = window.location.hash.toLowerCase();
        const hash = rawHash.split('?')[0];

        // Extrai código de ativação se houver (ex: /app?code=DNA-8421 ou #owner?code=DNA-8421)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
        const activationCode = urlParams.get('code') || hashParams.get('code') || urlParams.get('c') || hashParams.get('c');

        // 1. App do Cliente / Dono do Veículo (Mobile PWA)
        if (hash === '#owner' || hash === '#app' || hash === '#meucarro' || hash === '#cliente' ||
            pathname === '/app' || pathname === '/owner' || pathname === '/meucarro' ||
            pathname === '/cliente' || pathname === '/cliente.html' || pathname === '/cliente.app') {
            
            const screenParam = urlParams.get('screen') || hashParams.get('screen');
            if (screenParam === 'home' || hash === '#home') {
                if (window.OwnerView) window.OwnerView.authScreen = null;
            } else if (screenParam === 'login' || hash === '#login') {
                if (window.OwnerView) window.OwnerView.authScreen = 'login';
            } else if (screenParam === 'register' || hash === '#register') {
                if (window.OwnerView) window.OwnerView.authScreen = 'register';
            } else {
                // Inicia na Tela 01: Splash / Login (Fiel ao mapa do app)
                if (window.OwnerView) window.OwnerView.authScreen = 'splash';
            }

            this.switchView('owner');
            if (activationCode) {
                setTimeout(() => {
                    if (window.OwnerView && typeof window.OwnerView.openActivationModal === 'function') {
                        window.OwnerView.openActivationModal(activationCode);
                    }
                }, 300);
            }
            return;
        }

        // 2. ERP Operacional da Oficina (Painel do Mecânico / Recepção / Pátio)
        if (hash === '#workshop' || hash === '#oficina' || hash === '#erp' || pathname === '/oficina' || pathname === '/workshop' || pathname === '/erp') {
            this.switchView('workshop');
            return;
        }

        // 3. Matriz Administrativa / Franquia DNA AUTO
        if (hash === '#admin' || pathname === '/admin') {
            this.switchView('admin');
            return;
        }

        // 4. Outras telas e landings
        if (hash === '#login' || pathname === '/login') {
            this.switchView('login');
        } else if (hash === '#dossier' || pathname === '/dossier') {
            this.switchView('dossier');
        } else if (hash === '#sales' || pathname === '/sales') {
            this.switchView('sales');
        } else if (hash === '#cliente' || pathname === '/cliente') {
            this.switchView('landing-client');
        } else if (hash === '#autocente' || hash === '#autocenter' || pathname === '/autocente' || pathname === '/autocenter') {
            this.switchView('landing-workshop');
        } else if (hash === '#landing' || hash === '#home' || pathname === '/' || !pathname) {
            this.switchView('landing-home');
        } else {
            this.switchView('landing-home');
        }
    },

    // ── Navegação SPA sem Recarregar a Página ──
    navigateTo(path, replace = false) {
        if (!path) path = '/';
        try {
            if (replace) {
                history.replaceState(null, '', path);
            } else {
                history.pushState(null, '', path);
            }
        } catch (_) {}
        this.handleRoute();
    },

    // ── Acesso Direto ao Credenciamento Oficial de Oficina ──
    goToRegisterWorkshop() {
        if (typeof LoginView !== 'undefined') {
            LoginView.selectedRoleTab = 'WORKSHOP';
            LoginView.activeMode = 'REGISTER';
        }
        this.switchView('login');
    },

    // ── Acesso Direto ao Cadastro do Dono de Carro ──
    goToRegisterOwner() {
        if (typeof LoginView !== 'undefined') {
            LoginView.selectedRoleTab = 'OWNER';
            LoginView.activeMode = 'REGISTER';
        }
        this.switchView('login');
    },

    // ── Gestão de Sessão Local ──
    getLoggedUser() {
        try {
            const raw = localStorage.getItem('dna_logged_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    },

    setLoggedUser(user) {
        if (user) {
            localStorage.setItem('dna_logged_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('dna_logged_user');
            localStorage.removeItem('dna_token');
            localStorage.removeItem('dna_auto_token');
            localStorage.removeItem('dna_auto_demo_user_id');
            localStorage.removeItem('dna_current_view');
        }
    },

    onBrandClick() {
        if (!this.currentRole) {
            this.navigateTo('/');
        } else if (this.currentRole === 'ADMIN') {
            this.switchView('admin');
        } else if (this.currentRole === 'WORKSHOP') {
            this.switchView('workshop');
        } else {
            this.switchView('owner');
        }
    },

    // ── Navegação Global ──
    setupNavigation() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const mobileBtn = document.getElementById('mobile-menu-toggle');

        const closeMobileSidebar = () => {
            if (sidebar) sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
        };

        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                const tab = item.dataset.adminTab || null;
                closeMobileSidebar();
                this.switchView(view, tab);
            });
        });

        if (mobileBtn && sidebar) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (backdrop) backdrop.classList.toggle('active');
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => { closeMobileSidebar(); });
        }
    },

    // ── Alternador Central de Telas com Bloqueio RBAC ──
    switchView(viewName, param = null) {
        // Views públicas acessíveis diretamente (incluindo Landings, App do Cliente e ERP da Oficina)
        const publicViews = ['landing', 'landing-home', 'landing-client', 'landing-workshop', 'login', 'login-admin', 'sales', 'dossier', 'owner', 'workshop'];

        // Se não logado e tentando acessar área restrita da matriz administrativa
        if (viewName === 'admin' && this.currentRole !== 'ADMIN') {
            this.switchView('login-admin');
            return;
        }

        // Se estiver acessando o app do cliente sem login prévio, define perfil padrão e persiste a sessão
        if (viewName === 'owner' && (!this.currentUser || this.currentUser.role_code !== 'OWNER')) {
            const defaultOwner = {
                id: 'usr_owner_carlos',
                name: 'Carlos Alberto Silva',
                email: 'carlos.silva@email.com',
                role_code: 'OWNER',
                role_name: 'Cliente Proprietário'
            };
            this.currentUser = defaultOwner;
            this.currentRole = 'OWNER';
            this.setLoggedUser(defaultOwner);
            const token = localStorage.getItem('dna_token') || 'sess_owner_usr_owner_carlos';
            API.setToken(token);
            API.setDemoUser('usr_owner_carlos');
            this.syncProfileState('OWNER');
        }

        // Se estiver acessando a oficina sem login prévio, define perfil padrão da oficina e persiste a sessão
        if (viewName === 'workshop' && (!this.currentUser || this.currentUser.role_code !== 'WORKSHOP')) {
            const defaultWorkshop = {
                id: 'usr_workshop_marcos',
                name: 'Marcos Silveira',
                email: 'marcos@veloce.com.br',
                role_code: 'WORKSHOP',
                role_name: 'Proprietário de Oficina',
                workshop: {
                    id: 'ws_veloce',
                    workshop_id: 'ws_veloce',
                    workshop_name: 'Veloce Auto Center Premium',
                    trade_name: 'Veloce Auto Center Premium',
                    cnpj: '12.345.678/0001-90'
                }
            };
            this.currentUser = defaultWorkshop;
            this.currentRole = 'WORKSHOP';
            this.setLoggedUser(defaultWorkshop);
            const token = localStorage.getItem('dna_token') || 'sess_workshop_usr_workshop_marcos';
            API.setToken(token);
            API.setDemoUser('usr_workshop_marcos');
            this.syncProfileState('WORKSHOP');
        }

        const isLandingGroup = ['landing', 'landing-home', 'landing-client', 'landing-workshop'].includes(viewName);

        // Se estiver saindo da landing page ou login para uma tela do sistema interno, restaura layout
        if (!isLandingGroup && viewName !== 'login' && viewName !== 'login-admin') {
            if (typeof LoginView !== 'undefined' && LoginView.restoreLayout) {
                LoginView.restoreLayout();
            }
        }

        this.currentView = viewName;
        localStorage.setItem('dna_current_view', viewName);

        // Atualiza item ativo na sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
        });

        // Fecha sidebar mobile
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');

        // Isolamento de Tela Cheia e Roteamento SPA
        if (viewName === 'workshop') {
            document.body.classList.add('is-workshop-erp');
            document.body.classList.remove('is-owner-app');
            if (window.location.hash !== '#workshop') {
                try { history.replaceState(null, '', '#workshop'); } catch (_) { window.location.hash = '#workshop'; }
            }
        } else if (viewName === 'owner') {
            document.body.classList.remove('is-workshop-erp');
            document.body.classList.add('is-owner-app');
            if (window.location.hash !== '#owner') {
                try { history.replaceState(null, '', '#owner'); } catch (_) { window.location.hash = '#owner'; }
            }
        } else {
            document.body.classList.remove('is-workshop-erp');
            document.body.classList.remove('is-owner-app');
            if (viewName === 'admin' && window.location.hash !== '#admin') {
                try { history.replaceState(null, '', '#admin'); } catch (_) { window.location.hash = '#admin'; }
            } else if (viewName === 'landing-home') {
                if (window.location.pathname !== '/' && window.location.hash !== '') {
                    try { history.replaceState(null, '', '/'); } catch (_) {}
                }
            } else if (viewName === 'landing-client') {
                if (window.location.pathname !== '/cliente' && window.location.hash !== '#cliente') {
                    try { history.replaceState(null, '', '/cliente'); } catch (_) {}
                }
            } else if (viewName === 'landing-workshop') {
                if (window.location.pathname !== '/autocente' && window.location.hash !== '#autocente') {
                    try { history.replaceState(null, '', '/autocente'); } catch (_) {}
                }
            }
        }

        // Renderização dos Módulos
        if (viewName === 'landing-home') {
            if (typeof LandingHomeView !== 'undefined') {
                LandingHomeView.render();
            } else {
                LandingView.render('/');
            }
        } else if (viewName === 'landing-client') {
            if (typeof LandingClientView !== 'undefined') {
                LandingClientView.render();
            } else {
                LandingView.render('/cliente');
            }
        } else if (viewName === 'landing-workshop') {
            if (typeof LandingWorkshopView !== 'undefined') {
                LandingWorkshopView.render();
            } else {
                LandingView.render('/autocente');
            }
        } else if (viewName === 'landing') {
            LandingView.render();
        } else if (viewName === 'login-admin') {
            LoginView.render(true);
        } else if (viewName === 'login') {
            LoginView.render();
        } else if (viewName === 'admin') {
            AdminView.render(param);
        } else if (viewName === 'workshop') {
            WorkshopView.render();
        } else if (viewName === 'owner') {
            OwnerView.render();
            if (typeof PwaInstall !== 'undefined' && PwaInstall.triggerAutoPromptForClient) {
                PwaInstall.triggerAutoPromptForClient();
            }
        } else if (viewName === 'sales') {
            SalesPageView.render();
        } else if (viewName === 'dossier') {
            DossierView.render(param);
        } else {
            LandingView.render();
        }
    },

    // ── Efetuar Login e Isolamento de Perfil ──
    loginAs(role, user, saveToStorage = true) {
        let normRole = 'OWNER';
        if (role && (role.startsWith('WORKSHOP') || role.includes('workshop'))) normRole = 'WORKSHOP';
        else if (role && (role.startsWith('ADMIN') || role.includes('admin'))) normRole = 'ADMIN';

        this.currentUser = { ...user, role_code: normRole };
        this.currentRole = normRole;

        if (saveToStorage) {
            this.setLoggedUser(this.currentUser);
            if (!localStorage.getItem('dna_token')) {
                const token = 'sess_' + normRole.toLowerCase() + '_' + (user.id || Date.now());
                localStorage.setItem('dna_token', token);
                API.setToken(token);
            }
        }

        // Configura usuário ativo na API
        if (normRole === 'ADMIN') API.setDemoUser('usr_admin');
        else if (normRole === 'WORKSHOP') API.setDemoUser(user.id || 'usr_workshop_marcos');
        else if (normRole === 'OWNER') API.setDemoUser(user.id || 'usr_owner_carlos');

        // Restaurar layout (sidebar e header) que foram escondidos no login
        LoginView.restoreLayout();

        // Sincroniza sidebar e topo com isolamento total
        this.syncProfileState(normRole);

        // Setup navigation novamente (pois sidebar pode ter sido hidden)
        this.setupNavigation();

        // Redireciona para o módulo autorizado
        if (normRole === 'OWNER') {
            this.switchView('owner');
        } else if (normRole === 'WORKSHOP') {
            this.switchView('workshop');
        } else if (normRole === 'ADMIN') {
            this.switchView('admin');
        }
    },

    // ── Logout Seguro ──
    logout() {
        document.body.classList.remove('is-workshop-erp');
        document.body.classList.remove('is-owner-app');
        localStorage.removeItem('dna_current_view');
        this.setLoggedUser(null);
        this.currentUser = null;
        this.currentRole = null;
        API.setToken(null);
        API.setDemoUser(null);
        try { history.replaceState(null, '', '/'); } catch (_) {}

        this.syncProfileState(null);
        this.switchView('landing-home');
    },

    // ── Sincronização Estrita dos Módulos Visíveis (ISOLAMENTO TOTAL) ──
    syncProfileState(role) {
        let normalizedRole = null;
        if (role && (role === 'OWNER' || role === 'role_owner')) normalizedRole = 'OWNER';
        else if (role && (role.startsWith('WORKSHOP') || role.includes('workshop'))) normalizedRole = 'WORKSHOP';
        else if (role && (role.startsWith('ADMIN') || role.includes('admin'))) normalizedRole = 'ADMIN';

        this.currentRole = normalizedRole;

        // Módulos na Sidebar
        const modAdmin = document.getElementById('nav-module-admin');
        const modWorkshop = document.getElementById('nav-module-workshop');
        const modOwner = document.getElementById('nav-module-owner');

        // ISOLAMENTO TOTAL
        if (normalizedRole === 'OWNER') {
            if (modOwner) modOwner.style.display = 'block';
            if (modWorkshop) modWorkshop.style.display = 'none';
            if (modAdmin) modAdmin.style.display = 'none';
        } else if (normalizedRole === 'WORKSHOP') {
            if (modOwner) modOwner.style.display = 'none';
            if (modWorkshop) modWorkshop.style.display = 'block';
            if (modAdmin) modAdmin.style.display = 'none';
        } else if (normalizedRole === 'ADMIN') {
            if (modOwner) modOwner.style.display = 'none';
            if (modWorkshop) modWorkshop.style.display = 'none';
            if (modAdmin) modAdmin.style.display = 'block';
        } else {
            if (modOwner) modOwner.style.display = 'none';
            if (modWorkshop) modWorkshop.style.display = 'none';
            if (modAdmin) modAdmin.style.display = 'none';
        }

        // Atualiza Cabeçalho Superior
        this.updateTopNavbar();

        // Atualiza Rodapé de Sessão na Sidebar
        const sessionName = document.getElementById('session-user-name');
        const sessionRoleText = document.getElementById('session-role-text');
        const avatarSvg = document.getElementById('session-avatar-svg');

        if (normalizedRole === 'ADMIN') {
            if (sessionName) sessionName.textContent = this.currentUser?.name || 'Administrador Geral';
            if (sessionRoleText) sessionRoleText.textContent = 'Matriz DNA Central [ADMIN]';
            if (avatarSvg) avatarSvg.innerHTML = `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>`;
        } else if (normalizedRole === 'WORKSHOP') {
            if (sessionName) sessionName.textContent = this.currentUser?.name || 'Marcos Silveira';
            if (sessionRoleText) sessionRoleText.textContent = this.currentUser?.workshop?.workshop_name || 'Veloce Auto Center [OFICINA]';
            if (avatarSvg) avatarSvg.innerHTML = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`;
        } else if (normalizedRole === 'OWNER') {
            if (sessionName) sessionName.textContent = this.currentUser?.name || 'Carlos Alberto Silva';
            if (sessionRoleText) sessionRoleText.textContent = 'Cliente Proprietário';
            if (avatarSvg) avatarSvg.innerHTML = `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`;
        } else {
            if (sessionName) sessionName.textContent = 'Não Autenticado';
            if (sessionRoleText) sessionRoleText.textContent = 'Faça login para acessar';
            if (avatarSvg) avatarSvg.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`;
        }
    },

    // ── Renderiza ações do cabeçalho do topo ──
    updateTopNavbar() {
        const topActions = document.getElementById('top-nav-actions');
        if (!topActions) return;

        if (!this.currentRole || !this.currentUser) {
            topActions.innerHTML = `
                <button class="btn btn-sm btn-cyan top-login-trigger" onclick="App.switchView('login')" title="Entrar ou Criar Conta" style="padding:6px 14px; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    <span>Entrar</span>
                </button>
            `;
        } else {
            let badgeStyle = 'background:rgba(255, 210, 28, 0.12); border:1px solid rgba(255, 210, 28, 0.35); color:#FFD21C;';
            let roleIcon = '🚗';
            let roleTitle = 'Cliente';

            if (this.currentRole === 'WORKSHOP') {
                badgeStyle = 'background:rgba(16, 185, 129, 0.12); border:1px solid rgba(16, 185, 129, 0.35); color:#10b981;';
                roleIcon = '🔧';
                roleTitle = 'Oficina';
            } else if (this.currentRole === 'ADMIN') {
                badgeStyle = 'background:rgba(255, 210, 28, 0.18); border:1px solid rgba(255, 210, 28, 0.5); color:#FFD21C;';
                roleIcon = '🛡️';
                roleTitle = 'Admin';
            }

            const fullName = this.currentUser.name || 'Usuário';
            const firstName = fullName.split(' ')[0];

            topActions.innerHTML = `
                <div class="top-user-session-bar">
                    <div class="top-user-badge" style="${badgeStyle}" title="${fullName} (${roleTitle})">
                        <span class="top-user-icon">${roleIcon}</span>
                        <span class="top-user-fullname"><strong>${fullName}</strong> <span class="top-user-role-label">(${roleTitle})</span></span>
                        <span class="top-user-shortname"><strong>${firstName}</strong></span>
                    </div>
                    <button class="btn btn-sm top-logout-btn" onclick="App.logout()" title="Encerrar Sessão">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span class="top-logout-label">Sair</span>
                    </button>
                </div>
            `;
        }
    },

    setupModals() {
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });

        const newServiceForm = document.getElementById('new-service-form');
        if (newServiceForm) {
            newServiceForm.addEventListener('submit', (e) => {
                WorkshopView.submitNewService(e);
            });
        }
    }
};

// Iniciar ao carregar
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
