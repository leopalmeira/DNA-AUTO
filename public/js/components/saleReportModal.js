// ==============================================================================
// DNA AUTO — RELATÓRIO OFICIAL PARA VENDA — ULTRA DETALHADO (40+ SEÇÕES)
// Documento profissional e completo para impressão / salvamento em PDF
// ==============================================================================

const SaleReportModal = {
    async open(vehicleId) {
        const modal = document.getElementById('sale-report-modal');
        const contentBox = document.getElementById('sale-report-modal-content');

        contentBox.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Gerando Laudo Oficial DNA AUTO para Venda com 40+ seções de informação detalhada...
            </div>
        `;
        modal.classList.add('active');

        try {
            const res = await API.generateSaleReport(vehicleId);
            const r = res.reportData;
            const validationQr = QRCodeGenerator.generateSVG(
                window.location.origin + `?validate=${r.validationCode}`,
                110
            );

            contentBox.innerHTML = this.buildFullReport(r, validationQr);
        } catch (err) {
            alert('Erro ao gerar relatório para venda: ' + err.message);
            modal.classList.remove('active');
        }
    },

    // ── Helpers ──
    fmt(cents) {
        if (!cents && cents !== 0) return 'N/D';
        return 'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    },
    fmtKm(km) {
        return km ? Number(km).toLocaleString('pt-BR') + ' km' : 'N/D';
    },
    fmtDate(d) {
        if (!d) return 'N/D';
        try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
    },
    proofBadge(level) {
        const map = {
            4: { label: 'COMPROVADO (Nível 4)', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
            3: { label: 'CONFIRMADO (Nível 3)', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', icon: '✅' },
            2: { label: 'DOCUMENTADO (Nível 2)', color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe', icon: '📄' },
            1: { label: 'DECLARADO (Nível 1)', color: '#92400e', bg: '#fef3c7', border: '#fde68a', icon: '⚠️' }
        };
        const b = map[level] || map[1];
        return `<span style="display:inline-block;background:${b.bg};color:${b.color};border:1px solid ${b.border};font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;">${b.icon} ${b.label}</span>`;
    },
    statusBadge(status) {
        const map = {
            'PAID': { label: 'PAGO', color: '#065f46', bg: '#ecfdf5' },
            'PENDING': { label: 'PENDENTE', color: '#92400e', bg: '#fef3c7' },
            'OVERDUE': { label: 'VENCIDO', color: '#991b1b', bg: '#fef2f2' },
            'NONE': { label: 'NENHUMA', color: '#065f46', bg: '#ecfdf5' },
            'COMPLETED': { label: 'REALIZADA', color: '#065f46', bg: '#ecfdf5' },
            'PLANNED': { label: 'PLANEJADA', color: '#1e40af', bg: '#eff6ff' },
            'AVAILABLE': { label: 'DISPONÍVEL', color: '#065f46', bg: '#ecfdf5' },
            'UNAVAILABLE': { label: 'INDISPONÍVEL', color: '#6b7280', bg: '#f3f4f6' }
        };
        const b = map[status] || { label: status, color: '#374151', bg: '#f3f4f6' };
        return `<span style="display:inline-block;background:${b.bg};color:${b.color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;">${b.label}</span>`;
    },
    sectionTitle(icon, title, number) {
        return `
            <div style="display:flex;align-items:center;gap:8px;border-bottom:2px solid #111827;padding-bottom:6px;margin:24px 0 12px;">
                <span style="font-size:16px;">${icon}</span>
                <h3 style="font-size:14px;font-weight:800;text-transform:uppercase;color:#111827;margin:0;">
                    ${number}. ${title}
                </h3>
            </div>
        `;
    },
    infoGrid(items) {
        return `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(140px,100%),1fr));gap:8px;font-size:12px;color:#374151;">
                ${items.map(([label, value]) => `
                    <div style="background:#f9fafb;padding:8px 12px;border-radius:6px;border:1px solid #e5e7eb;overflow:hidden;">
                        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;font-weight:600;margin-bottom:2px;">${label}</div>
                        <div style="font-weight:700;color:#111827;word-break:break-word;overflow-wrap:anywhere;">${value || 'N/D'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ── Construir Relatório Completo ──
    buildFullReport(r, validationQr) {
        return `
            <div class="sale-report-document">
                ${this.renderHeader(r, validationQr)}
                ${this.renderVehicleIdentification(r)}
                ${this.renderDnaCertificate(r)}
                ${this.renderHealthScore(r)}
                ${this.renderKpiCards(r)}
                ${this.renderOwnership(r)}
                ${this.renderFinancials(r)}
                ${this.renderFipeAndMarket(r)}
                ${this.renderServicesTable(r)}
                ${this.renderPartsTable(r)}
                ${this.renderActiveWarranties(r)}
                ${this.renderInvoicesTable(r)}
                ${this.renderMileageHistory(r)}
                ${this.renderWorkshops(r)}
                ${this.renderServiceCategories(r)}
                ${this.renderPhotosResume(r)}
                ${this.renderDocuments(r)}
                ${this.renderTaxes(r)}
                ${this.renderFines(r)}
                ${this.renderDebts(r)}
                ${this.renderAuctions(r)}
                ${this.renderMaintenancePlan(r)}
                ${this.renderLegalDisclaimer(r)}
                ${this.renderFooter(r)}
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO: CABEÇALHO
    // ═══════════════════════════════════════════════════════
    renderHeader(r, validationQr) {
        return `
            <div class="report-header-flex">
                <div class="report-header-text">
                    <div class="report-certified-badge">
                        DOCUMENTO OFICIAL CERTIFICADO
                    </div>
                    <h2 class="report-title">RELATÓRIO DNA AUTO PARA VENDA</h2>
                    <p class="report-subtitle">Passaporte Digital Completo · Histórico de Manutenção · Avaliação de Integridade</p>
                    <p class="report-meta">Emitido em: <strong>${new Date(r.generatedAt).toLocaleString('pt-BR')}</strong></p>
                </div>
                <div class="report-qr-box">
                    <div class="report-qr-svg-wrapper">${validationQr}</div>
                    <div class="report-qr-code-txt">${r.validationCode}</div>
                    <div class="report-qr-sub">Escaneie para verificar</div>
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 1: IDENTIFICAÇÃO COMPLETA DO VEÍCULO
    // ═══════════════════════════════════════════════════════
    renderVehicleIdentification(r) {
        const v = r.vehicle;
        return `
            ${this.sectionTitle('🚗', 'Identificação Completa do Veículo', 1)}
            <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                    <h3 style="font-size:20px;font-weight:900;color:#111827;margin:0;">${v.brand} ${v.model} ${v.version || ''}</h3>
                    <div style="background:#111827;color:#00d4ff;font-family:monospace;font-weight:700;font-size:14px;padding:8px 16px;border-radius:6px;letter-spacing:1px;">
                        DNA: ${v.dnaCode}
                    </div>
                </div>
            </div>
            ${this.infoGrid([
                ['Marca', v.brand],
                ['Modelo', v.model],
                ['Versão', v.version || 'N/D'],
                ['Ano Fabricação', v.manufactureYear],
                ['Ano Modelo', v.modelYear],
                ['Placa', `<span style="font-family:monospace;font-weight:800;font-size:14px;">${v.plate}</span>`],
                ['Chassi (VIN)', `<span style="font-family:monospace;font-size:11px;">${v.chassis}</span>`],
                ['Renavam', v.renavam],
                ['Cor', v.color],
                ['Combustível', v.fuel],
                ['Câmbio', v.transmission],
                ['Quilometragem Atual', `<strong>${this.fmtKm(v.currentMileage)}</strong>`],
                ['Idade do Veículo', `${v.vehicleAgeYears} ano(s)`],
                ['Média KM/Ano', this.fmtKm(v.avgKmPerYear)],
                ['Média KM/Mês', this.fmtKm(v.avgKmPerMonth)]
            ])}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 2: CERTIFICADO DNA AUTO
    // ═══════════════════════════════════════════════════════
    renderDnaCertificate(r) {
        const d = r.dna;
        return `
            ${this.sectionTitle('🧬', 'Certificado DNA AUTO — Identidade Permanente', 2)}
            ${this.infoGrid([
                ['Código DNA', `<span style="font-family:monospace;font-size:14px;font-weight:800;color:#0088ff;">${d.code}</span>`],
                ['Status', d.status === 'ACTIVE' ? '<span style="color:#065f46;font-weight:800;">✅ ATIVO</span>' : d.status],
                ['Data de Ativação', this.fmtDate(d.activatedAt)],
                ['Modalidade de Ativação', d.activationModality],
                ['Oficina Ativadora', d.activatedByWorkshop || 'N/D'],
                ['Localização da Oficina', d.activatedByCity || 'N/D'],
                ['CNPJ da Oficina', d.activatedByCnpj || 'N/D'],
                ['Oficina Verificada', d.workshopVerified ? '✅ SIM' : '❌ NÃO'],
                ['Hash do Certificado', `<span style="font-family:monospace;font-size:10px;">${d.certificateHash || 'N/D'}</span>`]
            ])}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 3: ÍNDICE DE SAÚDE DO HISTÓRICO
    // ═══════════════════════════════════════════════════════
    renderHealthScore(r) {
        const h = r.healthScore;
        const scoreColor = h.overallScore >= 80 ? '#065f46' : h.overallScore >= 50 ? '#92400e' : '#991b1b';
        const scoreBg = h.overallScore >= 80 ? '#ecfdf5' : h.overallScore >= 50 ? '#fef3c7' : '#fef2f2';
        return `
            ${this.sectionTitle('💚', 'Índice de Saúde e Integridade do Histórico', 3)}
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                <div style="background:${scoreBg};border:2px solid ${scoreColor};border-radius:12px;padding:16px 24px;text-align:center;min-width:0;flex-shrink:0;">
                    <div style="font-size:36px;font-weight:900;color:${scoreColor};">${h.overallScore}<span style="font-size:18px;">/100</span></div>
                    <div style="font-size:10px;font-weight:700;color:${scoreColor};text-transform:uppercase;">Saúde do Histórico</div>
                </div>
                <div style="flex:1;min-width:0;font-size:12px;color:#374151;line-height:1.7;">
                    <div><strong>Documentação:</strong> ${h.documentedPercentage}% dos registros possuem comprovação</div>
                    <div><strong>Continuidade:</strong> ${h.continuityStatus}</div>
                    <div><strong>Consistência do Odômetro:</strong> ${h.mileageConsistency === 'CONSISTENTE' ? '✅ Nenhuma anomalia detectada' : '⚠️ Possível inconsistência'}</div>
                    <div><strong>Garantias Ativas:</strong> ${h.activeWarrantiesCount} peça(s) ainda em garantia</div>
                    ${h.scoreRationale ? `<div style="margin-top:4px;padding:6px 8px;background:#f3f4f6;border-radius:4px;font-size:11px;color:#4b5563;"><em>${h.scoreRationale}</em></div>` : ''}
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // KPIs CONSOLIDADOS
    // ═══════════════════════════════════════════════════════
    renderKpiCards(r) {
        const h = r.healthScore;
        const s = r.summary;
        const cards = [
            { value: h.overallScore + '/100', label: 'Saúde do Histórico', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
            { value: h.documentedPercentage + '%', label: 'Documentado', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
            { value: h.provenServicesCount, label: 'Serviços Comprovados', color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' },
            { value: h.declaredServicesCount, label: 'Serviços Declarados', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
            { value: h.invoicesCount, label: 'Notas Fiscais', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
            { value: h.photosCount, label: 'Registros Fotográficos', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
            { value: s.totalParts, label: 'Peças Instaladas', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
            { value: h.workshopsCount, label: 'Oficinas Verificadas', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            { value: s.totalOwners, label: 'Proprietário(s)', color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' },
            { value: h.mileageRecordsCount, label: 'Registros de KM', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' }
        ];
        return `
            ${this.sectionTitle('📊', 'Resumo Quantitativo do Dossiê', 4)}
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(120px,100%),1fr));gap:10px;margin-bottom:8px;">
                ${cards.map(c => `
                    <div style="background:${c.bg};border:1px solid ${c.border};padding:10px;border-radius:8px;text-align:center;overflow:hidden;">
                        <div style="font-size:22px;font-weight:800;color:${c.color};">${c.value}</div>
                        <div style="font-size:9px;font-weight:700;color:${c.color};text-transform:uppercase;">${c.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 5: HISTÓRICO DE PROPRIETÁRIOS
    // ═══════════════════════════════════════════════════════
    renderOwnership(r) {
        const o = r.ownership;
        return `
            ${this.sectionTitle('👥', 'Histórico de Proprietários', 5)}
            ${this.infoGrid([
                ['Total de Proprietários', `<strong>${o.totalOwners}</strong>`],
                ['Proprietário Atual', o.currentOwner ? `${o.currentOwner.name} (CPF: ${o.currentOwner.cpfMasked})` : 'N/D'],
                ['Primeiro Proprietário', o.firstOwner ? `${o.firstOwner.name} (CPF: ${o.firstOwner.cpfMasked})` : 'N/D']
            ])}
            ${o.transfers.length > 0 ? `
                <div class="report-table-scroll">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;font-weight:700;">Data</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;font-weight:700;">De</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;font-weight:700;">Para</th>
                                <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;font-weight:700;">KM na Transferência</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${o.transfers.map(t => `
                                <tr>
                                    <td style="padding:6px 8px;border:1px solid #e5e7eb;">${this.fmtDate(t.date)}</td>
                                    <td style="padding:6px 8px;border:1px solid #e5e7eb;">${t.fromOwner || 'N/D'}</td>
                                    <td style="padding:6px 8px;border:1px solid #e5e7eb;">${t.toOwner || 'N/D'}</td>
                                    <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;">${this.fmtKm(t.mileageAtTransfer)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 6: RESUMO FINANCEIRO
    // ═══════════════════════════════════════════════════════
    renderFinancials(r) {
        const f = r.financials;
        return `
            ${this.sectionTitle('💰', 'Resumo Financeiro de Manutenção', 6)}
            ${this.infoGrid([
                ['Total Investido em Manutenção', `<strong style="font-size:16px;color:#065f46;">${this.fmt(f.totalInvestedCents)}</strong>`],
                ['Valor Total em Peças', this.fmt(f.totalPartsValueCents)],
                ['Valor Total em Mão de Obra', this.fmt(f.totalLaborCostCents)],
                ['Total em Notas Fiscais', this.fmt(f.totalInvoicesValueCents)],
                ['Custo Médio por Serviço', this.fmt(f.averageCostPerServiceCents)]
            ])}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 7: COTAÇÃO FIPE E MERCADO
    // ═══════════════════════════════════════════════════════
    renderFipeAndMarket(r) {
        const f = r.financials;
        return `
            ${this.sectionTitle('📈', 'Cotação FIPE e Valor de Mercado', 7)}
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:16px;margin-bottom:12px;">
                <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:16px;text-align:center;">
                    <div style="font-size:11px;color:#065f46;font-weight:700;text-transform:uppercase;">Cotação FIPE Atual</div>
                    <div style="font-size:28px;font-weight:900;color:#065f46;margin:4px 0;word-break:break-word;">${f.fipePrice ? this.fmt(f.fipePrice) : 'N/D'}</div>
                    <div style="font-size:10px;color:#4b5563;word-break:break-word;">Código FIPE: ${f.fipeCode || 'N/D'} • Referência: ${f.fipeReference || 'N/D'}</div>
                </div>
                <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:10px;padding:16px;text-align:center;">
                    <div style="font-size:11px;color:#1e40af;font-weight:700;text-transform:uppercase;">Total Investido em Manutenção</div>
                    <div style="font-size:28px;font-weight:900;color:#1e40af;margin:4px 0;word-break:break-word;">${this.fmt(f.totalInvestedCents)}</div>
                    <div style="font-size:10px;color:#4b5563;">Valor que agrega na negociação</div>
                </div>
            </div>
            ${f.fipeHistory.length > 1 ? `
                <div style="font-size:11px;color:#374151;margin-bottom:8px;">
                    <strong>Evolução FIPE (últimas cotações):</strong>
                    ${f.fipeHistory.map(h => `${h.reference}: ${this.fmt(h.priceCents)}`).join(' → ')}
                </div>
            ` : ''}
            ${f.marketValues.length > 0 ? `
                <div style="font-size:11px;color:#374151;">
                    <strong>Referências de Mercado:</strong>
                    ${f.marketValues.map(m => `${this.fmtDate(m.date)}: ${this.fmt(m.priceCents)} (${m.source})`).join(' · ')}
                </div>
            ` : ''}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 8: TABELA DE SERVIÇOS DETALHADOS
    // ═══════════════════════════════════════════════════════
    renderServicesTable(r) {
        if (!r.services.length) return '';
        return `
            ${this.sectionTitle('🔧', `Histórico Completo de Serviços (${r.services.length} registros)`, 8)}
            <div class="report-table-scroll">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#111827;color:#fff;">
                            <th style="padding:8px;text-align:left;">#</th>
                            <th style="padding:8px;text-align:left;">Data</th>
                            <th style="padding:8px;text-align:left;">Serviço</th>
                            <th style="padding:8px;text-align:left;">Categoria</th>
                            <th style="padding:8px;text-align:right;">KM</th>
                            <th style="padding:8px;text-align:left;">Oficina</th>
                            <th style="padding:8px;text-align:left;">Técnico</th>
                            <th style="padding:8px;text-align:right;">Valor</th>
                            <th style="padding:8px;text-align:center;">Nível</th>
                            <th style="padding:8px;text-align:center;">Garantia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.services.map((s, i) => `
                            <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};border-bottom:1px solid #e5e7eb;">
                                <td style="padding:6px 8px;color:#6b7280;">${i + 1}</td>
                                <td style="padding:6px 8px;white-space:nowrap;">${this.fmtDate(s.date)}</td>
                                <td style="padding:6px 8px;font-weight:600;max-width:180px;">
                                    ${s.title}
                                    ${s.description ? `<div style="font-size:10px;color:#6b7280;font-weight:400;margin-top:2px;">${s.description.substring(0, 80)}${s.description.length > 80 ? '...' : ''}</div>` : ''}
                                </td>
                                <td style="padding:6px 8px;">${s.category}</td>
                                <td style="padding:6px 8px;text-align:right;font-family:monospace;">${this.fmtKm(s.mileage)}</td>
                                <td style="padding:6px 8px;">
                                    ${s.workshopName || 'N/D'}
                                    ${s.workshopVerified ? ' ✅' : ''}
                                    ${s.workshopCity ? `<div style="font-size:9px;color:#6b7280;">${s.workshopCity}</div>` : ''}
                                </td>
                                <td style="padding:6px 8px;">${s.technician || 'N/D'}</td>
                                <td style="padding:6px 8px;text-align:right;font-weight:600;">${this.fmt(s.totalCostCents)}</td>
                                <td style="padding:6px 8px;text-align:center;">${this.proofBadge(s.proofLevel)}</td>
                                <td style="padding:6px 8px;text-align:center;">${s.warrantyMonths ? s.warrantyMonths + ' meses' : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 9: PEÇAS INSTALADAS
    // ═══════════════════════════════════════════════════════
    renderPartsTable(r) {
        if (!r.parts.length) return '';
        return `
            ${this.sectionTitle('⚙️', `Peças e Componentes Instalados (${r.parts.length} registros)`, 9)}
            <div class="report-table-scroll">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f3f4f6;">
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">#</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Peça</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Fabricante</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Código (OEM)</th>
                            <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Condição</th>
                            <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Qtd</th>
                            <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;">Valor Unit.</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Data Instalação</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Oficina</th>
                            <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Garantia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.parts.map((p, i) => `
                            <tr>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;color:#6b7280;">${i + 1}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:600;">${p.name}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${p.manufacturer}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace;font-size:10px;">${p.partNumber || '-'}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${p.condition === 'NEW' ? '🆕 Nova' : '♻️ Recondicionada'}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${p.quantity}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:right;">${this.fmt(p.unitPriceCents)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(p.serviceDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${p.installedBy || '-'}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${p.warrantyMonths ? p.warrantyMonths + ' meses' : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 10: GARANTIAS ATIVAS
    // ═══════════════════════════════════════════════════════
    renderActiveWarranties(r) {
        if (!r.activeWarranties || !r.activeWarranties.length) return `
            ${this.sectionTitle('🛡️', 'Garantias Ativas', 10)}
            <div style="font-size:12px;color:#6b7280;padding:8px;background:#f9fafb;border-radius:6px;">Nenhuma garantia ativa no momento.</div>
        `;
        return `
            ${this.sectionTitle('🛡️', `Garantias Ativas (${r.activeWarranties.length} peças)`, 10)}
            <div class="report-table-scroll">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#ecfdf5;">
                            <th style="padding:6px 8px;text-align:left;border:1px solid #a7f3d0;">Peça</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #a7f3d0;">Fabricante</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #a7f3d0;">Instalação</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #a7f3d0;">Vencimento</th>
                            <th style="padding:6px 8px;text-align:right;border:1px solid #a7f3d0;">Dias Restantes</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #a7f3d0;">Oficina</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.activeWarranties.map(w => `
                            <tr>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;font-weight:600;">${w.partName}</td>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;">${w.manufacturer}</td>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;">${this.fmtDate(w.serviceDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;">${this.fmtDate(w.warrantyEndDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;text-align:right;font-weight:700;color:#065f46;">${w.remainingDays} dias</td>
                                <td style="padding:5px 8px;border:1px solid #d1fae5;">${w.workshop || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 11: NOTAS FISCAIS
    // ═══════════════════════════════════════════════════════
    renderInvoicesTable(r) {
        if (!r.invoices.length) return '';
        return `
            ${this.sectionTitle('🧾', `Notas Fiscais Vinculadas (${r.invoices.length})`, 11)}
            <div class="report-table-scroll">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f3f4f6;">
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Nº NF-e</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Emitente</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">CNPJ</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Data Emissão</th>
                            <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;">Valor</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Serviço Vinculado</th>
                            <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Verificada</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.invoices.map(i => `
                            <tr>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace;font-weight:600;">${i.number}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${i.issuer}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;">${i.issuerCnpj || '-'}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(i.issueDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:right;font-weight:600;">${this.fmt(i.totalAmountCents)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;">${i.serviceTitle || '-'}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${i.verified ? '✅' : '❌'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${r.invoices.some(i => i.accessKey) ? `
                <div style="font-size:10px;color:#6b7280;margin-top:6px;">
                    <strong>Chaves de Acesso NF-e:</strong>
                    ${r.invoices.filter(i => i.accessKey).map(i => `<div style="font-family:monospace;margin-top:2px;">${i.number}: ${i.accessKey}</div>`).join('')}
                </div>
            ` : ''}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 12: EVOLUÇÃO DA QUILOMETRAGEM
    // ═══════════════════════════════════════════════════════
    renderMileageHistory(r) {
        const m = r.mileage;
        return `
            ${this.sectionTitle('📏', `Evolução da Quilometragem (${m.totalRecords} registros)`, 12)}
            <div style="display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;">
                ${this.infoGrid([
                    ['Primeiro Registro', `${this.fmtKm(m.first)} em ${this.fmtDate(m.firstDate)}`],
                    ['Último Registro (Atual)', `<strong>${this.fmtKm(m.current)}</strong>`],
                    ['Total de Registros', m.totalRecords],
                    ['Consistência', m.consistency ? '✅ Odômetro sempre crescente' : '⚠️ Possível anomalia']
                ])}
            </div>
            ${m.history.length > 0 ? `
                <div class="report-table-scroll">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:5px 8px;text-align:left;border:1px solid #e5e7eb;">Data</th>
                                <th style="padding:5px 8px;text-align:right;border:1px solid #e5e7eb;">Quilometragem</th>
                                <th style="padding:5px 8px;text-align:left;border:1px solid #e5e7eb;">Fonte</th>
                                <th style="padding:5px 8px;text-align:center;border:1px solid #e5e7eb;">Verificado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${m.history.map(h => `
                                <tr>
                                    <td style="padding:4px 8px;border:1px solid #e5e7eb;">${this.fmtDate(h.date)}</td>
                                    <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:600;">${this.fmtKm(h.km)}</td>
                                    <td style="padding:4px 8px;border:1px solid #e5e7eb;">${h.source}</td>
                                    <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;">${h.verified ? '✅' : '❌'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 13: OFICINAS
    // ═══════════════════════════════════════════════════════
    renderWorkshops(r) {
        if (!r.workshops.length) return '';
        return `
            ${this.sectionTitle('🏭', `Oficinas Credenciadas que Atenderam o Veículo (${r.workshops.length})`, 13)}
            ${r.workshops.map(w => `
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <div>
                            <strong style="font-size:14px;">${w.tradeName}</strong>
                            ${w.verified ? ' <span style="background:#ecfdf5;color:#065f46;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">✅ VERIFICADA</span>' : ''}
                            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${w.companyName} — CNPJ: ${w.cnpj}</div>
                            <div style="font-size:11px;color:#6b7280;">${w.address} — ${w.city} · Tel: ${w.phone}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:18px;font-weight:800;color:#111827;">${w.servicesCount} serviço(s)</div>
                            <div style="font-size:11px;color:#065f46;font-weight:600;">Total: ${this.fmt(w.totalSpentCents)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 14: CATEGORIAS DE SERVIÇO
    // ═══════════════════════════════════════════════════════
    renderServiceCategories(r) {
        if (!r.serviceCategories.length) return '';
        return `
            ${this.sectionTitle('📂', 'Distribuição de Serviços por Categoria', 14)}
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${r.serviceCategories.map(c => `
                    <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:8px 14px;display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;font-weight:800;color:#111827;">${c.count}</span>
                        <span style="font-size:12px;color:#374151;">${c.category}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 15: REGISTROS FOTOGRÁFICOS
    // ═══════════════════════════════════════════════════════
    renderPhotosResume(r) {
        const p = r.photos;
        const catLabels = {
            'VEHICLE_MAIN': 'Veículo Principal',
            'OLD_PART': 'Peça Antiga',
            'NEW_PART': 'Peça Nova',
            'INSTALLED_PART': 'Peça Instalada',
            'ODOMETER': 'Odômetro',
            'ENGINE': 'Motor',
            'SERVICE_DONE': 'Serviço Concluído'
        };
        return `
            ${this.sectionTitle('📷', `Registros Fotográficos (${p.total} fotos)`, 15)}
            ${this.infoGrid([
                ['Total de Fotos', p.total],
                ...Object.entries(p.byCategory).map(([cat, count]) => [catLabels[cat] || cat, count + ' foto(s)'])
            ])}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 16: DOCUMENTAÇÃO
    // ═══════════════════════════════════════════════════════
    renderDocuments(r) {
        if (!r.documents.length) return `
            ${this.sectionTitle('📋', 'Documentação do Veículo', 16)}
            <div style="font-size:12px;color:#6b7280;padding:8px;background:#f9fafb;border-radius:6px;">Nenhum documento registrado. Verificação via DETRAN não disponível nesta fonte.</div>
        `;
        return `
            ${this.sectionTitle('📋', `Documentação do Veículo (${r.documents.length})`, 16)}
            <div class="report-table-scroll">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f3f4f6;">
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Tipo</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Título</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Emissão</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Vencimento</th>
                            <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Status</th>
                            <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Fonte</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.documents.map(d => `
                            <tr>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:600;">${d.type}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${d.title}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(d.issueDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(d.expirationDate)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${this.statusBadge(d.status)}</td>
                                <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;">${d.source || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 17: IPVA E TAXAS
    // ═══════════════════════════════════════════════════════
    renderTaxes(r) {
        return `
            ${this.sectionTitle('🏛️', `IPVA e Taxas (${r.taxes.length} registros)`, 17)}
            ${r.taxes.length === 0 ? '<div style="font-size:12px;color:#6b7280;padding:8px;background:#f9fafb;border-radius:6px;">Informação não disponível nesta fonte. Consulte o DETRAN/Sefaz do seu estado.</div>' : `
                <div class="report-table-scroll">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Ano Ref.</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Vencimento</th>
                                <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;">Valor</th>
                                <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Status</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Fonte</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r.taxes.map(t => `
                                <tr>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:600;">${t.year}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(t.dueDate)}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:right;">${t.amountCents ? this.fmt(t.amountCents) : 'N/D'}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${this.statusBadge(t.status)}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;">${t.source}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 18: MULTAS
    // ═══════════════════════════════════════════════════════
    renderFines(r) {
        const f = r.fines;
        return `
            ${this.sectionTitle('🚨', `Histórico de Multas (${f.total} registro(s))`, 18)}
            ${f.total === 0 ? `
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;font-size:13px;color:#065f46;font-weight:600;">
                    ✅ Nenhuma multa registrada neste veículo
                </div>
            ` : `
                ${f.totalPending > 0 ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;font-size:12px;color:#991b1b;margin-bottom:8px;"><strong>⚠️ ${f.totalPending} multa(s) pendente(s)</strong></div>` : ''}
                <div class="report-table-scroll">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Código</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Data</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Descrição</th>
                                <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;">Valor</th>
                                <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Pontos</th>
                                <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${f.items.map(m => `
                                <tr>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace;">${m.code || '-'}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(m.date)}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;">${m.description || '-'}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:right;">${m.amountCents ? this.fmt(m.amountCents) : '-'}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${m.points || 0}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${this.statusBadge(m.status)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 19: DÉBITOS E RESTRIÇÕES
    // ═══════════════════════════════════════════════════════
    renderDebts(r) {
        const d = r.debts;
        return `
            ${this.sectionTitle('🔒', `Débitos e Restrições (${d.total} registro(s))`, 19)}
            ${d.total === 0 ? `
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;font-size:13px;color:#065f46;font-weight:600;">
                    ✅ Nenhum débito ou restrição registrado — Veículo LIVRE
                </div>
            ` : `
                ${d.hasRestrictions ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;font-size:12px;color:#991b1b;margin-bottom:8px;"><strong>🚨 ATENÇÃO: Veículo possui restrição(ões) ativa(s)</strong></div>` : ''}
                ${d.items.map(debt => `
                    <div style="background:${debt.hasRestriction ? '#fef2f2' : '#f9fafb'};border:1px solid ${debt.hasRestriction ? '#fecaca' : '#e5e7eb'};border-radius:6px;padding:10px;margin-bottom:6px;">
                        <div style="font-weight:700;font-size:12px;">${debt.hasRestriction ? '🔴' : '🟢'} ${debt.category}: ${debt.description}</div>
                        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Fonte: ${debt.source}</div>
                    </div>
                `).join('')}
            `}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 20: HISTÓRICO DE LEILÃO E SINISTROS
    // ═══════════════════════════════════════════════════════
    renderAuctions(r) {
        const a = r.auctions;
        return `
            ${this.sectionTitle('🔨', 'Histórico de Leilão e Sinistros', 20)}
            ${!a.hasAuctionRecord ? `
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;font-size:13px;color:#065f46;font-weight:600;">
                    ✅ Nenhum registro de leilão ou sinistro encontrado
                </div>
            ` : `
                ${a.items.filter(i => i.hasRecord).map(auction => `
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin-bottom:6px;">
                        <div style="font-weight:700;font-size:12px;color:#991b1b;">⚠️ Registro de Leilão/Sinistro Encontrado</div>
                        <div style="font-size:11px;color:#374151;margin-top:4px;">
                            ${auction.auctioneer ? `Leiloeiro: <strong>${auction.auctioneer}</strong>` : ''}
                            ${auction.date ? ` · Data: <strong>${this.fmtDate(auction.date)}</strong>` : ''}
                            ${auction.damageClass ? ` · Classificação: <strong>${auction.damageClass}</strong>` : ''}
                        </div>
                        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Fonte: ${auction.source}</div>
                    </div>
                `).join('')}
            `}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 21: MANUTENÇÕES PROGRAMADAS
    // ═══════════════════════════════════════════════════════
    renderMaintenancePlan(r) {
        const m = r.maintenances;
        return `
            ${this.sectionTitle('🗓️', `Plano de Manutenção Preventiva (${m.totalPlanned} itens)`, 21)}
            ${this.infoGrid([
                ['Total Planejadas', m.totalPlanned],
                ['Realizadas', m.completed],
                ['Vencidas / Atrasadas', m.overdue > 0 ? `<span style="color:#991b1b;font-weight:800;">⚠️ ${m.overdue}</span>` : '0'],
                ['Próximas', m.upcoming]
            ])}
            ${m.items.length > 0 ? `
                <div class="report-table-scroll">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Manutenção</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Categoria</th>
                                <th style="padding:6px 8px;text-align:right;border:1px solid #e5e7eb;">KM Recomendado</th>
                                <th style="padding:6px 8px;text-align:left;border:1px solid #e5e7eb;">Data Recomendada</th>
                                <th style="padding:6px 8px;text-align:center;border:1px solid #e5e7eb;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${m.items.map(item => `
                                <tr>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:600;">${item.title}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;">${item.category}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;">${item.recommendedKm ? this.fmtKm(item.recommendedKm) : '-'}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;">${this.fmtDate(item.recommendedDate)}</td>
                                    <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;">${this.statusBadge(item.status)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    },

    // ═══════════════════════════════════════════════════════
    // AVISO LEGAL
    // ═══════════════════════════════════════════════════════
    renderLegalDisclaimer(r) {
        return `
            <div style="margin-top:24px;">
                ${this.sectionTitle('⚖️', 'Aviso Legal Obrigatório', 22)}
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:11px;color:#991b1b;line-height:1.6;">
                    <strong>AVISO IMPORTANTE:</strong> ${r.legalDisclaimer}
                </div>
                ${r.legalNotice2 ? `
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;font-size:11px;color:#92400e;line-height:1.5;margin-top:6px;">
                        <strong>NOTA SOBRE INTEGRAÇÕES:</strong> ${r.legalNotice2}
                    </div>
                ` : ''}
            </div>
        `;
    },

    // ═══════════════════════════════════════════════════════
    // RODAPÉ
    // ═══════════════════════════════════════════════════════
    renderFooter(r) {
        return `
            <div style="margin-top:20px;padding-top:12px;border-top:2px solid #111827;display:flex;justify-content:space-between;font-size:10px;color:#6b7280;flex-wrap:wrap;gap:8px;">
                <span>Autenticação: <strong style="font-family:monospace;">${r.validationCode}</strong></span>
                <span>Emitido em: <strong>${new Date(r.generatedAt).toLocaleString('pt-BR')}</strong></span>
                <span>Validade: 90 dias a partir da emissão</span>
                <span><strong>DNA AUTO</strong> — O DNA pertence ao carro. Sempre.</span>
            </div>
            <div style="text-align:center;margin-top:16px;padding:12px;background:#111827;border-radius:8px;">
                <div style="color:#00d4ff;font-size:14px;font-weight:800;">🧬 DNA AUTO</div>
                <div style="color:#94a3b8;font-size:11px;margin-top:2px;">Seu carro tem uma história. Agora ele tem um DNA.</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;">Relatório gerado automaticamente com ${r.healthScore.totalServicesCount} serviços, ${r.healthScore.invoicesCount} notas fiscais, ${r.healthScore.photosCount} fotos e ${r.healthScore.mileageRecordsCount} registros de quilometragem analisados.</div>
            </div>
        `;
    },

    printReport() {
        document.body.classList.add('printing-sale-report');
        const cleanup = () => {
            document.body.classList.remove('printing-sale-report');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
        setTimeout(cleanup, 2000);
    }
};
