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
