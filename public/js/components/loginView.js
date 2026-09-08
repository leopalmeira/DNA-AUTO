// ==============================================================================
// DNA AUTO — TELA DE LOGIN & CERTIFICAÇÃO (DESIGN SYSTEM OFICIAL)
// Fiel à referência: Automotive Technology, Fintech Premium & Cyber Security
// Background: Fotografia automotiva de luxo com vinheta escura de alta fidelidade
// Paleta: Amarelo DNA AUTO #FFD21C, Obsidiana #05080D, Superfícies #0A0F16 / #111923
// ==============================================================================

const LoginView = {
    selectedRoleTab: 'OWNER', // 'OWNER' ou 'WORKSHOP'
    activeMode: 'LOGIN',      // 'LOGIN' ou 'REGISTER'
    isAdminMode: false,        // Ativado somente via link /admin

    credentials: {
        OWNER: {
            email: 'carlos.silva@email.com',
            password: 'senha123',
        },
        WORKSHOP: {
            email: 'marcos@veloce.com.br',
            password: 'senha123',
        },
        ADMIN: {
            email: 'admin@dnaauto.com.br',
            password: 'admin123',
        }
    },

    render(adminMode) {
        if (adminMode === true) this.isAdminMode = true;

        const container = document.getElementById('view-content');
        if (!container) return;

        // Bloqueia scroll do body e html enquanto na tela de login
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // Esconde sidebar e header quando na tela de login
        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';

        // Se é modo admin, renderiza login admin executivo
        if (this.isAdminMode) {
            this.renderAdminLogin(container);
            return;
        }

        const isOwner = this.selectedRoleTab === 'OWNER';

        container.innerHTML = `
            <div class="auth-fullscreen-container">
                <div class="auth-content-box">
                    <!-- LOGO & IDENTIDADE VISUAL OFICIAL DNA AUTO -->
                    <div class="auth-brand-header">
                        <div class="auth-emblem-wrapper">
                            <!-- Ícone de Impressão Digital Automotiva Exata da Referência -->
                            <svg class="auth-fingerprint-svg" viewBox="0 0 120 120" width="48" height="48" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                <!-- Núcleo central da digital -->
                                <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="5" />
                                <!-- Anel concêntrico interno -->
                                <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="5.5" />
                                <!-- Anel concêntrico intermediário -->
                                <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="5.5" />
                                <!-- Anel concêntrico externo -->
                                <path d="M 28 70 C 21 52 23 27 36 14 C 50 1 78 1 91 14 C 103 27 105 52 98 70" stroke-width="5.5" />
                                <!-- Base / Grade aerodinâmica automotiva com faróis -->
                                <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="6" />
                                <circle cx="34" cy="85" r="2.5" fill="#FFD21C" stroke="none" />
                                <circle cx="86" cy="85" r="2.5" fill="#FFD21C" stroke="none" />
                            </svg>
                        </div>

                        <h1 class="auth-title">DNA <span class="text-gold">AUTO</span></h1>
                        <p class="auth-subtitle">CERTIFICAÇÃO DE REGISTROS VEICULARES</p>
                        <p class="auth-motto">Mais segurança, transparência e confiança em cada veículo.</p>
                    </div>

                    <!-- ÁREA DO FORMULÁRIO -->
                    <div class="auth-card-body">
                        ${this.activeMode === 'LOGIN' ? this.renderLoginForm() : this.renderRegisterForm()}
                    </div>

                    <!-- ACESSO DEMO RÁPIDO (COMPACTO & DISCRETO) -->
                    <div class="auth-demo-bar">
                        <div class="auth-demo-label">⚡ Acesso Rápido para Avaliação:</div>
                        <div class="auth-demo-buttons">
                            <button type="button" class="auth-demo-pill ${isOwner ? 'active' : ''}" onclick="LoginView.quickLogin('OWNER')">
                                🚗 Cliente (Carlos)
                            </button>
                            <button type="button" class="auth-demo-pill ${!isOwner ? 'active' : ''}" onclick="LoginView.quickLogin('WORKSHOP')">
                                🔧 Oficina (Veloce)
                            </button>
                            <a href="/admin" class="auth-demo-pill admin-pill">
                                🛡️ Admin Governança
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('login-automotive-luxury-css')) {
            this.injectCSS();
        }
    },

    renderLoginForm() {
        const isOwner = this.selectedRoleTab === 'OWNER';
        const cred = this.credentials[this.selectedRoleTab];

        return `
            <form id="login-form" onsubmit="LoginView.handleSubmit(event)">
                <!-- CAMPO 1: E-MAIL OU USUÁRIO COM ÍCONE -->
                <div class="auth-input-group">
                    <div class="auth-input-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <input type="text" id="login-email" class="auth-input" required
                           value="${cred.email}"
                           placeholder="E-mail ou usuário"
                           autocomplete="username" />
                </div>

                <!-- CAMPO 2: SENHA COM ÍCONE DE CADEADO E TOGGLE DO OLHO -->
                <div class="auth-input-group">
                    <div class="auth-input-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <input type="password" id="login-password" class="auth-input" required
                           value="${cred.password}"
                           placeholder="Senha"
                           autocomplete="current-password" />
                    <button type="button" class="auth-eye-btn" onclick="LoginView.togglePasswordVisibility()" title="Mostrar/Ocultar Senha">
                        <svg id="password-eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>

                <!-- LEMBRAR DE MIM & ESQUECI MINHA SENHA -->
                <div class="auth-options-row">
                    <label class="auth-checkbox-label">
                        <input type="checkbox" id="auth-remember-me" checked class="auth-custom-checkbox" />
                        <span class="auth-checkbox-custom"></span>
                        <span class="auth-remember-text">Lembrar de mim</span>
                    </label>
                    <a href="javascript:void(0)" onclick="alert('Recuperação de Acesso: Instruções de segurança foram simuladas para seu e-mail cadastrado.')" class="auth-forgot-link">
                        Esqueci minha senha
                    </a>
                </div>

                <!-- BOTÃO PRINCIPAL: AMARELO DNA AUTO COM SETA -->
                <button type="submit" class="auth-btn-primary" id="login-submit-btn">
                    <span class="auth-btn-arrow">→</span>
                    <span>Entrar</span>
                </button>
            </form>

            <!-- DIVISOR "ou" -->
            <div class="auth-divider">
                <span class="auth-divider-line"></span>
                <span class="auth-divider-text">ou</span>
                <span class="auth-divider-line"></span>
            </div>

            <!-- BOTÃO SECUNDÁRIO: ACESSAR COMO OFICINA / CLIENTE -->
            <button type="button" class="auth-btn-secondary" onclick="LoginView.toggleRole()">
                <div class="auth-secondary-icon">
                    ${isOwner ? `
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <line x1="9" y1="22" x2="9" y2="22.01"></line>
                            <line x1="15" y1="22" x2="15" y2="22.01"></line>
                            <line x1="9" y1="6" x2="9" y2="6.01"></line>
                            <line x1="15" y1="6" x2="15" y2="6.01"></line>
                            <line x1="9" y1="10" x2="9" y2="10.01"></line>
                            <line x1="15" y1="10" x2="15" y2="10.01"></line>
                            <line x1="9" y1="14" x2="9" y2="14.01"></line>
                            <line x1="15" y1="14" x2="15" y2="14.01"></line>
                        </svg>
                    ` : `
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"></path>
                            <circle cx="7" cy="17" r="2"></circle>
                            <circle cx="17" cy="17" r="2"></circle>
                        </svg>
                    `}
                </div>
                <span>${isOwner ? 'Acessar como oficina' : 'Acessar como cliente'}</span>
            </button>

            <!-- SOLICITAR ACESSO / CADASTRO -->
            <div class="auth-footer-prompt">
                <span>Ainda não tem uma conta?</span>
                <a href="javascript:void(0)" onclick="LoginView.switchMode('REGISTER')" class="auth-link-gold">
                    Solicitar acesso
                </a>
            </div>
        `;
    },

    renderRegisterForm() {
        const isOwner = this.selectedRoleTab === 'OWNER';

        return `
            <div class="auth-register-header">
                <h3 style="font-size:18px; color:#ffffff; font-weight:700; margin-bottom:4px;">
                    ${isOwner ? 'Cadastrar como Cliente' : 'Credenciar Nova Oficina'}
                </h3>
                <p style="font-size:12px; color:#94a3b8; margin-bottom:18px;">
                    ${isOwner ? 'Tenha o histórico permanente e certificado de todos os seus carros.' : 'Emita laudos e certificações oficiais Nível 4 na rede DNA AUTO.'}
                </p>
            </div>

            ${isOwner ? `
                <form id="register-client-form" onsubmit="LoginView.handleRegisterClient(event)">
                    <div class="auth-input-group">
                        <input type="text" id="reg-client-name" class="auth-input" required placeholder="Nome Completo *" />
                    </div>
                    <div class="auth-input-group">
                        <input type="email" id="reg-client-email" class="auth-input" required placeholder="Seu E-mail *" />
                    </div>
                    <div class="auth-input-row">
                        <div class="auth-input-group">
                            <input type="text" id="reg-client-phone" class="auth-input" required placeholder="WhatsApp *" />
                        </div>
                        <div class="auth-input-group">
                            <input type="text" id="reg-client-cpf" class="auth-input" placeholder="CPF (opcional)" />
                        </div>
                    </div>
                    <div class="auth-input-row">
                        <div class="auth-input-group">
                            <input type="password" id="reg-client-password" class="auth-input" required placeholder="Senha *" minlength="6" />
                        </div>
                        <div class="auth-input-group">
                            <input type="password" id="reg-client-confirm" class="auth-input" required placeholder="Confirmar Senha *" minlength="6" />
                        </div>
                    </div>
                    <button type="submit" class="auth-btn-primary" style="margin-top:10px;">
                        <span>Finalizar Cadastro & Acessar</span>
                    </button>
                </form>
            ` : `
                <form id="register-ws-form" onsubmit="LoginView.handleRegisterWorkshop(event)">
                    <div class="auth-input-group">
                        <input type="text" id="reg-ws-trade" class="auth-input" required placeholder="Nome Fantasia da Oficina *" />
                    </div>
                    <div class="auth-input-row">
                        <div class="auth-input-group">
                            <input type="text" id="reg-ws-cnpj" class="auth-input" required placeholder="CNPJ *" />
                        </div>
                        <div class="auth-input-group">
                            <input type="text" id="reg-ws-phone" class="auth-input" required placeholder="WhatsApp Comercial *" />
                        </div>
                    </div>
                    <div class="auth-input-group">
                        <input type="text" id="reg-ws-technician" class="auth-input" required placeholder="Responsável Técnico *" />
                    </div>
                    <div class="auth-input-group">
                        <input type="email" id="reg-ws-email" class="auth-input" required placeholder="E-mail Comercial *" />
                    </div>
                    <div class="auth-input-row">
                        <div class="auth-input-group">
                            <input type="password" id="reg-ws-password" class="auth-input" required placeholder="Criar Senha *" minlength="6" />
                        </div>
                        <div class="auth-input-group">
                            <input type="password" id="reg-ws-confirm" class="auth-input" required placeholder="Confirmar *" minlength="6" />
                        </div>
                    </div>
                    <button type="submit" class="auth-btn-primary" style="margin-top:10px;">
                        <span>Credenciar Oficina & Entrar</span>
                    </button>
                </form>
            `}

            <div style="text-align:center; margin-top:18px;">
                <a href="javascript:void(0)" onclick="LoginView.switchMode('LOGIN')" style="color:#94a3b8; font-size:13px; text-decoration:none;">
                    ← Voltar para a tela de Login
                </a>
            </div>
        `;
    },

    renderAdminLogin(container) {
        container.innerHTML = `
            <div class="auth-fullscreen-container admin-governance-mode">
                <div class="auth-content-box" style="max-width: 360px;">
                    <div class="auth-brand-header" style="margin-bottom: 12px;">
                        <div class="auth-emblem-wrapper" style="filter: drop-shadow(0 0 16px rgba(255, 210, 28, 0.4)); margin: 0 auto 6px;">
                            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#FFD21C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h1 class="auth-title">DNA <span class="text-gold">CENTRAL</span></h1>
                        <p class="auth-subtitle" style="color:#FFD21C; margin: 2px 0 4px;">PAINEL DE GOVERNANÇA & AUDITORIA</p>
                        <p class="auth-motto" style="font-size:11.5px; margin: 0 auto 6px;">Acesso restrito à Diretoria e Administradores da Rede.</p>
                        <div style="display:inline-block; font-size:9.5px; font-weight:700; color:#10b981; border:1px solid #10b981; padding:2px 8px; border-radius:4px; letter-spacing:0.5px;">SSL 256-BIT SECURE TERMINAL</div>
                    </div>

                    <div class="auth-card-body">
                        <form id="admin-login-form" onsubmit="LoginView.handleAdminLogin(event)">
                            <div class="auth-input-group">
                                <div class="auth-input-icon">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <input type="email" id="admin-login-email" class="auth-input" required
                                       placeholder="admin@dnaauto.com.br" value="admin@dnaauto.com.br" autocomplete="email" />
                            </div>

                            <div class="auth-input-group">
                                <div class="auth-input-icon">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                                <input type="password" id="admin-login-password" class="auth-input" required
                                       placeholder="••••••••" value="admin123" autocomplete="current-password" />
                                <button type="button" class="auth-eye-btn" onclick="LoginView.togglePasswordVisibility()">
                                    <svg id="password-eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>

                            <button type="submit" class="auth-btn-primary" id="admin-submit-btn" style="margin-top:6px;">
                                <span class="auth-btn-arrow">🛡️</span>
                                <span>Autenticar Terminal Master</span>
                            </button>
                        </form>

                        <div style="text-align:center; margin-top:12px;">
                            <a href="javascript:void(0)" onclick="LoginView.isAdminMode=false; LoginView.render()" style="color:#94a3b8; font-size:11.5px; text-decoration:none;">
                                ← Retornar ao Portal DNA AUTO
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('login-automotive-luxury-css')) {
            this.injectCSS();
        }
    },

    // ── Métodos de Interação ──

    toggleRole() {
        this.selectedRoleTab = this.selectedRoleTab === 'OWNER' ? 'WORKSHOP' : 'OWNER';
        this.render();
    },

    switchMode(mode) {
        this.activeMode = mode;
        this.render();
    },

    togglePasswordVisibility() {
        const input = document.getElementById('login-password') || document.getElementById('admin-login-password');
        const eyeIcon = document.getElementById('password-eye-icon');
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            if (eyeIcon) {
                eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
            }
        } else {
            input.type = 'password';
            if (eyeIcon) {
                eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
            }
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const btn = document.getElementById('login-submit-btn');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="auth-spinner"></span> <span>Validando DNA...</span>`;
        }

        try {
            const res = await API.login(email, password);
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            this.restoreLayout();
            App.loginAs(res.user.role_code, res.user);
        } catch (err) {
            console.error('Falha no login:', err);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span class="auth-btn-arrow">→</span> <span>Entrar</span>`;
            }
            alert('❌ E-mail ou senha inválidos. Verifique os dados ou utilize o Acesso Demo abaixo.');
        }
    },

    async handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value.trim();
        const password = document.getElementById('admin-login-password').value.trim();
        const btn = document.getElementById('admin-submit-btn');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="auth-spinner"></span> <span>Autenticando Master...</span>`;
        }

        try {
            const res = await API.login(email, password);
            if (res.user.role_code !== 'ADMIN') {
                alert('⛔ Esta conta não possui credencial de Administrador Master.');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<span class="auth-btn-arrow">🛡️</span> <span>Autenticar Terminal Master</span>`;
                }
                return;
            }
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            this.isAdminMode = false;
            this.restoreLayout();
            App.loginAs('ADMIN', res.user);
        } catch (err) {
            console.error('Falha no login admin:', err);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span class="auth-btn-arrow">🛡️</span> <span>Autenticar Terminal Master</span>`;
            }
            alert('❌ Credencial administrativa incorreta.');
        }
    },

    async quickLogin(role) {
        const cred = this.credentials[role];
        try {
            const res = await API.login(cred.email, cred.password);
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            this.isAdminMode = false;
            this.restoreLayout();
            App.loginAs(res.user.role_code, res.user);
        } catch (err) {
            if (role === 'OWNER') {
                API.setDemoUser('usr_owner_carlos');
                this.restoreLayout();
                App.loginAs('OWNER', { id: 'usr_owner_carlos', name: 'Carlos Alberto Silva', email: 'carlos.silva@email.com', role_code: 'OWNER' });
            } else if (role === 'WORKSHOP') {
                API.setDemoUser('usr_workshop_marcos');
                this.restoreLayout();
                App.loginAs('WORKSHOP', { id: 'usr_workshop_marcos', name: 'Marcos Silveira', role_code: 'WORKSHOP', workshop: { workshop_name: 'Veloce Auto Center' } });
            } else if (role === 'ADMIN') {
                API.setDemoUser('usr_admin');
                this.restoreLayout();
                App.loginAs('ADMIN', { id: 'usr_admin', name: 'Administrador Geral', role_code: 'ADMIN' });
            }
        }
    },

    async handleRegisterClient(e) {
        e.preventDefault();
        const name = document.getElementById('reg-client-name').value.trim();
        const cpf = document.getElementById('reg-client-cpf').value.trim();
        const phone = document.getElementById('reg-client-phone').value.trim();
        const email = document.getElementById('reg-client-email').value.trim();
        const password = document.getElementById('reg-client-password').value;
        const confirm = document.getElementById('reg-client-confirm').value;

        if (password !== confirm) { alert('As senhas digitadas não coincidem.'); return; }

        try {
            const res = await API.registerClient({ name, email, password, phone, cpf });
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            alert(`🎉 Bem-vindo ao DNA AUTO, ${res.user.name}! Sua Garagem Digital foi criada.`);
            this.restoreLayout();
            App.loginAs('OWNER', res.user);
        } catch (err) {
            alert('Erro no cadastro: ' + err.message);
        }
    },

    async handleRegisterWorkshop(e) {
        e.preventDefault();
        const tradeName = document.getElementById('reg-ws-trade').value.trim();
        const cnpj = document.getElementById('reg-ws-cnpj').value.trim();
        const phone = document.getElementById('reg-ws-phone').value.trim();
        const technicianName = document.getElementById('reg-ws-technician').value.trim();
        const email = document.getElementById('reg-ws-email').value.trim();
        const password = document.getElementById('reg-ws-password').value;
        const confirm = document.getElementById('reg-ws-confirm').value;

        if (password !== confirm) { alert('As senhas digitadas não coincidem.'); return; }

        try {
            const res = await API.registerWorkshop({ tradeName, cnpj, phone, technicianName, email, city: 'São Paulo', state: 'SP', password });
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            alert(`🏢 Oficina parceira credenciada com sucesso!`);
            this.isAdminMode = false;
            this.restoreLayout();
            App.loginAs('WORKSHOP_OWNER', res.user);
        } catch (err) {
            alert('Erro no credenciamento: ' + err.message);
        }
    },

    restoreLayout() {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = '';
        if (topbar) topbar.style.display = '';
        if (backdrop) backdrop.style.display = '';
    },

    // ── CSS Oficial do Design da Referência (Zero Scroll & Alta Fidelidade) ──
    injectCSS() {
        const style = document.createElement('style');
        style.id = 'login-automotive-luxury-css';
        style.textContent = `
            /* CONTAINER FULLSCREEN COM ZERO SCROLL GARANTIDO (100DVH) */
            .auth-fullscreen-container {
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                overflow: hidden !important;
                overscroll-behavior: none !important;
                touch-action: none;
                z-index: 99999;
                background: linear-gradient(180deg, rgba(5, 8, 13, 0.82) 0%, rgba(5, 8, 13, 0.90) 45%, rgba(5, 8, 13, 0.98) 100%),
                            url('/img/login-car-bg.jpg') center center / cover no-repeat fixed;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: var(--font-sans);
                padding: 10px 16px;
                box-sizing: border-box;
            }

            /* CAIXA CENTRAL */
            .auth-content-box {
                width: 100%;
                max-width: 360px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                animation: authFadeIn 0.3s ease-out;
                box-sizing: border-box;
            }

            @keyframes authFadeIn {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* HEADER & IDENTIDADE */
            .auth-brand-header {
                text-align: center;
                margin-bottom: 12px;
                width: 100%;
            }

            .auth-emblem-wrapper {
                margin: 0 auto 6px;
                display: flex;
                justify-content: center;
                align-items: center;
                filter: drop-shadow(0 0 14px rgba(255, 210, 28, 0.35));
                transition: transform 0.2s ease;
            }
            .auth-emblem-wrapper:hover {
                transform: scale(1.04);
            }

            .auth-title {
                font-size: 24px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 1px;
                margin: 0;
                line-height: 1.1;
                font-family: var(--font-sans);
            }
            .text-gold {
                color: #FFD21C;
            }

            .auth-subtitle {
                font-size: 9.5px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: 1.6px;
                text-transform: uppercase;
                margin: 2px 0 4px;
                opacity: 0.95;
            }

            .auth-motto {
                font-size: 11.5px;
                color: #94a3b8;
                font-weight: 400;
                line-height: 1.3;
                margin: 0 auto;
                max-width: 280px;
            }

            /* FORMULÁRIO */
            .auth-card-body {
                width: 100%;
            }

            /* INPUTS COM ÍCONES */
            .auth-input-group {
                position: relative;
                width: 100%;
                margin-bottom: 8px;
            }

            .auth-input-icon {
                position: absolute;
                left: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #94a3b8;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .auth-input {
                width: 100%;
                height: 40px;
                background: rgba(12, 18, 28, 0.88);
                border: 1px solid #1E2B3D;
                border-radius: 9px;
                padding: 0 40px 0 42px;
                color: #ffffff;
                font-size: 13.5px;
                font-family: var(--font-sans);
                transition: all 0.2s ease;
                box-sizing: border-box;
                backdrop-filter: blur(8px);
            }
            .auth-input::placeholder {
                color: #64748b;
                font-size: 13px;
            }
            .auth-input:focus {
                outline: none;
                border-color: #FFD21C;
                box-shadow: 0 0 0 2.5px rgba(255, 210, 28, 0.18);
                background: rgba(14, 22, 34, 0.98);
            }

            .auth-eye-btn {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.15s ease;
            }
            .auth-eye-btn:hover {
                color: #ffffff;
            }

            .auth-input-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            .auth-input-row .auth-input {
                padding-left: 12px;
            }

            /* LEMBRAR DE MIM & ESQUECI MINHA SENHA */
            .auth-options-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 6px 0 10px;
                font-size: 12px;
            }

            .auth-checkbox-label {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                user-select: none;
            }

            .auth-custom-checkbox {
                display: none;
            }

            .auth-checkbox-custom {
                width: 16px;
                height: 16px;
                border-radius: 4px;
                background: #111923;
                border: 1.5px solid #28384B;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
            }

            .auth-custom-checkbox:checked + .auth-checkbox-custom {
                background: #FFD21C;
                border-color: #FFD21C;
            }
            .auth-custom-checkbox:checked + .auth-checkbox-custom::after {
                content: '✓';
                color: #05080D;
                font-size: 11px;
                font-weight: 900;
            }

            .auth-remember-text {
                color: #cbd5e1;
                font-weight: 500;
            }

            .auth-forgot-link {
                color: #FFD21C;
                text-decoration: none;
                font-weight: 600;
                transition: opacity 0.15s ease;
            }
            .auth-forgot-link:hover {
                opacity: 0.85;
                text-decoration: underline;
            }

            /* BOTÃO PRIMÁRIO (AMARELO OFICIAL) */
            .auth-btn-primary {
                width: 100%;
                height: 40px;
                background: #FFD21C;
                color: #05080D;
                border: none;
                border-radius: 9px;
                font-size: 14px;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 3px 14px rgba(255, 210, 28, 0.28);
            }
            .auth-btn-primary:hover {
                background: #FFE052;
                transform: translateY(-1px);
                box-shadow: 0 5px 18px rgba(255, 210, 28, 0.38);
            }
            .auth-btn-primary:active {
                transform: translateY(0);
            }
            .auth-btn-arrow {
                font-size: 16px;
                font-weight: 900;
            }

            /* DIVISOR */
            .auth-divider {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 8px 0;
                width: 100%;
            }
            .auth-divider-line {
                flex: 1;
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
            }
            .auth-divider-text {
                color: #64748b;
                font-size: 11.5px;
                font-weight: 500;
            }

            /* BOTÃO SECUNDÁRIO (OFICINA) */
            .auth-btn-secondary {
                width: 100%;
                height: 36px;
                background: rgba(10, 15, 22, 0.65);
                border: 1.2px solid rgba(255, 255, 255, 0.18);
                border-radius: 9px;
                color: #ffffff;
                font-size: 12.5px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.18s ease;
                backdrop-filter: blur(8px);
            }
            .auth-btn-secondary:hover {
                border-color: #FFD21C;
                color: #FFD21C;
                background: rgba(255, 210, 28, 0.06);
            }
            .auth-secondary-icon {
                display: flex;
                align-items: center;
            }

            /* RODAPÉ PROMPT */
            .auth-footer-prompt {
                text-align: center;
                margin-top: 8px;
                font-size: 11.5px;
                color: #94a3b8;
                display: flex;
                justify-content: center;
                gap: 5px;
            }
            .auth-link-gold {
                color: #FFD21C;
                font-weight: 700;
                text-decoration: underline;
                cursor: pointer;
            }
            .auth-link-gold:hover {
                color: #FFE052;
            }

            /* DEMO RÁPIDO DISCRETO & COMPACTO */
            .auth-demo-bar {
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid rgba(255, 255, 255, 0.07);
                width: 100%;
                text-align: center;
            }
            .auth-demo-label {
                font-size: 9.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #64748b;
                margin-bottom: 5px;
            }
            .auth-demo-buttons {
                display: flex;
                justify-content: center;
                gap: 6px;
                flex-wrap: wrap;
            }
            .auth-demo-pill {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #cbd5e1;
                font-size: 10.5px;
                font-weight: 600;
                padding: 4px 10px;
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            .auth-demo-pill:hover {
                background: rgba(255, 210, 28, 0.12);
                border-color: #FFD21C;
                color: #FFD21C;
            }
            .auth-demo-pill.active {
                border-color: #FFD21C;
                color: #FFD21C;
                background: rgba(255, 210, 28, 0.08);
            }
            .admin-pill {
                border-color: rgba(255, 210, 28, 0.3);
                color: #FFD21C;
            }

            .auth-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(0,0,0,0.2);
                border-top-color: #05080D;
                border-radius: 50%;
                display: inline-block;
                animation: spin 0.7s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Scroll interno seguro APENAS quando no modo cadastro */
            .auth-register-header {
                text-align: center;
                margin-bottom: 10px;
            }

            /* TELAS PEQUENAS / ULTRA COMPACTO */
            @media (max-height: 640px) {
                .auth-fullscreen-container {
                    padding: 6px 12px;
                }
                .auth-brand-header {
                    margin-bottom: 6px;
                }
                .auth-emblem-wrapper {
                    margin-bottom: 2px;
                }
                .auth-title {
                    font-size: 20px;
                }
                .auth-subtitle {
                    font-size: 8.5px;
                    margin-bottom: 2px;
                }
                .auth-motto {
                    display: none;
                }
                .auth-input-group {
                    margin-bottom: 5px;
                }
                .auth-input {
                    height: 36px;
                    font-size: 12.5px;
                }
                .auth-btn-primary {
                    height: 36px;
                    font-size: 13px;
                }
                .auth-btn-secondary {
                    height: 32px;
                    font-size: 11.5px;
                }
                .auth-divider {
                    margin: 5px 0;
                }
                .auth-demo-bar {
                    margin-top: 5px;
                    padding-top: 4px;
                }
            }
        `;
        document.head.appendChild(style);
    }
};
