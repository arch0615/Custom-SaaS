"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth/session";
import {
  isPlatformAdmin,
  softDeleteAdminOrg,
  updateAdminOrg,
} from "@/lib/data/admin-orgs";
import { db } from "@/db/client";
import { organizations, orgMembers } from "@/db/schema/organizations";
import { users } from "@/db/schema/auth";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/auth/slug";

export type AdminOrgFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  generatedPassword?: string;
  createdOrgId?: string;
};

async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!(await isPlatformAdmin(session.userId, session.userEmail))) {
    throw new Error("Sem permissão.");
  }
  return session;
}

const editSchema = z.object({
  name: z.string().trim().min(2).max(120),
  plan: z.enum(["manual", "automatico"]),
  status: z.enum(["active", "suspended", "cancelled"]),
  planExpiresAt: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use AAAA-MM-DD"),
  trackingAuto: z.boolean(),
  suspensionReason: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export async function updateOrgAction(
  orgId: string,
  _prev: AdminOrgFormState,
  formData: FormData,
): Promise<AdminOrgFormState> {
  await requirePlatformAdmin();

  const parsed = editSchema.safeParse({
    name: formData.get("name"),
    plan: formData.get("plan"),
    status: formData.get("status"),
    planExpiresAt: formData.get("planExpiresAt") ?? "",
    trackingAuto: formData.get("trackingAuto") === "on",
    suspensionReason: formData.get("suspensionReason") ?? "",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  await updateAdminOrg(orgId, {
    name: parsed.data.name,
    plan: parsed.data.plan,
    status: parsed.data.status,
    planExpiresAt: parsed.data.planExpiresAt
      ? new Date(`${parsed.data.planExpiresAt}T23:59:59Z`)
      : null,
    features: { tracking_auto: parsed.data.trackingAuto },
    suspensionReason: parsed.data.suspensionReason,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orgs");
  revalidatePath(`/admin/orgs/${orgId}`);
  return { success: true };
}

export async function deleteOrgAction(orgId: string): Promise<void> {
  await requirePlatformAdmin();
  await softDeleteAdminOrg(orgId);
  revalidatePath("/admin");
  revalidatePath("/admin/orgs");
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  cnpj: z.string().trim().max(20).optional(),
  adminEmail: z.email("E-mail inválido"),
  adminName: z.string().trim().min(2).max(120),
  plan: z.enum(["manual", "automatico"]),
  trackingAuto: z.boolean(),
});

function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function uniqueSlug(name: string): Promise<string> {
  const root = slugify(name) || "org";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createOrgAction(
  _prev: AdminOrgFormState,
  formData: FormData,
): Promise<AdminOrgFormState> {
  await requirePlatformAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj") ?? "",
    adminEmail: ((formData.get("adminEmail") as string | null) ?? "").toLowerCase().trim(),
    adminName: formData.get("adminName"),
    plan: formData.get("plan"),
    trackingAuto: formData.get("trackingAuto") === "on",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const slug = await uniqueSlug(parsed.data.name);
  const password = randomPassword();
  const passwordHash = await hashPassword(password);

  let createdOrgId = "";
  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: parsed.data.name,
        slug,
        cnpj: parsed.data.cnpj ?? null,
        plan: parsed.data.plan,
        status: "active",
        features: { tracking_auto: parsed.data.trackingAuto },
      })
      .returning({ id: organizations.id });
    createdOrgId = org.id;

    const [existingUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.adminEmail))
      .limit(1);

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const [u] = await tx
        .insert(users)
        .values({
          email: parsed.data.adminEmail,
          name: parsed.data.adminName,
          passwordHash,
        })
        .returning({ id: users.id });
      userId = u.id;
    }

    await tx
      .insert(orgMembers)
      .values({ orgId: org.id, userId, role: "broker_admin" })
      .onConflictDoNothing();
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orgs");
  return { success: true, createdOrgId, generatedPassword: password };
}

export async function redirectToAdminOrg(orgId: string): Promise<void> {
  redirect(`/admin/orgs/${orgId}`);
}
