# DNA AUTO — Central Administrativa Integrada V2

Documentação técnica oficial da modernização do painel administrativo da plataforma **DNA AUTO**, unificando em tempo real os dados dos aplicativos **Cliente** (`/cliente`), **Oficina** (`/oficina`), **Portal do Representante Comercial** (`/representante`) e **Central Administrativa** (`/admin`).

---

## 1. Diagnóstico Técnico da Auditoria (Fase 1)

Antes da reestruturação, a auditoria completa do repositório identificou os seguintes pontos críticos:

1. **Vulnerabilidade Crítica de Controle de Acesso (RBAC)**:
   - `server/src/modules/admin/admin.routes.js` não aplicava `authenticateToken` nem `authorizeRoles('ADMIN')` em nenhuma rota administrativa.
   - `server/src/middlewares/auth.js` aceitava cabeçalho `X-Demo-User-Id` e tokens contendo `usr_` sem validação de assinatura JWT.
   - `public/js/api.js`, `cliente.app/js/api.js` e `oficina.app/js/api.js` inicializavam `currentDemoUserId: 'usr_admin'`, e `public/js/components/loginView.js` trazia a senha administrativa pré-preenchida e fallback offline sem API.
   - `render.yaml` continha a chave `WDAPI_TOKEN` literal em texto plano.
2. **Inconsistência e Distorção de Indicadores**:
   - `GET /api/v1/admin/network-stats` executava `LEFT JOIN vehicle_dna` e `LEFT JOIN service_records` na mesma query, causando multiplicação cartesiana em `SUM(total_cost_cents)` quando uma oficina possuía múltiplos DNAs e múltiplas OS.
   - `public/js/components/adminView.js` exibia fallbacks fictícios (`net.totalClients || 3`), calculava comissões no navegador (`dnas_activated * 15`) e invocava métodos inexistentes em `API` (`getAdminRepresentatives`, `getAdminSupportTickets`).
   - `public/index.html` exibia números e nomes de oficinas hardcoded na topbar e sidebar.
3. **Lacunas no Motor Financeiro de Comissões**:
   - Ausência de versionamento de políticas comerciais (preço histórico de R$ 49,90 vs nova tabela R$ 59,90).
   - Ausência de apuração por competência (`YYYY-MM`), previsão separada do próximo ciclo, fechamento financeiro atômico anti-duplicidade, controle de lotes pagos manualmente, estorno pós-pagamento (clawback) e demonstrativo auditável completo.
4. **Persistência de Banco de Dados no Render**:
   - `render.yaml` opera em `plan: free` sem Persistent Disk, tornando o arquivo SQLite `dna_auto.db` efêmero a cada deploy/restart.

---

## 2. Arquitetura da Solução

A Central Administrativa Integrada V2 opera sobre o **mesmo servidor Express + SQLite** da plataforma (fonte única de verdade), sem criar banco paralelo ou sistema isolado:

```text
APP CLIENTE (/cliente) ──┐
APP OFICINA (/oficina) ──┼──▶ API Express (/api/v1) ──▶ SQLite (WAL + FKs) ──▶ SSE / Polling ──▶ CENTRAL ADMIN V2 (/admin)
PORTAL REP (/representante)─┤                                   ▲
WEBHOOKS ABACATEPAY ───────┘                                   └── sync_events + Cache Invalidation
```

### 2.1 Arquivos Criados

