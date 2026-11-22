import assert from 'node:assert/strict';

const base = process.env.DNA_WORKER_SMOKE_URL || 'http://127.0.0.1:8787/api/v1';
const unique = crypto.randomUUID().replace(/-/g, '').slice(0, 9).toLowerCase();
async function api(path, method='GET', data=null, token=null) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (data && !(data instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, {
    method,
    headers,
    ...(data ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {})
  });
  const payload = await response.json();
  return { code: response.status, value: payload };
}
function check(response, status) {
  assert.equal(response.code, status, JSON.stringify(response.value));
  return response.value;
}
const ready = check(await api('/health'), 200);
assert.equal(ready.database, 'D1');
assert.equal(ready.production_ready, false);
const workshop = check(await api('/auth/register-workshop', 'POST', {
  tradeName: 'Oficina Smoke ' + unique,
  email: 'oficina-smoke-' + unique + '@example.test',
  password: 'SenhaForteOficina!2026',
  cnpj: 'SMOKE' + unique.toUpperCase(),
  city: 'Rio de Janeiro', state: 'RJ'
}), 201);
const wsId = workshop.workshop_id;
assert.ok(workshop.token && wsId);
const registered = check(await api('/workshops/' + wsId + '/clients/register-activation', 'POST', {
  client_name: 'Cliente Smoke',
  email: 'cliente-' + unique + '@example.test',
  whatsapp: '21999990000',
  license_plate: 'SMK1A23',
  brand: 'Carro', model: 'Teste'
}, workshop.token), 201);
assert.equal(registered.login_ready, true);
assert.ok(registered.initial_password?.length >= 8);
const client = check(await api('/auth/login', 'POST', {
  email: registered.client.email,
  password: registered.initial_password
}), 200);
assert.equal(client.user.vehicle.license_plate, 'SMK1A23');
const form = new FormData();
form.set('vehicle_id', registered.vehicle.id);
form.set('workshop_id', wsId);
form.set('service_title', 'Troca de óleo smoke test');
form.set('mileage', '42000');
form.set('labor_cost_cents', '9000');
form.set('parts_json', JSON.stringify([{
  name: 'Filtro', unit_price_cents: 2500, quantity: 1
}]));
const service = check(await api('/services/workshop-register', 'POST', form, workshop.token), 201);
assert.equal(service.total_cost_cents, 11500);
assert.equal(service.proof_level, 3);
const history = check(await api('/vehicles/' + registered.vehicle.id + '/history', 'GET', null, client.token), 200);
assert.equal(history.services.some(s => s.id === service.serviceId), true);
const preferred = check(await api('/vehicles/' + registered.vehicle.id + '/booking-workshops', 'GET', null, client.token), 200);
assert.equal(preferred.workshops[0].id, wsId);
const financial = check(await api('/workshops/' + wsId + '/financial-summary', 'GET', null, workshop.token), 200);
assert.equal(financial.summary.mechanical_total_revenue_cents, 11500);
check(await api('/workshops/' + wsId + '/financial-summary', 'GET', null, client.token), 403);
const verified = check(await api('/auth/verify-manager-password', 'POST', {
  password: 'SenhaForteOficina!2026'
}, workshop.token), 200);
assert.equal(verified.verified, true);
console.log('Cloudflare workerd + D1 local: cadastro oficina/cliente, login, serviço, histórico e RBAC OK.');
