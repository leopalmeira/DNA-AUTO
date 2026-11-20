/**
 * DNA AUTO — BATERIA COMPLETA DE TESTES DA CENTRAL ADMINISTRATIVA INTEGRADA V2 (FASE 11)
 *
 * Cobre explicitamente todos os 30 cenários obrigatórios:
 * 1-5: Representantes, aprovação, pendência, indicação e proteção contra duplicação de vínculo
 * 6-15: Clientes únicos vs múltiplos veículos, PIX pendente/confirmado, idempotência webhook,
 *       comissão única de R$ 5,90, arredondamento centesimal, política versionada R$ 59,90 sem
 *       recalcular histórico, prazo 24 meses (dentro/fora), estorno + clawback pós-pagamento
 * 16-21: Competência anterior (vencidas), previsão próximo mês, fechamento atômico, bloqueio de
 *        fechamento duplicado (409), marcação de pagamento auditada, bloqueio de pagamento duplicado (409)
 * 22-24: Segurança RBAC estrita (REPRESENTATIVE 403, WORKSHOP 403, unauthenticated / X-Demo-User-Id 401)
 * 25-28: Sincronização real após cadastro e pagamento, tratamento de indisponibilidade da API,
 *        integridade/idempotência pós-migração e ausência de multiplicação por JOIN
 * 29-30: Compatibilidade dos apps (/cliente, /oficina, /representante) e UI responsiva desktop/mobile
 *        com renderização das 26 telas do menu + 2 telas de detalhe
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

process.env.NODE_ENV = 'test';
process.env.ABACATEPAY_WEBHOOK_SECRET = 'test_webhook_secret_v2';

const db = require('../server/src/database/db');
const { seedBase } = require('../server/src/database/seed');
const { runAdminCentralV2Migration } = require('../server/src/database/migrations/adminCentralV2.migration');
const CommissionFinance = require('../server/src/services/commissionFinance.service');
const app = require('../server/src/server');

let server;
let baseUrl;
let adminToken;

// Estado compartilhado ao longo dos cenários integrados
const state = {
    repApprovedId: null,
    repApprovedCode: null,
    repApprovedToken: null,
    repPendingId: null,
    repPendingCode: null,
    repSecondId: null,
    repSecondCode: null,
    repSecondToken: null,
    workshopId: null,
    workshopToken: null,
    pixChargeId: null,
    pixAbacateId: null,
    pixChargeRefundId: null,
    pixAbacateRefundId: null,
    commissionId: null,
    batchId: null,
    policyV2Id: 'pol_v2_5990',
    historicalPolicyId: 'pol_v1_4990'
};

async function req(method, urlPath, { body = null, token = null, headers = {} } = {}) {
    const reqHeaders = { ...headers };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
    if (body !== null && !reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers: reqHeaders,
        body: body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { status: res.status, json, text, headers: res.headers };
}

test.before(async () => {
    seedBase();
    runAdminCentralV2Migration(db);
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            baseUrl = `http://127.0.0.1:${addr.port}`;
            resolve();
        });
    });

    const loginRes = await req('POST', '/api/v1/auth/login', {
        body: { email: 'admin@dnaauto.com.br', password: 'admin123' }
    });
    assert.equal(loginRes.status, 200, 'Login ADMIN deve suceder');
    adminToken = loginRes.json.token;
    assert.ok(adminToken && adminToken.split('.').length === 3, 'Token ADMIN deve ser JWT válido');
});

test.after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
});

// ==============================================================================
// CENÁRIOS 1 A 5 — REPRESENTANTES, PENDÊNCIA, INDICAÇÃO E VÍNCULO ÚNICO
// ==============================================================================

test('01. Representante cadastrado e aprovado pelo Admin', async () => {
    const reg = await req('POST', '/api/v1/representatives/register', {
        body: {
            name: 'Roberto Comercial Silva',
            cpf_cnpj: '12345678901',
            email: 'roberto.rep@dnaauto.test',
            phone: '(11) 98888-1111',
            city: 'Campinas',
            state: 'SP',
            pix_key: 'roberto.rep@pix.test',
            password: 'RepPassword123!'
        }
    });
    assert.equal(reg.status, 201);
    state.repApprovedId = reg.json.representative.id;
    state.repApprovedCode = reg.json.representative.rep_code;
    assert.equal(reg.json.representative.status, 'PENDING_APPROVAL');

    const approve = await req('POST', `/api/v1/admin/representatives/${state.repApprovedId}/approve`, {
        token: adminToken,
        body: { justification: 'Documentação conferida e representante aprovado para atuação em SP' }
    });
    assert.equal(approve.status, 200);
    assert.equal(approve.json.status, 'ACTIVE');

    const repLogin = await req('POST', '/api/v1/representatives/login', {
        body: { email: 'roberto.rep@dnaauto.test', password: 'RepPassword123!' }
    });
    assert.equal(repLogin.status, 200);
    state.repApprovedToken = repLogin.json.token;

    const overview = await req('GET', `/api/v1/admin/representatives/${state.repApprovedId}/overview`, { token: adminToken });
    assert.equal(overview.status, 200);
    assert.equal(overview.json.personal_data.status, 'ACTIVE');
    assert.ok(overview.json.personal_data.cpf_cnpj_masked.includes('*'), 'CPF deve estar mascarado (LGPD)');
    assert.ok(overview.json.personal_data.pix_key_masked.includes('*'), 'Chave PIX deve estar mascarada (LGPD)');
    assert.equal(overview.json.personal_data.password_hash, undefined, 'Nunca retornar hash de senha');
});

test('02. Representante pendente sem carteira ativa', async () => {
    const reg = await req('POST', '/api/v1/representatives/register', {
        body: {
            name: 'Carla Pendente Souza',
            cpf_cnpj: '98765432100',
            email: 'carla.pendente@dnaauto.test',
            phone: '(11) 97777-2222',
            city: 'Sorocaba',
            state: 'SP',
            password: 'RepPassword123!'
        }
    });
    assert.equal(reg.status, 201);
    state.repPendingId = reg.json.representative.id;
    state.repPendingCode = reg.json.representative.rep_code;
    assert.equal(reg.json.representative.status, 'PENDING_APPROVAL');

    // Tentar cadastrar oficina usando código de representante pendente NÃO pode criar vínculo ativo
    const wsTry = await req('POST', '/api/v1/auth/register-workshop', {
        body: {
            trade_name: 'Oficina Teste Rep Pendente',
            cnpj: '11.222.333/0001-44',
            phone: '(11) 91111-0001',
            email: 'ws.pendingrep@dnaauto.test',
            password: 'WsPassword123!',
            rep_code: state.repPendingCode
        }
    });
    assert.equal(wsTry.status, 201);

    const refCheck = db.prepare(`SELECT * FROM workshop_referrals WHERE representative_id = ?`).all(state.repPendingId);
    assert.equal(refCheck.length, 0, 'Representante pendente não pode receber oficina na carteira');

    const dash = await req('GET', '/api/v1/admin/dashboard/overview', { token: adminToken });
    assert.equal(dash.status, 200);
    assert.ok(dash.json.cards.pending_representatives >= 1);
    assert.ok(dash.json.cards.active_representatives >= 1);
});

test('03 & 04. Oficina cadastrada por link de indicação e corretamente vinculada', async () => {
    // Criar também um segundo representante aprovado para testes de duplicidade e isolamento
    const reg2 = await req('POST', '/api/v1/representatives/register', {
        body: {
            name: 'Fernanda Concorrente Lima',
            cpf_cnpj: '55544433322',
            email: 'fernanda.rep2@dnaauto.test',
            phone: '(21) 96666-3333',
            city: 'Rio de Janeiro',
            state: 'RJ',
            password: 'RepPassword123!'
        }
    });
    assert.equal(reg2.status, 201);
    state.repSecondId = reg2.json.representative.id;
    state.repSecondCode = reg2.json.representative.rep_code;
    await req('POST', `/api/v1/admin/representatives/${state.repSecondId}/approve`, { token: adminToken });
    const rep2Login = await req('POST', '/api/v1/representatives/login', {
        body: { email: 'fernanda.rep2@dnaauto.test', password: 'RepPassword123!' }
    });
    assert.equal(rep2Login.status, 200);
    state.repSecondToken = rep2Login.json.token;

    // Cadastrar oficina via link/código do representante aprovado 1
    const wsReg = await req('POST', '/api/v1/auth/register-workshop', {
        body: {
            trade_name: 'Auto Center Precisão Campinas',
            company_name: 'Precisão Mecânica Ltda',
            cnpj: '22.333.444/0001-55',
            phone: '(19) 99999-4444',
            email: 'precisao.ws@dnaauto.test',
            city: 'Campinas',
            state: 'SP',
            password: 'WsPassword123!',
            rep_code: state.repApprovedCode
        }
    });
    assert.equal(wsReg.status, 201);
    state.workshopId = wsReg.json.workshop.id;
    state.workshopToken = wsReg.json.token;

    // Aprovar oficina no admin
    const wsApprove = await req('POST', `/api/v1/admin/workshops/${state.workshopId}/status`, {
        token: adminToken,
        body: { status: 'APPROVED' }
    });
    assert.equal(wsApprove.status, 200);

    // Conferir vínculo pela carteira do representante e pelo resumo de oficinas
    const repWs = await req('GET', `/api/v1/admin/representatives/${state.repApprovedId}/workshops`, { token: adminToken });
    assert.equal(repWs.status, 200);
    assert.equal(repWs.json.count, 1);
    assert.equal(repWs.json.workshops[0].workshop_id, state.workshopId);

    const wsPerf = await req('GET', `/api/v1/admin/workshops/${state.workshopId}/performance`, { token: adminToken });
    assert.equal(wsPerf.status, 200);
    assert.equal(wsPerf.json.referral.representative_id, state.repApprovedId);
    assert.equal(wsPerf.json.referral.rep_code, state.repApprovedCode);
});

test('05. Tentativa de duplicar vínculo comercial é bloqueada (e reatribuição exige ADMIN + justificativa)', async () => {
    // 1. Constraint UNIQUE no banco impede dois vínculos simultâneos para a mesma oficina
    assert.throws(() => {
        db.prepare(`
            INSERT INTO workshop_referrals (id, workshop_id, representative_id, rep_code, origin_channel, valid_until, status)
            VALUES ('wref_dup_test', ?, ?, ?, 'LINK', datetime('now', '+24 months'), 'ACTIVE')
        `).run(state.workshopId, state.repSecondId, state.repSecondCode);
    }, /UNIQUE/i, 'Banco deve impedir dois representantes simultâneos para a mesma oficina');

    // 2. Reatribuição administrativa sem justificativa adequada deve falhar (400)
    const badReassign = await req('POST', `/api/v1/admin/workshops/${state.workshopId}/reassign-representative`, {
        token: adminToken,
        body: { new_representative_id: state.repSecondId, justification: 'curto' }
    });
    assert.equal(badReassign.status, 400);

    // 3. Representante tentando reatribuir oficina recebe 403
    const repTryReassign = await req('POST', `/api/v1/admin/workshops/${state.workshopId}/reassign-representative`, {
        token: state.repSecondToken,
        body: { new_representative_id: state.repSecondId, justification: 'Tentativa não autorizada de captura' }
    });
    assert.equal(repTryReassign.status, 403);
});

// ==============================================================================
// CENÁRIOS 6 A 15 — CLIENTES ÚNICOS, MÚLTIPLOS VEÍCULOS, PIX, WEBHOOK E COMISSÃO
// ==============================================================================

test('06 & 07. Cadastro de cliente pela oficina e cliente com múltiplos veículos (1 cliente único, 3 veículos)', async () => {
    const syncBefore = (await req('GET', '/api/v1/admin/sync/status', { token: adminToken })).json.sync_version;

    // Mesmo cliente (João Multiproprietário) cadastrando 3 placas diferentes na mesma oficina
    const plates = ['V2A1001', 'V2A1002', 'V2A1003'];
    for (let i = 0; i < plates.length; i++) {
        const res = await req('POST', `/api/v1/workshops/${state.workshopId}/clients/register-activation`, {
            token: state.workshopToken,
            body: {
                client_name: 'João Multiproprietário',
                whatsapp: '(19) 98765-4321',
                email: 'joao.multi@cliente.test',
                license_plate: plates[i],
                brand: 'Honda',
                model: i === 0 ? 'Civic' : (i === 1 ? 'HR-V' : 'Fit'),
                year: 2022 + i,
                mileage: 15000 + i * 5000
            }
        });
        assert.ok(res.status === 200 || res.status === 201, `Cadastro ${plates[i]} deve suceder (status ${res.status})`);
    }

    // Cenário 25 parcial: verificar que sync_version incrementou após os cadastros
    const syncAfter = (await req('GET', '/api/v1/admin/sync/status', { token: adminToken })).json.sync_version;
    assert.ok(syncAfter > syncBefore, 'sync_version deve incrementar após cadastro de cliente pela oficina');

    // Verificar desduplicação rigorosa na performance da oficina
    const perf = await req('GET', `/api/v1/admin/workshops/${state.workshopId}/performance`, { token: adminToken });
    assert.equal(perf.status, 200);
    assert.equal(perf.json.metrics.unique_clients_count, 1, 'Mesmo cliente com 3 carros deve contar como 1 cliente único');
    assert.equal(perf.json.metrics.vehicles_count, 3, 'Deve contabilizar exatamente 3 veículos');
    assert.equal(perf.json.unique_clients.length, 1);
    assert.equal(perf.json.unique_clients[0].vehicles_count, 3);

    // Verificar também no diretório global de clientes únicos
    const clientsDir = await req('GET', `/api/v1/admin/clients/unique?workshop_id=${state.workshopId}`, { token: adminToken });
    assert.equal(clientsDir.status, 200);
    assert.equal(clientsDir.json.total, 1, 'Diretório global deve contar 1 cliente único para essa oficina');
    assert.equal(clientsDir.json.items[0].vehicles_count, 3);
});

test('08. Pagamento PIX pendente cria comissão PROJECTED e NÃO entra em Próximo Pagamento elegível', async () => {
    const veh = db.prepare(`SELECT id FROM vehicles WHERE license_plate = 'V2A1001'`).get();
    assert.ok(veh, 'Veículo V2A1001 deve existir');

    const pixGen = await req('POST', `/api/v1/billing/workshop/${state.workshopId}/pix-charge`, {
        token: state.workshopToken,
        body: {
            vehicle_id: veh.id,
            activation_code: 'DNA-V2-001',
            charge_type: 'SINGLE'
        }
    });
    assert.equal(pixGen.status, 201);
    assert.equal(pixGen.json.charge.status, 'PENDING');
    state.pixChargeId = pixGen.json.charge.id;
    state.pixAbacateId = pixGen.json.charge.abacate_id;

    // Deve haver exatamente 1 comissão PROJECTED de R$ 5,90 (590 centavos)
    const comm = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(state.pixChargeId);
    assert.ok(comm, 'Comissão projetada deve ser criada ao gerar PIX pendente');
    assert.equal(comm.status, 'PROJECTED');
    assert.equal(comm.commission_amount_cents, 590);
    state.commissionId = comm.id;

    // Próximo pagamento NÃO deve incluir PROJECTED no valor líquido elegível!
    const currentYM = CommissionFinance.getCurrentYM();
    const forecast = await req('GET', `/api/v1/admin/finance/payouts/next?competence_month=${currentYM}&representative_id=${state.repApprovedId}`, {
        token: adminToken
    });
    assert.equal(forecast.status, 200);
    assert.equal(forecast.json.summary.next_payout_net_cents, 0, 'Comissões PROJECTED não podem entrar no próximo pagamento');
    // 3 ativações pendentes dos testes 06/07 + 1 cobrança PIX pendente deste teste = 4 * 590 = 2360 centavos projetados
    assert.equal(forecast.json.summary.projected_cents, 2360, 'Todas as 4 comissões PROJECTED devem aparecer separadas em projected_cents');
});

test('09, 10, 11 & 26. Pagamento PIX confirmado, webhook repetido (idempotência), comissão gerada 1 única vez e sincronização', async () => {
    const syncBefore = (await req('GET', '/api/v1/admin/sync/status', { token: adminToken })).json.sync_version;

    // Confirmar pagamento via Webhook AbacatePay com secret válido
    const webhookPayload = {
        event: 'billing.paid',
        data: {
            billing: { id: state.pixAbacateId, status: 'PAID' },
            metadata: { charge_id: state.pixChargeId }
        }
    };
    const wh1 = await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=test_webhook_secret_v2', {
        body: webhookPayload
    });
    assert.equal(wh1.status, 200);

    // Verificar sincronização imediata (Cenário 26)
    const syncAfter = (await req('GET', '/api/v1/admin/sync/status', { token: adminToken })).json;
    assert.ok(syncAfter.sync_version > syncBefore, 'sync_version deve incrementar após confirmação de pagamento');
    assert.ok(syncAfter.recent_events.some(e => e.event_type === 'PAYMENT_CONFIRMED'), 'Evento PAYMENT_CONFIRMED deve existir em sync_events');

    // Re-enviar EXATAMENTE o mesmo webhook 2 vezes (Cenário 10: idempotência)
    const wh2 = await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=test_webhook_secret_v2', { body: webhookPayload });
    const wh3 = await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=test_webhook_secret_v2', { body: webhookPayload });
    assert.equal(wh2.status, 200);
    assert.equal(wh3.status, 200);

    // Verificar comissão gerada UMA ÚNICA VEZ e promovida para CONFIRMED (Cenário 11)
    const comms = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).all(state.pixChargeId);
    assert.equal(comms.length, 1, 'Webhook repetido jamais pode duplicar comissão');
    assert.equal(comms[0].status, 'CONFIRMED');
    assert.equal(comms[0].commission_amount_cents, 590);

    // Webhook com secret inválido deve ser rejeitado (401)
    const badWh = await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=secret_errado', { body: webhookPayload });
    assert.equal(badWh.status, 401);
});

test('12. Comissão de R$ 5,90 (centavos inteiros), arredondamento exato e política versionada R$ 59,90 sem recalcular histórico', async () => {
    // Testes de precisão / arredondamento em centavos inteiros
    const s4990 = CommissionFinance.calculateExactSplitCents(4990, 50);
    assert.equal(s4990.workshop_split_cents, 2495);
    assert.equal(s4990.platform_split_cents, 2495);
    assert.equal(s4990.workshop_split_cents + s4990.platform_split_cents, 4990);

    const s5990 = CommissionFinance.calculateExactSplitCents(5990, 50);
    assert.equal(s5990.workshop_split_cents, 2995);
    assert.equal(s5990.platform_split_cents, 2995);
    assert.equal(s5990.workshop_split_cents + s5990.platform_split_cents, 5990);

    // Valor ímpar (5991 centavos): soma dos splits conserva 100% do centavo sem drift de float
    const sOdd = CommissionFinance.calculateExactSplitCents(5991, 50);
    assert.equal(sOdd.workshop_split_cents + sOdd.platform_split_cents, 5991);

    // Conferir histórico anterior (R$ 49,90) antes de ativar política R$ 59,90
    const histBefore = db.prepare(`SELECT registration_amount_cents, workshop_split_cents, platform_split_cents, commission_amount_cents FROM representative_commissions WHERE id = ?`).get(state.commissionId);
    assert.equal(histBefore.registration_amount_cents, 4990);
    assert.equal(histBefore.commission_amount_cents, 590);

    // Ativar política R$ 59,90 para futuras operações
    const actPol = await req('POST', `/api/v1/admin/commercial-policies/${state.policyV2Id}/activate`, { token: adminToken });
    assert.equal(actPol.status, 200);
    assert.equal(actPol.json.policy.registration_price_cents, 5990);

    // Transação histórica NÃO foi recalculada!
    const histAfter = db.prepare(`SELECT registration_amount_cents, workshop_split_cents, platform_split_cents, commission_amount_cents FROM representative_commissions WHERE id = ?`).get(state.commissionId);
    assert.deepEqual(histAfter, histBefore, 'Ativar nova política comercial jamais pode recalcular histórico');

    // Novo PIX criado agora usa automaticamente a nova política R$ 59,90 (29,95 / 29,95 / 5,90)
    const veh2 = db.prepare(`SELECT id FROM vehicles WHERE license_plate = 'V2A1002'`).get();
    const pix2 = await req('POST', `/api/v1/billing/workshop/${state.workshopId}/pix-charge`, {
        token: state.workshopToken,
        body: { vehicle_id: veh2.id, activation_code: 'DNA-V2-002', charge_type: 'SINGLE' }
    });
    assert.equal(pix2.status, 201);
    assert.equal(pix2.json.charge.customer_price_cents, 5990);
    assert.equal(pix2.json.charge.amount_cents, 2995);
    assert.equal(pix2.json.charge.workshop_profit_cents, 2995);
    state.pixChargeRefundId = pix2.json.charge.id;
    state.pixAbacateRefundId = pix2.json.charge.abacate_id;

    // Restaurar política V1 (49,90) ao final para manter compatibilidade com suíte legada
    const restorePol = await req('POST', `/api/v1/admin/commercial-policies/${state.historicalPolicyId}/activate`, { token: adminToken });
    assert.equal(restorePol.status, 200);
});

test('13 & 14. Comissão dentro dos 24 meses (válida) vs fora do prazo contratual (>24 meses bloqueada)', async () => {
    // 13: Dentro dos 24 meses (evento atual já validado)
    const validCheck = CommissionFinance.validateCommissionEligibility(db, {
        workshopId: state.workshopId,
        sourcePaymentId: 'pay_eligibility_ok',
        eventDateIso: new Date().toISOString(),
        isPaymentConfirmed: true
    });
    assert.equal(validCheck.eligible, true);

    // 14: Fora do prazo contratual (> 24 meses no futuro após valid_until)
    const refRow = db.prepare(`SELECT valid_until FROM workshop_referrals WHERE workshop_id = ?`).get(state.workshopId);
    const futureAfterExpiry = new Date(new Date(refRow.valid_until.replace(' ', 'T') + 'Z').getTime() + 48 * 3600 * 1000).toISOString();
    const expiredCheck = CommissionFinance.validateCommissionEligibility(db, {
        workshopId: state.workshopId,
        sourcePaymentId: 'pay_eligibility_expired',
        eventDateIso: futureAfterExpiry,
        isPaymentConfirmed: true
    });
    assert.equal(expiredCheck.eligible, false);
    assert.equal(expiredCheck.reason, 'REFERRAL_CONTRACT_EXPIRED');
});

test('15. Pagamento estornado altera comissão para REFUNDED (e estorno pós-PAID cria ajuste CLAWBACK)', async () => {
    // Confirmar PIX 2 e depois estornar via webhook
    await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=test_webhook_secret_v2', {
        body: { event: 'billing.paid', data: { billing: { id: state.pixAbacateRefundId }, metadata: { charge_id: state.pixChargeRefundId } } }
    });
    let comm2 = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(state.pixChargeRefundId);
    assert.equal(comm2.status, 'CONFIRMED');

    const refundWh = await req('POST', '/api/v1/billing/webhook/abacatepay?webhookSecret=test_webhook_secret_v2', {
        body: { event: 'billing.refunded', data: { billing: { id: state.pixAbacateRefundId }, metadata: { charge_id: state.pixChargeRefundId } } }
    });
    assert.equal(refundWh.status, 200);

    comm2 = db.prepare(`SELECT * FROM representative_commissions WHERE source_payment_id = ?`).get(state.pixChargeRefundId);
    assert.equal(comm2.status, 'REFUNDED', 'Comissão deve mudar para REFUNDED após estorno');

    // Testar estorno pós-pagamento (clawback automático) em um registro simulado já PAID
    const paidCommId = 'rcom_clawback_test';
    db.prepare(`
        INSERT INTO representative_commissions (
            id, representative_id, workshop_id, source_payment_id, registration_amount_cents,
            workshop_split_cents, platform_split_cents, commission_amount_cents, status,
            competence_month, payout_month, confirmed_at, paid_at
        ) VALUES (?, ?, ?, 'pay_clawback_src', 4990, 2495, 2495, 590, 'PAID', '2026-08', '2026-09', '2026-08-15 10:00:00', '2026-09-10 10:00:00')
    `).run(paidCommId, state.repApprovedId, state.workshopId);

    const clawRes = CommissionFinance.refundCommissionByPayment(db, {
        sourcePaymentId: 'pay_clawback_src',
        reason: 'Chargeback após repasse já liquidado',
        actorId: 'usr_admin'
    });
    assert.equal(clawRes.commission.status, 'REFUNDED');
    assert.ok(clawRes.clawbackAdjustment, 'Estorno após PAID deve criar ajuste CLAWBACK negativo');
    assert.equal(clawRes.clawbackAdjustment.amount_cents, -590);

    // Remover o ajuste de teste para não afetar o valor líquido limpo dos cenários 17-20
    db.prepare(`DELETE FROM financial_adjustments WHERE id = ?`).run(clawRes.clawbackAdjustment.id);
    db.prepare(`DELETE FROM representative_commissions WHERE id = ?`).run(paidCommId);
});

// ==============================================================================
// CENÁRIOS 16 A 21 — COMPETÊNCIAS, PREVISÃO, FECHAMENTO E PAGAMENTO AUDITADO
// ==============================================================================

test('16. Comissão de competência anterior contabilizada como vencida/em aberto', async () => {
    db.prepare(`
        INSERT INTO representative_commissions (
            id, representative_id, workshop_id, source_payment_id, registration_amount_cents,
            workshop_split_cents, platform_split_cents, commission_amount_cents, status,
            competence_month, payout_month, confirmed_at
        ) VALUES ('rcom_prev_comp', ?, ?, 'pay_prev_2026_09', 4990, 2495, 2495, 590, 'CONFIRMED', '2026-09', '2026-10', '2026-09-15 12:00:00')
    `).run(state.repApprovedId, state.workshopId);

    const finOv = await req('GET', `/api/v1/admin/finance/overview?competence_month=2026-11`, { token: adminToken });
    assert.equal(finOv.status, 200);
    assert.ok(finOv.json.commissions.overdue_cents >= 590, 'Comissão de competência anterior (2026-09) deve constar em overdue_cents');
    assert.ok(finOv.json.commissions.overdue_count >= 1);
});

test('17. Previsão do próximo mês (competência 2026-11 -> ciclo de pagamento 2026-12)', async () => {
    // Forçar competência da comissão confirmada principal para 2026-11 e adicionar 1 PROJECTED na mesma competência
    db.prepare(`UPDATE representative_commissions SET competence_month = '2026-11', payout_month = '2026-12' WHERE id = ?`).run(state.commissionId);
    db.prepare(`
        INSERT INTO representative_commissions (
            id, representative_id, workshop_id, source_payment_id, registration_amount_cents,
            workshop_split_cents, platform_split_cents, commission_amount_cents, status,
            competence_month, payout_month
        ) VALUES ('rcom_proj_nov', ?, ?, 'pay_proj_2026_11', 4990, 2495, 2495, 590, 'PROJECTED', '2026-11', '2026-12')
    `).run(state.repApprovedId, state.workshopId);

    const nextRes = await req('GET', '/api/v1/admin/finance/payouts/next?competence_month=2026-11', { token: adminToken });
    assert.equal(nextRes.status, 200);
    assert.equal(nextRes.json.competence_month, '2026-11');
    assert.equal(nextRes.json.payout_month, '2026-12');
    assert.equal(nextRes.json.scheduled_payout_date, '2026-12-10');
    assert.equal(nextRes.json.summary.next_payout_net_cents, 590, 'Apenas comissões CONFIRMED entram no próximo pagamento');
    assert.ok(nextRes.json.summary.projected_cents >= 590 && nextRes.json.summary.projected_cents % 590 === 0, 'Projetadas aparecem separadas e não entram no líquido elegível');
    assert.equal(nextRes.json.can_close, true);
    // Demonstrativo completo em árvore
    const repRow = nextRes.json.representatives.find(r => r.representative_id === state.repApprovedId);
    assert.ok(repRow && repRow.workshops.length >= 1 && repRow.workshops[0].items.length >= 1);
});

test('18 & 19. Fechamento atômico do ciclo e bloqueio de fechamento duplicado (409)', async () => {
    const close1 = await req('POST', '/api/v1/admin/finance/payouts/close', {
        token: adminToken,
        body: { competence_month: '2026-11', notes: 'Fechamento oficial homologação novembro/2026' }
    });
    assert.equal(close1.status, 201);
    assert.equal(close1.json.cycle.competence_month, '2026-11');
    assert.equal(close1.json.cycle.payout_month, '2026-12');
    assert.equal(close1.json.cycle.net_amount_cents, 590);
    assert.equal(close1.json.batches.length, 1);
    state.batchId = close1.json.batches[0].id;

    // Tentativa de fechamento duplicado na mesma competência (Cenário 19)
    const close2 = await req('POST', '/api/v1/admin/finance/payouts/close', {
        token: adminToken,
        body: { competence_month: '2026-11', notes: 'Tentativa duplicada' }
    });
    assert.equal(close2.status, 409, 'Fechamento duplicado deve retornar HTTP 409');
    assert.equal(close2.json.code, 'CYCLE_ALREADY_CLOSED');
});

test('20 & 21. Pagamento marcado como realizado (manual auditado) e bloqueio de pagamento duplicado (409)', async () => {
    // Sem referência de comprovante deve retornar 400
    const missingRef = await req('POST', `/api/v1/admin/finance/payouts/${state.batchId}/mark-paid`, {
        token: adminToken,
        body: { transfer_date: '2026-12-10' }
    });
    assert.equal(missingRef.status, 400);

    // Registro administrativo válido
    const pay1 = await req('POST', `/api/v1/admin/finance/payouts/${state.batchId}/mark-paid`, {
        token: adminToken,
        body: {
            transfer_reference: 'PIX-E2E-20261210-AUDIT-001',
            transfer_date: '2026-12-10',
            payment_notes: 'Transferido via banco corporativo DNA AUTO'
        }
    });
    assert.equal(pay1.status, 200);
    assert.equal(pay1.json.batch.status, 'PAID');
    assert.equal(pay1.json.commissions_marked_paid, 1);
    assert.equal(pay1.json.cycle_fully_paid, true);

    // Confirmar que a comissão foi atualizada para PAID e a PROJECTED continuou PROJECTED
    const cPaid = db.prepare(`SELECT status, paid_at FROM representative_commissions WHERE id = ?`).get(state.commissionId);
    assert.equal(cPaid.status, 'PAID');
    assert.ok(cPaid.paid_at);
    const cProj = db.prepare(`SELECT status FROM representative_commissions WHERE id = 'rcom_proj_nov'`).get();
    assert.equal(cProj.status, 'PROJECTED');

    // Tentativa de pagamento duplicado no mesmo lote (Cenário 21)
    const pay2 = await req('POST', `/api/v1/admin/finance/payouts/${state.batchId}/mark-paid`, {
        token: adminToken,
        body: { transfer_reference: 'PIX-DUPLICADO-002', transfer_date: '2026-12-11' }
    });
    assert.equal(pay2.status, 409, 'Pagamento duplicado deve retornar HTTP 409');
    assert.equal(pay2.json.code, 'BATCH_ALREADY_PAID');

    // Histórico e auditoria financeira refletem o fechamento e pagamento
    const hist = await req('GET', '/api/v1/admin/finance/payouts/history', { token: adminToken });
    assert.equal(hist.status, 200);
    assert.ok(hist.json.batches.some(b => b.id === state.batchId && b.status === 'PAID'));

    const finAudit = await req('GET', '/api/v1/admin/audit/financial', { token: adminToken });
    assert.equal(finAudit.status, 200);
    assert.ok(finAudit.json.representative_audit.some(a => a.action === 'PAYOUT_BATCH_PAID'));
});

// ==============================================================================
// CENÁRIOS 22 A 24 — SEGURANÇA RBAC ESTRITA
// ==============================================================================

test('22. Representante não pode acessar outro representante nem o financeiro global', async () => {
    const tryOtherRep = await req('GET', `/api/v1/admin/representatives/${state.repApprovedId}/overview`, { token: state.repSecondToken });
    assert.equal(tryOtherRep.status, 403);

    const tryGlobalFin = await req('GET', '/api/v1/admin/finance/overview', { token: state.repSecondToken });
    assert.equal(tryGlobalFin.status, 403);

    const tryRepAdminList = await req('GET', '/api/v1/representatives/admin/representatives', { token: state.repSecondToken });
    assert.equal(tryRepAdminList.status, 403);

    // Mas acessa o próprio painel /me normalmente
    const ownMe = await req('GET', '/api/v1/representatives/me', { token: state.repSecondToken });
    assert.equal(ownMe.status, 200);
    assert.equal(ownMe.json.representative.id, state.repSecondId);
});

test('23. Oficina tentando acessar dados administrativos recebe 403', async () => {
    const r1 = await req('GET', '/api/v1/admin/dashboard/overview', { token: state.workshopToken });
    assert.equal(r1.status, 403);
    const r2 = await req('GET', '/api/v1/admin/finance/payouts/next', { token: state.workshopToken });
    assert.equal(r2.status, 403);
    const r3 = await req('POST', '/api/v1/admin/finance/payouts/close', {
        token: state.workshopToken,
        body: { competence_month: '2026-10' }
    });
    assert.equal(r3.status, 403);
});

test('24. Usuário não autenticado e tentativas de bypass (X-Demo-User-Id / token fake) recebem 401', async () => {
    const noAuth = await req('GET', '/api/v1/admin/dashboard/overview');
    assert.equal(noAuth.status, 401);

    const demoBypass = await req('GET', '/api/v1/admin/dashboard/overview', {
        headers: { 'X-Demo-User-Id': 'usr_admin' }
    });
    assert.equal(demoBypass.status, 401, 'Header X-Demo-User-Id não pode burlar rotas administrativas');

    const fakeToken = await req('GET', '/api/v1/admin/network-stats', {
        token: 'sess_admin_usr_admin'
    });
    assert.equal(fakeToken.status, 401, 'Token fake sem assinatura JWT deve ser rejeitado');
});

// ==============================================================================
// CENÁRIOS 25, 27, 28 — SINCRONIZAÇÃO, INDISPONIBILIDADE API & INTEGRIDADE MIGRAÇÃO
// ==============================================================================

test('25. Sincronização imediata após novo cadastro no dashboard administrativo sem reiniciar servidor', async () => {
    const before = (await req('GET', '/api/v1/admin/dashboard/overview', { token: adminToken })).json;
    const beforeWorkshops = before.cards.total_workshops;

    const newWs = await req('POST', '/api/v1/auth/register-workshop', {
        body: {
            trade_name: 'Oficina Sync Tempo Real',
            cnpj: '33.444.555/0001-66',
            phone: '(11) 95555-7777',
            email: 'sync.ws@dnaauto.test',
            city: 'Santos',
            state: 'SP',
            password: 'WsPassword123!'
        }
    });
    assert.equal(newWs.status, 201);

    const after = (await req('GET', '/api/v1/admin/dashboard/overview', { token: adminToken })).json;
    assert.equal(after.cards.total_workshops, beforeWorkshops + 1, 'Dashboard deve refletir imediatamente a nova oficina sem reiniciar servidor');
});

test('27. Indisponibilidade temporária da API exibe aviso claro de desconexão e não mascara com cache antigo', async () => {
    // Carrega AdminSync e AdminView em VM sandbox simulando erro de rede na API
    const elements = new Map();
    const makeEl = (id) => {
        const classes = new Set();
        const el = {
            id,
            innerHTML: '',
            textContent: '',
            style: { display: '' },
            disabled: false,
            dataset: {},
            classList: {
                add: (...c) => c.forEach(x => classes.add(x)),
                remove: (...c) => c.forEach(x => classes.delete(x)),
                toggle: (c, force) => (force === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (force ? classes.add(c) : classes.delete(c))),
                contains: (c) => classes.has(c)
            }
        };
        elements.set(id, el);
        return el;
    };

    const viewContent = makeEl('view-content');
    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {},
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        document: {
            hidden: false,
            body: { classList: makeEl('body').classList, appendChild: () => {} },
            getElementById: (id) => elements.get(id) || (id === 'adm-screen-body' ? makeEl(id) : (id.startsWith('adm-') ? makeEl(id) : null)),
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            createElement: () => makeEl('dyn')
        },
        API: {
            token: 'fake.jwt.tok',
            baseUrl: '/api/v1',
            getAdminDashboardOverview: async () => { throw new Error('Failed to fetch: ECONNREFUSED'); },
            getAdminDashboardTimeseries: async () => { throw new Error('Failed to fetch: ECONNREFUSED'); }
        },
        App: { currentUser: { name: 'Admin Teste' }, logout: () => {}, switchView: () => {} }
    };
    sandbox.window = sandbox;

    const ctx27 = vm.createContext(sandbox);
    const loadScript = (rel, exportName) => {
        const code = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
        vm.runInContext(`${code}\nthis.${exportName} = ${exportName};`, ctx27, { filename: rel });
    };
    loadScript('public/js/components/admin/adminCharts.js', 'AdminCharts');
    loadScript('public/js/components/admin/adminSync.js', 'AdminSync');
    loadScript('public/js/components/admin/adminScreensCore.js', 'AdminScreensCore');
    loadScript('public/js/components/adminView.js', 'AdminView');

    // Simular mount e erro de rede
    sandbox.AdminView.render('dashboard');
    await new Promise(r => setTimeout(r, 30));

    assert.equal(sandbox.AdminSync.connectionState, 'OFFLINE', 'AdminSync deve entrar em estado OFFLINE');
    const banner = elements.get('adm-offline-banner');
    assert.equal(banner.style.display, 'flex', 'Banner de desconexão deve ser exibido');
    const body = elements.get('adm-screen-body');
    assert.match(body.innerHTML, /Falha ao consultar dados atualizados da API/i, 'Tela deve alertar falha da API sem exibir cache antigo');
    sandbox.AdminView.destroy();
});

test('28. Integridade do banco após migração (idempotência + constraints + zero multiplicação por JOIN)', async () => {
    const countBefore = db.prepare(`SELECT COUNT(*) as cnt FROM representative_commissions`).get().cnt;
    // Executar migração novamente deve ser 100% idempotente e preservar registros
    runAdminCentralV2Migration(db);
    const countAfter = db.prepare(`SELECT COUNT(*) as cnt FROM representative_commissions`).get().cnt;
    assert.equal(countAfter, countBefore, 'Migração idempotente deve preservar 100% dos registros');

    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map(r => r.name);
    for (const required of ['commercial_policies', 'commission_payout_cycles', 'commission_payout_batches', 'commission_payout_items', 'financial_adjustments', 'sync_events', 'admin_system_settings', 'schema_migrations']) {
        assert.ok(tables.includes(required), `Tabela obrigatória ${required} deve existir`);
    }

    // Verificar ausência de multiplicação por JOIN em /admin/network-stats quando há múltiplos DNAs e múltiplas OS na mesma oficina
    const v1 = db.prepare(`SELECT id FROM vehicles WHERE license_plate = 'V2A1001'`).get();
    const v2 = db.prepare(`SELECT id FROM vehicles WHERE license_plate = 'V2A1002'`).get();
    db.prepare(`INSERT OR IGNORE INTO vehicle_dna (id, vehicle_id, dna_code, status, activated_by_workshop_id, activation_fee_cents) VALUES ('vdna_j1', ?, 'DNA-J1', 'ACTIVE', ?, 4990)`).run(v1.id, state.workshopId);
    db.prepare(`INSERT OR IGNORE INTO vehicle_dna (id, vehicle_id, dna_code, status, activated_by_workshop_id, activation_fee_cents) VALUES ('vdna_j2', ?, 'DNA-J2', 'ACTIVE', ?, 4990)`).run(v2.id, state.workshopId);
    db.prepare(`INSERT INTO service_records (id, vehicle_id, workshop_id, service_date, mileage, category, service_title, description, proof_level, total_cost_cents) VALUES ('sr_j1', ?, ?, '2026-11-10', 20000, 'REVISAO', 'Revisão Teste 1', 'Descrição revisão teste 1', 4, 50000)`).run(v1.id, state.workshopId);
    db.prepare(`INSERT INTO service_records (id, vehicle_id, workshop_id, service_date, mileage, category, service_title, description, proof_level, total_cost_cents) VALUES ('sr_j2', ?, ?, '2026-11-11', 21000, 'FREIOS', 'Freios Teste 2', 'Descrição freios teste 2', 4, 30000)`).run(v2.id, state.workshopId);

    const netStats = await req('GET', '/api/v1/admin/network-stats', { token: adminToken });
    assert.equal(netStats.status, 200);
    const wsRow = netStats.json.growthByWorkshops.find(w => w.id === state.workshopId);
    assert.ok(wsRow);
    assert.equal(wsRow.total_services_amount_cents, 80000, 'Soma de serviços não pode ser multiplicada pelo número de DNAs (80000, não 160000)');
});

// ==============================================================================
// CENÁRIOS 29 & 30 — COMPATIBILIDADE APPS & INTERFACE RESPONSIVA DESKTOP/MOBILE
// ==============================================================================

test('29. Compatibilidade total dos aplicativos existentes (/cliente, /oficina, /representante, /)', async () => {
    const routes = ['/', '/cliente', '/oficina', '/representante', '/api/v1/health', '/api/v1/workshops/network'];
    for (const r of routes) {
        const res = await req('GET', r);
        assert.equal(res.status, 200, `Rota ${r} deve responder HTTP 200`);
    }
    const indexRes = await req('GET', '/');
    assert.match(indexRes.text, /admin-v2\.css/, 'index.html deve carregar admin-v2.css');
    assert.match(indexRes.text, /adminScreensFinance\.js/, 'index.html deve carregar os módulos da Central Admin V2');
});

test('30. Interface responsiva desktop/mobile, sidebar recolhível, drawer mobile e renderização de todas as 26 telas + 2 detalhes', async () => {
    // 1. Validar regras CSS responsivas desktop/tablet/mobile
    const cssText = fs.readFileSync(path.resolve(__dirname, '../public/css/admin-v2.css'), 'utf8');
    assert.match(cssText, /\.adm-shell\.sidebar-collapsed\s+\.adm-sidebar/, 'CSS deve suportar sidebar recolhível');
    assert.match(cssText, /@media\s*\(max-width:\s*960px\)/, 'CSS deve possuir breakpoint mobile drawer (960px)');
    assert.match(cssText, /\.adm-shell\.drawer-open\s+\.adm-sidebar/, 'CSS deve suportar drawer mobile');
    assert.match(cssText, /@media\s*\(max-width:\s*560px\)/, 'CSS deve possuir breakpoint compacto (560px)');

    // 2. Carregar todos os scripts Admin V2 em VM sandbox apontando para a API real (servidor de testes)
    const elements = new Map();
    const makeEl = (id) => {
        const classes = new Set();
        const el = {
            id,
            innerHTML: '',
            textContent: '',
            style: { display: '' },
            disabled: false,
            dataset: {},
            classList: {
                add: (...c) => c.forEach(x => classes.add(x)),
                remove: (...c) => c.forEach(x => classes.delete(x)),
                toggle: (c, force) => (force === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (force ? classes.add(c) : classes.delete(c))),
                contains: (c) => classes.has(c)
            }
        };
        elements.set(id, el);
        return el;
    };
    const storage = new Map();
    makeEl('view-content');
    const bodyEl = makeEl('body');

    const sandbox = {
        console,
        fetch,
        URLSearchParams,
        FormData,
        setTimeout,
        clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {},
        localStorage: {
            getItem: (k) => storage.get(k) || null,
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k)
        },
        document: {
            hidden: false,
            body: { classList: bodyEl.classList, appendChild: () => {} },
            getElementById: (id) => elements.get(id) || makeEl(id),
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            createElement: () => makeEl('dyn')
        },
        App: { currentUser: { name: 'Admin Homologação' }, logout: () => {}, switchView: () => {} }
    };
    sandbox.window = { location: { hostname: '127.0.0.1' } };

    const ctx30 = vm.createContext(sandbox);
    const loadScript = (rel, exportName) => {
        const code = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
        vm.runInContext(`${code}\nthis.${exportName} = ${exportName};`, ctx30, { filename: rel });
    };
    loadScript('public/js/api.js', 'API');
    sandbox.API.baseUrl = `${baseUrl}/api/v1`;
    sandbox.API.setToken(adminToken);

    loadScript('public/js/components/admin/adminCharts.js', 'AdminCharts');
    loadScript('public/js/components/admin/adminSync.js', 'AdminSync');
    loadScript('public/js/components/admin/adminScreensCore.js', 'AdminScreensCore');
    loadScript('public/js/components/admin/adminScreensCommercial.js', 'AdminScreensCommercial');
    loadScript('public/js/components/admin/adminScreensFinance.js', 'AdminScreensFinance');
    loadScript('public/js/components/admin/adminScreensOps.js', 'AdminScreensOps');
    loadScript('public/js/components/adminView.js', 'AdminView');

    // Validar exatamente os 6 grupos e 26 itens do menu da Fase 2
    assert.equal(sandbox.AdminView.MENU_GROUPS.length, 6, 'Menu lateral deve ter exatamente 6 seções');
    const allScreenIds = sandbox.AdminView.MENU_GROUPS.flatMap(g => g.items.map(i => i.id));
    assert.equal(allScreenIds.length, 26, 'Menu lateral deve ter exatamente 26 telas');

    // Testar render inicial, recolhimento de sidebar desktop e abertura de drawer mobile
    const shellEl = makeEl('adm-shell');
    makeEl('adm-screen-body');
    sandbox.AdminView.render('dashboard');
    assert.equal(bodyEl.classList.contains('is-admin-v2'), true);

    sandbox.AdminView.toggleSidebarCollapse();
    assert.equal(sandbox.AdminView.sidebarCollapsed, true);
    assert.equal(shellEl.classList.contains('sidebar-collapsed'), true);

    sandbox.AdminView.toggleDrawer(true);
    assert.equal(sandbox.AdminView.drawerOpen, true);
    assert.equal(shellEl.classList.contains('drawer-open'), true);

    // Renderizar TODAS as 26 telas do menu + 2 telas de detalhe contra a API real!
    for (const screenId of allScreenIds) {
        sandbox.AdminView.currentScreen = screenId;
        sandbox.AdminView.currentParams = {};
        await sandbox.AdminView.loadScreen();
        const html = elements.get('adm-screen-body').innerHTML;
        assert.ok(html && html.length > 80, `Tela ${screenId} deve renderizar conteúdo real`);
        assert.doesNotMatch(html, /Falha ao consultar dados atualizados da API/i, `Tela ${screenId} não pode falhar`);
    }

    // Renderizar tela individual do representante (7 blocos) e detalhe da oficina
    for (const subtab of ['personal', 'portfolio', 'clients', 'productivity', 'financial', 'next_payout', 'history']) {
        sandbox.AdminView.currentScreen = 'representative-detail';
        sandbox.AdminView.currentParams = { id: state.repApprovedId, subtab };
        await sandbox.AdminView.loadScreen();
        const html = elements.get('adm-screen-body').innerHTML;
        assert.doesNotMatch(html, /Falha ao consultar dados atualizados da API/i, `Subtab ${subtab} do representante não pode falhar`);
    }

    sandbox.AdminView.currentScreen = 'workshop-detail';
    sandbox.AdminView.currentParams = { id: state.workshopId };
    await sandbox.AdminView.loadScreen();
    const wsHtml = elements.get('adm-screen-body').innerHTML;
    assert.match(wsHtml, /Auto Center Precisão Campinas/i);
    assert.match(wsHtml, /João Multiproprietário/i);

    sandbox.AdminView.destroy();
});
