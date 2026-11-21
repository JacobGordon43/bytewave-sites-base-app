export const AUTH_ROLES = ["Admin", "Client", "Support", "Bytewave-Admin"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

const authRoleSet = new Set<string>(AUTH_ROLES);

export function getAuthRoles(value: unknown): AuthRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (group): group is AuthRole => typeof group === "string" && authRoleSet.has(group),
  );
}

export function getPortalHome(groups: readonly string[]): string | undefined {
  if (groups.includes("Bytewave-Admin")) return "/admin/dashboard";
  if (groups.includes("Support")) return "/support/tickets";
  if (groups.includes("Client")) return "/client/dashboard";
  return undefined;
}
