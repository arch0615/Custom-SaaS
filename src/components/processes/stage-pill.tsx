import { STAGE_LABEL } from "@/lib/process-status";
import type { ProcessStage } from "@/lib/data/processes";

/**
 * Cor por etapa. Compartilhado entre /app/processes (área do broker)
 * e /portal (cliente) pra ambos exibirem o mesmo código de cor.
 */
export const STAGE_TONE: Record<ProcessStage, { wrap: string; dot: string }> = {
  // pré-embarque (documentação, booking, draft) — cinzas e azuis
  aguarda_prontidao_carga: { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", dot: "bg-slate-400" },
  aguarda_booking:         { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", dot: "bg-slate-500" },
  aguarda_draft:           { wrap: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",         dot: "bg-sky-400" },
  aguarda_aprovacao_draft: { wrap: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",         dot: "bg-sky-500" },
  aguarda_draft_atualizado:{ wrap: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",         dot: "bg-sky-600" },
  // embarque + trânsito — azul → índigo → âmbar
  aguarda_embarque:        { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",       dot: "bg-blue-500" },
  aguarda_hbl_final:       { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",       dot: "bg-blue-600" },
  aguarda_transbordo:      { wrap: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100", dot: "bg-indigo-500" },
  aguarda_desconsolidacao: { wrap: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100", dot: "bg-indigo-600" },
  aguarda_chegada:         { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",    dot: "bg-amber-500" },
  // pós-chegada — verdes
  atracado:                { wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  liberado:                { wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-600" },
  // financeiro
  aguarda_pagamento:       { wrap: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",  dot: "bg-orange-500" },
  pago:                    { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",        dot: "bg-primary" },
  // legacy 6-stage labels (kept alongside per cliente)
  docs_received:           { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-500" },
  shipment:                { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",          dot: "bg-blue-600" },
  in_transit:              { wrap: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",    dot: "bg-indigo-500" },
  customs:                 { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",       dot: "bg-amber-600" },
  delivered:               { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",      dot: "bg-primary" },
  // ─── v2 workflow ──────────────────────────────────────────
  // Documentação — slate
  aguarda_docs_originais:        { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-400" },
  aguarda_correcao_draft:        { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-500" },
  aguarda_bl_original:           { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-600" },
  // Embarque — blue/indigo
  aguarda_confirmacao_embarque:  { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",          dot: "bg-blue-400" },
  embarcado:                     { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",          dot: "bg-blue-600" },
  aguarda_chegada_eta:           { wrap: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",    dot: "bg-indigo-500" },
  // Chegada — cyan
  carga_chegada:                 { wrap: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",          dot: "bg-cyan-600" },
  aguarda_presenca_carga:        { wrap: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",          dot: "bg-cyan-500" },
  aguarda_desova_lcl:            { wrap: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",          dot: "bg-cyan-400" },
  // Licenças — purple
  aguarda_deferimento_li:        { wrap: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",    dot: "bg-purple-500" },
  aguarda_liberacao_mapa:        { wrap: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",    dot: "bg-purple-600" },
  // Desembaraço — colors based on canal
  aguarda_valor_numerario:       { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",       dot: "bg-amber-500" },
  di_registrada:                 { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",       dot: "bg-amber-600" },
  canal_verde:                   { wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  canal_amarelo:                 { wrap: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100",    dot: "bg-yellow-500" },
  canal_vermelho:                { wrap: "bg-red-50 text-red-700 ring-1 ring-red-100",             dot: "bg-red-500" },
  canal_cinza:                   { wrap: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-500" },
  em_analise_fiscal:             { wrap: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",    dot: "bg-orange-500" },
  // Tributos — orange
  aguarda_exoneracao_icms:       { wrap: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",    dot: "bg-orange-400" },
  aguarda_pagamento_icms:        { wrap: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",    dot: "bg-orange-500" },
  icms_liberado:                 { wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  // Terminal — teal
  aguarda_pagamento_armazenagem: { wrap: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",          dot: "bg-teal-500" },
  aguarda_liberacao_terminal:    { wrap: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",          dot: "bg-teal-600" },
  processo_faturado_terminal:    { wrap: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",          dot: "bg-teal-700" },
  // Entrega — primary
  aguarda_agendamento_carregamento: { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",   dot: "bg-primary" },
  em_entrega:                       { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",   dot: "bg-primary" },
  processo_finalizado:              { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",   dot: "bg-primary" },
};

export function StagePill({
  stage,
  suffix,
}: {
  stage: ProcessStage;
  suffix?: string;
}) {
  const tone = STAGE_TONE[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone.wrap}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {STAGE_LABEL[stage]}
      {suffix && <span className="ml-1">· {suffix}</span>}
    </span>
  );
}
