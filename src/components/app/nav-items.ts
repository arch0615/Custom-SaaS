import type { MemberRole } from "@/lib/auth/session";
import { hasAnyPermission, type Permission } from "@/lib/auth/permissions";

export type NavIconName =
  | "dashboard"
  | "customers"
  | "processes"
  | "team"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Pelo menos uma destas permissões para que o item apareça. */
  permissions: Permission[];
};

export const appNavItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", permissions: ["process:view"] },
  { href: "/app/processes", label: "Processos", icon: "processes", permissions: ["process:view"] },
  { href: "/app/customers", label: "Clientes", icon: "customers", permissions: ["customer:view"] },
  { href: "/app/team", label: "Equipe", icon: "team", permissions: ["team:view"] },
  { href: "/app/settings", label: "Configurações", icon: "settings", permissions: ["settings:org_profile"] },
];

export function filterNavByRole(items: NavItem[], role: MemberRole | null): NavItem[] {
  if (!role) return [];
  return items.filter((it) => hasAnyPermission(role, it.permissions));
}
