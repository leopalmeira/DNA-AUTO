/**
 * DNA AUTO — Bateria de Testes: Oficinas Reais SP Capital (Google Maps) + Rolagem Suave ao Mapa
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_dna_auto_2026';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

const app = require('../server/src/server');
const { SP_CAPITAL_WORKSHOPS } = require('../server/src/modules/workshops/spWorkshopsCatalog');

async function runTests() {
    console.log('🧪 Iniciando Testes da Rede Real de Oficinas SP Capital (Google Maps + Auto-Scroll)...');

    const clientePath = path.join(__dirname, '..', 'cliente.app', 'index.html');
    const publicClientePath = path.join(__dirname, '..', 'public', 'cliente.html');
    const clienteHtml = fs.readFileSync(clientePath, 'utf8');
    const publicClienteHtml = fs.readFileSync(publicClientePath, 'utf8');

    // 1. Sincronia obrigatória entre cliente.app/index.html e public/cliente.html
    assert.strictEqual(clienteHtml, publicClienteHtml, 'cliente.app/index.html e public/cliente.html devem estar 100% idênticos');
    assert.ok(!clienteHtml.includes('4 ativas'), 'Não deve restar contador fixo antigo "4 ativas"');
    assert.ok(!clienteHtml.includes('Av. Paulista, 1200'), 'Endereço fictício antigo Av. Paulista, 1200 deve ter sido removido');
    assert.ok(!clienteHtml.includes('Rua Oscar Freire, 890'), 'Endereço fictício antigo Rua Oscar Freire, 890 deve ter sido removido');
    console.log('✅ T1. Sincronia cliente.app <-> public/cliente.html e remoção dos dados fictícios antigos validadas.');

    // 2. Validar catálogo backend de oficinas reais em SP Capital
    assert.ok(SP_CAPITAL_WORKSHOPS.length >= 25, `Catálogo SP Capital deve ter no mínimo 25 oficinas (atual: ${SP_CAPITAL_WORKSHOPS.length})`);
    const zonesFound = new Set(SP_CAPITAL_WORKSHOPS.map(w => w.zone));
    for (const requiredZone of ['Centro', 'Zona Sul', 'Zona Oeste', 'Zona Leste', 'Zona Norte']) {
        assert.ok(zonesFound.has(requiredZone), `Catálogo SP Capital deve cobrir a região ${requiredZone}`);
    }
    for (const w of SP_CAPITAL_WORKSHOPS) {
        assert.ok(w.name && w.name.length >= 4, `Nome válido obrigatório: ${w.id}`);
        assert.ok(w.address && w.address.includes('São Paulo - SP'), `Endereço real de São Paulo Capital obrigatório em ${w.name}`);
        assert.ok(/^\(11\)\s?\d{4,5}-\d{4}$/.test(w.phone), `Telefone DDD 11 real obrigatório em ${w.name}: ${w.phone}`);
        assert.ok(w.maps_query && w.maps_query.includes('São Paulo'), `maps_query Google Maps obrigatório em ${w.name}`);
    }
    console.log(`✅ T2. Catálogo backend validado com ${SP_CAPITAL_WORKSHOPS.length} oficinas reais em SP Capital nas 5 regiões.`);

    // 3. Extrair e executar o módulo de oficinas do cliente.app/index.html em sandbox DOM para testar dados + rolagem suave ao mapa
    const markerStart = '// --- OFICINAS DA REDE CREDENCIADA COM GOOGLE MAPS ---';
    const markerEnd = '// ─── LÓGICA DE CONCLUSÃO E REABERTURA DE ALERTAS E MANUTENÇÕES ───';
    const idxStart = clienteHtml.indexOf(markerStart);
    const idxEnd = clienteHtml.indexOf(markerEnd);
    assert.ok(idxStart !== -1 && idxEnd !== -1 && idxEnd > idxStart, 'Bloco JS de oficinas deve existir em cliente.app/index.html');
    const oficinasBlock = clienteHtml.slice(idxStart, idxEnd);

    const scrollCalls = [];
    const containerScrollCalls = [];

    const makeEl = (id) => {
        const classes = new Set();
        const children = [];
        return {
            id,
            textContent: '',
            innerHTML: '',
            value: '',
            src: '',
            href: '',
            scrollTop: id === 'oficinas-content' ? 840 : 0,
            offsetWidth: 390,
            style: {},
            dataset: {},
            attributes: {},
            classList: {
                add(c) { classes.add(c); },
                remove(c) { classes.delete(c); },
                contains(c) { return classes.has(c); },
                toggle(c, f) { if (f) classes.add(c); else classes.delete(c); }
            },
            setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'data-id') this.dataset.id = String(v); },
            getAttribute(k) { return this.attributes[k] || null; },
            appendChild(child) { children.push(child); },
            get children() { return children; },
            getBoundingClientRect() { return { top: -620, left: 0, width: 380, height: 290 }; },
            scrollTo(opts) { containerScrollCalls.push({ id, opts }); if (opts && typeof opts.top === 'number') this.scrollTop = opts.top; }
        };
    };

    const domMap = new Map();
    const getEl = (id) => {
        if (!domMap.has(id)) domMap.set(id, makeEl(id));
        return domMap.get(id);
    };
    const contentEl = getEl('oficinas-content');
    const screenEl = getEl('oficinas');
    screenEl.scrollTop = 0;

    const storageData = {};
    const sandbox = {
        console,
        encodeURIComponent,
        setTimeout,
        clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: (fn) => fn(),
        localStorage: {
            getItem: (k) => storageData[k] || null,
            setItem: (k, v) => { storageData[k] = String(v); }
        },
        window: {
            pageYOffset: 1200,
            scrollTo(optsOrX, y) {
                scrollCalls.push(typeof optsOrX === 'object' ? optsOrX : { top: y, left: optsOrX });
            },
            open() {}
        },
        document: {
            documentElement: { scrollTop: 1200 },
            body: { scrollTop: 0 },
            scrollingElement: { scrollTop: 1200, scrollTo() {} },
            getElementById: getEl,
            querySelector(sel) {
                if (sel === '#oficinas .oficinas-content' || sel === '.oficinas-content') return contentEl;
                return null;
            },
            querySelectorAll(sel) {
                if (sel === '.shop-card') return getEl('oficinas-list').children;
                return [];
            },
            createElement(tag) {
                return makeEl(`created_${tag}_${Math.random()}`);
            }
        },
        fetch: async () => ({ ok: true, json: async () => ({}) }),
        alert: () => {}
    };

    vm.createContext(sandbox);
    vm.runInContext(`${oficinasBlock}\n;globalThis.__exports = { oficinasDaRede, initOficinasMap, selectOficina, scrollToMap, selectZoneFilter, onOficinaSearchInput, getFilteredSpOficinas, openOficinaModal };`, sandbox);

    const api = sandbox.__exports;
    const spOficinas = api.oficinasDaRede.filter(o => o.uf === 'SP');
    assert.ok(spOficinas.length >= 25, `App do cliente deve listar pelo menos 25 oficinas em SP (atual: ${spOficinas.length})`);
    assert.strictEqual(spOficinas.length, 33, 'App do cliente deve listar todas as 33 oficinas reais de SP Capital');

    // Inicializar tela de oficinas
    api.initOficinasMap();
    const renderedCards = getEl('oficinas-list').children;
    assert.strictEqual(renderedCards.length, 33, 'Lista SP deve renderizar 33 cards de oficinas');
    assert.ok(getEl('oficinas-uf-bar').innerHTML.includes('33 ativas'), 'Card SP deve exibir "33 ativas" dinamicamente');
    assert.strictEqual(getEl('oficinas-list-badge').textContent, '33 credenciadas', 'Badge da lista deve exibir "33 credenciadas"');

    // Simular clique na oficina #28 (Oficina Premium 3011 - Mooca) lá embaixo da lista
    scrollCalls.length = 0;
    containerScrollCalls.length = 0;
    const targetCard = renderedCards.find(c => Number(c.dataset.id) === 28);
    assert.ok(targetCard, 'Card da oficina #28 (Oficina Premium 3011) deve estar renderizado');
    targetCard.onclick();

    // Aguardar o pequeno atraso (140ms) de carregamento suave do iframe
    await new Promise(r => setTimeout(r, 220));

    assert.strictEqual(getEl('map-active-shop-name').textContent, '📍 Oficina Premium 3011', 'Barra flutuante do mapa deve mostrar nome da oficina clicada');
    assert.strictEqual(getEl('map-active-shop-addr').textContent, 'Rua da Mooca, 3011 - Mooca, São Paulo - SP', 'Barra flutuante do mapa deve mostrar endereço real');
    assert.ok(getEl('btn-gmap-route').href.includes('google.com/maps/dir') && getEl('btn-gmap-route').href.includes('Mooca'), 'Botão Rota GPS deve apontar para o Google Maps da oficina clicada');
    assert.ok(getEl('google-maps-frame').src.includes('maps.google.com/maps?q=') && getEl('google-maps-frame').src.includes('hl=pt-BR') && getEl('google-maps-frame').src.includes('z=16') && getEl('google-maps-frame').src.includes('Mooca'), 'Iframe Google Maps deve ser atualizado com query precisa e zoom 16 em PT-BR');
    assert.ok(scrollCalls.length >= 1, 'Clique no card deve disparar window.scrollTo para subir até o mapa');
    assert.strictEqual(scrollCalls[0].behavior, 'smooth', 'Rolagem até o mapa deve ser suave (behavior: smooth)');
    assert.ok(containerScrollCalls.some(c => c.id === 'oficinas-content' && c.opts.top === 0 && c.opts.behavior === 'smooth'), 'Container interno rolado também deve subir suavemente ao topo');
    assert.ok(getEl('google-map-shell').classList.contains('map-focus-pulse'), 'Mapa deve receber destaque visual (.map-focus-pulse) ao focar oficina');

    // Testar filtro por zona e busca por bairro
    api.selectZoneFilter('Zona Sul');
    const zonaSulList = api.getFilteredSpOficinas();
    assert.ok(zonaSulList.length >= 10, `Filtro Zona Sul deve retornar oficinas reais da Zona Sul (atual: ${zonaSulList.length})`);
    api.selectZoneFilter('TODAS');
    api.onOficinaSearchInput('Pinheiros');
    const pinheirosList = api.getFilteredSpOficinas();
    assert.ok(pinheirosList.length >= 2, `Busca por "Pinheiros" deve retornar oficinas reais no bairro (atual: ${pinheirosList.length})`);
    console.log('✅ T3. Renderização das 33 oficinas, clique -> Google Maps preciso, rolagem suave até o mapa e filtros por zona/bairro validados.');

    // 4. Testar endpoint HTTP real /api/v1/workshops/network?uf=SP
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/workshops/network?uf=SP`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.workshops.length >= 33, `Endpoint /workshops/network?uf=SP deve retornar >= 33 oficinas SP (atual: ${data.workshops.length})`);
        assert.ok(data.sp_capital_count >= 33, 'sp_capital_count deve ser >= 33');

        const resSearch = await fetch(`http://127.0.0.1:${port}/api/v1/workshops/network?uf=SP&q=Moema`);
        const searchData = await resSearch.json();
        assert.ok(searchData.workshops.length >= 2, 'Busca HTTP por Moema deve retornar oficinas reais de Moema');
        console.log(`✅ T4. Endpoint REST GET /api/v1/workshops/network?uf=SP validado (${data.workshops.length} oficinas SP retornadas).`);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }

    console.log('\n🎉 TODOS OS TESTES DAS OFICINAS REAIS DE SP CAPITAL E AUTO-SCROLL DO MAPA PASSARAM COM 100% DE SUCESSO!');
}

runTests().catch(err => {
    console.error('❌ Falha nos testes de oficinas SP:', err);
    process.exit(1);
});
