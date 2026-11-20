/**
 * DNA AUTO — Serviço Central de Sincronização Multi-App (SSE + Registro Persistente + Cache Invalidation)
 *
 * Mantém a fonte única de verdade sincronizada entre:
 * APP CLIENTE, APP OFICINA, PORTAL REPRESENTANTE, WEBHOOKS e PAINEL ADMINISTRATIVO.
 */

const crypto = require('crypto');

const sseClients = new Set();
const readCache = new Map();
let syncVersion = 1;
let lastSyncEvent = null;

function generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Invalida o cache de leitura administrativo sempre que houver mutação relevante.
 */
function invalidateAdminCache(prefix = null) {
    if (!prefix) {
        readCache.clear();
        return;
    }
    for (const key of readCache.keys()) {
        if (key.startsWith(prefix)) {
            readCache.delete(key);
        }
    }
}

/**
 * Helper de cache com TTL curto e invalidação automática por syncVersion.
 */
function getCachedOrCompute(key, ttlMs, computeFn) {
    const now = Date.now();
    const cached = readCache.get(key);
    if (cached && cached.version === syncVersion && cached.expiresAt > now) {
        return { data: cached.data, fromCache: true, syncVersion };
    }
    const data = computeFn();
    readCache.set(key, {
        version: syncVersion,
        expiresAt: now + ttlMs,
        data
    });
    return { data, fromCache: false, syncVersion };
}

/**
 * Grava evento em sync_events, incrementa syncVersion, invalida cache e notifica clientes SSE conectados.
 */
function publishSyncEvent(db, {
    eventType,
    sourceApp = 'SYSTEM',
    entityType = 'SYSTEM',
    entityId = null,
    payload = {}
}) {
    syncVersion += 1;
    invalidateAdminCache();

    const eventId = generateEventId();
    const createdAt = new Date().toISOString();
    const record = {
        event_id: eventId,
        event_type: eventType,
        source_app: sourceApp,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        payload,
        sync_version: syncVersion,
        created_at: createdAt
    };

    try {
        if (db) {
            db.prepare(`
                INSERT INTO sync_events (event_id, event_type, source_app, entity_type, entity_id, payload_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(
                eventId,
                eventType,
                sourceApp,
                entityType,
                entityId ? String(entityId) : null,
                JSON.stringify(payload || {})
            );
        }
    } catch (err) {
        console.warn('[SyncEvents] Falha ao gravar sync_events:', err.message);
    }

    lastSyncEvent = record;

    // Broadcast SSE para todos os terminais administrativos conectados
    const sseFrame = `id: ${eventId}\nevent: sync\ndata: ${JSON.stringify(record)}\n\n`;
    for (const client of sseClients) {
        try {
            client.res.write(sseFrame);
        } catch (_) {
            sseClients.delete(client);
        }
    }

    return record;
}

/**
 * Registra cliente SSE autenticado (ADMIN) com heartbeat e encerramento limpo.
 */
function attachSseClient(req, res) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    const clientObj = {
        id: `sse_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: req.user ? req.user.id : null,
        connectedAt: new Date().toISOString(),
        res
    };
    sseClients.add(clientObj);

    // Envia handshake inicial
    res.write(`event: connected\ndata: ${JSON.stringify({
        status: 'CONNECTED',
        sync_version: syncVersion,
        server_time: new Date().toISOString(),
        last_event: lastSyncEvent
    })}\n\n`);

    const heartbeat = setInterval(() => {
        try {
            res.write(`event: heartbeat\ndata: ${JSON.stringify({
                status: 'ALIVE',
                sync_version: syncVersion,
                server_time: new Date().toISOString()
            })}\n\n`);
        } catch (_) {
            clearInterval(heartbeat);
            sseClients.delete(clientObj);
        }
    }, 25000);
    if (typeof heartbeat.unref === 'function') heartbeat.unref();

    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(clientObj);
    });
}

/**
 * Retorna status detalhado da sincronização entre os aplicativos da plataforma.
 */
