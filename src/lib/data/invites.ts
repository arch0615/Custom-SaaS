import { and, eq, lt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { verificationTokens } from "@/db/schema/auth";

const INVITE_TTL_HOURS = 72;

export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createInviteToken(email: string): Promise<{ token: string; expires: Date }> {
  // Cleanup expired tokens for this email
  const now = new Date();
  await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), lt(verificationTokens.expires, now)));

  const token = generateInviteToken();
  const expires = new Date(now.getTime() + INVITE_TTL_HOURS * 60 * 60 * 1000);
  await db.insert(verificationTokens).values({ identifier: email, token, expires });
  return { token, expires };
}

export async function findInviteToken(token: string) {
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1);
  return row ?? null;
}

export async function consumeInviteToken(identifier: string, token: string) {
  const [row] = await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
    .returning({ identifier: verificationTokens.identifier });
  return row ?? null;
}
