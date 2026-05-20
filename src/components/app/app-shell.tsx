import Link from "next/link";
import { Boxes } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { TopbarTitle } from "./topbar-title";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "./nav-items";
import { NotificationBell, type BellItem } from "@/components/notifications/notification-bell";

type Role = "broker_admin" | "broker_staff" | "client";

const ROLE_LABEL: Record<Role, string> = {
  broker_admin: "Broker Admin",
  broker_staff: "Equipe",
  client: "Cliente",
};

function initialsOf(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

function BrandMark() {
  return (
    <Link href="/app" className="inline-flex items-center gap-2.5">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
        <Boxes className="size-5" />
      </span>
      <span className="text-base font-semibold tracking-tight text-stone-900">Aduanasync</span>
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
    <div className="flex min-h-svh w-full bg-stone-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={navItems} />
        </div>
        <div className="border-t border-stone-200 px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-teal-100 text-xs font-semibold text-teal-700">
                {initialsOf(userName, userEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">
                {userName ?? userEmail ?? "Usuário"}
              </p>
              <p className="truncate text-xs text-stone-500">
                {userRole ? ROLE_LABEL[userRole] : orgName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-stone-200 bg-white px-4 sm:px-6">
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
