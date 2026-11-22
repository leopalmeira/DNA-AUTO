import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
const req = (route, opts) => new Request('https://example.workers.dev' + route, opts);
test('health sem D1 falha em seguranca', async () => {
    const r = await worker.fetch(req('/api/v1/health'), {});
    assert.equal(r.status, 503);
    assert.equal((await r.json()).code, 'D1_NOT_CONFIGURED');
});
test('health com D1 de staging nao indica producao', async () => {
    const r = await worker.fetch(req('/health'), { DB: { prepare: () => ({ first: async () => ({ alive: 1 }) }) } });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).production_ready, false);
});
test('D1 falhando recusa acesso', async () => {
    const r = await worker.fetch(req('/health'), { DB: { prepare: () => ({ first: async () => { throw Error('DB offline'); } }) } });
    assert.equal(r.status, 503);
});
test('login, ativacao e servicos nao podem gravar antes da migracao', async () => {
    for (const path of ['/api/v1/auth/login', '/api/v1/workshops/1/clients/register-activation', '/api/v1/services/workshop-register']) {
        const r = await worker.fetch(req(path, { method: 'POST' }), {});
        assert.equal(r.status, 503);
        assert.equal((await r.json()).code, 'CLOUDFLARE_MIGRATION_INCOMPLETE');
    }
});
