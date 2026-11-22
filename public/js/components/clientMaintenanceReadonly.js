/* DNA AUTO — manutenção do cliente exclusivamente para consulta.
 * Nenhuma alteração de status, cadastro ou histórico é enviada por esta tela.
 * A oficina mantém a autoridade sobre registros comprovados de serviços.
 */
(function () {
  'use strict';

  const state = { filter: 'pending', data: { pending: [], completed: [] }, seq: 0, loading: false, error: '' };
  const formatKm = value => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' km';
  const hasKm = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

  function predictionModel(p) {
    const status = String(p.alert_status || '').toUpperCase();
    const due = hasKm(p.next_due_km) && Number(p.next_due_km) > 0 ? Number(p.next_due_km) : null;
    const current = hasKm(p.current_estimated_km) ? Number(p.current_estimated_km) : null;
    const remains = due !== null && current !== null && status !== 'DADOS_INSUFICIENTES' ? Math.round(due - current) : null;
    let badge = 'Acompanhar', tone = 'info';
    if (status === 'VENCIDA' || (remains !== null && remains < 0)) { badge = 'Atrasada'; tone = 'danger'; }
    else if (status === 'RECOMENDADA') { badge = 'Recomendada'; tone = 'warning'; }
    else if (status === 'APROXIMANDO') { badge = 'Próxima'; tone = 'warning'; }
    else if (status === 'CONFIRMACAO_OFICINA') { badge = 'Verificar na oficina'; tone = 'warning'; }
    else if (status === 'DADOS_INSUFICIENTES') { badge = 'Dados insuficientes'; tone = 'info'; }
    else if (status === 'EM_DIA') { badge = 'Em dia'; tone = 'good'; }

    const distance = remains === null ? 'Prazo a confirmar' : remains < 0
      ? 'Atrasada ' + formatKm(Math.abs(remains))
      : 'Faltam ' + formatKm(remains);
    const recommendation = due !== null ? 'Previsão aos ' + formatKm(due) : 'Prazo ainda não definido';
    const interval = hasKm(p.recommended_interval_km) && Number(p.recommended_interval_km) > 0
      ? ' · intervalo de ' + formatKm(p.recommended_interval_km) : '';
    return {
      title: p.item_name || 'Manutenção preventiva',
      badge, tone, distance,
      subtitle: recommendation + interval,
      detail: p.rationale || 'Previsão calculada pelo DNA AUTO. A necessidade de troca deve ser avaliada pela oficina.',
      note: p.category || 'Manutenção preventiva',
      info: 'Previsão do sistema · confirmação pela oficina',
      provenance: 'Previsão calculada, não comprovação de serviço'
    };
  }

  function completedModel(s) {
    const km = hasKm(s.mileage) ? formatKm(s.mileage) : '';
    const date = s.date ? String(s.date).slice(0, 10).split('-').reverse().join('/') : 'Data não informada';
    const workshop = s.workshop_name || 'Oficina credenciada';
    return {
      title: s.title || 'Serviço realizado',
      badge: 'Concluída', tone: 'good',
      distance: km ? 'Realizada aos ' + km : 'Serviço concluído',
      subtitle: 'Em ' + date + ' · ' + workshop,
      detail: s.description || 'Serviço registrado e confirmado pela oficina.',
      note: s.category || 'Manutenção',
      info: 'Comprovado pela oficina',
      provenance: 'Registro de serviço confirmado pela oficina'
    };
  }

  function makeIcon(className, textValue) {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    node.textContent = textValue;
    return node;
  }

  function card(model) {
    const article = document.createElement('article');
    article.className = 'dna-maint-card tone-' + model.tone;
    article.setAttribute('aria-label', model.title + ', ' + model.badge);
    const header = document.createElement('div');
    header.className = 'dna-maint-main';
    header.appendChild(makeIcon('dna-maint-icon', model.tone === 'good' ? '✓' : model.tone === 'danger' ? '!' : '⚙'));
    const copy = document.createElement('div');
    copy.className = 'dna-maint-copy';
    const title = document.createElement('h2');
    title.className = 'dna-maint-name';
    title.textContent = model.title;
    const badge = document.createElement('span');
    badge.className = 'dna-maint-badge';
    badge.textContent = model.badge;
    const distance = document.createElement('p');
    distance.className = 'dna-maint-distance';
    distance.textContent = model.distance;
    const subtitle = document.createElement('p');
    subtitle.className = 'dna-maint-recommendation';
    subtitle.textContent = model.subtitle;
    copy.append(title, badge, distance, subtitle);
    header.appendChild(copy);
    article.appendChild(header);

    const footer = document.createElement('div');
    footer.className = 'dna-maint-footer';
    const onlyView = document.createElement('span');
    onlyView.className = 'dna-maint-readonly';
    onlyView.textContent = '◉ ' + model.info;
    const detailBtn = document.createElement('button');
    detailBtn.className = 'dna-maint-details';
    detailBtn.type = 'button';
    detailBtn.textContent = 'Ver detalhes →';
    detailBtn.setAttribute('aria-label', 'Ver detalhes de ' + model.title);
    detailBtn.addEventListener('click', () => showDetails(model));
    footer.append(onlyView, detailBtn);
    article.appendChild(footer);
    return article;
  }

  function showDetails(model) {
    document.getElementById('dna-maint-detail-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'dna-maint-detail-modal';
    overlay.className = 'dna-maint-overlay';
    const panel = document.createElement('section');
    panel.className = 'dna-maint-dialog';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'dna-maint-detail-title');
    const header = document.createElement('div');
    header.className = 'dna-maint-dialog-header';
    const heading = document.createElement('h2');
    heading.id = 'dna-maint-detail-title';
    heading.textContent = model.title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dna-maint-dialog-close';
    close.setAttribute('aria-label', 'Fechar detalhes');
    close.textContent = '×';
    close.onclick = () => overlay.remove();
    header.append(heading, close);
    panel.appendChild(header);
    for (const [label, value] of [
      ['Situação', model.badge],
      ['Quilometragem', model.distance],
      ['Recomendação / Registro', model.subtitle],
      ['Descrição', model.detail],
      ['Categoria', model.note],
      ['Origem', model.provenance]
    ]) {
      const row = document.createElement('div');
      row.className = 'dna-maint-dialog-field';
      const term = document.createElement('strong');
      term.textContent = label;
      const definition = document.createElement('p');
      definition.textContent = value;
      row.append(term, definition);
      panel.appendChild(row);
    }
    const footer = document.createElement('p');
    footer.className = 'dna-maint-dialog-note';
    footer.textContent = 'As informações de manutenção só podem ser confirmadas ou alteradas pela oficina responsável.';
    panel.appendChild(footer);
    overlay.appendChild(panel);
    overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    close.focus();
  }

  function render() {
    const list = document.getElementById('alertas-list');
    if (!list) return;
    list.replaceChildren();
    const pending = state.data.pending || [];
    const completed = state.data.completed || [];
    document.getElementById('alertas-pending-count').textContent = String(pending.length);
    document.getElementById('alertas-done-count').textContent = String(completed.length);
    const tabPending = document.getElementById('tab-btn-pending');
    const tabDone = document.getElementById('tab-btn-done');
    [tabPending, tabDone].forEach((el, index) => {
      if (!el) return;
      const selected = (index === 0) === (state.filter === 'pending');
      el.classList.toggle('active', selected);
      el.setAttribute('aria-selected', String(selected));
    });

    const sideBadge = document.getElementById('alertCount');
    if (sideBadge) sideBadge.textContent = String(pending.length);
    const empty = document.createElement('div');
    empty.className = 'dna-maint-empty';
    if (state.loading || state.error) {
      empty.textContent = state.loading ? 'Consultando manutenções do veículo...' : state.error;
      list.appendChild(empty);
      return;
    }
    const visible = state.filter === 'pending' ? pending.map(predictionModel) : completed.map(completedModel);
    if (!visible.length) {
      empty.textContent = state.filter === 'pending'
        ? 'Nenhuma manutenção preventiva disponível para este veículo no momento.'
        : 'Ainda não há serviços concluídos e confirmados por oficina neste veículo.';
      list.appendChild(empty);
      return;
    }
    visible.forEach(item => list.appendChild(card(item)));
  }

  function filter(nextFilter) {
    if (nextFilter !== 'pending' && nextFilter !== 'done') return;
    state.filter = nextFilter;
    render();
  }

  async function refresh() {
    const sequence = ++state.seq;
    state.loading = true;
    state.error = '';
    state.data = { pending: [], completed: [] };
    render();
    const token = localStorage.getItem('dna_token') || localStorage.getItem('dna_auto_token');
    if (!token) {
      state.loading = false;
      state.error = 'Entre na sua conta para consultar as manutenções do veículo.';
      render();
      return;
    }
    try {
      let vehicle = window.currentRegisteredVehicle;
      let identifier = vehicle?.id || vehicle?.license_plate || localStorage.getItem('dna_registered_plate');
      if (!identifier) {
        const my = await fetch('/api/v1/vehicles/my-vehicles', {
          headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
        });
        if (!my.ok) throw new Error('Não foi possível identificar seu veículo.');
        const body = await my.json();
        identifier = body.vehicles?.[0]?.id || body.vehicles?.[0]?.license_plate;
      }
      if (!identifier) throw new Error('Nenhum veículo vinculado à conta.');
      const res = await fetch('/api/v1/vehicles/' + encodeURIComponent(identifier) + '/maintenance-overview', {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('Acesso não autorizado às manutenções deste veículo.');
        throw new Error('Não foi possível carregar as manutenções. Tente abrir esta tela novamente.');
      }
      const data = await res.json();
      if (!data.success) throw new Error('Resposta inválida do servidor.');
      if (sequence !== state.seq) return;
      state.data = {
        pending: Array.isArray(data.pending) ? data.pending : [],
        completed: Array.isArray(data.completed) ? data.completed : []
      };
    } catch (err) {
      if (sequence !== state.seq) return;
      state.error = err.message || 'Falha ao carregar as manutenções.';
    } finally {
      if (sequence === state.seq) {
        state.loading = false;
        render();
      }
    }
  }

  window.DNAClientMaintenance = { refresh, filter, render };
})();