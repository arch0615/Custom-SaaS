import type { ProcessStage, ProcessModal, Incoterm } from "@/lib/data/processes";

export const STAGE_ORDER: ProcessStage[] = [
  "docs_received",
  "shipment",
  "in_transit",
  "customs",
  "released",
  "delivered",
];

export const STAGE_LABEL: Record<ProcessStage, string> = {
  docs_received: "Documentação Recebida",
  shipment: "Embarque",
  in_transit: "Em Trânsito",
  customs: "Desembaraço",
  released: "Liberado",
  delivered: "Entrega Finalizada",
};

export const STAGE_OPTIONS = STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABEL[s] }));

export function stageIndex(s: ProcessStage): number {
  return STAGE_ORDER.indexOf(s);
}

export function isStageJump(from: ProcessStage, to: ProcessStage): boolean {
  return Math.abs(stageIndex(to) - stageIndex(from)) > 1;
}

export const MODAL_LABEL: Record<ProcessModal, string> = {
  maritime: "Marítimo",
  air: "Aéreo",
};

export const MODAL_OPTIONS = (Object.entries(MODAL_LABEL) as [ProcessModal, string][]).map(
  ([value, label]) => ({ value, label }),
);

export const INCOTERM_OPTIONS: { value: Incoterm; label: string }[] = [
  { value: "EXW", label: "EXW · Ex Works" },
  { value: "FCA", label: "FCA · Free Carrier" },
  { value: "FOB", label: "FOB · Free On Board" },
  { value: "CFR", label: "CFR · Cost and Freight" },
  { value: "CIF", label: "CIF · Cost, Insurance, Freight" },
  { value: "CPT", label: "CPT · Carriage Paid To" },
  { value: "CIP", label: "CIP · Carriage and Insurance Paid To" },
  { value: "DAP", label: "DAP · Delivered at Place" },
  { value: "DPU", label: "DPU · Delivered at Place Unloaded" },
  { value: "DDP", label: "DDP · Delivered Duty Paid" },
];

export function isOpen(stage: ProcessStage): boolean {
  return stage !== "released" && stage !== "delivered";
}

export function isDelayed(stage: ProcessStage, arrivalDate: string | null): boolean {
  if (!arrivalDate) return false;
  if (!isOpen(stage)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(arrivalDate) < today;
}

export function stageBadgeVariant(
  stage: ProcessStage,
  arrivalDate: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  if (isDelayed(stage, arrivalDate)) return "destructive";
  if (!isOpen(stage)) return "secondary";
  return "outline";
}

export function modalFieldLabels(modal: ProcessModal) {
  if (modal === "air") {
    return {
      hbl: "Número HAWB",
      mbl: "Número MAWB",
      container: "Número ULD",
      transshipmentPort: "Aeroporto de conexão",
      vesselFlight: "Voo",
      carrier: "Cia aérea",
    };
  }
  return {
    hbl: "Número HBL",
    mbl: "Número MBL",
    container: "Número Container",
    transshipmentPort: "Porto de transbordo",
    vesselFlight: "Navio",
    carrier: "Armador",
  };
}
