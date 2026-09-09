# 📓 DIÁRIO DE BORDO — PROJETO DNA AUTO
## Histórico Técnico, Decisões de Engenharia, Evolução e Entregas

> **Projeto:** DNA AUTO — Identidade e Histórico Digital Permanente de Veículos  
> **Versão Atual:** 1.2.0  
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

## 🏛️ 3. Tabela de Decisões Arquiteturais (ADRs)

| ID | Decisão | Contexto / Motivação | Consequência / Benefício |
|---|---|---|---|
| **ADR-01** | **SQLite + better-sqlite3** | Evitar complexidade de gerenciar instâncias pesadas de Postgres/MySQL em fase inicial e garantir tempo de resposta < 25ms. | Banco embutido, zero dependência de infra externa, portabilidade total em container único. |
| **ADR-02** | **Vanilla JS + Componentes em Objeto** | Dispensar etapa de compilação/bundling pesada (Webpack, Vite) que geraria atrasos e sobrecarga no container do Render. | Carregamento instantâneo no navegador, fácil depuração e manutenção modular. |
| **ADR-03** | **Preço Fixo de R$ 59,90** | Oferecer preço de entrada irresistível para proprietários com pagamento único, sem atrito de assinatura recorrente. | Alta conversão na landing page e incentivo para oficinas credenciarem frotas. |
| **ADR-04** | **WhatsApp Universal Links** | Evitar dependência e custos de gateways de SMS/WhatsApp corporativo (Twilio, Z-API) para MVP e fase inicial. | Disparo imediato, compatível com qualquer dispositivo, sem custo operacional por mensagem. |
| **ADR-05** | **Isolamento de Admin via Rota `/admin`** | Não poluir a tela inicial de clientes e oficinas com botões de administrador. | Maior segurança por obscuridade e navegação limpa para usuários comuns. |

---

## 📊 4. Estrutura de Arquivos do Projeto

```
DNA-AUTO/
├── public/                      # Frontend SPA (Vanilla JS + CSS moderno)
│   ├── css/                     # Sistema de Design Tokens
│   │   ├── variables.css        # Paleta (Amarelo #FFD21C, Obsidiana, Cinzas)
│   │   ├── base.css             # Tipografia e resets
│   │   ├── components.css       # Botões, cards, modais, formulários
│   │   ├── dossier.css          # Estilos do Dossiê 360° e Score
│   │   └── print.css            # Layout de impressão para laudos
│   ├── js/                      # Lógica de negócio no cliente
│   │   ├── api.js               # Cliente HTTP centralizado
│   │   ├── app.js               # Orquestrador de rotas, RBAC e sessão
│   │   └── components/          # Módulos de tela
│   │       ├── landingView.js   # Landing Page Oficial (R$ 59,90)
│   │       ├── loginView.js     # Login, Cadastro e Esqueci Minha Senha
│   │       ├── adminView.js     # Painel Admin (Faturamento, Clientes, WhatsApp)
│   │       ├── workshopView.js  # Painel da Oficina Credenciada
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
│       │   ├── schema.sql       # DDL das tabelas relacionais
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
│       │   ├── workshops/       # gestão da oficina parceira
│       │   ├── reports/         # emissão e autenticação de laudos de venda
│       │   └── transfers/       # transferência de propriedade de veículo
│       └── server.js            # Aplicação Express e montagem das rotas
├── test/
│   └── api.test.js              # Bateria com 16 testes automatizados
├── index.js                     # Entrypoint raiz para deploys em nuvem
├── src/index.js                 # Entrypoint secundário para Render Cloud
├── package.json                 # Manifesto de dependências e scripts
├── README.md                    # Manual completo do projeto
└── DIARIO_DE_BORDO.md           # Este documento de histórico de engenharia
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
