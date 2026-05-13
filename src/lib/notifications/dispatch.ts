import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import { orgMembers } from "@/db/schema/organizations";
import { customerContacts } from "@/db/schema/customers";
import {
  effectivePreference,
  getPreferencesForUser,
  insertNotificationsBulk,
  NOTIFICATION_DEFAULTS,
} from "@/lib/data/notifications";
import type { NotificationKind } from "@/lib/data/notifications-types";
import { renderNotification } from "./templates";
import { sendEmail } from "@/lib/email/resend";

export type Recipient = { userId: string; email: string | null; name: string | null };

export async function resolveBrokerAdmins(orgId: string): Promise<Recipient[]> {
  return db
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "broker_admin")));
}

export async function resolveCustomerClientUsers(orgId: string, customerId: string): Promise<Recipient[]> {
  return db
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(customerContacts)
    .innerJoin(users, eq(users.id, customerContacts.userId))
    .where(
      and(
        eq(customerContacts.customerId, customerId),
        isNotNull(customerContacts.userId),
        eq(customerContacts.canLogin, true),
      ),
    );
}

export async function dispatchNotification(input: {
  orgId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  recipients: Recipient[];
}): Promise<{ inAppCount: number; emailsSent: number; emailsFailed: number }> {
  if (input.recipients.length === 0) return { inAppCount: 0, emailsSent: 0, emailsFailed: 0 };

  const inAppCount = (
    await insertNotificationsBulk({
      orgId: input.orgId,
      recipients: input.recipients,
      kind: input.kind,
      payload: input.payload,
    })
  ).length;

  const rendered = renderNotification(input.kind, input.payload);

  const userIds = input.recipients.map((r) => r.userId);
  const allPrefs = await Promise.all(
    userIds.map((id) => getPreferencesForUser(id).then((p) => [id, p] as const)),
  );
  const prefByUser = new Map(allPrefs);

  let emailsSent = 0;
  let emailsFailed = 0;
  await Promise.all(
    input.recipients.map(async (r) => {
      if (!r.email) return;
      const pref = effectivePreference(prefByUser.get(r.userId) ?? new Map(), input.kind);
      const wantsEmail = pref.email ?? NOTIFICATION_DEFAULTS[input.kind].email;
      if (!wantsEmail) return;
      const result = await sendEmail({
        to: r.email,
        subject: rendered.emailSubject,
        text: rendered.emailText,
      });
      if (result.ok) emailsSent += 1;
      else emailsFailed += 1;
    }),
  );

  return { inAppCount, emailsSent, emailsFailed };
}
