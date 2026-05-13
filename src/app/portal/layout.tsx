import { requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  countUnreadForUser,
  listNotificationsForUser,
} from "@/lib/data/notifications";
import { renderNotification } from "@/lib/notifications/templates";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const impersonating = session.role !== "client";

  const [items, unread] = await Promise.all([
    listNotificationsForUser(session.orgId, session.userId),
    countUnreadForUser(session.orgId, session.userId),
  ]);
  const bellItems = items.map((n) => {
    const r = renderNotification(n.kind, n.payload);
    return {
      id: n.id,
      kind: n.kind,
      title: r.title,
      body: r.body,
      href: r.href,
      readAt: n.readAt,
      createdAt: n.createdAt,
    };
  });

  return (
    <PortalShell
      orgName={session.orgName}
      userName={session.userName}
      userEmail={session.userEmail}
      signOutAction={signOutAction}
      impersonating={impersonating}
      bellItems={bellItems}
      unreadCount={unread}
    >
      {children}
    </PortalShell>
  );
}
