import Link from "next/link";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  Mail,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  User,
  UserPlus,
} from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import {
  listCustomersWithStatsForOrg,
  type CustomerListWithStats,
} from "@/lib/data/customers";
import {
  listRecentPortalInvites,
  type PortalInviteRow,
} from "@/lib/data/portal-invites";
import { formatCNPJ } from "@/lib/cnpj";
import { CopyLinkButton } from "@/components/customers/copy-link-button";

export const metadata = { title: "Clientes" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const AVATAR_PALETTE = [
  { bg: "bg-teal-600", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-blue-600", text: "text-white" },
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-emerald-600", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
];

function avatarStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function inviteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function filterCustomers(rows: CustomerListWithStats[], q: string): CustomerListWithStats[] {
  if (!q) return rows;
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((c) => {
    return (
      c.legalName.toLowerCase().includes(needle) ||
      (c.tradeName?.toLowerCase().includes(needle) ?? false) ||
      c.cnpj.replace(/\D/g, "").includes(needle.replace(/\D/g, "")) ||
      (c.primaryContactName?.toLowerCase().includes(needle) ?? false) ||
      (c.primaryContactEmail?.toLowerCase().includes(needle) ?? false)
    );
  });
}

function InviteRow({ invite }: { invite: PortalInviteRow }) {
  const av = avatarStyle(invite.email);
  const inviteUrl = invite.token ? `${inviteOrigin()}/invite/${invite.token}` : null;
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${av.bg} text-xs font-semibold ${av.text}`}
          >
            {initialsOf(invite.name)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold text-stone-900">{invite.name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" />
                {invite.email}
              </span>
              <Link
                href={`/app/customers/${invite.customerId}`}
                className="inline-flex items-center gap-1 hover:text-stone-700"
              >
                <Building2 className="size-3.5" />
                {invite.customerName}
              </Link>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${
            invite.status === "accepted"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
          }`}
        >
          <span className={`size-1.5 rounded-full ${invite.status === "accepted" ? "bg-emerald-500" : "bg-amber-500"}`} />
          {invite.status === "accepted" ? "Aceito" : "Pendente"}
        </span>
      </div>
      {inviteUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5">
          <LinkIcon className="size-3.5 shrink-0 text-stone-400" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-stone-600">{inviteUrl}</span>
          <CopyLinkButton value={inviteUrl} />
        </div>
      )}
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-stone-500">
        <Clock className="size-3.5" />
        Enviado em {dateFmt.format(invite.sentAt)}
      </p>
    </div>
  );
}

function CustomerCard({ c }: { c: CustomerListWithStats }) {
  const av = avatarStyle(c.id);
  const isActive = c.activeProcesses > 0 || c.totalProcesses === 0;
  return (
    <Link
      href={`/app/customers/${c.id}`}
      className="group block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg ${av.bg} text-sm font-semibold ${av.text}`}
        >
          {initialsOf(c.legalName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-stone-900">{c.legalName}</h3>
              <p className="truncate text-xs text-stone-500">CNPJ {formatCNPJ(c.cnpj)}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-stone-300 transition-colors group-hover:text-stone-500" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-stone-600">
        {c.primaryContactName ? (
          <p className="inline-flex items-center gap-1.5">
            <User className="size-3.5 text-stone-400" />
            <span className="truncate">{c.primaryContactName}</span>
          </p>
        ) : null}
        {c.primaryContactEmail || c.email ? (
          <p className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5 text-stone-400" />
            <span className="truncate">{c.primaryContactEmail ?? c.email}</span>
          </p>
        ) : null}
        {c.primaryContactPhone || c.phone ? (
          <p className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5 text-stone-400" />
            <span className="truncate">{c.primaryContactPhone ?? c.phone}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 ring-1 ring-teal-100">
            <FolderOpen className="size-3" />
            {c.activeProcesses} ativos
          </span>
          <span className="text-stone-500">{c.totalProcesses} total</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isActive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
          }`}
        >
          {isActive ? "Ativo" : "Inativo"}
        </span>
      </div>
    </Link>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const { q = "" } = await searchParams;

  const [customers, invites] = await Promise.all([
    listCustomersWithStatsForOrg(session.orgId),
    listRecentPortalInvites(session.orgId, 6),
  ]);

  const totalActiveProcesses = customers.reduce((acc, c) => acc + c.activeProcesses, 0);
  const filtered = filterCustomers(customers, q);
  const pendingInvites = invites.filter((i) => i.status === "pending").length;

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Clientes</h1>
          <p className="text-sm text-stone-500">
            {customers.length} cliente{customers.length === 1 ? "" : "s"} ativo
            {customers.length === 1 ? "" : "s"} · {totalActiveProcesses} processo
            {totalActiveProcesses === 1 ? "" : "s"} em andamento
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/customers/new"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
          >
            <UserPlus className="size-4" />
            Convidar cliente
          </Link>
          <Link
            href="/app/customers/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            <Plus className="size-4" />
            Novo cliente
          </Link>
        </div>
      </header>

      {invites.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <Globe className="size-4 text-stone-500" />
              <h2 className="text-sm font-semibold text-stone-900">Convites do portal</h2>
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-700">
                {invites.length}
              </span>
            </div>
            {pendingInvites > 0 && (
              <span className="text-xs font-medium text-amber-700">
                {pendingInvites} pendente{pendingInvites === 1 ? "" : "s"}
              </span>
            )}
          </header>
          <div className="space-y-3">
            {invites.map((i) => (
              <InviteRow key={i.contactId} invite={i} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <form action="/app/customers" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou CNPJ..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-stone-50/50 pl-10 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </label>
          <button
            type="button"
            disabled
            title="Filtro em breve"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-90"
          >
            <SlidersHorizontal className="size-4 text-stone-500" />
            Todos
            <ChevronDown className="size-4 text-stone-400" />
          </button>
        </form>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-medium text-stone-900">
            {q ? "Nada encontrado." : "Comece cadastrando seu primeiro cliente"}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {q
              ? "Tente outra busca ou limpe o filtro."
              : "Importadores e exportadores que você atende. Você pode atribuir processos depois."}
          </p>
          {!q && (
            <Link
              href="/app/customers/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              <Plus className="size-4" />
              Novo cliente
            </Link>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <CustomerCard key={c.id} c={c} />
          ))}
        </section>
      )}
    </div>
  );
}
