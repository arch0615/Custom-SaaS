"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, Key, Lock, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, type PasswordState } from "./actions";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function PasswordInput({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Key className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-stone-200 bg-stone-50/50 pl-10 pr-10 text-sm text-stone-700 placeholder:text-stone-400 focus:border-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/15"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function SecurityTab({
  passwordChangedAt,
  currentSessionAgent,
}: {
  passwordChangedAt: Date | null;
  currentSessionAgent: string;
}) {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    {},
  );
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success("Senha alterada com sucesso.");
  }, [state.success]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Lock className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Alterar senha</h2>
            <p className="text-xs text-stone-500">
              {passwordChangedAt
                ? `Última alteração: ${dateFmt.format(passwordChangedAt)}`
                : "Defina uma senha forte para proteger sua conta."}
            </p>
          </div>
        </header>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="current" className="mb-1.5 block text-xs font-medium text-stone-700">
              Senha atual
            </label>
            <PasswordInput id="current" name="current" placeholder="Digite sua senha atual" />
            <FieldError msg={f.current?.[0]} />
          </div>
          <div>
            <label htmlFor="next" className="mb-1.5 block text-xs font-medium text-stone-700">
              Nova senha
            </label>
            <PasswordInput id="next" name="next" placeholder="Mínimo 8 caracteres" />
            <FieldError msg={f.next?.[0]} />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-stone-700">
              Confirmar nova senha
            </label>
            <PasswordInput id="confirm" name="confirm" placeholder="Repita a nova senha" />
            <FieldError msg={f.confirm?.[0]} />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex flex-col items-start justify-between gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-stone-500">Use uma senha forte com letras, números e símbolos</p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {pending ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
              <ShieldCheck className="size-4" />
            </span>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-stone-900">Autenticação de dois fatores</h2>
              <p className="text-xs text-stone-500">
                Adicione uma camada extra de segurança. Em breve poderemos enviar um código por SMS ao
                fazer login em um novo dispositivo.
              </p>
              <p className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                <span className="size-1.5 rounded-full bg-stone-300" />
                Em breve
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            title="Em breve"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-500 disabled:cursor-not-allowed"
          >
            <Smartphone className="size-4" />
            Gerenciar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Sessões ativas</h2>
          <p className="text-xs text-stone-500">Onde você está conectado agora.</p>
        </header>
        <div className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/40 p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Monitor className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">Esta sessão</p>
              <p className="text-xs text-stone-500">{currentSessionAgent}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            Ativa
          </span>
        </div>
      </section>
    </div>
  );
}
