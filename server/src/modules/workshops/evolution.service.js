// ==============================================================================
// DNA AUTO — CLIENTE EVOLUTION API v2 (INTEGRAÇÃO WHATSAPP EM NUVEM)
// Repositório Oficial: https://github.com/EvolutionAPI/evolution-api
// Função: Conectar instâncias de WhatsApp com alta taxa de entrega,
// QR Code persistente e imunidade aos bloqueios de IP de datacenter.
// ==============================================================================

const db = require('../../database/db');

class EvolutionApiService {
    constructor() {
        this.initSettingsTable();
    }

    initSettingsTable() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS system_integrations (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (_) {}
    }

    getConfig() {
        let apiUrl = process.env.EVOLUTION_API_URL || '';
        let apiKey = process.env.EVOLUTION_API_KEY || '';

        try {
            const urlRow = db.prepare(`SELECT value FROM system_integrations WHERE key = 'evolution_api_url'`).get();
            const keyRow = db.prepare(`SELECT value FROM system_integrations WHERE key = 'evolution_api_key'`).get();
            if (urlRow && urlRow.value) apiUrl = urlRow.value;
            if (keyRow && keyRow.value) apiKey = keyRow.value;
        } catch (_) {}

        apiUrl = (apiUrl || '').trim().replace(/\/+$/, '');
        apiKey = (apiKey || '').trim();

        return {
            apiUrl,
            apiKey,
            isConfigured: !!(apiUrl && apiKey)
        };
    }

    saveConfig(apiUrl, apiKey) {
        const cleanUrl = (apiUrl || '').trim().replace(/\/+$/, '');
        const cleanKey = (apiKey || '').trim();

        db.prepare(`
            INSERT INTO system_integrations (key, value, updated_at)
            VALUES ('evolution_api_url', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).run(cleanUrl);

        db.prepare(`
            INSERT INTO system_integrations (key, value, updated_at)
            VALUES ('evolution_api_key', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).run(cleanKey);

        return this.getConfig();
    }

    getInstanceName(workshopId) {
        return `dna_ws_${String(workshopId || 'default').replace(/[^a-zA-Z0-9_]/g, '')}`;
    }

    async testConnection(targetUrl = null, targetKey = null) {
        const config = this.getConfig();
        const apiUrl = (targetUrl || config.apiUrl || '').replace(/\/+$/, '');
        const apiKey = targetKey || config.apiKey;

        if (!apiUrl || !apiKey) {
            return {
                success: false,
                online: false,
                is_configured: false,
                error: 'URL ou API Key da Evolution API não informada.'
            };
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(`${apiUrl}/instance/fetchInstances`, {
                method: 'GET',
                headers: { 'apikey': apiKey },
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (res.ok) {
                return {
                    success: true,
                    online: true,
                    is_configured: true,
                    message: '🟢 Conexão com Evolution API estabelecida com sucesso!',
                    status: res.status
                };
            }
            return {
                success: false,
                online: false,
                is_configured: false,
                error: `Evolution API retornou erro HTTP ${res.status}. Verifique sua Chave de API.`
            };
        } catch (err) {
            return {
                success: false,
                online: false,
                is_configured: false,
                error: `Não foi possível alcançar a Evolution API (${err.message}). Verifique a URL.`
            };
        }
    }

    async createOrConnectInstance(workshopId, phoneNumber) {
        const { apiUrl, apiKey, isConfigured } = this.getConfig();
        if (!isConfigured) {
            throw new Error('Evolution API não configurada. Salve a URL e API Key primeiro.');
        }

        const instanceName = this.getInstanceName(workshopId);

        // 1. Cria a instância se não existir
        try {
            await fetch(`${apiUrl}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: `${instanceName}_token`,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS'
                })
            });
        } catch (_) {}

        // 2. Solicita o QR Code de conexão atualizado
        const connectRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': apiKey }
        });

        const data = await connectRes.json();
        const base64 = data.base64 || (data.qrcode ? data.qrcode.base64 : null);
        const code = data.code || (data.qrcode ? data.qrcode.code : null);
        const pairingCode = data.pairingCode || null;

        return {
            success: true,
            provider: 'EVOLUTION_API_V2',
            status: 'PAIRING',
            instance_name: instanceName,
            qr_code_url: base64,
            pairing_code: pairingCode,
            code: code
        };
    }

    async getConnectionState(workshopId) {
        const { apiUrl, apiKey, isConfigured } = this.getConfig();
        if (!isConfigured) return null;

        const instanceName = this.getInstanceName(workshopId);
        try {
            const res = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': apiKey }
            });
            if (!res.ok) return null;
            const data = await res.json();
            const state = data?.instance?.state || data?.state || 'close';

            return {
                is_connected: state === 'open',
                state: state,
                provider: 'EVOLUTION_API_V2'
            };
        } catch (_) {
            return null;
        }
    }

    async sendTextMessage(workshopId, recipientPhone, message) {
        const { apiUrl, apiKey, isConfigured } = this.getConfig();
        if (!isConfigured) throw new Error('Evolution API não configurada.');

        const instanceName = this.getInstanceName(workshopId);
        const cleanPhone = String(recipientPhone).replace(/\D/g, '');

        const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: message,
                delay: 1200
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Erro ao enviar mensagem pela Evolution API: ${errBody}`);
        }

        const resData = await res.json();
        return {
            success: true,
            status: 'SENT',
            message_id: resData?.key?.id || `evo_${Date.now()}`,
            protocol: `EVO-${Date.now()}`
        };
    }

    async logoutInstance(workshopId) {
        const { apiUrl, apiKey, isConfigured } = this.getConfig();
        if (!isConfigured) return { success: true };

        const instanceName = this.getInstanceName(workshopId);
        try {
            await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': apiKey }
            });
            await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': apiKey }
            });
        } catch (_) {}

        return { success: true, message: 'Instância desconectada com sucesso da Evolution API.' };
    }
}

module.exports = new EvolutionApiService();
