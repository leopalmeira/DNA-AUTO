# 📓 DIÁRIO DE BORDO — PROJETO DNA AUTO
## Registro Oficial de Engenharia, Entregas, Decisões e Evolução Contínua

> **Plataforma:** DNA AUTO — Identidade e Histórico Digital Permanente de Veículos  
> **Versão:** 1.3.0 Enterprise  
> **Repositório GitHub:** [https://github.com/leopalmeira/DNA-AUTO](https://github.com/leopalmeira/DNA-AUTO)  
> **Deploy de Produção:** [https://dna-auto.onrender.com/](https://dna-auto.onrender.com/)  
> **Documento Mestre Detalhado:** Consulte também [DIARIO_DE_BORDO.md](file:///c:/Users/User/Desktop/DNA-AUTO/DIARIO_DE_BORDO.md).

---

## 📌 Resumo Executivo da Plataforma
O **DNA AUTO** resolve a assimetria de informações no mercado automotivo brasileiro ao criar um passaporte digital único (`DNA-BR-XXXX-XXXX-XXX`) para cada veículo, registrando trocas de peças, manutenções preventivas e corretivas com odômetro auditado, fotos reais das peças aplicadas e notas fiscais chanceladas por oficinas credenciadas.

---

## 📅 Registro Consolidado de Ciclos de Desenvolvimento

### 🏁 Ciclos 1 a 10: Fundação e Core do Sistema
- Modelagem de dados em SQLite 3 (`better-sqlite3`) com modo WAL e arquitetura monólita modular.
- Sistema de autenticação JWT com RBAC (`ADMIN`, `WORKSHOP`, `OWNER`).
- Dossiê 360° do veículo com Score de Saúde (0 a 100), linha do tempo com 4 níveis de comprovação e lupa investigativa.
- Emissão de Laudos de Venda com QR Code autenticado e gerador de cartaz para vidro com visualização comercial.
- Sistema de transferência de propriedade de DNA com termo de consentimento digital.
- Suporte a multi-inquilino (Multi-Tenant) com isolamento total entre oficinas credenciadas.

### 🛡️ Ciclos 11 a 13: Experiência B2B, Gestão Multi-Tenant e Keep-Alive
- Landing Page com segmentação para Dono do Carro vs. Dono de Oficina Mecânica.
- Painel Administrativo Matriz refinado com visão hierárquica discreta de oficinas e carros atendidos por cada parceiro.
- Central de alertas preventivos via links universais de WhatsApp.
- Serviço anti-suspensão (`keepAlive.service.js`) impedindo hibernação em instâncias na nuvem.

### 🚗 Ciclo 14: Integração Oficial da API Placas Paga (WDAPI2)
- Conector unificado em `server/src/services/apiPlacas.service.js` com token oficial.
- Consulta instantânea de qualquer veículo emplacado no Brasil (Mercosul ou placa cinza de 7 caracteres).
- Seleção da Tabela FIPE por algoritmo de maior score e suporte a leitura de dados do bloco extra (cilindradas, combustível, chassi e município).
- Endpoint para monitoramento em tempo real do saldo de créditos restantes da API (`/api/v1/integrations/plate-balance`).
- Enriquecimento visual nos modais de busca com logo da montadora e especificações técnicas.
- Bateria de testes expandida para 20 testes de integração automatizados aprovados (100%).

### 🏭 Ciclo 15: Reformulação Profissional do Painel da Oficina / Auto Center em ERP Moderno
- **Padrão ERP Corporativo (Estilo TOTVS + Identidade DNA AUTO):**
  - Isolamento de escopo CSS através de `body.is-workshop-erp`, eliminando scrolls residuais e garantindo altura 100vh com **zero estouro horizontal**.
  - Sidebar fixa de 260px com módulos operacionais e gaveta responsiva móvel via botão `☰` com fechamento automático.
  - Barra de status de rede com indicador pulsante `🟢 REDE DNA AUTO ONLINE` e popover de notificações rápidas `🔔` consolidando pendências operacionais.
- **Módulo de Recepção e Balcão:**
  - Duplo fluxo operacional: busca instantânea de veículos cadastrados com abertura de *Ficha Digital do Veículo* e botão de cadastro de novos carros.
  - 6 Cards de KPIs dinâmicos e 6 Ações Rápidas de Balcão para agilidade dos recepcionistas.
- **Radar Preditivo OBD2 (Telemetria Integrada ao App do Cliente):**
  - Semáforos visuais em tempo real por quilometragem (🔴 Urgente, 🟡 Atenção, 🟢 Em dia).
  - Disparo de mensagens personalizadas no WhatsApp oficial do proprietário.
- **Central de Agendamentos Inteligente com Prevenção de Conflitos:**
  - Tabela `workshop_appointments` e rotas REST com validação de colisão de horários (`HTTP 409 Conflict`).

### 🚀 Ciclo 16: Persistência de Sessão no F5, Menu Corporativo por Seções, Auto-DNA, WhatsApp com OTP e Tour Guiado
- **Persistência de Sessão no F5:**
  - Correção no `init()` do `public/js/app.js` restaurando de forma resiliente a sessão da oficina sem forçar redirecionamento para a landing page.
  - Sincronização de URL via hash `#workshop` (`history.replaceState`) e armazenamento de `dna_current_view`.
- **Menu Corporativo em Seções Claras & Itens em Roadmap:**
  - Menu organizado em 5 seções bem delimitadas: `OPERAÇÃO & BALCÃO`, `OFICINA & SERVIÇOS`, `PREDITIVA OBD2`, `CLIENTES & CONTATO` e `GESTÃO & SISTEMA`.
  - Recursos em desenvolvimento com badge `[Em breve]`, texto tachado (`line-through`) e feedback amigável via modal informativo.
- **Auto-DNA Permanente em Todo Cadastro de Carro:**
  - Endpoints `/vehicles/register` e `/vehicles/register-from-api` ativam automaticamente o código `DNA-BR-XXXX-XXXX-XXX` e criam o registro de saúde inicial ativo, fazendo o carro constar na base DNA imediatamente sem necessidade de cadastro posterior no dossiê.
- **WhatsApp Oficial da Oficina com Validação OTP de 6 Dígitos e Disparo em Lote:**
  - Migração de colunas na tabela `workshops` e rotas `PUT /workshops/:id/settings`, `POST /workshops/:id/whatsapp/confirm` e `POST /workshops/:id/whatsapp/dispatch-batch`.
  - Tela de configurações com badge visual `🟢 Ativo & Verificado` ou `🟡 Confirmação Pendente`, inserção de código OTP (com código mestre `123456`) e disparo preventivo em lote para clientes com troca de óleo, correia ou pastilhas vencidas.
  - Documentação arquitetural recomendando integração com motores open-source **@whiskeysockets/baileys** (WebSocket) e **Evolution API** (REST/Webhooks).
- **Tour Guiado pelo Sistema para Lojistas e Gestores:**
  - Onboarding interativo com 6 passos explicando a saudação, indicadores diários, ações rápidas, pesquisa de veículos, telemetria OBD2 e navegação corporativa.
  - Botão "Pular Tour" sempre visível e persistência no `localStorage`.
- **Qualidade e Testes:**
  - 24/24 testes automatizados de integração passando com 100% de sucesso em `test/api.test.js`.

### 🚀 Ciclo 17: Limpeza Corporativa do Header, Sino na Sidebar, Agenda Interativa com Almoço Cinza e WhatsApp In-Platform
- **Limpeza do Header Superior e Dashboard:**
  - Removido status "REDE DNA AUTO ONLINE" do topo e do banner.
  - Removido nome/avatar do usuário (`Marcos Silveira (Dono)`) do topo, exibindo apenas o nome da oficina, botão do Tour e botão `[-> Sair]`.
  - Eliminadas todas as saudações ("BOM DIA", "BOA TARDE") e a palavra "Dono". Banner agora ostenta o título executivo `PAINEL OPERACIONAL DA OFICINA`.
  - Role atualizada no banco de dados para "Gestor da Oficina".
- **Sino de Notificações Operacionais na Sidebar:**
  - Sino `🔔` reposicionado no menu lateral com badge contador de pendências ativas.
  - Dropdown clicável permitindo navegar diretamente para as 4 situações: manutenções atrasadas (🔴), manutenções próximas (🟡), agendamentos de hoje (📅) e WhatsApp pendentes (💬).
- **WhatsApp 100% In-Platform (Sem sair da tela do sistema):**
  - O WhatsApp cadastrado na oficina é o remetente oficial permanente.
  - Disparo de mensagens dentro da plataforma sem abrir `wa.me` ou novas abas.
  - Endpoint `POST /api/v1/workshops/:id/whatsapp/send-message` gravando o disparo e retornando protocolo de transmissão (`DNA-WPP-XXXXXX`).
  - Exibição de comprovante em tempo real na tela com remetente oficial, destinatário, protocolo e status `🟢 ENTREGUE / IN-PLATFORM`.
- **Agenda da Oficina com Grade Semanal Interativa e Almoço Bloqueado (12h às 13h):**
  - Configuração de dias de atendimento (Segunda a Sexta padrão, configurável) e horários de 08:00 às 18:00.
  - Grade semanal (`renderWeeklyInteractiveGrid`) com dias da semana e horários de 08h às 18h.
  - **MANDATÓRIO**: Horário de almoço das 12:00 às 13:00 permanentemente apagado em cinza, bloqueado contra cliques e assinalado como intervalo operacional.
  - Células livres com botão `+ Disponível` que abre o modal de agendamento já pré-selecionado para aquele dia e hora.
  - Modal de 3 datas atualizado para horários de 08:00 às 18:00 com pill de almoço bloqueado e apagado em cinza.
- **Qualidade e Testes:**
  - 25/25 testes automatizados de integração passando com 100% de sucesso em `test/api.test.js`.

### 🚀 Ciclo 18: Cadastro Completo de Veículo Vinculado a Proprietário, Hodômetro de Entrada, Foto, DNA Automático e Auto-Seleção em Serviços
- **Formulário Completo de Entrada do Carro:**
  - Inclusão dos campos de Nome Completo do Proprietário e Telefone / WhatsApp no modal de cadastro.
  - Inclusão do campo obrigatório de Hodômetro na Entrada (KM).
  - Suporte completo a foto do veículo via upload de imagem local (com conversão para Base64 DataURL via `FileReader`) e preview visual reativo na tela, além de link de URL externo.
  - Garantia de DNA Automático Permanente sem caixas de seleção opcionais.
- **Persistência Relacional no Backend:**
  - Rotas `POST /vehicles/register` e `POST /vehicles/register-from-api` atualizadas para salvar dados do proprietário na tabela `owners` e criar posse em `ownership_transfers` com status `COMPLETED`.
  - Hodômetro registrado na tabela `mileage_records` com origem `WORKSHOP_ENTRY` e verificação auditada.
  - Foto do veículo persistida em `vehicles.photo_url` e na galeria `vehicle_photos`.
  - Novo endpoint `GET /vehicles` para listagem dinâmica completa de veículos com dados agregados de odômetro, proprietário e DNA.
- **Auto-Seleção Imediata no Modal de Serviço Nível 4:**
  - O modal de serviço agora carrega dinamicamente a frota cadastrada na oficina no select `#srv-vehicle-id`.
  - Ao salvar o cadastro de entrada, o modal de serviço abre imediatamente com o veículo recém-cadastrado **já selecionado como padrão (`selected`)** e com o **odômetro de entrada pré-preenchido**, sem necessidade de escolha manual pelo usuário.
  - Atualização automática do odômetro ao alternar de carro no dropdown (`onServiceVehicleChange`).
- **Tabela Dinâmica de Veículos do Pátio:**
  - A seção de veículos cadastrados agora renderiza em tempo real a lista de veículos com miniatura de foto, dados técnicos, cliente com WhatsApp e botão direto `🔧 Novo Serviço`.
- **Qualidade e Testes:**
  ### 🚀 Ciclo 19: Simplificação Radical do Menu da Oficina e Módulo Oficial WhatsApp Baileys (@whiskeysockets/baileys)
- **Menu Lateral Enxuto e Focado em Produtividade:**
  - Redução de redundâncias na barra lateral, concentrando a operação em apenas 6 itens essenciais:
    1. `🏠 Dashboard`: Visão executiva de pátio com card de Busca Rápida de Veículos em destaque e atalhos de placas (`BRA2E19`, `ABC1D23`, `KXZ9012`, `PWL4I85`).
    2. `🚗 Cadastrar Carro`: Abertura instantânea do modal de cadastro com auto-DNA, dados do proprietário, hodômetro de entrada e foto do veículo.
    3. `📅 Agenda da Semana`: Grade semanal interativa com dias úteis e horários de 08:00 às 18:00 com horário de almoço das 12:00 às 13:00 apagado em cinza e bloqueado.
    4. `📱 WhatsApp`: Central de mensageria oficial baseada no motor Baileys com badge visual de status.
    5. `🔧 Serviços & Ordens`: Gestão de ordens de serviço, lançamento de peças, comprovantes e fotos reais.
    6. `⚙️ Configurações`: Dados cadastrais da oficina, expediente e preferências.
  - O sino de notificações operacionais `🔔` permanece acessível no menu lateral com contadores dinâmicos de atrasos, agendamentos e mensagens.
- **Módulo Oficial WhatsApp Baseado no Baileys (`@whiskeysockets/baileys`):**
  - **Experiência Amigável e Sem Jargões Técnicos para o Lojista:**
    - Zero termos técnicos como WebSocket, portas, tokens ou logs de baixo nível.
    - **Fluxo 1 (Desconectado):** Card limpo com campo de número telefônico `+55 (__) _____-____` e botão `[ CONTINUAR → ]`.
    - **Fluxo 2 (Pareamento):** Código de pareamento de 8 dígitos formatado (`ABCD-1234`) com botão de cópia de 1 clique + QR Code alternativo para leitura com a câmera do celular + indicador pulsante *"Estamos aguardando a confirmação..."*.
    - **Fluxo 3 (Conectado):** Status `🟢 Online`, exibição do número conectado, data e hora da última conexão e botões `[ ENVIAR MENSAGEM ]` e `[ ⚙️ Desconectar ]`.
  - **Multi-Tenant e Persistência no SQLite:**
    - Cada oficina tem sua sessão persistida de forma isolada na pasta `server/sessions/ws_${workshopId}`.
    - Tabelas criadas no banco de dados: `whatsapp_sessions` (controle de sessão e status), `whatsapp_messages` (histórico de mensagens) e `whatsapp_templates` (modelos com variáveis).
  - **Catálogo de 9 Templates Inteligentes com Variáveis Dinâmicas:**
    - Substituição automática de `{cliente}`, `{veiculo}`, `{marca}`, `{modelo}`, `{placa}`, `{oficina}`, `{servico}`, `{valor}`, `{data}` e `{link}`.
    - Templates incluídos: Veículo pronto, Orçamento disponível, Orçamento aprovado, Manutenção preventiva, Revisão, Veículo recebido, Veículo entregue, Certificação DNA AUTO e Lembrete de manutenção.
  - **Histórico Completo de Mensagens:**
    - Filtros por status: `🟢 Enviada`, `🟡 Aguardando`, `🔴 Falhou`.
  - **Botão de Ação Rápida no Pátio:**
    - Botão `[ 📱 WhatsApp ]` adicionado na listagem de veículos atendidos, permitindo disparar mensagens com template pré-selecionado sem sair do sistema.
- **Qualidade & Testes Automatizados:**
  - Bateria de testes expandida para **31 testes automatizados** passando com 100% de sucesso (`npm test`), cobrindo status, pareamento, confirmação, templates e envio de mensagens via Baileys.

### 📱 Ciclo 20: Novo App Mobile do Cliente Fiel à Referência & Remoção Total de Mocks do Sistema
- **Remoção Total de Dados Mock:**
  - Base operacional de veículos 100% limpa no banco SQLite (`SELECT count(*) FROM vehicles` = 0).
  - A oficina e o cliente agora cadastram seus próprios dados e veículos reais do zero sem interferência de dados falsos.
  - Telas de veículos cadastrados, estoque de peças e carteira de clientes em `workshopView.js` com Empty States profissionais e encorajadores.
  - Bateria de testes automatizados (`npm test`) reajustada para semear veículos de teste dinamicamente e restaurar o banco operacional para 0 carros ao final, mantendo 31/31 testes aprovados (100%).
- **Novo App Mobile do Proprietário (Mobile-First Ultra-Premium):**
  - Fiel em 100% à imagem de referência enviada pelo usuário:
    - Paleta Dark Obsidian (`#050B14`), Neon Blue (`#0066FF`), Ciano (`#00D4FF`) e Esmeralda (`#00E676`).
    - **Tela Sem Menu (Home)**:
      - Topo com logo oficial DNA AUTO, sininho de notificações com badge `3` e avatar do usuário com anel neon azul.
      - Card do Carro com logo da montadora, título `Volkswagen Gol 1.0`, placa e ano `ABC1D23 • 2021/2022`, tag `☑ Veículo cadastrado`, foto do carro com reflexo neon azul sob o assoalho no asfalto escuro.
      - Círculo de status com checkmark `EM DIA (Sem pendências)`.
      - 3 Medidores rápidos em cards: Quilometragem `87.542 km`, Combustível `72%` com barra de nível, Autonomia estimada `~ 520 km`.
      - Card de Certificação DNA AUTO com escudo dourado, tag `☑ Válida`, código `DNA-2026-000184`, data `08/09/2026 às 14:32`, botão `Ver certificação >` e QR Code escaneável.
      - Timeline horizontal de ÚLTIMOS REGISTROS com 4 nós luminosos conectados e card inferior de proteção criptografada.
      - Bottom Navigation Bar com 5 abas (`Início`, `Veículo`, `Certificação`, `Documentos`, `Mais`).
    - **Tela com Menu Aberto (Drawer Lateral)**:
      - Gaveta deslizante com botão de fechar `✕`, perfil do usuário (`João Silva • Cliente >`), 9 itens de menu com ícones e setas `>` e rodapé com escudo de segurança.
    - **Simulador Interativo**:
      - Controles no topo para alternar instantaneamente entre *"📱 Sem menu aberto"* e *"📱 Com menu aberto"*, e entre o *"🚗 Modelo Gol 1.0"* e *"➕ Meu Carro Real"*.

---

## 🏛️ Diretrizes e Convenções Persistentes
1. **Controle de Versão Git:** Todas as modificações de código e documentação devem ser seguidas de commit limpo e push para a branch `master` no repositório remoto GitHub.
2. **Registro Contínuo:** Todo novo ciclo ou alteração relevante de engenharia deve ser imediatamente documentado no `diario de bordo.md`, no `DIARIO_DE_BORDO.md` e refletido no `README.md`.
3. **Comunicação:** Atendimento sempre no idioma português.
4. **Validação de Testes:** O comando `npm test` deve sempre permanecer com 100% dos testes aprovados antes de qualquer publicação.
