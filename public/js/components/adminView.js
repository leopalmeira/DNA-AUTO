// ==============================================================================
// DNA AUTO — PAINEL ADMINISTRATIVO GERAL (MATRIZ & GOVERNANÇA)
// Concentração: Oficinas, Clientes por Oficina, Faturamento da Plataforma e Alertas WhatsApp
// ==============================================================================

const AdminView = {
    currentWorkshopClients: null,

    async render() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--text-muted);">
                <div class="pulse-dot" style="margin:0 auto 16px;"></div>
                Carregando Painel Administrativo da Rede DNA AUTO...
            </div>
        `;

        try {
            const [statsData, rankingData, plansData, alertsData] = await Promise.all([
                API.getNetworkStats(),
                API.getWorkshopRanking(),
                API.getPricingPlans(),
                API.getMaintenanceAlerts().catch(() => ({ totalAlerts: 0, alerts: [] }))
            ]);

            const net = statsData.network;
            const alerts = alertsData.alerts || [];

            container.innerHTML = `
                <!-- Cabeçalho Administrativo -->
                <div class="view-header">
                    <div class="view-header-title">
                        <h2>Painel Administrativo da Rede DNA AUTO</h2>
                        <p>Gestão centralizada de oficinas, carteira de clientes, faturamento da plataforma e alertas preventivos.</p>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn btn-cyan" onclick="DossierView.render('DNA-BR-8F72-29A4-X91')">
                            🔎 Dossiê 360° (Civic Demo)
                        </button>
                    </div>
                </div>

                <!-- KPIs Principais Focados em Negócio & Faturamento -->
                <div class="grid-kpi" style="margin-bottom:24px;">
                    <!-- 1. Quantidade de Oficinas -->
                    <div class="kpi-card accent-primary" style="border-left: 4px solid var(--brand-cyan);">
                        <div class="kpi-header">
                            <span class="kpi-title">Oficinas Credenciadas</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.totalWorkshops}</div>
                        <div class="kpi-footer">
                            <span style="color:#10b981; font-weight:600;">${net.activeWorkshops} Homologadas</span> • ${net.pendingWorkshops} Pendentes
                        </div>
                    </div>

                    <!-- 2. Clientes na Rede -->
                    <div class="kpi-card accent-warning" style="border-left: 4px solid #f59e0b;">
                        <div class="kpi-header">
                            <span class="kpi-title">Clientes Atendidos</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.totalClients || 3}</div>
                        <div class="kpi-footer">Proprietários com histórico ativo na rede</div>
                    </div>

                    <!-- 3. Total de Carros Cadastrados -->
                    <div class="kpi-card accent-cyan" style="border-left: 4px solid #38bdf8;">
                        <div class="kpi-header">
                            <span class="kpi-title">Total de Carros Cadastrados</span>
                            <span class="kpi-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L1.4 12c-.2.4-.4.9-.4 1.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                            </span>
                        </div>
                        <div class="kpi-value">${net.totalVehicles}</div>
                        <div class="kpi-footer">
                            <strong style="color:var(--brand-gold);">${net.vehiclesWithDna}</strong> com DNA Permanente • ${net.vehiclesWithoutDna} aguardando ativação
                        </div>
                    </div>

                    <!-- 4. Faturamento Atual da Plataforma -->
                    <div class="kpi-card accent-success" style="border-left: 4px solid #10b981;">
                        <div class="kpi-header">
                            <span class="kpi-title">Faturamento da Plataforma</span>
                            <span class="kpi-icon" style="color:#10b981;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </span>
                        </div>
                        <div class="kpi-value" style="color:#10b981;">
                            R$ ${(net.totalGrossRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div class="kpi-footer" style="font-size:11px;">
                            DNA: R$ ${(net.dnaRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Serviços: R$ ${(net.servicesVolumeCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <!-- SEÇÃO 1: CENTRAL DE ALERTAS PREVENTIVOS WHATSAPP (ÓLEO E CORREIAS) -->
                <div class="panel-box" style="border: 1px solid rgba(37, 211, 102, 0.35); box-shadow: 0 4px 20px rgba(37, 211, 102, 0.08);">
                    <div class="panel-title" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:20px;">📲</span>
                            <strong style="color:#25D366;">Central de Alertas Preventivos WhatsApp (Troca de Óleo & Correias)</strong>
                            <span class="badge-proof badge-proven" style="background:rgba(37, 211, 102, 0.15); color:#25D366; border:1px solid #25D366;">
                                ${alerts.length} Notificações Prontas
                            </span>
                        </span>
                        <span style="font-size:12px; color:var(--text-muted);">
                            Disparo direto com 1 clique para o WhatsApp do proprietário
                        </span>
                    </div>

                    ${alerts.length === 0 ? `
                        <div style="padding:20px; text-align:center; color:var(--text-muted);">
                            ✅ Todos os veículos estão com as manutenções de óleo e correias em dia!
                        </div>
                    ` : `
                        <div class="table-responsive">
                            <table class="erp-table">
                                <thead>
                                    <tr>
                                        <th>Proprietário / WhatsApp</th>
                                        <th>Veículo (Placa / Modelo)</th>
                                        <th>Km Atual</th>
                                        <th>Tipo de Revisão</th>
                                        <th>Motivo do Alerta</th>
                                        <th>Oficina Responsável</th>
                                        <th style="text-align:center;">Ação Direta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${alerts.map(a => `
                                        <tr>
                                            <td>
                                                <strong style="color:#ffffff;">${a.ownerName}</strong>
                                                <div style="font-size:12px; color:#25D366; font-family:var(--font-mono);">${a.ownerPhone}</div>
                                            </td>
                                            <td>
                                                <strong style="color:var(--brand-gold);">${a.licensePlate}</strong>
                                                <div style="font-size:11.5px; color:var(--text-muted);">${a.vehicleModel}</div>
                                            </td>
                                            <td class="mono" style="font-weight:700;">
                                                ${a.currentMileage.toLocaleString('pt-BR')} km
                                            </td>
                                            <td>
                                                ${a.serviceType.includes('Óleo') ? `
                                                    <span class="badge-proof badge-warning" style="background:rgba(255, 210, 28, 0.15); color:#FFD21C; border:1px solid #FFD21C;">
                                                        🛢️ ${a.serviceType}
                                                    </span>
                                                ` : `
                                                    <span class="badge-proof badge-danger" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid #ef4444;">
                                                        ⚙️ ${a.serviceType}
                                                    </span>
                                                `}
                                            </td>
                                            <td style="font-size:12px; color:var(--text-muted);">
                                                ${a.reason}
                                            </td>
                                            <td style="font-size:12px;">
                                                <span style="color:#38bdf8;">${a.workshopName}</span>
                                            </td>
                                            <td style="text-align:center;">
                                                <a href="${a.whatsappUrl}" target="_blank" class="btn btn-sm"
                                                   style="background:#25D366; color:#05080D; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px; border:none; padding:6px 14px; border-radius:6px; transition:all 0.2s; box-shadow:0 2px 8px rgba(37,211,102,0.3);">
                                                    <span>📲 Disparar WhatsApp</span>
                                                </a>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <!-- SEÇÃO 2: OFICINAS CREDENCIADAS & DRILL-DOWN DE CLIENTES POR OFICINA -->
                <div class="panel-box">
                    <div class="panel-title" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34c3.2-1.12 5.5-4.14 5.5-7.66H4.5c0 3.52 2.3 6.54 5.5 7.66Z"/></svg>
                            <strong>Oficinas Credenciadas & Relação de Clientes Atendidos</strong>
                        </span>
                        <span style="font-size:12px; color:var(--text-muted);">
                            Clique em "Ver Clientes & Carros" para inspecionar os clientes de cada oficina
                        </span>
                    </div>

                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Oficina</th>
                                    <th>Cidade/UF</th>
                                    <th>DNAs Ativados</th>
                                    <th>Serviços Comprovados</th>
                                    <th>Volume Faturado</th>
                                    <th>Clientes & Veículos</th>
                                    <th>Status / Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${statsData.growthByWorkshops.map(w => `
                                    <tr>
                                        <td>
                                            <strong style="color:#fff;">${w.trade_name}</strong>
                                            <div class="mono" style="font-size:11px; color:var(--text-muted);">${w.cnpj}</div>
                                        </td>
                                        <td>${w.city}/${w.state}</td>
                                        <td class="mono" style="font-size:15px; font-weight:700; color:var(--brand-cyan);">${w.dnas_activated}</td>
                                        <td class="mono" style="font-size:15px; font-weight:700; color:var(--proof-level-4);">${w.proven_services}</td>
                                        <td class="mono" style="font-size:14px; font-weight:700; color:#10b981;">
                                            R$ ${((w.total_services_amount_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-cyan" onclick="AdminView.openWorkshopClientsModal('${w.id}')" style="display:inline-flex; align-items:center; gap:5px;">
                                                <span>👥 Ver Clientes & Carros</span>
                                            </button>
                                        </td>
                                        <td>
                                            ${w.status === 'APPROVED' ? `
                                                <span class="badge-proof badge-proven">Credenciada</span>
                                            ` : `
                                                <button class="btn btn-sm btn-success" onclick="AdminView.approveWorkshop('${w.id}')">
                                                    Homologar Credenciamento
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SEÇÃO 3: MODELO COMERCIAL (PLANOS & OFERTA R$ 59,90) -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            Planos de Ativação & Políticas Comerciais
                        </span>
                    </div>
                    <div class="table-responsive">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Plano</th>
                                    <th>Preço Balcão</th>
                                    <th>Preço Oficina</th>
                                    <th>Comissão Oficina</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${plansData.plans.map(p => `
                                    <tr>
                                        <td class="mono">${p.code}</td>
                                        <td>
                                            <strong style="color:${p.price_cents === 5990 ? 'var(--brand-gold)' : '#fff'};">${p.title}</strong>
                                            <div style="font-size:11px; color:var(--text-dim);">${p.description || ''}</div>
                                        </td>
                                        <td class="mono" style="font-weight:700; color:${p.price_cents === 5990 ? '#10b981' : '#fff'};">
                                            R$ ${(p.price_cents / 100).toFixed(2)}
                                        </td>
                                        <td class="mono" style="color:var(--brand-cyan);">R$ ${(p.workshop_price_cents / 100).toFixed(2)}</td>
                                        <td>${p.commission_percentage}%</td>
                                        <td><span class="badge-proof badge-proven">Ativo</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SEÇÃO 4: AUDITORIA GERAL DO SISTEMA -->
                <div class="panel-box">
                    <div class="panel-title">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--brand-cyan)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Auditoria Geral: Últimas Mutações no Sistema
                        </span>
                    </div>
                    <div id="admin-audit-table-box">
                        <button class="btn btn-sm btn-secondary" onclick="AdminView.loadAuditLogs()">
                            Atualizar Logs de Auditoria
                        </button>
                    </div>
                </div>
            `;

            this.loadAuditLogs();
        } catch (err) {
            console.error('Erro ao renderizar painel admin:', err);
            container.innerHTML = `<div class="panel-box" style="color:var(--status-rejected);">Erro ao carregar dados administrativos: ${err.message}</div>`;
        }
    },

    // Modal de Clientes & Veículos de uma Oficina Selecionada
    async openWorkshopClientsModal(workshopId) {
        let modal = document.getElementById('workshop-clients-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'workshop-clients-modal';
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-card" style="max-width:760px; width:95%; max-height:90vh; display:flex; flex-direction:column;">
                <div style="padding:30px; text-align:center; color:var(--text-muted);">
                    <div class="pulse-dot" style="margin:0 auto 12px;"></div>
                    Carregando carteira de clientes da oficina...
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        try {
            const data = await API.getWorkshopClients(workshopId);
            const ws = data.workshop;
            const clients = data.clients || [];

            const card = modal.querySelector('.auth-modal-card');
            card.innerHTML = `
                <div class="auth-modal-header" style="margin-bottom:12px; padding-bottom:10px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:22px;">🏢</span>
                            <h3 style="margin:0; font-size:17px; color:#ffffff; font-weight:700;">${ws.trade_name}</h3>
                        </div>
                        <p style="margin:2px 0 0; font-size:12px; color:var(--text-muted);">
                            CNPJ: ${ws.cnpj} • ${ws.city}/${ws.state} • Tel: ${ws.phone}
                        </p>
                    </div>
                    <button type="button" class="auth-modal-close" onclick="AdminView.closeWorkshopClientsModal()">✕</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:10px 14px; background:rgba(255,210,28,0.06); border:1px solid rgba(255,210,28,0.2); border-radius:8px;">
                    <div>
                        <span style="font-size:12px; color:var(--text-muted);">Total de Clientes / Veículos Atendidos:</span>
                        <strong style="color:var(--brand-gold); margin-left:6px; font-size:15px;">${clients.length}</strong>
                    </div>
                    <div>
                        <span style="font-size:12px; color:var(--text-muted);">Faturamento Gerado:</span>
                        <strong style="color:#10b981; margin-left:6px; font-size:15px;">
                            R$ ${(clients.reduce((acc, c) => acc + (c.total_spent_cents || 0), 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                    </div>
                </div>

                <div class="table-responsive" style="overflow-y:auto; max-height:55vh;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Cliente (Proprietário)</th>
                                <th>Veículo</th>
                                <th>DNA do Carro</th>
                                <th>Último Serviço</th>
                                <th>Km</th>
                                <th>Total Gasto</th>
                                <th>Contato WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.length === 0 ? `
                                <tr>
                                    <td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">
                                        Nenhum cliente com serviço registrado nesta oficina ainda.
                                    </td>
                                </tr>
                            ` : clients.map(c => {
                                const cleanPhone = String(c.owner_phone || '').replace(/\D/g, '');
                                const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                const waMsg = encodeURIComponent(`Olá ${c.owner_name}! Aqui é da oficina ${ws.trade_name} em parceria com o DNA AUTO. Como está o seu ${c.brand} ${c.model}? Deseja agendar sua próxima revisão periódica?`);
                                return `
                                    <tr>
                                        <td>
                                            <strong style="color:#ffffff;">${c.owner_name}</strong>
                                            <div style="font-size:11px; color:var(--text-muted);">${c.owner_email || ''}</div>
                                        </td>
                                        <td>
                                            <strong style="color:var(--brand-gold);">${c.license_plate}</strong>
                                            <div style="font-size:11px; color:var(--text-muted);">${c.brand} ${c.model} (${c.model_year})</div>
                                        </td>
                                        <td class="mono" style="font-size:11px; color:var(--brand-cyan);">
                                            ${c.dna_code || '<span style="color:var(--text-dim);">Sem DNA</span>'}
                                        </td>
                                        <td style="font-size:11.5px;">
                                            ${c.last_service_date || '-'}
                                        </td>
                                        <td class="mono" style="font-size:12px;">
                                            ${c.last_recorded_mileage ? c.last_recorded_mileage.toLocaleString('pt-BR') + ' km' : '-'}
                                        </td>
                                        <td class="mono" style="font-weight:700; color:#10b981;">
                                            R$ ${((c.total_spent_cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            ${cleanPhone ? `
                                                <a href="https://api.whatsapp.com/send?phone=${waNumber}&text=${waMsg}" target="_blank"
                                                   class="btn btn-sm" style="background:#25D366; color:#05080D; font-weight:700; text-decoration:none; padding:4px 10px; font-size:11px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
                                                    <span>📲 ${c.owner_phone}</span>
                                                </a>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="text-align:right; margin-top:14px; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="AdminView.closeWorkshopClientsModal()">Fechar Janela</button>
                </div>
            `;
        } catch (err) {
            alert('Erro ao carregar clientes da oficina: ' + err.message);
            this.closeWorkshopClientsModal();
        }
    },

    closeWorkshopClientsModal() {
        const modal = document.getElementById('workshop-clients-modal');
        if (modal) modal.remove();
    },

    async approveWorkshop(workshopId) {
        if (!confirm('Deseja homologar o credenciamento desta oficina na rede DNA AUTO?')) return;
        try {
            await API.updateWorkshopStatus(workshopId, 'APPROVED');
            alert('Oficina credenciada com sucesso na rede!');
            this.render();
        } catch (err) {
            alert('Erro ao homologar oficina: ' + err.message);
        }
    },

    async loadAuditLogs() {
        const box = document.getElementById('admin-audit-table-box');
        if (!box) return;

        try {
            const res = await API.getAuditLogs({ limit: 8 });
            box.innerHTML = `
                <div class="table-responsive" style="margin-top:12px;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Entidade</th>
                                <th>DNA Envolvido</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${res.logs.map(l => `
                                <tr>
                                    <td>${l.created_at}</td>
                                    <td><strong>${l.user_name || 'Sistema'}</strong> (${l.user_role})</td>
                                    <td><span class="mono" style="color:var(--brand-cyan);">${l.action}</span></td>
                                    <td>${l.entity_type}</td>
                                    <td class="mono">${l.vehicle_dna_code || '-'}</td>
                                    <td class="mono">${l.ip_address}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            box.innerHTML = `<div style="color:var(--status-rejected);">Erro ao carregar auditoria.</div>`;
        }
    }
};
