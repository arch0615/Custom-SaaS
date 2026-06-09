"use client";

import { ProcessForm, type ProcessFormState, type CustomerOption } from "@/components/processes/process-form";
import type { ProcessRow } from "@/lib/data/processes";
import { updateProcessAction } from "./actions";

export function ProcessEditTab({
  process,
  customers,
}: {
  process: ProcessRow;
  customers: CustomerOption[];
}) {
  const action = (prev: ProcessFormState, fd: FormData) => updateProcessAction(process.id, prev, fd);

  return (
    <ProcessForm
      action={action}
      submitLabel="Salvar alterações"
      customers={customers}
      lockStage
      defaults={{
        customerId: process.customerId,
        reference: process.reference,
        clientReference: process.clientReference,
        carrierReference: process.carrierReference,
        modal: process.modal,
        stage: process.stage,
        importerName: process.importerName,
        notifyParty: process.notifyParty,
        exporterName: process.exporterName,
        origin: process.origin,
        destination: process.destination,
        hblNumber: process.hblNumber,
        mblNumber: process.mblNumber,
        containerNumber: process.containerNumber,
        containers: process.containers,
        invoiceNumber: process.invoiceNumber,
        freeTime: process.freeTime,
        insurance: process.insurance,
        shipmentDate: process.shipmentDate,
        arrivalDate: process.arrivalDate,
        transshipmentPort: process.transshipmentPort,
        transshipmentVessel: process.transshipmentVessel,
        transshipmentArrival: process.transshipmentArrival,
        transshipmentDeparture: process.transshipmentDeparture,
        ceMaster: process.ceMaster,
        ceHouse: process.ceHouse,
        incoterm: process.incoterm,
        currency: process.currency,
        invoiceValue: process.invoiceValue,
        grossWeightKg: process.grossWeightKg,
        ncm: process.ncm,
        carrier: process.carrier,
        vesselFlight: process.vesselFlight,
        diNumber: process.diNumber,
      }}
    />
  );
}
