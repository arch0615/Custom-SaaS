CREATE TYPE "public"."tracking_provider" AS ENUM('searates', 'vizion', 'manual');--> statement-breakpoint
CREATE TYPE "public"."tracking_ref_kind" AS ENUM('container', 'bl', 'awb', 'booking');--> statement-breakpoint
CREATE TABLE "tracking_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"process_id" uuid NOT NULL,
	"provider" "tracking_provider" NOT NULL,
	"ref_kind" "tracking_ref_kind" NOT NULL,
	"external_ref" text NOT NULL,
	"last_polled_at" timestamp with time zone,
	"last_event_at" timestamp with time zone,
	"disabled" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_subscriptions" ADD CONSTRAINT "tracking_subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_subscriptions" ADD CONSTRAINT "tracking_subscriptions_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_subs_unique" ON "tracking_subscriptions" USING btree ("process_id","provider","external_ref");--> statement-breakpoint
CREATE INDEX "tracking_subs_org_idx" ON "tracking_subscriptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tracking_subs_external_idx" ON "tracking_subscriptions" USING btree ("provider","external_ref");