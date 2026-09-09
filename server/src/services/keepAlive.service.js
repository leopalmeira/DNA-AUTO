/**
 * Keep-Alive Service para evitar suspensão (sleep / spin-down) no Render.
 *
 * No plano gratuito do Render, os Web Services são suspensos após 15 minutos de inatividade HTTP externa.
 * Este serviço realiza requisições periódicas automáticas para a URL pública externa da aplicação,
 * mantendo o roteador do Render ativo e impedindo a hibernação.
 */

let pingTimer = null;

/**
 * Obtém a URL pública do servidor para envio do ping externo
 */
function getTargetUrl() {
    if (process.env.KEEP_ALIVE_URL) {
        return process.env.KEEP_ALIVE_URL.replace(/\/+$/, '');
    }
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    }
    if (process.env.SERVER_URL) {
        return process.env.SERVER_URL.replace(/\/+$/, '');
    }
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/+$/, '');
    }
    if (process.env.RENDER === 'true') {
        const serviceName = process.env.RENDER_SERVICE_NAME || 'dna-auto';
        return `https://${serviceName}.onrender.com`;
    }
    if (process.env.NODE_ENV === 'production') {
        return 'https://dna-auto.onrender.com';
    }
    return null;
}

/**
 * Executa um ping único ao endpoint de healthcheck
 */
async function pingServer(targetBaseUrl = getTargetUrl()) {
    if (!targetBaseUrl) {
        return { success: false, reason: 'Nenhuma URL de ping configurada (modo local)' };
    }

    const healthUrl = `${targetBaseUrl}/api/v1/health`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'DNA-AUTO-KeepAlive/1.0',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.log(`[Keep-Alive] 🏓 Ping enviado com sucesso para ${healthUrl} [${response.status}] às ${timestamp}`);
            return { success: true, status: response.status, url: healthUrl };
        } else {
            console.warn(`[Keep-Alive] ⚠️ Resposta inesperada de ${healthUrl}: ${response.status} ${response.statusText}`);
            return { success: false, status: response.status, url: healthUrl };
        }
    } catch (err) {
        console.error(`[Keep-Alive] ❌ Falha ao pingar ${healthUrl}: ${err.message}`);
        return { success: false, error: err.message, url: healthUrl };
    }
}

/**
 * Inicia o ciclo de ping periódico (padrão: a cada 10 minutos)
 */
function startKeepAlive(intervalMinutes = 10) {
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_KEEP_ALIVE === 'true') {
        return null;
    }

    const targetUrl = getTargetUrl();
    if (!targetUrl) {
        console.log('[Keep-Alive] ℹ️ Ambiente local: Ping desativado (defina RENDER_EXTERNAL_URL ou KEEP_ALIVE_URL para ativar)');
        return null;
    }

    if (pingTimer) {
        clearInterval(pingTimer);
    }

    const intervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS) || (intervalMinutes * 60 * 1000);
    console.log(`[Keep-Alive] 🚀 Anti-Sleep ativado: ping a cada ${intervalMinutes} min para ${targetUrl}/api/v1/health`);

    // Primeiro ping rápido (após 1 minuto) para validar que a rota está ativa
    setTimeout(() => {
        pingServer(targetUrl);
    }, 60000).unref();

    // Ciclo contínuo de ping
    pingTimer = setInterval(() => {
        pingServer(targetUrl);
    }, intervalMs);

    // Permite que o processo do Node finalize normalmente se solicitado
    if (pingTimer.unref) {
        pingTimer.unref();
    }

    return pingTimer;
}

/**
 * Para o timer de keep-alive
 */
function stopKeepAlive() {
    if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
        console.log('[Keep-Alive] 🛑 Anti-Sleep desativado.');
    }
}

module.exports = {
    startKeepAlive,
    stopKeepAlive,
    pingServer,
    getTargetUrl
};
