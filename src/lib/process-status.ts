import type { ProcessStage, ProcessModal, Incoterm } from "@/lib/data/processes";

// ─────────────────────────────────────────────────────────────────────
// Status workflow v2: 8 groups × ~30 sub-statuses (taxonomia atual)
// + 19 estágios legacy mantidos pra compatibilidade com dados antigos
// ─────────────────────────────────────────────────────────────────────

export type StageGroup =
  | "documentacao"
  | "embarque"
  | "chegada"
  | "licencas"
  | "desembaraco"
  | "tributos"
  | "terminal"
  | "entrega"
  | "legado";

export const STAGE_GROUP_LABEL: Record<StageGroup, string> = {
  documentacao: "Documentação",
  embarque: "Embarque",
  chegada: "Chegada da Carga",
  licencas: "Licenças e Anuências",
  desembaraco: "Desembaraço Aduaneiro",
  tributos: "Tributos",
  terminal: "Terminal Portuário",
  entrega: "Entrega",
  legado: "Legado",
};

// Ordem dos grupos no dropdown. "Legado" fica no TOPO porque é o que os
// clientes existentes já usavam — os 8 grupos novos vêm abaixo.
export const STAGE_GROUP_ORDER: StageGroup[] = [
  "legado",
  "documentacao",
  "embarque",
  "chegada",
  "licencas",
  "desembaraco",
  "tributos",
  "terminal",
  "entrega",
];

export const STAGE_GROUP: Record<ProcessStage, StageGroup> = {
  // DOCUMENTAÇÃO
  aguarda_docs_originais: "documentacao",
  aguarda_correcao_draft: "documentacao",
  aguarda_bl_original: "documentacao",
  // EMBARQUE
  aguarda_confirmacao_embarque: "embarque",
  embarcado: "embarque",
  in_transit: "embarque", // reuse legacy "Em Trânsito" no grupo Embarque
  aguarda_chegada_eta: "embarque",
  // CHEGADA
  carga_chegada: "chegada",
  aguarda_presenca_carga: "chegada",
  aguarda_desova_lcl: "chegada",
  // LICENÇAS
  aguarda_deferimento_li: "licencas",
  aguarda_liberacao_mapa: "licencas",
  // DESEMBARAÇO
  aguarda_valor_numerario: "desembaraco",
  di_registrada: "desembaraco",
  canal_verde: "desembaraco",
  canal_amarelo: "desembaraco",
  canal_vermelho: "desembaraco",
  canal_cinza: "desembaraco",
  em_analise_fiscal: "desembaraco",
  // TRIBUTOS
  aguarda_exoneracao_icms: "tributos",
  aguarda_pagamento_icms: "tributos",
  icms_liberado: "tributos",
  // TERMINAL
  aguarda_pagamento_armazenagem: "terminal",
  aguarda_liberacao_terminal: "terminal",
  processo_faturado_terminal: "terminal",
  // ENTREGA
  aguarda_agendamento_carregamento: "entrega",
  em_entrega: "entrega",
  processo_finalizado: "entrega",

  // ─── Legacy (todos no grupo "Legado") ──────────────
  aguarda_prontidao_carga: "legado",
  aguarda_booking: "legado",
  aguarda_draft: "legado",
  aguarda_aprovacao_draft: "legado",
  aguarda_draft_atualizado: "legado",
  aguarda_embarque: "legado",
  aguarda_hbl_final: "legado",
  aguarda_transbordo: "legado",
  aguarda_desconsolidacao: "legado",
  aguarda_chegada: "legado",
  atracado: "legado",
  liberado: "legado",
  aguarda_pagamento: "legado",
  pago: "legado",
  docs_received: "legado",
  shipment: "legado",
  customs: "legado",
  delivered: "legado",
};

export const STAGE_ORDER: ProcessStage[] = [
  // Legado PRIMEIRO — é o que os clientes existentes já usavam.
  // Os 6 milestones originais aparecem antes dos 14 "Aguarda X".
  "docs_received",
  "shipment",
  "customs",
  "delivered",
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

  // ─── Novo workflow agrupado ────────────────────────────────
  // Documentação
  "aguarda_docs_originais",
  "aguarda_correcao_draft",
  "aguarda_bl_original",
  // Embarque
  "aguarda_confirmacao_embarque",
  "embarcado",
  "in_transit",
  "aguarda_chegada_eta",
  // Chegada
  "carga_chegada",
  "aguarda_presenca_carga",
  "aguarda_desova_lcl",
  // Licenças
  "aguarda_deferimento_li",
  "aguarda_liberacao_mapa",
  // Desembaraço
  "aguarda_valor_numerario",
  "di_registrada",
  "canal_verde",
  "canal_amarelo",
  "canal_vermelho",
  "canal_cinza",
  "em_analise_fiscal",
  // Tributos
  "aguarda_exoneracao_icms",
  "aguarda_pagamento_icms",
  "icms_liberado",
  // Terminal
  "aguarda_pagamento_armazenagem",
  "aguarda_liberacao_terminal",
  "processo_faturado_terminal",
  // Entrega
  "aguarda_agendamento_carregamento",
  "em_entrega",
  "processo_finalizado",
];

