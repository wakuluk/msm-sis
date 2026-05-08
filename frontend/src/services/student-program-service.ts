import { apiRequest } from './api-client';
import {
  CourseVersionDetailResponseSchema,
  type CourseVersionDetailResponse,
} from './schemas/course-schemas';
import {
  ExploreStudentProgramRequestSchema,
  ProgramRequestReviewActionRequestSchema,
  ReplaceAcademicPlanPlaceholderCourseRequestSchema,
  StudentAcademicPlanDraftRequestSchema,
  StudentAcademicPlanResponseSchema,
  StudentProgramAssignmentSearchResponseSchema,
  StudentProgramRequestDetailResponseSchema,
  StudentProgramRequestQueueResponseSchema,
  StudentProgramReviewDetailResponseSchema,
  StudentProgramsResponseSchema,
  type ExploreStudentProgramRequest,
  type ProgramRequestReviewActionRequest,
  type ReplaceAcademicPlanPlaceholderCourseRequest,
  type StudentAcademicPlanDraftRequest,
  type StudentAcademicPlanResponse,
  type StudentProgramAssignmentSearchResponse,
  type StudentProgramRequestDetailResponse,
  type StudentProgramRequestQueueResponse,
  type StudentProgramReviewDetailResponse,
  type StudentProgramsResponse,
} from './schemas/student-program-schemas';

export type GetStudentProgramsRequest = {
  signal?: AbortSignal;
};

export type GetStudentProgramsByIdRequest = {
  studentId: number;
  signal?: AbortSignal;
};

export type GetMyLatestCourseVersionRequest = {
  courseId: number;
  signal?: AbortSignal;
};

export type ExploreMyStudentProgramServiceRequest = {
  request: ExploreStudentProgramRequest;
  signal?: AbortSignal;
};

export type RemoveMyStudentProgramServiceRequest = {
  studentProgramId: number;
  signal?: AbortSignal;
};

export type RequestMyStudentProgramServiceRequest = {
  studentProgramId: number;
  signal?: AbortSignal;
};

export type GetProgramRequestsServiceRequest = {
  classStandingId?: number | null;
  degreeTypeId?: number | null;
  departmentId?: number | null;
  page?: number;
  programQuery?: string | null;
  programTypeId?: number | null;
  requestedFrom?: string | null;
  requestedTo?: string | null;
  schoolId?: number | null;
  signal?: AbortSignal;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  statuses?: string[];
  studentQuery?: string | null;
};

export type GetMyDepartmentProgramRequestsServiceRequest = {
  classStandingId?: number | null;
  degreeTypeId?: number | null;
  page?: number;
  programQuery?: string | null;
  programTypeId?: number | null;
  requestedFrom?: string | null;
  requestedTo?: string | null;
  schoolId?: number | null;
  signal?: AbortSignal;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  statuses?: string[];
  studentQuery?: string | null;
};

export type SearchMyDepartmentMajorStudentsServiceRequest = {
  classStandingId?: number | null;
  departmentId?: number | null;
  degreeTypeId?: number | null;
  page?: number;
  programQuery?: string | null;
  programTypeId?: number | null;
  schoolId?: number | null;
  signal?: AbortSignal;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  status?: string | null;
  studentQuery?: string | null;
};

export type SearchStudentProgramAssignmentsServiceRequest =
  SearchMyDepartmentMajorStudentsServiceRequest;

export type GetProgramRequestDetailServiceRequest = {
  studentProgramRequestId: number;
  signal?: AbortSignal;
};

export type GetStudentProgramReviewDetailServiceRequest = {
  studentProgramId: number;
  signal?: AbortSignal;
};

export type ReviewProgramRequestServiceRequest = {
  request?: ProgramRequestReviewActionRequest;
  signal?: AbortSignal;
  studentProgramRequestId: number;
};

export type SaveStudentAcademicPlanServiceRequest = {
  request: StudentAcademicPlanDraftRequest;
  signal?: AbortSignal;
};

export type SaveStudentAcademicPlanByIdServiceRequest = {
  studentId: number;
  request: StudentAcademicPlanDraftRequest;
  signal?: AbortSignal;
};

export type PreviewStudentAcademicPlanServiceRequest = {
  request: StudentAcademicPlanDraftRequest;
  signal?: AbortSignal;
};

export type PreviewStudentAcademicPlanByIdServiceRequest = {
  studentId: number;
  request: StudentAcademicPlanDraftRequest;
  signal?: AbortSignal;
};

export type ReplaceMyAcademicPlanPlaceholderCourseServiceRequest = {
  studentAcademicPlanCourseId: number;
  request: ReplaceAcademicPlanPlaceholderCourseRequest;
  signal?: AbortSignal;
};

