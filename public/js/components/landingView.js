// ==============================================================================
// DNA AUTO — LANDING PAGE OFICIAL DE ALTA CONVERSÃO (PADRÃO TOTVS / ENTERPRISE)
// Módulos: B2C (Dono do Carro: R$ 59,90) + B2B (Oficinas: Aumento de Faturamento)
// ==============================================================================

const LandingView = {
    // Estado interativo interno da Landing Page
    activeAudienceTab: 'OWNER', // 'OWNER' ou 'WORKSHOP'
    selectedMonthIndex: 2, // Mês selecionado no mockup de gastos
    activeFaqIndex: 0,

    render() {
        // Ajusta overflow e limpa layout comum de dashboards
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';

        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';

        const isLogged = !!App.currentRole && !!App.currentUser;
        let panelTarget = 'owner';
        let panelLabel = 'Ir para Meu Painel →';
        if (App.currentRole === 'ADMIN') {
            panelTarget = 'admin';
            panelLabel = 'Painel Admin Matriz →';
        } else if (App.currentRole === 'WORKSHOP') {
            panelTarget = 'workshop';
            panelLabel = 'Painel da Oficina →';
        }

        const navAuthButton = isLogged
            ? `<button class="totvs-btn-ghost" onclick="App.switchView('${panelTarget}')" style="border-color:#FFD21C; color:#FFD21C; font-weight:700;">${panelLabel}</button>`
            : `<button class="totvs-btn-ghost" onclick="App.switchView('login')"><span class="desktop-only">Entrar na Plataforma</span><span class="mobile-only">Entrar</span></button>`;

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="totvs-landing-root">
                <!-- ========================================== -->
                <!-- HEADER CORPORATIVO PADRÃO TOTVS            -->
                <!-- ========================================== -->
                <header class="totvs-navbar">
                    <div class="totvs-nav-container">
                        <div class="totvs-brand" onclick="LandingView.render()">
                            <div class="totvs-brand-logo">
                                <svg viewBox="0 0 120 120" width="28" height="28" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="7" />
                                    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="8" />
                                    <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="8" />
                                    <path d="M 28 70 C 21 52 23 27 36 14 C 50 1 78 1 91 14 C 103 27 105 52 98 70" stroke-width="8" />
                                    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="9" />
                                </svg>
                            </div>
                            <div class="totvs-brand-title">
                                <span>DNA <strong style="color:#FFD21C;">AUTO</strong></span>
                            </div>
                        </div>

                        <nav class="totvs-nav-links" id="totvs-nav-links">
                            ${this.renderNavLinks()}
                        </nav>

                        <div class="totvs-nav-actions" id="totvs-nav-actions">
                            ${navAuthButton}
                            <button class="totvs-btn-gold" id="totvs-nav-main-cta" onclick="${this.activeAudienceTab === 'WORKSHOP' ? 'LandingView.goToRegisterWorkshop()' : 'LandingView.goToRegister()'}">
                                ${this.activeAudienceTab === 'WORKSHOP' 
                                    ? '<span class="desktop-only">Credenciar Oficina (Grátis)</span><span class="mobile-only">Credenciar Grátis</span>' 
                                    : '<span class="desktop-only">Garantir DNA (R$ 59,90)</span><span class="mobile-only">Garantir DNA</span>'}
                            </button>
                        </div>
                    </div>
                </header>

                <!-- ========================================== -->
                <!-- HERO SECTION PRINCIPAL MULTI-PÚBLICO       -->
                <!-- ========================================== -->
                <section class="totvs-hero">
                    <div class="totvs-hero-grid-pattern"></div>
                    <div class="totvs-hero-content">
                        <!-- Switcher de Perfil Rápido -->
                        <div class="totvs-audience-switcher">
                            <button class="totvs-audience-btn ${this.activeAudienceTab === 'OWNER' ? 'active' : ''}" onclick="LandingView.switchAudience('OWNER')">
                                <span>🚗 <span class="desktop-only">Sou </span>Dono de Carro</span>
                            </button>
                            <button class="totvs-audience-btn ${this.activeAudienceTab === 'WORKSHOP' ? 'active' : ''}" onclick="LandingView.switchAudience('WORKSHOP')">
                                <span>🔧 <span class="desktop-only">Sou </span>Dono de Oficina</span>
                            </button>
                        </div>

                        <!-- Conteúdo Dinâmico do Hero: Dono vs Oficina -->
                        <div id="totvs-hero-dynamic-block">
                            ${this.renderHeroDynamicContent()}
                        </div>

                        <!-- Faixa Dinâmica de KPIs Corporativos da Rede -->
                        <div class="totvs-kpi-bar" id="totvs-kpi-bar-block">
                            ${this.renderKpiBar()}
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÕES DINÂMICAS: DONO DO CARRO VS OFICINA -->
                <!-- ========================================== -->
                <div id="totvs-audience-sections-block">
                    ${this.renderAudienceSections()}
                </div>

                <!-- ========================================== -->
                <!-- SEÇÃO FAQ: DÚVIDAS FREQUENTES              -->
                <!-- ========================================== -->
                <section class="totvs-section" id="faq-section" style="background:#060a12; border-top:1px solid rgba(255,255,255,0.06);">
                    <div class="totvs-container" style="max-width:840px;">
                        <div class="totvs-section-header">
                            <span class="totvs-badge-tag cyan">PERGUNTAS FREQUENTES</span>
                            <h2>Tire Suas Dúvidas sobre o DNA AUTO</h2>
                            <p>Tudo o que você precisa saber sobre a gestão financeira do veículo, o radar preditivo e o credenciamento de oficinas.</p>
                        </div>

                        <div class="totvs-faq-accordion">
                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como a oficina mecânica sabe quando trocar a correia dentada do cliente?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>O algoritmo inteligente do DNA AUTO cruza o histórico do veículo, a data da última troca e a quilometragem média percorrida pelo condutor. Quando a correia dentada, tensores ou óleos atingem a faixa crítica (próximo aos 40.000 ou 50.000 km), o próprio sistema gera o alerta preventivo e cria o botão de WhatsApp já pronto para envio em 1 clique.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>O sistema realmente faz o trabalho de avisar o cliente pela oficina?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>Sim! A oficina não precisa mais conferir cadernos nem pranchetas manuais. O sistema monitora a frota de todos os clientes cadastrados e monta a mensagem personalizada com nome, placa e o serviço necessário com base no desgaste e odômetro. O mecânico só clica e envia no WhatsApp.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como isso gera aumento no faturamento da oficina?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>A oficina para de depender de carros que quebram na rua e passa a ter fluxo contínuo de revisões programadas de alto ticket (kit correia dentada, óleo de câmbio automático, pastilhas e bomba d'água). Sabendo o que cada carro precisa antes dele chegar, a oficina elimina tempo ocioso e aumenta o faturamento médio em mais de 35%.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como funciona o controle de gastos dos últimos 6 meses para donos de carro?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>Cada manutenção registrada gera um extrato contábil transparente. O proprietário vê exatamente quanto investiu em peças originais, mão de obra e fluidos mês a mês nos últimos 6 meses, com notas fiscais e fotos comprovando cada intervenção com certificação Nível 4.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>O valor de R$ 59,90 tem alguma mensalidade?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>Não. Para o dono do veículo é taxa única de emissão do Passaporte Digital vitalício. O carro fica certificado para sempre e o histórico valoriza o veículo na hora da revenda.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- FOOTER CORPORATIVO                         -->
                <!-- ========================================== -->
                <footer class="totvs-footer">
                    <div class="totvs-container totvs-footer-grid">
                        <div class="totvs-footer-col">
                            <div class="totvs-brand" style="margin-bottom:12px;">
                                <div class="totvs-brand-logo">
                                    <svg viewBox="0 0 120 120" width="22" height="22" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="7" />
                                        <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="8" />
                                        <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="8" />
                                    </svg>
                                </div>
                                <div class="totvs-brand-title">
                                    <span>DNA <strong style="color:#FFD21C;">AUTO</strong></span>
                                </div>
                            </div>
                            <p style="font-size:13px; color:#94a3b8; line-height:1.6; max-width:320px;">
                                Sistema Corporativo de Rastreabilidade e Certificação de Histórico Automotivo. Tecnologia que valoriza o patrimônio e impulsiona oficinas mecânicas no Brasil.
                            </p>
                        </div>

                        <div class="totvs-footer-col">
                            <h4>Para Você (Motorista)</h4>
                            <ul>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('OWNER')">Gastos dos Últimos 6 Meses</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('OWNER')">Relatório Completo de Peças</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('OWNER')">Vantagens do Passaporte</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.goToRegister()">Ativar DNA (R$ 59,90)</a></li>
                            </ul>
                        </div>

                        <div class="totvs-footer-col">
                            <h4>Para Oficinas (B2B)</h4>
                            <ul>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('WORKSHOP')">Alerta de Correia Dentada</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('WORKSHOP')">Monitoramento de Clientes</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.switchAudience('WORKSHOP')">Radar Preditivo em Tempo Real</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.goToRegisterWorkshop()">Credenciar Minha Oficina</a></li>
                            </ul>
                        </div>

                        <div class="totvs-footer-col">
                            <h4>Acesso ao Sistema</h4>
                            <ul>
                                <li><a href="javascript:void(0)" onclick="App.switchView('login')">Acessar Garagem do Dono</a></li>
                                <li><a href="javascript:void(0)" onclick="App.switchView('login')">Acesso Oficinas Credenciadas</a></li>
                                <li><a href="javascript:void(0)" onclick="App.switchView('login-admin')">Portal Admin Matriz</a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="totvs-footer-bottom">
                        <div class="totvs-container" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                            <span>© 2026 DNA AUTO — Plataforma de Gestão e Certificação Veicular. Todos os direitos reservados.</span>
                            <span style="color:#64748b; font-size:11px;">Padrão Corporativo • Segurança Bancária de Dados • ISO 27001 Compliance</span>
                        </div>
                    </div>
                </footer>
            </div>
        `;

        this.injectCSS();
    },

    // ── Renderiza Links de Navegação conforme público ──
    renderNavLinks() {
        if (this.activeAudienceTab === 'WORKSHOP') {
            return `
                <a href="#monitoramento-oficina" class="totvs-nav-link highlight-b2b">
                    <span class="totvs-pulse-mini"></span> Monitoramento & Correia
                </a>
                <a href="#radar-oficina" class="totvs-nav-link">Radar Preditivo</a>
                <a href="#beneficios-oficina" class="totvs-nav-link">Vantagens da Oficina</a>
                <a href="#credenciar-oficina" class="totvs-nav-link">Credenciamento</a>
                <a href="#faq-section" class="totvs-nav-link">Dúvidas</a>
            `;
        }
        return `
            <a href="#gastos-6-meses" class="totvs-nav-link">Gastos & Extrato</a>
            <a href="#relatorio-completo" class="totvs-nav-link">Relatório do Carro</a>
            <a href="#comparativo-dna" class="totvs-nav-link">Vantagens do DNA</a>
            <a href="#faq-section" class="totvs-nav-link">Dúvidas</a>
        `;
    },

    // ── Atualiza Botão Principal do Topo ──
    updateNavCtaButton() {
        const btn = document.getElementById('totvs-nav-main-cta');
        if (!btn) return;
        if (this.activeAudienceTab === 'WORKSHOP') {
            btn.innerHTML = `<span class="desktop-only">Credenciar Oficina (Grátis)</span><span class="mobile-only">Credenciar Grátis</span>`;
            btn.onclick = () => LandingView.goToRegisterWorkshop();
        } else {
            btn.innerHTML = `<span class="desktop-only">Garantir DNA (R$ 59,90)</span><span class="mobile-only">Garantir DNA</span>`;
            btn.onclick = () => LandingView.goToRegister();
        }
    },

    // ── Renderiza Dinamicamente o Hero Conforme Aba ──
    renderHeroDynamicContent() {
        if (this.activeAudienceTab === 'WORKSHOP') {
            return `
                <div class="totvs-hero-audience-card workshop animate-fade-in">
                    <div class="totvs-badge-pill b2b">
                        <span class="totvs-pulse-green"></span>
                        <span>MÓDULO B2B • MONITORAMENTO AUTOMÁTICO DE CLIENTES & RADAR DE CORREIA</span>
                    </div>

                    <h1 class="totvs-hero-title">
                        Aumente o Faturamento da Sua Oficina: Saiba Antes Quando <span class="totvs-gold-highlight">Trocar a Correia Dentada</span> e Peças pelo <span style="color:#38bdf8;">Desgaste e KM</span>
                    </h1>

                    <p class="totvs-hero-subtitle">
                        Chega de esperar o cliente quebrar na rua para ter movimento na oficina. O DNA AUTO monitora a quilometragem e o desgaste dos veículos dos seus clientes e avisa automaticamente quando está na hora de trocar correia dentada, filtros e fluidos. <strong>O próprio sistema gera o alerta e a mensagem pronta para o WhatsApp</strong> — você só clica para enviar e lota sua agenda de serviços preventivos de alto ticket.
                    </p>

                    <div class="totvs-hero-cta-row">
                        <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegisterWorkshop()" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow:0 6px 25px rgba(16,185,129,0.35);">
                            <span>🔧 Credenciar Minha Oficina Gratuitamente</span>
                            <span class="landing-cta-arrow">→</span>
                        </button>
                        <a href="#radar-oficina" class="totvs-btn-secondary-hero">
                            <span>📊 Ver Demonstração do Radar Preditivo</span>
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="totvs-hero-audience-card owner animate-fade-in">
                <div class="totvs-badge-pill">
                    <span class="totvs-pulse-dot"></span>
                    <span>PASSAPORTE DIGITAL DO CARRO • CONTROLE DE GASTOS & HISTÓRICO VITALÍCIO</span>
                </div>

                <h1 class="totvs-hero-title">
                    Saiba Exatamente Quanto Gastou no Seu Carro nos <span class="totvs-gold-highlight">Últimos 6 Meses</span> e Tenha o Relatório Completo por <span class="totvs-gold-highlight">R$ 59,90</span>
                </h1>

                <p class="totvs-hero-subtitle">
                    Cada troca de óleo, correia dentada, discos de freio, peças originais com fotos Nível 4 e notas fiscais gravadas para sempre. Total controle financeiro e <strong>valorização de até 15% na revenda</strong>.
                </p>

                <div class="totvs-hero-cta-row">
                    <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegister()">
                        <span>⭐ Ativar DNA do Meu Carro (R$ 59,90)</span>
                        <span class="landing-cta-arrow">→</span>
                    </button>
                    <button class="totvs-btn-secondary-hero" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                        <span>🔎 Ver Dossiê Completo Demo (Civic)</span>
                    </button>
                </div>
            </div>
        `;
    },

    // ── Renderiza Faixa Dinâmica de KPIs ──
    renderKpiBar() {
        if (this.activeAudienceTab === 'WORKSHOP') {
            return `
                <div class="totvs-kpi-item">
                    <span class="totvs-kpi-val" style="color:#10b981;">+35%</span>
                    <span class="totvs-kpi-lbl">Aumento Médio no Faturamento</span>
                </div>
                <div class="totvs-kpi-sep"></div>
                <div class="totvs-kpi-item">
                    <span class="totvs-kpi-val">100%</span>
                    <span class="totvs-kpi-lbl">Monitoramento Automático da Carteira</span>
                </div>
                <div class="totvs-kpi-sep"></div>
                <div class="totvs-kpi-item">
                    <span class="totvs-kpi-val">0 km</span>
                    <span class="totvs-kpi-lbl">Previsão Exata por Desgaste & Odômetro</span>
                </div>
                <div class="totvs-kpi-sep"></div>
                <div class="totvs-kpi-item">
                    <span class="totvs-kpi-val" style="color:#FFD21C;">1 Toque</span>
                    <span class="totvs-kpi-lbl">Disparo de Lembrete no WhatsApp</span>
                </div>
            `;
        }

        return `
            <div class="totvs-kpi-item">
                <span class="totvs-kpi-val">100%</span>
                <span class="totvs-kpi-lbl">Transparência Financeira dos Últimos 6 Meses</span>
            </div>
            <div class="totvs-kpi-sep"></div>
            <div class="totvs-kpi-item">
                <span class="totvs-kpi-val">R$ 59,90</span>
                <span class="totvs-kpi-lbl">Pagamento Único Vitalício por Veículo</span>
            </div>
            <div class="totvs-kpi-sep"></div>
            <div class="totvs-kpi-item">
                <span class="totvs-kpi-val">+15%</span>
                <span class="totvs-kpi-lbl">Valorização Comprovada na Revenda</span>
            </div>
            <div class="totvs-kpi-sep"></div>
            <div class="totvs-kpi-item">
                <span class="totvs-kpi-val">Nível 4</span>
                <span class="totvs-kpi-lbl">Comprovação Máxima com Fotos das Peças</span>
            </div>
        `;
    },

    // ── Renderiza Seções Principais Conforme Público ──
    renderAudienceSections() {
        if (this.activeAudienceTab === 'WORKSHOP') {
            return this.renderWorkshopSections();
        }
        return this.renderOwnerSections();
    },

    // ── Seções Específicas do Dono do Carro ──
    renderOwnerSections() {
        return `
            <!-- SEÇÃO 1: CONTROLE DE GASTOS DOS ÚLTIMOS 6 MESES -->
            <section class="totvs-section" id="gastos-6-meses">
                <div class="totvs-container">
                    <div class="totvs-section-header">
                        <span class="totvs-badge-tag cyan">GESTÃO FINANCEIRA DO VEÍCULO</span>
                        <h2>Você Sabe Exatamente Quanto Gastou no Carro nos Últimos 6 Meses?</h2>
                        <p>
                            O DNA AUTO revoluciona a relação do motorista com seu patrimônio. Tenha um raio-x financeiro semestral detalhado, centavo por centavo, separando peças trocadas, mão de obra, filtros e economias geradas.
                        </p>
                    </div>

                    <!-- Card de Demonstração Financeira Semestral Estilo TOTVS -->
                    <div class="totvs-financial-dashboard-card">
                        <div class="totvs-fin-header">
                            <div class="totvs-fin-car-badge">
                                <div class="totvs-car-avatar">🚗</div>
                                <div>
                                    <strong>Honda Civic Touring 1.5 Turbo 2021</strong>
                                    <small>Placa: BRA2E19 • Odômetro: 125.200 km • DNA Ativo</small>
                                </div>
                            </div>
                            <div class="totvs-fin-period">
                                <span class="totvs-period-pill">Últimos 6 Meses (Outubro a Março)</span>
                            </div>
                        </div>

                        <!-- Resumo das Métricas Financeiras -->
                        <div class="totvs-fin-metrics-grid">
                            <div class="totvs-fin-metric-card primary">
                                <span class="metric-label">Investimento Total nos Últimos 6 Meses</span>
                                <span class="metric-value">R$ 1.840,00</span>
                                <span class="metric-footnote">Em 3 intervenções preventivas auditadas</span>
                            </div>
                            <div class="totvs-fin-metric-card">
                                <span class="metric-label">Peças Genuínas & Originais</span>
                                <span class="metric-value" style="color:#38bdf8;">R$ 1.120,00</span>
                                <span class="metric-footnote">60,8% do investimento (com fotos e NFs)</span>
                            </div>
                            <div class="totvs-fin-metric-card">
                                <span class="metric-label">Mão de Obra Especializada</span>
                                <span class="metric-value" style="color:#a855f7;">R$ 540,00</span>
                                <span class="metric-footnote">Oficina Credenciada Veloce Auto Center</span>
                            </div>
                            <div class="totvs-fin-metric-card success">
                                <span class="metric-label">Economia Preventiva Estimada</span>
                                <span class="metric-value" style="color:#10b981;">R$ 4.200,00</span>
                                <span class="metric-footnote">Ao evitar a quebra da correia e contaminação</span>
                            </div>
                        </div>

                        <!-- Gráfico Semestral Interativo de Gastos -->
                        <div class="totvs-fin-chart-section">
                            <div class="totvs-chart-title">
                                <span>Evolução de Gastos Mês a Mês</span>
                                <small>Clique nas barras para inspecionar os serviços de cada mês</small>
                            </div>
                            
                            <div class="totvs-chart-bars">
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 0 ? 'selected' : ''}" onclick="LandingView.selectMonth(0)">
                                    <div class="totvs-bar-val">R$ 420</div>
                                    <div class="totvs-bar-fill" style="height: 35%;"></div>
                                    <div class="totvs-bar-lbl">Outubro</div>
                                </div>
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 1 ? 'selected' : ''}" onclick="LandingView.selectMonth(1)">
                                    <div class="totvs-bar-val">R$ 0</div>
                                    <div class="totvs-bar-fill zero" style="height: 4%;"></div>
                                    <div class="totvs-bar-lbl">Novembro</div>
                                </div>
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 2 ? 'selected' : ''}" onclick="LandingView.selectMonth(2)">
                                    <div class="totvs-bar-val" style="color:#FFD21C;">R$ 1.150</div>
                                    <div class="totvs-bar-fill peak" style="height: 90%;"></div>
                                    <div class="totvs-bar-lbl font-bold">Dezembro</div>
                                </div>
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 3 ? 'selected' : ''}" onclick="LandingView.selectMonth(3)">
                                    <div class="totvs-bar-val">R$ 0</div>
                                    <div class="totvs-bar-fill zero" style="height: 4%;"></div>
                                    <div class="totvs-bar-lbl">Janeiro</div>
                                </div>
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 4 ? 'selected' : ''}" onclick="LandingView.selectMonth(4)">
                                    <div class="totvs-bar-val">R$ 270</div>
                                    <div class="totvs-bar-fill" style="height: 25%;"></div>
                                    <div class="totvs-bar-lbl">Fevereiro</div>
                                </div>
                                <div class="totvs-bar-col ${this.selectedMonthIndex === 5 ? 'selected' : ''}" onclick="LandingView.selectMonth(5)">
                                    <div class="totvs-bar-val">R$ 0</div>
                                    <div class="totvs-bar-fill zero" style="height: 4%;"></div>
                                    <div class="totvs-bar-lbl">Março</div>
                                </div>
                            </div>
                        </div>

                        <!-- Detalhamento do Mês Selecionado -->
                        <div class="totvs-fin-month-detail" id="totvs-month-detail-box">
                            ${this.renderMonthDetail(this.selectedMonthIndex)}
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 2: RELATÓRIO COMPLETO DO CARRO -->
            <section class="totvs-section" id="relatorio-completo" style="background:#070c14; border-top:1px solid rgba(255,210,28,0.15); border-bottom:1px solid rgba(255,210,28,0.15);">
                <div class="totvs-container">
                    <div class="totvs-section-header">
                        <span class="totvs-badge-tag gold">AUDITORIA INDELÉVEL</span>
                        <h2>Relatório Completo de Tudo o que Aconteceu no Carro</h2>
                        <p>
                            Chega de notas fiscais perdidas no porta-luvas ou registros esquecidos no WhatsApp. O DNA AUTO compila toda a vida técnica do veículo em um laudo digital vitalício com comprovação Nível 4.
                        </p>
                    </div>

                    <div class="totvs-report-pillars">
                        <div class="totvs-pillar-card">
                            <div class="totvs-pillar-icon">📸</div>
                            <h3>Fotos Reais Antes & Depois</h3>
                            <p>A oficina credenciada fotografa a peça gasta retirada do veículo e a nova peça que foi instalada, com carimbo de data e odômetro.</p>
                            <span class="totvs-pillar-tag">Prova Nível 4</span>
                        </div>

                        <div class="totvs-pillar-card">
                            <div class="totvs-pillar-icon">📄</div>
                            <h3>Notas Fiscais & Lotes Anexados</h3>
                            <p>Extratos de peças originais com número de lote de óleo, marca das pastilhas e garantia do fabricante gravados sem risco de perda.</p>
                            <span class="totvs-pillar-tag">Comprovante Fiscal</span>
                        </div>

                        <div class="totvs-pillar-card">
                            <div class="totvs-pillar-icon">🔒</div>
                            <h3>Hash Criptográfico Imutável</h3>
                            <p>Cada intervenção gera um bloco criptográfico único. Ninguém pode forjar histórico, apagar sinistro ou retroceder quilometragem.</p>
                            <span class="totvs-pillar-tag">Anti-Fraude</span>
                        </div>

                        <div class="totvs-pillar-card">
                            <div class="totvs-pillar-icon">📈</div>
                            <h3>Valorização de Até 15% na Venda</h3>
                            <p>Compradores pagam mais caro e à vista por um carro com histórico 100% comprovado. Venda seu veículo em dias, não meses.</p>
                            <span class="totvs-pillar-tag">Revenda Ágil</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 3: COMPARATIVO CARRO COM DNA VS SEM DNA -->
            <section class="totvs-section" id="comparativo-dna" style="background:linear-gradient(180deg, #070b13 0%, #0c1424 100%);">
                <div class="totvs-container">
                    <div class="totvs-compare-box">
                        <div class="totvs-compare-col red">
                            <div class="totvs-compare-badge red">❌ Carro Tradicional Sem DNA</div>
                            <ul class="totvs-compare-list">
                                <li>❌ O dono não faz ideia de quanto gastou nos últimos 6 meses</li>
                                <li>❌ Nenhuma comprovação de troca de correia dentada ou óleo de câmbio</li>
                                <li>❌ Comprador desconfia de adulteração no odômetro</li>
                                <li>❌ Oficina perde o cliente para outro mecânico sem saber</li>
                                <li>❌ Carro desvaloriza de 10% a 20% abaixo da tabela FIPE na venda</li>
                            </ul>
                        </div>

                        <div class="totvs-compare-divider">
                            <span>VS</span>
                        </div>

                        <div class="totvs-compare-col gold">
                            <div class="totvs-compare-badge gold">✅ Carro Certificado com DNA AUTO</div>
                            <ul class="totvs-compare-list">
                                <li>✅ <strong>Extrato completo de gastos dos últimos 6 meses sempre visível</strong></li>
                                <li>✅ <strong>Relatório oficial de todas as peças e serviços com fotos Nível 4</strong></li>
                                <li>✅ <strong>Quilometragem auditada e imutável gravada no passaporte</strong></li>
                                <li>✅ <strong>Oficina avisa o momento cirúrgico de trocar correias e óleo de câmbio</strong></li>
                                <li>✅ <strong>Venda até 3x mais rápida com valorização de até 15% acima da FIPE</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 5: OFERTA CANÔNICA DE R$ 59,90 -->
            <section class="totvs-section" style="text-align:center; padding:70px 20px;">
                <div class="totvs-container" style="max-width:740px;">
                    <span class="totvs-badge-tag gold" style="font-size:12px; padding:6px 16px;">
                        PAGAMENTO ÚNICO • ACESSO VITALÍCIO
                    </span>
                    <h2 style="font-size:36px; color:#ffffff; font-weight:800; margin:18px 0 12px; letter-spacing:-0.5px;">
                        Garanta Agora o Passaporte Digital do Seu Carro
                    </h2>
                    <div style="font-size:50px; color:#FFD21C; font-weight:900; margin:10px 0; text-shadow:0 0 30px rgba(255,210,28,0.4);">
                        R$ 59,90
                    </div>
                    <p style="font-size:15.5px; color:#94a3b8; line-height:1.6; margin-bottom:28px;">
                        Sem mensalidades recorrentes para o motorista. O DNA pertence ao veículo e acompanha o histórico da placa para sempre.
                    </p>

                    <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
                        <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegister()">
                            <span>⭐ Ativar DNA do Meu Veículo (R$ 59,90)</span>
                            <span class="landing-cta-arrow">→</span>
                        </button>
                        <button class="totvs-btn-outline-gold" onclick="LandingView.switchAudience('WORKSHOP')">
                            <span>🔧 Sou Mecânico / Ver Modo Oficina</span>
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    // ── Seções Específicas do Dono de Oficina Mecânica ──
    renderWorkshopSections() {
        return `
            <!-- SEÇÃO 1: MONITORAMENTO AUTOMÁTICO DE CLIENTES & CORREIA DENTADA -->
            <section class="totvs-section" id="monitoramento-oficina" style="background:#070c14; border-top:1px solid rgba(16,185,129,0.2);">
                <div class="totvs-container">
                    <div class="totvs-section-header">
                        <span class="totvs-badge-tag b2b">MONITORAMENTO INTELIGENTE DA CARTEIRA</span>
                        <h2>O Sistema Monitora Seus Clientes e Trabalha no Piloto Automático Pela Sua Oficina</h2>
                        <p>
                            Você não precisa mais conferir pranchetas, cadernos de revisão ou planilhas de Excel. O DNA AUTO analisa os km percorridos e o tempo de uso de cada componente de forma 100% autônoma, avisando antes da correia quebrar.
                        </p>
                    </div>

                    <div class="totvs-workshop-features-grid">
                        <!-- 1. CORREIA DENTADA -->
                        <div class="totvs-workshop-card featured" style="border-color: rgba(239, 68, 68, 0.4);">
                            <div class="totvs-ws-badge-top" style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff;">PROTEÇÃO CONTRA QUEBRA DE MOTOR</div>
                            <div class="totvs-ws-icon red">⚙️</div>
                            <h3>Previsão Automática da Troca de Correia Dentada</h3>
                            <p class="totvs-ws-desc">
                                O sistema cruza o histórico do carro cadastrado com a rodagem média diária estimada. Ao atingir a faixa de <strong>40.000 a 50.000 km ou prazo de anos</strong>, o sistema acende o sinal vermelho no painel da sua oficina: <em>"Faltam 1.200 km para o limite seguro"</em>. Você age antes do cliente quebrar na rua e sofrer um prejuízo de R$ 8.000 a R$ 20.000 de motor batido.
                            </p>
                            <div class="totvs-ws-stat">
                                <span>Ticket Médio Deste Serviço:</span>
                                <strong style="color:#ef4444;">R$ 850 a R$ 1.800</strong>
                            </div>
                            <div class="totvs-ws-benefit">
                                ✅ O cliente agradece pelo aviso técnico e fecha a troca com você sem questionar.
                            </div>
                        </div>

                        <!-- 2. O PRÓPRIO SISTEMA FAZ POR VOCÊ -->
                        <div class="totvs-workshop-card featured" style="border-color: rgba(16, 185, 129, 0.4);">
                            <div class="totvs-ws-badge-top" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff;">AUTOMAÇÃO EM 1 CLIQUE</div>
                            <div class="totvs-ws-icon green">🤖</div>
                            <h3>O Próprio Sistema Faz Tudo Por Você (Disparo WhatsApp)</h3>
                            <p class="totvs-ws-desc">
                                Chega de trabalho braçal. O DNA AUTO identifica quais carros da sua carteira estão perto da quilometragem de revisão e <strong>já monta o lembrete personalizado</strong> com o nome do cliente, a placa e o serviço necessário. Com apenas 1 toque no botão, a conversa abre no WhatsApp pronta para envio.
                            </p>
                            <div class="totvs-ws-stat">
                                <span>Tempo Gasto pela Oficina:</span>
                                <strong style="color:#10b981;">Apenas 5 segundos por cliente</strong>
                            </div>
                            <div class="totvs-ws-benefit">
                                ✅ Sem planilhas manuais. Notificações diretas com link oficial do passaporte.
                            </div>
                        </div>

                        <!-- 3. AUMENTO DE FATURAMENTO POR DESGASTE & KM -->
                        <div class="totvs-workshop-card featured" style="border-color: rgba(255, 210, 28, 0.4);">
                            <div class="totvs-ws-badge-top" style="background:linear-gradient(135deg, #FFD21C, #f59e0b); color:#05080D;">RECEITA RECORRENTE PREVISÍVEL</div>
                            <div class="totvs-ws-icon gold">📈</div>
                            <h3>Aumento Imediato de Faturamento por Desgaste & KM</h3>
                            <p class="totvs-ws-desc">
                                Acabe com o tempo ocioso nos elevadores. Sabendo com antecedência o que precisa ser trocado (kit correia dentada, bomba d'água, óleo de câmbio automático CVT, fluidos e pastilhas), você programa a semana, compra peças no melhor preço e <strong>aumenta o faturamento em mais de +35%</strong> com serviços preventivos de alto valor agregado.
                            </p>
                            <div class="totvs-ws-stat">
                                <span>Impacto no Faturamento:</span>
                                <strong style="color:#FFD21C;">+35% de Lucro Recorrente</strong>
                            </div>
                            <div class="totvs-ws-benefit">
                                ✅ Seus mecânicos 100% ocupados com serviços preventivos programados.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 2: RADAR PREDITIVO AO VIVO DA OFICINA -->
            <section class="totvs-section" id="radar-oficina">
                <div class="totvs-container">
                    <div class="totvs-section-header">
                        <span class="totvs-badge-tag cyan">PAINEL AO VIVO DA OFICINA</span>
                        <h2>Veja o Radar Preditivo em Ação: Seus Clientes Monitorados em Tempo Real</h2>
                        <p>
                            Este é o painel que sua oficina terá na palma da mão. O sistema lista os clientes cadastrados cujos veículos estão próximos do limite de quilometragem da correia e de outros componentes críticos.
                        </p>
                    </div>

                    <div class="totvs-radar-demo-card">
                        <div class="totvs-radar-top">
                            <div>
                                <span class="totvs-radar-title">RADAR PREDITIVO DE REVISÕES — OFICINA VELOCE AUTO CENTER</span>
                                <small style="display:block; color:#94a3b8; font-size:12px;">Alertas automáticos calculados com base no odômetro e desgaste estimado</small>
                            </div>
                            <div class="totvs-radar-badge">
                                <span class="totvs-pulse-green"></span> 3 Revisões de Alto Ticket Próximas
                            </div>
                        </div>

                        <div class="totvs-radar-table-responsive">
                            <table class="totvs-radar-table">
                                <thead>
                                    <tr>
                                        <th>Cliente & Veículo</th>
                                        <th>Manutenção Preditiva</th>
                                        <th>Desgaste / KM Restante</th>
                                        <th>Ticket Estimado</th>
                                        <th>Ação Automática</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong>Carlos Silva</strong>
                                            <small>Civic Touring 1.5 • BRA2E19</small>
                                        </td>
                                        <td>
                                            <span class="radar-tag red">Troca da Correia Dentada & Tensores</span>
                                        </td>
                                        <td>
                                            <strong style="color:#ef4444;">Faltam 1.200 km (aprox. 18 dias)</strong>
                                        </td>
                                        <td>R$ 1.450,00</td>
                                        <td>
                                            <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Carlos Silva', 'BRA2E19', 'Correia Dentada e Tensores')">
                                                <span>📲 Disparar WhatsApp</span>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Mariana Souza</strong>
                                            <small>Corolla Altis Hybrid • ABC1D23</small>
                                        </td>
                                        <td>
                                            <span class="radar-tag gold">Troca de Fluido Câmbio Automático (CVT)</span>
                                        </td>
                                        <td>
                                            <strong style="color:#FFD21C;">Faltam 2.800 km (aprox. 35 dias)</strong>
                                        </td>
                                        <td>R$ 2.100,00</td>
                                        <td>
                                            <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Mariana Souza', 'ABC1D23', 'Óleo de Câmbio Automático CVT')">
                                                <span>📲 Disparar WhatsApp</span>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Roberto Mendes</strong>
                                            <small>Compass Longitude • JHG4B88</small>
                                        </td>
                                        <td>
                                            <span class="radar-tag cyan">Revisão de Velas de Iridium & Bobinas</span>
                                        </td>
                                        <td>
                                            <strong style="color:#38bdf8;">Faltam 850 km (Limite Crítico)</strong>
                                        </td>
                                        <td>R$ 980,00</td>
                                        <td>
                                            <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Roberto Mendes', 'JHG4B88', 'Velas de Iridium e Bobinas')">
                                                <span>📲 Disparar WhatsApp</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="totvs-radar-cta-row">
                            <div class="totvs-radar-cta-text">
                                <strong>Clique no botão de WhatsApp acima para testar a automação.</strong>
                                <span>O sistema abre a mensagem formatada no seu WhatsApp com todos os dados técnicos prontos para o cliente confirmar o agendamento!</span>
                            </div>
                            <button class="totvs-btn-gold" style="padding:14px 28px; font-size:15px;" onclick="LandingView.goToRegisterWorkshop()">
                                🔧 Credenciar Minha Oficina Gratuitamente
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 3: DIFERENCIAIS EXCLUSIVOS PARA OFICINAS -->
            <section class="totvs-section" id="beneficios-oficina" style="background:#090e18;">
                <div class="totvs-container">
                    <div class="totvs-section-header">
                        <span class="totvs-badge-tag gold">DIFERENCIAIS EXCLUSIVOS B2B</span>
                        <h2>Por Que as Melhores Oficinas Estão Migrando para o DNA AUTO?</h2>
                        <p>Uma plataforma feita para valorizar o trabalho técnico e honesto da sua equipe, eliminando a desconfiança do cliente e gerando lucro sustentável.</p>
                    </div>

                    <div class="totvs-workshop-features-grid">
                        <div class="totvs-workshop-card">
                            <div class="totvs-ws-icon gold">📸</div>
                            <h3>Comprovação com Fotos Nível 4</h3>
                            <p class="totvs-ws-desc">
                                Fotografe a peça gasta que foi removida e a nova peça que você instalou. O cliente recebe as fotos no Dossiê Digital e nunca mais duvida da necessidade do serviço.
                            </p>
                            <div class="totvs-ws-benefit">
                                ✅ Fim da desconfiança de orçamento. 100% de transparência técnica.
                            </div>
                        </div>

                        <div class="totvs-workshop-card">
                            <div class="totvs-ws-icon cyan">🔒</div>
                            <h3>Fidelização Absoluta da Carteira</h3>
                            <p class="totvs-ws-desc">
                                O cliente sabe que o Passaporte Digital do carro dele está vinculado à sua oficina de confiança. Ele não troca sua oficina por qualquer concorrente de esquina.
                            </p>
                            <div class="totvs-ws-benefit">
                                ✅ Taxa de retenção de clientes acima de 92% ao longo do ano.
                            </div>
                        </div>

                        <div class="totvs-workshop-card">
                            <div class="totvs-ws-icon green">💰</div>
                            <h3>Sem Mensalidade de Adesão</h3>
                            <p class="totvs-ws-desc">
                                Cadastre sua oficina hoje sem custo fixo ou taxa inicial. Você só tem a ganhar trazendo previsibilidade, faturamento e clientes recorrentes para o seu negócio.
                            </p>
                            <div class="totvs-ws-benefit">
                                ✅ Comece a usar agora mesmo e lucre já na primeira semana.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SEÇÃO 4: CREDENCIAMENTO RÁPIDO DA OFICINA -->
            <section class="totvs-section" id="credenciar-oficina" style="text-align:center; padding:70px 20px; background:linear-gradient(180deg, #070c14 0%, #0c1828 100%); border-top:1px solid rgba(16,185,129,0.2);">
                <div class="totvs-container" style="max-width:760px;">
                    <span class="totvs-badge-tag b2b" style="font-size:12px; padding:6px 16px;">CREDENCIAMENTO GRATUITO • SEM MENSALIDADE</span>
                    <h2 style="font-size:36px; color:#ffffff; font-weight:800; margin:18px 0 12px; letter-spacing:-0.5px;">
                        Comece a Monitorar Seus Clientes e Fature Mais com Revisões Preventivas
                    </h2>
                    <p style="font-size:16px; color:#94a3b8; line-height:1.6; margin-bottom:30px;">
                        Junte-se à rede de oficinas e centros automotivos credenciados DNA AUTO. Cadastre sua oficina em menos de 2 minutos e ative o Radar Preditivo da sua carteira.
                    </p>

                    <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
                        <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegisterWorkshop()" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow:0 6px 25px rgba(16,185,129,0.4);">
                            <span>🔧 Credenciar Minha Oficina Gratuitamente</span>
                            <span class="landing-cta-arrow">→</span>
                        </button>
                        <button class="totvs-btn-secondary-hero" onclick="LandingView.switchAudience('OWNER')">
                            <span>🚗 Ver Modo Dono de Carro</span>
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    // ── Renderiza o detalhe do mês selecionado no dashboard financeiro ──
    renderMonthDetail(index) {
        const months = [
            {
                name: 'Outubro / 2025',
                total: 'R$ 420,00',
                items: [
                    { desc: 'Troca de Óleo 0W-20 Sintético (4.2L) + Filtro Mann', cat: 'Fluidos & Filtros', val: 'R$ 310,00', status: 'Concluído' },
                    { desc: 'Filtro de Ar Condicionado + Higienização de Ozônio', cat: 'Peças & Higiene', val: 'R$ 110,00', status: 'Concluído' }
                ],
                notes: 'Serviço realizado aos 118.900 km na Veloce Auto Center. NF-e #38190 anexada com foto do lote do óleo.'
            },
            {
                name: 'Novembro / 2025',
                total: 'R$ 0,00',
                items: [],
                notes: 'Veículo rodou 1.250 km no período. Nenhuma manutenção necessária; todos os níveis e sensores operando em conformidade.'
            },
            {
                name: 'Dezembro / 2025',
                total: 'R$ 1.150,00',
                items: [
                    { desc: 'Jogo de Pastilhas Dianteiras de Cerâmica Brembo', cat: 'Peças Originais', val: 'R$ 680,00', status: 'Nível 4 c/ Foto' },
                    { desc: 'Sangria do Sistema e Troca de Fluido de Freio DOT 5.1', cat: 'Fluidos & Segurança', val: 'R$ 190,00', status: 'Concluído' },
                    { desc: 'Mão de Obra de Freios + Laudo Computadorizado de Frenagem', cat: 'Mão de Obra', val: 'R$ 280,00', status: 'Certificado' }
                ],
                notes: 'Serviço preventivo aos 122.400 km. Economia evitada de R$ 2.400,00 por substituição antes do dano nos discos ventilados.'
            },
            {
                name: 'Janeiro / 2026',
                total: 'R$ 0,00',
                items: [],
                notes: 'Veículo em viagem de férias (2.100 km rodados). Check-up de viagem gratuito realizado na oficina parceira.'
            },
            {
                name: 'Fevereiro / 2026',
                total: 'R$ 270,00',
                items: [
                    { desc: 'Alinhamento 3D a Laser + Balanceamento de Rodas', cat: 'Geometria & Pneus', val: 'R$ 150,00', status: 'Certificado' },
                    { desc: 'Substituição das Palhetas de Silicone Dianteiras Bosch', cat: 'Peças', val: 'R$ 120,00', status: 'Concluído' }
                ],
                notes: 'Revisão pós-viagem aos 124.800 km.'
            },
            {
                name: 'Março / 2026',
                total: 'R$ 0,00',
                items: [],
                notes: 'Monitoramento ativo pelo Radar da Oficina: Faltam 1.200 km para o prazo limite de revisão de Correia Dentada.'
            }
        ];

        const m = months[index] || months[2];

        let itemsHtml = '';
        if (m.items.length === 0) {
            itemsHtml = `
                <div style="padding:16px; background:rgba(255,255,255,0.03); border-radius:8px; color:#94a3b8; font-size:13px;">
                    🌿 Nenhuma despesa ou substituição necessária neste mês. Veículo rodou de forma preventiva e sem quebras.
                </div>
            `;
        } else {
            itemsHtml = m.items.map(item => `
                <div class="totvs-month-item-row">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="totvs-item-bullet"></span>
                        <div>
                            <strong style="color:#ffffff; font-size:13.5px;">${item.desc}</strong>
                            <small style="display:block; color:#64748b; font-size:11px;">${item.cat} • <span style="color:#10b981;">${item.status}</span></small>
                        </div>
                    </div>
                    <div style="font-weight:700; color:#FFD21C; font-size:14px;">
                        ${item.val}
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="totvs-month-detail-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
                    <div>
                        <span style="font-size:11px; color:#38bdf8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Detalhamento Auditado</span>
                        <h4 style="color:#ffffff; margin:2px 0 0; font-size:16px;">${m.name}</h4>
                    </div>
                    <div style="text-align:right;">
                        <small style="color:#94a3b8; font-size:10.5px;">Subtotal do Mês</small>
                        <div style="color:#FFD21C; font-size:18px; font-weight:800;">${m.total}</div>
                    </div>
                </div>

                <div class="totvs-month-items-list">
                    ${itemsHtml}
                </div>

                <div style="margin-top:12px; font-size:12px; color:#94a3b8; border-top:1px dashed rgba(255,255,255,0.08); padding-top:8px;">
                    <strong>Nota da Auditoria:</strong> ${m.notes}
                </div>
            </div>
        `;
    },

    // ── Alternância de Perfil Dono / Oficina ──
    switchAudience(role) {
        this.activeAudienceTab = role;

        // Atualiza botões do switcher
        document.querySelectorAll('.totvs-audience-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText.includes(role === 'OWNER' ? 'Dono de Carro' : 'Dono de Oficina'));
        });

        // Re-renderiza o conteúdo dinâmico do Hero
        const heroBlock = document.getElementById('totvs-hero-dynamic-block');
        if (heroBlock) {
            heroBlock.innerHTML = this.renderHeroDynamicContent();
        }

        // Re-renderiza a faixa de KPIs
        const kpiBlock = document.getElementById('totvs-kpi-bar-block');
        if (kpiBlock) {
            kpiBlock.innerHTML = this.renderKpiBar();
        }

        // Re-renderiza os links de navegação do topo
        const navLinks = document.getElementById('totvs-nav-links');
        if (navLinks) {
            navLinks.innerHTML = this.renderNavLinks();
        }

        // Atualiza o botão principal (CTA) do topo
        this.updateNavCtaButton();

        // Re-renderiza as seções de conteúdo (o bloco principal)
        const sectionsBlock = document.getElementById('totvs-audience-sections-block');
        if (sectionsBlock) {
            sectionsBlock.innerHTML = this.renderAudienceSections();
        }

        // Scroll suave ao topo do hero
        const hero = document.querySelector('.totvs-hero');
        if (hero) {
            hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // ── Seleção de Mês no Gráfico Interativo ──
    selectMonth(index) {
        this.selectedMonthIndex = index;
        document.querySelectorAll('.totvs-bar-col').forEach((col, idx) => {
            col.classList.toggle('selected', idx === index);
        });
        const detailBox = document.getElementById('totvs-month-detail-box');
        if (detailBox) {
            detailBox.innerHTML = this.renderMonthDetail(index);
        }
    },

    // ── Acordeão de FAQ ──
    toggleFaq(element) {
        const item = element.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.totvs-faq-item').forEach(i => i.classList.remove('active'));
        if (!wasActive) {
            item.classList.add('active');
        }
    },

    // ── Simulação de Disparo de WhatsApp B2B da Oficina ──
    simulateWhatsApp(clientName, plate, serviceName) {
        const msg = encodeURIComponent(
            `Olá ${clientName}! Aqui é da equipe DNA AUTO / Oficina Credenciada.\n\n` +
            `Identificamos no seu histórico que o seu veículo (Placa: ${plate}) está próximo do momento ideal da revisão preventiva de: *${serviceName}*.\n\n` +
            `Realizar a manutenção preventiva agora evita danos graves e garante a certificação Nível 4 do seu carro. Deseja agendar um horário nesta semana? 🚗✨`
        );
        const url = `https://wa.me/?text=${msg}`;
        window.open(url, '_blank');
    },

    goToRegister() {
        LoginView.selectedRoleTab = 'OWNER';
        LoginView.currentMode = 'REGISTER';
        LoginView.render();
    },

    goToRegisterWorkshop() {
        LoginView.selectedRoleTab = 'WORKSHOP';
        LoginView.currentMode = 'REGISTER';
        LoginView.render();
    },

    fillPlate(plate) {
        const input = document.getElementById('landing-plate-input');
        if (input) input.value = plate;
        this.handleSearchPlate({ preventDefault: () => {} });
    },

    async handleSearchPlate(e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('landing-plate-input');
        const plate = (input?.value || '').trim().toUpperCase();

        if (!plate) {
            alert('Digite uma placa para consultar.');
            return;
        }

        try {
            const res = await API.searchVehicle(plate);
            if (res.found && res.hasDna && res.vehicle.dna_code) {
                DossierView.render(res.vehicle.dna_code);
            } else if (res.found && !res.hasDna) {
                this.showVehicleModal(res.vehicle);
            } else {
                alert(`🔍 Placa ${plate} não localizada na rede.\n\nCadastre seu veículo e ative o DNA Permanente por R$ 59,90.`);
                this.goToRegister();
            }
        } catch (err) {
            alert('Erro na consulta de placa: ' + err.message);
        }
    },

    // ── Modal de Exibição do Veículo Localizado via API Oficial ──
    showVehicleModal(v) {
        this.closeVehicleModal();

        const modalDiv = document.createElement('div');
        modalDiv.id = 'landing-vehicle-modal';
        modalDiv.style.cssText = `
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;
        `;

        const fipe = v.fipe || {};
        const legal = v.legal_status || {};
        const origin = v.origin || {};

        modalDiv.innerHTML = `
            <div style="background: #0b111a; border: 1px solid rgba(255, 210, 28, 0.4); border-radius: 16px; max-width: 580px; width: 100%; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); position: relative; animation: fadeIn 0.25s ease-out;">
                <!-- Header com Logo da Montadora -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${v.logo ? `
                            <img src="${v.logo}" alt="${v.brand}" style="height: 44px; max-width: 70px; object-fit: contain; background: #fff; border-radius: 8px; padding: 4px; border: 1px solid rgba(255,255,255,0.15);" />
                        ` : `
                            <div style="width: 44px; height: 44px; border-radius: 8px; background: rgba(255, 210, 28, 0.15); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 210, 28, 0.3); color: #ffd21c; font-weight: 800; font-size: 18px;">
                                ${v.brand ? v.brand.substring(0, 2).toUpperCase() : 'VE'}
                            </div>
                        `}
                        <div>
                            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; font-size: 10px; font-weight: 700; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.8px;">
                                Base Nacional Oficial • Senatran / FIPE
                            </span>
                            <h3 style="margin: 6px 0 2px; color: #fff; font-size: 20px; font-weight: 800;">
                                ${v.brand || ''} ${v.model || ''}
                            </h3>
                            <div style="font-size: 12px; color: #94a3b8;">
                                ${v.version || 'Versão Homologada de Fábrica'}
                            </div>
                        </div>
                    </div>
                    <button onclick="LandingView.closeVehicleModal()" style="background: none; border: none; color: #64748b; font-size: 24px; cursor: pointer; padding: 0 4px; line-height: 1;">&times;</button>
                </div>

                <!-- Grid de Dados Cadastrais -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #ffd21c; text-transform: uppercase;">Placa Oficial</div>
                        <div style="font-size: 15px; font-weight: 800; color: #fff; font-family: monospace; margin-top: 2px;">
                            ${v.license_plate} ${origin.state ? `(${origin.city || ''}/${origin.state})` : ''}
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #ffd21c; text-transform: uppercase;">Ano Fab / Mod</div>
                        <div style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 2px;">
                            ${v.manufacture_year || '—'} / ${v.model_year || '—'}
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #ffd21c; text-transform: uppercase;">Cor & Combustível</div>
                        <div style="font-size: 13px; font-weight: 600; color: #cbd5e1; margin-top: 2px;">
                            ${v.color || 'Não inf.'} • ${v.fuel_type || 'Flex'}
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase;">Tabela FIPE Oficial</div>
                        <div style="font-size: 15px; font-weight: 800; color: #10b981; margin-top: 2px;">
                            ${fipe.market_value_formatted || 'Consulte'}
                        </div>
                        ${fipe.score ? `<div style="font-size: 10px; color: #64748b;">Precisão: ${fipe.score} pts</div>` : ''}
                    </div>
                </div>

                <!-- Alerta de Ativação do Passaporte DNA -->
                <div style="background: rgba(255, 210, 28, 0.08); border: 1px solid rgba(255, 210, 28, 0.25); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span style="font-size: 20px;">🛡️</span>
                        <div>
                            <strong style="color: #ffd21c; font-size: 13px; display: block; margin-bottom: 4px;">
                                Passaporte Digital DNA Ainda Não Ativo
                            </strong>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                                Este veículo foi identificado na base nacional de trânsito, mas ainda não possui o passaporte blindado do DNA AUTO. Ative agora para registrar revisões, prever trocas de correia/óleo e valorizar o carro na revenda!
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Botões de Ação -->
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="LandingView.closeVehicleModal()" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                        Fechar
                    </button>
                    <button onclick="LandingView.closeVehicleModal(); LandingView.goToRegister();" style="background: linear-gradient(135deg, #ffd21c 0%, #f59e0b 100%); border: none; color: #000; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(255, 210, 28, 0.35);">
                        🚀 ATIVAR PASSAPORTE DNA POR R$ 59,90
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalDiv);
    },

    closeVehicleModal() {
        const existing = document.getElementById('landing-vehicle-modal');
        if (existing) existing.remove();
    },

    // ── Injeção de Estilos CSS Padrão TOTVS / Dark Enterprise de Alto Padrão ──
    injectCSS() {
        let style = document.getElementById('totvs-landing-view-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'totvs-landing-view-styles';
            document.head.appendChild(style);
        }

        style.textContent = `
            .totvs-landing-root {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: #05080D;
                color: #e2e8f0;
                min-height: 100vh;
                overflow-x: hidden;
            }

            /* NAVBAR CORPORATIVA PADRÃO TOTVS */
            .totvs-navbar {
                position: sticky;
                top: 0;
                width: 100%;
                background: rgba(5, 8, 13, 0.94);
                backdrop-filter: blur(14px);
                border-bottom: 1px solid rgba(255, 210, 28, 0.2);
                z-index: 1000;
            }
            .totvs-nav-container {
                max-width: 1240px;
                margin: 0 auto;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
            }
            .totvs-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
            }
            .totvs-brand-logo {
                width: 38px;
                height: 38px;
                background: rgba(255, 210, 28, 0.1);
                border: 1px solid rgba(255, 210, 28, 0.3);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .totvs-brand-title span {
                font-size: 19px;
                font-weight: 800;
                color: #ffffff;
                display: block;
                line-height: 1.1;
                letter-spacing: -0.3px;
            }
            .totvs-brand-title small {
                font-size: 9.5px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .totvs-nav-links {
                display: flex;
                align-items: center;
                gap: 22px;
            }
            .totvs-nav-link {
                color: #94a3b8;
                text-decoration: none;
                font-size: 13.5px;
                font-weight: 600;
                transition: color 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .totvs-nav-link:hover {
                color: #FFD21C;
            }
            .totvs-nav-link.highlight-b2b {
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.08);
                padding: 4px 10px;
                border-radius: 6px;
                border: 1px solid rgba(56, 189, 248, 0.2);
            }
            .totvs-nav-link.highlight-b2b:hover {
                color: #ffffff;
                background: rgba(56, 189, 248, 0.18);
            }
            .totvs-pulse-mini {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #38bdf8;
                box-shadow: 0 0 8px #38bdf8;
            }
            .totvs-nav-actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .totvs-btn-ghost {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .totvs-btn-ghost:hover {
                border-color: #FFD21C;
                color: #FFD21C;
            }
            .totvs-btn-gold {
                background: linear-gradient(135deg, #FFD21C 0%, #F59E0B 100%);
                color: #05080D;
                border: none;
                padding: 9px 20px;
                font-size: 13px;
                font-weight: 800;
                border-radius: 6px;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(255, 210, 28, 0.3);
                transition: all 0.2s;
            }
            .totvs-btn-gold:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(255, 210, 28, 0.45);
            }

            /* HERO SECTION CORPORATIVO */
            .totvs-hero {
                position: relative;
                min-height: 85vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(5, 8, 13, 0.88) 0%, rgba(5, 8, 13, 0.98) 100%),
                            url('/img/login-car-bg.jpg') center center / cover no-repeat;
                padding: 50px 20px 70px;
                box-sizing: border-box;
                text-align: center;
            }
            .totvs-hero-grid-pattern {
                position: absolute;
                inset: 0;
                background-image: radial-gradient(rgba(255, 210, 28, 0.08) 1px, transparent 1px);
                background-size: 28px 28px;
                pointer-events: none;
            }
            .totvs-hero-content {
                max-width: 960px;
                margin: 0 auto;
                position: relative;
                z-index: 2;
            }

            /* SWITCHER DE AUDIÊNCIA (DONO VS OFICINA) */
            .totvs-audience-switcher {
                display: inline-flex;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 30px;
                padding: 4px;
                gap: 6px;
                margin-bottom: 26px;
            }
            .totvs-audience-btn {
                background: none;
                border: none;
                color: #94a3b8;
                padding: 8px 20px;
                font-size: 13px;
                font-weight: 700;
                border-radius: 24px;
                cursor: pointer;
                transition: all 0.25s;
            }
            .totvs-audience-btn.active {
                background: #FFD21C;
                color: #05080D;
                box-shadow: 0 2px 10px rgba(255, 210, 28, 0.35);
            }

            .totvs-badge-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 210, 28, 0.1);
                border: 1px solid rgba(255, 210, 28, 0.35);
                color: #FFD21C;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.8px;
                margin-bottom: 20px;
            }
            .totvs-badge-pill.b2b {
                background: rgba(16, 185, 129, 0.12);
                border-color: rgba(16, 185, 129, 0.4);
                color: #10b981;
            }
            .totvs-pulse-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #FFD21C;
                box-shadow: 0 0 10px #FFD21C;
                animation: totvs-pulse 1.8s infinite;
            }
            .totvs-pulse-green {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                box-shadow: 0 0 10px #10b981;
                animation: totvs-pulse 1.8s infinite;
            }
            @keyframes totvs-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.85); }
            }

            .totvs-hero-title {
                font-size: 42px;
                line-height: 1.15;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 20px;
                letter-spacing: -0.8px;
            }
            .totvs-gold-highlight {
                color: #FFD21C;
                text-shadow: 0 0 30px rgba(255, 210, 28, 0.4);
            }
            .totvs-hero-subtitle {
                font-size: 17px;
                line-height: 1.6;
                color: #cbd5e1;
                max-width: 780px;
                margin: 0 auto 34px;
            }
            .totvs-hero-cta-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                flex-wrap: wrap;
                margin-bottom: 40px;
            }
            .totvs-btn-primary-hero {
                background: linear-gradient(135deg, #FFD21C 0%, #F59E0B 100%);
                color: #05080D;
                border: none;
                padding: 14px 30px;
                font-size: 15px;
                font-weight: 800;
                border-radius: 8px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 6px 25px rgba(255, 210, 28, 0.35);
                transition: all 0.2s;
            }
            .totvs-btn-primary-hero:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(255, 210, 28, 0.5);
            }
            .totvs-btn-secondary-hero {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 14px 24px;
                font-size: 14.5px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
            }
            .totvs-btn-secondary-hero:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: #38bdf8;
                color: #38bdf8;
            }
            .totvs-btn-outline-gold {
                background: rgba(255, 210, 28, 0.08);
                border: 1px solid #FFD21C;
                color: #FFD21C;
                padding: 10px 20px;
                font-size: 13.5px;
                font-weight: 700;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .totvs-btn-outline-gold:hover {
                background: #FFD21C;
                color: #05080D;
            }

            /* BARRA DE KPIS */
            .totvs-kpi-bar {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 30px;
                flex-wrap: wrap;
                padding-top: 24px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-kpi-item {
                text-align: center;
            }
            .totvs-kpi-val {
                display: block;
                font-size: 22px;
                font-weight: 900;
                color: #FFD21C;
                letter-spacing: -0.5px;
            }
            .totvs-kpi-lbl {
                font-size: 11px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .totvs-kpi-sep {
                width: 1px;
                height: 32px;
                background: rgba(255, 255, 255, 0.1);
            }

            /* SECTIONS GLOBAIS */
            .totvs-section {
                padding: 70px 20px;
            }
            .totvs-container {
                max-width: 1200px;
                margin: 0 auto;
            }
            .totvs-section-header {
                text-align: center;
                max-width: 760px;
                margin: 0 auto 46px;
            }
            .totvs-badge-tag {
                display: inline-block;
                font-size: 10.5px;
                font-weight: 800;
                padding: 4px 14px;
                border-radius: 12px;
                letter-spacing: 1px;
                margin-bottom: 12px;
                text-transform: uppercase;
            }
            .totvs-badge-tag.cyan {
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.1);
                border: 1px solid rgba(56, 189, 248, 0.3);
            }
            .totvs-badge-tag.gold {
                color: #FFD21C;
                background: rgba(255, 210, 28, 0.1);
                border: 1px solid rgba(255, 210, 28, 0.3);
            }
            .totvs-badge-tag.b2b {
                color: #10b981;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            .totvs-section-header h2 {
                font-size: 34px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 14px;
                letter-spacing: -0.5px;
            }
            .totvs-section-header p {
                font-size: 15px;
                color: #94a3b8;
                line-height: 1.6;
                margin: 0;
            }

            /* DASHBOARD FINANCEIRO DOS ÚLTIMOS 6 MESES */
            .totvs-financial-dashboard-card {
                background: #090f1a;
                border: 1px solid rgba(255, 210, 28, 0.35);
                border-radius: 14px;
                padding: 30px;
                box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
            }
            .totvs-fin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 16px;
                margin-bottom: 24px;
                padding-bottom: 18px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-fin-car-badge {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .totvs-car-avatar {
                width: 44px;
                height: 44px;
                border-radius: 10px;
                background: rgba(255, 210, 28, 0.12);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
            }
            .totvs-fin-car-badge strong {
                font-size: 16px;
                color: #ffffff;
                display: block;
            }
            .totvs-fin-car-badge small {
                font-size: 12px;
                color: #94a3b8;
            }
            .totvs-period-pill {
                background: rgba(56, 189, 248, 0.1);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.3);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
            }

            /* METRICAS DO DASHBOARD FINANCEIRO */
            .totvs-fin-metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 16px;
                margin-bottom: 28px;
            }
            .totvs-fin-metric-card {
                background: #05080e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 18px;
            }
            .totvs-fin-metric-card.primary {
                border-color: rgba(255, 210, 28, 0.4);
                background: linear-gradient(135deg, rgba(255, 210, 28, 0.05) 0%, #05080e 100%);
            }
            .metric-label {
                font-size: 11px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: block;
                margin-bottom: 6px;
            }
            .metric-value {
                font-size: 24px;
                font-weight: 900;
                color: #FFD21C;
                display: block;
                margin-bottom: 4px;
            }
            .metric-footnote {
                font-size: 11px;
                color: #64748b;
            }

            /* GRAFICO DE BARRAS */
            .totvs-fin-chart-section {
                background: #05080e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 22px;
                margin-bottom: 20px;
            }
            .totvs-chart-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }
            .totvs-chart-title span {
                font-size: 14px;
                font-weight: 700;
                color: #ffffff;
            }
            .totvs-chart-title small {
                font-size: 11px;
                color: #64748b;
            }
            .totvs-chart-bars {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                height: 160px;
                gap: 12px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .totvs-bar-col {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
                justify-content: flex-end;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .totvs-bar-col:hover {
                transform: translateY(-4px);
            }
            .totvs-bar-val {
                font-size: 11px;
                font-weight: 700;
                color: #94a3b8;
                margin-bottom: 6px;
            }
            .totvs-bar-fill {
                width: 100%;
                max-width: 48px;
                background: linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.3) 100%);
                border-radius: 6px 6px 0 0;
                transition: all 0.3s;
            }
            .totvs-bar-fill.peak {
                background: linear-gradient(180deg, #FFD21C 0%, #d97706 100%);
                box-shadow: 0 0 16px rgba(255, 210, 28, 0.3);
            }
            .totvs-bar-fill.zero {
                background: rgba(255, 255, 255, 0.08);
            }
            .totvs-bar-col.selected .totvs-bar-fill {
                outline: 2px solid #ffffff;
                box-shadow: 0 0 18px rgba(255, 255, 255, 0.4);
            }
            .totvs-bar-lbl {
                font-size: 11px;
                color: #94a3b8;
                margin-top: 10px;
            }

            /* DETALHES DO MÊS SELECIONADO */
            .totvs-month-detail-card {
                background: #05080e;
                border: 1px solid rgba(255, 210, 28, 0.2);
                border-radius: 10px;
                padding: 18px;
            }
            .totvs-month-item-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            }
            .totvs-item-bullet {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #38bdf8;
            }

            /* PILARES DO RELATÓRIO DO VEÍCULO */
            .totvs-report-pillars {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .totvs-pillar-card {
                background: #090f1a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 26px;
                transition: all 0.25s;
                position: relative;
            }
            .totvs-pillar-card:hover {
                border-color: rgba(255, 210, 28, 0.4);
                transform: translateY(-3px);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
            }
            .totvs-pillar-icon {
                font-size: 28px;
                margin-bottom: 16px;
            }
            .totvs-pillar-card h3 {
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                margin: 0 0 10px;
            }
            .totvs-pillar-card p {
                font-size: 13.5px;
                color: #94a3b8;
                line-height: 1.6;
                margin: 0 0 16px;
            }
            .totvs-pillar-tag {
                display: inline-block;
                font-size: 10px;
                font-weight: 800;
                color: #FFD21C;
                background: rgba(255, 210, 28, 0.1);
                border: 1px solid rgba(255, 210, 28, 0.3);
                padding: 3px 10px;
                border-radius: 10px;
            }

            /* TIMELINE PREVIEW */
            .totvs-timeline-preview-box {
                background: #090f1a;
                border: 1px solid rgba(255, 210, 28, 0.25);
                border-radius: 14px;
                padding: 28px;
            }
            .totvs-timeline-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 16px;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-timeline-items {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .totvs-tl-item {
                display: flex;
                gap: 16px;
            }
            .totvs-tl-dot {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                margin-top: 4px;
                flex-shrink: 0;
            }
            .totvs-tl-dot.gold {
                background: #FFD21C;
                box-shadow: 0 0 10px rgba(255, 210, 28, 0.5);
            }
            .totvs-tl-dot.cyan {
                background: #38bdf8;
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .totvs-tl-body {
                flex: 1;
                background: #05080e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 16px;
            }
            .totvs-tl-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 6px;
            }
            .totvs-tl-top strong {
                font-size: 14.5px;
                color: #ffffff;
            }
            .totvs-tl-date {
                font-size: 12px;
                color: #94a3b8;
            }
            .totvs-tl-body p {
                font-size: 13px;
                color: #cbd5e1;
                margin: 0 0 10px;
                line-height: 1.5;
            }
            .totvs-tl-photos {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .totvs-photo-tag {
                font-size: 11px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #38bdf8;
                padding: 3px 8px;
                border-radius: 4px;
            }

            /* MÓDULO B2B PARA OFICINAS */
            .totvs-b2b-highlight {
                background: linear-gradient(180deg, #060b13 0%, #0a1322 100%);
                border-top: 1px solid rgba(16, 185, 129, 0.2);
                border-bottom: 1px solid rgba(16, 185, 129, 0.2);
            }
            .totvs-workshop-features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
                margin-bottom: 40px;
            }
            .totvs-workshop-card {
                background: #090f1a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 28px;
                position: relative;
                transition: all 0.25s;
            }
            .totvs-workshop-card:hover {
                border-color: rgba(16, 185, 129, 0.4);
                transform: translateY(-4px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            }
            .totvs-workshop-card.featured {
                border-color: rgba(255, 210, 28, 0.45);
                background: linear-gradient(180deg, #0d1526 0%, #090f1a 100%);
            }
            .totvs-ws-badge-top {
                position: absolute;
                top: -12px;
                right: 20px;
                background: #FFD21C;
                color: #05080D;
                font-size: 10px;
                font-weight: 800;
                padding: 3px 10px;
                border-radius: 10px;
                letter-spacing: 0.5px;
            }
            .totvs-ws-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin-bottom: 16px;
            }
            .totvs-ws-icon.red {
                background: rgba(239, 68, 68, 0.12);
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .totvs-ws-icon.gold {
                background: rgba(255, 210, 28, 0.12);
                border: 1px solid rgba(255, 210, 28, 0.3);
            }
            .totvs-ws-icon.cyan {
                background: rgba(56, 189, 248, 0.12);
                border: 1px solid rgba(56, 189, 248, 0.3);
            }
            .totvs-workshop-card h3 {
                font-size: 19px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 10px;
            }
            .totvs-ws-desc {
                font-size: 13.5px;
                color: #94a3b8;
                line-height: 1.6;
                margin: 0 0 16px;
            }
            .totvs-ws-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #05080e;
                border-radius: 8px;
                padding: 10px 14px;
                margin-bottom: 14px;
                font-size: 12px;
            }
            .totvs-ws-stat span {
                color: #94a3b8;
            }
            .totvs-ws-stat strong {
                color: #10b981;
                font-size: 14px;
            }
            .totvs-ws-benefit {
                font-size: 12.5px;
                color: #e2e8f0;
                font-weight: 600;
            }

            /* RADAR PREDITIVO DA OFICINA */
            .totvs-radar-demo-card {
                background: #080e18;
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 14px;
                padding: 28px;
                box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6);
            }
            .totvs-radar-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 16px;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-radar-title {
                font-size: 14px;
                font-weight: 800;
                color: #10b981;
                letter-spacing: 0.8px;
            }
            .totvs-radar-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(16, 185, 129, 0.12);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #10b981;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
            }
            .totvs-radar-table-responsive {
                overflow-x: auto;
                margin-bottom: 24px;
            }
            .totvs-radar-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                font-size: 13px;
            }
            .totvs-radar-table th {
                padding: 12px 14px;
                background: #05080e;
                color: #94a3b8;
                font-weight: 700;
                font-size: 11.5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-radar-table td {
                padding: 14px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                color: #cbd5e1;
            }
            .totvs-radar-table tr:hover td {
                background: rgba(255, 255, 255, 0.02);
            }
            .totvs-radar-table td strong {
                display: block;
                color: #ffffff;
            }
            .totvs-radar-table td small {
                color: #64748b;
                font-size: 11px;
            }
            .radar-tag {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
            }
            .radar-tag.red {
                background: rgba(239, 68, 68, 0.12);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .radar-tag.gold {
                background: rgba(255, 210, 28, 0.12);
                color: #FFD21C;
                border: 1px solid rgba(255, 210, 28, 0.3);
            }
            .radar-tag.cyan {
                background: rgba(56, 189, 248, 0.12);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.3);
            }
            .totvs-btn-wa-action {
                background: rgba(37, 211, 102, 0.15);
                border: 1px solid #25D366;
                color: #25D366;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            }
            .totvs-btn-wa-action:hover {
                background: #25D366;
                color: #05080D;
            }
            .totvs-radar-cta-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 16px;
                padding-top: 18px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .totvs-radar-cta-text strong {
                color: #ffffff;
                font-size: 15px;
                display: block;
            }
            .totvs-radar-cta-text span {
                color: #94a3b8;
                font-size: 12.5px;
            }

            /* BUSCA DE PLACA */
            .totvs-search-card {
                max-width: 620px;
                margin: 0 auto;
                background: #0d1320;
                border: 1px solid rgba(255, 210, 28, 0.3);
                border-radius: 14px;
                padding: 26px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .totvs-search-form {
                display: flex;
                gap: 10px;
                margin-bottom: 16px;
            }
            .totvs-plate-input-wrapper {
                flex: 1;
                position: relative;
            }
            .totvs-plate-flag {
                position: absolute;
                top: 4px;
                left: 10px;
                font-size: 8px;
                font-weight: 800;
                color: #38bdf8;
                letter-spacing: 1px;
            }
            .totvs-plate-input {
                width: 100%;
                height: 48px;
                background: #05080D;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #FFD21C;
                font-family: monospace;
                font-size: 18px;
                font-weight: 800;
                padding: 12px 14px 2px;
                box-sizing: border-box;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .totvs-plate-input:focus {
                outline: none;
                border-color: #FFD21C;
                box-shadow: 0 0 12px rgba(255, 210, 28, 0.25);
            }
            .totvs-search-submit {
                background: #FFD21C;
                color: #05080D;
                border: none;
                border-radius: 8px;
                padding: 0 20px;
                font-weight: 800;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
            }
            .totvs-search-submit:hover {
                background: #f59e0b;
            }
            .totvs-search-examples {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                font-size: 11.5px;
                color: #64748b;
            }
            .totvs-example-tag {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #94a3b8;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                font-family: monospace;
            }
            .totvs-example-tag:hover {
                border-color: #FFD21C;
                color: #FFD21C;
            }

            /* COMPARATIVO BOX */
            .totvs-compare-box {
                background: #090e18;
                border: 1px solid rgba(255, 210, 28, 0.3);
                border-radius: 14px;
                padding: 34px;
                display: flex;
                align-items: stretch;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
            }
            .totvs-compare-col {
                flex: 1;
                min-width: 280px;
            }
            .totvs-compare-divider {
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                color: #64748b;
                font-size: 16px;
                padding: 0 10px;
            }
            .totvs-compare-badge {
                display: inline-block;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 18px;
            }
            .totvs-compare-badge.red {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .totvs-compare-badge.gold {
                background: rgba(255, 210, 28, 0.15);
                color: #FFD21C;
                border: 1px solid #FFD21C;
            }
            .totvs-compare-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .totvs-compare-list li {
                font-size: 14px;
                color: #cbd5e1;
                margin-bottom: 12px;
                line-height: 1.5;
            }

            /* ACCORDION FAQ */
            .totvs-faq-accordion {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .totvs-faq-item {
                background: #090f1a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                overflow: hidden;
            }
            .totvs-faq-q {
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-weight: 700;
                color: #ffffff;
                font-size: 15px;
            }
            .totvs-faq-icon {
                font-size: 20px;
                color: #FFD21C;
                transition: transform 0.2s;
            }
            .totvs-faq-item.active .totvs-faq-icon {
                transform: rotate(45deg);
            }
            .totvs-faq-a {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
                background: #05080e;
            }
            .totvs-faq-item.active .totvs-faq-a {
                max-height: 250px;
                padding: 16px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
            }
            .totvs-faq-a p {
                margin: 0;
                color: #94a3b8;
                font-size: 13.5px;
                line-height: 1.6;
            }

            /* FOOTER */
            .totvs-footer {
                background: #030509;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding: 60px 20px 20px;
            }
            .totvs-footer-grid {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                gap: 30px;
                margin-bottom: 40px;
            }
            .totvs-footer-col h4 {
                color: #ffffff;
                font-size: 14px;
                margin: 0 0 14px;
                font-weight: 700;
            }
            .totvs-footer-col ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .totvs-footer-col ul li {
                margin-bottom: 8px;
            }
            .totvs-footer-col ul li a {
                color: #94a3b8;
                text-decoration: none;
                font-size: 13px;
                transition: color 0.2s;
            }
            .totvs-footer-col ul li a:hover {
                color: #FFD21C;
            }
            .totvs-footer-bottom {
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                padding-top: 20px;
                font-size: 12px;
                color: #64748b;
            }

            /* REGRAS RESPONSIVAS AUXILIARES */
            @media (min-width: 769px) {
                .mobile-only {
                    display: none !important;
                }
            }

            @media (max-width: 900px) {
                .totvs-footer-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 768px) {
                .desktop-only {
                    display: none !important;
                }

                /* ============================================== */
                /* TOPO / NAVBAR ULTRA ELEGANTE & HARMONIOSO     */
                /* ============================================== */
                .totvs-navbar {
                    padding: 0;
                }
                .totvs-nav-container {
                    padding: 8px 14px !important;
                    gap: 8px !important;
                }
                .totvs-brand {
                    gap: 8px !important;
                    flex-shrink: 0;
                }
                .totvs-brand-logo {
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 7px !important;
                }
                .totvs-brand-logo svg {
                    width: 18px !important;
                    height: 18px !important;
                }
                .totvs-brand-title span {
                    font-size: 16.5px !important;
                    line-height: 1 !important;
                    letter-spacing: -0.2px !important;
                    white-space: nowrap !important;
                }
                /* Remove totalmente subtítulo longo que quebrava o topo */
                .totvs-brand-title small {
                    display: none !important;
                }
                .totvs-nav-links {
                    display: none !important;
                }
                .totvs-nav-actions {
                    gap: 6px !important;
                    flex-shrink: 0;
                    align-items: center;
                }
                .totvs-btn-ghost {
                    padding: 6px 11px !important;
                    font-size: 11.5px !important;
                    border-radius: 6px !important;
                    white-space: nowrap !important;
                    line-height: 1.2 !important;
                }
                .totvs-btn-gold {
                    padding: 7px 12px !important;
                    font-size: 11.5px !important;
                    border-radius: 6px !important;
                    white-space: nowrap !important;
                    font-weight: 700 !important;
                    line-height: 1.2 !important;
                }

                /* ============================================== */
                /* SWITCHER DE AUDIÊNCIA (DONO VS OFICINA)       */
                /* ============================================== */
                .totvs-audience-switcher {
                    width: 100% !important;
                    max-width: 360px !important;
                    margin: 0 auto 16px !important;
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 4px !important;
                    padding: 4px !important;
                    border-radius: 26px !important;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.08) !important;
                }
                .totvs-audience-btn {
                    padding: 9px 4px !important;
                    font-size: 11.5px !important;
                    white-space: nowrap !important;
                    text-align: center !important;
                    justify-content: center !important;
                    display: flex !important;
                    align-items: center !important;
                    border-radius: 20px !important;
                }

                /* ============================================== */
                /* HERO E ELEMENTOS CENTRAIS NO CELULAR          */
                /* ============================================== */
                .totvs-hero {
                    padding: 22px 14px 40px !important;
                    min-height: auto !important;
                }
                .totvs-hero-title {
                    font-size: 22px !important;
                    line-height: 1.25 !important;
                    margin: 0 0 12px !important;
                }
                .totvs-hero-subtitle {
                    font-size: 13.5px !important;
                    line-height: 1.5 !important;
                    margin: 0 auto 20px !important;
                }
                .totvs-badge-pill {
                    font-size: 9.5px !important;
                    padding: 4px 10px !important;
                    line-height: 1.3 !important;
                    margin-bottom: 12px !important;
                    white-space: normal !important;
                    text-align: center !important;
                }
                .totvs-hero-cta-row {
                    flex-direction: column !important;
                    width: 100% !important;
                    gap: 10px !important;
                    margin-bottom: 24px !important;
                }
                .totvs-btn-primary-hero,
                .totvs-btn-secondary-hero {
                    width: 100% !important;
                    justify-content: center !important;
                    font-size: 13.5px !important;
                    padding: 12px 14px !important;
                    box-sizing: border-box !important;
                }

                /* ============================================== */
                /* BARRA DE KPIS RESPONSIVA NO CELULAR           */
                /* ============================================== */
                .totvs-kpi-bar {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 12px !important;
                    padding: 14px 8px !important;
                }
                .totvs-kpi-sep {
                    display: none !important;
                }
                .totvs-kpi-val {
                    font-size: 19px !important;
                }
                .totvs-kpi-lbl {
                    font-size: 10.5px !important;
                }

                /* ============================================== */
                /* SEÇÕES E CARDS ADAPTADOS PARA CELULAR          */
                /* ============================================== */
                .totvs-section {
                    padding: 40px 12px !important;
                }
                .totvs-section-header h2 {
                    font-size: 21px !important;
                    line-height: 1.25 !important;
                }
                .totvs-section-header p {
                    font-size: 13px !important;
                }
                .totvs-workshop-features-grid {
                    grid-template-columns: 1fr !important;
                    gap: 14px !important;
                }
                .totvs-fin-metrics-grid {
                    grid-template-columns: 1fr !important;
                    gap: 10px !important;
                }
                .totvs-report-pillars {
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                }
                .totvs-radar-table-responsive {
                    width: 100% !important;
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                .totvs-radar-table th,
                .totvs-radar-table td {
                    padding: 10px 12px !important;
                    font-size: 12px !important;
                    white-space: nowrap !important;
                }
                .totvs-radar-cta-row {
                    flex-direction: column !important;
                    gap: 14px !important;
                    text-align: center !important;
                }
                .totvs-radar-cta-row button {
                    width: 100% !important;
                }
                .totvs-compare-divider {
                    width: 100% !important;
                }
                .totvs-footer-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
    }
};
