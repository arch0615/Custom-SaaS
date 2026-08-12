"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ResetState } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const action = (prev: ResetState, fd: FormData) => resetPasswordAction(token, prev, fd);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(action, {});

  if (state.success) {
    return (
      <div className="space-y-4 text-sm">
        <p>Senha redefinida com sucesso.</p>
        <Button asChild className="w-full">
          <Link href="/login">Entrar com a nova senha</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors?.password && (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors?.confirm && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirm[0]}</p>
        )}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Definir nova senha"}
      </Button>
    </form>
  );
}
