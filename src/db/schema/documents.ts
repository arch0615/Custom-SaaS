import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { processes } from "./processes";
import { users } from "./auth";

export const documentType = pgEnum("document_type", [
  "invoice",
  "packing_list",
  "bl",
  "di",
  "receipt",
  "other",
]);

export const documentStatus = pgEnum("document_status", [
  "active",
  "pending_review",
  "replaced",
  "deleted",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),

    type: documentType("type").notNull().default("other"),
    filename: text("filename").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),

    status: documentStatus("status").notNull().default("active"),
    replacedBy: uuid("replaced_by"),

    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id, { onDelete: "set null" }),
  },
  (d) => [
    index("documents_process_type_idx").on(d.processId, d.type),
    index("documents_org_idx").on(d.orgId),
  ],
);
