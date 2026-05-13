"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/data/notifications";

export async function markNotificationReadAction(id: string): Promise<void> {
  const session = await requireSession();
  await markNotificationRead(session.orgId, session.userId, id);
  revalidatePath("/app");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await requireSession();
  await markAllNotificationsRead(session.orgId, session.userId);
  revalidatePath("/app");
}
