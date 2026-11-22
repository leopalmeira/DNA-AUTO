// DNA AUTO Cloudflare staging. A API real permanece bloqueada ate migrar e homologar.
const ESSENTIAL_TABLES = Object.freeze([
    'roles', 'users', 'workshops', 'workshop_users', 'vehicles',
    'owners', 'vehicle_dna', 'service_records', 'client_activations',
    'invoices', 'vehicle_photos', 'maintenance_records'
]);
function json(body, status) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname.replace(/\/+$/, '') || '/';
        if (path === '/health' || path === '/api/v1/health') {
            if (request.method !== 'GET') return json({ error: 'Metodo nao permitido.' }, 405);
            if (!env?.DB || typeof env.DB.prepare !== 'function') {
                return json({ status: 'NOT_READY', code: 'D1_NOT_CONFIGURED' }, 503);
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
                    }, 503);
                }
                return json({ status: 'STAGING_SCHEMA_READY', database: 'D1', production_ready: false }, 200);
            } catch {
                return json({ status: 'NOT_READY', code: 'D1_UNAVAILABLE', production_ready: false }, 503);
            }
        }
        if (path.startsWith('/api/')) {
            return json({
                success: false, code: 'CLOUDFLARE_MIGRATION_INCOMPLETE',
                error: 'API em homologacao. Nenhum cadastro ou servico foi alterado.'
            }, 503);
        }
        return json({ error: 'Rota inexistente.' }, 404);
    }
};
