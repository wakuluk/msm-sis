export const PORTAL_ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
} as const;

export type PortalRole = (typeof PORTAL_ROLES)[keyof typeof PORTAL_ROLES];

export function hasPortalRole(userRoles: readonly string[] | undefined, role: PortalRole) {
  return userRoles?.includes(role) ?? false;
}

export function hasAnyPortalRole(
  userRoles: readonly string[] | undefined,
  requiredRoles: readonly PortalRole[] | undefined,
) {
  if (!requiredRoles?.length) {
    return true;
  }

  if (!userRoles?.length) {
    return false;
  }

  return requiredRoles.some((role) => hasPortalRole(userRoles, role));
}
