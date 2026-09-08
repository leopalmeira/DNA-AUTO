// ==============================================================================
// DNA AUTO — TELA DE LOGIN & CADASTRO (REDESENHADA — PREMIUM VISUAL)
// Apenas Cliente e Oficina visíveis. Admin acessa por link próprio.
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

        // Esconde sidebar e header quando na tela de login
        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';

        // Se é modo admin, renderiza login admin simples
        if (this.isAdminMode) {
            this.renderAdminLogin(container);
            return;
        }

        container.innerHTML = `
            <div class="login-fullscreen">
                <!-- Partículas de fundo animadas -->
                <div class="login-particles">
                    <div class="particle p1"></div>
                    <div class="particle p2"></div>
                    <div class="particle p3"></div>
                    <div class="particle p4"></div>
                    <div class="particle p5"></div>
                    <div class="particle p6"></div>
                </div>

                <!-- Glow radial central -->
                <div class="login-glow-bg"></div>

                <div class="login-center-wrapper">
                    <!-- LOGO GRANDE E TITLE -->
                    <div class="login-hero-header">
                        <div class="login-logo-circle">
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 15c6.667-6 13.333 0 20-6"></path>
                                <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"></path>
                                <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"></path>
                                <path d="M17 6l-2.5-2.5"></path>
                                <path d="M14 8l-1-1"></path>
                                <path d="M7 18l2.5 2.5"></path>
                                <path d="M3.5 14.5l3-3"></path>
                                <path d="M20.5 9.5l-3 3"></path>
                                <path d="M10 16l1 1"></path>
                            </svg>
                        </div>
                        <h1 class="login-title">DNA AUTO</h1>
                        <p class="login-subtitle">Passaporte Digital do Veículo</p>
                    </div>

                    <!-- CARD PRINCIPAL DE LOGIN -->
                    <div class="login-card">
                        <!-- Linha gradiente no topo -->
                        <div class="login-card-topline"></div>

                        <!-- SELETOR DE PERFIL: CLIENTE vs OFICINA -->
                        <div class="login-role-selector">
                            <button class="login-role-btn ${this.selectedRoleTab === 'OWNER' ? 'active owner-active' : ''}" onclick="LoginView.switchRoleTab('OWNER')">
                                <span class="login-role-icon">🚗</span>
                                <span class="login-role-label">Sou Cliente</span>
                            </button>
                            <button class="login-role-btn ${this.selectedRoleTab === 'WORKSHOP' ? 'active workshop-active' : ''}" onclick="LoginView.switchRoleTab('WORKSHOP')">
                                <span class="login-role-icon">🔧</span>
                                <span class="login-role-label">Oficina Parceira</span>
                            </button>
                        </div>

                        <!-- TABS: ENTRAR vs CADASTRAR -->
                        <div class="login-mode-tabs">
                            <button class="login-mode-tab ${this.activeMode === 'LOGIN' ? 'active' : ''}" onclick="LoginView.switchMode('LOGIN')">
                                Entrar
                            </button>
                            <button class="login-mode-tab ${this.activeMode === 'REGISTER' ? 'active' : ''}" onclick="LoginView.switchMode('REGISTER')">
                                Cadastre-se
                            </button>
                            <div class="login-mode-indicator" style="transform: translateX(${this.activeMode === 'REGISTER' ? '100%' : '0'})"></div>
                        </div>

                        <!-- CONTEÚDO DINÂMICO -->
                        <div class="login-form-area">
                            ${this.activeMode === 'LOGIN' ? this.renderLoginForm() : this.renderRegisterForm()}
                        </div>
                    </div>

                    <!-- FOOTER -->
                    <div class="login-footer-links">
                        <p class="login-footer-copy">© ${new Date().getFullYear()} DNA AUTO — Todos os direitos reservados</p>
                    </div>
                </div>
            </div>
        `;

        // Injetar CSS da tela de login se ainda não existir
        if (!document.getElementById('login-premium-css')) {
            this.injectCSS();
        }
    },

    renderAdminLogin(container) {
        container.innerHTML = `
            <div class="login-fullscreen login-admin-bg">
                <div class="login-particles">
                    <div class="particle p1"></div>
                    <div class="particle p2"></div>
                    <div class="particle p3"></div>
                </div>
                <div class="login-glow-bg" style="background: radial-gradient(ellipse at center, rgba(168,85,247,0.12) 0%, transparent 65%);"></div>

                <div class="login-center-wrapper">
                    <div class="login-hero-header">
                        <div class="login-logo-circle" style="background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 0 40px rgba(168,85,247,0.5);">
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h1 class="login-title">DNA AUTO ADMIN</h1>
                        <p class="login-subtitle" style="color:#c084fc;">Painel de Governança — Acesso Restrito</p>
                    </div>

                    <div class="login-card" style="border-color: rgba(168,85,247,0.25);">
                        <div class="login-card-topline" style="background: linear-gradient(90deg, #7c3aed, #a855f7, #c084fc);"></div>
                        
                        <div style="padding: 6px 0 16px; text-align: center;">
                            <span style="display:inline-flex; align-items:center; gap:8px; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); padding:8px 18px; border-radius:20px; font-size:12px; font-weight:700; color:#c084fc;">
                                🛡️ Acesso Administrativo
                            </span>
                        </div>

                        <form id="admin-login-form" onsubmit="LoginView.handleAdminLogin(event)">
                            <div class="login-field-group">
                                <label class="login-field-label">E-mail Administrativo</label>
                                <input type="email" id="admin-login-email" class="login-field-input" required
                                       placeholder="admin@dnaauto.com.br" autocomplete="email" />
                            </div>
                            <div class="login-field-group">
                                <label class="login-field-label">Senha Master</label>
                                <input type="password" id="admin-login-password" class="login-field-input" required
                                       placeholder="••••••••" autocomplete="current-password" />
                            </div>
                            <button type="submit" class="login-submit-btn" id="admin-submit-btn" style="background: linear-gradient(135deg, #7c3aed, #a855f7);">
                                ACESSAR PAINEL ADMIN
                            </button>
                        </form>

                        <div style="text-align:center; margin-top:18px;">
                            <a href="javascript:void(0)" onclick="LoginView.isAdminMode=false; LoginView.render()" style="color:#94a3b8; font-size:12px; text-decoration:none;">
                                ← Voltar ao Login Normal
                            </a>
                        </div>

                        <!-- Demo rápido admin -->
                        <div style="margin-top:14px; padding:12px; background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.2); border-radius:10px; text-align:center;">
                            <span style="font-size:11px; color:#94a3b8;">Demo: admin@dnaauto.com.br / admin123</span>
                            <button type="button" onclick="LoginView.quickLogin('ADMIN')" style="display:block; margin:8px auto 0; padding:6px 20px; background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.35); color:#c084fc; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">
                                ⚡ Entrar como Admin Demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('login-premium-css')) {
            this.injectCSS();
        }
    },

    renderLoginForm() {
        const isOwner = this.selectedRoleTab === 'OWNER';
        const cred = this.credentials[this.selectedRoleTab];

        return `
            <form id="login-form" onsubmit="LoginView.handleSubmit(event)">
                <div class="login-field-group">
                    <label class="login-field-label">E-mail</label>
                    <input type="email" id="login-email" class="login-field-input" required
                           placeholder="${isOwner ? 'seuemail@provedor.com' : 'contato@minhaoficina.com.br'}"
                           autocomplete="email" />
                </div>

                <div class="login-field-group">
                    <label class="login-field-label">Senha</label>
                    <input type="password" id="login-password" class="login-field-input" required
                           placeholder="••••••••" autocomplete="current-password" />
                </div>

                <button type="submit" class="login-submit-btn" id="login-submit-btn">
                    ${isOwner ? '🚗  ENTRAR NA MINHA GARAGEM' : '🔧  ENTRAR NO PAINEL DA OFICINA'}
                </button>
            </form>

            <!-- DEMO quick access -->
            <div class="login-demo-box">
                <div class="login-demo-header">
                    <span>🔑 Acesso Demo</span>
                    <span class="login-demo-badge">TESTE</span>
                </div>
                <div class="login-demo-credentials">
                    <span><strong style="color:#f8fafc;">${cred.email}</strong></span>
                    <span style="color:#10b981;font-family:var(--font-mono);font-weight:600;">${cred.password}</span>
                </div>
                <button type="button" class="login-demo-btn" onclick="LoginView.quickLogin('${this.selectedRoleTab}')">
                    ⚡ Entrar com 1 Clique
                </button>
            </div>
        `;
    },

    renderRegisterForm() {
        if (this.selectedRoleTab === 'WORKSHOP') {
            return `
                <form id="register-ws-form" onsubmit="LoginView.handleRegisterWorkshop(event)">
                    <div class="login-field-group">
                        <label class="login-field-label">Nome Fantasia da Oficina *</label>
                        <input type="text" id="reg-ws-trade" class="login-field-input" required placeholder="Ex: Auto Mecânica Premium" />
                    </div>

                    <div class="login-field-row">
                        <div class="login-field-group">
                            <label class="login-field-label">CNPJ *</label>
                            <input type="text" id="reg-ws-cnpj" class="login-field-input" required placeholder="00.000.000/0001-00" />
                        </div>
                        <div class="login-field-group">
                            <label class="login-field-label">WhatsApp *</label>
                            <input type="text" id="reg-ws-phone" class="login-field-input" required placeholder="(11) 98888-7777" />
                        </div>
                    </div>

                    <div class="login-field-group">
                        <label class="login-field-label">Responsável Técnico *</label>
                        <input type="text" id="reg-ws-technician" class="login-field-input" required placeholder="Nome do mecânico chefe" />
                    </div>

                    <div class="login-field-group">
                        <label class="login-field-label">E-mail Comercial *</label>
                        <input type="email" id="reg-ws-email" class="login-field-input" required placeholder="contato@minhaoficina.com.br" />
                    </div>

                    <div class="login-field-row">
                        <div class="login-field-group">
                            <label class="login-field-label">Cidade *</label>
                            <input type="text" id="reg-ws-city" class="login-field-input" required placeholder="São Paulo" value="São Paulo" />
                        </div>
                        <div class="login-field-group" style="max-width:100px;">
                            <label class="login-field-label">UF *</label>
                            <input type="text" id="reg-ws-state" class="login-field-input" required placeholder="SP" value="SP" maxlength="2" style="text-transform:uppercase;" />
                        </div>
                    </div>

                    <div class="login-field-row">
                        <div class="login-field-group">
                            <label class="login-field-label">Criar Senha *</label>
                            <input type="password" id="reg-ws-password" class="login-field-input" required placeholder="Mín. 6 dígitos" minlength="6" />
                        </div>
                        <div class="login-field-group">
                            <label class="login-field-label">Confirmar *</label>
                            <input type="password" id="reg-ws-confirm" class="login-field-input" required placeholder="Repita a senha" minlength="6" />
                        </div>
                    </div>

                    <button type="submit" class="login-submit-btn login-submit-green">
                        🏭  CREDENCIAR OFICINA & ENTRAR
                    </button>
                </form>
            `;
        }

        // CADASTRO CLIENTE
        return `
            <form id="register-client-form" onsubmit="LoginView.handleRegisterClient(event)">
                <div class="login-field-group">
                    <label class="login-field-label">Seu Nome Completo *</label>
                    <input type="text" id="reg-client-name" class="login-field-input" required placeholder="Ex: Roberto Carlos de Abreu" />
                </div>

                <div class="login-field-row">
                    <div class="login-field-group">
                        <label class="login-field-label">CPF (Opcional)</label>
                        <input type="text" id="reg-client-cpf" class="login-field-input" placeholder="000.000.000-00" />
                    </div>
                    <div class="login-field-group">
                        <label class="login-field-label">WhatsApp *</label>
                        <input type="text" id="reg-client-phone" class="login-field-input" required placeholder="(11) 97777-6666" />
                    </div>
                </div>

                <div class="login-field-group">
                    <label class="login-field-label">Seu E-mail *</label>
                    <input type="email" id="reg-client-email" class="login-field-input" required placeholder="seuemail@provedor.com" />
                </div>

                <div class="login-field-row">
                    <div class="login-field-group">
                        <label class="login-field-label">Criar Senha *</label>
                        <input type="password" id="reg-client-password" class="login-field-input" required placeholder="Mín. 6 dígitos" minlength="6" />
                    </div>
                    <div class="login-field-group">
                        <label class="login-field-label">Confirmar *</label>
                        <input type="password" id="reg-client-confirm" class="login-field-input" required placeholder="Repita a senha" minlength="6" />
                    </div>
                </div>

                <button type="submit" class="login-submit-btn">
                    🚗  CRIAR CONTA & ACESSAR GARAGEM
                </button>
            </form>
        `;
    },

    // ── Ações ──

    switchRoleTab(role) {
        this.selectedRoleTab = role;
        this.render();
    },

    switchMode(mode) {
        this.activeMode = mode;
        this.render();
    },

    async handleSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const btn = document.getElementById('login-submit-btn');

        if (btn) { btn.disabled = true; btn.textContent = 'Autenticando...'; }

        try {
            const res = await API.login(email, password);
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            this.restoreLayout();
            App.loginAs(res.user.role_code, res.user);
        } catch (err) {
            console.error('Falha no login:', err);
            if (btn) { btn.disabled = false; btn.textContent = 'ENTRAR'; }
            alert('❌ E-mail ou senha inválidos. Verifique suas credenciais.');
        }
    },

    async handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value.trim();
        const password = document.getElementById('admin-login-password').value.trim();
        const btn = document.getElementById('admin-submit-btn');

        if (btn) { btn.disabled = true; btn.textContent = 'Autenticando...'; }

        try {
            const res = await API.login(email, password);
            if (res.user.role_code !== 'ADMIN') {
                alert('⛔ Esta conta não possui permissão de Administrador.');
                if (btn) { btn.disabled = false; btn.textContent = 'ACESSAR PAINEL ADMIN'; }
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
            if (btn) { btn.disabled = false; btn.textContent = 'ACESSAR PAINEL ADMIN'; }
            alert('❌ Credenciais administrativas inválidas.');
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
            // Fallback offline
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

        if (password !== confirm) { alert('As senhas não coincidem.'); return; }

        try {
            const res = await API.registerClient({ name, email, password, phone, cpf });
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            alert(`🎉 Bem-vindo ao DNA AUTO, ${res.user.name}!`);
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
        const city = document.getElementById('reg-ws-city').value.trim();
        const state = document.getElementById('reg-ws-state').value.trim();
        const password = document.getElementById('reg-ws-password').value;
        const confirm = document.getElementById('reg-ws-confirm').value;

        if (password !== confirm) { alert('As senhas não coincidem.'); return; }

        try {
            const res = await API.registerWorkshop({ tradeName, cnpj, phone, technicianName, email, city, state, password });
            API.setToken(res.token);
            API.setDemoUser(res.user.id);
            localStorage.setItem('dna_token', res.token);
            alert(`🏢 Oficina credenciada com sucesso!`);
            this.isAdminMode = false;
            this.restoreLayout();
            App.loginAs('WORKSHOP_OWNER', res.user);
        } catch (err) {
            alert('Erro no credenciamento: ' + err.message);
        }
    },

    // Restaura sidebar e header após login
    restoreLayout() {
        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = '';
        if (topbar) topbar.style.display = '';
        if (backdrop) backdrop.style.display = '';
    },

    // ── CSS Premium Injection ──
    injectCSS() {
        const style = document.createElement('style');
        style.id = 'login-premium-css';
        style.textContent = `
            /* ===== TELA DE LOGIN FULLSCREEN PREMIUM ===== */
            .login-fullscreen {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: #050816;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow-y: auto;
                font-family: var(--font-sans);
            }
            .login-admin-bg { background: #0a0618; }

            /* Partículas flutuantes */
            .login-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
            .particle {
                position: absolute;
                border-radius: 50%;
                opacity: 0.3;
                animation: floatParticle 20s infinite ease-in-out;
            }
            .p1 { width:300px; height:300px; background:radial-gradient(circle, rgba(0,136,255,0.15), transparent 70%); top:-5%; left:10%; animation-delay:0s; }
            .p2 { width:200px; height:200px; background:radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%); top:60%; right:5%; animation-delay:-5s; }
            .p3 { width:250px; height:250px; background:radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%); bottom:10%; left:30%; animation-delay:-10s; }
            .p4 { width:150px; height:150px; background:radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); top:20%; right:20%; animation-delay:-3s; }
            .p5 { width:180px; height:180px; background:radial-gradient(circle, rgba(0,136,255,0.08), transparent 70%); bottom:30%; left:5%; animation-delay:-7s; }
            .p6 { width:120px; height:120px; background:radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%); top:40%; left:60%; animation-delay:-12s; }

            @keyframes floatParticle {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(30px, -40px) scale(1.1); }
                50% { transform: translate(-20px, 30px) scale(0.95); }
                75% { transform: translate(40px, 20px) scale(1.05); }
            }

            .login-glow-bg {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center top, rgba(0,136,255,0.08) 0%, transparent 60%);
                pointer-events: none;
            }

            .login-center-wrapper {
                position: relative;
                z-index: 2;
                width: 100%;
                max-width: 440px;
                padding: 30px 20px;
            }

            /* HERO HEADER */
            .login-hero-header { text-align: center; margin-bottom: 28px; }
            .login-logo-circle {
                width: 70px; height: 70px;
                margin: 0 auto 16px;
                background: linear-gradient(135deg, #0088ff, #00d4ff);
                border-radius: 18px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 40px rgba(0,136,255,0.4), 0 0 80px rgba(0,212,255,0.15);
                animation: logoPulse 3s ease-in-out infinite;
            }
            @keyframes logoPulse {
                0%, 100% { box-shadow: 0 0 40px rgba(0,136,255,0.4), 0 0 80px rgba(0,212,255,0.15); }
                50% { box-shadow: 0 0 60px rgba(0,136,255,0.6), 0 0 100px rgba(0,212,255,0.25); }
            }
            .login-title {
                font-size: 32px;
                font-weight: 800;
                color: #fff;
                letter-spacing: 2px;
                margin: 0 0 4px;
            }
            .login-subtitle {
                font-size: 13px;
                color: #00d4ff;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin: 0;
            }

            /* CARD PRINCIPAL */
            .login-card {
                background: linear-gradient(180deg, rgba(17,24,39,0.95), rgba(11,15,25,0.98));
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 20px;
                padding: 0 28px 28px;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(20px);
                box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
            }
            .login-card-topline {
                height: 3px;
                background: linear-gradient(90deg, #0088ff, #00d4ff, #10b981);
                margin: 0 -28px;
            }

            /* SELETOR DE PERFIL */
            .login-role-selector {
                display: flex;
                gap: 10px;
                padding: 20px 0 14px;
            }
            .login-role-btn {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                padding: 14px 8px;
                background: rgba(255,255,255,0.03);
                border: 2px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #94a3b8;
            }
            .login-role-btn:hover {
                background: rgba(255,255,255,0.06);
                border-color: rgba(255,255,255,0.15);
                transform: translateY(-2px);
            }
            .login-role-btn.owner-active {
                background: rgba(0,136,255,0.08);
                border-color: rgba(0,136,255,0.5);
                color: #38bdf8;
                box-shadow: 0 0 25px rgba(0,136,255,0.15);
            }
            .login-role-btn.workshop-active {
                background: rgba(16,185,129,0.08);
                border-color: rgba(16,185,129,0.5);
                color: #34d399;
                box-shadow: 0 0 25px rgba(16,185,129,0.15);
            }
            .login-role-icon { font-size: 26px; }
            .login-role-label { font-size: 12px; font-weight: 700; letter-spacing: 0.3px; }

            /* TABS ENTRAR / CADASTRAR */
            .login-mode-tabs {
                display: flex;
                position: relative;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                padding: 3px;
                margin-bottom: 22px;
            }
            .login-mode-tab {
                flex: 1;
                padding: 10px;
                background: transparent;
                border: none;
                color: #64748b;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                z-index: 2;
                transition: color 0.3s ease;
                border-radius: 8px;
            }
            .login-mode-tab.active { color: #fff; }
            .login-mode-indicator {
                position: absolute;
                top: 3px;
                left: 3px;
                width: calc(50% - 3px);
                height: calc(100% - 6px);
                background: rgba(0,136,255,0.2);
                border: 1px solid rgba(0,136,255,0.35);
                border-radius: 8px;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1;
            }

            /* CAMPOS DO FORMULÁRIO */
            .login-form-area { animation: fadeInUp 0.3s ease; }
            @keyframes fadeInUp {
                from { opacity:0; transform:translateY(10px); }
                to { opacity:1; transform:translateY(0); }
            }

            .login-field-group { margin-bottom: 14px; }
            .login-field-label {
                display: block;
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
            }
            .login-field-input {
                width: 100%;
                padding: 11px 14px;
                background: rgba(0,0,0,0.35);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                color: #f8fafc;
                font-size: 14px;
                font-family: var(--font-sans);
                transition: all 0.25s ease;
                box-sizing: border-box;
                outline: none;
            }
            .login-field-input::placeholder { color: #475569; }
            .login-field-input:focus {
                border-color: #00d4ff;
                box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
                background: rgba(0,0,0,0.5);
            }
            .login-field-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            /* BOTÃO SUBMETER */
            .login-submit-btn {
                width: 100%;
                padding: 13px;
                background: linear-gradient(135deg, #0088ff, #00b4ff);
                border: none;
                border-radius: 12px;
                color: #fff;
                font-size: 14px;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.3s ease;
                letter-spacing: 0.5px;
                margin-top: 6px;
                box-shadow: 0 4px 15px rgba(0,136,255,0.3);
            }
            .login-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,136,255,0.4);
            }
            .login-submit-btn:active { transform: translateY(0); }
            .login-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            .login-submit-green {
                background: linear-gradient(135deg, #059669, #10b981);
                box-shadow: 0 4px 15px rgba(16,185,129,0.3);
            }
            .login-submit-green:hover { box-shadow: 0 8px 25px rgba(16,185,129,0.4); }

            /* DEMO BOX */
            .login-demo-box {
                margin-top: 18px;
                padding: 14px;
                background: rgba(0,212,255,0.04);
                border: 1px solid rgba(0,212,255,0.15);
                border-radius: 12px;
            }
            .login-demo-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #00d4ff;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .login-demo-badge {
                font-size: 9px;
                background: rgba(0,212,255,0.15);
                padding: 2px 8px;
                border-radius: 4px;
                letter-spacing: 0.5px;
            }
            .login-demo-credentials {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0,0,0,0.3);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                color: #94a3b8;
                margin-bottom: 10px;
            }
            .login-demo-btn {
                width: 100%;
                padding: 9px;
                background: rgba(0,212,255,0.08);
                border: 1px solid rgba(0,212,255,0.25);
                border-radius: 8px;
                color: #00d4ff;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .login-demo-btn:hover {
                background: rgba(0,212,255,0.15);
                border-color: rgba(0,212,255,0.4);
            }

            /* FOOTER */
            .login-footer-links {
                text-align: center;
                margin-top: 22px;
            }
            .login-footer-copy {
                font-size: 11px;
                color: #334155;
                margin: 0;
            }

            /* RESPONSIVE */
            @media (max-width: 480px) {
                .login-center-wrapper { padding: 20px 14px; max-width: 100%; }
                .login-card { padding: 0 18px 22px; border-radius: 16px; }
                .login-card-topline { margin: 0 -18px; }
                .login-title { font-size: 26px; }
                .login-logo-circle { width: 60px; height: 60px; border-radius: 16px; }
                .login-logo-circle svg { width: 30px; height: 30px; }
                .login-role-btn { padding: 12px 6px; }
                .login-role-icon { font-size: 22px; }
                .login-role-label { font-size: 11px; }
                .login-field-row { grid-template-columns: 1fr; gap: 0; }
                .login-submit-btn { font-size: 13px; padding: 12px; }
            }
        `;
        document.head.appendChild(style);
    }
};
