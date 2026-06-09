import Link from "next/link";
import { Pause, ShieldAlert } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getOrgAccessState } from "@/lib/data/admin-orgs";
import { signOutAction } from "@/lib/auth/actions";

export const metadata = { title: "Acesso bloqueado · Aduanasync" };

export default async function AccessBlockedPage() {
  const session = await requireSession();
  const access = await getOrgAccessState(session.orgId);

  const reason =
    access?.status === "suspended"
      ? "suspended"
      : access?.status === "cancelled"
        ? "cancelled"
        : access?.expired
          ? "expired"
          : "unknown";

  const COPY: Record<string, { title: string; body: string; icon: typeof Pause }> = {
    suspended: {
      title: "Acesso suspenso",
      body:
        "O acesso da sua empresa está temporariamente suspenso. Entre em contato com o administrador da plataforma para regularização.",
      icon: Pause,
    },
    cancelled: {
      title: "Conta cancelada",
      body: "O contrato da sua empresa foi cancelado. Os dados permanecem armazenados pelo período legal.",
      icon: ShieldAlert,
    },
    expired: {
      title: "Plano vencido",
      body:
        "A data de vencimento do seu plano foi ultrapassada. Renove com o administrador da plataforma para retomar o acesso.",
      icon: Pause,
    },
    unknown: {
      title: "Acesso bloqueado",
      body: "Não foi possível liberar o acesso. Entre em contato com o suporte.",
      icon: ShieldAlert,
    },
  };
  const { title, body, icon: Icon } = COPY[reason];

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon className="size-7" />
        </span>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-slate-600">{body}</p>
        {access?.suspensionReason && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-600">
            <span className="font-semibold">Motivo:</span> {access.suspensionReason}
          </p>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="mailto:contato@aduanasync.com.br"
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Falar com o suporte
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
