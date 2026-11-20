// ==============================================================================
// DNA AUTO — GERENCIADOR DE SINCRONIZAÇÃO EM TEMPO REAL (FASE 7)
// SSE + Reconexão Exponencial + Polling Fallback + Proteção Anti-Race-Condition
// ==============================================================================

const AdminSync = {
    eventSource: null,
    pollTimer: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    connectionState: 'CONNECTING', // 'ONLINE', 'RECONNECTING', 'OFFLINE'
    lastSyncAt: null,
    lastErrorMessage: null,
    syncVersion: 0,
    requestSeq: 0,
    onEventCallback: null,
    onStateCallback: null,
    isActive: false,

    start({ onEvent, onState } = {}) {
        this.stop();
        this.isActive = true;
        this.onEventCallback = onEvent || null;
        this.onStateCallback = onState || null;
        this.reconnectAttempt = 0;

        this.connectSse();
        this.startPollingFallback();
    },

    stop() {
        this.isActive = false;
        if (this.eventSource) {
            try { this.eventSource.close(); } catch (_) {}
            this.eventSource = null;
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    },

    nextRequestToken() {
        this.requestSeq += 1;
        return this.requestSeq;
    },

    isLatestRequest(token) {
        return token === this.requestSeq;
    },

    setState(nextState, errorMessage = null) {
        this.connectionState = nextState;
        this.lastErrorMessage = errorMessage;
        if (nextState === 'ONLINE') {
            this.lastSyncAt = new Date().toISOString();
        }
        if (typeof this.onStateCallback === 'function') {
            this.onStateCallback({
                state: this.connectionState,
                lastSyncAt: this.lastSyncAt,
                errorMessage: this.lastErrorMessage,
                syncVersion: this.syncVersion
            });
        }
    },

    markRequestSuccess() {
        this.setState('ONLINE', null);
    },

    markRequestFailure(err) {
        const msg = (err && err.message) || 'Não foi possível comunicar com a API DNA AUTO.';
        this.setState('OFFLINE', msg);
    },

    connectSse() {
        if (!this.isActive || typeof EventSource === 'undefined') return;
        const token = API.token || localStorage.getItem('dna_token') || '';
        if (!token) return;

        try {
            if (this.eventSource) {
                this.eventSource.close();
            }
            const baseUrl = API.baseUrl || '/api/v1';
            const streamUrl = `${baseUrl}/admin/sync/stream?access_token=${encodeURIComponent(token)}`;
            const es = new EventSource(streamUrl);
            this.eventSource = es;

            es.addEventListener('connected', (ev) => {
                this.reconnectAttempt = 0;
                try {
                    const data = JSON.parse(ev.data || '{}');
                    if (data.sync_version) this.syncVersion = data.sync_version;
                } catch (_) {}
                this.setState('ONLINE', null);
            });

            es.addEventListener('heartbeat', (ev) => {
                try {
                    const data = JSON.parse(ev.data || '{}');
                    if (data.sync_version && data.sync_version > this.syncVersion) {
                        this.syncVersion = data.sync_version;
                        if (typeof this.onEventCallback === 'function') {
                            this.onEventCallback({ event_type: 'VERSION_BUMP', sync_version: data.sync_version });
                        }
                    }
                } catch (_) {}
                if (this.connectionState !== 'ONLINE') {
                    this.setState('ONLINE', null);
                }
            });

            es.addEventListener('sync', (ev) => {
                try {
                    const data = JSON.parse(ev.data || '{}');
                    if (data.sync_version) this.syncVersion = data.sync_version;
                    this.setState('ONLINE', null);
                    if (typeof this.onEventCallback === 'function') {
                        this.onEventCallback(data);
                    }
                } catch (_) {}
            });

            es.onerror = () => {
                if (!this.isActive) return;
                try { es.close(); } catch (_) {}
                this.eventSource = null;
                this.reconnectAttempt += 1;
                const delayMs = Math.min(30000, 2000 * Math.pow(1.6, Math.min(this.reconnectAttempt, 6)));
                this.setState(this.reconnectAttempt >= 3 ? 'OFFLINE' : 'RECONNECTING', 'Conexão em tempo real interrompida. Tentando reconectar...');
                if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
                this.reconnectTimer = setTimeout(() => this.connectSse(), delayMs);
            };
        } catch (err) {
            this.setState('RECONNECTING', err.message);
        }
    },

    startPollingFallback() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = setInterval(async () => {
            if (!this.isActive || document.hidden) return;
            try {
                const res = await API.getAdminSyncStatus();
                if (res && res.status === 'ONLINE') {
                    const remoteVersion = Number(res.sync_version || 0);
                    const changed = remoteVersion > this.syncVersion;
                    this.syncVersion = Math.max(this.syncVersion, remoteVersion);
                    this.setState('ONLINE', null);
                    if (changed && typeof this.onEventCallback === 'function') {
                        this.onEventCallback({ event_type: 'POLL_VERSION_CHANGE', sync_version: remoteVersion });
                    }
                } else {
                    this.setState('RECONNECTING', 'API reportando estado degradado.');
                }
            } catch (err) {
                this.markRequestFailure(err);
            }
        }, 30000);
    }
};
