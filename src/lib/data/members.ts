import { and, desc, eq, sql } from "drizzle-orm";
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

export type TeamMemberWithStats = TeamMemberRow & {
  processesTouched: number;
};

export async function listOrgTeamMembersWithStats(
  orgId: string,
): Promise<TeamMemberWithStats[]> {
  const result = await db.execute(sql`
    SELECT
      u.id           AS user_id,
      u.name         AS name,
      u.email        AS email,
      om.role        AS role,
      u.password_hash IS NULL AS invited,
      om.created_at  AS joined_at,
      COALESCE(touched.process_count, 0)::int AS processes_touched
    FROM org_members om
    INNER JOIN users u ON u.id = om.user_id
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT te.process_id) AS process_count
      FROM timeline_events te
      INNER JOIN processes p ON p.id = te.process_id
      WHERE te.actor_id = u.id
        AND p.org_id = ${orgId}
        AND p.deleted_at IS NULL
    ) touched ON true
    WHERE om.org_id = ${orgId}
      AND om.role IN ('broker_admin', 'broker_staff')
    ORDER BY om.created_at DESC
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      userId: o.user_id as string,
      name: (o.name as string | null) ?? null,
      email: o.email as string,
      role: o.role as MemberRole,
      invited: Boolean(o.invited),
      joinedAt: new Date(o.joined_at as string),
      processesTouched: Number(o.processes_touched ?? 0),
    };
  });
}

export type TeamCounts = {
  active: number;
  pending: number;
  totalProcesses: number;
  total: number;
};

export async function getTeamCounts(orgId: string): Promise<TeamCounts> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM org_members om
        INNER JOIN users u ON u.id = om.user_id
        WHERE om.org_id = ${orgId}
          AND om.role IN ('broker_admin', 'broker_staff')
          AND u.password_hash IS NOT NULL)::int AS active,
      (SELECT COUNT(*) FROM org_members om
        INNER JOIN users u ON u.id = om.user_id
        WHERE om.org_id = ${orgId}
          AND om.role IN ('broker_admin', 'broker_staff')
          AND u.password_hash IS NULL)::int AS pending,
      (SELECT COUNT(*) FROM processes
        WHERE org_id = ${orgId}
          AND deleted_at IS NULL
          AND stage <> 'pago')::int AS total_processes,
      (SELECT COUNT(*) FROM org_members
        WHERE org_id = ${orgId}
          AND role IN ('broker_admin', 'broker_staff'))::int AS total
  `);
  const r = result.rows[0] as Record<string, number>;
  return {
    active: Number(r.active ?? 0),
    pending: Number(r.pending ?? 0),
    totalProcesses: Number(r.total_processes ?? 0),
    total: Number(r.total ?? 0),
  };
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
