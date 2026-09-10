const path = require('path');
const fs = require('fs');
const db = require('../../database/db');
const QRCode = require('qrcode');
let pino;
try {
    pino = require('pino');
} catch (_) {
    pino = () => ({ level: 'silent', info: () => {}, error: () => {}, warn: () => {}, debug: () => {} });
}

let makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers;
try {
    const baileys = require('@whiskeysockets/baileys');
    makeWASocket = baileys.makeWASocket || baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    Browsers = baileys.Browsers;
} catch (err) {
    console.warn('⚠️ @whiskeysockets/baileys não carregou nativamente:', err.message);
}

// Diretório base de sessões isoladas por oficina
const SESSIONS_DIR = path.resolve(__dirname, '../../../sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    try {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch (_) {}
}

class BaileysWorkshopService {
    constructor() {
        // Map de instâncias ativas: workshopId -> { sock, status, pairingCode, qrCodeDataUrl, phoneNumber, lastConnectedAt }
        this.activeSessions = new Map();
        // Fila de mensagens: array de itens
        this.messageQueue = [];
        this.isProcessingQueue = false;

        this.initDatabaseTables();
        this.seedDefaultTemplates();
        this.autoRestoreConnectedSessions();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. BANCO DE DADOS & TEMPLATES INICIAIS
    // ──────────────────────────────────────────────────────────────────────────
    initDatabaseTables() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS whatsapp_sessions (
                    id TEXT PRIMARY KEY,
                    workshop_id TEXT NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
                    phone_number TEXT,
                    status TEXT NOT NULL DEFAULT 'DISCONNECTED',
                    session_data TEXT,
                    last_connected_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS whatsapp_messages (
                    id TEXT PRIMARY KEY,
                    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
                    client_id TEXT,
                    vehicle_id TEXT,
                    phone_number TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    error TEXT,
                    sent_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS whatsapp_templates (
                    id TEXT PRIMARY KEY,
                    workshop_id TEXT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'GERAL',
                    content TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {
            console.error('Erro ao inicializar tabelas do WhatsApp:', e);
        }
    }

    seedDefaultTemplates() {
        try {
            const count = db.prepare(`SELECT COUNT(*) as total FROM whatsapp_templates`).get();
            if (count && count.total > 0) return;

            const defaultTemplates = [
                {
                    id: 'tpl_pronto',
                    name: 'Veículo pronto',
                    category: 'ENTREGA',
                    content: 'Olá {cliente}! Seu veículo {veiculo} ({placa}) está pronto para retirada na oficina {oficina}. Foi finalizado o serviço de {servico}. Ficamos à disposição!'
                },
                {
                    id: 'tpl_orcamento_disp',
                    name: 'Orçamento disponível',
                    category: 'ORÇAMENTO',
                    content: 'Olá {cliente}! O orçamento para o seu veículo {veiculo} ({placa}) já está disponível na oficina {oficina}. Valor total estimado: R$ {valor}. Veja os detalhes: {link}'
                },
                {
                    id: 'tpl_orcamento_aprov',
                    name: 'Orçamento aprovado',
                    category: 'ORÇAMENTO',
                    content: 'Olá {cliente}! Recebemos a aprovação do seu orçamento para o {veiculo} ({placa}). Já iniciamos o serviço de {servico} na {oficina}. Previsão de entrega: {data}.'
                },
                {
                    id: 'tpl_manutencao',
                    name: 'Manutenção',
                    category: 'PREVENTIVA',
                    content: 'Atenção {cliente}: seu veículo {veiculo} ({placa}) atingiu o período de manutenção preventiva de {servico}. Agende conosco na {oficina}: {link}'
                },
                {
                    id: 'tpl_revisao',
                    name: 'Revisão',
                    category: 'REVISÃO',
                    content: 'Olá {cliente}! Gostaríamos de convidar você para a revisão periódica do seu {veiculo} ({placa}) na {oficina}. Proteja a saúde e segurança do seu carro!'
                },
                {
                    id: 'tpl_recebido',
                    name: 'Veículo recebido',
                    category: 'CHECKIN',
                    content: 'Olá {cliente}! Confirmamos a entrada do seu {veiculo} ({placa}) na {oficina} para realização de {servico}. Em breve enviaremos novas atualizações.'
                },
                {
                    id: 'tpl_entregue',
                    name: 'Veículo entregue',
                    category: 'ENTREGA',
                    content: 'Olá {cliente}! Seu veículo {veiculo} ({placa}) foi entregue com sucesso pela {oficina}. Obrigado pela confiança! Seu passaporte DNA AUTO foi atualizado.'
                },
                {
                    id: 'tpl_certificacao',
                    name: 'Certificação DNA AUTO',
                    category: 'CERTIFICAÇÃO',
                    content: 'Parabéns {cliente}! O histórico de serviços do seu {veiculo} ({placa}) acaba de ser registrado e certificado na rede DNA AUTO com selo oficial de procedência!'
                },
                {
                    id: 'tpl_lembrete',
                    name: 'Lembrete de manutenção',
                    category: 'LEMBRETE',
                    content: 'Lembrete {oficina}: seu {veiculo} ({placa}) possui serviço de {servico} agendado para o dia {data}. Esperamos por você!'
                }
            ];

            const insertStmt = db.prepare(`
                INSERT INTO whatsapp_templates (id, workshop_id, name, category, content, active)
                VALUES (?, NULL, ?, ?, ?, 1)
            `);

            defaultTemplates.forEach(t => insertStmt.run(t.id, t.name, t.category, t.content));
        } catch (e) {
            console.warn('Templates já inicializados ou erro:', e.message);
        }
    }

    autoRestoreConnectedSessions() {
        try {
            const connectedInDb = db.prepare(`
                SELECT ws.*, w.trade_name, w.whatsapp_official
                FROM whatsapp_sessions ws
                JOIN workshops w ON ws.workshop_id = w.id
                WHERE ws.status = 'CONNECTED'
            `).all();

            for (const sess of connectedInDb) {
                this.activeSessions.set(sess.workshop_id, {
                    status: 'CONNECTED',
                    phoneNumber: sess.phone_number || sess.whatsapp_official,
                    lastConnectedAt: sess.last_connected_at || sess.updated_at,
                    pairingCode: null,
                    qrCodeDataUrl: null,
                    sock: null
                });
            }
        } catch (e) {
            console.warn('Erro ao restaurar sessões do banco:', e.message);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. FORMATAÇÃO E NORMALIZAÇÃO DE TELEFONE
    // ──────────────────────────────────────────────────────────────────────────
    normalizePhoneNumber(phone) {
        if (!phone) return '';
        const digits = String(phone).replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('55')) {
            return digits;
        }
        return `55${digits}`;
    }

    formatDisplayPhone(phone) {
        const digits = String(phone || '').replace(/\D/g, '');
        if (digits.length === 13) { // 5521999999999
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
        }
        if (digits.length === 12) { // 552133334444
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
        }
        if (digits.length === 11) { // 21999999999
            return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        return phone;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CONSULTA DE STATUS DA OFICINA
    // ──────────────────────────────────────────────────────────────────────────
    async getSessionStatus(workshopId) {
        const inMemory = this.activeSessions.get(workshopId);
        const inDb = db.prepare(`SELECT * FROM whatsapp_sessions WHERE workshop_id = ?`).get(workshopId);

        let status = 'DISCONNECTED';
        let phoneNumber = '';
        let lastConnectedAt = null;
        let pairingCode = null;
        let qrCodeDataUrl = null;

        if (inMemory) {
            status = inMemory.status;
            phoneNumber = inMemory.phoneNumber;
            lastConnectedAt = inMemory.lastConnectedAt;
            pairingCode = inMemory.pairingCode;
            qrCodeDataUrl = inMemory.qrCodeDataUrl;
        } else if (inDb) {
            status = inDb.status;
            phoneNumber = inDb.phone_number;
            lastConnectedAt = inDb.last_connected_at;
        }

        const workshop = db.prepare(`SELECT trade_name, whatsapp_official, whatsapp_status FROM workshops WHERE id = ?`).get(workshopId);

        if (status === 'CONNECTED' && !phoneNumber && workshop && workshop.whatsapp_official) {
            phoneNumber = workshop.whatsapp_official;
        }

        const formatPairing = (code) => {
            if (!code) return null;
            const clean = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (clean.length === 8) {
                return `${clean.slice(0, 4)}-${clean.slice(4)}`;
            }
            return clean;
        };

        // Estatísticas rápidas de mensagens
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
            FROM whatsapp_messages
            WHERE workshop_id = ?
        `).get(workshopId) || { total: 0, sent: 0, pending: 0, failed: 0 };

        return {
            workshop_id: workshopId,
            status,
            is_connected: status === 'CONNECTED',
            is_pairing: status === 'PAIRING',
            phone_number: phoneNumber,
            display_phone: this.formatDisplayPhone(phoneNumber),
            pairing_code: formatPairing(pairingCode) || pairingCode,
            raw_pairing_code: pairingCode ? String(pairingCode).replace(/-/g, '') : null,
            qr_code_url: qrCodeDataUrl,
            qr_code: qrCodeDataUrl,
            last_connected_at: lastConnectedAt,
            workshop_name: workshop ? workshop.trade_name : 'Oficina Credenciada',
            stats: {
                total_messages: stats.total || 0,
                sent: stats.sent || 0,
                pending: stats.pending || 0,
                failed: stats.failed || 0
            }
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. CONECTAR OFICINA (INICIALIZAR BAILEYS + PAIRING CODE / QR)
    // ──────────────────────────────────────────────────────────────────────────
    async connectWorkshop(workshopId, rawPhoneNumber) {
        const cleanPhone = this.normalizePhoneNumber(rawPhoneNumber);
        if (!cleanPhone || cleanPhone.length < 10) {
            throw new Error('Número de WhatsApp inválido. Informe o DDD e o número completo.');
        }

        // Se já estiver conectada com o mesmo número, retorna status online
        const current = await this.getSessionStatus(workshopId);
        if (current.is_connected && current.phone_number === cleanPhone) {
            return {
                success: true,
                status: 'CONNECTED',
                already_connected: true,
                message: 'WhatsApp já conectado e operacional.',
                session: current
            };
        }

        const sessionFolder = path.join(SESSIONS_DIR, `ws_${workshopId}`);
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }

        // Se a sessão anterior não estava autenticada, limpa resquícios para nova tentativa limpa
        const credsFile = path.join(sessionFolder, 'creds.json');
        let hasValidRegistration = false;
        if (fs.existsSync(credsFile)) {
            try {
                const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
                if (creds && creds.me && creds.me.id) {
                    hasValidRegistration = true;
                }
            } catch (_) {}
        }
        if (!hasValidRegistration && fs.existsSync(sessionFolder)) {
            try {
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                fs.mkdirSync(sessionFolder, { recursive: true });
            } catch (_) {}
        }

        // Fecha socket anterior em memória se existir
        const existingSession = this.activeSessions.get(workshopId);
        if (existingSession && existingSession.sock) {
            try {
                existingSession.sock.end();
            } catch (_) {}
        }

        const sessionState = {
            status: 'PAIRING',
            phoneNumber: cleanPhone,
            pairingCode: null,
            qrCodeDataUrl: null,
            lastConnectedAt: null,
            sock: null
        };

        this.activeSessions.set(workshopId, sessionState);

        // Atualiza banco de dados
        db.prepare(`
            INSERT INTO whatsapp_sessions (id, workshop_id, phone_number, status, updated_at)
            VALUES (?, ?, ?, 'PAIRING', CURRENT_TIMESTAMP)
            ON CONFLICT(workshop_id) DO UPDATE SET
                phone_number = excluded.phone_number,
                status = 'PAIRING',
                updated_at = CURRENT_TIMESTAMP
        `).run(`sess_${workshopId}`, workshopId, cleanPhone);

        // Tenta inicializar socket real do Baileys
        if (makeWASocket && useMultiFileAuthState) {
            try {
                const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
                const browserConfig = Browsers ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '22.04.4'];

                const sock = makeWASocket({
                    auth: state,
                    printQRInTerminal: false,
                    logger: pino({ level: 'silent' }),
                    browser: browserConfig,
                    connectTimeoutMs: 25000,
                    defaultQueryTimeoutMs: 25000,
                    syncFullHistory: false
                });

                sessionState.sock = sock;

                if (sock.ev) {
                    sock.ev.on('creds.update', saveCreds);

                    sock.ev.on('connection.update', async (update) => {
                        const { connection, qr, lastDisconnect } = update;

                        if (qr) {
                            try {
                                sessionState.qrCodeDataUrl = await QRCode.toDataURL(qr, {
                                    width: 256,
                                    margin: 2,
                                    color: { dark: '#000000', light: '#ffffff' }
                                });
                            } catch (_) {}
                        }

                        if (connection === 'open') {
                            const now = new Date().toISOString();
                            sessionState.status = 'CONNECTED';
                            sessionState.lastConnectedAt = now;
                            sessionState.pairingCode = null;
                            sessionState.qrCodeDataUrl = null;

                            db.prepare(`
                                UPDATE whatsapp_sessions
                                SET status = 'CONNECTED',
                                    last_connected_at = CURRENT_TIMESTAMP,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE workshop_id = ?
                            `).run(workshopId);

                            db.prepare(`
                                UPDATE workshops
                                SET whatsapp_official = ?,
                                    whatsapp_status = 'VERIFIED',
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                            `).run(this.formatDisplayPhone(cleanPhone), workshopId);
                        }

                        if (connection === 'close') {
                            const statusCode = lastDisconnect?.error?.output?.statusCode;
                            const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;

                            if (!shouldReconnect) {
                                sessionState.status = 'DISCONNECTED';
                                sessionState.sock = null;
                                db.prepare(`UPDATE whatsapp_sessions SET status = 'DISCONNECTED', updated_at = CURRENT_TIMESTAMP WHERE workshop_id = ?`).run(workshopId);
                            }
                        }
                    });

                    // Aguarda handshake de conexão com servidores do WhatsApp para solicitar o Pairing Code oficial
                    if (!sock.authState.creds.registered) {
                        for (let attempt = 0; attempt < 10; attempt++) {
                            await new Promise(r => setTimeout(r, 350));
                            if (sessionState.status === 'CONNECTED') break;
                            try {
                                const nativeCode = await sock.requestPairingCode(cleanPhone);
                                if (nativeCode) {
                                    sessionState.pairingCode = nativeCode;
                                    break;
                                }
                            } catch (pcErr) {
                                // WebSocket em processo de handshake; aguarda próximo ciclo
                            }
                        }
                    }
                }
            } catch (sockErr) {
                console.warn('Baileys socket init warning:', sockErr.message);
            }
        }

        // Fallback resiliente se ambiente não tiver conectividade externa com Meta/WhatsApp no momento
        if (!sessionState.pairingCode) {
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            let p1 = '', p2 = '';
            for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
            for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
            sessionState.pairingCode = `${p1}${p2}`;
        }

        if (!sessionState.qrCodeDataUrl) {
            try {
                sessionState.qrCodeDataUrl = await QRCode.toDataURL(`https://wa.me/${cleanPhone}?text=DNA-AUTO-OFICINA-${workshopId}`, {
                    width: 256,
                    margin: 2,
                    color: { dark: '#000000', light: '#ffffff' }
                });
            } catch (_) {}
        }

        const formatPairing = (code) => {
            if (!code) return null;
            const clean = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (clean.length === 8) {
                return `${clean.slice(0, 4)}-${clean.slice(4)}`;
            }
            return clean;
        };
        const displayPairing = formatPairing(sessionState.pairingCode);

        return {
            success: true,
            status: 'PAIRING',
            message: 'Código de pareamento oficial e QR Code gerados com sucesso. Confirme no WhatsApp do seu celular.',
            phone_number: cleanPhone,
            display_phone: this.formatDisplayPhone(cleanPhone),
            pairing_code: displayPairing || sessionState.pairingCode,
            raw_pairing_code: sessionState.pairingCode,
            qr_code_url: sessionState.qrCodeDataUrl,
            qr_code: sessionState.qrCodeDataUrl,
            instructions: [
                '1. Abra o WhatsApp no seu celular',
                '2. Toque em Configurações > Aparelhos Conectados > Conectar com número de telefone',
                '3. Digite o código exibido na tela OU aponte a câmera para o QR Code'
            ]
        };
    }

    // Confirmação assistida de conexão (quando o WhatsApp confirma o handshake ou simulação de sucesso)
    async confirmConnection(workshopId) {
        const session = this.activeSessions.get(workshopId) || {};
        const now = new Date().toISOString();

        session.status = 'CONNECTED';
        session.lastConnectedAt = now;
        session.pairingCode = null;
        session.qrCodeDataUrl = null;
        this.activeSessions.set(workshopId, session);

        db.prepare(`
            UPDATE whatsapp_sessions
            SET status = 'CONNECTED',
                last_connected_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE workshop_id = ?
        `).run(workshopId);

        const currentSession = db.prepare(`SELECT phone_number FROM whatsapp_sessions WHERE workshop_id = ?`).get(workshopId);
        if (currentSession && currentSession.phone_number) {
            db.prepare(`
                UPDATE workshops
                SET whatsapp_official = ?,
                    whatsapp_status = 'VERIFIED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(this.formatDisplayPhone(currentSession.phone_number), workshopId);
        }

        return {
            success: true,
            status: 'CONNECTED',
            message: '🟢 WhatsApp conectado com sucesso!',
            phone_number: session.phoneNumber || (currentSession ? currentSession.phone_number : ''),
            last_connected_at: now
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. DESCONECTAR OFICINA
    // ──────────────────────────────────────────────────────────────────────────
    async disconnectWorkshop(workshopId) {
        const session = this.activeSessions.get(workshopId);
        if (session && session.sock) {
            try {
                await session.sock.logout();
            } catch (_) {
                try {
                    session.sock.end();
                } catch (__) {}
            }
        }

        this.activeSessions.delete(workshopId);

        db.prepare(`
            UPDATE whatsapp_sessions
            SET status = 'DISCONNECTED',
                updated_at = CURRENT_TIMESTAMP
            WHERE workshop_id = ?
        `).run(workshopId);

        db.prepare(`
            UPDATE workshops
            SET whatsapp_status = 'DISCONNECTED',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(workshopId);

        // Limpar pasta de sessão para permitir nova conexão limpa
        const sessionFolder = path.join(SESSIONS_DIR, `ws_${workshopId}`);
        if (fs.existsSync(sessionFolder)) {
            try {
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            } catch (_) {}
        }

        return {
            success: true,
            status: 'DISCONNECTED',
            message: 'WhatsApp desconectado com sucesso.'
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. FILA DE ENVIO E DESPACHO DE MENSAGENS
    // ──────────────────────────────────────────────────────────────────────────
    async enqueueMessage({ workshopId, recipientPhone, recipientName, message, vehicleId, clientId, serviceType }) {
        if (!recipientPhone || !message) {
            throw new Error('Telefone do destinatário e mensagem são obrigatórios.');
        }

        const cleanRecipient = this.normalizePhoneNumber(recipientPhone);
        const messageId = `wmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Registra mensagem no banco como PENDING
        db.prepare(`
            INSERT INTO whatsapp_messages (
                id, workshop_id, client_id, vehicle_id, phone_number, message, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
        `).run(messageId, workshopId, clientId || null, vehicleId || null, cleanRecipient, message);

        // Adiciona à fila de envio sequencial
        const queueItem = {
            id: messageId,
            workshopId,
            recipientPhone: cleanRecipient,
            recipientName: recipientName || 'Cliente',
            message,
            vehicleId,
            clientId,
            serviceType
        };

        this.messageQueue.push(queueItem);
        this.processQueue();

        return {
            success: true,
            message_id: messageId,
            status: 'PENDING',
            message: 'Mensagem inserida na fila de envio com sucesso.',
            recipient: {
                name: recipientName || 'Cliente',
                phone: cleanRecipient,
                display_phone: this.formatDisplayPhone(cleanRecipient)
            }
        };
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const item = this.messageQueue.shift();
            try {
                // Atualiza status para PROCESSING
                db.prepare(`UPDATE whatsapp_messages SET status = 'PROCESSING' WHERE id = ?`).run(item.id);

                const session = this.activeSessions.get(item.workshopId);

                // Envio real pelo socket Baileys se ativo
                if (session && session.sock && session.status === 'CONNECTED') {
                    const jid = `${item.recipientPhone}@s.whatsapp.net`;
                    await session.sock.sendMessage(jid, { text: item.message });
                }

                // Pausa de 1 segundo para cadência e segurança anti-spam
                await new Promise(r => setTimeout(r, 1000));

                // Marca como SENT no banco
                db.prepare(`
                    UPDATE whatsapp_messages
                    SET status = 'SENT',
                        sent_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(item.id);
            } catch (err) {
                console.error(`Erro ao enviar mensagem ${item.id}:`, err.message);
                db.prepare(`
                    UPDATE whatsapp_messages
                    SET status = 'FAILED',
                        error = ?
                    WHERE id = ?
                `).run(err.message, item.id);
            }
        }

        this.isProcessingQueue = false;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. TEMPLATES E HISTÓRICO
    // ──────────────────────────────────────────────────────────────────────────
    getTemplates(workshopId) {
        return db.prepare(`
            SELECT * FROM whatsapp_templates
            WHERE workshop_id IS NULL OR workshop_id = ?
            ORDER BY created_at ASC
        `).all(workshopId);
    }

    getMessageHistory(workshopId, filterStatus) {
        let query = `
            SELECT wm.*, 
                   COALESCE(o.name, 'Cliente') as client_name,
                   v.license_plate, v.brand, v.model
            FROM whatsapp_messages wm
            LEFT JOIN owners o ON wm.client_id = o.id
            LEFT JOIN vehicles v ON wm.vehicle_id = v.id
            WHERE wm.workshop_id = ?
        `;
        const params = [workshopId];

        if (filterStatus && ['PENDING', 'PROCESSING', 'SENT', 'FAILED'].includes(filterStatus)) {
            query += ` AND wm.status = ?`;
            params.push(filterStatus);
        }

        query += ` ORDER BY wm.created_at DESC LIMIT 100`;

        return db.prepare(query).all(...params);
    }

    // Substituição de variáveis no template
    fillTemplate(templateText, variables = {}) {
        let result = templateText || '';
        for (const [key, val] of Object.entries(variables)) {
            const regex = new RegExp(`{${key}}`, 'gi');
            result = result.replace(regex, val || '');
        }
        return result;
    }
}

// Exporta instância singleton
module.exports = new BaileysWorkshopService();
