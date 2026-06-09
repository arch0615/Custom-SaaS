ALTER TABLE "processes" ADD COLUMN "notify_party" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "containers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "transshipment_vessel" text;--> statement-breakpoint

-- Backfill existing container_number into the new containers JSONB array so
-- legacy rows show up correctly in the new UI.
UPDATE "processes"
SET "containers" = jsonb_build_array(
  jsonb_build_object('number', container_number, 'type', NULL, 'quantity', 1)
)
WHERE container_number IS NOT NULL
  AND (containers IS NULL OR containers = '[]'::jsonb);