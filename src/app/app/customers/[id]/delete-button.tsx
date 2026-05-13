"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { deleteCustomerAction } from "./actions";

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          Desativar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar este cliente?</DialogTitle>
          <DialogDescription>
            <strong>{name}</strong> ficará oculto da lista. Os processos existentes permanecem.
            Você pode reativar depois entrando em contato com o administrador.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteCustomerAction(id);
                } catch (err) {
                  if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
                    return;
                  }
                  toast.error("Falha ao desativar cliente.");
                }
              });
            }}
          >
            {pending ? "Desativando..." : "Desativar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
