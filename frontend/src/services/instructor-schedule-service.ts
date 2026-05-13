import { apiRequest } from './api-client';
import {
  InstructorScheduleSearchResponseSchema,
  type InstructorScheduleSearchResponse,
} from './schemas/instructor-schedule-schemas';

export const instructorScheduleSearchSizeOptions = [25, 50, 100] as const;

export type InstructorScheduleSearchSize = (typeof instructorScheduleSearchSizeOptions)[number];

export type InstructorScheduleSearchSortBy =
  | 'academicYear'
  | 'course'
  | 'department'
  | 'deliveryMode'
  | 'instructor'
  | 'role'
  | 'school'
  | 'section'
  | 'status'
  | 'subTerm';

export type InstructorScheduleSearchSortDirection = 'asc' | 'desc';

export const defaultInstructorScheduleSortBy: InstructorScheduleSearchSortBy = 'instructor';
export const defaultInstructorScheduleSortDirection: InstructorScheduleSearchSortDirection = 'asc';
export const defaultInstructorScheduleSearchSize: InstructorScheduleSearchSize = 25;

export type InstructorScheduleSearchRequest = {
  academicYearId?: number;
  termId?: number;
  subTermIds?: number[];
  schoolId?: number;
  departmentId?: number;
  staffId?: number;
  instructorSearch?: string;
  courseSearch?: string;
  statusCode?: string;
  roleCode?: string;
  deliveryModeCode?: string;
  page?: number;
  size?: InstructorScheduleSearchSize;
  sortBy?: InstructorScheduleSearchSortBy;
  sortDirection?: InstructorScheduleSearchSortDirection;
  signal?: AbortSignal;
};

export type GetInstructorScheduleRequest = InstructorScheduleSearchRequest & {
  userId: number;
};

function appendOptionalNumberQueryParam(
  queryParams: URLSearchParams,
  key: string,
  value?: number
) {
  if (value !== undefined) {
    queryParams.set(key, String(value));
  }
}

function appendOptionalCodeQueryParam(
  queryParams: URLSearchParams,
  key: string,
  value?: string
) {
  const trimmedValue = value?.trim();

  if (trimmedValue) {
    queryParams.set(key, trimmedValue);
  }
}

function buildInstructorScheduleSearchQueryParams({
  academicYearId,
  termId,
  subTermIds,
  schoolId,
  departmentId,
  staffId,
  instructorSearch,
  courseSearch,
  statusCode,
  roleCode,
  deliveryModeCode,
  page = 0,
  size = defaultInstructorScheduleSearchSize,
  sortBy = defaultInstructorScheduleSortBy,
  sortDirection = defaultInstructorScheduleSortDirection,
}: InstructorScheduleSearchRequest): URLSearchParams {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  appendOptionalNumberQueryParam(queryParams, 'academicYearId', academicYearId);
  appendOptionalNumberQueryParam(queryParams, 'termId', termId);
  appendOptionalNumberQueryParam(queryParams, 'schoolId', schoolId);
  appendOptionalNumberQueryParam(queryParams, 'departmentId', departmentId);
  appendOptionalNumberQueryParam(queryParams, 'staffId', staffId);

  subTermIds
    ?.filter((subTermId) => Number.isFinite(subTermId))
    .forEach((subTermId) => queryParams.append('subTermIds', String(subTermId)));

  appendOptionalCodeQueryParam(queryParams, 'instructorSearch', instructorSearch);
  appendOptionalCodeQueryParam(queryParams, 'courseSearch', courseSearch);
  appendOptionalCodeQueryParam(queryParams, 'statusCode', statusCode);
  appendOptionalCodeQueryParam(queryParams, 'roleCode', roleCode);
  appendOptionalCodeQueryParam(queryParams, 'deliveryModeCode', deliveryModeCode);

  return queryParams;
}

function requestInstructorScheduleSearch(
  path: string,
  request: InstructorScheduleSearchRequest,
  fallbackMessage: string
): Promise<InstructorScheduleSearchResponse> {
  const queryParams = buildInstructorScheduleSearchQueryParams(request);

  return apiRequest({
    path: `${path}?${queryParams.toString()}`,
    parser: InstructorScheduleSearchResponseSchema,
    signal: request.signal,
    fallbackMessage,
  });
}

export function searchInstructorSchedules(
  request: InstructorScheduleSearchRequest
): Promise<InstructorScheduleSearchResponse> {
  return requestInstructorScheduleSearch(
    '/api/instructor-schedules/search',
    request,
    'Failed to search instructor schedules.'
  );
}

export function getInstructorSchedule({
  userId,
  ...request
}: GetInstructorScheduleRequest): Promise<InstructorScheduleSearchResponse> {
  return requestInstructorScheduleSearch(
    `/api/instructor-schedules/${userId}`,
    request,
    'Failed to load instructor schedule.'
  );
}

export function getMyInstructorSchedule(
  request: InstructorScheduleSearchRequest = {}
): Promise<InstructorScheduleSearchResponse> {
  return requestInstructorScheduleSearch(
    '/api/me/instructor-schedule',
    request,
    'Failed to load your instructor schedule.'
  );
}
