import Link from "next/link";
import { Ship } from "lucide-react";
import { UserMenu } from "@/components/app/user-menu";

export function PortalShell({
  orgName,
  userName,
  userEmail,
  signOutAction,
  impersonating,
  children,
}: {
  orgName: string;
  userName?: string | null;
  userEmail?: string | null;
  signOutAction: () => Promise<void>;
  impersonating: boolean;
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
        <UserMenu name={userName} email={userEmail} signOutAction={signOutAction} />
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
