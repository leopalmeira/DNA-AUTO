// DNA AUTO Service Worker — PWA Oficial (Google Play Store & TWA Ready)
const CACHE_NAME = 'dna-auto-v1.4.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/variables.css',
    '/css/base.css',
    '/css/components.css',
    '/css/dossier.css',
    '/css/owner-app.css',
    '/css/print.css',
    '/js/api.js',
    '/js/app.js',
    '/js/components/ownerView.js',
    '/js/components/dossierView.js',
    '/js/components/loginView.js',
    '/js/components/landingView.js',
    '/js/components/qrcode.js',
    '/img/icons/icon-192x192.png',
    '/img/icons/icon-512x512.png',
    '/img/icons/maskable-icon-512x512.png',
    '/img/icons/dna-logo.svg',
    '/img/icons/favicon.png'
];

// Instalação do Service Worker: Faz pré-cache dos assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('[SW] Aviso no pré-cache de alguns assets:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Ativação: Limpa caches obsoletos e assume o controle imediatamente
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições: Network-First com fallback para Cache
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Ignora requisições de API para que dados dinâmicos estejam sempre atualizados
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Para navegação HTML: Network-First, fallback para index.html em cache
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    // Atualiza cache em background
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                    return res;
                })
                .catch(() => caches.match('/index.html') || caches.match('/'))
        );
        return;
    }

    // Para outros assets (CSS, JS, imagens, ícones): Cache-First ou Network-First
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) {
                // Atualiza cache em segundo plano (Stale-While-Revalidate)
                fetch(req).then((freshRes) => {
                    if (freshRes && freshRes.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, freshRes));
                    }
                }).catch(() => {});
                return cached;
            }
            return fetch(req).then((networkRes) => {
                if (networkRes && networkRes.status === 200) {
                    const clone = networkRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                }
                return networkRes;
            });
        })
    );
});
