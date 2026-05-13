import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, notificationPreferences } from "@/db/schema/notifications";
import {
  NOTIFICATION_DEFAULTS,
  type NotificationKind,
} from "./notifications-types";

export type {
  NotificationKind,
  NotificationDefaults,
} from "./notifications-types";
export {
  NOTIFICATION_KIND_LABEL,
  NOTIFICATION_DEFAULTS,
} from "./notifications-types";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotificationsForUser(
  orgId: string,
  userId: string,
  limit = 20,
): Promise<NotificationRow[]> {
  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(eq(notifications.orgId, orgId), eq(notifications.userId, userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    payload: r.payload ?? {},
  }));
}

export async function countUnreadForUser(orgId: string, userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.orgId, orgId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
  return row?.count ?? 0;
}

export async function markNotificationRead(orgId: string, userId: string, id: string) {
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.orgId, orgId),
        eq(notifications.userId, userId),
        eq(notifications.id, id),
        isNull(notifications.readAt),
      ),
    );
}

export async function markAllNotificationsRead(orgId: string, userId: string) {
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.orgId, orgId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
}

export async function getPreferencesForUser(userId: string): Promise<Map<NotificationKind, { email: boolean; inApp: boolean }>> {
  const rows = await db
    .select({ kind: notificationPreferences.kind, email: notificationPreferences.email, inApp: notificationPreferences.inApp })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  const map = new Map<NotificationKind, { email: boolean; inApp: boolean }>();
  for (const r of rows) map.set(r.kind as NotificationKind, { email: r.email, inApp: r.inApp });
  return map;
}

export function effectivePreference(
  prefs: Map<NotificationKind, { email: boolean; inApp: boolean }>,
  kind: NotificationKind,
) {
  return prefs.get(kind) ?? NOTIFICATION_DEFAULTS[kind];
}

export type CreateNotificationsInput = {
  orgId: string;
  recipients: { userId: string; email?: string | null; name?: string | null }[];
  kind: NotificationKind;
  payload: Record<string, unknown>;
};

export async function insertNotificationsBulk(input: CreateNotificationsInput): Promise<string[]> {
  if (input.recipients.length === 0) return [];
  const userIds = input.recipients.map((r) => r.userId);
  const prefsRows = await db
    .select({
      userId: notificationPreferences.userId,
      kind: notificationPreferences.kind,
      inApp: notificationPreferences.inApp,
    })
    .from(notificationPreferences)
    .where(
      and(
        inArray(notificationPreferences.userId, userIds),
        eq(notificationPreferences.kind, input.kind),
      ),
    );
  const inAppPrefs = new Map(prefsRows.map((r) => [r.userId, r.inApp]));
  const wantsInApp = (userId: string) =>
    inAppPrefs.get(userId) ?? NOTIFICATION_DEFAULTS[input.kind].inApp;

  const toInsert = input.recipients
    .filter((r) => wantsInApp(r.userId))
    .map((r) => ({
      orgId: input.orgId,
      userId: r.userId,
      kind: input.kind,
      payload: input.payload,
    }));

  if (toInsert.length === 0) return [];

  const inserted = await db.insert(notifications).values(toInsert).returning({ id: notifications.id });
  return inserted.map((r) => r.id);
}
