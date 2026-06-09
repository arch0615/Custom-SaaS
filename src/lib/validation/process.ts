import { z } from "zod";
import { CONTAINER_TYPES } from "@/db/schema/processes";

const trimmed = z.string().trim();

const optionalString = trimmed
  .max(255)
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use o formato AAAA-MM-DD");

const optionalDecimal = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || /^-?\d+(\.\d+)?$/.test(v), "Use um número válido");

const modalEnum = z.enum(["maritime", "air"]);
const stageEnum = z.enum([
  // v2
  "aguarda_docs_originais",
  "aguarda_correcao_draft",
  "aguarda_bl_original",
  "aguarda_confirmacao_embarque",
  "embarcado",
  "in_transit",
  "aguarda_chegada_eta",
  "carga_chegada",
  "aguarda_presenca_carga",
  "aguarda_desova_lcl",
  "aguarda_deferimento_li",
  "aguarda_liberacao_mapa",
  "aguarda_valor_numerario",
  "di_registrada",
  "canal_verde",
  "canal_amarelo",
  "canal_vermelho",
  "canal_cinza",
  "em_analise_fiscal",
  "aguarda_exoneracao_icms",
  "aguarda_pagamento_icms",
  "icms_liberado",
  "aguarda_pagamento_armazenagem",
  "aguarda_liberacao_terminal",
  "processo_faturado_terminal",
  "aguarda_agendamento_carregamento",
  "em_entrega",
  "processo_finalizado",
  // legacy
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
  "docs_received",
  "shipment",
  "customs",
  "delivered",
]);
const INCOTERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;
type Incoterm = (typeof INCOTERMS)[number];

export const processInputSchema = z.object({
  customerId: z.uuid("Selecione um cliente"),
  reference: trimmed.min(2, "Referência obrigatória").max(64),
  clientReference: optionalString,
  carrierReference: optionalString,

  modal: modalEnum,
  stage: stageEnum,

  importerName: trimmed.min(2, "Importador obrigatório").max(255),
  notifyParty: optionalString,
  exporterName: trimmed.min(2, "Exportador obrigatório").max(255),

  origin: trimmed.min(2, "Origem obrigatória").max(255),
  destination: trimmed.min(2, "Destino obrigatório").max(255),

  hblNumber: optionalString,
  mblNumber: optionalString,
  containerNumber: optionalString,
  containers: z
    .array(
      z.object({
        number: trimmed.max(64).transform((v) => (v === "" ? null : v)).nullable(),
        type: z
          .string()
          .trim()
          .transform((v) => (v === "" ? null : v))
          .pipe(z.enum([...CONTAINER_TYPES]).nullable()),
        quantity: z.coerce.number().int().min(1).max(999).default(1),
      }),
    )
    .max(50)
    .default([]),

  invoiceNumber: optionalString,

  freeTime: optionalString,
  insurance: z
    .string()
    .trim()
    .transform((v): "solicitado" | "nao_solicitado" | null => {
      if (v === "" || v === "none") return null;
      return v as "solicitado" | "nao_solicitado";
    })
    .refine((v) => v === null || v === "solicitado" || v === "nao_solicitado", "Status do seguro inválido"),

  shipmentDate: optionalDate,
  arrivalDate: optionalDate,

  transshipmentPort: optionalString,
  transshipmentVessel: optionalString,
  transshipmentArrival: optionalDate,
  transshipmentDeparture: optionalDate,

  ceMaster: optionalString,
  ceHouse: optionalString,

  incoterm: z
    .string()
    .trim()
    .transform((v): Incoterm | null => (v === "" ? null : (v as Incoterm)))
    .refine((v) => v === null || INCOTERMS.includes(v), "Incoterm inválido"),
  currency: optionalString,
  invoiceValue: optionalDecimal,
  grossWeightKg: optionalDecimal,
  ncm: optionalString,
  carrier: optionalString,
  vesselFlight: optionalString,
  diNumber: optionalString,
});

export type ProcessInput = z.infer<typeof processInputSchema>;

function parseContainers(formData: FormData): Array<{ number: string; type: string; quantity: string }> {
  // Form encodes rows as containers[0].number, containers[0].type, containers[0].quantity ...
  const rows: Record<string, Record<string, string>> = {};
  for (const [key, value] of formData.entries()) {
    const m = /^containers\[(\d+)\]\.(number|type|quantity)$/.exec(key);
    if (!m) continue;
    const idx = m[1];
    const field = m[2];
    rows[idx] = rows[idx] ?? {};
    rows[idx][field] = typeof value === "string" ? value : "";
  }
  return Object.keys(rows)
    .sort((a, b) => Number(a) - Number(b))
    .map((idx) => ({
      number: rows[idx].number ?? "",
      type: rows[idx].type ?? "",
      quantity: rows[idx].quantity ?? "1",
    }))
    .filter((r) => r.number !== "" || r.type !== ""); // drop fully empty rows
}

export function parseProcessForm(formData: FormData) {
  return processInputSchema.safeParse({
    customerId: formData.get("customerId"),
    reference: formData.get("reference") ?? "",
    clientReference: formData.get("clientReference") ?? "",
    carrierReference: formData.get("carrierReference") ?? "",

    modal: formData.get("modal"),
    stage: formData.get("stage"),

    importerName: formData.get("importerName") ?? "",
    notifyParty: formData.get("notifyParty") ?? "",
    exporterName: formData.get("exporterName") ?? "",

    origin: formData.get("origin") ?? "",
    destination: formData.get("destination") ?? "",

    hblNumber: formData.get("hblNumber") ?? "",
    mblNumber: formData.get("mblNumber") ?? "",
    containerNumber: formData.get("containerNumber") ?? "",
    containers: parseContainers(formData),

    invoiceNumber: formData.get("invoiceNumber") ?? "",

    freeTime: formData.get("freeTime") ?? "",
    insurance: formData.get("insurance") ?? "",

    shipmentDate: formData.get("shipmentDate") ?? "",
    arrivalDate: formData.get("arrivalDate") ?? "",

    transshipmentPort: formData.get("transshipmentPort") ?? "",
    transshipmentVessel: formData.get("transshipmentVessel") ?? "",
    transshipmentArrival: formData.get("transshipmentArrival") ?? "",
    transshipmentDeparture: formData.get("transshipmentDeparture") ?? "",

    ceMaster: formData.get("ceMaster") ?? "",
    ceHouse: formData.get("ceHouse") ?? "",

    incoterm: (() => {
      const raw = formData.get("incoterm");
      return raw === "none" || raw === null ? "" : raw;
    })(),
    currency: formData.get("currency") ?? "",
    invoiceValue: formData.get("invoiceValue") ?? "",
    grossWeightKg: formData.get("grossWeightKg") ?? "",
    ncm: formData.get("ncm") ?? "",
    carrier: formData.get("carrier") ?? "",
    vesselFlight: formData.get("vesselFlight") ?? "",
    diNumber: formData.get("diNumber") ?? "",
  });
}
