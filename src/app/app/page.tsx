import Link from "next/link";
import { ArrowRight, Cog, Sparkles, User } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import {
  getDashboardKpis,
  getNextArrivals,
  getProcessesByStage,
  getRecentActivity,
} from "@/lib/data/dashboard";
import { MODAL_LABEL, STAGE_LABEL, isDelayed, stageBadgeVariant } from "@/lib/process-status";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StagesBarChart } from "@/components/dashboard/stages-bar-chart";

export const metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  weekday: "short",
});
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function SourceIcon({ source }: { source: "manual" | "auto" | "system" }) {
  if (source === "auto") return <Sparkles className="size-3.5 text-blue-600" />;
  if (source === "system") return <Cog className="size-3.5 text-muted-foreground" />;
  return <User className="size-3.5 text-foreground" />;
}

export default async function AppDashboardPage() {
  const session = await requireSession();

  const [kpis, byStage, arrivals, activity] = await Promise.all([
    getDashboardKpis(session.orgId),
    getProcessesByStage(session.orgId),
    getNextArrivals(session.orgId),
    getRecentActivity(session.orgId, 15),
  ]);

  const cards = [
    { label: "Processos em aberto", value: kpis.open, href: "/app/processes" },
    {
      label: "Atrasados",
      value: kpis.delayed,
      href: "/app/processes",
      destructive: kpis.delayed > 0,
    },
    { label: "Concluídos no mês", value: kpis.completedThisMonth, href: "/app/processes" },
    { label: "Documentos p/ revisar", value: kpis.pendingDocReview, href: "/app/processes" },
  ];

  const chartData = byStage.map((b) => ({ label: STAGE_LABEL[b.stage], count: b.count }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo, {session.userName ?? session.userEmail}.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block">
            <Card className="transition-colors hover:border-foreground/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-semibold",
                    c.destructive && "text-destructive",
                  )}
                >
                  {c.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Processos por etapa</CardTitle>
            <Link href="/app/processes" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todos →
            </Link>
          </CardHeader>
          <CardContent>
            <StagesBarChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas chegadas</CardTitle>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma chegada prevista para os próximos 7 dias.
              </p>
            ) : (
              <ul className="space-y-3">
                {arrivals.map((a) => {
                  const delayed = isDelayed(a.stage, a.arrivalDate);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/app/processes/${a.id}`}
                        className="block rounded-md p-2 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{a.reference}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {dateFmt.format(new Date(`${a.arrivalDate}T00:00:00`))}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{a.customerName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {MODAL_LABEL[a.modal]}
                          </Badge>
                          <Badge
                            variant={stageBadgeVariant(a.stage, a.arrivalDate)}
                            className="text-[10px]"
                          >
                            {STAGE_LABEL[a.stage]}
                            {delayed && <span className="ml-1">· Atrasado</span>}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Atividade recente</CardTitle>
            <Link
              href="/app/processes"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver tudo <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Quando processos forem criados ou atualizados, a atividade aparece aqui.
              </p>
            ) : (
              <ul className="divide-y">
                {activity.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/app/processes/${e.processId}`}
                      className="flex items-start gap-3 py-3 transition-colors hover:bg-accent/40"
                    >
                      <span className="mt-0.5">
                        <SourceIcon source={e.source} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{e.processReference}</span>
                          <span className="text-muted-foreground"> · {e.customerName}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{e.title}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {dateTimeFmt.format(e.occurredAt)}
                        {e.actorName ? <> · {e.actorName}</> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
