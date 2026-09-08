// ==============================================================================
// DNA AUTO — PAINEL OPERACIONAL DA OFICINA CREDENCIADA (ESTILO TOTVS ERP)
// ==============================================================================

const WorkshopView = {
    currentWorkshopId: 'ws_veloce',
    dashboardData: null,

    async render() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Módulo da Oficina Credenciada (Veloce Auto Center)...
            </div>
        `;

        try {
            const data = await API.getWorkshopDashboard(this.currentWorkshopId);
            this.dashboardData = data;
            const stats = data.stats;

            container.innerHTML = `
                <!-- Cabeçalho Executivo da Oficina -->
                <div class="view-header">
                    <div class="view-header-title">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                            <span class="badge-proof badge-proven" style="font-size:10px; letter-spacing:0.5px;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                OFICINA CREDENCIADA & HOMOLOGADA
                            </span>
                            <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">ID: ${data.workshop.id}</span>
                        </div>
                        <h2>${data.workshop.trade_name}</h2>
                        <p>${data.workshop.company_name} • CNPJ: ${data.workshop.cnpj} • ${data.workshop.address_street}, ${data.workshop.address_number} - ${data.workshop.city}/${data.workshop.state}</p>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="WorkshopView.openNewServiceModal()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            REGISTRAR NOVO SERVIÇO
                        </button>
                        <button class="btn btn-secondary" onclick="PosterGenerator.open('${data.workshop.id}')">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="3" height="3"></rect><rect x="18" y="18" width="3" height="3"></rect></svg>
                            GERAR CARTAZ QR CODE
                        </button>
                    </div>
                </div>

                <!-- KPIs Operacionais da Oficina -->
                <div class="grid-kpi">
                    <div class="kpi-card accent-primary">
                        <div class="kpi-header">
                            <span class="kpi-title">Veículos Atendidos</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${stats.attended_vehicles}</div>
                        <div class="kpi-footer">Passagens registradas na oficina</div>
                    </div>

                    <div class="kpi-card accent-cyan">
                        <div class="kpi-header">
                            <span class="kpi-title">DNAs Ativados</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${stats.dnas_activated}</div>
                        <div class="kpi-footer">Veículos inseridos na rede DNA AUTO</div>
                    </div>

                    <div class="kpi-card accent-success">
                        <div class="kpi-header">
                            <span class="kpi-title">Serviços Comprovados</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${stats.proven_services}</div>
                        <div class="kpi-footer">Nível 4 com peças e notas fiscais</div>
                    </div>

                    <div class="kpi-card accent-warning">
                        <div class="kpi-header">
                            <span class="kpi-title">Aguardando Confirmação</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </span>
                        </div>
                        <div class="kpi-value" style="color:var(--proof-level-1);">${stats.pending_confirmations}</div>
                        <div class="kpi-footer">Declarados por clientes para análise</div>
                    </div>
                </div>

                <!-- Recepção / Check-in de Veículos (Com Atalhos Rápidos para Teste) -->
                <div class="panel-box" style="background:linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(15, 23, 42, 0.6)); border-color:var(--brand-cyan);">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            Recepção / Check-in: Identificar Veículo na Entrada
                        </span>
                    </div>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
                        Digite a <strong>Placa</strong>, o <strong>Chassi</strong> ou o <strong>DNA</strong> do veículo. O sistema carrega o histórico 360° ou oferece o fluxo imediato de ativação de DNA.
                    </p>
                    <div class="ws-search-toolbar">
                        <input type="text" id="ws-vehicle-search" class="form-control ws-search-input"
                               placeholder="Ex: BRA2E19, STR1A99 ou DNA-BR-..." value="BRA2E19" />
                        <div class="ws-search-actions">
                            <button class="btn btn-cyan ws-btn-search" onclick="WorkshopView.handleSearchVehicle()">
                                CONSULTAR
                            </button>
                            <button class="btn btn-primary ws-btn-api" onclick="WorkshopView.lookupPlateData()">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:4px;"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
                                PUXAR DADOS (API)
                            </button>
                        </div>
                    </div>

                    <!-- Card de resultado da consulta de placa API -->
                    <div id="ws-plate-lookup-result" style="display:none; margin-bottom:14px;"></div>
                    
                    <!-- Atalhos rápidos de 1 clique para demonstração imediata -->
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12px; color:var(--text-dim);">
                        <span>Atalhos rápidos para teste:</span>
                        <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('BRA2E19')">
                            BRA2E19 (Civic Touring 360° Completo)
                        </button>
                        <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('STR1A99')">
                            STR1A99 (Strada sem DNA - Oferta de Ativação)
                        </button>
                        <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('ABC1D23')">
                            ABC1D23 (Corolla XEi)
                        </button>
                        <button class="btn btn-sm btn-secondary" style="font-family:var(--font-mono); font-size:11px;" onclick="WorkshopView.quickTestVehicle('KXZ9012')">
                            KXZ9012 (Gol MSI Cortesia)
                        </button>
                    </div>
                </div>

                <!-- Seção de Confirmação de Serviços Declarados por Clientes -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--proof-level-1)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            Fila de Análise: Serviços Declarados por Clientes (${data.pendingConfirmations.length} pendentes)
                        </span>
                    </div>

                    ${data.pendingConfirmations.length === 0 ? `
                        <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">
                            Nenhum serviço declarado por cliente aguardando análise no momento.
                        </div>
                    ` : `
                        <div class="table-responsive">
                            <table class="erp-table">
                                <thead>
                                    <tr>
                                        <th>Veículo</th>
                                        <th>Proprietário Solicitante</th>
                                        <th>Data Declarada</th>
                                        <th>Km Informado</th>
                                        <th>Serviço Informado</th>
                                        <th>Ações Técnicas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.pendingConfirmations.map(s => {
                                        let partsInfo = '';
                                        if (s.parts && s.parts.length > 0) {
                                            partsInfo = `
                                                <div style="margin-top:6px; font-size:11px; background:rgba(0,212,255,0.06); padding:6px 8px; border-radius:4px; border:1px solid rgba(0,212,255,0.15);">
                                                    <span style="color:var(--brand-cyan); font-weight:600;">Peças Informadas pelo Cliente (${s.parts.length}):</span><br/>
                                                    ${s.parts.map(p => `<span style="color:var(--text-muted);">• ${p.part_name} — ${p.manufacturer || 'Marca não informada'} (PN: ${p.part_number || 'N/A'}) x${p.quantity}</span>`).join('<br/>')}
                                                </div>
                                            `;
                                        }
                                        let invoiceInfo = '';
                                        if (s.invoice_url) {
                                            invoiceInfo = `
                                                <div style="margin-top:4px;">
                                                    <a href="${s.invoice_url}" target="_blank" style="font-size:11px; color:var(--proof-level-4); text-decoration:underline; font-weight:600;">
                                                        📄 Visualizar Nota Fiscal Anexada pelo Cliente
                                                    </a>
                                                </div>
                                            `;
                                        }
                                        return `
                                        <tr>
                                            <td>
                                                <strong style="color:#fff;">${s.brand} ${s.model}</strong>
                                                <div class="mono" style="font-size:11px; color:var(--brand-cyan);">${s.license_plate}</div>
                                            </td>
                                            <td>
                                                <div style="font-weight:600; color:var(--text-main);">${s.declared_by_owner_name || 'Proprietário Cadastrado'}</div>
                                                <div style="font-size:11px; color:var(--text-dim);">Declaração via App</div>
                                            </td>
                                            <td>${s.service_date}</td>
                                            <td class="mono" style="font-weight:600;">${Number(s.mileage).toLocaleString('pt-BR')} km</td>
                                            <td>
                                                <strong>${s.service_title}</strong>
                                                <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${s.description || ''}</div>
                                                ${partsInfo}
                                                ${invoiceInfo}
                                            </td>
                                            <td>
                                                <div style="display:flex; flex-direction:column; gap:6px;">
                                                    <button class="btn btn-sm btn-success" style="font-size:11px; font-weight:700;" onclick="WorkshopView.submitConfirmation('${s.id}', 'CONFIRMAR')">
                                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><polyline points="20 6 9 17 4 12"/></svg>
                                                        VALIDAR & HOMOLOGAR (NÍVEL 3)
                                                    </button>
                                                    <button class="btn btn-sm btn-secondary" style="font-size:11px; color:var(--status-rejected);" onclick="WorkshopView.submitConfirmation('${s.id}', 'NAO_RECONHECO')">
                                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                        NÃO RECONHEÇO
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <!-- Histórico de Ordens de Serviço Comprovadas pela Oficina -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--proof-level-4)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            Histórico de Serviços Comprovados Executados na Veloce Auto Center
                        </span>
                        <button class="btn btn-sm btn-secondary" onclick="WorkshopView.openNewServiceModal()">
                            + NOVO LANÇAMENTO
                        </button>
                    </div>

                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Veículo / Placa</th>
                                    <th>Km</th>
                                    <th>Serviço Executado</th>
                                    <th>Peças Aplicadas</th>
                                    <th>Comprovação</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2024-11-04</td>
                                    <td>
                                        <strong>Honda Civic Touring</strong>
                                        <div class="mono" style="font-size:11px; color:var(--brand-cyan);">BRA2E19</div>
                                    </td>
                                    <td class="mono">120.450 km</td>
                                    <td>
                                        <strong>Revisão dos 120.000 km Completa</strong>
                                        <div style="font-size:11px; color:var(--text-dim);">Troca de velas de irídio e filtro combustível</div>
                                    </td>
                                    <td>
                                        <span class="badge-proof badge-confirmed" style="font-size:10px;">Velas NGK Laser Iridium + Filtro Honda</span>
                                    </td>
                                    <td><span class="badge-proof badge-proven">NÍVEL 4: COMPROVADO</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                                            VER NO DOSSIÊ
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>2025-05-18</td>
                                    <td>
                                        <strong>Honda Civic Touring</strong>
                                        <div class="mono" style="font-size:11px; color:var(--brand-cyan);">BRA2E19</div>
                                    </td>
                                    <td class="mono">125.200 km</td>
                                    <td>
                                        <strong>Substituição Pastilhas Dianteiras e Traseiras</strong>
                                        <div style="font-size:11px; color:var(--text-dim);">Sangria e substituição de fluido de freio DOT 5.1</div>
                                    </td>
                                    <td>
                                        <span class="badge-proof badge-confirmed" style="font-size:10px;">Pastilhas Brembo Ceramic P28026N</span>
                                    </td>
                                    <td><span class="badge-proof badge-proven">NÍVEL 4: COMPROVADO</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                                            VER NO DOSSIÊ
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>2025-11-10</td>
                                    <td>
                                        <strong>VW Gol Trendline 1.6</strong>
                                        <div class="mono" style="font-size:11px; color:var(--brand-cyan);">KXZ9012</div>
                                    </td>
                                    <td class="mono">88.500 km</td>
                                    <td>
                                        <strong>Ativação DNA Cortesia + Troca de Óleo</strong>
                                        <div style="font-size:11px; color:var(--text-dim);">Óleo 5W-40 502.00 sintético e filtro Fram</div>
                                    </td>
                                    <td>
                                        <span class="badge-proof badge-confirmed" style="font-size:10px;">Óleo Castrol Magnatec + Filtro PH5548</span>
                                    </td>
                                    <td><span class="badge-proof badge-proven">NÍVEL 4: COMPROVADO</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-cyan" onclick="DossierView.render('DNA-BR-1A90-55E8-K12')">
                                            VER NO DOSSIÊ
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Equipe Técnica e Usuários da Oficina -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Equipe Técnica e Usuários Autorizados (${data.staff.length})
                        </span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
                        ${data.staff.map(m => `
                            <div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); display:flex; gap:14px; align-items:flex-start;">
                                <div style="width:40px; height:40px; border-radius:8px; background:rgba(0, 212, 255, 0.1); border:1px solid rgba(0, 212, 255, 0.25); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <div style="flex:1;">
                                    <strong style="font-size:14px; color:#fff;">${m.name}</strong>
                                    <div style="font-size:12px; color:var(--brand-cyan); margin-top:2px; font-weight:600;">${m.position_title}</div>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">${m.email} • ${m.phone || ''}</div>
                                    <div style="margin-top:10px; font-size:11px; color:var(--proof-level-4); display:flex; align-items:center; gap:4px; font-weight:600;">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        Autorizado a comprovar serviços & ativar DNA
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Erro ao renderizar painel da oficina:', err);
            container.innerHTML = `<div class="panel-box">Erro ao carregar dados da oficina.</div>`;
        }
    },

    // Atalho rápido para testar veículo na busca
    quickTestVehicle(plate) {
        const input = document.getElementById('ws-vehicle-search');
        if (input) {
            input.value = plate;
            this.handleSearchVehicle();
        }
    },

    // Ação do Botão Pesquisar Veículo
    async handleSearchVehicle() {
        const input = document.getElementById('ws-vehicle-search');
        const term = input.value.trim();
        if (!term) return;

        try {
            const res = await API.searchVehicle(term);
            if (res.found) {
                if (res.hasDna) {
                    // Abre diretamente o Dossiê 360°
                    DossierView.render(res.vehicle.dna_code);
                } else {
                    // Veículo encontrado mas sem DNA -> Abre modal de oferta de DNA
                    this.openDnaOfferModal(res.vehicle.id, res.vehicle.license_plate, res.vehicle.brand + ' ' + res.vehicle.model);
                }
            }
        } catch (err) {
            alert('Nenhum veículo encontrado com este identificador na base.');
        }
    },

    // Modal para Oferecer / Ativar DNA ao Cliente
    openDnaOfferModal(vehicleId, plate, modelName = 'Veículo') {
        const modal = document.getElementById('dna-offer-modal');
        document.getElementById('dna-offer-vehicle-id').value = vehicleId;
        document.getElementById('dna-offer-plate-label').textContent = plate;
        document.getElementById('dna-offer-model-label').textContent = modelName;
        modal.classList.add('active');
    },

    async confirmDnaActivation() {
        const vehicleId = document.getElementById('dna-offer-vehicle-id').value;
        const modality = document.getElementById('dna-offer-modality').value;
        const planId = document.getElementById('dna-offer-plan').value;

        try {
            const res = await API.activateDna({
                vehicle_id: vehicleId,
                workshop_id: this.currentWorkshopId,
                pricing_plan_id: planId,
                modality
            });

            document.getElementById('dna-offer-modal').classList.remove('active');
            alert(`🎉 ${res.message}\nCódigo Gerado: ${res.dna_code}`);
            DossierView.render(res.dna_code);
        } catch (err) {
            alert('Erro ao ativar DNA: ' + err.message);
        }
    },

    // Modal de Novo Serviço Comprovado
    async openNewServiceModal() {
        const modal = document.getElementById('new-service-modal');
        modal.classList.add('active');
    },

    async submitNewService(e) {
        e.preventDefault();
        const form = document.getElementById('new-service-form');
        const formData = new FormData(form);
        formData.append('workshop_id', this.currentWorkshopId);

        try {
            const res = await API.registerWorkshopService(formData);
            document.getElementById('new-service-modal').classList.remove('active');
            alert(`✅ ${res.message}`);
            form.reset();
            WorkshopView.render();
        } catch (err) {
            alert('Erro ao registrar serviço: ' + err.message);
        }
    },

    // Decisão da Oficina sobre serviço declarado pelo cliente
    async submitConfirmation(serviceId, decision) {
        const notes = prompt(
            decision === 'CONFIRMAR'
                ? 'Observações técnicas da confirmação (opcional):'
                : 'Motivo do não reconhecimento (será registrado em auditoria):'
        );

        try {
            const res = await API.confirmServiceDecision(serviceId, decision, notes);
            alert(`✅ ${res.message}`);
            this.render();
        } catch (err) {
            alert('Erro ao registrar decisão: ' + err.message);
        }
    },

    // Consulta de dados do veículo via API pública de placa
    async lookupPlateData() {
        const input = document.getElementById('ws-vehicle-search');
        const plate = (input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const resultDiv = document.getElementById('ws-plate-lookup-result');

        if (!plate || plate.length < 7) {
            alert('Informe uma placa válida no campo de busca (7 caracteres).');
            return;
        }

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="padding:16px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 8px;"></div>
                Consultando dados do veículo...
            </div>
        `;

        try {
            const data = await API.lookupPlate(plate);
            const v = data.vehicle || data;
            const fipe = v.fipe || {};
            const legal = v.legal_status || {};
            const origin = v.origin || {};

            resultDiv.innerHTML = `
                <div style="background:linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(15, 23, 42, 0.75)); border:1px solid var(--brand-cyan); border-radius:var(--radius-md); padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:32px; height:32px; border-radius:6px; background:rgba(16,185,129,0.15); display:flex; align-items:center; justify-content:center; border:1px solid rgba(16,185,129,0.3);">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--proof-level-4)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                                <strong style="font-size:15px; color:#fff;">Dados Oficiais Retornados pela API de Placas (Senatran/FIPE)</strong>
                                <div style="font-size:11px; color:var(--text-dim);">${data.source || 'Base Integrada Nacional'}</div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ws-plate-lookup-result').style.display='none'">Fechar</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:16px;">
                        <!-- Dados do Veículo -->
                        <div style="background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
                            <div style="font-size:10px; font-weight:700; color:var(--brand-cyan); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">Identificação do Veículo</div>
                            <div style="font-size:12px; color:var(--text-muted); line-height:1.8;">
                                <div>Marca/Modelo: <strong style="color:#fff;">${v.brand || '—'} ${v.model || '—'}</strong></div>
                                <div>Versão: <strong style="color:#fff;">${v.version || 'Padrão'}</strong></div>
                                <div>Ano Fab/Mod: <strong style="color:#fff;">${v.manufacture_year || '—'}/${v.model_year || '—'}</strong></div>
                                <div>Cor: <strong style="color:#fff;">${v.color || '—'}</strong></div>
                                <div>Combustível: <strong style="color:#fff;">${v.fuel_type || '—'}</strong></div>
                                <div>Câmbio: <strong style="color:#fff;">${v.transmission_type || 'Manual'}</strong></div>
                                <div>Placa: <strong style="color:#fff; font-family:var(--font-mono);">${v.license_plate || plate}</strong> (${origin.city || 'São Paulo'}/${origin.state || 'SP'})</div>
                                <div>Chassi: <strong style="color:#fff; font-family:var(--font-mono);">${v.chassis_vin_masked || '—'}</strong></div>
                                <div>RENAVAM: <strong style="color:#fff; font-family:var(--font-mono);">${v.renavam_masked || '—'}</strong></div>
                            </div>
                        </div>

                        <!-- FIPE -->
                        <div style="background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
                            <div style="font-size:10px; font-weight:700; color:var(--proof-level-4); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">Tabela FIPE Oficial</div>
                            <div style="font-size:12px; color:var(--text-muted); line-height:1.8;">
                                <div>Código FIPE: <strong style="color:#fff; font-family:var(--font-mono);">${fipe.fipe_code || '004495-4'}</strong></div>
                                <div>Valor de Mercado: <strong style="color:var(--proof-level-4); font-size:16px; font-family:var(--font-mono); display:block; margin:4px 0;">${fipe.market_value_formatted || 'R$ 89.900,00'}</strong></div>
                                <div>Mês Referência: <strong style="color:#fff;">${fipe.reference_month || 'Janeiro/2026'}</strong></div>
                                <div style="margin-top:8px; font-size:11px; color:var(--text-dim);">Variação estável no mercado nacional.</div>
                            </div>
                        </div>

                        <!-- IPVA & Custos -->
                        <div style="background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
                            <div style="font-size:10px; font-weight:700; color:var(--proof-level-1); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">IPVA Estadual & Tributos</div>
                            <div style="font-size:12px; color:var(--text-muted); line-height:1.8;">
                                <div>Status IPVA: <strong style="color:var(--proof-level-4); font-weight:700;">${legal.ipva_status || 'QUITADO'}</strong></div>
                                <div>Valor Estimado (4%): <strong style="color:var(--proof-level-1); font-size:16px; font-family:var(--font-mono); display:block; margin:4px 0;">${legal.ipva_estimated_amount || 'R$ 3.596,00'}</strong></div>
                                <div>Exercício: <strong style="color:#fff;">2025/2026</strong></div>
                                <div>Certidão Débitos: <strong style="color:var(--proof-level-4);">Sem Restrições</strong></div>
                            </div>
                        </div>

                        <!-- Certidão Detran / Multas -->
                        <div style="background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
                            <div style="font-size:10px; font-weight:700; color:var(--brand-cyan); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">Certidão Detran & Multas</div>
                            <div style="font-size:12px; color:var(--text-muted); line-height:1.8;">
                                <div>Status Legal: <strong style="color:var(--proof-level-4); font-weight:700;">${legal.detran_status || 'REGULAR'}</strong></div>
                                <div>Multas Pendentes: <strong style="color:${legal.fines_count > 0 ? 'var(--proof-level-1)' : '#fff'}; font-family:var(--font-mono);">${legal.fines_count || 0} infração(ões)</strong></div>
                                <div>Restrições Judiciais: <strong style="color:var(--proof-level-4);">${legal.has_judicial_restrictions ? 'SIM' : 'NENHUMA'}</strong></div>
                                <div>Registro Leilão/Sinistro: <strong style="color:var(--proof-level-4);">${legal.auction_record ? 'CONSTA' : 'NÃO CONSTA'}</strong></div>
                            </div>
                        </div>
                    </div>

                    <!-- Botão de Ação Imediata com o Veículo -->
                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        ${v.hasDna ? `
                            <button class="btn btn-cyan" onclick="DossierView.render('${v.dna_code}')">
                                🔎 ABRIR DOSSIÊ 360° DO VEÍCULO (${v.dna_code})
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="WorkshopView.openDnaOfferModal('${v.id || 'new'}', '${v.license_plate}', '${v.brand} ${v.model}')" style="background:var(--brand-cyan); color:#000; font-weight:700;">
                                ✨ ATIVAR DNA AUTO NO VEÍCULO
                            </button>
                        `}
                    </div>
                </div>
            `;
        } catch (err) {
            resultDiv.innerHTML = `
                <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:16px; color:var(--status-rejected); font-size:13px;">
                    <strong>Erro na consulta da placa:</strong> ${err.message || 'Serviço temporariamente indisponível.'}
                </div>
            `;
        }
    }
};
