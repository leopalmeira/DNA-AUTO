// ==============================================================================
// DNA AUTO — LANDING EXCLUSIVA PARA PROPRIETÁRIO DE VEÍCULO (/cliente)
// Foco total no dono do carro: Histórico, Manutenções, Quilometragem e App
// ==============================================================================

const LandingClientView = {
    faqOpenIndex: 0,

    toggleFaq(index) {
        this.faqOpenIndex = this.faqOpenIndex === index ? -1 : index;
        const items = document.querySelectorAll('.client-faq-item');
        items.forEach((item, i) => {
            if (i === this.faqOpenIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    scrollToSection(sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    render() {
        // Atualiza Title e SEO
        document.title = 'DNA AUTO | Cuide melhor do seu carro';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'Tenha mais controle sobre seu veículo, sua manutenção, quilometragem e os próximos cuidados com o DNA AUTO.');
        }

        // Esconde layout legado
        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';

        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';

        const container = document.getElementById('view-content');
        if (!container) return;

        container.innerHTML = `
            <div class="dna-landing-page landing-client-page">
                <!-- HEADER SIMPLES /cliente -->
                <header class="dna-nav" role="banner">
                    <div class="dna-nav-container">
                        <a href="/" class="dna-nav-brand" onclick="event.preventDefault(); App.navigateTo('/');" title="DNA AUTO Home">
                            <div class="dna-nav-logo">
                                <svg viewBox="0 0 120 120" width="28" height="28" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="7" />
                                    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="8" />
                                    <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="8" />
                                    <path d="M 28 70 C 21 52 23 27 36 14 C 50 1 78 1 91 14 C 103 27 105 52 98 70" stroke-width="8" />
                                    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="9" />
                                </svg>
                            </div>
                            <span class="dna-nav-title">DNA <span class="gold">AUTO</span></span>
                        </a>

                        <div style="display:flex; align-items:center; gap:12px;">
                            <a href="/autocente" class="dna-nav-link" onclick="event.preventDefault(); App.navigateTo('/autocente');" style="font-size:13px;">
                                Sou oficina
                            </a>
                            <button class="dna-nav-btn dna-nav-btn-primary" onclick="App.switchView('owner')">
                                Entrar no app
                            </button>
                        </div>
                    </div>
                </header>

                <!-- HERO SECTION /cliente -->
                <section class="landing-hero" role="region" aria-label="Apresentação do Produto">
                    <div class="dna-section-container">
                        <div class="dna-badge-tag">
                            <span class="dna-badge-dot"></span>
                            PARA PROPRIETÁRIOS DE VEÍCULOS
                        </div>
                        <h1 class="landing-hero-headline">
                            Seu carro tem uma história.<br>O DNA AUTO ajuda você a cuidar dela.
                        </h1>
                        <p class="landing-hero-text">
                            Tenha mais controle sobre seu veículo, sua manutenção, quilometragem e os próximos cuidados.
                        </p>

                        <div class="landing-hero-actions">
                            <button class="dna-btn dna-btn-primary" onclick="App.switchView('owner')">
                                <span>Entrar no app</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <button class="dna-btn dna-btn-secondary" onclick="LandingClientView.scrollToSection('beneficios-cliente')">
                                <span>Como funciona</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO BENEFÍCIOS -->
                <section class="landing-benefits-section" id="beneficios-cliente" role="region" aria-label="Benefícios para o Proprietário">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">O que você acompanha no DNA AUTO</h2>
                        <p class="landing-section-subtitle">Tudo o que importa para manter a saúde e o valor do seu carro em um só lugar.</p>

                        <div class="landing-benefits-grid">
                            <div class="landing-benefit-item">
                                <span class="landing-benefit-check" aria-hidden="true">✓</span>
                                <span>Histórico do veículo</span>
                            </div>
                            <div class="landing-benefit-item">
                                <span class="landing-benefit-check" aria-hidden="true">✓</span>
                                <span>Manutenções</span>
                            </div>
                            <div class="landing-benefit-item">
                                <span class="landing-benefit-check" aria-hidden="true">✓</span>
                                <span>Quilometragem</span>
                            </div>
                            <div class="landing-benefit-item">
                                <span class="landing-benefit-check" aria-hidden="true">✓</span>
                                <span>Próximos cuidados</span>
                            </div>
                            <div class="landing-benefit-item" style="grid-column: 1 / -1;">
                                <span class="landing-benefit-check" aria-hidden="true">✓</span>
                                <span>Informações importantes do veículo</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- MOCKUP DO APLICATIVO DO CLIENTE -->
                <section class="landing-client-mockup-section" role="region" aria-label="Demonstração do Aplicativo">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">Tenha as informações do seu carro mais organizadas.</h2>
                        <p class="landing-section-subtitle">Visualização simples, rápida e na palma da sua mão.</p>

                        <div class="client-app-preview-card">
                            <div class="client-mockup-top">
                                <div>
                                    <h3 class="client-mockup-car-title">Volkswagen Gol 1.0</h3>
                                    <span style="font-size:12px; color:var(--dna-text-dim);">2022 • Flex</span>
                                </div>
                                <div style="text-align:right;">
                                    <span class="client-mockup-plate">ABC1D23</span>
                                    <div style="margin-top:4px;">
                                        <span class="client-mockup-status-badge">
                                            <span style="width:6px; height:6px; border-radius:50%; background:#10B981;"></span>
                                            EM DIA
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="client-mockup-stats">
                                <div class="client-stat-box">
                                    <div class="client-stat-label">Quilometragem</div>
                                    <div class="client-stat-value">87.542 km</div>
                                </div>
                                <div class="client-stat-box">
                                    <div class="client-stat-label">Próxima Revisão</div>
                                    <div class="client-stat-value">90.000 km</div>
                                </div>
                            </div>

                            <div class="client-mockup-timeline">
                                <div class="client-timeline-title">Últimos Cuidados Realizados</div>
                                <div class="client-timeline-item">
                                    <div class="client-timeline-dot"></div>
                                    <div>
                                        <div class="client-timeline-desc">Revisão Periódica e Óleo</div>
                                        <div class="client-timeline-date">85.200 km • Veloce Auto Center</div>
                                    </div>
                                </div>
                                <div class="client-timeline-item">
                                    <div class="client-timeline-dot"></div>
                                    <div>
                                        <div class="client-timeline-desc">Alinhamento e Geometria 3D</div>
                                        <div class="client-timeline-date">74.300 km • Bosch Car Service</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top:28px;">
                            <button class="dna-btn dna-btn-primary" onclick="App.switchView('owner')">
                                <span>Entrar no app</span>
                                <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- BLOCO DE PREVENÇÃO -->
                <section style="padding:50px 20px; background:#070C15; border-top:1px solid var(--dna-border-subtle); border-bottom:1px solid var(--dna-border-subtle); text-align:center;">
                    <div class="dna-section-container">
                        <h2 style="font-size:22px; font-weight:700; color:var(--dna-text-white); margin-bottom:12px;">
                            Cuide do seu carro antes que a manutenção vire um problema.
                        </h2>
                        <p style="font-size:15px; color:var(--dna-text-muted); max-width:540px; margin:0 auto 24px;">
                            Antecipe trocas de componentes essenciais e evite surpresas indesejadas no trânsito.
                        </p>
                        <button class="dna-btn dna-btn-primary" onclick="App.switchView('owner')">
                            <span>Entrar no app</span>
                        </button>
                    </div>
                </section>

                <!-- FAQ DO CLIENTE COM ACORDEÃO -->
                <section class="faq-section" role="region" aria-label="Perguntas Frequentes">
                    <h2 class="landing-section-title">Perguntas Frequentes</h2>
                    <p class="landing-section-subtitle">Esclareça suas dúvidas sobre como usar o DNA AUTO para cuidar do seu veículo.</p>

                    <div class="faq-list">
                        <!-- ITEM 1 -->
                        <div class="faq-item client-faq-item active">
                            <button class="faq-question" onclick="LandingClientView.toggleFaq(0)" aria-expanded="true">
                                <span>O que é o DNA AUTO?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                É uma plataforma que organiza a história e a manutenção do seu veículo, permitindo acompanhar revisões, quilometragem e próximos cuidados de maneira clara e segura.
                            </div>
                        </div>

                        <!-- ITEM 2 -->
                        <div class="faq-item client-faq-item">
                            <button class="faq-question" onclick="LandingClientView.toggleFaq(1)" aria-expanded="false">
                                <span>Como acompanho meu veículo?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Ao acessar o aplicativo, você visualiza o painel do seu carro com a quilometragem atualizada, os registros de serviços feitos e os lembretes de manutenção.
                            </div>
                        </div>

                        <!-- ITEM 3 -->
                        <div class="faq-item client-faq-item">
                            <button class="faq-question" onclick="LandingClientView.toggleFaq(2)" aria-expanded="false">
                                <span>Consigo acompanhar a manutenção?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Sim. Você pode consultar o histórico de revisões, peças trocadas, datas e recomendações das oficinas para as próximas trocas preventivas.
                            </div>
                        </div>

                        <!-- ITEM 4 -->
                        <div class="faq-item client-faq-item">
                            <button class="faq-question" onclick="LandingClientView.toggleFaq(3)" aria-expanded="false">
                                <span>Como entro no aplicativo?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Basta clicar no botão "Entrar no app" em qualquer ponto desta página para acessar diretamente sua área de cliente.
                            </div>
                        </div>

                        <!-- ITEM 5 -->
                        <div class="faq-item client-faq-item">
                            <button class="faq-question" onclick="LandingClientView.toggleFaq(4)" aria-expanded="false">
                                <span>Preciso instalar alguma coisa?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Não é obrigatório instalar nada. Você pode acessar direto pelo navegador do seu celular ou computador. Se preferir, pode adicioná-lo à tela inicial do seu celular como aplicativo PWA.
                            </div>
                        </div>
                    </div>
                </section>

                <!-- CTA FINAL /cliente -->
                <section class="final-cta-section" role="region" aria-label="Chamada Final">
                    <div class="dna-section-container">
                        <h2 class="final-cta-title">Cuide melhor do seu carro.</h2>
                        <p class="final-cta-text">Tenha suas informações e manutenções mais organizadas.</p>
                        <button class="dna-btn dna-btn-primary" onclick="App.switchView('owner')">
                            <span>Entrar no app</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </section>

                <!-- FOOTER -->
                <footer class="dna-footer">
                    <div class="dna-section-container">
                        <p>© 2026 DNA AUTO. Feito para proprietários que valorizam seus veículos.</p>
                    </div>
                </footer>

                <!-- BARRA INFERIOR FIXA SOMENTE NO CELULAR -->
                <div class="dna-mobile-sticky-bar" role="complementary" aria-label="Ação Rápida Mobile">
                    <button class="dna-btn dna-btn-primary" onclick="App.switchView('owner')">
                        <span>Entrar no app</span>
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            </div>
        `;
    }
};

window.LandingClientView = LandingClientView;