- `server/src/database/migrations/adminCentralV2.migration.js` — Migrações idempotentes e incrementais V2 (tabelas, colunas, 15 índices e backfill).
- `server/src/middlewares/rateLimit.js` — Rate limiting em memória para endpoints sensíveis (login, reset, mutações financeiras).
- `server/src/services/syncEvents.service.js` — Canal SSE (`/api/v1/admin/sync/stream`), heartbeat, cache com invalidação por `syncVersion` e `sync_events`.
- `server/src/services/commissionFinance.service.js` — Motor financeiro de comissões em centavos inteiros, políticas comerciais versionadas, elegibilidade de 6 regras, competência, fechamento atômico e marcação manual auditada.
- `server/src/services/adminAnalytics.service.js` — Consolidação dos 16 KPIs do Dashboard, 8 séries históricas/gráficos, desduplicação rigorosa de clientes únicos × múltiplos veículos, busca global e conciliação financeira.
- `public/css/admin-v2.css` — Design System administrativo DNA AUTO (azul profundo `#060b16`, ciano `#00D4FF`, dourado `#FFD21C`), sidebar fixa/recolhível e drawer mobile responsivo.
- `public/js/components/admin/adminCharts.js` — Gráficos vetoriais SVG nativos (sem dependência externa de CDN).
- `public/js/components/admin/adminSync.js` — Cliente SSE com reconexão exponencial, polling fallback, controle de estado `ONLINE`/`RECONNECTING`/`OFFLINE` e `requestSeq` anti-race-condition.
- `public/js/components/admin/adminScreensCore.js` — Telas de **Visão Geral** (3) e **Rede DNA AUTO** (5 + Detalhe da Oficina).
- `public/js/components/admin/adminScreensCommercial.js` — Telas de **Gestão Comercial** (5 + Ficha Individual do Representante com 7 blocos).
- `public/js/components/admin/adminScreensFinance.js` — Telas do **Financeiro** (6).
- `public/js/components/admin/adminScreensOps.js` — Telas de **Comunicação e Suporte** (3) e **Sistema** (4).
- `test/admin.central.v2.test.js` — Suíte automatizada cobrindo todos os 30 cenários obrigatórios da Fase 11.
- `docs/ADMIN-CENTRAL-V2.md` — Esta documentação técnica.

### 2.2 Arquivos Modificados

- `server/src/database/db.js` e `server/src/database/seed.js` — Execução automática e idempotente da migração V2 no boot e suporte às novas tabelas no seed de testes.
- `server/src/middlewares/auth.js` — Remoção do bypass `X-Demo-User-Id` e `usr_*`; suporte seguro a JWT no SSE `/sync/stream`.
- `server/src/server.js` — CORS configurável (`CORS_ALLOWED_ORIGINS`), headers de segurança, rate limit em autenticação, publicação de eventos de sincronização e `res.sendFile` com `{ root }`.
- `server/src/modules/admin/admin.routes.js` — Proteção global `authenticateToken` + `authorizeRoles('ADMIN')`, correção de JOIN 1:N em `/network-stats` e implementação dos novos endpoints da Fase 8.
- `server/src/services/abacatePay.service.js` e `server/src/modules/billing/billing.routes.js` — Integração com política comercial ativa, projeção (`PROJECTED`) ao gerar PIX, confirmação atômica/idempotente, validação estrita de webhook secret e `sync_events`.
- `server/src/modules/workshops/workshops.routes.js` — Integração de `register-activation` com `CommissionFinance` + `sync_events` e correção de `res.sendFile` no PDF diário.
- `server/src/modules/auth/auth.routes.js` e `server/src/modules/representatives/representatives.routes.js` — Publicação de `sync_events` nas mutações comerciais e bloqueio estrito de `REPRESENTATIVE` em rotas administrativas.
- `public/js/api.js`, `cliente.app/js/api.js`, `oficina.app/js/api.js` — Remoção do default inseguro `usr_admin` e adição de todos os métodos REST da Central Admin V2.
- `public/js/components/adminView.js` — Orquestrador completo com 6 grupos, 26 telas de menu, 2 telas de detalhe, breadcrumb, busca global, filtro global de período, status API e banner explícito de desconexão.
- `public/index.html`, `public/js/app.js`, `public/js/components/loginView.js` — Carregamento modular do Admin V2, remoção de dados hardcoded, remoção da senha admin pré-preenchida e validação de formato JWT para sessão ADMIN.
- `render.yaml` e `package.json` — Remoção de segredo em texto plano, documentação de persistência e novos scripts de teste.
- `test/api.test.js` — Envio explícito de `Authorization: Bearer` nas chamadas administrativas já existentes.

---

## 3. Migrações de Banco de Dados (Idempotentes)

Executadas automaticamente em `server/src/database/migrations/adminCentralV2.migration.js` com controle em `schema_migrations`:

| Tabela / Estrutura | Finalidade |
| :--- | :--- |
| `schema_migrations` | Registro das versões de migração aplicadas sem perda de dados. |
| `commercial_policies` | Políticas comerciais versionadas. Seed inicial: `pol_v1_4990` (R$ 49,90 → R$ 24,95 / R$ 24,95 / Rep R$ 5,90 — **ativa** para compatibilidade com histórico e testes vigentes) e `pol_v2_5990` (R$ 59,90 → R$ 29,95 / R$ 29,95 / Rep R$ 5,90 — **pronta para ativação** pelo Admin). |
| `commission_payout_cycles` | Fechamentos mensais por competência (`UNIQUE(competence_month)` impede fechamento duplicado). |
| `commission_payout_batches` | Lotes individuais de pagamento por representante em cada ciclo (`SCHEDULED` → `PAID`). |
| `commission_payout_items` | Relação 1:1 entre lote e comissão (`UNIQUE(commission_id)` impede pagamento em duplicidade). |
| `financial_adjustments` | Ajustes financeiros e estornos pós-pagamento (`CLAWBACK`) compensados no próximo ciclo. |
| `sync_events` | Log persistente de eventos de sincronização entre Cliente, Oficina, Representante, Webhook e Admin. |
| `admin_system_settings` | Configurações de ciclo (`payout_cycle_offset_months`, `payout_day_of_month`) e metas globais. |

