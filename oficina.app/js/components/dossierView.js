// ==============================================================================
// DNA AUTO — COMPONENTE DO DOSSIÊ DIGITAL 360° DO VEÍCULO & LUPA INTELIGENTE
// ==============================================================================

const DossierView = {
    currentData: null,
    activeTab: 'resumo',

    async render(identifier = null) {
        const container = document.getElementById('view-content');

        // Se nenhum veículo foi especificado na busca, exibe a Central de Consulta Oficial
        if (!identifier) {
            container.innerHTML = this.renderSearchLanding();
            this.setupSearchLandingEvents();
            return;
        }

        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px; width:14px; height:14px;"></div>
                Consultando Dossiê Digital 360° do Veículo (${identifier})...
            </div>
        `;

        try {
            let data;
            try {
                data = await API.getDossier(identifier);
            } catch (errDossier) {
                // Se não localizou por DNA/veículo interno, verifica se é formato de placa para buscar ao vivo
                const cleanPlate = identifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                if (cleanPlate.length === 7) {
                    const plateResult = await API.lookupPlate(cleanPlate);
                    if (plateResult && plateResult.found) {
                        data = {
                            found: true,
                            hasDna: plateResult.vehicle.hasDna,
                            vehicle: plateResult.vehicle,
                            health: {
                                overallScore: 50,
                                continuityStatus: 'REGULAR',
                                documentedPercentage: 0
                            },
                            services: [],
                            parts: [],
                            invoices: [],
                            photos: []
                        };
                    } else {
                        throw errDossier;
                    }
                } else {
                    throw errDossier;
                }
            }

            this.currentData = data;

            if (!data.hasDna) {
                // Veículo sem DNA (Ex: Fiat Strada ou placa nova consultada ao vivo)
                container.innerHTML = `
                    <div class="dossier-search-bar-mini" style="max-width:680px; margin:20px auto 0;">
                        <button class="btn btn-sm btn-secondary" onclick="DossierView.render(null)">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            Nova Consulta de Veículo
                        </button>
                    </div>
                    ${this.renderVehicleWithoutDna(data.vehicle)}
                `;
                return;
            }

            container.innerHTML = `
                <!-- Barra Rápida de Nova Consulta no Topo -->
                <div class="dossier-search-bar-mini">
                    <button class="btn btn-sm btn-secondary" onclick="DossierView.render(null)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Nova Consulta
                    </button>
                    <form id="dossier-mini-search-form" onsubmit="event.preventDefault(); const p = document.getElementById('quick-search-plate').value.trim(); if(p) DossierView.render(p);" style="display:flex; gap:8px; align-items:center;">
                        <input type="text" id="quick-search-plate" class="form-control" placeholder="Buscar outra placa ou DNA..." style="padding:6px 12px; font-size:12px; text-transform:uppercase; max-width:220px;" />
                        <button type="submit" class="btn btn-sm btn-cyan">Buscar</button>
                    </form>
                </div>

                <!-- Cabeçalho 360° do Dossiê -->
                ${this.renderHero(data)}

                <!-- 🔎 LUPA DO DOSSIÊ (PESQUISA UNIVERSAL NA HISTÓRIA DO CARRO) -->
                <div class="search-lens-container">
                    <span class="lens-icon">🔎</span>
                    <input type="text" id="lens-search-input" class="search-lens-input"
                           placeholder="Pesquisar na história do veículo (ex: óleo, correia dentada, embreagem, pastilhas, 100.000, 2024, Roberto)..." />
                    <div class="lens-examples-tags">
                        <span class="lens-tag-chip" onclick="DossierView.applyLensSearch('óleo')">óleo</span>
                        <span class="lens-tag-chip" onclick="DossierView.applyLensSearch('correia')">correia dentada</span>
                        <span class="lens-tag-chip" onclick="DossierView.applyLensSearch('pastilha')">pastilha</span>
                        <span class="lens-tag-chip" onclick="DossierView.applyLensSearch('amortecedor')">amortecedor</span>
                    </div>
                </div>
                <div id="lens-search-results" style="display:none; margin-bottom:24px;"></div>

                <!-- Abas de Navegação 360° (Item 38) -->
                <div class="dossier-tabs-nav">
                    <button class="dossier-tab-btn active" data-tab="resumo" onclick="DossierView.switchTab('resumo')">📊 Resumo 360°</button>
                    <button class="dossier-tab-btn" data-tab="timeline" onclick="DossierView.switchTab('timeline')">⏱️ Linha do Tempo</button>
                    <button class="dossier-tab-btn" data-tab="servicos" onclick="DossierView.switchTab('servicos')">🔧 Serviços (${data.services.length})</button>
                    <button class="dossier-tab-btn" data-tab="pecas" onclick="DossierView.switchTab('pecas')">🧩 Peças (${data.parts.length})</button>
                    <button class="dossier-tab-btn" data-tab="notas" onclick="DossierView.switchTab('notas')">🧾 Notas Fiscais (${data.invoices.length})</button>
                    <button class="dossier-tab-btn" data-tab="fotos" onclick="DossierView.switchTab('fotos')">📷 Fotos (${data.photos.length})</button>
                    <button class="dossier-tab-btn" data-tab="quilometragem" onclick="DossierView.switchTab('quilometragem')">📏 Quilometragem</button>
                    <button class="dossier-tab-btn" data-tab="proprietarios" onclick="DossierView.switchTab('proprietarios')">👤 Proprietários (${data.vehicle.owners_count})</button>
                    <button class="dossier-tab-btn" data-tab="oficinas" onclick="DossierView.switchTab('oficinas')">🏭 Oficinas (${data.workshops.length})</button>
                    <button class="dossier-tab-btn" data-tab="documentos" onclick="DossierView.switchTab('documentos')">📄 Documentos & IPVA</button>
                    <button class="dossier-tab-btn" data-tab="valor" onclick="DossierView.switchTab('valor')">💰 FIPE & Mercado</button>
                    <button class="dossier-tab-btn" data-tab="auditoria" onclick="DossierView.switchTab('auditoria')">🛡️ Auditoria</button>
                </div>

                <!-- Conteúdo da Aba Ativa -->
                <div id="dossier-tab-content">
                    ${this.renderTabContent('resumo')}
                </div>
            `;

            // Listener para Lupa do Dossiê em tempo real
            const searchInput = document.getElementById('lens-search-input');
            let debounceTimer;
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        this.executeLensSearch(e.target.value.trim());
                    }, 300);
                });
            }

        } catch (err) {
            container.innerHTML = `
                <div class="panel-box" style="text-align:center; padding:40px; max-width:600px; margin:20px auto;">
                    <h3 style="color:var(--status-rejected); margin-bottom:12px;">Veículo não encontrado</h3>
                    <p style="color:var(--text-muted); margin-bottom:20px;">Não encontramos nenhum veículo correspondente a "<strong>${identifier}</strong>".</p>
                    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-secondary" onclick="DossierView.render(null)">Voltar para Busca</button>
                        <button class="btn btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">Carregar Honda Civic Demo</button>
                    </div>
                </div>
            `;
        }
    },

    // Tela Inicial de Busca Oficial (quando nenhum veículo foi buscado)
    renderSearchLanding() {
        return `
            <div class="dossier-search-landing">
                <div class="search-landing-card">
                    <span class="badge-proof badge-proven" style="font-size:11px; letter-spacing:0.8px; margin-bottom:12px; display:inline-flex;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        CONSULTA PÚBLICA OFICIAL — BASE NACIONAL DNA AUTO
                    </span>
                    
                    <h2 style="font-size:26px; font-weight:800; color:#fff; margin-bottom:8px; line-height:1.2;">
                        Consulte o Histórico Digital do Veículo
                    </h2>
                    
                    <p style="color:var(--text-muted); font-size:14px; max-width:580px; margin:0 auto 16px; line-height:1.5;">
                        Digite a <strong>Placa</strong> ou o <strong>Código DNA</strong> para verificar manutenções comprovadas por notas fiscais, quilometragem real, trocas de peças e valor de mercado.
                    </p>

                    <!-- Formulário de Consulta de Placa / DNA -->
                    <form id="dossier-main-search-form" onsubmit="DossierView.handleSearchSubmit(event)">
                        <div class="search-input-plate-group">
                            <input type="text" id="landing-search-plate" required
                                   placeholder="DIGITE A PLACA (EX: BRA2E19) OU DNA..."
                                   autocomplete="off" />
                            <button type="submit" class="btn btn-primary" style="padding:0 24px; font-weight:700;">
                                🔍 CONSULTAR HISTÓRICO
                            </button>
                        </div>
                    </form>

                    <!-- Veículos de Demonstração para Teste Rápido -->
                    <div class="search-sample-pills">
                        <span style="font-size:11px; color:var(--text-dim); display:flex; align-items:center; margin-right:4px;">Testar veículos homologados:</span>
                        <button class="search-sample-btn" onclick="DossierView.render('BRA2E19')">🚗 Honda Civic (BRA2E19)</button>
                        <button class="search-sample-btn" onclick="DossierView.render('ABC1D23')">🚗 Toyota Corolla (ABC1D23)</button>
                        <button class="search-sample-btn" onclick="DossierView.render('KXZ9012')">🚗 VW Gol (KXZ9012)</button>
                    </div>

                    <!-- Pilares do DNA AUTO -->
                    <div class="search-pillars-grid">
                        <div class="pillar-card">
                            <h4>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                Registro Imutável
                            </h4>
                            <p>Toda intervenção é assinada por hash criptográfico e vinculada permanentemente ao chassi e DNA do carro.</p>
                        </div>
                        <div class="pillar-card">
                            <h4>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--proof-level-4)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                Peças & Notas Fiscais
                            </h4>
                            <p>Registro auditado com part number de peças originais, oficina responsável e DANFE arquivada.</p>
                        </div>
                        <div class="pillar-card">
                            <h4>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                Valorização na Venda
                            </h4>
                            <p>Carros com DNA comprovado vendem até 15% mais rápido e valorizam a negociação entre particulares e lojistas.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setupSearchLandingEvents() {
        const input = document.getElementById('landing-search-plate');
        if (input) {
            input.focus();
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    },

    handleSearchSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('landing-search-plate');
        if (input && input.value.trim()) {
            this.render(input.value.trim());
        }
    },

    // Renderiza Cabeçalho do Dossiê (Item 7)
    renderHero(data) {
        const v = data.vehicle;
        const h = data.health;
        const formattedKm = Number(v.current_mileage).toLocaleString('pt-BR');

        return `
            <div class="dossier-hero">
                <div class="dossier-hero-top">
                    <div class="vehicle-thumb-box">
                        <img src="${v.photo_url || '/img/car-silhouette.svg'}" alt="${v.model}" onerror="this.onerror=null; this.src='/img/car-silhouette.svg';" />
                    </div>

                    <div class="dossier-meta">
                        <div class="dossier-hero-header-row">
                            <div class="dossier-dna-badge-hero">
                                <span class="dna-label">DNA PERMANENTE</span>
                                <span class="dna-code-highlight">${v.dna_code}</span>
                            </div>

                            <div class="dossier-hero-actions">
                                <button class="btn btn-sm btn-cyan" onclick="SaleReportModal.open('${v.id}')">
                                    📄 GERAR RELATÓRIO PARA VENDA
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="DossierView.shareDna('${v.dna_code}')">
                                    🔗 COMPARTILHAR DNA
                                </button>
                            </div>
                        </div>

                        <div class="vehicle-title-row">
                            <h2>${v.brand} ${v.model}</h2>
                        </div>
                        <div class="vehicle-version-row">
                            ${v.version_label || ''} • ${v.manufacture_year}/${v.model_year}
                        </div>

                        <div class="vehicle-specs-tags">
                            <span class="spec-tag">Placa: <strong>${v.license_plate}</strong></span>
                            <span class="spec-tag">Chassi: <strong>${v.chassis_vin.substring(0, 9)}****</strong></span>
                            <span class="spec-tag">Quilometragem: <strong>${formattedKm} km</strong></span>
                            <span class="spec-tag">Câmbio: <strong>${v.transmission_type || 'Automático'}</strong></span>
                            <span class="spec-tag">Combustível: <strong>${v.fuel_type}</strong></span>
                            <span class="spec-tag spec-tag-full">Proprietário Atual: <strong>${v.current_owner}</strong></span>
                        </div>
                    </div>

                    <!-- Índice de Saúde do Histórico (Item 9) -->
                    <div class="dossier-health-hero">
                        <span style="font-size:10px; font-weight:800; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px;">Saúde do Histórico</span>
                        <div class="health-gauge-circle">
                            <span class="health-score-big">${h.overallScore}</span>
                            <span class="health-score-base">/100</span>
                        </div>
                        <div class="health-status-text">${h.continuityStatus === 'EXCELLENT' ? 'Excelente Confiabilidade' : 'Histórico Regular'}</div>
                        <div class="health-documented-perc">Histórico Documentado: <strong>${h.documentedPercentage}%</strong></div>
                    </div>
                </div>

                <!-- Barra de Contadores 360° (Item 8) -->
                <div class="dossier-counters-bar">
                    <div class="counter-chip">
                        <div class="val">${v.owners_count}</div>
                        <div class="lbl">Proprietários</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.workshops_count}</div>
                        <div class="lbl">Oficinas</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.services_count}</div>
                        <div class="lbl">Serviços</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val" style="color:var(--proof-level-4);">${v.proven_services_count}</div>
                        <div class="lbl">Comprovados</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.parts_count}</div>
                        <div class="lbl">Peças</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.invoices_count}</div>
                        <div class="lbl">Notas Fiscais</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.photos_count}</div>
                        <div class="lbl">Fotos</div>
                    </div>
                    <div class="counter-chip">
                        <div class="val">${v.mileage_count}</div>
                        <div class="lbl">Registros Km</div>
                    </div>
                </div>
            </div>
        `;
    },

    // Alternar Abas do Dossiê
    switchTab(tabKey) {
        this.activeTab = tabKey;
        document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabKey);
        });
        const contentBox = document.getElementById('dossier-tab-content');
        if (contentBox) {
            contentBox.innerHTML = this.renderTabContent(tabKey);
        }
    },

    // Renderizar Conteúdo de cada Aba
    renderTabContent(tabKey) {
        const data = this.currentData;
        if (!data) return '';

        switch (tabKey) {
            case 'resumo':
                return this.renderTabResumo(data);
            case 'timeline':
                return this.renderTabTimeline(data.timeline);
            case 'servicos':
                return this.renderTabServicos(data.services);
            case 'pecas':
                return this.renderTabPecas(data.parts);
            case 'notas':
                return this.renderTabNotas(data.invoices);
            case 'fotos':
                return this.renderTabFotos(data.photos);
            case 'quilometragem':
                return this.renderTabQuilometragem(data.mileages);
            case 'proprietarios':
                return this.renderTabProprietarios(data);
            case 'oficinas':
                return this.renderTabOficinas(data.workshops);
            case 'documentos':
                return this.renderTabDocumentos(data);
            case 'valor':
                return this.renderTabValor(data);
            case 'auditoria':
                return this.renderTabAuditoria(data.auditLogs);
            default:
                return `<div class="panel-box">Aba em construção.</div>`;
        }
    },

    // Aba Resumo 360°
    renderTabResumo(data) {
        const h = data.health;
        return `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap:20px;">
                <div class="panel-box">
                    <div class="panel-title">❤️ Índice de Saúde do Histórico</div>
                    <div style="margin-bottom:14px; font-size:13px; color:var(--text-muted); line-height:1.6;">
                        ${h.rationale}
                    </div>
                    <div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                            <span>Nível de Comprovação dos Registros</span>
                            <strong style="color:var(--brand-cyan);">${h.documentedPercentage}%</strong>
                        </div>
                        <div style="width:100%; height:8px; background:var(--border-subtle); border-radius:var(--radius-full); overflow:hidden;">
                            <div style="width:${h.documentedPercentage}%; height:100%; background:linear-gradient(90deg, var(--brand-primary), var(--brand-cyan));"></div>
                        </div>
                        <div style="margin-top:14px; display:grid; grid-template-columns:repeat(auto-fit, minmax(min(140px, 100%), 1fr)); gap:10px; font-size:11px; color:var(--text-muted);">
                            <div>✓ Serviços Comprovados: <strong>${h.provenServicesCount}</strong></div>
                            <div>✓ Notas Fiscais Anexadas: <strong>${h.invoicesCount}</strong></div>
                            <div>✓ Oficinas Verificadas: <strong>${h.verifiedWorkshopsCount}</strong></div>
                            <div>✓ Registros Coerentes de Km: <strong>${h.mileageRecordsCount}</strong></div>
                        </div>
                    </div>
                </div>

                <div class="panel-box">
                    <div class="panel-title">🛡️ Certidões e Documentação</div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-surface-elevated); border-radius:var(--radius-sm);">
                            <span style="font-size:13px;">CRLV-e Licenciamento 2025/2026</span>
                            <span class="badge-proof badge-proven">✅ QUITADO / EM DIA</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-surface-elevated); border-radius:var(--radius-sm);">
                            <span style="font-size:13px;">IPVA 2026 (Sefaz)</span>
                            <span class="badge-proof badge-proven">✅ QUITADO INTEGRAL</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-surface-elevated); border-radius:var(--radius-sm);">
                            <span style="font-size:13px;">Infrações e Multas (RENAINF)</span>
                            <span class="badge-proof badge-proven">✅ NADA CONSTA</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-surface-elevated); border-radius:var(--radius-sm);">
                            <span style="font-size:13px;">Leilão e Sinistros Indenizados</span>
                            <span class="badge-proof badge-proven">✅ CERTIDÃO NEGATIVA</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Aba Linha do Tempo (Item 10)
    renderTabTimeline(timeline) {
        return `
            <div class="panel-box">
                <div class="panel-title">⏱️ Linha do Tempo Cronológica Completa</div>
                <div class="timeline-track">
                    ${timeline.map(item => `
                        <div class="timeline-node">
                            <div class="timeline-bullet ${item.badgeClass.replace('badge-', '')}">●</div>
                            <div class="timeline-card">
                                <div class="timeline-meta-row">
                                    <span class="timeline-km-badge">${item.mileage > 0 ? Number(item.mileage).toLocaleString('pt-BR') + ' km' : '0 km'}</span>
                                    <span class="badge-proof ${item.badgeClass}">${item.badge}</span>
                                    <span class="timeline-date">${item.date}</span>
                                </div>
                                <div class="timeline-title">${item.title}</div>
                                <div class="timeline-desc">${item.description}</div>
                                ${item.workshop ? `
                                    <div class="timeline-footer-row">
                                        <span>Oficina: <strong>${item.workshop}</strong></span>
                                        <span>${item.hasInvoice ? '🧾 Nota Fiscal Disponível' : ''} ${item.photoCount > 0 ? `• 📷 ${item.photoCount} foto(s)` : ''}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Aba Serviços com Níveis de Comprovação
    renderTabServicos(services) {
        return `
            <div class="panel-box">
                <div class="panel-title">
                    <span>🔧 Histórico de Serviços (${services.length})</span>
                </div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Km</th>
                                <th>Serviço</th>
                                <th>Categoria</th>
                                <th>Oficina / Técnico</th>
                                <th>Valor</th>
                                <th>Comprovação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${services.map(s => {
                                let badgeClass = 'badge-declared';
                                let badgeText = '⚠️ DECLARADO';
                                if (s.proof_level === 4) { badgeClass = 'badge-proven'; badgeText = '✅ COMPROVADO'; }
                                else if (s.proof_level === 3) { badgeClass = 'badge-confirmed'; badgeText = '✅ CONFIRMADO'; }
                                else if (s.proof_level === 2) { badgeClass = 'badge-documented'; badgeText = '📄 DOCUMENTADO'; }

                                return `
                                    <tr>
                                        <td>${s.service_date}</td>
                                        <td class="mono">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                        <td>
                                            <strong>${s.service_title}</strong>
                                            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${s.description}</div>
                                        </td>
                                        <td><span class="spec-tag">${s.category}</span></td>
                                        <td>
                                            ${s.workshop_name ? `<strong>${s.workshop_name}</strong><br><span style="font-size:11px; color:var(--text-dim);">${s.responsible_technician_name || ''}</span>` : '<span style="color:var(--text-dim);">Declarado pelo Dono</span>'}
                                        </td>
                                        <td class="mono">R$ ${(s.total_cost_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td><span class="badge-proof ${badgeClass}">${badgeText}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Aba Peças
    renderTabPecas(parts) {
        return `
            <div class="panel-box">
                <div class="panel-title">🧩 Peças e Componentes Instalados (${parts.length})</div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Peça</th>
                                <th>Fabricante</th>
                                <th>Código / Part Number</th>
                                <th>Data</th>
                                <th>Km</th>
                                <th>Garantia</th>
                                <th>Condição</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${parts.map(p => `
                                <tr>
                                    <td><strong>${p.part_name}</strong></td>
                                    <td>${p.manufacturer}</td>
                                    <td class="mono">${p.part_number || 'OEM'}</td>
                                    <td>${p.service_date}</td>
                                    <td class="mono">${Number(p.mileage).toLocaleString('pt-BR')} km</td>
                                    <td>${p.warranty_months} meses</td>
                                    <td><span class="badge-proof badge-proven">${p.part_condition === 'NEW' ? 'Nova' : 'Remanufaturada'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Aba Notas Fiscais
    renderTabNotas(invoices) {
        return `
            <div class="panel-box">
                <div class="panel-title">🧾 Notas Fiscais Vinculadas (${invoices.length})</div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Número NF-e</th>
                                <th>Emitente</th>
                                <th>CNPJ</th>
                                <th>Data Emissão</th>
                                <th>Valor Total</th>
                                <th>Chave de Acesso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(inv => `
                                <tr>
                                    <td class="mono"><strong>${inv.invoice_number}</strong></td>
                                    <td>${inv.issuer_name}</td>
                                    <td class="mono">${inv.issuer_cnpj || '-'}</td>
                                    <td>${inv.issue_date}</td>
                                    <td class="mono" style="color:var(--brand-cyan);">R$ ${(inv.total_amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td class="mono" style="font-size:10px; color:var(--text-dim);">${inv.access_key || 'Chave Registrada'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Aba Fotos
    renderTabFotos(photos) {
        return `
            <div class="panel-box">
                <div class="panel-title">📷 Galeria Fotográfica Comprobatória (${photos.length})</div>
                <div class="photos-grid">
                    ${photos.map(p => `
                        <div class="photo-card" onclick="DossierView.openPhotoZoom('${p.file_path}', '${p.title}')">
                            <img src="${p.file_path}" alt="${p.title}" />
                            <div class="photo-info">
                                <h4>${p.title}</h4>
                                <p>${p.photo_category} • ${p.taken_at.split(' ')[0]}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Aba Quilometragem
    renderTabQuilometragem(mileages) {
        return `
            <div class="panel-box">
                <div class="panel-title">📏 Evolução Temporal de Quilometragem (${mileages.length} registros)</div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Quilometragem</th>
                                <th>Origem</th>
                                <th>Verificação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mileages.map(m => `
                                <tr>
                                    <td>${m.recorded_at}</td>
                                    <td class="mono" style="font-size:15px; font-weight:700;">${Number(m.mileage).toLocaleString('pt-BR')} km</td>
                                    <td>${m.source}</td>
                                    <td><span class="badge-proof badge-proven">✅ Verificado</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Aba Proprietários
    renderTabProprietarios(data) {
        return `
            <div class="panel-box">
                <div class="panel-title">👤 Histórico de Propriedade (Preservação de Sigilo)</div>
                <div class="alert-box alert-info">
                    ℹ️ Os dados pessoais sensíveis (CPF, telefone, endereço) são protegidos por criptografia e mascarados para atender à LGPD.
                </div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Proprietário</th>
                                <th>Período de Posse</th>
                                <th>Km na Transferência</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Carlos Alberto Silva</strong> (Atual)</td>
                                <td>2023 — Presente</td>
                                <td class="mono">45.000 km</td>
                                <td><span class="badge-proof badge-proven">Proprietário Atual</span></td>
                            </tr>
                            <tr>
                                <td><strong>Ricardo M. Mendes</strong></td>
                                <td>2021 — 2023</td>
                                <td class="mono">0 km (0km de fábrica)</td>
                                <td><span class="badge-proof badge-confirmed">1º Dono</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Aba Oficinas
    renderTabOficinas(workshops) {
        return `
            <div class="panel-box">
                <div class="panel-title">🏭 Rede de Oficinas que já Atenderam o Veículo</div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap:16px;">
                    ${workshops.map(w => `
                        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <strong style="font-size:15px;">${w.trade_name}</strong>
                                ${w.verified_badge ? '<span class="badge-proof badge-proven">Selo Oficial</span>' : ''}
                            </div>
                            <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">
                                ${w.city}/${w.state} • CNPJ ${w.cnpj}
                            </div>
                            <div style="font-size:12px; color:var(--brand-cyan); margin-top:10px;">
                                ${w.services_count} serviço(s) registrado(s) neste DNA
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Aba Documentos e Débitos
    renderTabDocumentos(data) {
        return `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap:20px;">
                <div class="panel-box">
                    <div class="panel-title">IPVA e Tributos (Sefaz)</div>
                    <div class="table-responsive">
                        <table class="erp-table" style="min-width:0; width:100%;">
                            <tbody>
                                ${data.taxes.map(t => `
                                    <tr>
                                        <td>IPVA ${t.reference_year}</td>
                                        <td class="mono">R$ ${(t.amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td><span class="badge-proof badge-proven">${t.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="panel-box">
                    <div class="panel-title">Multas e Gravames</div>
                    <div class="alert-box alert-success">
                        ✓ Nenhuma infração ou multa pendente nos órgãos oficiais.
                    </div>
                    <div class="alert-box alert-success">
                        ✓ Veículo sem gravame financeiro, alienação ou restrição judicial.
                    </div>
                </div>
            </div>
        `;
    },

    // Aba FIPE e Mercado
    renderTabValor(data) {
        const fipe = data.fipe;
        const market = data.market;

        return `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap:20px;">
                <div class="panel-box">
                    <div class="panel-title">📊 Cotação Oficial Tabela FIPE</div>
                    <div style="font-size:32px; font-weight:800; color:var(--text-highlight); font-family:var(--font-mono); margin:12px 0;">
                        R$ ${fipe ? (fipe.fipe_price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '142.800,00'}
                    </div>
                    <div style="font-size:12px; color:var(--text-muted);">
                        Referência: ${fipe ? fipe.reference_month_year : 'Março/2026'} • Código FIPE: ${fipe ? fipe.fipe_code : '004495-4'}
                    </div>
                </div>

                <div class="panel-box">
                    <div class="panel-title">💎 Força do Histórico DNA AUTO</div>
                    <div style="font-size:32px; font-weight:800; color:var(--proof-level-4); font-family:var(--font-mono); margin:12px 0;">
                        R$ ${market ? (market.estimated_price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '146.500,00'}
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                        Apresentar um histórico com 92% de comprovação e 5 notas fiscais anexadas reduz incertezas, eleva a liquidez na venda e ajuda a justificar o valor solicitado.
                    </div>
                </div>
            </div>
        `;
    },

    // Aba Auditoria
    renderTabAuditoria(logs) {
        return `
            <div class="panel-box">
                <div class="panel-title">🛡️ Trilha de Auditoria Imutável deste DNA</div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Usuário</th>
                                <th>Perfil</th>
                                <th>Ação</th>
                                <th>IP</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(l => `
                                <tr>
                                    <td>${l.created_at}</td>
                                    <td><strong>${l.user_name || 'Sistema'}</strong></td>
                                    <td>${l.user_role}</td>
                                    <td><span class="mono" style="color:var(--brand-cyan);">${l.action}</span></td>
                                    <td class="mono">${l.ip_address}</td>
                                    <td style="font-size:11px; color:var(--text-dim); max-width:260px; overflow:hidden; text-overflow:ellipsis;">
                                        ${l.data_after || '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Execução da Lupa do Dossiê em Tempo Real (Item 11)
    async executeLensSearch(query) {
        const resultsBox = document.getElementById('lens-search-results');
        if (!query || query.length < 2) {
            resultsBox.style.display = 'none';
            resultsBox.innerHTML = '';
            return;
        }

        try {
            const data = await API.searchInDossier(this.currentData.vehicle.dna_code, query);
            resultsBox.style.display = 'block';

            if (data.totalMatches === 0) {
                resultsBox.innerHTML = `
                    <div class="panel-box" style="border-color:var(--border-subtle); padding:16px;">
                        <span style="color:var(--text-muted);">Nenhum registro encontrado no histórico para a palavra "<strong>${query}</strong>".</span>
                    </div>
                `;
                return;
            }

            resultsBox.innerHTML = `
                <div class="panel-box" style="border-color:var(--brand-cyan); box-shadow:var(--shadow-md);">
                    <div class="panel-title" style="color:var(--brand-cyan);">
                        <span>🔎 Lupa do Dossiê: Encontradas ${data.totalMatches} correspondência(s) para "${query}"</span>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('lens-search-results').style.display='none'">Fechar Busca</button>
                    </div>

                    ${data.parts.length > 0 ? `
                        <div style="margin-bottom:16px;">
                            <h4 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Peças Encontradas:</h4>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                ${data.parts.map(p => `
                                    <div style="background:var(--bg-surface-elevated); padding:10px; border-radius:var(--radius-sm); font-size:13px;">
                                        <strong>${p.part_name}</strong> • ${p.manufacturer} (${p.part_number || 'OEM'}) — Substituído em ${p.service_date} (${Number(p.mileage).toLocaleString('pt-BR')} km)
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${data.services.length > 0 ? `
                        <div>
                            <h4 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Serviços Relacionados:</h4>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                ${data.services.map(s => `
                                    <div style="background:var(--bg-surface-elevated); padding:10px; border-radius:var(--radius-sm); font-size:13px;">
                                        <strong>${s.service_title}</strong> (${s.service_date} • ${Number(s.mileage).toLocaleString('pt-BR')} km) — ${s.description}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (err) {
            console.error('Erro na lupa:', err);
        }
    },

    applyLensSearch(term) {
        const input = document.getElementById('lens-search-input');
        if (input) {
            input.value = term;
            this.executeLensSearch(term);
        }
    },

    // Caso o veículo não possua DNA (Item 15 e 16)
    renderVehicleWithoutDna(vehicle) {
        return `
            <div class="panel-box" style="text-align:center; padding:48px 24px; max-width:680px; margin:40px auto; border-color:var(--proof-level-1-border);">
                <div style="font-size:42px; margin-bottom:14px;">⚠️</div>
                <h2 style="font-size:24px; color:var(--text-highlight); margin-bottom:8px;">ESTE VEÍCULO AINDA NÃO POSSUI DNA</h2>
                <p style="color:var(--text-muted); font-size:14px; max-width:480px; margin:0 auto 24px; line-height:1.6;">
                    O veículo <strong>${vehicle.brand} ${vehicle.model}</strong> (${vehicle.license_plate}) está cadastrado mas ainda não possui um Passaporte Digital Permanente ativado.
                </p>

                <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; max-width:380px; margin:0 auto 24px; text-align:left; font-size:13px;">
                    <div>Placa: <strong>${vehicle.license_plate}</strong></div>
                    <div>Chassi: <strong>${vehicle.chassis_vin}</strong></div>
                    <div>Ano: <strong>${vehicle.manufacture_year}/${vehicle.model_year}</strong></div>
                    <div>Cor: <strong>${vehicle.color}</strong></div>
                </div>

                <button class="btn btn-lg btn-cyan" onclick="WorkshopView.openDnaOfferModal('${vehicle.id}', '${vehicle.license_plate}')">
                    ✨ OFERECER / ATIVAR DNA AO CLIENTE
                </button>
            </div>
        `;
    },

    shareDna(dnaCode) {
        navigator.clipboard.writeText(dnaCode);
        alert(`Código permanente ${dnaCode} copiado para a área de transferência!`);
    },

    openPhotoZoom(url, title) {
        const modal = document.getElementById('photo-zoom-modal');
        const img = document.getElementById('photo-zoom-img');
        const caption = document.getElementById('photo-zoom-title');
        if (modal && img) {
            img.src = url;
            caption.textContent = title;
            modal.classList.add('active');
        }
    }
};