function getSyncStatus(db) {
    const nowIso = new Date().toISOString();
    let recentEvents = [];
    let countsByApp = [];
    let tableStats = {};

    try {
        recentEvents = db.prepare(`
            SELECT id, event_id, event_type, source_app, entity_type, entity_id, payload_json, created_at
            FROM sync_events
            ORDER BY id DESC
            LIMIT 30
        `).all().map(r => ({
            ...r,
            payload: (() => { try { return r.payload_json ? JSON.parse(r.payload_json) : {}; } catch (_) { return {}; } })()
        }));

        countsByApp = db.prepare(`
            SELECT source_app, COUNT(*) as events_count, MAX(created_at) as last_event_at
            FROM sync_events
            GROUP BY source_app
            ORDER BY events_count DESC
        `).all();

        const lastClientAct = db.prepare(`SELECT MAX(created_at) as ts, COUNT(*) as cnt FROM client_activations`).get();
        const lastVehicle = db.prepare(`SELECT MAX(created_at) as ts, COUNT(*) as cnt FROM vehicles`).get();
        const lastWorkshop = db.prepare(`SELECT MAX(created_at) as ts, COUNT(*) as cnt FROM workshops`).get();
        const lastRep = db.prepare(`SELECT MAX(created_at) as ts, COUNT(*) as cnt FROM representatives`).get();
        const lastPix = db.prepare(`SELECT MAX(COALESCE(paid_at, created_at)) as ts, COUNT(*) as cnt FROM workshop_pix_charges`).get();
        const lastComm = db.prepare(`SELECT MAX(COALESCE(confirmed_at, created_at)) as ts, COUNT(*) as cnt FROM representative_commissions`).get();
        const lastService = db.prepare(`SELECT MAX(created_at) as ts, COUNT(*) as cnt FROM service_records`).get();
        const lastTicket = db.prepare(`SELECT MAX(updated_at) as ts, COUNT(*) as cnt FROM support_tickets`).get();
        const migrations = db.prepare(`SELECT id, description, applied_at FROM schema_migrations ORDER BY applied_at DESC`).all();

        tableStats = {
            client_app: {
                name: 'App Cliente',
                records_count: (lastVehicle?.cnt || 0) + (lastClientAct?.cnt || 0),
                last_activity_at: lastClientAct?.ts || lastVehicle?.ts || null,
                status: 'SYNCHRONIZED'
            },
            workshop_app: {
                name: 'App Oficina',
                records_count: (lastWorkshop?.cnt || 0) + (lastService?.cnt || 0),
                last_activity_at: lastService?.ts || lastWorkshop?.ts || null,
                status: 'SYNCHRONIZED'
            },
            representative_portal: {
                name: 'Portal Representante',
                records_count: (lastRep?.cnt || 0) + (lastComm?.cnt || 0),
                last_activity_at: lastComm?.ts || lastRep?.ts || null,
                status: 'SYNCHRONIZED'
            },
            payments_gateway: {
                name: 'Pagamentos & Comissões',
                records_count: lastPix?.cnt || 0,
                last_activity_at: lastPix?.ts || null,
                status: 'SYNCHRONIZED'
            },
            support_center: {
                name: 'Central de Chamados',
                records_count: lastTicket?.cnt || 0,
                last_activity_at: lastTicket?.ts || null,
                status: 'SYNCHRONIZED'
            }
        };

        const dbPath = db.name || process.env.DB_PATH || 'dna_auto.db';
        const isEphemeralRenderRisk = Boolean(
            process.env.RENDER && !String(dbPath).startsWith('/var/data') && !String(dbPath).startsWith('/data')
        );

        return {
            status: 'ONLINE',
            database: {
                engine: 'SQLite (WAL)',
                path: dbPath,
                journal_mode: db.pragma('journal_mode', { simple: true }),
                foreign_keys: Boolean(db.pragma('foreign_keys', { simple: true })),
                persistent_storage_warning: isEphemeralRenderRisk
                    ? 'Atenção: DB_PATH fora de disco persistente no Render. Configure disco persistente em /var/data/dna_auto.db.'
                    : null,
                migrations
            },
            sync_version: syncVersion,
            active_sse_connections: sseClients.size,
            cache_entries: readCache.size,
            server_time: nowIso,
            last_event: lastSyncEvent || recentEvents[0] || null,
            sources: tableStats,
            events_by_app: countsByApp,
            recent_events: recentEvents
        };
    } catch (err) {
        return {
            status: 'DEGRADED',
            error: err.message,
            sync_version: syncVersion,
            server_time: nowIso
        };
    }
}

module.exports = {
    publishSyncEvent,
    attachSseClient,
    getSyncStatus,
    invalidateAdminCache,
    getCachedOrCompute,
    getSyncVersion: () => syncVersion
};
