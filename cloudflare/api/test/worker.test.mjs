import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
const req = (route, opts) => new Request('https://example.workers.dev' + route, opts);
const tables = [
    'roles', 'users', 'workshops', 'workshop_users', 'vehicles',
    'owners', 'vehicle_dna', 'service_records', 'client_activations',
    'invoices', 'vehicle_photos', 'maintenance_records'
];
const mockD1 = names => ({
    prepare: () => ({ bind: () => ({ all: async () => ({ results: names.map(name => ({ name })) }) }) })
});
test('health sem D1 falha em segurança', async () => {
    const r = await worker.fetch(req('/api/v1/health'), {});
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'D1_NOT_CONFIGURED');
});
test('D1 vazio não é considerado pronto', async () => {
    const r = await worker.fetch(req('/health'), { DB: mockD1([]) });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'D1_SCHEMA_INCOMPLETE');
});
test('health com D1 mas sem JWT_SECRET não é considerado pronto', async () => {
    const r = await worker.fetch(req('/health'), { DB: mockD1(tables) });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'JWT_SECRET_NOT_CONFIGURED');
});
test('health com esquema e segredo não atesta produção', async () => {
    const r = await worker.fetch(req('/health'), { DB: mockD1(tables), JWT_SECRET: 'x'.repeat(64) });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.production_ready, false);
    assert.equal(body.status, 'STAGING_SCHEMA_READY');
});
test('D1 falhando recusa acesso sem vazar detalhes', async () => {
    const r = await worker.fetch(req('/health'), {
        DB: { prepare: () => ({ bind: () => ({ all: async () => { throw Error('credencial secreta'); } }) }) }
    });
    assert.equal(r.status, 503);
    assert.equal((await r.text()).includes('credencial secreta'), false);
});
test('sem banco, autenticação e serviço recusam escrita', async () => {
    for (const route of ['/api/v1/auth/login', '/api/v1/workshops/1/clients/register-activation', '/api/v1/services/workshop-register']) {
        const r = await worker.fetch(req(route, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: '{}'
        }), {});
        assert.equal(r.status, 503);
        assert.equal((await r.json()).code, 'D1_NOT_CONFIGURED');
    }
});
test('CORS exige origem explicitamente permitida', async () => {
    const env = { ALLOWED_ORIGINS: 'https://dna-auto-cliente.pages.dev,https://dna-auto-oficina.pages.dev' };
    const good = await worker.fetch(req('/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: { Origin: 'https://dna-auto-cliente.pages.dev', 'Access-Control-Request-Method': 'POST' }
    }), env);
    assert.equal(good.status, 204);
    assert.equal(good.headers.get('Access-Control-Allow-Origin'), 'https://dna-auto-cliente.pages.dev');
    assert.match(good.headers.get('Access-Control-Allow-Headers'), /Authorization/);
    const bad = await worker.fetch(req('/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: { Origin: 'https://malicioso.example', 'Access-Control-Request-Method': 'POST' }
    }), env);
    assert.equal(bad.status, 403);
    assert.equal(bad.headers.get('Access-Control-Allow-Origin'), null);
});
