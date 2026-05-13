"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction, type AcceptState } from "./actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const action = (prev: AcceptState, fd: FormData) => acceptInviteAction(token, prev, fd);
  const [state, formAction, pending] = useActionState<AcceptState, FormData>(action, {});
  const f = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        {f.password?.[0] && <p className="text-sm text-destructive">{f.password[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        {f.confirm?.[0] && <p className="text-sm text-destructive">{f.confirm[0]}</p>}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Definir senha e entrar"}
      </Button>
    </form>
  );
}
