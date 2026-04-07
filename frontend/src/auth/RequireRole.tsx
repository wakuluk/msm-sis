import { Navigate, Outlet } from 'react-router-dom';
import { ForbiddenPage } from '@/components/auth/ForbiddenPage';
import { hasAnyPortalRole, type PortalRole } from '@/portal/PortalRoles';
import { useAccessTokenData } from './auth-store';

type RequireRoleProps = {
  roles: readonly PortalRole[];
};

export function RequireRole({ roles }: RequireRoleProps) {
  const tokenData = useAccessTokenData();

  if (!tokenData) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyPortalRole(tokenData.roles, roles)) {
    return <ForbiddenPage requiredRole={roles.join(', ')} />;
  }

  return <Outlet />;
}
