import type { MemberRole } from "./session";

/**
 * RBAC para o Aduanasync.
 *
 * Cada capacidade discreta do app vira uma "permission" (string namespaced
 * por recurso). O mapeamento ROLE_PERMISSIONS define quem pode o quê. Os
 * helpers hasPermission / requirePermission encapsulam a checagem para
 * usar tanto em server actions (`requirePermission`) quanto em renderização
 * condicional (`hasPermission`).
 *
 * Quando um campo de organização gates a feature (ex: features.tracking_auto),
 * a verificação de permissão é COMPLEMENTAR — a permissão diz "esse role
 * teoricamente pode", o feature flag diz "essa empresa contratou".
 */

export const PERMISSIONS = [
  // Processos
  "process:view",
  "process:create",
  "process:edit",
  "process:delete",
  "process:advance_stage",
  "process:add_timeline",
  "process:delete_timeline",

  // Documentos
  "document:view",
  "document:upload",
  "document:delete",
  "document:replace",
  "document:approve_pending",
  "document:client_upload",

  // Clientes
  "customer:view",
  "customer:create",
  "customer:edit",
  "customer:delete",
  "customer:invite_contact",

  // Tracking
  "tracking:view",
  "tracking:manage",

  // Equipe
  "team:view",
  "team:invite",
  "team:change_role",
  "team:remove",

  // Notificações
  "notification:manage_preferences",

  // Configurações da empresa
  "settings:org_profile",
  "settings:org_security",

  // Portal do cliente
  "portal:view",
  "portal:request_update",

  // Plataforma (super-admin)
  "platform:manage_orgs",
  "platform:view_dashboard",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const BROKER_ADMIN: Permission[] = [
  "process:view",
  "process:create",
  "process:edit",
  "process:delete",
  "process:advance_stage",
  "process:add_timeline",
  "process:delete_timeline",
  "document:view",
  "document:upload",
  "document:delete",
  "document:replace",
  "document:approve_pending",
  "customer:view",
  "customer:create",
  "customer:edit",
  "customer:delete",
  "customer:invite_contact",
  "tracking:view",
  "tracking:manage",
  "team:view",
  "team:invite",
  "team:change_role",
  "team:remove",
  "notification:manage_preferences",
  "settings:org_profile",
  "settings:org_security",
];

const BROKER_STAFF: Permission[] = [
  "process:view",
  "process:create",
  "process:edit",
  "process:advance_stage",
  "process:add_timeline",
  // staff NÃO deleta processo nem evento da timeline (admin-only)
  "document:view",
  "document:upload",
  "document:delete",
  "document:replace",
  "document:approve_pending",
  "customer:view",
  "customer:create",
  "customer:edit",
  "customer:invite_contact",
  "tracking:view",
  "tracking:manage",
  // staff NÃO gerencia equipe nem configurações da empresa
  "team:view", // pode ver lista, só não convida/altera
  "notification:manage_preferences",
];

const CLIENT: Permission[] = [
  "portal:view",
  "portal:request_update",
  "document:view",
  "document:client_upload",
  "notification:manage_preferences",
];

const PLATFORM_ADMIN: Permission[] = [
  "platform:manage_orgs",
  "platform:view_dashboard",
];

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  broker_admin: BROKER_ADMIN,
  broker_staff: BROKER_STAFF,
  client: CLIENT,
  platform_admin: PLATFORM_ADMIN,
};

/**
 * Checagem boolean — use pra renderização condicional na UI.
 *
 *   {hasPermission(session.role, "team:invite") && <InviteButton/>}
 */
export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: MemberRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Erro fixo lançado quando a permissão falha. Server actions geralmente
 * preferem retornar `{ error: "Sem permissão." }` — neste caso use
 * `assertPermission` que retorna boolean e cabe num if.
 */
export class PermissionDeniedError extends Error {
  constructor(public readonly required: Permission) {
    super(`Sem permissão (${required}).`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Lança PermissionDeniedError se o role não tiver a permissão. Útil em
 * `route handlers` ou em código onde throw é OK.
 */
export function requirePermission(role: MemberRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

/**
 * Versão "soft" pra server actions que retornam estado: devolve null se
 * a permissão é válida, ou o objeto de erro padrão se não. Uso:
 *
 *   const denied = denyIfMissing(session.role, "process:create");
 *   if (denied) return denied;
 */
export function denyIfMissing(
  role: MemberRole,
  permission: Permission,
): { error: string } | null {
  return hasPermission(role, permission) ? null : { error: "Sem permissão." };
}
