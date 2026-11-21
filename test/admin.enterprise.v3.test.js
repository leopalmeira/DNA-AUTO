const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const vm = require('node:vm');

// Banco isolado temporário para homologação V3 sem tocar no dna_auto.db local
const tmpDbPath = path.join(os.tmpdir(), `dna_auto_admin_v3_${Date.now()}.db`);
process.env.DB_PATH = tmpDbPath;
process.env.JWT_SECRET = 'test_secret_enterprise_v3_64chars_secure_key_for_automated_homologation';
process.env.NODE_ENV = 'test';

const db = require('../server/src/database/db');
const { seedBase } = require('../server/src/database/seed');
const app = require('../server/src/server');

let server;
let baseUrl;
let adminToken;
let workshopId;
let repId;

async function req(method, endpoint, { token = null, body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { status: res.status, json, text };
}

test.before(async () => {
    seedBase();

    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            baseUrl = `http://127.0.0.1:${addr.port}`;
            resolve();
        });
    });

    const loginRes = await req('POST', '/api/v1/auth/login', {
        body: { email: 'admin@dnaauto.com.br', password: 'admin123' }
    });
    assert.equal(loginRes.status, 200, 'Login ADMIN deve responder 200');
    adminToken = loginRes.json.token;

    // Criar representante aprovado + oficina vinculada para testes reais de telas V3
    const repReg = await req('POST', '/api/v1/representatives/register', {
        body: {
            name: 'Carlos Comercial V3',
            cpf_cnpj: '111.222.333-44',
            email: 'carlos.v3@dnaauto.test',
            phone: '(11) 98888-1111',
            city: 'São Paulo',
            state: 'SP',
            pix_key: 'carlos.v3@dnaauto.test',
            password: 'RepPassword123!'
        }
    });
    assert.equal(repReg.status, 201);
    repId = repReg.json.representative.id;
    const repCode = repReg.json.representative.rep_code;

    const appRep = await req('POST', `/api/v1/admin/representatives/${repId}/approve`, {
        token: adminToken,
        body: { justification: 'Homologação Enterprise V3' }
    });
    assert.equal(appRep.status, 200);

    const wsReg = await req('POST', '/api/v1/auth/register-workshop', {
        body: {
            trade_name: 'Oficina Enterprise SP',
            company_name: 'Oficina Enterprise SP Ltda',
            cnpj: '44.555.666/0001-77',
            phone: '(11) 3333-4444',
            email: 'enterprise.sp@dnaauto.test',
            city: 'São Paulo',
            state: 'SP',
            password: 'WsPassword123!',
            rep_code: repCode
        }
    });
    assert.equal(wsReg.status, 201);
    workshopId = wsReg.json.workshop.id;

    const appWs = await req('POST', `/api/v1/admin/workshops/${workshopId}/status`, {
        token: adminToken,
        body: { status: 'APPROVED' }
    });
    assert.equal(appWs.status, 200);
});

test.after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    try { db.close(); } catch (_) {}
    for (const suffix of ['', '-wal', '-shm']) {
        try { fs.unlinkSync(`${tmpDbPath}${suffix}`); } catch (_) {}
    }
});