export type ReplaceStudentAcademicPlanPlaceholderCourseByIdServiceRequest = {
  studentId: number;
  studentAcademicPlanCourseId: number;
  request: ReplaceAcademicPlanPlaceholderCourseRequest;
  signal?: AbortSignal;
};

function buildProgramRequestQueuePath(
  basePath: string,
  {
    classStandingId,
    degreeTypeId,
    departmentId,
    page,
    programQuery,
    programTypeId,
    requestedFrom,
    requestedTo,
    schoolId,
    size,
    sortBy,
    sortDirection,
    statuses,
    studentQuery,
  }: {
    classStandingId?: number | null;
    degreeTypeId?: number | null;
    departmentId?: number | null;
    page?: number;
    programQuery?: string | null;
    programTypeId?: number | null;
    requestedFrom?: string | null;
    requestedTo?: string | null;
    schoolId?: number | null;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
    statuses?: string[];
    studentQuery?: string | null;
  } = {}
) {
  const queryParams = new URLSearchParams();

  if (classStandingId !== undefined && classStandingId !== null) {
    queryParams.set('classStandingId', String(classStandingId));
  }

  if (degreeTypeId !== undefined && degreeTypeId !== null) {
    queryParams.set('degreeTypeId', String(degreeTypeId));
  }

  if (departmentId !== undefined && departmentId !== null) {
    queryParams.set('departmentId', String(departmentId));
  }

  if (programQuery) {
    queryParams.set('programQuery', programQuery);
  }

  if (programTypeId !== undefined && programTypeId !== null) {
    queryParams.set('programTypeId', String(programTypeId));
  }

  if (requestedFrom) {
    queryParams.set('requestedFrom', requestedFrom);
  }

  if (requestedTo) {
    queryParams.set('requestedTo', requestedTo);
  }

  if (schoolId !== undefined && schoolId !== null) {
    queryParams.set('schoolId', String(schoolId));
  }

  if (studentQuery) {
    queryParams.set('studentQuery', studentQuery);
  }

  statuses?.forEach((status) => {
    const normalizedStatus = status.trim();

    if (normalizedStatus !== '') {
      queryParams.append('status', normalizedStatus);
    }
  });

  if (page !== undefined) {
    queryParams.set('page', String(page));
  }

  if (size !== undefined) {
    queryParams.set('size', String(size));
  }

  if (sortBy) {
    queryParams.set('sortBy', sortBy);
  }

  if (sortDirection) {
    queryParams.set('sortDirection', sortDirection);
  }

  const queryString = queryParams.toString();

  return queryString === '' ? basePath : `${basePath}?${queryString}`;
}

function buildStudentProgramAssignmentSearchPath({
  classStandingId,
  departmentId,
  degreeTypeId,
  page,
  programQuery,
  programTypeId,
  schoolId,
  size,
  sortBy,
  sortDirection,
  status,
  studentQuery,
  basePath = '/api/me/student-programs/department/majors',
}: Omit<SearchMyDepartmentMajorStudentsServiceRequest, 'signal'> & { basePath?: string } = {}) {
  const queryParams = new URLSearchParams();

  if (classStandingId !== undefined && classStandingId !== null) {
    queryParams.set('classStandingId', String(classStandingId));
  }

  if (departmentId !== undefined && departmentId !== null) {
    queryParams.set('departmentId', String(departmentId));
  }

  if (degreeTypeId !== undefined && degreeTypeId !== null) {
    queryParams.set('degreeTypeId', String(degreeTypeId));
  }

  if (programQuery) {
    queryParams.set('programQuery', programQuery);
  }

  if (programTypeId !== undefined && programTypeId !== null) {
    queryParams.set('programTypeId', String(programTypeId));
  }

  if (schoolId !== undefined && schoolId !== null) {
    queryParams.set('schoolId', String(schoolId));
  }

  if (status) {
    queryParams.set('status', status);
  }

  if (studentQuery) {
    queryParams.set('studentQuery', studentQuery);
  }

  if (page !== undefined) {
    queryParams.set('page', String(page));
  }

  if (size !== undefined) {
    queryParams.set('size', String(size));
  }

  if (sortBy) {
    queryParams.set('sortBy', sortBy);
  }

  if (sortDirection) {
    queryParams.set('sortDirection', sortDirection);
  }

  const queryString = queryParams.toString();

  return queryString === '' ? basePath : `${basePath}?${queryString}`;
}

export function getMyStudentPrograms({
  signal,
}: GetStudentProgramsRequest = {}): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: '/api/me/programs',
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to load student programs.',
  });
}

