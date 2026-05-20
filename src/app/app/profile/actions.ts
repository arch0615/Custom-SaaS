"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";

export type ProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
});

export async function updateUserProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  await db.update(users).set({ name: parsed.data.name }).where(eq(users.id, session.userId));

  revalidatePath("/app");
  revalidatePath("/app/profile");
  return { success: true };
}
