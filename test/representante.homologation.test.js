'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server/src/server');
const db = require('../server/src/database/db');

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let data = raw;
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch (_e) {
            // HTML or plain text
          }
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('HOMOLOGAÇÃO OFICIAL — 20 CENÁRIOS OBRIGATÓRIOS DO PORTAL DE REPRESENTANTES DNA AUTO', async (t) => {
  let repAToken = '';
  let repACode = '';
  let repAId = '';
  let repBToken = '';
  let repBCode = '';
  let workshopToken = '';
  let workshopId = '';
  let inviteToken = '';
  let confirmedChargeId = '';
  let pendingChargeId = '';

  const uniqueSuffix = Date.now().toString().slice(-6);
  const workshopCnpj = `345678900001${uniqueSuffix.slice(0, 2)}`;
  const workshopEmail = `oficina.indicada.${uniqueSuffix}@dnaauto.com.br`;
  const workshopPhone = `2198877${uniqueSuffix.slice(0, 4)}`;

  await t.test('Pré-requisito: Login do Representante Demo (REP000123) e cadastro de um 2º Representante (Isolamento)', async () => {
    const loginRes = await request('POST', '/api/v1/representatives/login', {
      email: 'representante@dnaauto.com.br',
      password: 'rep123456'
    });
    assert.equal(loginRes.status, 200, 'Login do representante demo deve retornar 200');
    assert.ok(loginRes.data.token, 'Deve retornar token JWT do representante');
    assert.equal(loginRes.data.representative.rep_code, 'REP000123');
    repAToken = loginRes.data.token;
    repACode = loginRes.data.representative.rep_code;
    repAId = loginRes.data.representative.id;

    const regB = await request('POST', '/api/v1/representatives/register', {
      full_name: 'Representante Segundo Isolado',
      cpf_cnpj: `123456789${uniqueSuffix.slice(0, 2)}`,
      email: `rep.b.${uniqueSuffix}@dnaauto.com.br`,
      phone: `1197766${uniqueSuffix.slice(0, 4)}`,
      city_state: 'São Paulo / SP',
      pix_key: `rep.b.${uniqueSuffix}@dnaauto.com.br`,
      password: 'repBpassword123'
    });
    assert.equal(regB.status, 201, 'Cadastro do segundo representante deve retornar 201');
    repBToken = regB.data.token;
    repBCode = regB.data.representative.rep_code;
    assert.match(repBCode, /^REP\d{6}$/);
  });

  await t.test('1. Representante tentando entrar no aplicativo da oficina: acesso bloqueado (403)', async () => {
    // Tentativa de login no contexto WORKSHOP com credenciais de representante
    const loginWorkshopApp = await request('POST', '/api/v1/auth/login', {
      email: 'representante@dnaauto.com.br',
      password: 'rep123456',
      app_context: 'WORKSHOP'
    });
    assert.equal(loginWorkshopApp.status, 403);
    assert.ok(['REPRESENTATIVE_APP_ACCESS_DENIED', 'REPRESENTATIVE_ROLE_ISOLATION'].includes(loginWorkshopApp.data.code));

    // Tentativa de usar o token do representante em endpoints operacionais da oficina
    const accessWorkshopApi = await request('GET', '/api/v1/workshops/ws_demo/dashboard', null, repAToken);
    assert.equal(accessWorkshopApi.status, 403);
    assert.equal(accessWorkshopApi.data.code, 'REPRESENTATIVE_ROLE_ISOLATION');
  });

  await t.test('2. Representante tentando entrar no aplicativo do cliente: acesso bloqueado (403)', async () => {
    const loginClientApp = await request('POST', '/api/v1/auth/login', {
      email: 'representante@dnaauto.com.br',
      password: 'rep123456',
      app_context: 'CLIENT'
    });
    assert.equal(loginClientApp.status, 403);
    assert.ok(['REPRESENTATIVE_APP_ACCESS_DENIED', 'REPRESENTATIVE_ROLE_ISOLATION'].includes(loginClientApp.data.code));

    const accessClientVehicles = await request('GET', '/api/v1/vehicles', null, repAToken);
    assert.equal(accessClientVehicles.status, 403);
    assert.equal(accessClientVehicles.data.code, 'REPRESENTATIVE_ROLE_ISOLATION');
  });

  await t.test('3. Representante tentando cadastrar oficina diretamente: operação inexistente/bloqueada (403)', async () => {
    const directReg = await request(
      'POST',
      '/api/v1/auth/register-workshop',
      {
        workshop_name: 'Oficina Proibida pelo Rep',
        cnpj: '99888777000166',
        admin_name: 'Rep Tentando',
        email: 'proibida@oficina.com.br',
        password: '123456'
      },
      repAToken
    );
    assert.equal(directReg.status, 403);
    assert.ok(
      ['REPRESENTATIVE_DIRECT_WORKSHOP_REGISTRATION_FORBIDDEN', 'REPRESENTATIVE_ROLE_ISOLATION'].includes(
        directReg.data.code
      )
    );
  });

  await t.test('4. Representante gerando e copiando seu link exclusivo e QR Code individual', async () => {
    const meRes = await request('GET', '/api/v1/representatives/me', null, repAToken);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.representative.id, repAId);
    assert.equal(meRes.data.representative.rep_code, 'REP000123');
    assert.match(meRes.data.representative.referral_link, /\/representante\/indicacao\/REP000123$/);

    const shareRes = await request('GET', '/api/v1/representatives/me/share-link', null, repAToken);
    assert.equal(shareRes.status, 200);
    assert.equal(shareRes.data.rep_code, 'REP000123');
    assert.match(shareRes.data.referral_link, /\/representante\/indicacao\/REP000123$/);
    assert.ok(shareRes.data.qr_code_payload, 'Deve retornar payload do QR Code individual');
  });

  await t.test('5. Representante compartilhando link pelo WhatsApp com mensagem oficial obrigatória', async () => {
    const shareRes = await request('GET', '/api/v1/representatives/me/share-link', null, repAToken);
    assert.equal(shareRes.status, 200);
    assert.match(shareRes.data.suggested_message, /Olá! Sou representante autorizado do DNA AUTO\./);
    assert.match(shareRes.data.suggested_message, /receber 50% do valor do cadastro/);
    assert.match(shareRes.data.suggested_message, /\/representante\/indicacao\/REP000123/);
    assert.match(shareRes.data.whatsapp_share_url, /^https:\/\/wa\.me\/\?text=/);
  });

  await t.test('6. Proprietário da oficina abrindo o link de indicação e iniciando pré-vinculação', async () => {
    const pageRes = await request('GET', `/representante/indicacao/${repACode}`);
    assert.equal(pageRes.status, 200);
    assert.equal(typeof pageRes.data, 'string');
    assert.match(pageRes.data, /Baixar ou acessar o aplicativo da oficina/i);

    const infoRes = await request('GET', `/api/v1/representatives/indicacao/${repACode}/info`);
    assert.equal(infoRes.status, 200);
    assert.equal(infoRes.data.representative.rep_code, repACode);

    const startRes = await request('POST', `/api/v1/representatives/indicacao/${repACode}/start-onboarding`, {
      workshop_name: 'Oficina Estrela Homologação',
      cnpj: workshopCnpj,
      email: workshopEmail,
      phone: workshopPhone,
      city_state: 'Niterói / RJ'
    });
    assert.equal(startRes.status, 201);
    assert.ok(startRes.data.invite_token, 'Deve gerar invite_token para persistência de pré-vinculação');
    assert.equal(startRes.data.redirect_url, '/oficina');
    inviteToken = startRes.data.invite_token;
  });

  await t.test('7. Proprietário instalando/abrindo o aplicativo e concluindo o cadastro da própria oficina (persistência mesmo sem parâmetros na URL)', async () => {
    // O proprietário abre o app /oficina após instalar na loja/PWA (sem precisar enviar rep_code explícito no body, pois o backend reconcilia pelo CNPJ/email/telefone pré-associado)
    const regWs = await request('POST', '/api/v1/auth/register-workshop', {
      workshop_name: 'Oficina Estrela Homologação',
      cnpj: workshopCnpj,
      phone: workshopPhone,
      address: 'Av. Roberto Silveira, 500 - Niterói / RJ',
      admin_name: 'Roberto Proprietário',
      email: workshopEmail,
      password: 'senhaProprietario123'
    });
    assert.equal(regWs.status, 201, 'Proprietário deve conseguir cadastrar sua própria oficina');
    assert.ok(regWs.data.token);
    assert.ok(regWs.data.workshop?.id);
    workshopToken = regWs.data.token;
    workshopId = regWs.data.workshop.id;
  });

  await t.test('8. Vinculação automática da oficina ao representante correto (vigência de 24 meses)', async () => {
    const referral = db.prepare('SELECT * FROM workshop_referrals WHERE workshop_id = ?').get(workshopId);
    assert.ok(referral, 'Registro em workshop_referrals deve existir automaticamente');
    assert.equal(referral.representative_id, repAId, 'Oficina deve estar vinculada ao representante REP000123');
    assert.equal(referral.rep_code, repACode);
    assert.ok(['REGISTERED', 'ACTIVE'].includes(referral.status));
    assert.ok(referral.valid_until, 'Deve possuir valid_until de 24 meses');
  });

  await t.test('9. Exibição da oficina em "Minhas Oficinas" com as 8 colunas obrigatórias e CNPJ mascarado', async () => {
    const wsList = await request('GET', '/api/v1/representatives/me/workshops', null, repAToken);
    assert.equal(wsList.status, 200);
    const found = wsList.data.items.find((w) => w.workshop_id === workshopId);
    assert.ok(found, 'Oficina recém-cadastrada deve aparecer em Minhas Oficinas');
    assert.equal(found.nome_fantasia, 'Oficina Estrela Homologação');
    assert.match(found.cnpj_mascarado, /^\d{2}\.\d{3}\.\*\*\*\/\d{4}-\d{2}$/, 'CNPJ deve estar mascarado no padrão XX.XXX.***/0001-XX');
    assert.ok(found.municipio_uf, 'Deve conter Município / UF');
    assert.ok(found.data_indicacao, 'Deve conter data da indicação');
    assert.ok(['CADASTRADA', 'ATIVA'].includes(found.situacao_ativacao), 'Deve exibir situação da ativação');
    assert.equal(typeof found.novos_cadastros_pagos, 'number');
    assert.equal(typeof found.total_comissoes_geradas_cents, 'number');
    assert.ok(found.ultima_atividade_comercial, 'Deve conter última atividade comercial relevante');
  });

  await t.test('10, 11 e 12. Novo cliente cadastrado pela oficina com pagamento de R$ 49,90 confirmado, repasse 50%/50% (R$ 24,95) e comissão de R$ 5,90 para o representante', async () => {
    const actRes = await request(
      'POST',
      `/api/v1/workshops/${workshopId}/clients/register-activation`,
      {
        full_name: 'Cliente Final Confidencial Um',
        cpf: `111222333${uniqueSuffix.slice(0, 2)}`,
        phone: '21999112233',
        email: `cliente1.${uniqueSuffix}@email.com`,
        license_plate: `RJA${uniqueSuffix.slice(0, 4)}`,
        brand: 'Honda',
        model: 'Civic',
        current_km: 45000,
        mark_as_paid: false
      },
      workshopToken
    );
    assert.equal(actRes.status, 201);
    assert.equal(actRes.data.financial_summary.gross_amount_cents, 4990, 'Valor do cadastro deve ser R$ 49,90 (4990 centavos)');
    assert.equal(actRes.data.financial_summary.workshop_amount_cents, 2495, 'Repasse de 50% da oficina deve ser R$ 24,95 (2495 centavos)');
    assert.equal(actRes.data.financial_summary.platform_gross_amount_cents, 2495, 'Parte de 50% da plataforma deve ser R$ 24,95 (2495 centavos)');
    assert.equal(actRes.data.financial_summary.representative_commission_cents, 590, 'Comissão do representante deve ser R$ 5,90 (590 centavos)');

    confirmedChargeId = actRes.data.pix_charge.id;

    // Confirma o pagamento PIX
    const confirmRes = await request('POST', `/api/v1/billing/pix/${confirmedChargeId}/confirm`, {}, workshopToken);
    assert.equal(confirmRes.status, 200);
    assert.ok(['PAID', 'CONFIRMED'].includes(confirmRes.data.charge.status));

    // Verifica a comissão confirmada no extrato do representante
    const commRes = await request('GET', '/api/v1/representatives/me/commissions', null, repAToken);
    assert.equal(commRes.status, 200);
    const comm = commRes.data.items.find((c) => c.source_payment_id === confirmedChargeId);
    assert.ok(comm, 'Comissão deve existir vinculada ao source_payment_id');
    assert.equal(comm.status, 'CONFIRMED');
    assert.equal(comm.gross_registration_cents, 4990);
    assert.equal(comm.workshop_split_cents, 2495);
    assert.equal(comm.platform_gross_split_cents, 2495);
    assert.equal(comm.commission_amount_cents, 590);
    assert.equal(comm.platform_net_split_cents, 1905, 'Comissão de R$ 5,90 sai da parte da plataforma (2495 - 590 = 1905), nunca reduzindo os R$ 24,95 da oficina');
  });

  await t.test('13. Não geração de comissão confirmada para pagamento pendente (apenas comissão prevista / PROJECTED)', async () => {
    const actPending = await request(
      'POST',
      `/api/v1/workshops/${workshopId}/clients/register-activation`,
      {
        full_name: 'Cliente Pagamento Pendente',
        cpf: `444555666${uniqueSuffix.slice(0, 2)}`,
        phone: '21988112233',
        email: `cliente.pendente.${uniqueSuffix}@email.com`,
        license_plate: `PND${uniqueSuffix.slice(0, 4)}`,
        brand: 'Toyota',
        model: 'Corolla',
        current_km: 30000,
        mark_as_paid: false
      },
      workshopToken
    );
    assert.equal(actPending.status, 201);
    pendingChargeId = actPending.data.pix_charge.id;

    const commRes = await request('GET', '/api/v1/representatives/me/commissions', null, repAToken);
    const pendingComm = commRes.data.items.find((c) => c.source_payment_id === pendingChargeId);
    assert.ok(pendingComm, 'Registro deve existir apenas como comissão prevista');
    assert.equal(pendingComm.status, 'PROJECTED', 'Pagamento não confirmado não pode gerar comissão CONFIRMED');
  });

  await t.test('14. Estorno de comissão em pagamento cancelado ou estornado (REFUNDED)', async () => {
    // Cria e confirma um pagamento e depois realiza o estorno
    const actRefund = await request(
      'POST',
      `/api/v1/workshops/${workshopId}/clients/register-activation`,
      {
        full_name: 'Cliente Estorno Teste',
        cpf: `777888999${uniqueSuffix.slice(0, 2)}`,
        phone: '21977112233',
        email: `cliente.estorno.${uniqueSuffix}@email.com`,
        license_plate: `EST${uniqueSuffix.slice(0, 4)}`,
        brand: 'Ford',
        model: 'Ka',
        current_km: 60000,
        mark_as_paid: true
      },
      workshopToken
    );
    assert.equal(actRefund.status, 201);
    const refundChargeId = actRefund.data.pix_charge.id;

    const refundRes = await request(
      'POST',
      `/api/v1/billing/pix/${refundChargeId}/refund`,
      { reason: 'Cancelamento solicitado pelo cliente' },
      workshopToken
    );
    assert.equal(refundRes.status, 200);
    assert.equal(refundRes.data.charge.status, 'REFUNDED');

    const commRes = await request('GET', '/api/v1/representatives/me/commissions', null, repAToken);
    const refundedComm = commRes.data.items.find((c) => c.source_payment_id === refundChargeId);
    assert.ok(refundedComm);
    assert.equal(refundedComm.status, 'REFUNDED', 'Comissão deve ser estornada quando o pagamento é estornado');
  });

  await t.test('15. Bloqueio de comissão após expiração do prazo de 24 meses', async () => {
    const originalReferral = db.prepare('SELECT valid_until FROM workshop_referrals WHERE workshop_id = ?').get(workshopId);

    // Simula expiração retroativa do prazo de 24 meses
    db.prepare('UPDATE workshop_referrals SET valid_until = ? WHERE workshop_id = ?').run('2020-01-01T00:00:00.000Z', workshopId);

    const actExpired = await request(
      'POST',
      `/api/v1/workshops/${workshopId}/clients/register-activation`,
      {
        full_name: 'Cliente Fora da Vigencia 24m',
        cpf: `555444333${uniqueSuffix.slice(0, 2)}`,
        phone: '21966112233',
        email: `cliente.expirado.${uniqueSuffix}@email.com`,
        license_plate: `EXP${uniqueSuffix.slice(0, 4)}`,
        brand: 'Fiat',
        model: 'Argo',
        current_km: 15000,
        mark_as_paid: true
      },
      workshopToken
    );
    assert.equal(actExpired.status, 201);
    const expiredChargeId = actExpired.data.pix_charge.id;

    const commAfterExpire = db
      .prepare('SELECT * FROM representative_commissions WHERE source_payment_id = ?')
      .get(expiredChargeId);
    assert.equal(commAfterExpire, undefined, 'Não deve gerar comissão após expiração dos 24 meses');

    // Restaura a vigência original de 24 meses para os demais testes
    db.prepare('UPDATE workshop_referrals SET valid_until = ? WHERE workshop_id = ?').run(originalReferral.valid_until, workshopId);
  });

  await t.test('16. Prevenção de duplicidade de comissão em múltiplos callbacks (Idempotência)', async () => {
    const call1 = await request('POST', `/api/v1/billing/pix/${confirmedChargeId}/confirm`, {}, workshopToken);
    const call2 = await request('POST', `/api/v1/billing/pix/${confirmedChargeId}/confirm`, {}, workshopToken);
    assert.equal(call1.status, 200);
    assert.equal(call2.status, 200);

    const countRow = db
      .prepare('SELECT COUNT(*) AS cnt FROM representative_commissions WHERE source_payment_id = ?')
      .get(confirmedChargeId);
    assert.equal(countRow.cnt, 1, 'Deve existir exatamente 1 comissão para o mesmo pagamento confirmado');
  });

  await t.test('17. Prevenção de duplicidade de oficina por CNPJ e preservação do vínculo anterior se 2º representante enviar link', async () => {
    // Tentativa de cadastrar novamente o mesmo CNPJ
    const dupWs = await request('POST', '/api/v1/auth/register-workshop', {
      workshop_name: 'Oficina Duplicada CNPJ',
      cnpj: workshopCnpj,
      admin_name: 'Outro Admin',
      email: `outro.${uniqueSuffix}@oficina.com.br`,
      password: '123456'
    });
    assert.ok([400, 409].includes(dupWs.status), 'Não deve permitir duplicidade de oficina pelo mesmo CNPJ');

    // Segundo representante tenta iniciar onboarding para o mesmo CNPJ já vinculado ao Representante A
    const secondRepAttempt = await request('POST', `/api/v1/representatives/indicacao/${repBCode}/start-onboarding`, {
      workshop_name: 'Oficina Estrela Homologação',
      cnpj: workshopCnpj,
      email: workshopEmail,
      phone: workshopPhone
    });
    assert.equal(secondRepAttempt.status, 409, 'Deve bloquear sobreposição de vínculo quando CNPJ já pertence a outra carteira');

    const refCheck = db.prepare('SELECT representative_id FROM workshop_referrals WHERE workshop_id = ?').get(workshopId);
    assert.equal(refCheck.representative_id, repAId, 'Vínculo original com o Representante A deve permanecer intacto');
  });

  await t.test('18. Isolamento entre representantes distintos (Representante B não vê oficinas nem comissões do Representante A)', async () => {
    const repBWorkshops = await request('GET', '/api/v1/representatives/me/workshops', null, repBToken);
    assert.equal(repBWorkshops.status, 200);
    const leaked = repBWorkshops.data.items.find((w) => w.workshop_id === workshopId);
    assert.equal(leaked, undefined, 'Representante B jamais pode ver oficina da carteira do Representante A');

    const repBDetailTry = await request('GET', `/api/v1/representatives/me/workshops/${workshopId}`, null, repBToken);
    assert.equal(repBDetailTry.status, 403, 'Acesso direto ao detalhe de oficina de outro representante deve retornar 403');
  });

  await t.test('19. Proteção de dados pessoais dos clientes das oficinas (LGPD — Zero PII nos endpoints do representante)', async () => {
    const wsRes = await request('GET', '/api/v1/representatives/me/workshops', null, repAToken);
    const wsDetailRes = await request('GET', `/api/v1/representatives/me/workshops/${workshopId}`, null, repAToken);
    const commRes = await request('GET', '/api/v1/representatives/me/commissions', null, repAToken);

    const serialized = JSON.stringify({
      list: wsRes.data,
      detail: wsDetailRes.data,
      commissions: commRes.data
    });

    assert.ok(!serialized.includes('Cliente Final Confidencial Um'), 'Nome do cliente final não pode vazar para o representante');
    assert.ok(!serialized.includes(`111222333${uniqueSuffix.slice(0, 2)}`), 'CPF do cliente final não pode vazar para o representante');
    assert.ok(!serialized.includes(`RJA${uniqueSuffix.slice(0, 4)}`), 'Placa do veículo do cliente não pode vazar para o representante');
    assert.ok(!serialized.includes(`cliente1.${uniqueSuffix}@email.com`), 'E-mail do cliente final não pode vazar para o representante');
  });

  await t.test('20. Funcionamento completo dos painéis "Minha Produtividade" (14 indicadores), "Minhas Oficinas" e Menu Sanduíche Responsivo Mobile (☰)', async () => {
    const prodRes = await request('GET', '/api/v1/representatives/me/productivity?period=all', null, repAToken);
    assert.equal(prodRes.status, 200);
    const ind = prodRes.data.indicators;
    const mandatory14Keys = [
      'oficinas_indicadas',
      'convites_abertos',
      'cadastros_iniciados',
      'oficinas_cadastradas',
      'oficinas_ativas',
      'oficinas_pendentes_ativacao',
      'oficinas_sem_movimento_30_dias',
      'total_novos_clientes_pagos',
      'cadastros_pagos_mes_atual',
      'comissoes_previstas_cents',
      'comissoes_confirmadas_cents',
      'comissoes_pagas_cents',
      'comissoes_acumuladas_cents',
      'oficinas_proximas_encerramento_24m'
    ];
    for (const key of mandatory14Keys) {
      assert.equal(typeof ind[key], 'number', `Indicador obrigatório ${key} deve ser numérico`);
    }
    assert.ok(ind.oficinas_cadastradas >= 1, 'Deve contabilizar pelo menos 1 oficina cadastrada');
    assert.ok(ind.oficinas_ativas >= 1, 'Deve contabilizar pelo menos 1 oficina ativa');
    assert.ok(ind.total_novos_clientes_pagos >= 1, 'Deve contabilizar pelo menos 1 novo cliente pago');
    assert.ok(ind.comissoes_confirmadas_cents >= 590, 'Deve contabilizar pelo menos R$ 5,90 (590 centavos) em comissões confirmadas');
    assert.ok(ind.comissoes_previstas_cents >= 590, 'Deve contabilizar pelo menos R$ 5,90 (590 centavos) em comissões previstas');

    // Verifica filtro por período (current_month)
    const prodMonthRes = await request('GET', '/api/v1/representatives/me/productivity?period=current_month', null, repAToken);
    assert.equal(prodMonthRes.status, 200);

    // Verifica renderização do portal /representante, folheto comercial e menu sanduíche responsivo
    const portalHtmlRes = await request('GET', '/representante');
    assert.equal(portalHtmlRes.status, 200);
    assert.match(portalHtmlRes.data, /id="menuToggle"/, 'Portal /representante deve possuir botão de menu sanduíche (#menuToggle)');
    assert.match(portalHtmlRes.data, /Menu Sanduíche/i, 'Portal /representante deve explicar a responsividade pelo menu sanduíche no telefone');
    assert.match(portalHtmlRes.data, /\/img\/folheto-comercial-representante\.jpg/, 'Portal deve exibir o folheto comercial oficial');
    assert.match(portalHtmlRes.data, /id="produtividade"/, 'Portal deve conter a seção Minha Produtividade');
    assert.match(portalHtmlRes.data, /id="minhas-oficinas"/, 'Portal deve conter a seção Minhas Oficinas');
    assert.match(portalHtmlRes.data, /Convidar oficina pelo WhatsApp/, 'Portal deve conter o botão Convidar oficina pelo WhatsApp');
  });
});