export function getStudentProgramsById({
  studentId,
  signal,
}: GetStudentProgramsByIdRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/programs`,
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to load student programs.',
  });
}

export function getMyLatestCourseVersion({
  courseId,
  signal,
}: GetMyLatestCourseVersionRequest): Promise<CourseVersionDetailResponse> {
  return apiRequest({
    path: `/api/me/courses/${courseId}/latest-version`,
    parser: CourseVersionDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to load course details.',
  });
}

export function exploreMyStudentProgram({
  request,
  signal,
}: ExploreMyStudentProgramServiceRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: '/api/me/programs/explore',
    method: 'POST',
    body: ExploreStudentProgramRequestSchema.parse(request),
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to explore program.',
  });
}

export function removeMyStudentProgram({
  studentProgramId,
  signal,
}: RemoveMyStudentProgramServiceRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: `/api/me/programs/${studentProgramId}`,
    method: 'DELETE',
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to remove program.',
  });
}

export function requestMyStudentProgram({
  studentProgramId,
  signal,
}: RequestMyStudentProgramServiceRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: `/api/me/programs/${studentProgramId}/request`,
    method: 'POST',
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to request program.',
  });
}

export function getProgramRequests({
  classStandingId,
  degreeTypeId,
  departmentId,
  page,
  programQuery,
  programTypeId,
  requestedFrom,
  requestedTo,
  schoolId,
  signal,
  size,
  sortBy,
  sortDirection,
  statuses,
  studentQuery,
}: GetProgramRequestsServiceRequest = {}): Promise<StudentProgramRequestQueueResponse> {
  return apiRequest({
    path: buildProgramRequestQueuePath('/api/program-requests', {
      classStandingId,
      degreeTypeId,
      departmentId,
      page,
      programQuery,
      programTypeId,
      requestedFrom,
      requestedTo,
      schoolId,
      size,
      sortBy,
      sortDirection,
      statuses,
      studentQuery,
    }),
    parser: StudentProgramRequestQueueResponseSchema,
    signal,
    fallbackMessage: 'Failed to load program requests.',
  });
}

export function getMyDepartmentProgramRequests({
  classStandingId,
  degreeTypeId,
  page,
  programQuery,
  programTypeId,
  requestedFrom,
  requestedTo,
  schoolId,
  signal,
  size,
  sortBy,
  sortDirection,
  statuses,
  studentQuery,
}: GetMyDepartmentProgramRequestsServiceRequest = {}): Promise<StudentProgramRequestQueueResponse> {
  return apiRequest({
    path: buildProgramRequestQueuePath('/api/me/program-requests/department', {
      classStandingId,
      degreeTypeId,
      page,
      programQuery,
      programTypeId,
      requestedFrom,
      requestedTo,
      schoolId,
      size,
      sortBy,
      sortDirection,
      statuses,
      studentQuery,
    }),
    parser: StudentProgramRequestQueueResponseSchema,
    signal,
    fallbackMessage: 'Failed to load department program requests.',
  });
}

export function searchMyDepartmentMajorStudents({
  classStandingId,
  degreeTypeId,
  page,
  programQuery,
  signal,
  size,
  sortBy,
  sortDirection,
  status,
  studentQuery,
}: SearchMyDepartmentMajorStudentsServiceRequest = {}): Promise<StudentProgramAssignmentSearchResponse> {
  return apiRequest({
    path: buildStudentProgramAssignmentSearchPath({
      classStandingId,
      degreeTypeId,
      page,
      programQuery,
      size,
      sortBy,
      sortDirection,
      status,
      studentQuery,
    }),
    parser: StudentProgramAssignmentSearchResponseSchema,
    signal,
    fallbackMessage: 'Failed to search department major students.',
  });
}

export function searchStudentProgramAssignments({
  classStandingId,
  departmentId,
  degreeTypeId,
  page,
  programQuery,
  programTypeId,
  schoolId,
  signal,
  size,
  sortBy,
  sortDirection,
  status,
  studentQuery,
}: SearchStudentProgramAssignmentsServiceRequest = {}): Promise<StudentProgramAssignmentSearchResponse> {
  return apiRequest({
    path: buildStudentProgramAssignmentSearchPath({
      basePath: '/api/student-programs/assignments',
      classStandingId,
      departmentId,
      degreeTypeId,
      page,
      programQuery,
      programTypeId,
      schoolId,
      size,
      sortBy,
      sortDirection,
      status,
      studentQuery,
    }),
    parser: StudentProgramAssignmentSearchResponseSchema,
    signal,
    fallbackMessage: 'Failed to search student program assignments.',
  });
}

export function getProgramRequestDetail({
  studentProgramRequestId,
  signal,
}: GetProgramRequestDetailServiceRequest): Promise<StudentProgramRequestDetailResponse> {
  return apiRequest({
    path: `/api/program-requests/${studentProgramRequestId}`,
    parser: StudentProgramRequestDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to load program request.',
  });
}

export function getStudentProgramReviewDetail({
  studentProgramId,
  signal,
}: GetStudentProgramReviewDetailServiceRequest): Promise<StudentProgramReviewDetailResponse> {
  return apiRequest({
    path: `/api/student-programs/${studentProgramId}/review-detail`,
    parser: StudentProgramReviewDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to load student program detail.',
  });
}

export function departmentApproveProgramRequest({
  request,
  signal,
  studentProgramRequestId,
}: ReviewProgramRequestServiceRequest): Promise<StudentProgramRequestDetailResponse> {
  return apiRequest({
    path: `/api/program-requests/${studentProgramRequestId}/department-approve`,
    method: 'POST',
    body:
      request === undefined ? undefined : ProgramRequestReviewActionRequestSchema.parse(request),
    parser: StudentProgramRequestDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to approve program request.',
  });
}

export function adminApproveProgramRequest({
  request,
  signal,
  studentProgramRequestId,
}: ReviewProgramRequestServiceRequest): Promise<StudentProgramRequestDetailResponse> {
  return apiRequest({
    path: `/api/program-requests/${studentProgramRequestId}/admin-approve`,
    method: 'POST',
    body:
      request === undefined ? undefined : ProgramRequestReviewActionRequestSchema.parse(request),
    parser: StudentProgramRequestDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to approve program request.',
  });
}

export function rejectProgramRequest({
  request,
  signal,
  studentProgramRequestId,
}: ReviewProgramRequestServiceRequest): Promise<StudentProgramRequestDetailResponse> {
  return apiRequest({
    path: `/api/program-requests/${studentProgramRequestId}/reject`,
    method: 'POST',
    body: ProgramRequestReviewActionRequestSchema.parse(request),
    parser: StudentProgramRequestDetailResponseSchema,
    signal,
    fallbackMessage: 'Failed to reject program request.',
  });
}

export function saveMyStudentAcademicPlan({
  request,
  signal,
}: SaveStudentAcademicPlanServiceRequest): Promise<StudentAcademicPlanResponse> {
  return apiRequest({
    path: '/api/me/academic-plan',
    method: 'PUT',
    body: StudentAcademicPlanDraftRequestSchema.parse(request),
    parser: StudentAcademicPlanResponseSchema,
    signal,
    fallbackMessage: 'Failed to save academic plan.',
  });
}

export function saveStudentAcademicPlanById({
  studentId,
  request,
  signal,
}: SaveStudentAcademicPlanByIdServiceRequest): Promise<StudentAcademicPlanResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-plan`,
    method: 'PUT',
    body: StudentAcademicPlanDraftRequestSchema.parse(request),
    parser: StudentAcademicPlanResponseSchema,
    signal,
    fallbackMessage: 'Failed to save academic plan.',
  });
}

