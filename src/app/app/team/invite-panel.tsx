"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteTeamMemberAction, type InviteState } from "./actions";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function InvitePanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<InviteState, FormData>(inviteTeamMemberAction, {});
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success && state.inviteUrl) {
      setLastUrl(state.inviteUrl);
      toast.success("Convite criado.");
      formRef.current?.reset();
    }
  }, [state.success, state.inviteUrl]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-12">
        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required />
          <ErrorText msg={f.name?.[0]} />
        </div>
        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required />
          <ErrorText msg={f.email?.[0]} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="role">Papel</Label>
          <Select name="role" defaultValue="broker_staff">
            <SelectTrigger id="role"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="broker_staff">Equipe</SelectItem>
              <SelectItem value="broker_admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <ErrorText msg={f.role?.[0]} />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Convidar"}
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {lastUrl && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Link do convite (expira em 72h):</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate font-mono text-xs">{lastUrl}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(lastUrl);
                toast.success("Link copiado.");
              }}
            >
              <Copy className="size-3.5" />
              Copiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
