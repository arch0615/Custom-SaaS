"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requirePortalCustomer } from "@/lib/portal/customer-context";
import { db } from "@/db/client";
import { getProcessForOrg } from "@/lib/data/processes";
import { notifications, type notificationKind } from "@/db/schema/notifications";
import { orgMembers } from "@/db/schema/organizations";

type NotificationKind = (typeof notificationKind.enumValues)[number];

export async function requestUpdateAction(processId: string, impersonateId?: string): Promise<void> {
  const { session, customer, impersonating } = await requirePortalCustomer(impersonateId);
  if (impersonating) {
    throw new Error("Não disponível no modo preview.");
  }

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc || proc.customerId !== customer.id) {
    throw new Error("Processo não encontrado.");
  }

  const recipients = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, session.orgId),
        eq(orgMembers.role, "broker_admin"),
      ),
    );

  if (recipients.length === 0) return;

  const kind: NotificationKind = "client_requested_update";
  await db.insert(notifications).values(
    recipients.map((r) => ({
      orgId: session.orgId,
      userId: r.userId,
      kind,
      payload: {
        processId,
        processReference: proc.reference,
        customerId: customer.id,
        customerName: customer.legalName,
        requestedAt: new Date().toISOString(),
      },
    })),
  );

  revalidatePath(`/portal/processes/${processId}`);
}
