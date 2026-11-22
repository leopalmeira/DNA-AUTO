// DNA AUTO — API Workers + D1. Banco e autenticacao inteiramente na Cloudflare.
import { ApiError } from './security.mjs';
import { principal } from './dbutils.mjs';
import { handleAuth } from './auth.mjs';
import { handleVehicles } from './vehicles.mjs';
import { handleWorkshops } from './workshops.mjs';
import { handleServices } from './services.mjs';
import { handleAdmin, handleDossier } from './admin.mjs';

const ESSENTIAL_TABLES = Object.freeze([
  'roles', 'users', 'workshops', 'workshop_users', 'vehicles',
  'owners', 'vehicle_dna', 'service_records', 'client_activations',
  'invoices', 'vehicle_photos', 'maintenance_records'
]);
function allowedCors(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return { Vary: 'Origin' };
  const allowed = String(env?.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allowed.includes(origin) || !/^https:\/\/[^/]+$/.test(origin)) return null;
  return {
    Vary: 'Origin',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-App-Context',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '600'
  };
}
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}
function withCors(response, corsHeaders) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, headers });
}
async function health(request, env, cors) {
  if (request.method !== 'GET') return json({ error: 'Método não permitido.' }, 405, cors);
  if (!env?.DB || typeof env.DB.prepare !== 'function') {
    return json({ status: 'NOT_READY', code: 'D1_NOT_CONFIGURED' }, 503, cors);
  }
  try {
    const placeholders = ESSENTIAL_TABLES.map(() => '?').join(',');
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (" + placeholders + ")"
    ).bind(...ESSENTIAL_TABLES).all();
    const found = new Set((result.results || []).map(row => row.name));
    const missing = ESSENTIAL_TABLES.filter(name => !found.has(name));
    if (missing.length) {
      return json({
        status: 'NOT_READY', code: 'D1_SCHEMA_INCOMPLETE',
        missing_table_count: missing.length, production_ready: false
      }, 503, cors);
    }
    if (!env.JWT_SECRET || String(env.JWT_SECRET).length < 32)
      return json({ status: 'NOT_READY', code: 'JWT_SECRET_NOT_CONFIGURED', production_ready: false }, 503, cors);
    return json({ status: 'STAGING_SCHEMA_READY', database: 'D1', production_ready: false }, 200, cors);
  } catch {
    return json({ status: 'NOT_READY', code: 'D1_UNAVAILABLE', production_ready: false }, 503, cors);
  }
}
async function parseBody(request) {
  if (!['POST','PUT','PATCH'].includes(request.method)) return { fields: {}, files: [] };
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 15 * 1024 * 1024) throw new ApiError(413, 'Requisição acima de 15 MB.');
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('multipart/form-data')) {
    const data = await request.formData();
    const fields = {}, files = [];
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string') fields[key] = value;
      else files.push({ field: key, file: value });
    }
    return { fields, files };
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    return { fields: Object.fromEntries(new URLSearchParams(await request.text())), files: [] };
  }
  if (type.includes('application/json')) {
    let payload;
    try { payload = await request.json(); } catch { throw new ApiError(400, 'JSON inválido.'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new ApiError(400, 'Corpo inválido.');
    return { fields: payload, files: [] };
  }
  throw new ApiError(415, 'Envie application/json ou multipart/form-data.');
}
async function routeRequest(request, env, path) {
  if (!env?.DB?.prepare) throw new ApiError(503, 'Banco D1 não configurado.', 'D1_NOT_CONFIGURED');
  const { fields, files } = await parseBody(request);
  let cachedUser;
  const loadUser = async () => {
    if (!cachedUser) cachedUser = await principal(request, env);
    return cachedUser;
  };
  const clean = path.slice('/api/v1'.length) || '/';
  let answer = null;
  if (clean.startsWith('/auth/')) answer = await handleAuth(request, env, clean, fields, loadUser);
  else if (clean.startsWith('/vehicles')) answer = await handleVehicles(request, env, clean, fields, loadUser);
  else if (clean.startsWith('/workshops') || clean.startsWith('/clients/'))
    answer = await handleWorkshops(request, env, clean, fields, loadUser);
  else if (clean.startsWith('/services') || clean.startsWith('/media/'))
    answer = await handleServices(request, env, clean, fields, files, loadUser);
  else if (clean.startsWith('/admin/'))
    answer = await handleAdmin(request, env, clean, fields, loadUser);
  else if (clean.startsWith('/dossier/'))
    answer = await handleDossier(request, env, clean, loadUser);
  if (answer instanceof Response) return answer;
  if (answer) return json(answer.data, answer.status);
  throw new ApiError(501, 'Funcionalidade ainda não migrada para Cloudflare.', 'NOT_YET_IMPLEMENTED');
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    const cors = allowedCors(request, env);
    if (cors === null) return json({ error: 'Origem não autorizada.', code: 'ORIGIN_DENIED' }, 403, { Vary: 'Origin' });
    if (request.method === 'OPTIONS' && (path.startsWith('/api/') || path === '/health')) {
      if (!request.headers.get('Origin')) return json({ error: 'Origin obrigatória no preflight.' }, 400, cors);
      return new Response(null, { status: 204, headers: cors });
    }
    if (path === '/health' || path === '/api/v1/health') return health(request, env, cors);
    if (!path.startsWith('/api/v1/')) return json({ error: 'Rota inexistente.' }, 404, cors);
    try {
      return withCors(await routeRequest(request, env, path), cors);
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ success: false, error: err.message, code: err.code || undefined }, err.status, cors);
      }
      console.error('Erro na API DNA AUTO Cloudflare:', err);
      // Nao expor SQL, segredos ou pilha ao cliente.
      return json({ success: false, error: 'Erro interno ao processar a solicitação.' }, 500, cors);
    }
  }
};
