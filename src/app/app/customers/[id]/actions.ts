"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { parseCustomerForm } from "@/lib/validation/customer";
import {
  getCustomerByCnpj,
  getCustomerForOrg,
  softDeleteCustomerForOrg,
  updateCustomerForOrg,
} from "@/lib/data/customers";

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateCustomerAction(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const existing = await getCustomerForOrg(session.orgId, id);
  if (!existing) return { error: "Cliente não encontrado." };

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.cnpj !== existing.cnpj) {
    const dup = await getCustomerByCnpj(session.orgId, parsed.data.cnpj);
    if (dup && dup.id !== id && !dup.deletedAt) {
      return { fieldErrors: { cnpj: ["Outro cliente já usa este CNPJ."] } };
    }
  }

  await updateCustomerForOrg(session.orgId, id, parsed.data);

  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${id}`);
  return {};
}

export async function deleteCustomerAction(id: string) {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  await softDeleteCustomerForOrg(session.orgId, id);

  revalidatePath("/app/customers");
  redirect("/app/customers");
}
