const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server/src/server');

async function runTests() {
    console.log('🧪 Iniciando Testes de abertura web e tela cheia (Cliente + Oficina)...');

    const clienteHtml = fs.readFileSync(path.join(__dirname, '..', 'cliente.app', 'index.html'), 'utf8');
    const publicClienteHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'cliente.html'), 'utf8');
    const oficinaHtml = fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'index.html'), 'utf8');
    const publicOficinaHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'oficina.html'), 'utf8');
    const oficinaCss = fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'css', 'workshop-mobile.css'), 'utf8');
    const publicOficinaCss = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'workshop-mobile.css'), 'utf8');
    const clienteManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cliente.app', 'manifest.json'), 'utf8'));
    const publicManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'manifest.json'), 'utf8'));
    const oficinaManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'manifest.json'), 'utf8'));

    // 1. Verificar sincronia cliente.app / oficina.app <-> public
    assert.strictEqual(clienteHtml, publicClienteHtml, 'cliente.app/index.html e public/cliente.html devem estar idênticos');
    assert.strictEqual(oficinaHtml, publicOficinaHtml, 'oficina.app/index.html e public/oficina.html devem estar idênticos');
    assert.strictEqual(oficinaCss, publicOficinaCss, 'oficina.app/css/workshop-mobile.css e public/css/workshop-mobile.css devem estar idênticos');

    // 2. Verificar configuração Edge-to-Edge Fullscreen em ambos os apps
    assert.ok(clienteHtml.includes('viewport-fit=cover'), 'Cliente deve ter viewport-fit=cover');
    assert.ok(clienteHtml.includes('black-translucent'), 'Cliente deve ter status bar translucent');
    assert.strictEqual(clienteManifest.display, 'fullscreen', 'Manifest cliente display deve ser fullscreen');
    assert.strictEqual(publicManifest.display, 'fullscreen', 'Manifest public display deve ser fullscreen');
    assert.strictEqual(clienteManifest.theme_color, '#020712', 'Manifest cliente theme_color deve ser #020712');
    assert.strictEqual(clienteManifest.background_color, '#020712', 'Manifest cliente background_color deve ser #020712');

    assert.ok(oficinaHtml.includes('viewport-fit=cover'), 'Oficina deve ter viewport-fit=cover');
    assert.ok(oficinaHtml.includes('apple-mobile-web-app-status-bar-style" content="black-translucent"'), 'Oficina deve ter status bar translucent');
    assert.ok(oficinaHtml.includes('rel="manifest" href="/oficina.app/manifest.json"'), 'Oficina deve vincular manifest.json');
    assert.strictEqual(oficinaManifest.display, 'fullscreen', 'Manifest oficina display deve ser fullscreen');
    assert.strictEqual(oficinaManifest.theme_color, '#010712', 'Manifest oficina theme_color deve ser #010712');
    assert.ok(/\.ws-splash-screen\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/.test(oficinaCss), 'Splash oficina deve ser fixed inset: 0');
    assert.ok(/\.ws-splash-hero-bg\s*\{[\s\S]*?object-fit:\s*cover;/.test(oficinaCss), 'Hero bg splash oficina deve usar object-fit: cover');

    for (const html of [clienteHtml, oficinaHtml]) {
        assert.ok(!html.includes('triggerApkAutoDownload'));
        assert.ok(!html.includes('dna-update-modal'));
    }
    for (const manifest of [clienteManifest, publicManifest, oficinaManifest]) {
        assert.ok(!manifest.related_applications);
    }

    const server = await new Promise((resolve) => {
        const s = http.createServer(app);
        s.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
        const port = server.address().port;
        const base = `http://127.0.0.1:${port}`;

        for (const [endpoint, appType] of [
            ['/api/v1/app/version', 'cliente'],
            ['/api/v1/app/version?app=oficina', 'oficina'],
            ['/api/v1/app/version-oficina', 'oficina']
        ]) {
            const result = await fetch(base + endpoint);
            assert.strictEqual(result.status, 200);
            const info = await result.json();
            assert.strictEqual(info.success, true);
            assert.strictEqual(info.app, appType);
            assert.strictEqual(info.apk_available, false);
            assert.strictEqual(info.apk_url, null);
            assert.strictEqual(info.force_update, false);
        }

        for (const appType of ['cliente', 'oficina']) {
            const page = await fetch(base + '/' + appType + '/');
            assert.strictEqual(page.status, 200);
            assert.match(page.headers.get('content-type'), /text\/html/);
            const html = await page.text();
            assert.ok(!html.includes('triggerApkAutoDownload'));
            assert.ok(html.includes('href="/downloads/dna-auto-' + appType + '.apk"'));

            const nativePage = await fetch(base + '/' + appType, {
                headers: { 'User-Agent': appType === 'cliente' ? 'DNAAutoAPK/2.5.20' : 'DNAOficinaAPK/2.5.21' }
            });
            assert.strictEqual(nativePage.status, 200);
            assert.ok(!(await nativePage.text()).includes('dna-android-download'));

            const download = await fetch(base + '/downloads/dna-auto-' + appType + '.apk', { redirect: 'manual' });
            assert.strictEqual(download.status, 302);
            assert.strictEqual(download.headers.get('location'), 'https://github.com/leopalmeira/DNA-AUTO/releases/download/apk-latest/dna-auto-' + appType + '.apk');
        }

        const assetLinks = await fetch(base + '/.well-known/assetlinks.json');
        assert.deepStrictEqual(await assetLinks.json(), []);
        console.log('Cliente e Oficina abrem pela web com tela cheia e download manual de APK.');
    } finally {
        if (server) {
            server.close();
        }
    }
}

runTests().catch((err) => {
    console.error('❌ Falha nos testes de APK/Fullscreen:', err);
    process.exit(1);
});
