"use client";

import { useState, useTransition } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { setNotificationPreferenceAction } from "./actions";
import type { NotificationKind } from "@/lib/data/notifications-types";

export type EmailPrefs = Partial<Record<NotificationKind, { email: boolean; inApp: boolean }>>;

type EmailRow = {
  kind: NotificationKind;
  label: string;
  description: string;
};

const EMAIL_ROWS: EmailRow[] = [
  {
    kind: "stage_advanced",
    label: "Mudança de status",
    description: "Aviso quando um processo avançar de etapa (ex: Em análise → Liberado)",
  },
  {
    kind: "doc_added_by_client",
    label: "Documento enviado pelo cliente",
    description: "E-mail quando um cliente enviar um novo documento para revisão",
  },
  {
    kind: "client_requested_update",
    label: "Solicitação do cliente",
    description: "Aviso quando um cliente solicitar atualização de um processo",
  },
  {
    kind: "daily_digest",
    label: "Resumo periódico",
    description: "Resumo com processos ativos e prazos próximos",
  },
];

function Toggle({
  on,
  disabled,
  onChange,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? "bg-teal-600" : "bg-stone-200"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function EmailToggleRow({
  row,
  initial,
  defaultEmail,
}: {
  row: EmailRow;
  initial: { email: boolean; inApp: boolean } | undefined;
  defaultEmail: boolean;
}) {
  const [on, setOn] = useState(initial?.email ?? defaultEmail);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setOn(next);
    startTransition(async () => {
      try {
        await setNotificationPreferenceAction({
          kind: row.kind,
          channel: "email",
          enabled: next,
        });
      } catch (err) {
        setOn(!next);
        toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900">{row.label}</p>
        <p className="text-xs text-stone-500">{row.description}</p>
      </div>
      <Toggle on={on} onChange={handleChange} disabled={pending} label={row.label} />
    </div>
  );
}

function StaticToggleRow({ label, description, on }: { label: string; description: string; on: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900">{label}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <Toggle on={on} disabled label={label} />
    </div>
  );
}

export function NotificationsTab({
  userEmail,
  prefs,
  defaults,
}: {
  userEmail: string;
  prefs: EmailPrefs;
  defaults: Record<NotificationKind, { email: boolean; inApp: boolean }>;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Mail className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">E-mail</h2>
            <p className="text-xs text-stone-500">Notificações enviadas para {userEmail}</p>
          </div>
        </header>
        <div className="divide-y divide-stone-100">
          {EMAIL_ROWS.map((row) => (
            <EmailToggleRow
              key={row.kind}
              row={row}
              initial={prefs[row.kind]}
              defaultEmail={defaults[row.kind].email}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm opacity-90">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <MessageSquare className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Push no navegador</h2>
              <p className="text-xs text-stone-500">Notificações instantâneas no desktop e mobile</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            Em breve
          </span>
        </header>
        <div className="divide-y divide-stone-100">
          <StaticToggleRow
            label="Novo processo"
            description="Pop-up no navegador quando um processo for criado"
            on={false}
          />
          <StaticToggleRow
            label="Mudança de status"
            description="Notificação push para qualquer alteração de etapa"
            on={false}
          />
          <StaticToggleRow
            label="Mensagem do cliente"
            description="Aviso rápido para comunicações do portal"
            on={false}
          />
        </div>
      </section>

      <p className="text-center text-xs text-stone-500">
        Alterações em E-mail são salvas automaticamente.
      </p>
    </div>
  );
}
