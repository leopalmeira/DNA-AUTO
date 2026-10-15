/**
 * DNA AUTO - AI Studio Component
 * Remoção Inteligente de Fundo de Veículos via WebAssembly / WebGPU
 * Utiliza o melhor repositório open-source do GitHub: @imgly/background-removal (4.5k+ stars)
 * Execução 100% in-browser, sem custos de API, sem sobrecarregar a memória do servidor.
 */

(function(window) {
    'use strict';

    let _imglyModule = null;
    let _isLoadingModule = false;

    const DnaAiStudio = {
        name: 'DnaAiStudio',
        version: '1.0.0',
        repo: 'https://github.com/imgly/background-removal-js',

        /**
         * Carrega o módulo @imgly/background-removal dinamicamente via ESM
         */
        async loadModule() {
            if (_imglyModule) return _imglyModule;
            if (_isLoadingModule) {
                // Aguarda carregamento em andamento
                while (_isLoadingModule) {
                    await new Promise(r => setTimeout(r, 100));
                }
                return _imglyModule;
            }

            _isLoadingModule = true;
            try {
                // Import dinâmico da biblioteca oficial de remoção de fundo
                const mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm');
                _imglyModule = mod.default || mod.removeBackground || mod;
                return _imglyModule;
            } catch (err) {
                console.warn('[DnaAiStudio] Erro ao importar @imgly/background-removal da CDN jsdelivr, tentando unpkg:', err);
                try {
                    const fallbackMod = await import('https://unpkg.com/@imgly/background-removal@1.7.0/dist/bundle.mjs');
                    _imglyModule = fallbackMod.default || fallbackMod.removeBackground || fallbackMod;
                    return _imglyModule;
                } catch (fallbackErr) {
                    console.error('[DnaAiStudio] Falha ao carregar motor de IA de remoção de fundo:', fallbackErr);
                    throw new Error('Não foi possível carregar a IA de recorte de fotos. Verifique sua conexão com a internet.');
                }
            } finally {
                _isLoadingModule = false;
            }
        },

        /**
         * Remove o fundo da imagem fornecida (File, Blob, ImageData ou URL)
         * @param {File|Blob|string} imageSource - Imagem de entrada
         * @param {Function} onProgress - Callback (pct: number, stageName: string)
         * @returns {Promise<Blob>} PNG com fundo transparente
         */
        async removeVehicleBackground(imageSource, onProgress) {
            if (typeof onProgress === 'function') {
                onProgress(5, 'Inicializando motor de Inteligência Artificial...');
            }

            const removeBgFn = await this.loadModule();

            if (typeof onProgress === 'function') {
                onProgress(20, 'Carregando rede neural de segmentação automotiva...');
            }

            let lastPct = 20;

            const config = {
                progress: (key, current, total) => {
                    let pct = 30;
                    let stage = 'Processando silhueta do veículo...';

                    if (typeof current === 'number' && typeof total === 'number' && total > 0) {
                        const raw = Math.round((current / total) * 100);
                        if (String(key).includes('fetch') || String(key).includes('download')) {
                            pct = Math.min(75, 20 + Math.round(raw * 0.55));
                            stage = `Baixando modelo de visão computacional (${pct}%)...`;
                        } else {
                            pct = Math.min(95, 75 + Math.round(raw * 0.20));
                            stage = `Isolando veículo e removendo fundo (${pct}%)...`;
                        }
                    } else {
                        lastPct = Math.min(92, lastPct + 5);
                        pct = lastPct;
                    }

                    if (typeof onProgress === 'function') {
                        onProgress(pct, stage);
                    }
                }
            };

            try {
                const transparentBlob = await removeBgFn(imageSource, config);
                if (typeof onProgress === 'function') {
                    onProgress(100, '✨ Fundo removido com sucesso!');
                }
                return transparentBlob;
            } catch (err) {
                console.error('[DnaAiStudio] Erro durante a remoção de fundo:', err);
                throw err;
            }
        },

        /**
         * Cria um arquivo File com nome apropriado a partir do Blob
         * @param {Blob} blob 
         * @param {string} originalName 
         * @returns {File}
         */
        blobToFile(blob, originalName = 'veiculo.png') {
            const baseName = originalName.replace(/\.[^/.]+$/, '');
            const newName = `${baseName}_dna_studio.png`;
            return new File([blob], newName, { type: 'image/png' });
        }
    };

    window.DnaAiStudio = DnaAiStudio;
})(window);
