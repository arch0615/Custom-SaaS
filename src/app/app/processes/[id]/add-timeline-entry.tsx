"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addTimelineEntryAction, type TimelineFormState } from "./timeline-actions";

function localNowValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function AddTimelineEntry({
  processId,
  variant = "button",
}: {
  processId: string;
  variant?: "button" | "fab";
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const noteId = useId();
  const occurredId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const action = (prev: TimelineFormState, fd: FormData) =>
    addTimelineEntryAction(processId, prev, fd);

  const [state, formAction, pending] = useActionState<TimelineFormState, FormData>(action, {});
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) {
      toast.success("Atualização adicionada.");
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "fab" ? (
          <Button
            size="icon"
            className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg md:hidden"
            aria-label="Adicionar atualização"
          >
            <Plus className="size-6" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Adicionar atualização
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar atualização à timeline</DialogTitle>
          <DialogDescription>
            Registre um evento manual deste processo. Você pode retroceder a data se a atualização aconteceu antes.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={titleId}>Título *</Label>
            <Input
              id={titleId}
              name="title"
              placeholder="Ex.: Booking confirmado pelo armador"
              required
              autoFocus
            />
            <ErrorText msg={f.title?.[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={occurredId}>Quando aconteceu</Label>
            <Input
              id={occurredId}
              name="occurredAt"
              type="datetime-local"
              defaultValue={localNowValue()}
              required
            />
            <ErrorText msg={f.occurredAt?.[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={noteId}>Observação</Label>
            <Textarea
              id={noteId}
              name="note"
              rows={3}
              placeholder="Detalhes adicionais que ajudem a contar a história do processo."
            />
            <ErrorText msg={f.note?.[0]} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
