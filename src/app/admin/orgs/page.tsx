import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { listAdminOrgs } from "@/lib/data/admin-orgs";

export const metadata = { title: "Empresas · Painel" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  suspended: "bg-red-50 text-red-700 ring-1 ring-red-100",
  cancelled: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  cancelled: "Cancelada",
};

export default async function AdminOrgsPage() {
  const orgs = await listAdminOrgs();

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-slate-500">
            {orgs.length} empresa{orgs.length === 1 ? "" : "s"} cadastrada
            {orgs.length === 1 ? "" : "s"} na plataforma.
          </p>
        </div>
        <Link
          href="/admin/orgs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          <Plus className="size-4" />
          Nova empresa
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {orgs.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">Nenhuma empresa cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Empresa</th>
                <th className="px-6 py-3">Plano</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Usuários</th>
                <th className="px-6 py-3">Criada em</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orgs/${o.id}`}
                      className="font-semibold text-slate-900 hover:text-amber-700"
                    >
                      {o.name}
                    </Link>
                    {o.cnpj && <p className="text-xs text-slate-500">CNPJ {o.cnpj}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
                      {o.plan === "manual" ? "Manual" : "Automático"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {o.planExpiresAt ? dateFmt.format(o.planExpiresAt) : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{o.memberCount}</td>
                  <td className="px-6 py-4 text-slate-600">{dateFmt.format(o.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orgs/${o.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
