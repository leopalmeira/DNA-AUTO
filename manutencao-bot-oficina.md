# Plano de Implementação — Bot de Manutenção Automática, PDF Diário, Suporte e Lançar Serviços

> **Status:** 🟢 IMPLEMENTADO E HOMOLOGADO (`v2.5.0` — 8/8 suítes de testes aprovadas)  
> **Project Type:** WEB + BACKEND (Full-Stack Node.js + SQLite + Frontend PWA `/oficina.app` & `/public`)

---

## 1. Overview

Implementação do fluxo completo de **Agendamento Automático de Manutenções via WhatsApp** com **envio diário de PDF às 17h para a oficina**, além da reestruturação dos cards **Avisos WhatsApp**, **Suporte** e **Lançar Serviços** no app da oficina (`/oficina/`).

### Fluxo Diário Definido pelo Usuário
1. **10:00 (`America/Sao_Paulo`) — Disparo Automático Preventivo:**
   - O monitor identifica veículos atendidos/cadastrados na oficina com manutenção preventiva crítica ou próxima (`VENCIDA`, `RECOMENDADA`, `APROXIMANDO` — ex.: Troca de Óleo, Correia Dentada).
   - O Bot envia mensagem via WhatsApp da oficina oferecendo **3 opções de data** (amanhã `D+1`, `D+2` e `D+3`, respeitando dias de funcionamento da oficina).
2. **Atendimento Bidirecional pelo Bot (24h em `messages.upsert`):**
   - Quando o cliente responde escolhendo uma das 3 datas (por número `1`/`2`/`3`, texto livre ou dia da semana) e horário preferido, o Bot interpreta (via **Gemini API** quando configurada + parser determinístico de fallback), confirma disponibilidade e grava automaticamente em `workshop_appointments` com status `CONFIRMED`.
   - O Bot envia mensagem de confirmação ao cliente com placa, serviço, data e horário.
   - O card **Avisos WhatsApp** no app da oficina passa a exibir os dados reais do banco: carros notificados, status da conversa e data confirmada.
3. **17:00 (`America/Sao_Paulo`) — Resumo Diário em PDF para a Oficina:**
   - O sistema gera automaticamente um **PDF consolidado** com todos os veículos confirmados/agendados para o **dia seguinte (`D+1`)** (placa, modelo, cliente, telefone, serviço/manutenção, horário) e envia o arquivo PDF diretamente no **WhatsApp oficial da oficina**.
4. **Card Suporte (Exclusivo para Tickets/Chamados à Plataforma):**
   - Remoção do link `/admin`, `wa.me` genérico e formulário de equipamentos duplicado em `workshopMobileView.js`.
   - Substituição por abertura e acompanhamento de **Tickets de Chamado** (`support_tickets`) com protocolo único, categoria, descrição e histórico de status.
5. **Card Lançar Serviços (Sem carro pré-selecionado):**
   - Ao abrir `lancar-servicos`, limpar `selectedMobileVehicle`, `mobileActivePlate` e `_isLaunchVehicleConfirmed` para que **nenhum veículo apareça na tela** antes que a placa seja digitada.

---

## 2. Success Criteria (Critérios Mensuráveis)

- [x] **Monitor 10h:** Job diário em horário de Brasília (`America/Sao_Paulo`) dispara avisos apenas 1x por ciclo/cooldown por veículo+item e registra log em `maintenance_bot_campaigns`.
- [x] **Bot 3 Datas:** Oferta automática de 3 datas (`D+1`, `D+2`, `D+3`) e criação/confirmação automática em `workshop_appointments` quando o cliente responde via WhatsApp (`BaileysWorkshopService`).
- [x] **PDF 17h:** Geração de PDF válido (`application/pdf`) com a pauta de agendados para `D+1` e envio automático ao WhatsApp oficial da oficina às 17:00 (com idempotência para não enviar duplicado no mesmo dia).
- [x] **Card Avisos WhatsApp:** Exibe em `/oficina/` os clientes reais notificados, o serviço preventivo (Óleo, Correia etc.) e a data confirmada.
- [x] **Card Suporte:** Permite exclusivamente abrir e listar Tickets de Chamado com a plataforma DNA AUTO.
- [x] **Card Lançar Serviços:** Abre sempre com o campo de placa vazio e **sem nenhum veículo exibido** até a busca da placa.
- [x] **Qualidade & Regressão:** 100% da suíte de testes (`npm test`) passando + atualização de `README.md` e `DIARIO_DE_BORDO.md` antes do commit/push.

---

