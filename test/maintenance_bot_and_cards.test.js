/**
 * DNA AUTO — Bateria de Testes: Bot de Manutenção (10h/17h), PDF Diário, Tickets de Suporte e Cards da Oficina
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_dna_auto_2026';

const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../server/src/server');
const db = require('../server/src/database/db');
const { seedBase, seedDemoCars } = require('../server/src/database/seed');
const { generateDailyAgendaPdf } = require('../server/src/services/agendaPdf.service');
const whatsappBotAgent = require('../server/src/services/whatsappBotAgent.service');
const maintenanceMonitor = require('../server/src/services/maintenanceMonitor.service');

let server;
let BASE_URL;

async function runTests() {
    console.log('🧪 Iniciando Testes do Bot Preventivo (10h/17h), PDF Diário, Suporte e Cards...');

    seedBase(db);
    seedDemoCars(db);

    server = http.createServer(app);
    await new Promise((resolve) => {
        server.listen(0, () => {
            BASE_URL = `http://localhost:${server.address().port}/api/v1`;
            resolve();
        });
    });

    try {
        // ── T1: Verificar tabelas no SQLite ─────────────────────────────────────
        const tables = db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type = 'table' AND name IN ('maintenance_bot_campaigns', 'daily_agenda_dispatches', 'support_tickets')
        `).all().map(r => r.name);
        assert.ok(tables.includes('maintenance_bot_campaigns'), 'Tabela maintenance_bot_campaigns deve existir');
        assert.ok(tables.includes('daily_agenda_dispatches'), 'Tabela daily_agenda_dispatches deve existir');
        assert.ok(tables.includes('support_tickets'), 'Tabela support_tickets deve existir');
        console.log('✅ T1. Schema SQLite validado com todas as tabelas do bot e tickets.');

        // ── T2: Datas úteis (Seg-Sáb até 11h, sem Domingo) + PDF Diário ─────────
        const fridayDates = whatsappBotAgent.getNextWorkingDates('2026-11-13', 3);
        assert.equal(fridayDates.length, 3, 'Deve retornar 3 datas úteis');
        assert.equal(fridayDates[0].date, '2026-11-14', '1a data após sexta deve ser sábado');
        assert.equal(fridayDates[0].closeHour, '11:00', 'Sábado deve fechar às 11:00');
        assert.equal(fridayDates[1].date, '2026-11-16', 'Domingo deve ser pulado, indo para segunda');
        assert.equal(fridayDates[1].closeHour, '18:00', 'Segunda deve fechar às 18:00');

        const pdfRes = await generateDailyAgendaPdf({
            workshop: { id: 'ws_veloce', trade_name: 'Veloce Auto Center', city: 'São Paulo', state: 'SP' },
            targetDate: '2026-11-16',
            appointments: [
                {
                    appointment_time: '09:00',
                    license_plate: 'BRA2E19',
                    vehicle_brand: 'Honda',
                    vehicle_model: 'Civic Touring',
                    owner_name: 'Carlos Eduardo',
                    owner_phone: '5511999998888',
                    service_title: 'Troca de Óleo e Filtros',
                    status: 'CONFIRMED'
                },
                {
                    appointment_time: '14:00',
                    license_plate: 'ABC1D23',
                    vehicle_brand: 'Toyota',
                    vehicle_model: 'Corolla XEi',
                    owner_name: 'Mariana Souza',
                    owner_phone: '5511988887777',
                    service_title: 'Kit Correia Dentada',
                    status: 'CONFIRMED'
                }
            ]
        });
        assert.ok(fs.existsSync(pdfRes.filePath), 'Arquivo PDF deve ser gravado em disco');
        const pdfHeader = fs.readFileSync(pdfRes.filePath).subarray(0, 5).toString('utf8');
        assert.equal(pdfHeader, '%PDF-', 'Arquivo gerado deve ter assinatura válida %PDF-');
        assert.ok(pdfRes.buffer && pdfRes.buffer.length > 500, 'PDF deve ter conteúdo válido (> 500 bytes)');

        const httpPdf = await fetch(`${BASE_URL}/workshops/ws_veloce/appointments/daily-pdf?date=2026-11-16`);
        assert.equal(httpPdf.status, 200, 'Rota GET /appointments/daily-pdf deve retornar 200');
        assert.ok((httpPdf.headers.get('content-type') || '').includes('application/pdf'), 'Content-Type deve ser application/pdf');
        console.log('✅ T2. Regras de datas úteis e geração/download de PDF diário validados.');

        // ── T3: Agente Conversacional WhatsApp (Sábado >11h, Confirmação, Opt-out) ──
        const wsId = 'ws_veloce';
        const testPhone = '5511977771234';
        const campSatId = `botcamp_test_sat_${Date.now()}`;
        db.prepare(`
            INSERT INTO maintenance_bot_campaigns (
                id, workshop_id, vehicle_id, license_plate, vehicle_model,
                owner_name, owner_phone, item_code, item_name, current_km,
                offered_dates_json, status
            ) VALUES (?, ?, 'veh_civic_touring', 'BRA2E19', 'Honda Civic', 'Teste Bot', ?, 'TROCA_OLEO', 'Troca de Óleo', 90000, ?, 'SENT')
        `).run(campSatId, wsId, testPhone, JSON.stringify(fridayDates));

        const replies = [];
        const mockEnqueue = async (payload) => { replies.push(payload); };

        const satBlocked = await whatsappBotAgent.handleIncomingMessage({
            workshopId: wsId,
            senderPhone: testPhone,
            messageText: '1 às 15h',
            enqueueReplyFn: mockEnqueue
        });
        assert.equal(satBlocked.handled, true);
        assert.equal(satBlocked.confirmed, false);
        assert.equal(satBlocked.status, 'IN_CONVERSATION', 'Sábado após 11h não pode confirmar');
        assert.ok(replies[replies.length - 1].message.includes('11h00'), 'Deve informar limite das 11h00 no sábado');

        const monConfirmed = await whatsappBotAgent.handleIncomingMessage({
            workshopId: wsId,
            senderPhone: testPhone,
            messageText: '2 às 09h',
            enqueueReplyFn: mockEnqueue
        });
        assert.equal(monConfirmed.handled, true);
        assert.equal(monConfirmed.confirmed, true);
        assert.equal(monConfirmed.status, 'CONFIRMED');
        assert.equal(monConfirmed.chosenDate, '2026-11-16');
        assert.equal(monConfirmed.chosenTime, '09:00');

        const createdApp = db.prepare(`SELECT * FROM workshop_appointments WHERE id = ?`).get(monConfirmed.appointmentId);
        assert.ok(createdApp, 'Agendamento deve existir em workshop_appointments');
        assert.equal(createdApp.status, 'CONFIRMED');
        assert.equal(createdApp.license_plate, 'BRA2E19');

        // Opt-out
        const campDeclineId = `botcamp_test_dec_${Date.now()}`;
        const declinePhone = '5511966664321';
        db.prepare(`
            INSERT INTO maintenance_bot_campaigns (
                id, workshop_id, vehicle_id, license_plate, vehicle_model,
                owner_name, owner_phone, item_code, item_name, current_km,
                offered_dates_json, status
            ) VALUES (?, ?, 'veh_corolla_xei', 'ABC1D23', 'Toyota Corolla', 'Teste Recusa', ?, 'TROCA_OLEO', 'Troca de Óleo', 60000, ?, 'SENT')
        `).run(campDeclineId, wsId, declinePhone, JSON.stringify(fridayDates));

        const declined = await whatsappBotAgent.handleIncomingMessage({
            workshopId: wsId,
            senderPhone: declinePhone,
            messageText: 'agora não quero, cancelar',
            enqueueReplyFn: mockEnqueue
        });
        assert.equal(declined.handled, true);
        assert.equal(declined.status, 'DECLINED');
        console.log('✅ T3. Agente conversacional validado (bloqueio sábado >11h, confirmação em workshop_appointments e opt-out).');

        // ── T4: Monitor Automático (10h Disparo Preventivo + Cooldown + 17h PDF Idempotente) ──
        db.prepare(`DELETE FROM maintenance_bot_campaigns WHERE workshop_id = ?`).run(wsId);
        db.prepare(`DELETE FROM workshop_appointments WHERE workshop_id = ?`).run(wsId);
        db.prepare(`DELETE FROM daily_agenda_dispatches WHERE workshop_id = ?`).run(wsId);

        // Garante que o veículo de teste possui histórico na oficina e manutenção vencida
        db.prepare(`
            INSERT OR REPLACE INTO owners (id, user_id, name, document_cpf, phone, email)
            VALUES ('own_bot_test', 'usr_owner_carlos', 'Carlos Bot', '12345678901', '11991112233', 'carlosbot@teste.com')
        `).run();
        db.prepare(`
            INSERT OR REPLACE INTO ownership_transfers (id, vehicle_id, new_owner_id, status, transfer_mileage)
            VALUES ('trf_bot_test', 'veh_civic_touring', 'own_bot_test', 'COMPLETED', 95000)
        `).run();
        db.prepare(`
            INSERT OR REPLACE INTO mileage_records (id, vehicle_id, mileage, recorded_at, source)
            VALUES ('mil_bot_test', 'veh_civic_touring', 95000, '2026-11-12', 'WORKSHOP_SERVICE')
        `).run();

        const outreach1 = await maintenanceMonitor.runMorningOutreach({
            workshopId: wsId,
            force: false,
            baseDate: '2026-11-12'
        });
        assert.ok(outreach1.sentCount >= 1, 'Disparo das 10h deve gerar ao menos 1 campanha preventiva');

        const outreach2 = await maintenanceMonitor.runMorningOutreach({
            workshopId: wsId,
            force: false,
            baseDate: '2026-11-12'
        });
        assert.equal(outreach2.sentCount, 0, 'Segunda execução imediata deve respeitar cooldown de 14 dias');

        // Simular resposta via rota REST /whatsapp/simulate-incoming e validar fila WhatsApp
        const msgCountBefore = db.prepare(`SELECT COUNT(*) as total FROM whatsapp_messages WHERE workshop_id = ?`).get(wsId).total;
        const simRes = await fetch(`${BASE_URL}/workshops/${wsId}/whatsapp/simulate-incoming`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '11991112233', message: '1 às 10h' })
        });
        const simData = await simRes.json();
        assert.equal(simRes.status, 200);
        assert.equal(simData.botResult.confirmed, true, 'Simulação REST deve confirmar agendamento');

        const msgCountAfter = db.prepare(`SELECT COUNT(*) as total FROM whatsapp_messages WHERE workshop_id = ?`).get(wsId).total;
        assert.ok(msgCountAfter > msgCountBefore, 'Resposta do bot deve ser enfileirada em whatsapp_messages');

        const targetDateForPdf = outreach1.offeredDates[0].date;
        const pdfDispatch1 = await maintenanceMonitor.runEveningAgendaPdf({
            workshopId: wsId,
            targetDate: targetDateForPdf,
            force: false
        });
        assert.equal(pdfDispatch1.dispatches[0].skipped, false);
        assert.ok(pdfDispatch1.dispatches[0].appointmentsCount >= 1, 'PDF das 17h deve conter o carro confirmado pelo bot');

        const pdfDispatch2 = await maintenanceMonitor.runEveningAgendaPdf({
            workshopId: wsId,
            targetDate: targetDateForPdf,
            force: false
        });
        assert.equal(pdfDispatch2.dispatches[0].skipped, true);
        assert.equal(pdfDispatch2.dispatches[0].reason, 'ALREADY_SENT', 'Envio das 17h deve ser idempotente no mesmo dia');
        console.log('✅ T4. Monitor 10h (cooldown) e PDF 17h (idempotência) + integração WhatsApp validados.');

        // ── T5: Rotas de Campanhas, Tickets de Suporte (Oficina + Admin) e Cards UI ──
        const campApiRes = await fetch(`${BASE_URL}/workshops/${wsId}/maintenance-bot/campaigns`);
        const campApiData = await campApiRes.json();
        assert.equal(campApiRes.status, 200);
        assert.ok(campApiData.campaigns.length >= 1 && campApiData.appointments.length >= 1 && campApiData.dispatches.length >= 1);

        // Criar Ticket de Suporte na Oficina
        const tktCreateRes = await fetch(`${BASE_URL}/workshops/${wsId}/support-tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: 'WHATSAPP_BOT',
                priority: 'ALTA',
                subject: 'Teste Ticket Bot',
                description: 'Validando abertura de chamado exclusivo pela oficina.',
                requester_name: 'Gestor Veloce'
            })
        });
        const tktCreateData = await tktCreateRes.json();
        assert.equal(tktCreateRes.status, 201);
        assert.ok(tktCreateData.ticket.protocol.startsWith('TKT-'), 'Ticket deve gerar protocolo TKT-');

        // Isolamento multi-tenant no suporte
        const otherTicketsRes = await fetch(`${BASE_URL}/workshops/ws_outra_inexistente/support-tickets`);
        const otherTicketsData = await otherTicketsRes.json();
        assert.equal(otherTicketsData.tickets.length, 0, 'Outra oficina não deve enxergar tickets da Veloce');

        // Admin responde e resolve ticket
        const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@dnaauto.com.br', password: 'admin123' })
        });
        const adminToken = (await loginAdminRes.json()).token;
        const adminReplyRes = await fetch(`${BASE_URL}/admin/support-tickets/${tktCreateData.ticket.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ status: 'RESOLVED', admin_reply: 'Bot validado pela plataforma!' })
        });
        const adminReplyData = await adminReplyRes.json();
        assert.equal(adminReplyRes.status, 200);
        assert.equal(adminReplyData.ticket.status, 'RESOLVED');

        // Validar UI Mobile da Oficina (Avisos WhatsApp real, Suporte só Ticket, Lançar Serviços sem carro pré-carregado)
        global.window = {
            location: { search: '', hash: '#dashboard' },
            scrollTo: () => {},
            localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
            sessionStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } }
        };
        global.localStorage = global.window.localStorage;
        global.sessionStorage = global.window.sessionStorage;
        global.localStorage.setItem('dna_logged_user', JSON.stringify({ id: 'usr_ws_1', name: 'Gestor', role_code: 'WORKSHOP_OWNER' }));
        const elements = new Map();
        const makeEl = (tag, id = '') => ({
            tagName: tag.toUpperCase(), id, className: '', style: {}, attributes: {}, innerHTML: '', value: '',
            classList: { _c: new Set(), add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); }, contains(c) { return this._c.has(c); }, toggle(c, f) { if (f) this._c.add(c); else this._c.delete(c); } },
            setAttribute(k, v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k] || null; },
            querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}
        });
        global.document = {
            body: makeEl('body', 'body'),
            getElementById(id) { if (!elements.has(id)) elements.set(id, makeEl('div', id)); return elements.get(id); },
            createElement: makeEl, querySelector: () => null, querySelectorAll: () => []
        };
        global.API = { baseUrl: BASE_URL };

        eval(fs.readFileSync(path.resolve('oficina.app/js/components/workshopView.js'), 'utf8').replace('const WorkshopView =', 'global.WorkshopView ='));
        eval(fs.readFileSync(path.resolve('oficina.app/js/components/workshopMobileView.js'), 'utf8'));

        WorkshopView.selectedMobileVehicle = { id: 'veh_old', license_plate: 'OLD0000' };
        WorkshopView.mobileActivePlate = 'OLD0000';
        WorkshopView._isLaunchVehicleConfirmed = true;
        WorkshopView.switchMobileSection('lancar-servicos');
        assert.equal(WorkshopView.selectedMobileVehicle, null, 'Lançar Serviços deve limpar selectedMobileVehicle ao abrir');
        assert.equal(WorkshopView.mobileActivePlate, '', 'Lançar Serviços deve limpar mobileActivePlate ao abrir');
        assert.equal(WorkshopView._isLaunchVehicleConfirmed, false, 'Lançar Serviços deve limpar _isLaunchVehicleConfirmed');
        const launchHtml = WorkshopView.renderMobileLaunchServicesView();
        assert.ok(launchHtml.includes('Digite os 7 caracteres da placa acima'), 'Lançar Serviços não deve exibir veículo antes da digitação');

        WorkshopView.supportTickets = [tktCreateData.ticket];
        const supportHtml = WorkshopView.renderMobileSupportView();
        assert.ok(supportHtml.includes('Abrir Chamado com a Plataforma'), 'Card Suporte deve exibir abertura de tickets');
        assert.ok(supportHtml.includes(tktCreateData.ticket.protocol), 'Card Suporte deve listar protocolo do ticket');
        assert.ok(!supportHtml.includes('wa.me') && !supportHtml.includes('/admin'), 'Card Suporte não deve conter links /admin ou wa.me');

        WorkshopView.botCampaigns = campApiData.campaigns;
        WorkshopView.botAppointments = campApiData.appointments;
        const wppHtml = WorkshopView.renderMobileWhatsAppView();
        assert.ok(wppHtml.includes('Agente Automático WhatsApp'), 'Card Avisos WhatsApp deve exibir agente automático');
        assert.ok(wppHtml.includes('BRA2E19'), 'Card Avisos WhatsApp deve exibir veículos reais notificados/agendados');
        console.log('✅ T5. Rotas REST, Tickets Admin/Oficina e 3 cards mobile da oficina validados com 100% de êxito.');

        console.log('\n🎉 TODOS OS TESTES DO BOT DE MANUTENÇÃO, PDF DIÁRIO E CARDS PASSARAM COM 100% DE SUCESSO!');
    } finally {
        await new Promise((resolve) => server.close(resolve));
        seedBase(db);
    }
}

runTests().catch(err => {
    console.error('❌ Falha no teste maintenance_bot_and_cards:', err);
    process.exit(1);
});
