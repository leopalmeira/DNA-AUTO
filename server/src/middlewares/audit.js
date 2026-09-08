const db = require('../database/db');

function logAudit({
    user,
    action,
    entityType,
    entityId,
    vehicleDnaCode = null,
    ipAddress = '127.0.0.1',
    userAgent = null,
    dataBefore = null,
    dataAfter = null
}) {
    try {
        const id = 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const stmt = db.prepare(`
            INSERT INTO audit_logs (
                id, user_id, user_role, user_name, action, entity_type, entity_id,
                vehicle_dna_code, ip_address, user_agent, data_before, data_after, created_at
            ) VALUES (
                @id, @userId, @userRole, @userName, @action, @entityType, @entityId,
                @vehicleDnaCode, @ipAddress, @userAgent, @dataBefore, @dataAfter, CURRENT_TIMESTAMP
            )
        `);

        stmt.run({
            id,
            userId: user ? user.id : null,
            userRole: user ? (user.role_code || user.role_name) : 'ANONYMOUS',
            userName: user ? user.name : 'Sistema Automático',
            action,
            entityType,
            entityId: entityId ? String(entityId) : null,
            vehicleDnaCode,
            ipAddress,
            userAgent,
            dataBefore: dataBefore ? JSON.stringify(dataBefore) : null,
            dataAfter: dataAfter ? JSON.stringify(dataAfter) : null
        });
    } catch (err) {
        console.error('⚠️ Falha ao registrar log de auditoria:', err.message);
    }
}

module.exports = { logAudit };
