import type { ProcessStage } from "@/lib/data/processes";
import { STAGE_ORDER } from "@/lib/process-status";

/**
 * Infer the destination stage from a tracking-event title. Returns null when
 * the title doesn't strongly suggest any of our 14 stages — in that case the
 * webhook still records the event in the timeline but leaves processes.stage
 * untouched (the broker can still advance manually).
 *
 * Patterns are matched case-insensitively against either Portuguese or English
 * provider event titles. Order matters: more specific / later-in-the-pipeline
 * patterns first so a "paid" event doesn't get caught by a generic "released".
 */
const PATTERNS: Array<{ stage: ProcessStage; needles: RegExp[] }> = [
  {
    stage: "pago",
    needles: [/\bpag(o|amento (efetuado|confirmado|conclu[ií]do))\b/i, /\bpaid\b/i],
  },
  {
    stage: "aguarda_pagamento",
    needles: [
      /\baguarda(ndo)? pagamento\b/i,
      /\b(awaiting|pending) payment\b/i,
      /\bfatura emitida\b/i,
    ],
  },
  {
    stage: "liberado",
    needles: [
      /\bdesembara(ç|c)ada?\b/i,
      /\bcustoms? (cleared|released)\b/i,
      /\bliberad[ao]\b/i,
      /\brelease(d)?\b/i,
    ],
  },
  {
    stage: "atracado",
    needles: [
      /\batrac(ad|aç)\w*\b/i,
      /\bberthed\b/i,
      /\b(arrived|chegou) (at|no) (port|porto)\b/i,
      /\bdescarregad[ao]\b/i,
      /\b(unloaded|discharged)\b/i,
    ],
  },
  {
    stage: "aguarda_chegada",
    needles: [
      /\baguarda(ndo)? chegada\b/i,
      /\b(em )?tr[âa]nsito\b/i,
      /\bin transit\b/i,
      /\bvessel (departed|sailed)\b/i,
      /\bdeparted\b/i,
    ],
  },
  {
    stage: "aguarda_desconsolidacao",
    needles: [/\bdesconsolida(ç|c)\w*\b/i, /\bdeconsolidat(ion|ed)\b/i],
  },
  {
    stage: "aguarda_transbordo",
    needles: [/\btransbord(o|ad[oa])\b/i, /\btransshipm?ent\b/i],
  },
  {
    stage: "aguarda_hbl_final",
    needles: [/\bhbl final\b/i, /\bhbl (emitid[oa]|liberad[oa])\b/i],
  },
  {
    stage: "aguarda_embarque",
    needles: [
      /\baguarda(ndo)? embarque\b/i,
      /\bembarque (programado|previsto)\b/i,
      /\b(carga|container) recebid[ao]\b/i,
      /\bloaded (on board|at port)\b/i,
      /\bbooking confirmed\b/i,
    ],
  },
  {
    stage: "aguarda_draft_atualizado",
    needles: [/\bdraft atualizad[oa]\b/i, /\bupdated draft\b/i],
  },
  {
    stage: "aguarda_aprovacao_draft",
    needles: [/\baprova(ç|c)[ãa]o de draft\b/i, /\bdraft (approval|approved)\b/i],
  },
  {
    stage: "aguarda_draft",
    needles: [/\bdraft\b/i],
  },
  {
    stage: "aguarda_booking",
    needles: [/\bbooking\b/i],
  },
  {
    stage: "aguarda_prontidao_carga",
    needles: [
      /\bprontid[ãa]o de carga\b/i,
      /\bcargo readiness\b/i,
      /\bdocumenta(ç|c)[aã]o recebida\b/i,
      /\bdocuments? received\b/i,
    ],
  },
];

export function inferStageFromEventTitle(title: string): ProcessStage | null {
  for (const { stage, needles } of PATTERNS) {
    if (needles.some((re) => re.test(title))) return stage;
  }
  return null;
}

export function stageIndex(s: ProcessStage): number {
  return STAGE_ORDER.indexOf(s);
}

/**
 * Only advance forward — never auto-rewind. The broker can still move
 * backwards manually if a provider event arrives out of order.
 */
export function shouldAutoAdvance(current: ProcessStage, candidate: ProcessStage): boolean {
  return stageIndex(candidate) > stageIndex(current);
}
