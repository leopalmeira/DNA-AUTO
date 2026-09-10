---
version: 2.0.0
name: DNA AUTO Design System
description: Design tokens and UI rationale for DNA AUTO (Web Platform, Workshop ERP and Owner Mobile App) based on official layout map
colors:
  primary-dark: "#0F172A"
  primary-surface: "#1E293B"
  primary-blue: "#0066FF"
  primary-glow: "rgba(0, 102, 255, 0.45)"
  cyan-neon: "#00D4FF"
  gold: "#FFD21C"
  gold-glow: "rgba(255, 210, 28, 0.35)"
  status-success: "#10B981"
  status-attention: "#F59E0B"
  status-warning: "#F97316"
  status-error: "#EF4444"
  neutral-light: "#FFFFFF"
  neutral-gray: "#94A3B8"
  neutral-muted: "#64748B"
  bg-obsidian: "#050B14"
  bg-card: "#0A1428"
  card-border: "rgba(0, 102, 255, 0.28)"
typography:
  font-family-primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-family-display: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  font-family-mono: "'JetBrains Mono', 'SF Mono', 'Roboto Mono', monospace"
  h1:
    fontSize: "32px"
    lineHeight: "40px"
    fontWeight: 700
  h2:
    fontSize: "24px"
    lineHeight: "32px"
    fontWeight: 600
  h3:
    fontSize: "18px"
    lineHeight: "26px"
    fontWeight: 600
  h4:
    fontSize: "16px"
    lineHeight: "24px"
    fontWeight: 500
  body:
    fontSize: "14px"
    lineHeight: "22px"
    fontWeight: 400
  caption:
    fontSize: "12px"
    lineHeight: "18px"
    fontWeight: 400
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
---

# DNA AUTO — Design System Oficial

## 1. Visão Geral & Filosofia
O **DNA AUTO** adota uma estética automotiva de alto padrão combinando **Dark Obsidian**, **Azul Corporativo (#0066FF)**, **Neon Cyan (#00D4FF)** e toques de **Ouro (#FFD21C)** para certificação.
A interface é dividida em três pilares arquiteturais perfeitamente sincronizados:

1. **App do Cliente / Owner (Mobile-First):**
   - 10 Telas dedicadas com navegação inferior fixa (5 abas: *Início*, *Veículo*, *Certificação*, *Inspeção*, *Mais*) e menu lateral Drawer.
   - Veículo de referência oficial: **Honda Civic Touring 1.5 Turbo 2021/2022 (Placa BRA2E19, DNA-BR-BF72-29A4-X91)**.
   - Saúde veicular em tempo real: telemetria OBD2 BLE, laudo pericial 360° (98/100), revisões preventivas programadas (90.000 km) e alertas classificados por severidade.

2. **Painel da Oficina / Workshop (ERP Corporativo):**
   - 10 Módulos de gestão operacional de pátio com isolamento total de escopo (`body.is-workshop-erp`).
   - Sidebar fixa com atalhos de alta produtividade (Dashboard, Cadastrar Carro, Agenda da Semana, WhatsApp Central, Serviços & Ordens, Configurações).
   - Cockpit com 6 KPIs oficiais, 6 Ações Rápidas de balcão, Radar Preditivo OBD2 com semáforo, grade semanal de agendamentos e mensageria WhatsApp in-platform.

3. **Portal & Landing Pages B2C e B2B:**
   - Separação clara de públicos (`/`, `/cliente`, `/autocente`), com alta taxa de conversão e fidelidade visual.

## 2. Paleta de Cores e Semântica de Status
- **Primário:** `#0F172A` (Slate Dark), `#1E293B` (Slate Surface), `#0066FF` (Azul Ação) e `#00D4FF` (Cyan Glow).
- **Sucesso (Nível 4 / Em dia):** `#10B981` (Verde Esmeralda).
- **Atenção:** `#F59E0B` (Amarelo Âmbar).
- **Aviso:** `#F97316` (Laranja Alerta).
- **Erro / Vencido:** `#EF4444` (Vermelho Crítico).
- **Neutro & Tipografia:** `#FFFFFF` (Texto Puro), `#94A3B8` (Texto Secundário) e `#64748B` (Texto Técnico Dim).

## 3. Padrão de Componentes
- **Cards:** Fundo translúcido com borda de 1px suave, cantos arredondados (8px a 16px), títulos com semibold e botões pill para ações diretas.
- **Tabelas & Listagens:** Linhas com divisores sutis, badges coloridos de status e botões de ação rápida em 1 clique (ex: WhatsApp e Ficha Digital).
- **Gauges de Telemetria:** Dials em anel circular com valores em destaque e indicador de faixa de trabalho.
