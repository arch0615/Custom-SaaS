import { isValidCnpj, formatCnpj } from "@brazilian-utils/brazilian-utils";

export function digitsOnly(input: string | null | undefined): string {
  return (input ?? "").replace(/\D/g, "");
}

export function isValidCNPJ(input: string | null | undefined): boolean {
  const d = digitsOnly(input);
  if (d.length !== 14) return false;
  return isValidCnpj(d);
}

export function formatCNPJ(input: string | null | undefined): string {
  const d = digitsOnly(input);
  if (d.length !== 14) return d;
  return formatCnpj(d);
}
