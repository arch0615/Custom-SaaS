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
  // ─── Workflow v2 (Matheus): 8 groups × ~30 sub-status ──────────────
  // DOCUMENTAÇÃO
  "aguarda_docs_originais",
  "aguarda_correcao_draft",
  "aguarda_bl_original",
  // EMBARQUE
  "aguarda_confirmacao_embarque",
  "embarcado",
  // (em_transito reusa "in_transit" legacy abaixo)
  "aguarda_chegada_eta",
  // CHEGADA DA CARGA
  "carga_chegada",
  "aguarda_presenca_carga",
  "aguarda_desova_lcl",
  // LICENÇAS E ANUÊNCIAS
  "aguarda_deferimento_li",
  "aguarda_liberacao_mapa",
  // DESEMBARAÇO ADUANEIRO
  "aguarda_valor_numerario",
  "di_registrada",
  "canal_verde",
  "canal_amarelo",
  "canal_vermelho",
  "canal_cinza",
  "em_analise_fiscal",
  // TRIBUTOS
  "aguarda_exoneracao_icms",
  "aguarda_pagamento_icms",
  "icms_liberado",
  // TERMINAL PORTUÁRIO
  "aguarda_pagamento_armazenagem",
  "aguarda_liberacao_terminal",
  "processo_faturado_terminal",
  // ENTREGA
  "aguarda_agendamento_carregamento",
  "em_entrega",
  "processo_finalizado",

  // ─── Granular legacy (14-stage workflow, kept for old data) ──────
  "aguarda_prontidao_carga",
  "aguarda_booking",
  "aguarda_draft",
  "aguarda_aprovacao_draft",
  "aguarda_draft_atualizado",
  "aguarda_embarque",
  "aguarda_hbl_final",
  "aguarda_transbordo",
  "aguarda_desconsolidacao",
  "aguarda_chegada",
  "atracado",
  "liberado",
  "aguarda_pagamento",
  "pago",
  // ─── 6-stage milestones (also legacy) ──────────────────────────────
  "docs_received",
  "shipment",
  "in_transit",
  "customs",
  "delivered",
]);

export const incoterm = pgEnum("incoterm", [
  "EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP",
]);

export const insuranceStatus = pgEnum("insurance_status", [
  "solicitado",
  "nao_solicitado",
]);

export const CONTAINER_TYPES = [
  "20DV", "40DV", "40HC", "20RF", "40RF", "20OT", "40OT", "20FR", "40FR",
] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];

export type ContainerEntry = {
  number: string | null;
  type: ContainerType | null;
  quantity: number;
};

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
    stage: processStage("stage").notNull().default("aguarda_prontidao_carga"),

    importerName: text("importer_name").notNull(),
    notifyParty: text("notify_party"),
    exporterName: text("exporter_name").notNull(),

    origin: text("origin").notNull(),
    destination: text("destination").notNull(),

    hblNumber: text("hbl_number"),
    mblNumber: text("mbl_number"),
    containerNumber: text("container_number"),
    containers: jsonb("containers").$type<ContainerEntry[]>().default([]),

    invoiceNumber: text("invoice_number"),

    freeTime: text("free_time"),
    insurance: insuranceStatus("insurance"),

    shipmentDate: date("shipment_date"),
    arrivalDate: date("arrival_date"),

    transshipmentPort: text("transshipment_port"),
    transshipmentVessel: text("transshipment_vessel"),
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
