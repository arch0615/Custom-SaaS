import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { organizations } from "./organizations";

export const notificationKind = pgEnum("notification_kind", [
  "stage_advanced",
  "doc_added_by_broker",
  "doc_added_by_client",
  "client_requested_update",
  "pendency_flagged",
  "process_delayed",
  "team_invited",
  "client_invited",
  "doc_replaced",
  "daily_digest",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (n) => [
    index("notifications_user_read_idx").on(n.userId, n.readAt),
    index("notifications_org_idx").on(n.orgId),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    email: boolean("email").notNull().default(true),
    inApp: boolean("in_app").notNull().default(true),
  },
  (p) => [primaryKey({ columns: [p.userId, p.kind] })],
);