export function previewMyStudentAcademicPlan({
  request,
  signal,
}: PreviewStudentAcademicPlanServiceRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: '/api/me/academic-plan/preview',
    method: 'POST',
    body: StudentAcademicPlanDraftRequestSchema.parse(request),
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to preview academic plan.',
  });
}

export function previewStudentAcademicPlanById({
  studentId,
  request,
  signal,
}: PreviewStudentAcademicPlanByIdServiceRequest): Promise<StudentProgramsResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-plan/preview`,
    method: 'POST',
    body: StudentAcademicPlanDraftRequestSchema.parse(request),
    parser: StudentProgramsResponseSchema,
    signal,
    fallbackMessage: 'Failed to preview academic plan.',
  });
}

export function replaceMyAcademicPlanPlaceholderCourse({
  studentAcademicPlanCourseId,
  request,
  signal,
}: ReplaceMyAcademicPlanPlaceholderCourseServiceRequest): Promise<StudentAcademicPlanResponse> {
  return apiRequest({
    path: `/api/me/academic-plan/courses/${studentAcademicPlanCourseId}/replace-placeholder`,
    method: 'PATCH',
    body: ReplaceAcademicPlanPlaceholderCourseRequestSchema.parse(request),
    parser: StudentAcademicPlanResponseSchema,
    signal,
    fallbackMessage: 'Failed to replace planned elective.',
  });
}

export function replaceStudentAcademicPlanPlaceholderCourseById({
  studentId,
  studentAcademicPlanCourseId,
  request,
  signal,
}: ReplaceStudentAcademicPlanPlaceholderCourseByIdServiceRequest): Promise<StudentAcademicPlanResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-plan/courses/${studentAcademicPlanCourseId}/replace-placeholder`,
    method: 'PATCH',
    body: ReplaceAcademicPlanPlaceholderCourseRequestSchema.parse(request),
    parser: StudentAcademicPlanResponseSchema,
    signal,
    fallbackMessage: 'Failed to replace planned elective.',
  });
}
