import { apiRequest } from './api-client';
import {
  defaultCourseOfferingSearchSize,
  defaultCourseOfferingSortBy,
  defaultCourseOfferingSortDirection,
} from './course-offering-search-config';
import {
  appendTrimmedMultiValueQueryParams,
  appendTrimmedQueryParam,
} from './catalog-search-helpers';
import {
  CourseOfferingDetailResponseSchema,
  CourseOfferingSearchResponseSchema,
  type CourseOfferingDetailResponse,
  type CourseOfferingSearchFilters,
  type CourseOfferingSearchResponse,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from './schemas/catalog-schemas';

export type CourseOfferingSearchRequest = {
  filters: CourseOfferingSearchFilters;
  subTermStatusCodes?: string[];
  includeInactive?: boolean;
  isPublished?: boolean;
  page?: number;
  size?: number;
  sortBy?: CourseOfferingSearchSortBy;
  sortDirection?: CourseOfferingSortDirection;
  signal?: AbortSignal;
};

export type CourseOfferingDetailRequest = {
  courseOfferingId: number;
  signal?: AbortSignal;
};

export function buildCourseOfferingSearchQueryParams({
  filters,
  subTermStatusCodes,
  includeInactive,
  isPublished,
  page = 0,
  size = defaultCourseOfferingSearchSize,
  sortBy = defaultCourseOfferingSortBy,
  sortDirection = defaultCourseOfferingSortDirection,
}: Omit<CourseOfferingSearchRequest, 'signal'>) {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    appendTrimmedQueryParam(queryParams, key, value);
  });

  appendTrimmedMultiValueQueryParams(queryParams, 'subTermStatusCodes', subTermStatusCodes);

  if (includeInactive !== undefined) {
    queryParams.set('includeInactive', String(includeInactive));
  }

  if (isPublished !== undefined) {
    queryParams.set('isPublished', String(isPublished));
  }

  queryParams.set('page', String(page));
  queryParams.set('size', String(size));
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortDirection', sortDirection);

  return queryParams;
}

async function fetchCourseOfferingSearch(
  path: string,
  {
    filters,
    subTermStatusCodes,
    includeInactive,
    isPublished,
    page = 0,
    size = defaultCourseOfferingSearchSize,
    sortBy = defaultCourseOfferingSortBy,
    sortDirection = defaultCourseOfferingSortDirection,
    signal,
  }: CourseOfferingSearchRequest
): Promise<CourseOfferingSearchResponse> {
  return apiRequest({
    path: `${path}?${buildCourseOfferingSearchQueryParams({
      filters,
      subTermStatusCodes,
      includeInactive,
      isPublished,
      page,
      size,
      sortBy,
      sortDirection,
    }).toString()}`,
    parser: CourseOfferingSearchResponseSchema,
    fallbackMessage: 'Failed to search course offerings.',
    signal,
  });
}

export async function searchPublicCourseOfferings(
  request: CourseOfferingSearchRequest
): Promise<CourseOfferingSearchResponse> {
  return fetchCourseOfferingSearch('/api/course-offerings/search', request);
}

export async function searchAdvancedCourseOfferings(
  request: CourseOfferingSearchRequest
): Promise<CourseOfferingSearchResponse> {
  return fetchCourseOfferingSearch('/api/course-offerings/advanced-search', request);
}

export async function searchCourseOfferings(
  request: CourseOfferingSearchRequest
): Promise<CourseOfferingSearchResponse> {
  return searchPublicCourseOfferings(request);
}

async function fetchCourseOfferingById(
  path: string,
  { courseOfferingId, signal }: CourseOfferingDetailRequest
): Promise<CourseOfferingDetailResponse> {
  return apiRequest({
    path: `${path}/${courseOfferingId}`,
    parser: CourseOfferingDetailResponseSchema,
    fallbackMessage: 'Failed to fetch course offering detail.',
    signal,
  });
}

export async function getPublicCourseOfferingById(
  request: CourseOfferingDetailRequest
): Promise<CourseOfferingDetailResponse> {
  return fetchCourseOfferingById('/api/course-offerings/details', request);
}

export async function getAdvancedCourseOfferingById(
  request: CourseOfferingDetailRequest
): Promise<CourseOfferingDetailResponse> {
  return fetchCourseOfferingById('/api/course-offerings/details-advanced', request);
}

export async function getCourseOfferingById(
  courseOfferingId: number
): Promise<CourseOfferingDetailResponse> {
  return getPublicCourseOfferingById({ courseOfferingId });
}
