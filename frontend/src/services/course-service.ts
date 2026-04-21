import { getAccessToken } from '@/auth/auth-store';
import {
  CreateCourseVersionRequestSchema,
  CourseSearchResponseSchema,
  type CourseSearchResponse,
  type CourseSearchSortBy,
  type CourseSearchSortDirection,
  CourseVersionDetailResponseSchema,
  type CreateCourseVersionRequest,
  type CourseVersionDetailResponse,
  CourseVersionSearchResponseSchema,
  type CourseVersionSearchResponse,
  type CourseVersionSearchSortBy,
  type CourseVersionSearchSortDirection,
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
