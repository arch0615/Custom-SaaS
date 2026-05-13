import { Ship } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import type { NavItem } from "./nav-items";
import { NotificationBell, type BellItem } from "@/components/notifications/notification-bell";

export function AppShell({
  navItems,
  orgName,
  userName,
  userEmail,
  signOutAction,
  bellItems,
  unreadCount,
  children,
}: {
  navItems: NavItem[];
  orgName: string;
  userName?: string | null;
  userEmail?: string | null;
  signOutAction: () => Promise<void>;
  bellItems: BellItem[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Ship className="size-5 text-primary" />
          <span className="truncate text-sm font-semibold">{orgName}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={navItems} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <MobileNav items={navItems} orgName={orgName} />
            <div className="md:hidden flex items-center gap-2">
              <Ship className="size-5 text-primary" />
              <span className="truncate text-sm font-semibold">{orgName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell unreadCount={unreadCount} items={bellItems} />
            <UserMenu name={userName} email={userEmail} signOutAction={signOutAction} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
