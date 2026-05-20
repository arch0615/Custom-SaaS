import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Files,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import {
  listProcessesForOrg,
  type CustomerType,
  type ProcessListRow,
  type ProcessStage,
} from "@/lib/data/processes";
import { listCustomersForOrg } from "@/lib/data/customers";
import { STAGE_LABEL, isDelayed } from "@/lib/process-status";

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
  aguarda_prontidao_carga: { wrap: "bg-stone-100 text-stone-700 ring-1 ring-stone-200", dot: "bg-stone-400" },
  aguarda_booking:         { wrap: "bg-stone-100 text-stone-700 ring-1 ring-stone-200", dot: "bg-stone-500" },
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
  pago:                    { wrap: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",        dot: "bg-teal-600" },
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
  if (!urgent) return <span className="text-sm text-stone-400">Normal</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
      Urgente
    </span>
  );
}

function FilterPill({
  icon: Icon,
  label,
}: {
  icon?: typeof SlidersHorizontal;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      title="Filtro em breve"
      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-90"
    >
      {Icon && <Icon className="size-4 text-stone-500" />}
      <span>{label}</span>
      <ChevronDown className="size-4 text-stone-400" />
    </button>
  );
}

function filterRows(rows: ProcessListRow[], q: string): ProcessListRow[] {
  if (!q) return rows;
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) => {
    return (
      r.reference.toLowerCase().includes(needle) ||
      r.customerName.toLowerCase().includes(needle) ||
      (r.containerNumber?.toLowerCase().includes(needle) ?? false) ||
      r.origin.toLowerCase().includes(needle) ||
      r.destination.toLowerCase().includes(needle)
    );
  });
}

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q = "", page: pageRaw = "1" } = await searchParams;

  const [allRows, customers] = await Promise.all([
    listProcessesForOrg(session.orgId),
    listCustomersForOrg(session.orgId),
  ]);

  const filtered = filterRows(allRows, q);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(pageRaw, 10) || 1, 1), totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingTo = Math.min(startIdx + PAGE_SIZE, total);

  const canCreate = customers.length > 0;

  const qsForPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p !== 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Processos</h1>
          <p className="text-sm text-stone-500">Gerencie todos os processos de despacho aduaneiro</p>
        </div>
        {canCreate ? (
          <Link
            href="/app/processes/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            <Plus className="size-4" />
            Novo processo
          </Link>
        ) : (
          <Link
            href="/app/customers/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
          >
            Cadastrar cliente primeiro
          </Link>
        )}
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <form action="/app/processes" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por número ou cliente..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-stone-50/50 pl-10 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterPill icon={SlidersHorizontal} label="Todos os status" />
            <FilterPill label="Todos os tipos" />
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {total === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-base font-medium text-stone-900">
              {q ? "Nada encontrado." : "Sem processos por enquanto"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {q
                ? "Tente outra busca ou limpe o filtro."
                : canCreate
                  ? "Crie o primeiro processo para começar a acompanhar a timeline e documentos."
                  : "Cadastre um cliente antes de criar processos."}
            </p>
            {canCreate && !q && (
              <Link
                href="/app/processes/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
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
                  <tr className="border-b border-stone-200 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    <th className="px-6 py-3 font-semibold">Processo</th>
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
                <tbody className="divide-y divide-stone-100">
                  {visible.map((p) => {
                    const urgent = isDelayed(p.stage, p.arrivalDate);
                    return (
                      <tr key={p.id} className="group transition-colors hover:bg-stone-50/60">
                        <td className="px-6 py-4 align-middle">
                          <Link
                            href={`/app/processes/${p.id}`}
                            className="font-semibold text-stone-900 hover:text-teal-700"
                          >
                            {p.reference}
                          </Link>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <Link
                            href={`/app/customers/${p.customerId}`}
                            className="text-stone-700 hover:text-teal-700"
                          >
                            {p.customerName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {p.hblNumber ? (
                            <span className="font-mono text-xs text-stone-700">{p.hblNumber}</span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-stone-600">
                          {CUSTOMER_TYPE_LABEL[p.customerType]}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <StagePill stage={p.stage} />
                        </td>
                        <td className="px-6 py-4 align-middle text-stone-600 whitespace-nowrap">
                          {formatDateOnly(p.shipmentDate)}
                        </td>
                        <td className="px-6 py-4 align-middle text-stone-600 whitespace-nowrap">
                          {formatDateOnly(p.arrivalDate)}
                        </td>
                        <td className="px-6 py-4 align-middle text-stone-600 whitespace-nowrap">
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
                              className="inline-flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                            >
                              <Eye className="size-4" />
                            </Link>
                            <Link
                              href={`/app/processes/${p.id}#documents`}
                              aria-label="Ver documentos"
                              className="inline-flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-700"
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

            <div className="flex flex-col items-start gap-3 border-t border-stone-200 bg-stone-50/40 px-6 py-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {total === 0 ? 0 : startIdx + 1}-{showingTo} de {total}
              </span>
              {totalPages > 1 && (
                <nav className="inline-flex items-center gap-1">
                  <Link
                    href={page > 1 ? `/app/processes${qsForPage(page - 1)}` : `/app/processes${qsForPage(page)}`}
                    aria-disabled={page === 1}
                    className={`inline-flex size-8 items-center justify-center rounded-md border border-stone-200 ${
                      page === 1
                        ? "pointer-events-none text-stone-300"
                        : "text-stone-600 hover:bg-white"
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
                          ? "bg-teal-700 font-semibold text-white"
                          : "border border-stone-200 text-stone-600 hover:bg-white"
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
                    className={`inline-flex size-8 items-center justify-center rounded-md border border-stone-200 ${
                      page === totalPages
                        ? "pointer-events-none text-stone-300"
                        : "text-stone-600 hover:bg-white"
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
