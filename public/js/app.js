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

        // Verificar rotas explícitas
        const isLandingRoute = window.location.pathname === '/landing' ||
                               window.location.pathname === '/home' ||
                               window.location.hash === '#landing';
        const isAdminRoute = window.location.pathname === '/admin' ||
                             window.location.pathname === '/dnaveiculo/admin' ||
                             window.location.hash === '#admin';
        const isLoginRoute = window.location.pathname === '/login' ||
                             window.location.hash === '#login';

        // 1. Se a rota for explicitamente a Landing Page, exibe a Landing Page imediatamente
        if (isLandingRoute) {
            console.log('🌐 Rota /landing solicitada. Exibindo Landing Page oficial (R$ 59,90)...');
            this.switchView('landing');
            return;
        }

        // 2. Verificar se há sessão ativa salva
        const savedUser = this.getLoggedUser();
        const savedToken = localStorage.getItem('dna_token');

        if (savedUser && savedUser.role_code && savedToken && !isLoginRoute) {
            console.log('👤 Restaurando sessão ativa:', savedUser.name, `[${savedUser.role_code}]`);
            API.setToken(savedToken);
            this.loginAs(savedUser.role_code, savedUser, false);
        } else if (isAdminRoute) {
            // Rota de admin sem sessão: mostra login de admin
            console.log('🛡️ Acesso Admin detectado. Abrindo login administrativo...');
            this.switchView('login-admin');
        } else if (isLoginRoute) {
            console.log('🔒 Tela de Login solicitada...');
            this.switchView('login');
        } else {
            // Sem sessão na raiz: exibe Landing Page oficial de alta conversão (R$ 59,90)
            console.log('🌐 Exibindo Landing Page oficial (R$ 59,90)...');
            this.switchView('landing');
        }
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
        }
    },

    onBrandClick() {
        if (!this.currentRole) {
            this.switchView('landing');
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
        // Views públicas acessíveis sem autenticação
        const publicViews = ['landing', 'login', 'login-admin', 'sales', 'dossier'];

        // Se não logado e tentando acessar área restrita, redireciona para a landing page ou login
        if (!this.currentRole && !publicViews.includes(viewName)) {
            this.switchView('landing');
            return;
        }

        // RBAC: Isolamento estrito para áreas autenticadas
        if (viewName === 'owner' && this.currentRole !== 'OWNER') {
            alert('⛔ Acesso restrito a Clientes Proprietários.');
            return;
        }
        if (viewName === 'workshop' && this.currentRole !== 'WORKSHOP') {
            alert('⛔ Acesso restrito a Oficinas Credenciadas.');
            return;
        }
        if (viewName === 'admin' && this.currentRole !== 'ADMIN') {
            alert('⛔ Acesso restrito à Administração.');
            return;
        }

        // Se estiver saindo da landing page ou login para uma tela do sistema interno, restaura layout
        if (viewName !== 'landing' && viewName !== 'login' && viewName !== 'login-admin') {
            if (typeof LoginView !== 'undefined' && LoginView.restoreLayout) {
                LoginView.restoreLayout();
            }
        }

        this.currentView = viewName;

        // Atualiza item ativo na sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
        });

        // Fecha sidebar mobile
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');

        // Isolamento de Tela Cheia para o ERP da Oficina
        if (viewName === 'workshop') {
            document.body.classList.add('is-workshop-erp');
        } else {
            document.body.classList.remove('is-workshop-erp');
        }

        // Renderização dos Módulos
        if (viewName === 'landing') {
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
        this.setLoggedUser(null);
        this.currentUser = null;
        this.currentRole = null;
        API.setToken(null);
        API.setDemoUser(null);

        this.syncProfileState(null);
        this.switchView('login');
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
