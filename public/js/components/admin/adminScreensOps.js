// ==============================================================================
// DNA AUTO — CENTRAL ADMINISTRATIVA V2: COMUNICAÇÃO, SUPORTE & SISTEMA
// Central WhatsApp, Alertas Preventivos, Chamados, Auditoria, Sync, Configs, Usuários
// ==============================================================================

const AdminScreensOps = {
    // --------------------------------------------------------------------------
    // 1. CENTRAL WHATSAPP
    // --------------------------------------------------------------------------
    async renderWhatsApp() {
        const data = await API.getAdminWhatsAppOverview();
        const s = data.summary || {};
        const sessions = data.sessions || [];
        const msgs = data.recent_messages || [];
        const camps = data.campaigns || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Central WhatsApp da Rede</h2>
                    <p>Sessões das oficinas credenciadas, fila de mensagens enviadas e campanhas automáticas do bot preventivo (10h/17h).</p>
                </div>
            </div>

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Sessões Conectadas</div><div class="adm-kpi-value">${s.connected_sessions || 0} / ${s.total_sessions || 0}</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Mensagens Enviadas</div><div class="adm-kpi-value">${s.messages?.sent || 0}</div><div class="adm-kpi-sub">Total: ${s.messages?.total || 0} • Falhas: ${s.messages?.failed || 0}</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Campanhas Bot Ativas</div><div class="adm-kpi-value">${s.active_bot_campaigns || 0}</div></div>
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Agendamentos Confirmados (Bot)</div><div class="adm-kpi-value">${s.confirmed_bot_appointments || 0}</div></div>
            </div>

            <div class="adm-charts-grid">
                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Sessões WhatsApp por Oficina (${sessions.length})</h3></div>
                    ${sessions.length === 0 ? `<div class="adm-empty"><strong>Nenhuma sessão configurada</strong>As oficinas ainda não parearam o WhatsApp oficial.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Oficina</th><th>Telefone</th><th>Status</th><th>Última Conexão</th></tr></thead>
                                <tbody>
                                    ${sessions.map(x => `
                                        <tr>
                                            <td><strong>${esc(x.workshop_name)}</strong><div style="font-size:11px; color:#64748b;">${esc(x.city || '-')}/${esc(x.state || '-')}</div></td>
                                            <td class="adm-mono">${esc(x.phone_number || '-')}</td>
                                            <td>${AdminView.statusBadge(x.status)}</td>
                                            <td class="adm-mono">${esc(AdminView.formatDateTime(x.last_connected_at || x.updated_at))}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <div class="adm-card">
                    <div class="adm-card-header"><h3 class="adm-card-title">Campanhas Bot Preventivo (${camps.length})</h3></div>
                    ${camps.length === 0 ? `<div class="adm-empty"><strong>Sem campanhas recentes</strong>O bot preventivo registra aqui os convites enviados às 10h.</div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Oficina</th><th>Placa / Item</th><th>Status</th><th>Enviado</th></tr></thead>
                                <tbody>
                                    ${camps.slice(0, 15).map(c => `
                                        <tr>
                                            <td>${esc(c.workshop_name || '-')}</td>
                                            <td><strong class="adm-mono">${esc(c.license_plate || '-')}</strong> • ${esc(c.service_item || c.maintenance_item || '-')}</td>
                                            <td>${AdminView.statusBadge(c.status)}</td>
                                            <td class="adm-mono">${esc(AdminView.formatDateTime(c.sent_at))}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Últimas Mensagens Registradas (${msgs.length})</h3></div>
                ${msgs.length === 0 ? `<div class="adm-empty"><strong>Sem mensagens</strong>Nenhuma mensagem WhatsApp registrada no histórico.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data</th><th>Oficina</th><th>Destino</th><th>Mensagem</th><th>Status</th></tr></thead>
                            <tbody>
                                ${msgs.slice(0, 25).map(m => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDateTime(m.sent_at || m.created_at))}</td>
                                        <td>${esc(m.workshop_name || 'Sistema')}</td>
                                        <td class="adm-mono">${esc(m.phone_number)}</td>
                                        <td style="max-width:360px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(m.message)}</td>
                                        <td>${AdminView.statusBadge(m.status)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 2. ALERTAS PREVENTIVOS
    // --------------------------------------------------------------------------
    async renderAlerts() {
        const data = await API.getMaintenanceAlerts();
        const alerts = data.alerts || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Alertas Preventivos da Frota (${alerts.length})</h2>
                    <p>Veículos com troca de óleo ou correia dentada próximos do vencimento conforme quilometragem registrada.</p>
                </div>
            </div>

            <div class="adm-card">
                ${alerts.length === 0 ? `<div class="adm-empty"><strong>Nenhum alerta preventivo pendente</strong>Toda a frota monitorada está com a manutenção em dia.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Urgência</th><th>Placa / Veículo</th><th>KM Atual</th><th>Serviço Recomendado</th><th>Proprietário</th><th>Oficina</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${alerts.map(a => `
                                    <tr>
                                        <td><span class="adm-badge ${a.urgency === 'CRITICAL' ? 'adm-badge-danger' : 'adm-badge-warning'}">${esc(a.urgency)}</span></td>
                                        <td><strong class="adm-mono">${esc(a.licensePlate)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(a.vehicleModel)}</div></td>
                                        <td class="adm-mono">${Number(a.currentMileage || 0).toLocaleString('pt-BR')} km</td>
                                        <td><strong>${esc(a.serviceType)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(a.reason)}</div></td>
                                        <td>${esc(a.ownerName)}<div class="adm-mono" style="font-size:11px; color:#64748b;">${esc(a.ownerPhone)}</div></td>
                                        <td>${esc(a.workshopName)}</td>
                                        <td>${a.whatsappUrl ? `<a class="adm-btn adm-btn-sm adm-btn-success" href="${esc(a.whatsappUrl)}" target="_blank" rel="noopener">WhatsApp</a>` : '<span style="color:#64748b;">Sem fone</span>'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 3. CHAMADOS DE SUPORTE
    // --------------------------------------------------------------------------
    async renderSupport(ctx) {
        const status = (ctx.params && ctx.params.status) || 'ALL';
        const data = await API.getAdminSupportTickets({ status });
        const tickets = data.tickets || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Chamados de Suporte (${tickets.length})</h2>
                    <p>Atendimento oficial integrado ao App Oficina com registro de resposta e auditoria.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <select class="adm-select" onchange="AdminView.updateParams({ status: this.value })">
                        <option value="ALL" ${status === 'ALL' ? 'selected' : ''}>Status: Todos</option>
                        <option value="OPEN" ${status === 'OPEN' ? 'selected' : ''}>Abertos</option>
                        <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>Em Atendimento</option>
                        <option value="RESOLVED" ${status === 'RESOLVED' ? 'selected' : ''}>Resolvidos</option>
                        <option value="CLOSED" ${status === 'CLOSED' ? 'selected' : ''}>Encerrados</option>
                    </select>
                </div>

                ${tickets.length === 0 ? `<div class="adm-empty"><strong>Nenhum chamado encontrado</strong>Não há chamados de suporte para o filtro selecionado.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Protocolo</th><th>Oficina</th><th>Assunto / Mensagem</th><th>Prioridade</th><th>Status</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${tickets.map(t => `
                                    <tr>
                                        <td class="adm-mono" style="color:#00d4ff; font-weight:700;">${esc(t.protocol || t.id)}<div style="font-size:10.5px; color:#64748b;">${esc(AdminView.formatDateTime(t.created_at))}</div></td>
                                        <td><strong>${esc(t.workshop_name || 'Não vinculada')}</strong><div style="font-size:11px; color:#64748b;">${esc(t.workshop_city || '-')}/${esc(t.workshop_state || '-')}</div></td>
                                        <td>
                                            <strong>${esc(t.subject)}</strong>
                                            <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">${esc(t.message || '')}</div>
                                            ${t.admin_reply ? `<div style="font-size:11px; color:#34d399; margin-top:4px;"><strong>Resposta:</strong> ${esc(t.admin_reply)}</div>` : ''}
                                        </td>
                                        <td>${AdminView.statusBadge(t.priority || 'NORMAL')}</td>
                                        <td>${AdminView.statusBadge(t.status)}</td>
                                        <td><button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminScreensOps.openTicketReplyModal('${esc(t.id)}', '${esc(t.protocol || t.id)}', '${esc(t.status)}', ${JSON.stringify(t.admin_reply || '').replace(/"/g, '&quot;')})">Responder</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    openTicketReplyModal(ticketId, protocol, currentStatus, currentReply) {
        const esc = AdminView.esc;
        AdminView.openModal({
            title: `Responder Chamado ${protocol}`,
            body: `
                <div class="adm-field">
                    <label>Status do Chamado</label>
                    <select id="tkt-status" class="adm-select" style="width:100%;">
                        <option value="OPEN" ${currentStatus === 'OPEN' ? 'selected' : ''}>OPEN (Aberto)</option>
                        <option value="IN_PROGRESS" ${currentStatus === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS (Em Atendimento)</option>
                        <option value="RESOLVED" ${currentStatus === 'RESOLVED' ? 'selected' : ''}>RESOLVED (Resolvido)</option>
                        <option value="CLOSED" ${currentStatus === 'CLOSED' ? 'selected' : ''}>CLOSED (Encerrado)</option>
                    </select>
                </div>
                <div class="adm-field">
                    <label>Resposta Oficial da Matriz DNA AUTO</label>
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
    // 4. AUDITORIA (GERAL + FINANCEIRA & COMISSÕES)
    // --------------------------------------------------------------------------
    async renderAudit(ctx) {
        const subtab = (ctx.params && ctx.params.subtab) || 'financial';
        const [finAudit, sysAudit] = await Promise.all([
            API.getAdminFinancialAudit({ limit: 80 }),
            API.getAuditLogs({ limit: 80 })
        ]);
        const esc = AdminView.esc;

        const repLogs = finAudit.representative_audit || [];
        const finSysLogs = finAudit.system_financial_audit || [];
        const allLogs = sysAudit.logs || [];

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Auditoria Operacional & Financeira</h2>
                    <p>Trilha completa e imutável de aprovações, vínculos comerciais, fechamentos de ciclo, pagamentos e alterações de sistema.</p>
                </div>
            </div>

            <div class="adm-subtabs">
                <button class="adm-subtab ${subtab === 'financial' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'financial' })">Auditoria Comercial & Comissões (${repLogs.length})</button>
                <button class="adm-subtab ${subtab === 'fin_system' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'fin_system' })">Auditoria Financeira Sistema (${finSysLogs.length})</button>
                <button class="adm-subtab ${subtab === 'general' ? 'active' : ''}" onclick="AdminView.updateParams({ subtab: 'general' })">Auditoria Geral da Rede (${allLogs.length})</button>
            </div>

            ${subtab === 'financial' ? `
                <div class="adm-card">
                    ${repLogs.length === 0 ? `<div class="adm-empty"><strong>Sem eventos comerciais auditados</strong></div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Data/Hora</th><th>Ação</th><th>Representante / Oficina</th><th>Ator</th><th>Justificativa</th></tr></thead>
                                <tbody>
                                    ${repLogs.map(l => `
                                        <tr>
                                            <td class="adm-mono">${esc(AdminView.formatDateTime(l.created_at))}</td>
                                            <td><span class="adm-badge adm-badge-cyan">${esc(l.action)}</span></td>
                                            <td>${l.rep_code ? `<span class="adm-mono" style="color:#00d4ff;">${esc(l.rep_code)}</span> ${esc(l.rep_name || '')}` : '-'} ${l.workshop_name ? `<div style="font-size:11px; color:#94a3b8;">Oficina: ${esc(l.workshop_name)}</div>` : ''}</td>
                                            <td class="adm-mono">${esc(l.actor_role || '')} (${esc(l.actor_id || '-')})</td>
                                            <td>${esc(l.justification || '-')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            ` : `
                <div class="adm-card">
                    ${(subtab === 'fin_system' ? finSysLogs : allLogs).length === 0 ? `<div class="adm-empty"><strong>Nenhum log encontrado</strong></div>` : `
                        <div class="adm-table-wrap">
                            <table class="adm-table">
                                <thead><tr><th>Data/Hora</th><th>Ação</th><th>Entidade</th><th>Usuário</th><th>IP</th><th>Detalhes</th></tr></thead>
                                <tbody>
                                    ${(subtab === 'fin_system' ? finSysLogs : allLogs).map(l => `
                                        <tr>
                                            <td class="adm-mono">${esc(AdminView.formatDateTime(l.created_at))}</td>
                                            <td><span class="adm-badge adm-badge-cyan">${esc(l.action)}</span></td>
                                            <td class="adm-mono">${esc(l.entity_type || '-')} • ${esc(l.entity_id || '-')}</td>
                                            <td>${esc(l.user_name || l.user_id || 'Sistema')}</td>
                                            <td class="adm-mono">${esc(l.ip_address || '-')}</td>
                                            <td style="font-size:11px; color:#94a3b8; max-width:340px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(l.data_after_json || l.vehicle_dna_code || '-')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `}
        `;
    },

    // --------------------------------------------------------------------------
    // 5. SINCRONIZAÇÃO DE DADOS (FASE 7)
    // --------------------------------------------------------------------------
    async renderSync() {
        const data = await API.getAdminSyncStatus();
        const dbInfo = data.database || {};
        const apps = Object.values(data.apps || {});
        const events = data.recent_events || [];
        const migrations = dbInfo.migrations || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Sincronização Multi-App em Tempo Real</h2>
                    <p>Fonte única de verdade: App Cliente, App Oficina, Portal Representante e Central Administrativa conectados à mesma API e banco SQLite.</p>
                </div>
                <button class="adm-btn adm-btn-sm adm-btn-primary" onclick="AdminView.reloadCurrentScreen()">↻ Forçar Sincronização</button>
            </div>

            ${dbInfo.persistent_storage_warning ? `
                <div class="adm-chain-box" style="border-color:rgba(239,68,68,0.5); background:rgba(239,68,68,0.1); color:#fecaca;">
                    <strong>⚠ Alerta de Infraestrutura (Render):</strong> ${esc(dbInfo.persistent_storage_warning)}
                </div>
            ` : ''}

            <div class="adm-kpi-grid">
                <div class="adm-kpi-card tone-success"><div class="adm-kpi-label">Estado da API / Banco</div><div class="adm-kpi-value">${esc(data.status || 'ONLINE')}</div><div class="adm-kpi-sub">${esc(dbInfo.engine || 'SQLite')} • Journal: ${esc(dbInfo.journal_mode || '-')}</div></div>
                <div class="adm-kpi-card tone-cyan"><div class="adm-kpi-label">Versão de Sincronização</div><div class="adm-kpi-value">#${data.sync_version || 0}</div><div class="adm-kpi-sub">Cache entries: ${data.cache_entries || 0}</div></div>
                <div class="adm-kpi-card tone-blue"><div class="adm-kpi-label">Conexões SSE Ativas</div><div class="adm-kpi-value">${data.active_sse_connections || 0}</div><div class="adm-kpi-sub">Canal: ${esc(AdminSync.connectionState)}</div></div>
                <div class="adm-kpi-card tone-gold"><div class="adm-kpi-label">Migrações Aplicadas</div><div class="adm-kpi-value">${migrations.length}</div><div class="adm-kpi-sub">FKs: ${dbInfo.foreign_keys ? 'Ativas' : 'Inativas'}</div></div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Status por Aplicativo da Plataforma</h3></div>
                <div class="adm-table-wrap">
                    <table class="adm-table">
                        <thead><tr><th>Aplicativo / Módulo</th><th>Registros Sincronizados</th><th>Última Atividade</th><th>Status</th></tr></thead>
                        <tbody>
                            ${apps.map(a => `
                                <tr>
                                    <td><strong>${esc(a.name)}</strong></td>
                                    <td class="adm-mono">${a.records_count || 0}</td>
                                    <td class="adm-mono">${esc(AdminView.formatDateTime(a.last_activity_at))}</td>
                                    <td><span class="adm-badge adm-badge-success">${esc(a.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Últimos Eventos de Sincronização (${events.length})</h3></div>
                ${events.length === 0 ? `<div class="adm-empty"><strong>Nenhum evento de sincronização registrado ainda</strong>Qualquer cadastro, pagamento ou alteração aparecerá aqui em tempo real.</div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Data/Hora</th><th>Origem</th><th>Evento</th><th>Entidade</th><th>Payload</th></tr></thead>
                            <tbody>
                                ${events.map(e => `
                                    <tr>
                                        <td class="adm-mono">${esc(AdminView.formatDateTime(e.created_at))}</td>
                                        <td><span class="adm-badge adm-badge-cyan">${esc(e.source_app)}</span></td>
                                        <td class="adm-mono" style="font-weight:700;">${esc(e.event_type)}</td>
                                        <td class="adm-mono">${esc(e.entity_type)} • ${esc(e.entity_id || '-')}</td>
                                        <td class="adm-mono" style="font-size:11px; color:#94a3b8; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(e.payload_json || '{}')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // --------------------------------------------------------------------------
    // 6. CONFIGURAÇÕES & POLÍTICAS COMERCIAIS VERSIONADAS (FASE 6)
    // --------------------------------------------------------------------------
    async renderSettings() {
        const data = await API.getAdminSettings();
        const settingsMap = Object.fromEntries((data.settings || []).map(s => [s.key, s.value]));
        const policies = data.policies || [];
        const integrations = data.integrations || [];
        const esc = AdminView.esc;
        const brl = AdminView.formatBrl;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Configurações & Políticas Comerciais Versionadas</h2>
                    <p>Configure regra de competência/pagamento, metas globais e políticas comerciais versionadas sem nunca recalcular histórico passado.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Regras Financeiras de Ciclo & Metas Globais</h3>
                        <p class="adm-card-subtitle">Configurações persistidas em banco com auditoria</p>
                    </div>
                </div>
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>Deslocamento de Pagamento (Meses após Competência — padrão 1 = mês seguinte)</label>
                        <input type="number" id="cfg-offset" class="adm-input" min="0" max="3" value="${esc(settingsMap.payout_cycle_offset_months || '1')}" />
                    </div>
                    <div class="adm-field">
                        <label>Dia Previsto de Pagamento no Mês (1 a 28)</label>
                        <input type="number" id="cfg-day" class="adm-input" min="1" max="28" value="${esc(settingsMap.payout_day_of_month || '10')}" />
                    </div>
                    <div class="adm-field">
                        <label>Meta Mensal Global de Oficinas</label>
                        <input type="number" id="cfg-goal-ws" class="adm-input" min="1" value="${esc(settingsMap.global_monthly_workshops_goal || '50')}" />
                    </div>
                    <div class="adm-field">
                        <label>Meta Mensal Global de Cadastros Pagos</label>
                        <input type="number" id="cfg-goal-act" class="adm-input" min="1" value="${esc(settingsMap.global_monthly_activations_goal || '500')}" />
                    </div>
                    <div class="adm-field">
                        <label>Meta Mensal Global de Faturamento (em centavos)</label>
                        <input type="number" id="cfg-goal-rev" class="adm-input" min="100" value="${esc(settingsMap.global_monthly_revenue_goal_cents || '2495000')}" />
                    </div>
                </div>
                <button class="adm-btn adm-btn-primary" onclick="AdminScreensOps.saveGlobalSettings()">Salvar Configurações</button>
            </div>

            <div class="adm-card">
                <div class="adm-card-header">
                    <div>
                        <h3 class="adm-card-title">Políticas Comerciais Versionadas (${policies.length})</h3>
                        <p class="adm-card-subtitle">Ativar a política R$ 59,90 (ou criar uma nova) aplica-se SOMENTE a futuras cobranças e comissões.</p>
                    </div>
                    <button class="adm-btn adm-btn-sm adm-btn-gold" onclick="AdminScreensOps.openNewPolicyModal()">+ Nova Política Comercial</button>
                </div>
                <div class="adm-table-wrap">
                    <table class="adm-table">
                        <thead><tr><th>Código / Título</th><th>Cadastro</th><th>Oficina / Plat.</th><th>Comissão Rep.</th><th>Taxa Retorno</th><th>Vigência</th><th>Status / Ação</th></tr></thead>
                        <tbody>
                            ${policies.map(p => `
                                <tr>
                                    <td><strong class="adm-mono">${esc(p.version_code)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(p.title)}</div></td>
                                    <td class="adm-mono" style="font-weight:700;">${brl(p.registration_price_cents)}</td>
                                    <td class="adm-mono">${brl(p.workshop_split_cents)} (${p.workshop_split_percent}%) / ${brl(p.platform_split_cents)}</td>
                                    <td class="adm-mono" style="color:#ffd21c; font-weight:700;">${brl(p.rep_commission_cents)}</td>
                                    <td class="adm-mono">${brl(p.attendance_fee_cents)}</td>
                                    <td class="adm-mono">${p.referral_validity_months}m</td>
                                    <td>
                                        ${p.is_active
                                            ? '<span class="adm-badge adm-badge-success">ATIVA</span>'
                                            : `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensOps.activatePolicy('${esc(p.id)}', '${esc(p.version_code)}')">Ativar para Futuras</button>`}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-card-header"><h3 class="adm-card-title">Integrações Externas (${integrations.length})</h3></div>
                ${integrations.length === 0 ? `<div class="adm-empty"><strong>Sem integrações listadas</strong></div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Serviço</th><th>Status</th><th>Mensagem</th><th>Última Sincronização</th></tr></thead>
                            <tbody>
                                ${integrations.map(i => `
                                    <tr>
                                        <td><strong>${esc(i.service_name)}</strong> <span class="adm-mono" style="color:#64748b;">(${esc(i.service_code)})</span></td>
                                        <td>${i.is_connected ? '<span class="adm-badge adm-badge-success">CONECTADA</span>' : '<span class="adm-badge adm-badge-muted">DESCONECTADA</span>'}</td>
                                        <td style="font-size:11.5px; color:#94a3b8;">${esc(i.status_message || '-')}</td>
                                        <td class="adm-mono">${esc(AdminView.formatDateTime(i.last_sync_at))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
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
            alert(`❌ Erro ao salvar: ${err.message}`);
        }
    },

    async activatePolicy(policyId, versionCode) {
        if (!confirm(`Deseja ativar a política ${versionCode} para TODAS as novas operações futuras? Transações históricas permanecerão intactas.`)) return;
        try {
            await API.activateAdminCommercialPolicy(policyId);
            AdminView.toast(`Política ${versionCode} ativada com sucesso.`);
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
    },

    openNewPolicyModal() {
        AdminView.openModal({
            title: 'Criar Nova Política Comercial Versionada',
            body: `
                <div class="adm-form-grid">
                    <div class="adm-field"><label>Código da Versão *</label><input id="pol-code" class="adm-input" placeholder="Ex: POLICY_2027_V3" /></div>
                    <div class="adm-field"><label>Título *</label><input id="pol-title" class="adm-input" placeholder="Ex: Tabela Comercial 2027" /></div>
                    <div class="adm-field"><label>Preço Cadastro (centavos) *</label><input type="number" id="pol-price" class="adm-input" value="5990" /></div>
                    <div class="adm-field"><label>Repasse Oficina (%)</label><input type="number" id="pol-split" class="adm-input" value="50" min="0" max="100" /></div>
                    <div class="adm-field"><label>Comissão Representante (centavos)</label><input type="number" id="pol-rep" class="adm-input" value="590" /></div>
                    <div class="adm-field"><label>Taxa por Atendimento (centavos)</label><input type="number" id="pol-fee" class="adm-input" value="690" /></div>
                </div>
                <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#cbd5e1; margin-top:8px;">
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
        const users = data.users || [];
        const roles = data.roles || [];
        const esc = AdminView.esc;

        return `
            <div class="adm-section-head">
                <div>
                    <h2>Usuários e Permissões (RBAC) — ${users.length} usuário(s)</h2>
                    <p>Gestão de contas e perfis de acesso da plataforma. Nenhuma senha ou hash é exposto pela API.</p>
                </div>
            </div>

            <div class="adm-card">
                <div class="adm-filters-bar">
                    <input type="text" id="usr-q" class="adm-input" style="min-width:220px;" placeholder="Buscar nome ou e-mail..." value="${esc(f.q || '')}"
                           onkeydown="if(event.key==='Enter') AdminScreensOps.applyUserFilters()" />
                    <select id="usr-role" class="adm-select" onchange="AdminScreensOps.applyUserFilters()">
                        <option value="ALL">Perfil: Todos</option>
                        ${roles.map(r => `<option value="${esc(r.code)}" ${f.role === r.code ? 'selected' : ''}>${esc(r.code)} — ${esc(r.name)}</option>`).join('')}
                    </select>
                    <select id="usr-status" class="adm-select" onchange="AdminScreensOps.applyUserFilters()">
                        <option value="ALL">Status: Todos</option>
                        <option value="ACTIVE" ${f.status === 'ACTIVE' ? 'selected' : ''}>Ativos</option>
                        <option value="SUSPENDED" ${f.status === 'SUSPENDED' ? 'selected' : ''}>Suspensos</option>
                        <option value="INACTIVE" ${f.status === 'INACTIVE' ? 'selected' : ''}>Inativos</option>
                    </select>
                    <button class="adm-btn adm-btn-sm" onclick="AdminScreensOps.applyUserFilters()">Filtrar</button>
                </div>

                ${users.length === 0 ? `<div class="adm-empty"><strong>Nenhum usuário encontrado</strong></div>` : `
                    <div class="adm-table-wrap">
                        <table class="adm-table">
                            <thead><tr><th>Nome / E-mail</th><th>Perfil RBAC</th><th>Vínculo</th><th>Status</th><th>Criado em</th><th>Ação</th></tr></thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td><strong>${esc(u.name)}</strong><div style="font-size:11px; color:#94a3b8;">${esc(u.email)}</div></td>
                                        <td><span class="adm-badge ${u.role_code === 'ADMIN' ? 'adm-badge-warning' : 'adm-badge-cyan'}">${esc(u.role_code)}</span></td>
                                        <td>${esc(u.workshop_name || '-')}</td>
                                        <td>${AdminView.statusBadge(u.status)}</td>
                                        <td class="adm-mono">${esc(AdminView.formatDate(u.created_at))}</td>
                                        <td>
                                            ${u.status === 'ACTIVE'
                                                ? `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="AdminScreensOps.toggleUserStatus('${esc(u.id)}', 'SUSPENDED')">Suspender</button>`
                                                : `<button class="adm-btn adm-btn-sm adm-btn-success" onclick="AdminScreensOps.toggleUserStatus('${esc(u.id)}', 'ACTIVE')">Ativar</button>`}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
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

    async toggleUserStatus(userId, nextStatus) {
        if (!confirm(`Confirmar alteração do status do usuário para ${nextStatus}?`)) return;
        try {
            await API.updateAdminUserStatus(userId, nextStatus);
            AdminView.toast(`Usuário atualizado para ${nextStatus}.`);
            await AdminView.reloadCurrentScreen();
        } catch (err) {
            alert(`❌ Erro: ${err.message}`);
        }
    }
};
