import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
const req = (route, opts) => new Request('https://example.workers.dev' + route, opts);
const tables = [
    'roles', 'users', 'workshops', 'workshop_users', 'vehicles',
    'owners', 'vehicle_dna', 'service_records', 'client_activations',
    'invoices', 'vehicle_photos', 'maintenance_records'
];
const mockD1 = (names) => ({
    prepare: () => ({ bind: () => ({ all: async () => ({ results: names.map(name => ({ name })) }) }) })
});
test('health sem D1 falha em seguranca', async () => {
    const r = await worker.fetch(req('/api/v1/health'), {});
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'D1_NOT_CONFIGURED');
});
test('D1 vazio nao e considerado pronto', async () => {
    const r = await worker.fetch(req('/health'), { DB: mockD1([]) });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'D1_SCHEMA_INCOMPLETE');
});
test('health com esquema D1 minimo nao indica producao', async () => {
    const r = await worker.fetch(req('/health'), { DB: mockD1(tables) });
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
test('login, ativacao e servicos nao podem gravar antes da migracao', async () => {
    for (const path of ['/api/v1/auth/login', '/api/v1/workshops/1/clients/register-activation', '/api/v1/services/workshop-register']) {
        const r = await worker.fetch(req(path, { method: 'POST' }), {});
        assert.equal(r.status, 503);
        assert.equal((await r.json()).code, 'CLOUDFLARE_MIGRATION_INCOMPLETE');
    }
});
