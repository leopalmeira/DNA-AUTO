# DNA AUTO — Arquitetura da Gestão Financeira da Oficina & Ranking Nacional de Premiação Mensal

**Data:** 05/11/2026  
**Status:** HOMOLOGADO (20/20 Cenários Aprovados via Headless Node.js)  
**Orquestração:** Sistema Multiagente Gemini (Agente 01 Arquiteto/Orquestrador, Agente 02 Backend Specialist, Agente 03 Frontend Specialist, Agente 04 QA/Segurança)

---

## 1. Visão Geral da Missão

Reestruturação completa da tela **Gestão Financeira** do aplicativo mobile da oficina (`oficina.app` e `public/`), estabelecendo transparência contábil estrita, alta legibilidade, proteção por PIN de segurança, isolamento multi-tenant e gamificação nacional através do **Desafio DNA AUTO — Premiação Mensal**.

Adicionalmente, foi realizada a limpeza estética da **Splash Screen Inicial da Oficina**, removendo a tagline e os 3 cards de benefícios intermediários para preservar a visualização limpa da marca, carro hero e slogan de fundo.

---

## 2. Regras Contábeis e Financeiras Oficiais

1. **Passaporte Digital DNA AUTO (R$ 59,90):**
   - Preço ao proprietário do veículo: **R$ 59,90** (`5990` centavos).
   - **Split Exato (50% / 50%):**
     - Participação da Oficina: **R$ 29,95** (`2995` centavos) por passaporte pago e ativado.
     - Participação da DNA AUTO: **R$ 29,95** (`2995` centavos) retidos automaticamente no fluxo de pagamento.
   - **Regra de Ouro:** A participação de R$ 29,95 da DNA AUTO é retida na origem e **NÃO constitui dívida** da oficina. O valor de R$ 29,95 da oficina representa sua participação bruta antes de tributos e custos operacionais.

2. **Taxa de Atendimento Concluído (R$ 6,90):**
   - Valor oficial: **R$ 6,90** (`690` centavos) por atendimento agendado pela plataforma e efetivamente concluído.
   - Cobrança idempotente (blindada contra duplicidade no mesmo agendamento).
   - Atendimentos cancelados não geram cobrança.

3. **Separação de Receitas Mecânicas:**
   - O faturamento operacional da oficina com mão de obra e peças (`service_records`) é apresentado em bloco separado (Bloco 3), sem misturar com as comissões de ativação de passaportes (Bloco 2).

4. **Segurança de Pagamento PIX:**
   - Nunca é exibido código PIX estático, fictício ou de outra oficina.
   - O botão "Copiar PIX" e o código Copia e Cola só são renderizados quando existe uma cobrança pendente legítima (`workshop_pix_charges` com `status = 'PENDING'`) vinculada especificamente à oficina autenticada.

---

## 3. Desafio DNA AUTO — Premiação Mensal (Ranking Nacional)

1. **Meta Mínima de Elegibilidade:**
   - **100 ativações válidas e pagas** (`payment_status = 'COMPLETED'`) dentro do mês civil corrente (`YYYY-MM`).
   - Oficinas com menos de 100 ativações (ex.: 0, 42 ou 99) recebem o selo `NÃO ELEGÍVEL (<100)` e não participam da distribuição de prêmios daquele mês.
   - Ao atingir exatamente **100 ativações**, a oficina recebe o selo `QUALIFICADA P/ O PÓDIO` e passa a disputar os prêmios.

2. **Premiação Mensal Oficial (Total: R$ 18.000,00 / mês):**
   - 🥇 **1º Lugar Nacional:** R$ 10.000,00
   - 🥈 **2º Lugar Nacional:** R$ 5.000,00
   - 🥉 **3º Lugar Nacional:** R$ 3.000,00

3. **Critérios de Desempate:**
   - Menor timestamp da última ativação válida (`last_activation_at ASC` — quem atingiu o volume primeiro no mês).
   - Maior número de serviços comprovados Nível 4 (`proven_services_count DESC`).

4. **Caráter Provisório e Fechamento:**
   - Durante o mês em curso, o ranking exibe a flag `PROVISÓRIO`, pois novas ativações e eventuais estornos/cancelamentos são auditados até o último dia do mês.

5. **Regra da Continuidade Garantida:**
   - Oficinas que não atingirem 100 ativações em um mês **não sofrem qualquer bloqueio, penalidade ou perda de credenciamento**.
   - No dia 1º do mês seguinte, a contagem mensal reinicia do zero para todas as oficinas ativas, garantindo nova oportunidade de disputa.

---

## 4. Arquitetura dos 6 Blocos da Tela Financeira

A função unificada `WorkshopView.renderMobileFinancialView()` (protegida por PIN inicial `123456` via `this.financialAuthenticated`) organiza a tela em 6 blocos verticais responsivos:

