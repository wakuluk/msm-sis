import { type ComponentType } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RedirectIfAuthenticated } from '@/auth/RedirectIfAuthenticated';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { LogingPage } from '@/components/auth/LogingPage';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { flattenPortalRoutes, portalRoutes, type PortalRouteItemKey } from '@/portal/PortalRoutes';
import { AdminPage } from './pages/portal/Admin.page';
import { PortalPage } from './pages/portal/Portal.page';
import { PublicPage } from './pages/public/Public.page';
import { SharedPage } from './pages/portal/Shared.page';
import { SharedSecondPage } from './pages/portal/SharedSecond.page';
import { StudentProfilePage } from './pages/portal/StudentProfile.page';

const portalRouteComponents = {
  dashboard: PortalPage,
  shared: SharedPage,
  student: StudentProfilePage,
  admin: AdminPage,
  sharedSecond: SharedSecondPage,
} satisfies Record<PortalRouteItemKey, ComponentType>;

const portalChildren = flattenPortalRoutes(portalRoutes).map((route) => {
  const Component = portalRouteComponents[route.key];

  if (route.requiredRoles?.length) {
    return {
      element: <RequireRole roles={route.requiredRoles} />,
      children: [
        {
          path: route.path,
          element: <Component />,
        },
      ],
    };
  }

  return {
    path: route.path,
    element: <Component />,
  };
});

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
        element: <PortalLayout />,
        children: portalChildren,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
