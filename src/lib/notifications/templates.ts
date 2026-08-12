import type { NotificationKind } from "@/lib/data/notifications-types";

export type RenderedNotification = {
  title: string;
  body: string | null;
  href: string | null;
  emailSubject: string;
  emailText: string;
};

/** Formata o assunto padrão "FOLLOW UP" pedido pelo Matheus:
 *    FOLLOW UP / <BL> + <INVOICE> + <REF>
 * Partes ausentes são omitidas junto com o "+" correspondente.
 */
function followUpSubject(bl: string, invoice: string, ref: string): string {
  const parts = [bl, invoice, ref].filter(Boolean);
  return parts.length > 0 ? `FOLLOW UP / ${parts.join(" + ")}` : "FOLLOW UP";
}

/** Assinatura padrão: quem fez a ação + nome do broker + link do sistema. */
function signature(actorName: string, orgName: string, portalUrl: string): string {
  const actor = actorName || "Equipe";
  const line1 = `${actor} – ${orgName}`.trim();
  return portalUrl ? `${line1}\n${portalUrl}` : line1;
}

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
  const numeroBl = String(payload.numeroBl ?? "");
  const numeroInvoice = String(payload.numeroInvoice ?? "");
  const actorName = String(payload.actorName ?? "");
  const orgName = String(payload.orgName ?? "");
  const portalUrl = String(payload.portalUrl ?? "");

  const followUp = followUpSubject(numeroBl, numeroInvoice, ref);
  const sig = signature(actorName, orgName, portalUrl);
  const helloTarget = customerName || "cliente";

  switch (kind) {
    case "stage_advanced":
      return {
        title: `${ref} avançou para ${stageLabel}`,
        body: customerName ? `Empresa: ${customerName}` : null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: followUp,
        emailText: `Olá, ${helloTarget}!

Seu processo ${ref} teve uma nova atualização:
BL: ${numeroBl || "—"}
Invoice: ${numeroInvoice || "—"}
Status: ${stageLabel}

Continuamos acompanhando o processo e informaremos você sobre os próximos avanços.

${sig}`,
      };
    case "doc_added_by_broker":
      return {
        title: `Novo documento em ${ref}: ${docFilename}`,
        body: [customerName ? `Empresa: ${customerName}` : null, docType ? `Tipo: ${docType}` : null]
          .filter(Boolean)
          .join(" · ") || null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: followUp,
        emailText: `Olá, ${helloTarget}!

Seu processo ${ref} teve uma nova atualização:
BL: ${numeroBl || "—"}
Invoice: ${numeroInvoice || "—"}
Documento adicionado: ${docFilename}${docType ? ` (${docType})` : ""}

Continuamos acompanhando o processo e informaremos você sobre os próximos avanços.

${sig}`,
      };
    case "doc_replaced":
      return {
        title: `${ref}: documento substituído (${docFilename})`,
        body: customerName ? `Empresa: ${customerName}` : null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: followUp,
        emailText: `Olá, ${helloTarget}!

Seu processo ${ref} teve uma nova atualização:
BL: ${numeroBl || "—"}
Invoice: ${numeroInvoice || "—"}
Documento substituído: ${docFilename}

Continuamos acompanhando o processo e informaremos você sobre os próximos avanços.

${sig}`,
      };
    case "pendency_flagged":
      return {
        title: `Pendência em ${ref}`,
        body: customerName ? `Empresa: ${customerName}` : null,
        href: processId ? `/portal/processes/${processId}` : null,
        emailSubject: followUp,
        emailText: `Olá, ${helloTarget}!

Seu processo ${ref} teve uma nova atualização:
BL: ${numeroBl || "—"}
Invoice: ${numeroInvoice || "—"}
Pendência sinalizada — verifique no portal.

Continuamos acompanhando o processo e informaremos você sobre os próximos avanços.

${sig}`,
      };
    // ─── Broker-facing (não muda) ──────────────────────────────
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
    case "process_delayed":
      return {
        title: `${ref} está atrasado`,
        body: customerName ? `Cliente: ${customerName}` : null,
        href: processId ? `/app/processes/${processId}` : null,
        emailSubject: `Atenção: processo ${ref} está atrasado`,
        emailText: `O processo ${ref} ultrapassou a data prevista de chegada.`,
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
