const LandingHomeView = {
    audience: 'oficina',

    render() {
        const workshop = this.audience === 'oficina';
        document.title = workshop ? 'DNA AUTO | Para oficinas' : 'DNA AUTO | O histórico do seu carro';
        document.querySelector('meta[name="description"]')?.setAttribute(
            'content', workshop
                ? 'Registre os serviços da sua oficina, compartilhe comprovantes e ajude seus clientes a acompanhar as próximas revisões.'
                : 'Acompanhe serviços, comprovantes e próximas revisões do seu carro com o DNA AUTO.'
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
                .dna-home .home-audience {
                    display: inline-flex;
                    gap: 4px;
                    padding: 4px;
                    background: var(--surface);
                    border: 1px solid var(--line);
                    border-radius: 11px;
                }
                .dna-home .home-audience button {
                    min-height: 44px;
                    padding: 6px 14px;
                    border: 1px solid transparent;
                    border-radius: 7px;
                    background: transparent;
                    color: var(--muted);
                    font: inherit;
                    font-size: .875rem;
                    font-weight: 700;
                    cursor: pointer;
                }
                .dna-home .home-audience button:hover { color: var(--ink); }
                .dna-home .home-audience button[aria-pressed="true"] {
                    background: #1555d2;
                    border-color: #568bfb;
                    color: #fff;
                }
                .dna-home .home-audience button:focus-visible {
                    outline: 2px solid var(--accent);
                    outline-offset: 2px;
                }
                .dna-home .home-links { display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center; font-size: .875rem; }
                .dna-home .home-links a { padding-block: 7px; }
                .dna-home .home-links a:hover { color: var(--accent); }
                .dna-home .home-hero-area { background: radial-gradient(ellipse at 76% 42%, #132c51, #071122 67%); }
                .dna-home .home-hero-grid {
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
                .dna-home .home-workshop-photo {
                    display: block;
                    width: 100%;
                    height: clamp(180px, 24vw, 290px);
                    object-fit: cover;
                    object-position: center 35%;
                    border-radius: 14px;
                }
                .dna-home .home-conversion {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 24px;
                    padding: clamp(24px, 5vw, 56px);
                    border: 1px solid #35547d;
                    border-radius: 22px;
                    background: radial-gradient(ellipse at 85% 0%, #17396b, #101f38 75%);
                }
                .dna-home .home-cta span { margin-left: 10px; }
                .dna-home .home-hero-workshop {
                    background: radial-gradient(ellipse at 82% 25%, #1b4273, #071122 70%);
                }
                .dna-home .home-hero-workshop .home-workshop-photo { object-position: 50% 37%; }
                .dna-home .home-faq { max-width: 790px; }
                .dna-home .home-faq h2 { margin-bottom: 24px; }
                .dna-home .home-faq details { padding: 14px 0; border-bottom: 1px solid var(--line); }
                .dna-home .home-faq summary { cursor: pointer; font-weight: 650; }
                .dna-home .home-faq p { color: var(--muted); padding-top: 9px; }
                .dna-home .home-faq a { color: var(--accent); text-decoration: underline; }
                .dna-home .home-footer { border-top: 1px solid var(--line); color: var(--muted); font-size: .875rem; }
                @media (max-width: 760px) {
                    .dna-home .home-wrap { width: calc(100% - 32px); }
                    .dna-home .home-hero-grid, .dna-home .home-steps, .dna-home .home-conversion { grid-template-columns: 1fr; }
                    .dna-home .home-conversion .home-cta { justify-self: start; }
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
                        <div class="home-audience" role="group" aria-label="Escolha seu perfil">
                            <button type="button" data-home-audience="oficina" aria-pressed="${workshop}">Oficina</button>
                            <button type="button" data-home-audience="motorista" aria-pressed="${!workshop}">Motorista</button>
                        </div>
                    </div>
                </header>
                <main>
                    ${workshop ? `
                    <section class="home-hero-area home-hero-workshop" aria-labelledby="home-title">
                        <div class="home-wrap home-hero-grid">
                            <div>
                                <h1 id="home-title">Dê ao cliente um motivo para <span>voltar à sua oficina.</span></h1>
                                <p class="home-copy">Entregue um histórico digital de cada serviço. Com fotos, notas fiscais e a próxima revisão no celular, o cliente sabe o que foi feito e quando voltar.</p>
                                <div class="home-actions">
                                    <a class="home-cta home-cta-primary" href="/parceiro">Quero ser oficina parceira <span aria-hidden="true">→</span></a>
                                    <a class="home-cta" href="/oficina">Entrar no painel</a>
                                </div>
                            </div>
                            <figure class="home-preview">
                                <figcaption>Exemplo de registro de serviço</figcaption>
                                <img class="home-workshop-photo" src="/img/ws-hero-mechanic.jpg" alt="Profissional da oficina consultando um tablet ao lado do veículo" width="265" height="217">
                                <div class="home-record">
                                    <h3>Troca de óleo e filtro</h3>
                                    <p>Serviço realizado aos 82.000 km</p>
                                    <p>Foto e nota fiscal anexadas</p>
                                </div>
                                <div class="home-next">
                                    <strong>Próxima troca prevista aos 92.000 km</strong>
                                    <p>O motorista acompanha a previsão no app.</p>
                                </div>
                            </figure>
                        </div>
                    </section>
                    <section class="home-section" id="como-funciona">
                        <div class="home-wrap">
                            <h2>O atendimento acaba. O histórico fica.</h2>
                            <p class="home-copy">Da entrada do veículo à próxima revisão, veja como o DNA AUTO encaixa na rotina da oficina.</p>
                            <ol class="home-steps">
                                <li><h3>Identifique o veículo</h3><p>Localize o carro pela placa e registre o atendimento no painel.</p></li>
                                <li><h3>Documente o serviço</h3><p>Informe o que foi feito, registre a quilometragem e anexe fotos e nota fiscal quando disponíveis.</p></li>
                                <li><h3>Oriente a próxima visita</h3><p>Com o histórico no app, o motorista pode consultar o último serviço e se planejar para a próxima revisão.</p></li>
                            </ol>
                        </div>
                    </section>
                    <section class="home-section">
                        <div class="home-wrap home-conversion">
                            <div>
                                <h2>O cliente leva o carro. Sua oficina fica no histórico.</h2>
                                <p class="home-copy">Conheça as condições para integrar sua oficina ao DNA AUTO e começar a registrar atendimentos.</p>
                            </div>
                            <a class="home-cta home-cta-primary" href="/parceiro">Quero ser oficina parceira <span aria-hidden="true">→</span></a>
                        </div>
                    </section>
                    <section class="home-section">
                        <div class="home-wrap home-faq">
                            <h2>Dúvidas antes de começar?</h2>
                            <details>
                                <summary>Como faço para minha oficina participar?</summary>
                                <p>Veja as condições comerciais e os canais de atendimento na <a href="/parceiro">página de parceria</a>.</p>
                            </details>
                            <details>
                                <summary>O que o cliente vê depois do atendimento?</summary>
                                <p>O cliente consulta o serviço registrado e os comprovantes adicionados ao histórico do veículo.</p>
                            </details>
                            <details>
                                <summary>Minha oficina já usa o DNA AUTO. Onde entro?</summary>
                                <p>Acesse o <a href="/oficina">painel da oficina</a> com a conta usada no cadastro.</p>
                            </details>
                        </div>
                    </section>
                    ` : `
                    <section class="home-hero-area" aria-labelledby="home-title">
                        <div class="home-wrap home-hero-grid">
                            <div>
                                <h1 id="home-title">Saiba o que já foi feito <span>e quando revisar de novo.</span></h1>
                                <p class="home-copy">Consulte a última troca de óleo, confira os comprovantes enviados pela oficina e acompanhe as próximas revisões do seu carro pelo DNA AUTO.</p>
                                <div class="home-actions">
                                    <a class="home-cta home-cta-primary" href="/cliente">Baixar app do motorista</a>
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
                    <section class="home-section">
                        <div class="home-wrap home-conversion">
                            <div>
                                <h2>Seu histórico vai com você.</h2>
                                <p class="home-copy">Acesse o app para consultar os serviços registrados pelas oficinas parceiras.</p>
                            </div>
                            <a class="home-cta home-cta-primary" href="/cliente">Baixar app do motorista <span aria-hidden="true">→</span></a>
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
                        </div>
                    </section>
                    `}
                </main>
                <footer class="home-footer">
                    <div class="home-wrap">
                        <span>© ${new Date().getFullYear()} DNA AUTO</span>
                        <nav class="home-links" aria-label="Links do rodapé">
                            <a href="mailto:suporte@dnaauto.com.br">Suporte</a>
                            ${workshop ? '<a href="/oficina">Painel da oficina</a>' : '<a href="/cliente">App do motorista</a>'}
                        </nav>
                    </div>
                </footer>
            </div>
        `;

        for (const button of container.querySelectorAll('[data-home-audience]')) {
            button.addEventListener('click', () => {
                const audience = button.dataset.homeAudience;
                if (audience === this.audience) return;

                this.audience = audience;
                this.render();
                container.querySelector('[data-home-audience][aria-pressed="true"]')?.focus();
            });
        }

        const sectionId = window.location.hash.slice(1);
        if (sectionId === 'como-funciona') {
            document.getElementById(sectionId)?.scrollIntoView();
        }
    }
};

window.LandingHomeView = LandingHomeView;
