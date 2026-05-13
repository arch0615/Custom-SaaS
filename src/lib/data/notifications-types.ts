export type NotificationKind =
  | "stage_advanced"
  | "doc_added_by_broker"
  | "doc_added_by_client"
  | "client_requested_update"
  | "pendency_flagged"
  | "process_delayed"
  | "team_invited"
  | "client_invited"
  | "doc_replaced"
  | "daily_digest";

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  stage_advanced: "Etapa avançou",
  doc_added_by_broker: "Novo documento",
  doc_added_by_client: "Documento enviado pelo cliente",
  client_requested_update: "Cliente solicitou atualização",
  pendency_flagged: "Pendência marcada",
  process_delayed: "Processo atrasado",
  team_invited: "Convite enviado",
  client_invited: "Convite ao cliente",
  doc_replaced: "Documento substituído",
  daily_digest: "Resumo diário",
};

export type NotificationDefaults = { email: boolean; inApp: boolean };

export const NOTIFICATION_DEFAULTS: Record<NotificationKind, NotificationDefaults> = {
  stage_advanced: { email: true, inApp: true },
  doc_added_by_broker: { email: true, inApp: true },
  doc_added_by_client: { email: false, inApp: true },
  client_requested_update: { email: true, inApp: true },
  pendency_flagged: { email: true, inApp: true },
  process_delayed: { email: true, inApp: true },
  team_invited: { email: true, inApp: false },
  client_invited: { email: true, inApp: false },
  doc_replaced: { email: false, inApp: true },
  daily_digest: { email: false, inApp: false },
};
