import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  processes,
  type processStage as ProcessStageEnum,
  type processModal as ProcessModalEnum,
  type incoterm as IncotermEnum,
} from "@/db/schema/processes";
import { customers } from "@/db/schema/customers";

export type ProcessStage = (typeof ProcessStageEnum.enumValues)[number];
export type ProcessModal = (typeof ProcessModalEnum.enumValues)[number];
export type Incoterm = (typeof IncotermEnum.enumValues)[number];

export type ProcessRow = typeof processes.$inferSelect;
export type NewProcessRow = typeof processes.$inferInsert;

export type ProcessListRow = {
  id: string;
  reference: string;
  modal: ProcessModal;
  stage: ProcessStage;
  customerId: string;
  customerName: string;
  importerName: string;
  exporterName: string;
  origin: string;
  destination: string;
  arrivalDate: string | null;
  containerNumber: string | null;
  createdAt: Date;
};

export async function listProcessesForOrg(
  orgId: string,
  opts: { customerId?: string } = {},
): Promise<ProcessListRow[]> {
  const wheres = [eq(processes.orgId, orgId), isNull(processes.deletedAt)];
  if (opts.customerId) wheres.push(eq(processes.customerId, opts.customerId));

  return db
    .select({
      id: processes.id,
      reference: processes.reference,
      modal: processes.modal,
      stage: processes.stage,
      customerId: processes.customerId,
      customerName: customers.legalName,
      importerName: processes.importerName,
      exporterName: processes.exporterName,
      origin: processes.origin,
      destination: processes.destination,
      arrivalDate: processes.arrivalDate,
      containerNumber: processes.containerNumber,
      createdAt: processes.createdAt,
    })
    .from(processes)
    .innerJoin(customers, eq(customers.id, processes.customerId))
    .where(and(...wheres))
    .orderBy(desc(processes.createdAt));
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
