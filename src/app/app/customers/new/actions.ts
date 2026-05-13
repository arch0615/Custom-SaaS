"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { parseCustomerForm } from "@/lib/validation/customer";
import { createCustomerForOrg, getCustomerByCnpj } from "@/lib/data/customers";

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const existing = await getCustomerByCnpj(session.orgId, parsed.data.cnpj);
  if (existing && !existing.deletedAt) {
    return { fieldErrors: { cnpj: ["Já existe um cliente com este CNPJ na sua empresa."] } };
  }

  const row = await createCustomerForOrg(session.orgId, parsed.data);

  revalidatePath("/app/customers");
  redirect(`/app/customers/${row.id}`);
}
