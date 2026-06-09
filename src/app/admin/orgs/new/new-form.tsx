"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { createOrgAction, type AdminOrgFormState } from "../actions";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function NewOrgForm() {
  const [state, formAction, pending] = useActionState<AdminOrgFormState, FormData>(
    createOrgAction,
    {},
  );
  const [plan, setPlan] = useState<"manual" | "automatico">("manual");
  const [trackingAuto, setTrackingAuto] = useState(false);
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success("Empresa criada.");
  }, [state.success]);

  if (state.success && state.createdOrgId && state.generatedPassword) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-emerald-800">Empresa criada com sucesso</h2>
        <p className="text-sm text-emerald-900">
          O administrador inicial foi provisionado. Anote a senha abaixo — ela não
          será exibida novamente:
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2">
          <code className="flex-1 truncate font-mono text-sm">{state.generatedPassword}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(state.generatedPassword ?? "");
              toast.success("Senha copiada.");
            }}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <Copy className="size-3.5" />
            Copiar
          </button>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/orgs/${state.createdOrgId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Abrir empresa
          </Link>
          <Link
            href="/admin/orgs"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
              Razão social *
            </label>
            <input
              id="name"
              name="name"
              required
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
            />
            <FieldError msg={f.name?.[0]} />
          </div>
          <div>
            <label htmlFor="cnpj" className="mb-1.5 block text-xs font-medium text-slate-700">
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              placeholder="00.000.000/0000-00"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="adminName"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Nome do administrador *
              </label>
              <input
                id="adminName"
                name="adminName"
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
              />
              <FieldError msg={f.adminName?.[0]} />
            </div>
            <div>
              <label
                htmlFor="adminEmail"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                E-mail do administrador *
              </label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
              />
              <FieldError msg={f.adminEmail?.[0]} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Plano</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["manual", "automatico"] as const).map((p) => (
            <label
              key={p}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                plan === p
                  ? "border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={p}
                checked={plan === p}
                onChange={() => setPlan(p)}
                className="sr-only"
              />
              <p className="text-sm font-semibold text-slate-900">
                {p === "manual" ? "Plano Manual" : "Plano Automático"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {p === "manual"
                  ? "Atualizações inseridas manualmente. Sem tracking automático."
                  : "Inclui integração SeaRates/Vizion para tracking automático."}
              </p>
            </label>
          ))}
        </div>
        {plan === "automatico" && (
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
            <input
              type="checkbox"
              name="trackingAuto"
              checked={trackingAuto}
              onChange={(e) => setTrackingAuto(e.target.checked)}
              className="mt-0.5 size-5 accent-amber-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Ativar integração automática de tracking
              </p>
              <p className="text-xs text-slate-500">
                Liga o módulo de rastreamento (SeaRates) para essa empresa.
              </p>
            </div>
          </label>
        )}
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar empresa"}
        </button>
      </div>
    </form>
  );
}
