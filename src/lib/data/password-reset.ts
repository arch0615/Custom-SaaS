import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";

import { db } from "@/db/client";
import { passwordResetTokens, users } from "@/db/schema/auth";

/** Duração de um token: 1 hora. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Gera 32 bytes aleatórios, retorna string base64url pra colocar na URL. */
function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Cria um novo token de reset pro user. Invalida os tokens anteriores
 * (marcando como used) — só o mais recente é válido de cada vez.
 * Retorna o token CLARO (só chamador vê — vai pra URL do email).
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.transaction(async (tx) => {
    // Invalida tokens ativos anteriores.
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: sql`now()` })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    await tx.insert(passwordResetTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });
  });

  return raw;
}

/**
 * Busca (mas não consome) um token válido a partir da string clara.
 * Retorna o userId se ok, null se inválido/expirado/usado.
 */
export async function findValidResetToken(rawToken: string): Promise<{
  tokenId: string;
  userId: string;
} | null> {
  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .select({
      tokenId: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, sql`now()`),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Marca o token como consumido. Idempotente — se já foi consumido,
 * não faz nada.
 */
export async function consumeResetToken(tokenId: string): Promise<void> {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: sql`now()` })
    .where(
      and(
        eq(passwordResetTokens.id, tokenId),
        isNull(passwordResetTokens.usedAt),
      ),
    );
}

/** Helper: procura user pelo email (case-insensitive). */
export async function findUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  name: string | null;
} | null> {
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}
