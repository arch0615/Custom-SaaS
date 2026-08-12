"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { hashPassword } from "@/lib/auth/password";
import {
  consumeResetToken,
  findValidResetToken,
} from "@/lib/data/password-reset";
import { rateLimit } from "@/lib/rate-limit";

export type ResetState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

export async function resetPasswordAction(
  token: string,
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  // Rate limit contra brute-force do endpoint (por token).
  if (!rateLimit({ bucket: `reset:${token.slice(0, 12)}`, max: 5, windowMs: 10 * 60 * 1000 })) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const found = await findValidResetToken(token);
  if (!found) {
    return { error: "Link inválido ou expirado. Solicite um novo em Esqueci minha senha." };
  }

  const newHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, found.userId));
  await consumeResetToken(found.tokenId);

  return { success: true };
}
