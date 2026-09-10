// ==============================================================================
// DNA AUTO — LANDING EXCLUSIVA PARA OFICINAS E AUTO CENTERS (/autocente)
// Foco total em: Donos de oficinas, aumento de faturamento e plataforma OBD
// ==============================================================================

const LandingWorkshopView = {
    render() {
        // Atualiza Title e SEO
        document.title = 'DNA AUTO | Tecnologia que fortalece sua oficina';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'A DNA AUTO conecta sua oficina ao futuro: tecnologia que identifica problemas, antecipa manutenções e aumenta a fidelização dos seus clientes.');
        }

        // Oculta layouts internos da aplicação
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
            <div class="dna-official-landing ws-landing">
                <!-- 1. NAVBAR -->
                <header class="ws-nav" role="banner">
                    <div class="ws-nav-inner">
                        <a href="/autocente" class="ws-brand" onclick="event.preventDefault(); App.navigateTo('/autocente');">
                            <div class="ws-logo-icon">
                                <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                                    <path d="M8 8 L24 8 C30 8 34 13 34 20 C34 27 30 32 24 32 L8 32 Z" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15 15 L23 15 C26 15 28 17 28 20 C28 23 26 25 23 25 L15 25 Z" fill="#00D4FF"/>
                                </svg>
                            </div>
                            <div class="ws-brand-text">
                                <span class="ws-brand-title">DNA AUTO</span>
                                <span class="ws-brand-sub">Tecnologia que fortalece sua oficina.</span>
                            </div>
                        </a>

                        <nav class="ws-nav-links" aria-label="Navegação Principal">
                            <a href="#beneficios" class="ws-nav-item">Benefícios</a>
                            <a href="#como-funciona" class="ws-nav-item">Como funciona</a>
                            <a href="#lucro" class="ws-nav-item">Lucro para a oficina</a>
                            <a href="#planos" class="ws-nav-item">Planos</a>
                            <a href="#suporte" class="ws-nav-item">Suporte</a>
                        </nav>

                        <div class="ws-nav-actions">
                            <button class="ws-btn-cta-pill" onclick="App.switchView('workshop')">
                                <span>Quero ser parceiro</span>
                                <span class="ws-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- 2. HERO SECTION -->
                <section class="ws-hero" id="hero">
                    <div class="ws-container ws-hero-grid">
                        <div class="ws-hero-content">
                            <span class="ws-hero-badge">PLATAFORMA DE DIAGNÓSTICO E MONITORAMENTO VEICULAR</span>
                            <h1 class="ws-hero-headline">
                                Mais controle.<br>
                                Mais serviços.<br>
                                <span class="ws-text-gradient">Mais faturamento.</span>
                            </h1>
                            <p class="ws-hero-desc">
                                A DNA AUTO conecta sua oficina ao futuro, oferecendo tecnologia que identifica problemas, antecipa manutenções e aumenta a fidelização dos seus clientes.
                            </p>
                            <div class="ws-hero-cta-wrap">
                                <button class="ws-btn-hero" onclick="App.switchView('workshop')">
                                    <span>Quero ser parceiro da DNA AUTO</span>
                                    <span class="ws-arrow">→</span>
                                </button>
                            </div>
                        </div>

                        <!-- FOTO DO MECÂNICO COM TABLET -->
                        <div class="ws-hero-media">
                            <div class="ws-media-frame">
                                <img src="/img/ws-hero-mechanic.jpg" alt="Mecânico especializado com tablet de diagnóstico veicular" class="ws-hero-img" onerror="this.src='/img/landing-workshop-official.jpg'"/>
                            </div>
                        </div>

                        <!-- 4 CARDS LATERAIS -->
                        <div class="ws-hero-cards-col">
                            <div class="ws-hero-card">
                                <div class="ws-card-circle-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div class="ws-card-text">
                                    <h4>Mais clientes na sua oficina</h4>
                                    <p>Veículos monitorados geram mais visitas e serviços.</p>
                                </div>
                            </div>

                            <div class="ws-hero-card">
                                <div class="ws-card-circle-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00D4FF" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                </div>
                                <div class="ws-card-text">
                                    <h4>Aumento do faturamento</h4>
                                    <p>Mais manutenções e serviços recomendados pelo sistema.</p>
                                </div>
                            </div>

                            <div class="ws-hero-card">
                                <div class="ws-card-circle-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00D4FF" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                                </div>
                                <div class="ws-card-text">
                                    <h4>Instalação rápida e simples</h4>
                                    <p>Apenas plugar o adaptador OBD no veículo.</p>
                                </div>
                            </div>

                            <div class="ws-hero-card">
                                <div class="ws-card-circle-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                                </div>
                                <div class="ws-card-text">
                                    <h4>Suporte e treinamento</h4>
                                    <p>Nossa equipe te acompanha em todas as etapas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 3. SEÇÃO BRANCA: O QUE VOCÊ RECEBE -->
                <section class="ws-white-section" id="beneficios">
                    <div class="ws-container">
                        <div class="ws-section-header light">
                            <h2 class="ws-section-title light">
                                O que você recebe da <span class="ws-text-blue">DNA AUTO?</span>
                            </h2>
                            <p class="ws-section-subtitle light">
                                A tecnologia chega até a sua oficina em forma de aparelhos para venda e um sistema completo, sem mensalidades e sem complicação.
                            </p>
                        </div>

                        <div class="ws-deliverables-grid">
                            <div class="ws-deliv-card">
                                <div class="ws-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/><path d="M8 15h8"/></svg>
                                </div>
                                <h3>Dispositivos OBD para venda</h3>
                                <p>Você recebe os equipamentos para vender aos seus clientes e fazer a instalação.</p>
                            </div>

                            <div class="ws-deliv-card">
                                <div class="ws-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                                </div>
                                <h3>App do cliente</h3>
                                <p>O cliente acompanha o veículo e recebe alertas no celular.</p>
                            </div>

                            <div class="ws-deliv-card">
                                <div class="ws-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                                </div>
                                <h3>Plataforma DNA AUTO</h3>
                                <p>Nós cuidamos de toda a tecnologia, dados, monitoramento e suporte técnico.</p>
                            </div>

                            <div class="ws-deliv-card">
                                <div class="ws-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                </div>
                                <h3>Alertas e recomendações</h3>
                                <p>O cliente recebe avisos de manutenção e problemas antes que se tornem graves.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 4. SEÇÃO ESCURA: COMO FUNCIONA -->
                <section class="ws-dark-section" id="como-funciona">
                    <div class="ws-container">
                        <div class="ws-section-header dark">
                            <h2 class="ws-section-title dark">Como funciona?</h2>
                            <p class="ws-section-subtitle dark">É simples, rápido e eficiente.</p>
                        </div>

                        <div class="ws-steps-grid">
                            <div class="ws-step-card">
                                <div class="ws-step-badge-row">
                                    <span class="ws-step-num">1</span>
                                    <div class="ws-step-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                    </div>
                                </div>
                                <h4>Você recebe os equipamentos</h4>
                                <p>A DNA AUTO disponibiliza os dispositivos OBD para venda na sua oficina.</p>
                            </div>

                            <div class="ws-step-card">
                                <div class="ws-step-badge-row">
                                    <span class="ws-step-num">2</span>
                                    <div class="ws-step-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    </div>
                                </div>
                                <h4>Em seguida, é só fazer a instalação</h4>
                                <p>Você pluga o adaptador no veículo e configura no app do cliente.</p>
                            </div>

                            <div class="ws-step-card">
                                <div class="ws-step-badge-row">
                                    <span class="ws-step-num">3</span>
                                    <div class="ws-step-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                                    </div>
                                </div>
                                <h4>O resto é com a gente</h4>
                                <p>A DNA AUTO cuida dos dados, monitoramento, análises e alertas, garantindo a melhor experiência para o seu cliente.</p>
                            </div>

                            <div class="ws-step-card">
                                <div class="ws-step-badge-row">
                                    <span class="ws-step-num">4</span>
                                    <div class="ws-step-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </div>
                                </div>
                                <h4>Você fatura por instalação</h4>
                                <p>Recebe R$ 29,00 por cada equipamento instalado no veículo.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 5. SEÇÃO MAIS LUCRO -->
                <section class="ws-profit-section" id="lucro">
                    <div class="ws-container">
                        <div class="ws-section-header dark">
                            <h2 class="ws-section-title dark">Mais lucro para a sua oficina</h2>
                            <p class="ws-section-subtitle dark">Você vende o equipamento, instala e fatura. O resto é com a DNA AUTO.</p>
                        </div>

                        <div class="ws-profit-cards-grid">
                            <!-- CARD 1: EQUIPAMENTO & LUCRO -->
                            <div class="ws-profit-card">
                                <div class="ws-obd-img-container">
                                    <img src="/img/ws-obd-device.jpg" alt="Equipamento OBD DNA AUTO" class="ws-obd-img" onerror="this.style.display='none'"/>
                                    <div class="ws-obd-tag">
                                        <span class="ws-obd-label">Equipamento OBD</span>
                                        <div class="ws-obd-price">R$ 59,90</div>
                                        <span class="ws-obd-sub">por unidade (custo para a oficina)</span>
                                    </div>
                                </div>

                                <div class="ws-profit-divider"></div>

                                <div class="ws-install-profit-block">
                                    <div class="ws-coin-icon">
                                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M8 12h8"/></svg>
                                    </div>
                                    <div>
                                        <span class="ws-install-sub">Seu lucro por instalação</span>
                                        <div class="ws-install-val">R$ 29,00</div>
                                        <span class="ws-install-hint">por equipamento instalado</span>
                                    </div>
                                </div>

                                <p class="ws-profit-explainer">
                                    A DNA AUTO fornece os equipamentos para sua oficina vender e instalar. O cliente paga apenas uma vez e não tem mensalidades.
                                </p>
                            </div>

                            <!-- CARD 2: RETORNO EM 30 DIAS -->
                            <div class="ws-profit-card ws-card-highlight">
                                <div class="ws-growth-icon">
                                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#0066FF" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                </div>
                                <span class="ws-days-pill">Após 30 dias</span>
                                <div class="ws-growth-percent">+35%</div>
                                <div class="ws-growth-label">de retorno de serviços</div>

                                <p class="ws-growth-text">
                                    Com as manutenções preventivas e alertas gerados pelo sistema, sua oficina registra em média um aumento de 35% no faturamento com serviços de manutenção e troca de peças indicadas pelo sistema.
                                </p>
                            </div>

                            <!-- CARD 3: CONDIÇÕES ESPECIAIS / PLANOS -->
                            <div class="ws-profit-card" id="planos">
                                <div class="ws-special-header">
                                    <div class="ws-dollar-badge">
                                        <span>$</span>
                                    </div>
                                    <h3>Condições especiais para sua oficina</h3>
                                </div>

                                <div class="ws-special-item">
                                    <div class="ws-check-circle">✓</div>
                                    <div>
                                        <strong>Sem mensalidades</strong>
                                        <p>Você não paga nada para usar a plataforma. O sistema é 100% sem mensalidades.</p>
                                    </div>
                                </div>

                                <div class="ws-monthly-plan-box">
                                    <div class="ws-plan-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                    </div>
                                    <div>
                                        <div class="ws-plan-title">Plano com mensalidade reduzida</div>
                                        <p class="ws-plan-desc">Se a sua oficina instalar menos de 5 carros por mês, a mensalidade da plataforma é de apenas</p>
                                        <div class="ws-plan-price">R$ 49,90 <span class="ws-plan-sub">/mês</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 6. PRÉ-FOOTER / BANNER DE PARCERIA -->
                <section class="ws-prefooter-section">
                    <div class="ws-container">
                        <div class="ws-prefooter-card">
                            <div class="ws-prefooter-brand">
                                <div class="ws-logo-icon">
                                    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                                        <path d="M8 8 L24 8 C30 8 34 13 34 20 C34 27 30 32 24 32 L8 32 Z" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M15 15 L23 15 C26 15 28 17 28 20 C28 23 26 25 23 25 L15 25 Z" fill="#00D4FF"/>
                                    </svg>
                                </div>
                                <div class="ws-brand-text">
                                    <span class="ws-brand-title">DNA AUTO</span>
                                    <span class="ws-brand-sub">Tecnologia que fortalece sua oficina.</span>
                                </div>
                            </div>

                            <p class="ws-prefooter-text">
                                Juntos, levamos mais tecnologia, mais clientes e mais resultados para a sua oficina.
                            </p>

                            <button class="ws-btn-cta-pill" onclick="App.switchView('workshop')">
                                <span>Quero ser parceiro da DNA AUTO</span>
                                <span class="ws-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- 7. BOTTOM BAR DE CREDIBILIDADE -->
                <footer class="ws-bottom-bar" id="suporte">
                    <div class="ws-container ws-bottom-grid">
                        <div class="ws-bottom-item">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span>Tecnologia confiável</span>
                        </div>
                        <div class="ws-bottom-item">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                            <span>Suporte especializado</span>
                        </div>
                        <div class="ws-bottom-item">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <span>Parceria de longo prazo</span>
                        </div>
                        <div class="ws-bottom-item">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94A3B8" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            <span>Mais clientes para sua oficina</span>
                        </div>
                    </div>
                </footer>
            </div>
        `;
    }
};

window.LandingWorkshopView = LandingWorkshopView;
