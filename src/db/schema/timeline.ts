import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { processes, processStage } from "./processes";
import { users } from "./auth";

export const timelineSource = pgEnum("timeline_source", ["manual", "auto", "system"]);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    note: text("note"),

    source: timelineSource("source").notNull().default("manual"),
    providerRef: text("provider_ref"),

    fromStage: processStage("from_stage"),
    toStage: processStage("to_stage"),
    nonSequential: boolean("non_sequential").notNull().default(false),

    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),

    editedAt: timestamp("edited_at", { withTimezone: true }),
    editedBy: uuid("edited_by").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id, { onDelete: "set null" }),

    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (e) => [
    index("timeline_process_occurred_idx").on(e.processId, e.occurredAt),
    index("timeline_org_idx").on(e.orgId),
    uniqueIndex("timeline_provider_ref_unique")
      .on(e.providerRef)
      .where(sql`${e.providerRef} IS NOT NULL`),
  ],
);
