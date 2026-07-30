"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { Plus, Radio, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  TRACKING_PROVIDER_LABEL,
  TRACKING_REF_KIND_LABEL,
  type TrackingProvider,
  type TrackingRefKind,
  type TrackingSubscriptionRow,
} from "@/lib/data/tracking-types";
import {
  addTrackingSubscriptionAction,
  deleteTrackingSubscriptionAction,
  refreshTrackingSubscriptionAction,
  type TrackingFormState,
} from "./tracking-actions";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const PROVIDER_OPTIONS: TrackingProvider[] = ["manual", "searates", "vizion"];
const REF_KIND_OPTIONS: TrackingRefKind[] = ["container", "bl", "awb", "booking"];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function ProviderBadge({ provider }: { provider: TrackingProvider }) {
  const tone =
    provider === "manual"
      ? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
      : "bg-primary/10 text-primary ring-1 ring-primary/20";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {TRACKING_PROVIDER_LABEL[provider]}
    </span>
  );
}

export function TrackingView({
  processId,
  rows,
}: {
  processId: string;
  rows: TrackingSubscriptionRow[];
}) {
  const [pending, startTransition] = useTransition();
  const action = (prev: TrackingFormState, fd: FormData) =>
    addTrackingSubscriptionAction(processId, prev, fd);
  const [state, formAction, addPending] = useActionState<TrackingFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const refId = useId();
  const providerId = useId();
  const kindId = useId();

  useEffect(() => {
    if (state.success) {
      toast.success("Rastreamento adicionado.");
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Radio className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Adicionar rastreamento</h2>
            <p className="text-xs text-slate-500">
              Conecte container, BL, AWB ou booking a um provedor. <strong>SeaRates</strong> só
              rastreia marítimo (CT/BL/BK — sem AWB). <strong>Manual</strong> serve pra registrar
              eventos sem provedor externo.
            </p>
          </div>
        </header>
        <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <label htmlFor={providerId} className="mb-1.5 block text-xs font-medium text-slate-700">
              Provedor
            </label>
            <select
              id={providerId}
              name="provider"
              defaultValue="manual"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {TRACKING_PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor={kindId} className="mb-1.5 block text-xs font-medium text-slate-700">
              Tipo
            </label>
            <select
              id={kindId}
              name="refKind"
              defaultValue="container"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {REF_KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {TRACKING_REF_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <label htmlFor={refId} className="mb-1.5 block text-xs font-medium text-slate-700">
              Identificador
            </label>
            <input
              id={refId}
              name="externalRef"
              placeholder="MSCU1234567"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 font-mono text-sm uppercase text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <FieldError msg={state.fieldErrors?.externalRef?.[0]} />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={addPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <Plus className="size-4" />
              Adicionar
            </button>
          </div>
        </form>
        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Rastreamentos ativos</h2>
          <p className="text-xs text-slate-500">
            <strong>SeaRates:</strong> clique em <RefreshCw className="inline size-3" /> pra buscar
            o status agora (consome 1 chamada da cota). <strong>Manual:</strong> adicione eventos
            pela Timeline. Webhooks assinados também chegam em{" "}
            <code className="font-mono text-[11px]">/api/webhooks/tracking</code>.
          </p>
        </header>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhum rastreamento configurado ainda.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">{row.externalRef}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {TRACKING_REF_KIND_LABEL[row.refKind]}
                    </span>
                    <ProviderBadge provider={row.provider} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {row.lastEventAt
                      ? `Último evento: ${dateFmt.format(row.lastEventAt)}`
                      : "Aguardando primeiro evento."}
                    {row.disabled && (
                      <span className="ml-2 text-red-600">· Desativado ({row.disabled})</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {row.provider === "searates" && (
                    <button
                      type="button"
                      disabled={pending && refreshingId === row.id}
                      onClick={() => {
                        setRefreshingId(row.id);
                        startTransition(async () => {
                          try {
                            const r = await refreshTrackingSubscriptionAction(processId, row.id);
                            if (r.accepted > 0) {
                              toast.success(
                                `${r.accepted} novo${r.accepted === 1 ? "" : "s"} evento${r.accepted === 1 ? "" : "s"} importado${r.accepted === 1 ? "" : "s"}.`,
                              );
                            } else if (r.status) {
                              toast.info(`Sem novidades. Status atual: ${r.status}.`);
                            } else {
                              toast.info("Sem novidades.");
                            }
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Falha ao atualizar.");
                          } finally {
                            setRefreshingId(null);
                          }
                        });
                      }}
                      aria-label="Atualizar agora"
                      title="Consultar SeaRates agora (consome cota)"
                      className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`size-4 ${pending && refreshingId === row.id ? "animate-spin" : ""}`}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending && deletingId === row.id}
                    onClick={() => {
                      setDeletingId(row.id);
                      startTransition(async () => {
                        try {
                          await deleteTrackingSubscriptionAction(processId, row.id);
                          toast.success("Rastreamento removido.");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Falha ao remover.");
                        } finally {
                          setDeletingId(null);
                        }
                      });
                    }}
                    aria-label="Remover rastreamento"
                    className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