test('V3-01. Design System tokens corporativos (Light padrão + Dark independente + WCAG + Inter)', () => {
    const tokensCss = fs.readFileSync(path.resolve(__dirname, '../public/css/admin-enterprise-tokens.css'), 'utf8');
    const adminCss = fs.readFileSync(path.resolve(__dirname, '../public/css/admin-v2.css'), 'utf8');

    // Paleta corporativa oficial
    for (const hex of ['#111D32', '#F4F7FB', '#FFFFFF', '#1769AA', '#2563EB', '#17263C', '#526277', '#DCE4ED', '#15803D', '#B7791F', '#C62828']) {
        assert.ok(tokensCss.includes(hex), `Tokens CSS deve conter a cor oficial ${hex}`);
    }
    assert.match(tokensCss, /\[data-adm-theme="light"\]/, 'Deve definir tema claro explícito');
    assert.match(tokensCss, /\[data-adm-theme="dark"\]/, 'Deve definir tema escuro semântico independente');
    assert.match(tokensCss, /'Inter'/, 'Tipografia principal deve ser Inter');
    assert.match(tokensCss, /prefers-reduced-motion:\s*reduce/, 'Deve suportar redução de movimento WCAG 2.2');

    // Sobrescrita de contraste de inputs e foco visível WCAG 2.2 AA
    assert.match(tokensCss, /--adm-control-height:\s*40px/, 'Filtros devem ter altura padronizada de 40px');
    assert.match(adminCss, /:focus-visible/, 'CSS deve definir foco visível acessível');
    assert.match(adminCss, /-webkit-text-fill-color:\s*var\(--adm-text-primary\)/, 'Deve sobrescrever contraste de inputs sobre base.css');
    assert.match(adminCss, /height:\s*var\(--adm-control-height\)/, 'Controles devem aplicar altura padronizada 40px');
    assert.match(adminCss, /@media\s*\(max-width:\s*1440px\)/, 'Deve possuir breakpoint notebook');
    assert.match(adminCss, /@media\s*\(max-width:\s*960px\)/, 'Deve possuir breakpoint tablet/mobile drawer');
    assert.match(adminCss, /@media\s*\(max-width:\s*560px\)/, 'Deve possuir breakpoint smartphone');
});

