import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  processes,
  type processStage as ProcessStageEnum,
  type processModal as ProcessModalEnum,
  type incoterm as IncotermEnum,
  type ContainerEntry,
} from "@/db/schema/processes";
import { customers } from "@/db/schema/customers";

export type ProcessStage = (typeof ProcessStageEnum.enumValues)[number];
export type ProcessModal = (typeof ProcessModalEnum.enumValues)[number];
export type Incoterm = (typeof IncotermEnum.enumValues)[number];
export type { ContainerEntry, ContainerType } from "@/db/schema/processes";
export { CONTAINER_TYPES } from "@/db/schema/processes";

export type ProcessRow = typeof processes.$inferSelect;
export type NewProcessRow = typeof processes.$inferInsert;

export type CustomerType = "importer" | "exporter" | "both";

export type ProcessListRow = {
  id: string;
  reference: string;
  modal: ProcessModal;
  stage: ProcessStage;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  importerName: string;
  exporterName: string;
  origin: string;
  destination: string;
  hblNumber: string | null;
  shipmentDate: string | null;
  arrivalDate: string | null;
  containerNumber: string | null;
  containers: ContainerEntry[] | null;
  invoiceNumber: string | null;
  createdAt: Date;
};

export async function listProcessesForOrg(
  orgId: string,
  opts: {
    customerId?: string;
    customerIds?: string[];
    /** Ordena por data de EMBARQUE (asc) em vez de CHEGADA. Usado quando
     * o usuário filtrou pra uma etapa pré-embarque, onde a chegada ainda
     * é planejamento e o que importa é quando o embarque vai sair. */
    sortByShipmentDate?: boolean;
  } = {},
): Promise<ProcessListRow[]> {
  const wheres = [eq(processes.orgId, orgId), isNull(processes.deletedAt)];
  if (opts.customerId) {
    wheres.push(eq(processes.customerId, opts.customerId));
  } else if (opts.customerIds && opts.customerIds.length > 0) {
    wheres.push(inArray(processes.customerId, opts.customerIds));
  }

  const primarySortKey = opts.sortByShipmentDate
    ? processes.shipmentDate
    : processes.arrivalDate;

  return db
    .select({
      id: processes.id,
      reference: processes.reference,
      modal: processes.modal,
      stage: processes.stage,
      customerId: processes.customerId,
      customerName: customers.legalName,
      customerType: customers.type,
      importerName: processes.importerName,
      exporterName: processes.exporterName,
      origin: processes.origin,
      destination: processes.destination,
      hblNumber: processes.hblNumber,
      shipmentDate: processes.shipmentDate,
      arrivalDate: processes.arrivalDate,
      containerNumber: processes.containerNumber,
      containers: processes.containers,
      invoiceNumber: processes.invoiceNumber,
      createdAt: processes.createdAt,
    })
    .from(processes)
    .innerJoin(customers, eq(customers.id, processes.customerId))
    .where(and(...wheres))
    // Ordem: chave primária (embarque OU chegada, decidido pelo caller) ASC
    // com nulls no final, tie-break pelo mais recente criado.
    .orderBy(sql`${primarySortKey} ASC NULLS LAST`, desc(processes.createdAt));
}

export async function getProcessForOrg(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(processes)
    .where(and(eq(processes.orgId, orgId), eq(processes.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getProcessByReference(orgId: string, reference: string) {
  const [row] = await db
    .select({ id: processes.id, deletedAt: processes.deletedAt })
    .from(processes)
    .where(and(eq(processes.orgId, orgId), eq(processes.reference, reference)))
    .limit(1);
  return row ?? null;
}

export async function createProcessForOrg(orgId: string, data: Omit<NewProcessRow, "orgId" | "id" | "createdAt" | "updatedAt" | "deletedAt">) {
  const [row] = await db
    .insert(processes)
    .values({ orgId, ...data })
    .returning({ id: processes.id });
  return row;
}

export async function updateProcessForOrg(
  orgId: string,
  id: string,
  data: Partial<Omit<NewProcessRow, "id" | "orgId" | "createdAt" | "updatedAt" | "deletedAt">>,
) {
  const [row] = await db
    .update(processes)
    .set({ ...data, updatedAt: sql`now()` })
    .where(and(eq(processes.orgId, orgId), eq(processes.id, id)))
    .returning({ id: processes.id });
  return row ?? null;
}

export async function softDeleteProcessForOrg(orgId: string, id: string) {
  const [row] = await db
    .update(processes)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(processes.orgId, orgId), eq(processes.id, id), isNull(processes.deletedAt)))
    .returning({ id: processes.id });
  return row ?? null;
}
