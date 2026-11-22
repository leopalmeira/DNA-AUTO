'use strict';
// Gerar Cloudflare Pages sem alterar fontes ou apontar producao para API nao homologada.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const type = process.argv[2];
const mapping = {
    cliente: { source: 'cliente.app', output: 'dist-cliente', nested: 'cliente.app' },
    oficina: { source: 'oficina.app', output: 'dist-oficina', nested: 'oficina.app' },
    admin: { source: 'public', output: 'dist-admin', nested: null }
};
if (!Object.hasOwn(mapping, type)) {
    console.error('Uso: node cloudflare/pages/build.cjs [cliente|oficina|admin]');
    process.exit(2);
}
function getApiBaseUrl() {
    const raw = String(process.env.DNA_API_BASE_URL || '').trim();
    if (!raw) throw Error('DNA_API_BASE_URL e obrigatoria para publicar um Pages independente.');
    let url;
    try { url = new URL(raw); } catch { throw Error('DNA_API_BASE_URL precisa ser URL HTTPS valida.'); }
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
        url.search || url.hash || url.pathname !== '/api/v1' || url.hostname.endsWith('.onrender.com')) {
        throw Error('DNA_API_BASE_URL deve ser HTTPS, sem credenciais/parametros, terminando em /api/v1.');
    }
    return url.origin + url.pathname;
}
function getSiteBase(name) {
    const raw = String(process.env[name] || '').trim();
    let url;
    try { url = new URL(raw); } catch { throw Error(name + ' precisa de URL HTTPS valida.'); }
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash ||
        url.hostname.endsWith('.onrender.com')) {
        throw Error(name + ' deve ser um endereco HTTPS independente do Render (somente dominio).');
    }
    return url.origin;
}
const apiBaseUrl = getApiBaseUrl();
const clientBase = getSiteBase('DNA_CLIENT_BASE_URL');
const workshopBase = getSiteBase('DNA_OFICINA_BASE_URL');
const adminBase = getSiteBase('DNA_ADMIN_BASE_URL');
const config = mapping[type];
const dir = path.join(__dirname, config.output);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.cpSync(path.join(root, 'public'), dir, { recursive: true, force: true });
if (config.source !== 'public') {
    fs.cpSync(path.join(root, config.source), dir, { recursive: true, force: true });
    fs.cpSync(path.join(root, config.source), path.join(dir, config.nested), { recursive: true, force: true });
}
function patchApiClient(filename) {
    const js = fs.readFileSync(filename, 'utf8');
    const original = /baseUrl:\s*\(typeof window[^\n]*\n\s*\?\s*'https?:\/\/[^']+'\s*\n\s*:\s*'\/api\/v1',/;
    if (!original.test(js)) throw Error('Formato de baseUrl inesperado: ' + filename);
    fs.writeFileSync(filename, js.replace(original, 'baseUrl: ' + JSON.stringify(apiBaseUrl) + ','));
}
if (apiBaseUrl) {
    const clients = [path.join(dir, 'js', 'api.js')];
    if (config.nested) clients.push(path.join(dir, config.nested, 'js', 'api.js'));
    for (const js of clients) patchApiClient(js);
}
fs.writeFileSync(path.join(dir, '_headers'), [
    '/index.html', '  Cache-Control: no-store, max-age=0',
    '/sw.js', '  Cache-Control: no-store, max-age=0',
    '/manifest.json', '  Cache-Control: no-store, max-age=0', ''
].join('\n'));
// Elimina referencia a Render em TODOS os arquivos textuais publicados nos tres Pages.
function rewriteTextLinks(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) { rewriteTextLinks(full); continue; }
        if (!entry.isFile() || !/\.(html|js|css|json|xml|txt)$/i.test(entry.name)) continue;
        let original = fs.readFileSync(full, 'utf8');
        const changed = original
            .replace(/https:\/\/[a-z0-9-]+\.onrender\.com\/cliente(?:\/?)/gi, clientBase + '/')
            .replace(/https:\/\/[a-z0-9-]+\.onrender\.com\/oficina(?:\/?)/gi, workshopBase + '/')
            .replace(/https:\/\/[a-z0-9-]+\.onrender\.com/gi, adminBase);
        if (changed !== original) fs.writeFileSync(full, changed);
    }
}
rewriteTextLinks(dir);
fs.writeFileSync(path.join(dir, '_redirects'), [
    '/cliente ' + clientBase + '/ 302',
    '/oficina ' + workshopBase + '/ 302',
    '/admin / 302',
    '/representante /representante.html 200',
    ''
].join('\n'));
if (!fs.existsSync(path.join(dir, 'index.html'))) throw new Error('index.html ausente no build.');
console.log('Cloudflare Pages: site "' + type + '" preparado em ' + dir +
    (apiBaseUrl ? ' usando API externa configurada.' : ' (API relativa; homologacao pendente).'));
