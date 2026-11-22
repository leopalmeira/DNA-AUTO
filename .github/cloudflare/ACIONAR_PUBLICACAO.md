# Publicação Cloudflare autorizada — 22/11/2026

Este marcador aciona **somente** o workflow `.github/workflows/deploy-cloudflare-free.yml`
na branch `infra/cloudflare-gratuito`.

Objetivo: instalação NOVA e vazia nos serviços **Cloudflare Free**:
Cloudflare D1, Workers, Pages e Workers KV, **sem Render**.

O workflow depende de quatro segredos no GitHub Actions (não guardar valores aqui):
`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `DNA_JWT_SECRET`,
`DNA_BOOTSTRAP_TOKEN`.

Se algum não estiver disponível, a implantação deve falhar antes de chamar
Cloudflare. Não trocar a branch principal, não importar dados de outro host,
não publicar como produção até concluir a homologação no Cloudflare.
