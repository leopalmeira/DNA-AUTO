// ==============================================================================
// DNA AUTO — HOME / PORTA DE ENTRADA DO SISTEMA (/)
// Função: Apresentar o DNA AUTO, identificar os dois públicos e direcionar
// cada um rapidamente para sua landing exclusiva (/cliente ou /autocente)
// ==============================================================================

const LandingHomeView = {
    render() {
        // Atualiza Title e Meta SEO
        document.title = 'DNA AUTO | Tecnologia para veículos e oficinas';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'Uma plataforma criada para facilitar a manutenção dos veículos e ajudar oficinas a se relacionarem melhor com seus clientes.');
        }

        // Esconde sidebar e header legado da aplicação interna
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
            <div class="dna-landing-page landing-home-page">
                <!-- HEADER SIMPLES DA HOME -->
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

                        <nav class="dna-nav-links" role="navigation" aria-label="Navegação Principal">
                            <a href="/cliente" class="dna-nav-link" onclick="event.preventDefault(); App.navigateTo('/cliente');">
                                Cliente
                            </a>
                            <a href="/autocente" class="dna-nav-link" onclick="event.preventDefault(); App.navigateTo('/autocente');">
                                Oficina / Auto Center
                            </a>
                        </nav>
                    </div>
                </header>

                <!-- HERO PRINCIPAL & CARDS DE ESCOLHA DE PERFIL -->
                <main class="home-hero" role="main">
                    <div class="dna-section-container">
                        <h1 class="home-headline">
                            Inteligência para cuidar do seu carro e transformar manutenção em oportunidade.
                        </h1>
                        <p class="home-subheadline">
                            Uma plataforma criada para facilitar a manutenção dos veículos e ajudar oficinas a se relacionarem melhor com seus clientes.
                        </p>

                        <div class="home-cards-grid">
                            <!-- CARD 1: CLIENTE -->
                            <article class="home-profile-card client" onclick="App.navigateTo('/cliente')">
                                <div class="home-card-icon" aria-hidden="true">🚗</div>
                                <h2 class="home-card-title">Sou dono de carro</h2>
                                <p class="home-card-text">
                                    Quero acompanhar meu veículo e suas manutenções.
                                </p>
                                <a href="/cliente" class="dna-btn dna-btn-primary" onclick="event.preventDefault(); App.navigateTo('/cliente');">
                                    <span>Entrar como cliente</span>
                                    <span aria-hidden="true">→</span>
                                </a>
                            </article>

                            <!-- CARD 2: OFICINA -->
                            <article class="home-profile-card workshop" onclick="App.navigateTo('/autocente')">
                                <div class="home-card-icon" aria-hidden="true">🔧</div>
                                <h2 class="home-card-title">Sou dono de oficina</h2>
                                <p class="home-card-text">
                                    Quero gerenciar meus clientes e oportunidades de manutenção.
                                </p>
                                <a href="/autocente" class="dna-btn dna-btn-primary" onclick="event.preventDefault(); App.navigateTo('/autocente');">
                                    <span>Entrar como oficina</span>
                                    <span aria-hidden="true">→</span>
                                </a>
                            </article>
                        </div>
                    </div>
                </main>

                <!-- FOOTER DISCRETO -->
                <footer class="dna-footer">
                    <div class="dna-section-container">
                        <p>© 2026 DNA AUTO. Tecnologia e inteligência para o ecossistema automotivo.</p>
                    </div>
                </footer>
            </div>
        `;
    }
};

window.LandingHomeView = LandingHomeView;
