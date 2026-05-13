import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listProcessesForOrg } from "@/lib/data/processes";
import { listCustomersForOrg } from "@/lib/data/customers";
import { MODAL_LABEL, STAGE_LABEL, isDelayed, stageBadgeVariant } from "@/lib/process-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Processos" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function ProcessesPage() {
  const session = await requireSession();
  const [rows, customers] = await Promise.all([
    listProcessesForOrg(session.orgId),
    listCustomersForOrg(session.orgId),
  ]);

  const canCreate = customers.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Processos</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Nenhum processo cadastrado ainda."
              : `${rows.length} processo${rows.length === 1 ? "" : "s"} ativo${rows.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/app/processes/new">
              <Plus className="size-4" />
              Novo processo
            </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/app/customers/new">Cadastrar cliente primeiro</Link>
          </Button>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-base font-medium">Sem processos por enquanto</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Crie o primeiro processo para começar a acompanhar a timeline e documentos."
              : "Cadastre um cliente antes de criar processos."}
          </p>
          {canCreate && (
            <Button asChild className="mt-4">
              <Link href="/app/processes/new">
                <Plus className="size-4" />
                Novo processo
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Modal</TableHead>
                <TableHead>Trecho</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Chegada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const delayed = isDelayed(p.stage, p.arrivalDate);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/app/processes/${p.id}`} className="hover:underline">
                        {p.reference}
                      </Link>
                      {p.containerNumber ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {p.containerNumber}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <Link href={`/app/customers/${p.customerId}`} className="hover:underline">
                        {p.customerName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{MODAL_LABEL[p.modal]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.origin} → {p.destination}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stageBadgeVariant(p.stage, p.arrivalDate)}>
                        {STAGE_LABEL[p.stage]}
                        {delayed && <span className="ml-1">· Atrasado</span>}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.arrivalDate
                        ? dateFmt.format(new Date(`${p.arrivalDate}T00:00:00`))
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
