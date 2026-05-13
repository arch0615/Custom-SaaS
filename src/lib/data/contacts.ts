import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, customerContacts } from "@/db/schema/customers";
import { users } from "@/db/schema/auth";

export type CustomerContactRow = {
  id: string;
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  canLogin: boolean;
  userId: string | null;
  userActivated: boolean;
  isPrimary: boolean;
  createdAt: Date;
};

export async function listContactsForCustomer(orgId: string, customerId: string): Promise<CustomerContactRow[]> {
  const rows = await db
    .select({
      id: customerContacts.id,
      customerId: customerContacts.customerId,
      name: customerContacts.name,
      email: customerContacts.email,
      phone: customerContacts.phone,
      canLogin: customerContacts.canLogin,
      userId: customerContacts.userId,
      passwordHash: users.passwordHash,
      isPrimary: customerContacts.isPrimary,
      createdAt: customerContacts.createdAt,
    })
    .from(customerContacts)
    .innerJoin(customers, eq(customers.id, customerContacts.customerId))
    .leftJoin(users, eq(users.id, customerContacts.userId))
    .where(and(eq(customers.orgId, orgId), eq(customerContacts.customerId, customerId)))
    .orderBy(asc(customerContacts.createdAt));
  return rows.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    canLogin: r.canLogin,
    userId: r.userId,
    userActivated: !!r.passwordHash,
    isPrimary: r.isPrimary,
    createdAt: r.createdAt,
  }));
}

export async function getContactForOrg(orgId: string, contactId: string) {
  const [row] = await db
    .select({
      id: customerContacts.id,
      customerId: customerContacts.customerId,
      name: customerContacts.name,
      email: customerContacts.email,
      phone: customerContacts.phone,
      canLogin: customerContacts.canLogin,
      userId: customerContacts.userId,
      isPrimary: customerContacts.isPrimary,
    })
    .from(customerContacts)
    .innerJoin(customers, eq(customers.id, customerContacts.customerId))
    .where(and(eq(customers.orgId, orgId), eq(customerContacts.id, contactId)))
    .limit(1);
  return row ?? null;
}

export async function createContact(input: {
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  canLogin: boolean;
  userId: string | null;
  isPrimary: boolean;
}) {
  const [row] = await db
    .insert(customerContacts)
    .values(input)
    .returning({ id: customerContacts.id });
  return row;
}

export async function linkContactUser(contactId: string, userId: string) {
  await db
    .update(customerContacts)
    .set({ userId, canLogin: true })
    .where(eq(customerContacts.id, contactId));
}

export async function deleteContact(contactId: string) {
  await db.delete(customerContacts).where(eq(customerContacts.id, contactId));
}