## 3. Tech Stack & Rationale

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Runtime / API** | Node.js + Express 5 (`server/src/`) | Mantém compatibilidade total com `render.yaml` (`runtime: node`) sem exigir container Docker separado para Go/PicoClaw. |
| **Banco de Dados** | SQLite (`better-sqlite3`) | Acesso transacional direto sem conflitos `SQLITE_BUSY` entre processos externos. |
| **WhatsApp** | `@whiskeysockets/baileys` (multi-tenant já existente) | Preserva pareamento QR/Code por oficina já funcional em `baileys.service.js`, adicionando suporte a `mediaType: 'DOCUMENT'` para PDF. |
| **Inteligência do Bot** | Parser estruturado + Gemini API (opcional via `GEMINI_API_KEY`) | Garante resposta imediata mesmo sem chave externa (interpretação de `1`, `2`, `3`, datas e horários) e linguagem natural fluida quando `GEMINI_API_KEY` estiver configurada. |
| **Geração de PDF** | `pdfkit` (pure JS, leve) | Gera PDF em buffer/arquivo em milissegundos sem precisar de Chromium/Puppeteer no plano Free do Render. |
| **Scheduler** | Timer nativo em Node.js com timezone `America/Sao_Paulo` | Segue o padrão já usado em `keepAlive.service.js`, com trava de idempotência diária gravada no banco. |

---

## 4. File Structure (Arquivos Planejados)

```text
server/src/
├── database/
│   └── schema.sql                                   [MODIFY] Novas tabelas: maintenance_bot_campaigns, bot_conversation_states, daily_agenda_dispatches, support_tickets
├── services/
│   ├── maintenanceMonitor.service.js                [NEW] Job das 10h (seleção preventiva + disparo 3 datas) e Job das 17h (PDF D+1)
│   ├── whatsappBotAgent.service.js                  [NEW] Agente conversacional (Gemini + parser determinístico) para interpretar respostas e agendar
│   └── agendaPdf.service.js                         [NEW] Gerador de PDF da agenda do dia seguinte (pdfkit)
├── modules/workshops/
│   ├── baileys.service.js                           [MODIFY] Suporte a DOCUMENT (PDF) na fila + hook no messages.upsert chamando whatsappBotAgent
│   └── workshops.routes.js                          [MODIFY] Endpoints de campanhas/bot, disparo manual de teste, horários da oficina e suporte tickets
└── server.js                                        [MODIFY] Inicializar scheduler do maintenanceMonitor na subida do servidor

oficina.app/js/components/
└── workshopMobileView.js                            [MODIFY] Cards reais em Avisos WhatsApp, Suporte apenas Ticket, Lançar Serviços sem carro pré-carregado

test/
└── maintenance_bot_and_cards.test.js                [NEW] Testes automatizados do fluxo 10h, resposta bot, PDF 17h, Suporte Ticket e Lançar Serviços
```

---

## 5. Task Breakdown (Agentes + Skills + INPUT → OUTPUT → VERIFY)

### T1 — Modelagem de Dados & Regras de Idempotência
* **Agente:** `@database-architect` | **Skill:** `database-design`
* **Dependências:** Nenhuma
* **INPUT:** `server/src/database/schema.sql` e `server/src/database/db.js`
* **OUTPUT:** Criação das tabelas:
  1. `maintenance_bot_campaigns` (`workshop_id`, `vehicle_id`, `owner_phone`, `item_code`, `item_name`, `offered_dates_json`, `chosen_date`, `chosen_time`, `appointment_id`, `status`: `SENT` | `CONFIRMED` | `DECLINED` | `EXPIRED`, `sent_at`, `confirmed_at`).
  2. `daily_agenda_dispatches` (`workshop_id`, `target_date`, `appointments_count`, `pdf_path`, `status`, `sent_at`, `UNIQUE(workshop_id, target_date)`).
  3. `support_tickets` (`id`, `protocol`, `workshop_id`, `user_id`, `category`, `subject`, `description`, `priority`, `status`: `OPEN` | `IN_PROGRESS` | `RESOLVED`, `admin_reply`, `created_at`, `updated_at`).
  4. Colunas de horário de funcionamento / telefone gestor na tabela `workshops` (se ausentes).
* **VERIFY:** Subida limpa do servidor sem erros SQL e validação das tabelas via query `sqlite_master`.

### T2 — Gerador de PDF da Agenda (`D+1`) + Suporte a `DOCUMENT` no Baileys
* **Agente:** `@backend-specialist` | **Skill:** `nodejs-best-practices`
* **Dependências:** T1
* **INPUT:** Lista de agendamentos confirmados de uma oficina para `target_date` (`D+1`).
* **OUTPUT:**
  - `server/src/services/agendaPdf.service.js` usando `pdfkit` gerando PDF formatado (cabeçalho da oficina, data de amanhã, tabela com Horário, Placa, Modelo, Cliente, WhatsApp, Serviço).
  - Atualização de `BaileysWorkshopService.processQueue()` em `server/src/modules/workshops/baileys.service.js` para aceitar `mediaType: 'DOCUMENT'` e enviar `{ document, mimetype: 'application/pdf', fileName, caption }`.
* **VERIFY:** Teste unitário gerando PDF para 2 carros agendados e validando magic bytes `%PDF-` e tamanho > 0.

