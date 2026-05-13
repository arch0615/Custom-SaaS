import type { NotificationKind } from "@/lib/data/notifications-types";

export type RenderedNotification = {
  title: string;
  body: string | null;
  href: string | null;
  emailSubject: string;
  emailText: string;
};

export function renderNotification(
  kind: NotificationKind,
  payload: Record<string, unknown>,
): RenderedNotification {
  const ref = String(payload.processReference ?? "");
  const customerName = String(payload.customerName ?? "");
  const processId = String(payload.processId ?? "");
  const stageLabel = String(payload.stageLabel ?? "");
  const docFilename = String(payload.filename ?? "");
  const docType = String(payload.docType ?? "");

  switch (kind) {
    case "stage_advanced":
      return {
        title: `${ref} avançou para ${stageLabel}`,
        body: customerName ? `Cliente: ${customerName}` : null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: `Seu processo ${ref} avançou para ${stageLabel}`,
        emailText: `Olá,

O processo ${ref} avançou para a etapa "${stageLabel}".

Acompanhe os detalhes no portal.

— Despachante`,
      };
    case "doc_added_by_broker":
      return {
        title: `Novo documento em ${ref}: ${docFilename}`,
        body: docType ? `Tipo: ${docType}` : null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: `Novo documento em ${ref}`,
        emailText: `Olá,

O despachante adicionou o documento "${docFilename}" ao processo ${ref}.

— Despachante`,
      };
    case "doc_added_by_client":
      return {
        title: `Cliente enviou um documento em ${ref}: ${docFilename}`,
        body: customerName ? `De: ${customerName}` : null,
        href: processId ? `/app/processes/${processId}` : null,
        emailSubject: `Documento recebido para revisão em ${ref}`,
        emailText: `O cliente ${customerName} enviou "${docFilename}" no processo ${ref} para revisão.`,
      };
    case "client_requested_update":
      return {
        title: `${customerName || "Cliente"} solicitou atualização em ${ref}`,
        body: null,
        href: processId ? `/app/processes/${processId}` : null,
        emailSubject: `Solicitação de atualização: ${ref}`,
        emailText: `O cliente ${customerName} solicitou atualização no processo ${ref}.`,
      };
    case "doc_replaced":
      return {
        title: `${ref}: documento substituído (${docFilename})`,
        body: null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: `Documento substituído em ${ref}`,
        emailText: `O documento "${docFilename}" no processo ${ref} foi substituído por uma nova versão.`,
      };
    case "process_delayed":
      return {
        title: `${ref} está atrasado`,
        body: customerName ? `Cliente: ${customerName}` : null,
        href: processId ? `/app/processes/${processId}` : null,
        emailSubject: `Atenção: processo ${ref} está atrasado`,
        emailText: `O processo ${ref} ultrapassou a data prevista de chegada.`,
      };
    case "pendency_flagged":
      return {
        title: `Pendência em ${ref}`,
        body: null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: `Pendência em ${ref}`,
        emailText: `Há uma pendência no processo ${ref}. Verifique no portal.`,
      };
    case "team_invited":
    case "client_invited":
      return {
        title: payload.title ? String(payload.title) : "Convite",
        body: null,
        href: null,
        emailSubject: "Convite",
        emailText: "Você foi convidado.",
      };
    case "daily_digest":
      return {
        title: "Resumo diário",
        body: null,
        href: "/app",
        emailSubject: "Resumo diário",
        emailText: "Confira o resumo no app.",
      };
  }
}
