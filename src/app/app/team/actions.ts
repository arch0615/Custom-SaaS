"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import {
  countOrgAdmins,
  ensureUserAndMembership,
  getOrgMember,
  removeOrgMember,
  setOrgMemberRole,
} from "@/lib/data/members";
import { createInviteToken } from "@/lib/data/invites";
import { sendEmail } from "@/lib/email/resend";

export type InviteState = {
  success?: boolean;
  inviteUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const inviteSchema = z.object({
  email: z.email("E-mail inválido"),
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  role: z.enum(["broker_admin", "broker_staff"]),
});

function inviteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function inviteTeamMemberAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await requireSession();
  if (session.role !== "broker_admin") return { error: "Sem permissão." };

  const parsed = inviteSchema.safeParse({
    email: (formData.get("email") as string | null)?.toLowerCase().trim(),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { email, name, role } = parsed.data;

  await ensureUserAndMembership({ orgId: session.orgId, email, name, role });
  const { token } = await createInviteToken(email);
  const inviteUrl = `${inviteOrigin()}/invite/${token}`;

  await sendEmail({
    to: email,
    subject: `Você foi convidado para ${session.orgName}`,
    text: `Olá, ${name}.

Você foi convidado para acessar ${session.orgName} no Customs SaaS.

Aceite o convite e defina sua senha em: ${inviteUrl}

O link expira em 72 horas.`,
  });

  revalidatePath("/app/team");
  return { success: true, inviteUrl };
}

const roleSchema = z.enum(["broker_admin", "broker_staff"]);

export async function changeMemberRoleAction(userId: string, formData: FormData): Promise<void> {
  const session = await requireSession();
  if (session.role !== "broker_admin") throw new Error("Sem permissão.");
  if (userId === session.userId) throw new Error("Você não pode alterar seu próprio papel.");

  const role = roleSchema.parse(formData.get("role"));
  const current = await getOrgMember(session.orgId, userId);
  if (!current) throw new Error("Membro não encontrado.");

  if (current.role === "broker_admin" && role !== "broker_admin") {
    const admins = await countOrgAdmins(session.orgId);
    if (admins <= 1) throw new Error("Deve haver ao menos um administrador.");
  }

  await setOrgMemberRole(session.orgId, userId, role);
  revalidatePath("/app/team");
}

export async function removeMemberAction(userId: string): Promise<void> {
  const session = await requireSession();
  if (session.role !== "broker_admin") throw new Error("Sem permissão.");
  if (userId === session.userId) throw new Error("Você não pode se remover.");

  const current = await getOrgMember(session.orgId, userId);
  if (!current) return;

  if (current.role === "broker_admin") {
    const admins = await countOrgAdmins(session.orgId);
    if (admins <= 1) throw new Error("Deve haver ao menos um administrador.");
  }

  await removeOrgMember(session.orgId, userId);
  revalidatePath("/app/team");
}

export async function resendInviteAction(email: string): Promise<{ inviteUrl: string }> {
  const session = await requireSession();
  if (session.role !== "broker_admin") throw new Error("Sem permissão.");

  const { token } = await createInviteToken(email);
  const inviteUrl = `${inviteOrigin()}/invite/${token}`;

  await sendEmail({
    to: email,
    subject: `Convite reenviado: ${session.orgName}`,
    text: `Olá,

Segue um novo link de convite para acessar ${session.orgName}:
${inviteUrl}

O link expira em 72 horas.`,
  });

  return { inviteUrl };
}
