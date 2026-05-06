import { apiRequest } from './api-client';
import {
  CourseVersionDetailResponseSchema,
  type CourseVersionDetailResponse,
} from './schemas/course-schemas';
import {
  ExploreStudentProgramRequestSchema,
  ReplaceAcademicPlanPlaceholderCourseRequestSchema,
  StudentAcademicPlanDraftRequestSchema,
  StudentAcademicPlanResponseSchema,
  StudentProgramsResponseSchema,
  type ExploreStudentProgramRequest,
  type ReplaceAcademicPlanPlaceholderCourseRequest,
  type StudentAcademicPlanDraftRequest,
  type StudentAcademicPlanResponse,
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
