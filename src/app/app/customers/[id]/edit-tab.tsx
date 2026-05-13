"use client";

import { CustomerForm, type CustomerFormState } from "@/components/customers/customer-form";
import { updateCustomerAction } from "./actions";

type Customer = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: "importer" | "exporter" | "both";
  notes: string | null;
};

export function CustomerEditTab({ customer }: { customer: Customer }) {
  const action = (prev: CustomerFormState, fd: FormData) =>
    updateCustomerAction(customer.id, prev, fd);

  return (
    <CustomerForm
      action={action}
      submitLabel="Salvar alterações"
      defaults={{
        legalName: customer.legalName,
        tradeName: customer.tradeName,
        cnpj: customer.cnpj,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
        notes: customer.notes,
      }}
    />
  );
}
