"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { denyIfMissing } from "@/lib/auth/permissions";
import { parseProcessForm } from "@/lib/validation/process";
import {
  createProcessForOrg,
  getProcessByReference,
} from "@/lib/data/processes";
import { getCustomerForOrg } from "@/lib/data/customers";
import { createTimelineEvent } from "@/lib/data/timeline";
import { STAGE_LABEL } from "@/lib/process-status";

export type ProcessFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProcessAction(
  _prev: ProcessFormState,
  formData: FormData,
): Promise<ProcessFormState> {
  const session = await requireSession();
  const denied = denyIfMissing(session.role, "process:create"); if (denied) return denied;

  const parsed = parseProcessForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const customer = await getCustomerForOrg(session.orgId, data.customerId);
  if (!customer) {
    return { fieldErrors: { customerId: ["Cliente inválido."] } };
  }

  const dupRef = await getProcessByReference(session.orgId, data.reference);
  if (dupRef && !dupRef.deletedAt) {
    return { fieldErrors: { reference: ["Outra referência igual já existe."] } };
  }

  // Keep containerNumber in sync with first containers entry for legacy
  // search + indexes.
  const containerNumber =
    data.containers.length > 0 && data.containers[0].number
      ? data.containers[0].number
      : data.containerNumber;

  const row = await createProcessForOrg(session.orgId, {
    customerId: data.customerId,
    reference: data.reference,
    clientReference: data.clientReference,
    carrierReference: data.carrierReference,
    modal: data.modal,
    stage: data.stage,
    importerName: data.importerName,
    notifyParty: data.notifyParty,
    exporterName: data.exporterName,
    origin: data.origin,
    destination: data.destination,
    hblNumber: data.hblNumber,
    mblNumber: data.mblNumber,
    containerNumber,
    containers: data.containers,
    invoiceNumber: data.invoiceNumber,
    freeTime: data.freeTime,
    insurance: data.insurance,
    shipmentDate: data.shipmentDate,
    arrivalDate: data.arrivalDate,
    transshipmentPort: data.transshipmentPort,
    transshipmentVessel: data.transshipmentVessel,
    transshipmentArrival: data.transshipmentArrival,
    transshipmentDeparture: data.transshipmentDeparture,
    ceMaster: data.ceMaster,
    ceHouse: data.ceHouse,
    incoterm: data.incoterm,
    currency: data.currency,
    invoiceValue: data.invoiceValue,
    grossWeightKg: data.grossWeightKg,
    ncm: data.ncm,
    carrier: data.carrier,
    vesselFlight: data.vesselFlight,
    diNumber: data.diNumber,
  });

  await createTimelineEvent({
    orgId: session.orgId,
    processId: row.id,
    title: `Processo criado em ${STAGE_LABEL[data.stage]}`,
    source: "system",
    toStage: data.stage,
    actorId: session.userId,
  });

  revalidatePath("/app/processes");
  revalidatePath(`/app/customers/${data.customerId}`);
  redirect(`/app/processes/${row.id}`);
}
