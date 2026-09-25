import Link from "next/link";
import { requirePortalCustomer } from "@/lib/portal/customer-context";
import { listProcessesForOrg } from "@/lib/data/processes";
import { listTimelineForProcess } from "@/lib/data/timeline";
import { MODAL_LABEL, isDelayed } from "@/lib/process-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StagePill } from "@/components/processes/stage-pill";

export const metadata = { title: "Portal" };

type Tab = "ongoing" | "done";
function isTab(v: string | undefined): v is Tab {
  return v === "ongoing" || v === "done";
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function impersonateQuery(impersonating: boolean, customerId: string): string {
  return impersonating ? `?impersonate=${customerId}` : "";
}

function firstName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ impersonate?: string; tab?: string }>;
}) {
  const { impersonate, tab: tabRaw } = await searchParams;
  const { session, customers, primary, customerIds, impersonating } = await requirePortalCustomer(impersonate);

  const tab: Tab = isTab(tabRaw) ? tabRaw : "ongoing";

  const allRows = await listProcessesForOrg(session.orgId, { customerIds });

  // Mesmo critério do /app/processes: finalizado = 'pago'.
  const ongoingCount = allRows.filter((r) => r.stage !== "pago").length;
  const doneCount = allRows.filter((r) => r.stage === "pago").length;
  const rows = allRows.filter((r) => (tab === "done" ? r.stage === "pago" : r.stage !== "pago"));

  // Fetch the last event for each process — quick N+1 for the MVP (small lists)
  const lastEvents = await Promise.all(
    rows.map((p) => listTimelineForProcess(session.orgId, p.id).then((evs) => evs[0] ?? null)),
  );

  const q = impersonateQuery(impersonating, primary.id);
  const hasMultipleCompanies = customers.length > 1;
  const customerById = new Map(customers.map((c) => [c.id, c]));

  const tabHref = (t: Tab) => {
    const params = new URLSearchParams();
    if (impersonating) params.set("impersonate", primary.id);
    if (t !== "ongoing") params.set("tab", t);
    const qs = params.toString();
    return `/portal${qs ? `?${qs}` : ""}`;
  };

  // Pick a friendly greeting. Single empresa keeps the company name; multi-empresa
  // shows the user's first name (the company tags appear below).
  const greetingTarget = hasMultipleCompanies
    ? firstName(session.userName) ?? "tudo bem"
    : primary.tradeName ?? primary.legalName;

  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {greetingTarget}</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o andamento das suas importações e exportações.
        </p>
        {hasMultipleCompanies && (
          <div className="flex flex-wrap gap-2 pt-1">
            {customers.map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="text-xs"
                title={c.cnpj}
              >
                {c.tradeName ?? c.legalName}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <nav className="inline-flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm">
        <TabLink href={tabHref("ongoing")} active={tab === "ongoing"} label="Em andamento" count={ongoingCount} />
        <TabLink href={tabHref("done")} active={tab === "done"} label="Finalizados" count={doneCount} />
      </nav>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {tab === "done" ? "Nenhum processo finalizado ainda" : "Sem processos em andamento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {tab === "done"
              ? "Processos com status “Pago” aparecerão aqui."
              : "Assim que houver um processo em seu nome, ele aparecerá aqui."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p, i) => {
            const delayed = isDelayed(p.stage, p.arrivalDate);
            const last = lastEvents[i];
            const empresa = customerById.get(p.customerId);
            return (
              <Link
                key={p.id}
                href={`/portal/processes/${p.id}${q}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.reference}</span>
                  {p.invoiceNumber && (
                    <span className="font-mono text-xs text-muted-foreground">
                      Invoice {p.invoiceNumber}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">{MODAL_LABEL[p.modal]}</Badge>
                  <StagePill stage={p.stage} suffix={delayed ? "Atrasado" : undefined} />
                  {hasMultipleCompanies && empresa && (
                    <Badge variant="secondary" className="text-xs">
                      {empresa.tradeName ?? empresa.legalName}
                    </Badge>
                  )}
                </div>
                {p.hblNumber && (
                  <p className="mt-1 font-mono text-sm font-bold uppercase tracking-wide">
                    {p.modal === "air" ? "HAWB" : "HBL"}: {p.hblNumber}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.origin} → {p.destination}
                </p>
                {p.exporterName && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Exportador: <span className="font-medium text-foreground">{p.exporterName}</span>
                  </p>
                )}
                <p className="mt-2 text-base font-semibold">
                  Chegada prevista:{" "}
                  <span className="font-bold">
                    {p.arrivalDate ? dateFmt.format(new Date(`${p.arrivalDate}T00:00:00`)) : "—"}
                  </span>
                </p>
                {last && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Última atualização: <span className="font-medium">{last.title}</span>
                    {" · "}
                    {dateTimeFmt.format(last.occurredAt)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <span className={`text-xs ${active ? "text-primary/70" : "text-muted-foreground"}`}>
        ({count})
      </span>
    </Link>
  );
}
