import { type PortalRole, PORTAL_ROLES } from './PortalRoles';

export type PortalRouteItemKey =
  | 'dashboard'
  | 'shared'
  | 'student'
  | 'studentCreate'
  | 'studentDetail'
  | 'studentSearch'
  | 'sharedSecond';

export type PortalRoutePath =
  | '/portal'
  | '/shared'
  | '/sharedSecond'
  | '/student/profile'
  | '/students/new'
  | '/students/:studentId'
  | '/student-search';

export type PortalRouteGroupKey = 'people' | 'sharing';

export type PortalRouteItem = {
  kind: 'item';
  key: PortalRouteItemKey;
  label: string;
  path: PortalRoutePath;
  requiredRoles?: readonly PortalRole[];
  showInNav: boolean;
};

export type PortalRouteGroup = {
  kind: 'group';
  key: PortalRouteGroupKey;
  label: string;
  requiredRoles?: readonly PortalRole[];
  showInNav: boolean;
  children: PortalRouteItem[];
};

export type PortalRouteNode = PortalRouteItem | PortalRouteGroup;

export const portalRoutes: PortalRouteNode[] = [
  {
    kind: 'item',
    key: 'dashboard',
    label: 'Dashboard',
    path: '/portal',
    showInNav: true,
  },
  {
    kind: 'group',
    key: 'sharing',
    label: 'Sharing',
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'shared',
        label: 'Shared page',
        path: '/shared',
        requiredRoles: [PORTAL_ROLES.STUDENT, PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
    ],
  },
  {
    kind: 'group',
    key: 'people',
    label: 'Student',
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'student',
        label: 'Student Profile',
        path: '/student/profile',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'studentCreate',
        label: 'Create Student',
        path: '/students/new',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'studentSearch',
        label: 'Student Search',
        path: '/student-search',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'studentDetail',
        label: 'Student Detail',
        path: '/students/:studentId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'sharedSecond',
        label: 'Shared page Second',
        path: '/sharedSecond',
        requiredRoles: [PORTAL_ROLES.STUDENT, PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
    ],
  },
];

export function flattenPortalRoutes(routes: PortalRouteNode[]): PortalRouteItem[] {
  return routes.flatMap((route) => (route.kind === 'group' ? route.children : [route]));
}
