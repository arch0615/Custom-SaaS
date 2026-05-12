import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  numeric,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { customers } from "./customers";

export const processModal = pgEnum("process_modal", ["maritime", "air"]);

export const processStage = pgEnum("process_stage", [
  "docs_received",
  "shipment",
  "in_transit",
  "customs",
  "released",
  "delivered",
]);

export const incoterm = pgEnum("incoterm", [
  "EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP",
]);

export const processes = pgTable(
  "processes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    reference: text("reference").notNull(),
    clientReference: text("client_reference"),
    carrierReference: text("carrier_reference"),

    modal: processModal("modal").notNull().default("maritime"),
    stage: processStage("stage").notNull().default("docs_received"),

    importerName: text("importer_name").notNull(),
    exporterName: text("exporter_name").notNull(),

    origin: text("origin").notNull(),
    destination: text("destination").notNull(),

    hblNumber: text("hbl_number"),
    mblNumber: text("mbl_number"),
    containerNumber: text("container_number"),

    shipmentDate: date("shipment_date"),
    arrivalDate: date("arrival_date"),

    transshipmentPort: text("transshipment_port"),
    transshipmentArrival: date("transshipment_arrival"),
    transshipmentDeparture: date("transshipment_departure"),

    ceMaster: text("ce_master"),
    ceHouse: text("ce_house"),

    incoterm: incoterm("incoterm"),
    currency: text("currency"),
    invoiceValue: numeric("invoice_value", { precision: 14, scale: 2 }),
    grossWeightKg: numeric("gross_weight_kg", { precision: 12, scale: 3 }),
    ncm: text("ncm"),
    carrier: text("carrier"),
    vesselFlight: text("vessel_flight"),
    diNumber: text("di_number"),

    extra: jsonb("extra").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (p) => [
    index("processes_org_idx").on(p.orgId),
    index("processes_org_stage_idx").on(p.orgId, p.stage),
    index("processes_org_arrival_idx").on(p.orgId, p.arrivalDate),
    index("processes_customer_idx").on(p.customerId),
    index("processes_hbl_idx").on(p.hblNumber),
    index("processes_container_idx").on(p.containerNumber),
  ],
);
