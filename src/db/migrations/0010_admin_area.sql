-- Painel administrativo: planos + status por empresa + role platform_admin.

ALTER TYPE "member_role" ADD VALUE IF NOT EXISTS 'platform_admin';--> statement-breakpoint

CREATE TYPE "org_plan" AS ENUM ('manual', 'automatico');--> statement-breakpoint
CREATE TYPE "org_status" AS ENUM ('active', 'suspended', 'cancelled');--> statement-breakpoint

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plan" "org_plan" NOT NULL DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "status" "org_status" NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "features" jsonb NOT NULL DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
