"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteOrgAction, updateOrgAction, type AdminOrgFormState } from "../actions";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function OrgEditForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: {
    name: string;
    plan: "manual" | "automatico";
    status: "active" | "suspended" | "cancelled";
    planExpiresAt: string;
    trackingAuto: boolean;
    suspensionReason: string;
  };
}) {
  const action = (prev: AdminOrgFormState, fd: FormData) => updateOrgAction(orgId, prev, fd);
  const [state, formAction, pending] = useActionState<AdminOrgFormState, FormData>(action, {});
  const [status, setStatus] = useState(initial.status);
  const [plan, setPlan] = useState(initial.plan);
  const [trackingAuto, setTrackingAuto] = useState(initial.trackingAuto);
  const [deletePending, startDelete] = useTransition();
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success("Empresa atualizada.");
  }, [state.success]);

  // Manual plan implicitly disables tracking_auto in the UI; broker_admin won't
  // see the toggle become useful unless the plan is automático.
  const trackingDisabled = plan === "manual";
  useEffect(() => {
    if (trackingDisabled && trackingAuto) setTrackingAuto(false);
  }, [trackingDisabled, trackingAuto]);

  return (
    <form action={formAction} className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Dados básicos</h2>
        </header>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
              Razão social
            </label>
            <input
              id="name"
              name="name"
              defaultValue={initial.name}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
            />
            <FieldError msg={f.name?.[0]} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Plano contratado</h2>
          <p className="text-xs text-slate-500">
            Define o pacote de funcionalidades disponível para a empresa.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              plan === "manual"
                ? "border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="manual"
              checked={plan === "manual"}
              onChange={() => setPlan("manual")}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-slate-900">Plano Manual</p>
            <p className="mt-1 text-xs text-slate-500">
              Atualizações inseridas pela equipe do despachante. Sem integração SeaRates/Vizion.
            </p>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              plan === "automatico"
                ? "border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="automatico"
              checked={plan === "automatico"}
              onChange={() => setPlan("automatico")}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-slate-900">Plano Automático</p>
            <p className="mt-1 text-xs text-slate-500">
              Inclui integração com SeaRates/Vizion para atualização automática dos processos.
            </p>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Funcionalidades</h2>
          <p className="text-xs text-slate-500">
            Liberações individuais — sobrescreve o padrão do plano.
          </p>
        </header>
        <div className="space-y-3">
          <ToggleRow
            label="Integração automática de tracking"
            description={
              trackingDisabled
                ? "Disponível somente no Plano Automático."
                : "Permite registrar containers/BL nos provedores e receber eventos."
            }
            name="trackingAuto"
            on={trackingAuto}
            disabled={trackingDisabled}
            onChange={setTrackingAuto}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Acesso</h2>
        </header>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(["active", "suspended", "cancelled"] as const).map((s) => (
                <label
                  key={s}
                  className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                    status === s
                      ? s === "active"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : s === "suspended"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-400 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  {s === "active" ? "Ativa" : s === "suspended" ? "Suspensa" : "Cancelada"}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="planExpiresAt"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Data de vencimento
              </label>
              <input
                id="planExpiresAt"
                name="planExpiresAt"
                type="date"
                defaultValue={initial.planExpiresAt}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
              />
              <p className="mt-1 text-xs text-slate-500">
                Vazio = sem vencimento. Ao atingir essa data, acesso é bloqueado.
              </p>
              <FieldError msg={f.planExpiresAt?.[0]} />
            </div>
            <div>
              <label
                htmlFor="suspensionReason"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Motivo (suspensão / cancelamento)
              </label>
              <input
                id="suspensionReason"
                name="suspensionReason"
                defaultValue={initial.suspensionReason}
                placeholder="Ex: inadimplência, fim do contrato"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/15"
              />
            </div>
          </div>
        </div>

        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (!confirm("Cancelar essa empresa? O acesso será revogado imediatamente.")) return;
              startDelete(async () => {
                try {
                  await deleteOrgAction(orgId);
                  toast.success("Empresa cancelada.");
                  window.location.href = "/admin/orgs";
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Falha ao cancelar.");
                }
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="size-4" />
            Cancelar empresa
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </section>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  name,
  on,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  on: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={on}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 cursor-pointer accent-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}
