"use server";

import { z } from "zod";

import {
  createPasswordResetToken,
  findUserByEmail,
} from "@/lib/data/password-reset";
import { sendEmail } from "@/lib/email/resend";
import { rateLimit } from "@/lib/rate-limit";

export type ForgotState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

function resetOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function requestPasswordResetAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Rate limit: máximo 3 pedidos por email por hora. Evita spam/abuse.
  if (!rateLimit({ bucket: `forgot:${email}`, max: 3, windowMs: 60 * 60 * 1000 })) {
    // Mesma resposta "sucesso" pra não vazar info — mas não emitimos email.
    return { success: true };
  }

  const user = await findUserByEmail(email);

  // Fire-and-forget: sempre retornamos "sucesso" pro cliente, independente
  // do email existir. Isso evita enumeração de contas (attacker não descobre
  // quais emails estão cadastrados testando o endpoint).
  if (user) {
    try {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${resetOrigin()}/reset-password/${token}`;
      await sendEmail({
        to: email,
        subject: "Redefinir sua senha — AduanaSync",
        text: `Olá${user.name ? `, ${user.name}` : ""}!

Recebemos um pedido para redefinir a senha da sua conta no AduanaSync.

Para criar uma nova senha, clique no link abaixo (válido por 1 hora):

${resetUrl}

Se você não pediu essa redefinição, pode ignorar este email — sua senha atual continua valendo.

— AduanaSync`,
      });
    } catch {
      // Silencioso: não expõe falha ao cliente.
    }
  }

  return { success: true };
}
