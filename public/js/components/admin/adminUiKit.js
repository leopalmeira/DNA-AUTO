// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — BIBLIOTECA DE COMPONENTES REUTILIZÁVEIS
// Arquitetura padronizada (AdminLayout, SidebarNavigation, SidebarSection,
// EnterpriseTopbar, Breadcrumbs, PageHeader, KPIStatCard, EnterpriseDataTable,
// FilterToolbar, StatusBadge, FinancialMetric, DetailDrawer, ConfirmationDialog,
// EmptyState, LoadingSkeleton, ErrorState, NotificationCenter, ThemeSwitcher)
// ==============================================================================

const AdminUI = {
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

    // --------------------------------------------------------------------------
    // 1. Breadcrumbs
    // --------------------------------------------------------------------------
    Breadcrumbs({ trail = 'DNA AUTO › VISÃO EXECUTIVA', title = 'Dashboard Geral' } = {}) {
        return `
            <nav class="adm-breadcrumb" aria-label="Navegação estrutural">
                <div class="adm-breadcrumb-trail" id="adm-breadcrumb-trail">${this.esc(trail)}</div>
                <div class="adm-breadcrumb-title" id="adm-breadcrumb-title">${this.esc(title)}</div>
            </nav>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. PageHeader
    // --------------------------------------------------------------------------
    PageHeader({ title, subtitle = '', badgeHtml = '', updatedAt = '', backAction = null, backLabel = 'Voltar', actionsHtml = '' } = {}) {
        return `
            <div class="adm-section-head">
                <div>
                    ${backAction ? `
                        <div style="margin-bottom:8px;">
                            <button type="button" class="adm-btn adm-btn-sm" onclick="${backAction}">← ${this.esc(backLabel)}</button>
                        </div>
                    ` : ''}
                    <h2>${this.esc(title)} ${badgeHtml}</h2>
                    ${subtitle ? `<p>${subtitle}</p>` : ''}
                </div>
                <div class="adm-header-actions">
                    ${updatedAt ? `<div class="adm-updated-stamp">Atualizado: <strong>${this.esc(updatedAt)}</strong></div>` : ''}
                    ${actionsHtml}
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 3. StatusBadge (WCAG 2.2 AA — nunca depende exclusivamente de cor)
    // --------------------------------------------------------------------------
    StatusBadge(status, customLabel = null) {
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
            ONLINE: ['adm-badge-success', 'Online'],
            PENDING: ['adm-badge-warning', 'Pendente'],
            PENDING_APPROVAL: ['adm-badge-warning', 'Aguardando Aprovação'],
            PROJECTED: ['adm-badge-muted', 'Projetada'],
            SCHEDULED: ['adm-badge-warning', 'Agendado'],
            OPEN: ['adm-badge-warning', 'Aberto'],
            OPEN_FORECAST: ['adm-badge-info', 'Previsão Aberta'],
            IN_PROGRESS: ['adm-badge-info', 'Em Atendimento'],
            RECOMENDADA: ['adm-badge-warning', 'Recomendada'],
            APROXIMANDO: ['adm-badge-info', 'Aproximando'],
            WARNING: ['adm-badge-warning', 'Atenção'],
            VENCIDA: ['adm-badge-danger', 'Vencida'],
            CRITICAL: ['adm-badge-danger', 'Crítico'],
            SUSPENDED: ['adm-badge-danger', 'Suspenso'],
            REJECTED: ['adm-badge-danger', 'Recusado'],
            BLOCKED: ['adm-badge-danger', 'Bloqueado'],
            REFUNDED: ['adm-badge-danger', 'Estornado'],
            CANCELLED: ['adm-badge-danger', 'Cancelado'],
            FAILED: ['adm-badge-danger', 'Falha'],
            DIVERGENTE: ['adm-badge-danger', 'Divergente'],
            DISPUTED: ['adm-badge-danger', 'Contestada'],
            CLOSED: ['adm-badge-muted', 'Fechado'],
            INACTIVE: ['adm-badge-muted', 'Inativo'],
            HIGH: ['adm-badge-danger', 'Alta'],
            URGENT: ['adm-badge-danger', 'Urgente'],
            NORMAL: ['adm-badge-info', 'Normal']
        };
        const [cls, fallbackLabel] = map[st] || ['adm-badge-muted', st || '-'];
        const label = customLabel || fallbackLabel;
        return `<span class="adm-badge ${cls}"><span class="adm-badge-dot" aria-hidden="true"></span>${this.esc(label)}</span>`;
    },

    // --------------------------------------------------------------------------
    // 4. KPIStatCard
    // --------------------------------------------------------------------------
    KPIStatCard({ label, value, sub = '', tone = 'tone-cyan', tag = '', tagTone = '', onClick = '', isMoney = false, progressPct = null } = {}) {
        const clickable = Boolean(onClick);
        const keyAttr = clickable
            ? `role="button" tabindex="0" onclick="${onClick}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${onClick}}"`
            : '';
        return `
            <div class="adm-kpi-card ${clickable ? 'clickable' : ''} ${this.esc(tone)}" ${keyAttr}>
                <div class="adm-kpi-top">
                    <div class="adm-kpi-label">${this.esc(label)}</div>
                    ${tag ? `<span class="adm-kpi-tag ${this.esc(tagTone)}">${this.esc(tag)}</span>` : ''}
                </div>
                <div class="adm-kpi-value ${isMoney ? 'is-money' : ''}">${this.esc(value)}</div>
                ${progressPct !== null ? `<div class="adm-progress-track" aria-label="${Number(progressPct)}% concluído"><div class="adm-progress-fill" style="width:${Math.max(0, Math.min(100, Number(progressPct)))}%"></div></div>` : ''}
                ${sub ? `<div class="adm-kpi-sub">${this.esc(sub)}</div>` : ''}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 5. FinancialMetric (Diferencia explicitamente Previsto, Confirmado, Recebido, A Repassar)
    // --------------------------------------------------------------------------
    FinancialMetric({ label, cents, classification = 'Confirmado', sub = '', tone = 'tone-success', onClick = '' } = {}) {
        const clsLower = String(classification || '').toLowerCase();
        let tagTone = 'is-confirmed';
        if (clsLower.includes('previst') || clsLower.includes('projetad')) tagTone = 'is-projected';
        else if (clsLower.includes('pendent') || clsLower.includes('repass') || clsLower.includes('pagar')) tagTone = 'is-pending';
        else if (clsLower.includes('recebid') || clsLower.includes('líquid') || clsLower.includes('liquidad')) tagTone = 'is-received';

        return this.KPIStatCard({
            label,
            value: this.formatBrl(cents),
            sub,
            tone,
            tag: classification,
            tagTone,
            onClick,
            isMoney: true
        });
    },

    // --------------------------------------------------------------------------
    // 6. FilterToolbar
    // --------------------------------------------------------------------------
    FilterToolbar(innerHtml, { extraClass = '', ariaLabel = 'Filtros da listagem' } = {}) {
        return `<div class="adm-filters-bar ${this.esc(extraClass)}" role="search" aria-label="${this.esc(ariaLabel)}">${innerHtml}</div>`;
    },

    // --------------------------------------------------------------------------
    // 7. EnterpriseDataTable
    // --------------------------------------------------------------------------
    EnterpriseDataTable({
        columns = [],
        rows = [],
        sortBy = '',
        sortDir = 'desc',
        onSortExpr = null,
        emptyTitle = 'Nenhum registro encontrado',
        emptySubtitle = 'Ajuste os filtros aplicados ou aguarde novas movimentações.',
        emptyActionHtml = '',
        pagination = null,
        testId = ''
    } = {}) {
        if (!Array.isArray(rows) || rows.length === 0) {
            return this.EmptyState({ title: emptyTitle, subtitle: emptySubtitle, actionHtml: emptyActionHtml });
        }

        const theadHtml = columns.map(col => {
            const alignClass = col.align === 'right' ? 'is-num' : (col.align === 'center' ? 'is-center' : '');
            if (col.sortable && onSortExpr) {
                const isSorted = sortBy === col.key;
                const nextDir = isSorted && sortDir === 'desc' ? 'asc' : 'desc';
                const ariaSort = isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                const arrow = isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅';
                const handler = onSortExpr(col.key, nextDir);
                return `
                    <th class="${alignClass} is-sortable ${isSorted ? 'is-sorted' : ''}"
                        scope="col"
                        aria-sort="${ariaSort}"
                        tabindex="0"
                        onclick="${handler}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${handler}}">
                        ${this.esc(col.label)}<span class="adm-sort-icon" aria-hidden="true">${arrow}</span>
                    </th>
                `;
            }
            return `<th class="${alignClass}" scope="col">${this.esc(col.label)}</th>`;
        }).join('');

        const tbodyHtml = rows.map(row => {
            const tds = columns.map(col => {
                const alignClass = col.align === 'right' ? 'is-num' : (col.align === 'center' ? 'is-center' : '');
                const extraClass = col.tdClass || '';
                const content = typeof col.render === 'function' ? col.render(row) : this.esc(row[col.key] ?? '-');
                return `<td class="${alignClass} ${extraClass}">${content}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('');

        let pagHtml = '';
        if (pagination) {
            const p = Number(pagination.page || 1);
            const tp = Math.max(1, Number(pagination.totalPages || 1));
            const total = Number(pagination.total || rows.length);
            const pageSize = Number(pagination.pageSize || 25);
            const onPageChange = pagination.onPageChange || ((np) => `AdminView.updateParams({ page: ${np} })`);
            const onPageSizeChange = pagination.onPageSizeChange || `AdminView.updateParams({ page_size: Number(this.value), page: 1 })`;
            const sizes = pagination.pageSizes || [10, 25, 50, 100];

            pagHtml = `
                <div class="adm-pagination">
                    <div>Exibindo página <strong>${p}</strong> de <strong>${tp}</strong> • <strong>${this.formatNum(total)}</strong> registro(s)</div>
                    <div class="adm-pagination-controls">
                        <label style="display:inline-flex; align-items:center; gap:6px;">
                            <span>Por página:</span>
                            <select class="adm-select adm-page-size-select" aria-label="Registros por página" onchange="${onPageSizeChange}">
                                ${sizes.map(sz => `<option value="${sz}" ${pageSize === sz ? 'selected' : ''}>${sz}</option>`).join('')}
                            </select>
                        </label>
                        <button type="button" class="adm-btn adm-btn-sm" ${p <= 1 ? 'disabled' : ''} onclick="${onPageChange(Math.max(1, p - 1))}">← Anterior</button>
                        <button type="button" class="adm-btn adm-btn-sm" ${p >= tp ? 'disabled' : ''} onclick="${onPageChange(Math.min(tp, p + 1))}">Próxima →</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="adm-table-wrap">
                <table class="adm-table" ${testId ? `data-testid="${this.esc(testId)}"` : ''}>
                    <thead><tr>${theadHtml}</tr></thead>
                    <tbody>${tbodyHtml}</tbody>
                </table>
            </div>
            ${pagHtml}
        `;
    },

    // --------------------------------------------------------------------------
    // 8. EmptyState
    // --------------------------------------------------------------------------
    EmptyState({ title = 'Nenhum dado encontrado', subtitle = '', actionHtml = '' } = {}) {
        return `
            <div class="adm-empty" role="status">
                <strong>${this.esc(title)}</strong>
                ${subtitle ? `<p style="margin:4px 0 0;">${this.esc(subtitle)}</p>` : ''}
                ${actionHtml ? `<div style="margin-top:14px;">${actionHtml}</div>` : ''}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 9. LoadingSkeleton
    // --------------------------------------------------------------------------
    LoadingSkeleton(label = 'Carregando informações...') {
        return `
            <div class="adm-skeleton-wrap" role="status" aria-live="polite" aria-label="${this.esc(label)}">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div style="flex:1; max-width:380px;">
                        <div class="adm-skeleton-bar" style="height:26px; width:72%; margin-bottom:8px;"></div>
                        <div class="adm-skeleton-bar" style="height:14px; width:95%;"></div>
                    </div>
                    <div class="adm-skeleton-bar" style="height:34px; width:170px;"></div>
                </div>
                <div class="adm-kpi-grid">
                    <div class="adm-skeleton-card"></div>
                    <div class="adm-skeleton-card"></div>
                    <div class="adm-skeleton-card"></div>
                    <div class="adm-skeleton-card"></div>
                </div>
                <div class="adm-card" style="padding:20px;">
                    <div class="adm-skeleton-bar" style="height:40px; width:100%; margin-bottom:14px;"></div>
                    <div class="adm-skeleton-bar" style="height:240px; width:100%;"></div>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 10. ErrorState
    // --------------------------------------------------------------------------
    ErrorState({ title = 'Falha ao consultar dados atualizados da API', message = 'API temporariamente indisponível.', retryAction = 'AdminView.reloadCurrentScreen()', retryLabel = 'Tentar Novamente' } = {}) {
        return `
            <div class="adm-error-state" role="alert">
                <strong>⚠ ${this.esc(title)}</strong>
                <p style="margin:6px 0 16px;">${this.esc(message)}</p>
                <button type="button" class="adm-btn adm-btn-primary" onclick="${retryAction}">↻ ${this.esc(retryLabel)}</button>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 11. ThemeSwitcher
    // --------------------------------------------------------------------------
    ThemeSwitcher(theme = 'light') {
        const isDark = theme === 'dark';
        const icon = isDark
            ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        const title = isDark ? 'Alternar para Tema Claro Corporativo' : 'Alternar para Tema Escuro Profissional';
        return `
            <button type="button" id="adm-theme-switcher" class="adm-icon-btn" title="${title}" aria-label="${title}" onclick="AdminView.toggleTheme()">
                ${icon}
            </button>
        `;
    },

    // --------------------------------------------------------------------------
    // 12. NotificationCenter
    // --------------------------------------------------------------------------
    NotificationCenter(notifications = []) {
        const totalCount = notifications.reduce((acc, n) => acc + Number(n.count || 0), 0);
        return `
            <div class="adm-popover-wrap" id="adm-notif-wrap">
                <button type="button" class="adm-icon-btn" id="adm-notif-btn" aria-label="Notificações operacionais" aria-expanded="false" title="Notificações operacionais" onclick="AdminView.toggleNotificationsPopover(event)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    ${totalCount > 0 ? `<span class="adm-notif-count" id="adm-notif-count">${totalCount > 99 ? '99+' : totalCount}</span>` : `<span class="adm-notif-count" id="adm-notif-count" style="display:none;">0</span>`}
                </button>
                <div class="adm-popover" id="adm-notif-popover" style="display:none;" role="region" aria-label="Central de notificações">
                    <div class="adm-popover-head">
                        <span>Notificações da Rede</span>
                        <span class="adm-badge adm-badge-info" id="adm-notif-total-pill">${totalCount} pendência(s)</span>
                    </div>
                    <div class="adm-popover-body" id="adm-notif-list">
                        ${this.renderNotificationItems(notifications)}
                    </div>
                </div>
            </div>
        `;
    },

    renderNotificationItems(notifications = []) {
        if (!notifications || notifications.length === 0) {
            return `<div style="padding:18px 14px; text-align:center; font-size:13px; color:var(--adm-text-muted);">Nenhuma pendência operacional no momento.</div>`;
        }
        return notifications.map(n => `
            <button type="button" class="adm-notif-item" onclick="AdminView.closeAllPopovers(); ${n.action}">
                <span class="adm-notif-dot ${this.esc(n.tone || 'info')}" aria-hidden="true"></span>
                <div style="min-width:0; flex:1;">
                    <div style="font-size:13.5px; font-weight:600;">${this.esc(n.title)}</div>
                    <div style="font-size:12px; color:var(--adm-text-muted); margin-top:2px;">${this.esc(n.subtitle)}</div>
                </div>
            </button>
        `).join('');
    },

    // --------------------------------------------------------------------------
    // 13. SidebarSection
    // --------------------------------------------------------------------------
    SidebarSection({ group, isCollapsed = false, isActiveGroup = false, currentNavId = '', badges = {}, iconFn }) {
        return `
            <div class="adm-nav-group ${isCollapsed ? 'is-collapsed' : ''} ${isActiveGroup ? 'is-active-group' : ''}" data-group="${this.esc(group.group)}">
                <button type="button" class="adm-nav-group-header" aria-expanded="${!isCollapsed}" onclick="AdminView.toggleNavGroup('${this.esc(group.group)}')">
                    <span>${this.esc(group.group)}</span>
                    <span class="adm-nav-group-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                </button>
                <div class="adm-nav-list-wrap">
                    <ul class="adm-nav-list">
                        ${group.items.map(it => {
                            const isActive = currentNavId === it.id;
                            const badgeCount = Number(badges[it.id] || 0);
                            return `
                                <li>
                                    <button type="button"
                                            class="adm-nav-item ${isActive ? 'active' : ''}"
                                            data-screen="${this.esc(it.id)}"
                                            title="${this.esc(it.label)}"
                                            ${isActive ? 'aria-current="page"' : ''}
                                            onclick="AdminView.navigate('${this.esc(it.id)}')">
                                        <span class="adm-nav-icon" aria-hidden="true">${iconFn(it.icon)}</span>
                                        <span class="adm-nav-label">${this.esc(it.label)}</span>
                                        ${badgeCount > 0 ? `<span class="adm-nav-badge alert" data-badge-screen="${this.esc(it.id)}">${badgeCount}</span>` : `<span class="adm-nav-badge alert" data-badge-screen="${this.esc(it.id)}" style="display:none;">0</span>`}
                                    </button>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 14. SidebarNavigation
    // --------------------------------------------------------------------------
    SidebarNavigation({ menuGroups, collapsedGroups = {}, currentNavId = 'dashboard', activeGroup = '', badges = {}, adminName = 'Administrador Geral', adminInitials = 'AD', iconFn }) {
        return `
            <aside class="adm-sidebar" aria-label="Menu Administrativo DNA AUTO">
                <div class="adm-sidebar-brand">
                    <div class="adm-brand-left">
                        <div class="adm-brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 120 120" width="24" height="24" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="9"/>
                                <path d="M 32 69 C 25 52 27 29 40 16 C 53 4 75 4 88 16 C 100 29 101 52 94 69" stroke-width="9"/>
                                <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="10"/>
                            </svg>
                        </div>
                        <div class="adm-brand-text">
                            <div class="adm-brand-title">DNA <span class="adm-brand-title-accent">AUTO</span></div>
                            <div class="adm-brand-sub">ENTERPRISE ADMIN</div>
                        </div>
                    </div>
                    <button type="button" class="adm-sidebar-collapse-btn" title="Recolher / Expandir Menu" aria-label="Recolher ou expandir menu lateral" onclick="AdminView.toggleSidebarCollapse()">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                </div>

                <nav class="adm-sidebar-scroll" id="adm-sidebar-nav" aria-label="Módulos do ERP">
                    ${menuGroups.map(g => this.SidebarSection({
                        group: g,
                        isCollapsed: Boolean(collapsedGroups[g.group]) && g.group !== activeGroup,
                        isActiveGroup: g.group === activeGroup,
                        currentNavId,
                        badges,
                        iconFn
                    })).join('')}
                </nav>

                <div class="adm-sidebar-footer">
                    <div class="adm-avatar" aria-hidden="true">${this.esc(adminInitials)}</div>
                    <div class="adm-sidebar-footer-text" style="min-width:0; flex:1;">
                        <div class="adm-sidebar-user-name">${this.esc(adminName)}</div>
                        <div class="adm-sidebar-user-role">Administrador • Matriz DNA</div>
                    </div>
                    <button type="button" class="adm-sidebar-logout-btn" title="Encerrar Sessão" aria-label="Encerrar sessão administrativa" onclick="App.logout()">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            </aside>
        `;
    },

    // --------------------------------------------------------------------------
    // 15. EnterpriseTopbar
    // --------------------------------------------------------------------------
    EnterpriseTopbar({ trail, title, globalPeriod = 'current_month', theme = 'light', adminName = 'Administrador Geral', adminInitials = 'AD', notifications = [] } = {}) {
        const firstName = String(adminName || 'Admin').split(' ')[0];
        return `
            <header class="adm-topbar">
                <div class="adm-topbar-left">
                    <button type="button" class="adm-icon-btn" id="adm-mobile-menu-btn" title="Alternar Menu" aria-label="Abrir ou recolher menu lateral" onclick="AdminView.handleMenuButtonClick()">
                        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    ${this.Breadcrumbs({ trail, title })}
                </div>

                <div class="adm-topbar-controls">
                    <div class="adm-global-search-wrap">
                        <span class="adm-global-search-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </span>
                        <input type="text" id="adm-global-search" class="adm-global-search-input" aria-label="Busca global" placeholder="Buscar oficina, rep, placa ou cliente..." oninput="AdminView.onGlobalSearchInput(this.value)" onfocus="AdminView.onGlobalSearchInput(this.value)" />
                        <div id="adm-search-dropdown" class="adm-search-dropdown" style="display:none;" role="listbox" aria-label="Resultados da busca global"></div>
                    </div>

                    <select id="adm-global-period" class="adm-select" aria-label="Filtro global de período" title="Período de referência" onchange="AdminView.onPeriodChange(this.value)">
                        <option value="current_month" ${globalPeriod === 'current_month' ? 'selected' : ''}>Mês Atual</option>
                        <option value="last_30_days" ${globalPeriod === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="last_90_days" ${globalPeriod === 'last_90_days' ? 'selected' : ''}>Últimos 90 dias</option>
                        <option value="current_year" ${globalPeriod === 'current_year' ? 'selected' : ''}>Ano Atual</option>
                        <option value="all" ${globalPeriod === 'all' ? 'selected' : ''}>Todo o Período</option>
                    </select>

                    <button type="button" class="adm-btn adm-btn-sm" id="adm-refresh-btn" title="Atualizar dados agora" onclick="AdminView.reloadCurrentScreen()">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        <span class="adm-btn-label-sm-hide">Atualizar</span>
                    </button>

                    <button type="button" class="adm-api-pill checking" id="adm-api-pill" title="Status real da API DNA AUTO — clique para detalhes de sincronização" onclick="AdminView.navigate('sync')">
                        <span class="adm-status-dot" aria-hidden="true"></span>
                        <span id="adm-api-pill-text">Verificando...</span>
                    </button>

                    ${this.NotificationCenter(notifications)}

                    ${this.ThemeSwitcher(theme)}

                    <div class="adm-popover-wrap" id="adm-profile-wrap">
                        <button type="button" class="adm-profile-trigger" aria-label="Menu do administrador" aria-expanded="false" onclick="AdminView.toggleProfilePopover(event)">
                            <span class="adm-profile-avatar-sm" aria-hidden="true">${this.esc(adminInitials)}</span>
                            <span class="adm-profile-name-hide">${this.esc(firstName)}</span>
                        </button>
                        <div class="adm-popover" id="adm-profile-popover" style="display:none; width:240px;">
                            <div class="adm-popover-head" style="flex-direction:column; align-items:flex-start; gap:2px;">
                                <span>${this.esc(adminName)}</span>
                                <span style="font-size:12px; font-weight:500; color:var(--adm-text-muted);">Administrador • DNA AUTO</span>
                            </div>
                            <div class="adm-popover-body">
                                <button type="button" class="adm-action-menu-item" onclick="AdminView.closeAllPopovers(); AdminView.navigate('users')">Usuários e Permissões</button>
                                <button type="button" class="adm-action-menu-item" onclick="AdminView.closeAllPopovers(); AdminView.navigate('settings')">Configurações do Sistema</button>
                                <button type="button" class="adm-action-menu-item" onclick="AdminView.closeAllPopovers(); AdminView.navigate('sync')">Status e Sincronização</button>
                                <button type="button" class="adm-action-menu-item is-danger" onclick="AdminView.closeAllPopovers(); App.logout()">Encerrar Sessão</button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    },

    // --------------------------------------------------------------------------
    // 16. AdminLayout
    // --------------------------------------------------------------------------
    AdminLayout({ sidebarCollapsed = false, theme = 'light', sidebarHtml = '', topbarHtml = '' } = {}) {
        return `
            <div id="adm-shell" class="adm-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}" data-adm-theme="${this.esc(theme)}">
                <div class="adm-drawer-backdrop" onclick="AdminView.toggleDrawer(false)"></div>
                ${sidebarHtml}
                <div class="adm-main">
                    ${topbarHtml}
                    <div id="adm-offline-banner" class="adm-offline-banner" style="display:none;" role="alert">
                        <div>
                            <strong>⚠ Desconexão da API DNA AUTO:</strong>
                            <span id="adm-offline-banner-msg">Não foi possível consultar os dados atualizados. Os indicadores não serão mascarados com cache antigo.</span>
                        </div>
                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger-solid" onclick="AdminView.reloadCurrentScreen()">Tentar Reconectar</button>
                    </div>
                    <main class="adm-content" id="adm-screen-body" tabindex="-1">
                        ${this.LoadingSkeleton('Carregando DNA AUTO Enterprise Admin...')}
                    </main>
                </div>
            </div>
            <div id="adm-modal-root"></div>
            <div id="adm-drawer-root"></div>
        `;
    },

    // --------------------------------------------------------------------------
    // 17. ConfirmationDialog
    // --------------------------------------------------------------------------
    ConfirmationDialog({
        title = 'Confirmar operação',
        message = '',
        detailsHtml = '',
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        tone = 'primary', // 'primary' | 'danger' | 'success'
        inputConfig = null // { id, label, placeholder, defaultValue, required, minLength, type: 'text'|'textarea' }
    } = {}) {
        const btnClass = tone === 'danger' ? 'adm-btn-danger-solid' : (tone === 'success' ? 'adm-btn-success' : 'adm-btn-primary');
        const boxClass = tone === 'danger' ? 'is-danger' : (tone === 'success' ? 'is-success' : '');
        const fieldHtml = inputConfig ? `
            <div class="adm-field" style="margin-top:14px;">
                <label for="${this.esc(inputConfig.id || 'adm-confirm-input')}">${this.esc(inputConfig.label || 'Justificativa')}${inputConfig.required ? ' *' : ''}</label>
                ${inputConfig.type === 'text'
                    ? `<input type="text" id="${this.esc(inputConfig.id || 'adm-confirm-input')}" class="adm-input" placeholder="${this.esc(inputConfig.placeholder || '')}" value="${this.esc(inputConfig.defaultValue || '')}" />`
                    : `<textarea id="${this.esc(inputConfig.id || 'adm-confirm-input')}" placeholder="${this.esc(inputConfig.placeholder || '')}">${this.esc(inputConfig.defaultValue || '')}</textarea>`}
            </div>
        ` : '';

        return `
            <div class="adm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" onclick="if(event.target===this) AdminView.closeModal()">
                <div class="adm-modal is-confirm">
                    <div class="adm-modal-head">
                        <h3 id="adm-modal-title">${this.esc(title)}</h3>
                        <button type="button" class="adm-icon-btn" style="width:32px; height:32px;" aria-label="Fechar janela" onclick="AdminView.closeModal()">✕</button>
                    </div>
                    <div class="adm-modal-body">
                        <div id="adm-modal-err" class="adm-chain-box is-danger" style="display:none; margin-bottom:12px;" role="alert"></div>
                        ${message ? `<div class="adm-chain-box ${boxClass}">${this.esc(message)}</div>` : ''}
                        ${detailsHtml}
                        ${fieldHtml}
                    </div>
                    <div class="adm-modal-foot">
                        <button type="button" class="adm-btn" onclick="AdminView.closeModal()">${this.esc(cancelLabel)}</button>
                        <button type="button" class="adm-btn ${btnClass}" id="adm-modal-confirm-btn" onclick="AdminView.submitModal()">${this.esc(confirmLabel)}</button>
                    </div>
                </div>
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 18. DetailDrawer
    // --------------------------------------------------------------------------
    DetailDrawer({ title = 'Detalhes', subtitle = '', bodyHtml = '', footerHtml = '' } = {}) {
        return `
            <div class="adm-detail-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby="adm-drawer-title" onclick="if(event.target===this) AdminView.closeDetailDrawer()">
                <div class="adm-detail-drawer">
                    <div class="adm-detail-drawer-head">
                        <div style="min-width:0;">
                            <h3 id="adm-drawer-title" style="margin:0; font-size:18px; font-weight:700; color:var(--adm-text-primary);">${this.esc(title)}</h3>
                            ${subtitle ? `<p style="margin:4px 0 0; font-size:13px; color:var(--adm-text-secondary);">${this.esc(subtitle)}</p>` : ''}
                        </div>
                        <button type="button" class="adm-icon-btn" style="width:34px; height:34px;" aria-label="Fechar painel lateral" onclick="AdminView.closeDetailDrawer()">✕</button>
                    </div>
                    <div class="adm-detail-drawer-body">${bodyHtml}</div>
                    ${footerHtml ? `<div class="adm-detail-drawer-foot">${footerHtml}</div>` : ''}
                </div>
            </div>
        `;
    }
};
