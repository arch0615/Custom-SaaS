export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type SendResult = { ok: true; id: string } | { ok: false; reason: string };

async function sendViaResend(msg: EmailMessage, apiKey: string, from: string): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      reply_to: msg.replyTo,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, reason: `Resend HTTP ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id ?? "" };
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[email:skipped] no RESEND_API_KEY/EMAIL_FROM →", msg.subject, "to", msg.to);
    }
    return { ok: false, reason: "missing-credentials" };
  }

  try {
    return await sendViaResend(msg, apiKey, from);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
