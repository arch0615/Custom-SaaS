import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, type customerType } from "@/db/schema/customers";

type CustomerType = (typeof customerType.enumValues)[number];

export type CustomerListRow = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  type: CustomerType;
  createdAt: Date;
  updatedAt: Date;
};

export async function listCustomersForOrg(orgId: string, opts: { includeDeleted?: boolean } = {}): Promise<CustomerListRow[]> {
  const whereClause = opts.includeDeleted
    ? eq(customers.orgId, orgId)
    : and(eq(customers.orgId, orgId), isNull(customers.deletedAt));

  return db
    .select({
      id: customers.id,
      legalName: customers.legalName,
      tradeName: customers.tradeName,
      cnpj: customers.cnpj,
      email: customers.email,
      phone: customers.phone,
      type: customers.type,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(whereClause)
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerForOrg(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, orgId), eq(customers.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getCustomerByCnpj(orgId: string, cnpj: string) {
  const [row] = await db
    .select({ id: customers.id, deletedAt: customers.deletedAt })
    .from(customers)
    .where(and(eq(customers.orgId, orgId), eq(customers.cnpj, cnpj)))
    .limit(1);
  return row ?? null;
}

export async function createCustomerForOrg(orgId: string, data: {
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: CustomerType;
  notes: string | null;
}) {
  const [row] = await db
    .insert(customers)
    .values({ orgId, ...data })
    .returning({ id: customers.id });
  return row;
}

export async function updateCustomerForOrg(orgId: string, id: string, data: Partial<{
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: CustomerType;
  notes: string | null;
}>) {
  const result = await db
    .update(customers)
    .set({ ...data, updatedAt: sql`now()` })
    .where(and(eq(customers.orgId, orgId), eq(customers.id, id)))
    .returning({ id: customers.id });
  return result[0] ?? null;
}

export async function softDeleteCustomerForOrg(orgId: string, id: string) {
  const result = await db
    .update(customers)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(customers.orgId, orgId), eq(customers.id, id), isNull(customers.deletedAt)))
    .returning({ id: customers.id });
  return result[0] ?? null;
}

export async function restoreCustomerForOrg(orgId: string, id: string) {
  const result = await db
    .update(customers)
    .set({ deletedAt: null, updatedAt: sql`now()` })
    .where(and(eq(customers.orgId, orgId), eq(customers.id, id)))
    .returning({ id: customers.id });
  return result[0] ?? null;
}
