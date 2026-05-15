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

## Deploy para produção (Ubuntu VPS)

Configuração assumida: um único Ubuntu 24.04 VPS rodando Postgres + a app
Node + Caddy como reverse-proxy. Documentos vão em disco local
(`STORAGE_DRIVER=local`). Para escalar para vários servidores depois, ative o
driver S3 (`STORAGE_DRIVER=s3`) — o código já está pronto.

### 1) Provisão na VPS

```bash
# Postgres + Caddy + Node
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib caddy curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm i -g pnpm@latest

# Usuário de aplicação
sudo useradd -m -s /bin/bash customs
sudo -u customs mkdir -p /home/customs/{app,storage}

# Postgres
sudo -u postgres createuser -P customs           # informe uma senha forte
sudo -u postgres createdb customs_saas -O customs
```

### 2) Clonar e configurar a app

```bash
sudo -u customs git clone https://github.com/arch0615/Custom-SaaS.git /home/customs/app
cd /home/customs/app

# Como o usuário customs:
sudo -u customs pnpm install
sudo -u customs cp .env.example .env
sudo -u customs nano .env
```

`.env` na VPS:

```bash
DATABASE_URL="postgresql://customs:<senha>@localhost:5432/customs_saas"

AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="https://app.suaempresa.com"
AUTH_TRUST_HOST="true"

RESEND_API_KEY="re_..."
EMAIL_FROM="Sua Empresa <noreply@suaempresa.com>"

STORAGE_DRIVER="local"
STORAGE_LOCAL_DIR="/home/customs/storage"

TRACKING_WEBHOOK_SECRET="<openssl rand -hex 32>"

NEXT_PUBLIC_APP_NAME="Sua Empresa"
NEXT_PUBLIC_APP_URL="https://app.suaempresa.com"
```

### 3) Migrações + admin

```bash
sudo -u customs pnpm drizzle-kit migrate
sudo -u customs pnpm tsx scripts/seed-admin.ts \
  --org "Sua Empresa" --email admin@suaempresa.com --name "Seu Nome"
```

A senha aleatória aparece **uma vez** — anote.

### 4) Build + systemd

```bash
sudo -u customs pnpm build

# Instalar a unit file
sudo cp /home/customs/app/docs/deploy/customs-saas.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now customs-saas
sudo systemctl status customs-saas
```

A app sobe em `127.0.0.1:3000`.

### 5) Caddy (HTTPS automático)

```bash
sudo cp /home/customs/app/docs/deploy/Caddyfile /etc/caddy/Caddyfile
sudo sed -i 's/app.example.com/app.suaempresa.com/' /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy renova certificados via Let's Encrypt automaticamente. Aponte o DNS A
de `app.suaempresa.com` para o IP da VPS antes de recarregar.

### 6) Backups

Cron diário do Postgres (3:30 AM):

```bash
sudo crontab -u customs -e
# adicione:
30 3 * * * pg_dump -Fc "$DATABASE_URL" > /home/customs/backups/$(date +\%F).dump 2>> /home/customs/backups/cron.log
0  4 * * * find /home/customs/backups -name "*.dump" -mtime +30 -delete
```

Também sincronize `/home/customs/storage` para um bucket remoto (opcional):

```bash
0 5 * * * rclone sync /home/customs/storage backup-remote:customs-storage
```

### 7) Smoke check em prod

Logue como o admin recém-criado e percorra:

1. `/app` — dashboard carrega (KPIs zerados)
2. `/app/customers/new` — cria um cliente com CNPJ válido
3. `/app/processes/new` — cria um processo com os 14 campos
4. Detalhe do processo: avança uma etapa; aba **Timeline** mostra o evento
5. Aba **Documentos**: upload de um PDF; download de volta
6. `/app/team` → convidar membro → copiar link de convite → aceitar em
   outro navegador
7. `/app/customers/<id>` → aba **Contatos** → adicionar contato com
   "Acesso ao portal" → seguir o link → ver `/portal` como esse cliente

Queries de diagnóstico estão em [`docs/operations.md`](docs/operations.md).

### Atualizações futuras

```bash
sudo -u customs bash -c "
  cd /home/customs/app
  git pull
  pnpm install
  pnpm drizzle-kit migrate
  pnpm build
"
sudo systemctl restart customs-saas
```

### (Opcional) Trocar para storage S3 mais tarde

Se um dia decidir escalar para mais de um servidor:

1. Crie um bucket Cloudflare R2 (ou AWS S3).
2. Suba os arquivos atuais: `rclone copy /home/customs/storage r2:customs-documents`.
3. Edite `.env`: `STORAGE_DRIVER=s3` + as 5 vars `S3_*`.
4. `sudo systemctl restart customs-saas`. Sem migração de banco.

---

## Alternativa: Postgres gerenciado + storage S3

Se preferir não rodar Postgres na VPS:

- **Postgres:** [Neon](https://neon.tech) (free tier com PITR), Railway, AWS RDS
- **Storage:** Cloudflare R2 ($0 egress) — defina `STORAGE_DRIVER=s3` no .env

A app em si pode rodar em qualquer host Node (Vercel também, *desde que* o
storage seja S3 — o filesystem do Vercel é efêmero).

### Resend (e-mail)

1. Crie conta em [resend.com](https://resend.com), verifique o domínio do
   `From:` (SPF/DKIM/DMARC).
2. Gere uma API key com escopo de envio apenas.

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="Sua Empresa <noreply@suaempresa.com>"
```

Sem essas vars o app continua funcionando — `sendEmail()` é um no-op, então
as ações que enviariam e-mail (convites, notificações) ainda inserem o
registro in-app, só não disparam o e-mail.

---

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
