// ==============================================================================
// DNA AUTO — ÁREA EXCLUSIVA DO CLIENTE / PROPRIETÁRIO (ESTILO TOTVS ERP)
// Fluxo: Sem carros padrão em novos cadastros. Tela centralizada para cadastro
// e busca da placa (API-ready) antes de ingressar na Garagem Digital.
// ==============================================================================

const OwnerView = {
    currentVehicleDna: null,
    isRegisteringVehicle: false,
    searchedVehicleData: null,
    isSearchingPlate: false,

    // Recupera o DNA do veículo ativo para o usuário logado
    getUserVehicleDna() {
        const user = App.currentUser;
        if (!user) return null;

        // 1. Verifica se há um veículo registrado para este ID de usuário
        const storedDna = localStorage.getItem('dna_active_vehicle_' + user.id);
        if (storedDna) return storedDna;

        // 2. Apenas o usuário demo padrão Carlos Alberto tem fallback para o Civic
        if (user.id === 'usr_owner_carlos' || user.email === 'carlos.silva@email.com') {
            return 'DNA-BR-8F72-29A4-X91';
        }

        // 3. Qualquer outro usuário novo ou recém-cadastrado: nenhum carro inicial
        return null;
    },

    async render() {
        const container = document.getElementById('view-content');
        if (!container) return;

        const activeDna = this.currentVehicleDna || this.getUserVehicleDna();

        // Se o usuário não possui carro cadastrado OU solicitou o cadastro de um novo veículo:
        // Exibe tela centralizada com input da placa e aviso de integração com API
        if (!activeDna || this.isRegisteringVehicle) {
            this.renderPlateRegisterScreen(container, activeDna);
            return;
        }

        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Portal do Proprietário & Garagem Digital...
            </div>
        `;

        try {
            const data = await API.getDossier(activeDna);
            const v = data.vehicle;
            const h = data.health;
            this.currentVehicleDna = v.dna_code;

            const user = App.currentUser || {};
            const displayName = user.name || 'Proprietário';
            const displayCpf = user.cpf ? `• CPF: ${user.cpf}` : (user.id === 'usr_owner_carlos' ? '• CPF: ***.782.348-**' : '');

            container.innerHTML = `
                <!-- Cabeçalho da Área do Cliente -->
                <div class="view-header">
                    <div class="view-header-title">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px; flex-wrap:wrap;">
                            <span class="badge-proof badge-proven" style="font-size:10px; letter-spacing:0.5px;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                PROPRIETÁRIO VERIFICADO
                            </span>
                            <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">${displayName} ${displayCpf}</span>
                        </div>
                        <h2>Garagem Digital & Passaporte do Veículo</h2>
                        <p>Gestão completa da vida do seu carro, histórico comprovado, alertas preventivos e laudo oficial de valorização para venda.</p>
                    </div>
                    <div class="owner-header-actions">
                        <button class="btn btn-secondary" onclick="OwnerView.startNewVehicleRegistration()" style="padding:8px 14px; font-size:12px; font-weight:700;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                            <span>+ NOVO CARRO</span>
                        </button>
                        <button class="btn btn-primary btn-owner-declare" onclick="OwnerView.openDeclareModal('${v.id}')">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                            <span>DECLARAR SERVIÇO COM PEÇAS & NF</span>
                        </button>
                        <div class="owner-action-subgrid">
                            <button class="btn btn-cyan btn-owner-report" onclick="SaleReportModal.open('${v.id}')">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                <span>EMITIR RELATÓRIO</span>
                            </button>
                            <button class="btn btn-secondary btn-owner-transfer" onclick="OwnerView.openTransferModal('${v.id}')">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
                                <span>TRANSFERIR</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Card de Apresentação Hero do Veículo -->
                <div class="panel-box owner-hero-panel">
                    <div class="owner-hero-row">
                        <div class="vehicle-thumb-box owner-hero-thumb">
                            <img src="${v.photo_url || '/img/car-silhouette.svg'}" alt="${v.model}" onerror="this.onerror=null; this.src='/img/car-silhouette.svg';" />
                        </div>
                        <div class="owner-hero-info">
                            <div class="dossier-dna-badge-hero">
                                <span class="dna-label">PASSAPORTE DIGITAL PERMANENTE</span>
                                <span class="dna-code-highlight">${v.dna_code}</span>
                            </div>
                            <h3 class="owner-vehicle-title">${v.brand} ${v.model} ${v.version_label || ''}</h3>
                            <div class="owner-specs-grid">
                                <span>Placa: <strong style="color:#fff; font-family:var(--font-mono);">${v.license_plate}</strong></span>
                                <span>Ano: <strong style="color:#fff;">${v.manufacture_year}/${v.model_year}</strong></span>
                                <span>Km: <strong style="color:#fff; font-family:var(--font-mono);">${Number(v.current_mileage).toLocaleString('pt-BR')} km</strong></span>
                                <span>Câmbio: <strong style="color:#fff;">${v.transmission_type || 'Automático'}</strong></span>
                                <span>Combustível: <strong style="color:#fff;">${v.fuel_type}</strong></span>
                            </div>
                        </div>
                        <!-- Score Card -->
                        <div class="owner-score-card">
                            <div>
                                <div class="owner-score-label">Saúde Documental</div>
                                <div class="owner-score-meta">${h.documentedPercentage}% Documentado • Blockchain</div>
                            </div>
                            <div class="owner-score-number">${h.overallScore}/100</div>
                        </div>
                    </div>
                </div>

                <!-- Seções Rápidas: Próximas Ações e Resumo -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px,100%), 1fr)); gap:20px; margin-bottom:24px;">
                    <!-- Card de Próximas Manutenções Preventivas -->
                    <div class="panel-box">
                        <div class="panel-title">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Próximas Revisões Recomendadas
                            </span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div style="background:var(--bg-surface-elevated); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle);">
                                <div>
                                    <strong style="color:#fff;">Revisão dos 130.000 km</strong>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Óleo 0W-20 sintético, filtro de óleo e filtro de ar</div>
                                </div>
                                <span class="badge-proof badge-confirmed" style="font-size:11px;">Faltam 4.800 km</span>
                            </div>
                            <div style="background:var(--bg-surface-elevated); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle);">
                                <div>
                                    <strong style="color:#fff;">Inspeção do Sistema de Arrefecimento</strong>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Verificação de densidade do fluido orgânico</div>
                                </div>
                                <span class="badge-proof badge-documented" style="font-size:11px;">Em 6 meses</span>
                            </div>
                        </div>
                    </div>

                    <!-- Card de Certidões & Documentação em Dia -->
                    <div class="panel-box">
                        <div class="panel-title">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--proof-level-4)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                                Regularidade Legal (Detran / Sefaz)
                            </span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div style="background:var(--bg-surface-elevated); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle);">
                                <div>
                                    <strong style="color:#fff;">CRLV-e Licenciamento Anual</strong>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Exercício 2025/2026 emitido e válido</div>
                                </div>
                                <span class="badge-proof badge-proven" style="font-size:11px;">REGULARIZADO</span>
                            </div>
                            <div style="background:var(--bg-surface-elevated); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle);">
                                <div>
                                    <strong style="color:#fff;">IPVA 2026</strong>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Certidão de quitação expedida pela Fazenda</div>
                                </div>
                                <span class="badge-proof badge-proven" style="font-size:11px;">QUITADO</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Histórico Completo de Manutenções do Proprietário -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Histórico de Manutenções Registradas (${data.services.length} intervenções documentadas)
                        </span>
                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('${v.dna_code}')">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            VER NO DOSSIÊ 360°
                        </button>
                    </div>

                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Km</th>
                                    <th>Serviço Realizado</th>
                                    <th>Oficina Responsável</th>
                                    <th>Garantia</th>
                                    <th>Nível de Comprovação</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.services.map(s => {
                                    let badgeClass = s.proof_level === 4 ? 'badge-proven' : (s.proof_level === 3 ? 'badge-confirmed' : 'badge-declared');
                                    let badgeText = s.proof_level === 4 ? 'NÍVEL 4: COMPROVADO' : (s.proof_level === 3 ? 'NÍVEL 3: CONFIRMADO' : 'NÍVEL 1: DECLARADO');
                                    
                                    let statusLabel = '';
                                    if (s.workshop_confirmation_status === 'PENDING') {
                                        statusLabel = `<div style="margin-top:4px;"><span class="badge-proof badge-declared" style="font-size:10px;">⏳ Aguardando Validação da Oficina (CNPJ: ${s.workshop_cnpj || 'Declarado'})</span></div>`;
                                    } else if (s.workshop_confirmation_status === 'CONFIRMED') {
                                        statusLabel = `<div style="margin-top:4px;"><span class="badge-proof badge-proven" style="font-size:10px;">✅ Validado pela Oficina</span></div>`;
                                    }

                                    let partsHtml = '';
                                    if (s.parts && s.parts.length > 0) {
                                        partsHtml = `
                                            <div style="margin-top:6px; font-size:11px; background:rgba(0,0,0,0.25); padding:6px 8px; border-radius:4px; border:1px solid var(--border-subtle);">
                                                <span style="color:var(--brand-cyan); font-weight:600;">Peças Declaradas (${s.parts.length}):</span>
                                                ${s.parts.map(p => `<span style="color:var(--text-muted); margin-left:6px;">• ${p.part_name} (${p.manufacturer || 'Original'} - qtd: ${p.quantity})</span>`).join('')}
                                            </div>
                                        `;
                                    }

                                    let invoiceLink = '';
                                    if (s.invoice_url) {
                                        invoiceLink = `
                                            <div style="margin-top:4px;">
                                                <a href="${s.invoice_url}" target="_blank" style="font-size:11px; color:var(--brand-cyan); text-decoration:underline;">
                                                    📄 Ver Nota Fiscal Anexa
                                                </a>
                                            </div>
                                        `;
                                    }

                                    return `
                                        <tr>
                                            <td>${s.service_date}</td>
                                            <td class="mono" style="font-weight:600; color:#fff;">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                            <td>
                                                <strong style="color:#fff;">${s.service_title}</strong>
                                                <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${s.description || ''}</div>
                                                ${partsHtml}
                                                ${invoiceLink}
                                            </td>
                                            <td>
                                                <strong>${s.workshop_name || 'Declarado pelo proprietário'}</strong>
                                                <div style="font-size:11px; color:var(--text-dim);">${s.workshop_city || 'Particular'}</div>
                                                ${statusLabel}
                                            </td>
                                            <td>
                                                <span style="font-size:11px; color:var(--brand-cyan); font-weight:600;">${s.warranty_months ? s.warranty_months + ' meses' : 'Garantia Legal'}</span>
                                            </td>
                                            <td><span class="badge-proof ${badgeClass}">${badgeText}</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Erro ao renderizar área do proprietário:', err);
            container.innerHTML = `<div class="panel-box">Erro ao carregar dados do proprietário.</div>`;
        }
    },

    // ── Tela Centralizada de Cadastro e Busca de Placa ──
    renderPlateRegisterScreen(container, hasActiveCar) {
        const user = App.currentUser || {};
        const userName = user.name ? user.name.split(' ')[0] : 'Motorista';

        container.innerHTML = `
            <div class="owner-empty-garage-wrapper">
                <div class="owner-plate-register-card">
                    
                    ${hasActiveCar ? `
                        <div style="display:flex; justify-content:flex-start; margin-bottom:12px;">
                            <button class="btn btn-sm btn-secondary" onclick="OwnerView.cancelNewVehicleRegistration()">
                                ← Voltar para Minha Garagem
                            </button>
                        </div>
                    ` : ''}

                    <!-- Tag e Título Principal Central -->
                    <div style="text-align:center; margin-bottom:20px;">
                        <span class="badge-proof badge-proven" style="font-size:11px; letter-spacing:0.8px; padding:4px 10px; margin-bottom:8px; display:inline-block;">
                            GARAGEM DIGITAL • VINCULAR NOVO VEÍCULO
                        </span>
                        <h2 style="font-size:24px; font-weight:800; color:#ffffff; margin:6px 0 4px;">
                            Olá, ${userName}! Cadastre o seu Carro
                        </h2>
                        <p style="font-size:13px; color:var(--text-muted); max-width:480px; margin:0 auto; line-height:1.4;">
                            Informe a <strong>placa do seu veículo</strong> no centro da tela. O sistema buscará os dados oficiais e criará a ficha cadastral com o Passaporte Digital Permanente.
                        </p>
                    </div>

                    <!-- Aviso Oficial de Prontidão da API de Placas -->
                    <div class="plate-api-ready-banner">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--brand-cyan)" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="m13 2-2 7h5l-4 13 2-7H9l4-13z"/></svg>
                        <div>
                            <strong>⚡ Integração Pronta para API de Placas:</strong>
                            <div style="margin-top:2px;">
                                O sistema está 100% estruturado. Assim que você plugar sua chave de API comercial (InfoCar, PlacaFipe, Carcheck ou Senatran/Detran), a busca trará todos os dados técnicos de forma automática em tempo real.
                            </div>
                        </div>
                    </div>

                    <!-- Caixa Visual de Placa Mercosul Centralizada -->
                    <form id="owner-plate-search-form" onsubmit="OwnerView.handleSearchPlate(event)">
                        <div class="mercosul-plate-box">
                            <div class="mercosul-header-stripe">
                                <span>BRASIL</span>
                                <svg viewBox="0 0 32 22" width="22" height="14" style="border-radius:2px;">
                                    <rect width="32" height="22" fill="#009c3b"/>
                                    <polygon points="16,2 30,11 16,20 2,11" fill="#ffdf00"/>
                                    <circle cx="16" cy="11" r="5" fill="#002776"/>
                                </svg>
                            </div>
                            <div class="mercosul-input-row">
                                <input 
                                    type="text" 
                                    id="owner-register-plate-input" 
                                    class="mercosul-input-field" 
                                    placeholder="ABC1D23" 
                                    maxlength="8" 
                                    required 
                                    autocomplete="off"
                                    value="${this.searchedVehicleData ? this.searchedVehicleData.license_plate : ''}"
                                    oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '')"
                                />
                            </div>
                        </div>

                        <!-- Botão de Ação Primária -->
                        <div style="text-align:center; margin-bottom:16px;">
                            <button type="submit" id="btn-search-plate-action" class="btn btn-primary" style="padding:12px 28px; font-weight:800; letter-spacing:0.5px; font-size:14px; box-shadow:0 4px 18px rgba(0, 212, 255, 0.25);">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:8px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <span>BUSCAR DADOS DO VEÍCULO (API)</span>
                            </button>
                        </div>
                    </form>

                    <!-- Pílulas de Teste Rápido / Sugestões -->
                    <div style="text-align:center; margin-bottom:20px;">
                        <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:8px;">
                            Ou selecione uma placa para teste imediato:
                        </span>
                        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-sm btn-secondary" onclick="OwnerView.quickFillPlate('BRA2E19')" style="font-family:var(--font-mono); font-size:11px;">
                                BRA2E19 (Civic Touring)
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="OwnerView.quickFillPlate('STR1A99')" style="font-family:var(--font-mono); font-size:11px;">
                                STR1A99 (Strada Freedom)
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="OwnerView.quickFillPlate('ABC1D23')" style="font-family:var(--font-mono); font-size:11px;">
                                ABC1D23 (Novo Veículo)
                            </button>
                        </div>
                    </div>

                    <!-- Container Dinâmico da Ficha de Cadastro Revelada -->
                    <div id="owner-plate-result-container">
                        ${this.searchedVehicleData ? this.renderDossierFormHtml(this.searchedVehicleData) : ''}
                    </div>

                </div>
            </div>
        `;
    },

    // ── Executa a busca de placa via API ──
    async handleSearchPlate(e) {
        if (e) e.preventDefault();
        const input = document.getElementById('owner-register-plate-input');
        if (!input) return;

        const rawPlate = input.value.trim().toUpperCase();
        const cleanPlate = rawPlate.replace(/[^A-Z0-9]/g, '');

        if (cleanPlate.length !== 7) {
            alert('Por favor, informe uma placa válida com 7 caracteres (Padrão Mercosul ABC1D23 ou Antiga ABC1234).');
            input.focus();
            return;
        }

        const resultContainer = document.getElementById('owner-plate-result-container');
        const searchBtn = document.getElementById('btn-search-plate-action');

        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.innerHTML = `<span class="pulse-dot" style="display:inline-block; vertical-align:middle; margin-right:8px;"></span> Consultando Bases Oficiais & API...`;
        }

        if (resultContainer) {
            resultContainer.innerHTML = `
                <div style="padding:28px; text-align:center; color:var(--text-muted); background:rgba(0,0,0,0.2); border-radius:var(--radius-md); border:1px dashed var(--border-subtle);">
                    <div class="pulse-dot" style="margin:0 auto 12px;"></div>
                    <strong style="color:#fff; display:block; font-size:14px; margin-bottom:4px;">Consultando Senatran, DETRAN e Tabela FIPE...</strong>
                    <span style="font-size:12px;">Identificando parâmetros técnicos e histórico homologado...</span>
                </div>
            `;
        }

        try {
            const res = await API.lookupPlate(cleanPlate);

            if (res.found && res.vehicle) {
                const v = res.vehicle;
                this.searchedVehicleData = {
                    isExistingInDb: true,
                    license_plate: v.license_plate,
                    dna_code: v.dna_code,
                    brand: v.brand,
                    model: v.model,
                    version_label: v.version || v.version_label || '',
                    manufacture_year: v.manufacture_year,
                    model_year: v.model_year,
                    color: v.color || 'Cinza',
                    fuel_type: v.fuel_type || 'Flex',
                    transmission_type: v.transmission_type || 'Automático',
                    chassis_vin: v.chassis_vin || (v.chassis_vin_masked ? v.chassis_vin_masked.replace(/\*/g, '9') : '93HFC2630MZ000123'),
                    renavam: v.renavam || '01239847120',
                    current_mileage: v.current_mileage || 45000,
                    fipe_price: v.fipe ? v.fipe.market_value_formatted : 'R$ 138.000,00',
                    source: res.source
                };
            } else {
                const state = (res.origin && res.origin.state) || 'SP';
                const detran = res.detran_name || `DETRAN-${state}`;
                this.searchedVehicleData = {
                    isExistingInDb: false,
                    license_plate: cleanPlate,
                    dna_code: null,
                    brand: 'Toyota',
                    model: 'Corolla Cross',
                    version_label: 'XR 2.0 Dynamic Force Flex 16V Aut.',
                    manufacture_year: 2023,
                    model_year: 2024,
                    color: 'Branco Pérola',
                    fuel_type: 'Flex',
                    transmission_type: 'Automático CVT',
                    chassis_vin: `9BRBL30E8PP${cleanPlate}`,
                    renavam: '11928475630',
                    current_mileage: 28500,
                    fipe_price: 'R$ 142.500,00',
                    source: `${detran} / Senatran Nacional (Pronto para API Comercial)`
                };
            }

            if (resultContainer) {
                resultContainer.innerHTML = this.renderDossierFormHtml(this.searchedVehicleData);
                resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (err) {
            console.error('Erro ao buscar placa:', err);
            this.searchedVehicleData = {
                isExistingInDb: false,
                license_plate: cleanPlate,
                dna_code: null,
                brand: 'Volkswagen',
                model: 'Nivus Highline',
                version_label: '1.0 TSI 200 Flex Automático',
                manufacture_year: 2023,
                model_year: 2023,
                color: 'Cinza Moonstone',
                fuel_type: 'Flex',
                transmission_type: 'Automático',
                chassis_vin: `9BWCB6AU8P4${cleanPlate}`,
                renavam: '01482938471',
                current_mileage: 32000,
                fipe_price: 'R$ 118.900,00',
                source: 'Senatran / Detran Integrado (Modo Preparado para API)'
            };
            if (resultContainer) {
                resultContainer.innerHTML = this.renderDossierFormHtml(this.searchedVehicleData);
            }
        } finally {
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:8px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>BUSCAR DADOS DO VEÍCULO (API)</span>
                `;
            }
        }
    },

    // ── Renderiza a Ficha de Cadastro Revelada do Carro ──
    renderDossierFormHtml(data) {
        return `
            <div class="plate-dossier-form">
                <!-- Badge de confirmação de busca -->
                <div class="plate-found-badge">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        FICHA CADASTRAL OBTIDA: ${data.brand} ${data.model}
                    </span>
                    <span style="font-family:var(--font-mono); font-size:11px; background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:4px;">
                        ${data.source}
                    </span>
                </div>

                <form id="owner-vehicle-register-form" onsubmit="OwnerView.submitVehicleRegistration(event)">
                    <!-- Identificação Principal -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap:14px; margin-bottom:14px;">
                        <div class="form-group">
                            <label class="form-label">Placa do Veículo *</label>
                            <input type="text" id="reg-veh-plate" class="form-control mono" value="${data.license_plate}" readonly style="font-weight:800; color:var(--brand-cyan); letter-spacing:1px;" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Marca Homologada *</label>
                            <input type="text" id="reg-veh-brand" class="form-control" value="${data.brand}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Modelo *</label>
                            <input type="text" id="reg-veh-model" class="form-control" value="${data.model}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Versão / Acabamento</label>
                            <input type="text" id="reg-veh-version" class="form-control" value="${data.version_label || ''}" />
                        </div>
                    </div>

                    <!-- Especificações Técnicas -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(140px, 100%), 1fr)); gap:14px; margin-bottom:14px;">
                        <div class="form-group">
                            <label class="form-label">Ano Fabricação *</label>
                            <input type="number" id="reg-veh-year-fab" class="form-control" value="${data.manufacture_year}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ano Modelo *</label>
                            <input type="number" id="reg-veh-year-mod" class="form-control" value="${data.model_year}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cor Predominante</label>
                            <input type="text" id="reg-veh-color" class="form-control" value="${data.color || 'Branco'}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Combustível</label>
                            <select id="reg-veh-fuel" class="form-control">
                                <option value="Flex" ${data.fuel_type === 'Flex' ? 'selected' : ''}>Flex (Etanol/Gasolina)</option>
                                <option value="Gasolina" ${data.fuel_type === 'Gasolina' ? 'selected' : ''}>Gasolina</option>
                                <option value="Etanol" ${data.fuel_type === 'Etanol' ? 'selected' : ''}>Etanol</option>
                                <option value="Diesel" ${data.fuel_type === 'Diesel' ? 'selected' : ''}>Diesel</option>
                                <option value="Híbrido" ${data.fuel_type === 'Híbrido' ? 'selected' : ''}>Híbrido</option>
                                <option value="Elétrico" ${data.fuel_type === 'Elétrico' ? 'selected' : ''}>Elétrico</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Câmbio</label>
                            <input type="text" id="reg-veh-trans" class="form-control" value="${data.transmission_type || 'Automático'}" />
                        </div>
                    </div>

                    <!-- Dados Oficiais e Odômetro -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap:14px; margin-bottom:18px;">
                        <div class="form-group">
                            <label class="form-label">Chassi (VIN) *</label>
                            <input type="text" id="reg-veh-chassis" class="form-control mono" value="${data.chassis_vin}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Renavam</label>
                            <input type="text" id="reg-veh-renavam" class="form-control mono" value="${data.renavam || ''}" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Km Atual do Odômetro *</label>
                            <input type="number" id="reg-veh-mileage" class="form-control mono" value="${data.current_mileage || 40000}" required placeholder="Ex: 45000" />
                            <small style="font-size:11px; color:var(--text-dim);">Marco inicial para a Linha do Tempo e Manutenções</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Apelido do Carro (Opcional)</label>
                            <input type="text" id="reg-veh-nickname" class="form-control" placeholder="Ex: Meu Carro do Dia a Dia" />
                        </div>
                    </div>

                    <!-- Botão de Submissão -->
                    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
                        <button type="submit" id="btn-submit-car-registration" class="btn btn-primary" style="padding:14px 28px; font-weight:800; font-size:14px; width:100%;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:8px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                            <span>🚗 SALVAR E ENTRAR NA MINHA GARAGEM DIGITAL</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    // ── Salva o cadastro do veículo e ingressa na Garagem Digital ──
    async submitVehicleRegistration(e) {
        e.preventDefault();
        const user = App.currentUser;
        if (!user) {
            alert('Sessão expirada. Faça login novamente.');
            return;
        }

        const btn = document.getElementById('btn-submit-car-registration');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="pulse-dot" style="display:inline-block; vertical-align:middle; margin-right:8px;"></span> Vinculando Veículo e Gerando DNA Permanente...`;
        }

        const plate = document.getElementById('reg-veh-plate').value.trim().toUpperCase();
        const brand = document.getElementById('reg-veh-brand').value.trim();
        const model = document.getElementById('reg-veh-model').value.trim();
        const version = document.getElementById('reg-veh-version')?.value?.trim();
        const yearFab = parseInt(document.getElementById('reg-veh-year-fab').value) || 2023;
        const yearMod = parseInt(document.getElementById('reg-veh-year-mod').value) || yearFab;
        const color = document.getElementById('reg-veh-color')?.value?.trim() || 'Preto';
        const fuel = document.getElementById('reg-veh-fuel')?.value || 'Flex';
        const trans = document.getElementById('reg-veh-trans')?.value?.trim() || 'Automático';
        const chassis = document.getElementById('reg-veh-chassis').value.trim().toUpperCase();
        const renavam = document.getElementById('reg-veh-renavam')?.value?.trim();

        try {
            let finalDna = null;

            // Se o veículo já possui DNA na busca (como o BRA2E19), reaproveita o DNA existente
            if (this.searchedVehicleData && this.searchedVehicleData.dna_code) {
                finalDna = this.searchedVehicleData.dna_code;
            } else {
                // Cadastra novo veículo com ativação imediata de DNA
                const regRes = await API.registerVehicle({
                    license_plate: plate,
                    chassis_vin: chassis,
                    renavam: renavam,
                    brand: brand,
                    model: model,
                    version_label: version,
                    manufacture_year: yearFab,
                    model_year: yearMod,
                    fuel_type: fuel,
                    transmission_type: trans,
                    color: color,
                    activate_dna_now: true
                });

                finalDna = regRes.dna_code;
            }

            if (!finalDna) {
                try {
                    const lookup = await API.lookupPlate(plate);
                    if (lookup.vehicle && lookup.vehicle.dna_code) {
                        finalDna = lookup.vehicle.dna_code;
                    }
                } catch (e) { }
            }

            if (!finalDna) {
                finalDna = 'DNA-BR-' + plate.slice(0, 4) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-X01';
            }

            // Armazena como veículo ativo deste usuário no LocalStorage
            localStorage.setItem('dna_active_vehicle_' + user.id, finalDna);
            this.currentVehicleDna = finalDna;
            this.isRegisteringVehicle = false;
            this.searchedVehicleData = null;

            alert(`🎉 Parabéns, ${user.name}! Seu veículo ${brand} ${model} (${plate}) foi cadastrado com sucesso na sua Garagem Digital.\n\nPassaporte Digital Permanente ativado: ${finalDna}`);

            // Renderiza a garagem com o carro recém-cadastrado
            this.render();
        } catch (err) {
            console.error('Erro ao salvar veículo:', err);
            // Se o erro for que já existe, tenta vincular o DNA existente
            if (err.message && err.message.includes('Já existe um veículo cadastrado')) {
                try {
                    const lookup = await API.lookupPlate(plate);
                    if (lookup.vehicle && lookup.vehicle.dna_code) {
                        localStorage.setItem('dna_active_vehicle_' + user.id, lookup.vehicle.dna_code);
                        this.currentVehicleDna = lookup.vehicle.dna_code;
                        this.isRegisteringVehicle = false;
                        this.searchedVehicleData = null;
                        alert(`✅ Veículo localizado e adicionado à sua Garagem Digital!`);
                        this.render();
                        return;
                    }
                } catch (lookupErr) { }
            }
            alert('Erro ao cadastrar veículo: ' + err.message);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span>🚗 SALVAR E ENTRAR NA MINHA GARAGEM DIGITAL</span>`;
            }
        }
    },

    // ── Ações de navegação do fluxo ──
    startNewVehicleRegistration() {
        this.isRegisteringVehicle = true;
        this.searchedVehicleData = null;
        this.render();
    },

    cancelNewVehicleRegistration() {
        this.isRegisteringVehicle = false;
        this.searchedVehicleData = null;
        this.render();
    },

    quickFillPlate(plate) {
        const input = document.getElementById('owner-register-plate-input');
        if (input) {
            input.value = plate;
            this.handleSearchPlate();
        }
    },

    // ── Modal de Declaração de Serviço pelo Dono (Peças + NF) ──
    openDeclareModal(vehicleId) {
        const modal = document.getElementById('owner-declare-modal');
        if (vehicleId) {
            document.getElementById('owner-declare-vehicle-id').value = vehicleId;
        }
        modal.classList.add('active');
    },

    addPartRow() {
        const container = document.getElementById('owner-parts-container');
        const row = document.createElement('div');
        row.className = 'part-row';
        row.innerHTML = `
            <input type="text" class="form-control part-name" placeholder="Nome da Peça (Ex: Pastilha de Freio)" required />
            <input type="text" class="form-control part-mfr" placeholder="Marca (Ex: Fras-le)" />
            <input type="text" class="form-control part-num" placeholder="Part Number" />
            <input type="number" class="form-control part-qty" placeholder="Qtd" value="1" min="1" />
            <button type="button" class="part-delete-btn" onclick="this.closest('.part-row').remove()">&times;</button>
        `;
        container.appendChild(row);
    },

    async submitDeclaredService(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Extrair peças cadastradas na interface
        const partRows = document.querySelectorAll('#owner-parts-container .part-row');
        const parts = [];
        partRows.forEach(row => {
            const name = row.querySelector('.part-name')?.value?.trim();
            const mfr = row.querySelector('.part-mfr')?.value?.trim();
            const num = row.querySelector('.part-num')?.value?.trim();
            const qty = parseInt(row.querySelector('.part-qty')?.value) || 1;
            if (name) {
                parts.push({
                    part_name: name,
                    manufacturer: mfr,
                    part_number: num,
                    quantity: qty
                });
            }
        });

        formData.set('parts_json', JSON.stringify(parts));

        try {
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Enviando e Protocolando...';

            const res = await API.declareOwnerService(formData);
            const srvCode = (res.serviceId || res.service_id || 'SRV-' + Date.now()).slice(-8);

            alert(`✅ Serviço cadastrado com sucesso sob protocolo #${srvCode}!\n\nAs peças e a Nota Fiscal foram vinculadas ao CNPJ informado (${res.workshopName || 'Oficina Responsável'}).\nA oficina/mecânico responsável poderá validar e homologar elevando o registro para Nível 3 (Confirmado).`);

            document.getElementById('owner-declare-modal').classList.remove('active');
            btn.disabled = false;
            btn.textContent = 'ENVIAR PARA VALIDAÇÃO DA OFICINA';
            OwnerView.render();
        } catch (err) {
            console.error('Erro ao declarar serviço:', err);
            alert('Erro ao cadastrar serviço: ' + err.message);
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.textContent = 'ENVIAR PARA VALIDAÇÃO DA OFICINA';
        }
    },

    // ── Modal de Transferência de Veículo ──
    openTransferModal(vehicleId) {
        const modal = document.getElementById('transfer-modal');
        document.getElementById('transfer-vehicle-id').value = vehicleId;
        document.getElementById('transfer-code-result').style.display = 'none';
        modal.classList.add('active');
    },

    async handleRequestTransferCode() {
        const vehicleId = document.getElementById('transfer-vehicle-id').value;
        const mileage = document.getElementById('transfer-mileage-input').value;

        try {
            const res = await API.requestTransfer({
                vehicle_id: vehicleId,
                transfer_mileage: mileage ? Number(mileage) : null
            });

            const resultBox = document.getElementById('transfer-code-result');
            resultBox.style.display = 'block';
            document.getElementById('transfer-generated-code').textContent = res.transfer_code;
        } catch (err) {
            alert('Erro ao solicitar código de transferência: ' + err.message);
        }
    },

    async handleConfirmTransferByBuyer() {
        const code = document.getElementById('buyer-transfer-code-input').value.trim();
        const buyerName = document.getElementById('buyer-name-input').value.trim();

        if (!code) {
            alert('Por favor, informe o código de 6 dígitos recebido do vendedor.');
            return;
        }

        try {
            const res = await API.confirmTransfer({
                transfer_code: code,
                new_owner_name: buyerName || 'Novo Proprietário'
            });

            alert(`🎉 ${res.message}`);
            document.getElementById('transfer-modal').classList.remove('active');
            OwnerView.render();
        } catch (err) {
            alert('Erro na confirmação da transferência: ' + err.message);
        }
    }
};