Colunas adicionadas de forma idempotente em tabelas existentes:
- `representative_commissions`: `policy_id`, `competence_month`, `payout_month`, `payout_batch_id`, `payout_item_id`, `dispute_status`, `blocked_reason`, `updated_at`.
- `client_activations`: `billing_status`.
- `commissions`: `paid_at`, `payout_reference`, `paid_by`.
- `workshops`: `whatsapp_official`, `whatsapp_status`.

Mais **15 índices** cobrindo consultas por representante, oficina, competência, status, pagamento e eventos de sincronização.

---

## 4. Novos Endpoints REST (`/api/v1/admin/*`)

**Todos os endpoints exigem JWT válido + perfil `ADMIN`** (`authenticateToken`, `authorizeRoles('ADMIN')`):

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard/overview` | 16 KPIs executivos + indicadores suplementares calculados no backend |
| `GET` | `/api/v1/admin/dashboard/timeseries` | Séries históricas e distribuições dos 8 gráficos do Dashboard |
| `GET` | `/api/v1/admin/global-search` | Busca global (representantes, oficinas, veículos/DNA, clientes, chamados) |
| `GET` | `/api/v1/admin/operations/overview` | Fila de aprovações, OS recentes, ativações e agendamentos |
| `GET` | `/api/v1/admin/goals` | Metas globais e acompanhamento individual por representante |
| `GET` | `/api/v1/admin/representatives/summary` | Listagem comercial completa (busca, filtros, ordenação, paginação) |
| `GET` | `/api/v1/admin/representatives/:id/overview` | Página individual do representante (7 blocos + mascaramento LGPD) |
| `GET` | `/api/v1/admin/representatives/:id/workshops` | Carteira comercial de oficinas do representante |
| `GET` | `/api/v1/admin/representatives/:id/clients` | Clientes únicos e ativações captadas pela carteira |
| `GET` | `/api/v1/admin/representatives/:id/commissions` | Extrato paginado de comissões do representante |
| `GET` | `/api/v1/admin/representatives/:id/payouts` | Histórico de lotes e ajustes do representante |
| `POST` | `/api/v1/admin/representatives/:id/{approve,reject,suspend,reactivate}` | Ações de governança com auditoria obrigatória |
| `PATCH` | `/api/v1/admin/representatives/:id/goals` | Atualização de limite de oficinas e metas mensais |
| `GET` | `/api/v1/admin/commercial/acquisition` | Funil de convites e captação por oficina |
| `GET` | `/api/v1/admin/commercial/ranking` | Ranking consolidado de representantes |
| `GET` | `/api/v1/admin/workshops/summary` | Carteira de oficinas com cadeia comercial e clientes únicos |
| `GET` | `/api/v1/admin/workshops/:id/performance` | Detalhe individual da oficina (desduplicação clientes × múltiplos veículos) |
| `POST` | `/api/v1/admin/workshops/:id/reassign-representative` | Reatribuição administrativa auditada (sem retroatividade nas comissões) |
| `GET` | `/api/v1/admin/clients/unique` | Diretório global de clientes únicos desduplicados |
| `GET` | `/api/v1/admin/service-orders` | Listagem paginada de Ordens de Serviço |
| `GET` | `/api/v1/admin/maintenance-history` | Previsões preditivas + histórico de manutenções |
| `GET` | `/api/v1/admin/finance/overview` | Visão financeira consolidada + 8 indicadores de comissões |
| `GET` | `/api/v1/admin/finance/commissions` | Extrato global paginado de comissões com filtros |
| `POST` | `/api/v1/admin/finance/commissions/:id/dispute` | Contestar/bloquear ou liberar comissão específica |
| `GET` | `/api/v1/admin/finance/payouts/next` | Apuração da competência e demonstrativo em árvore do próximo ciclo |
| `GET` | `/api/v1/admin/finance/payouts/history` | Histórico de ciclos fechados e lotes pagos |
| `POST` | `/api/v1/admin/finance/payouts/close` | Fechamento financeiro atômico da competência (409 se duplicado) |
| `POST` | `/api/v1/admin/finance/payouts/:id/mark-paid` | Registro manual auditado de pagamento (409 se duplicado) |
| `GET` | `/api/v1/admin/finance/workshop-payouts` | Repasses pendentes/pagos às oficinas |
| `POST` | `/api/v1/admin/finance/workshop-payouts/:workshopId/mark-paid` | Registro manual auditado de repasse à oficina |
| `GET` | `/api/v1/admin/finance/attendance-fees` | Taxas por atendimento de retorno (R$ 6,90) |
| `GET` | `/api/v1/admin/finance/reconciliation` | Conciliação PIX × DNA × Comissão com detecção de divergências |
| `GET/POST` | `/api/v1/admin/commercial-policies` | Listagem e criação de políticas comerciais versionadas |
| `POST` | `/api/v1/admin/commercial-policies/:id/activate` | Ativação de política para operações futuras (preserva histórico) |
| `GET` | `/api/v1/admin/whatsapp/overview` | Central WhatsApp (sessões, mensagens, campanhas bot) |
| `GET` | `/api/v1/admin/sync/status` | Status em tempo real de banco, apps, SSE e eventos |
| `GET` | `/api/v1/admin/sync/stream` | Stream SSE autenticado (JWT) com heartbeat e broadcast de mutações |
| `GET` | `/api/v1/admin/audit/financial` | Auditoria comercial, fechamentos e movimentações financeiras |
| `GET/PUT` | `/api/v1/admin/settings` | Configurações de ciclo e metas globais |
| `GET/PATCH` | `/api/v1/admin/users` / `/:id/status` | Gestão de usuários e perfis RBAC (sem hashes/segredos) |

---

## 5. Motor Financeiro de Comissões

- **Precisão**: 100% dos cálculos executados em **centavos inteiros** (`workshop_split_cents = Math.floor((total * pct) / 100)`, `platform_split_cents = total - workshop_split_cents`), garantindo conservação exata sem drift de ponto flutuante.
- **Políticas Versionadas**:
  - Ativar `pol_v2_5990` (R$ 59,90 → R$ 29,95 oficina / R$ 29,95 plataforma / R$ 5,90 representante) ou criar novas políticas afeta **exclusivamente novas cobranças**, jamais recalculando transações históricas.
- **Elegibilidade (6 Regras Obrigatórias)**:
  1. Pagamento efetivamente confirmado pelo provedor (`PAID`).
  2. Oficina vinculada a representante `ACTIVE` com vínculo `ACTIVE`.
  3. Data do evento dentro do prazo contratual de **24 meses** (`linked_at <= evento <= valid_until`).
  4. Política comercial ativa aplicável na data do evento.
  5. Idempotência absoluta por `source_payment_id` (`UNIQUE`).
  6. Não estornada (`REFUNDED`) e não bloqueada por contestação (`DISPUTED`).
- **Previsão do Próximo Mês**:
  - Regra padrão configurável: competência `YYYY-MM` paga no mês seguinte (`offset = 1`), dia `10` (ex.: `2026-11` → `2026-12-10`).
  - Somente comissões `CONFIRMED` sem contestação compõem o valor líquido elegível; `PROJECTED`, `REFUNDED` e `DISPUTED` são exibidas separadamente.
- **Estorno Pós-Pagamento (Clawback)**:
  - Se uma cobrança cuja comissão já foi paga (`PAID`) sofrer estorno, o motor marca a comissão como `REFUNDED` e lança automaticamente um ajuste negativo `CLAWBACK` em `financial_adjustments` para compensação no ciclo aberto.
- **Sem PIX Automático**:
  - A transferência bancária/PIX é executada externamente pelo financeiro; no painel o administrador fecha a competência (`POST /payouts/close`) e registra manualmente a liquidação com data e referência/End-to-End do comprovante (`POST /payouts/:id/mark-paid`).

---

## 6. Segurança & Pendências Obrigatórias Antes de Produção

1. **Rotação Obrigatória de Credenciais Expostas no Histórico Git da branch `master`**:
   - `WDAPI_TOKEN` (constava em texto plano no `render.yaml` e como fallback em `server/src/services/apiPlacas.service.js`).
   - `ABACATEPAY_API_KEY` e `ABACATEPAY_WEBHOOK_SECRET` (possuíam fallback em `server/src/services/abacatePay.service.js`).
   - `JWT_SECRET` (gerar chave aleatória forte de 64+ bytes no Render).
   - **Ação obrigatória**: revogar/rotacionar todas essas chaves nos respectivos provedores e configurá-las apenas via painel de Environment Variables do Render.
2. **Senha do Administrador Inicial**:
   - Alterar a senha da conta `admin@dnaauto.com.br` imediatamente após o deploy em produção.
3. **CORS Restrito**:
   - Definir `CORS_ALLOWED_ORIGINS` com os domínios oficiais (ex.: `https://dna-auto-vua4.onrender.com,https://app.dnaauto.com.br`).

