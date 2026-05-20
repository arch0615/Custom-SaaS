"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";
import type { NavItem } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teal-50 text-teal-700"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal-700"
              />
            )}
            <NavIcon
              name={item.icon}
              className={cn(
                "size-4 shrink-0",
                active ? "text-teal-700" : "text-stone-500 group-hover:text-stone-700",
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
