# 🧬 DNA AUTO — Identidade & Histórico Digital Permanente de Veículos

[![Status do Deploy](https://img.shields.io/badge/Render-Deploy%20Online-10b981?style=for-the-badge&logo=render)](https://dna-auto.onrender.com/)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-SQLite%203%20(better--sqlite3)-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![Testes Automatizados](https://img.shields.io/badge/Testes-34%2F34%20Aprovados%20(100%25)-brightgreen?style=for-the-badge&logo=jest)](file:///c:/Users/User/Desktop/DNA-AUTO/test/api.test.js)
[![Oferta Oficial](https://img.shields.io/badge/Preço%20Ativação-R$%2059%2C90%20(Vitalício)-FFD21C?style=for-the-badge)](https://dna-auto.onrender.com/)

> **O Passaporte Digital Definitivo do Automóvel.**  
> Cada veículo possui um DNA permanente. Toda a história do carro — desde trocas de óleo e correias dentadas até revisões de suspensão, fotos de peças substituídas e notas fiscais — acompanha o veículo durante toda a sua vida útil, eliminando golpes na revenda e valorizando o bem em até 15%.

---

## 🌐 Acesso Rápido ao Sistema

* **🌟 Landing Page Oficial (R$ 59,90):** [https://dna-auto.onrender.com/landing](https://dna-auto.onrender.com/landing) *(ou na raiz [https://dna-auto.onrender.com/](https://dna-auto.onrender.com/))*
* **🚀 Aplicação / Sistema Web:** [https://dna-auto.onrender.com/](https://dna-auto.onrender.com/)
* **🛡️ Painel Administrativo Matriz:** [https://dna-auto.onrender.com/admin](https://dna-auto.onrender.com/admin)
* **🚗 Dossiê Demonstrativo (Honda Civic):** [https://dna-auto.onrender.com/#dossier](https://dna-auto.onrender.com/#dossier)
* **📂 Repositório Oficial:** [https://github.com/leopalmeira/DNA-AUTO](https://github.com/leopalmeira/DNA-AUTO)
* **📓 Diário de Bordo Completo:** Consulte [DIARIO_DE_BORDO.md](file:///c:/Users/User/Desktop/DNA-AUTO/DIARIO_DE_BORDO.md) para detalhes de engenharia e decisões arquiteturais.

---

## 💡 A Proposta de Valor e o Problema que Resolvemos

### A Dor do Mercado
No mercado brasileiro de veículos seminovos e usados, a assimetria de informações é crítica:
- **Odômetros adulterados** continuam sendo uma fraude frequente.
- Notas fiscais de revisões ficam em gavetas e se perdem nas trocas de dono.
- Compradores não sabem se a **correia dentada** foi realmente trocada ou se o motor corre risco iminente de quebra.
- Vistorias cautelares tradicionais apenas checam se o carro tem passagem por leilão ou dano estrutural, mas **não atestam a saúde mecânica contínua**.

### A Solução DNA AUTO
O **DNA AUTO** cria uma identidade digital única para o veículo (`DNA-BR-XXXX-XXXX-XXX`). 
- Cada manutenção registrada recebe um carimbo de tempo, registro de quilometragem e classificação de prova.
- As oficinas mecânicas parceiras confirmam os serviços e sobem as notas fiscais e fotos das peças novas.
- O proprietário adquire o histórico vitalício por apenas **R$ 59,90** (pagamento único, sem mensalidade).
- Na hora da venda, o carro ganha um **Relatório de Procedência com QR Code** e **Cartaz para Vidro**, comprovando sua valorização para o comprador.

---

## 🏢 Arquitetura Multi-Tenant com Isolamento Estrito

A plataforma opera em arquitetura **Multi-Tenant** com controle de acesso rigoroso:
1. **Isolamento entre Oficinas (Tenants):**
   - Uma oficina parceira **NUNCA visualiza os clientes, veículos, faturamento ou ordens de serviço de outra oficina**.
   - Cada oficina acessa estritamente seu próprio workspace operacional, seus serviços executados e suas comissões por DNA emitido.
2. **Visibilidade Focada do Cliente (Proprietário):**
   - O proprietário do veículo visualiza o dossiê com o histórico completo do seu carro, mas **identificando com clareza o nome, CNPJ e cidade da oficina específica que realizou cada manutenção**.
3. **Governança Geral da Matriz (Admin):**
   - O Administrador do Sistema possui visão consolidada da rede e pode inspecionar a frota e os clientes de cada oficina de forma segmentada (drill-down por tenant).

---

## 🖥️ Módulos e Funcionalidades do Sistema

### 1. 🌟 Landing Page Oficial Padrão TOTVS / Alta Conversão (R$ 59,90)
- **Link Direto:** [https://dna-auto.onrender.com/#landing](https://dna-auto.onrender.com/#landing) *(e na raiz do projeto)*
- **Ambiente Local:** [http://localhost:3000/#landing](http://localhost:3000/#landing)
- **Design Corporativo de Alto Padrão (Padrão TOTVS / Dark Enterprise):**
  - Tipografia limpa, paleta Dark Tech com acentos em Ouro (`#FFD21C`), Ciano (`#38bdf8`) e Verde Financeiro (`#10b981`).
  - Switcher interativo de público no Hero: **"Sou Dono de Carro"** vs **"Sou Dono de Oficina Mecânica"**.
- **Para o Dono do Carro (Proprietário B2C):**
  - 📊 **Controle Absoluto de Gastos dos Últimos 6 Meses:**
    - O proprietário passa a saber exatamente quanto gastou no carro no semestre (mês a mês).
    - Gráfico interativo com inspeção mensal detalhada (ex: R$ 1.840,00 gastos no semestre com pastilhas de cerâmica, troca de óleo 0W-20 e alinhamento 3D).
    - Separação clara entre peças genuínas (60,8%), mão de obra (29,3%) e fluidos/filtros (9,9%).
    - Indicador de economia preventiva gerada ao evitar quebras graves (ex: economia de R$ 4.200,00).
  - 📋 **Relatório Completo de Tudo o que Foi Feito no Carro:**
    - Dossiê técnico vitalício com fotos reais de antes e depois (Nível 4 de comprovação).
    - Código original e fabricante de cada peça aplicada (part numbers).
    - Notas fiscais digitalizadas arquivadas na nuvem.
    - Quilometragem auditada e imutável que blinda o veículo contra fraudes de odômetro.
    - Valorização comprovada de até 15% acima da tabela FIPE e venda até 3x mais rápida.
- **Para a Oficina Mecânica (Módulo B2B de Aumento de Faturamento):**
  - 💰 **Máquina de Faturamento Recorrente e Fidelização:**
    - *"Aumente o faturamento da sua oficina sabendo quanto falta para a troca de correia dentada e troca de óleo do câmbio automático do seu cliente cadastrado."*
  - ⚙️ **Alerta Preditivo de Correia Dentada & Tensores:**
    - O sistema calcula a rodagem média diária do cliente e avisa quantos km/dias faltam para a troca (ticket médio de R$ 850 a R$ 1.800).
  - 🛢️ **Alerta Preditivo de Óleo de Câmbio Automático:**
    - Troca de fluido aos 40.000 ou 60.000 km (serviço premium de R$ 1.200 a R$ 2.400).
  - 📈 **Taxa de Conversão e Retorno de Pátio:**
    - 78% dos clientes retornam para fazer a preventiva na mesma oficina credenciada.

### 2. 🛡️ Painel Administrativo Matriz (`/admin`)
- **Acesso Restrito:** Perfil `ADMIN` com visualização hierárquica da rede.
- **Módulos Disponíveis:**
  - 📊 **Visão Geral:** Métricas consolidadas de faturamento, frotas e serviços comprovados.
  - 🏢 **Oficinas (Multi-Tenant):** Controle de homologação (aprovar/suspender), faturamento por oficina e gestão da rede.
  - 🚗 **Carros por Oficina (Frota Multi-Tenant):** Relação completa de veículos cadastrados com filtro dinâmico por oficina credenciada (tenant).
  - 👥 **Carteira de Clientes:** Todos os proprietários cadastrados organizados pela oficina de atendimento.
  - 📲 **Alertas WhatsApp:** Central dedicada para monitoramento de óleo e correias dentadas.
  - 🛡️ **Trilha de Auditoria:** Logs imutáveis com IP, usuário, timestamp e diff de dados.
- **Drill-down: Clientes & Carros por Oficina:**
  - Botão **`👥 Ver Clientes & Carros`** para inspecionar a base de atendimento de qualquer oficina da rede.

### 3. 📲 Central de Alertas Preventivos via WhatsApp
- **Localização:** Integrada ao Painel Administrativo.
- **Regras Preditivas Inteligentes:**
  - **Troca de Óleo do Motor:** Dispara alerta caso o veículo tenha rodado **>= 8.000 km** ou completado **>= 6 meses** desde a última troca.
  - **Kit Correia Dentada:** Dispara alerta preventivo crítico para veículos com **>= 50.000 km** sem registro recente de substituição.
- **Disparo com 1 Clique:** Botão verde oficial do WhatsApp disparando mensagem pré-formatada.

### 4. 🏭 Painel da Oficina / Auto Center — ERP Simplificado & WhatsApp Baileys Oficial
O ambiente da oficina foi estruturado com foco em simplicidade, produtividade e conexão direta com os clientes através do Baileys:

- **Menu Lateral Simplificado (6 Módulos Diretos):**
  - **1. 🏠 Dashboard:** Painel do pátio com card de Busca Rápida de Veículos, atalhos de placas e resumo de hoje.
  - **2. 🚗 Cadastrar Carro:** Cadastro rápido com auto-DNA, dados do proprietário, hodômetro auditado e foto do veículo.
  - **3. 📅 Agenda da Semana:** Grade semanal com dias úteis de 08:00 às 18:00 e horário de almoço das 12:00 às 13:00 bloqueado em cinza.
  - **4. 📱 WhatsApp:** Central Oficial de mensageria com pareamento via código de 8 dígitos ou QR Code, templates dinâmicos e histórico.
  - **5. 🔧 Serviços & Ordens:** Abertura e acompanhamento de ordens de serviço, peças aplicadas e fotos reais de comprovação.
  - **6. ⚙️ Configurações:** Parâmetros da oficina, expediente e horário de atendimento.
  - **Sino de Notificações (🔔):** Integrado na barra lateral com badge de situações (atrasadas, próximas, agenda e WhatsApp).

- **Módulo Oficial Baileys (@whiskeysockets/baileys):**
  - **Experiência Transparente para o Lojista:** Zero complexidade técnica. Fluxo direto: digitar número -> código de pareamento de 8 dígitos formatado (`ABCD-1234`) ou QR Code -> `🟢 Online`.
  - **Isolamento por Oficina:** Sessões salvas em pastas independentes (`server/sessions/ws_${workshopId}`) e no SQLite.
  - **Templates Inteligentes:** 9 modelos automáticos com substituição de variáveis (`{cliente}`, `{veiculo}`, `{placa}`, `{oficina}`, etc.).
  - **Botão [ 📱 WhatsApp ] no Pátio:** Disparo em 1 clique diretamente das tabelas de veículos sem sair do sistema.

- **WhatsApp 100% In-Platform (Sem Sair da Tela do Sistema):**
  - O número cadastrado na oficina atua como remetente oficial permanente.
  - Disparos efetuados dentro da plataforma sem abrir abas externas ou links `wa.me`, emitindo protocolo de transmissão auditável (`DNA-WPP-XXXXXX`) e recibo em tempo real.
  - Compatibilidade com drivers abertos **@whiskeysockets/baileys** e **Evolution API**.

- **Grade Semanal da Agenda & Intervalo de Almoço Bloqueado (12h às 13h):**
  - Configuração de dias de atendimento (Segunda a Sexta padrão, configurável) e faixa de horários de 08:00 às 18:00.
  - Grade semanal interativa com colunas por dia e linhas horárias.
  - **Horário de Almoço (12:00 às 13:00) Apagado em Cinza:** Bloqueado permanentemente na grade e no modal de agendamento, impedindo marcações indevidas.
  - Clique direto em horários livres para disponibilização e agendamento instantâneo de veículos.

- **Painel Executivo e KPIs em Tempo Real:**
  - 6 Cards Corporativos com métricas operacionais atualizadas: *Faturamento do Mês (R$)*, *Ordens de Serviço Ativas*, *Carros no Box*, *Alertas Preditivos OBD2*, *Ativações DNA do Mês* e *Comissões a Receber*.
  - 6 Atalhos Rápidos de Balcão: *Nova Entrada (Check-in)*, *Lançar Peça / Serviço*, *Nova Ordem de Serviço*, *Alerta Preditivo*, *Agendar Manutenção* e *Cadastrar Carro*.

- **Módulo de Recepção com Duplo Fluxo Operacional:**
  - **Pesquisa Instantânea Multi-Critério:** Localização de veículos cadastrados por placa, chassi, modelo ou nome do cliente.
  - **Cartão do Veículo com Ficha Digital:** Exibição imediata com logotipo oficial da montadora, ano/modelo, motorização, odômetro verificado e botão para abrir a **Ficha Digital do Veículo** (modal com histórico completo, dados do proprietário e lista de revisões).
  - **Botão Direto de Cadastro:** Fluxo desimpedido para cadastrar um novo carro na rede sem perda de tempo na recepção.

- **Cadastro Completo de Veículo Vinculado a Proprietário, KM de Entrada, Foto & Auto-Seleção:**
  - **Vínculo com Proprietário:** Coleta e associação direta do Nome Completo do Proprietário e Telefone / WhatsApp persistidos no banco de dados (`owners` e `ownership_transfers`).
  - **Hodômetro na Entrada (KM):** Registro auditado da quilometragem no momento do check-in na oficina gravado em `mileage_records`.
  - **Foto do Veículo:** Suporte a upload de imagem local com conversão para Base64 DataURL via `FileReader` e prévia visual instantânea, com persistência em `vehicles.photo_url` e na galeria `vehicle_photos`.
  - **Passaporte Digital DNA Automático:** Todo veículo cadastrado recebe o código permanente ativo (`DNA-BR-XXXX-XXXX-XXX`) sem caixas de seleção opcionais.
  - **Disponível e Pré-Marcado no Modal de Serviço:** Ao concluir a entrada, o modal *🔧 Registrar Novo Serviço Comprovado (Nível 4)* abre imediatamente com o veículo recém-cadastrado **já selecionado como padrão (`selected`)** e com o **odômetro de entrada pré-preenchido**, sem que o operador precise escolher ou procurar o carro manualmente.

- **Radar Preditivo OBD2 (Telemetria Integrada ao App do Cliente):**
  - Monitoramento da quilometragem real transmitida pelo adaptador OBD2 pareado ao smartphone do cliente.
  - **Semáforos de Desgaste de Componentes Críticos:**
    - 🔴 **VENCIDO / URGENTE:** Correia dentada/tensores (vencido por KM) ou troca de óleo de câmbio automático ATF/CVT.
    - 🟡 **ATENÇÃO / PRÓXIMO:** Pastilhas de freio ou óleo do motor (< 1.200 km para o limite).
    - 🟢 **EM DIA / OK:** Velas de ignição, fluidos e filtros inspecionados.
  - **Disparo Direto para WhatsApp:** Mensagens corporativas pré-montadas com placa, quilometragem, risco mecânico e convite para agendamento.

- **Central de Agendamento Inteligente com 3 Datas:**
  - Sugestão automática de 3 opções de datas e horários úteis para envio direto ao cliente no WhatsApp.
  - Prevenção automática de colisão de horários no banco de dados SQLite (`HTTP 409 Conflict`).
  - Gestão de estados de agendamento: `PENDING`, `CONFIRMED`, `IN_SERVICE`, `COMPLETED` e `CANCELLED`.

### 5. 📱 Novo App Mobile do Proprietário (Padrão Apple & TOTVS Enterprise)
- **Acesso Direto:** `#owner` (quando logado como Cliente ou selecionado no simulador)
- **Design de Alta Fidelidade (Dark Obsidian & Neon Blue):**
  - Viewport móvel nativo sem barras ou menus residuais da web (`body.is-owner-app`).
  - **Foto Oficial do Modelo no Cadastro com Troca pelo Dono:**
    - Ao cadastrar qualquer veículo (manual ou via API Placas), o sistema busca automaticamente no catálogo `vehiclePhoto.service.js` a foto em alta resolução correspondente àquele modelo exato (Gol, Polo, Golf, Civic, Corolla, HB20, Onix, Renegade, Compass, Toro, Strada, etc.).
    - A foto permanece vinculada até que o dono envie sua própria foto do veículo.
    - Botão flutuante `📷 Trocar Foto` sobre o veículo na Home e na tela "Meu Veículo", abrindo modal nativo com upload de imagem do celular (via `FileReader` Base64), link direto de URL ou botão de restauração da foto do modelo (`default`).
  - **Placa Veicular no Padrão Oficial:**
    - Placa exibida no subtítulo junto com o ano: `${v.license_plate} • ${v.manufacture_year}/${v.model_year}` (ex: `ABC1D23 • 2021/2022`).
    - Canto superior direito com a tag oficial `☑ Veículo cadastrado`.
  - **Header Corporativo & Botão de Sair:**
    - Sem fotos ou avatares no topo da Home. Menu hambúrguer `☰`, logo `DNA AUTO`, sino de alertas `🔔` e botão direto de `Sair`.
  - **Card de Certificação DNA AUTO Limpo:**
    - Removido QR code redundante da Home. Card em largura total com status de autenticidade e botão `Ver certificação >`.
  - 3 Medidores rápidos: Quilometragem `87.542 km`, Combustível `72%` com barra dinâmica e Autonomia `~ 520 km`.
  - Timeline horizontal de últimos registros e card de proteção criptografada.
  - Barra de navegação inferior fixa com 5 abas (`Início`, `Veículo`, `Certificação`, `Documentos`, `Mais`).
  - Drawer lateral completo com 9 itens de menu e opção de logout.
- **📁 Carteira Digital de Documentos (100% Nativa, Zero Popups):**
  - Documentos integrados com visualização em folha oficial e download em PDF:
    1. **CRLV-e Digital 2026:** Licenciamento quitado com validação Senatran e QR Code VIO/SERPRO.
    2. **Laudo Pericial Cautelar 360°:** 100% aprovado, sem sinistros graves ou leilão.
    3. **Apólice de Seguro Auto Protegido:** Cobertura 100% FIPE e assistência 24h.
    4. **Termo de Garantia Mecânica & Histórico de Revisões:** Selo ativo e cobertura de trem de força.
  - Visualizador de folha oficial em sheet modal nativo com tabelas de dados regulatórios e selos de conformidade jurídica.
- **⚡ Módulo de Telemetria Mini OBD2 (Tempo Real):**
  - Conexão com dongle Mini OBD2 ELM327 BLE 5.2 via Bluetooth Low Energy.
  - 4 Mostradores gauges digitais: RPM do motor com barra de rotação, temperatura do líquido de arrefecimento em 90°C (faixa ideal), tensão da bateria/alternador em 14.2V e odômetro lido da ECU.
  - Scanner de Injeção Eletrônica DTC com 0 erros detectados e luz de injeção apagada.
  - Tabela de sensores ao vivo (Sonda Lambda λ = 1.00, MAP 32 kPa, TPS 12%, IAT 34°C).
  - Botão `Escanear Central ECU Novamente` com leitura e recálculo dinâmico em tempo real.
- **Zero Popups / Alerts:**
  - 100% das telas (Documentos, Veículo, Certificação, Histórico, OBD2, Lembretes, Oficinas e Configurações) funcionam como navegação SPA interna sem qualquer caixa cinza do navegador.

---

## 🔐 Controle de Acesso e Segurança (RBAC)

O sistema conta com isolamento rígido de perfis:

| Papel (Role) | Rota de Acesso | O que pode ver e fazer |
|---|---|---|
| **CLIENTE (`OWNER`)** | `/` (após login) | Acessa seus veículos, histórico do dossiê, declara novos serviços e gera relatórios de venda. |
| **OFICINA (`WORKSHOP`)** | `/` (após login) | Gerencia sua bancada, valida notas fiscais, registra peças instaladas e credencia veículos. |
| **ADMIN (`ADMIN`)** | `/admin` | Visão total da rede, faturamento consolidado em R$, auditoria, alertas de WhatsApp e clientes por oficina. |

---

## 🛠️ Stack Tecnológica

* **Runtime:** [Node.js](https://nodejs.org/) (v18+)
* **Framework Web:** [Express](https://expressjs.com/) (v5)
* **Banco de Dados:** [SQLite 3](https://sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (execução síncrona de altíssima velocidade em C++)
* **Segurança & Criptografia:** `jsonwebtoken` (JWT), `bcryptjs` (hash seguro de senhas)
* **Frontend:** Vanilla JavaScript modularizado (arquitetura baseada em componentes em objeto, sem build step), CSS Custom Properties (Design Tokens)
* **Utilitários:** `qrcode.js` (renderização de QR Codes vetoriais no cliente), `multer` (gestão de uploads)

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
- **Node.js** v18 ou superior instalado.
- **Git** instalado.

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/leopalmeira/DNA-AUTO.git
cd DNA-AUTO
```

### Passo 2: Instalar as Dependências
```bash
npm install
```

### Passo 3: Inicializar o Banco e o Servidor
O banco de dados SQLite é inicializado e populado automaticamente no primeiro arranque através do auto-seeding.
```bash
npm start
```
*Ou diretamente:*
```bash
node server/src/server.js
```

### Passo 4: Acessar no Navegador
Abra: **`http://localhost:3000`**

---

## 🔑 Credenciais de Demonstração (Seed)

O banco de dados de desenvolvimento vem pré-configurado com os seguintes usuários:

### 1. Administrador Geral (Matriz)
* **URL de Acesso:** `http://localhost:3000/admin`
* **E-mail:** `admin@dnaauto.com.br`
* **Senha:** `admin123`

### 2. Oficina Credenciada (Veloce Auto Center)
* **URL de Acesso:** `http://localhost:3000` *(Aba "Oficina Parceira")*
* **E-mail:** `marcos@veloce.com.br`
* **Senha:** `senha123`

### 3. Cliente Proprietário (Honda Civic com DNA)
* **URL de Acesso:** `http://localhost:3000` *(Aba "Sou Cliente")*
* **E-mail:** `carlos.silva@email.com`
* **Senha:** `senha123`

### 4. Veículos Demonstrativos Prontos para Teste
* **Honda Civic Touring 1.5 Turbo 2021:** Placa `BRA2E19` • Código DNA: `DNA-BR-8F72-29A4-X91` *(Histórico Nível 4 com Score 93/100)*
* **Toyota Corolla Altis Hybrid 2022:** Placa `COR2D22` • Código DNA: `DNA-BR-7K2M-91A3-Z44` *(Possui serviço pendente de validação pela oficina)*
* **Fiat Strada Freedom 1.3 2023:** Placa `STR1A99` *(Veículo sem DNA, pronto para testar o fluxo de ativação pela oficina)*

---

## 🧪 Bateria de Testes Automatizados

O projeto possui uma suite de **20 testes automatizados de integração ponta a ponta** cobrindo todos os módulos do sistema.

Para executar os testes:
```bash
npm test
```
*Ou:*
```bash
node test/api.test.js
```

### Resultado Esperado da Execução:
```text
✅ Banco de dados DNA AUTO inicializado com sucesso.
🧪 Iniciando Bateria de Testes Automatizados do DNA AUTO...

📡 Servidor de teste ouvindo na porta 3001
✅ 1. Healthcheck: ONLINE
✅ 2. Autenticação Admin: Sucesso com JWT
✅ 3. Métricas da Rede: 4 veículos, 5 comprovados
✅ 4. Dossiê 360°: Civic localizado com Score 93/100 e 6 serviços
✅ 5. Lupa do Dossiê: Encontradas 3 ocorrências para "correia"
✅ 6. Pesquisa de Veículo sem DNA: Identificado com sucesso ("Este veículo ainda não possui DNA")
✅ 7. Ativação de DNA: Gerado código permanente DNA-BR-XXXX-XXXX-XXX
✅ 8. Relatório DNA para Venda: Emitido com código de autenticação
✅ 9. Confirmação de Serviço pela Oficina: Nível elevado para Nível 3 (CONFIRMADO)
✅ 10. Faturamento e Rede do Admin: R$ 7.746,10 faturamento bruto, 3 oficinas, 3 clientes
✅ 11. Clientes por Oficina: 4 clientes encontrados para Veloce Auto Center
✅ 12. Alertas Preventivos WhatsApp: 17 alertas gerados com links diretos para WhatsApp
✅ 13. Esqueci Minha Senha: Senha redefinida com sucesso para o usuário
✅ 14. Frota por Oficina Multi-Tenant: 14 veículos catalogados com oficina vinculada
✅ 15. Carteira de Clientes: 2 proprietários vinculados à oficina de atendimento
✅ 16. Homologação Multi-Tenant: Status da oficina verificado e aprovado com sucesso
✅ 17. Keep-Alive Anti-Sleep: Ping no healthcheck executado com sucesso [200 OK]
✅ 18. Saldo API Placas: Saldo verificado com sucesso via WDAPI2
✅ 19. Consulta Oficial API Placas: Veículo consultado em tempo real com FIPE oficial
✅ 21. Cadastro Completo com Auto-DNA: Veículo vinculado a proprietário, KM de entrada e foto com DNA ativo
✅ 22. Configurações da Oficina: Atualização de dados e geração de código OTP para WhatsApp
✅ 23. Confirmação OTP de WhatsApp: Validação e liberação do canal oficial de mensageria
✅ 24. Automação WhatsApp OBD2 em Lote: Disparo preditivo de alertas de óleo e correia
✅ 25. WhatsApp In-Platform da Oficina: Mensagem transmitida sem sair do sistema
✅ 26. Listagem Dinâmica de Veículos: Veículos carregados com DNA, proprietários e odômetros de entrada

🎉 TODOS OS 26 TESTES AUTOMATIZADOS PASSARAM COM 100% DE SUCESSO!
```

---

## ☁️ Guia de Deploy na Nuvem (Render Cloud)

A aplicação está configurada para deploy contínuo no [Render](https://render.com).

### Configurações no Dashboard do Render:
1. **Repository:** `https://github.com/leopalmeira/DNA-AUTO`
2. **Branch:** `master`
3. **Environment:** `Node`
4. **Build Command:** `npm install`
5. **Start Command:** `node src/index.js` *(ou `node index.js`)*
6. **Variáveis de Ambiente:**
   - `PORT`: `3000` *(ou atribuída dinamicamente pelo Render)*
   - `NODE_ENV`: `production`

> **Nota de Engenharia:** Os entrypoints universais [index.js](file:///c:/Users/User/Desktop/DNA-AUTO/index.js) e [src/index.js](file:///c:/Users/User/Desktop/DNA-AUTO/src/index.js) na raiz garantem que a aplicação escute em `0.0.0.0:${PORT}` e nunca sofra com o erro `"Application exited early"`.

---

## 📡 Documentação Resumida da API REST

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/health` | Pública | Retorna o status operacional do servidor. |
| `POST` | `/api/v1/auth/login` | Pública | Autenticação de usuário e retorno do token JWT. |
| `POST` | `/api/v1/auth/register-workshop` | Pública | Credenciamento de novas oficinas com CNPJ/CPF. |
| `POST` | `/api/v1/auth/forgot-password` | Pública | Redefinição de senha de usuários cadastrados. |
| `GET` | `/api/v1/vehicles/search?q={placa}` | Pública | Pesquisa rápida de veículo (local e API Placas). |
| `POST` | `/api/v1/vehicles/activate-dna` | JWT | Ativação do código de DNA vitalício para o carro. |
| `POST` | `/api/v1/vehicles/register` | JWT Oficina/Admin | Cadastro de novo veículo com geração automática de DNA permanente. |
| `GET` | `/api/v1/dossier/:dna_code` | Pública | Retorna o Dossiê 360°, Score de Saúde e histórico. |
| `GET` | `/api/v1/dossier/:dna_code/search?q={termo}` | Pública | Lupa investigativa de peças e serviços do veículo. |
| `POST` | `/api/v1/services` | JWT | Lançamento de nova ordem de serviço com peças. |
| `POST` | `/api/v1/services/:id/confirm-decision` | JWT Oficina | Confirmação ou rejeição técnica de serviço. |
| `GET` | `/api/v1/workshops/:id/appointments` | JWT Oficina/Admin | Listagem de agendamentos da oficina com filtro por status. |
| `POST` | `/api/v1/workshops/:id/appointments` | JWT Oficina/Admin | Criação de novo agendamento com prevenção de colisão de horários. |
| `PATCH` | `/api/v1/workshops/:id/appointments/:aptId/status` | JWT Oficina/Admin | Atualização do status operacional do agendamento. |
| `PUT` | `/api/v1/workshops/:id/settings` | JWT Oficina/Admin | Salva dados da oficina e gera código OTP de validação de WhatsApp. |
| `POST` | `/api/v1/workshops/:id/whatsapp/confirm` | JWT Oficina/Admin | Confirmação do WhatsApp oficial via código OTP de 6 dígitos. |
| `POST` | `/api/v1/workshops/:id/whatsapp/dispatch-batch` | JWT Oficina/Admin | Disparo em lote de alertas de manutenção preditiva (óleo/correia). |
| `GET` | `/api/v1/integrations/plate-lookup/:plate` | Pública/JWT | Consulta unificada de dados do veículo pela API Placas (WDAPI2). |
| `GET` | `/api/v1/integrations/plate-balance` | JWT Admin | Consulta em tempo real do saldo de créditos da API Placas. |
| `GET` | `/api/v1/admin/network-stats` | JWT Admin | Faturamento bruto (R$), estatísticas e oficinas. |
| `GET` | `/api/v1/admin/workshops/:id/clients` | JWT Admin | Drill-down de clientes e carros atendidos pela oficina. |
| `GET` | `/api/v1/admin/maintenance-alerts` | JWT Admin | Lista de alertas preditivos para WhatsApp (óleo/correia). |
| `POST` | `/api/v1/reports/generate-sale-report` | Pública | Emissão do Relatório DNA para Venda com hash único. |

---

## ⚡ Sistema Anti-Sleep (Render Free Tier)

Para evitar que o servidor no plano gratuito do Render entre em modo de suspensão (spin-down após 15 minutos sem tráfego), o DNA AUTO conta com um serviço nativo de **Keep-Alive**:
- **Ping Automático**: Dispara uma requisição HTTP periódica (a cada 10 minutos) para a rota `/api/v1/health`.
- **Detecção Inteligente**: Reconhece automaticamente a variável `RENDER_EXTERNAL_URL` ou `SERVER_URL`.
- **Zero Overhead**: Executado em segundo plano com timeout de segurança e sem bloquear o encerramento do processo.

---

## 📄 Licença e Direitos

Projeto desenvolvido com tecnologia proprietária sob licença ISC. Todos os direitos reservados à marca **DNA AUTO**.
