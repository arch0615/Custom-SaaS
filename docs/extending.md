# Extending guide

Pequenas receitas para tarefas que devem surgir em algumas semanas.

## Adicionar uma etapa nova ao processo

As 6 etapas atuais (`docs_received → shipment → in_transit → customs → released → delivered`)
vivem em três lugares que precisam combinar:

1. **Enum no banco** — `src/db/schema/processes.ts`:

   ```ts
   export const processStage = pgEnum("process_stage", [
     "docs_received",
     "shipment",
     "in_transit",
     "customs",
     "pre_loading",   // ← nova etapa, mantenha a posição certa
     "released",
     "delivered",
   ]);
   ```

   Gere a migração:

   ```bash
   pnpm drizzle-kit generate --name=add_pre_loading_stage
   pnpm drizzle-kit migrate
   ```

2. **Labels + ordem** — `src/lib/process-status.ts`:

   ```ts
   export const STAGE_ORDER: ProcessStage[] = [
     "docs_received", "shipment", "in_transit", "customs",
     "pre_loading",   // ← na mesma posição do enum
     "released", "delivered",
   ];

   export const STAGE_LABEL: Record<ProcessStage, string> = {
     ...,
     pre_loading: "Pré-embarque",
   };
   ```

3. **Schema de validação** — `src/lib/validation/process.ts`:

   ```ts
   const stageEnum = z.enum([
     "docs_received","shipment","in_transit","customs",
     "pre_loading",
     "released","delivered",
   ]);
   ```

   E o mesmo array em `stageSchema` dentro de
   `src/app/app/processes/[id]/actions.ts`.

4. **Recompilar** — após `pnpm dev` reiniciar, o seletor de etapas no
   detalhe do processo já mostra a nova opção e o `StageProgress` no
   portal renderiza com o número correto de passos.

Tudo o que depende de "delayed", "open", "isStageJump" etc. usa
`STAGE_ORDER` e segue funcionando automaticamente.

## Adicionar um tipo de notificação

Notificações são tipadas por `NotificationKind`. Para adicionar um novo
gatilho (ex.: "processo arquivado"):

1. **Enum no banco** — `src/db/schema/notifications.ts`:

   ```ts
   export const notificationKind = pgEnum("notification_kind", [
     ..., "process_archived",
   ]);
   ```

   Gere + aplique a migração.

2. **Tipos client-safe** — `src/lib/data/notifications-types.ts`:

   - Adicione `"process_archived"` na união `NotificationKind`
   - Adicione um rótulo em `NOTIFICATION_KIND_LABEL`
   - Adicione defaults em `NOTIFICATION_DEFAULTS`
     (e.g. `{ email: false, inApp: true }`)

3. **Template** — `src/lib/notifications/templates.ts`:

   ```ts
   case "process_archived":
     return {
       title: `${ref} arquivado`,
       body: null,
       href: processId ? `/app/processes/${processId}` : null,
       emailSubject: `Processo ${ref} arquivado`,
       emailText: `O processo ${ref} foi arquivado.`,
     };
   ```

4. **Disparar** — na ação que arquiva o processo:

   ```ts
   import {
     dispatchNotification,
     resolveCustomerClientUsers,
   } from "@/lib/notifications/dispatch";

   const recipients = await resolveCustomerClientUsers(orgId, customerId);
   await dispatchNotification({
     orgId,
     kind: "process_archived",
     payload: { processId, processReference, customerName },
     recipients,
   });
   ```

A bell e o e-mail respeitam o preference do usuário; defaults se aplicam
quando o usuário ainda não tem um override.

## Plugar SeaRates / Vizion (Fase 2)

A arquitetura já está pronta:

1. **Subscriptions** — quando o despachante salva um container/BL/AWB num
   processo, insira em `tracking_subscriptions`:

   ```sql
   INSERT INTO tracking_subscriptions
     (org_id, process_id, provider, ref_kind, external_ref)
   VALUES ($1, $2, 'searates', 'container', $3);
   ```

   (UI: adicione um campo na aba **Visão geral** do processo que cria/lista
   essas linhas; chame uma server action que insere via Drizzle.)

2. **Webhook** — informe o provedor:

   - URL: `https://app.<dominio>/api/webhooks/tracking`
   - Header: `X-Tracking-Signature: sha256=<hmac-sha256 do body>`
   - Secret: `TRACKING_WEBHOOK_SECRET` (mesmo valor do env)
   - Payload: ver [`tracking-webhook.md`](tracking-webhook.md)

   Se o provedor manda outro formato, escreva um adapter que recebe o
   payload deles, valida a assinatura DELES, traduz, e re-encaminha
   internamente para o webhook (mantém a tipagem do schema).

3. **Polling fallback** — se o provedor não der webhook confiável, crie
   um cron (Vercel Cron ou pg_cron) que, a cada N minutos, lê
   `tracking_subscriptions` e chama a API do provedor. Cada hit:

   - atualiza `last_polled_at`
   - se houver eventos novos, faz POST interno no webhook (mesmo
     idempotency via `provider_ref`)

4. **UI** — etiqueta automática na timeline já existe: eventos com
   `source = 'auto'` aparecem com ícone azul + badge "Automático".

5. **Cap por org** — para evitar bills surpresa, adicione um count antes
   de inserir uma nova subscription:

   ```ts
   const [{ count }] = await db
     .select({ count: sql<number>`count(*)::int` })
     .from(trackingSubscriptions)
     .where(eq(trackingSubscriptions.orgId, orgId));
   if (count >= ORG_TRACKING_LIMIT) throw new Error("Limite atingido");
   ```

## Adicionar um campo ao processo

Sempre tem dois caminhos:

- **Coluna real** — se for filtrável, buscável ou exibido em lista. Mude
  `src/db/schema/processes.ts`, gere migração, atualize
  `src/lib/validation/process.ts`, `src/components/processes/process-form.tsx`
  e o detalhe.

- **Dentro de `extra` JSONB** — para campos raros ou opcionais. Apenas
  leia/escreva via `process.extra` no client form e renderize quando
  presente. Sem migração. Quando começar a precisar filtrar pelo campo,
  promova para coluna real (~1h de trabalho).

## Trocar o storage driver

`STORAGE_DRIVER` aceita `local` (default) ou `s3`. Para adicionar um terceiro
(ex.: Google Cloud Storage), crie `src/lib/storage/gcs.ts` implementando a
interface `StorageDriver` (`put` / `get` / `delete`) e estenda o `switch` em
`src/lib/storage/index.ts:buildDriver()`.

## Adicionar uma role

Os 3 roles atuais (`broker_admin`, `broker_staff`, `client`) estão no enum
`member_role`. Adicionar `broker_viewer` (read-only):

1. Migra o enum.
2. Atualize `MemberRole` em `src/lib/auth/session.ts`,
   `src/lib/data/members.ts`, e os filtros em `filterNavByRole`.
3. Adicione checagens onde necessário (`if (role === "broker_viewer") return …`).
4. RBAC fica em camada de aplicação — não há RLS no DB hoje, então não
   precisa mexer no schema fora do enum.
