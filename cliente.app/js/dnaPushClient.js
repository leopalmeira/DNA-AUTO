/* DNA AUTO - Recepção FCM nativa; cadastro de aparelho e agendamento seguro sem WhatsApp API. */
(() => {
  'use strict';
  let registering=false, lastRegister=0, showing=null;
  function native() {
    const cap=window.Capacitor;
    if (!cap || !(cap.isNativePlatform?.() || cap.platform==='android')) return null;
    return cap.Plugins?.DnaPush || (typeof cap.registerPlugin==='function' ? cap.registerPlugin('DnaPush') : null);
  }
  function token() { return localStorage.getItem('dna_token') || localStorage.getItem('dna_auto_token') || ''; }
  function headers() {return {Authorization:'Bearer '+token(),'Content-Type':'application/json'};}
  async function register() {
    if (registering || !native() || !token() || Date.now()-lastRegister < 30000) return;
    registering=true;
    try {
      const result=await native().getToken();
      if (!result?.token) return;
      const response=await fetch('/api/v1/push/register',{method:'POST',headers:headers(),body:JSON.stringify({token:result.token})});
      if (response.ok) lastRegister=Date.now();
      else console.warn('[DNA push] Registro pendente:',response.status);
    } catch(error) { console.warn('[DNA push] Firebase Android ainda indisponível:',error.message); }
    finally {registering=false;}
  }
  const esc = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function loadData(alert) {
    if (!token()) throw new Error('Entre na sua conta DNA AUTO para agendar.');
    const [r1,r2]=await Promise.all([
      fetch('/api/v1/vehicles/my-vehicles',{headers:headers()}),
      fetch('/api/v1/workshops/network',{headers:headers()})
    ]);
    if (!r1.ok || !r2.ok) throw new Error('Não foi possível consultar seus veículos e oficinas.');
    const a=await r1.json(), b=await r2.json();
    const plate=String(alert.license_plate||'').replace(/[^a-z0-9]/gi,'').toUpperCase();
    const vehicle=(a.vehicles||[]).find(v=>String(v.license_plate||'').replace(/[^a-z0-9]/gi,'').toUpperCase()===plate);
    const workshops=(b.workshops||[]).filter(w=>w.source==='database' && w.id);
    if (!vehicle) throw new Error('Veículo não vinculado à sua conta. Confira o cadastro.');
    if (!workshops.length) throw new Error('Nenhuma oficina credenciada apta a confirmar agenda diretamente.');
    return {vehicle,workshops};
  }
  function close() {document.getElementById('dna-push-booking-dialog')?.remove();showing=null;}
  async function book(method) {
    const target=document.getElementById('dna-push-booking-dialog');
    if (!target || !showing) return;
    const message=target.querySelector('[data-feedback]');
    const get=s=>target.querySelector(s)?.value||'';
    const ws=showing.workshops.find(w=>w.id===get('[name=workshop]'));
    const service=get('[name=service]').trim(),date=get('[name=date]'),time=get('[name=time]');
    const invalid=!ws||!service||!date||!time||Date.parse(date+'T'+time) < Date.now();
    if (invalid) {message.textContent='Selecione oficina, serviço, data e horário futuros.';return;}
    if (method==='whatsapp') {
      const digits=String(ws.whatsapp||ws.phone||'').replace(/\D/g,'');
      const phone=digits.startsWith('55')?digits:'55'+digits;
      if (!/^55\d{10,11}$/.test(phone)) {message.textContent='Oficina sem WhatsApp cadastrado.';return;}
      const text=['Olá, '+ws.name+'! Sou cliente DNA AUTO.','Desejo agendar '+service+'.',
        'Placa: '+showing.vehicle.license_plate+'.',
        'Veículo: '+showing.vehicle.brand+' '+showing.vehicle.model+'.',
        'Data e hora desejadas: '+date.split('-').reverse().join('/')+' às '+time+'.',
        'Aguardo sua confirmação.'].join('\n');
      window.location.href='https://wa.me/'+phone+'?text='+encodeURIComponent(text);
      return;
    }
    message.textContent='Verificando disponibilidade e registrando...';
    try {
      const response=await fetch('/api/v1/workshops/'+encodeURIComponent(ws.id)+'/client-appointments',{
        method:'POST',headers:headers(),
        body:JSON.stringify({vehicle_id:showing.vehicle.id,service_title:service,appointment_date:date,appointment_time:time})
      });
      const result=await response.json();
      if (!response.ok || !result.success) throw new Error(result.error||'Horário indisponível.');
      message.textContent='Agendamento confirmado! '+date.split('-').reverse().join('/')+' às '+time+' na '+ws.name+'.';
      message.style.color='#86EFAC';
      target.querySelector('[data-confirm]').disabled=true;
    } catch(error) { message.textContent=error.message;message.style.color='#FCA5A5'; }
  }
  async function showAlert(alert) {
    const id=String(alert.delivery_id||'');
    if (!id || document.hidden || document.getElementById('dna-push-booking-dialog')) return;
    const service=alert.service_title||'manutenção preventiva',km=alert.remaining_km||'0';
    const overlay=document.createElement('div');
    overlay.id='dna-push-booking-dialog';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Agendamento de manutenção DNA AUTO');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;color:#fff;';
    overlay.innerHTML='<div style="width:100%;max-width:500px;background:#0D1D33;border:2px solid #FFCF33;border-radius:17px;padding:18px;max-height:92vh;overflow:auto;box-sizing:border-box;">'+
      '<div style="font-size:13px;font-weight:800;color:#FFCF33;">DNA AUTO · MANUTENÇÃO PRÓXIMA</div>'+
      '<h2 style="font-size:22px;margin:10px 0;">Faltam '+esc(km)+' km para '+esc(service)+'</h2>'+
      '<p style="font-size:13px;color:#CBD5E1;">Veículo '+esc(alert.license_plate)+'. Pare em local seguro para agendar sua visita.</p>'+
      '<button type="button" data-close style="border:0;background:transparent;color:#fff;text-decoration:underline;float:right;">Agora não</button>'+
      '<div data-form style="clear:both;display:grid;gap:10px;margin-top:18px;"><p>Buscando oficinas credenciadas...</p></div>'+
      '<div data-feedback role="status" aria-live="polite" style="margin-top:12px;color:#FDE68A;font-size:13px;"></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-close]').onclick=close;
    showing={alert};
    try {
      const data=await loadData(alert);
      if (!document.getElementById('dna-push-booking-dialog')) return;
      showing={...data,alert};
      const form=overlay.querySelector('[data-form]');
      form.innerHTML='<label>Serviço<input name="service" maxlength="120" value="'+esc(service)+'" style="display:block;width:100%;box-sizing:border-box;padding:12px;color:#111;background:#fff;border-radius:7px;"></label>'+
        '<label>Oficina<select name="workshop" style="display:block;width:100%;box-sizing:border-box;padding:12px;background:#fff;color:#111;border-radius:7px;">'+data.workshops.map(w=>'<option value="'+esc(w.id)+'">'+esc(w.name)+' · '+esc(w.city||'')+'</option>').join('')+'</select></label>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
        '<label>Dia<input name="date" type="date" style="display:block;width:100%;box-sizing:border-box;padding:12px;background:#fff;color:#111;border-radius:7px;"></label>'+
        '<label>Hora<input name="time" type="time" value="09:00" style="display:block;width:100%;box-sizing:border-box;padding:12px;background:#fff;color:#111;border-radius:7px;"></label></div>'+
        '<button type="button" data-confirm style="background:#00D4FF;color:#062037;border:0;border-radius:9px;padding:15px;font-weight:800;">Confirmar agendamento no DNA AUTO</button>'+
        '<button type="button" data-whatsapp style="background:#128C7E;color:#fff;border:0;border-radius:9px;padding:14px;font-weight:800;">Solicitar pelo WhatsApp da oficina</button>';
      form.querySelector('[data-confirm]').onclick=()=>book('direct');
      form.querySelector('[data-whatsapp]').onclick=()=>book('whatsapp');
      form.querySelector('[name=date]').min=new Date().toISOString().slice(0,10);
    } catch(error) {overlay.querySelector('[data-form]').innerHTML='<p>'+esc(error.message)+'</p>';}
  }
  async function pending() {
    if (!native() || document.hidden) return;
    try {
      const a=await native().getPendingAlert();
      if (a?.delivery_id && a?.dna_alert==='maintenance') await showAlert(a);
    } catch(error) {console.warn('[DNA push] Alerta não recuperado:',error.message);}
  }
  async function tick() {await register();await pending();}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('focus',tick);
  window.addEventListener('dna-user-logged-in',tick);
  document.addEventListener('DOMContentLoaded',tick);
  if (document.readyState!=='loading') tick();
  setInterval(()=>{if(!document.hidden)register();},60000);
  window.DnaPushClient={register,tick};
})();
