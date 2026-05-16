import { type PortalRole, PORTAL_ROLES } from './PortalRoles';

export type PortalRouteItemKey =
  | 'dashboard'
  | 'student'
  | 'studentCreate'
  | 'studentDetail'
  | 'studentTranscriptDetail'
  | 'studentSearch'
  | 'catalog'
  | 'catalog-advanced'
  | 'academic-years-search'
  | 'academic-programs'
  | 'academic-student-program-assignments'
  | 'academic-department-programs'
  | 'academic-program-create'
  | 'academic-program-detail'
  | 'academic-requirements'
  | 'academic-requirement-detail'
  | 'academic-degree-requests'
  | 'academic-degree-request-detail'
  | 'academic-transfer-requests'
  | 'academic-transfer-request-detail'
  | 'academic-student-program-review-detail'
  | 'student-transcript'
  | 'student-course-history'
  | 'student-programs'
  | 'student-transfer-request'
  | 'student-transfer-request-new'
  | 'student-transfer-request-detail'
  | 'student-approved-transfer-requests'
  | 'student-course-registration'
  | 'student-schedule'
  | 'academic-schools'
  | 'academic-school-detail'
  | 'academic-departments'
  | 'academic-department-detail'
  | 'course-search'
  | 'course-create'
  | 'course-detail'
  | 'academic-years-create'
  | 'academic-years-detail'
  | 'academic-year-courses'
  | 'course-section-detail'
  | 'course-section-stage-wizard'
  | 'teaching-schedule-search'
  | 'teaching-schedule'
  | 'teaching-schedule-detail'
  | 'registration-groups'
  | 'registration-group-builder'
  | 'registration-group-publish'
  | 'registration-group-unassigned-builder'
  | 'registration-group-detail'
  | 'academic-term-detail'
  | 'academic-term-group-detail'
  | 'admin-transfer-credit-policy-settings'
  | 'admin-transfer-credit-policy-settings-new'
  | 'admin-transfer-credit-policy-settings-detail'
  | 'billing-tuition-codes'
  | 'billing-tuition-code-detail'
  | 'billing-periods'
  | 'billing-period-detail'
  | 'athletics';
export type PortalRoutePath =
  | '/portal'
  | '/student/profile'
  | '/students/new'
  | '/students/:studentId'
  | '/students/:studentId/transcript'
  | '/student-search'
  | '/catalog/search'
  | '/catalog/search-advanced'
  | '/academics/academic-years/search'
  | '/academics/programs'
  | '/academics/student-program-assignments'
  | '/academics/department-programs'
  | '/academics/programs/new'
  | '/academics/programs/:programId'
  | '/academics/requirements'
  | '/academics/requirements/:requirementId'
  | '/academics/degree-requests'
  | '/academics/degree-requests/:studentProgramRequestId'
  | '/academics/transfer-requests'
  | '/academics/transfer-requests/:transferRequestId'
  | '/academics/student-programs/:studentProgramId/review'
  | '/academics/transcript'
  | '/academics/course-history'
  | '/academics/student-programs'
  | '/student/transfer-request'
  | '/student/transfer-request/new'
  | '/student/transfer-request/:transferRequestId'
  | '/academics/approved-transfer-requests'
  | '/registration/course-registration'
  | '/registration/schedule'
  | '/academics/schools'
  | '/academics/schools/:schoolId'
  | '/academics/departments'
  | '/academics/departments/:departmentId'
  | '/academics/courses/search'
  | '/academics/courses/new'
  | '/academics/courses/:courseId'
  | '/academics/academic-years/create'
  | '/academics/academic-years/:academicYearId'
  | '/academics/academic-years/:academicYearId/courses'
  | '/academics/course-sections/:sectionId'
  | '/academics/academic-sub-term/:subTermId/section-stage'
  | '/calendar/instructor-schedules'
  | '/calendar/instructor-schedules/:instructorId'
  | '/calendar/my-schedule'
  | '/registration/groups'
  | '/registration/groups/builder'
  | '/registration/groups/publish'
  | '/registration/groups/unassigned'
  | '/registration/groups/:registrationGroupId'
  | '/admin/settings/transfer-credit-policy'
  | '/admin/settings/transfer-credit-policy/new'
  | '/admin/settings/transfer-credit-policy/:policyId'
  | '/billing/tuition-codes'
  | '/billing/tuition-codes/:tuitionCodeId'
  | '/billing/periods'
  | '/billing/periods/:billingPeriodId'
  | '/athletics'
  | '/academics/academic-sub-term/:subTermId'
  | '/academics/academic-terms/:termId';

