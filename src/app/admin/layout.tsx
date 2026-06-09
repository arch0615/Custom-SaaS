import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, LayoutDashboard, ShieldCheck } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/data/admin-orgs";
import { signOutAction } from "@/lib/auth/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!(await isPlatformAdmin(session.userId, session.userEmail))) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-svh w-full bg-slate-100 text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold tracking-tight">Painel</span>
            <span className="text-xs text-slate-500">Administrativo</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-3">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700"
          >
            <LayoutDashboard className="size-4" />
            Visão geral
          </Link>
          <Link
            href="/admin/orgs"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Building2 className="size-4" />
            Empresas
          </Link>
        </nav>
        <div className="mt-auto border-t border-slate-200 px-3 py-3">
          <div className="rounded-lg px-2 py-2 text-xs">
            <p className="truncate font-medium text-slate-900">{session.userName ?? session.userEmail}</p>
            <p className="truncate text-slate-500">Platform Admin</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
