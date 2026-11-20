const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dna_auto_secret_jwt_key_2026_super_secure';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.warn('⚠️ [SEGURANÇA] JWT_SECRET não definido em produção! Configure uma chave forte nas variáveis de ambiente.');
}

function enforceRepresentativeBoundary(user, req, res) {
    if (user && user.role_code === 'REPRESENTATIVE') {
        const rep = db.prepare(`SELECT * FROM representatives WHERE user_id = ?`).get(user.id);
        if (rep) {
            user.representative = rep;
        }
        const url = String(req.originalUrl || req.url || '').split('?')[0];
        const allowedPrefixes = [
            '/api/v1/representatives',
            '/api/v1/auth/me'
        ];
        // Representantes nunca podem acessar /api/v1/representatives/admin/*
        if (url.startsWith('/api/v1/representatives/admin')) {
            res.status(403).json({
                error: 'Acesso negado. Endpoints administrativos são restritos ao perfil ADMIN.',
                code: 'ADMIN_ROLE_REQUIRED'
            });
            return false;
        }
        const isAllowed = allowedPrefixes.some(prefix => url === prefix || url.startsWith(prefix + '/'));
        if (!isAllowed) {
            res.status(403).json({
                error: 'REGRA ABSOLUTA DE SEGURANÇA: O representante comercial possui acesso restrito exclusivamente ao portal /representante e não pode acessar o aplicativo da oficina, aplicativo do cliente nem o painel administrativo.',
                code: 'REPRESENTATIVE_ROLE_ISOLATION'
            });
            return false;
        }
    }
    return true;
}

function isAdminEndpoint(req) {
    const url = String(req.originalUrl || req.url || '').split('?')[0];
    return url.startsWith('/api/v1/admin') || url.startsWith('/api/v1/representatives/admin');
}

function extractBearerToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    // Permite token via query apenas em stream SSE (EventSource não suporta headers Authorization customizados)
    const url = String(req.originalUrl || req.url || '').split('?')[0];
    if (url.endsWith('/sync/stream') && req.query && req.query.access_token) {
        return String(req.query.access_token).trim();
    }
    return null;
}

function authenticateToken(req, res, next) {
    const token = extractBearerToken(req);

    if (!token) {
        // Nunca permite bypass por X-Demo-User-Id em endpoints administrativos ou em produção
        const allowDemoFallback = process.env.ALLOW_DEMO_HEADER === 'true' && process.env.NODE_ENV !== 'production' && !isAdminEndpoint(req);
        const demoUserId = allowDemoFallback ? req.headers['x-demo-user-id'] : null;
        if (demoUserId) {
            const user = db.prepare(`
                SELECT u.id, u.name, u.email, u.phone, u.role_id,
                       COALESCE(r.code, CASE WHEN u.role_id = 'role_workshop_staff' THEN 'WORKSHOP_STAFF' WHEN u.role_id = 'role_workshop_owner' THEN 'WORKSHOP_OWNER' ELSE 'CUSTOMER' END) as role_code,
                       COALESCE(r.name, CASE WHEN u.role_id = 'role_workshop_staff' THEN 'Registrador da Oficina' ELSE 'Usuário' END) as role_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ? AND u.status = 'ACTIVE'
            `).get(demoUserId);
            if (user && user.role_code !== 'ADMIN') {
                if (!enforceRepresentativeBoundary(user, req, res)) return;
                req.user = user;
                return next();
            }
        }
        return res.status(401).json({
            error: 'Token de autenticação não fornecido.',
            code: 'AUTH_TOKEN_MISSING'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err || !decodedUser || !decodedUser.id) {
            return res.status(401).json({
                error: 'Sessão inválida ou expirada. Faça login novamente.',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        const user = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, u.role_id, u.status,
                   COALESCE(r.code, CASE WHEN u.role_id = 'role_workshop_staff' THEN 'WORKSHOP_STAFF' WHEN u.role_id = 'role_workshop_owner' THEN 'WORKSHOP_OWNER' ELSE 'CUSTOMER' END) as role_code,
                   COALESCE(r.name, CASE WHEN u.role_id = 'role_workshop_staff' THEN 'Registrador da Oficina' ELSE 'Usuário' END) as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status = 'ACTIVE'
        `).get(decodedUser.id);

        if (!user) {
            return res.status(403).json({
                error: 'Usuário não encontrado ou inativo.',
                code: 'AUTH_USER_INACTIVE'
            });
        }

        if (!enforceRepresentativeBoundary(user, req, res)) return;

        // Carrega oficina associada se o usuário for membro ou gestor de oficina
        const wsUser = db.prepare(`
            SELECT wu.workshop_id, wu.position_title, wu.can_activate_dna, wu.can_prove_services,
                   w.trade_name as workshop_name, w.cnpj as workshop_cnpj, w.status as workshop_status
            FROM workshop_users wu
            JOIN workshops w ON wu.workshop_id = w.id
            WHERE wu.user_id = ?
        `).get(user.id);
        if (wsUser) {
            user.workshop = wsUser;
        }

        req.user = user;
        next();
    });
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado.',
                code: 'AUTH_REQUIRED'
            });
        }
        if (!allowedRoles.includes(req.user.role_code)) {
            return res.status(403).json({
                error: `Acesso negado. Perfil '${req.user.role_name}' não possui permissão para esta operação.`,
                code: 'FORBIDDEN_ROLE'
            });
        }
        next();
    };
}

function blockRepresentativeOutsidePortal(req, res, next) {
    try {
        const token = extractBearerToken(req);
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.role_code === 'REPRESENTATIVE') {
                if (!enforceRepresentativeBoundary({ id: decoded.id, role_code: 'REPRESENTATIVE' }, req, res)) {
                    return;
                }
            }
        }
    } catch (_) {}
    next();
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    enforceRepresentativeBoundary,
    blockRepresentativeOutsidePortal,
    JWT_SECRET
};
