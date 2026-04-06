import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RedirectIfAuthenticated } from '@/auth/RedirectIfAuthenticated';
import { RequireAuth } from '@/auth/RequireAuth';
import { LogingPage } from '@/components/auth/LogingPage';
import { ProtectedPage } from './pages/Protected.page';
import { PublicPage } from './pages/Public.page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace/>,
  },
  {
    path: '/public',
    element: <PublicPage />,
  },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: '/login',
        element: <LogingPage />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <ProtectedPage />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
