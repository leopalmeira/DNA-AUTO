# DNA AUTO — Implantação nova, sem Render (Cloudflare Free)

## Decisão de arquitetura

A instalação é **nova e vazia**. Não migrar dados, usuários, senhas, fotos ou qualquer arquivo de servidores anteriores. Toda a infraestrutura de hospedagem nova usa exclusivamente:

- Cloudflare Pages: Cliente, Oficina e Admin, em três projetos independentes.
- Cloudflare Workers: API WebCrypto com rotas REST e autorização por perfil.
- Cloudflare D1: SQLite relacional persistente, começando **sem clientes, oficinas e veículos**.
- Cloudflare KV no plano Free: fotos e PDFs pequenos (até 2 MB por arquivo), armazenamento privado com chave UUID e autenticação. No Free, a cota é de 1 GB e 1.000 gravações/dia; operações excedentes falham sem gerar cobrança automática. A visibilidade global pode levar até 60 segundos. R2 permanece desativado e não será criado.

Os arquivos `server/` e o esquema antigo são preservados como referência de desenvolvimento. Não executam em Workers. `render.yaml` foi retirado desta branch.

## Situação real (não é publicação em produção)

Código de API D1 parcial desenvolvido e testado com simulador SQLite; não houve implantação autenticada na conta Cloudflare. Os testes de código abrangem cadastro, login, lançamento de serviço, histórico e oficina preferencial. O status de homologação `/api/v1/health` retorna `production_ready: false` mesmo com o esquema instalado.

Ainda exigem implementação ou validação específica antes de produção: módulos administrativos avançados, financeiro, representantes, WhatsApp, notificações, manutenção preditiva, anexos KV na conta real, integração Android nativa e todos os demais endpoints do Express legado não portados (retornam HTTP 501). Não prometer funcionalidade inexistente.

## Publicação isolada e automatizada pelo GitHub

Workflow: `.github/workflows/deploy-cloudflare-free.yml`.
Branch de implantação: `infra/cloudflare-gratuito`.

Conectar a conta Cloudflare ao processo autorizado e cadastrar **GitHub Actions Secrets**, nunca colocar tokens no commit:
- `CF_API_TOKEN` — token Cloudflare com permissões mínimas necessárias para Workers, Pages, D1 e Workers KV Storage Edit.
- `CF_ACCOUNT_ID` — ID de conta Cloudflare.
- `DNA_JWT_SECRET` — sequência aleatória de pelo menos 32 caracteres.
- `DNA_BOOTSTRAP_TOKEN` — chave aleatória diferente, de pelo menos 32 caracteres, usada UMA vez para criar o admin.

Depois de validar credenciais/conta, iniciar manualmente o workflow, ou fazer um commit deliberado SOMENTE no marcador `.github/cloudflare/ACIONAR_PUBLICACAO.md` (gatilho restrito). **Não criar o marcador antecipadamente.**

O workflow projeta o banco vazio `dna-auto-free`, carrega esquema com `cloudflare/scripts/export-schema.cjs` (NÃO copia dados) e perfis com `cloudflare/api/sql/seed-roles.sql`, publica o Worker `dna-auto-api-staging` e os três Pages em URLs definidas na conta. A execução ainda não foi realizada; publicação pode falhar por permissões, nomes de projetos ou limitações da conta, o que precisa ser diagnosticado no GitHub Actions antes de prosseguir.

O resumo do workflow publica as URLs que forem realmente verificadas por HTTP. NÃO inferir ou divulgar URLs antes dessa confirmação.

## Inicializar administrador com segurança

Depois de implantar e verificar o banco D1 vazio, uma pessoa autorizada deve criar a primeira conta admin com `POST /api/v1/auth/bootstrap-admin`, enviando o `DNA_BOOTSTRAP_TOKEN` no cabeçalho `Authorization: Bearer ...`, e body JSON com `name`, `email` e `password` (senha mínima 12 caracteres). Nunca colocar senha em GitHub, navegador compartilhado, documentação ou chat. Remover o segredo de bootstrap após a criação. A criação do primeiro administrador é idempotente (não cria segundo admin).

## Hospedagem de aplicativos

O script `cloudflare/pages/build.cjs` exige:
- `DNA_API_BASE_URL`: URL HTTPS da API Worker terminando em `/api/v1`.
- `DNA_CLIENT_BASE_URL`: HTTPS Pages Cliente.
- `DNA_OFICINA_BASE_URL`: HTTPS Pages Oficina.
- `DNA_ADMIN_BASE_URL`: HTTPS Pages Admin.

Só altera artefatos gerados, nunca modifica fontes originais. O script rejeita hosts `onrender.com` e substitui links legados nesses artefatos. Para APK Android, `scripts/patch-android.js` requer `INPUT_SERVER_URL` com o domínio HTTPS do projeto Pages correspondente.

## Testes, limites e critérios de liberação

O workflow `.github/workflows/test-cloudflare-free.yml` testa esquema em emulador D1 local, API em SQLite isolado, autenticação, cadastros, serviço sem foto, histórico e build Pages. **Testes locais não substituem testes reais em Workers.**

Antes de liberar usuários reais:
1. Testar no Worker publicado os fluxos de criação admin, oficina, cliente, placa, senha individual, login, sessão e autorização entre empresas.
2. Verificar integridade de histórico, quilometragem, agendamento e acesso do Cliente somente ao próprio veículo.
3. Configurar, testar e proteger R2 se forem necessárias notas/fotos; caso contrário, bloquear anexos sem quebrar o serviço.
4. Validar TODOS os recursos essenciais dos três aplicativos e versões Android, não apenas o HTTP 200 da homepage.
5. Confirmar limites do Workers Free e D1 Free em produção e contabilizar a CPU de hashing de senha.
6. Manter o `production_ready` como `false` até os requisitos realmente atendidos.

Plano gratuito não é capacidade ilimitada: Workers Free tem CPU de 10ms/req e limite diário de requisições; D1 Free máximo 500MB por banco e limites diários de linhas. Ao exceder cotas, chamadas podem falhar. Não habilitar serviços que requerem faturamento sem aprovação explícita e mecanismo de controle.

Fontes:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/pages/platform/limits/

## Anexos pequenos no plano gratuito

O deploy tentará criar/reutilizar o namespace KV `dna-auto-media-free`, sem R2. Fotos e PDFs são limitados a **2 MB por arquivo**, armazenados como valores privados (não públicos). O acesso é mediado pela API Worker, que valida o token e o vínculo do usuário ao veículo. Limite Free KV: 1 GB e 1.000 gravações/dia, com bloqueio ao exceder. A disponibilidade no edge pode levar até 60 segundos. É solução de piloto; antes de crescer, será necessário definir política de retenção, limites de uso e armazenamento de longo prazo sem ultrapassar cotas.

Fontes: https://developers.cloudflare.com/kv/platform/pricing/ e https://developers.cloudflare.com/kv/platform/limits/