### T3 — Agente Conversacional WhatsApp (`messages.upsert` → `workshop_appointments`)
* **Agente:** `@backend-specialist` + `@security-auditor` | **Skills:** `api-patterns`, `clean-code`, `vulnerability-scanner`
* **Dependências:** T1
* **INPUT:** Mensagem recebida (`INCOMING`) de cliente no `BaileysWorkshopService.sock.ev.on('messages.upsert')`.
* **OUTPUT:** `server/src/services/whatsappBotAgent.service.js`:
  - Verifica se há campanha ativa (`SENT` / `IN_CONVERSATION`) para `workshop_id + phone_number`.
  - Respeita opt-out (`PARAR` / `CANCELAR` / `NÃO QUERO`) gravando `DECLINED`.
  - Interpreta escolha entre as 3 datas oferecidas (`1`, `2`, `3`, data `DD/MM`, `"amanhã"`, `"quinta"`, ou interpretação via Gemini API quando `GEMINI_API_KEY` estiver configurada).
  - Verifica disponibilidade em `workshop_appointments`, cria registro com `status = 'CONFIRMED'`, vincula `appointment_id` na campanha e envia confirmação no WhatsApp.
* **VERIFY:** Simulação de envio de aviso com 3 datas seguida de resposta `"1 às 14h"` validando criação automática do registro `CONFIRMED` em `workshop_appointments`.

### T4 — Agendador Automático (10:00 Disparo Preventivo & 17:00 PDF para Oficina)
* **Agente:** `@backend-specialist` | **Skill:** `nodejs-best-practices`
* **Dependências:** T1, T2, T3
* **INPUT:** Previsões preventivas (`vehicle_maintenance_predictions` / `maintenance-alerts`) + agenda `workshop_appointments`.
* **OUTPUT:** `server/src/services/maintenanceMonitor.service.js`:
  - Scheduler verificando horário de Brasília (`America/Sao_Paulo`).
  - **Janela 10:00:** Busca veículos elegíveis (`VENCIDA`/`RECOMENDADA`/`APROXIMANDO`), respeita cooldown (ex.: 15 dias sem reenviar para o mesmo item), calcula 3 datas úteis (`D+1`, `D+2`, `D+3`) e enfileira mensagem no WhatsApp do cliente.
  - **Janela 17:00:** Consolida todos os agendamentos confirmados para `D+1`, gera PDF via `agendaPdf.service.js` e envia no WhatsApp oficial da oficina (registrando em `daily_agenda_dispatches` para não duplicar).
  - Rotas administrativas/oficina em `workshops.routes.js` para visualizar campanhas enviadas e acionar teste controlado.
* **VERIFY:** Execução direta das rotinas `runMorningOutreach(workshopId)` e `runEveningAgendaPdf(workshopId)` em teste automatizado validando idempotência.

### T5 — Card **Avisos WhatsApp** Real + Card **Suporte** (Só Ticket) + Fix **Lançar Serviços**
* **Agente:** `@frontend-specialist` | **Skills:** `frontend-design`, `clean-code`
* **Dependências:** T1, T4
* **INPUT:** `oficina.app/js/components/workshopMobileView.js` e `workshops.routes.js`
* **OUTPUT:**
  1. **Avisos WhatsApp:** Substituir os arrays hardcoded por carregamento real da API (`GET /api/v1/workshops/:id/maintenance-bot/campaigns` + conversas reais), mostrando carros avisados, motivo (Óleo, Correia Dentada etc.), status do bot e **Data/Hora Confirmada**.
  2. **Suporte:** Remover a versão duplicada com `/admin`, `wa.me` e equipamentos; exibir **exclusivamente** o formulário de abertura de Ticket de Chamado à Plataforma + lista de chamados abertos pela oficina com protocolo e status.
  3. **Lançar Serviços:** Ao entrar em `lancar-servicos`, limpar `selectedMobileVehicle`, `mobileActivePlate` e `_isLaunchVehicleConfirmed` (e remover fallback automático para `list[0]` que vaza na tela de lançamento) para garantir que **nenhum carro apareça antes da digitação da placa**.
* **VERIFY:** Inspeção DOM/renderização e testes automatizados de componentes/integração do app da oficina.

### T6 — Segurança, Testes Automatizados & Documentação
* **Agente:** `@test-engineer` + `@security-auditor` + `@documentation-writer` | **Skills:** `testing-patterns`, `verify-changes`, `vulnerability-scanner`
* **Dependências:** T1–T5
* **INPUT:** Toda a suíte `test/*.test.js`, `README.md`, `DIARIO_DE_BORDO.md`
* **OUTPUT:**
  - Novo arquivo `test/maintenance_bot_and_cards.test.js` cobrindo 100% dos novos fluxos.
  - Execução completa de `npm test` garantindo 100% de aprovação.
  - Atualização de `README.md` e `DIARIO_DE_BORDO.md`.
* **VERIFY:** `npm test` com exit code 0 e todos os checks aprovados.

---

## 6. Phase X — Verification Checklist (Pendente de Execução após Fase 4)

- [ ] `npm test` (100% dos testes passando sem falhas ou skips)
- [ ] `python .agents/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] `python .agents/skills/lint-and-validate/scripts/lint_runner.py` (se aplicável ao projeto)
- [ ] Verificação de isolamento multi-tenant (`workshop_id`) nas rotas de bot, PDF e tickets
- [ ] Atualização de `README.md` e `DIARIO_DE_BORDO.md`
- [ ] Commit e Push para o Git (conforme convenção do projeto)

