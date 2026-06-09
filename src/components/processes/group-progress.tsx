import { Check } from "lucide-react";
import {
  STAGE_GROUP,
  STAGE_GROUP_LABEL,
  STAGE_GROUP_ORDER,
  STAGE_LABEL,
  type StageGroup,
} from "@/lib/process-status";
import type { ProcessStage } from "@/lib/data/processes";

/**
 * Barra de progresso agrupada para a área do cliente.
 *
 * Mostra os 8 grupos do workflow v2 como segmentos. O grupo atual fica
 * destacado em primary; grupos anteriores aparecem como concluídos (check);
 * grupos posteriores ficam neutros. Embaixo da barra mostra o nome legível
 * do sub-status atual.
 *
 * Processos em estágios legacy caem no grupo "Legado" — a barra exibe um
 * indicador discreto pra deixar claro que esse processo está num fluxo
 * antigo (sem passos detalhados).
 */
export function GroupProgress({ stage }: { stage: ProcessStage }) {
  const currentGroup = STAGE_GROUP[stage];
  const visibleGroups: StageGroup[] = STAGE_GROUP_ORDER.filter((g) => g !== "legado");
  const isLegacy = currentGroup === "legado";
  const currentIdx = isLegacy ? -1 : visibleGroups.indexOf(currentGroup);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {visibleGroups.map((g, i) => {
          const isPast = !isLegacy && i < currentIdx;
          const isCurrent = !isLegacy && i === currentIdx;
          const isFuture = isLegacy || (!isPast && !isCurrent);
          return (
            <div key={g} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-2 w-full items-center justify-center rounded-full transition-colors ${
                  isPast
                    ? "bg-primary"
                    : isCurrent
                      ? "bg-primary/80"
                      : "bg-slate-200"
                }`}
                aria-label={STAGE_GROUP_LABEL[g]}
              />
              <span
                className={`hidden text-center text-[10px] font-medium leading-tight sm:block ${
                  isCurrent
                    ? "text-slate-900"
                    : isPast
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {isPast && <Check className="mx-auto mb-0.5 size-3 text-primary" />}
                {STAGE_GROUP_LABEL[g]}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className={`flex items-baseline gap-2 rounded-lg border px-3 py-2 ${
          isLegacy
            ? "border-slate-200 bg-slate-50/40 text-slate-600"
            : "border-primary/20 bg-primary/5"
        }`}
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {STAGE_GROUP_LABEL[currentGroup]}
        </span>
        <span
          className={`text-sm font-semibold ${isLegacy ? "text-slate-700" : "text-primary"}`}
        >
          {STAGE_LABEL[stage]}
        </span>
      </div>
    </div>
  );
}
