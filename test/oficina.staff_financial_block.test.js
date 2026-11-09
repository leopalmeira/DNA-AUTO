/**
 * DNA AUTO — Teste de Homologação: Bloqueio Total do Módulo Financeiro para Funcionários
 */
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Regra Absoluta: Bloqueio Total do Card e Telas Financeiras para Funcionários...');

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
            contains(c) { return this._classes.has(c); }
        },
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k] || null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        appendChild(child) { this.children.push(child); return child; }
    };
}

global.document = {
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

const wvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopView.js'), 'utf8')
    .replace('const WorkshopView =', 'global.WorkshopView =');
const wmvCode = fs.readFileSync(path.resolve('oficina.app/js/components/workshopMobileView.js'), 'utf8');

eval(wvCode);
eval(wmvCode);

assert.ok(typeof WorkshopView !== 'undefined', 'WorkshopView deve estar definido');
console.log('✅ WorkshopView inicializado no contexto de teste');

// =========================================================================
// TESTE 1: MODO FUNCIONÁRIO / REGISTRADOR
// =========================================================================
console.log('\n[Cenário 1] Usuário logado como Funcionário / Registrador...');
global.localStorage.setItem('dna_logged_user', JSON.stringify({
    id: 'usr_staff_1',
    name: 'Marcos Mecânico',
    email: 'marcos@oficina.com.br',
    role_code: 'WORKSHOP_STAFF',
    role_id: 'role_workshop_staff',
    position_title: 'Mecânico e Registrador de Peças',
    is_registrar: true,
    can_access_billing: false
}));

assert.strictEqual(WorkshopView.isStaffUser(), true, 'Deve reconhecer como funcionário/staff');
assert.strictEqual(WorkshopView.isRegistrarUser(), true, 'isRegistrarUser deve ser compatível');

// 1.1 Dashboard do Funcionário
const staffDash = WorkshopView.renderMobileDashboardView();
assert.ok(!staffDash.includes('id="financeiro"'), 'O card de Financeiro NÃO DEVE existir para o funcionário');
assert.ok(!staffDash.includes('Receitas, despesas e faturamento'), 'Texto financeiro não deve aparecer na dashboard do funcionário');
assert.ok(staffDash.includes('id="ordens-servico"'), 'Card Ordens de Serviço deve estar no lugar para o funcionário');
assert.ok(staffDash.includes('id="cadastrar"'), 'Card Cadastrar Veículo presente');
assert.ok(staffDash.includes('id="servicos"'), 'Card Lançar Serviços presente');
console.log('✅ 1.1 Dashboard do Funcionário: Card Financeiro NÃO APARECE (Substituído por Ordens de Serviço)');

// 1.2 Barra Inferior do Funcionário
const staffNav = WorkshopView.renderMobileBottomNav();
assert.ok(!staffNav.includes('Financeiro</span>'), 'Aba Financeiro NÃO DEVE existir para o funcionário');
assert.ok(staffNav.includes('Serviços</span>'), 'Aba Serviços deve estar presente na barra do funcionário');
console.log('✅ 1.2 Barra Inferior: Aba Financeiro NÃO APARECE (Substituída por Serviços)');

// 1.3 Menu Superior do Funcionário
const staffMenu = WorkshopView.renderWorkshopTopMenuDrawerInner();
assert.ok(!staffMenu.includes('Fechamento Mensal da Oficina'), 'Resumo de faturamento mensal NÃO DEVE aparecer para funcionário');
assert.ok(!staffMenu.includes('Repassar para a Plataforma'), 'Valores de repasse NÃO DEVEM aparecer para funcionário');
assert.ok(!staffMenu.includes('Ver Detalhes e Quitar Repasse no Financeiro'), 'Botão de quitar repasse NÃO DEVE aparecer');
assert.ok(!staffMenu.includes('Cadastrar Registradores'), 'Opção de cadastrar registradores NÃO DEVE aparecer para funcionário');
assert.ok(staffMenu.includes('Ações Operacionais do Funcionário'), 'Painel operacional do funcionário exibido com sucesso');
console.log('✅ 1.3 Menu Superior: Zero menção ou acesso a dados financeiros ou cadastro de funcionários');

// 1.4 Tentativa de Navegação Direta para 'financeiro'
WorkshopView.currentSection = 'dashboard';
WorkshopView.switchMobileSection('financeiro');
assert.strictEqual(WorkshopView.currentSection, 'dashboard', 'Tentativa de acessar financeiro deve ser bloqueada e voltar ao dashboard');
console.log('✅ 1.4 Bloqueio de Navegação Direta: Acesso a "financeiro" bloqueado com sucesso');

// =========================================================================
// TESTE 2: MODO GESTOR / DONO DA OFICINA
// =========================================================================
console.log('\n[Cenário 2] Usuário logado como Gestor / Dono da Oficina...');
global.localStorage.setItem('dna_logged_user', JSON.stringify({
    id: 'usr_owner_1',
    name: 'Carlos Dono',
    email: 'carlos@veloce.com.br',
    role_code: 'WORKSHOP_OWNER',
    role_id: 'role_workshop_owner',
    position_title: 'Proprietário Geral da Oficina',
    is_registrar: false,
    can_access_billing: true
}));

assert.strictEqual(WorkshopView.isStaffUser(), false, 'Não deve ser classificado como funcionário restrito');

// 2.1 Dashboard do Gestor
const ownerDash = WorkshopView.renderMobileDashboardView();
assert.ok(ownerDash.includes('id="financeiro"'), 'Card Financeiro DEVE estar presente para o gestor');
assert.ok(ownerDash.includes('Receitas, despesas e faturamento'), 'Descrição financeira presente para o gestor');
console.log('✅ 2.1 Dashboard do Gestor: Card Financeiro exibido com sucesso');

// 2.2 Barra Inferior do Gestor
const ownerNav = WorkshopView.renderMobileBottomNav();
assert.ok(ownerNav.includes('Financeiro</span>'), 'Aba Financeiro exibida para o gestor');
console.log('✅ 2.2 Barra Inferior do Gestor: Aba Financeiro presente');

// 2.3 Menu Superior do Gestor
const ownerMenu = WorkshopView.renderWorkshopTopMenuDrawerInner();
assert.ok(ownerMenu.includes('Fechamento Mensal da Oficina'), 'Resumo mensal presente para o gestor');
assert.ok(ownerMenu.includes('Repassar para a Plataforma'), 'Dados de repasse presentes para o gestor');
assert.ok(ownerMenu.includes('Cadastrar Registradores'), 'Gestão de registradores presente para o gestor');
console.log('✅ 2.3 Menu Superior do Gestor: Gestão completa de faturamento e equipe');

console.log('\n🎉 TODOS OS TESTES DE ISOLAMENTO FINANCEIRO FORAM APROVADOS COM 100% DE ÊXITO!');
