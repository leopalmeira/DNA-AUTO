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
