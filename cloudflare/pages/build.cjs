'use strict';
// Gera sites estaticos para Cloudflare Pages sem modificar os fontes originais.
// Inclui recursos herdados do antigo public e preserva caminhos absolutos dos PWAs.
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
const config = mapping[type];
const dir = path.join(__dirname, config.output);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.cpSync(path.join(root, 'public'), dir, { recursive: true, force: true });
if (config.source !== 'public') {
    fs.cpSync(path.join(root, config.source), dir, { recursive: true, force: true });
    fs.cpSync(path.join(root, config.source), path.join(dir, config.nested), { recursive: true, force: true });
}
fs.writeFileSync(path.join(dir, '_headers'), [
    '/index.html',
    '  Cache-Control: no-store, max-age=0',
    '/sw.js',
    '  Cache-Control: no-store, max-age=0',
    '/manifest.json',
    '  Cache-Control: no-store, max-age=0',
    ''
].join('\n'));
if (!fs.existsSync(path.join(dir, 'index.html'))) throw new Error('index.html ausente no build.');
console.log('Cloudflare Pages: site "' + type + '" preparado em ' + dir);
