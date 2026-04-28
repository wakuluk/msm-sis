import { getAccessToken } from '@/auth/auth-store';
import {
  AddCourseSectionStudentRequestSchema,
  type AddCourseSectionStudentRequest,
  CreateCourseSectionRequestSchema,
  type CreateCourseSectionRequest,
  CreateCourseVersionRequestSchema,
  CourseSearchResponseSchema,
  type CourseSearchResponse,
  type CourseSearchSortBy,
  type CourseSearchSortDirection,
  CourseSectionDetailResponseSchema,
  type CourseSectionDetailResponse,
  CourseSectionListResponseSchema,
  type CourseSectionListResponse,
  type CourseSectionSortBy,
  type CourseSectionSortDirection,
  CourseSectionStudentListResponseSchema,
  type CourseSectionStudentListResponse,
  CourseSectionStudentEnrollmentEventListResponseSchema,
  type CourseSectionStudentEnrollmentEventListResponse,
  CourseSectionStudentResponseSchema,
  type CourseSectionStudentResponse,
  type CourseSectionStudentSortBy,
  CourseVersionDetailResponseSchema,
  type CreateCourseVersionRequest,
  type CourseVersionDetailResponse,
  CourseVersionSearchResponseSchema,
  type CourseVersionSearchResponse,
  type CourseVersionSearchSortBy,
  type CourseVersionSearchSortDirection,
  PatchCourseSectionRequestSchema,
  type PatchCourseSectionRequest,
  PatchCourseSectionStudentEnrollmentRequestSchema,
  type PatchCourseSectionStudentEnrollmentRequest,
} from './schemas/course-schemas';

export type GetCourseVersionsByCourseIdRequest = {
  courseId: number;
  page?: number;
  size?: number;
  sortBy?: CourseVersionSearchSortBy;
  sortDirection?: CourseVersionSearchSortDirection;
  signal?: AbortSignal;
};

export type CreateCourseVersionRequestArgs = {
  courseId: number;
  request: CreateCourseVersionRequest;
  signal?: AbortSignal;
};

export type CreateCourseSectionRequestArgs = {
  courseOfferingId: number;
  request: CreateCourseSectionRequest;
  signal?: AbortSignal;
};

export type PatchCourseSectionRequestArgs = {
  sectionId: number;
  request: PatchCourseSectionRequest;
  signal?: AbortSignal;
};

export type MakeCourseVersionCurrentRequest = {
  courseVersionId: number;
  signal?: AbortSignal;
};

export type SearchCoursesRequest = {
  schoolId?: number;
  departmentId?: number;
  subjectId?: number;
  courseNumber?: string;
  courseCode?: string;
  title?: string;
  currentVersionOnly?: boolean;
  includeInactive?: boolean;
  page?: number;
  size?: number;
  sortBy?: CourseSearchSortBy;
  sortDirection?: CourseSearchSortDirection;
  signal?: AbortSignal;
};

export type GetCourseSectionsForOfferingRequest = {
  courseOfferingId: number;
  subTermId?: number;
  page?: number;
  size?: number;
  sortBy?: CourseSectionSortBy;
  sortDirection?: CourseSectionSortDirection;
  signal?: AbortSignal;
};

export type GetCourseSectionDetailRequest = {
  sectionId: number;
  signal?: AbortSignal;
};

export type GetCourseSectionStudentsRequest = {
  sectionId: number;
  page?: number;
  size?: number;
  sortBy?: CourseSectionStudentSortBy;
  sortDirection?: CourseSectionSortDirection;
  signal?: AbortSignal;
};

export type AddCourseSectionStudentRequestArgs = {
  sectionId: number;
  request: AddCourseSectionStudentRequest;
  signal?: AbortSignal;
};

export type GetCourseSectionStudentEnrollmentRequest = {
  sectionId: number;
  enrollmentId: number;
  signal?: AbortSignal;
};

export type PatchCourseSectionStudentEnrollmentRequestArgs = {
  sectionId: number;
  enrollmentId: number;
  request: PatchCourseSectionStudentEnrollmentRequest;
  signal?: AbortSignal;
};

export type GetCourseSectionStudentEnrollmentEventsRequest = {
  sectionId: number;
  enrollmentId: number;
  page?: number;
  size?: number;
  signal?: AbortSignal;
};

