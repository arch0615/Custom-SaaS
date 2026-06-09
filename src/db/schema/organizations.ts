import { pgTable, text, timestamp, uuid, pgEnum, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const memberRole = pgEnum("member_role", [
  "broker_admin",
  "broker_staff",
  "client",
  "platform_admin",
]);

export const orgPlan = pgEnum("org_plan", ["manual", "automatico"]);
export const orgStatus = pgEnum("org_status", ["active", "suspended", "cancelled"]);

export type OrgFeatures = {
  tracking_auto?: boolean;
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  logoUrl: text("logo_url"),
  cnpj: text("cnpj"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  uf: text("uf"),
  cep: text("cep"),
  description: text("description"),
  // ─── Plano + status (gerenciados pelo painel /admin) ──────────
  plan: orgPlan("plan").notNull().default("manual"),
  status: orgStatus("status").notNull().default("active"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  features: jsonb("features").$type<OrgFeatures>().notNull().default({}),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (m) => [primaryKey({ columns: [m.orgId, m.userId] })],
);
