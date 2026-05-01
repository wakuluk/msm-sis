import { type ComponentType } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RedirectIfAuthenticated } from '@/auth/RedirectIfAuthenticated';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { LogingPage } from '@/components/auth/LogingPage';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { flattenPortalRoutes, portalRoutes, type PortalRouteItemKey } from '@/portal/PortalRoutes';
import { PortalPage } from './pages/portal/Portal.page';
import { PublicPage } from './pages/public/Public.page';
import { CatalogAdvancedPage } from './pages/portal/CatalogAdvanced.page';
import { CatalogSearchPage } from './pages/portal/CatalogSearch.page';
import { StudentCreatePage } from './pages/portal/StudentCreate.page';
import { StudentDetailPage } from './pages/portal/StudentDetail.page';
import { StudentProfilePage } from './pages/portal/StudentProfile.page';
import { StudentSearchPage } from './pages/portal/StudentSearch.page';
import { AcademicTermDetailPage } from './pages/portal/AcademicTermDetail.page';
import { AcademicSchoolsPage } from './pages/portal/AcademicSchools.page';
import { AcademicSchoolDetailPage } from './pages/portal/AcademicSchoolDetail.page';
import { AcademicDepartmentsPage } from './pages/portal/AcademicDepartments.page';
import { AcademicDepartmentDetailPage } from './pages/portal/AcademicDepartmentDetail.page';
import { CourseSearchPage } from './pages/portal/CourseSearch.page';
import { CourseCreatePlaceholderPage } from './pages/portal/CourseCreatePlaceholder.page';
import { CourseDetailPage } from './pages/portal/CourseDetail.page';
import { AcademicYearsSearchPage } from './pages/portal/AcademicYearsSearch.page';
import { AcademicYearCreatePage } from './pages/portal/AcademicYearCreate.page';
import { AcademicYearDetailPage } from './pages/portal/AcademicYearDetail.page';
import { AcademicYearCoursesPage } from './pages/portal/AcademicYearCourses.page';
import { AcademicTermGroupDetailPage } from './pages/portal/AcademicTermGroupDetail.page';
import { CourseSectionDetailPage } from './pages/portal/CourseSectionDetail.page';
import { ProgramDetailPage } from './pages/portal/ProgramDetail.page';
import { ProgramSearchPage } from './pages/portal/ProgramSearch.page';
import { RequirementDetailPage } from './pages/portal/RequirementDetail.page';
import { RequirementLibraryPage } from './pages/portal/RequirementLibrary.page';
import {
  AcademicDegreeRequestsPage,
  AcademicProgramCreatePage,
} from './pages/portal/AdminProgramPlaceholders.page';
import {
  StudentCourseHistoryPage,
  StudentAdminTranscriptPage,
  StudentDegreeTrackerPage,
  StudentTranscriptPage,
} from './pages/portal/StudentAcademicsPlaceholders.page';

const portalRouteComponents = {
  dashboard: PortalPage,
  catalog: CatalogSearchPage,
  'catalog-advanced': CatalogAdvancedPage,
  'academic-programs': ProgramSearchPage,
  'academic-program-create': AcademicProgramCreatePage,
  'academic-program-detail': ProgramDetailPage,
  'academic-requirements': RequirementLibraryPage,
  'academic-requirement-detail': RequirementDetailPage,
  'academic-degree-requests': AcademicDegreeRequestsPage,
  'student-transcript': StudentTranscriptPage,
  'student-course-history': StudentCourseHistoryPage,
  'student-degree-tracker': StudentDegreeTrackerPage,
  'academic-schools': AcademicSchoolsPage,
  'academic-school-detail': AcademicSchoolDetailPage,
  'academic-departments': AcademicDepartmentsPage,
  'academic-department-detail': AcademicDepartmentDetailPage,
  'course-search': CourseSearchPage,
  'course-create': CourseCreatePlaceholderPage,
  'course-detail': CourseDetailPage,
  'academic-years-create': AcademicYearCreatePage,
  'academic-years-detail': AcademicYearDetailPage,
  'academic-year-courses': AcademicYearCoursesPage,
  'course-section-detail': CourseSectionDetailPage,
  'academic-term-detail': AcademicTermDetailPage,
  'academic-term-group-detail': AcademicTermGroupDetailPage,
  'academic-years-search': AcademicYearsSearchPage,
  student: StudentProfilePage,
  studentCreate: StudentCreatePage,
  studentDetail: StudentDetailPage,
  studentTranscriptDetail: StudentAdminTranscriptPage,
  studentSearch: StudentSearchPage,
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
    element: <Navigate to="/login" replace />,
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
