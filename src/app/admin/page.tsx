import Link from "next/link";
import { ArrowRight, Building2, Clock, Pause, ShieldCheck } from "lucide-react";
import { getAdminCounts, listAdminOrgs } from "@/lib/data/admin-orgs";

export const metadata = { title: "Painel · Visão geral" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AdminHomePage() {
  const [counts, orgs] = await Promise.all([getAdminCounts(), listAdminOrgs()]);
  const recent = orgs.slice(0, 5);

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-slate-500">
          Gerencie as empresas que usam a plataforma, planos e funcionalidades liberadas.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Building2} tone="bg-amber-50 text-amber-700" value={counts.total} label="Total" />
        <Kpi icon={ShieldCheck} tone="bg-emerald-50 text-emerald-700" value={counts.active} label="Ativas" />
        <Kpi icon={Pause} tone="bg-red-50 text-red-700" value={counts.suspended} label="Suspensas" />
        <Kpi icon={Clock} tone="bg-orange-50 text-orange-700" value={counts.expiringSoon} label="Vencendo (7d)" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Empresas recentes</h2>
            <p className="text-xs text-slate-500">Últimas {recent.length} empresas cadastradas.</p>
          </div>
          <Link
            href="/admin/orgs"
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
          >
            Ver todas
            <ArrowRight className="size-3.5" />
          </Link>
        </header>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Nenhuma empresa cadastrada.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orgs/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{o.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {o.memberCount} usuário{o.memberCount === 1 ? "" : "s"} ·{" "}
                      Cadastrada em {dateFmt.format(o.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      o.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : o.status === "suspended"
                          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {o.status === "active" ? "Ativa" : o.status === "suspended" ? "Suspensa" : "Cancelada"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
                    {o.plan === "manual" ? "Manual" : "Automático"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof Building2;
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </article>
  );
}
