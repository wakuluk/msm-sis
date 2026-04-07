import { Navigate, Outlet } from 'react-router-dom';
import { useAccessTokenData } from './auth-store';

export function RedirectIfAuthenticated() {
  const tokenData = useAccessTokenData();

  if (tokenData) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