export async function getCourseVersionsByCourseId({
  courseId,
  page = 0,
  size = 25,
  sortBy = 'versionNumber',
  sortDirection = 'desc',
  signal,
}: GetCourseVersionsByCourseIdRequest): Promise<CourseVersionSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  const response = await fetch(`/api/courses/${courseId}/versions?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load course versions.'
    );
  }

  return CourseVersionSearchResponseSchema.parse(payload);
}

export async function getCourseSectionsForOffering({
  courseOfferingId,
  subTermId,
  page = 0,
  size = 25,
  sortBy = 'sectionLetter',
  sortDirection = 'asc',
  signal,
}: GetCourseSectionsForOfferingRequest): Promise<CourseSectionListResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  if (subTermId !== undefined) {
    queryParams.set('subTermId', String(subTermId));
  }

  const response = await fetch(
    `/api/course-offerings/${courseOfferingId}/sections?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load course sections.'
    );
  }

  return CourseSectionListResponseSchema.parse(payload);
}

export async function getCourseSectionDetail({
  sectionId,
  signal,
}: GetCourseSectionDetailRequest): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}

export async function getCourseSectionStudents({
  sectionId,
  page = 0,
  size = 25,
  sortBy = 'student',
  sortDirection = 'asc',
  signal,
}: GetCourseSectionStudentsRequest): Promise<CourseSectionStudentListResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  const response = await fetch(
    `/api/course-sections/${sectionId}/students?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load course section students.'
    );
  }

  return CourseSectionStudentListResponseSchema.parse(payload);
}

export async function addCourseSectionStudent({
  sectionId,
  request,
  signal,
}: AddCourseSectionStudentRequestArgs): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AddCourseSectionStudentRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to add student to section.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function getCourseSectionStudentEnrollment({
  sectionId,
  enrollmentId,
  signal,
}: GetCourseSectionStudentEnrollmentRequest): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students/${enrollmentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load student enrollment.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function patchCourseSectionStudentEnrollment({
  sectionId,
  enrollmentId,
  request,
  signal,
}: PatchCourseSectionStudentEnrollmentRequestArgs): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students/${enrollmentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(PatchCourseSectionStudentEnrollmentRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to update student enrollment.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function getCourseSectionStudentEnrollmentEvents({
  sectionId,
  enrollmentId,
  page = 0,
  size = 25,
  signal,
}: GetCourseSectionStudentEnrollmentEventsRequest): Promise<CourseSectionStudentEnrollmentEventListResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await fetch(
    `/api/course-sections/${sectionId}/students/${enrollmentId}/events?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load enrollment events.'
    );
  }

  return CourseSectionStudentEnrollmentEventListResponseSchema.parse(payload);
}

export async function createCourseSection({
  courseOfferingId,
  request,
  signal,
}: CreateCourseSectionRequestArgs): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-offerings/${courseOfferingId}/sections`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CreateCourseSectionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to create course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}

export async function patchCourseSection({
  sectionId,
  request,
  signal,
}: PatchCourseSectionRequestArgs): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(PatchCourseSectionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to update course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}

export async function searchCourses({
  schoolId,
  departmentId,
  subjectId,
  courseNumber,
  courseCode,
  title,
  currentVersionOnly,
  includeInactive,
  page = 0,
  size = 25,
  sortBy = 'courseNumber',
  sortDirection = 'asc',
  signal,
}: SearchCoursesRequest): Promise<CourseSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  /** TODO
   * I don't like these strings.
    */
  if (schoolId !== undefined) {
    queryParams.set('schoolId', String(schoolId));
  }

  if (departmentId !== undefined) {
    queryParams.set('departmentId', String(departmentId));
  }

  if (subjectId !== undefined) {
    queryParams.set('subjectId', String(subjectId));
  }

  if (courseNumber && courseNumber.trim()) {
    queryParams.set('courseNumber', courseNumber.trim());
  }

  if (courseCode && courseCode.trim()) {
    queryParams.set('courseCode', courseCode.trim());
  }

  if (title && title.trim()) {
    queryParams.set('title', title.trim());
  }

  if (currentVersionOnly !== undefined) {
    queryParams.set('currentVersionOnly', String(currentVersionOnly));
  }

  if (includeInactive !== undefined) {
    queryParams.set('includeInactive', String(includeInactive));
  }

  const response = await fetch(`/api/courses/search?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to search courses.'
    );
  }

  return CourseSearchResponseSchema.parse(payload);
}

export async function createCourseVersion({
  courseId,
  request,
  signal,
}: CreateCourseVersionRequestArgs): Promise<CourseVersionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/courses/${courseId}/versions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CreateCourseVersionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to create course version.'
    );
  }

  return CourseVersionDetailResponseSchema.parse(payload);
}

export async function makeCourseVersionCurrent({
  courseVersionId,
  signal,
}: MakeCourseVersionCurrentRequest): Promise<CourseVersionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-versions/${courseVersionId}/make-current`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to make course version current.'
    );
  }

  return CourseVersionDetailResponseSchema.parse(payload);
}
