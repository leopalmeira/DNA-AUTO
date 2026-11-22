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

Limites Free de referencia: Workers 100 mil requisicoes/dia; D1 500 MB por banco (5 GB por conta), 5 milhoes linhas lidas/dia e 100 mil gravadas/dia. Cotas ultrapassadas fazem requisicoes falharem. Nao ha garantia de capacidade ilimitada.

Firebase Cloud Storage requer Blaze (faturamento), portanto NAO o usaremos nesta fase. Codigo Firebase anterior permanece opcional/desativado na ausencia de credenciais.

Fontes:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/pages/platform/limits/
https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

## Exportacao segura do banco real (bloqueada ate haver copia autorizada)

Nao existe dump real de clientes versionado no GitHub. A ferramenta `cloudflare/scripts/export-live-db.cjs` requer um arquivo SQLite de backup **consistente** obtido do Render sem interromper o sistema e um destino fora do repositorio:

```
node cloudflare/scripts/export-live-db.cjs /copia-privada/dna_auto.db /copia-privada/dna-d1.sql
```

A ferramenta verifica integridade e chaves estrangeiras, cria snapshot via API nativa SQLite (WAL), rejeita comandos acima do limite de 100 KB do D1, exporta todas as tabelas, registros e indices e gera `dna-d1.sql.manifest.json` com contagens e hashes SHA-256. Os arquivos tem permissoes restritas, nunca devem ir para GitHub nem ser enviados por mensagens. Nao sobrescreve arquivos existentes. O dump inclui dados pessoais e credenciais em hash; proteger e apagar com procedimento seguro apos validacao.

**Importar apenas em D1 NOVO E VAZIO de homologacao**, depois de autorizar Cloudflare e verificar compatibilidade real com Wrangler. Em ambiente autorizado:

```
npx wrangler d1 execute dna-auto-staging --remote --file=/copia-privada/dna-d1.sql --config=cloudflare/api/wrangler.toml
```

Se qualquer comando falhar, nao alterar o Render. Comparar para cada tabela `SELECT COUNT(*)`, FKs, IDs, login, cadastro, servicos e historico com o manifesto; fazer novo snapshot final depois de congelar gravacoes para evitar perder alteracoes ocorridas durante a copia. A exportacao por si so **nao realiza importacao**, nao garante D1 pronto, nem substitui a migracao da API sincrona, fotos, notificacoes e WhatsApp.

Atenção: uploads atualmente gravados em disco e sessao Baileys (WhatsApp) nao podem ser substituidos apenas por Pages/Workers/D1; definir armazenamento e integracao gratuitos adequados e testar antes de descontinuar Render. O plano Free pode bloquear operacoes ao exceder cotas.

## CORS de seguranca (staging)

O Worker apenas permite chamadas de navegador cujos dominios estejam explicitamente em ALLOWED_ORIGINS, separados por virgula (HTTPS, sem barra ao final). Configurar origens reais dos projetos Pages e dominios adicionais; outros Origin recebem HTTP 403. Requisicoes sem Origin (ferramentas CLI) nao sao consideradas prova de autenticacao, e os endpoints continuam bloqueados ate a migracao completa. Testes automatizados verificam preflight e bloqueio de origem inesperada.
