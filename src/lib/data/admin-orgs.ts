import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations, orgMembers, type OrgFeatures } from "@/db/schema/organizations";
import { users } from "@/db/schema/auth";

export type OrgPlan = "manual" | "automatico";
export type OrgStatus = "active" | "suspended" | "cancelled";

export type AdminOrgRow = {
  id: string;
  name: string;
  cnpj: string | null;
  plan: OrgPlan;
  status: OrgStatus;
  planExpiresAt: Date | null;
  features: OrgFeatures;
  suspensionReason: string | null;
  memberCount: number;
  createdAt: Date;
};

export async function listAdminOrgs(): Promise<AdminOrgRow[]> {
  const result = await db.execute(sql`
    SELECT
      o.id, o.name, o.cnpj, o.plan, o.status,
      o.plan_expires_at, o.features, o.suspension_reason, o.created_at,
      COALESCE((
        SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id
      ), 0)::int AS member_count
    FROM organizations o
    WHERE o.deleted_at IS NULL
    ORDER BY o.created_at DESC
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      id: o.id as string,
      name: o.name as string,
      cnpj: (o.cnpj as string | null) ?? null,
      plan: o.plan as OrgPlan,
      status: o.status as OrgStatus,
      planExpiresAt: o.plan_expires_at ? new Date(o.plan_expires_at as string) : null,
      features: (o.features as OrgFeatures | null) ?? {},
      suspensionReason: (o.suspension_reason as string | null) ?? null,
      memberCount: Number(o.member_count ?? 0),
      createdAt: new Date(o.created_at as string),
    };
  });
}

export async function getAdminOrg(id: string): Promise<AdminOrgRow | null> {
  const result = await db.execute(sql`
    SELECT
      o.id, o.name, o.cnpj, o.plan, o.status,
      o.plan_expires_at, o.features, o.suspension_reason, o.created_at,
      COALESCE((
        SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id
      ), 0)::int AS member_count
    FROM organizations o
    WHERE o.id = ${id} AND o.deleted_at IS NULL
    LIMIT 1
  `);
  const r = result.rows[0];
  if (!r) return null;
  const o = r as Record<string, unknown>;
  return {
    id: o.id as string,
    name: o.name as string,
    cnpj: (o.cnpj as string | null) ?? null,
    plan: o.plan as OrgPlan,
    status: o.status as OrgStatus,
    planExpiresAt: o.plan_expires_at ? new Date(o.plan_expires_at as string) : null,
    features: (o.features as OrgFeatures | null) ?? {},
    suspensionReason: (o.suspension_reason as string | null) ?? null,
    memberCount: Number(o.member_count ?? 0),
    createdAt: new Date(o.created_at as string),
  };
}

export async function updateAdminOrg(
  id: string,
  patch: {
    name?: string;
    plan?: OrgPlan;
    status?: OrgStatus;
    planExpiresAt?: Date | null;
    features?: OrgFeatures;
    suspensionReason?: string | null;
  },
) {
  await db
    .update(organizations)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(organizations.id, id));
}

export async function softDeleteAdminOrg(id: string) {
  await db
    .update(organizations)
    .set({ deletedAt: sql`now()`, status: "cancelled", updatedAt: sql`now()` })
    .where(eq(organizations.id, id));
}

/**
 * Lista de e-mails autorizados a acessar /admin, lida de
 * `PLATFORM_ADMIN_EMAILS` (separados por vírgula). Se a env var não
 * estiver definida, ninguém entra — fail-closed.
 */
function platformAdminAllowlist(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return platformAdminAllowlist().has(email.trim().toLowerCase());
}

/**
 * Dupla checagem: o usuário precisa ter `platform_admin` no DB E o
 * e-mail precisa estar na allowlist via env. Belt and suspenders —
 * se o DB for comprometido ou a env vazada, sozinhos não dão acesso.
 */
export async function isPlatformAdmin(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!isAllowlistedAdminEmail(email)) return false;
  const [row] = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(and(eq(orgMembers.userId, userId), eq(orgMembers.role, "platform_admin")))
    .limit(1);
  return !!row;
}

export async function getAdminCounts(): Promise<{
  total: number;
  active: number;
  suspended: number;
  expiringSoon: number;
}> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL)::int AS total,
      (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND status='active')::int AS active,
      (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND status='suspended')::int AS suspended,
      (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND status='active'
        AND plan_expires_at IS NOT NULL
        AND plan_expires_at <= now() + interval '7 days'
        AND plan_expires_at > now()
      )::int AS expiring_soon
  `);
  const r = result.rows[0] as Record<string, number>;
  return {
    total: Number(r.total ?? 0),
    active: Number(r.active ?? 0),
    suspended: Number(r.suspended ?? 0),
    expiringSoon: Number(r.expiring_soon ?? 0),
  };
}

/** Lightweight check used by middleware/layouts on /app routes. */
export async function getOrgAccessState(orgId: string): Promise<{
  status: OrgStatus;
  expired: boolean;
  features: OrgFeatures;
  suspensionReason: string | null;
} | null> {
  const [row] = await db
    .select({
      status: organizations.status,
      planExpiresAt: organizations.planExpiresAt,
      features: organizations.features,
      suspensionReason: organizations.suspensionReason,
    })
    .from(organizations)
    .where(and(eq(organizations.id, orgId), isNotNull(organizations.id)))
    .limit(1);
  if (!row) return null;
  const expired =
    !!row.planExpiresAt && row.planExpiresAt.getTime() < Date.now();
  return {
    status: row.status,
    expired,
    features: row.features ?? {},
    suspensionReason: row.suspensionReason ?? null,
  };
}

/** List of platform_admin users for the admin "team" view. */
export async function listPlatformAdmins() {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      joinedAt: orgMembers.createdAt,
    })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.role, "platform_admin"))
    .orderBy(desc(orgMembers.createdAt));
}
