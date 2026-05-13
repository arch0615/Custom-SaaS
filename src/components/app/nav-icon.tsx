"use client";

import { LayoutDashboard, Users, FolderKanban, UsersRound, Settings } from "lucide-react";
import type { NavIconName } from "./nav-items";

const ICONS = {
  dashboard: LayoutDashboard,
  customers: Users,
  processes: FolderKanban,
  team: UsersRound,
  settings: Settings,
} as const;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}
