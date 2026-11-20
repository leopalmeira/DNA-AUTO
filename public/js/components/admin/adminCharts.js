// ==============================================================================
// DNA AUTO — GRÁFICOS SVG VETORIAIS SEM DEPENDÊNCIA EXTERNA (ADMIN CENTRAL V2)
// ==============================================================================

const AdminCharts = {
    esc(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    formatMoneyShort(cents) {
        const val = Number(cents || 0) / 100;
        if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
        return `R$ ${val.toFixed(0)}`;
    },

    formatBrl(cents) {
        return `R$ ${(Number(cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    shortMonth(ym) {
        if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '-';
        const [y, m] = ym.split('-');
        const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${names[Number(m) - 1] || m}/${y.slice(2)}`;
    },

    /**
     * Gráfico de barras verticais (suporta 1 ou 2 séries)
     */
    renderBarChart(items, { valueKey, secondaryKey = null, labelKey = 'month', color = '#00D4FF', secondaryColor = '#10B981', isCurrency = false, emptyText = 'Sem movimentação registrada no período.' } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados</strong>${this.esc(emptyText)}</div>`;
        }
        const values = items.flatMap(i => [Number(i[valueKey] || 0), secondaryKey ? Number(i[secondaryKey] || 0) : 0]);
        const maxVal = Math.max(...values, 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>0 registros no período</strong>${this.esc(emptyText)}</div>`;
        }

        const w = 520;
        const h = 190;
        const padL = 48;
        const padR = 14;
        const padT = 18;
        const padB = 34;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const groupW = plotW / items.length;
        const barW = secondaryKey ? Math.min(20, groupW * 0.34) : Math.min(34, groupW * 0.56);

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padT + plotH * (1 - ratio);
            const v = Math.round(maxVal * ratio);
            const lbl = isCurrency ? this.formatMoneyShort(v) : v.toLocaleString('pt-BR');
            return `
                <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
                <text x="${padL - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9.5" font-family="monospace">${this.esc(lbl)}</text>
            `;
        }).join('');

        const bars = items.map((item, idx) => {
            const cx = padL + groupW * idx + groupW / 2;
            const v1 = Number(item[valueKey] || 0);
            const h1 = Math.max(2, (v1 / maxVal) * plotH);
            const y1 = padT + plotH - h1;
            const rawLbl = labelKey === 'month' || labelKey === 'competence_month' ? this.shortMonth(item[labelKey]) : String(item[labelKey] || '');
            const fmtV1 = isCurrency ? this.formatBrl(v1) : v1.toLocaleString('pt-BR');

            if (secondaryKey) {
                const v2 = Number(item[secondaryKey] || 0);
                const h2 = Math.max(v2 > 0 ? 2 : 0, (v2 / maxVal) * plotH);
                const y2 = padT + plotH - h2;
                const fmtV2 = isCurrency ? this.formatBrl(v2) : v2.toLocaleString('pt-BR');
                return `
                    <g>
                        <rect x="${cx - barW - 2}" y="${y1}" width="${barW}" height="${h1}" rx="3" fill="${color}">
                            <title>${this.esc(rawLbl)}: ${this.esc(fmtV1)}</title>
                        </rect>
                        <rect x="${cx + 2}" y="${y2}" width="${barW}" height="${h2}" rx="3" fill="${secondaryColor}">
                            <title>${this.esc(rawLbl)}: ${this.esc(fmtV2)}</title>
                        </rect>
                        <text x="${cx}" y="${h - 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${this.esc(rawLbl)}</text>
                    </g>
                `;
            }

            return `
                <g>
                    <rect x="${cx - barW / 2}" y="${y1}" width="${barW}" height="${h1}" rx="4" fill="${color}">
                        <title>${this.esc(rawLbl)}: ${this.esc(fmtV1)}</title>
                    </rect>
                    <text x="${cx}" y="${Math.max(11, y1 - 4)}" text-anchor="middle" fill="#cbd5e1" font-size="9.5" font-family="monospace">${this.esc(isCurrency ? this.formatMoneyShort(v1) : String(v1))}</text>
                    <text x="${cx}" y="${h - 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${this.esc(rawLbl)}</text>
                </g>
            `;
        }).join('');

        return `
            <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;" role="img">
                ${gridLines}
                ${bars}
            </svg>
        `;
    },

    /**
     * Gráfico de linha com área suave (ideal para crescimento acumulado / faturamento)
     */
    renderLineChart(items, { valueKey, labelKey = 'month', color = '#10B981', isCurrency = false, emptyText = 'Sem histórico no período.' } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados</strong>${this.esc(emptyText)}</div>`;
        }
        const vals = items.map(i => Number(i[valueKey] || 0));
        const maxVal = Math.max(...vals, 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>Sem evolução registrada</strong>${this.esc(emptyText)}</div>`;
        }

        const w = 520;
        const h = 190;
        const padL = 52;
        const padR = 18;
        const padT = 18;
        const padB = 34;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const stepX = items.length > 1 ? plotW / (items.length - 1) : 0;

        const points = items.map((item, idx) => {
            const v = Number(item[valueKey] || 0);
            const x = items.length > 1 ? padL + stepX * idx : padL + plotW / 2;
            const y = padT + plotH - (v / maxVal) * plotH;
            const lbl = labelKey === 'month' ? this.shortMonth(item[labelKey]) : String(item[labelKey] || '');
            return { x, y, v, lbl };
        });

        const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const area = `${points[0].x.toFixed(1)},${padT + plotH} ${polyline} ${points[points.length - 1].x.toFixed(1)},${padT + plotH}`;

        const gridLines = [0, 0.5, 1].map(ratio => {
            const y = padT + plotH * (1 - ratio);
            const v = Math.round(maxVal * ratio);
            const lbl = isCurrency ? this.formatMoneyShort(v) : v.toLocaleString('pt-BR');
            return `
                <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
                <text x="${padL - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9.5" font-family="monospace">${this.esc(lbl)}</text>
            `;
        }).join('');

        const dots = points.map(p => {
            const fmt = isCurrency ? this.formatBrl(p.v) : p.v.toLocaleString('pt-BR');
            return `
                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="#060b16" stroke-width="2">
                    <title>${this.esc(p.lbl)}: ${this.esc(fmt)}</title>
                </circle>
                <text x="${p.x.toFixed(1)}" y="${h - 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${this.esc(p.lbl)}</text>
            `;
        }).join('');

        return `
            <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;" role="img">
                ${gridLines}
                <polygon points="${area}" fill="${color}" fill-opacity="0.14"/>
                <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                ${dots}
            </svg>
        `;
    },

    /**
     * Barras horizontais ordenadas (ideal para rankings, estados e origens)
     */
    renderHorizontalBars(items, { labelKey, valueKey, subKey = null, color = '#00D4FF', isCurrency = false, suffix = '', emptyText = 'Sem dados disponíveis.' } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados</strong>${this.esc(emptyText)}</div>`;
        }
        const maxVal = Math.max(...items.map(i => Number(i[valueKey] || 0)), 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>Sem registros contabilizados</strong>${this.esc(emptyText)}</div>`;
        }

        return `
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${items.map(item => {
                    const v = Number(item[valueKey] || 0);
                    const pct = Math.max(2, Math.round((v / maxVal) * 100));
                    const valLabel = isCurrency ? this.formatBrl(v) : `${v.toLocaleString('pt-BR')}${suffix}`;
                    return `
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px; font-size:12px;">
                                <span style="color:#e2e8f0; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                    ${this.esc(item[labelKey] || '-')}
                                    ${subKey && item[subKey] ? `<span style="color:#64748b; font-weight:500; margin-left:4px;">(${this.esc(item[subKey])})</span>` : ''}
                                </span>
                                <span class="adm-mono" style="color:${color}; font-weight:700; flex-shrink:0;">${this.esc(valLabel)}</span>
                            </div>
                            <div class="adm-progress-track">
                                <div class="adm-progress-fill" style="width:${pct}%; background:${color};"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};
