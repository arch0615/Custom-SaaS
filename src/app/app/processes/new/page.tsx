import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listCustomersForOrg } from "@/lib/data/customers";
import { ProcessForm } from "@/components/processes/process-form";
import { createProcessAction } from "./actions";

export const metadata = { title: "Novo processo" };

export default async function NewProcessPage() {
  const session = await requireSession();
  if (session.role === "client") redirect("/portal");

  const customers = await listCustomersForOrg(session.orgId);
  if (customers.length === 0) redirect("/app/customers/new");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/app/processes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para processos
        </Link>
      </div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Novo processo</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre os dados essenciais. Você poderá editar e avançar etapas depois.
        </p>
      </header>
      <ProcessForm
        action={createProcessAction}
        submitLabel="Criar processo"
        customers={customers.map((c) => ({ id: c.id, legalName: c.legalName }))}
      />
    </div>
  );
}
