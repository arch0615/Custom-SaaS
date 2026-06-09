import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, customerContacts, type customerType } from "@/db/schema/customers";

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

export async function getCustomerForClientUser(orgId: string, userId: string) {
  const rows = await listCustomersForClientUser(orgId, userId);
  return rows[0] ?? null;
}

/**
 * All customers a client user has access to in this org. A single login can be
 * linked to multiple empresas (CNPJs) when they belong to the same group —
 * we add a customer_contacts row per company sharing the same user_id.
 */
export async function listCustomersForClientUser(orgId: string, userId: string) {
  return db
    .select({
      customerId: customers.id,
      legalName: customers.legalName,
      tradeName: customers.tradeName,
      cnpj: customers.cnpj,
      contactId: customerContacts.id,
    })
    .from(customerContacts)
    .innerJoin(customers, eq(customers.id, customerContacts.customerId))
    .where(
      and(
        eq(customers.orgId, orgId),
        eq(customerContacts.userId, userId),
        isNull(customers.deletedAt),
      ),
    );
}

export type CustomerListWithStats = CustomerListRow & {
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  activeProcesses: number;
  totalProcesses: number;
};

export async function listCustomersWithStatsForOrg(orgId: string): Promise<CustomerListWithStats[]> {
  const result = await db.execute(sql`
    SELECT
      c.id,
      c.legal_name,
      c.trade_name,
      c.cnpj,
      c.email,
      c.phone,
      c.type,
      c.created_at,
      c.updated_at,
      pc.name AS primary_contact_name,
      pc.email AS primary_contact_email,
      pc.phone AS primary_contact_phone,
      COALESCE(stats.active_count, 0)::int AS active_processes,
      COALESCE(stats.total_count, 0)::int AS total_processes
    FROM customers c
    LEFT JOIN LATERAL (
      SELECT name, email, phone
      FROM customer_contacts
      WHERE customer_id = c.id
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    ) pc ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE stage <> 'pago') AS active_count,
        COUNT(*) AS total_count
      FROM processes
      WHERE customer_id = c.id AND org_id = c.org_id AND deleted_at IS NULL
    ) stats ON true
    WHERE c.org_id = ${orgId} AND c.deleted_at IS NULL
    ORDER BY c.legal_name ASC
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      id: o.id as string,
      legalName: o.legal_name as string,
      tradeName: (o.trade_name as string | null) ?? null,
      cnpj: o.cnpj as string,
      email: (o.email as string | null) ?? null,
      phone: (o.phone as string | null) ?? null,
      type: o.type as CustomerType,
      createdAt: new Date(o.created_at as string),
      updatedAt: new Date(o.updated_at as string),
      primaryContactName: (o.primary_contact_name as string | null) ?? null,
      primaryContactEmail: (o.primary_contact_email as string | null) ?? null,
      primaryContactPhone: (o.primary_contact_phone as string | null) ?? null,
      activeProcesses: Number(o.active_processes ?? 0),
      totalProcesses: Number(o.total_processes ?? 0),
    };
  });
}

export async function restoreCustomerForOrg(orgId: string, id: string) {
  const result = await db
    .update(customers)
    .set({ deletedAt: null, updatedAt: sql`now()` })
    .where(and(eq(customers.orgId, orgId), eq(customers.id, id)))
    .returning({ id: customers.id });
  return result[0] ?? null;
}
