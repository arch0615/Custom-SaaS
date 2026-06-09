-- Bring back the original 6-stage labels alongside the granular 14-stage
-- workflow. Matheus uses both vocabularies — the granular ones for daily
-- tracking and the legacy ones as quick milestones — so we keep both.
--
-- "liberado" already exists; only the other 5 need to be added.

ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'docs_received';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'shipment';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'in_transit';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'customs';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'delivered';
