// ==============================================================================
// DNA AUTO — ÁREA EXCLUSIVA DO CLIENTE TESTE / PROPRIETÁRIO (ESTILO TOTVS ERP)
// ==============================================================================

const OwnerView = {
    currentVehicleDna: 'DNA-BR-8F72-29A4-X91',

    async render() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Portal do Proprietário & Garagem Digital...
            </div>
        `;

        try {
            const data = await API.getDossier(this.currentVehicleDna);
            const v = data.vehicle;
            const h = data.health;

            container.innerHTML = `
                <!-- Cabeçalho da Área do Cliente -->
                <div class="view-header">
                    <div class="view-header-title">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px; flex-wrap:wrap;">
                            <span class="badge-proof badge-proven" style="font-size:10px; letter-spacing:0.5px;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                PROPRIETÁRIO VERIFICADO
                            </span>
                            <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">Carlos Alberto Silva • CPF: ***.782.348-**</span>
                        </div>
                        <h2>Garagem Digital & Passaporte do Veículo</h2>
                        <p>Gestão completa da vida do seu carro, histórico comprovado, alertas preventivos e laudo oficial de valorização para venda.</p>
                    </div>
                    <div class="owner-header-actions">
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
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">
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

    // Modal de Declaração de Serviço pelo Dono (Peças + NF)
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
        row.style.cssText = 'display:grid; grid-template-columns:2fr 1fr 1fr 1fr 30px; gap:8px; margin-bottom:8px; align-items:center;';
        row.innerHTML = `
            <input type="text" class="form-control part-name" placeholder="Nome da Peça (Ex: Pastilha de Freio)" required />
            <input type="text" class="form-control part-mfr" placeholder="Marca (Ex: Fras-le)" />
            <input type="text" class="form-control part-num" placeholder="Part Number" />
            <input type="number" class="form-control part-qty" placeholder="Qtd" value="1" min="1" />
            <button type="button" style="background:transparent; border:none; color:var(--status-rejected); cursor:pointer; font-weight:700; font-size:16px;" onclick="this.closest('.part-row').remove()">&times;</button>
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

    // Modal de Transferência de Veículo
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
