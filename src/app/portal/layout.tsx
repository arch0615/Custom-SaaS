import { requireSession } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const impersonating = session.role !== "client";

  return (
    <PortalShell
      orgName={session.orgName}
      userName={session.userName}
      userEmail={session.userEmail}
      signOutAction={signOutAction}
      impersonating={impersonating}
    >
      {children}
    </PortalShell>
  );
}
