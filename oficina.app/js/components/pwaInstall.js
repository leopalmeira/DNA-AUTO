// DNA AUTO PWA Installer — Padrão Google Play Store / Trusted Web Activity
const PwaInstall = {
    deferredPrompt: null,
    isInstalled: false,
    hasAutoPrompted: false,

    init() {
        // Detecta se já está rodando como aplicativo instalado
        this.checkIfInstalled();

        // Registra Service Worker
        this.registerServiceWorker();

        // Escuta evento nativo de instalação do navegador
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            window.deferredPwaPrompt = e;
            console.log('📲 [PWA] Evento beforeinstallprompt capturado com sucesso.');

            // Se o usuário já estiver na tela do cliente (#owner), dispara o prompt
            if (window.location.hash === '#owner' || (window.App && window.App.currentView === 'owner')) {
                this.promptInstallIfEligible();
            }
        });

        // Escuta evento de instalação concluída
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.deferredPrompt = null;
            window.deferredPwaPrompt = null;
            console.log('🎉 [PWA] DNA AUTO instalado com sucesso como aplicativo nativo!');
            this.closeInstallModal();
            this.showToastSuccess();
        });
    },

    checkIfInstalled() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                             window.navigator.standalone === true ||
                             document.referrer.includes('android-app://');
        this.isInstalled = isStandalone;
        return isStandalone;
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => {
                    console.log('🚀 [PWA] Service Worker registrado com escopo:', reg.scope);
                })
                .catch((err) => {
                    console.warn('⚠️ [PWA] Falha ao registrar Service Worker:', err);
                });
        }
    },

    // Acionado automaticamente ao conectar / navegar para o perfil de cliente
    triggerAutoPromptForClient() {
        if (this.isInstalled) {
            console.log('ℹ️ [PWA] Aplicativo já está instalado no dispositivo.');
            return;
        }

        // Aguarda 800ms para a tela do cliente renderizar completamente e disparar o download/instalação
        setTimeout(() => {
            this.promptInstallIfEligible();
        }, 800);
    },

    promptInstallIfEligible() {
        if (this.isInstalled) return;

        // Se o navegador disponibilizou o prompt nativo imediatamente
        if (this.deferredPrompt) {
            try {
                // Tenta invocar o prompt direto do navegador
                this.deferredPrompt.prompt();
                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('✅ [PWA] Usuário aceitou a instalação do DNA AUTO');
                        this.deferredPrompt = null;
                        this.closeInstallModal();
                    } else {
                        console.log('❌ [PWA] Usuário recusou a instalação');
                    }
                });
            } catch (_) {
                // Se o navegador bloquear por falta de gesto do usuário, exibe a bottom sheet modal da Play Store
                this.renderPlayStoreModal();
            }
        } else {
            // Se ainda não capturou o prompt nativo ou em navegadores desktop/iOS
            this.renderPlayStoreModal();
        }
    },

    // Executa a instalação via clique do usuário no botão oficial
    async installNow() {
        if (this.deferredPrompt) {
            try {
                this.deferredPrompt.prompt();
                const choiceResult = await this.deferredPrompt.userChoice;
                if (choiceResult.outcome === 'accepted') {
                    this.deferredPrompt = null;
                    window.deferredPwaPrompt = null;
                    this.closeInstallModal();
                }
            } catch (err) {
                console.error('Erro ao acionar prompt PWA:', err);
            }
        } else {
            // Guia dinâmico de acordo com a plataforma
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                alert('📱 Para instalar no iPhone / iPad:\n1. Toque no botão de Compartilhar (ícone com quadrado e seta para cima ⎋)\n2. Role para baixo e selecione "Adicionar à Tela de Início" ➕');
            } else {
                // No Chrome / Edge desktop ou Android
                alert('📲 Para instalar no computador ou celular:\nClique no ícone de instalação (+) na barra de endereço do navegador ou no menu do navegador (⋮) > "Instalar DNA AUTO".');
            }
        }
    },

    renderPlayStoreModal() {
        if (document.getElementById('dna-pwa-install-modal')) return;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        const modal = document.createElement('div');
        modal.id = 'dna-pwa-install-modal';
        modal.className = 'dna-pwa-modal-backdrop';
        modal.innerHTML = `
            <div class="dna-pwa-modal-sheet">
                <!-- Cabeçalho Padrão Loja de Aplicativos -->
                <div class="dna-pwa-sheet-header">
                    <div class="dna-pwa-store-badge">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3.6 1.9c-.3.3-.5.7-.5 1.3v17.6c0 .6.2 1 .5 1.3l.1.1 9.9-9.9v-.2L3.7 1.8l-.1.1zM17.4 15.6l-3.3-3.3v-.4l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.6 0 2.2l-4 2.5zm-3.8-3.8L3.7 21.7c.4.4 1 .4 1.7 0l11.4-6.5-3.2-3.4zm0-.4l3.2-3.4L5.4 1.5c-.7-.4-1.3-.4-1.7 0l9.9 9.9z"/></svg>
                        <span>DISPONÍVEL PARA DOWNLOAD</span>
                    </div>
                    <button class="dna-pwa-close-btn" onclick="PwaInstall.closeInstallModal()" title="Fechar">&times;</button>
                </div>

                <!-- Card de Apresentação do Aplicativo -->
                <div class="dna-pwa-app-card">
                    <div class="dna-pwa-icon-wrapper">
                        <img src="/img/icons/icon-192x192.png" alt="DNA AUTO App" class="dna-pwa-app-icon" />
                        <span class="dna-pwa-verified-badge" title="Verificado pelo Play Protect">🛡️</span>
                    </div>
                    <div class="dna-pwa-app-meta">
                        <h3 class="dna-pwa-app-title">DNA AUTO</h3>
                        <p class="dna-pwa-app-author">DNA AUTO Tecnologia Automotiva</p>
                        <div class="dna-pwa-tags-row">
                            <span class="dna-pwa-tag-gold">★ 4.9 (12 mil)</span>
                            <span class="dna-pwa-tag">2.8 MB</span>
                            <span class="dna-pwa-tag-green">Oficial</span>
                        </div>
                    </div>
                </div>

                <!-- Benefícios do App Instalado -->
                <div class="dna-pwa-benefits-list">
                    <div class="dna-pwa-benefit-item">
                        <div class="dna-pwa-benefit-icon">⚡</div>
                        <div class="dna-pwa-benefit-text">
                            <strong>Acesso Direto na Área de Trabalho</strong>
                            <span>Abre instantaneamente em tela cheia, igual aos apps da Play Store.</span>
                        </div>
                    </div>
                    <div class="dna-pwa-benefit-item">
                        <div class="dna-pwa-benefit-icon">🔍</div>
                        <div class="dna-pwa-benefit-text">
                            <strong>Inspeções 360° & Odômetro Offline</strong>
                            <span>Consulte seus laudos periciais e odômetro mesmo em locais sem sinal.</span>
                        </div>
                    </div>
                    <div class="dna-pwa-benefit-item">
                        <div class="dna-pwa-benefit-icon">🔔</div>
                        <div class="dna-pwa-benefit-text">
                            <strong>Alertas de Revisão & Preventivas</strong>
                            <span>Seja lembrado das manutenções programadas da rede homologada.</span>
                        </div>
                    </div>
                </div>

                ${isIOS ? `
                <div class="dna-pwa-ios-instructions">
                    <div style="font-size:13px; font-weight:700; color:#38BDF8; margin-bottom:6px;">📲 Como instalar no seu iPhone / iPad:</div>
                    <div style="font-size:12px; color:#CBD5E1; line-height:1.5;">
                        1. Toque no botão <strong>Compartilhar</strong> (ícone ⎋ na barra inferior do Safari)<br>
                        2. Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong> (➕)<br>
                        3. Confirme em <strong>"Adicionar"</strong> no canto superior direito.
                    </div>
                </div>
                ` : ''}

                <!-- Botões de Ação -->
                <div class="dna-pwa-actions-block">
                    <button class="dna-pwa-install-btn" onclick="PwaInstall.installNow()">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>INSTALAR NA ÁREA DE TRABALHO</span>
                    </button>
                    <button class="dna-pwa-skip-btn" onclick="PwaInstall.closeInstallModal()">
                        Continuar navegando pela web
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animação de entrada
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    },

    closeInstallModal() {
        const modal = document.getElementById('dna-pwa-install-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },

    showToastSuccess() {
        const toast = document.createElement('div');
        toast.className = 'dna-pwa-toast-success';
        toast.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:20px;">🎉</span>
                <div>
                    <div style="font-weight:700; color:#FFFFFF; font-size:14px;">Aplicativo DNA AUTO Instalado!</div>
                    <div style="font-size:12px; color:#CBD5E1;">O ícone oficial já está disponível na sua Área de Trabalho e Tela Inicial.</div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 50);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }
};

// Auto-inicializa o listener de instalação
if (typeof window !== 'undefined') {
    window.PwaInstall = PwaInstall;
    document.addEventListener('DOMContentLoaded', () => {
        PwaInstall.init();
    });
}
