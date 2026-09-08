// ==============================================================================
// DNA AUTO — LANDING PAGE OFICIAL DE ALTA CONVERSÃO
// Oferta: Histórico Completo e Permanente do Carro por R$ 59,90
// ==============================================================================

const LandingView = {
    render() {
        // Ajusta overflow e layout
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';

        const sidebar = document.querySelector('.sidebar');
        const topbar = document.querySelector('.top-navbar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="landing-page-root">
                <!-- TOPBAR DA LANDING PAGE -->
                <header class="landing-navbar">
                    <div class="landing-nav-container">
                        <div class="landing-brand" onclick="LandingView.render()">
                            <div class="landing-brand-logo">
                                <svg viewBox="0 0 120 120" width="28" height="28" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" stroke-width="7" />
                                    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="8" />
                                    <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" stroke-width="8" />
                                    <path d="M 28 70 C 21 52 23 27 36 14 C 50 1 78 1 91 14 C 103 27 105 52 98 70" stroke-width="8" />
                                    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="9" />
                                </svg>
                            </div>
                            <div class="landing-brand-title">
                                <span>DNA <strong style="color:#FFD21C;">AUTO</strong></span>
                                <small>Passaporte Digital Veicular</small>
                            </div>
                        </div>

                        <nav class="landing-nav-links">
                            <a href="#como-funciona" class="landing-nav-link">Como Funciona</a>
                            <a href="#o-que-inclui" class="landing-nav-link">O que está incluso</a>
                            <a href="#consulta-placa" class="landing-nav-link">Consultar Placa</a>
                            <a href="#para-oficinas" class="landing-nav-link">Para Oficinas</a>
                        </nav>

                        <div class="landing-nav-actions">
                            <button class="landing-btn-ghost" onclick="App.switchView('login')">
                                Entrar
                            </button>
                            <button class="landing-btn-gold" onclick="LandingView.goToRegister()">
                                Garantir DNA (R$ 59,90)
                            </button>
                        </div>
                    </div>
                </header>

                <!-- HERO SECTION LUXO AUTOMOTIVO -->
                <section class="landing-hero">
                    <div class="landing-hero-overlay"></div>
                    <div class="landing-hero-content">
                        <div class="landing-badge-pill">
                            <span class="pulse-dot"></span>
                            <span>CERTIFICAÇÃO PERMANENTE DE HISTÓRICO VEICULAR</span>
                        </div>

                        <h1 class="landing-hero-title">
                            O Histórico Completo do Seu Carro por apenas <span class="landing-gold-highlight">R$ 59,90</span>
                        </h1>

                        <p class="landing-hero-subtitle">
                            Cada troca de óleo, correia dentada, freios, quilometragem real, fotos de peças substituídas e notas fiscais gravadas para sempre. Valorize seu veículo em até 15% na hora da revenda.
                        </p>

                        <div class="landing-hero-cta-row">
                            <button class="landing-btn-primary-hero" onclick="LandingView.goToRegister()">
                                <span style="font-size:18px;">⭐</span>
                                <span>Ativar DNA do Meu Carro — R$ 59,90</span>
                                <span class="landing-cta-arrow">→</span>
                            </button>
                            <button class="landing-btn-secondary-hero" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                                <span>🔎 Ver Dossiê Demo (Civic Touring)</span>
                            </button>
                        </div>

                        <div class="landing-hero-features-strip">
                            <div class="landing-strip-item">
                                <span class="landing-strip-icon">🛡️</span>
                                <span>Pagamento Único Vitalício</span>
                            </div>
                            <div class="landing-strip-item">
                                <span class="landing-strip-icon">🛢️</span>
                                <span>Histórico de Óleo & Correias</span>
                            </div>
                            <div class="landing-strip-item">
                                <span class="landing-strip-icon">📲</span>
                                <span>Alertas de Revisão no WhatsApp</span>
                            </div>
                            <div class="landing-strip-item">
                                <span class="landing-strip-icon">📈</span>
                                <span>Valorização Superior à FIPE</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO 2: CONSULTA RÁPIDA DE PLACA INTERATIVA -->
                <section class="landing-section" id="consulta-placa" style="background:#090e18; border-top:1px solid rgba(255,210,28,0.15); border-bottom:1px solid rgba(255,210,28,0.15);">
                    <div class="landing-container">
                        <div class="landing-section-header">
                            <span class="landing-section-tag">SIMULADOR AO VIVO</span>
                            <h2>Consulte o DNA de um Veículo Agora</h2>
                            <p>Digite a placa de um carro para ver como o histórico digital e laudo oficial são apresentados.</p>
                        </div>

                        <div class="landing-search-card">
                            <form onsubmit="LandingView.handleSearchPlate(event)" class="landing-search-form">
                                <div class="landing-plate-input-wrapper">
                                    <div class="landing-plate-flag">
                                        <span>BRASIL</span>
                                    </div>
                                    <input type="text" id="landing-plate-input" placeholder="Ex: BRA2E19" maxlength="8" class="landing-plate-input" />
                                </div>
                                <button type="submit" class="landing-search-submit">
                                    <span>Verificar Histórico</span>
                                    <span style="font-size:16px;">🔍</span>
                                </button>
                            </form>

                            <div class="landing-search-examples">
                                <span>Placas de demonstração da rede:</span>
                                <button type="button" class="landing-example-tag" onclick="LandingView.fillPlate('BRA2E19')">
                                    BRA2E19 (Civic 360° - Score 94)
                                </button>
                                <button type="button" class="landing-example-tag" onclick="LandingView.fillPlate('ABC1D23')">
                                    ABC1D23 (Corolla)
                                </button>
                                <button type="button" class="landing-example-tag" onclick="LandingView.fillPlate('STR1A99')">
                                    STR1A99 (Strada - Sem DNA)
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO 3: O QUE ESTÁ INCLUSO POR R$ 59,90 -->
                <section class="landing-section" id="o-que-inclui">
                    <div class="landing-container">
                        <div class="landing-section-header">
                            <span class="landing-section-tag">TUDO QUE VOCÊ PRECISA</span>
                            <h2>Todas as Atividades e Ocorrências do Veículo em Um Só Lugar</h2>
                            <p>Por apenas R$ 59,90 (sem mensalidades), você protege o seu patrimônio com a tecnologia usada pelas maiores redes automotivas.</p>
                        </div>

                        <div class="landing-grid-cards">
                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#FFD21C; background:rgba(255,210,28,0.1);">🛢️</div>
                                <h3>Trocas de Óleo & Lubrificação</h3>
                                <p>Registro milimétrico de quilometragem, especificações técnicas do óleo utilizado (ex: 0W-20 Sintético) e filtros substituídos.</p>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#ef4444; background:rgba(239,68,68,0.1);">⚙️</div>
                                <h3>Correia Dentada & Tensores</h3>
                                <p>Histórico completo das revisões preventivas mais críticas do motor. Evite surpresas e quebras catastróficas.</p>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#38bdf8; background:rgba(56,189,248,0.1);">🛑</div>
                                <h3>Freios & Suspensão</h3>
                                <p>Acompanhe troca de pastilhas de cerâmica, discos, amortecedores e sangria do fluido de freio com laudo de frenagem.</p>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#10b981; background:rgba(16,185,129,0.1);">📸</div>
                                <h3>Comprovação Fotográfica Nível 4</h3>
                                <p>Oficinas credenciadas anexam fotos reais das peças velhas retiradas e das novas instaladas, auditadas na rede.</p>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#a855f7; background:rgba(168,85,247,0.1);">🧾</div>
                                <h3>Notas Fiscais & Comprovantes</h3>
                                <p>Guarde com segurança cópias e chaves de acesso de todas as notas fiscais de peças e serviços do seu carro.</p>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-card-icon" style="color:#25D366; background:rgba(37,211,102,0.1);">📲</div>
                                <h3>Alertas Preventivos no WhatsApp</h3>
                                <p>Receba mensagens automáticas quando estiver chegando o momento ideal de trocar óleo, correias ou fazer alinhamento.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO 4: VALORIZAÇÃO NA HORA DA VENDA -->
                <section class="landing-section" style="background:linear-gradient(180deg, #070b13 0%, #0c1424 100%);">
                    <div class="landing-container">
                        <div class="landing-compare-box">
                            <div class="landing-compare-col">
                                <div class="landing-compare-badge red">❌ Carro Tradicional Sem DNA</div>
                                <ul class="landing-compare-list">
                                    <li>Comprador desconfia da quilometragem</li>
                                    <li>Sem comprovantes de troca de óleo e correia</li>
                                    <li>Histórico de manutenção perdido ou inexistente</li>
                                    <li>Venda demorada e desvalorização abaixo da FIPE</li>
                                </ul>
                            </div>

                            <div class="landing-compare-divider">
                                <span>VS</span>
                            </div>

                            <div class="landing-compare-col gold">
                                <div class="landing-compare-badge gold">✅ Carro Certificado com DNA AUTO</div>
                                <ul class="landing-compare-list">
                                    <li><strong>Quilometragem auditada e incontestável</strong></li>
                                    <li><strong>Fotos de peças e notas fiscais de oficinas credenciadas</strong></li>
                                    <li><strong>Certidão Negativa de Leilão e Sinistros</strong></li>
                                    <li><strong>Venda até 3x mais rápida com valorização de até 15%</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEÇÃO 5: CALL TO ACTION OFICIAL (R$ 59,90) -->
                <section class="landing-section" style="text-align:center; padding:70px 20px;">
                    <div class="landing-container" style="max-width:700px;">
                        <span class="landing-section-tag" style="background:rgba(255,210,28,0.2); color:#FFD21C; border-color:#FFD21C;">
                            OFERTA EXCLUSIVA DE LANÇAMENTO
                        </span>
                        <h2 style="font-size:36px; color:#ffffff; font-weight:800; margin:16px 0 10px;">
                            Garanta o Passaporte Digital do Seu Carro
                        </h2>
                        <div style="font-size:48px; color:#FFD21C; font-weight:800; margin:10px 0;">
                            R$ 59,90
                        </div>
                        <p style="font-size:14px; color:#94a3b8; margin-bottom:28px;">
                            Pagamento único. Sem mensalidades. Válido por toda a vida útil do veículo, acompanhando o carro mesmo em caso de transferência.
                        </p>

                        <button class="landing-btn-primary-hero" style="margin:0 auto;" onclick="LandingView.goToRegister()">
                            <span>Ativar DNA do Meu Carro Agora</span>
                            <span class="landing-cta-arrow">→</span>
                        </button>
                    </div>
                </section>

                <!-- SEÇÃO 6: PARA OFICINAS PARCEIRAS -->
                <section class="landing-section" id="para-oficinas" style="background:#090e18; border-top:1px solid rgba(255,255,255,0.08);">
                    <div class="landing-container" style="display:flex; align-items:center; justify-content:space-between; gap:30px; flex-wrap:wrap;">
                        <div style="max-width:540px;">
                            <span class="landing-section-tag">REDE DE OFICINAS CREDENCIADAS</span>
                            <h2 style="font-size:28px; color:#ffffff; margin:10px 0;">Você é Dono de Oficina ou Centro Automotivo?</h2>
                            <p style="color:#94a3b8; font-size:14px; line-height:1.6;">
                                Credencie sua oficina gratuitamente na rede DNA AUTO. Emita laudos oficiais Nível 4 com fotos, comprove seus serviços e aumente a retenção de clientes enviando alertas de revisão pelo WhatsApp.
                            </p>
                        </div>
                        <div>
                            <button class="landing-btn-gold" style="padding:14px 28px; font-size:15px;" onclick="LandingView.goToRegisterWorkshop()">
                                Credenciar Minha Oficina Gratuitamente
                            </button>
                        </div>
                    </div>
                </section>

                <!-- FOOTER -->
                <footer class="landing-footer">
                    <div class="landing-container" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                        <div style="font-size:12px; color:#64748b;">
                            © 2026 DNA AUTO — Certificação de Registros Veiculares. Todos os direitos reservados.
                        </div>
                        <div style="display:flex; gap:16px; font-size:12px;">
                            <a href="javascript:void(0)" onclick="App.switchView('login')" style="color:#94a3b8; text-decoration:none;">Acessar Garagem</a>
                            <a href="javascript:void(0)" onclick="App.switchView('login-admin')" style="color:#94a3b8; text-decoration:none;">Painel Matriz (Admin)</a>
                        </div>
                    </div>
                </footer>
            </div>
        `;

        this.injectCSS();
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
                alert(`⚠️ Veículo ${res.vehicle.brand} ${res.vehicle.model} (${res.vehicle.license_plate}) localizado!\n\nEste carro ainda NÃO possui Passaporte Digital DNA ativo.\n\nVocê pode ativá-lo agora por apenas R$ 59,90!`);
                this.goToRegister();
            } else {
                alert(`🔍 Placa ${plate} não localizada na rede.\n\nCadastre seu veículo e ative o DNA Permanente por R$ 59,90.`);
                this.goToRegister();
            }
        } catch (err) {
            alert('Erro na consulta de placa: ' + err.message);
        }
    },

    injectCSS() {
        if (document.getElementById('landing-view-styles')) return;

        const style = document.createElement('style');
        style.id = 'landing-view-styles';
        style.textContent = `
            .landing-page-root {
                font-family: var(--font-sans);
                background: #05080D;
                color: #e2e8f0;
                min-height: 100vh;
                overflow-x: hidden;
            }

            /* NAVBAR */
            .landing-navbar {
                position: sticky;
                top: 0;
                width: 100%;
                background: rgba(5, 8, 13, 0.92);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                z-index: 1000;
            }
            .landing-nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
            }
            .landing-brand {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }
            .landing-brand-title span {
                font-size: 18px;
                font-weight: 800;
                color: #ffffff;
                display: block;
                line-height: 1.1;
            }
            .landing-brand-title small {
                font-size: 9.5px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .landing-nav-links {
                display: flex;
                align-items: center;
                gap: 24px;
            }
            .landing-nav-link {
                color: #94a3b8;
                text-decoration: none;
                font-size: 13.5px;
                font-weight: 500;
                transition: color 0.2s;
            }
            .landing-nav-link:hover {
                color: #FFD21C;
            }
            .landing-nav-actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .landing-btn-ghost {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.18);
                color: #ffffff;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .landing-btn-ghost:hover {
                border-color: #FFD21C;
                color: #FFD21C;
            }
            .landing-btn-gold {
                background: linear-gradient(135deg, #FFD21C 0%, #F59E0B 100%);
                color: #05080D;
                border: none;
                padding: 8px 18px;
                font-size: 13px;
                font-weight: 700;
                border-radius: 6px;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(255, 210, 28, 0.3);
                transition: all 0.2s;
            }
            .landing-btn-gold:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(255, 210, 28, 0.45);
            }

            /* HERO */
            .landing-hero {
                position: relative;
                min-height: 85vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(5, 8, 13, 0.85) 0%, rgba(5, 8, 13, 0.95) 100%),
                            url('/img/login-car-bg.jpg') center center / cover no-repeat;
                padding: 60px 20px 80px;
                box-sizing: border-box;
                text-align: center;
            }
            .landing-hero-content {
                max-width: 860px;
                margin: 0 auto;
                position: relative;
                z-index: 2;
            }
            .landing-badge-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 210, 28, 0.1);
                border: 1px solid rgba(255, 210, 28, 0.35);
                color: #FFD21C;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                margin-bottom: 22px;
            }
            .landing-hero-title {
                font-size: 44px;
                line-height: 1.15;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 18px;
                letter-spacing: -0.5px;
            }
            .landing-gold-highlight {
                color: #FFD21C;
                text-shadow: 0 0 30px rgba(255, 210, 28, 0.4);
            }
            .landing-hero-subtitle {
                font-size: 17px;
                line-height: 1.6;
                color: #cbd5e1;
                max-width: 720px;
                margin: 0 auto 32px;
            }
            .landing-hero-cta-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
                flex-wrap: wrap;
                margin-bottom: 40px;
            }
            .landing-btn-primary-hero {
                background: linear-gradient(135deg, #FFD21C 0%, #F59E0B 100%);
                color: #05080D;
                border: none;
                padding: 14px 28px;
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
            .landing-btn-primary-hero:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(255, 210, 28, 0.5);
            }
            .landing-btn-secondary-hero {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 14px 24px;
                font-size: 14.5px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .landing-btn-secondary-hero:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: #38bdf8;
                color: #38bdf8;
            }
            .landing-hero-features-strip {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 24px;
                flex-wrap: wrap;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .landing-strip-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #94a3b8;
            }

            /* SECTIONS */
            .landing-section {
                padding: 60px 20px;
            }
            .landing-container {
                max-width: 1160px;
                margin: 0 auto;
            }
            .landing-section-header {
                text-align: center;
                max-width: 680px;
                margin: 0 auto 40px;
            }
            .landing-section-tag {
                display: inline-block;
                font-size: 10px;
                font-weight: 700;
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.3);
                background: rgba(56, 189, 248, 0.08);
                padding: 4px 12px;
                border-radius: 12px;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }
            .landing-section-header h2 {
                font-size: 30px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 12px;
            }
            .landing-section-header p {
                font-size: 14.5px;
                color: #94a3b8;
                line-height: 1.5;
                margin: 0;
            }

            /* SEARCH CARD */
            .landing-search-card {
                max-width: 600px;
                margin: 0 auto;
                background: #0d1320;
                border: 1px solid rgba(255, 210, 28, 0.3);
                border-radius: 14px;
                padding: 24px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .landing-search-form {
                display: flex;
                gap: 10px;
                margin-bottom: 16px;
            }
            .landing-plate-input-wrapper {
                flex: 1;
                position: relative;
            }
            .landing-plate-flag {
                position: absolute;
                top: 4px;
                left: 10px;
                font-size: 8px;
                font-weight: 800;
                color: #38bdf8;
                letter-spacing: 1px;
            }
            .landing-plate-input {
                width: 100%;
                height: 48px;
                background: #05080D;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #FFD21C;
                font-family: var(--font-mono);
                font-size: 18px;
                font-weight: 800;
                padding: 12px 14px 2px;
                box-sizing: border-box;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .landing-plate-input:focus {
                outline: none;
                border-color: #FFD21C;
                box-shadow: 0 0 12px rgba(255, 210, 28, 0.25);
            }
            .landing-search-submit {
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
            .landing-search-submit:hover {
                background: #f59e0b;
            }
            .landing-search-examples {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                font-size: 11.5px;
                color: #64748b;
            }
            .landing-example-tag {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #94a3b8;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                font-family: var(--font-mono);
            }
            .landing-example-tag:hover {
                border-color: #FFD21C;
                color: #FFD21C;
            }

            /* GRID DE BENEFÍCIOS */
            .landing-grid-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 20px;
            }
            .landing-feature-card {
                background: #090e18;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 24px;
                transition: all 0.25s;
            }
            .landing-feature-card:hover {
                border-color: rgba(255, 210, 28, 0.35);
                transform: translateY(-3px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            }
            .landing-card-icon {
                width: 44px;
                height: 44px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                margin-bottom: 14px;
            }
            .landing-feature-card h3 {
                font-size: 17px;
                color: #ffffff;
                margin: 0 0 8px;
                font-weight: 700;
            }
            .landing-feature-card p {
                font-size: 13.5px;
                color: #94a3b8;
                line-height: 1.55;
                margin: 0;
            }

            /* COMPARATIVO BOX */
            .landing-compare-box {
                background: #090e18;
                border: 1px solid rgba(255, 210, 28, 0.3);
                border-radius: 14px;
                padding: 32px;
                display: flex;
                align-items: stretch;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
            }
            .landing-compare-col {
                flex: 1;
                min-width: 280px;
            }
            .landing-compare-divider {
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                color: #64748b;
                font-size: 16px;
                padding: 0 10px;
            }
            .landing-compare-badge {
                display: inline-block;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 18px;
            }
            .landing-compare-badge.red {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .landing-compare-badge.gold {
                background: rgba(255, 210, 28, 0.15);
                color: #FFD21C;
                border: 1px solid #FFD21C;
            }
            .landing-compare-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .landing-compare-list li {
                font-size: 13.5px;
                color: #cbd5e1;
                margin-bottom: 12px;
                line-height: 1.45;
            }

            /* FOOTER */
            .landing-footer {
                background: #030509;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding: 24px 20px;
            }

            @media (max-width: 768px) {
                .landing-nav-links {
                    display: none;
                }
                .landing-hero-title {
                    font-size: 30px;
                }
                .landing-hero-subtitle {
                    font-size: 15px;
                }
                .landing-compare-divider {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
};
