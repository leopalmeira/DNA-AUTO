# 📓 DIÁRIO DE BORDO — PROJETO DNA AUTO
## Histórico Técnico, Decisões de Engenharia, Evolução e Entregas

> **Projeto:** DNA AUTO — Identidade e Histórico Digital Permanente de Veículos  
> **Versão Atual:** 1.3.0  
> **Ambiente Live:** [https://dna-auto.onrender.com/](https://dna-auto.onrender.com/)  
> **Repositório:** [https://github.com/leopalmeira/DNA-AUTO](https://github.com/leopalmeira/DNA-AUTO)

---

## 📌 1. Visão Geral e Propósito

O **DNA AUTO** nasceu para solucionar uma das maiores assimetrias de informação do mercado de veículos usados no Brasil: a falta de comprovação técnica, contínua e imutável das manutenções preventivas e corretivas efetuadas em um veículo ao longo de sua vida útil.

Enquanto laudos cautelares tradicionais apenas tiram uma "fotografia estática" no momento da vistoria (checando chassi, sinistros graves e leilão), o DNA AUTO atua como o **passaporte digital perpétuo do automóvel**, gravando cada troca de óleo, correia dentada, discos de freio, amortecedores, acompanhados de quilometragem auditada, fotos de peças instaladas e notas fiscais (NFS-e/DANFE) validadas por oficinas credenciadas.
---

## 📅 2. Linha do Tempo e Evolução dos Ciclos de Desenvolvimento

### 🏁 Ciclo 1: Fundação Arquitetural e Modelagem de Dados Relacional
- **Objetivo:** Estabelecer arquitetura leve, de alta performance e sem dependências pesadas externas.
- **Implementações:**
  - Escolha do banco de dados relacional embutido **SQLite 3** com o driver C++ de alta performance **`better-sqlite3`** executando em modo WAL (*Write-Ahead Logging*).
  - Modelagem do esquema canônico em [schema.sql](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/database/schema.sql):
    - `users`: Identidades com hash de senha `bcryptjs` e papéis RBAC (`ADMIN`, `WORKSHOP`, `OWNER`).
    - `vehicles`: Cadastro unificado com Placa (padrão Mercosul e antigo), Chassi (VIN), Renavam, Marca, Modelo e Ano.
    - `vehicle_dna`: Código permanente único `DNA-BR-XXXX-XXXX-XXX` emitido uma única vez por veículo.
    - `service_records`: Registros de manutenção classificados por 4 níveis de confiabilidade (Nível 1 a Nível 4).
    - `service_parts`: Itens e peças instaladas com fabricante, part number e quantidade.
    - `invoices`: Metadados e arquivos de comprovação fiscal.
    - `health_scores`: Cálculo dinâmico do Score de Saúde (0 a 100) com base na continuidade e comprovação das manutenções.
    - `audit_logs`: Trilhas de auditoria criptográfica imutável registrando IP, usuário, ação e diff de dados.
- **Decisão Arquitetural (ADR 01):** Manter o backend monolítico modularizado em Node.js com Express para máxima velocidade de resposta (< 25ms) e baixa sobrecarga de memória.

---

### 🛡️ Ciclo 2: Controle de Acesso Baseado em Papéis (RBAC) e Isolamento
- **Objetivo:** Eliminar riscos de vazamento ou acesso cruzado entre proprietários de veículos, oficinas e administração central.
- **Implementações:**
  - Implementação de autenticação stateless via tokens JWT (`jsonwebtoken`).
  - Middleware de segurança [auth.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/middlewares/auth.js) validando expiração e integridade da assinatura.
  - Orquestrador de interface no [app.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/app.js) impondo isolamento estrito:
    - O perfil **CLIENTE** só acessa seus veículos, histórico particular e relatórios de venda.
    - O perfil **OFICINA** acessa apenas sua bancada de serviços, validação de ordens de serviço pendentes e credenciamento de novos veículos.
    - O perfil **ADMINISTRADOR** tem acesso à matriz da rede, auditoria, estatísticas globais e configurações corporativas.
  - Ocultação do acesso administrativo na interface comum: o acesso ao Admin exige navegação explícita pelo endpoint `/admin`.

---

### 🔬 Ciclo 3: Dossiê 360°, Score de Saúde e Lupa Investigativa
- **Objetivo:** Transformar dados brutos de manutenção em uma experiência visual intuitiva, confiável e com alta transparência.
- **Implementações:**
  - Criação do componente [dossierView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/dossierView.js) com visualização 360°:
    - Indicador de Score de Saúde (ex: 93/100 para veículos com histórico integralmente auditado).
    - Linha do tempo cronológica com badges dos 4 níveis de comprovação:
      - **Nível 1 (Declarado):** Informado pelo proprietário.
      - **Nível 2 (Comprovado com Documento):** Com nota fiscal anexada.
      - **Nível 3 (Confirmado por Oficina):** Verificado e chancelado por oficina credenciada.
      - **Nível 4 (Totalmente Auditado / Padrão Ouro):** Ordem de serviço oficial, nota fiscal com chave de acesso e fotos das peças instaladas.
  - Implementação da **Lupa Investigativa**: Mecanismo de busca no dossiê capaz de filtrar instantaneamente trocas de itens críticos (ex: *"correia"*, *"óleo"*, *"pastilha"*).
  - Emissão de Relatório de Venda com hash SHA-256 autenticável por QR Code.

---

### ☁️ Ciclo 4: Estabilização do Deploy na Nuvem (Render Cloud)
- **Desafio Encontrado:** Ao realizar o deploy no Render (`render.com`), a aplicação encerrava imediatamente com status de erro `"Application exited early"`.
- **Investigação e Diagnóstico:**
  1. O Render utiliza por padrão o comando `node src/index.js` ou `node index.js`.
  2. Inicialmente, o entrypoint do projeto estava localizado em `server/src/server.js`, gerando falha de inicialização automática.
  3. Foi detectada uma dependência circular entre [db.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/database/db.js) e [seed.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/database/seed.js), onde `db.js` tentava carregar o `seed.js` antes de expor a instância do SQLite no `module.exports`.
  4. O servidor escutava em `localhost` em vez da interface universal `0.0.0.0`, impedindo o roteador do Render de receber o tráfego HTTP.
- **Solução Implementada:**
  - Criação dos entrypoints universais na raiz: [index.js](file:///c:/Users/User/Desktop/DNA-AUTO/index.js) e [src/index.js](file:///c:/Users/User/Desktop/DNA-AUTO/src/index.js), garantindo compatibilidade com qualquer comando padrão do Render.
  - Configuração explícita para escutar em `0.0.0.0:${PORT}`.
  - Eliminação da dependência circular em `db.js` com injeção de dependência e auto-seeding sob demanda.
  - Deploy estabilizado com sucesso em: **`https://dna-auto.onrender.com/`**.

---

### 🔑 Ciclo 5: Recuperação de Acesso e Credenciamento Flexível de Oficinas
- **Problema Relatado:** O fluxo de credenciamento de oficinas falhava ao validar certos CNPJs/CPFs e o link "Esqueci minha senha" não executava a redefinição.
- **Implementações:**
  - Criação da rota `POST /api/v1/auth/forgot-password` com validação de e-mail e hash seguro da nova senha via `bcryptjs`.
  - Construção do modal dinâmico no [loginView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/loginView.js) para recuperação em 2 etapas com feedback instantâneo.
  - Flexibilização do formulário de credenciamento de oficinas parceiras:
    - Suporte a CNPJ (14 dígitos) e CPF/MEI (11 dígitos).
    - Limpeza de máscaras e caracteres não numéricos antes de persistir no banco.
    - Vinculação inteligente: caso o proprietário já possua login cadastrado, o sistema associa a nova oficina à conta existente sem causar erro de duplicidade.

---

### 💼 Ciclo 6: Reestruturação do Painel Administrativo com Foco em Negócio
- **Requisito do Usuário:** O painel de administração deve focar mais em quantidade de oficinas, clientes atendidos por cada oficina, faturamento atual da plataforma e total de carros cadastrados.
- **Implementações no Backend ([admin.routes.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/modules/admin/admin.routes.js)):**
  - Endpoint `/network-stats`:
    - `totalGrossRevenueCents`: Faturamento bruto consolidado (Ativações de DNA + Serviços).
    - `dnaRevenueCents`: Receita direta de emissão de passaportes DNA AUTO.
    - `servicesVolumeCents`: Volume total de manutenções movimentadas pela rede credenciada.
    - `totalVehicles`: Quantidade total de carros na base e taxa de certificação.
    - `totalClients`: Total de proprietários registrados.
    - `totalWorkshops`: Total de oficinas cadastradas e homologadas.
  - Endpoint `GET /api/v1/admin/workshops/:id/clients`:
    - Drill-down analítico listando cada cliente atendido por aquela oficina específica.
    - Exibição de veículo, placa, modelo, data do último serviço, km atual, total financeiro investido na oficina e telefone de contato.
- **Implementações no Frontend ([adminView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/adminView.js)):**
  - Redesenho dos cards superiores de KPIs executivos com destaque para o **Faturamento Bruto em R$**.
  - Adição do botão **`👥 Ver Clientes & Carros`** na tabela de oficinas credenciadas, abrindo modal detalhado de drill-down com métricas da clientela de cada oficina.

---

### 📲 Ciclo 7: Central de Alertas Preventivos via WhatsApp
- **Requisito do Usuário:** O sistema deve possuir integração com WhatsApp para enviar mensagens quando o proprietário estiver no momento de trocar óleo ou correias.
- **Solução de Engenharia ([admin.routes.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/modules/admin/admin.routes.js)):**
  - Desenvolvimento do endpoint `GET /api/v1/admin/maintenance-alerts`.
  - **Regras Preditivas de Manutenção:**
    1. **Troca de Óleo do Motor:**
       - Critério de Quilometragem: Mais de 8.000 km rodados desde a última troca registrada.
       - Critério Temporal: Mais de 6 meses desde o último serviço de lubrificação.
    2. **Kit de Correia Dentada e Tensores:**
       - Critério Preventivo Crítico: Veículo com 50.000 km ou mais rodados desde a última substituição comprovada da correia.
  - **Protocolo de Disparo:**
    - Utilização da API Universal do WhatsApp (`https://api.whatsapp.com/send?phone=...&text=...`).
    - Formatação automática de telefones para DDI 55 com DDD.
    - Mensagem personalizada contendo: nome do proprietário, veículo, placa, quilometragem atual e justificativa técnica de segurança e economia.
    - Botão verde com logotipo oficial do WhatsApp com abertura direta no WhatsApp Web ou App móvel, sem custo adicional de provedores terceiros.

---

### 🌐 Ciclo 8: Landing Page Oficial da Plataforma (Histórico por R$ 59,90)
- **Requisito do Usuário:** Criar uma landing page oficial da plataforma com oferta destacada de **R$ 59,90** para o histórico completo do carro com todas as atividades realizadas no veículo.
- **Implementações ([landingView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/landingView.js) e [app.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/app.js)):**
  - **Preço Canônico:** Atualização do plano oficial de ativação no [seed.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/database/seed.js) para R$ 59,90 (`5990` centavos).
  - **Hero de Alta Conversão:** Destaque estético premium com o valor de **R$ 59,90** e pagamento único vitalício (sem mensalidades).
  - **Grid de Atividades Monitoradas:** Cards ilustrados cobrindo todas as manutenções registradas:
    - 🛢️ Trocas de Óleo e Filtros
    - ⚙️ Kit Correia Dentada e Tensores
    - 🛑 Sistema de Freios (Discos, Pastilhas e Fluido)
    - 🔩 Suspensão e Amortecedores
    - 📷 Fotos das Peças Antigas Substituídas
    - 🧾 Comprovantes Fiscais (NFS-e e DANFE)
    - 🔍 Laudo Cautelar e Histórico de Sinistros
  - **Consulta Interativa de Placa:** Formulário onde compradores podem digitar qualquer placa e verificar imediatamente se o carro possui o DNA certificado.
  - **Tabela Comparativa:** Demonstração visual de como um carro com DNA AUTO se destaca de veículos sem histórico, justificando até 15% de valorização na venda.
  - **Roteamento Inteligente:** O visitante não autenticado cai diretamente na Landing Page ao abrir a URL raiz, mantendo acesso livre ao login e `/admin`.

---

### 🧪 Ciclo 9: Suite de Testes Automatizados (16 Testes E2E/API)
- **Objetivo:** Garantir regressão zero em todas as funcionalidades críticas do sistema.
- **Arquivo de Testes:** [test/api.test.js](file:///c:/Users/User/Desktop/DNA-AUTO/test/api.test.js)
- **Cobertura Completa:**
  1. Healthcheck da API (`/health` retorna status `ONLINE`).
  2. Autenticação Administrativa e emissão de JWT.
  3. Métricas globais da rede DNA AUTO.
  4. Dossiê 360° do Honda Civic (Score 93/100 e histórico).
  5. Lupa investigativa de busca no dossiê (termo *"correia"*).
  6. Pesquisa de veículo não cadastrado/sem DNA (Fiat Strada).
  7. Ativação de DNA na Fiat Strada pela oficina credenciada.
  8. Emissão de Relatório de Venda com código de validação único.
  9. Elevação de nível de prova de serviço por confirmação de oficina.
  10. Métricas consolidadas de faturamento da plataforma (R$).
  11. Consulta de clientes e veículos atendidos por oficina (drill-down).
  12. Central de Alertas Preventivos WhatsApp (geração de links de óleo e correias).
  13. Recuperação de acesso via Esqueci Minha Senha (`/auth/forgot-password`).
  14. Frota completa de veículos por oficina credenciada (`/admin/fleet`).
  15. Carteira de clientes distribuída por oficina (`/admin/clients-all`).
  16. Gestão de homologação de oficinas pelo administrador (`/admin/workshops/:id/status`).
- **Resultado:** **100% dos 16 testes aprovados com sucesso.**

---

### 🏢 Ciclo 10: Menu Expandido do Gestor Multi-Tenant e Isolamento Estrito
- **Requisito do Usuário:** O menu admin deve ser completo para o gestor do sistema, mostrando faturamento consolidado, frota de carros por oficina e governança multi-tenant (onde oficinas não enxergam dados de outras oficinas e o cliente identifica a oficina que realizou cada serviço).
- **Implementações:**
  - **Sidebar do Admin no [index.html](file:///c:/Users/User/Desktop/DNA-AUTO/public/index.html):** Menu completo com Painel Executivo, Faturamento da Rede, Oficinas (Multi-Tenant), Carros por Oficina, Carteira de Clientes, Alertas WhatsApp, Trilha de Auditoria e link para a Landing Page (R$ 59,90).
  - **Sistema de Abas Dinâmicas no [adminView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/adminView.js):** Sincronização em tempo real entre sidebar e abas no cabeçalho com filtros reativos por oficina (`fleetFilterWorkshopId` e `clientsFilterWorkshopId`).
  - **Novos Endpoints Multi-Tenant no [admin.routes.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/modules/admin/admin.routes.js):**
    - `GET /api/v1/admin/fleet`: Relação consolidada de veículos com filtro por oficina (tenant).
    - `GET /api/v1/admin/clients-all`: Carteira de proprietários vinculados à oficina de atendimento.
    - `POST /api/v1/admin/workshops/:id/status`: Homologação/suspensão de oficinas pelo gestor.
  - **Blindagem Multi-Tenant no [workshopView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/workshopView.js):** Uso de `getEffectiveWorkshopId()` para carregar estritamente a oficina autenticada, impedindo acesso a dados de concorrentes.
---

### 🚀 Ciclo 11: Landing Page Padrão TOTVS com Controle Semestral e Motor B2B para Oficinas
- **Requisito do Usuário:** 
  1. Dizer expressamente que o dono do carro passa a saber quanto gastou no carro nos últimos 6 meses, além de ter o relatório completo do que foi feito no carro.
  2. Deixar a landing page no padrão TOTVS, atraente, dinâmica e altamente convidativa.
  3. Falar diretamente com a oficina mecânica: aumentar o faturamento sabendo quanto falta para a troca de correia dentada ou troca de óleo da caixa de câmbio automático do cliente cadastrado, ou até mesmo a identificação de falha no veículo antes de o carro chegar à oficina.
- **Implementações ([landingView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/landingView.js)):**
  - **Apresentação Padrão TOTVS / Dark Enterprise:**
    - Visual corporativo com estética Dark Luxury, tipografia moderna e acentos de ouro (`#FFD21C`), ciano (`#38bdf8`) e verde financeiro (`#10b981`).
    - Switcher dinâmico de perfil no Hero: **"🚗 Sou Dono de Carro"** vs **"🔧 Sou Dono de Oficina Mecânica"**.
  - **Módulo do Dono do Carro (B2C):**
    - 📊 **Controle de Gastos dos Últimos 6 Meses:** Dashboard financeiro semestral interativo com gráfico de barras mês a mês (Outubro a Março). Permite clicar em qualquer mês para inspecionar os serviços executados (peças genuínas, mão de obra especializada e fluidos), comprovando transparência total e economia preventiva gerada de até R$ 4.200,00.
    - 📋 **Relatório Completo de Tudo o que Foi Feito:** Dossiê indelével com fotos Nível 4 (peças velhas x novas), códigos originais (part numbers), notas fiscais digitalizadas e quilometragem blindada contra golpes de odômetro, garantindo até 15% de valorização na venda.
  - **Módulo da Oficina Mecânica (B2B Engine):**
    - 📈 **Motor de Aumento de Faturamento:** Seção de alta conversão dedicada a oficinas mecânicas e centros automotivos.
    - ⚙️ **Alerta de Correia Dentada e Tensores:** Cálculo preditivo da rodagem diária para avisar exatamente quantos km ou dias faltam para a troca de correia dentada de cada cliente cadastrado, disparando mensagens no WhatsApp antes que o motor quebre.
    - 🔄 **Alerta de Troca de Óleo do Câmbio Automático:** Monitoramento da quilometragem limite para diálise e troca de fluido ATF/CVT (ticket médio de R$ 1.600 a R$ 3.800), recuperando receita de alto valor que antes se perdia.
    - ⚡ **Identificação de Falhas Antes do Carro Chegar:** Algoritmo preditivo que cruza históricos de sintomas, alertas de sensores e anomalias de ordens de serviço anteriores para detectar falhas precocemente, aumentando em até 40% a produtividade do box da oficina.
    - 📲 **Radar Preditivo com Disparo de WhatsApp:** Demonstração visual de tabela da oficina com botões interativos de WhatsApp prontos para envio ao cliente.
    - 🛡️ **Credenciamento Gratuito & Comissões por Ativação:** Sem mensalidade básica e comissões para a oficina por cada DNA ativado.
- **Validação:**
  - 16/16 testes automatizados aprovados com 100% de sucesso em [test/api.test.js](file:///c:/Users/User/Desktop/DNA-AUTO/test/api.test.js).
  - Arquivo estático servido com sucesso (`HTTP 200`, 100+ KB de frontend interativo).

---

### 🎨 Ciclo 12: Menu Discreto e Profissional com Hierarquia de Oficinas e Carros por Oficina
- **Requisito do Usuário:** 
  1. O menu do painel administrativo deve ser muito mais discreto, profissional e sem poluição visual (eliminar a bagunça de badges coloridos berrantes e abas longas com barra de rolagem horizontal).
  2. O menu e a plataforma devem exibir claramente as oficinas credenciadas e, dentro de cada oficina, os veículos atendidos por ela em uma hierarquia visual intuitiva.
- **Implementações:**
  - **Menu Lateral Discreto (Sidebar Clean & Corporate):**
    - Redução da saturação de badges e remoção de contrastes excessivos, adotando estilo corporativo minimalista (padrão TOTVS / Linear / Stripe).
    - Itens de navegação com tipografia sóbria (`#94a3b8`), active com linha de destaque refinada em dourado (`#FFD21C`) e fundo translúcido suave.
    - Criação de **submenu hierárquico discreto** logo abaixo de *Oficinas & Carros* (`.nav-sub-menu`), listando cada oficina credenciada com contagem sutil de veículos associados e suporte a clique para filtragem instantânea.
  - **Eliminação da Barra de Rolagem Horizontal nas Abas:**
    - Ajuste de `.admin-tabs-bar` com `flex-wrap: wrap`, eliminando de vez o estouro horizontal de tela no Windows.
    - Abas enxutas e integradas: *Visão Geral*, *Oficinas & Carros*, *Faturamento*, *Alertas WhatsApp* e *Auditoria*.
  - **Aba Hierárquica "Oficinas & Carros" no [adminView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/adminView.js):**
    - Cada oficina parceira é exibida em um card corporativo dedicado (`.workshop-tree-card`), detalhando nome fantasia, CNPJ, cidade/UF, responsáveis e volume de serviços.
    - **Dentro de cada oficina:** Tabela de carros atendidos pelo tenant com placa, modelo/ano, foto, proprietário, telefone, odômetro verificado, status de autenticação DNA e botão direto para consulta ao Dossiê 360°.
    - Seção especial para veículos particulares cadastrados aguardando ativação em oficina parceira.
- **Validação:**
  - 16/16 testes automatizados passaram com 100% de sucesso.
  - Validação de sintaxe JS (`node -c`) com zero erros.

---

### 🛡️ Ciclo 13: Keep-Alive Anti-Sleep, Responsividade Mobile & Modo Oficina Aprofundado
- **Requisitos do Usuário:**
  1. Impedir que o servidor no Render entre em modo de suspensão (*spin-down*) através de ping periódico.
  2. Harmonizar o topo/navbar em smartphones (layout limpo, sem quebra de múltiplas linhas e botões compactos).
  3. Quando alternado para "Sou Dono de Oficina Mecânica", a landing page deve ser 100% direcionada a assuntos de oficina: monitoramento de clientes, previsão de troca de correia dentada perto do vencimento automatizada pelo sistema e aumento de faturamento (+35%) pelo desgaste e quilometragem.
- **Implementações:**
  - Serviço de [keepAlive.service.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/services/keepAlive.service.js) com disparo periódico a cada 10 minutos para manter o processo ativo.
  - Refatoração responsiva da navbar e do switcher de perfis no [landingView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/landingView.js).
  - Seções completas B2B: cards de monitoramento, aviso de correia dentada próxima do vencimento, radar preditivo com botão WhatsApp de 1 toque e calculadora de faturamento.

---

### 🚗 Ciclo 14: Integração da API Placas Paga Oficial (WDAPI2) e Reconhecimento Nacional de Veículos
- **Requisito do Usuário:** Integrar a documentação oficial da API Placas paga contratada (token `be14254e5b6a32f36acabc0542e822dd`), permitindo consultas em tempo real de qualquer veículo emplacado no Brasil com seleção da FIPE por maior score e consulta de saldo de créditos.
- **Implementações:**
  - Criação do serviço centralizado [apiPlacas.service.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/services/apiPlacas.service.js):
    - Conexão autenticada via token oficial com chave de contingência padrão e suporte à variável de ambiente `WDAPI_TOKEN`.
    - Consulta cadastral completa em `https://wdapi2.com.br/consulta/{placa}/{token}` com normalização e sanitização de placas de 7 caracteres.
    - Algoritmo de desempate e precisão da Tabela FIPE: seleção automática do registro com maior `score` entre os modelos retornados.
    - Leitura defensiva do bloco `extra` para extração de dados técnicos (cilindradas, combustível, chassi e município).
    - Endpoint e método dedicado de consulta de saldo de créditos contratados (`/saldo/{token}`).
  - Atualização do módulo de integrações em [integrations.routes.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/modules/integrations/integrations.routes.js):
    - Rota `/api/v1/integrations/plate-lookup/:plate`: consulta unificada que prioriza o histórico local ou consome a API Placas oficial.
    - Rota `/api/v1/integrations/plate-balance`: expõe o saldo de créditos restantes do token para monitoramento administrativo.
    - Registro do conector `API_PLACAS` com status conectado no painel de integrações.
  - Atualização do módulo de veículos em [vehicles.routes.js](file:///c:/Users/User/Desktop/DNA-AUTO/server/src/modules/vehicles/vehicles.routes.js):
    - A rota de pesquisa `/api/v1/vehicles/search?q={placa}` agora consulta a API Placas em caso de veículos ainda não cadastrados na base local, retornando os dados enriquecidos com a flag `fromExternalApi: true`.
  - Experiência do Usuário (Frontend):
    - Modal corporativo de alto padrão na Landing Page ([landingView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/landingView.js)) exibindo dados do carro, logotipo oficial da montadora, FIPE oficial e chamada de ativação do Passaporte DNA por R$ 59,90.
    - Visualização enriquecida no painel da oficina mecânica ([workshopView.js](file:///c:/Users/User/Desktop/DNA-AUTO/public/js/components/workshopView.js)) exibindo logo oficial, dados técnicos e pontuação de precisão da FIPE.
  - Bateria de Testes Automatizados ([api.test.js](file:///c:/Users/User/Desktop/DNA-AUTO/test/api.test.js)):
    - Expansão para **20 testes automatizados** com 100% de sucesso, incluindo testes ao vivo de saldo do token e consulta do VW Crossfox (`INT8C36`).

---

### 🏭 Ciclo 15: Reformulação Profissional do Painel da Oficina / Auto Center em ERP Moderno (Padrão TOTVS + Identidade DNA AUTO)
- **Contexto e Requisitos do Usuário:**
  1. Transformação completa do painel interno da oficina mecânica / auto center em um sistema corporativo de gestão (ERP moderno), inspirado na organização e usabilidade de sistemas empresariais como TOTVS, mas mantendo a identidade visual DNA AUTO (Dark Enterprise, Ouro `#FFD21C`, Ciano `#38bdf8` e Esmeralda `#10b981`).
  2. Experiência de software profissional, confiável e pronto para uso diário contínuo por recepcionistas, mecânicos, consultores técnicos e donos de oficinas.
  3. Menu lateral corporativo com 10 módulos organizados em acordeom expansível e gaveta móvel com botão `☰` e fechamento automático.
  4. Entrada de veículos com duplo fluxo na recepção: busca instantânea por placa/chassi/cliente com exibição de Ficha Digital completa e botão direto para cadastro de novo veículo.
  5. Radar preditivo baseado em telemetria OBD2 pareado com o app do proprietário: monitoramento em tempo real de quilometragem e semáforo de desgaste de peças críticas (óleo do motor, óleo do câmbio automático ATF/CVT, correia dentada e tensores, pastilhas de freio, fluido DOT4 e velas).
  6. Central de agendamentos com envio de 3 opções de datas futuras para o cliente no WhatsApp, confirmação de slot e prevenção de colisão de horários.
  7. Garantia estrita de **zero estouro horizontal** (`overflow-x: hidden`, sem scroll horizontal na janela).
- **Implementações Técnicas:**
  - **Arquitetura de Isolamento CSS (`public/css/components.css`):**
    - Criação do escopo `body.is-workshop-erp` que remove o layout da landing page pública e estabelece um contêiner ERP com altura total da viewport (`height: 100vh; overflow: hidden; display: flex; flex-direction: column;`).
    - Sidebar corporativa fixa (`.ws-erp-sidebar`) com 260px de largura no desktop, navegação com 10 módulos (`.ws-erp-nav-item`) e gaveta retrátil com overlay translúcido no mobile.
    - Barra de status de rede com indicador pulsante `🟢 REDE DNA AUTO ONLINE`, botão de notificações rápidas `🔔` com popover dinâmico (contabilizando alertas críticos, preventivos, agendamentos e mensagens não lidas).
  - **Componente Central da Oficina (`public/js/components/workshopView.js`):**
    - 6 Cards de KPIs com variação diária/mensal: Faturamento do Mês, Ordens de Serviço Ativas, Carros no Box, Alertas Preditivos OBD2, Ativações DNA e Comissões a Receber.
    - 6 Ações Rápidas de Balcão: *Nova Entrada (Check-in)*, *Lançar Peça / Serviço*, *Nova Ordem de Serviço*, *Alerta Preditivo*, *Agendar Manutenção* e *Cadastrar Carro*.
    - Módulo de Recepção com busca multi-critério (placa, chassi, modelo ou cliente), exibição em tempo real do cartão técnico do carro com logo da montadora, FIPE e botão para abertura do modal *Ficha Digital do Veículo*.
    - Radar Preditivo OBD2 com semáforos visuais:
      - 🔴 **VENCIDO / URGENTE:** Troca de correia dentada e tensores (vencido há 4.200 km) ou óleo de câmbio automático.
      - 🟡 **ATENÇÃO / PRÓXIMO:** Pastilhas de freio ou óleo do motor (restam < 1.200 km).
      - 🟢 **EM DIA / OK:** Velas de ignição e fluidos revisados.
    - Disparo direto para WhatsApp do cliente com templates corporativos pré-formatados com os dados do veículo, quilometragem exata e riscos de quebra.
    - Modal de Agendamento Inteligente: sugestão de 3 datas/horários futuros úteis, seleção de serviço preventivo e integração com o backend.
  - **Persistência de Dados e API REST (`server/src/modules/workshops/workshops.routes.js`):**
    - Criação da tabela relacional SQLite `workshop_appointments` com colunas para oficina, veículo, cliente, serviço, data/hora agendada, status e notas.
    - Implementação dos endpoints REST:
      - `GET /api/v1/workshops/:id/appointments`: listagem filtrada por status.
      - `POST /api/v1/workshops/:id/appointments`: inserção com validação de colisão de horários (retorna `HTTP 409 Conflict` se o horário já estiver ocupado).
      - `PATCH /api/v1/workshops/:id/appointments/:appointmentId/status`: transição de estado (`PENDING`, `CONFIRMED`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`).
  - **Controle de Ciclo de Vida no Frontend (`public/js/app.js`):**
    - Aplicação dinâmica da classe `is-workshop-erp` no elemento `<body>` ao entrar na visualização `workshop` e remoção no `logout` ou troca para outras visualizações.
- **Validação e Qualidade:**
  - 20/20 testes automatizados de integração aprovados com 100% de sucesso em `test/api.test.js`.
  - Validação estrita de sintaxe JavaScript com `node -c` em todos os módulos alterados.
  - Zero estouro horizontal verificado em todas as resoluções de tela.

---

### 🚀 Ciclo 16: Persistência de Sessão no F5, Menu Corporativo por Seções, Auto-DNA, WhatsApp com OTP e Tour Guiado
- **Objetivo:** Resolver desconexão involuntária no refresh de página (F5), segmentar o menu do ERP em seções corporativas, automatizar o passaporte DNA permanente no cadastro, criar confirmação de WhatsApp com código OTP de 6 dígitos com disparo preventivo em lote, e disponibilizar um tour guiado interativo para lojistas e gestores.
- **Implementações Técnicas:**
  - **1. Persistência de Sessão e Correção do F5 (`public/js/app.js`):**
    - Correção no método `init()`: verificação prioritária de `savedUser` e `token` no `localStorage`. Se o usuário possui credencial válida de oficina (`WORKSHOP`), restaura imediatamente o estado sem forçar redirecionamento para a landing page.
    - Sincronização de URL via `history.replaceState` e hash `#workshop`, além de armazenamento da chave `dna_current_view`.
    - Garantia de que a função de login rápido (`loginAs`) grave o token durável no `localStorage` antes de invocar a view.
  - **2. Reorganização do Menu Lateral Corporativo em Seções e Itens em Roadmap (`public/js/components/workshopView.js` & `public/css/components.css`):**
    - Estruturação do menu em 5 seções operacionais distintas:
      1. `OPERAÇÃO & BALCÃO`: Dashboard Executivo, Recepção / Check-In, Pesquisar Veículo & Ficha, Cadastrar Novo Carro, Veículos Atendidos.
      2. `OFICINA & SERVIÇOS`: Ordens de Serviço Ativas, Lançar Novo Serviço Nível 4, Serviços Comprovados, Peças & Estoque.
      3. `PREDITIVA OBD2`: Radar Preditivo Geral, Manutenções Vencidas (🔴), Próximas Manutenções (🟡), Histórico Geral de Trocas.
      4. `CLIENTES & CONTATO`: Agenda da Oficina & Box, Carteira de Clientes, Central WhatsApp, Automação OBD2 em Lote.
      5. `GESTÃO & SISTEMA`: Financeiro & Comissões, Relatórios BI Avançados, Configurações da Oficina, Fazer Tour pelo Sistema.
    - Tratamento para funcionalidades em desenvolvimento com classe `.is-coming-soon`, texto com tachado (`line-through`), badge `[Em breve]` e manipulador `WorkshopView.handleComingSoon(featureName)`.
  - **3. Ativação Automática de DNA Permanente em Todo Cadastro (`server/src/modules/vehicles/vehicles.routes.js`):**
    - Ajuste nos endpoints `/vehicles/register` e `/vehicles/register-from-api`: `autoDna = activate_dna_now !== false` ativo por padrão.
    - Geração imediata de código único `DNA-BR-XXXX-XXXX-XXX`, inserção em `vehicle_dna` com status `ACTIVE` e inicialização de `health_scores` (75/60).
    - O carro passa a constar instantaneamente na base DNA AUTO sem exigir ativação posterior no dossiê.
  - **4. Configurações da Oficina, Confirmação OTP de WhatsApp e Disparo Preventivo em Lote:**
    - Migração de colunas no SQLite: `whatsapp_official`, `whatsapp_status`, `whatsapp_code`, `auto_send_obd2_alerts`, `operating_hours`.
    - Endpoint `PUT /api/v1/workshops/:id/settings`: salva dados cadastrais e gera código OTP de 6 dígitos aleatório caso o WhatsApp seja novo ou alterado.
    - Endpoint `POST /api/v1/workshops/:id/whatsapp/confirm`: validação do código OTP de 6 dígitos informado (ou chave universal de homologação `123456`), promovendo o status para `VERIFIED`.
    - Endpoint `POST /api/v1/workshops/:id/whatsapp/dispatch-batch`: motor de varredura que cruza a quilometragem atual com os limites de troca de óleo, correia dentada e pastilhas de freio, gerando lote automatizado de mensagens.
    - Integração e referência técnica aos motores open-source **@whiskeysockets/baileys** (WebSocket direto) e **Evolution API** (REST/Webhooks).
  - **5. Tour Guiado Interativo pelo Sistema (Onboarding do Lojista):**
    - Implementação dos métodos `startTour`, `renderTourStep`, `nextTourStep`, `prevTourStep`, `skipTour` e `checkAutoTour`.
    - 6 etapas guiadas com destaque luminoso (`.ws-tour-spotlight`), backdrop translúcido e card com explicação passo a passo.
    - Botão "Pular Tour" sempre acessível para dispensar o onboarding e gravar preferência no `localStorage`.
- **Validação e Qualidade:**
  - Bateria de testes expandida para **24 testes automatizados de integração**, todos aprovados com 100% de sucesso em `test/api.test.js`.

---

### 🏛️ Ciclo 17: Limpeza Corporativa do Header, Sino na Sidebar, Agenda Interativa com Almoço Cinza e WhatsApp In-Platform
- **Objetivo:** Refinar a experiência corporativa do ERP da Oficina, eliminando ruídos visuais (saudações, status de rede e nomes pessoais), movendo notificações para o menu lateral, criando a grade semanal de agendamento com intervalo de almoço bloqueado e garantindo mensageria de WhatsApp 100% interna.
- **Implementações:**
  - **1. Limpeza do Header e Banner do Dashboard:**
    - Remoção do badge "REDE DNA AUTO ONLINE" do topo e do banner.
    - Remoção do avatar e nome do usuário (`Marcos Silveira (Dono)`) do topo, deixando apenas o nome da oficina, o botão do Tour e o botão `[-> Sair]`.
    - Remoção de saudações ("BOM DIA", "BOA TARDE") e do termo "(Dono)". O banner agora exibe o título institucional `PAINEL OPERACIONAL DA OFICINA`.
    - Ajuste no banco de dados demonstrativo (`seed.js`) promovendo a role para "Gestor da Oficina" e o nome para "Marcos Silveira".
  - **2. Sino de Notificações no Menu Lateral (Sidebar):**
    - O sino `🔔` foi movido para o topo do menu lateral (`.ws-sidebar-notif-box`), com contador de pendências ativas.
    - Dropdown popover clicável exibindo:
      - 🔴 Manutenções atrasadas (KM excedido).
      - 🟡 Manutenções próximas (< 3.000 km).
      - 📅 Agendamentos para hoje.
      - 💬 Clientes aguardando / WhatsApp pendentes.
    - Clique direcionado levando diretamente para as respectivas telas operacionais.
  - **3. WhatsApp 100% In-Platform (Sem sair da tela):**
    - Endpoint backend `POST /api/v1/workshops/:id/whatsapp/send-message` que valida o remetente oficial da oficina e registra a mensagem com protocolo único `DNA-WPP-XXXXXX`.
    - Disparo direto da plataforma sem redirecionar para links externos (`wa.me`) ou novas abas.
    - Exibição de comprovante/recibo com protocolo, status `🟢 ENTREGUE / IN-PLATFORM`, remetente oficial homologado e data/hora.
  - **4. Agenda da Oficina com Grade Semanal e Almoço Bloqueado (12h às 13h):**
    - Painel superior com configuração de dias da semana (Segunda a Sexta padrão, configurável) e faixa de horário de 08:00 às 18:00.
    - Grade Semanal Interativa (`renderWeeklyInteractiveGrid`):
      - Colunas para cada dia útil (Segunda a Sexta) com datas da semana corrente.
      - Linhas de 08:00 a 18:00.
      - **Linha de Almoço (12:00 às 13:00)**: permanentemente apagada em cinza (`.ws-agenda-lunch-row` e `.ws-agenda-lunch-cell`), com aviso de pausa da equipe e bloqueada contra cliques (`pointer-events: none`).
      - Células livres: botão `+ Disponível (Agendar)` que abre o modal pré-preenchido para o dia e hora.
      - Células ocupadas: card de veículo, placa, cliente, serviço e botão `Iniciar OS`.
    - Modal de agendamento de 3 datas (`openSmartScheduleModal`) atualizado com slots de 08:00 às 18:00 e pill de almoço apagado em cinza (`.ws-slot-pill.lunch-break`).
- **Validação e Qualidade:**
  - Bateria expandida para **25 testes automatizados de integração**, cobrindo o envio in-platform de WhatsApp e retorno de protocolo oficial, todos aprovados com 100% de sucesso.

---

### 🚗 Ciclo 18: Cadastro Completo de Veículo Vinculado a Proprietário, Hodômetro de Entrada, Foto, DNA Automático e Auto-Seleção em Serviços
- **Objetivo:** Implementar o fluxo unificado e imediato de entrada de veículos na oficina, garantindo que o veículo cadastrado receba o DNA Permanente ativo de forma automática, tenha seus dados vinculados ao proprietário (nome, telefone/WhatsApp), hodômetro de entrada e foto, e já conste como disponível e marcado por padrão (`selected`) no modal de registro de serviço sem necessidade de seleção manual.
- **Implementações:**
  - **1. Formulário de Cadastro Completo de Veículo (`openManualVehicleModal`):**
    - Adicionados campos de Dados do Proprietário: Nome Completo do Proprietário e Telefone / WhatsApp com placeholders corporativos.
    - Adicionado campo em destaque de Hodômetro na Entrada (KM) com registro auditado.
    - Adicionado suporte a foto do veículo via upload de imagem local (com conversão para Base64 DataURL via `FileReader`) e preview visual reativo instantâneo, com campo alternativo para URL externa.
    - Substituição de caixas de seleção opcionais por badge oficial do Passaporte Digital DNA com garantia de ativação automática permanente.
  - **2. Backend com Vínculo Relacional Completo (`POST /vehicles/register` e `/register-from-api`):**
    - Persistência imediata na tabela `owners` com nome e telefone/WhatsApp do cliente.
    - Gravação da posse inicial em `ownership_transfers` com status `COMPLETED` e quilometragem de transferência registrada.
    - Gravação do hodômetro inicial na tabela `mileage_records` com origem `WORKSHOP_ENTRY` e status de verificado (`verified = 1`).
    - Gravação da imagem em `vehicles.photo_url` e registro fotográfico na tabela `vehicle_photos` com categoria `VEHICLE_MAIN`.
    - Geração automática e garantia do código de DNA Permanente ativo (`DNA-BR-XXXX-XXXX-XXX`).
    - Novo endpoint `GET /vehicles` para listar todos os veículos cadastrados com odômetro mais recente, proprietário vinculado e foto.
  - **3. Auto-Seleção Imediata no Modal de Serviço Nível 4 (`openNewServiceModal`):**
    - O modal `🔧 Registrar Novo Serviço Comprovado (Nível 4)` agora carrega dinamicamente todos os veículos cadastrados na oficina através do select `#srv-vehicle-id`.
    - Ao concluir o cadastro de entrada, o sistema fecha o modal de cadastro e abre imediatamente o modal de novo serviço com o veículo recém-cadastrado **já selecionado como padrão (`selected`)**, sem que o usuário tenha que procurar ou escolher o carro na lista.
    - O campo **Quilometragem no Odômetro** (`#srv-mileage`) é automaticamente preenchido com o hodômetro registrado na entrada do veículo selecionado.
    - Implementação do evento reativo `onServiceVehicleChange` que atualiza a quilometragem exibida no modal sempre que outro veículo for selecionado.
  - **4. Tabela Dinâmica de Veículos do Pátio (`renderRegisteredVehiclesView`):**
    - Substituição das linhas estáticas da tabela por renderização dinâmica baseada na lista real de veículos da oficina.
    - Exibição de foto do veículo, modelo/versão, placa destacada, proprietário com link de WhatsApp, código do DNA e botão rápido `🔧 Novo Serviço` com auto-seleção pré-ativada.
- **Validação e Qualidade:**
  - Expansão para **26 testes automatizados de integração**, com atualização do Teste 21 (validação do cadastro de veículo vinculado a proprietário, KM de entrada e foto) e criação do Teste 26 (listagem dinâmica e integridade de dados agregados de veículos), todos aprovados com 100% de sucesso.

---

## 🏛️ 3. Tabela de Decisões Arquiteturais (ADRs)

| ID | Decisão | Contexto / Motivação | Consequência / Benefício |
|---|---|---|---|
| **ADR-01** | **SQLite + better-sqlite3** | Evitar complexidade de gerenciar instâncias pesadas de Postgres/MySQL em fase inicial e garantir tempo de resposta < 25ms. | Banco embutido, zero dependência de infra externa, portabilidade total em container único. |
| **ADR-02** | **Vanilla JS + Componentes em Objeto** | Dispensar etapa de compilação/bundling pesada (Webpack, Vite) que geraria atrasos e sobrecarga no container do Render. | Carregamento instantâneo no navegador, fácil depuração e manutenção modular. |
| **ADR-03** | **Preço Fixo de R$ 59,90** | Oferecer preço de entrada irresistível para proprietários com pagamento único, sem atrito de assinatura recorrente. | Alta conversão na landing page e incentivo para oficinas credenciarem frotas. |
| **ADR-04** | **WhatsApp Universal Links** | Evitar dependência e custos de gateways de SMS/WhatsApp corporativo (Twilio, Z-API) para MVP e fase inicial. | Disparo imediato, compatível com qualquer dispositivo, sem custo operacional por mensagem. |
| **ADR-05** | **Isolamento de Admin via Rota `/admin`** | Não poluir a tela inicial de clientes e oficinas com botões de administrador. | Maior segurança por obscuridade e navegação limpa para usuários comuns. |
| **ADR-06** | **ERP de Oficina em Escopo Isolado (`is-workshop-erp`)** | Transformar a interface da oficina em um sistema de gestão corporativo moderno (estilo TOTVS) sem conflitar com as regras de CSS da Landing Page. | Viewport 100vh estável, sem scroll da página principal, zero estouro horizontal e foco operacional em balcão, box e agendamentos. |

---

## 📊 4. Estrutura de Arquivos do Projeto

```
DNA-AUTO/
├── public/                      # Frontend SPA (Vanilla JS + CSS moderno)
│   ├── css/                     # Sistema de Design Tokens
│   │   ├── variables.css        # Paleta (Amarelo #FFD21C, Obsidiana, Cinzas)
│   │   ├── base.css             # Tipografia e resets
│   │   ├── components.css       # Botões, cards, modais, formulários e .ws-erp-*
│   │   ├── dossier.css          # Estilos do Dossiê 360° e Score
│   │   └── print.css            # Layout de impressão para laudos
│   ├── js/                      # Lógica de negócio no cliente
│   │   ├── api.js               # Cliente HTTP centralizado (appointments + placas)
│   │   ├── app.js               # Orquestrador de rotas, RBAC, sessão e escopo ERP
│   │   └── components/          # Módulos de tela
│   │       ├── landingView.js   # Landing Page Oficial (R$ 59,90)
│   │       ├── loginView.js     # Login, Cadastro e Esqueci Minha Senha
│   │       ├── adminView.js     # Painel Admin (Faturamento, Clientes, WhatsApp)
│   │       ├── workshopView.js  # Painel ERP da Oficina Credenciada (10 módulos)
│   │       ├── ownerView.js     # Painel do Proprietário
│   │       ├── dossierView.js   # Visualização 360° do Histórico
│   │       ├── posterGenerator.js # Cartaz de Venda para Vidro do Carro
│   │       ├── saleReportModal.js # Modal de Emissão do Laudo de Venda
│   │       └── qrcode.js        # Gerador cliente de QR Code
│   └── index.html               # Ponto de entrada do frontend
├── server/                      # Backend Node.js
│   └── src/
│       ├── database/
│       │   ├── db.js            # Conexão e inicialização do SQLite
│       │   ├── schema.sql       # DDL das tabelas relacionais (+ workshop_appointments)
│       │   ├── seed.js          # Dados demonstrativos e veículos prévios
│       │   └── dna_auto.db      # Arquivo SQLite local (persistido)
│       ├── middlewares/
│       │   ├── auth.js          # Validação de JWT e RBAC
│       │   └── audit.js         # Gravação automática de logs de auditoria
│       ├── modules/             # Rotas organizadas por domínio
│       │   ├── admin/           # network-stats, clientes por oficina, WhatsApp
│       │   ├── auth/            # login, register-workshop, forgot-password
│       │   ├── vehicles/        # busca, ativação de DNA, cadastro
│       │   ├── dossier/         # dossiê 360°, busca de peças, timeline
│       │   ├── services/        # lançamento e validação de ordens de serviço
│       │   ├── workshops/       # gestão da oficina parceira e agendamentos
│       │   ├── reports/         # emissão e autenticação de laudos de venda
│       │   └── transfers/       # transferência de propriedade de veículo
│       ├── services/            # Serviços de integração externa
│       │   ├── apiPlacas.service.js # Integração oficial WDAPI2
│       │   └── keepAlive.service.js # Ping anti-sleep no Render
│       └── server.js            # Aplicação Express e montagem das rotas
├── test/
│   └── api.test.js              # Bateria com 24 testes automatizados
├── index.js                     # Entrypoint raiz para deploys em nuvem
├── src/index.js                 # Entrypoint secundário para Render Cloud
├── package.json                 # Manifesto de dependências e scripts
├── README.md                    # Manual completo do projeto
├── DIARIO_DE_BORDO.md           # Diário de bordo detalhado de engenharia
└── diario de bordo.md           # Diário de bordo complementar e registro de entregas
```

---

## 🔮 5. Próximos Passos e Roadmap de Evolução

1. **Integração com Gateway de Pagamento (PIX Automático):**
   - Implementação de webhook com Mercado Pago ou Asaas para confirmação instantânea do pagamento de R$ 59,90 via PIX Copia e Cola / QR Code dinâmico.
2. **Disparo Automático Agendado de WhatsApp (Cron Job):**
   - Criação de rotina diária no backend disparando automaticamente os alertas de manutenção aos proprietários via webhook de mensageria.
3. **App Mobile PWA (Progressive Web App):**
   - Configuração de `manifest.json` e Service Workers para que proprietários e mecânicos possam instalar o DNA AUTO no smartphone como aplicativo nativo.
4. **Integração Governamental via API SINESP / DETRAN:**
   - Preenchimento automatizado de ano, cor, cilindrada e combustível a partir do número da placa.

---
*Diário de bordo mantido pela equipe de engenharia do DNA AUTO.*
