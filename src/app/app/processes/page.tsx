import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Files,
  Plus,
  Search,
} from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import {
  listProcessesForOrg,
  type CustomerType,
  type ProcessListRow,
  type ProcessStage,
} from "@/lib/data/processes";
import { listCustomersForOrg } from "@/lib/data/customers";
import {
  STAGE_GROUP,
  STAGE_GROUP_LABEL,
  STAGE_GROUP_ORDER,
  STAGE_LABEL,
  STAGE_ORDER,
  isDelayed,
} from "@/lib/process-status";

export const metadata = { title: "Processos" };

const PAGE_SIZE = 8;

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDateOnly(s: string | null): string {
  if (!s) return "—";
  return dateFmt.format(new Date(`${s}T00:00:00`));
}

const STAGE_TONE: Record<ProcessStage, { wrap: string; dot: string }> = {
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

const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  importer: "Importação",
  exporter: "Exportação",
  both: "Importação / Exportação",
};

function StagePill({ stage }: { stage: ProcessStage }) {
  const tone = STAGE_TONE[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone.wrap}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {STAGE_LABEL[stage]}
    </span>
  );
}

function PriorityCell({ urgent }: { urgent: boolean }) {
  if (!urgent) return <span className="text-sm text-slate-400">Normal</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
      Urgente
    </span>
  );
}

const TIPO_LABEL: Record<CustomerType, string> = {
  importer: "Importação",
  exporter: "Exportação",
  both: "Importação / Exportação",
};

function filterRows(
  rows: ProcessListRow[],
  q: string,
  status: ProcessStage | null,
  tipo: CustomerType | null,
): ProcessListRow[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => {
    if (status && r.stage !== status) return false;
    if (tipo && r.customerType !== tipo) return false;
    if (!needle) return true;
    return (
      r.reference.toLowerCase().includes(needle) ||
      r.customerName.toLowerCase().includes(needle) ||
      (r.containerNumber?.toLowerCase().includes(needle) ?? false) ||
      (r.invoiceNumber?.toLowerCase().includes(needle) ?? false) ||
      (r.hblNumber?.toLowerCase().includes(needle) ?? false) ||
      r.origin.toLowerCase().includes(needle) ||
      r.destination.toLowerCase().includes(needle)
    );
  });
}

type Tab = "ongoing" | "done";

function isStage(v: string | undefined): v is ProcessStage {
  return !!v && (STAGE_ORDER as readonly string[]).includes(v);
}

function isTipo(v: string | undefined): v is CustomerType {
  return v === "importer" || v === "exporter" || v === "both";
}

