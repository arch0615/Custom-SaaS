import Link from "next/link";
import {
  Anchor,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Package,
  Ship,
  Truck,
} from "lucide-react";
import type { ProcessStage } from "@/lib/data/processes";
import { stageIndex } from "@/lib/process-status";
import type { FeaturedProcess } from "@/lib/data/dashboard";

type Milestone = {
  key: string;
  label: string;
  icon: typeof Ship;
  fromStage: ProcessStage;
};

const MILESTONES: Milestone[] = [
  { key: "booking", label: "Booking", icon: CalendarCheck, fromStage: "aguarda_prontidao_carga" },
  { key: "embarque", label: "Embarque", icon: Ship, fromStage: "aguarda_embarque" },
  { key: "transito", label: "Em trânsito", icon: Truck, fromStage: "aguarda_transbordo" },
  { key: "chegada", label: "Chegada", icon: Anchor, fromStage: "aguarda_chegada" },
  { key: "desembaraco", label: "Desembaraço", icon: FileText, fromStage: "liberado" },
  { key: "entrega", label: "Entrega", icon: Package, fromStage: "aguarda_pagamento" },
];

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function currentMilestoneIndex(stage: ProcessStage): number {
  const idx = stageIndex(stage);
  let last = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (stageIndex(MILESTONES[i].fromStage) <= idx) last = i;
  }
  return last;
}

export function ProcessMilestones({ process }: { process: FeaturedProcess | null }) {
  if (!process) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Acompanhamento de processo
          </h2>
          <p className="text-sm text-slate-500">
            Quando você abrir um processo, ele aparece aqui com a etapa atual.
          </p>
        </header>
      </article>
    );
  }

  const currentIdx = currentMilestoneIndex(process.stage);
  const etdLabel = process.shipmentDate ? dateFmt.format(process.shipmentDate) : null;
  const arrivalLabel = process.arrivalDate ? dateFmt.format(process.arrivalDate) : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Acompanhamento de processo
          </h2>
          <p className="text-sm text-slate-500">
            <Link href={`/app/processes/${process.id}`} className="font-medium text-primary hover:underline">
              {process.reference}
            </Link>
            <span className="text-slate-400"> · </span>
            {process.customerName}
          </p>
        </div>
      </header>

      <ol className="relative grid grid-cols-3 gap-y-6 sm:grid-cols-6">
        {MILESTONES.map((m, i) => {
          const Icon = m.icon;
          const done = i < currentIdx;
          const active = i === currentIdx;
          const pending = i > currentIdx;
          const dateForStep =
            m.key === "embarque" && etdLabel ? etdLabel :
            m.key === "chegada" && arrivalLabel ? arrivalLabel :
            null;
          return (
            <li key={m.key} className="relative flex flex-col items-center text-center">
              {i < MILESTONES.length - 1 ? (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-1/2 top-6 hidden h-0.5 w-full sm:block ${
                    i < currentIdx ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 inline-flex size-12 items-center justify-center rounded-full ring-4 ring-white ${
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
              </span>
              <span
                className={`mt-2 text-xs font-medium ${
                  pending ? "text-slate-400" : "text-slate-700"
                }`}
              >
                {m.label}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                {dateForStep ?? (pending ? "Pendente" : active ? "Em andamento" : "Concluído")}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
