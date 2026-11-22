# DNA AUTO - Cloudflare Pages (Cliente, Oficina e Admin)

Estes builds sao preparados para o plano gratuito da Cloudflare Pages e ficam apenas na branch infra/cloudflare-gratuito ate que o backend D1 esteja implementado.

A integracao GitHub e configurada no painel Cloudflare, usando o repositorio leopalmeira/DNA-AUTO e a branch infra/cloudflare-gratuito.

Para criar tres projetos Pages independentes:
- Cliente: Build command node cloudflare/pages/build.cjs cliente ; Output directory cloudflare/pages/dist-cliente
- Oficina: Build command node cloudflare/pages/build.cjs oficina ; Output directory cloudflare/pages/dist-oficina
- Admin: Build command node cloudflare/pages/build.cjs admin ; Output directory cloudflare/pages/dist-admin

Framework: None. Root directory: raiz do repositorio. A Cloudflare pode pedir para autorizar GitHub inicialmente. Nao configurar como producao ainda.

O script preserva caminhos legados /cliente.app e /oficina.app e arquivos do site publico para evitar recursos quebrados. Ele NAO migra as URLs da API: cliente, oficina e admin so devem ir ao ar depois de uma API Workers+D1 completa, com dados reais migrados e testes de login/cadastro. Os apps ainda apontam para /api/v1, que nao existe no site estatico isolado.

Nao remova o Render enquanto a migração e a validacao estiverem incompletas. O build pode ser gerado com node 22 sem ferramentas pagas.

## URL da API para os tres sites

Antes do deploy de homologacao, definir nos tres projetos Pages uma variavel de build chamada DNA_API_BASE_URL, com URL HTTPS do Worker terminando exatamente em /api/v1, por exemplo:

    https://SEU-WORKER.workers.dev/api/v1

O script agora reescreve apenas as COPIAS geradas de js/api.js e seus caminhos legados; nao modifica fontes nem producao. Sem a variavel, os tres sites mantem /api/v1 relativo, que nao funciona sem roteamento da API no mesmo dominio. Validar CORS (origens dos tres sites) no Worker. Enquanto a API esta bloqueada e o banco real nao foi migrado, os builds nao devem receber usuarios reais.

Teste: node --test cloudflare/pages/build.test.cjs

Importante: build nao equivale a deploy e nunca desliga o Render.
