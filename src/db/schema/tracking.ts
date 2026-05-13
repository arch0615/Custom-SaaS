import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { processes } from "./processes";

export const trackingProvider = pgEnum("tracking_provider", ["searates", "vizion", "manual"]);
export const trackingRefKind = pgEnum("tracking_ref_kind", ["container", "bl", "awb", "booking"]);

export const trackingSubscriptions = pgTable(
  "tracking_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    provider: trackingProvider("provider").notNull(),
    refKind: trackingRefKind("ref_kind").notNull(),
    externalRef: text("external_ref").notNull(),
    lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    disabled: text("disabled"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("tracking_subs_unique").on(t.processId, t.provider, t.externalRef),
    index("tracking_subs_org_idx").on(t.orgId),
    index("tracking_subs_external_idx").on(t.provider, t.externalRef),
  ],
);
