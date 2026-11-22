'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { provisionKv } = require('./provision-kv.cjs');
const account = 'a'.repeat(32);
const id = 'b'.repeat(32);
test('KV existente nao e recriado e token nao vaza', async () => {
  let n = 0;
  const fetchImpl = async (url, opts) => {
    assert.equal(opts.headers.Authorization, 'Bearer secret');
    n++;
    return { ok: true, json: async () => ({
      success: true, result: [{ id, title: 'dna-auto-media-free' }],
      result_info: { total_pages: 1 }
    }) };
  };
  assert.equal(await provisionKv({ token: 'secret', account, fetchImpl }), id);
  assert.equal(n, 1);
});
test('KV novo e criado sem expor dados anteriores', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, method: options.method, body: options.body });
    const result = options.method === 'GET' ? {
      success: true, result: [], result_info: { total_pages: 1 }
    } : { success: true, result: { id, title: 'dna-auto-media-free' } };
    return { ok: true, json: async () => result };
  };
  assert.equal(await provisionKv({ token: 'secret', account, fetchImpl }), id);
  assert.equal(requests.length, 2);
  assert.equal(JSON.parse(requests[1].body).title, 'dna-auto-media-free');
  assert.equal(requests[1].method, 'POST');
});
test('KV exige account e token', async () => {
  await assert.rejects(provisionKv({ token: '', account, fetchImpl: () => {} }), /Credenciais/);
});
