"use client";

import { useActionState, useState } from "react";
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
import {
  INCOTERM_OPTIONS,
  MODAL_OPTIONS,
  STAGE_OPTIONS,
  modalFieldLabels,
} from "@/lib/process-status";
import type {
  ProcessStage,
  ProcessModal,
  Incoterm,
} from "@/lib/data/processes";

export type ProcessFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CustomerOption = { id: string; legalName: string };

export type ProcessFormDefaults = {
  customerId?: string;
  reference?: string;
  clientReference?: string | null;
  carrierReference?: string | null;
  modal?: ProcessModal;
  stage?: ProcessStage;
  importerName?: string;
  exporterName?: string;
  origin?: string;
  destination?: string;
  hblNumber?: string | null;
  mblNumber?: string | null;
  containerNumber?: string | null;
  shipmentDate?: string | null;
  arrivalDate?: string | null;
  transshipmentPort?: string | null;
  transshipmentArrival?: string | null;
  transshipmentDeparture?: string | null;
  ceMaster?: string | null;
  ceHouse?: string | null;
  incoterm?: Incoterm | null;
  currency?: string | null;
  invoiceValue?: string | null;
  grossWeightKg?: string | null;
  ncm?: string | null;
  carrier?: string | null;
  vesselFlight?: string | null;
  diNumber?: string | null;
};

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

function val(v?: string | null) {
  return v ?? "";
}

export function ProcessForm({
  action,
  customers,
  defaults,
  submitLabel,
  lockStage = false,
}: {
  action: (prev: ProcessFormState, fd: FormData) => Promise<ProcessFormState>;
  customers: CustomerOption[];
  defaults?: ProcessFormDefaults;
  submitLabel: string;
  lockStage?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProcessFormState, FormData>(action, {});
  const [modal, setModal] = useState<ProcessModal>(defaults?.modal ?? "maritime");
  const f = state.fieldErrors ?? {};
  const labels = modalFieldLabels(modal);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <Select name="customerId" defaultValue={defaults?.customerId}>
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.legalName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorText msg={f.customerId?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referência do agente de carga *</Label>
              <Input id="reference" name="reference" defaultValue={val(defaults?.reference)} required />
              <ErrorText msg={f.reference?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientReference">Referência do cliente</Label>
              <Input id="clientReference" name="clientReference" defaultValue={val(defaults?.clientReference)} />
              <ErrorText msg={f.clientReference?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrierReference">Referência da transportadora</Label>
              <Input id="carrierReference" name="carrierReference" defaultValue={val(defaults?.carrierReference)} />
              <ErrorText msg={f.carrierReference?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal">Modal *</Label>
              <Select
                name="modal"
                defaultValue={modal}
                onValueChange={(v) => setModal(v as ProcessModal)}
              >
                <SelectTrigger id="modal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorText msg={f.modal?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa *</Label>
              <Select name="stage" defaultValue={defaults?.stage ?? "docs_received"} disabled={lockStage}>
                <SelectTrigger id="stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockStage && (
                <input type="hidden" name="stage" value={defaults?.stage ?? "docs_received"} />
              )}
              <ErrorText msg={f.stage?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partes envolvidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="importerName">Importador *</Label>
              <Input id="importerName" name="importerName" defaultValue={val(defaults?.importerName)} required />
              <ErrorText msg={f.importerName?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exporterName">Exportador *</Label>
              <Input id="exporterName" name="exporterName" defaultValue={val(defaults?.exporterName)} required />
              <ErrorText msg={f.exporterName?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">{labels.carrier}</Label>
              <Input id="carrier" name="carrier" defaultValue={val(defaults?.carrier)} />
              <ErrorText msg={f.carrier?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vesselFlight">{labels.vesselFlight}</Label>
              <Input id="vesselFlight" name="vesselFlight" defaultValue={val(defaults?.vesselFlight)} />
              <ErrorText msg={f.vesselFlight?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Origem, destino e transbordo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem *</Label>
              <Input id="origin" name="origin" defaultValue={val(defaults?.origin)} required />
              <ErrorText msg={f.origin?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino *</Label>
              <Input id="destination" name="destination" defaultValue={val(defaults?.destination)} required />
              <ErrorText msg={f.destination?.[0]} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="transshipmentPort">{labels.transshipmentPort}</Label>
              <Input id="transshipmentPort" name="transshipmentPort" defaultValue={val(defaults?.transshipmentPort)} />
              <ErrorText msg={f.transshipmentPort?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transshipmentArrival">Chegada no transbordo</Label>
              <Input id="transshipmentArrival" name="transshipmentArrival" type="date" defaultValue={val(defaults?.transshipmentArrival)} />
              <ErrorText msg={f.transshipmentArrival?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transshipmentDeparture">Saída do transbordo</Label>
              <Input id="transshipmentDeparture" name="transshipmentDeparture" type="date" defaultValue={val(defaults?.transshipmentDeparture)} />
              <ErrorText msg={f.transshipmentDeparture?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentDate">Data de embarque</Label>
              <Input id="shipmentDate" name="shipmentDate" type="date" defaultValue={val(defaults?.shipmentDate)} />
              <ErrorText msg={f.shipmentDate?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Data de chegada</Label>
              <Input id="arrivalDate" name="arrivalDate" type="date" defaultValue={val(defaults?.arrivalDate)} />
              <ErrorText msg={f.arrivalDate?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos e numerações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hblNumber">{labels.hbl}</Label>
              <Input id="hblNumber" name="hblNumber" defaultValue={val(defaults?.hblNumber)} />
              <ErrorText msg={f.hblNumber?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mblNumber">{labels.mbl}</Label>
              <Input id="mblNumber" name="mblNumber" defaultValue={val(defaults?.mblNumber)} />
              <ErrorText msg={f.mblNumber?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containerNumber">{labels.container}</Label>
              <Input id="containerNumber" name="containerNumber" defaultValue={val(defaults?.containerNumber)} />
              <ErrorText msg={f.containerNumber?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diNumber">Número da DI / DUE</Label>
              <Input id="diNumber" name="diNumber" defaultValue={val(defaults?.diNumber)} />
              <ErrorText msg={f.diNumber?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ceMaster">CE Master</Label>
              <Input id="ceMaster" name="ceMaster" defaultValue={val(defaults?.ceMaster)} />
              <ErrorText msg={f.ceMaster?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ceHouse">CE House</Label>
              <Input id="ceHouse" name="ceHouse" defaultValue={val(defaults?.ceHouse)} />
              <ErrorText msg={f.ceHouse?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financeiro e classificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="incoterm">Incoterm</Label>
              <Select name="incoterm" defaultValue={defaults?.incoterm ?? "none"}>
                <SelectTrigger id="incoterm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {INCOTERM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorText msg={f.incoterm?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Input id="currency" name="currency" placeholder="USD / EUR / BRL" defaultValue={val(defaults?.currency)} />
              <ErrorText msg={f.currency?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceValue">Valor da fatura</Label>
              <Input id="invoiceValue" name="invoiceValue" inputMode="decimal" defaultValue={val(defaults?.invoiceValue)} />
              <ErrorText msg={f.invoiceValue?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grossWeightKg">Peso bruto (kg)</Label>
              <Input id="grossWeightKg" name="grossWeightKg" inputMode="decimal" defaultValue={val(defaults?.grossWeightKg)} />
              <ErrorText msg={f.grossWeightKg?.[0]} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ncm">NCM</Label>
              <Input id="ncm" name="ncm" defaultValue={val(defaults?.ncm)} />
              <ErrorText msg={f.ncm?.[0]} />
            </div>
          </div>
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
