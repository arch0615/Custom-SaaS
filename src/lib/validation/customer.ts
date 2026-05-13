import { z } from "zod";
import { digitsOnly, isValidCNPJ } from "@/lib/cnpj";

const optionalString = z
  .string()
  .trim()
  .max(255)
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const customerInputSchema = z.object({
  legalName: z.string().trim().min(2, "Razão social muito curta").max(255),
  tradeName: optionalString,
  cnpj: z
    .string()
    .transform((v) => digitsOnly(v))
    .refine(isValidCNPJ, "CNPJ inválido"),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido"),
  phone: optionalString,
  address: optionalString,
  type: z.enum(["importer", "exporter", "both"]),
  notes: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export function parseCustomerForm(formData: FormData) {
  return customerInputSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName") ?? "",
    cnpj: formData.get("cnpj"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    type: formData.get("type"),
    notes: formData.get("notes") ?? "",
  });
}
