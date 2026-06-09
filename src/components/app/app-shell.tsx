import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { TopbarTitle } from "./topbar-title";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "./nav-items";
import { NotificationBell, type BellItem } from "@/components/notifications/notification-bell";

type Role = "broker_admin" | "broker_staff" | "client" | "platform_admin";

const ROLE_LABEL: Record<Role, string> = {
  broker_admin: "Broker Admin",
  broker_staff: "Equipe",
  client: "Cliente",
  platform_admin: "Platform Admin",
};

function initialsOf(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

function BrandMark({ onSidebar = false }: { onSidebar?: boolean }) {
  return (
    <Link href="/app" className="inline-flex items-center gap-2.5">
      <BrandLogo size="md" />
      <span
        className={`text-base font-semibold tracking-tight ${
          onSidebar ? "text-sidebar-foreground" : "text-foreground"
        }`}
      >
        Aduana<span className="text-primary">Sync</span>
      </span>
    </Link>
  );
}

export function AppShell({
  navItems,
  orgName,
  userName,
  userEmail,
  userRole,
  signOutAction,
  bellItems,
  unreadCount,
  children,
}: {
  navItems: NavItem[];
  orgName: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: Role;
  signOutAction: () => Promise<void>;
  bellItems: BellItem[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandMark onSidebar />
        </div>
        <div className="flex-1 overflow-y-auto px-1">
          <SidebarNav items={navItems} />
        </div>
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {initialsOf(userName, userEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName ?? userEmail ?? "Usuário"}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {userRole ? ROLE_LABEL[userRole] : orgName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <MobileNav items={navItems} orgName={orgName} />
            <BrandMark />
          </div>
          <div className="hidden md:block">
            <TopbarTitle />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell unreadCount={unreadCount} items={bellItems} />
            <UserMenu name={userName} email={userEmail} signOutAction={signOutAction} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
