
'use strict';
const byId = id => document.getElementById(id);
const formatMoney = cents => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format((cents || 0) / 100);
const titles = { overview:'Visão geral', appointments:'Agendamentos', vehicles:'Veículos', pending:'Serviços aguardando valor', finance:'Financeiro' };
let token, workshop, state, timer, page = 'overview', urls = [];
function node(tag, value, className) {
    const result = document.createElement(tag);
    if (value !== undefined) result.textContent = value;
    if (className) result.className = className;
    return result;
}
async function request(path, body) {
    const headers = token ? { Authorization:'Bearer ' + token } : {};
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch('/api/v1' + path, { headers, cache:'no-store', method:body ? 'POST':'GET', body:body ? JSON.stringify(body):undefined });
    if (response.ok && response.headers.get('Content-Type')?.startsWith('image/')) return response.blob();
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401 && token) endSession('Sessão expirada. Entre novamente.');
        throw new Error(data.error || 'A operação não foi concluída.');
    }
    return data;
}
function endSession(message = '') {
    clearInterval(timer);
    token = workshop = state = undefined;
    page = 'overview';
    clearView();
    byId('layout').hidden = true;
    byId('login').hidden = false;
    byId('loginError').textContent = message;
}
function status(message, error = false) {
    byId('status').textContent = message;
    byId('status').className = error ? 'error' : '';
}
async function update() {
    const session = token;
    const data = await request('/services/price-queue');
    if (session !== token) return;
    state = data;
    byId('count').textContent = state.pending.length || '';
    byId('pendingLink').classList.toggle('attention', Boolean(state.pending.length));
}
function clearView() {
    byId('view').replaceChildren();
    urls.forEach(url => URL.revokeObjectURL(url));
    urls = [];
}
function table(headers, rows, empty) {
    if (!rows.length) return node('p', empty, 'muted');
    const wrapper = node('div', undefined, 'table');
    const table = node('table');
    const head = table.createTHead().insertRow();
    headers.forEach(text => head.append(node('th', text)));
    const body = table.createTBody();
    rows.forEach(row => {
        const line = body.insertRow();
        row.forEach(value => line.insertCell().textContent = value ?? '—');
    });
    wrapper.append(table);
    return wrapper;
}
function pendingCard(item) {
    const card = node('article', undefined, 'card');
    card.append(node('h2', item.service_title),
        node('p', [item.owner_name, item.brand, item.model, item.license_plate].filter(Boolean).join(' · ')),
        node('p', item.phone ? 'WhatsApp: ' + item.phone : 'WhatsApp indisponível', 'muted'));
    const deadline = new Date(item.created_at.replace(' ', 'T') + 'Z').getTime() + 86400000;
    const hours = Math.ceil((deadline - Date.now()) / 3600000);
    card.append(node('p', hours > 0 ? 'Prazo restante: até ' + hours + ' h' : 'Atrasado', hours > 0 ? 'muted' : 'late'));
    const image = node('img');
    image.alt = 'Foto do serviço';
    image.hidden = true;
    card.append(image);
    request('/services/price-queue/' + item.id + '/photo').then(blob => {
        if (!card.isConnected) return;
        image.src = URL.createObjectURL(blob);
        urls.push(image.src);
        image.hidden = false;
    }).catch(() => { if (card.isConnected) image.replaceWith(node('p','Foto indisponível.')); });
    const form = node('form');
    const label = node('label','Valor do serviço (R$)');
    const amount = node('input');
    amount.type = 'number'; amount.step = '0.01'; amount.min = '0.01'; amount.required = true;
    label.append(amount);
    const send = node('button','Enviar');
    form.append(label,send);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        send.disabled = true;
        try {
            await request('/services/price-queue/' + item.id + '/publish', { amount_cents:Math.round(amount.valueAsNumber * 100) });
            card.remove();
            status('Serviço publicado no histórico do cliente.');
            await update();
            if (page === 'pending' && !state.pending.length) byId('view').replaceChildren(node('p','Nenhum serviço aguardando valor.'));
        } catch (error) { status(error.message,true); }
        finally { send.disabled = false; }
    });
    card.append(form);
    return card;
}
function metric(heading, value, destination) {
    const card = node('article', undefined, 'card');
    card.append(node('h2',heading),node('p',value));
    if (destination) {
        const open = node('button','Ver detalhes');
        open.onclick = () => render(destination);
        card.append(open);
    }
    return card;
}
async function finance(view, month) {
    const filters = node('label','Mês do fechamento');
    const input = node('input');
    input.type = 'month'; input.value = month;
    filters.append(input);
    input.onchange = () => render('finance',input.value || month);
    view.append(filters);
    const data = await request('/workshops/' + encodeURIComponent(workshop.workshop_id) + '/financial-summary?month=' + encodeURIComponent(month));
    if (!filters.isConnected) return;
    const summary = data.summary;
    const metrics = node('div',undefined,'grid');
    const fees = summary.attendance_fees_pending_cents;
    const share = summary.platform_share_cents;
    const [year, number] = month.split('-').map(Number);
    const day = Math.min(30,new Date(year,number,0).getDate());
    metrics.append(metric('Com a oficina pelos cadastros (50%)',formatMoney(summary.commission_generated_cents)),
        metric('Serviços registrados',formatMoney(summary.mechanical_total_revenue_cents)),
        metric('Repasse de cadastros',formatMoney(share)),
        metric('Taxas de retorno pendentes',formatMoney(fees)),
        metric('Total previsto para o dia ' + day,formatMoney(share + fees)));
    view.append(metrics);
    view.append(table(['Data','Lançamento','Situação','Valor'],(data.transactions || []).map(item =>
        [item.date?.slice(0,10),item.title,item.status,formatMoney(item.amount_cents)]),'Sem lançamentos para o período.'));
}
async function render(destination, month = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date())) {
    page = destination;
    clearView(); status('');
    byId('title').textContent = titles[page];
    document.querySelectorAll('[data-page]').forEach(button => {
        if (button.dataset.page === page) button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
    });
    const view = byId('view');
    try {
        if (page === 'pending') {
            view.append(...(state.pending.length ? state.pending.map(pendingCard) : [node('p','Nenhum serviço aguardando valor.')]));
        } else if (page === 'appointments') {
            view.append(table(['Data','Horário','Placa','Veículo','Serviço','Status'],state.appointments.map(x => [x.appointment_date,x.appointment_time,x.license_plate,x.vehicle_model,x.service_title,x.status]),'Nenhum agendamento.'));
        } else if (page === 'vehicles') {
            view.append(table(['Placa','Marca','Modelo'],state.vehicles.map(x => [x.license_plate,x.brand,x.model]),'Nenhum veículo cadastrado.'));
        } else if (page === 'finance') {
            await finance(view,month);
        } else {
            const metrics = node('div',undefined,'grid');
            metrics.append(metric('Serviços aguardando valor',state.pending.length,'pending'),
                metric('Agendamentos',state.appointments.filter(x => ['CONFIRMED','PENDING'].includes(x.status)).length,'appointments'),
                metric('Carros em atendimento',state.appointments.filter(x => x.status === 'IN_PROGRESS').length,'appointments'),
                metric('Veículos cadastrados',state.vehicles.length,'vehicles'),
                metric('Financeiro','Fechamento mensal','finance'));
            view.append(metrics);
        }
    } catch (error) { if (page === destination) status(error.message,true); }
}
document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => render(button.dataset.page));
byId('logout').onclick = () => endSession();
byId('signin').onsubmit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button');
    submit.disabled = true;
    byId('loginError').textContent = '';
    try {
        const data = await request('/auth/login',Object.fromEntries(new FormData(form)));
        if (data.user?.role_code !== 'WORKSHOP_OWNER' || !data.user.workshop?.workshop_id) throw new Error('Entre com a conta do dono da oficina.');
        token = data.token; workshop = data.user.workshop;
        await update();
        byId('shop').textContent = workshop.workshop_name || 'Minha oficina';
        byId('login').hidden = true;
        byId('layout').hidden = false;
        form.reset();
        await render('overview');
        timer = setInterval(async () => {
            try {
                const old = state?.pending.map(item => item.id).join(',');
                await update();
                const editing = byId('view').contains(document.activeElement);
                if (token && !editing && old !== state.pending.map(item => item.id).join(',') && ['overview','pending'].includes(page)) await render(page);
            } catch (error) { if (token) status(error.message,true); }
        },15000);
    } catch (error) { endSession(error.message); }
    finally { submit.disabled = false; }
};
