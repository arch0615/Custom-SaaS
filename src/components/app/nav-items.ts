type MemberRole = "broker_admin" | "broker_staff" | "client";

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
  roles: MemberRole[];
};

export const appNavItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", roles: ["broker_admin", "broker_staff"] },
  { href: "/app/customers", label: "Clientes", icon: "customers", roles: ["broker_admin", "broker_staff"] },
  { href: "/app/processes", label: "Processos", icon: "processes", roles: ["broker_admin", "broker_staff"] },
  { href: "/app/team", label: "Equipe", icon: "team", roles: ["broker_admin"] },
  { href: "/app/settings", label: "Configurações", icon: "settings", roles: ["broker_admin"] },
];

export function filterNavByRole(items: NavItem[], role: MemberRole | null): NavItem[] {
  if (!role) return [];
  return items.filter((it) => it.roles.includes(role));
}
