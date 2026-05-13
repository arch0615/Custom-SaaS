"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_TYPE_OPTIONS } from "@/lib/labels";

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CustomerFormDefaults = {
  legalName?: string;
  tradeName?: string | null;
  cnpj?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  type?: "importer" | "exporter" | "both";
  notes?: string | null;
};

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function CustomerForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: CustomerFormState, fd: FormData) => Promise<CustomerFormState>;
  defaults?: CustomerFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<CustomerFormState, FormData>(action, {});
  const f = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="legalName">Razão social *</Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={defaults?.legalName ?? ""}
                required
              />
              <ErrorText msg={f.legalName?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome fantasia</Label>
              <Input id="tradeName" name="tradeName" defaultValue={defaults?.tradeName ?? ""} />
              <ErrorText msg={f.tradeName?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                name="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                defaultValue={defaults?.cnpj ?? ""}
                required
              />
              <ErrorText msg={f.cnpj?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select name="type" defaultValue={defaults?.type ?? "importer"}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorText msg={f.type?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaults?.email ?? ""}
              />
              <ErrorText msg={f.email?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ""} />
              <ErrorText msg={f.phone?.[0]} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" defaultValue={defaults?.address ?? ""} />
              <ErrorText msg={f.address?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={defaults?.notes ?? ""}
            placeholder="Anotações internas que ajudem a equipe a atender melhor este cliente."
          />
          <ErrorText msg={f.notes?.[0]} />
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
