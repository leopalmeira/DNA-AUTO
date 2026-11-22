'use strict';
// Provisiona um namespace KV Free via API. Imprime apenas o ID, nunca o token.
async function api(fetchImpl, token, url, method = 'GET', body) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) {
    const errorCode = result.errors?.[0]?.code || response.status;
    throw Error('Cloudflare KV rejeitou a operacao (codigo ' + errorCode + ').');
  }
  return result;
}
async function provisionKv({
  token = process.env.CLOUDFLARE_API_TOKEN,
  account = process.env.CLOUDFLARE_ACCOUNT_ID,
  fetchImpl = globalThis.fetch
} = {}, name = 'dna-auto-media-free') {
  if (!token || !account || !/^[a-f0-9]{32}$/i.test(account))
    throw Error('Credenciais Cloudflare obrigatorias para namespace KV.');
  if (!/^[a-z0-9-]{5,60}$/.test(name)) throw Error('Nome de namespace KV invalido.');
  const base = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/storage/kv/namespaces';
  let existing;
  for (let page = 1; page < 100; page++) {
    const response = await api(fetchImpl, token, base + '?per_page=100&page=' + page);
    existing = response.result.find(kv => kv.title === name);
    if (existing?.id) return existing.id;
    if (page >= (response.result_info?.total_pages || 1)) break;
  }
  const response = await api(fetchImpl, token, base, 'POST', { title: name });
  if (!response.result?.id) throw Error('Cloudflare KV nao informou ID do namespace criado.');
  return response.result.id;
}
if (require.main === module) {
  provisionKv()
    .then(id => process.stdout.write(id + '\n'))
    .catch(err => { console.error(err.message); process.exitCode = 1; });
}
module.exports = { provisionKv };
