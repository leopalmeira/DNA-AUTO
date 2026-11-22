import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import worker from '../src/index.mjs';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const root = path.resolve(import.meta.dirname, '../../..');
function d1Shim(sqlite) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            sql, args,
            async first() { return sqlite.prepare(sql).get(...args) || null; },
            async all() { return { results: sqlite.prepare(sql).all(...args) }; },
            async run() {
              const result = sqlite.prepare(sql).run(...args);
              return { success: true, meta: { changes: result.changes } };
            }
          };
        }
      };
    },
    async batch(statements) {
      return sqlite.transaction(() => statements.map(s => {
        const result = sqlite.prepare(s.sql).run(...s.args);
        return { success: true, meta: { changes: result.changes } };
      }))();
    }
  };
}
const sqlite = new Database(':memory:');
sqlite.exec(fs.readFileSync(path.join(root, 'server/src/database/schema.sql'), 'utf8'));
for (const [table, column, dataType] of [
  ['users', 'must_change_password', 'INTEGER NOT NULL DEFAULT 0'],
  ['vehicles', 'current_owner_id', 'TEXT'],
  ['vehicles', 'workshop_id', 'TEXT'],
  ['client_activations', 'email', 'TEXT'],
  ['service_records', 'registered_by_user_id', 'TEXT'],
  ['service_records', 'part_photo_url', 'TEXT']
]) {
  const hasColumn = sqlite.pragma('table_info("' + table + '")').some(col => col.name === column);
  if (!hasColumn) sqlite.exec('ALTER TABLE "' + table + '" ADD COLUMN "' + column + '" ' + dataType);
}
const env = {
  DB: d1Shim(sqlite),
  JWT_SECRET: 'secret-dna-auto-testes-hmac-sha256-2026-seguro-de-testes-012345',
  BOOTSTRAP_TOKEN: 'chave-temporaria-apenas-para-teste-de-integracao-d1-2026',
  ALLOWED_ORIGINS: 'https://cliente.example.pages.dev,https://oficina.example.pages.dev',
  CLIENT_BASE_URL: 'https://cliente.example.pages.dev'
};
function req(pathname, method = 'GET', body = undefined, token = null) {
  const headers = { Origin: 'https://cliente.example.pages.dev' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  return new Request('https://api.example.workers.dev/api/v1' + pathname, {
    method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body)
  });
}
async function call(path, method, data, token) {
  const res = await worker.fetch(req(path, method, data, token), env);
  const json = await res.json();
  return { status: res.status, json };
}
test('integração completa D1: bootstrap, oficina, cliente, login, serviço e histórico', async () => {
  const invalid = await call('/auth/bootstrap-admin', 'POST',
    { name: 'Admin DNA', email: 'admin@dna.test', password: 'SenhaAdministrativa@2026' });
  assert.equal(invalid.status, 403);
  const bootstrapReq = req('/auth/bootstrap-admin', 'POST', {
    name: 'Admin DNA', email: 'admin@dna.test', password: 'SenhaAdministrativa@2026'
  });
  bootstrapReq.headers.set('Authorization', 'Bearer ' + env.BOOTSTRAP_TOKEN);
  const bootstrapResp = await worker.fetch(bootstrapReq, env);
  assert.equal(bootstrapResp.status, 201, await bootstrapResp.text());
  const againReq = req('/auth/bootstrap-admin', 'POST', {
    name: 'Outro Admin', email: 'admin2@dna.test', password: 'SenhaAdministrativa@2026'
  });
  againReq.headers.set('Authorization', 'Bearer ' + env.BOOTSTRAP_TOKEN);
  assert.equal((await worker.fetch(againReq, env)).status, 409);
  const ws = await call('/auth/register-workshop', 'POST', {
    tradeName: 'Oficina Teste', email: 'oficina@dna.test', password: 'OficinaForte@2026',
    city: 'Rio de Janeiro', state: 'RJ', cnpj: '12345678000190'
  });
  assert.equal(ws.status, 201, JSON.stringify(ws.json));
  assert.ok(ws.json.workshop_id);
  const workshopId = ws.json.workshop_id;
  const workshopToken = ws.json.token;
  const goodManager = await call('/auth/verify-manager-password', 'POST',
    { password: 'OficinaForte@2026' }, workshopToken);
  assert.equal(goodManager.status, 200, JSON.stringify(goodManager.json));
  assert.equal(goodManager.json.verified, true);
  const badManager = await call('/auth/verify-manager-password', 'POST',
    { password: '123456' }, workshopToken);
  assert.equal(badManager.status, 403);

  const client = await call('/workshops/' + workshopId + '/clients/register-activation', 'POST', {
    client_name: 'Pessoa Teste', email: 'cliente@dna.test', whatsapp: '21999999999',
    license_plate: 'ABC1D23', brand: 'Marca', model: 'Modelo',
    manufacture_year: 2020, color: 'Azul'
  }, workshopToken);
  assert.equal(client.status, 201, JSON.stringify(client.json));
  assert.equal(client.json.login_ready, true);
  assert.ok(client.json.initial_password.length >= 8);
  const customerLogin = await call('/auth/login', 'POST',
    { email: 'cliente@dna.test', password: client.json.initial_password });
  assert.equal(customerLogin.status, 200, JSON.stringify(customerLogin.json));
  assert.equal(customerLogin.json.user.role_code, 'OWNER');
  assert.equal(customerLogin.json.user.vehicle.license_plate, 'ABC1D23');
  const wrong = await call('/auth/login', 'POST',
    { email: 'cliente@dna.test', password: 'senhaerrada' });
  assert.equal(wrong.status, 401);
  const clientToken = customerLogin.json.token;
  const otherUser = await call('/auth/register-client', 'POST', {
    name: 'Outro Cliente', email: 'outro@dna.test', password: 'OutraSenhaForte@2026'
  });
  assert.equal(otherUser.status, 201, JSON.stringify(otherUser.json));
  const noScope = await call('/vehicles/history', 'GET', undefined, otherUser.json.token);
  assert.ok([403, 404].includes(noScope.status));
  const forbidden = await call('/services/workshop-register', 'POST', {
    vehicle_id: client.json.vehicle.id, service_title: 'Revisão', mileage: 40000,
    labor_cost_cents: 12000
  }, clientToken);
  assert.equal(forbidden.status, 403);
  const fields = new FormData();
  fields.set('vehicle_id', client.json.vehicle.id);
  fields.set('workshop_id', workshopId);
  fields.set('service_title', 'Troca de óleo');
  fields.set('description', 'Óleo e filtro');
  fields.set('category', 'Óleo e Filtros');
  fields.set('mileage', '40000');
  fields.set('labor_cost_cents', '12000');
  fields.set('parts_json', JSON.stringify([{ name: 'Filtro de óleo', unit_price_cents: 3500, quantity: 1 }]));
  const srv = await worker.fetch(req('/services/workshop-register', 'POST', fields, workshopToken), env);
  const serviceBody = await srv.json();
  assert.equal(srv.status, 201, JSON.stringify(serviceBody));
  assert.equal(serviceBody.total_cost_cents, 15500);
  assert.equal(serviceBody.proof_level, 3, 'sem foto nao e prova nivel 4');
  assert.equal(serviceBody.proof_status, 'WORKSHOP_CONFIRMED');
  assert.equal(serviceBody.attendance_fee, null, 'sem foto nao deve faturar taxa');
  assert.equal(sqlite.prepare('SELECT proof_level FROM service_records WHERE id = ?').get(serviceBody.serviceId).proof_level, 3);

  const customerHistory = await call('/vehicles/' + client.json.vehicle.id + '/history', 'GET', undefined, clientToken);
  assert.equal(customerHistory.status, 200);
  assert.equal(customerHistory.json.services.length, 1);
  assert.equal(customerHistory.json.services[0].service_title, 'Troca de óleo');
  const preferred = await call('/vehicles/' + client.json.vehicle.id + '/booking-workshops', 'GET', undefined, clientToken);
  assert.equal(preferred.status, 200);
  assert.equal(preferred.json.workshops[0].id, workshopId);
  assert.equal(preferred.json.workshops[0].is_origin, true);
  const finance = await call('/workshops/' + workshopId + '/financial-summary', 'GET', undefined, workshopToken);
  assert.equal(finance.status, 200, JSON.stringify(finance.json));
  assert.equal(finance.json.summary.mechanical_total_revenue_cents, 15500);
  assert.equal(finance.json.summary.commission_generated_cents, 0);
  const forbiddenFinance = await call('/workshops/' + workshopId + '/financial-summary', 'GET', undefined, clientToken);
  assert.equal(forbiddenFinance.status, 403);
  const forbiddenManager = await call('/auth/verify-manager-password', 'POST',
    { password: client.json.initial_password }, clientToken);
  assert.equal(forbiddenManager.status, 403);
  const summary = await call('/vehicles/' + client.json.vehicle.id + '/maintenance-overview', 'GET', undefined, clientToken);
  assert.equal(summary.status, 200);
  assert.equal(summary.json.completed.length, 1);
  const admin = await call('/auth/login', 'POST',
    { email: 'admin@dna.test', password: 'SenhaAdministrativa@2026' });
  assert.equal(admin.status, 200);
  const stats = await call('/admin/network-stats', 'GET', undefined, admin.json.token);
  assert.equal(stats.status, 200);
  assert.equal(stats.json.totalVehicles, 1);
  assert.equal(stats.json.totalServices, 1);
  assert.equal(stats.json.totalOwners, 2);
  assert.deepEqual(sqlite.pragma('foreign_key_check'), []);
});
test('sem R2 não aceita anexos e não registra serviço incompleto', async () => {
  const workshopUser = await call('/auth/login', 'POST',
    { email: 'oficina@dna.test', password: 'OficinaForte@2026' });
  const form = new FormData();
  form.set('license_plate', 'ABC1D23');
  form.set('service_title', 'Troca de filtro');
  form.set('mileage', '40100');
  form.set('labor_cost_cents', '2000');
  form.set('photos', new File([new Uint8Array([1,2,3])], 'foto.jpg', { type: 'image/jpeg' }));
  const result = await worker.fetch(req('/services/workshop-register', 'POST', form, workshopUser.json.token), env);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, 'R2_NOT_CONFIGURED');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM service_records').get().count, 1);
});

test('cadastro direto do cliente com placa cria DNA e login sem oficina', async () => {
  const reg = await call('/auth/register-client', 'POST', {
    name: 'Proprietário Direto', email: 'direto@dna.test',
    password: 'SenhaDireta@2026', plate: 'XYZ9A88',
    brand: 'Marca Direta', model: 'Sedan', year: 2024
  });
  assert.equal(reg.status, 201, JSON.stringify(reg.json));
  assert.equal(reg.json.user.vehicle.license_plate, 'XYZ9A88');
  assert.ok(reg.json.user.vehicle.dna_code.startsWith('DNA-BR-'));
  const login = await call('/auth/login', 'POST', {
    email: 'direto@dna.test', password: 'SenhaDireta@2026'
  });
  assert.equal(login.status, 200);
  assert.equal(login.json.user.vehicle.license_plate, 'XYZ9A88');
  assert.deepEqual(sqlite.pragma('foreign_key_check'), []);
});
