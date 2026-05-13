"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NotificationKind } from "@/lib/data/notifications-types";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/app/notification-actions";

export type BellItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const relativeFmt = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function timeAgo(date: Date): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return relativeFmt.format(diffSec, "second");
  if (abs < 3600) return relativeFmt.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return relativeFmt.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 7) return relativeFmt.format(Math.round(diffSec / 86400), "day");
  return dateTimeFmt.format(date);
}

export function NotificationBell({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: BellItem[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notificações</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await markAllNotificationsReadAction();
                    toast.success("Tudo marcado como lido.");
                  } catch {
                    toast.error("Falha ao marcar como lido.");
                  }
                })
              }
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação ainda.
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((it, i) => {
              const unread = it.readAt === null;
              const body = (
                <div className="flex gap-2 px-3 py-2 hover:bg-accent">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      unread ? "bg-destructive" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        unread ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {it.title}
                    </p>
                    {it.body && (
                      <p className="text-xs text-muted-foreground">{it.body}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {timeAgo(it.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={it.id}>
                  {i > 0 && <DropdownMenuSeparator />}
                  {it.href ? (
                    <Link
                      href={it.href}
                      onClick={() => {
                        setOpen(false);
                        if (unread) {
                          startTransition(async () => {
                            await markNotificationReadAction(it.id).catch(() => undefined);
                          });
                        }
                      }}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        if (unread) {
                          startTransition(async () => {
                            await markNotificationReadAction(it.id).catch(() => undefined);
                          });
                        }
                      }}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
