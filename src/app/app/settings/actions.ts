"use server";

import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/db/client";
import { organizations } from "@/db/schema/organizations";
import { users } from "@/db/schema/auth";
import { notificationPreferences } from "@/db/schema/notifications";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  NOTIFICATION_DEFAULTS,
  type NotificationKind,
} from "@/lib/data/notifications-types";

export type ProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  cnpj: z.string().trim().max(20).nullable(),
  phone: z.string().trim().max(40).nullable(),
  email: z.string().trim().email("E-mail inválido").nullable().or(z.literal("").transform(() => null)),
  website: z.string().trim().max(200).nullable(),
  address: z.string().trim().max(200).nullable(),
  city: z.string().trim().max(80).nullable(),
  uf: z.string().trim().max(2).nullable(),
  cep: z.string().trim().max(12).nullable(),
  description: z.string().trim().max(500).nullable(),
});

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function updateOrgProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await requireSession();
  if (session.role !== "broker_admin") return { error: "Sem permissão." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    cnpj: emptyToNull(formData.get("cnpj")),
    phone: emptyToNull(formData.get("phone")),
    email: emptyToNull(formData.get("email")),
    website: emptyToNull(formData.get("website")),
    address: emptyToNull(formData.get("address")),
    city: emptyToNull(formData.get("city")),
    uf: emptyToNull(formData.get("uf")),
    cep: emptyToNull(formData.get("cep")),
    description: emptyToNull(formData.get("description")),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  await db
    .update(organizations)
    .set({ ...parsed.data, updatedAt: sql`now()` })
    .where(eq(organizations.id, session.orgId));

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}

export type PasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const passwordSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual"),
    next: z.string().min(8, "Mínimo 8 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  })
  .refine((v) => v.current !== v.next, {
    message: "A nova senha deve ser diferente da atual",
    path: ["next"],
  });

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await requireSession();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    return { error: "Não foi possível verificar sua senha atual." };
  }

  const ok = await verifyPassword(user.passwordHash, parsed.data.current);
  if (!ok) return { fieldErrors: { current: ["Senha atual incorreta."] } };

  const newHash = await hashPassword(parsed.data.next);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.userId));

  return { success: true };
}

export async function setNotificationPreferenceAction(input: {
  kind: NotificationKind;
  channel: "email" | "inApp";
  enabled: boolean;
}): Promise<void> {
  const session = await requireSession();

  const defaults = NOTIFICATION_DEFAULTS[input.kind];
  const [existing] = await db
    .select({ email: notificationPreferences.email, inApp: notificationPreferences.inApp })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, session.userId),
        eq(notificationPreferences.kind, input.kind),
      ),
    )
    .limit(1);

  const current = existing ?? { email: defaults.email, inApp: defaults.inApp };
  const nextRow = {
    userId: session.userId,
    kind: input.kind,
    email: input.channel === "email" ? input.enabled : current.email,
    inApp: input.channel === "inApp" ? input.enabled : current.inApp,
  };

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ email: nextRow.email, inApp: nextRow.inApp })
      .where(
        and(
          eq(notificationPreferences.userId, session.userId),
          eq(notificationPreferences.kind, input.kind),
        ),
      );
  } else {
    await db.insert(notificationPreferences).values(nextRow);
  }

  revalidatePath("/app/settings");
}
