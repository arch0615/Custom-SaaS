"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { organizations, orgMembers } from "@/db/schema/organizations";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/auth/slug";
import { signIn } from "@/auth";

const signupSchema = z.object({
  orgName: z.string().min(2, "Nome da empresa muito curto").max(100),
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "org";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: (formData.get("email") as string | null)?.toLowerCase().trim(),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { orgName, name, email, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma conta com esse e-mail." };
  }

  const slug = await uniqueOrgSlug(orgName);
  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: orgName, slug })
      .returning({ id: organizations.id });

    const [user] = await tx
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id });

    await tx.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: "broker_admin",
    });
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/app" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Conta criada, mas falhou ao entrar. Tente o login." };
    }
    throw err;
  }

  return {};
}
