# DNA AUTO — Fila de Tarefas dos 4 Agentes Autônomos (AI Task Queue)

> **Coordenador:** Agente 01 (Arquiteto e Orquestrador)  
> **Modelo:** Exclusivamente Gemini  
> **Classificação de Prioridades:**  
> - **P0:** Bloqueia funcionamento essencial  
> - **P1:** Necessário para lançamento do MVP  
> - **P2:** Melhoria importante  
> - **P3:** Recurso futuro pós-lançamento  

---

## Tabela de Distribuição de Tarefas

| ID | Descrição | Prioridade | Responsável | Dependências | Status | Critérios de Aceitação | Resultado dos Testes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **TSK-001** | Auditoria Completa do Repositório & Mapeamento de 44 Tabelas e 56 Testes | **P0** | Agente 01 (Orquestrador) | Nenhuma | `CONCLUÍDO` | Mapear todos os módulos, rotas, schemas e arquitetura sem quebrar paridade | Aprovado (Docs criados em `docs/`) |
| **TSK-002** | Validação da Bateria de 56 Testes Automatizados End-to-End | **P0** | Agente 04 (QA / Integração) | TSK-001 | `CONCLUÍDO` | 100% de sucesso (56/56) no `npm test` em ambiente limpo | 56/56 Testes Aprovados (100%) |
| **TSK-003** | Conexão do Botão "Agendar Serviço" no Modal da Oficina (`cliente.app`) | **P1** | Agente 03 (Frontend UX) | TSK-001 | `CONCLUÍDO` | Ao clicar em "Agendar Serviço" no modal da oficina credenciada, abrir fluxo de agendamento pré-selecionando a oficina | Aprovado em `cliente.app` e `public` |
| **TSK-004** | Rota de Criação de Agendamento pelo Cliente `/api/v1/workshops/:id/appointments` | **P1** | Agente 02 (Backend) | TSK-003 | `CONCLUÍDO` | Permitir que o cliente autenticado envie solicitação de agendamento persistida em banco | Aprovado via API REST |
| **TSK-005** | Integração do Atalho de Impressão/Exportação PDF do Dossiê para Venda | **P1** | Agente 03 (Frontend UX) | TSK-001 | `A FAZER` | Disponibilizar gatilho direto `window.print()` estilizado com `print.css` para download em PDF | A iniciar |
| **TSK-006** | Sincronização Dinâmica de Veículos Reais do Usuário Logado no `cliente.app` | **P1** | Agente 03 (Frontend UX) | TSK-004 | `A FAZER` | Exibir o veículo real cadastrado pelo cliente ou permitir alternar para visualização Demo do Corolla | A iniciar |
| **TSK-007** | Validação de Regressão Geral e Bateria de Testes Expandida (57 testes) | **P1** | Agente 04 (QA / Integração) | TSK-003, TSK-004 | `CONCLUÍDO` | Teste automatizado cobrindo o fluxo de agendamento direto cliente -> oficina | 57/57 Testes Aprovados (100%) |
| **TSK-008** | Implementação de Notificações Web Push (VAPID) | **P2** | Agente 02 + Agente 03 | TSK-007 | `BACKLOG P2` | Suporte a Service Worker Push Notifications no navegador | A iniciar pós-MVP |
| **TSK-009** | Blindagem P0 de Segurança em Autenticação (`auth.routes.js`) | **P0** | Agente 02 (Backend) | TSK-001 | `CONCLUÍDO` | Eliminar senhas mestras, implementar reset com token crypto SHA-256 de uso único e isolamento multi-tenant | Aprovado (Testes 13, 15, 58) |
| **TSK-010** | Padronização Financeira: Passaporte R$ 59,90 (Split 50/50) e Atendimento R$ 6,90 | **P1** | Agente 02 (Backend) | TSK-009 | `CONCLUÍDO` | Passaporte R$ 59,90 (R$ 29,95 DNA / R$ 29,95 Oficina) e taxa de atendimento de R$ 6,90 com chave de idempotência | Aprovado (Testes 56, 58) |
| **TSK-011** | Cards de Estado/Cidade RJ (Esquerda, 30d) e SP (Direita, Azul Ativo) na tela de Oficinas | **P1** | Agente 03 (Frontend UX) | TSK-001 | `CONCLUÍDO` | Dispor exatamente 2 cards por sigla: RJ cinza com timer regressivo de 30 dias e SP azul ativo exibindo oficinas parceiras | Aprovado em `cliente.app` e `public` |
| **TSK-012** | Homologação Integrada dos 16 Passos Oficiais DNA AUTO com Bloqueio Fatal | **P0** | Agente 04 (QA / Integração) | Todas | `CONCLUÍDO` | Validação ponta a ponta de todos os 16 passos com 100% de sucesso e assertions com saída fatal | 58/58 Testes Aprovados (100%) |
