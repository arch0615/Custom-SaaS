"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STAGE_LABEL, STAGE_OPTIONS_GROUPED, isStageJump } from "@/lib/process-status";
import type { ProcessStage } from "@/lib/data/processes";
import { advanceStageAction } from "./actions";

export function StageSelector({
  processId,
  currentStage,
}: {
  processId: string;
  currentStage: ProcessStage;
}) {
  const [target, setTarget] = useState<ProcessStage | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const open = target !== null;
  const jump = target ? isStageJump(currentStage, target) : false;

  return (
    <>
      <SearchableSelect
        value={currentStage}
        onValueChange={(v) => {
          const next = v as ProcessStage;
          if (next !== currentStage) setTarget(next);
        }}
        groups={STAGE_OPTIONS_GROUPED}
        placeholder="Selecione uma etapa"
        searchPlaceholder="Buscar etapa..."
        className="w-[260px]"
      />

      <Dialog open={open} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar etapa</DialogTitle>
            <DialogDescription>
              De <strong>{STAGE_LABEL[currentStage]}</strong> para{" "}
              <strong>{target ? STAGE_LABEL[target] : ""}</strong>.
              {jump && (
                <span className="mt-2 block rounded bg-amber-100 px-2 py-1 text-amber-900">
                  Atenção: você está pulando etapas. O evento será marcado como não sequencial.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="stage-note">Observação (opcional)</Label>
            <Textarea
              id="stage-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ex.: documentação aprovada pela receita."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                if (!target) return;
                const fd = new FormData();
                fd.set("stage", target);
                if (note) fd.set("note", note);
                startTransition(async () => {
                  try {
                    await advanceStageAction(processId, fd);
                    toast.success(`Etapa alterada para ${STAGE_LABEL[target]}`);
                    setTarget(null);
                    setNote("");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao avançar etapa.");
                  }
                });
              }}
            >
              {pending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