- **Bloco 1 — Identificação e Visão Geral:** Nome fantasia, CNPJ, mês de referência, badge "OFICINA ATIVA" e 3 KPIs rápidos (Ganhos Ativações, Serviços Mecânicos, Taxas Pendentes).
- **Bloco 2 — Participação em Ativações:** Detalhamento contábil do Passaporte Digital (veículos ativados, preço R$ 59,90, comissão R$ 29,95, retenção DNA AUTO R$ 29,95 e nota explicativa).
- **Bloco 3 — Ganhos com Serviços Mecânicos:** Faturamento operacional de mão de obra e peças oriundo das Ordens de Serviço registradas.
- **Bloco 4 — Obrigações e Repasses:** Taxas de R$ 6,90 por atendimento concluído, valores já quitados, saldo pendente e área PIX Copia e Cola dinâmica (exibida apenas quando há cobrança pendente legítima).
- **Bloco 5 — Desafio DNA AUTO (Premiação Mensal):** Cards do pódio (R$ 10k / R$ 5k / R$ 3k), barra de progresso da meta de 100 ativações, contador de dias restantes, tabela Top 5 do ranking provisório e acordeão retrátil com as 6 regras oficiais.
- **Bloco 6 — Histórico Recente e Extrato Consolidado:** Lista das últimas movimentações confirmadas e painel retrátil com o consolidado de créditos e repasses do exercício.

---

## 5. Contratos de API (Backend)

| Método e Endpoint | Autenticação | Descrição |
|---|---|---|
| `GET /api/v1/workshops/:id/financial-summary` | JWT (`authenticateToken` + `checkWorkshopAccess`) | Retorna o resumo contábil dos 6 blocos, separando passaportes, serviços mecânicos, taxas de R$ 6,90 e PIX legítimo. Bloqueia acesso cruzado entre oficinas com `HTTP 403`. |
| `GET /api/v1/workshops/:id/challenge-status` | JWT (`authenticateToken`) | Retorna o progresso individual da oficina rumo às 100 ativações, percentual, ativações restantes, rank atual e mensagem de continuidade. |
| `GET /api/v1/workshops/ranking/monthly` | JWT (`authenticateToken`) | Retorna a classificação nacional do mês civil (`?month=YYYY-MM`), pódio Top 3, elegibilidade (`>= 100`) e regras oficiais. |

---

## 6. Bateria de Testes Automatizados (`test/oficina.finance.test.js`)

Todos os 20 cenários exigidos foram implementados e validados sem navegador (Headless Node.js):

1. **Cenário 01:** Oficina com 0 ativações (0%, faltam 100, R$ 0,00, não elegível).
2. **Cenário 02:** Oficina com 42 ativações (42%, faltam 58, R$ 1.257,90 bruto, não elegível).
3. **Cenário 03:** Oficina com 99 ativações (99%, falta 1, não elegível).
4. **Cenário 04:** Oficina com 100 ativações exatas (100%, faltam 0, R$ 2.995,00 bruto, QUALIFICADA).
5. **Cenário 05:** Oficina com 150 ativações liderando o 1º lugar (prêmio potencial R$ 10.000,00).
6. **Cenário 06:** Virada de mês e garantia de continuidade (oficina não qualificada no mês anterior permanece `APPROVED` e apta no novo mês).
7. **Cenário 07:** Respeito estrito ao filtro de mês civil (`?month=2026-10`).
8. **Cenário 08:** Desempate automático por timestamp de atingimento (`last_activation_at ASC`).
9. **Cenário 09:** Exclusão de ativações canceladas (`CANCELLED`).
10. **Cenário 10:** Exclusão de ativações estornadas (`REFUNDED`).
11. **Cenário 11:** Exclusão de ativações pendentes (`PENDING`).
12. **Cenário 12:** Registro de comissões parcialmente repassadas.
13. **Cenário 13:** Consolidação de repasses quitados no extrato.
14. **Cenário 14:** Cálculo de taxa de R$ 6,90 por atendimento concluído e vínculo de PIX válido.
15. **Cenário 15:** Não cobrança de taxa em agendamentos cancelados.
16. **Cenário 16:** Bloqueio Multi-Tenant (`HTTP 403 Forbidden` quando Oficina A tenta ler financeiro da Oficina B).
17. **Cenário 17:** Visão irrestrita do Administrador Geral (`HTTP 200 OK`).
18. **Cenário 18:** Exatidão matemática centesimal do split (R$ 59,90 = R$ 29,95 + R$ 29,95).
19. **Cenário 19:** Renderização completa dos 6 blocos estruturais no DOM simulado.
20. **Cenário 20:** Não-regressão das demais rotas da oficina e preservação integral do aplicativo do cliente (`cliente.app`).