export type PortalRouteGroupKey =
  | 'people'
  | 'catalog'
  | 'academics'
  | 'programs'
  | 'transfer'
  | 'calendar'
  | 'registration'
  | 'billing'
  | 'settings'
  | 'athletics';

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
      {
        kind: 'item',
        key: 'studentTranscriptDetail',
        label: 'Student Transcript',
        path: '/students/:studentId/transcript',
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
        key: 'student-programs',
        label: 'My Programs',
        path: '/academics/student-programs',
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
        key: 'course-create',
        label: 'Create Course',
        path: '/academics/courses/new',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
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
        requiredRoles: [
          PORTAL_ROLES.ADMIN,
          PORTAL_ROLES.FACULTY,
          PORTAL_ROLES.ADJUNCT,
          PORTAL_ROLES.TEACHING_ASSISTANT,
          PORTAL_ROLES.DEPARTMENT_HEAD,
        ],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'course-section-stage-wizard',
        label: 'Stage Course Sections',
        path: '/academics/academic-sub-term/:subTermId/section-stage',
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
    key: 'programs',
    label: 'Programs',
    requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'academic-programs',
        label: 'Program Search',
        path: '/academics/programs',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-student-program-assignments',
        label: 'Student Programs',
        path: '/academics/student-program-assignments',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-department-programs',
        label: 'Department Students',
        path: '/academics/department-programs',
        requiredRoles: [PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-program-create',
        label: 'Create Program',
        path: '/academics/programs/new',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-program-detail',
        label: 'Program Detail',
        path: '/academics/programs/:programId',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-requirements',
        label: 'Requirement Library',
        path: '/academics/requirements',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-requirement-detail',
        label: 'Requirement Detail',
        path: '/academics/requirements/:requirementId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-degree-requests',
        label: 'Degree Requests',
        path: '/academics/degree-requests',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-degree-request-detail',
        label: 'Degree Request Detail',
        path: '/academics/degree-requests/:studentProgramRequestId',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'academic-student-program-review-detail',
        label: 'Student Program Review Detail',
        path: '/academics/student-programs/:studentProgramId/review',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
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
      {
        kind: 'item',
        key: 'teaching-schedule-search',
        label: 'Instructor Schedule Search',
        path: '/calendar/instructor-schedules',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'teaching-schedule',
        label: 'My Schedule',
        path: '/calendar/my-schedule',
        requiredRoles: [PORTAL_ROLES.FACULTY],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'teaching-schedule-detail',
        label: 'Instructor Schedule Detail',
        path: '/calendar/instructor-schedules/:instructorId',
        requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.DEPARTMENT_HEAD],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'transfer',
    label: 'Transfer',
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'student-transfer-request',
        label: 'Transfer Requests',
        path: '/student/transfer-request',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'student-transfer-request-new',
        label: 'New Transfer Request',
        path: '/student/transfer-request/new',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'student-transfer-request-detail',
        label: 'Transfer Request Detail',
        path: '/student/transfer-request/:transferRequestId',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'student-approved-transfer-requests',
        label: 'Approved Transfers',
        path: '/academics/approved-transfer-requests',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-transfer-requests',
        label: 'Transfer Requests',
        path: '/academics/transfer-requests',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'academic-transfer-request-detail',
        label: 'Transfer Request Detail',
        path: '/academics/transfer-requests/:transferRequestId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'admin-transfer-credit-policy-settings',
        label: 'Transfer Credit Policy',
        path: '/admin/settings/transfer-credit-policy',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'admin-transfer-credit-policy-settings-new',
        label: 'New Transfer Credit Policy',
        path: '/admin/settings/transfer-credit-policy/new',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'admin-transfer-credit-policy-settings-detail',
        label: 'Transfer Credit Policy Detail',
        path: '/admin/settings/transfer-credit-policy/:policyId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'registration',
    label: 'Registration',
    requiredRoles: [PORTAL_ROLES.ADMIN, PORTAL_ROLES.STUDENT],
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'registration-groups',
        label: 'Registration Groups',
        path: '/registration/groups',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'student-course-registration',
        label: 'Course Registration',
        path: '/registration/course-registration',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'student-schedule',
        label: 'My Schedule',
        path: '/registration/schedule',
        requiredRoles: [PORTAL_ROLES.STUDENT],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'registration-group-builder',
        label: 'Registration Group Builder',
        path: '/registration/groups/builder',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'registration-group-publish',
        label: 'Publish Registration Groups',
        path: '/registration/groups/publish',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'registration-group-unassigned-builder',
        label: 'Unassigned Registration Students',
        path: '/registration/groups/unassigned',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'registration-group-detail',
        label: 'Registration Group Detail',
        path: '/registration/groups/:registrationGroupId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'billing',
    label: 'Billing',
    requiredRoles: [PORTAL_ROLES.ADMIN],
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'billing-tuition-codes',
        label: 'Tuition Codes',
        path: '/billing/tuition-codes',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'billing-tuition-code-detail',
        label: 'Tuition Code Detail',
        path: '/billing/tuition-codes/:tuitionCodeId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
      {
        kind: 'item',
        key: 'billing-periods',
        label: 'Billing Periods',
        path: '/billing/periods',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
      {
        kind: 'item',
        key: 'billing-period-detail',
        label: 'Billing Period Detail',
        path: '/billing/periods/:billingPeriodId',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: false,
      },
    ],
  },
  {
    kind: 'group',
    key: 'settings',
    label: 'Settings',
    requiredRoles: [PORTAL_ROLES.ADMIN],
    showInNav: true,
    children: [],
  },
  {
    kind: 'group',
    key: 'athletics',
    label: 'Athletics',
    requiredRoles: [PORTAL_ROLES.ADMIN],
    showInNav: true,
    children: [
      {
        kind: 'item',
        key: 'athletics',
        label: 'Athletics',
        path: '/athletics',
        requiredRoles: [PORTAL_ROLES.ADMIN],
        showInNav: true,
      },
    ],
  },
];

export function flattenPortalRoutes(routes: PortalRouteNode[]): PortalRouteItem[] {
  return routes.flatMap((route) => (route.kind === 'group' ? route.children : [route]));
}
