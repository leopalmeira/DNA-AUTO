const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dna_auto_secret_jwt_key_2026_super_secure';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Se não tiver token, cria sessão simulada ou demo se header X-Demo-User vier
        const demoUserId = req.headers['x-demo-user-id'];
        if (demoUserId) {
            const user = db.prepare(`
                SELECT u.id, u.name, u.email, u.phone, u.role_id, r.code as role_code, r.name as role_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `).get(demoUserId);
            if (user) {
                req.user = user;
                return next();
            }
        }
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: 'Sessão inválida ou expirada.' });
        }

        const user = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, u.role_id, r.code as role_code, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status = 'ACTIVE'
        `).get(decodedUser.id);

        if (!user) {
            return res.status(403).json({ error: 'Usuário não encontrado ou inativo.' });
        }

        req.user = user;
        next();
    });
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }
        if (!allowedRoles.includes(req.user.role_code)) {
            return res.status(403).json({
                error: `Acesso negado. Perfil '${req.user.role_name}' não possui permissão para esta operação.`
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    JWT_SECRET
};
