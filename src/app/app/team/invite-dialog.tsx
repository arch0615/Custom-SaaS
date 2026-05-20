"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvitePanel } from "./invite-panel";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          <Plus className="size-4" />
          Convidar membro
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Convidar novo membro</DialogTitle>
          <DialogDescription>
            O convite chega por e-mail (se Resend estiver configurado) e o link aparece aqui para
            você poder copiar e enviar manualmente.
          </DialogDescription>
        </DialogHeader>
        <InvitePanel />
      </DialogContent>
    </Dialog>
  );
}
