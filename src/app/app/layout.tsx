import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { AppShell } from "@/components/app/app-shell";
import { appNavItems, filterNavByRole } from "@/components/app/nav-items";
import {
  countUnreadForUser,
  listNotificationsForUser,
} from "@/lib/data/notifications";
import { renderNotification } from "@/lib/notifications/templates";
import { getOrgAccessState } from "@/lib/data/admin-orgs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // Access gate — bloqueia entrada se a empresa está suspensa, cancelada ou
  // com plano vencido. /access-blocked vive fora deste layout.
  const access = await getOrgAccessState(session.orgId);
  if (
    access &&
    (access.status === "suspended" || access.status === "cancelled" || access.expired)
  ) {
    redirect("/access-blocked");
  }

  const navItems = filterNavByRole(appNavItems, session.role);

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
    <AppShell
      navItems={navItems}
      orgName={session.orgName}
      userName={session.userName}
      userEmail={session.userEmail}
      userRole={session.role}
      signOutAction={signOutAction}
      bellItems={bellItems}
      unreadCount={unread}
    >
      {children}
    </AppShell>
  );
}
