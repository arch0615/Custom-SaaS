CREATE TYPE "public"."insurance_status" AS ENUM('solicitado', 'nao_solicitado');--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "free_time" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "insurance" "insurance_status";