---

## 7. Configuração de Persistência no Render (Crítico)

Atualmente o `render.yaml` utiliza `plan: free`, que **não possui disco persistente** — todo deploy ou restart apaga o arquivo `dna_auto.db` local.

### Passo a passo recomendado para Produção Durável no Render:
1. Migrar o serviço Web no Render para plano **Starter** (ou superior).
2. Adicionar um **Persistent Disk**:
   - **Name**: `dna-auto-sqlite-data`
   - **Mount Path**: `/var/data`
   - **Size**: `5 GB` (expansível)
3. Configurar as variáveis de ambiente (Environment Variables no painel do Render — todas com `sync: false`):
   - `NODE_ENV=production`
   - `DB_PATH=/var/data/dna_auto.db`
   - `JWT_SECRET=<chave-aleatoria-64-bytes>`
   - `WDAPI_TOKEN=<novo-token-rotacionado>`
   - `ABACATEPAY_API_KEY=<nova-chave-producao>`
   - `ABACATEPAY_WEBHOOK_SECRET=<novo-secret-webhook>`
   - `CORS_ALLOWED_ORIGINS=https://dna-auto-vua4.onrender.com`
4. **Rotina de Backup**: agendar snapshot diário (via cron ou Render Cron Job) executando `sqlite3 /var/data/dna_auto.db ".backup '/var/data/backups/dna_auto_$(date +%F).db'"` com envio para object storage (S3/R2).
5. **Evolução Futura**: quando o volume ultrapassar escrita concorrente pesada, migrar as tabelas relacionais (já normalizadas com chaves estrangeiras e migrações versionadas) para PostgreSQL gerenciado ou Turso/LibSQL.

