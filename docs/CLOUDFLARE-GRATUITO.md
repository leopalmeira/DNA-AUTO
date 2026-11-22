# DNA AUTO: arquitetura gratuita Cloudflare

Meta: hospedagem com custo R$ 0 enquanto o uso estiver dentro das cotas do plano gratuito.

- Cloudflare Pages para os sites Cliente, Oficina e Admin (hoje em cliente.app, oficina.app e public).
- Cloudflare Workers para reescrever a API Express atual como endpoints compativeis com Workers.
- Cloudflare D1 para banco relacional SQLite gerenciado, persistente entre deploys.

Este codigo esta SOMENTE NA BRANCH infra/cloudflare-gratuito, isolado da producao. O Worker atual serve apenas health check e BLOQUEIA login, cadastro e servicos com HTTP 503. Nao aponte aplicativos reais para esse Worker: ele nao esta pronto.

A ferramenta cloudflare/scripts/export-schema.cjs cria banco LOCAL TEMPORARIO a partir do codigo atual e extrai apenas estrutura, sem clientes. Testa importacao em SQLite local. Nao confirma D1 ate importar em homologacao. Para gerar: node cloudflare/scripts/export-schema.cjs /tmp/dna-d1-schema.sql.

Etapas obrigatorias antes de qualquer migracao:
1. Recuperar e salvar copias do banco SQLite e das fotos atuais do Render ANTES do proximo deploy.
2. Autorizar conta Cloudflare Free uma unica vez; criar D1 de teste e preencher o database_id do wrangler.toml.
3. Validar a compatibilidade de SQL e migrar TODAS as tabelas e registros preservando IDs, bcrypt e vinculos.
4. Reescrever modulos da API; better-sqlite3 e sincronico, D1 e assincrono, portanto nao funcionam por simples troca de arquivo.
5. Adaptar WhatsApp, uploads e tarefas programadas; fotos precisam de armazenamento permanente separado.
6. Testar cadastro completo, login, services, JWT e historicos com contas de homologacao.
7. Depois configurar Cloudflare Pages e URL base da API nos aplicativos. So apos validar mudar o trafego e desligar o Render.

Limites Free de referencia: Workers 100 mil requisicoes/dia; D1 5 GB, 5 milhoes linhas lidas/dia e 100 mil gravadas/dia. Cotas ultrapassadas fazem requisicoes falharem. Nao ha garantia de capacidade ilimitada.

Firebase Cloud Storage requer Blaze (faturamento), portanto NAO o usaremos nesta fase. Codigo Firebase anterior permanece opcional/desativado na ausencia de credenciais.

Fontes:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/pages/platform/limits/
https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
