import { redirect } from "next/navigation";
import { ChevronDown, Clock, FolderOpen, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getTeamCounts, listOrgTeamMembersWithStats } from "@/lib/data/members";
import { MemberCard, type MemberCardData } from "./member-card";
import { InviteDialog } from "./invite-dialog";

export const metadata = { title: "Equipe" };

const ROLE_LABEL: Record<MemberCardData["role"], string> = {
  broker_admin: "Administrador",
  broker_staff: "Equipe",
};

const ROLE_CHIP_TONE: Record<MemberCardData["role"], { wrap: string; dot: string }> = {
  broker_admin: { wrap: "bg-primary/10 text-primary ring-1 ring-primary/20", dot: "bg-primary" },
  broker_staff: { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", dot: "bg-amber-500" },
};

function KpiCard({
  icon: Icon,
  iconWrap,
  value,
  label,
}: {
  icon: typeof Users;
  iconWrap: string;
  value: number;
  label: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </article>
  );
}

function filterMembers(rows: MemberCardData[], q: string): MemberCardData[] {
  if (!q) return rows;
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((m) => {
    return (
      (m.name?.toLowerCase().includes(needle) ?? false) ||
      m.email.toLowerCase().includes(needle)
    );
  });
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  if (!hasPermission(session.role, "team:view")) redirect("/app");

  const canInvite = hasPermission(session.role, "team:invite");
  const canChangeRole = hasPermission(session.role, "team:change_role");
  const canRemove = hasPermission(session.role, "team:remove");

  const { q = "" } = await searchParams;

  const [allMembers, counts] = await Promise.all([
    listOrgTeamMembersWithStats(session.orgId),
    getTeamCounts(session.orgId),
  ]);

  const members: MemberCardData[] = allMembers.flatMap((m) =>
    m.role === "broker_admin" || m.role === "broker_staff"
      ? [{ ...m, role: m.role }]
      : [],
  );
  const visible = filterMembers(members, q);

  const adminCount = members.filter((m) => m.role === "broker_admin").length;
  const staffCount = members.filter((m) => m.role === "broker_staff").length;

  const roleChips: Array<{ role: MemberCardData["role"]; count: number }> = [
    { role: "broker_admin", count: adminCount },
    { role: "broker_staff", count: staffCount },
  ];

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-500">
            {counts.active} membro{counts.active === 1 ? "" : "s"} ativo
            {counts.active === 1 ? "" : "s"}
            {counts.pending > 0 && (
              <>
                {" · "}
                {counts.pending} convite{counts.pending === 1 ? "" : "s"} pendente
                {counts.pending === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>
        {canInvite && <InviteDialog />}
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          iconWrap="bg-primary/10 text-primary"
          value={counts.active}
          label="Ativos"
        />
        <KpiCard
          icon={Clock}
          iconWrap="bg-amber-50 text-amber-700"
          value={counts.pending}
          label="Pendentes"
        />
        <KpiCard
          icon={FolderOpen}
          iconWrap="bg-blue-50 text-blue-700"
          value={counts.totalProcesses}
          label="Processos"
        />
        <KpiCard
          icon={ShieldCheck}
          iconWrap="bg-slate-100 text-slate-700"
          value={counts.total}
          label="Total"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form action="/app/team" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou e-mail..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              title="Filtro em breve"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-90"
            >
              <SlidersHorizontal className="size-4 text-slate-500" />
              Todos os cargos
              <ChevronDown className="size-4 text-slate-400" />
            </button>
            <button
              type="button"
              disabled
              title="Filtro em breve"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-90"
            >
              Todos os status
              <ChevronDown className="size-4 text-slate-400" />
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {roleChips.map(({ role, count }) => {
          if (count === 0) return null;
          const tone = ROLE_CHIP_TONE[role];
          return (
            <span
              key={role}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tone.wrap}`}
            >
              <span className={`size-1.5 rounded-full ${tone.dot}`} />
              {ROLE_LABEL[role]}: {count}
            </span>
          );
        })}
      </section>

      {visible.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-medium text-slate-900">
            {q ? "Nada encontrado." : "Nenhum membro ainda"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? "Tente outra busca ou limpe o filtro."
              : "Convide colegas para começar a trabalhar juntos nos processos."}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((m) => (
            <MemberCard
              key={m.userId}
              member={m}
              isSelf={m.userId === session.userId}
              canChangeRole={canChangeRole}
              canRemove={canRemove}
              canResendInvite={canInvite}
            />
          ))}
        </section>
      )}
    </div>
  );
}
