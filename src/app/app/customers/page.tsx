import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listCustomersForOrg } from "@/lib/data/customers";
import { formatCNPJ } from "@/lib/cnpj";
import { CUSTOMER_TYPE_LABEL } from "@/lib/labels";
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

export const metadata = { title: "Clientes" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function CustomersPage() {
  const session = await requireSession();
  const rows = await listCustomersForOrg(session.orgId);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 ? "Nenhum cliente cadastrado." : `${rows.length} cliente${rows.length === 1 ? "" : "s"} ativo${rows.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/customers/new">
            <Plus className="size-4" />
            Novo cliente
          </Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-base font-medium">Comece cadastrando seu primeiro cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Importadores e exportadores que você atende. Você pode atribuir processos depois.
          </p>
          <Button asChild className="mt-4">
            <Link href="/app/customers/new">
              <Plus className="size-4" />
              Novo cliente
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/app/customers/${c.id}`} className="hover:underline">
                      {c.legalName}
                      {c.tradeName ? <span className="ml-2 text-xs text-muted-foreground">({c.tradeName})</span> : null}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatCNPJ(c.cnpj)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CUSTOMER_TYPE_LABEL[c.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {dateFmt.format(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
