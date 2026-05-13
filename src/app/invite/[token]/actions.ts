"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { consumeInviteToken, findInviteToken } from "@/lib/data/invites";
import { hashPassword } from "@/lib/auth/password";

export type AcceptState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const acceptSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Senhas não conferem",
    path: ["confirm"],
  });

export async function acceptInviteAction(
  token: string,
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const parsed = acceptSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const inviteRow = await findInviteToken(token);
  if (!inviteRow) return { error: "Convite inválido ou já utilizado." };
  if (inviteRow.expires < new Date()) {
    return { error: "Convite expirado. Peça um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, emailVerified: sql`now()` })
      .where(eq(users.email, inviteRow.identifier));
  });

  await consumeInviteToken(inviteRow.identifier, token);

  try {
    await signIn("credentials", {
      email: inviteRow.identifier,
      password: parsed.data.password,
      redirectTo: "/app",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Senha definida. Faça login para continuar." };
    }
    throw err;
  }
  return {};
}
