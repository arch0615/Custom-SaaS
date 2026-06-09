import Link from "next/link";
import { eq } from "drizzle-orm";
import { Calendar, Globe, ShieldCheck } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { UserProfileForm } from "./profile-form";

export const metadata = { title: "Perfil" };

const ROLE_LABEL: Record<string, string> = {
  broker_admin: "Administrador",
  broker_staff: "Equipe",
  client: "Cliente",
};

const AVATAR_PALETTE = [
  "bg-primary",
  "bg-blue-600",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-pink-500",
  "bg-red-500",
];

function avatarBg(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string | null, email: string): string {
  const src = (name?.trim() || email.split("@")[0] || "?")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (src.length === 0) return "?";
  if (src.length === 1) return src[0].slice(0, 2).toUpperCase();
  return (src[0][0] + src[src.length - 1][0]).toUpperCase();
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function ProfilePage() {
  const session = await requireSession();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return <div className="p-6 text-sm text-slate-500">Usuário não encontrado.</div>;
  }

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Perfil</h1>
        <p className="text-sm text-slate-500">
          Seus dados pessoais. A organização e preferências ficam em Configurações.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            className={`inline-flex size-16 shrink-0 items-center justify-center rounded-2xl ${avatarBg(user.id)} text-lg font-semibold text-white`}
          >
            {initials(user.name, user.email)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {user.name ?? user.email.split("@")[0]}
            </h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
                <ShieldCheck className="size-3" />
                {ROLE_LABEL[session.role] ?? session.role}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {session.orgName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Calendar className="size-3" />
                Desde {dateFmt.format(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Dados pessoais</h2>
          <p className="text-xs text-slate-500">Como você aparece para sua equipe e clientes.</p>
        </header>
        <UserProfileForm initialName={user.name ?? ""} email={user.email} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Globe className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Idioma e fuso</h2>
            <p className="text-xs text-slate-500">
              Em breve você poderá escolher o idioma e fuso horário.
            </p>
          </div>
        </header>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-600">Idioma</span>
            <span className="font-medium text-slate-900">Português (Brasil)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Fuso horário</span>
            <span className="font-medium text-slate-900">America/São_Paulo</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Segurança</h2>
            <p className="text-xs text-slate-500">
              Altere a senha e gerencie a conta em Configurações.
            </p>
          </div>
          <Link
            href="/app/settings?tab=security"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Abrir Segurança
          </Link>
        </div>
      </section>
    </div>
  );
}
