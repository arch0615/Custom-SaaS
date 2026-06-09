import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requirePortalCustomer } from "@/lib/portal/customer-context";
import { getProcessForOrg } from "@/lib/data/processes";
import { listTimelineForProcess } from "@/lib/data/timeline";
import { listDocumentsForProcess } from "@/lib/data/documents";
import { MODAL_LABEL, STAGE_LABEL, isDelayed, stageBadgeVariant } from "@/lib/process-status";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageProgress } from "@/components/portal/stage-progress";
import { GroupProgress } from "@/components/processes/group-progress";
import { TimelineView } from "@/components/processes/timeline-view";
import { DocumentsView } from "@/components/processes/documents-view";
import { RequestUpdateButton } from "./request-update-button";
import { ClientUploadDocument } from "./upload-document";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function dateOnly(s: string | null) {
  if (!s) return "—";
  return dateFmt.format(new Date(`${s}T00:00:00`));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Processo ${id.slice(0, 8)}` };
}

export default async function PortalProcessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ impersonate?: string }>;
}) {
  const { id } = await params;
  const { impersonate } = await searchParams;
  const { session, customerIds, primary, impersonating } = await requirePortalCustomer(impersonate);

  const proc = await getProcessForOrg(session.orgId, id);
  if (!proc || !customerIds.includes(proc.customerId) || proc.deletedAt) notFound();

  const [events, documents] = await Promise.all([
    listTimelineForProcess(session.orgId, proc.id),
    listDocumentsForProcess(session.orgId, proc.id),
  ]);

  const delayed = isDelayed(proc.stage, proc.arrivalDate);
  const portalBack = impersonating ? `/portal?impersonate=${primary.id}` : "/portal";

  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <div>
        <Link
          href={portalBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{proc.reference}</h1>
          <Badge variant="outline">{MODAL_LABEL[proc.modal]}</Badge>
          <Badge variant={stageBadgeVariant(proc.stage, proc.arrivalDate)}>
            {STAGE_LABEL[proc.stage]}
            {delayed && <span className="ml-1">· Atrasado</span>}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {proc.origin} → {proc.destination} · Chegada prevista {dateOnly(proc.arrivalDate)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Andamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <GroupProgress stage={proc.stage} />
          <StageProgress current={proc.stage} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Precisa de uma informação que ainda não está aqui? Avise seu despachante.
        </p>
        <RequestUpdateButton
          processId={proc.id}
          impersonateId={impersonating ? primary.id : undefined}
          disabled={impersonating}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Importador" value={proc.importerName} />
          <Field label="Notify" value={proc.notifyParty} />
          <Field label={proc.modal === "air" ? "Cia aérea" : "Armador"} value={proc.carrier} />
          <Field label={proc.modal === "air" ? "Voo" : "Navio"} value={proc.vesselFlight} />
          <Field
            label={proc.modal === "air" ? "Aeroporto de conexão" : "Porto de transbordo"}
            value={proc.transshipmentPort}
          />
          <Field
            label={proc.modal === "air" ? "Voo de transbordo" : "Navio de transbordo"}
            value={proc.transshipmentVessel}
          />
          <Field label={proc.modal === "air" ? "HAWB" : "HBL"} value={proc.hblNumber} />
          <Field label={proc.modal === "air" ? "MAWB" : "MBL"} value={proc.mblNumber} />
          <PortalContainers
            label={proc.modal === "air" ? "ULDs" : "Containers"}
            list={proc.containers as { number: string | null; type: string | null; quantity: number }[] | null | undefined}
            fallback={proc.containerNumber}
          />
          <Field label="Número da Invoice" value={proc.invoiceNumber} />
          <Field label="Embarque" value={dateOnly(proc.shipmentDate)} />
          <Field label="Free Time" value={proc.freeTime} />
          <Field
            label="Seguro"
            value={
              proc.insurance === "solicitado"
                ? "Solicitado"
                : proc.insurance === "nao_solicitado"
                  ? "Não solicitado"
                  : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Linha do tempo
            {events.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{events.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineView events={events} canDelete={false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">
            Documentos
            {documents.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{documents.length}</span>
            )}
          </CardTitle>
          <ClientUploadDocument
            processId={proc.id}
            impersonateId={impersonating ? primary.id : undefined}
            disabled={impersonating}
          />
        </CardHeader>
        <CardContent>
          <DocumentsView processId={proc.id} rows={documents} canWrite={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "font-medium"}>{value || "—"}</span>
    </div>
  );
}

function PortalContainers({
  label,
  list,
  fallback,
}: {
  label: string;
  list: { number: string | null; type: string | null; quantity: number }[] | null | undefined;
  fallback: string | null;
}) {
  const filtered = (list ?? []).filter((c) => c.number || c.type);
  if (filtered.length === 0) {
    return <Field label={label} value={fallback} mono />;
  }
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex flex-col items-end gap-0.5 font-mono text-right">
        {filtered.map((c, i) => (
          <span key={i}>
            {c.number ?? "—"}
            {c.type && <span className="ml-1 text-xs text-muted-foreground">· {c.type}</span>}
            {c.quantity > 1 && <span className="ml-1 text-xs text-muted-foreground">× {c.quantity}</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
