"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { getCustomerForOrg } from "@/lib/data/customers";
import {
  createContact,
  deleteContact,
  getContactForOrg,
  linkContactUser,
} from "@/lib/data/contacts";
import { ensureUserAndMembership } from "@/lib/data/members";
import { createInviteToken } from "@/lib/data/invites";
import { sendEmail } from "@/lib/email/resend";

export type ContactState = {
  success?: boolean;
  inviteUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalString = z
  .string()
  .trim()
  .max(120)
  .transform((v) => (v === "" ? null : v))
  .nullable();

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "E-mail inválido",
    ),
  phone: optionalString,
  canLogin: z
    .union([z.literal("on"), z.literal(""), z.literal("true"), z.null()])
    .transform((v) => v === "on" || v === "true"),
  isPrimary: z
    .union([z.literal("on"), z.literal(""), z.literal("true"), z.null()])
    .transform((v) => v === "on" || v === "true"),
});

function inviteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function addContactAction(
  customerId: string,
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const customer = await getCustomerForOrg(session.orgId, customerId);
  if (!customer) return { error: "Cliente não encontrado." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    canLogin: formData.get("canLogin"),
    isPrimary: formData.get("isPrimary"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { name, email, phone, canLogin, isPrimary } = parsed.data;

  if (canLogin && !email) {
    return { fieldErrors: { email: ["E-mail obrigatório para acesso ao portal."] } };
  }

  let userId: string | null = null;
  let inviteUrl: string | undefined;

  if (canLogin && email) {
    const ensured = await ensureUserAndMembership({
      orgId: session.orgId,
      email,
      name,
      role: "client",
    });
    userId = ensured.userId;
    const { token } = await createInviteToken(email);
    inviteUrl = `${inviteOrigin()}/invite/${token}`;
    await sendEmail({
      to: email,
      subject: `Acesso ao portal de ${session.orgName}`,
      text: `Olá, ${name}.

Sua empresa ${customer.legalName} está sendo acompanhada por ${session.orgName} no Customs SaaS.

Aceite o convite e defina sua senha em: ${inviteUrl}

O link expira em 72 horas.`,
    });
  }

  await createContact({
    customerId,
    name,
    email,
    phone,
    canLogin,
    userId,
    isPrimary,
  });

  revalidatePath(`/app/customers/${customerId}`);
  return { success: true, inviteUrl };
}

export async function deleteContactAction(customerId: string, contactId: string): Promise<void> {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  const contact = await getContactForOrg(session.orgId, contactId);
  if (!contact || contact.customerId !== customerId) throw new Error("Contato não encontrado.");

  await deleteContact(contactId);
  revalidatePath(`/app/customers/${customerId}`);
}

export async function resendContactInviteAction(
  customerId: string,
  contactId: string,
): Promise<{ inviteUrl: string }> {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  const contact = await getContactForOrg(session.orgId, contactId);
  if (!contact || contact.customerId !== customerId) throw new Error("Contato não encontrado.");
  if (!contact.email) throw new Error("Contato sem e-mail.");

  if (!contact.userId) {
    const ensured = await ensureUserAndMembership({
      orgId: session.orgId,
      email: contact.email,
      name: contact.name,
      role: "client",
    });
    await linkContactUser(contact.id, ensured.userId);
  }

  const { token } = await createInviteToken(contact.email);
  const inviteUrl = `${inviteOrigin()}/invite/${token}`;

  await sendEmail({
    to: contact.email,
    subject: `Acesso ao portal de ${session.orgName}`,
    text: `Olá, ${contact.name}.

Segue um novo link de convite para acessar o portal: ${inviteUrl}

O link expira em 72 horas.`,
  });

  return { inviteUrl };
}
