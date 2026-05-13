import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { authConfig } from "./auth.config";
import { db } from "./db/client";
import { users } from "./db/schema/auth";
import { orgMembers } from "./db/schema/organizations";
import { verifyPassword } from "./lib/auth/password";

const credentialsSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1),
});

async function loadActiveMembership(userId: string) {
  const rows = await db
    .select({ orgId: orgMembers.orgId, role: orgMembers.role })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) return null;

        const membership = await loadActiveMembership(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          activeOrgId: membership?.orgId ?? null,
          activeRole: membership?.role ?? null,
        };
      },
    }),
  ],
});
