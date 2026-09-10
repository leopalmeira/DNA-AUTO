// ==============================================================================
// DNA AUTO — LANDING EXCLUSIVA PARA PROPRIETÁRIO DE VEÍCULO (/cliente)
// Foco total no dono do carro: Histórico, Manutenções, Gastos e Valorização
// ==============================================================================

const LandingClientView = {
    render() {
        // Atualiza Title e SEO
        document.title = 'DNA AUTO | Tecnologia que fortalece seu veículo';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'Seu carro mais valorizado, mais seguro e sempre em dia. Histórico completo de manutenções, controle de gastos e valorização em até 10%.');
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
            <div class="dna-official-landing cl-landing">
                <!-- 1. NAVBAR -->
                <header class="cl-nav" role="banner">
                    <div class="cl-nav-inner">
                        <a href="/cliente" class="cl-brand" onclick="event.preventDefault(); App.navigateTo('/cliente');">
                            <div class="cl-logo-icon">
                                <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                                    <path d="M8 8 L24 8 C30 8 34 13 34 20 C34 27 30 32 24 32 L8 32 Z" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15 15 L23 15 C26 15 28 17 28 20 C28 23 26 25 23 25 L15 25 Z" fill="#00D4FF"/>
                                </svg>
                            </div>
                            <div class="cl-brand-text">
                                <span class="cl-brand-title">DNA AUTO</span>
                                <span class="cl-brand-sub">Tecnologia que fortalece seu veículo.</span>
                            </div>
                        </a>

                        <nav class="cl-nav-links" aria-label="Navegação do Cliente">
                            <a href="#beneficios" class="cl-nav-item">Benefícios</a>
                            <a href="#como-funciona" class="cl-nav-item">Como funciona</a>
                            <a href="#oficinas" class="cl-nav-item">Rede de oficinas</a>
                            <a href="#planos" class="cl-nav-item">Planos</a>
                        </nav>

                        <div class="cl-nav-actions">
                            <button class="cl-btn-cta-pill" onclick="App.switchView('owner')">
                                <span>Quero meu DNA AUTO</span>
                                <span class="cl-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- 2. HERO SECTION -->
                <section class="cl-hero" id="hero">
                    <div class="cl-container cl-hero-grid">
                        <div class="cl-hero-content">
                            <span class="cl-hero-badge">MAIS QUE UM APP. É O DNA DO SEU CARRO.</span>
                            <h1 class="cl-hero-headline">
                                Seu carro<br>
                                mais valorizado,<br>
                                mais seguro e<br>
                                <span class="cl-text-gradient">sempre em dia.</span>
                            </h1>
                            <p class="cl-hero-desc">
                                Com o DNA AUTO você tem o histórico completo do seu veículo, controla os gastos, recebe alertas de manutenção e ainda valoriza seu carro em até 10%.
                            </p>

                            <div class="cl-hero-cta-wrap">
                                <button class="cl-btn-hero" onclick="App.switchView('owner')">
                                    <span>Quero contratar o DNA AUTO</span>
                                    <span class="cl-arrow">→</span>
                                </button>
                                <div class="cl-price-tag">
                                    <div class="cl-dollar-circle">$</div>
                                    <div class="cl-price-info">
                                        <span class="cl-price-label">Taxa única</span>
                                        <span class="cl-price-val">R$ 59,90</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MOCKUP DO APP + CARRO -->
                        <div class="cl-hero-media">
                            <div class="cl-media-frame">
                                <img src="/img/cl-hero-car-phone.jpg" alt="App DNA AUTO no smartphone e veículo moderno" class="cl-hero-img" onerror="this.src='/img/landing-client-official.jpg'"/>
                            </div>
                        </div>

                        <!-- CARD LATERAL -->
                        <div class="cl-hero-side-card">
                            <div class="cl-side-card-inner">
                                <h3>Conheça o verdadeiro valor do seu carro.</h3>
                                <p>O DNA AUTO cuida hoje para você ter mais valor amanhã.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 3. SEÇÃO BRANCA: O QUE VOCÊ GANHA COM O DNA AUTO -->
                <section class="cl-white-section" id="beneficios">
                    <div class="cl-container">
                        <div class="cl-section-header light">
                            <h2 class="cl-section-title light">
                                O que você ganha com o <span class="cl-text-blue">DNA AUTO?</span>
                            </h2>
                            <p class="cl-section-subtitle light">
                                Tudo o que você precisa para ter controle, segurança e mais valor no seu veículo.
                            </p>
                        </div>

                        <div class="cl-deliverables-grid">
                            <div class="cl-deliv-card">
                                <div class="cl-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                </div>
                                <h3>Valorização do veículo em até 10%</h3>
                                <p>Um histórico completo e atualizado aumenta a confiança na hora da venda.</p>
                            </div>

                            <div class="cl-deliv-card">
                                <div class="cl-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>
                                <h3>Histórico completo de serviços</h3>
                                <p>Tenha em mãos todo o registro de manutenções, peças trocadas e serviços realizados.</p>
                            </div>

                            <div class="cl-deliv-card">
                                <div class="cl-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="5" y1="12" x2="1" y2="12"/><line x1="23" y1="12" x2="19" y2="12"/></svg>
                                </div>
                                <h3>Controle de gastos</h3>
                                <p>Saiba exatamente quanto gastou com seu veículo no semestre e no ano.</p>
                            </div>

                            <div class="cl-deliv-card">
                                <div class="cl-deliv-icon-wrap">
                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0066FF" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                </div>
                                <h3>Alertas e lembretes</h3>
                                <p>O sistema avisa quando chegar a hora de trocar peças, fazer revisões e evitar problemas maiores.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 4. SEÇÃO ESCURA: POR QUE O DNA DO SEU CARRO É TÃO IMPORTANTE? -->
                <section class="cl-dark-section" id="como-funciona">
                    <div class="cl-container">
                        <div class="cl-section-header dark">
                            <h2 class="cl-section-title dark">Por que o DNA do seu carro é tão importante?</h2>
                            <p class="cl-section-subtitle dark">
                                O DNA AUTO registra cada detalhe do seu veículo, criando um histórico confiável que valoriza o seu carro, facilita a manutenção e evita surpresas no futuro.
                            </p>
                        </div>

                        <div class="cl-importance-grid">
                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Mais segurança</h4>
                                    <p>Você sabe o que foi feito e o que ainda precisa ser feito.</p>
                                </div>
                            </div>

                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Mais confiança na revenda</h4>
                                    <p>Com histórico completo, seu carro vale mais.</p>
                                </div>
                            </div>

                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Menos imprevistos</h4>
                                    <p>O sistema avisa sobre manutenções preventivas e corretivas.</p>
                                </div>
                            </div>

                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M8 12h8"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Gastos sob controle</h4>
                                    <p>Veja quanto gasta por mês e por ano.</p>
                                </div>
                            </div>

                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Seu carro sempre em dia</h4>
                                    <p>Manutenção em dia é economia e tranquilidade.</p>
                                </div>
                            </div>

                            <div class="cl-importance-card">
                                <div class="cl-importance-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </div>
                                <div class="cl-importance-info">
                                    <h4>Mais valorização</h4>
                                    <p>Carros com histórico completo são mais valorizados no mercado.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 5. SEÇÃO BRANCA: HISTÓRICO E GASTOS -->
                <section class="cl-white-section" id="gastos">
                    <div class="cl-container">
                        <div class="cl-section-header light">
                            <h2 class="cl-section-title light">Histórico e gastos: seu carro em números</h2>
                            <p class="cl-section-subtitle light">
                                Acompanhe tudo o que foi feito e quanto você gastou, com relatórios simples e objetivos.
                            </p>
                        </div>

                        <div class="cl-finance-grid">
                            <!-- CARD SEMESTRE -->
                            <div class="cl-finance-card">
                                <div class="cl-finance-card-head">
                                    <div class="cl-cal-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </div>
                                    <div>
                                        <div class="cl-finance-title">Gastos por semestre</div>
                                        <div class="cl-finance-val">R$ 1.284,50</div>
                                        <div class="cl-finance-sub">Últimos 6 meses</div>
                                    </div>
                                </div>

                                <div class="cl-finance-list">
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">⚙️</div>
                                        <span class="cl-item-label">Revisões e manutenções</span>
                                        <span class="cl-item-val">R$ 620,00</span>
                                    </div>
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">🔧</div>
                                        <span class="cl-item-label">Peças e reposições</span>
                                        <span class="cl-item-val">R$ 412,30</span>
                                    </div>
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">📋</div>
                                        <span class="cl-item-label">Serviços diversos</span>
                                        <span class="cl-item-val">R$ 252,20</span>
                                    </div>
                                </div>
                            </div>

                            <!-- CARD ANO -->
                            <div class="cl-finance-card">
                                <div class="cl-finance-card-head">
                                    <div class="cl-cal-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </div>
                                    <div>
                                        <div class="cl-finance-title">Gastos por ano</div>
                                        <div class="cl-finance-val">R$ 2.487,90</div>
                                        <div class="cl-finance-sub">Últimos 12 meses</div>
                                    </div>
                                </div>

                                <div class="cl-finance-list">
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">⚙️</div>
                                        <span class="cl-item-label">Revisões e manutenções</span>
                                        <span class="cl-item-val">R$ 1.210,00</span>
                                    </div>
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">🔧</div>
                                        <span class="cl-item-label">Peças e reposições</span>
                                        <span class="cl-item-val">R$ 948,50</span>
                                    </div>
                                    <div class="cl-finance-item">
                                        <div class="cl-item-icon">📋</div>
                                        <span class="cl-item-label">Serviços diversos</span>
                                        <span class="cl-item-val">R$ 329,40</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 6. SEÇÃO ESCURA: REDE DE OFICINAS CREDENCIADAS -->
                <section class="cl-network-section" id="oficinas">
                    <div class="cl-container">
                        <div class="cl-section-header dark">
                            <h2 class="cl-section-title dark">Rede de oficinas <span class="cl-text-cyan">credenciadas</span></h2>
                            <p class="cl-section-subtitle dark">
                                Conte com uma rede de oficinas credenciadas e de confiança, prontas para atender seu veículo com qualidade, transparência e o histórico completo do seu carro.
                            </p>
                        </div>

                        <div class="cl-network-grid">
                            <div class="cl-network-badges-col">
                                <div class="cl-network-badge-item">
                                    <div class="cl-net-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                                    </div>
                                    <div class="cl-net-text">
                                        <h4>Oficinas verificadas e credenciadas</h4>
                                    </div>
                                </div>

                                <div class="cl-network-badge-item">
                                    <div class="cl-net-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    </div>
                                    <div class="cl-net-text">
                                        <h4>Atendimento especializado para a sua marca e modelo</h4>
                                    </div>
                                </div>

                                <div class="cl-network-badge-item">
                                    <div class="cl-net-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    </div>
                                    <div class="cl-net-text">
                                        <h4>Serviços com garantia e nota fiscal</h4>
                                    </div>
                                </div>
                            </div>

                            <!-- CARD DE OFICINA COM FOTO -->
                            <div class="cl-network-photo-card">
                                <img src="/img/cl-workshop-network.jpg" alt="Oficina mecânica credenciada DNA AUTO" class="cl-network-img" onerror="this.src='/img/landing-client-official.jpg'"/>
                                <div class="cl-network-card-overlay">
                                    <h4>Seu carro em boas mãos, em qualquer lugar.</h4>
                                    <button class="cl-btn-network" onclick="App.switchView('owner')">
                                        <span>Ver rede de oficinas</span>
                                        <span class="cl-arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 7. PRÉ-FOOTER / TAXA ÚNICA E BENEFÍCIOS -->
                <section class="cl-prefooter-section" id="planos">
                    <div class="cl-container">
                        <div class="cl-prefooter-card">
                            <div class="cl-prefooter-brand">
                                <div class="cl-logo-icon">
                                    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                                        <path d="M8 8 L24 8 C30 8 34 13 34 20 C34 27 30 32 24 32 L8 32 Z" stroke="#0066FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M15 15 L23 15 C26 15 28 17 28 20 C28 23 26 25 23 25 L15 25 Z" fill="#00D4FF"/>
                                    </svg>
                                </div>
                                <div class="cl-brand-text">
                                    <span class="cl-brand-title">DNA AUTO</span>
                                    <span class="cl-brand-sub">Tecnologia que fortalece seu veículo.</span>
                                </div>
                            </div>

                            <div class="cl-prefooter-price-block">
                                <span class="cl-prefooter-price-sub">Tudo isso por apenas</span>
                                <div class="cl-prefooter-price-val">R$ 59,90</div>
                                <span class="cl-prefooter-price-hint">Taxa única pelo sistema.</span>
                            </div>

                            <div class="cl-prefooter-checks">
                                <div class="cl-check-item">
                                    <span class="cl-check-sym">✓</span>
                                    <span>Sem mensalidades</span>
                                </div>
                                <div class="cl-check-item">
                                    <span class="cl-check-sym">✓</span>
                                    <span>Sem taxas escondidas</span>
                                </div>
                                <div class="cl-check-item">
                                    <span class="cl-check-sym">✓</span>
                                    <span>Sem fidelidade</span>
                                </div>
                            </div>

                            <button class="cl-btn-cta-pill" onclick="App.switchView('owner')">
                                <span>Quero meu DNA AUTO</span>
                                <span class="cl-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- 8. BOTTOM BAR DE CREDIBILIDADE -->
                <footer class="cl-bottom-bar">
                    <div class="cl-container cl-bottom-inner">
                        <div class="cl-bottom-tags">
                            <div class="cl-bottom-item">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                <span>Mais segurança</span>
                            </div>
                            <div class="cl-bottom-item">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                <span>Mais valor</span>
                            </div>
                            <div class="cl-bottom-item">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                <span>Mais controle</span>
                            </div>
                            <div class="cl-bottom-item">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                <span>Mais tranquilidade</span>
                            </div>
                        </div>

                        <div class="cl-bottom-motto">
                            <span class="cl-motto-bold">DNA AUTO</span>
                            <span class="cl-motto-text">Seu carro. Nosso compromisso.</span>
                        </div>
                    </div>
                </footer>
            </div>
        `;
    }
};

window.LandingClientView = LandingClientView;
