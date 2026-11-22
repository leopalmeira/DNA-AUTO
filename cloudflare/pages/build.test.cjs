'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const directory = path.resolve(__dirname);
const root = path.resolve(directory, '..', '..');
for (const name of ['cliente', 'oficina', 'admin']) {
    test('Cloudflare Pages compila site ' + name + ' com assets e index', () => {
        execFileSync(process.execPath, [path.join(directory, 'build.cjs'), name], { cwd: root, stdio: 'pipe' });
        const dist = path.join(directory, 'dist-' + name);
        assert.ok(fs.existsSync(path.join(dist, 'index.html')));
        assert.ok(fs.existsSync(path.join(dist, 'manifest.json')) || name === 'admin');
        assert.ok(fs.existsSync(path.join(dist, '_headers')));
        assert.ok(fs.existsSync(path.join(dist, 'js', 'api.js')));
        if (name !== 'admin') assert.ok(fs.existsSync(path.join(dist, name + '.app', 'index.html')));
        const source = name === 'admin' ? path.join(root, 'public', 'index.html') : path.join(root, name + '.app', 'index.html');
        assert.equal(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), fs.readFileSync(source, 'utf8'));
        fs.rmSync(dist, { recursive: true, force: true });
    });
}
