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

        // Verificar se URL é /admin (link dedicado para administrador)
        const isAdminRoute = window.location.pathname === '/admin' ||
                             window.location.pathname === '/dnaveiculo/admin' ||
                             window.location.hash === '#admin';

        // 1. Verificar se há sessão ativa salva
        const savedUser = this.getLoggedUser();
        const savedToken = localStorage.getItem('dna_token');

        if (savedUser && savedUser.role_code && savedToken) {
            console.log('👤 Restaurando sessão ativa:', savedUser.name, `[${savedUser.role_code}]`);
            API.setToken(savedToken);
            this.loginAs(savedUser.role_code, savedUser, false);
        } else if (isAdminRoute) {
            // Rota de admin sem sessão: mostra login de admin
            console.log('🛡️ Acesso Admin detectado. Abrindo login administrativo...');
            this.switchView('login-admin');
        } else {
            // Sem sessão: tela de login obrigatória
            console.log('🔒 Nenhuma sessão ativa. Abrindo Tela de Login...');
            this.switchView('login');
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
                closeMobileSidebar();
                this.switchView(view);
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
        // Se não logado, só permite login
        if (!this.currentRole && viewName !== 'login' && viewName !== 'login-admin' && viewName !== 'sales') {
            LoginView.render();
            return;
        }

        // RBAC: Isolamento estrito
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

        // Renderização dos Módulos
        if (viewName === 'login-admin') {
            LoginView.render(true);
        } else if (viewName === 'login') {
            LoginView.render();
        } else if (viewName === 'admin') {
            AdminView.render();
        } else if (viewName === 'workshop') {
            WorkshopView.render();
        } else if (viewName === 'owner') {
            OwnerView.render();
        } else if (viewName === 'sales') {
            SalesPageView.render();
        } else if (viewName === 'dossier') {
            DossierView.render(param);
        } else {
            LoginView.render();
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
                <button class="btn btn-sm btn-cyan" onclick="App.switchView('login')" title="Entrar ou Criar Conta" style="padding:7px 16px; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    <span>Fazer Login</span>
                </button>
            `;
        } else {
            let badgeStyle = 'background:rgba(56, 189, 248, 0.1); border:1px solid rgba(56, 189, 248, 0.3); color:#38bdf8;';
            let roleIcon = '🚗';
            let roleTitle = 'Cliente';

            if (this.currentRole === 'WORKSHOP') {
                badgeStyle = 'background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); color:#10b981;';
                roleIcon = '🔧';
                roleTitle = 'Oficina';
            } else if (this.currentRole === 'ADMIN') {
                badgeStyle = 'background:rgba(168, 85, 247, 0.1); border:1px solid rgba(168, 85, 247, 0.3); color:#c084fc;';
                roleIcon = '🛡️';
                roleTitle = 'Admin';
            }

            topActions.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 12px; border-radius:var(--radius-full); font-size:12px; font-weight:600; ${badgeStyle}">
                        <span>${roleIcon}</span>
                        <span><strong>${this.currentUser.name}</strong> (${roleTitle})</span>
                    </div>
                    <button class="btn btn-sm" onclick="App.logout()" title="Encerrar Sessão" style="background:rgba(239, 68, 68, 0.12); border:1px solid rgba(239, 68, 68, 0.35); color:#fca5a5; padding:6px 12px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:6px; cursor:pointer; border-radius:var(--radius-sm); transition:all 0.2s ease;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span>Sair</span>
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
