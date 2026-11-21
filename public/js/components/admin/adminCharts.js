// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — GRÁFICOS CORPORATIVOS SVG
// Sem dependência externa pesada | 100% responsivo a Tema Claro & Escuro
// Legendas claras, escalas proporcionais, tooltips acessíveis e zero decoração falsa
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

    renderLegend(entries = []) {
        const valid = entries.filter(e => e && e.label);
        if (!valid.length) return '';
        return `
            <div class="adm-chart-legend" aria-label="Legenda do gráfico">
                ${valid.map(e => `
                    <span class="adm-chart-legend-item">
                        <span class="adm-chart-legend-swatch" style="background:${this.esc(e.color)};" aria-hidden="true"></span>
                        <span>${this.esc(e.label)}</span>
                    </span>
                `).join('')}
            </div>
        `;
    },

    /**
     * Gráfico de barras verticais (suporta 1 ou 2 séries com legenda corporativa)
     */
    renderBarChart(items, {
        valueKey,
        secondaryKey = null,
        labelKey = 'month',
        primaryLabel = '',
        secondaryLabel = '',
        color = 'var(--adm-chart-1)',
        secondaryColor = 'var(--adm-chart-2)',
        isCurrency = false,
        emptyText = 'Sem movimentação registrada no período.'
    } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados suficientes</strong>${this.esc(emptyText)}</div>`;
        }
        const values = items.flatMap(i => [Number(i[valueKey] || 0), secondaryKey ? Number(i[secondaryKey] || 0) : 0]);
        const maxVal = Math.max(...values, 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>0 registros no período</strong>${this.esc(emptyText)}</div>`;
        }

        const w = 560;
        const h = 216;
        const padL = 62;
        const padR = 16;
        const padT = 22;
        const padB = 36;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const groupW = plotW / items.length;
        const barW = secondaryKey ? Math.min(22, groupW * 0.34) : Math.min(36, groupW * 0.54);

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padT + plotH * (1 - ratio);
            const v = Math.round(maxVal * ratio);
            const lbl = isCurrency ? this.formatMoneyShort(v) : v.toLocaleString('pt-BR');
            return `
                <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--adm-chart-grid)" stroke-width="1" stroke-dasharray="${ratio === 0 ? '' : '3 3'}"/>
                <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="var(--adm-chart-axis)" font-size="11" font-family="var(--adm-font-mono)">${this.esc(lbl)}</text>
            `;
        }).join('');

        const bars = items.map((item, idx) => {
            const cx = padL + groupW * idx + groupW / 2;
            const v1 = Number(item[valueKey] || 0);
            const h1 = v1 > 0 ? Math.max(3, (v1 / maxVal) * plotH) : 0;
            const y1 = padT + plotH - h1;
            const rawLbl = labelKey === 'month' || labelKey === 'competence_month' ? this.shortMonth(item[labelKey]) : String(item[labelKey] || '');
            const fmtV1 = isCurrency ? this.formatBrl(v1) : v1.toLocaleString('pt-BR');

            if (secondaryKey) {
                const v2 = Number(item[secondaryKey] || 0);
                const h2 = v2 > 0 ? Math.max(3, (v2 / maxVal) * plotH) : 0;
                const y2 = padT + plotH - h2;
                const fmtV2 = isCurrency ? this.formatBrl(v2) : v2.toLocaleString('pt-BR');
                const t1 = `${rawLbl}${primaryLabel ? ` — ${primaryLabel}` : ''}: ${fmtV1}`;
                const t2 = `${rawLbl}${secondaryLabel ? ` — ${secondaryLabel}` : ''}: ${fmtV2}`;
                return `
                    <g>
                        <rect x="${(cx - barW - 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${barW.toFixed(1)}" height="${h1.toFixed(1)}" rx="3" fill="${color}">
                            <title>${this.esc(t1)}</title>
                        </rect>
                        <rect x="${(cx + 2).toFixed(1)}" y="${y2.toFixed(1)}" width="${barW.toFixed(1)}" height="${h2.toFixed(1)}" rx="3" fill="${secondaryColor}">
                            <title>${this.esc(t2)}</title>
                        </rect>
                        <text x="${cx.toFixed(1)}" y="${h - 12}" text-anchor="middle" fill="var(--adm-chart-axis)" font-size="11" font-weight="500">${this.esc(rawLbl)}</text>
                    </g>
                `;
            }

            const t1 = `${rawLbl}${primaryLabel ? ` — ${primaryLabel}` : ''}: ${fmtV1}`;
            return `
                <g>
                    <rect x="${(cx - barW / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${barW.toFixed(1)}" height="${h1.toFixed(1)}" rx="4" fill="${color}">
                        <title>${this.esc(t1)}</title>
                    </rect>
                    ${v1 > 0 ? `<text x="${cx.toFixed(1)}" y="${Math.max(13, y1 - 5).toFixed(1)}" text-anchor="middle" fill="var(--adm-text-primary)" font-size="10.5" font-weight="600" font-family="var(--adm-font-mono)">${this.esc(isCurrency ? this.formatMoneyShort(v1) : String(v1))}</text>` : ''}
                    <text x="${cx.toFixed(1)}" y="${h - 12}" text-anchor="middle" fill="var(--adm-chart-axis)" font-size="11" font-weight="500">${this.esc(rawLbl)}</text>
                </g>
            `;
        }).join('');

        const legend = this.renderLegend([
            primaryLabel ? { label: primaryLabel, color } : null,
            secondaryKey && secondaryLabel ? { label: secondaryLabel, color: secondaryColor } : null
        ]);

        return `
            ${legend}
            <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;" role="img" aria-label="Gráfico de barras">
                ${gridLines}
                ${bars}
            </svg>
        `;
    },

    /**
     * Gráfico de linha corporativo com área suave e marcações claras
     */
    renderLineChart(items, {
        valueKey,
        labelKey = 'month',
        seriesLabel = '',
        color = 'var(--adm-chart-2)',
        isCurrency = false,
        emptyText = 'Sem histórico no período.'
    } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados suficientes</strong>${this.esc(emptyText)}</div>`;
        }
        const vals = items.map(i => Number(i[valueKey] || 0));
        const maxVal = Math.max(...vals, 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>Sem evolução registrada</strong>${this.esc(emptyText)}</div>`;
        }

        const w = 560;
        const h = 216;
        const padL = 64;
        const padR = 20;
        const padT = 22;
        const padB = 36;
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

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padT + plotH * (1 - ratio);
            const v = Math.round(maxVal * ratio);
            const lbl = isCurrency ? this.formatMoneyShort(v) : v.toLocaleString('pt-BR');
            return `
                <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--adm-chart-grid)" stroke-width="1" stroke-dasharray="${ratio === 0 ? '' : '3 3'}"/>
                <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="var(--adm-chart-axis)" font-size="11" font-family="var(--adm-font-mono)">${this.esc(lbl)}</text>
            `;
        }).join('');

        const dots = points.map(p => {
            const fmt = isCurrency ? this.formatBrl(p.v) : p.v.toLocaleString('pt-BR');
            return `
                <g>
                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${color}" stroke="var(--adm-chart-dot-stroke)" stroke-width="2">
                        <title>${this.esc(p.lbl)}${seriesLabel ? ` — ${this.esc(seriesLabel)}` : ''}: ${this.esc(fmt)}</title>
                    </circle>
                    <text x="${p.x.toFixed(1)}" y="${h - 12}" text-anchor="middle" fill="var(--adm-chart-axis)" font-size="11" font-weight="500">${this.esc(p.lbl)}</text>
                </g>
            `;
        }).join('');

        const legend = seriesLabel ? this.renderLegend([{ label: seriesLabel, color }]) : '';

        return `
            ${legend}
            <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;" role="img" aria-label="Gráfico de linha">
                ${gridLines}
                <polygon points="${area}" fill="${color}" fill-opacity="0.12"/>
                <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                ${dots}
            </svg>
        `;
    },

    /**
     * Barras horizontais ordenadas com leitura de alto contraste
     */
    renderHorizontalBars(items, {
        labelKey,
        valueKey,
        subKey = null,
        color = 'var(--adm-chart-1)',
        isCurrency = false,
        suffix = '',
        emptyText = 'Sem dados disponíveis.'
    } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return `<div class="adm-empty"><strong>Sem dados suficientes</strong>${this.esc(emptyText)}</div>`;
        }
        const maxVal = Math.max(...items.map(i => Number(i[valueKey] || 0)), 0);
        if (maxVal === 0) {
            return `<div class="adm-empty"><strong>Sem registros contabilizados</strong>${this.esc(emptyText)}</div>`;
        }

        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                ${items.map(item => {
                    const v = Number(item[valueKey] || 0);
                    const pct = Math.max(3, Math.round((v / maxVal) * 100));
                    const valLabel = isCurrency ? this.formatBrl(v) : `${v.toLocaleString('pt-BR')}${suffix}`;
                    return `
                        <div title="${this.esc(item[labelKey] || '-')}: ${this.esc(valLabel)}">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:5px; font-size:13.5px;">
                                <span style="color:var(--adm-text-primary); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                    ${this.esc(item[labelKey] || '-')}
                                    ${subKey && item[subKey] ? `<span class="adm-mono" style="color:var(--adm-text-muted); font-weight:500; margin-left:6px; font-size:12px;">(${this.esc(item[subKey])})</span>` : ''}
                                </span>
                                <span class="adm-money" style="color:var(--adm-text-primary); flex-shrink:0;">${this.esc(valLabel)}</span>
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
