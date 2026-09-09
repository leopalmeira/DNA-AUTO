---
type: project
created: 2026-05-25
updated: 2026-09-09
---

# Project Conventions

## Git Workflow & Deploy Remoto Imediato
- Imediatamente após qualquer alteração ou ciclo de tarefa, realizar `git add`, `git commit` e OBRIGATORIAMENTE `git push origin master` para o GitHub remoto.
- Nenhuma alteração de código ou documentação deve permanecer pendente apenas no ambiente local.
- As mensagens de commit devem ser claras e em conformidade com Conventional Commits (ex: `feat:`, `fix:`, `docs:`, `refactor:`).

## Documentação Contínua Obrigatória
- **Diário de Bordo**: Registrar imediatamente todas as decisões arquiteturais, novos ciclos, módulos e correções nos arquivos `diario de bordo.md` e `DIARIO_DE_BORDO.md`.
- **README.md**: Manter a documentação principal atualizada a cada ciclo, incluindo badges de testes, novas rotas na tabela da API REST e descrição detalhada dos novos recursos (ex: Painel da Oficina ERP, API Placas, agendamentos).

## Testes Automatizados & Qualidade
- Bateria de testes de integração (`npm test` / `node test/api.test.js`) deve sempre passar com 100% de sucesso antes de qualquer commit e deploy.
- Validação de sintaxe JS (`node -c`) obrigatória para todos os arquivos modificados.
- Testes manuais e visuais no navegador são de responsabilidade exclusiva do usuário (nunca utilizar subagente de navegador).

## Supported AI platforms (AG Kit)
- AG Kit **only supports Gemini CLI and Google Antigravity**.
- Do not claim compatibility with Claude Code, Cursor, Copilot, Windsurf, or other assistants unless the user explicitly expands scope.
- Copy on the website, docs, FAQ, README, and marketing should describe AG Kit as a toolkit for Gemini CLI / Antigravity-style agent setups.
