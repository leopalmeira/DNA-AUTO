import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signJwt, verifyJwt, verifyBootstrapKey } from '../src/security.mjs';
if (!globalThis.crypto) globalThis.crypto = (await import('node:crypto')).webcrypto;
test('hash usa salt, compara credenciais e falha para senha diferente', async () => {
  const a = await hashPassword('SenhaForte!2026');
  const b = await hashPassword('SenhaForte!2026');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('SenhaForte!2026', a), true);
  assert.equal(await verifyPassword('senhaerrada', a), false);
  assert.equal(await verifyPassword('123456', a), false);
});
test('JWT HMAC autentica assinatura e rejeita token adulterado', async () => {
  const env = { JWT_SECRET: 'A'.repeat(64) };
  const token = await signJwt(env, { id: 'usr_123', role_code: 'OWNER' });
  const verified = await verifyJwt(env, token);
  assert.equal(verified.sub, 'usr_123');
  await assert.rejects(verifyJwt(env, token + 'abc'), /Token inválido/);
  await assert.rejects(signJwt({ JWT_SECRET: '' }, { id: 'x', role_code: 'OWNER' }), /Segredo/);
});
test('token de inicializacao precisa de segredo longo e igualdade', async () => {
  assert.equal(await verifyBootstrapKey({ BOOTSTRAP_TOKEN: 'a'.repeat(40) }, 'a'.repeat(40)), true);
  assert.equal(await verifyBootstrapKey({ BOOTSTRAP_TOKEN: 'a'.repeat(40) }, 'b'.repeat(40)), false);
  assert.equal(await verifyBootstrapKey({ BOOTSTRAP_TOKEN: 'abc' }, 'abc'), false);
});