function isTab(v: string | undefined): v is Tab {
  return v === "ongoing" || v === "done";
}

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tab?: string;
    status?: string;
    tipo?: string;
  }>;
}) {
  const session = await requireSession();
  const { q = "", page: pageRaw = "1", tab: tabRaw, status: statusRaw, tipo: tipoRaw } =
    await searchParams;

  const tab: Tab = isTab(tabRaw) ? tabRaw : "ongoing";
  const statusFilter: ProcessStage | null = isStage(statusRaw) ? statusRaw : null;
  const tipoFilter: CustomerType | null = isTipo(tipoRaw) ? tipoRaw : null;

  const [allRows, customers] = await Promise.all([
    listProcessesForOrg(session.orgId),
    listCustomersForOrg(session.orgId),
  ]);

  // Tab separa: ongoing = todos exceto 'pago'; done = só 'pago'.
  const byTab = allRows.filter((r) =>
    tab === "done" ? r.stage === "pago" : r.stage !== "pago",
  );

  // No tab ongoing o filtro de status só faz sentido se for diferente de 'pago'.
  const effectiveStatus = tab === "ongoing" && statusFilter === "pago" ? null : statusFilter;

  const filtered = filterRows(byTab, q, effectiveStatus, tipoFilter);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(pageRaw, 10) || 1, 1), totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingTo = Math.min(startIdx + PAGE_SIZE, total);

  const canCreate = customers.length > 0;

  const ongoingCount = allRows.filter((r) => r.stage !== "pago").length;
  const doneCount = allRows.filter((r) => r.stage === "pago").length;

  const buildQs = (overrides: Partial<{
    q: string;
    page: number;
    tab: Tab;
    status: ProcessStage | "";
    tipo: CustomerType | "";
  }>) => {
    const params = new URLSearchParams();
    const finalQ = overrides.q !== undefined ? overrides.q : q;
    const finalTab = overrides.tab !== undefined ? overrides.tab : tab;
    const finalStatus =
      overrides.status !== undefined ? overrides.status : statusFilter ?? "";
    const finalTipo = overrides.tipo !== undefined ? overrides.tipo : tipoFilter ?? "";
    const finalPage = overrides.page !== undefined ? overrides.page : 1;
    if (finalQ) params.set("q", finalQ);
    if (finalTab !== "ongoing") params.set("tab", finalTab);
    if (finalStatus) params.set("status", finalStatus);
    if (finalTipo) params.set("tipo", finalTipo);
    if (finalPage !== 1) params.set("page", String(finalPage));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  const qsForPage = (p: number) => buildQs({ page: p });

  // Available stage options depend on the tab — finalizados só tem 'pago'.
  const stageOptions =
    tab === "done"
      ? (["pago"] as ProcessStage[])
      : STAGE_ORDER.filter((s) => s !== "pago");

  // Mesma lista, mas agrupada para usar <optgroup> no filtro nativo.
  const stageOptionsGrouped = STAGE_GROUP_ORDER.map((g) => ({
    group: g,
    label: STAGE_GROUP_LABEL[g],
    options: stageOptions.filter((s) => STAGE_GROUP[s] === g),
  })).filter((g) => g.options.length > 0);

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Processos</h1>
          <p className="text-sm text-slate-500">Gerencie todos os processos de despacho aduaneiro</p>
        </div>
        {canCreate ? (
          <Link
            href="/app/processes/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Novo processo
          </Link>
        ) : (
          <Link
            href="/app/customers/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Cadastrar cliente primeiro
          </Link>
        )}
      </header>

      <nav className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <Link
          href={buildQs({ tab: "ongoing", status: "", page: 1 })}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "ongoing"
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Em andamento <span className="ml-1 text-xs text-slate-500">({ongoingCount})</span>
        </Link>
        <Link
          href={buildQs({ tab: "done", status: "", page: 1 })}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "done"
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Finalizados <span className="ml-1 text-xs text-slate-500">({doneCount})</span>
        </Link>
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form action="/app/processes" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* preserve current tab when submitting the form */}
          {tab !== "ongoing" && <input type="hidden" name="tab" value={tab} />}
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por número, cliente, container, invoice ou HBL..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Todos os status</option>
              {stageOptionsGrouped.map((g) => (
                <optgroup key={g.group} label={g.label}>
                  {g.options.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              name="tipo"
              defaultValue={tipoFilter ?? ""}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Todos os tipos</option>
              <option value="importer">{TIPO_LABEL.importer}</option>
              <option value="exporter">{TIPO_LABEL.exporter}</option>
              <option value="both">{TIPO_LABEL.both}</option>
            </select>
            <button
              type="submit"
              className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Aplicar
            </button>
            {(q || statusFilter || tipoFilter) && (
              <Link
                href={buildQs({ q: "", status: "", tipo: "", page: 1 })}
                className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                Limpar
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {total === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-base font-medium text-slate-900">
              {q ? "Nada encontrado." : "Sem processos por enquanto"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {q
                ? "Tente outra busca ou limpe o filtro."
                : canCreate
                  ? "Crie o primeiro processo para começar a acompanhar a timeline e documentos."
                  : "Cadastre um cliente antes de criar processos."}
            </p>
            {canCreate && !q && (
              <Link
                href="/app/processes/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Novo processo
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3 font-semibold">Processo</th>
                    <th className="px-6 py-3 font-semibold">Invoice</th>
                    <th className="px-6 py-3 font-semibold">Cliente</th>
                    <th className="px-6 py-3 font-semibold">HBL</th>
                    <th className="px-6 py-3 font-semibold">Tipo</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Embarque</th>
                    <th className="px-6 py-3 font-semibold">Chegada</th>
                    <th className="px-6 py-3 font-semibold">Criado</th>
                    <th className="px-6 py-3 font-semibold">Prioridade</th>
                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((p) => {
                    const urgent = isDelayed(p.stage, p.arrivalDate);
                    return (
                      <tr key={p.id} className="group transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-4 align-middle">
                          <Link
                            href={`/app/processes/${p.id}`}
                            className="font-semibold text-slate-900 hover:text-primary"
                          >
                            {p.reference}
                          </Link>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {p.invoiceNumber ? (
                            <span className="font-mono text-xs text-slate-700">{p.invoiceNumber}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <Link
                            href={`/app/customers/${p.customerId}`}
                            className="text-slate-700 hover:text-primary"
                          >
                            {p.customerName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {p.hblNumber ? (
                            <span className="font-mono text-xs text-slate-700">{p.hblNumber}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-600">
                          {CUSTOMER_TYPE_LABEL[p.customerType]}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <StagePill stage={p.stage} />
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-600 whitespace-nowrap">
                          {formatDateOnly(p.shipmentDate)}
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-600 whitespace-nowrap">
                          {formatDateOnly(p.arrivalDate)}
                        </td>
                        <td className="px-6 py-4 align-middle text-slate-600 whitespace-nowrap">
                          {dateFmt.format(p.createdAt)}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <PriorityCell urgent={urgent} />
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="inline-flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <Link
                              href={`/app/processes/${p.id}`}
                              aria-label="Ver processo"
                              className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Eye className="size-4" />
                            </Link>
                            <Link
                              href={`/app/processes/${p.id}#documents`}
                              aria-label="Ver documentos"
                              className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Files className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-start gap-3 border-t border-slate-200 bg-slate-50/40 px-6 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {total === 0 ? 0 : startIdx + 1}-{showingTo} de {total}
              </span>
              {totalPages > 1 && (
                <nav className="inline-flex items-center gap-1">
                  <Link
                    href={page > 1 ? `/app/processes${qsForPage(page - 1)}` : `/app/processes${qsForPage(page)}`}
                    aria-disabled={page === 1}
                    className={`inline-flex size-8 items-center justify-center rounded-md border border-slate-200 ${
                      page === 1
                        ? "pointer-events-none text-slate-300"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/app/processes${qsForPage(p)}`}
                      className={`inline-flex size-8 items-center justify-center rounded-md text-sm ${
                        p === page
                          ? "bg-primary font-semibold text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                  <Link
                    href={
                      page < totalPages
                        ? `/app/processes${qsForPage(page + 1)}`
                        : `/app/processes${qsForPage(page)}`
                    }
                    aria-disabled={page === totalPages}
                    className={`inline-flex size-8 items-center justify-center rounded-md border border-slate-200 ${
                      page === totalPages
                        ? "pointer-events-none text-slate-300"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </nav>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
