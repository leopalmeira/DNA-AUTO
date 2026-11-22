# DNA AUTO — Cloudflare Pages, instalação independente

Branch: `infra/cloudflare-gratuito`.

Três projetos Pages no mesmo GitHub (root directory na raiz do repositório, framework `None`):

| Aplicativo | Build command | Output directory |
| --- | --- | --- |
| Cliente | `node cloudflare/pages/build.cjs cliente` | `cloudflare/pages/dist-cliente` |
| Oficina | `node cloudflare/pages/build.cjs oficina` | `cloudflare/pages/dist-oficina` |
| Admin | `node cloudflare/pages/build.cjs admin` | `cloudflare/pages/dist-admin` |

O CI de implantação `.github/workflows/deploy-cloudflare-free.yml` provisiona os três projetos quando for ativado com credenciais Cloudflare autorizadas. Os nomes/URLs são resolvidos em tempo de execução e aparecerão no **resumo do GitHub Actions somente depois de verificados**. Nenhum site foi publicado por esta documentação.

Quatro variáveis de ambiente HTTPS são obrigatórias em cada build:
- `DNA_API_BASE_URL` — Worker, terminando com `/api/v1`.
- `DNA_CLIENT_BASE_URL` — Pages Cliente.
- `DNA_OFICINA_BASE_URL` — Pages Oficina.
- `DNA_ADMIN_BASE_URL` — Pages Admin.

O script recusa URLs com host legado `onrender.com`, injeta a API apenas nas cópias e substitui URLs antigas em arquivos estáticos gerados. Os fontes do GitHub permanecem iguais.

## Testes

`node --test cloudflare/pages/build.test.cjs`

Um build bem-sucedido não comprova que os aplicativos têm backend funcional. A API Workers D1 ainda está parcialmente adaptada; várias funções antigas continuam não disponíveis. Não anunciar como produto pronto antes de testar fluxos reais e todos os módulos necessários.

O banco D1 começa vazio, exceto pelas definições de tabela e perfis. Nenhum dado de servidor anterior será importado.
