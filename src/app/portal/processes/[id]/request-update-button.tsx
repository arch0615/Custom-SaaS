"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestUpdateAction } from "./actions";

export function RequestUpdateButton({
  processId,
  impersonateId,
  disabled,
}: {
  processId: string;
  impersonateId?: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle2 className="size-4 text-emerald-600" />
        Solicitação enviada
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          try {
            await requestUpdateAction(processId, impersonateId);
            setSent(true);
            toast.success("Solicitação enviada ao despachante.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Falha ao enviar solicitação.");
          }
        })
      }
    >
      <Bell className="size-4" />
      {pending ? "Enviando..." : "Solicitar atualização"}
    </Button>
  );
}
