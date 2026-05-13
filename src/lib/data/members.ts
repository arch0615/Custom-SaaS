import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { orgMembers } from "@/db/schema/organizations";

export type MemberRole = "broker_admin" | "broker_staff" | "client";

export type TeamMemberRow = {
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
  invited: boolean;
  joinedAt: Date;
};

export async function listOrgTeamMembers(orgId: string): Promise<TeamMemberRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: orgMembers.role,
      passwordHash: users.passwordHash,
      joinedAt: orgMembers.createdAt,
    })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(
      and(
        eq(orgMembers.orgId, orgId),
        // staff/admin only (clients live in /app/customers contacts)
        sql`${orgMembers.role} IN ('broker_admin','broker_staff')`,
      ),
    )
    .orderBy(desc(orgMembers.createdAt));
  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    role: r.role,
    invited: r.passwordHash === null,
    joinedAt: r.joinedAt,
  }));
}

export async function getOrgMember(orgId: string, userId: string) {
  const [row] = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function setOrgMemberRole(orgId: string, userId: string, role: MemberRole) {
  const [row] = await db
    .update(orgMembers)
    .set({ role })
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .returning({ userId: orgMembers.userId });
  return row ?? null;
}

export async function removeOrgMember(orgId: string, userId: string) {
  const [row] = await db
    .delete(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .returning({ userId: orgMembers.userId });
  return row ?? null;
}

export async function countOrgAdmins(orgId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "broker_admin")));
  return row?.count ?? 0;
}

export async function getUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row ?? null;
}

export async function ensureUserAndMembership(input: {
  orgId: string;
  email: string;
  name: string;
  role: MemberRole;
}): Promise<{ userId: string; created: boolean }> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    let userId: string;
    let created = false;
    if (existing) {
      userId = existing.id;
      if (!existing.name && input.name) {
        await tx.update(users).set({ name: input.name }).where(eq(users.id, userId));
      }
    } else {
      const [u] = await tx
        .insert(users)
        .values({ email: input.email, name: input.name })
        .returning({ id: users.id });
      userId = u.id;
      created = true;
    }

    const [member] = await tx
      .select({ userId: orgMembers.userId })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, userId)))
      .limit(1);

    if (member) {
      await tx
        .update(orgMembers)
        .set({ role: input.role })
        .where(and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, userId)));
    } else {
      await tx.insert(orgMembers).values({
        orgId: input.orgId,
        userId,
        role: input.role,
      });
    }
    return { userId, created };
  });
}
