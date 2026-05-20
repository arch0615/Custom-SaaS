import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  MessageSquare,
  Minus,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import {
  getDashboardDeltas,
  getDashboardKpis,
  getMonthlyOpenedClosed,
  getRecentActivity,
} from "@/lib/data/dashboard";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";

export const metadata = { title: "Dashboard" };

const relFmt = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function relativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return relFmt.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relFmt.format(hours, "hour");
  const days = Math.round(hours / 24);
  return relFmt.format(days, "day");
}

function formatDelta(current: number, previous: number, mode: "percent" | "count"): {
  label: string;
  direction: "up" | "down" | "flat";
} {
  const diff = current - previous;
  if (previous === 0 && current === 0) return { label: "Sem dados", direction: "flat" };
  if (mode === "percent") {
    if (previous === 0) return { label: `+${current} vs mês passado`, direction: "up" };
    const pct = Math.round((diff / previous) * 100);
    if (pct === 0) return { label: "Igual ao mês passado", direction: "flat" };
    return {
      label: `${pct > 0 ? "+" : ""}${pct}% vs mês passado`,
      direction: pct > 0 ? "up" : "down",
    };
  }
  if (diff === 0) return { label: "Igual ao período", direction: "flat" };
  return {
    label: `${diff > 0 ? "+" : ""}${diff} vs semana passada`,
    direction: diff > 0 ? "up" : "down",
  };
}

type DeltaInfo = ReturnType<typeof formatDelta>;
type Direction = DeltaInfo["direction"];

const DELTA_TONE: Record<Direction, { wrap: string; icon: string; Icon: typeof TrendingUp }> = {
  up: {
    wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    icon: "text-emerald-700",
    Icon: TrendingUp,
  },
  down: {
    wrap: "bg-red-50 text-red-700 ring-1 ring-red-100",
    icon: "text-red-700",
    Icon: TrendingDown,
  },
  flat: {
    wrap: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
    icon: "text-stone-600",
    Icon: Minus,
  },
};

function DeltaPill({ info }: { info: DeltaInfo }) {
  const tone = DELTA_TONE[info.direction];
  const { Icon } = tone;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.wrap}`}>
      <Icon className={`size-3 ${tone.icon}`} />
      {info.label}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  value,
  label,
  hint,
  delta,
  href,
}: {
  icon: typeof FolderOpen;
  value: number;
  label: string;
  hint: string;
  delta: DeltaInfo;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <article className="h-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Icon className="size-5" />
          </span>
          <DeltaPill info={delta} />
        </div>
        <div className="mt-4 text-3xl font-bold tracking-tight text-stone-900">{value}</div>
        <div className="mt-1 text-sm font-medium text-stone-800">{label}</div>
        <div className="mt-0.5 text-xs text-stone-500">{hint}</div>
      </article>
    </Link>
  );
}

function pickActivityIcon(title: string): typeof FolderOpen {
  const k = title.toLowerCase();
  if (k.includes("documento") || k.includes("doc")) return FileText;
  if (k.includes("cliente")) return UserPlus;
  if (k.includes("finalizad") || k.includes("liberad") || k.includes("aprovado")) return CheckCircle2;
  if (k.includes("pendência") || k.includes("vencendo") || k.includes("atras")) return Clock;
  if (k.includes("comentou") || k.includes("mensag")) return MessageSquare;
  return FolderOpen;
}

export default async function AppDashboardPage() {
  const session = await requireSession();

  const [kpis, deltas, monthly, activity] = await Promise.all([
    getDashboardKpis(session.orgId),
    getDashboardDeltas(session.orgId),
    getMonthlyOpenedClosed(session.orgId, 5),
    getRecentActivity(session.orgId, 8),
  ]);

  const openDelta = formatDelta(
    deltas.newProcessesThisMonth,
    deltas.newProcessesLastMonth,
    "percent",
  );
  const pendingDelta = formatDelta(kpis.pendingDocReview, deltas.pendingDocsWeekAgo, "count");
  const completedDelta = formatDelta(
    kpis.completedThisMonth,
    deltas.completedLastMonth,
    "percent",
  );
  const newCustomersDelta = formatDelta(
    kpis.newCustomersThisMonth,
    deltas.newCustomersLastMonth,
    "percent",
  );

  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={FolderOpen}
          value={kpis.open}
          label="Processos ativos"
          hint="Despacho aduaneiro"
          delta={openDelta}
          href="/app/processes"
        />
        <KpiCard
          icon={Clock}
          value={kpis.pendingDocReview}
          label="Pendentes"
          hint="Aguardando documentos"
          delta={pendingDelta}
          href="/app/processes"
        />
        <KpiCard
          icon={CheckCircle2}
          value={kpis.completedThisMonth}
          label="Finalizados (mês)"
          hint="Liberação concluída"
          delta={completedDelta}
          href="/app/processes"
        />
        <KpiCard
          icon={Users}
          value={kpis.newCustomersThisMonth}
          label="Novos clientes"
          hint="Cadastrados este mês"
          delta={newCustomersDelta}
          href="/app/customers"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-3">
          <header className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-900">
                Processos por mês
              </h2>
              <p className="text-sm text-stone-500">Comparativo de abertos vs finalizados</p>
            </div>
          </header>
          <MonthlyChart data={monthly} />
        </article>

        <article className="flex max-h-[420px] flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
          <header className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-900">
                Atividade recente
              </h2>
              <p className="text-sm text-stone-500">Últimas ações da sua equipe</p>
            </div>
          </header>
          {activity.length === 0 ? (
            <p className="text-sm text-stone-500">
              Quando processos forem criados ou atualizados, a atividade aparece aqui.
            </p>
          ) : (
            <ul className="flex-1 space-y-4 overflow-y-auto pr-1">
              {activity.map((e) => {
                const Icon = pickActivityIcon(e.title);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/app/processes/${e.processId}`}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-stone-50"
                    >
                      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="line-clamp-2 text-sm leading-snug text-stone-800">
                          <span className="font-medium">{e.processReference}</span>
                          <span className="text-stone-500"> — </span>
                          {e.title}
                        </p>
                        <p className="text-xs text-stone-500">{relativeTime(e.occurredAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
