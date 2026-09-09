# 🧬 DNA AUTO — Identidade & Histórico Digital Permanente de Veículos

[![Status do Deploy](https://img.shields.io/badge/Render-Deploy%20Online-10b981?style=for-the-badge&logo=render)](https://dna-auto.onrender.com/)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-SQLite%203%20(better--sqlite3)-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![Testes Automatizados](https://img.shields.io/badge/Testes-16%2F16%20Aprovados%20(100%25)-brightgreen?style=for-the-badge&logo=jest)](file:///c:/Users/User/Desktop/DNA-AUTO/test/api.test.js)
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
  - 🔄 **Alerta de Troca de Óleo do Câmbio Automático (ATF/CVT):**
    - Identifica clientes que estão atingindo os 40.000 a 60.000 km e alerta para o serviço de diálise de câmbio automático (serviço de alto ticket: R$ 1.600 a R$ 3.800).
  - ⚡ **Identificação Precoce de Falhas Antes do Carro Chegar na Oficina:**
    - Diagnóstico preditivo baseado em alertas prévios de sensores, histórico de queixas e desgaste acelerado de componentes.
    - A oficina prepara elevadores, peças e contata o cliente no WhatsApp antes da quebra na estrada.
  - 📲 **Radar Preditivo com Disparo de WhatsApp em 1 Clique:**
    - Mensagens prontas e personalizadas para agendamento direto com o cliente.
- **Simulador Interativo de Placa:**
  - Consulta pública imediata com as placas ativas da rede (`BRA2E19`, `ABC1D23`, `STR1A99`).

### 2. 🛡️ Painel Administrativo Matriz & ERP Multi-Tenant (`/admin`)
- **Menu Lateral Completo do Gestor de Sistema:**
  - 📊 **Painel Executivo:** Visão geral da rede com KPIs consolidando faturamento, oficinas e frota.
  - 💰 **Faturamento da Rede:** Extrato financeiro consolidado em R$, volume de serviços mecânicos, receita de ativações DNA (R$ 59,90) e comissões.
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
- **Disparo com 1 Clique:**
  - Botão verde oficial do WhatsApp disparando mensagem pré-formatada:
    > *"Olá [Nome do Dono]! Aqui é da equipe técnica do DNA AUTO / [Oficina]. Notamos que o seu [Carro] (Placa: [Placa]) está com [KM] km rodados. Conforme o manual do fabricante, é fundamental realizar a Troca Preventiva para evitar quebras no motor. Deseja agendar sua revisão gratuita na oficina?"*

### 4. 🔧 Painel da Oficina Credenciada (Service Desk)
- **Bancada Operacional:** Gestão de ordens de serviço pendentes de confirmação.
- **Registro de Serviços:** Lançamento de manutenções com seleção de categoria, quilometragem, peças utilizadas com part number e fotos.
- **Validação de Documentos:** Análise da foto/PDF da nota fiscal enviada pelo proprietário para elevação para Nível 3 ou 4.
- **Credenciamento de Novos Carros:** Emissão e ativação de novos códigos DNA diretamente na oficina.

### 5. 🚗 Painel do Proprietário & Dossiê 360°
- **Dossiê 360° Completo:** Visualização em linha do tempo com filtros e Score de Saúde (0 a 100).
- **Lupa Investigativa:** Campo de busca rápida no histórico (ex: pesquise *"óleo"* ou *"correia"* para achar o serviço exato).
- **Declaração de Serviços:** O próprio dono pode cadastrar serviços antigos que possui guardados em notas fiscais.
- **Relatório de Venda & Cartaz com QR Code:** Geração de laudo para anexar ao anúncio do carro e cartaz imprimível em PDF para colocar no vidro do veículo.

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

O projeto possui uma suite de **16 testes automatizados de integração ponta a ponta** cobrindo todos os módulos do sistema.

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
✅ 10. Faturamento e Rede do Admin: R$ 7.207,00 faturamento bruto, 3 oficinas, 3 clientes
✅ 11. Clientes por Oficina: 4 clientes encontrados para Veloce Auto Center
✅ 12. Alertas Preventivos WhatsApp: 8 alertas gerados com links diretos para WhatsApp
✅ 13. Esqueci Minha Senha: Senha redefinida com sucesso para o usuário
✅ 14. Frota por Oficina Multi-Tenant: 4 veículos catalogados com oficina vinculada
✅ 15. Carteira de Clientes: 2 proprietários vinculados à oficina de atendimento
✅ 16. Homologação Multi-Tenant: Status da oficina verificado e aprovado com sucesso

🎉 TODOS OS 16 TESTES AUTOMATIZADOS PASSARAM COM 100% DE SUCESSO!
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
| `GET` | `/api/v1/vehicles/search?q={placa}` | Pública | Pesquisa rápida de veículo e status do DNA. |
| `POST` | `/api/v1/vehicles/activate-dna` | JWT | Ativação do código de DNA vitalício para o carro. |
| `GET` | `/api/v1/dossier/:dna_code` | Pública | Retorna o Dossiê 360°, Score de Saúde e histórico. |
| `GET` | `/api/v1/dossier/:dna_code/search?q={termo}` | Pública | Lupa investigativa de peças e serviços do veículo. |
| `POST` | `/api/v1/services` | JWT | Lançamento de nova ordem de serviço com peças. |
| `POST` | `/api/v1/services/:id/confirm-decision` | JWT Oficina | Confirmação ou rejeição técnica de serviço. |
| `GET` | `/api/v1/admin/network-stats` | JWT Admin | Faturamento bruto (R$), estatísticas e oficinas. |
| `GET` | `/api/v1/admin/workshops/:id/clients` | JWT Admin | Drill-down de clientes e carros atendidos pela oficina. |
| `GET` | `/api/v1/admin/maintenance-alerts` | JWT Admin | Lista de alertas preditivos para WhatsApp (óleo/correia). |
| `POST` | `/api/v1/reports/generate-sale-report` | Pública | Emissão do Relatório DNA para Venda com hash único. |

---

## 📄 Licença e Direitos

Projeto desenvolvido com tecnologia proprietária sob licença ISC. Todos os direitos reservados à marca **DNA AUTO**.
