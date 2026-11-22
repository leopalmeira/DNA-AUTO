/* DNA AUTO - FCM HTTP v1. Configurar FCM_SERVICE_ACCOUNT_JSON no Render (nunca no git). */
const db = require('../database/db');
const crypto = require('crypto');
let ready = false;
let cachedToken = null;
let cachedUntil = 0;
function init() {
  if (ready) return;
  db.exec('CREATE TABLE IF NOT EXISTS dna_push_devices (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_received_at DATETIME);' +
    'CREATE INDEX IF NOT EXISTS idx_dna_push_users ON dna_push_devices(user_id);' +
    'CREATE TABLE IF NOT EXISTS dna_push_deliveries (id TEXT PRIMARY KEY, token TEXT NOT NULL, user_id TEXT NOT NULL, vehicle_id TEXT, service_title TEXT NOT NULL, remaining_km INTEGER NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL DEFAULT "PENDING", dedupe_key TEXT UNIQUE, ack_hash TEXT NOT NULL, error_message TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, accepted_at DATETIME, received_at DATETIME, opened_at DATETIME);');
  ready = true;
}
function credentials() {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON || '';
  if (!raw) return null;
  try {
    const c = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
    return c.client_email && c.private_key && c.project_id ? c : null;
  } catch (_) { return null; }
}
function configured() { return !!credentials(); }
function encode(value) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
async function accessToken() {
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;
  const c = credentials();
  if (!c) throw new Error('FCM_SERVICE_ACCOUNT_JSON não configurado.');
  const now = Math.floor(Date.now()/1000);
  const unsigned = encode({alg:'RS256',typ:'JWT'}) + '.' + encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(c.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:unsigned+'.'+sig}),signal:AbortSignal.timeout(12000)});
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error('Autenticação Firebase recusada.');
  cachedToken = result.access_token;
  cachedUntil = Date.now() + Math.min(3300, Number(result.expires_in)||3300)*1000;
  return cachedToken;
}
function register(userId, token) {
  init();
  if (!userId || !/^[\w:-]{30,4096}$/.test(String(token||''))) throw new Error('Token ou usuário inválido.');
  db.prepare('INSERT INTO dna_push_devices(token,user_id) VALUES (?,?) ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id, updated_at=CURRENT_TIMESTAMP').run(token,userId);
}
function vehicleOwner(vehicleId) {
  return db.prepare('SELECT v.id,v.license_plate,v.brand,v.model, o.name owner_name, COALESCE(o.user_id,u.id) user_id FROM vehicles v '+
    'LEFT JOIN owners o ON o.id=COALESCE(v.current_owner_id,(SELECT t.new_owner_id FROM ownership_transfers t WHERE t.vehicle_id=v.id AND t.status="COMPLETED" ORDER BY t.completed_at DESC LIMIT 1)) '+
    'LEFT JOIN users u ON u.id=o.user_id OR (o.email IS NOT NULL AND LOWER(u.email)=LOWER(o.email)) WHERE v.id=?').get(vehicleId);
}
function devices() {
  init();
  return db.prepare('SELECT v.id vehicle_id,v.license_plate,v.brand,v.model,COALESCE(o.name,u.name,"Sem titular") owner_name, '+
    'COALESCE(o.user_id,u.id) user_id,(SELECT COUNT(*) FROM dna_push_devices pd WHERE pd.user_id=COALESCE(o.user_id,u.id)) devices_count '+
    'FROM vehicles v LEFT JOIN owners o ON o.id=COALESCE(v.current_owner_id,(SELECT t.new_owner_id FROM ownership_transfers t WHERE t.vehicle_id=v.id AND t.status="COMPLETED" ORDER BY t.completed_at DESC LIMIT 1)) '+
    'LEFT JOIN users u ON u.id=o.user_id OR (o.email IS NOT NULL AND LOWER(u.email)=LOWER(o.email)) ORDER BY v.created_at DESC LIMIT 500').all();
}
function deliveries() {
  init();
  return db.prepare('SELECT d.id,d.vehicle_id,v.license_plate,d.service_title,d.remaining_km,d.source,d.status,d.created_at,d.accepted_at,d.received_at,d.opened_at,d.error_message '+
    'FROM dna_push_deliveries d LEFT JOIN vehicles v ON v.id=d.vehicle_id ORDER BY d.created_at DESC LIMIT 50').all();
}
async function send({ vehicleId, service, km=5, source='ADMIN_TEST', dedupe=null }) {
  init();
  const veh = vehicleOwner(vehicleId);
  if (!veh || !veh.user_id) return {success:false, code:'NO_OWNER', message:'Veículo sem titular vinculado a conta de cliente.'};
  const registered = db.prepare('SELECT token FROM dna_push_devices WHERE user_id=?').all(veh.user_id);
  if (!registered.length) return {success:false, code:'NO_DEVICE', message:'Nenhum APK Android registrado para este cliente.'};
  if (!configured()) return {success:false, code:'FCM_NOT_CONFIGURED', message:'Firebase pendente de configuração no Render.'};
  service = String(service || '').trim().slice(0,120);
  km = Number(km);
  if (!service || !Number.isInteger(km) || km < 0 || km > 5000) throw new Error('Serviço ou quilometragem inválidos.');
  const bearer = await accessToken(), c = credentials(), results = [];
  for (const item of registered) {
    const id='push_'+crypto.randomBytes(10).toString('hex'), secret=crypto.randomBytes(24).toString('hex');
    const key=dedupe ? dedupe+':'+crypto.createHash('sha256').update(item.token).digest('hex').slice(0,16):null;
    if (key && db.prepare('SELECT id FROM dna_push_deliveries WHERE dedupe_key=?').get(key)) {results.push({status:'ALREADY_SENT'});continue;}
    db.prepare('INSERT INTO dna_push_deliveries (id,token,user_id,vehicle_id,service_title,remaining_km,source,dedupe_key,ack_hash) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id,item.token,veh.user_id,vehicleId,service,km,source,key,crypto.createHash('sha256').update(secret).digest('hex'));
    const payload={message:{token:item.token, android:{priority:'HIGH',ttl:'86400s'},data:{
      dna_alert:'maintenance',delivery_id:id,ack_secret:secret,vehicle_id:String(vehicleId),
      license_plate:String(veh.license_plate),service_title:service,remaining_km:String(km),
      title:'DNA AUTO — Manutenção próxima',
      body:km===0?'Manutenção vencida: '+service+'. Agende sua visita.':'Faltam '+km+' km para '+service+'. Agende dia e horário.'
    }}};
    try {
      const response=await fetch('https://fcm.googleapis.com/v1/projects/'+encodeURIComponent(c.project_id)+'/messages:send',{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
      const body=await response.json();
      if (!response.ok) {
        const err=String(body.error?.message||response.status).slice(0,250);
        db.prepare('UPDATE dna_push_deliveries SET status="FAILED",error_message=? WHERE id=?').run(err,id);
        if (/UNREGISTERED|SENDER_ID_MISMATCH/.test(JSON.stringify(body))) db.prepare('DELETE FROM dna_push_devices WHERE token=?').run(item.token);
        results.push({id,status:'FAILED',error:err});
      } else {
        db.prepare('UPDATE dna_push_deliveries SET status="ACCEPTED_BY_FCM",accepted_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
        results.push({id,status:'ACCEPTED_BY_FCM'});
      }
    } catch(error) {
      db.prepare('UPDATE dna_push_deliveries SET status="FAILED",error_message=? WHERE id=?').run(String(error.message).slice(0,250),id);
      results.push({id,status:'FAILED',error:error.message});
    }
  }
  return {success:results.some(x=>x.status==='ACCEPTED_BY_FCM'||x.status==='ALREADY_SENT'),plate:veh.license_plate,results,message:'FCM aceitou o envio; recebimento só se confirma após ACK do Android.'};
}
function acknowledge(id,secret,action) {
  init();
  const row=db.prepare('SELECT token,ack_hash FROM dna_push_deliveries WHERE id=?').get(id);
  if (!row || !secret) return false;
  const actual=crypto.createHash('sha256').update(String(secret)).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(row.ack_hash))) return false;
  if (action==='OPENED') db.prepare('UPDATE dna_push_deliveries SET status="OPENED",received_at=COALESCE(received_at,CURRENT_TIMESTAMP),opened_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
  else db.prepare('UPDATE dna_push_deliveries SET status=CASE WHEN opened_at IS NULL THEN "RECEIVED" ELSE status END,received_at=COALESCE(received_at,CURRENT_TIMESTAMP) WHERE id=?').run(id);
  db.prepare('UPDATE dna_push_devices SET last_received_at=CURRENT_TIMESTAMP WHERE token=?').run(row.token);
  return true;
}
module.exports={init,configured,register,devices,deliveries,send,acknowledge,vehicleOwner};
