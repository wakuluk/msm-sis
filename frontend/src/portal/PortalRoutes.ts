import { type PortalRole, PORTAL_ROLES } from './PortalRoles';

export type PortalRouteItemKey =
  | 'dashboard'
  | 'student'
  | 'studentCreate'
  | 'studentDetail'
  | 'studentSearch'
  | 'catalog'
  | 'catalog-advanced'
  | 'academic-years-search'
  | 'student-transcript'
  | 'student-course-history'
  | 'student-degree-tracker'
  | 'academic-schools'
  | 'academic-school-detail'
  | 'academic-departments'
  | 'academic-department-detail'
  | 'course-search'
  | 'course-detail'
  | 'academic-years-create'
  | 'academic-years-detail'
  | 'academic-year-courses'
  | 'course-section-detail'
  | 'academic-term-detail'
  | 'academic-term-group-detail';
export type PortalRoutePath =
  | '/portal'
  | '/student/profile'
  | '/students/new'
  | '/students/:studentId'
  | '/student-search'
  | '/catalog/search'
  | '/catalog/search-advanced'
  | '/academics/academic-years/search'
  | '/academics/transcript'
  | '/academics/course-history'
  | '/academics/degree-tracker'
  | '/academics/schools'
  | '/academics/schools/:schoolId'
  | '/academics/departments'
  | '/academics/departments/:departmentId'
  | '/academics/courses/search'
  | '/academics/courses/:courseId'
  | '/academics/academic-years/create'
  | '/academics/academic-years/:academicYearId'
  | '/academics/academic-years/:academicYearId/courses'
  | '/academics/course-sections/:sectionId'
  | '/academics/academic-sub-term/:subTermId'
  | '/academics/academic-terms/:termId';

export type PortalRouteGroupKey = 'people' | 'catalog' | 'academics' | 'calendar';

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
        key: 'student-transcript',
        label: 'Transcript',
        path: '/academics/transcript',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'student-course-history',
        label: 'Course History',
        path: '/academics/course-history',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'student-degree-tracker',
        label: 'Degree Tracker',
        path: '/academics/degree-tracker',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-schools',
        label: 'Academic School Search',
        path: '/academics/schools',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-school-detail',
        label: 'Academic School Detail',
        path: '/academics/schools/:schoolId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-departments',
        label: 'Academic Departments',
        path: '/academics/departments',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
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
        key: 'course-search',
        label: 'Course Search',
        path: '/academics/courses/search',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'course-detail',
        label: 'Course Detail',
        path: '/academics/courses/:courseId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
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
        key: 'academic-year-courses',
        label: 'Academic Year Courses',
        path: '/academics/academic-years/:academicYearId/courses',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'course-section-detail',
        label: 'Course Section Detail',
        path: '/academics/course-sections/:sectionId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-term-detail',
        label: 'Sub Term Detail',
        path: '/academics/academic-sub-term/:subTermId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-term-group-detail',
        label: 'Term Detail',
        path: '/academics/academic-terms/:termId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'calendar',
    label: 'Calendar',
    showInNav: true,
    children: [
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
    ],
  },
];

export function flattenPortalRoutes(routes: PortalRouteNode[]): PortalRouteItem[] {
  return routes.flatMap((route) => (route.kind === 'group' ? route.children : [route]));
}
