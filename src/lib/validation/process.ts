import { z } from "zod";

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
  "docs_received",
  "shipment",
  "in_transit",
  "customs",
  "released",
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
  exporterName: trimmed.min(2, "Exportador obrigatório").max(255),

  origin: trimmed.min(2, "Origem obrigatória").max(255),
  destination: trimmed.min(2, "Destino obrigatório").max(255),

  hblNumber: optionalString,
  mblNumber: optionalString,
  containerNumber: optionalString,

  shipmentDate: optionalDate,
  arrivalDate: optionalDate,

  transshipmentPort: optionalString,
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

export function parseProcessForm(formData: FormData) {
  return processInputSchema.safeParse({
    customerId: formData.get("customerId"),
    reference: formData.get("reference") ?? "",
    clientReference: formData.get("clientReference") ?? "",
    carrierReference: formData.get("carrierReference") ?? "",

    modal: formData.get("modal"),
    stage: formData.get("stage"),

    importerName: formData.get("importerName") ?? "",
    exporterName: formData.get("exporterName") ?? "",

    origin: formData.get("origin") ?? "",
    destination: formData.get("destination") ?? "",

    hblNumber: formData.get("hblNumber") ?? "",
    mblNumber: formData.get("mblNumber") ?? "",
    containerNumber: formData.get("containerNumber") ?? "",

    shipmentDate: formData.get("shipmentDate") ?? "",
    arrivalDate: formData.get("arrivalDate") ?? "",

    transshipmentPort: formData.get("transshipmentPort") ?? "",
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
