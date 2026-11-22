'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const directory = path.resolve(__dirname);
const root = path.resolve(directory, '..', '..');
const command = path.join(directory, 'build.cjs');
const apiUrl = 'https://dna-api-staging.example.workers.dev/api/v1';
const urls = {
    DNA_CLIENT_BASE_URL: 'https://dna-cliente.example.pages.dev',
    DNA_OFICINA_BASE_URL: 'https://dna-oficina.example.pages.dev',
    DNA_ADMIN_BASE_URL: 'https://dna-admin.example.pages.dev'
};
function build(name, envUrl = '') {
    return execFileSync(process.execPath, [command, name], {
        cwd: root, stdio: 'pipe', env: { ...process.env, ...urls, DNA_API_BASE_URL: envUrl || apiUrl }
    });
}
for (const name of ['cliente', 'oficina', 'admin']) {
    test('Cloudflare Pages compila site ' + name + ' com assets e index', () => {
        build(name);
        const dist = path.join(directory, 'dist-' + name);
        try {
            assert.ok(fs.existsSync(path.join(dist, 'index.html')));
            assert.ok(fs.existsSync(path.join(dist, 'manifest.json')) || name === 'admin');
            assert.ok(fs.existsSync(path.join(dist, '_headers')));
            assert.ok(fs.existsSync(path.join(dist, 'js', 'api.js')));
            if (name !== 'admin') assert.ok(fs.existsSync(path.join(dist, name + '.app', 'index.html')));
            const source = name === 'admin' ? path.join(root, 'public', 'index.html') : path.join(root, name + '.app', 'index.html');
            assert.ok(fs.readFileSync(path.join(dist, 'index.html'), 'utf8').length > 0);
            assert.ok(fs.existsSync(path.join(dist, '_redirects')));
            assert.ok(!fs.readFileSync(path.join(dist, 'index.html'), 'utf8').includes('onrender.com'));
        } finally { fs.rmSync(dist, { recursive: true, force: true }); }
    });
    test('Cloudflare Pages injeta API HTTPS so nos builds de ' + name, () => {
        build(name, apiUrl);
        const dist = path.join(directory, 'dist-' + name);
        try {
            const files = [path.join(dist, 'js', 'api.js')];
            if (name !== 'admin') files.push(path.join(dist, name + '.app', 'js', 'api.js'));
            for (const file of files) assert.ok(fs.readFileSync(file, 'utf8').includes('baseUrl: "' + apiUrl + '",'));
            const original = name === 'admin' ? path.join(root, 'public', 'js', 'api.js') : path.join(root, name + '.app', 'js', 'api.js');
            assert.ok(!fs.readFileSync(original, 'utf8').includes(apiUrl));
        } finally { fs.rmSync(dist, { recursive: true, force: true }); }
    });
}
test('build recusa URL insegura de API e nao inclui credenciais', () => {
    for (const value of [
        'http://example.com/api/v1',
        'https://user:pass@example.com/api/v1',
        'https://example.com/api/v2',
        'https://example.com/api/v1?token=abc'
    ]) {
        const result = spawnSync(process.execPath, [command, 'cliente'], {
            cwd: root, encoding: 'utf8', env: { ...process.env, ...urls, DNA_API_BASE_URL: value }
        });
        assert.notEqual(result.status, 0, value);
    }
});

test('build sem as quatro URLs falha, evitando publicar site que aponte ao Render', () => {
    const res = spawnSync(process.execPath, [command, 'cliente'], {
        cwd: root, encoding: 'utf8',
        env: { ...process.env, DNA_API_BASE_URL: apiUrl, DNA_CLIENT_BASE_URL: '',
            DNA_OFICINA_BASE_URL: '', DNA_ADMIN_BASE_URL: '' }
    });
    assert.notEqual(res.status, 0);
});
