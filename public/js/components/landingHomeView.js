const LandingHomeView = {
    render() {
        document.title = 'DNA AUTO | O histórico do seu carro';
        document.querySelector('meta[name="description"]')?.setAttribute(
            'content', 'Acompanhe serviços, comprovantes e próximas revisões do seu carro com o DNA AUTO.'
        );

        const container = document.getElementById('view-content');
        if (!container) return;

        for (const selector of ['.sidebar', '.top-navbar', '#sidebar-backdrop']) {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
        }

        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';

        container.innerHTML = `
            <style>
                .dna-home {
                    --surface: #0d1b32;
                    --line: #243953;
                    --ink: #f3f7ff;
                    --muted: #afc2da;
                    --accent: #7ecaff;
                    background: #071122;
                    color: var(--ink);
                    font: 400 16px/1.6 system-ui, sans-serif;
                    width: 100%;
                    min-height: 100vh;
                }
                .dna-home *, .dna-home *::before, .dna-home *::after { box-sizing: border-box; }
                .dna-home :is(h1,h2,h3,p,figure,ol) { margin: 0; }
                .dna-home a { color: inherit; text-decoration: none; }
                .dna-home a:focus-visible, .dna-home summary:focus-visible {
                    outline: 2px solid var(--accent);
                    outline-offset: 5px;
                }
                .dna-home .home-wrap { width: min(1160px, calc(100% - 48px)); margin-inline: auto; }
                .dna-home .home-header { border-bottom: 1px solid var(--line); }
                .dna-home .home-header .home-wrap,
                .dna-home .home-footer .home-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px 26px;
                    padding-block: 18px;
                }
                .dna-home .home-brand { display: inline-flex; align-items: center; gap: 9px; font-weight: 800; }
                .dna-home .home-brand img { width: 36px; height: 36px; object-fit: contain; }
                .dna-home .home-links { display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center; font-size: .875rem; }
                .dna-home .home-links a { padding-block: 7px; }
                .dna-home .home-links a:hover { color: var(--accent); }
                .dna-home .home-hero-area { background: radial-gradient(ellipse at 76% 42%, #132c51, #071122 67%); }
                .dna-home .home-hero-grid, .dna-home .home-workshop {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: clamp(28px, 5vw, 72px);
                }
                .dna-home .home-hero-grid { padding-block: clamp(48px, 7vw, 100px); }
                .dna-home h1 { font-size: clamp(2.4rem, 5vw, 4.6rem); line-height: 1.02; letter-spacing: -.065em; }
                .dna-home h1 span { color: var(--accent); }
                .dna-home h2 { font-size: clamp(1.8rem, 3.5vw, 2.9rem); line-height: 1.12; letter-spacing: -.045em; }
                .dna-home h3 { font-size: 1.08rem; line-height: 1.35; }
                .dna-home .home-copy { color: var(--muted); margin-top: 16px; max-width: 54ch; }
                .dna-home .home-hero-grid .home-copy { font-size: 1.08rem; }
                .dna-home .home-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
                .dna-home .home-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 48px;
                    padding: 10px 17px;
                    border: 1px solid #3b5577;
                    border-radius: 9px;
                    font-size: .89rem;
                    font-weight: 720;
                    background: #0c1930;
                    text-align: center;
                }
                .dna-home .home-cta:hover { background: #172e50; }
                .dna-home .home-cta-primary { background: #1555d2; border-color: #568bfb; }
                .dna-home .home-cta-primary:hover { background: #1b63e6; }
                .dna-home .home-preview {
                    padding: 16px;
                    border: 1px solid #2e4870;
                    border-radius: 22px;
                    background: #0b172c;
                    box-shadow: 0 18px 48px #02081478;
                }
                .dna-home .home-preview figcaption {
                    padding: 0 4px 12px;
                    color: var(--muted);
                    font-size: .79rem;
                }
                .dna-home .home-vehicle {
                    min-height: 174px;
                    display: flex;
                    align-items: end;
                    padding: 16px;
                    border-radius: 11px;
                    background: linear-gradient(0deg, #071122f2, transparent 60%),
                        url('/img/splash-car-hero.jpg') center 43% / cover;
                }
                .dna-home .home-record, .dna-home .home-next {
                    padding: 14px 16px;
                    border: 1px solid var(--line);
                    border-radius: 11px;
                    margin-top: 10px;
                    background: var(--surface);
                }
                .dna-home .home-record p, .dna-home .home-next p { color: var(--muted); font-size: .84rem; }
                .dna-home .home-next strong { color: var(--accent); font-size: .93rem; }
                .dna-home .home-section { padding-block: clamp(42px, 6vw, 78px); border-top: 1px solid var(--line); }
                .dna-home .home-steps {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    list-style: none;
                    padding: 0;
                    margin-top: 24px;
                    counter-reset: home-step;
                }
                .dna-home .home-steps li {
                    padding: 20px;
                    border: 1px solid var(--line);
                    border-radius: 12px;
                    background: var(--surface);
                    counter-increment: home-step;
                }
                .dna-home .home-steps li::before {
                    content: counter(home-step, decimal-leading-zero);
                    display: block;
                    color: var(--accent);
                    font-weight: 750;
                    margin-bottom: 10px;
                }
                .dna-home .home-steps p { color: var(--muted); margin-top: 8px; }
                .dna-home .home-workshop img {
                    display: block;
                    width: 100%;
                    max-height: 290px;
                    object-fit: cover;
                    object-position: center 35%;
                    border-radius: 14px;
                }
                .dna-home .home-faq { max-width: 790px; }
                .dna-home .home-faq h2 { margin-bottom: 24px; }
                .dna-home .home-faq details { padding: 14px 0; border-bottom: 1px solid var(--line); }
                .dna-home .home-faq summary { cursor: pointer; font-weight: 650; }
                .dna-home .home-faq p { color: var(--muted); padding-top: 9px; }
                .dna-home .home-faq a { color: var(--accent); text-decoration: underline; }
                .dna-home .home-footer { border-top: 1px solid var(--line); color: var(--muted); font-size: .875rem; }
                @media (max-width: 760px) {
                    .dna-home .home-wrap { width: calc(100% - 32px); }
                    .dna-home .home-hero-grid, .dna-home .home-workshop, .dna-home .home-steps { grid-template-columns: 1fr; }
                    .dna-home .home-links { gap: 4px 16px; }
                }
                @media (max-width: 440px) {
                    .dna-home .home-actions .home-cta { width: 100%; }
                }
            </style>
            <div class="dna-home">
                <header class="home-header">
                    <div class="home-wrap">
                        <a class="home-brand" href="/">
                            <img src="/img/splash-d-logo.png" width="36" height="36" alt="">
                            <span>DNA AUTO</span>
                        </a>
                        <nav class="home-links" aria-label="Navegação principal">
                            <a href="#como-funciona">Como funciona</a>
                            <a href="#oficinas">Para oficinas</a>
                            <a href="/oficina">Entrar no painel</a>
                        </nav>
                    </div>
                </header>
                <main>
                    <section class="home-hero-area" aria-labelledby="home-title">
                        <div class="home-wrap home-hero-grid">
                            <div>
                                <h1 id="home-title">O histórico do seu carro, <span>na palma da mão.</span></h1>
                                <p class="home-copy">A oficina registra a manutenção. Você acompanha os serviços, consulta fotos e notas fiscais anexadas e sabe quando chega a próxima revisão.</p>
                                <div class="home-actions">
                                    <a class="home-cta home-cta-primary" href="/cliente">Baixar app do motorista</a>
                                    <a class="home-cta" href="/parceiro">Conhecer a parceria</a>
                                </div>
                            </div>
                            <figure class="home-preview">
                                <figcaption>Histórico do veículo · Exemplo ilustrativo</figcaption>
                                <div class="home-vehicle"><h2>Meu carro</h2></div>
                                <div class="home-record">
                                    <h3>Troca de óleo e filtro</h3>
                                    <p>Registrada pela oficina aos 82.000 km</p>
                                    <p>Foto e nota fiscal anexadas</p>
                                </div>
                                <div class="home-next">
                                    <strong>Próxima troca de óleo</strong>
                                    <p>Programada para 92.000 km neste exemplo</p>
                                </div>
                            </figure>
                        </div>
                    </section>
                    <section class="home-section" id="como-funciona">
                        <div class="home-wrap">
                            <h2>Da oficina ao seu celular</h2>
                            <ol class="home-steps">
                                <li><h3>Faça a manutenção</h3><p>Leve o carro à sua oficina parceira para o atendimento.</p></li>
                                <li><h3>A oficina registra o serviço</h3><p>O registro inclui o trabalho realizado, a quilometragem e os comprovantes enviados.</p></li>
                                <li><h3>Acompanhe no app</h3><p>Consulte o histórico do veículo e confira as próximas revisões.</p></li>
                            </ol>
                        </div>
                    </section>
                    <section class="home-section" id="oficinas">
                        <div class="home-wrap home-workshop">
                            <div>
                                <h2>Registre o serviço de hoje e ajude o cliente a voltar na hora certa.</h2>
                                <p class="home-copy">Organize os atendimentos da sua oficina e disponibilize o histórico para o cliente consultar pelo celular.</p>
                                <div class="home-actions">
                                    <a class="home-cta home-cta-primary" href="/parceiro">Conhecer a parceria para oficinas</a>
                                </div>
                            </div>
                            <img src="/img/ws-hero-mechanic.jpg" alt="Profissional da oficina consultando um tablet ao lado do veículo" width="265" height="217" loading="lazy">
                        </div>
                    </section>
                    <section class="home-section">
                        <div class="home-wrap home-faq">
                            <h2>Perguntas frequentes</h2>
                            <details>
                                <summary>Minha oficina já me cadastrou. Como entro?</summary>
                                <p>Abra o app do motorista e use o e-mail informado no cadastro. Se precisar recuperar o acesso, fale com o <a href="mailto:suporte@dnaauto.com.br">suporte do DNA AUTO</a>.</p>
                            </details>
                            <details>
                                <summary>O que consigo consultar no app?</summary>
                                <p>Os serviços registrados, a quilometragem, as próximas revisões e os comprovantes anexados aos atendimentos.</p>
                            </details>
                            <details>
                                <summary>Como minha oficina participa e onde vejo as condições?</summary>
                                <p>Consulte a <a href="/parceiro">página de parceria para oficinas</a> para conhecer as condições comerciais e solicitar atendimento.</p>
                            </details>
                        </div>
                    </section>
                </main>
                <footer class="home-footer">
                    <div class="home-wrap">
                        <span>© ${new Date().getFullYear()} DNA AUTO</span>
                        <nav class="home-links" aria-label="Links do rodapé">
                            <a href="mailto:suporte@dnaauto.com.br">Suporte</a>
                            <a href="/cliente">App do motorista</a>
                            <a href="/oficina">Painel da oficina</a>
                        </nav>
                    </div>
                </footer>
            </div>
        `;

        const sectionId = window.location.hash.slice(1);
        if (['como-funciona', 'oficinas'].includes(sectionId)) {
            document.getElementById(sectionId)?.scrollIntoView();
        }
    }
};

window.LandingHomeView = LandingHomeView;
