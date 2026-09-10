// ==============================================================================
// DNA AUTO — LANDING EXCLUSIVA PARA OFICINAS E AUTO CENTERS (/autocente)
// Foco total em: Donos de oficinas, retenção de clientes e radar de manutenção
// ==============================================================================

const LandingWorkshopView = {
    faqOpenIndex: 0,

    toggleFaq(index) {
        this.faqOpenIndex = this.faqOpenIndex === index ? -1 : index;
        const items = document.querySelectorAll('.workshop-faq-item');
        items.forEach((item, i) => {
            if (i === this.faqOpenIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    render() {
        // Atualiza Title e SEO
        document.title = 'DNA AUTO | Tecnologia para oficinas e Auto Centers';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'O DNA AUTO ajuda sua oficina a acompanhar veículos, quilometragem e manutenção para identificar oportunidades de retorno dos seus clientes.');
        }

        // Esconde layout legado da matriz/dashboard
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
            <div class="dna-landing-page landing-workshop-page">
                <!-- HEADER SIMPLES /autocente -->
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
                            <a href="/cliente" class="dna-nav-link" onclick="event.preventDefault(); App.navigateTo('/cliente');" style="font-size:13px;">
                                Sou cliente
                            </a>
                            <button class="dna-nav-btn dna-nav-btn-primary" onclick="App.switchView('workshop')">
                                Entrar no app
                            </button>
                        </div>
                    </div>
                </header>

                <!-- HERO /autocente -->
                <section class="landing-hero" role="region" aria-label="Apresentação para Oficinas">
                    <div class="dna-section-container">
                        <div class="dna-badge-tag">
                            <span class="dna-badge-dot"></span>
                            TECNOLOGIA PARA OFICINAS E AUTO CENTERS
                        </div>

                        <h1 class="landing-hero-headline">
                            Pare de esperar o cliente lembrar.<br>Saiba quando é hora de chamá-lo.
                        </h1>

                        <p class="landing-hero-text">
                            O DNA AUTO ajuda sua oficina a acompanhar veículos, quilometragem e manutenção para identificar oportunidades de retorno dos seus clientes.
                        </p>

                        <div class="landing-hero-actions">
                            <button class="dna-btn dna-btn-primary" onclick="App.switchView('workshop')">
                                <span>Entrar no app da oficina</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <button class="dna-btn dna-btn-secondary" onclick="App.goToRegisterWorkshop()">
                                <span>Credenciar minha oficina</span>
                            </button>
                        </div>

                        <div class="landing-hero-caption">
                            Comece a transformar sua carteira de clientes em novas oportunidades.
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO PROBLEMA (3 PONTOS DIRETOS) -->
                <section class="workshop-problems-section" role="region" aria-label="Desafios da Oficina">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">
                            Quantos clientes já passaram pela sua oficina e nunca mais voltaram?
                        </h2>
                        <p class="landing-section-subtitle">
                            Você já conquistou a confiança do cliente. O problema é saber quando aquele veículo está próximo de precisar de você novamente.
                        </p>

                        <div class="workshop-problems-grid">
                            <div class="workshop-problem-card">
                                <span class="workshop-problem-badge">CLIENTE ESQUECE</span>
                                <p>O cliente nem sempre lembra da próxima manutenção.</p>
                            </div>
                            <div class="workshop-problem-card">
                                <span class="workshop-problem-badge">TIMING</span>
                                <p>Você pode perder o momento certo de entrar em contato.</p>
                            </div>
                            <div class="workshop-problem-card">
                                <span class="workshop-problem-badge">OPORTUNIDADE</span>
                                <p>Uma carteira de clientes pode esconder novas oportunidades de serviço.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO SOLUÇÃO VISUAL (FLUXO ELEGANTE) -->
                <section class="workshop-solution-section" role="region" aria-label="Fluxo da Solução">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">
                            Agora o DNA AUTO ajuda sua oficina a lembrar por ele.
                        </h2>
                        <p class="landing-section-subtitle">
                            Um ecossistema conectado que converte dados veiculares em contato inteligente.
                        </p>

                        <div class="solution-flow-container">
                            <div class="flow-step-pill">VEÍCULO</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill">QUILOMETRAGEM</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill">HISTÓRICO</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill highlight">DNA AUTO</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill">OPORTUNIDADE DE MANUTENÇÃO</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill">OFICINA</div>
                            <span class="flow-arrow" aria-hidden="true">→</span>
                            <div class="flow-step-pill">CLIENTE</div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO RADAR PREDITIVO (MOCKUP DEMONSTRATIVO PREMIUM) -->
                <section class="workshop-radar-section" role="region" aria-label="Radar de Manutenção">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">
                            Transforme sua carteira de clientes em novas oportunidades.
                        </h2>
                        <p class="landing-section-subtitle">
                            Identifique veículos que podem estar próximos de uma manutenção e saiba quem merece sua atenção.
                        </p>

                        <div class="radar-mockup-card">
                            <div class="radar-mockup-header">
                                <div class="radar-mockup-title">
                                    <span class="radar-pulse-indicator" aria-hidden="true"></span>
                                    <span>RADAR DE MANUTENÇÃO</span>
                                </div>
                                <span style="font-size:11px; color:var(--dna-text-dim); text-transform:uppercase; letter-spacing:0.04em;">Visão Operacional</span>
                            </div>

                            <div class="radar-item">
                                <div>
                                    <div class="radar-item-car">Honda Civic</div>
                                    <div class="radar-item-km">78.420 km</div>
                                </div>
                                <span class="radar-item-action-badge yellow">Revisão próxima</span>
                            </div>

                            <div class="radar-item">
                                <div>
                                    <div class="radar-item-car">Toyota Corolla</div>
                                    <div class="radar-item-km">62.180 km</div>
                                </div>
                                <span class="radar-item-action-badge blue">Manutenção prevista</span>
                            </div>

                            <div class="radar-item">
                                <div>
                                    <div class="radar-item-car">Fiat Argo</div>
                                    <div class="radar-item-km">48.900 km</div>
                                </div>
                                <span class="radar-item-action-badge green">Troca de óleo</span>
                            </div>

                            <p class="radar-mockup-disclaimer">
                                * Exemplo demonstrativo de acompanhamento preventivo da carteira.
                            </p>
                        </div>

                        <button class="dna-btn dna-btn-primary" onclick="App.switchView('workshop')" style="margin-top:16px;">
                            <span>Quero usar o DNA AUTO</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </section>

                <!-- SEÇÃO WHATSAPP COM CLIENTE -->
                <section class="workshop-whatsapp-section" role="region" aria-label="Comunicação com o Cliente">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">
                            Identificou a oportunidade? Fale com o cliente.
                        </h2>
                        <p class="landing-section-subtitle">
                            Você não precisa lembrar de cada cliente manualmente. O sistema ajuda a identificar quem pode estar no momento certo.
                        </p>

                        <div class="whatsapp-mockup-card">
                            <div class="whatsapp-chat-header">
                                <div class="whatsapp-avatar">🚗</div>
                                <div>
                                    <div class="whatsapp-chat-name">Oficina Especializada</div>
                                    <div class="whatsapp-chat-status">Mensagem de Atendimento Preventivo</div>
                                </div>
                            </div>
                            <div class="whatsapp-bubble">
                                <p>Olá, João! Tudo bem?</p>
                                <p>Identificamos que seu veículo está próximo do período recomendado para revisão.</p>
                                <p>Nossa equipe pode verificar o carro para você.</p>
                                <p>Quer agendar?</p>
                                <div class="whatsapp-time">10:45 ✓✓</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO BENEFÍCIOS DA OFICINA (4 ITENS DIRETOS) -->
                <section class="workshop-benefits-section" role="region" aria-label="Benefícios para a Oficina">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">Mais controle sobre sua carteira de clientes.</h2>
                        <p class="landing-section-subtitle">Uma gestão proativa que constrói relacionamentos duradouros e previsibilidade.</p>

                        <div class="workshop-benefits-grid">
                            <div class="workshop-benefit-item">
                                <span class="workshop-benefit-check" aria-hidden="true">✓</span>
                                <span>Mais oportunidades de manutenção preventiva</span>
                            </div>
                            <div class="workshop-benefit-item">
                                <span class="workshop-benefit-check" aria-hidden="true">✓</span>
                                <span>Mais retorno de clientes</span>
                            </div>
                            <div class="workshop-benefit-item">
                                <span class="workshop-benefit-check" aria-hidden="true">✓</span>
                                <span>Histórico organizado por veículo</span>
                            </div>
                            <div class="workshop-benefit-item">
                                <span class="workshop-benefit-check" aria-hidden="true">✓</span>
                                <span>Comunicação mais profissional</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO COMO FUNCIONA (3 PASSOS) -->
                <section class="steps-section" role="region" aria-label="Como Funciona">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">Como funciona na prática</h2>
                        <p class="landing-section-subtitle">Três passos simples para colocar sua oficina em outro nível de relacionamento.</p>

                        <div class="steps-grid">
                            <div class="step-card">
                                <div class="step-number">01</div>
                                <p class="step-text">Cadastre sua oficina</p>
                            </div>
                            <div class="step-card">
                                <div class="step-number">02</div>
                                <p class="step-text">Organize seus veículos e serviços</p>
                            </div>
                            <div class="step-card">
                                <div class="step-number">03</div>
                                <p class="step-text">Identifique oportunidades e entre em contato</p>
                            </div>
                        </div>

                        <button class="dna-btn dna-btn-primary" onclick="App.switchView('workshop')">
                            <span>Entrar no app da oficina</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </section>

                <!-- SEÇÃO CREDENCIAMENTO DA OFICINA -->
                <section class="accreditation-section" role="region" aria-label="Credenciamento">
                    <div class="dna-section-container">
                        <h2 class="landing-section-title">Sua oficina pode fazer parte do DNA AUTO.</h2>
                        <p class="landing-section-subtitle">
                            Conheça a plataforma e comece a organizar sua relação com os clientes.
                        </p>
                        <button class="dna-btn dna-btn-primary" onclick="App.goToRegisterWorkshop()">
                            <span>Credenciar minha oficina</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </section>

                <!-- SEÇÃO FAQ (6 PERGUNTAS COM ACORDEÃO) -->
                <section class="faq-section" role="region" aria-label="Perguntas Frequentes da Oficina">
                    <h2 class="landing-section-title">Perguntas Frequentes</h2>
                    <p class="landing-section-subtitle">Dúvidas comuns sobre como a plataforma atende oficinas e centros automotivos.</p>

                    <div class="faq-list">
                        <!-- ITEM 1 -->
                        <div class="faq-item workshop-faq-item active">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(0)" aria-expanded="true">
                                <span>O que é o DNA AUTO?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                É uma plataforma que apoia oficinas no acompanhamento contínuo dos veículos atendidos, registrando manutenções e gerando dados para antecipar retornos preventivos.
                            </div>
                        </div>

                        <!-- ITEM 2 -->
                        <div class="faq-item workshop-faq-item">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(1)" aria-expanded="false">
                                <span>Como o DNA AUTO ajuda minha oficina?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                O sistema permite saber quando cada veículo cadastrado está próximo da quilometragem ou prazo de nova revisão, facilitando o contato assertivo com a sua base de clientes.
                            </div>
                        </div>

                        <!-- ITEM 3 -->
                        <div class="faq-item workshop-faq-item">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(2)" aria-expanded="false">
                                <span>Como funciona o radar de manutenção?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Com base nos serviços registrados e na projeção de rodagem do veículo, o radar sinaliza quais clientes estão no momento ideal para revisão preventiva ou troca de itens de desgaste.
                            </div>
                        </div>

                        <!-- ITEM 4 -->
                        <div class="faq-item workshop-faq-item">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(3)" aria-expanded="false">
                                <span>Como cadastro meus veículos?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Dentro do painel da oficina, na aba de recepção e veículos, você cadastra o carro pela placa e vincula as ordens e serviços executados com facilidade.
                            </div>
                        </div>

                        <!-- ITEM 5 -->
                        <div class="faq-item workshop-faq-item">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(4)" aria-expanded="false">
                                <span>Como entro no painel da oficina?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Basta clicar no botão "Entrar no app da oficina" nesta página para acessar diretamente seu painel de gestão operacional.
                            </div>
                        </div>

                        <!-- ITEM 6 -->
                        <div class="faq-item workshop-faq-item">
                            <button class="faq-question" onclick="LandingWorkshopView.toggleFaq(5)" aria-expanded="false">
                                <span>Como funciona o credenciamento?</span>
                                <span class="faq-chevron">▼</span>
                            </button>
                            <div class="faq-answer">
                                Ao clicar em "Credenciar minha oficina", você preenche os dados cadastrais da sua empresa (nome fantasia, CNPJ, responsável técnico e contato) para iniciar a utilização da plataforma.
                            </div>
                        </div>
                    </div>
                </section>

                <!-- CTA FINAL /autocente -->
                <section class="final-cta-section" role="region" aria-label="Chamada Final">
                    <div class="dna-section-container">
                        <h2 class="final-cta-title">
                            Não espere o cliente lembrar.<br>Faça sua oficina lembrar por ele.
                        </h2>
                        <p class="final-cta-text">
                            Transforme sua carteira de clientes em novas oportunidades de manutenção.
                        </p>
                        <div class="landing-hero-actions">
                            <button class="dna-btn dna-btn-primary" onclick="App.switchView('workshop')">
                                <span>Entrar no app da oficina</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <button class="dna-btn dna-btn-secondary" onclick="App.goToRegisterWorkshop()">
                                <span>Credenciar minha oficina</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- FOOTER -->
                <footer class="dna-footer">
                    <div class="dna-section-container">
                        <p>© 2026 DNA AUTO. Soluções e inteligência para centros automotivos e oficinas.</p>
                    </div>
                </footer>

                <!-- BARRA INFERIOR FIXA SOMENTE NO CELULAR -->
                <div class="dna-mobile-sticky-bar" role="complementary" aria-label="Ação Rápida Mobile">
                    <button class="dna-btn dna-btn-primary" onclick="App.switchView('workshop')">
                        <span>Entrar no app</span>
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            </div>
        `;
    }
};

window.LandingWorkshopView = LandingWorkshopView;
