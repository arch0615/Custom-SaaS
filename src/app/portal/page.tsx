import Link from "next/link";
import { requirePortalCustomer } from "@/lib/portal/customer-context";
import { listProcessesForOrg } from "@/lib/data/processes";
import { listTimelineForProcess } from "@/lib/data/timeline";
import { MODAL_LABEL, STAGE_LABEL, isDelayed, stageBadgeVariant } from "@/lib/process-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Portal" };

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
  searchParams: Promise<{ impersonate?: string }>;
}) {
  const { impersonate } = await searchParams;
  const { session, customers, primary, customerIds, impersonating } = await requirePortalCustomer(impersonate);

  const rows = await listProcessesForOrg(session.orgId, { customerIds });

  // Fetch the last event for each process — quick N+1 for the MVP (small lists)
  const lastEvents = await Promise.all(
    rows.map((p) => listTimelineForProcess(session.orgId, p.id).then((evs) => evs[evs.length - 1] ?? null)),
  );

  const q = impersonateQuery(impersonating, primary.id);
  const hasMultipleCompanies = customers.length > 1;
  const customerById = new Map(customers.map((c) => [c.id, c]));

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

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sem processos por enquanto</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Assim que houver um processo em seu nome, ele aparecerá aqui.
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
                  <Badge variant={stageBadgeVariant(p.stage, p.arrivalDate)} className="text-xs">
                    {STAGE_LABEL[p.stage]}
                    {delayed && <span className="ml-1">· Atrasado</span>}
                  </Badge>
                  {hasMultipleCompanies && empresa && (
                    <Badge variant="secondary" className="text-xs">
                      {empresa.tradeName ?? empresa.legalName}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.origin} → {p.destination}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chegada prevista: {p.arrivalDate ? dateFmt.format(new Date(`${p.arrivalDate}T00:00:00`)) : "—"}
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
