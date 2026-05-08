import { getAccessToken } from '@/auth/auth-store';
import {
  CourseSearchResponseSchema,
  type CourseSearchResponse,
  type CourseSearchSortBy,
  type CourseSearchSortDirection,
} from './schemas/course-schemas';

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
