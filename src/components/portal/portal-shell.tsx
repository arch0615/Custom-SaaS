import Link from "next/link";
import { Ship } from "lucide-react";
import { UserMenu } from "@/components/app/user-menu";
import { NotificationBell, type BellItem } from "@/components/notifications/notification-bell";

export function PortalShell({
  orgName,
  userName,
  userEmail,
  signOutAction,
  impersonating,
  bellItems,
  unreadCount,
  children,
}: {
  orgName: string;
  userName?: string | null;
  userEmail?: string | null;
  signOutAction: () => Promise<void>;
  impersonating: boolean;
  bellItems: BellItem[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col">
      {impersonating && (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-medium text-amber-950">
          Você está visualizando o portal em modo preview. Esta sessão está registrada.
        </div>
      )}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        <Link href="/portal" className="flex items-center gap-2">
          <Ship className="size-5 text-primary" />
          <span className="truncate text-sm font-semibold">{orgName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell unreadCount={unreadCount} items={bellItems} />
          <UserMenu name={userName} email={userEmail} signOutAction={signOutAction} />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
