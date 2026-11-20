/**
 * DNA AUTO — Rate Limiter leve em memória para proteção de endpoints sensíveis
 * Sem dependências externas, com limpeza automática de janelas expiradas.
 */

function createRateLimiter({
    windowMs = 60 * 1000,
    max = 60,
    testMax = 5000,
    keyGenerator = null,
    message = 'Muitas requisições em um curto intervalo. Aguarde alguns instantes e tente novamente.'
} = {}) {
    const hits = new Map();

    // Limpeza periódica para evitar crescimento ilimitado de memória
    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [k, entry] of hits.entries()) {
            if (entry.resetAt <= now) {
                hits.delete(k);
            }
        }
    }, Math.max(30000, windowMs));

    if (typeof cleanupTimer.unref === 'function') {
        cleanupTimer.unref();
    }

    return function rateLimitMiddleware(req, res, next) {
        const isTest = process.env.NODE_ENV === 'test';
        const effectiveMax = isTest ? Number(process.env.RATE_LIMIT_TEST_MAX || testMax) : max;
        const ip = req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
        const key = typeof keyGenerator === 'function' ? keyGenerator(req) : `${ip}:${req.baseUrl || ''}:${req.path || ''}`;
        const now = Date.now();

        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        const remaining = Math.max(0, effectiveMax - entry.count);
        res.setHeader('X-RateLimit-Limit', String(effectiveMax));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count > effectiveMax) {
            return res.status(429).json({
                error: message,
                code: 'RATE_LIMIT_EXCEEDED',
                retry_after_seconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
            });
        }

        next();
    };
}

module.exports = { createRateLimiter };
