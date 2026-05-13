"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgSettingsAction, type SettingsState } from "./actions";

export function SettingsForm({ orgName }: { orgName: string }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateOrgSettingsAction,
    {},
  );

  useEffect(() => {
    if (state.success) toast.success("Configurações salvas.");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da empresa</Label>
        <Input id="name" name="name" defaultValue={orgName} required />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
