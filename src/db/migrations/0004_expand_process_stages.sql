-- Replace the 6-stage process_stage enum with the 14-stage workflow.
-- Old values are remapped to their closest analog in the new vocabulary
-- so existing processes + timeline events survive the migration.

-- 1. Drop default so the column can be retyped freely.
ALTER TABLE "processes" ALTER COLUMN "stage" DROP DEFAULT;--> statement-breakpoint

-- 2. Move both columns to plain text temporarily so we can rewrite values
--    before re-applying the enum constraint.
ALTER TABLE "processes" ALTER COLUMN "stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "from_stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "to_stage" SET DATA TYPE text;--> statement-breakpoint

-- 3. Remap existing rows: old vocabulary -> new vocabulary.
UPDATE "processes" SET "stage" = CASE "stage"
  WHEN 'docs_received' THEN 'aguarda_prontidao_carga'
  WHEN 'shipment'      THEN 'aguarda_embarque'
  WHEN 'in_transit'    THEN 'aguarda_chegada'
  WHEN 'customs'       THEN 'atracado'
  WHEN 'released'      THEN 'liberado'
  WHEN 'delivered'     THEN 'pago'
  ELSE "stage"
END;--> statement-breakpoint

UPDATE "timeline_events" SET "from_stage" = CASE "from_stage"
  WHEN 'docs_received' THEN 'aguarda_prontidao_carga'
  WHEN 'shipment'      THEN 'aguarda_embarque'
  WHEN 'in_transit'    THEN 'aguarda_chegada'
  WHEN 'customs'       THEN 'atracado'
  WHEN 'released'      THEN 'liberado'
  WHEN 'delivered'     THEN 'pago'
  ELSE "from_stage"
END WHERE "from_stage" IS NOT NULL;--> statement-breakpoint

UPDATE "timeline_events" SET "to_stage" = CASE "to_stage"
  WHEN 'docs_received' THEN 'aguarda_prontidao_carga'
  WHEN 'shipment'      THEN 'aguarda_embarque'
  WHEN 'in_transit'    THEN 'aguarda_chegada'
  WHEN 'customs'       THEN 'atracado'
  WHEN 'released'      THEN 'liberado'
  WHEN 'delivered'     THEN 'pago'
  ELSE "to_stage"
END WHERE "to_stage" IS NOT NULL;--> statement-breakpoint

-- 4. Replace the enum type itself.
DROP TYPE "public"."process_stage";--> statement-breakpoint
CREATE TYPE "public"."process_stage" AS ENUM(
  'aguarda_prontidao_carga',
  'aguarda_booking',
  'aguarda_draft',
  'aguarda_aprovacao_draft',
  'aguarda_draft_atualizado',
  'aguarda_embarque',
  'aguarda_hbl_final',
  'aguarda_transbordo',
  'aguarda_desconsolidacao',
  'aguarda_chegada',
  'atracado',
  'liberado',
  'aguarda_pagamento',
  'pago'
);--> statement-breakpoint

-- 5. Cast columns back to the enum and re-apply the default.
ALTER TABLE "processes" ALTER COLUMN "stage" SET DATA TYPE "public"."process_stage" USING "stage"::"public"."process_stage";--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "stage" SET DEFAULT 'aguarda_prontidao_carga'::"public"."process_stage";--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "from_stage" SET DATA TYPE "public"."process_stage" USING "from_stage"::"public"."process_stage";--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "to_stage" SET DATA TYPE "public"."process_stage" USING "to_stage"::"public"."process_stage";
