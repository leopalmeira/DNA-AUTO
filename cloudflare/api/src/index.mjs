// DNA AUTO Cloudflare staging. Sem migracao completa, a API continua bloqueada.
const ESSENTIAL_TABLES = Object.freeze([
    'roles', 'users', 'workshops', 'workshop_users', 'vehicles',
    'owners', 'vehicle_dna', 'service_records', 'client_activations',
    'invoices', 'vehicle_photos', 'maintenance_records'
]);

function allowedCors(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin) return { 'Vary': 'Origin' }; // Requisicoes nao-browser (curl, PWA same-origin etc.)
    const allowed = String(env?.ALLOWED_ORIGINS || '').split(',')
        .map(value => value.trim()).filter(Boolean);
    if (!allowed.includes(origin) || !/^https:\/\/[^/]+$/.test(origin)) return null;
    return {
        'Vary': 'Origin',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-App-Context',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Max-Age': '600'
    };
}
function json(body, status, corsHeaders) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            ...corsHeaders
        }
    });
}
export default {
    async fetch(request, env) {
        const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
        const cors = allowedCors(request, env);
        // Origem nao autorizada: nunca refletir Origin e nunca processar a requisicao.
        if (cors === null) return json({ error: 'Origem nao autorizada.', code: 'ORIGIN_DENIED' }, 403, { Vary: 'Origin' });
        if (request.method === 'OPTIONS' && (path.startsWith('/api/') || path === '/health')) {
            if (!request.headers.get('Origin')) return json({ error: 'Origin obrigatoria no preflight.' }, 400, cors);
            return new Response(null, { status: 204, headers: cors });
        }
        if (path === '/health' || path === '/api/v1/health') {
            if (request.method !== 'GET') return json({ error: 'Metodo nao permitido.' }, 405, cors);
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
                return json({ status: 'STAGING_SCHEMA_READY', database: 'D1', production_ready: false }, 200, cors);
            } catch {
                return json({ status: 'NOT_READY', code: 'D1_UNAVAILABLE', production_ready: false }, 503, cors);
            }
        }
        if (path.startsWith('/api/')) {
            return json({
                success: false, code: 'CLOUDFLARE_MIGRATION_INCOMPLETE',
                error: 'API em homologacao. Nenhum cadastro ou servico foi alterado.'
            }, 503, cors);
        }
        return json({ error: 'Rota inexistente.' }, 404, cors);
    }
};
