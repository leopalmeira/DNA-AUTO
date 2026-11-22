'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

async function run() {
  const appHtml = read('cliente.app/index.html');
  const publicHtml = read('public/cliente.html');
  const clientModule = read('cliente.app/js/components/clientMaintenanceReadonly.js');
  const publicModule = read('public/js/components/clientMaintenanceReadonly.js');
  const backend = read('server/src/modules/vehicles/vehicles.routes.js');
  assert.equal(appHtml, publicHtml, 'Frontend público deve espelhar tela cliente');
  assert.equal(clientModule, publicModule, 'Módulo JS público deve espelhar app cliente');
  assert.equal(read('cliente.app/css/maintenance-readonly.css'),
    read('public/css/maintenance-readonly.css'), 'CSS público deve espelhar app cliente');

  const start = appHtml.indexOf('<section class="screen" id="alertas">');
  const end = appHtml.indexOf('<section class="screen" id="gastos">', start);
  assert.ok(start > 0 && end > start, 'Tela Alertas deve existir');
  const alertHtml = appHtml.slice(start, end);
  assert.ok(!alertHtml.includes('alert-conclude-btn') && !alertHtml.includes('alert-reopen-btn'),
    'Cliente não deve ver botões para concluir/reabrir manutenção');
  assert.ok(!appHtml.includes('function concluirAlertaServico') && !appHtml.includes('function reabrirAlertaServico'),
    'Cliente não deve possuir manipuladores de alteração de status');
  assert.ok(!appHtml.includes("localStorage.getItem('dna_concluded_alerts')"),
    'O armazenamento local não pode ser fonte de verdade das manutenções');
  assert.ok(!alertHtml.includes('Faltam 3.000 km'), 'A tela não deve apresentar prazos fictícios fixos');
  assert.ok(appHtml.includes('/js/components/clientMaintenanceReadonly.js?v=1'));
  assert.ok(appHtml.includes('/css/maintenance-readonly.css?v=1'));

  assert.ok(backend.includes("router.get('/:identifier/maintenance-overview', authenticateToken, authorizeTrackingVehicleOwner,"),
    'Endpoint deve exigir JWT e vínculo com o veículo');
  assert.ok(backend.includes('sr.proof_level >= 3') &&
    backend.includes("sr.workshop_confirmation_status = 'CONFIRMED'") &&
    backend.includes('sr.workshop_id IS NOT NULL'),
    'Conclusões são somente de serviços confirmados por oficina');

  new vm.Script(clientModule, { filename: 'clientMaintenanceReadonly.js' });

  const elements = new Map();
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.events = {};
      this.textContent = '';
      this.dataset = {};
      this.style = {};
      this.className = '';
      this.classList = { toggle() {} };
      this.attributes = {};
    }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); if (child.id) elements.set(child.id, child); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, fn) { this.events[name] = fn; }
    focus() { this.focused = true; }
    remove() { elements.delete(this.id); }
  }
  for (const id of ['alertas-list', 'alertas-pending-count', 'alertas-done-count',
    'tab-btn-pending', 'tab-btn-done', 'alertCount']) {
    elements.set(id, new Element('div'));
  }
  const body = new Element('body');
  body.appendChild = child => { body.children.push(child); if (child.id) elements.set(child.id, child); };
  const document = {
    body,
    getElementById: id => elements.get(id) || null,
    createElement: tag => new Element(tag)
  };
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, method: options?.method || 'GET' });
    return {
      ok: true,
      json: async () => ({
        success: true,
        pending: [{
          item_name: 'Pastilhas de Freio Dianteiras',
          alert_status: 'APROXIMANDO',
          next_due_km: 45000,
          current_estimated_km: 40000,
          recommended_interval_km: 20000,
          rationale: 'Peça deve ser examinada pela oficina.'
        }],
        completed: [{
          id: 'srv_1', title: 'Troca de Óleo de Motor',
          workshop_name: 'Oficina Credenciada',
          service_date: '2026-11-20', date: '2026-11-20',
          mileage: 70000, proof_level: 4
        }]
      })
    };
  };
  const window = { currentRegisteredVehicle: { id: 'veh_test' } };
  const localStorage = { getItem: name => name === 'dna_token' ? 'fake-token' : null };
  vm.runInNewContext(clientModule, { window, document, localStorage, fetch, console });
  const module = window.DNAClientMaintenance;
  assert.deepEqual(Object.keys(module).sort(), ['filter', 'refresh', 'render']);
  await module.refresh();
  assert.equal(elements.get('alertas-pending-count').textContent, '1');
  assert.equal(elements.get('alertas-done-count').textContent, '1');
  assert.equal(elements.get('alertas-list').children.length, 1);
  const pendingCard = elements.get('alertas-list').children[0];
  assert.ok(pendingCard.children[0].children[1].children[2].textContent.includes('5.000 km'));

  module.filter('done');
  assert.equal(elements.get('alertas-list').children.length, 1);
  const completedCard = elements.get('alertas-list').children[0];
  completedCard.children[1].children[1].events.click();
  assert.ok(elements.get('dna-maint-detail-modal'), 'Ver detalhes abre modal de consulta');
  assert.deepEqual(calls, [
    { url: '/api/v1/vehicles/veh_test/maintenance-overview', method: 'GET' }
  ], 'A tela de manutenção jamais emite requests de escrita');

  console.log('✅ Tela de manutenção: somente leitura, fonte servidor, sincronização e detalhes passaram.');
}
run().catch(err => { console.error(err); process.exitCode = 1; });