test('V3-02. Eliminação de cores dark hardcoded e diálogos nativos (confirm/prompt/alert) nos módulos admin', () => {
    const files = [
        'public/js/components/adminView.js',
        'public/js/components/admin/adminUiKit.js',
        'public/js/components/admin/adminCharts.js',
        'public/js/components/admin/adminScreensCore.js',
        'public/js/components/admin/adminScreensCommercial.js',
        'public/js/components/admin/adminScreensFinance.js',
        'public/js/components/admin/adminScreensOps.js'
    ];

    for (const rel of files) {
        const content = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
        assert.doesNotMatch(content, /\bconfirm\s*\(/, `${rel} não deve usar confirm() nativo`);
        assert.doesNotMatch(content, /\bprompt\s*\(/, `${rel} não deve usar prompt() nativo`);
        assert.doesNotMatch(content, /\balert\s*\(/, `${rel} não deve usar alert() nativo`);
        assert.doesNotMatch(content, /style="[^"]*color:\s*(#fff|#ffffff|#94a3b8|#64748b|#00d4ff|#ffd21c|#34d399|#fbbf24|#fecaca)/i, `${rel} não deve possuir cores inline hardcoded do tema escuro`);
    }

    const indexHtml = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
    assert.match(indexHtml, /admin-enterprise-tokens\.css/, 'index.html deve carregar admin-enterprise-tokens.css');
    assert.match(indexHtml, /adminUiKit\.js/, 'index.html deve carregar adminUiKit.js');
});

test('V3-03. Biblioteca AdminUI completa (18 componentes) + Tema Claro/Escuro + 4 Estados da API + 26 Telas + 7 Abas de Oficina', async () => {
    const elements = new Map();
    const makeEl = (id) => {
        const classes = new Set();
        const attrs = new Map();
        const el = {
            id,
            innerHTML: '',
            textContent: '',
            style: { display: '' },
            disabled: false,
            dataset: {},
            setAttribute: (k, v) => attrs.set(k, String(v)),
            getAttribute: (k) => attrs.get(k) || null,
            removeAttribute: (k) => attrs.delete(k),
            classList: {
                add: (...c) => c.forEach(x => classes.add(x)),
                remove: (...c) => c.forEach(x => classes.delete(x)),
                toggle: (c, force) => (force === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (force ? classes.add(c) : classes.delete(c))),
                contains: (c) => classes.has(c)
            }
        };
        elements.set(id, el);
        return el;
    };

    const storage = new Map();
    const docEl = makeEl('html');
    const bodyEl = makeEl('body');
    makeEl('view-content');

    const sandbox = {
        console,
        fetch,
        URLSearchParams,
        FormData,
        setTimeout,
        clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {},
        localStorage: {
            getItem: (k) => storage.get(k) || null,
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k)
        },
        document: {
            hidden: false,
            documentElement: docEl,
            body: { classList: bodyEl.classList, appendChild: () => {} },
            getElementById: (id) => elements.get(id) || makeEl(id),
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            createElement: () => makeEl('dyn')
        },
        App: { currentUser: { name: 'Diretoria DNA AUTO' }, logout: () => {}, switchView: () => {} }
    };
    sandbox.window = { location: { hostname: '127.0.0.1' }, innerWidth: 1920 };

    const ctx = vm.createContext(sandbox);
    const loadScript = (rel, exportName) => {
        const code = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
        vm.runInContext(`${code}\nthis.${exportName} = ${exportName};`, ctx, { filename: rel });
    };

    loadScript('public/js/api.js', 'API');
    sandbox.API.baseUrl = `${baseUrl}/api/v1`;
    sandbox.API.setToken(adminToken);

    loadScript('public/js/components/admin/adminUiKit.js', 'AdminUI');
    loadScript('public/js/components/admin/adminCharts.js', 'AdminCharts');
    loadScript('public/js/components/admin/adminSync.js', 'AdminSync');
    loadScript('public/js/components/admin/adminScreensCore.js', 'AdminScreensCore');
    loadScript('public/js/components/admin/adminScreensCommercial.js', 'AdminScreensCommercial');
    loadScript('public/js/components/admin/adminScreensFinance.js', 'AdminScreensFinance');
    loadScript('public/js/components/admin/adminScreensOps.js', 'AdminScreensOps');
    loadScript('public/js/components/adminView.js', 'AdminView');

    // 1. Validar presença de todos os 18 componentes reutilizáveis na AdminUI
    const requiredComponents = [
        'AdminLayout', 'SidebarNavigation', 'SidebarSection', 'EnterpriseTopbar',
        'Breadcrumbs', 'PageHeader', 'KPIStatCard', 'EnterpriseDataTable',
        'FilterToolbar', 'StatusBadge', 'FinancialMetric', 'DetailDrawer',
        'ConfirmationDialog', 'EmptyState', 'LoadingSkeleton', 'ErrorState',
        'NotificationCenter', 'ThemeSwitcher'
    ];
    for (const comp of requiredComponents) {
        assert.equal(typeof sandbox.AdminUI[comp], 'function', `AdminUI.${comp} deve estar implementado`);
    }

    // 2. Validar render inicial em Tema Claro Corporativo (padrão) e alternância para Tema Escuro
    const shellEl = makeEl('adm-shell');
    makeEl('adm-screen-body');
    sandbox.AdminView.render('dashboard');
    assert.equal(sandbox.AdminView.theme, 'light', 'Tema inicial deve ser claro corporativo');
    assert.equal(docEl.getAttribute('data-adm-theme'), 'light');

    sandbox.AdminView.toggleTheme();
    assert.equal(sandbox.AdminView.theme, 'dark', 'Alternância de tema deve mudar para dark');
    assert.equal(storage.get('dna_adm_theme'), 'dark', 'Tema selecionado deve persistir em localStorage');
    assert.equal(shellEl.getAttribute('data-adm-theme'), 'dark');

    sandbox.AdminView.toggleTheme();
    assert.equal(sandbox.AdminView.theme, 'light', 'Alternância deve voltar para light');

    // 3. Validar 4 estados reais do indicador de status da API
    const pillEl = makeEl('adm-api-pill');
    const pillTxt = makeEl('adm-api-pill-text');
    sandbox.AdminView.updateApiStatusUi({ state: 'CONNECTING' });
    assert.match(pillTxt.textContent, /Verificando/i);
    assert.equal(pillEl.classList.contains('checking'), true);

    sandbox.AdminView.updateApiStatusUi({ state: 'ONLINE', lastSyncAt: new Date().toISOString() });
    assert.match(pillTxt.textContent, /Online/i);

    sandbox.AdminView.updateApiStatusUi({ state: 'RECONNECTING', errorMessage: 'Instável' });
    assert.match(pillTxt.textContent, /Instável/i);
    assert.equal(pillEl.classList.contains('degraded'), true);

    sandbox.AdminView.updateApiStatusUi({ state: 'OFFLINE', errorMessage: 'Offline' });
    assert.match(pillTxt.textContent, /Offline/i);
    assert.equal(pillEl.classList.contains('offline'), true);

    // 4. Validar Dashboard Executivo com 3 blocos (Operacionais, Comerciais, Financeiros)
    sandbox.AdminView.currentScreen = 'dashboard';
    sandbox.AdminView.currentParams = {};
    await sandbox.AdminView.loadScreen();
    const dashHtml = elements.get('adm-screen-body').innerHTML;
    assert.match(dashHtml, /Indicadores Operacionais/i);
    assert.match(dashHtml, /Indicadores Comerciais/i);
    assert.match(dashHtml, /Indicadores Financeiros/i);
    assert.match(dashHtml, /Evolução Mensal de Cadastramentos/i);

    // 5. Validar Página Oficinas Credenciadas (KPIs, Filtros 40px, 12 colunas, Export CSV, Menu Contextual)
    sandbox.AdminView.currentScreen = 'workshops';
    sandbox.AdminView.currentParams = {};
    await sandbox.AdminView.loadScreen();
    const wsListHtml = elements.get('adm-screen-body').innerHTML;
    assert.match(wsListHtml, /Oficinas Credenciadas/);
    assert.match(wsListHtml, /Gerenciamento completo da rede de oficinas parceiras DNA AUTO/);
    assert.match(wsListHtml, /Total de Oficinas/);
    assert.match(wsListHtml, /Oficinas Ativas/);
    assert.match(wsListHtml, /Oficinas Pendentes/);
    assert.match(wsListHtml, /Clientes Vinculados/);
    assert.match(wsListHtml, /Veículos Registrados/);
    assert.match(wsListHtml, /Faturamento Atribuído/);
    assert.match(wsListHtml, /Exportar CSV/);
    assert.match(wsListHtml, /Aplicar Filtros/);
    assert.match(wsListHtml, /Oficina Enterprise SP/);
    assert.match(wsListHtml, /Suspender/);

    // 6. Validar ConfirmationDialog ao acionar Suspender Oficina (sem confirm() nativo)
    makeEl('adm-modal-root');
    sandbox.AdminView.changeWorkshopStatus(workshopId, 'SUSPENDED', 'Oficina Enterprise SP');
    const modalHtml = elements.get('adm-modal-root').innerHTML;
    assert.match(modalHtml, /Suspender Oficina/);
    assert.match(modalHtml, /role="dialog"/);
    sandbox.AdminView.closeModal();

    // 7. Validar DetailDrawer (gaveta rápida da oficina)
    makeEl('adm-drawer-root');
    await sandbox.AdminScreensCore.openWorkshopQuickDrawer(workshopId);
    const drawerHtml = elements.get('adm-drawer-root').innerHTML;
    assert.match(drawerHtml, /Oficina Enterprise SP/);
    assert.match(drawerHtml, /Abrir Detalhamento Completo/);
    sandbox.AdminView.closeDetailDrawer();

    // 8. Validar Detalhamento Completo da Oficina nas 7 abas obrigatórias
    const wsTabs = ['summary', 'clients', 'vehicles', 'attendances', 'financial', 'representative', 'audit'];
    for (const subtab of wsTabs) {
        sandbox.AdminView.currentScreen = 'workshop-detail';
        sandbox.AdminView.currentParams = { id: workshopId, subtab };
        await sandbox.AdminView.loadScreen();
        const tabHtml = elements.get('adm-screen-body').innerHTML;
        assert.match(tabHtml, /Oficina Enterprise SP/, `Aba ${subtab} deve exibir o cabeçalho da oficina`);
        assert.doesNotMatch(tabHtml, /Falha ao consultar dados atualizados da API/i, `Aba ${subtab} não pode falhar`);
    }

    // 9. Validar renderização limpa de todas as 26 rotas do menu ERP
    const allScreenIds = sandbox.AdminView.MENU_GROUPS.flatMap(g => g.items.map(i => i.id));
    assert.equal(allScreenIds.length, 26);
    for (const screenId of allScreenIds) {
        sandbox.AdminView.currentScreen = screenId;
        sandbox.AdminView.currentParams = {};
        await sandbox.AdminView.loadScreen();
        const html = elements.get('adm-screen-body').innerHTML;
        assert.ok(html.length > 100, `Tela ${screenId} deve renderizar conteúdo corporativo`);
        assert.doesNotMatch(html, /Falha ao consultar dados atualizados da API/i, `Tela ${screenId} não pode falhar`);
    }

    sandbox.AdminView.destroy();
});
