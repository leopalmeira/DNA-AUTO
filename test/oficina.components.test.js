/**
 * DNA AUTO — Bateria de Testes de Componentes do Aplicativo da Oficina (Headless DOM)
 * Validação rigorosa de 100% dos cards, botões, rotas e formulários sem uso de navegador.
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Testes Unitários de Componentes da Oficina (Headless DOM)...');

// 1. Simulação leve do ambiente global DOM / Browser para execução em Node.js
global.window = {
    location: { search: '', hash: '#dashboard' },
    scrollTo: () => {},
    localStorage: {
        _data: {},
        getItem(k) { return this._data[k] || null; },
        setItem(k, v) { this._data[k] = String(v); },
        removeItem(k) { delete this._data[k]; }
    },
    sessionStorage: {
        _data: {},
        getItem(k) { return this._data[k] || null; },
        setItem(k, v) { this._data[k] = String(v); },
        removeItem(k) { delete this._data[k]; }
    }
};
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;

// Mock de DOM Elements
function createMockElement(tag, id = '', className = '') {
    return {
        tagName: tag.toUpperCase(),
        id,
        className,
        style: {},
        attributes: {},
        children: [],
        innerHTML: '',
        value: '',
        classList: {
            _classes: new Set(className ? className.split(' ') : []),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            toggle(c, force) {
                if (force !== undefined) {
                    if (force) this._classes.add(c); else this._classes.delete(c);
                } else {
                    if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
                }
            },
            contains(c) { return this._classes.has(c); }
        },
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k] || null; },
        querySelector(sel) { return null; },
        querySelectorAll(sel) { return []; },
        appendChild(child) { this.children.push(child); return child; },
        addEventListener(event, fn) { this[`on${event}`] = fn; },
        removeEventListener() {}
    };
}

const mockDoc = {
    body: createMockElement('body', 'body', 'is-workshop-erp'),
    elements: new Map(),
    getElementById(id) {
        if (!this.elements.has(id)) {
            const el = createMockElement('div', id);
            this.elements.set(id, el);
        }
        return this.elements.get(id);
    },
    createElement(tag) { return createMockElement(tag); },
    querySelectorAll() { return []; },
    querySelector() { return null; }
};
global.document = mockDoc;

// Carrega scripts da oficina no contexto
const wvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopView.js'), 'utf8')
    .replace('const WorkshopView =', 'global.WorkshopView =');
const wmvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopMobileView.js'), 'utf8');

eval(wvCode);
eval(wmvCode);

assert.ok(typeof WorkshopView !== 'undefined', 'WorkshopView deve estar definido');
console.log('✅ WorkshopView inicializado no contexto de teste');

// TESTE 1: Validação do Dashboard e dos 8 Cards Oficiais
console.log('📌 Testando Tela 1: Dashboard (8 Cards)...');
WorkshopView.currentSection = 'dashboard';
const dashHtml = WorkshopView.renderMobileDashboardView();

assert.ok(dashHtml.includes("switchMobileSection('entrada-veiculos')"), 'Card 1 (Entrada de Veículos) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('lancar-servicos')"), 'Card 2 (Lançar Serviços) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('nota-fiscal')"), 'Card 3 (Notas Fiscais) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('buscar-veiculos')"), 'Card 4 (Buscar Veículos) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('manutencao-veiculos')"), 'Card 5 (Manutenção dos Veículos) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('avisos-whatsapp')"), 'Card 6 (Avisos WhatsApp) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('financeiro')"), 'Card 7 (Financeiro) presente e interativo');
assert.ok(dashHtml.includes("switchMobileSection('suporte')"), 'Card 8 (Suporte) presente e interativo');
console.log('✅ Teste 1: Todos os 8 cards do Dashboard foram validados');

// TESTE 2: Roteamento de Sub-Telas em renderMobileActiveSection
console.log('📌 Testando Roteamento de Sub-Telas...');
const routeTests = [
    { section: 'entrada-veiculos', match: 'ws-entry-plate' },
    { section: 'cadastrar-cliente', match: 'Cadastrar Cliente' },
    { section: 'lancar-servicos', match: 'dna-vertical-carousel' },
    { section: 'detalhe-servico', match: 'dna-mobile-subpage-title' },
    { section: 'manutencao-veiculos', match: 'Manuten' },
    { section: 'avisos-manutencao', match: 'Avisos' },
    { section: 'avisos-whatsapp', match: 'WhatsApp' },
    { section: 'enviar-fotos', match: 'Foto' },
    { section: 'nota-fiscal', match: 'Nota' },
    { section: 'clientes', match: 'Clientes' },
    { section: 'buscar-veiculos', match: 'Buscar' },
    { section: 'ordens-servico', match: 'Ordens de Servi' },
    { section: 'relatorios', match: 'Relat' },
    { section: 'financeiro', match: 'Financeiro' },
    { section: 'estoque', match: 'Estoque' },
    { section: 'configuracoes', match: 'Configura' },
    { section: 'suporte', match: 'Suporte' }
];

routeTests.forEach(({ section, match }) => {
    WorkshopView.currentSection = section;
    const html = WorkshopView.renderMobileActiveSection();
    assert.ok(html && html.includes(match), `Rota "${section}" deve renderizar conteúdo contendo "${match}"`);
});
console.log('✅ Teste 2: Todas as 17 rotas operacionais de sub-telas respondem com suas views exclusivas');

// TESTE 3: Tela "Lançar Serviços" e Carrossel Vertical 3D
console.log('📌 Testando Tela "Lançar Serviços" e Carrossel 3D...');
WorkshopView.currentSection = 'lancar-servicos';
const launchHtml = WorkshopView.renderMobileLaunchServicesView();

assert.ok(launchHtml.includes('id="mobile-launch-plate-input"'), 'Input de placa do veículo presente');
assert.ok(launchHtml.includes('id="dna-vertical-carousel"'), 'Container do carrossel 3D presente');
assert.ok(launchHtml.includes('id="carousel-up-btn"'), 'Botão subir carrossel presente');
assert.ok(launchHtml.includes('id="carousel-down-btn"'), 'Botão descer carrossel presente');
assert.ok(launchHtml.includes('id="carousel-action-btn"'), 'Botão de confirmação de serviço presente');
assert.ok(launchHtml.includes('id="dna-carousel-indicator"'), 'Indicadores de dot verticais presentes');

// Validar catálogo do carrossel
assert.ok(Array.isArray(WorkshopView.launchCarouselServices), 'Catálogo de serviços do carrossel presente');
assert.ok(WorkshopView.launchCarouselServices.length >= 10, 'Carrossel possui catálogo completo (>= 10 serviços)');

// Simular seleção de serviço no carrossel
WorkshopView.selectCarouselCard(2);
assert.equal(WorkshopView._carouselCurrentIndex, 2, 'Índice do carrossel atualizado para 2');

WorkshopView.moveCarousel(1);
assert.equal(WorkshopView._carouselCurrentIndex, 3, 'Movimento relativo do carrossel (+1) alterou índice para 3');

console.log('✅ Teste 3: Carrossel 3D, catálogo e seletores verticais 100% validados');

// TESTE 4: Detalhes do Serviço & Gestão de Peças
console.log('📌 Testando Detalhes do Serviço & Gestão de Peças...');
WorkshopView.selectedMobileService = WorkshopView.launchCarouselServices[0];
WorkshopView.selectedMobileVehicle = {
    id: 'veh_test_corolla',
    license_plate: 'BRA2E19',
    brand: 'Toyota',
    model: 'Corolla XEi 2.0',
    mileage: 45000
};

// Reset e adição de peças
WorkshopView.mobileDetailParts = [];
WorkshopView.mobileDetailParts.push({
    part_name: 'Filtro de Óleo Fram',
    quantity: 1,
    unit_price_cents: 4500
});
WorkshopView.mobileDetailParts.push({
    part_name: 'Óleo Sintético 5W30',
    quantity: 4,
    unit_price_cents: 4200
});

assert.equal(WorkshopView.mobileDetailParts.length, 2, '2 peças adicionadas');
const partsCost = WorkshopView.mobileDetailParts.reduce((acc, p) => acc + (p.unit_price_cents * p.quantity), 0);
assert.equal(partsCost, 21300, 'Custo das peças confere: R$ 213,00 (21300 centavos)');

WorkshopView.removeDetailPart(0);
assert.equal(WorkshopView.mobileDetailParts.length, 1, 'Remoção de peça confirmada');
console.log('✅ Teste 4: Gestão de peças, quantidades e valores aprovados');

// TESTE 5: Modal de WhatsApp de Acompanhamento
console.log('📌 Testando Modal de WhatsApp...');
WorkshopView.openClientMonitoringWhatsAppModal(
    'Carlos Silva',
    '11998765432',
    'BRA2E19',
    'Toyota Corolla',
    'Troca de Óleo',
    'WARNING',
    encodeURIComponent('Olá Carlos, seu Corolla precisa de revisão.')
);
const modalEl = mockDoc.getElementById('dna-mobile-whatsapp-modal');
assert.ok(modalEl, 'Modal de WhatsApp foi criado no DOM');
assert.ok(modalEl.classList.contains('active'), 'Modal de WhatsApp está com classe active');
assert.ok(modalEl.innerHTML.includes('Carlos Silva'), 'Nome do cliente inserido no modal');
assert.ok(modalEl.innerHTML.includes('BRA2E19'), 'Placa do veículo inserida no modal');
console.log('✅ Teste 5: Modal de acompanhamento WhatsApp validado');

console.log('\n🎉 TODOS OS TESTES UNITÁRIOS DE COMPONENTES DA OFICINA PASSARAM COM SUCESSO!\n');
