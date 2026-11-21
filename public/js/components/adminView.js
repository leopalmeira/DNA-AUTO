// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — ORQUESTRADOR ADMINISTRATIVO ERP
// Arquitetura inspirada em TOTVS Protheus / TOTVS RM / SAP Fiori / Fluent Design
// Tema Claro Corporativo padrão + Tema Escuro Profissional + 6 Grupos / 26 Telas
// ==============================================================================

const AdminView = {
    currentScreen: 'dashboard',
    currentParams: {},
    globalPeriod: 'current_month',
    globalMonth: '',
    sidebarCollapsed: false,
    drawerOpen: false,
    theme: 'light', // Tema claro corporativo é o padrão inicial
    collapsedGroups: {},
    liveBadges: {},
    liveNotifications: [],
    isMounted: false,
    searchDebounce: null,
    syncRefreshDebounce: null,
    modalConfirmHandler: null,
    lastApiState: { state: 'CONNECTING', lastSyncAt: null, errorMessage: null },

    // Organização ERP Corporativa — 6 grupos funcionais, 26 rotas reais integradas à API
    MENU_GROUPS: [
        {
            group: 'VISÃO EXECUTIVA',
            items: [
                { id: 'dashboard', label: 'Dashboard Geral', icon: 'grid' },
                { id: 'operations', label: 'Operação da Rede', icon: 'activity' },
                { id: 'goals', label: 'Indicadores Estratégicos', icon: 'target' }
            ]
        },
        {
            group: 'GESTÃO COMERCIAL',
            items: [
                { id: 'representatives', label: 'Representantes Comerciais', icon: 'briefcase' },
                { id: 'portfolios', label: 'Carteira de Oficinas', icon: 'layers' },
                { id: 'acquisition', label: 'Captação de Clientes', icon: 'trending' },
                { id: 'ranking', label: 'Ranking de Representantes', icon: 'award' },
                { id: 'commercial-goals', label: 'Metas Comerciais', icon: 'sliders' }
            ]
        },
        {
            group: 'REDE DNA AUTO',
            items: [
                { id: 'workshops', label: 'Oficinas Credenciadas', icon: 'wrench' },
                { id: 'clients', label: 'Clientes Cadastrados', icon: 'users' },
                { id: 'vehicles', label: 'Veículos Registrados', icon: 'car' },
                { id: 'service-orders', label: 'Histórico de Atendimentos', icon: 'file' },
                { id: 'maintenance-history', label: 'Serviços e Manutenções', icon: 'clock' }
            ]
        },
        {
            group: 'FINANCEIRO',
            items: [
                { id: 'revenue', label: 'Faturamento Geral', icon: 'dollar' },
                { id: 'commissions', label: 'Comissões de Representantes', icon: 'percent' },
                { id: 'payouts', label: 'Próximos Pagamentos', icon: 'calendar' },
                { id: 'workshop-payouts', label: 'Repasses às Oficinas', icon: 'send' },
                { id: 'attendance-fees', label: 'Taxas por Atendimento', icon: 'receipt' },
                { id: 'reconciliation', label: 'Conciliação Financeira', icon: 'checksquare' }
            ]
        },
        {
            group: 'COMUNICAÇÃO E SUPORTE',
            items: [
                { id: 'whatsapp', label: 'Central WhatsApp', icon: 'message' },
                { id: 'alerts', label: 'Alertas Preventivos', icon: 'bell' },
                { id: 'support', label: 'Chamados de Suporte', icon: 'lifebuoy' }
            ]
        },
        {
            group: 'GOVERNANÇA E SISTEMA',
            items: [
                { id: 'audit', label: 'Auditoria', icon: 'shield' },
                { id: 'sync', label: 'Sincronização de Dados', icon: 'refresh' },
                { id: 'settings', label: 'Configurações', icon: 'settings' },
                { id: 'users', label: 'Usuários e Permissões', icon: 'lock' }
            ]
        }
    ],

    // Acesso seguro à biblioteca de componentes reutilizáveis AdminUI (com fallback resiliente)
    ui() {
        if (typeof AdminUI !== 'undefined') return AdminUI;
        const self = this;
        return {
            esc: (s) => self.esc(s),
            formatBrl: (c) => self.formatBrl(c),
            formatNum: (n) => self.formatNum(n),
            PageHeader: ({ title, subtitle = '', badgeHtml = '', updatedAt = '', backAction = null, backLabel = 'Voltar', actionsHtml = '' } = {}) => `
                <div class="adm-section-head">
                    <div>
                        ${backAction ? `<div style="margin-bottom:8px;"><button type="button" class="adm-btn adm-btn-sm" onclick="${backAction}">← ${self.esc(backLabel)}</button></div>` : ''}
                        <h2>${self.esc(title)} ${badgeHtml}</h2>
                        ${subtitle ? `<p>${subtitle}</p>` : ''}
                    </div>
                    <div class="adm-header-actions">
                        ${updatedAt ? `<div class="adm-updated-stamp">Atualizado: <strong>${self.esc(updatedAt)}</strong></div>` : ''}
                        ${actionsHtml}
                    </div>
                </div>
            `,
            StatusBadge: (st, custom) => self.statusBadge(st, custom),
            KPIStatCard: ({ label, value, sub = '', tone = 'tone-cyan', tag = '', tagTone = '', onClick = '', isMoney = false, progressPct = null } = {}) => `
                <div class="adm-kpi-card ${onClick ? 'clickable' : ''} ${self.esc(tone)}" ${onClick ? `onclick="${onClick}"` : ''}>
                    <div class="adm-kpi-top"><div class="adm-kpi-label">${self.esc(label)}</div>${tag ? `<span class="adm-kpi-tag ${self.esc(tagTone)}">${self.esc(tag)}</span>` : ''}</div>
                    <div class="adm-kpi-value ${isMoney ? 'is-money' : ''}">${self.esc(value)}</div>
                    ${progressPct !== null ? `<div class="adm-progress-track"><div class="adm-progress-fill" style="width:${Number(progressPct)}%"></div></div>` : ''}
                    ${sub ? `<div class="adm-kpi-sub">${self.esc(sub)}</div>` : ''}
                </div>
            `,
            FinancialMetric: ({ label, cents, classification = 'Confirmado', sub = '', tone = 'tone-success', onClick = '' } = {}) =>
                self.ui().KPIStatCard({ label, value: self.formatBrl(cents), sub, tone, tag: classification, onClick, isMoney: true }),
            FilterToolbar: (html) => `<div class="adm-filters-bar">${html}</div>`,
            EmptyState: ({ title = 'Sem registros', subtitle = '', actionHtml = '' } = {}) =>
                `<div class="adm-empty"><strong>${self.esc(title)}</strong>${subtitle ? `<p style="margin:4px 0 0;">${self.esc(subtitle)}</p>` : ''}${actionHtml}</div>`,
            LoadingSkeleton: (lbl) => `<div class="adm-empty"><strong>${self.esc(lbl || 'Carregando...')}</strong></div>`,
            ErrorState: ({ title = 'Falha ao consultar dados atualizados da API', message = '', retryAction = 'AdminView.reloadCurrentScreen()' } = {}) =>
                `<div class="adm-error-state"><strong>⚠ ${self.esc(title)}</strong><p>${self.esc(message)}</p><button type="button" class="adm-btn adm-btn-primary" onclick="${retryAction}">↻ Tentar Novamente</button></div>`,
            EnterpriseDataTable: ({ columns = [], rows = [], emptyTitle = 'Nenhum registro encontrado', emptySubtitle = '', pagination = null, testId = '' } = {}) => {
                if (!rows.length) return `<div class="adm-empty"><strong>${self.esc(emptyTitle)}</strong>${self.esc(emptySubtitle)}</div>`;
                const th = columns.map(c => `<th class="${c.align === 'right' ? 'is-num' : ''}">${self.esc(c.label)}</th>`).join('');
                const tb = rows.map(r => `<tr>${columns.map(c => `<td class="${c.align === 'right' ? 'is-num' : ''} ${c.tdClass || ''}">${typeof c.render === 'function' ? c.render(r) : self.esc(r[c.key] ?? '-')}</td>`).join('')}</tr>`).join('');
                return `<div class="adm-table-wrap"><table class="adm-table" ${testId ? `data-testid="${self.esc(testId)}"` : ''}><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>${pagination ? self.renderPagination(pagination.page, pagination.totalPages, pagination.total, pagination.pageSize) : ''}`;
            },
            ConfirmationDialog: ({ title, message, detailsHtml = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', inputConfig = null } = {}) => `
                <div class="adm-modal-overlay"><div class="adm-modal is-confirm"><div class="adm-modal-head"><h3>${self.esc(title)}</h3></div><div class="adm-modal-body"><div id="adm-modal-err" style="display:none;"></div>${message ? `<p>${self.esc(message)}</p>` : ''}${detailsHtml}${inputConfig ? `<textarea id="${self.esc(inputConfig.id || 'adm-confirm-input')}"></textarea>` : ''}</div><div class="adm-modal-foot"><button class="adm-btn" onclick="AdminView.closeModal()">${self.esc(cancelLabel)}</button><button class="adm-btn adm-btn-primary" id="adm-modal-confirm-btn" onclick="AdminView.submitModal()">${self.esc(confirmLabel)}</button></div></div></div>
            `,
            DetailDrawer: ({ title, subtitle = '', bodyHtml = '', footerHtml = '' } = {}) =>
                `<div class="adm-detail-drawer-overlay"><div class="adm-detail-drawer"><div class="adm-detail-drawer-head"><h3>${self.esc(title)}</h3><p>${self.esc(subtitle)}</p></div><div class="adm-detail-drawer-body">${bodyHtml}</div><div class="adm-detail-drawer-foot">${footerHtml}</div></div></div>`,
            renderNotificationItems: () => ''
        };
    },

    // Ícones SVG corporativos limpos (stroke uniforme 1.75)
    iconSvg(name) {
        const paths = {
            grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
            activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
            target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
            wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
            users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.5-3.5C15 5.6 14 5 13 5H7c-1 0-2 .6-2.5 1.5L2 10l-.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
            file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
            clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
            briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
            trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
            award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
            sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>',
            dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
            percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
            send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
            receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>',
            checksquare: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
            message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
            bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
            lifebuoy: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>',
            shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
            refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
            settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.4-1.51 1z"/>',
            lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
        };
        return `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.grid}</svg>`;
    },

    // --------------------------------------------------------------------------
    // FORMATADORES & HELPERS SEGUROS
    // --------------------------------------------------------------------------
    esc(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    formatBrl(cents) {
        const val = Number(cents || 0) / 100;
        return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    formatNum(n) {
        return Number(n || 0).toLocaleString('pt-BR');
    },

    formatDate(val) {
        if (!val) return '-';
        const s = String(val);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[3]}/${m[2]}/${m[1]}`;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('pt-BR');
    },

    formatDateTime(val) {
        if (!val) return '-';
        const s = String(val);
        const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s) ? `${s.replace(' ', 'T')}Z` : s;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    statusBadge(status, customLabel = null) {
        if (typeof AdminUI !== 'undefined') return AdminUI.StatusBadge(status, customLabel);
        const st = String(status || '').toUpperCase();
        const map = {
            ACTIVE: ['adm-badge-success', 'Ativo'],
            APPROVED: ['adm-badge-success', 'Aprovada'],
            CONFIRMED: ['adm-badge-success', 'Confirmada'],
            PAID: ['adm-badge-info', 'Pago'],
            COMPLETED: ['adm-badge-success', 'Concluído'],
            RESOLVED: ['adm-badge-success', 'Resolvido'],
            CONNECTED: ['adm-badge-success', 'Conectado'],
            SENT: ['adm-badge-success', 'Enviada'],
            DELIVERED: ['adm-badge-success', 'Entregue'],
            DELIVERED_IN_PLATFORM: ['adm-badge-success', 'Entregue'],
            CONCILIADO: ['adm-badge-success', 'Conciliado'],
            PENDING: ['adm-badge-warning', 'Pendente'],
            PENDING_APPROVAL: ['adm-badge-warning', 'Aguardando Aprovação'],
            PROJECTED: ['adm-badge-muted', 'Projetada'],
            SCHEDULED: ['adm-badge-warning', 'Agendado'],
            OPEN: ['adm-badge-warning', 'Aberto'],
            OPEN_FORECAST: ['adm-badge-info', 'Previsão Aberta'],
            IN_PROGRESS: ['adm-badge-info', 'Em Atendimento'],
            RECOMENDADA: ['adm-badge-warning', 'Recomendada'],
            APROXIMANDO: ['adm-badge-info', 'Aproximando'],
            VENCIDA: ['adm-badge-danger', 'Vencida'],
            SUSPENDED: ['adm-badge-danger', 'Suspenso'],
            REJECTED: ['adm-badge-danger', 'Recusado'],
            BLOCKED: ['adm-badge-danger', 'Bloqueado'],
            REFUNDED: ['adm-badge-danger', 'Estornado'],
            CANCELLED: ['adm-badge-danger', 'Cancelado'],
            FAILED: ['adm-badge-danger', 'Falha'],
            CLOSED: ['adm-badge-muted', 'Fechado'],
            HIGH: ['adm-badge-danger', 'Alta'],
            URGENT: ['adm-badge-danger', 'Urgente'],
            NORMAL: ['adm-badge-info', 'Normal']
        };
        const [cls, label] = map[st] || ['adm-badge-muted', st || '-'];
        return `<span class="adm-badge ${cls}"><span class="adm-badge-dot" aria-hidden="true"></span>${this.esc(customLabel || label)}</span>`;
    },

    proofBadge(level) {
        const l = Number(level || 0);
        if (l === 4) return '<span class="adm-badge adm-badge-success"><span class="adm-badge-dot" aria-hidden="true"></span>Nível 4 • Comprovado</span>';
        if (l === 3) return '<span class="adm-badge adm-badge-info"><span class="adm-badge-dot" aria-hidden="true"></span>Nível 3 • Confirmado</span>';
        if (l === 2) return '<span class="adm-badge adm-badge-warning"><span class="adm-badge-dot" aria-hidden="true"></span>Nível 2 • Nota Anexada</span>';
        return '<span class="adm-badge adm-badge-muted"><span class="adm-badge-dot" aria-hidden="true"></span>Nível 1 • Declarado</span>';
    },

    renderPagination(page, totalPages, total, pageSize = 25) {
        const p = Number(page || 1);
        const tp = Math.max(1, Number(totalPages || 1));
        const sz = Number(pageSize || 25);
        return `
            <div class="adm-pagination">
                <span>Exibindo página <strong>${p}</strong> de <strong>${tp}</strong> • <strong>${this.formatNum(total)}</strong> registro(s)</span>
                <div class="adm-pagination-controls">
                    <label style="display:inline-flex; align-items:center; gap:6px;">
                        <span>Por página:</span>
                        <select class="adm-select adm-page-size-select" aria-label="Registros por página" onchange="AdminView.updateParams({ page_size: Number(this.value), page: 1 })">
                            ${[10, 25, 50, 100].map(n => `<option value="${n}" ${sz === n ? 'selected' : ''}>${n}</option>`).join('')}
                        </select>
                    </label>
                    <button type="button" class="adm-btn adm-btn-sm" ${p <= 1 ? 'disabled' : ''} onclick="AdminView.updateParams({ page: ${Math.max(1, p - 1)} })">← Anterior</button>
                    <button type="button" class="adm-btn adm-btn-sm" ${p >= tp ? 'disabled' : ''} onclick="AdminView.updateParams({ page: ${Math.min(tp, p + 1)} })">Próxima →</button>
                </div>
            </div>
        `;
    },

    toast(message, tone = 'success') {
        let el = document.getElementById('adm-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'adm-toast';
            el.setAttribute && el.setAttribute('role', 'status');
            el.setAttribute && el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.className = `adm-toast ${tone === 'error' ? 'is-error' : ''}`;
        el.textContent = message;
        el.style.display = 'block';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3800);
    },

    // --------------------------------------------------------------------------
    // TEMA CLARO CORPORATIVO (PADRÃO) & TEMA ESCURO PROFISSIONAL
    // --------------------------------------------------------------------------
    loadSavedTheme() {
        try {
            const saved = localStorage.getItem('dna_adm_theme');
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (_) {}
        return 'light';
    },

    applyTheme(nextTheme) {
        this.theme = nextTheme === 'dark' ? 'dark' : 'light';
        try { localStorage.setItem('dna_adm_theme', this.theme); } catch (_) {}
        const shell = document.getElementById('adm-shell');
        if (shell && shell.setAttribute) shell.setAttribute('data-adm-theme', this.theme);
        if (document.documentElement && document.documentElement.setAttribute) {
            document.documentElement.setAttribute('data-adm-theme', this.theme);
        }
        const btn = document.getElementById('adm-theme-switcher');
        if (btn && typeof AdminUI !== 'undefined') {
            const wrap = document.createElement('div');
            wrap.innerHTML = AdminUI.ThemeSwitcher(this.theme);
            const nextBtn = wrap.firstElementChild;
            if (nextBtn && btn.replaceWith) {
                btn.replaceWith(nextBtn);
            }
        }
    },

    toggleTheme() {
        this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
    },

    // --------------------------------------------------------------------------
    // GRUPOS RECOLHÍVEIS DA SIDEBAR & CONTADORES REAIS
    // --------------------------------------------------------------------------
    loadSavedGroupState() {
        try {
            const raw = localStorage.getItem('dna_adm_collapsed_groups');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (_) {}
        return {};
    },

    toggleNavGroup(groupName) {
        this.collapsedGroups[groupName] = !this.collapsedGroups[groupName];
        try { localStorage.setItem('dna_adm_collapsed_groups', JSON.stringify(this.collapsedGroups)); } catch (_) {}
        const nodes = document.querySelectorAll('#adm-sidebar-nav .adm-nav-group');
        nodes.forEach(el => {
            if (el.dataset && el.dataset.group === groupName) {
                const collapsed = Boolean(this.collapsedGroups[groupName]);
                el.classList.toggle('is-collapsed', collapsed);
                const hdr = el.querySelector && el.querySelector('.adm-nav-group-header');
                if (hdr && hdr.setAttribute) hdr.setAttribute('aria-expanded', String(!collapsed));
            }
        });
    },

    updateLiveBadgesFromOverview(overview) {
        if (!overview || !overview.cards) return;
        const c = overview.cards || {};
        const s = overview.supplementary || {};
        const pendingReps = Number(c.pending_representatives || 0);
        const pendingWs = Number(c.pending_workshops || 0);
        const openTickets = Number(s.open_support_tickets || 0);

        this.liveBadges = {
            representatives: pendingReps,
            workshops: pendingWs,
            support: openTickets
        };

        document.querySelectorAll('[data-badge-screen]').forEach(el => {
            const key = el.dataset && el.dataset.badgeScreen;
            const val = Number(this.liveBadges[key] || 0);
            if (val > 0) {
                el.textContent = val > 99 ? '99+' : String(val);
                el.style.display = 'inline-block';
            } else {
                el.style.display = 'none';
            }
        });

        // Atualizar Central de Notificações com pendências reais
        const list = [];
        if (pendingWs > 0) {
            list.push({
                tone: 'warning',
                count: pendingWs,
                title: `${pendingWs} oficina(s) aguardando aprovação`,
                subtitle: 'Revise e homologue o credenciamento na Rede DNA AUTO.',
                action: "AdminView.navigate('workshops', { status: 'PENDING' })"
            });
        }
        if (pendingReps > 0) {
            list.push({
                tone: 'warning',
                count: pendingReps,
                title: `${pendingReps} representante(s) aguardando aprovação`,
                subtitle: 'Aprove ou recuse novos cadastros comerciais.',
                action: "AdminView.navigate('representatives', { status: 'PENDING_APPROVAL' })"
            });
        }
        if (openTickets > 0) {
            list.push({
                tone: 'danger',
                count: openTickets,
                title: `${openTickets} chamado(s) de suporte em aberto`,
                subtitle: 'Atendimentos enviados pelas oficinas credenciadas.',
                action: "AdminView.navigate('support', { status: 'OPEN' })"
            });
        }
        this.liveNotifications = list;

        const total = pendingWs + pendingReps + openTickets;
        const badgeEl = document.getElementById('adm-notif-count');
        if (badgeEl) {
            if (total > 0) {
                badgeEl.textContent = total > 99 ? '99+' : String(total);
                badgeEl.style.display = 'inline-flex';
            } else {
                badgeEl.style.display = 'none';
            }
        }
        const pillEl = document.getElementById('adm-notif-total-pill');
        if (pillEl) pillEl.textContent = `${total} pendência(s)`;
        const listEl = document.getElementById('adm-notif-list');
        if (listEl && typeof AdminUI !== 'undefined') {
            listEl.innerHTML = AdminUI.renderNotificationItems(list);
        }
    },

    async refreshSidebarBadges() {
        if (typeof API === 'undefined' || typeof API.getAdminDashboardOverview !== 'function') return;
        try {
            const ov = await API.getAdminDashboardOverview({ period: this.globalPeriod });
            this.updateLiveBadgesFromOverview(ov);
        } catch (_) {
            // Falha silenciosa: nunca mascara ou inventa contadores
        }
    },

    // --------------------------------------------------------------------------
    // CICLO DE VIDA & RENDERIZAÇÃO DO SHELL ERP V3
    // --------------------------------------------------------------------------
    resolveLegacyScreen(tab) {
        if (!tab) return 'dashboard';
        const map = {
            dashboard: 'dashboard',
            workshops: 'workshops',
            revenue: 'revenue',
            whatsapp: 'whatsapp',
            representatives: 'representatives',
            tickets: 'support',
            support: 'support',
            audit: 'audit'
        };
        return map[tab] || tab;
    },

    render(initialTab = null) {
        const container = document.getElementById('view-content');
        if (!container) return;

        document.body.classList.add('is-admin-v2');
        try {
            this.sidebarCollapsed = localStorage.getItem('dna_adm_sidebar_collapsed') === '1';
        } catch (_) {}
        this.theme = this.loadSavedTheme();
        this.collapsedGroups = this.loadSavedGroupState();

        if (document.documentElement && document.documentElement.setAttribute) {
            document.documentElement.setAttribute('data-adm-theme', this.theme);
        }

        if (initialTab) {
            this.currentScreen = this.resolveLegacyScreen(initialTab);
            this.currentParams = {};
        }

        const adminName = (typeof App !== 'undefined' && App.currentUser && App.currentUser.name) || 'Administrador Geral';
        const adminInitials = adminName.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'AD';
        const meta = this.getScreenMeta(this.currentScreen);

        if (typeof AdminUI !== 'undefined') {
            const sidebarHtml = AdminUI.SidebarNavigation({
                menuGroups: this.MENU_GROUPS,
                collapsedGroups: this.collapsedGroups,
                currentNavId: meta.navId,
                activeGroup: meta.group,
                badges: this.liveBadges,
                adminName,
                adminInitials,
                iconFn: (icon) => this.iconSvg(icon)
            });
            const topbarHtml = AdminUI.EnterpriseTopbar({
                trail: `DNA AUTO › ${meta.group}`,
                title: meta.label,
                globalPeriod: this.globalPeriod,
                theme: this.theme,
                adminName,
                adminInitials,
                notifications: this.liveNotifications
            });
            container.innerHTML = AdminUI.AdminLayout({
                sidebarCollapsed: this.sidebarCollapsed,
                theme: this.theme,
                sidebarHtml,
                topbarHtml
            });
        } else {
            // Fallback compatível para ambientes de teste isolados sem adminUiKit.js
            container.innerHTML = `
                <div id="adm-shell" class="adm-shell ${this.sidebarCollapsed ? 'sidebar-collapsed' : ''}" data-adm-theme="${this.esc(this.theme)}">
                    <div class="adm-drawer-backdrop" onclick="AdminView.toggleDrawer(false)"></div>
                    <aside class="adm-sidebar" aria-label="Menu Administrativo DNA AUTO">
                        <div class="adm-sidebar-brand">
                            <div class="adm-brand-left">
                                <div class="adm-brand-text">
                                    <div class="adm-brand-title">DNA AUTO</div>
                                    <div class="adm-brand-sub">ENTERPRISE ADMIN</div>
                                </div>
                            </div>
                        </div>
                        <div class="adm-sidebar-scroll" id="adm-sidebar-nav"></div>
                        <div class="adm-sidebar-footer">
                            <div class="adm-avatar">${this.esc(adminInitials)}</div>
                            <div class="adm-sidebar-footer-text">${this.esc(adminName)}</div>
                        </div>
                    </aside>
                    <div class="adm-main">
                        <header class="adm-topbar">
                            <div class="adm-topbar-left">
                                <div class="adm-breadcrumb">
                                    <div class="adm-breadcrumb-trail" id="adm-breadcrumb-trail">DNA AUTO › ${this.esc(meta.group)}</div>
                                    <div class="adm-breadcrumb-title" id="adm-breadcrumb-title">${this.esc(meta.label)}</div>
                                </div>
                            </div>
                            <div class="adm-topbar-controls">
                                <button type="button" class="adm-btn adm-btn-sm" id="adm-refresh-btn" onclick="AdminView.reloadCurrentScreen()">Atualizar</button>
                                <div class="adm-api-pill checking" id="adm-api-pill"><span class="adm-status-dot"></span><span id="adm-api-pill-text">Verificando...</span></div>
                            </div>
                        </header>
                        <div id="adm-offline-banner" class="adm-offline-banner" style="display:none;">
                            <span id="adm-offline-banner-msg"></span>
                        </div>
                        <main class="adm-content" id="adm-screen-body"></main>
                    </div>
                </div>
                <div id="adm-modal-root"></div>
                <div id="adm-drawer-root"></div>
            `;
        }

        this.isMounted = true;
        this.bindGlobalEvents();

        if (typeof AdminSync !== 'undefined') {
            this.updateApiStatusUi({ state: 'CONNECTING', lastSyncAt: null, errorMessage: null });
            AdminSync.start({
                onState: (st) => this.updateApiStatusUi(st),
                onEvent: (evt) => this.onRealtimeSyncEvent(evt)
            });
        }

        this.loadScreen();
    },

    destroy() {
        this.isMounted = false;
        document.body.classList.remove('is-admin-v2');
        if (document.documentElement && document.documentElement.removeAttribute) {
            document.documentElement.removeAttribute('data-adm-theme');
        }
        if (typeof AdminSync !== 'undefined') {
            AdminSync.stop();
        }
        clearTimeout(this.searchDebounce);
        clearTimeout(this.syncRefreshDebounce);
    },

    bindGlobalEvents() {
        if (this._eventsBound) return;
        this._eventsBound = true;

        document.addEventListener('click', (e) => {
            const target = e && e.target;
            const searchWrap = document.querySelector && document.querySelector('.adm-global-search-wrap');
            const dd = document.getElementById('adm-search-dropdown');
            if (dd && searchWrap && (!target || !searchWrap.contains(target))) {
                dd.style.display = 'none';
            }

            const notifWrap = document.getElementById('adm-notif-wrap');
            const notifPop = document.getElementById('adm-notif-popover');
            if (notifPop && notifWrap && (!target || !notifWrap.contains(target))) {
                notifPop.style.display = 'none';
            }

            const profWrap = document.getElementById('adm-profile-wrap');
            const profPop = document.getElementById('adm-profile-popover');
            if (profPop && profWrap && (!target || !profWrap.contains(target))) {
                profPop.style.display = 'none';
            }

            // Fechar menus contextuais de tabelas ao clicar fora
            if (document.querySelectorAll) {
                document.querySelectorAll('.adm-action-menu-dropdown').forEach(menu => {
                    const parent = menu.parentElement;
                    if (!parent || !target || !parent.contains(target)) {
                        menu.style.display = 'none';
                    }
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isMounted || !e || e.key !== 'Escape') return;
            this.closeAllPopovers();
            const modalOpen = document.querySelector && document.querySelector('#adm-modal-root .adm-modal-overlay');
            if (modalOpen) {
                this.closeModal();
                return;
            }
            const drawerOpen = document.querySelector && document.querySelector('#adm-drawer-root .adm-detail-drawer-overlay');
            if (drawerOpen) {
                this.closeDetailDrawer();
                return;
            }
            if (this.drawerOpen) {
                this.toggleDrawer(false);
            }
        });
    },

    closeAllPopovers() {
        ['adm-search-dropdown', 'adm-notif-popover', 'adm-profile-popover'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        if (document.querySelectorAll) {
            document.querySelectorAll('.adm-action-menu-dropdown').forEach(m => { m.style.display = 'none'; });
        }
    },

    toggleNotificationsPopover(ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        const pop = document.getElementById('adm-notif-popover');
        const prof = document.getElementById('adm-profile-popover');
        if (prof) prof.style.display = 'none';
        if (!pop) return;
        const willOpen = pop.style.display === 'none';
        pop.style.display = willOpen ? 'block' : 'none';
        const btn = document.getElementById('adm-notif-btn');
        if (btn && btn.setAttribute) btn.setAttribute('aria-expanded', String(willOpen));
    },

    toggleProfilePopover(ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        const pop = document.getElementById('adm-profile-popover');
        const notif = document.getElementById('adm-notif-popover');
        if (notif) notif.style.display = 'none';
        if (!pop) return;
        pop.style.display = pop.style.display === 'none' ? 'block' : 'none';
    },

    toggleActionMenu(menuId, ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        const target = document.getElementById(menuId);
        if (!target) return;
        const willOpen = target.style.display === 'none';
        if (document.querySelectorAll) {
            document.querySelectorAll('.adm-action-menu-dropdown').forEach(m => { m.style.display = 'none'; });
        }
        if (willOpen) {
            target.style.display = 'block';
            const btn = ev && ev.currentTarget;
            if (btn && btn.getBoundingClientRect && typeof window !== 'undefined') {
                const rect = btn.getBoundingClientRect();
                const menuW = 220;
                const menuH = target.offsetHeight || 190;
                const vw = window.innerWidth || 1280;
                const vh = window.innerHeight || 800;
                const left = Math.max(12, Math.min(vw - menuW - 12, rect.right - menuW));
                const top = (rect.bottom + menuH + 10 > vh) ? Math.max(12, rect.top - menuH - 6) : (rect.bottom + 6);
                target.style.position = 'fixed';
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
                target.style.right = 'auto';
                target.style.zIndex = '90';
            }
        }
    },

    handleMenuButtonClick() {
        const w = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1440;
        if (w <= 960) {
            this.toggleDrawer();
        } else {
            this.toggleSidebarCollapse();
        }
    },

    toggleSidebarCollapse() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const shell = document.getElementById('adm-shell');
        if (shell) shell.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
        try { localStorage.setItem('dna_adm_sidebar_collapsed', this.sidebarCollapsed ? '1' : '0'); } catch (_) {}
    },

    toggleDrawer(forceState = null) {
        this.drawerOpen = forceState !== null ? Boolean(forceState) : !this.drawerOpen;
        const shell = document.getElementById('adm-shell');
        if (shell) shell.classList.toggle('drawer-open', this.drawerOpen);
    },

    // Compatibilidade com chamadas legadas de index.html / app.js
    switchTab(tab) {
        this.navigate(this.resolveLegacyScreen(tab));
    },

    filterByWorkshop(workshopId, ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (!workshopId || workshopId === 'all') {
            this.navigate('workshops');
        } else {
            this.openWorkshop(workshopId);
        }
    },

    navigate(screenId, params = {}) {
        this.currentScreen = screenId;
        this.currentParams = { ...params };
        this.toggleDrawer(false);
        this.closeAllPopovers();
        this.closeDetailDrawer();
        this.updateNavHighlight();
        this.loadScreen();
    },

    updateParams(partialParams = {}) {
        this.currentParams = { ...this.currentParams, ...partialParams };
        this.loadScreen();
    },

    openRepresentative(id, subtab = 'personal') {
        this.navigate('representative-detail', { id, subtab });
    },

    openWorkshop(id, subtab = 'summary') {
        this.navigate('workshop-detail', { id, subtab });
    },

    onPeriodChange(period) {
        this.globalPeriod = period;
        this.loadScreen();
    },

    reloadCurrentScreen() {
        return this.loadScreen();
    },

    // --------------------------------------------------------------------------
    // SINCRONIZAÇÃO EM TEMPO REAL & STATUS REAL DA API (4 ESTADOS)
    // Online | Instável | Offline | Verificando
    // --------------------------------------------------------------------------
    updateApiStatusUi(st) {
        this.lastApiState = st;
        const pill = document.getElementById('adm-api-pill');
        const txt = document.getElementById('adm-api-pill-text');
        const banner = document.getElementById('adm-offline-banner');
        const bannerMsg = document.getElementById('adm-offline-banner-msg');
        if (!pill || !txt) return;

        pill.classList.remove('checking', 'degraded', 'offline');
        if (st.state === 'ONLINE') {
            const hhmm = st.lastSyncAt
                ? new Date(st.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '';
            txt.textContent = hhmm ? `Online • ${hhmm}` : 'API Online';
            if (banner) banner.style.display = 'none';
        } else if (st.state === 'RECONNECTING') {
            pill.classList.add('degraded');
            txt.textContent = 'Instável';
            if (banner) {
                banner.style.display = 'flex';
                if (bannerMsg) bannerMsg.textContent = st.errorMessage || 'Conexão com a API instável. Tentando restabelecer sincronização...';
            }
        } else if (st.state === 'OFFLINE') {
            pill.classList.add('offline');
            txt.textContent = 'Offline';
            if (banner) {
                banner.style.display = 'flex';
                if (bannerMsg) bannerMsg.textContent = st.errorMessage || 'API indisponível no momento. Os dados exibidos não serão mascarados com cache antigo.';
            }
        } else {
            pill.classList.add('checking');
            txt.textContent = 'Verificando...';
        }
    },

    onRealtimeSyncEvent() {
        if (!this.isMounted) return;
        const modalOpen = document.querySelector && document.querySelector('#adm-modal-root .adm-modal-overlay');
        if (modalOpen) return;
        clearTimeout(this.syncRefreshDebounce);
        this.syncRefreshDebounce = setTimeout(() => {
            if (this.isMounted && !(document.querySelector && document.querySelector('#adm-modal-root .adm-modal-overlay'))) {
                this.loadScreen({ silent: true });
            }
        }, 700);
    },

    // --------------------------------------------------------------------------
    // NAVEGAÇÃO, BREADCRUMB & CARREGAMENTO ANTI-RACE-CONDITION
    // --------------------------------------------------------------------------
    getScreenMeta(screenId) {
        if (screenId === 'representative-detail') {
            return { group: 'GESTÃO COMERCIAL', label: 'Ficha do Representante', navId: 'representatives' };
        }
        if (screenId === 'workshop-detail') {
            return { group: 'REDE DNA AUTO', label: 'Detalhamento da Oficina', navId: 'workshops' };
        }
        for (const g of this.MENU_GROUPS) {
            for (const it of g.items) {
                if (it.id === screenId) {
                    return { group: g.group, label: it.label, navId: it.id };
                }
            }
        }
        return { group: 'VISÃO EXECUTIVA', label: 'Dashboard Geral', navId: 'dashboard' };
    },

    updateNavHighlight() {
        const meta = this.getScreenMeta(this.currentScreen);
        const trail = document.getElementById('adm-breadcrumb-trail');
        const title = document.getElementById('adm-breadcrumb-title');
        if (trail) trail.textContent = `DNA AUTO › ${meta.group}`;
        if (title) title.textContent = meta.label;

        if (document.querySelectorAll) {
            document.querySelectorAll('#adm-sidebar-nav .adm-nav-item').forEach(el => {
                const isActive = el.dataset && el.dataset.screen === meta.navId;
                el.classList.toggle('active', isActive);
                if (el.setAttribute && el.removeAttribute) {
                    if (isActive) el.setAttribute('aria-current', 'page');
                    else el.removeAttribute('aria-current');
                }
            });

            document.querySelectorAll('#adm-sidebar-nav .adm-nav-group').forEach(grp => {
                const isActiveGrp = grp.dataset && grp.dataset.group === meta.group;
                grp.classList.toggle('is-active-group', isActiveGrp);
                if (isActiveGrp && grp.classList.contains('is-collapsed')) {
                    grp.classList.remove('is-collapsed');
                    this.collapsedGroups[meta.group] = false;
                }
            });
        }
    },

    async loadScreen({ silent = false } = {}) {
        const body = document.getElementById('adm-screen-body');
        if (!body) return;

        this.updateNavHighlight();
        const reqToken = typeof AdminSync !== 'undefined' ? AdminSync.nextRequestToken() : Date.now();
        const refreshBtn = document.getElementById('adm-refresh-btn');
        if (refreshBtn && !silent) refreshBtn.disabled = true;
        if (!silent) {
            const label = this.getScreenMeta(this.currentScreen).label;
            body.innerHTML = this.ui().LoadingSkeleton(`Carregando ${label}...`);
        }

        const ctx = {
            period: this.globalPeriod,
            month: this.globalMonth,
            params: this.currentParams
        };

        try {
            let html = '';
            switch (this.currentScreen) {
                // VISÃO EXECUTIVA
                case 'dashboard': html = await AdminScreensCore.renderDashboard(ctx); break;
                case 'operations': html = await AdminScreensCore.renderOperations(ctx); break;
                case 'goals': html = await AdminScreensCore.renderGoals(ctx); break;
                // REDE DNA AUTO
                case 'workshops': html = await AdminScreensCore.renderWorkshops(ctx); break;
                case 'workshop-detail': html = await AdminScreensCore.renderWorkshopDetail(ctx); break;
                case 'clients': html = await AdminScreensCore.renderClients(ctx); break;
                case 'vehicles': html = await AdminScreensCore.renderVehicles(ctx); break;
                case 'service-orders': html = await AdminScreensCore.renderServiceOrders(ctx); break;
                case 'maintenance-history': html = await AdminScreensCore.renderMaintenanceHistory(ctx); break;
                // GESTÃO COMERCIAL
                case 'representatives': html = await AdminScreensCommercial.renderRepresentatives(ctx); break;
                case 'representative-detail': html = await AdminScreensCommercial.renderRepresentativeDetail(ctx); break;
                case 'portfolios': html = await AdminScreensCommercial.renderPortfolios(ctx); break;
                case 'acquisition': html = await AdminScreensCommercial.renderAcquisition(ctx); break;
                case 'ranking': html = await AdminScreensCommercial.renderRanking(ctx); break;
                case 'commercial-goals': html = await AdminScreensCommercial.renderCommercialGoals(ctx); break;
                // FINANCEIRO
                case 'revenue': html = await AdminScreensFinance.renderRevenue(ctx); break;
                case 'commissions': html = await AdminScreensFinance.renderCommissions(ctx); break;
                case 'payouts': html = await AdminScreensFinance.renderPayouts(ctx); break;
                case 'workshop-payouts': html = await AdminScreensFinance.renderWorkshopPayouts(ctx); break;
                case 'attendance-fees': html = await AdminScreensFinance.renderAttendanceFees(ctx); break;
                case 'reconciliation': html = await AdminScreensFinance.renderReconciliation(ctx); break;
                // COMUNICAÇÃO E SUPORTE
                case 'whatsapp': html = await AdminScreensOps.renderWhatsApp(ctx); break;
                case 'alerts': html = await AdminScreensOps.renderAlerts(ctx); break;
                case 'support': html = await AdminScreensOps.renderSupport(ctx); break;
                // GOVERNANÇA E SISTEMA
                case 'audit': html = await AdminScreensOps.renderAudit(ctx); break;
                case 'sync': html = await AdminScreensOps.renderSync(ctx); break;
                case 'settings': html = await AdminScreensOps.renderSettings(ctx); break;
                case 'users': html = await AdminScreensOps.renderUsers(ctx); break;
                default: html = await AdminScreensCore.renderDashboard(ctx);
            }

            if (typeof AdminSync !== 'undefined' && !AdminSync.isLatestRequest(reqToken)) {
                return;
            }
            if (typeof AdminSync !== 'undefined') AdminSync.markRequestSuccess();
            body.innerHTML = html;
        } catch (err) {
            if (typeof AdminSync !== 'undefined' && !AdminSync.isLatestRequest(reqToken)) {
                return;
            }
            if (err && (err.status === 401 || err.status === 403)) {
                body.innerHTML = `
                    <div class="adm-error-state" role="alert">
                        <strong>Sessão administrativa expirada ou sem permissão (${this.esc(err.status)})</strong>
                        <p style="margin:6px 0 16px;">${this.esc(err.message)}</p>
                        <button type="button" class="adm-btn adm-btn-primary" onclick="App.logout(); App.switchView('login-admin');">Autenticar Novamente</button>
                    </div>
                `;
                return;
            }
            if (typeof AdminSync !== 'undefined') AdminSync.markRequestFailure(err);
            body.innerHTML = this.ui().ErrorState({
                title: 'Falha ao consultar dados atualizados da API',
                message: (err && err.message) || 'API temporariamente indisponível.',
                retryAction: 'AdminView.reloadCurrentScreen()',
                retryLabel: 'Tentar Novamente'
            });
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
        }
    },

    // --------------------------------------------------------------------------
    // BUSCA GLOBAL
    // --------------------------------------------------------------------------
    onGlobalSearchInput(val) {
        const dd = document.getElementById('adm-search-dropdown');
        if (!dd) return;
        const q = String(val || '').trim();
        if (q.length < 2) {
            dd.style.display = 'none';
            return;
        }
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(async () => {
            try {
                const res = await API.adminGlobalSearch(q);
                const sections = [];
                if ((res.representatives || []).length) {
                    sections.push(`<div class="adm-search-group-title">Representantes</div>` + res.representatives.map(r => `
                        <div class="adm-search-item" role="option" onclick="AdminView.selectSearchResult('rep', '${this.esc(r.id)}')">
                            <span><strong class="adm-mono adm-text-accent">${this.esc(r.rep_code)}</strong> ${this.esc(r.name)}</span>
                            <span class="adm-text-muted" style="font-size:12px;">${this.esc(r.city || '')}/${this.esc(r.state || '')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.workshops || []).length) {
                    sections.push(`<div class="adm-search-group-title">Oficinas Credenciadas</div>` + res.workshops.map(w => `
                        <div class="adm-search-item" role="option" onclick="AdminView.selectSearchResult('ws', '${this.esc(w.id)}')">
                            <span><strong>${this.esc(w.trade_name)}</strong></span>
                            <span class="adm-text-muted" style="font-size:12px;">${this.esc(w.city || '')}/${this.esc(w.state || '')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.vehicles || []).length) {
                    sections.push(`<div class="adm-search-group-title">Veículos e DNA</div>` + res.vehicles.map(v => `
                        <div class="adm-search-item" role="option" onclick="AdminView.selectSearchResult('veh', '${this.esc(v.license_plate)}')">
                            <span><strong class="adm-mono">${this.esc(v.license_plate)}</strong> ${this.esc(v.brand || '')} ${this.esc(v.model || '')}</span>
                            <span class="adm-mono adm-text-success" style="font-size:12px;">${this.esc(v.dna_code || 'Sem DNA')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.clients || []).length) {
                    sections.push(`<div class="adm-search-group-title">Clientes</div>` + res.clients.map(c => `
                        <div class="adm-search-item" role="option" onclick="AdminView.selectSearchResult('client', '${this.esc(c.name)}')">
                            <span>${this.esc(c.name)}</span>
                            <span class="adm-text-muted" style="font-size:12px;">${this.esc(c.email || c.phone || '')}</span>
                        </div>
                    `).join(''));
                }
                dd.innerHTML = sections.length
                    ? sections.join('')
                    : `<div style="padding:14px; font-size:13px; color:var(--adm-text-muted); text-align:center;">Nenhum resultado para "${this.esc(q)}".</div>`;
                dd.style.display = 'block';
            } catch (_) {
                dd.style.display = 'none';
            }
        }, 260);
    },

    selectSearchResult(kind, value) {
        const dd = document.getElementById('adm-search-dropdown');
        if (dd) dd.style.display = 'none';
        if (kind === 'rep') this.openRepresentative(value);
        else if (kind === 'ws') this.openWorkshop(value);
        else if (kind === 'veh') App.switchView('dossier', value);
        else if (kind === 'client') this.navigate('clients', { q: value });
    },

    // --------------------------------------------------------------------------
    // AÇÕES COMPARTILHADAS, CONFIRMATION DIALOG, MODAL & DETAIL DRAWER
    // --------------------------------------------------------------------------
    changeWorkshopStatus(workshopId, status, workshopName = '') {
        const isDanger = status === 'SUSPENDED' || status === 'BLOCKED';
        const labelAction = status === 'APPROVED' ? 'Aprovar Credenciamento' : (status === 'SUSPENDED' ? 'Suspender Oficina' : `Alterar Status (${status})`);
        this.openConfirmDialog({
            title: `${labelAction}${workshopName ? ` — ${workshopName}` : ''}`,
            message: isDanger
                ? 'A oficina selecionada será suspensa e ficará impedida de realizar novas operações até ser reativada. O histórico de veículos, clientes e financeiro será preservado integralmente.'
                : 'A oficina passará a constar como aprovada e ativa na rede credenciada DNA AUTO.',
            confirmLabel: labelAction,
            tone: isDanger ? 'danger' : 'success',
            onConfirm: async () => {
                await API.setWorkshopStatus(workshopId, status);
                this.toast(`Oficina atualizada para ${status === 'APPROVED' ? 'Aprovada' : (status === 'SUSPENDED' ? 'Suspensa' : status)}.`);
                await this.reloadCurrentScreen();
            }
        });
    },

    openConfirmDialog({ title, message = '', detailsHtml = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'primary', inputConfig = null, onConfirm }) {
        const root = document.getElementById('adm-modal-root');
        if (!root) return;
        this.modalConfirmHandler = async () => {
            let inputValue = null;
            if (inputConfig) {
                const inputId = inputConfig.id || 'adm-confirm-input';
                const el = document.getElementById(inputId);
                inputValue = el ? String(el.value || '').trim() : '';
                if (inputConfig.required && inputValue.length < (inputConfig.minLength || 1)) {
                    throw new Error(inputConfig.errorMessage || `Preencha o campo "${inputConfig.label || 'obrigatório'}" (mínimo ${inputConfig.minLength || 1} caracteres).`);
                }
            }
            if (typeof onConfirm === 'function') {
                await onConfirm(inputValue);
            }
        };
        root.innerHTML = this.ui().ConfirmationDialog({
            title,
            message,
            detailsHtml,
            confirmLabel,
            cancelLabel,
            tone,
            inputConfig
        });
    },

    openModal({ title, body, confirmLabel = 'Confirmar', confirmTone = 'primary', onConfirm }) {
        const root = document.getElementById('adm-modal-root');
        if (!root) return;
        this.modalConfirmHandler = onConfirm;
        const btnCls = confirmTone === 'danger' ? 'adm-btn-danger-solid' : (confirmTone === 'success' ? 'adm-btn-success' : 'adm-btn-primary');
        root.innerHTML = `
            <div class="adm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" onclick="if(event.target===this) AdminView.closeModal()">
                <div class="adm-modal">
                    <div class="adm-modal-head">
                        <h3 id="adm-modal-title">${this.esc(title)}</h3>
                        <button type="button" class="adm-icon-btn" style="width:32px; height:32px;" aria-label="Fechar janela" onclick="AdminView.closeModal()">✕</button>
                    </div>
                    <div class="adm-modal-body">
                        <div id="adm-modal-err" class="adm-chain-box is-danger" style="display:none; margin-bottom:12px;" role="alert"></div>
                        ${body}
                    </div>
                    <div class="adm-modal-foot">
                        <button type="button" class="adm-btn" onclick="AdminView.closeModal()">Cancelar</button>
                        <button type="button" class="adm-btn ${btnCls}" id="adm-modal-confirm-btn" onclick="AdminView.submitModal()">${this.esc(confirmLabel)}</button>
                    </div>
                </div>
            </div>
        `;
    },

    closeModal() {
        const root = document.getElementById('adm-modal-root');
        if (root) root.innerHTML = '';
        this.modalConfirmHandler = null;
    },

    async submitModal() {
        const btn = document.getElementById('adm-modal-confirm-btn');
        const errBox = document.getElementById('adm-modal-err');
        if (errBox) errBox.style.display = 'none';
        if (btn) btn.disabled = true;
        try {
            if (typeof this.modalConfirmHandler === 'function') {
                await this.modalConfirmHandler();
            }
            this.closeModal();
        } catch (err) {
            if (errBox) {
                errBox.textContent = (err && err.message) || 'Erro ao executar operação.';
                errBox.style.display = 'block';
            }
            if (btn) btn.disabled = false;
        }
    },

    openDetailDrawer({ title, subtitle = '', bodyHtml = '', footerHtml = '' }) {
        const root = document.getElementById('adm-drawer-root');
        if (!root) return;
        root.innerHTML = this.ui().DetailDrawer({ title, subtitle, bodyHtml, footerHtml });
    },

    closeDetailDrawer() {
        const root = document.getElementById('adm-drawer-root');
        if (root) root.innerHTML = '';
    }
};
