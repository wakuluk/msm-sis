import { getAccessToken } from '@/auth/auth-store';
import {
  CreateCourseRequestSchema,
  type CreateCourseRequest,
  CreateCourseVersionRequestSchema,
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

export type CreateCourseRequestArgs = {
  request: CreateCourseRequest;
  signal?: AbortSignal;
};

export type MakeCourseVersionCurrentRequest = {
  courseVersionId: number;
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

export async function createCourse({
  request,
  signal,
}: CreateCourseRequestArgs): Promise<CourseVersionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CreateCourseRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to create course.'
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
