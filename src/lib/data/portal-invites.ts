import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type PortalInviteStatus = "pending" | "accepted";

export type PortalInviteRow = {
  contactId: string;
  customerId: string;
  customerName: string;
  name: string;
  email: string;
  status: PortalInviteStatus;
  token: string | null;
  expires: Date | null;
  sentAt: Date;
};

const RECENT_DAYS = 30;

export async function listRecentPortalInvites(
  orgId: string,
  limit = 8,
): Promise<PortalInviteRow[]> {
  const result = await db.execute(sql`
    SELECT
      cc.id          AS contact_id,
      c.id           AS customer_id,
      c.legal_name   AS customer_name,
      cc.name        AS contact_name,
      cc.email       AS contact_email,
      cc.created_at  AS sent_at,
      u.password_hash IS NOT NULL AS accepted,
      u.created_at   AS user_created_at,
      vt.token       AS token,
      vt.expires     AS token_expires
    FROM customer_contacts cc
    INNER JOIN customers c ON c.id = cc.customer_id
    LEFT JOIN users u ON u.id = cc.user_id
    LEFT JOIN verification_tokens vt
      ON vt.identifier = cc.email AND vt.expires > now()
    WHERE c.org_id = ${orgId}
      AND c.deleted_at IS NULL
      AND cc.can_login = true
      AND cc.email IS NOT NULL
      AND (
        u.password_hash IS NULL
        OR u.created_at > now() - (${RECENT_DAYS} || ' days')::interval
      )
    ORDER BY accepted ASC, cc.created_at DESC
    LIMIT ${limit}
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    const accepted = Boolean(o.accepted);
    return {
      contactId: o.contact_id as string,
      customerId: o.customer_id as string,
      customerName: o.customer_name as string,
      name: o.contact_name as string,
      email: o.contact_email as string,
      status: (accepted ? "accepted" : "pending") as PortalInviteStatus,
      token: accepted ? null : ((o.token as string | null) ?? null),
      expires: o.token_expires ? new Date(o.token_expires as string) : null,
      sentAt: new Date(o.sent_at as string),
    };
  });
}
