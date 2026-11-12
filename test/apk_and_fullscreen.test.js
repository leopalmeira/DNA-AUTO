const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server/src/server');

async function runTests() {
    console.log('🧪 Iniciando Testes Edge-to-Edge Fullscreen & APK Updater/Installer (Cliente + Oficina)...');

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
    assert.ok(oficinaHtml.includes('rel="manifest" href="./manifest.json"'), 'Oficina deve vincular manifest.json');
    assert.strictEqual(oficinaManifest.display, 'fullscreen', 'Manifest oficina display deve ser fullscreen');
    assert.strictEqual(oficinaManifest.theme_color, '#010712', 'Manifest oficina theme_color deve ser #010712');
    assert.ok(/\.ws-splash-screen\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/.test(oficinaCss), 'Splash oficina deve ser fixed inset: 0');
    assert.ok(/\.ws-splash-hero-bg\s*\{[\s\S]*?object-fit:\s*cover;/.test(oficinaCss), 'Hero bg splash oficina deve usar object-fit: cover');

    // 3. Verificar presença da lógica de Atualização Centrada ("Atualizar App") e Detecção APK em ambos os apps
    for (const [label, html] of [['Cliente', clienteHtml], ['Oficina', oficinaHtml]]) {
        assert.ok(html.includes('dna-update-modal'), `${label} deve possuir modal dna-update-modal`);
        assert.ok(html.includes('Atualizar App'), `${label} deve exibir título Atualizar App`);
        assert.ok(html.includes('DNAAppUpdater'), `${label} deve expor DNAAppUpdater`);
        assert.ok(html.includes('DNAApkInstaller'), `${label} deve expor DNAApkInstaller`);
        assert.ok(html.includes('getInstalledRelatedApps'), `${label} deve checar getInstalledRelatedApps`);
    }

    // 4. Testar endpoints reais de versão dos APKs e Asset Links via HTTP
    const server = await new Promise((resolve) => {
        const s = http.createServer(app);
        s.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
        const port = server.address().port;
        const base = `http://127.0.0.1:${port}`;

        const vClienteRes = await fetch(`${base}/api/v1/app/version`);
        assert.strictEqual(vClienteRes.status, 200);
        const vCliente = await vClienteRes.json();
        assert.strictEqual(vCliente.success, true);
        assert.strictEqual(vCliente.app, 'cliente');
        assert.strictEqual(vCliente.version, '2.5.3');
        assert.strictEqual(vCliente.package_name, 'br.com.dnaauto.cliente');
        assert.strictEqual(vCliente.apk_available, true);
        assert.strictEqual(vCliente.apk_url, '/downloads/dna-auto-cliente.apk');

        const vOficinaRes = await fetch(`${base}/api/v1/app/version-oficina`);
        assert.strictEqual(vOficinaRes.status, 200);
        const vOficina = await vOficinaRes.json();
        assert.strictEqual(vOficina.success, true);
        assert.strictEqual(vOficina.app, 'oficina');
        assert.strictEqual(vOficina.version, '2.5.3');
        assert.strictEqual(vOficina.package_name, 'br.com.dnaauto.oficina');
        assert.strictEqual(vOficina.apk_available, true);
        assert.strictEqual(vOficina.apk_url, '/downloads/dna-auto-oficina.apk');

        const alRes = await fetch(`${base}/.well-known/assetlinks.json`);
        assert.strictEqual(alRes.status, 200);
        const alData = await alRes.json();
        assert.ok(Array.isArray(alData) && alData.length === 2);
        assert.strictEqual(alData[0].target.package_name, 'br.com.dnaauto.cliente');
        assert.strictEqual(alData[1].target.package_name, 'br.com.dnaauto.oficina');

        // Verificar resposta dos downloads sem seguir redirecionamento externo
        const dlCliente = await fetch(`${base}/downloads/dna-auto-cliente.apk`, { redirect: 'manual' });
        assert.ok(dlCliente.status === 200 || dlCliente.status === 302, `Download APK cliente retornou status inesperado: ${dlCliente.status}`);

        const dlOficina = await fetch(`${base}/downloads/dna-auto-oficina.apk`, { redirect: 'manual' });
        assert.ok(dlOficina.status === 200 || dlOficina.status === 302, `Download APK oficina retornou status inesperado: ${dlOficina.status}`);

        console.log('✅ Todos os testes de Edge-to-Edge Fullscreen, Versionamento APK e Asset Links (Cliente + Oficina) passaram!');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

runTests().catch((err) => {
    console.error('❌ Falha nos testes de APK/Fullscreen:', err);
    process.exit(1);
});
