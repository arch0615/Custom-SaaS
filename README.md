# Customs SaaS

Plataforma para despachantes aduaneiros gerenciarem processos de importação e
exportação, com portal do cliente para acompanhamento em tempo real.

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind 4** · **shadcn/ui**
- **PostgreSQL 16** via **Drizzle ORM** (`pg` driver)
- **Auth.js v5** com `@node-rs/argon2`
- **S3-compatible** file storage (driver pluggable, local FS por padrão)
- **Resend** para e-mails transacionais
- **recharts** para o dashboard

## Quick start (dev)

```bash
# 1. Postgres local (escolha um)
docker compose up -d postgres   # OR instale Postgres 16 e ajuste DATABASE_URL

# 2. Dependências
pnpm install

# 3. Configurar env
cp .env.example .env
# Edite .env: gere AUTH_SECRET com `openssl rand -base64 32`,
# defina TRACKING_WEBHOOK_SECRET, mantenha STORAGE_DRIVER=local

# 4. Migrações
pnpm drizzle-kit migrate

# 5. Criar o primeiro admin
pnpm tsx scripts/seed-admin.ts \
  --org "Sua Empresa" \
  --email admin@vc.com \
  --name "Seu Nome"

# 6. Subir o app
pnpm dev
# → http://localhost:3000
```

## Deploy para produção

### 1) Postgres

Provisione um Postgres 16+ gerenciado. Opções recomendadas:

- **Neon** (recomendado) — free tier, point-in-time recovery
- **Railway** / **Fly.io** — pague pelo uso
- **AWS RDS** / **DO Managed PG** — empresas maiores

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 2) File storage

Provisione um bucket S3-compatível:

- **Cloudflare R2** (recomendado) — $0 de egress, ~$0.015/GB/mês
- **AWS S3**, **MinIO** self-hosted

```bash
STORAGE_DRIVER="s3"
S3_BUCKET="customs-documents"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_REGION="auto"
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
S3_FORCE_PATH_STYLE="false"
```

O driver é trocado no boot por `STORAGE_DRIVER`. Sem essa var, o app cai no
filesystem local.

### 3) Resend (e-mail)

1. Crie conta em resend.com, verifique o domínio do `From:`
   (SPF/DKIM/DMARC).
2. Gere uma API key com escopo de envio apenas.

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="Sua Empresa <noreply@suaempresa.com>"
```

Sem essas vars o app continua funcionando — `sendEmail()` é um no-op, então
as ações que enviariam e-mail (convites, notificações) ainda inserem o
registro in-app, só não disparam o e-mail.

### 4) Variáveis em prod

| Var | Valor |
|-----|-------|
| `DATABASE_URL` | (do passo 1) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | URL pública (e.g. `https://app.suaempresa.com`) |
| `AUTH_TRUST_HOST` | `true` |
| `RESEND_API_KEY` | (do passo 3) |
| `EMAIL_FROM` | (do passo 3) |
| `STORAGE_DRIVER` | `s3` |
| `S3_*` | (do passo 2) |
| `TRACKING_WEBHOOK_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | mesma URL pública |
| `NEXT_PUBLIC_APP_NAME` | nome da empresa |

### 5) Migrações em prod

```bash
DATABASE_URL="postgresql://..." pnpm drizzle-kit migrate
```

### 6) Criar o primeiro admin em prod

```bash
DATABASE_URL="postgresql://..." \
  pnpm tsx scripts/seed-admin.ts \
  --org "Empresa do cliente" \
  --email cliente@empresa.com \
  --name "Cliente"
```

Anote a senha — ela aparece **uma vez**.

### 7) Smoke check em prod

Logue como o admin recém-criado e percorra:

1. `/app` — dashboard carrega (KPIs zerados)
2. `/app/customers/new` — cria um cliente com CNPJ válido
3. `/app/processes/new` — cria um processo com os 14 campos
4. Detalhe do processo: avança uma etapa; aba **Timeline** mostra o evento
5. Aba **Documentos**: upload de um PDF; download de volta
6. `/app/team` → convidar membro → copiar link de convite → aceitar em
   outro navegador
7. `/app/customers/<id>` → aba **Contatos** → adicionar contato com "Acesso
   ao portal" marcado → seguir o link → ver `/portal` como esse cliente

Queries úteis para diagnosticar problemas estão em
[`docs/operations.md`](docs/operations.md).

## Comandos úteis

```bash
pnpm dev                                # servidor de desenvolvimento
pnpm build && pnpm start                # produção local
pnpm drizzle-kit migrate                # aplica migrações pendentes
pnpm drizzle-kit generate               # gera migração após mudar schema
pnpm tsx scripts/seed-admin.ts ...      # cria admin
pnpm tsx scripts/cross-org-probe.ts     # roda 11 probes de isolamento
pnpm audit                              # checa CVEs
```

## Documentos

- [`docs/operations.md`](docs/operations.md) — checklist pré-deploy, backups,
  rate-limiting, queries de diagnóstico
- [`docs/tracking-webhook.md`](docs/tracking-webhook.md) — contrato do
  webhook de tracking automático (Fase 2)
- [`docs/extending.md`](docs/extending.md) — como adicionar uma etapa nova,
  um tipo de notificação, ou plugar SeaRates/Vizion

## Roadmap

- **MVP (entregue)** — login, dashboard, clientes, processos, timeline,
  documentos, portal do cliente, convites, notificações in-app + e-mail
- **Fase 2** — integração SeaRates/Vizion (webhook stub pronto),
  upload pelo cliente, preferências de notificação, busca/filtros,
  logo upload
- **Fase 3** — IA: OCR de invoice/BL, resumo de processo, chat do cliente
  no portal, detecção de pendências
