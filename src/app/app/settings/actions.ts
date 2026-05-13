"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/db/client";
import { organizations } from "@/db/schema/organizations";

export type SettingsState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
});

export async function updateOrgSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  if (session.role !== "broker_admin") return { error: "Sem permissão." };

  const parsed = settingsSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  await db
    .update(organizations)
    .set({ name: parsed.data.name, updatedAt: sql`now()` })
    .where(eq(organizations.id, session.orgId));

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}
