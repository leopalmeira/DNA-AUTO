// ==============================================================================
// DNA AUTO — CENTRAL ADMINISTRATIVA INTEGRADA V2 (ORQUESTRADOR PRINCIPAL)
// Fases 2, 3, 4, 5, 6, 7 — Sidebar Fixa/Recolhível/Drawer + 26 Telas + SSE Sync
// ==============================================================================

const AdminView = {
    currentScreen: 'dashboard',
    currentParams: {},
    globalPeriod: 'current_month',
    globalMonth: '',
    sidebarCollapsed: false,
    drawerOpen: false,
    isMounted: false,
    searchDebounce: null,
    syncRefreshDebounce: null,
    modalConfirmHandler: null,
    lastApiState: { state: 'CONNECTING', lastSyncAt: null, errorMessage: null },

    // Organização EXATA do Menu Lateral (Fase 2 — 6 grupos, 26 itens)
    MENU_GROUPS: [
        {
            group: 'VISÃO GERAL',
            items: [
                { id: 'dashboard', label: 'Dashboard Geral', icon: 'grid' },
                { id: 'operations', label: 'Operação da Rede', icon: 'activity' },
                { id: 'goals', label: 'Indicadores e Metas', icon: 'target' }
            ]
        },
        {
            group: 'REDE DNA AUTO',
            items: [
                { id: 'workshops', label: 'Oficinas Credenciadas', icon: 'wrench' },
                { id: 'clients', label: 'Clientes Cadastrados', icon: 'users' },
                { id: 'vehicles', label: 'Veículos e DNA', icon: 'car' },
                { id: 'service-orders', label: 'Ordens de Serviço', icon: 'file' },
                { id: 'maintenance-history', label: 'Histórico de Manutenção', icon: 'clock' }
            ]
        },
        {
            group: 'GESTÃO COMERCIAL',
            items: [
                { id: 'representatives', label: 'Representantes Comerciais', icon: 'briefcase' },
                { id: 'portfolios', label: 'Carteiras de Oficinas', icon: 'layers' },
                { id: 'acquisition', label: 'Captação de Clientes', icon: 'trending' },
                { id: 'ranking', label: 'Ranking de Representantes', icon: 'award' },
                { id: 'commercial-goals', label: 'Metas Comerciais', icon: 'sliders' }
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
            group: 'SISTEMA',
            items: [
                { id: 'audit', label: 'Auditoria', icon: 'shield' },
                { id: 'sync', label: 'Sincronização de Dados', icon: 'refresh' },
                { id: 'settings', label: 'Configurações', icon: 'settings' },
                { id: 'users', label: 'Usuários e Permissões', icon: 'lock' }
            ]
        }
    ],

    // Ícones SVG limpos sem dependência externa
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
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.grid}</svg>`;
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

    statusBadge(status) {
        const st = String(status || '').toUpperCase();
        const map = {
            ACTIVE: ['adm-badge-success', 'Ativo'],
            APPROVED: ['adm-badge-success', 'Aprovada'],
            CONFIRMED: ['adm-badge-success', 'Confirmada'],
            PAID: ['adm-badge-cyan', 'Pago'],
            COMPLETED: ['adm-badge-success', 'Concluído'],
            RESOLVED: ['adm-badge-success', 'Resolvido'],
            CONNECTED: ['adm-badge-success', 'Conectado'],
            SENT: ['adm-badge-success', 'Enviada'],
            DELIVERED: ['adm-badge-success', 'Entregue'],
            DELIVERED_IN_PLATFORM: ['adm-badge-success', 'Entregue'],
            PENDING: ['adm-badge-warning', 'Pendente'],
            PENDING_APPROVAL: ['adm-badge-warning', 'Aguardando Aprovação'],
            PROJECTED: ['adm-badge-muted', 'Projetada'],
            SCHEDULED: ['adm-badge-warning', 'Agendado'],
            OPEN: ['adm-badge-warning', 'Aberto'],
            OPEN_FORECAST: ['adm-badge-cyan', 'Previsão Aberta'],
            IN_PROGRESS: ['adm-badge-cyan', 'Em Atendimento'],
            RECOMENDADA: ['adm-badge-warning', 'Recomendada'],
            APROXIMANDO: ['adm-badge-cyan', 'Aproximando'],
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
            NORMAL: ['adm-badge-cyan', 'Normal']
        };
        const [cls, label] = map[st] || ['adm-badge-muted', st || '-'];
        return `<span class="adm-badge ${cls}">${this.esc(label)}</span>`;
    },

    proofBadge(level) {
        const l = Number(level || 0);
        if (l === 4) return '<span class="adm-badge adm-badge-success">Nível 4 • Comprovado</span>';
        if (l === 3) return '<span class="adm-badge adm-badge-cyan">Nível 3 • Confirmado</span>';
        if (l === 2) return '<span class="adm-badge adm-badge-warning">Nível 2 • Nota Anexada</span>';
        return '<span class="adm-badge adm-badge-muted">Nível 1 • Declarado</span>';
    },

    renderPagination(page, totalPages, total) {
        const p = Number(page || 1);
        const tp = Math.max(1, Number(totalPages || 1));
        return `
            <div class="adm-pagination">
                <span>Exibindo página <strong>${p}</strong> de <strong>${tp}</strong> (${this.formatNum(total)} registro(s))</span>
                <div style="display:flex; gap:6px;">
                    <button class="adm-btn adm-btn-sm" ${p <= 1 ? 'disabled' : ''} onclick="AdminView.updateParams({ page: ${Math.max(1, p - 1)} })">← Anterior</button>
                    <button class="adm-btn adm-btn-sm" ${p >= tp ? 'disabled' : ''} onclick="AdminView.updateParams({ page: ${Math.min(tp, p + 1)} })">Próxima →</button>
                </div>
            </div>
        `;
    },

    toast(message) {
        let el = document.getElementById('adm-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'adm-toast';
            el.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:200; background:#0c1c36; border:1px solid rgba(0,212,255,0.45); color:#fff; padding:10px 16px; border-radius:10px; font-size:12.5px; box-shadow:0 10px 28px rgba(0,0,0,0.6);';
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.style.display = 'block';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3600);
    },

    // --------------------------------------------------------------------------
    // CICLO DE VIDA & RENDERIZAÇÃO DO SHELL (FASE 2)
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

        if (initialTab) {
            this.currentScreen = this.resolveLegacyScreen(initialTab);
            this.currentParams = {};
        }

        const adminName = (typeof App !== 'undefined' && App.currentUser && App.currentUser.name) || 'Administrador Geral';
        const adminInitials = adminName.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'AD';

        container.innerHTML = `
            <div id="adm-shell" class="adm-shell ${this.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
                <div class="adm-drawer-backdrop" onclick="AdminView.toggleDrawer(false)"></div>

                <!-- SIDEBAR FIXA / RECOLHÍVEL / DRAWER MOBILE -->
                <aside class="adm-sidebar" aria-label="Menu Administrativo DNA AUTO">
                    <div class="adm-sidebar-brand">
                        <div class="adm-brand-left">
                            <div class="adm-brand-mark">
                                <svg viewBox="0 0 120 120" width="22" height="22" fill="none" stroke="#FFD21C" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" stroke-width="9"/>
                                    <path d="M 32 69 C 25 52 27 29 40 16 C 53 4 75 4 88 16 C 100 29 101 52 94 69" stroke-width="9"/>
                                    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" stroke-width="10"/>
                                </svg>
                            </div>
                            <div class="adm-brand-text">
                                <div class="adm-brand-title">DNA <span style="color:#ffd21c;">AUTO</span></div>
                                <div class="adm-brand-sub">Central Admin V2</div>
                            </div>
                        </div>
                        <button class="adm-icon-btn" title="Recolher / Expandir Menu" onclick="AdminView.toggleSidebarCollapse()" style="width:28px; height:28px;">⇄</button>
                    </div>

                    <div class="adm-sidebar-scroll" id="adm-sidebar-nav">
                        ${this.MENU_GROUPS.map(g => `
                            <div class="adm-nav-group">
                                <div class="adm-nav-group-label">${this.esc(g.group)}</div>
                                <ul class="adm-nav-list">
                                    ${g.items.map(it => `
                                        <li class="adm-nav-item ${this.currentScreen === it.id ? 'active' : ''}" data-screen="${it.id}" title="${this.esc(it.label)}" onclick="AdminView.navigate('${it.id}')">
                                            <span class="adm-nav-icon">${this.iconSvg(it.icon)}</span>
                                            <span class="adm-nav-label">${this.esc(it.label)}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>

                    <div class="adm-sidebar-footer">
                        <div class="adm-avatar">${this.esc(adminInitials)}</div>
                        <div class="adm-sidebar-footer-text" style="min-width:0; flex:1;">
                            <div style="font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.esc(adminName)}</div>
                            <div style="font-size:10.5px; color:#34d399; font-weight:700;">PERFIL ADMIN</div>
                        </div>
                        <button class="adm-icon-btn" title="Encerrar Sessão" onclick="App.logout()" style="width:30px; height:30px;">⏻</button>
                    </div>
                </aside>

                <!-- ÁREA PRINCIPAL (TOPBAR + BANNER OFFLINE + CONTEÚDO) -->
                <div class="adm-main">
                    <header class="adm-topbar">
                        <div class="adm-topbar-left">
                            <button class="adm-icon-btn" id="adm-mobile-menu-btn" title="Abrir Menu" onclick="AdminView.toggleDrawer()">☰</button>
                            <div class="adm-breadcrumb">
                                <div class="adm-breadcrumb-trail" id="adm-breadcrumb-trail">CENTRAL DNA AUTO › VISÃO GERAL</div>
                                <div class="adm-breadcrumb-title" id="adm-breadcrumb-title">Dashboard Geral</div>
                            </div>
                        </div>

                        <div class="adm-topbar-controls">
                            <div class="adm-global-search-wrap">
                                <span class="adm-global-search-icon">🔍</span>
                                <input type="text" id="adm-global-search" class="adm-global-search-input" placeholder="Busca global (rep, oficina, placa, cliente)..." oninput="AdminView.onGlobalSearchInput(this.value)" onfocus="AdminView.onGlobalSearchInput(this.value)" />
                                <div id="adm-search-dropdown" class="adm-search-dropdown" style="display:none;"></div>
                            </div>

                            <select id="adm-global-period" class="adm-select" title="Filtro Global de Período" onchange="AdminView.onPeriodChange(this.value)">
                                <option value="current_month" ${this.globalPeriod === 'current_month' ? 'selected' : ''}>Mês Atual</option>
                                <option value="last_30_days" ${this.globalPeriod === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                                <option value="last_90_days" ${this.globalPeriod === 'last_90_days' ? 'selected' : ''}>Últimos 90 dias</option>
                                <option value="current_year" ${this.globalPeriod === 'current_year' ? 'selected' : ''}>Ano Atual</option>
                                <option value="all" ${this.globalPeriod === 'all' ? 'selected' : ''}>Todo o Período</option>
                            </select>

                            <button class="adm-btn adm-btn-sm" id="adm-refresh-btn" title="Atualizar dados agora" onclick="AdminView.reloadCurrentScreen()">↻ Atualizar</button>

                            <div class="adm-api-pill" id="adm-api-pill" title="Status de disponibilidade da API e sincronização em tempo real" onclick="AdminView.navigate('sync')" style="cursor:pointer;">
                                <span class="adm-status-dot"></span>
                                <span id="adm-api-pill-text">API Online</span>
                            </div>
                        </div>
                    </header>

                    <div id="adm-offline-banner" class="adm-offline-banner" style="display:none;">
                        <div>
                            <strong>⚠ Desconexão da API DNA AUTO:</strong>
                            <span id="adm-offline-banner-msg">Não foi possível consultar os dados atualizados. Os indicadores não serão mascarados com cache antigo.</span>
                        </div>
                        <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminView.reloadCurrentScreen()">Tentar Reconectar</button>
                    </div>

                    <main class="adm-content" id="adm-screen-body">
                        <div class="adm-empty"><strong>Carregando Central Administrativa...</strong>Conectando à API oficial DNA AUTO.</div>
                    </main>
                </div>
            </div>

            <div id="adm-modal-root"></div>
        `;

        this.isMounted = true;
        this.bindGlobalEvents();

        if (typeof AdminSync !== 'undefined') {
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
        if (typeof AdminSync !== 'undefined') {
            AdminSync.stop();
        }
        clearTimeout(this.searchDebounce);
        clearTimeout(this.syncRefreshDebounce);
    },

    bindGlobalEvents() {
        if (this._clickBound) return;
        this._clickBound = true;
        document.addEventListener('click', (e) => {
            const wrap = document.querySelector('.adm-global-search-wrap');
            const dd = document.getElementById('adm-search-dropdown');
            if (dd && wrap && !wrap.contains(e.target)) {
                dd.style.display = 'none';
            }
        });
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
        if (ev) ev.stopPropagation();
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

    openWorkshop(id) {
        this.navigate('workshop-detail', { id });
    },

    onPeriodChange(period) {
        this.globalPeriod = period;
        this.loadScreen();
    },

    reloadCurrentScreen() {
        return this.loadScreen();
    },

    // --------------------------------------------------------------------------
    // SINCRONIZAÇÃO EM TEMPO REAL & STATUS DE DISPONIBILIDADE (FASE 7)
    // --------------------------------------------------------------------------
    updateApiStatusUi(st) {
        this.lastApiState = st;
        const pill = document.getElementById('adm-api-pill');
        const txt = document.getElementById('adm-api-pill-text');
        const banner = document.getElementById('adm-offline-banner');
        const bannerMsg = document.getElementById('adm-offline-banner-msg');
        if (!pill || !txt) return;

        pill.classList.remove('degraded', 'offline');
        if (st.state === 'ONLINE') {
            const hhmm = st.lastSyncAt ? new Date(st.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            txt.textContent = hhmm ? `API Online • ${hhmm}` : 'API Online';
            if (banner) banner.style.display = 'none';
        } else if (st.state === 'RECONNECTING') {
            pill.classList.add('degraded');
            txt.textContent = 'Reconectando...';
            if (banner) {
                banner.style.display = 'flex';
                if (bannerMsg) bannerMsg.textContent = st.errorMessage || 'Conexão em tempo real instável. Tentando restabelecer...';
            }
        } else if (st.state === 'OFFLINE') {
            pill.classList.add('offline');
            txt.textContent = 'API Indisponível';
            if (banner) {
                banner.style.display = 'flex';
                if (bannerMsg) bannerMsg.textContent = st.errorMessage || 'API indisponível no momento. Dados não sincronizados.';
            }
        }
    },

    onRealtimeSyncEvent() {
        if (!this.isMounted) return;
        // Evita re-render se houver modal aberto digitando dados
        const modalOpen = document.querySelector('#adm-modal-root .adm-modal-overlay');
        if (modalOpen) return;
        clearTimeout(this.syncRefreshDebounce);
        this.syncRefreshDebounce = setTimeout(() => {
            if (this.isMounted && !document.querySelector('#adm-modal-root .adm-modal-overlay')) {
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
            return { group: 'REDE DNA AUTO', label: 'Desempenho da Oficina', navId: 'workshops' };
        }
        for (const g of this.MENU_GROUPS) {
            for (const it of g.items) {
                if (it.id === screenId) {
                    return { group: g.group, label: it.label, navId: it.id };
                }
            }
        }
        return { group: 'VISÃO GERAL', label: 'Dashboard Geral', navId: 'dashboard' };
    },

    updateNavHighlight() {
        const meta = this.getScreenMeta(this.currentScreen);
        const trail = document.getElementById('adm-breadcrumb-trail');
        const title = document.getElementById('adm-breadcrumb-title');
        if (trail) trail.textContent = `CENTRAL DNA AUTO › ${meta.group}`;
        if (title) title.textContent = meta.label;

        document.querySelectorAll('#adm-sidebar-nav .adm-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.screen === meta.navId);
        });
    },

    async loadScreen({ silent = false } = {}) {
        const body = document.getElementById('adm-screen-body');
        if (!body) return;

        this.updateNavHighlight();
        const reqToken = typeof AdminSync !== 'undefined' ? AdminSync.nextRequestToken() : Date.now();
        const refreshBtn = document.getElementById('adm-refresh-btn');
        if (refreshBtn && !silent) refreshBtn.disabled = true;
        if (!silent) {
            body.innerHTML = `<div class="adm-empty"><strong>Carregando ${this.esc(this.getScreenMeta(this.currentScreen).label)}...</strong>Consultando dados reais na API DNA AUTO.</div>`;
        }

        const ctx = {
            period: this.globalPeriod,
            month: this.globalMonth,
            params: this.currentParams
        };

        try {
            let html = '';
            switch (this.currentScreen) {
                // VISÃO GERAL
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
                // SISTEMA
                case 'audit': html = await AdminScreensOps.renderAudit(ctx); break;
                case 'sync': html = await AdminScreensOps.renderSync(ctx); break;
                case 'settings': html = await AdminScreensOps.renderSettings(ctx); break;
                case 'users': html = await AdminScreensOps.renderUsers(ctx); break;
                default: html = await AdminScreensCore.renderDashboard(ctx);
            }

            // Proteção anti-race-condition: ignora respostas antigas se usuário já navegou
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
                    <div class="adm-empty" style="border-color:rgba(239,68,68,0.45);">
                        <strong>Sessão administrativa expirada ou sem permissão (${err.status})</strong>
                        <p style="margin:6px 0 14px;">${this.esc(err.message)}</p>
                        <button class="adm-btn adm-btn-gold" onclick="App.logout(); App.switchView('login-admin');">Autenticar Novamente</button>
                    </div>
                `;
                return;
            }
            if (typeof AdminSync !== 'undefined') AdminSync.markRequestFailure(err);
            // Nunca exibir cache antigo como atualizado quando a API falhar!
            body.innerHTML = `
                <div class="adm-empty" style="border-color:rgba(239,68,68,0.45); background:rgba(239,68,68,0.08);">
                    <strong>⚠ Falha ao consultar dados atualizados da API</strong>
                    <p style="margin:6px 0 14px; color:#fecaca;">${this.esc((err && err.message) || 'API temporariamente indisponível.')}</p>
                    <button class="adm-btn adm-btn-primary" onclick="AdminView.reloadCurrentScreen()">↻ Tentar Novamente</button>
                </div>
            `;
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
                        <div class="adm-search-item" onclick="AdminView.selectSearchResult('rep', '${this.esc(r.id)}')">
                            <span><strong class="adm-mono" style="color:#00d4ff;">${this.esc(r.rep_code)}</strong> ${this.esc(r.name)}</span>
                            <span style="font-size:11px; color:#94a3b8;">${this.esc(r.city || '')}/${this.esc(r.state || '')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.workshops || []).length) {
                    sections.push(`<div class="adm-search-group-title">Oficinas</div>` + res.workshops.map(w => `
                        <div class="adm-search-item" onclick="AdminView.selectSearchResult('ws', '${this.esc(w.id)}')">
                            <span><strong>${this.esc(w.trade_name)}</strong></span>
                            <span style="font-size:11px; color:#94a3b8;">${this.esc(w.city || '')}/${this.esc(w.state || '')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.vehicles || []).length) {
                    sections.push(`<div class="adm-search-group-title">Veículos & DNA</div>` + res.vehicles.map(v => `
                        <div class="adm-search-item" onclick="AdminView.selectSearchResult('veh', '${this.esc(v.license_plate)}')">
                            <span><strong class="adm-mono">${this.esc(v.license_plate)}</strong> ${this.esc(v.brand || '')} ${this.esc(v.model || '')}</span>
                            <span class="adm-mono" style="font-size:11px; color:#34d399;">${this.esc(v.dna_code || 'Sem DNA')}</span>
                        </div>
                    `).join(''));
                }
                if ((res.clients || []).length) {
                    sections.push(`<div class="adm-search-group-title">Clientes</div>` + res.clients.map(c => `
                        <div class="adm-search-item" onclick="AdminView.selectSearchResult('client', '${this.esc(c.name)}')">
                            <span>${this.esc(c.name)}</span>
                            <span style="font-size:11px; color:#94a3b8;">${this.esc(c.email || c.phone || '')}</span>
                        </div>
                    `).join(''));
                }
                dd.innerHTML = sections.length ? sections.join('') : `<div style="padding:12px; font-size:12px; color:#94a3b8; text-align:center;">Nenhum resultado para "${this.esc(q)}".</div>`;
                dd.style.display = 'block';
            } catch (_) {
                dd.style.display = 'none';
            }
        }, 250);
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
    // AÇÕES COMPARTILHADAS & MODAL ADMIN V2
    // --------------------------------------------------------------------------
    async changeWorkshopStatus(workshopId, status) {
        if (!confirm(`Confirmar alteração do status da oficina para ${status}?`)) return;
        try {
            await API.setWorkshopStatus(workshopId, status);
            this.toast(`Oficina atualizada para ${status}.`);
            await this.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
    },

    openModal({ title, body, confirmLabel = 'Confirmar', onConfirm }) {
        const root = document.getElementById('adm-modal-root');
        if (!root) return;
        this.modalConfirmHandler = onConfirm;
        root.innerHTML = `
            <div class="adm-modal-overlay" onclick="if(event.target===this) AdminView.closeModal()">
                <div class="adm-modal">
                    <div class="adm-modal-head">
                        <h3 style="margin:0; font-size:15px; color:#fff;">${this.esc(title)}</h3>
                        <button class="adm-icon-btn" style="width:28px; height:28px;" onclick="AdminView.closeModal()">✕</button>
                    </div>
                    <div class="adm-modal-body">
                        <div id="adm-modal-err" style="display:none; margin-bottom:10px; padding:8px 12px; border-radius:8px; background:rgba(239,68,68,0.16); border:1px solid rgba(239,68,68,0.4); color:#fecaca; font-size:12px;"></div>
                        ${body}
                    </div>
                    <div class="adm-modal-foot">
                        <button class="adm-btn" onclick="AdminView.closeModal()">Cancelar</button>
                        <button class="adm-btn adm-btn-primary" id="adm-modal-confirm-btn" onclick="AdminView.submitModal()">${this.esc(confirmLabel)}</button>
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
    }
};
