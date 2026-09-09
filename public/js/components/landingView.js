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
            : `<button class="totvs-btn-ghost" onclick="App.switchView('login')">Entrar na Plataforma</button>`;

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
                                <small>Plataforma Integrada de Gestão & Certificação Veicular</small>
                            </div>
                        </div>

                        <nav class="totvs-nav-links">
                            <a href="#gastos-6-meses" class="totvs-nav-link">Gastos 6 Meses</a>
                            <a href="#relatorio-completo" class="totvs-nav-link">Relatório do Carro</a>
                            <a href="#para-oficinas" class="totvs-nav-link highlight-b2b">
                                <span class="totvs-pulse-mini"></span> Para Oficinas (B2B)
                            </a>
                            <a href="#consulta-placa" class="totvs-nav-link">Consultar Placa</a>
                            <a href="#faq-section" class="totvs-nav-link">Dúvidas</a>
                        </nav>

                        <div class="totvs-nav-actions">
                            ${navAuthButton}
                            <button class="totvs-btn-gold" onclick="LandingView.goToRegister()">
                                Garantir DNA (R$ 59,90)
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
                                <span>🚗 Sou Dono de Carro</span>
                            </button>
                            <button class="totvs-audience-btn ${this.activeAudienceTab === 'WORKSHOP' ? 'active' : ''}" onclick="LandingView.switchAudience('WORKSHOP')">
                                <span>🔧 Sou Dono de Oficina Mecânica</span>
                            </button>
                        </div>

                        <!-- Conteúdo Dinâmico do Hero: Dono vs Oficina -->
                        <div id="totvs-hero-dynamic-block">
                            ${this.renderHeroDynamicContent()}
                        </div>

                        <!-- Faixa de KPIs Corporativos da Rede -->
                        <div class="totvs-kpi-bar">
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
                                <span class="totvs-kpi-val">+35%</span>
                                <span class="totvs-kpi-lbl">Faturamento Recorrente para Oficinas Parceiras</span>
                            </div>
                            <div class="totvs-kpi-sep"></div>
                            <div class="totvs-kpi-item">
                                <span class="totvs-kpi-val">0 km</span>
                                <span class="totvs-kpi-lbl">Previsão Exata de Correia & Câmbio Automático</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÃO 1: CONTROLE DE GASTOS DOS ÚLTIMOS 6 MESES (DONO) -->
                <!-- ========================================== -->
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

                <!-- ========================================== -->
                <!-- SEÇÃO 2: RELATÓRIO COMPLETO DO QUE FOI FEITO NO CARRO -->
                <!-- ========================================== -->
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
                                <div class="totvs-pillar-icon">🧾</div>
                                <h3>Notas Fiscais & Part Numbers</h3>
                                <p>Código original de cada item substituído (ex: pastilha de cerâmica Brembo P28035N), lote de lubrificante e chave de NF-e.</p>
                                <span class="totvs-pillar-tag">Rastreabilidade Total</span>
                            </div>

                            <div class="totvs-pillar-card">
                                <div class="totvs-pillar-icon">🔒</div>
                                <h3>Quilometragem Imutável</h3>
                                <p>Cada registro audita a quilometragem e impede adulterações de odômetro, eliminando o maior golpe do mercado de usados.</p>
                                <span class="totvs-pillar-tag">Proteção Anti-Golpe</span>
                            </div>

                            <div class="totvs-pillar-card">
                                <div class="totvs-pillar-icon">📈</div>
                                <h3>Valorização de até 15% na Venda</h3>
                                <p>Compradores pagam mais caro e compram até 3x mais rápido de quem apresenta um Dossiê DNA AUTO com QR Code autenticado.</p>
                                <span class="totvs-pillar-tag">Mais Dinheiro no Bolso</span>
                            </div>
                        </div>

                        <!-- Exemplo do Laudo em Linha do Tempo -->
                        <div class="totvs-timeline-preview-box">
                            <div class="totvs-timeline-header">
                                <div>
                                    <strong style="color:#ffffff; font-size:16px;">Exemplo de Linha do Tempo Auditada no Dossiê</strong>
                                    <p style="color:#94a3b8; font-size:12px; margin:2px 0 0;">Dados reais sincronizados da oficina credenciada</p>
                                </div>
                                <button class="totvs-btn-outline-gold" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                                    Abrir Dossiê 360° Completo (Demo) →
                                </button>
                            </div>

                            <div class="totvs-timeline-items">
                                <div class="totvs-tl-item">
                                    <div class="totvs-tl-dot gold"></div>
                                    <div class="totvs-tl-body">
                                        <div class="totvs-tl-top">
                                            <strong>Troca Preventiva de Discos & Pastilhas Dianteiras</strong>
                                            <span class="totvs-tl-date">15/12/2025 • 122.400 km</span>
                                        </div>
                                        <p>Substituição por pastilhas de cerâmica Brembo + sangria e troca de fluido DOT 5.1. NF-e #49281 anexada.</p>
                                        <div class="totvs-tl-photos">
                                            <span class="totvs-photo-tag">📷 Foto das Pastilhas Velhas vs Novas anexada</span>
                                            <span class="totvs-photo-tag">✅ Laudo de Frenagem Ok</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="totvs-tl-item">
                                    <div class="totvs-tl-dot cyan"></div>
                                    <div class="totvs-tl-body">
                                        <div class="totvs-tl-top">
                                            <strong>Revisão de Lubrificação & Filtros Sintéticos</strong>
                                            <span class="totvs-tl-date">28/10/2025 • 118.900 km</span>
                                        </div>
                                        <p>Óleo 0W-20 API SP 100% Sintético (4.2L) + filtro de óleo Mann W610 + filtro de ar do motor e cabine com higienização de ozônio.</p>
                                        <div class="totvs-tl-photos">
                                            <span class="totvs-photo-tag">🛢️ Lote de Óleo Homologado</span>
                                            <span class="totvs-photo-tag">📲 Alerta de Próxima Troca Agendado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÃO 3: PARA OFICINAS MECÂNICAS (B2B ENGINE) -->
                <!-- ========================================== -->
                <section class="totvs-section totvs-b2b-highlight" id="para-oficinas">
                    <div class="totvs-container">
                        <div class="totvs-section-header">
                            <span class="totvs-badge-tag b2b">MÓDULO B2B • CENTROS AUTOMOTIVOS & OFICINAS</span>
                            <h2>Aumente o Faturamento de sua Oficina com Gestão Preditiva de Clientes</h2>
                            <p>
                                Transforme clientes casuais em receita previsível e recorrente. O DNA AUTO avisa a sua oficina e ao seu cliente exatamente no momento certo de intervir, antes que ele procure o concorrente ou sofra uma quebra na estrada.
                            </p>
                        </div>

                        <!-- 3 Pilares Chave Solicitados pelo Usuário -->
                        <div class="totvs-workshop-features-grid">
                            <!-- 1. CORREIA DENTADA -->
                            <div class="totvs-workshop-card">
                                <div class="totvs-ws-icon red">⚙️</div>
                                <h3>Previsão Exata da Troca de Correia Dentada</h3>
                                <p class="totvs-ws-desc">
                                    O sistema calcula a rodagem do cliente cadastrado e avisa <strong>quanto falta para a troca da correia dentada e tensores</strong>. Você programa o agendamento preventivo e salva o cliente de um prejuízo de R$ 8.000 a R$ 20.000 de motor batido.
                                </p>
                                <div class="totvs-ws-stat">
                                    <span>Ticket Médio do Serviço:</span>
                                    <strong>R$ 850 a R$ 1.800</strong>
                                </div>
                                <div class="totvs-ws-benefit">
                                    ✅ Alerta automático no WhatsApp da sua oficina e do dono do veículo.
                                </div>
                            </div>

                            <!-- 2. TROCA DE ÓLEO DO CÂMBIO AUTOMÁTICO -->
                            <div class="totvs-workshop-card featured">
                                <div class="totvs-ws-badge-top">SERVIÇO DE ALTO TICKET</div>
                                <div class="totvs-ws-icon gold">🔄</div>
                                <h3>Alerta de Troca de Óleo do Câmbio Automático</h3>
                                <p class="totvs-ws-desc">
                                    A grande maioria dos motoristas nem sabe que o câmbio automático precisa trocar óleo e filtro. O DNA AUTO monitora os 40.000 a 60.000 km e alerta o cliente que a sua oficina está pronta para fazer o serviço com máquina de diálise.
                                </p>
                                <div class="totvs-ws-stat">
                                    <span>Ticket Médio do Serviço:</span>
                                    <strong style="color:#FFD21C;">R$ 1.600 a R$ 3.800</strong>
                                </div>
                                <div class="totvs-ws-benefit">
                                    ✅ Recupere serviços de alto lucro que hoje fogem para concessionárias.
                                </div>
                            </div>

                            <!-- 3. IDENTIFICAÇÃO DE FALHAS ANTECIPADA -->
                            <div class="totvs-workshop-card">
                                <div class="totvs-ws-icon cyan">⚡</div>
                                <h3>Identificação de Falhas Antes do Carro Chegar</h3>
                                <p class="totvs-ws-desc">
                                    Algoritmos de telemetria preditiva, histórico de sintomas prévios e checklist inteligente identificam <strong>anomalias mecânicas e elétricas antes mesmo do carro chegar na oficina</strong>. Você já prepara as peças e o elevador com antecedência.
                                </p>
                                <div class="totvs-ws-stat">
                                    <span>Ganho de Produtividade:</span>
                                    <strong>+40% no Giro de Box</strong>
                                </div>
                                <div class="totvs-ws-benefit">
                                    ✅ Diagnóstico preventivo que encanta o cliente e zera tempo ocioso.
                                </div>
                            </div>
                        </div>

                        <!-- Painel de Demonstração do Radar da Oficina -->
                        <div class="totvs-radar-demo-card">
                            <div class="totvs-radar-top">
                                <div>
                                    <span class="totvs-radar-title">RADAR PREDITIVO DE SERVIÇOS — VISÃO DA OFICINA</span>
                                    <small style="display:block; color:#94a3b8; font-size:12px;">Clientes cadastrados com manutenções de alto ticket próximas do vencimento</small>
                                </div>
                                <div class="totvs-radar-badge">
                                    <span class="totvs-pulse-green"></span> 3 Revisões Críticas neste Mês
                                </div>
                            </div>

                            <div class="totvs-radar-table-responsive">
                                <table class="totvs-radar-table">
                                    <thead>
                                        <tr>
                                            <th>Cliente & Veículo</th>
                                            <th>Manutenção Crítica</th>
                                            <th>Quanto Falta?</th>
                                            <th>Ticket Estimado</th>
                                            <th>Ação Recomendada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <strong>Carlos Silva</strong>
                                                <small>Civic Touring 1.5 • BRA2E19</small>
                                            </td>
                                            <td>
                                                <span class="radar-tag red">Troca Correia Dentada & Tensores</span>
                                            </td>
                                            <td>
                                                <strong style="color:#ef4444;">Faltam 1.200 km (aprox. 18 dias)</strong>
                                            </td>
                                            <td>R$ 1.450,00</td>
                                            <td>
                                                <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Carlos Silva', 'BRA2E19', 'Correia Dentada')">
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
                                                <span class="radar-tag gold">Troca de Óleo Câmbio Automático (CVT)</span>
                                            </td>
                                            <td>
                                                <strong style="color:#FFD21C;">Faltam 2.800 km (aprox. 35 dias)</strong>
                                            </td>
                                            <td>R$ 2.100,00</td>
                                            <td>
                                                <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Mariana Souza', 'ABC1D23', 'Óleo de Câmbio Automático')">
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
                                                <span class="radar-tag cyan">Falha Antecipada: Bobina / Pressão Turbo</span>
                                            </td>
                                            <td>
                                                <strong style="color:#38bdf8;">Alerta Preventivo Detectado</strong>
                                            </td>
                                            <td>R$ 1.890,00</td>
                                            <td>
                                                <button class="totvs-btn-wa-action" onclick="LandingView.simulateWhatsApp('Roberto Mendes', 'JHG4B88', 'Diagnóstico Preventivo Turbo')">
                                                    <span>📲 Disparar WhatsApp</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- CTA B2B da Oficina -->
                            <div class="totvs-radar-cta-row">
                                <div class="totvs-radar-cta-text">
                                    <strong>Credencie sua oficina gratuitamente hoje mesmo.</strong>
                                    <span>Sem mensalidade básica. Ganhe comissões por cada cliente que ativar o DNA e multiplique o ticket de retorno.</span>
                                </div>
                                <button class="totvs-btn-gold" style="padding:14px 28px; font-size:15px;" onclick="LandingView.goToRegisterWorkshop()">
                                    🔧 Quero Credenciar Minha Oficina Agora
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÃO 4: CONSULTA RÁPIDA DE PLACA (INTERATIVA) -->
                <!-- ========================================== -->
                <section class="totvs-section" id="consulta-placa" style="background:#090e18;">
                    <div class="totvs-container">
                        <div class="totvs-section-header">
                            <span class="totvs-badge-tag cyan">SIMULADOR AO VIVO</span>
                            <h2>Consulte o DNA de um Veículo Agora</h2>
                            <p>Digite a placa de qualquer carro cadastrado para ver como o histórico digital e o extrato de manutenções são exibidos.</p>
                        </div>

                        <div class="totvs-search-card">
                            <form onsubmit="LandingView.handleSearchPlate(event)" class="totvs-search-form">
                                <div class="totvs-plate-input-wrapper">
                                    <div class="totvs-plate-flag">
                                        <span>BRASIL • MERCOSUL</span>
                                    </div>
                                    <input type="text" id="landing-plate-input" placeholder="Ex: BRA2E19" maxlength="8" class="totvs-plate-input" />
                                </div>
                                <button type="submit" class="totvs-search-submit">
                                    <span>Verificar Dossiê</span>
                                    <span style="font-size:16px;">🔍</span>
                                </button>
                            </form>

                            <div class="totvs-search-examples">
                                <span>Placas de demonstração ativas na rede:</span>
                                <button type="button" class="totvs-example-tag" onclick="LandingView.fillPlate('BRA2E19')">
                                    BRA2E19 (Civic Touring • Nível 4)
                                </button>
                                <button type="button" class="totvs-example-tag" onclick="LandingView.fillPlate('ABC1D23')">
                                    ABC1D23 (Corolla Altis)
                                </button>
                                <button type="button" class="totvs-example-tag" onclick="LandingView.fillPlate('STR1A99')">
                                    STR1A99 (Strada • Sem DNA)
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÃO 5: COMPARATIVO CARRO COM DNA vs SEM DNA -->
                <!-- ========================================== -->
                <section class="totvs-section" style="background:linear-gradient(180deg, #070b13 0%, #0c1424 100%);">
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

                <!-- ========================================== -->
                <!-- SEÇÃO 6: OFERTA CANÔNICA DE R$ 59,90       -->
                <!-- ========================================== -->
                <section class="totvs-section" style="text-align:center; padding:80px 20px;">
                    <div class="totvs-container" style="max-width:740px;">
                        <span class="totvs-badge-tag gold" style="font-size:12px; padding:6px 16px;">
                            PAGAMENTO ÚNICO • ACESSO VITALÍCIO
                        </span>
                        <h2 style="font-size:40px; color:#ffffff; font-weight:800; margin:20px 0 12px; letter-spacing:-0.5px;">
                            Garanta Agora o Passaporte Digital do Seu Carro
                        </h2>
                        <div style="font-size:54px; color:#FFD21C; font-weight:900; margin:10px 0; text-shadow:0 0 30px rgba(255,210,28,0.4);">
                            R$ 59,90
                        </div>
                        <p style="font-size:16px; color:#94a3b8; line-height:1.6; margin-bottom:32px;">
                            Sem mensalidades recorrentes para o motorista. O DNA pertence ao veículo e acompanha o histórico da placa para sempre, mesmo em futuras transferências.
                        </p>

                        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
                            <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegister()">
                                <span>⭐ Ativar DNA do Meu Veículo (R$ 59,90)</span>
                                <span class="landing-cta-arrow">→</span>
                            </button>
                            <button class="totvs-btn-outline-gold" onclick="LandingView.goToRegisterWorkshop()">
                                <span>🔧 Credenciar Oficina Gratuitamente</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- SEÇÃO 7: PERGUNTAS FREQUENTES (FAQ)        -->
                <!-- ========================================== -->
                <section class="totvs-section" id="faq-section" style="background:#060a12; border-top:1px solid rgba(255,255,255,0.06);">
                    <div class="totvs-container" style="max-width:840px;">
                        <div class="totvs-section-header">
                            <span class="totvs-badge-tag cyan">PERGUNTAS FREQUENTES</span>
                            <h2>Tire Suas Dúvidas sobre o DNA AUTO</h2>
                            <p>Tudo o que você precisa saber sobre a gestão financeira, o relatório de manutenções e o credenciamento de oficinas.</p>
                        </div>

                        <div class="totvs-faq-accordion">
                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como funciona o controle de gastos dos últimos 6 meses?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>Sempre que uma oficina credenciada realiza uma intervenção ou você registra uma manutenção no sistema, os valores de peças e serviços são computados automaticamente. O painel compila os custos mês a mês dos últimos 6 meses, permitindo que você saiba com exatidão onde cada centavo foi investido e qual economia preventiva foi gerada.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como a oficina descobre quanto falta para a correia dentada e óleo do câmbio?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>O algoritmo inteligente do DNA AUTO cruza o histórico do veículo, a quilometragem média diária percorrida pelo condutor e a especificação técnica da montadora para cada modelo. Quando a correia dentada ou o fluido do câmbio automático atingem 85% do limite seguro de rodagem, o sistema emite um alerta prioritário para a oficina e dispara uma mensagem preventiva pelo WhatsApp para o cliente agendar o serviço.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>Como o sistema identifica uma falha antes do carro chegar na oficina?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>O sistema conta com um módulo de pré-diagnóstico preditivo. Ao registrar revisões anteriores, sintomas relatados pelo condutor ou anomalias registradas em ordens de serviço anteriores, a oficina recebe relatórios de risco (ex: desgaste anormal de pastilhas indicando empenamento de disco, oscilação de bobina ou queda de pressão do fluido). Isso permite intervir antes que a falha provoque a parada total do veículo.</p>
                                </div>
                            </div>

                            <div class="totvs-faq-item">
                                <div class="totvs-faq-q" onclick="LandingView.toggleFaq(this)">
                                    <span>O pagamento de R$ 59,90 tem alguma mensalidade oculta?</span>
                                    <span class="totvs-faq-icon">+</span>
                                </div>
                                <div class="totvs-faq-a">
                                    <p>Absolutamente nenhuma. O valor de R$ 59,90 é taxa única para emissão do Passaporte Digital vitalício daquele veículo. O proprietário acessa o painel, consulta gastos, gera o laudo para revenda e recebe alertas no WhatsApp para sempre.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ========================================== -->
                <!-- FOOTER CORPORATIVO PADRÃO TOTVS            -->
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
                                <li><a href="#gastos-6-meses">Gastos dos Últimos 6 Meses</a></li>
                                <li><a href="#relatorio-completo">Relatório Completo de Peças</a></li>
                                <li><a href="#consulta-placa">Consultar Minha Placa</a></li>
                                <li><a href="javascript:void(0)" onclick="LandingView.goToRegister()">Ativar DNA (R$ 59,90)</a></li>
                            </ul>
                        </div>

                        <div class="totvs-footer-col">
                            <h4>Para Oficinas (B2B)</h4>
                            <ul>
                                <li><a href="#para-oficinas">Alerta de Correia Dentada</a></li>
                                <li><a href="#para-oficinas">Óleo de Câmbio Automático</a></li>
                                <li><a href="#para-oficinas">Identificação Precoce de Falhas</a></li>
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

    // ── Renderiza dinamicamente o Hero conforme a aba ativa (Proprietário ou Oficina) ──
    renderHeroDynamicContent() {
        if (this.activeAudienceTab === 'WORKSHOP') {
            return `
                <div class="totvs-hero-audience-card workshop animate-fade-in">
                    <div class="totvs-badge-pill b2b">
                        <span class="totvs-pulse-green"></span>
                        <span>MÓDULO DE EXPANSÃO B2B PARA OFICINAS MECÂNICAS & CENTROS AUTOMOTIVOS</span>
                    </div>

                    <h1 class="totvs-hero-title">
                        Aumente o Faturamento da Sua Oficina Sabendo <span class="totvs-gold-highlight">Quando Trocar a Correia Dentada</span> e o <span style="color:#38bdf8;">Óleo de Câmbio</span> dos Seus Clientes
                    </h1>

                    <p class="totvs-hero-subtitle">
                        Identifique falhas no carro do cliente <strong>antes mesmo dele chegar na oficina</strong>. O DNA AUTO calcula a rodagem, alerta sobre manutenções de alto ticket no WhatsApp e garante que seu cliente nunca mais vá para o concorrente.
                    </p>

                    <div class="totvs-hero-cta-row">
                        <button class="totvs-btn-primary-hero" onclick="LandingView.goToRegisterWorkshop()">
                            <span>🔧 Credenciar Minha Oficina Gratuitamente</span>
                            <span class="landing-cta-arrow">→</span>
                        </button>
                        <a href="#para-oficinas" class="totvs-btn-secondary-hero">
                            <span>📊 Ver Demonstração do Radar Preditivo</span>
                        </a>
                    </div>
                </div>
            `;
        }

        // Default: OWNER
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
                        <span>🔎 Ver Dossiê Completo Demo (Civic Touring)</span>
                    </button>
                </div>
            </div>
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
        const block = document.getElementById('totvs-hero-dynamic-block');
        if (block) {
            block.innerHTML = this.renderHeroDynamicContent();
        }

        // Atualiza botões
        document.querySelectorAll('.totvs-audience-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText.includes(role === 'OWNER' ? 'Dono de Carro' : 'Dono de Oficina'));
        });
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
                alert(`⚠️ Veículo ${res.vehicle.brand} ${res.vehicle.model} (${res.vehicle.license_plate}) localizado!\n\nEste carro ainda NÃO possui Passaporte Digital DNA ativo.\n\nVocê pode ativá-lo agora por apenas R$ 59,90 com histórico completo e controle de gastos!`);
                this.goToRegister();
            } else {
                alert(`🔍 Placa ${plate} não localizada na rede.\n\nCadastre seu veículo e ative o DNA Permanente por R$ 59,90.`);
                this.goToRegister();
            }
        } catch (err) {
            alert('Erro na consulta de placa: ' + err.message);
        }
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

            @media (max-width: 900px) {
                .totvs-footer-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            @media (max-width: 768px) {
                .totvs-nav-links {
                    display: none;
                }
                .totvs-hero-title {
                    font-size: 30px;
                }
                .totvs-hero-subtitle {
                    font-size: 15px;
                }
                .totvs-compare-divider {
                    width: 100%;
                }
                .totvs-footer-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }
};
