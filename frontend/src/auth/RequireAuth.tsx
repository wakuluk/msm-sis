import { Navigate, Outlet } from 'react-router-dom';
import { useAccessTokenData } from './auth-store';

export function RequireAuth() {
  const tokenData = useAccessTokenData();

  if (!tokenData) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
