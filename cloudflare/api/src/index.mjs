// DNA AUTO: staging Cloudflare Worker. Safe by default: no write endpoints before migration.
function json(body, status) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
    });
}
export default {
    async fetch(request, env) {
        const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
        if (path === '/health' || path === '/api/v1/health') {
            if (request.method !== 'GET') return json({ error: 'Metodo nao permitido.' }, 405);
            if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
                return json({ status: 'NOT_READY', code: 'D1_NOT_CONFIGURED' }, 503);
            }
            try {
                await env.DB.prepare('SELECT 1 AS alive').first();
                return json({ status: 'STAGING_READY', database: 'D1', production_ready: false }, 200);
            } catch (_) {
                return json({ status: 'NOT_READY', code: 'D1_UNAVAILABLE' }, 503);
            }
        }
        if (path.startsWith('/api/')) {
            return json({ success: false, code: 'CLOUDFLARE_MIGRATION_INCOMPLETE',
                error: 'API em homologacao. Nenhum cadastro ou servico foi alterado.' }, 503);
        }
        return json({ error: 'Rota inexistente.' }, 404);
    }
};
