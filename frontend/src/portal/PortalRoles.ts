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
  // Allow routes with no required roles; otherwise require at least one matching user role.
  const hasRequiredRole =
    !requiredRoles?.length ||
    requiredRoles?.some((role) => hasPortalRole(userRoles, role)) === true;

  return hasRequiredRole;
}
