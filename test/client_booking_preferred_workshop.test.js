'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Database = require('better-sqlite3');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
async function main() {
    const html = read('cliente.app/index.html');
    assert.equal(html, read('public/cliente.html'), 'Frontends precisam estar sincronizados');
    assert.ok(html.includes('openBookingWorkshopPicker();'), 'Menu deve abrir seletor');
    assert.ok(html.includes("openBookingWorkshopPicker(window.__dnaLastPreventivaService || '')"),
        'Agendamento da revisão deve preservar serviço escolhido');
    assert.ok(!html.includes("license_plate: 'BRA2E19'"), 'Proibidos dados fictícios no envio');
    assert.ok(html.includes("btnSchedule.onclick = () => {") &&
        html.includes('openBookingWorkshopPicker();'),
        'Botão Agendar Serviço do mapa também deve abrir a lista com prioridade');
    assert.ok(html.includes("let v = selectedVehicle || window.currentRegisteredVehicle || null;"),
        'A versão SPA deve permitir agendamento para o veículo ativo, sem herdar outro');


    const ownerView = read('cliente.app/js/components/ownerView.js');
    assert.equal(ownerView,read('public/js/components/ownerView.js'),
        'Listagem alternativa deve estar sincronizada');
    assert.ok(ownerView.includes('Sua oficina de origem'));
    assert.ok(ownerView.includes('booking-workshops'));

    // Regressão: havia duas implementações com o mesmo nome; a segunda
    // anulava a ordenação preferencial e a tela alternativa podia destacar
    // uma oficina qualquer como se fosse a de instalação.
    assert.equal((ownerView.match(/async fetchWorkshopsNetwork\(\)/g) || []).length, 1,
        'Não pode haver outro carregador sobrescrevendo a prioridade por veículo');
        assert.ok(html.includes("async function openBookingWorkshopPicker(serviceName = '', selectedVehicle = null)"),
        'A seleção deve aceitar explicitamente o veículo ativo da conta');
    assert.ok(ownerView.includes("list = data.workshops"),
        'Lista alternativa deve usar o mesmo catálogo autenticado do agendamento');
    assert.ok(ownerView.includes('list.sort((a, b) => Number(b.isOrigin) - Number(a.isOrigin))'),
        'Oficina que ativou o veículo deve permanecer em primeiro na outra interface');
    assert.ok(ownerView.includes('window.openBookingWorkshopPicker(serviceName, selected)'),
        'Todo agendamento pela tela alternativa deve abrir o seletor preferencial');
    assert.ok(!ownerView.includes("list.find(w => w.installed_here) || list[0]"),
        'É proibido tratar a primeira oficina aleatória como ativadora do veículo');

    const loaderStart = ownerView.indexOf('    async fetchWorkshopsNetwork() {');
    const loaderEnd = ownerView.indexOf('    // Alternar entre veículos da conta', loaderStart);
    assert.ok(loaderStart >= 0 && loaderEnd > loaderStart);
    const loaderText = ownerView.slice(loaderStart, loaderEnd);
    const ownerLoader = new Function('API', 'localStorage', 'fetch', 'console',
        'return ({' + loaderText + '\n}).fetchWorkshopsNetwork;')(
        {},
        {getItem: key => key === 'dna_token' ? 'token-teste' : null},
        async url => ({ok:true,json:async () => ({success:true,workshops:[
            {id:'ws_a',name:'Outra Oficina',is_origin:url.includes('veh2')},
            {id:'ws_z',name:'Minha Oficina',is_origin:!url.includes('veh2')}
        ]})}),
        console
    );
    const ownerState = {
        vehicleData: {id:'veh1'}, workshopsList: [], _workshopsLoaded:false,
        render() { this.renderCount = (this.renderCount || 0)+1; }
    };
    await ownerLoader.call(ownerState);
    assert.equal(ownerState.workshopsList[0].id, 'ws_z');
    assert.equal(ownerState.workshopsList[0].is_origin, true);
    assert.equal(ownerState.workshopsList.length,2,'Sem duplicar a oficina preferida');
    ownerState.vehicleData.id = 'veh2';
    await ownerLoader.call(ownerState);
    assert.equal(ownerState.workshopsList[0].id,'ws_a',
        'Ao selecionar outro veículo, a oficina preferencial também deve mudar');


    const routes = read('server/src/modules/vehicles/vehicles.routes.js');
    const a = routes.indexOf('// Agendamento do app Cliente: identifica a oficina');
    const b = routes.indexOf('// Painel de manutenção do cliente', a);
    assert.ok(a > 0 && b > a);
    const db = new Database(':memory:');
    db.exec('CREATE TABLE vehicles(id TEXT PRIMARY KEY,workshop_id TEXT,license_plate TEXT);' +
        'CREATE TABLE vehicle_dna(vehicle_id TEXT,activated_by_workshop_id TEXT);' +
        'CREATE TABLE client_activations(vehicle_id TEXT,license_plate TEXT,workshop_id TEXT,activated_at TEXT,created_at TEXT);' +
        'CREATE TABLE workshops(id TEXT PRIMARY KEY,trade_name TEXT,address_street TEXT,' +
        'address_number TEXT,address_neighborhood TEXT,city TEXT,state TEXT,phone TEXT,' +
        'whatsapp_official TEXT,status TEXT,verified_badge INTEGER);');
    db.exec("INSERT INTO vehicles VALUES('veh1',NULL,'ABC1D23'),('veh2','ws_z','XYZ9E99'),('veh3',NULL,'DEF4H44'),('veh4','ws_z','GHI5J55');" +
        "INSERT INTO vehicle_dna VALUES('veh1','ws_z'),('veh4','ws_z');" +
        "INSERT INTO client_activations VALUES('veh3','DEF4H44','ws_a','2026-11-20','2026-11-19'),('veh4','GHI5J55','ws_a','2026-11-20','2026-11-19'),('veh4','GHI5J55','ws_z','2026-11-21','2026-11-21');" +
        "INSERT INTO workshops(id,trade_name,status,verified_badge) VALUES" +
        "('ws_a','Outra Oficina','ACTIVE',1)," +
        "('ws_z','Minha Oficina','APPROVED',1)," +
        "('ws_block','Bloqueada','BLOCKED',0);");
    let route = null;
    const router = { get(p,...handlers) {route={p,handlers};} };
    const guard = (_req,_res,next)=>next();
    vm.runInNewContext(routes.slice(a,b),{
        router,db,authenticateToken:guard,authorizeTrackingVehicleOwner:guard,
        findVehicleByIdentifier:id=>db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id),
        console
    });
    assert.equal(route.p,'/:identifier/booking-workshops');
    assert.equal(route.handlers.length,3,'JWT e titularidade são obrigatórios');
    function get(id) {
        const result={status:200};
        const res={set(){return this;},status(code){result.status=code;return this;},
            json(body){result.body=body;return this;}};
        route.handlers[2]({params:{identifier:id}},res);
        return result;
    }
    const r=get('veh1');
    assert.equal(r.status,200);
    assert.equal(r.body.origin_workshop_id,'ws_z');
    assert.equal(r.body.workshops[0].name,'Minha Oficina');
    assert.equal(r.body.workshops[0].is_origin,true);
    assert.equal(r.body.workshops[1].name,'Outra Oficina');
    assert.equal(r.body.workshops.length,2,'Bloqueadas não são oferecidas');
    assert.equal(get('veh2').body.origin_workshop_id,'ws_z','Fallback por veículo');
    assert.equal(get('veh3').body.origin_workshop_id,'ws_a','Fallback por cadastro de adesão');
    assert.equal(get('veh4').body.origin_workshop_id,'ws_a',
        'A oficina que cadastrou originalmente deve vencer ativação e recadastro posterior');
    assert.equal(get('veh4').body.workshops[0].name,'Outra Oficina',
        'Oficina cadastradora deve abrir como primeira opção');
    assert.equal(get('missing').status,404);
    db.close();

    const start=html.indexOf('// Seletor de oficinas para agendamento');
    const end=html.indexOf('function initOficinasMap() {',start);
    assert.ok(start>0&&end>start);
    const js=html.slice(start,end);
    new vm.Script(js);
    const registry=new Map();
    function Node(tag){this.tag=tag;this.children=[];this.handlers={};this.style={};
        this.options=[];this.classList={remove(){},add(){}};this.isConnected=true;this.value='';}
    Node.prototype.append=function(...v){this.children.push(...v);};
    Node.prototype.appendChild=function(v){this.children.push(v);if(this.tag==='select')this.options.push(v);};
    Node.prototype.replaceChildren=function(...v){this.children=v;};
    Node.prototype.setAttribute=function(){};
    Node.prototype.addEventListener=function(k,f){this.handlers[k]=f;};
    Node.prototype.remove=function(){this.isConnected=false;registry.delete(this.id);};
    const list=new Node('list'),close=new Node('button');
    Node.prototype.querySelector=function(sel){
        if(sel==='.dna-booking-picker-close')return close;
        if(sel==='#dna-booking-picker-list')return list;
        return null;
    };
    for(const id of ['sched-workshop-id','sched-service-type','sched-date','sched-time',
        'sched-notes','schedule-workshop-name','sched-vehicle-label','oficinas-overlay',
        'schedule-modal-overlay']){
        const el=new Node(id==='sched-service-type'?'select':'input');el.id=id;registry.set(id,el);
    }
    registry.get('sched-service-type').options=[{value:'Troca de Óleo e Filtros',
        textContent:'Troca de Óleo e Filtros'}];
    registry.get('sched-time').value='10:00';
    const doc={getElementById:id=>registry.get(id)||null,createElement:tag=>new Node(tag),
        body:{appendChild(el){registry.set(el.id,el);el.isConnected=true;}},
        querySelector:sel=>sel.indexOf('schedule-service-form')>=0?{disabled:false}:null};
    const user={name:'Cliente Teste',phone:'21999999999'};
    const vehicle={id:'veh1',license_plate:'ABC1D23',brand:'Fiat',model:'Argo'};
    const calls=[],messages=[];
    const fetch=async(url,opt)=>{
        calls.push({url,opt});
        if(url.includes('booking-workshops'))return{ok:true,json:async()=>({
            success:true,vehicle_id:'veh1',license_plate:'ABC1D23',workshops:[
                {id:'ws_a',name:'Outra Oficina',is_origin:false},
                {id:'ws_z',name:'Minha Oficina',is_origin:true,whatsapp:'21999999998'}
            ]})};
        return {ok:true,json:async()=>({success:true})};
    };
    const store={getItem:key=>({
        dna_token:'jwt-test',dna_logged_user:JSON.stringify(user),
        dna_registered_plate:'ABC1D23'
    })[key]||null};
    const window={currentRegisteredVehicle:vehicle,open(){}};
    const Option=class extends Node{constructor(label,value){super('option');this.textContent=label;this.value=value;}};
    const api=new Function('window','document','localStorage','fetch','go','oficinasDaRede',
        'Option','alert',js+'\nreturn {openBookingWorkshopPicker,submitClientAppointment};')(
        window,doc,store,fetch,()=>{},[],Option,m=>messages.push(m));
    await api.openBookingWorkshopPicker('Troca de Óleo e Filtros');
    assert.ok(list.children[1].className.includes('origin'),
        'Oficina de origem deve abrir no primeiro card');
    assert.equal(list.children[1].children[0].children[1].textContent,'Minha Oficina');
    assert.equal(list.children[3].children[0].children[1].textContent,'Outra Oficina');
    list.children[1].handlers.click();
    assert.equal(registry.get('sched-workshop-id').value,'ws_z');
    assert.equal(registry.get('sched-service-type').value,'Troca de Óleo e Filtros');
    registry.get('sched-date').value='2026-11-30';
    await api.submitClientAppointment({preventDefault(){}});
    const post=calls.find(c=>c.opt&&c.opt.method==='POST');
    assert.equal(post.url,'/api/v1/workshops/ws_z/appointments');
    const data=JSON.parse(post.opt.body);
    assert.equal(data.vehicle_id,'veh1');
    assert.equal(data.license_plate,'ABC1D23');
    assert.equal(data.owner_name,'Cliente Teste');
    assert.ok(messages.some(m=>m.includes('Agendamento confirmado')));
    // Seleção explícita de outro veículo não pode reutilizar a oficina anterior.
    await api.openBookingWorkshopPicker('Alinhamento', {
        id:'veh2',license_plate:'XYZ9E99',brand:'Honda',model:'Fit'
    });
    assert.ok(calls.some(c => c.url.includes('/vehicles/veh2/booking-workshops')),
        'Agendamento do segundo carro precisa consultar seu próprio vínculo');

    console.log('✅ Agendamento preferencial, escolha alternativa, proteção do veículo e dados reais: OK');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
