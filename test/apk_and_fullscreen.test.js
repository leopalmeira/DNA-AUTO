const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server/src/server');

async function runTests() {
    console.log('🧪 Iniciando Testes Edge-to-Edge Fullscreen & APK Updater/Installer...');

    const clienteHtml = fs.readFileSync(path.join(__dirname, '..', 'cliente.app', 'index.html'), 'utf8');
    const publicClienteHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'cliente.html'), 'utf8');
    const oficinaHtml = fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'index.html'), 'utf8');
    const publicOficinaHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'oficina.html'), 'utf8');
    const oficinaCss = fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'css', 'workshop-mobile.css'), 'utf8');
    const publicOficinaCss = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'workshop-mobile.css'), 'utf8');
    const clienteManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cliente.app', 'manifest.json'), 'utf8'));
    const oficinaManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'oficina.app', 'manifest.json'), 'utf8'));

    // 1. Verificar sincronia cliente.app / oficina.app <-> public
    assert.strictEqual(clienteHtml, publicClienteHtml, 'cliente.app/index.html e public/cliente.html devem estar idênticos');
    assert.strictEqual(oficinaHtml, publicOficinaHtml, 'oficina.app/index.html e public/oficina.html devem estar idênticos');
    assert.strictEqual(oficinaCss, publicOficinaCss, 'oficina.app/css/workshop-mobile.css e public/css/workshop-mobile.css devem estar idênticos');

    // 2. Verificar configuração Edge-to-Edge Fullscreen em ambos os apps
    assert.ok(clienteHtml.includes('viewport-fit=cover'), 'Cliente deve ter viewport-fit=cover');
    assert.ok(clienteHtml.includes('black-translucent'), 'Cliente deve ter status bar translucent');
    assert.strictEqual(clienteManifest.theme_color, '#020712', 'Manifest cliente theme_color deve ser #020712');
    assert.strictEqual(clienteManifest.background_color, '#020712', 'Manifest cliente background_color deve ser #020712');

    assert.ok(oficinaHtml.includes('viewport-fit=cover'), 'Oficina deve ter viewport-fit=cover');
    assert.ok(oficinaHtml.includes('apple-mobile-web-app-status-bar-style" content="black-translucent"'), 'Oficina deve ter status bar translucent');
    assert.ok(oficinaHtml.includes('rel="manifest" href="./manifest.json"'), 'Oficina deve vincular manifest.json');
    assert.strictEqual(oficinaManifest.theme_color, '#010712', 'Manifest oficina theme_color deve ser #010712');
    assert.ok(/\.ws-splash-screen\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/.test(oficinaCss), 'Splash oficina deve ser fixed inset: 0');
    assert.ok(/\.ws-splash-hero-bg\s*\{[\s\S]*?object-fit:\s*cover;/.test(oficinaCss), 'Hero bg splash oficina deve usar object-fit: cover');

    // 3. Verificar presença da lógica de Atualização Centrada ("Atualizar App") e Detecção APK
    assert.ok(clienteHtml.includes('id="dna-update-modal"') || clienteHtml.includes("modal.id = 'dna-update-modal'"), 'Cliente deve possuir modal dna-update-modal');
    assert.ok(clienteHtml.includes('Atualizar App'), 'Modal de atualização deve exibir título Atualizar App');
    assert.ok(clienteHtml.includes('DNAAppUpdater'), 'Cliente deve expor DNAAppUpdater');
    assert.ok(clienteHtml.includes('DNAApkInstaller'), 'Cliente deve expor DNAApkInstaller');
    assert.ok(clienteHtml.includes('getInstalledRelatedApps'), 'Instalador inteligente deve checar getInstalledRelatedApps');

    // 4. Testar endpoints reais de versão do APK e Asset Links via HTTP
    const server = await new Promise((resolve) => {
        const s = http.createServer(app);
        s.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
        const port = server.address().port;
        const base = `http://127.0.0.1:${port}`;

        const vRes = await fetch(`${base}/api/v1/app/version`);
        assert.strictEqual(vRes.status, 200);
        const vData = await vRes.json();
        assert.strictEqual(vData.success, true);
        assert.strictEqual(vData.version, '2.5.2');
        assert.strictEqual(typeof vData.version_code, 'number');
        assert.strictEqual(vData.package_name, 'br.com.dnaauto.cliente');
        assert.strictEqual(typeof vData.apk_available, 'boolean');

        const alRes = await fetch(`${base}/.well-known/assetlinks.json`);
        assert.strictEqual(alRes.status, 200);
        const alData = await alRes.json();
        assert.ok(Array.isArray(alData) && alData.length === 1);
        assert.strictEqual(alData[0].target.package_name, 'br.com.dnaauto.cliente');

        if (!vData.apk_available) {
            const dlRes = await fetch(`${base}/downloads/dna-auto-cliente.apk`);
            assert.strictEqual(dlRes.status, 404, 'Sem binário publicado, download APK deve responder 404 claro');
        }

        console.log('✅ Todos os testes de Edge-to-Edge Fullscreen, Versionamento APK e Asset Links passaram!');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

runTests().catch((err) => {
    console.error('❌ Falha nos testes de APK/Fullscreen:', err);
    process.exit(1);
});
