import { requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { AppShell } from "@/components/app/app-shell";
import { appNavItems, filterNavByRole } from "@/components/app/nav-items";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const navItems = filterNavByRole(appNavItems, session.role);

  return (
    <AppShell
      navItems={navItems}
      orgName={session.orgName}
      userName={session.userName}
      userEmail={session.userEmail}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
