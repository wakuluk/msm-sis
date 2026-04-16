import { type PortalRole, PORTAL_ROLES } from './PortalRoles';

export type PortalRouteItemKey =
  | 'dashboard'
  | 'shared'
  | 'student'
  | 'studentCreate'
  | 'studentDetail'
  | 'studentSearch'
  | 'sharedSecond'
  | 'catalog'
  | 'catalog-advanced'
  | 'academic-years-search'
  | 'academic-departments'
  | 'academic-department-detail'
  | 'academic-years-create'
  | 'academic-years-detail'
  | 'academic-term-detail';
export type PortalRoutePath =
  | '/portal'
  | '/shared'
  | '/sharedSecond'
  | '/student/profile'
  | '/students/new'
  | '/students/:studentId'
  | '/student-search'
  | '/catalog/search'
  | '/catalog/search-advanced'
  | '/academics/academic-years/search'
  | '/academics/departments'
  | '/academics/departments/:departmentId'
  | '/academics/academic-years/create'
  | '/academics/academic-years/:academicYearId'
  | '/academics/academic-term/:academicTermId';

export type PortalRouteGroupKey = 'people' | 'sharing' | 'catalog' | 'academics';

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
  {
    kind: 'group',
    key: 'catalog',
    label: 'Catalog',
    showInNav: false,
    children: [
      {
        kind: 'item',
        key: 'catalog',
        label: 'Catalog',
        path: '/catalog/search',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'catalog-advanced',
        label: 'Catalog',
        path: '/catalog/search-advanced',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'academics',
    label: 'Academics',
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'academic-departments',
        label: 'Academic Departments',
        path: '/academics/departments',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-department-detail',
        label: 'Academic Department Detail',
        path: '/academics/departments/:departmentId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-years-search',
        label: 'Academic Years',
        path: '/academics/academic-years/search',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-years-create',
        label: 'Create Academic Year',
        path: '/academics/academic-years/create',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-years-detail',
        label: 'Academic Year Detail',
        path: '/academics/academic-years/:academicYearId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-term-detail',
        label: 'Academic Term Detail',
        path: '/academics/academic-term/:academicTermId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
];

export function flattenPortalRoutes(routes: PortalRouteNode[]): PortalRouteItem[] {
  return routes.flatMap((route) => (route.kind === 'group' ? route.children : [route]));
}
