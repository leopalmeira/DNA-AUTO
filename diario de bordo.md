# 📓 DIÁRIO DE BORDO — PROJETO DNA AUTO
## Registro Oficial de Engenharia, Entregas, Decisões e Evolução Contínua

> **Plataforma:** DNA AUTO — Identidade e Histórico Digital Permanente de Veículos  
> **Versão:** 1.2.0 Enterprise  
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
  - Sidebar fixa de 260px com 10 módulos organizados em acordeom expansível e gaveta responsiva móvel via botão `☰` com fechamento automático.
  - Barra de status de rede com indicador pulsante `🟢 REDE DNA AUTO ONLINE` e popover de notificações rápidas `🔔` consolidando pendências operacionais.
- **Módulo de Recepção e Balcão:**
  - Duplo fluxo operacional: busca instantânea de veículos cadastrados (por placa, chassi, modelo ou cliente) com abertura de *Ficha Digital do Veículo* e botão de cadastro de novos carros.
  - 6 Cards de KPIs dinâmicos (Faturamento, O.S. Ativas, Carros no Box, Alertas Preditivos, Ativações DNA e Comissões).
  - 6 Ações Rápidas de Balcão para agilidade dos recepcionistas e consultores técnicos.
- **Radar Preditivo OBD2 (Telemetria Integrada ao App do Cliente):**
  - Semáforos visuais em tempo real por quilometragem e tempo de uso:
    - 🔴 **VENCIDO / URGENTE:** Correia dentada e óleo de câmbio automático ATF/CVT vencidos.
    - 🟡 **ATENÇÃO / PRÓXIMO:** Pastilhas de freio e óleo do motor a menos de 1.200 km da revisão.
    - 🟢 **EM DIA / OK:** Velas, filtros e fluidos revisados.
  - Disparo de mensagens personalizadas no WhatsApp oficial do proprietário com cálculo de riscos de quebra e valores estimados de serviço.
- **Central de Agendamentos Inteligente com Prevenção de Conflitos:**
  - Sugestão automática de 3 opções de datas e horários úteis futuros para envio ao cliente.
  - Nova tabela no banco de dados SQLite: `workshop_appointments`.
  - Rotas REST com validação de colisão de horários (`HTTP 409 Conflict`), listagem e atualização de status operacional (`PENDING`, `CONFIRMED`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`).
- **Garantias de Engenharia:**
  - 20/20 testes automatizados passando com 100% de sucesso.
  - Nenhuma alteração na Landing Page pública nem nos fluxos protegidos de autenticação.

---

## 🏛️ Diretrizes e Convenções Persistentes
1. **Controle de Versão Git:** Todas as modificações de código e documentação devem ser seguidas de commit limpo e push para a branch `master` no repositório remoto GitHub.
2. **Registro Contínuo:** Todo novo ciclo ou alteração relevante de engenharia deve ser imediatamente documentado no `diario de bordo.md`, no `DIARIO_DE_BORDO.md` e refletido no `README.md`.
3. **Comunicação:** Atendimento sempre no idioma português.
4. **Validação de Testes:** O comando `npm test` deve sempre permanecer com 100% dos testes aprovados antes de qualquer publicação.
