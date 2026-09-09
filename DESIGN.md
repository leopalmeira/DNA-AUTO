---
version: 1.0.0
name: DNA AUTO Design System
description: Design tokens and UI rationale for DNA AUTO (Web Platform, Workshop ERP and Owner Mobile App)
colors:
  primary: "#0066FF"
  primary-glow: "rgba(0, 102, 255, 0.45)"
  primary-hover: "#1A75FF"
  cyan-neon: "#00D4FF"
  gold: "#FFD21C"
  gold-glow: "rgba(255, 210, 28, 0.35)"
  status-success: "#00E676"
  status-warning: "#F59E0B"
  status-danger: "#EF4444"
  bg-obsidian: "#050B14"
  bg-surface: "rgba(8, 16, 32, 0.88)"
  bg-card: "#0A1428"
  card-border: "rgba(0, 102, 255, 0.28)"
  text-primary: "#FFFFFF"
  text-secondary: "#94A3B8"
  text-dim: "#64748B"
typography:
  brand-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', sans-serif"
    fontSize: "20px"
    fontWeight: 900
    letterSpacing: "0.05em"
  section-heading:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Outfit', 'Inter', sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "-0.01em"
  body-default:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  mono-data:
    fontFamily: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace"
    fontSize: "12px"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "12px"
  lg: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# DNA AUTO — Design System

## Overview
O DNA AUTO utiliza estética automotiva de alto padrão: Dark Obsidian, Neon Blue, Cyan e Ouro (#FFD21C).
A interface é dividida em três pilares arquiteturais isolados:
1. **Landing Page Pública**: Foco em conversão e consulta de histórico (R$ 59,90).
2. **ERP da Oficina (`is-workshop-erp`)**: Painel corporativo (Padrão TOTVS + DNA AUTO) com visão de box, recepção, agenda e WhatsApp Baileys.
3. **App do Cliente / Proprietário (`is-owner-app`)**: Experiência mobile-first independente (Dark Obsidian / Neon Blue) com visão de garagem, saúde veicular em tempo real, certificação digital com QR Code e menu lateral drawer completo.

## Architecture Isolation
- **Regra de Escopo**: O App do Cliente opera em escopo total (`body.is-owner-app`), ocultando cabeçalhos e sidebars residuais do portal antigo.
- **Componentização**: Header próprio, Drawer Lateral com 9 opções, Card de Veículo, Timeline e Bottom Navigation Bar.
