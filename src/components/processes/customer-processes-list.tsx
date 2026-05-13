import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODAL_LABEL, STAGE_LABEL, isDelayed, stageBadgeVariant } from "@/lib/process-status";
import type { ProcessListRow } from "@/lib/data/processes";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function CustomerProcessesList({ rows }: { rows: ProcessListRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum processo vinculado a este cliente ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referência</TableHead>
            <TableHead>Modal</TableHead>
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
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{MODAL_LABEL[p.modal]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={stageBadgeVariant(p.stage, p.arrivalDate)}>
                    {STAGE_LABEL[p.stage]}
                    {delayed && <span className="ml-1">· Atrasado</span>}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {p.arrivalDate ? dateFmt.format(new Date(`${p.arrivalDate}T00:00:00`)) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
