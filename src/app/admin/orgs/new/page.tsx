import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewOrgForm } from "./new-form";

export const metadata = { title: "Nova empresa · Painel" };

export default function AdminNewOrgPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-6 py-4">
      <Link
        href="/admin/orgs"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Nova empresa</h1>
        <p className="text-sm text-slate-500">
          Cria a empresa, define o plano e provisiona o primeiro administrador (broker_admin) com
          senha aleatória.
        </p>
      </header>
      <NewOrgForm />
    </div>
  );
}