---

## 8. Procedimento de Publicação (Deploy Seguro)

1. Revisar e validar todos os testes na branch `feat/admin-central-v2`:
   ```bash
   npm test
   ```
2. Configurar as variáveis de ambiente rotacionadas e o Persistent Disk (`/var/data`) no Render.
3. Realizar backup prévio do banco `dna_auto.db` em produção antes do merge.
4. Abrir Pull Request `feat/admin-central-v2` → `master` e realizar code review.
5. Após merge e deploy automático no Render:
   - Verificar `GET /api/v1/health` (`200 OK`).
   - Autenticar em `/admin` com credenciais reais de `ADMIN`.
   - Conferir a tela **Sistema → Sincronização de Dados** para validar `schema_migrations`, `DB_PATH` e ausência do alerta de disco efêmero.
   - Somente quando a diretoria aprovar a virada comercial de R$ 49,90 para R$ 59,90, ativar `POLICY_2026_V2_5990` em **Sistema → Configurações → Políticas Comerciais**.

---

## 9. Plano de Rollback

As migrações V2 são **estritamente aditivas e não-destrutivas** (nenhuma tabela ou coluna legada foi removida ou alterada de forma incompatível):

1. **Rollback Rápido de Aplicação**:
   - No painel do Render, selecionar o deploy anterior da branch `master` e acionar **Rollback to this deploy** (ou `git revert <commit-merge>` em `master`).
   - Como todas as tabelas e colunas antigas foram preservadas intactas, a versão anterior continua operando normalmente sobre o mesmo banco sem perda de dados.
2. **Rollback de Banco de Dados (se necessário)**:
   - Restaurar o snapshot pré-deploy salvo em `/var/data/backups/dna_auto_YYYY-MM-DD.db` substituindo `/var/data/dna_auto.db` com o serviço pausado e reiniciar.
3. **Rollback de Política Comercial (R$ 59,90 → R$ 49,90)**:
   - Em **Sistema → Configurações**, reativar `POLICY_2026_V1_4990` em 1 clique — sem afetar nenhum lançamento histórico já fechado.
