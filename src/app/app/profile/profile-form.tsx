"use client";

import { useActionState, useEffect } from "react";
import { Mail, User } from "lucide-react";
import { toast } from "sonner";
import { updateUserProfileAction, type ProfileState } from "./actions";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function UserProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateUserProfileAction,
    {},
  );
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success("Perfil atualizado.");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
          Nome completo
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="name"
            name="name"
            defaultValue={initialName}
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <FieldError msg={f.name?.[0]} />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">
          E-mail
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            defaultValue={email}
            disabled
            className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 pl-10 pr-3 text-sm text-slate-500"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Use Segurança em Configurações para alterar a senha.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