export const STAGE_LABEL: Record<ProcessStage, string> = {
  // v2
  aguarda_docs_originais: "Aguardando documentos originais",
  aguarda_correcao_draft: "Aguardando correção do draft",
  aguarda_bl_original: "Aguardando BL original",
  aguarda_confirmacao_embarque: "Aguardando confirmação de embarque",
  embarcado: "Embarcado",
  in_transit: "Em trânsito",
  aguarda_chegada_eta: "Aguardando chegada (ETA)",
  carga_chegada: "Carga chegada",
  aguarda_presenca_carga: "Aguardando presença de carga",
  aguarda_desova_lcl: "Aguardando desova LCL",
  aguarda_deferimento_li: "Aguardando deferimento de LI",
  aguarda_liberacao_mapa: "Aguardando liberação do MAPA",
  aguarda_valor_numerario: "Aguardando valor do numerário",
  di_registrada: "DI registrada, aguardando parametrização",
  canal_verde: "Canal Verde",
  canal_amarelo: "Canal Amarelo",
  canal_vermelho: "Canal Vermelho",
  canal_cinza: "Canal Cinza",
  em_analise_fiscal: "Em análise fiscal",
  aguarda_exoneracao_icms: "Aguardando exoneração de ICMS",
  aguarda_pagamento_icms: "Aguardando pagamento de ICMS",
  icms_liberado: "ICMS liberado",
  aguarda_pagamento_armazenagem: "Aguardando pagamento da armazenagem",
  aguarda_liberacao_terminal: "Aguardando liberação documental do terminal",
  processo_faturado_terminal: "Processo faturado no terminal",
  aguarda_agendamento_carregamento: "Aguardando agendamento de carregamento",
  em_entrega: "Em entrega",
  processo_finalizado: "Processo finalizado",

  // legacy
  aguarda_prontidao_carga: "Aguarda Prontidão de Carga",
  aguarda_booking: "Aguarda Booking",
  aguarda_draft: "Aguarda Draft",
  aguarda_aprovacao_draft: "Aguarda Aprovação de Draft",
  aguarda_draft_atualizado: "Aguarda Draft Atualizado",
  aguarda_embarque: "Aguarda Embarque",
  aguarda_hbl_final: "Aguarda HBL Final",
  aguarda_transbordo: "Aguarda Transbordo",
  aguarda_desconsolidacao: "Aguarda Desconsolidação",
  aguarda_chegada: "Aguarda Chegada",
  atracado: "Atracado",
  liberado: "Liberado",
  aguarda_pagamento: "Aguarda Pagamento",
  pago: "Pago",
  docs_received: "Documentação Recebida",
  shipment: "Embarque",
  customs: "Desembaraço",
  delivered: "Entrega Finalizada",
};

export const STAGE_TERMINAL: ProcessStage = "processo_finalizado";

/**
 * Etapas pré-embarque: nessas, a data de chegada é apenas planejamento e
 * ainda pode mudar. O que o broker precisa priorizar é a data de embarque
 * (quando o container/BL vai efetivamente sair). Usadas em ORDER BY na
 * listagem de processos.
 */
export const SHIPMENT_DATE_SORT_STAGES: ProcessStage[] = [
  "aguarda_prontidao_carga",
  "aguarda_booking",
  "aguarda_draft",
  "aguarda_aprovacao_draft",
  "aguarda_draft_atualizado",
  "aguarda_embarque",
];

export const STAGE_OPTIONS = STAGE_ORDER.map((s) => ({
  value: s,
  label: STAGE_LABEL[s],
  group: STAGE_GROUP[s],
}));

/** Options grouped by their group for `<optgroup>` selects. */
export const STAGE_OPTIONS_GROUPED = STAGE_GROUP_ORDER.map((g) => ({
  group: g,
  label: STAGE_GROUP_LABEL[g],
  options: STAGE_ORDER.filter((s) => STAGE_GROUP[s] === g).map((s) => ({
    value: s,
    label: STAGE_LABEL[s],
  })),
})).filter((g) => g.options.length > 0);

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
  // "Aberto" = ainda não chegou no estado final (processo_finalizado) nem nos
  // equivalentes legados pago/delivered.
  return stage !== "processo_finalizado" && stage !== "pago" && stage !== "delivered";
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
