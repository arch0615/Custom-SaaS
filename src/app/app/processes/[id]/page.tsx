import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getProcessForOrg } from "@/lib/data/processes";
import { listCustomersForOrg, getCustomerForOrg } from "@/lib/data/customers";
import { listTimelineForProcess } from "@/lib/data/timeline";
import { listDocumentsForProcess } from "@/lib/data/documents";
import { listTrackingForProcess } from "@/lib/data/tracking";
import { getOrgAccessState } from "@/lib/data/admin-orgs";
import { MODAL_LABEL, isDelayed, stageBadgeVariant, STAGE_LABEL } from "@/lib/process-status";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProcessEditTab } from "./edit-tab";
import { StageSelector } from "./stage-selector";
import { DeleteProcessButton } from "./delete-button";
import { TimelineView } from "@/components/processes/timeline-view";
import { AddTimelineEntry } from "./add-timeline-entry";
import { DocumentsView } from "@/components/processes/documents-view";
import { UploadDocument } from "./upload-document";
import { TrackingView } from "./tracking-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const p = await getProcessForOrg(session.orgId, id);
  return { title: p?.reference ?? "Processo" };
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function dateOnly(s: string | null) {
  if (!s) return "—";
  return dateFmt.format(new Date(`${s}T00:00:00`));
}

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const proc = await getProcessForOrg(session.orgId, id);
  if (!proc) notFound();

  const [customer, customers, events, documents, tracking, access] = await Promise.all([
    getCustomerForOrg(session.orgId, proc.customerId),
    listCustomersForOrg(session.orgId),
    listTimelineForProcess(session.orgId, proc.id),
    listDocumentsForProcess(session.orgId, proc.id),
    listTrackingForProcess(session.orgId, proc.id),
    getOrgAccessState(session.orgId),
  ]);

  const delayed = isDelayed(proc.stage, proc.arrivalDate);
  const canWriteTimeline = hasPermission(session.role, "process:add_timeline");
  const canUploadDocs = hasPermission(session.role, "document:upload");
  const canEdit = hasPermission(session.role, "process:edit");
  const canDelete = hasPermission(session.role, "process:delete");
  const canManageTracking = hasPermission(session.role, "tracking:manage");
  const trackingEnabled = !!access?.features.tracking_auto;
  const canDeleteEvents = hasPermission(session.role, "process:delete_timeline");

  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <div>
        <Link
          href="/app/processes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para processos
        </Link>
      </div>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{proc.reference}</h1>
            <Badge variant="outline">{MODAL_LABEL[proc.modal]}</Badge>
            <Badge variant={stageBadgeVariant(proc.stage, proc.arrivalDate)}>
              {STAGE_LABEL[proc.stage]}
              {delayed && <span className="ml-1">· Atrasado</span>}
            </Badge>
            {proc.deletedAt && <Badge variant="destructive">Cancelado</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {customer ? (
              <Link href={`/app/customers/${customer.id}`} className="hover:underline">
                {customer.legalName}
              </Link>
            ) : (
              "—"
            )}{" "}
            · {proc.origin} → {proc.destination}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <StageSelector processId={proc.id} currentStage={proc.stage} />
          {!proc.deletedAt && canDelete && <DeleteProcessButton id={proc.id} reference={proc.reference} />}
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline
            {events.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{events.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documentos
            {documents.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">{documents.length}</span>
            )}
          </TabsTrigger>
          {canManageTracking && trackingEnabled && (
            <TabsTrigger value="tracking">
              Rastreamento
              {tracking.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">{tracking.length}</span>
              )}
            </TabsTrigger>
          )}
          {canEdit && <TabsTrigger value="edit">Editar</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OverviewCard title="Partes envolvidas">
              <Row label="Importador">{proc.importerName}</Row>
              <Row label="Notify">{proc.notifyParty ?? "—"}</Row>
              <Row label="Exportador">{proc.exporterName}</Row>
              <Row label={proc.modal === "air" ? "Cia aérea" : "Armador"}>{proc.carrier ?? "—"}</Row>
              <Row label={proc.modal === "air" ? "Voo" : "Navio"}>{proc.vesselFlight ?? "—"}</Row>
            </OverviewCard>
            <OverviewCard title="Trecho">
              <Row label="Origem">{proc.origin}</Row>
              <Row label="Destino">{proc.destination}</Row>
              <Row label={proc.modal === "air" ? "Aeroporto de conexão" : "Porto de transbordo"}>{proc.transshipmentPort ?? "—"}</Row>
              <Row label={proc.modal === "air" ? "Voo de transbordo" : "Navio de transbordo"}>{proc.transshipmentVessel ?? "—"}</Row>
              <Row label="Chegada/Saída no transbordo">
                {dateOnly(proc.transshipmentArrival)} · {dateOnly(proc.transshipmentDeparture)}
              </Row>
            </OverviewCard>
            <OverviewCard title="Datas">
              <Row label="Embarque">{dateOnly(proc.shipmentDate)}</Row>
              <Row label="Chegada prevista">{dateOnly(proc.arrivalDate)}</Row>
            </OverviewCard>
            <OverviewCard title="Numerações">
              <Row label={proc.modal === "air" ? "HAWB" : "HBL"}>{proc.hblNumber ?? "—"}</Row>
              <Row label={proc.modal === "air" ? "MAWB" : "MBL"}>{proc.mblNumber ?? "—"}</Row>
              <Row label={proc.modal === "air" ? "ULD" : "Containers"} mono>
                <ContainersInline list={proc.containers} fallback={proc.containerNumber} />
              </Row>
              <Row label="Número da Invoice">{proc.invoiceNumber ?? "—"}</Row>
              <Row label="DI / DUE">{proc.diNumber ?? "—"}</Row>
              <Row label="CE Master">{proc.ceMaster ?? "—"}</Row>
              <Row label="CE House">{proc.ceHouse ?? "—"}</Row>
            </OverviewCard>
            <OverviewCard title="Referências">
              <Row label="Agente de carga">{proc.reference}</Row>
              <Row label="Cliente">{proc.clientReference ?? "—"}</Row>
              <Row label="Transportadora">{proc.carrierReference ?? "—"}</Row>
            </OverviewCard>
            <OverviewCard title="Financeiro">
              <Row label="Incoterm">{proc.incoterm ?? "—"}</Row>
              <Row label="Valor da fatura">
                {proc.invoiceValue ? `${proc.currency ?? ""} ${proc.invoiceValue}` : "—"}
              </Row>
              <Row label="Peso bruto">{proc.grossWeightKg ? `${proc.grossWeightKg} kg` : "—"}</Row>
              <Row label="NCM">{proc.ncm ?? "—"}</Row>
              <Row label="Free Time">{proc.freeTime ?? "—"}</Row>
              <Row label="Seguro">
                {proc.insurance === "solicitado"
                  ? "Solicitado"
                  : proc.insurance === "nao_solicitado"
                    ? "Não solicitado"
                    : "—"}
              </Row>
            </OverviewCard>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6 space-y-4">
          {canWriteTimeline && (
            <div className="flex justify-end">
              <AddTimelineEntry processId={proc.id} />
            </div>
          )}
          <TimelineView events={events} canDelete={canDeleteEvents} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6 space-y-4">
          {canUploadDocs && (
            <div className="flex justify-end">
              <UploadDocument processId={proc.id} />
            </div>
          )}
          <DocumentsView processId={proc.id} rows={documents} canWrite={canUploadDocs} />
        </TabsContent>

        {canManageTracking && trackingEnabled && (
          <TabsContent value="tracking" className="mt-6">
            <TrackingView processId={proc.id} rows={tracking} />
          </TabsContent>
        )}

        {canEdit && (
          <TabsContent value="edit" className="mt-6">
            <ProcessEditTab
              process={{
                ...proc,
                invoiceValue: proc.invoiceValue,
                grossWeightKg: proc.grossWeightKg,
              }}
              customers={customers.map((c) => ({ id: c.id, legalName: c.legalName }))}
            />
          </TabsContent>
        )}
      </Tabs>

      {canWriteTimeline && <AddTimelineEntry processId={proc.id} variant="fab" />}
    </div>
  );
}

function OverviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function ContainersInline({
  list,
  fallback,
}: {
  list: { number: string | null; type: string | null; quantity: number }[] | null | undefined;
  fallback: string | null;
}) {
  const filtered = (list ?? []).filter((c) => c.number || c.type);
  if (filtered.length === 0) {
    return <>{fallback ?? "—"}</>;
  }
  return (
    <span className="flex flex-col items-end gap-0.5">
      {filtered.map((c, i) => (
        <span key={i}>
          {c.number ?? "—"}
          {c.type ? <span className="ml-1 text-xs text-muted-foreground">· {c.type}</span> : null}
          {c.quantity > 1 ? <span className="ml-1 text-xs text-muted-foreground">× {c.quantity}</span> : null}
        </span>
      ))}
    </span>
  );
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "font-medium"}>{children}</span>
    </div>
  );
}
