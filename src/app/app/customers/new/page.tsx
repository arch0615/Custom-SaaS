import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomerAction } from "./actions";

export const metadata = { title: "Novo cliente" };

export default function NewCustomerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para clientes
        </Link>
      </div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre um importador ou exportador. Os contatos podem ser adicionados depois.
        </p>
      </header>

      <CustomerForm action={createCustomerAction} submitLabel="Criar cliente" />
    </div>
  );
}
