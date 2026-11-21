// ==============================================================================
// DNA AUTO | ENTERPRISE MANAGEMENT V3 — COMUNICAÇÃO, SUPORTE & GOVERNANÇA
// Central WhatsApp, Alertas Preventivos, Chamados, Auditoria, Sync, Configs, RBAC
// ==============================================================================

const AdminScreensOps = {
    // --------------------------------------------------------------------------
    // 1. CENTRAL WHATSAPP
    // --------------------------------------------------------------------------
    async renderWhatsApp() {
        const data = await API.getAdminWhatsAppOverview();
        const UI = AdminView.ui();
        const s = data.summary || {};
        const sessions = data.sessions || [];
        const msgs = data.recent_messages || [];
        const camps = data.campaigns || [];
        const esc = AdminView.esc;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Central WhatsApp da Rede',
                subtitle: 'Sessões das oficinas credenciadas, fila de mensagens enviadas e campanhas automáticas do bot preventivo.'
            })}

            <div class="adm-kpi-grid">
                ${UI.KPIStatCard({ label: 'Sessões Conectadas', value: `${num(s.connected_sessions)} / ${num(s.total_sessions)}`, tone: 'tone-success' })}
                ${UI.KPIStatCard({ label: 'Mensagens Enviadas', value: num(s.messages?.sent), sub: `Total: ${num(s.messages?.total)} • Falhas: ${num(s.messages?.failed)}`, tone: 'tone-cyan' })}
                ${UI.KPIStatCard({ label: 'Campanhas Bot Ativas', value: num(s.active_bot_campaigns), tone: 'tone-gold' })}
                ${UI.KPIStatCard({ label: 'Agendamentos Confirmados (Bot)', value: num(s.confirmed_bot_appointments), tone: 'tone-blue' })}
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Sessões WhatsApp por Oficina (${sessions.length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: sessions,
                        emptyTitle: 'Nenhuma sessão configurada',
                        emptySubtitle: 'As oficinas ainda não parearam o WhatsApp oficial.',
                        columns: [
                            { key: 'workshop_name', label: 'Oficina', render: x => `<span class="adm-cell-title">${esc(x.workshop_name)}</span><div class="adm-cell-sub">${esc(x.city || '-')}/${esc(x.state || '-')}</div>` },
                            { key: 'phone_number', label: 'Telefone', tdClass: 'adm-mono', render: x => esc(x.phone_number || '-') },
                            { key: 'status', label: 'Status', render: x => AdminView.statusBadge(x.status) },
                            { key: 'last_connected_at', label: 'Última Conexão', tdClass: 'adm-mono', render: x => esc(AdminView.formatDateTime(x.last_connected_at || x.updated_at)) }
                        ]
                    })}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Campanhas Bot Preventivo (${camps.length})</h3></div>
                    ${UI.EnterpriseDataTable({
                        rows: camps.slice(0, 15),
                        emptyTitle: 'Sem campanhas recentes',
                        emptySubtitle: 'O bot preventivo registra aqui os convites enviados automaticamente.',
                        columns: [
                            { key: 'workshop_name', label: 'Oficina', render: c => esc(c.workshop_name || '-') },
                            { key: 'license_plate', label: 'Placa / Item', render: c => `<strong class="adm-mono">${esc(c.license_plate || '-')}</strong> • ${esc(c.service_item || c.maintenance_item || '-')}` },
                            { key: 'status', label: 'Status', render: c => AdminView.statusBadge(c.status) },
                            { key: 'sent_at', label: 'Enviado', tdClass: 'adm-mono', render: c => esc(AdminView.formatDateTime(c.sent_at)) }
                        ]
                    })}
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Últimas Mensagens Registradas (${msgs.length})</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: msgs.slice(0, 25),
                    emptyTitle: 'Sem mensagens registradas',
                    emptySubtitle: 'Nenhuma mensagem WhatsApp registrada no histórico.',
                    columns: [
                        { key: 'sent_at', label: 'Data / Hora', tdClass: 'adm-mono', render: m => esc(AdminView.formatDateTime(m.sent_at || m.created_at)) },
                        { key: 'workshop_name', label: 'Oficina', render: m => esc(m.workshop_name || 'Sistema') },
                        { key: 'phone_number', label: 'Destino', tdClass: 'adm-mono', render: m => esc(m.phone_number) },
                        { key: 'message', label: 'Mensagem', render: m => `<div class="adm-truncate" title="${esc(m.message)}">${esc(m.message)}</div>` },
                        { key: 'status', label: 'Status', render: m => AdminView.statusBadge(m.status) }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. ALERTAS PREVENTIVOS
    // --------------------------------------------------------------------------
    async renderAlerts() {
        const data = await API.getMaintenanceAlerts();
        const UI = AdminView.ui();
        const alerts = data.alerts || [];
        const esc = AdminView.esc;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: `Alertas Preventivos da Frota (${num(alerts.length)})`,
                subtitle: 'Veículos com itens de manutenção próximos do vencimento conforme quilometragem registrada.'
            })}

            <div class="adm-card">
                ${UI.EnterpriseDataTable({
                    rows: alerts,
                    emptyTitle: 'Nenhum alerta preventivo pendente',
                    emptySubtitle: 'Toda a frota monitorada está com a manutenção em dia.',
                    columns: [
                        { key: 'urgency', label: 'Urgência', render: a => AdminView.statusBadge(a.urgency === 'CRITICAL' ? 'CRITICAL' : 'WARNING', a.urgency) },
                        { key: 'licensePlate', label: 'Placa / Veículo', render: a => `<strong class="adm-mono">${esc(a.licensePlate)}</strong><div class="adm-cell-sub">${esc(a.vehicleModel)}</div>` },
                        { key: 'currentMileage', label: 'KM Atual', align: 'right', tdClass: 'adm-mono', render: a => `${num(a.currentMileage)} km` },
                        { key: 'serviceType', label: 'Serviço Recomendado', render: a => `<span class="adm-cell-title">${esc(a.serviceType)}</span><div class="adm-cell-sub">${esc(a.reason)}</div>` },
                        { key: 'ownerName', label: 'Proprietário', render: a => `<div>${esc(a.ownerName)}</div><div class="adm-cell-sub adm-mono">${esc(a.ownerPhone)}</div>` },
                        { key: 'workshopName', label: 'Oficina', render: a => esc(a.workshopName) },
                        {
                            key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: a => a.whatsappUrl
                                ? `<a class="adm-btn adm-btn-sm adm-btn-success" href="${esc(a.whatsappUrl)}" target="_blank" rel="noopener">WhatsApp</a>`
                                : '<span class="adm-text-muted">Sem fone</span>'
                        }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 3. CHAMADOS DE SUPORTE
    // --------------------------------------------------------------------------
    async renderSupport(ctx) {
        const status = (ctx.params && ctx.params.status) || 'ALL';
        const data = await API.getAdminSupportTickets({ status });
        const UI = AdminView.ui();
        const tickets = data.tickets || [];
        const esc = AdminView.esc;

        return `
            ${UI.PageHeader({
                title: `Chamados de Suporte (${tickets.length})`,
                subtitle: 'Atendimento oficial integrado ao App Oficina com registro de resposta e trilha de auditoria.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <select class="adm-select" aria-label="Filtrar status do chamado" onchange="AdminView.updateParams({ status: this.value })">
                        <option value="ALL" ${status === 'ALL' ? 'selected' : ''}>Status: Todos</option>
                        <option value="OPEN" ${status === 'OPEN' ? 'selected' : ''}>Abertos</option>
                        <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>Em Atendimento</option>
                        <option value="RESOLVED" ${status === 'RESOLVED' ? 'selected' : ''}>Resolvidos</option>
                        <option value="CLOSED" ${status === 'CLOSED' ? 'selected' : ''}>Encerrados</option>
                    </select>
                    ${status !== 'ALL' ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('support')">Limpar Filtro</button>` : ''}
                `)}

                ${UI.EnterpriseDataTable({
                    rows: tickets,
                    emptyTitle: 'Nenhum chamado encontrado',
                    emptySubtitle: 'Não há chamados de suporte para o filtro selecionado.',
                    columns: [
                        { key: 'protocol', label: 'Protocolo', tdClass: 'adm-mono', render: t => `<strong class="adm-text-accent">${esc(t.protocol || t.id)}</strong><div class="adm-cell-sub">${esc(AdminView.formatDateTime(t.created_at))}</div>` },
                        { key: 'workshop_name', label: 'Oficina', render: t => `<span class="adm-cell-title">${esc(t.workshop_name || 'Não vinculada')}</span><div class="adm-cell-sub">${esc(t.workshop_city || '-')}/${esc(t.workshop_state || '-')}</div>` },
                        {
                            key: 'subject', label: 'Assunto / Mensagem',
                            render: t => `
                                <span class="adm-cell-title">${esc(t.subject)}</span>
                                <div class="adm-cell-sub">${esc(t.message || '')}</div>
                                ${t.admin_reply ? `<div class="adm-cell-sub adm-text-success" style="margin-top:4px;"><strong>Resposta:</strong> ${esc(t.admin_reply)}</div>` : ''}
                            `
                        },
                        { key: 'priority', label: 'Prioridade', render: t => AdminView.statusBadge(t.priority || 'NORMAL') },
                        { key: 'status', label: 'Status', render: t => AdminView.statusBadge(t.status) },
                        {
                            key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: t => `<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensOps.openTicketReplyModal('${esc(t.id)}', '${esc(t.protocol || t.id)}', '${esc(t.status)}', ${JSON.stringify(t.admin_reply || '').replace(/"/g, '&quot;')})">Responder</button>`
                        }
                    ]
                })}
            </div>
        `;
    },

    openTicketReplyModal(ticketId, protocol, currentStatus, currentReply) {
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Responder Chamado ${protocol}`,
            body: `
                <div class="adm-field">
                    <label for="tkt-status">Status do Chamado</label>
                    <select id="tkt-status" class="adm-select" style="width:100%;">
                        <option value="OPEN" ${currentStatus === 'OPEN' ? 'selected' : ''}>OPEN (Aberto)</option>
                        <option value="IN_PROGRESS" ${currentStatus === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS (Em Atendimento)</option>
                        <option value="RESOLVED" ${currentStatus === 'RESOLVED' ? 'selected' : ''}>RESOLVED (Resolvido)</option>
                        <option value="CLOSED" ${currentStatus === 'CLOSED' ? 'selected' : ''}>CLOSED (Encerrado)</option>
                    </select>
                </div>
                <div class="adm-field">
                    <label for="tkt-reply">Resposta Oficial da Matriz DNA AUTO</label>
                    <textarea id="tkt-reply" placeholder="Digite a orientação ou solução para a oficina...">${esc(currentReply || '')}</textarea>
                </div>
            `,
            confirmLabel: 'Salvar Resposta',
            onConfirm: async () => {
                await API.replyAdminSupportTicket(ticketId, {
                    status: document.getElementById('tkt-status')?.value || 'IN_PROGRESS',
                    admin_reply: (document.getElementById('tkt-reply')?.value || '').trim()
                });
                AdminView.toast('Chamado atualizado com sucesso.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 4. AUDITORIA (COMERCIAL, FINANCEIRA E GERAL)
    // --------------------------------------------------------------------------
    async renderAudit(ctx) {
        const subtab = (ctx.params && ctx.params.subtab) || 'financial';
        const [finAudit, sysAudit] = await Promise.all([
            API.getAdminFinancialAudit({ limit: 80 }),
            API.getAuditLogs({ limit: 80 })
        ]);
        const UI = AdminView.ui();
        const esc = AdminView.esc;

        const repLogs = finAudit.representative_audit || [];
        const finSysLogs = finAudit.system_financial_audit || [];
        const allLogs = sysAudit.logs || [];

        return `
            ${UI.PageHeader({
                title: 'Auditoria Operacional & Financeira',
                subtitle: 'Trilha completa e imutável de aprovações, vínculos comerciais, fechamentos de ciclo, liquidações e governança.'
            })}

            <div class="adm-subtabs" role="tablist" aria-label="Categorias de auditoria">
                <button type="button" role="tab" aria-selected="${subtab === 'financial'}" class="adm-subtab ${subtab === 'financial' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'financial' })">Auditoria Comercial & Comissões (${repLogs.length})</button>
                <button type="button" role="tab" aria-selected="${subtab === 'fin_system'}" class="adm-subtab ${subtab === 'fin_system' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'fin_system' })">Auditoria Financeira Sistema (${finSysLogs.length})</button>
                <button type="button" role="tab" aria-selected="${subtab === 'general'}" class="adm-subtab ${subtab === 'general' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'general' })">Auditoria Geral da Rede (${allLogs.length})</button>
            </div>

            <div class="adm-card">
                ${subtab === 'financial'
                    ? UI.EnterpriseDataTable({
                        rows: repLogs,
                        emptyTitle: 'Sem eventos comerciais auditados',
                        columns: [
                            { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: l => esc(AdminView.formatDateTime(l.created_at)) },
                            { key: 'action', label: 'Ação', render: l => `<span class="adm-badge adm-badge-info">${esc(l.action)}</span>` },
                            { key: 'rep_code', label: 'Representante / Oficina', render: l => `${l.rep_code ? `<span class="adm-mono adm-text-accent" style="font-weight:700;">${esc(l.rep_code)}</span> ${esc(l.rep_name || '')}` : '-'}${l.workshop_name ? `<div class="adm-cell-sub">Oficina: ${esc(l.workshop_name)}</div>` : ''}` },
                            { key: 'actor_id', label: 'Ator', tdClass: 'adm-mono', render: l => `${esc(l.actor_role || '')} (${esc(l.actor_id || '-')})` },
                            { key: 'justification', label: 'Justificativa', render: l => esc(l.justification || '-') }
                        ]
                    })
                    : UI.EnterpriseDataTable({
                        rows: subtab === 'fin_system' ? finSysLogs : allLogs,
                        emptyTitle: 'Nenhum log encontrado',
                        columns: [
                            { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: l => esc(AdminView.formatDateTime(l.created_at)) },
                            { key: 'action', label: 'Ação', render: l => `<span class="adm-badge adm-badge-info">${esc(l.action)}</span>` },
                            { key: 'entity_type', label: 'Entidade', tdClass: 'adm-mono', render: l => `${esc(l.entity_type || '-')} • ${esc(l.entity_id || '-')}` },
                            { key: 'user_name', label: 'Usuário', render: l => esc(l.user_name || l.user_id || 'Sistema') },
                            { key: 'ip_address', label: 'IP', tdClass: 'adm-mono', render: l => esc(l.ip_address || '-') },
                            { key: 'details', label: 'Detalhes', render: l => `<div class="adm-truncate adm-mono" style="font-size:12px;" title="${esc(l.data_after_json || l.vehicle_dna_code || '-')}">${esc(l.data_after_json || l.vehicle_dna_code || '-')}</div>` }
                        ]
                    })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 5. SINCRONIZAÇÃO DE DADOS
    // --------------------------------------------------------------------------
    async renderSync() {
        const data = await API.getAdminSyncStatus();
        const UI = AdminView.ui();
        const dbInfo = data.database || {};
        const apps = Object.values(data.apps || {});
        const events = data.recent_events || [];
        const migrations = dbInfo.migrations || [];
        const esc = AdminView.esc;
        const num = AdminView.formatNum;

        return `
            ${UI.PageHeader({
                title: 'Sincronização Multi-App em Tempo Real',
                subtitle: 'Fonte única de verdade: App Cliente, App Oficina, Portal Representante e Painel Administrativo conectados à mesma API e banco.',
                actionsHtml: `<button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.reloadCurrentScreen()">↻ Forçar Sincronização</button>`
            })}

            ${dbInfo.persistent_storage_warning ? `
                <div class="adm-alert-banner is-danger" role="alert">
                    <div><strong>⚠ Alerta de Infraestrutura (Render):</strong> ${esc(dbInfo.persistent_storage_warning)}</div>
                </div>
            ` : ''}

            <div class="adm-kpi-grid">
                ${UI.KPIStatCard({ label: 'Estado da API / Banco', value: String(data.status || 'ONLINE'), sub: `${dbInfo.engine || 'SQLite'} • Journal: ${dbInfo.journal_mode || '-'}`, tone: 'tone-success' })}
                ${UI.KPIStatCard({ label: 'Versão de Sincronização', value: `#${data.sync_version || 0}`, sub: `Cache entries: ${data.cache_entries || 0}`, tone: 'tone-cyan' })}
                ${UI.KPIStatCard({ label: 'Conexões SSE Ativas', value: num(data.active_sse_connections), sub: `Canal atual: ${typeof AdminSync !== 'undefined' ? AdminSync.connectionState : 'ONLINE'}`, tone: 'tone-blue' })}
                ${UI.KPIStatCard({ label: 'Migrações Aplicadas', value: num(migrations.length), sub: `Integridade FKs: ${dbInfo.foreign_keys ? 'Ativas' : 'Inativas'}`, tone: 'tone-gold' })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Status por Aplicativo da Plataforma</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: apps,
                    emptyTitle: 'Sem módulos reportados',
                    columns: [
                        { key: 'name', label: 'Aplicativo / Módulo', render: a => `<span class="adm-cell-title">${esc(a.name)}</span>` },
                        { key: 'records_count', label: 'Registros Sincronizados', align: 'right', tdClass: 'adm-num', render: a => num(a.records_count) },
                        { key: 'last_activity_at', label: 'Última Atividade', tdClass: 'adm-mono', render: a => esc(AdminView.formatDateTime(a.last_activity_at)) },
                        { key: 'status', label: 'Status', render: a => AdminView.statusBadge(a.status) }
                    ]
                })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Últimos Eventos de Sincronização (${events.length})</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: events,
                    emptyTitle: 'Nenhum evento de sincronização registrado ainda',
                    emptySubtitle: 'Qualquer cadastro, pagamento ou alteração aparecerá aqui em tempo real.',
                    columns: [
                        { key: 'created_at', label: 'Data / Hora', tdClass: 'adm-mono', render: e => esc(AdminView.formatDateTime(e.created_at)) },
                        { key: 'source_app', label: 'Origem', render: e => `<span class="adm-badge adm-badge-info">${esc(e.source_app)}</span>` },
                        { key: 'event_type', label: 'Evento', tdClass: 'adm-mono', render: e => `<strong>${esc(e.event_type)}</strong>` },
                        { key: 'entity_type', label: 'Entidade', tdClass: 'adm-mono', render: e => `${esc(e.entity_type)} • ${esc(e.entity_id || '-')}` },
                        { key: 'payload_json', label: 'Payload', render: e => `<div class="adm-truncate adm-mono" style="font-size:12px;" title="${esc(e.payload_json || '{}')}">${esc(e.payload_json || '{}')}</div>` }
                    ]
                })}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. CONFIGURAÇÕES & POLÍTICAS COMERCIAIS VERSIONADAS
    // --------------------------------------------------------------------------
    async renderSettings() {
        const data = await API.getAdminSettings();
        const UI = AdminView.ui();
        const settingsMap = Object.fromEntries((data.settings || []).map(s => [s.key, s.value]));
        const policies = data.policies || [];
        const integrations = data.integrations || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            ${UI.PageHeader({
                title: 'Configurações & Políticas Comerciais',
                subtitle: 'Configure regras de ciclo financeiro, metas globais e políticas comerciais versionadas preservando 100% do histórico.'
            })}

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Regras Financeiras de Ciclo & Metas Globais</h3>
                        <p class="adm-card-subtitle">Configurações persistidas em banco de dados com registro em auditoria</p>
                    </div>
                </div>
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label for="cfg-offset">Deslocamento de Pagamento (Meses após Competência — padrão 1)</label>
                        <input type="number" id="cfg-offset" class="adm-input" min="0" max="3" value="${esc(settingsMap.payout_cycle_offset_months || '1')}" />
                    </div>
                    <div class="adm-field">
                        <label for="cfg-day">Dia Previsto de Pagamento no Mês (1 a 28)</label>
                        <input type="number" id="cfg-day" class="adm-input" min="1" max="28" value="${esc(settingsMap.payout_day_of_month || '10')}" />
                    </div>
                    <div class="adm-field">
                        <label for="cfg-goal-ws">Meta Mensal Global de Oficinas</label>
                        <input type="number" id="cfg-goal-ws" class="adm-input" min="1" value="${esc(settingsMap.global_monthly_workshops_goal || '50')}" />
                    </div>
                    <div class="adm-field">
                        <label for="cfg-goal-act">Meta Mensal Global de Cadastros Pagos</label>
                        <input type="number" id="cfg-goal-act" class="adm-input" min="1" value="${esc(settingsMap.global_monthly_activations_goal || '500')}" />
                    </div>
                    <div class="adm-field">
                        <label for="cfg-goal-rev">Meta Mensal Global de Faturamento (em centavos)</label>
                        <input type="number" id="cfg-goal-rev" class="adm-input" min="100" value="${esc(settingsMap.global_monthly_revenue_goal_cents || '2495000')}" />
                    </div>
                </div>
                <div style="margin-top:8px;">
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensOps.saveGlobalSettings()">Salvar Configurações</button>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Políticas Comerciais Versionadas (${policies.length})</h3>
                        <p class="adm-card-subtitle">Ativar uma política aplica-se somente às novas cobranças e comissões futuras.</p>
                    </div>
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensOps.openNewPolicyModal()">+ Nova Política Comercial</button>
                </div>
                ${UI.EnterpriseDataTable({
                    rows: policies,
                    emptyTitle: 'Nenhuma política cadastrada',
                    columns: [
                        { key: 'version_code', label: 'Código / Título', render: p => `<strong class="adm-mono">${esc(p.version_code)}</strong><div class="adm-cell-sub">${esc(p.title)}</div>` },
                        { key: 'registration_price_cents', label: 'Cadastro', align: 'right', tdClass: 'adm-money', render: p => brl(p.registration_price_cents) },
                        { key: 'workshop_split_cents', label: 'Oficina / Plat.', align: 'right', tdClass: 'adm-mono', render: p => `${brl(p.workshop_split_cents)} (${p.workshop_split_percent}%) / ${brl(p.platform_split_cents)}` },
                        { key: 'rep_commission_cents', label: 'Comissão Rep.', align: 'right', tdClass: 'adm-money adm-text-accent', render: p => brl(p.rep_commission_cents) },
                        { key: 'attendance_fee_cents', label: 'Taxa Retorno', align: 'right', tdClass: 'adm-money', render: p => brl(p.attendance_fee_cents) },
                        { key: 'referral_validity_months', label: 'Vigência', align: 'right', tdClass: 'adm-mono', render: p => `${p.referral_validity_months}m` },
                        {
                            key: 'status', label: 'Status / Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: p => p.is_active
                                ? AdminView.statusBadge('ACTIVE', 'Ativa')
                                : `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensOps.activatePolicy('${esc(p.id)}', '${esc(p.version_code)}')">Ativar para Futuras</button>`
                        }
                    ]
                })}
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Integrações Externas (${integrations.length})</h3></div>
                ${UI.EnterpriseDataTable({
                    rows: integrations,
                    emptyTitle: 'Sem integrações listadas',
                    columns: [
                        { key: 'service_name', label: 'Serviço', render: i => `<strong>${esc(i.service_name)}</strong> <span class="adm-mono adm-text-muted">(${esc(i.service_code)})</span>` },
                        { key: 'is_connected', label: 'Status', render: i => i.is_connected ? AdminView.statusBadge('CONNECTED', 'Conectada') : AdminView.statusBadge('INACTIVE', 'Desconectada') },
                        { key: 'status_message', label: 'Mensagem', render: i => `<span class="adm-text-secondary">${esc(i.status_message || '-')}</span>` },
                        { key: 'last_sync_at', label: 'Última Sincronização', tdClass: 'adm-mono', render: i => esc(AdminView.formatDateTime(i.last_sync_at)) }
                    ]
                })}
            </div>
        `;
    },

    async saveGlobalSettings() {
        try {
            await API.saveAdminSettings({
                payout_cycle_offset_months: document.getElementById('cfg-offset')?.value,
                payout_day_of_month: document.getElementById('cfg-day')?.value,
                global_monthly_workshops_goal: document.getElementById('cfg-goal-ws')?.value,
                global_monthly_activations_goal: document.getElementById('cfg-goal-act')?.value,
                global_monthly_revenue_goal_cents: document.getElementById('cfg-goal-rev')?.value
            });
            AdminView.toast('Configurações salvas e auditadas com sucesso.');
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            AdminView.toast(`Erro ao salvar: ${err.message}`, 'error');
        }
    },

    activatePolicy(policyId, versionCode) {
        AdminView.openConfirmDialog({
            title: `Ativar Política Comercial — ${versionCode}`,
            message: `Deseja ativar a política ${versionCode} para TODAS as novas operações futuras? Transações históricas e lotes fechados permanecerão 100% intactos.`,
            confirmLabel: `Ativar ${versionCode}`,
            tone: 'success',
            onConfirm: async () => {
                await API.activateAdminCommercialPolicy(policyId);
                AdminView.toast(`Política ${versionCode} ativada com sucesso.`);
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    openNewPolicyModal() {
        AdminView.openModal({
            title: 'Criar Nova Política Comercial Versionada',
            body: `
                <div class="adm-form-grid">
                    <div class="adm-field"><label for="pol-code">Código da Versão *</label><input id="pol-code" class="adm-input" placeholder="Ex: POLICY_2027_V3" /></div>
                    <div class="adm-field"><label for="pol-title">Título *</label><input id="pol-title" class="adm-input" placeholder="Ex: Tabela Comercial 2027" /></div>
                    <div class="adm-field"><label for="pol-price">Preço Cadastro (centavos) *</label><input type="number" id="pol-price" class="adm-input" value="5990" /></div>
                    <div class="adm-field"><label for="pol-split">Repasse Oficina (%)</label><input type="number" id="pol-split" class="adm-input" value="50" min="0" max="100" /></div>
                    <div class="adm-field"><label for="pol-rep">Comissão Representante (centavos)</label><input type="number" id="pol-rep" class="adm-input" value="590" /></div>
                    <div class="adm-field"><label for="pol-fee">Taxa por Atendimento (centavos)</label><input type="number" id="pol-fee" class="adm-input" value="690" /></div>
                </div>
                <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--adm-text-primary); margin-top:8px; cursor:pointer;">
                    <input type="checkbox" id="pol-activate" /> Ativar imediatamente para novas cobranças (não altera histórico)
                </label>
            `,
            confirmLabel: 'Criar Política',
            onConfirm: async () => {
                await API.createAdminCommercialPolicy({
                    version_code: document.getElementById('pol-code')?.value,
                    title: document.getElementById('pol-title')?.value,
                    registration_price_cents: Number(document.getElementById('pol-price')?.value),
                    workshop_split_percent: Number(document.getElementById('pol-split')?.value),
                    rep_commission_cents: Number(document.getElementById('pol-rep')?.value),
                    attendance_fee_cents: Number(document.getElementById('pol-fee')?.value),
                    activate_now: Boolean(document.getElementById('pol-activate')?.checked)
                });
                AdminView.toast('Política comercial criada com sucesso.');
                await AdminView.reloadCurrentScreen();
            }
        });
    },

    // --------------------------------------------------------------------------
    // 7. USUÁRIOS E PERMISSÕES (RBAC)
    // --------------------------------------------------------------------------
    async renderUsers(ctx) {
        const f = ctx.params || {};
        const data = await API.getAdminUsers({
            role: f.role || 'ALL',
            status: f.status || 'ALL',
            q: f.q || ''
        });
        const UI = AdminView.ui();
        const users = data.users || [];
        const roles = data.roles || [];
        const esc = AdminView.esc;

        return `
            ${UI.PageHeader({
                title: `Usuários e Permissões (${users.length})`,
                subtitle: 'Gestão de contas e perfis RBAC da plataforma. Nenhuma senha, hash ou credencial sensível é exposta.'
            })}

            <div class="adm-card">
                ${UI.FilterToolbar(`
                    <input type="text" id="usr-q" class="adm-input adm-filter-search" aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensOps.applyUserFilters()" />
                    <select id="usr-role" class="adm-select" aria-label="Filtrar perfil RBAC" onchange="AdminScreensOps.applyUserFilters()">
                        <option value="ALL">Perfil: Todos</option>
                        ${roles.map(r => `<option value="${esc(r.code)}" ${f.role === r.code ? 'selected' : ''}>${esc(r.code)} — ${esc(r.name)}</option>`).join('')}
                    </select>
                    <select id="usr-status" class="adm-select" aria-label="Filtrar status" onchange="AdminScreensOps.applyUserFilters()">
                        <option value="ALL">Status: Todos</option>
                        <option value="ACTIVE" ${f.status === 'ACTIVE' ? 'selected' : ''}>Ativos</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensos</option>
                        <option value="INACTIVE" ${f.status === 'INACTIVE' ? 'selected' : ''}>Inativos</option>
                    </select>
                    <button type="button" class="adm-btn adm-btn-primary" onclick="AdminScreensOps.applyUserFilters()">Aplicar Filtros</button>
                    ${(f.q || (f.role && f.role !== 'ALL') || (f.status && f.status !== 'ALL')) ? `<button type="button" class="adm-btn" onclick="AdminView.navigate('users')">Limpar</button>` : ''}
                `)}

                ${UI.EnterpriseDataTable({
                    rows: users,
                    emptyTitle: 'Nenhum usuário encontrado',
                    columns: [
                        { key: 'name', label: 'Nome / E-mail', render: u => `<span class="adm-cell-title">${esc(u.name)}</span><div class="adm-cell-sub">${esc(u.email)}</div>` },
                        { key: 'role_code', label: 'Perfil RBAC', render: u => `<span class="adm-badge ${u.role_code === 'ADMIN' ? 'adm-badge-warning' : 'adm-badge-info'}"><span class="adm-badge-dot" aria-hidden="true"></span>${esc(u.role_code)}</span>` },
                        { key: 'workshop_name', label: 'Vínculo', render: u => esc(u.workshop_name || '-') },
                        { key: 'status', label: 'Status', render: u => AdminView.statusBadge(u.status) },
                        { key: 'created_at', label: 'Criado em', tdClass: 'adm-mono', render: u => esc(AdminView.formatDate(u.created_at)) },
                        {
                            key: 'action', label: 'Ação', align: 'right', tdClass: 'adm-actions-cell',
                            render: u => u.status === 'ACTIVE'
                                ? `<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensOps.toggleUserStatus('${esc(u.id)}', 'SUSPENDED', '${esc(u.name)}')">Suspender</button>`
                                : `<button type="button" class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensOps.toggleUserStatus('${esc(u.id)}', 'ACTIVE', '${esc(u.name)}')">Ativar</button>`
                        }
                    ]
                })}
            </div>
        `;
    },

    applyUserFilters() {
        AdminView.updateParams({
            q: document.getElementById('usr-q')?.value || '',
            role: document.getElementById('usr-role')?.value || 'ALL',
            status: document.getElementById('usr-status')?.value || 'ALL'
        });
    },

    toggleUserStatus(userId, nextStatus, userName = '') {
        const isSuspend = nextStatus === 'SUSPENDED';
        AdminView.openConfirmDialog({
            title: `${isSuspend ? 'Suspender' : 'Ativar'} Usuário${userName ? ` — ${userName}` : ''}`,
            message: isSuspend
                ? 'O usuário perderá imediatamente o acesso autenticado à plataforma até que sua conta seja reativada.'
                : 'A conta voltará a ter acesso conforme o perfil RBAC atribuído.',
            confirmLabel: isSuspend ? 'Confirmar Suspensão' : 'Confirmar Ativação',
            tone: isSuspend ? 'danger' : 'success',
            onConfirm: async () => {
                await API.updateAdminUserStatus(userId, nextStatus);
                AdminView.toast(`Usuário atualizado para ${isSuspend ? 'Suspenso' : 'Ativo'}.`);
                await AdminView.reloadCurrentScreen();
            }
        });
    }
};
