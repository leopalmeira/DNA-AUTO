'use strict';
// CORS: protege domínios de terceiros, mas permite a origem exata do
// servidor que recebeu a chamada (Render, domínio customizado ou outra instância).
// Não modifica os controles de JWT e escopo da oficina.
function createCorsOptions({ environment = process.env.NODE_ENV,
                             allowedOrigins = process.env.CORS_ALLOWED_ORIGINS } = {}) {
    const whitelist = String(allowedOrigins || '').split(',').map(x => x.trim()).filter(Boolean);
    return function resolveCors(req, callback) {
        const origin = req.get ? req.get('origin') : req.headers?.origin;
        const host = req.get ? req.get('host') : req.headers?.host;
        let sameHost = false;
        if (origin && host) {
            try {
                const parsed = new URL(origin);
                sameHost = ['https:', 'http:'].includes(parsed.protocol) &&
                    parsed.host.toLowerCase() === String(host).trim().toLowerCase();
            } catch (_) { /* origens inválidas continuam bloqueadas */ }
        }
        const permitted = !origin || environment !== 'production' ||
            whitelist.length === 0 || whitelist.includes('*') ||
            whitelist.includes(origin) || sameHost;
        if (permitted) return callback(null, { origin: true, credentials: true });
        const err = new Error('Origem não autorizada pela política CORS da plataforma DNA AUTO.');
        err.status = 403;
        err.code = 'CORS_ORIGIN_DENIED';
        return callback(err);
    };
}
module.exports = { createCorsOptions };
