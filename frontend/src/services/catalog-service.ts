import { getAccessToken } from '@/auth/auth-store';
import type {
  CatalogReferenceOption,
  CatalogSearchReferenceOptionsResponse,
  CatalogSubjectReferenceOption,
  CatalogTermReferenceOption,
} from './schemas/reference-schemas';
import { CatalogSearchReferenceOptionsResponseSchema } from './schemas/reference-schemas';
import {
  CourseOfferingDetailResponseSchema,
  CourseOfferingSearchResponseSchema,
  CourseOfferingSearchSortBySchema,
  CourseOfferingSortDirectionSchema,
  type CourseOfferingDetailResponse,
  type CourseOfferingSearchFilters,
  type CourseOfferingSearchResponse,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from './schemas/catalog-schemas';

let cachedCatalogSearchReferenceOptions: CatalogSearchReferenceOptionsResponse | null = null;
let catalogSearchReferenceOptionsPromise: Promise<CatalogSearchReferenceOptionsResponse> | null =
  null;
let cachedAdvancedCatalogSearchReferenceOptions: CatalogSearchReferenceOptionsResponse | null =
  null;
let advancedCatalogSearchReferenceOptionsPromise: Promise<CatalogSearchReferenceOptionsResponse> | null =
  null;

export const courseOfferingSearchSizeOptions = [10, 25, 50, 100] as const;

export type CourseOfferingSearchSize = (typeof courseOfferingSearchSizeOptions)[number];

export const defaultCourseOfferingSearchSize: CourseOfferingSearchSize = 25;
export const defaultCourseOfferingSortBy: CourseOfferingSearchSortBy = 'termCode';
export const defaultCourseOfferingSortDirection: CourseOfferingSortDirection = 'asc';

export const courseOfferingSortByOptions: ReadonlyArray<{
  value: CourseOfferingSearchSortBy;
  label: string;
}> = [
  { value: 'termCode', label: 'Term' },
  { value: 'subjectCode', label: 'Subject' },
  { value: 'courseNumber', label: 'Course number' },
  { value: 'courseCode', label: 'Course code' },
  { value: 'title', label: 'Title' },
  { value: 'minCredits', label: 'Minimum credits' },
  { value: 'maxCredits', label: 'Maximum credits' },
  { value: 'offeringStatusCode', label: 'Offering status' },
];

export const courseOfferingSortDirectionOptions: ReadonlyArray<{
  value: CourseOfferingSortDirection;
  label: string;
}> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export const courseOfferingSearchSizeSelectOptions: ReadonlyArray<{
  value: string;
  label: string;
}> = courseOfferingSearchSizeOptions.map((size) => ({
  value: String(size),
  label: String(size),
}));

export type CourseOfferingSearchRequest = {
  filters: CourseOfferingSearchFilters;
  offeringStatusCodes?: string[];
  termStatusCodes?: string[];
  includeInactive?: boolean;
  page?: number;
  size?: number;
  sortBy?: CourseOfferingSearchSortBy;
  sortDirection?: CourseOfferingSortDirection;
  signal?: AbortSignal;
};

function getTrimmedFilterValue(value: string | null | undefined): string | undefined {
  const trimmedValue = (value ?? '').trim();

  return trimmedValue ? trimmedValue : undefined;
}

function getAuthenticatedCatalogRequestHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function getFetchErrorMessage(payload: unknown, fallbackMessage: string): string {
  return typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
    ? payload.message
    : fallbackMessage;
}

function buildCodeOptionLabel(code: string, name: string) {
  return `${code} · ${name}`;
}

export function parseCourseOfferingSearchSize(
  value: string | null | undefined
): CourseOfferingSearchSize {
  const parsedValue = Number(value);

  return courseOfferingSearchSizeOptions.includes(parsedValue as CourseOfferingSearchSize)
    ? (parsedValue as CourseOfferingSearchSize)
    : defaultCourseOfferingSearchSize;
}

export function parseCourseOfferingSortBy(
  value: string | null | undefined
): CourseOfferingSearchSortBy {
  const result = CourseOfferingSearchSortBySchema.safeParse(value);

  return result.success ? result.data : defaultCourseOfferingSortBy;
}

export function parseCourseOfferingSortDirection(
  value: string | null | undefined
): CourseOfferingSortDirection {
  const result = CourseOfferingSortDirectionSchema.safeParse(value);

  return result.success ? result.data : defaultCourseOfferingSortDirection;
}

export function hasCourseOfferingSearchValues(filters: CourseOfferingSearchFilters) {
  return Object.values(filters).some((value) => getTrimmedFilterValue(value) !== undefined);
}

export function getCourseOfferingSearchFilterSummary(filters: CourseOfferingSearchFilters) {
  return [
    filters.academicYearCode,
    filters.termCode,
    filters.departmentCode,
    filters.subjectCode,
    getTrimmedFilterValue(filters.courseCode),
    getTrimmedFilterValue(filters.title),
    getTrimmedFilterValue(filters.description),
  ].filter(Boolean) as string[];
}

export function filterCatalogTermsByAcademicYear(
  terms: ReadonlyArray<CatalogTermReferenceOption>,
  academicYearCode: string | null
) {
  return terms.filter((term) => !academicYearCode || term.academicYearCode === academicYearCode);
}

export function filterCatalogSubjectsByDepartment(
  subjects: ReadonlyArray<CatalogSubjectReferenceOption>,
  departmentCode: string | null
) {
  return subjects.filter((subject) => !departmentCode || subject.departmentCode === departmentCode);
}

export function mapCatalogReferenceOptionsToSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: buildCodeOptionLabel(option.code, option.name),
  }));
}

export function mapCatalogAcademicYearOptionsToSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: option.name,
  }));
}

export function mapCatalogTermOptionsToSelectOptions(
  options: ReadonlyArray<CatalogTermReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: option.name,
  }));
}

export function mapCatalogSubjectOptionsToSelectOptions(
  options: ReadonlyArray<CatalogSubjectReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: buildCodeOptionLabel(option.code, option.name),
  }));
}

async function fetchCatalogSearchReferenceOptions(
  path: string,
  options: {
    forceRefresh?: boolean;
    cachedResponse: CatalogSearchReferenceOptionsResponse | null;
    inFlightPromise: Promise<CatalogSearchReferenceOptionsResponse> | null;
    setCachedResponse: (response: CatalogSearchReferenceOptionsResponse) => void;
    setInFlightPromise: (promise: Promise<CatalogSearchReferenceOptionsResponse> | null) => void;
  }
): Promise<CatalogSearchReferenceOptionsResponse> {
  if (!options.forceRefresh && options.cachedResponse) {
    return options.cachedResponse;
  }

  if (!options.forceRefresh && options.inFlightPromise) {
    return options.inFlightPromise;
  }

  const requestPromise = (async () => {
    const response = await fetch(path, {
      headers: getAuthenticatedCatalogRequestHeaders(),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        getFetchErrorMessage(payload, 'Failed to load catalog search reference options.')
      );
    }

    const parsedResponse = CatalogSearchReferenceOptionsResponseSchema.parse(payload);
    options.setCachedResponse(parsedResponse);
    return parsedResponse;
  })();

  options.setInFlightPromise(requestPromise);

  try {
    return await requestPromise;
  } finally {
    options.setInFlightPromise(null);
  }
}

export async function getPublicCatalogSearchReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CatalogSearchReferenceOptionsResponse> {
  return fetchCatalogSearchReferenceOptions('/api/reference/catalog-search-options', {
    forceRefresh: options?.forceRefresh,
    cachedResponse: cachedCatalogSearchReferenceOptions,
    inFlightPromise: catalogSearchReferenceOptionsPromise,
    setCachedResponse: (response) => {
      cachedCatalogSearchReferenceOptions = response;
    },
    setInFlightPromise: (promise) => {
      catalogSearchReferenceOptionsPromise = promise;
    },
  });
}

export async function getAdvancedCatalogSearchReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CatalogSearchReferenceOptionsResponse> {
  return fetchCatalogSearchReferenceOptions('/api/reference/catalog-advanced-search-options', {
    forceRefresh: options?.forceRefresh,
    cachedResponse: cachedAdvancedCatalogSearchReferenceOptions,
    inFlightPromise: advancedCatalogSearchReferenceOptionsPromise,
    setCachedResponse: (response) => {
      cachedAdvancedCatalogSearchReferenceOptions = response;
    },
    setInFlightPromise: (promise) => {
      advancedCatalogSearchReferenceOptionsPromise = promise;
    },
  });
}

export async function getCatalogSearchReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CatalogSearchReferenceOptionsResponse> {
  return getPublicCatalogSearchReferenceOptions(options);
}

export function buildCourseOfferingSearchQueryParams({
  filters,
  offeringStatusCodes,
  termStatusCodes,
  includeInactive,
  page = 0,
  size = defaultCourseOfferingSearchSize,
  sortBy = defaultCourseOfferingSortBy,
  sortDirection = defaultCourseOfferingSortDirection,
}: Omit<CourseOfferingSearchRequest, 'signal'>) {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const trimmedValue = getTrimmedFilterValue(value);

    if (trimmedValue !== undefined) {
      queryParams.set(key, trimmedValue);
    }
  });

  offeringStatusCodes?.forEach((statusCode) => {
    const trimmedValue = getTrimmedFilterValue(statusCode);

    if (trimmedValue !== undefined) {
      queryParams.append('offeringStatusCodes', trimmedValue);
    }
  });

  termStatusCodes?.forEach((statusCode) => {
    const trimmedValue = getTrimmedFilterValue(statusCode);

    if (trimmedValue !== undefined) {
      queryParams.append('termStatusCodes', trimmedValue);
    }
  });

  if (includeInactive !== undefined) {
    queryParams.set('includeInactive', String(includeInactive));
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
    offeringStatusCodes,
    termStatusCodes,
    includeInactive,
    page = 0,
    size = defaultCourseOfferingSearchSize,
    sortBy = defaultCourseOfferingSortBy,
    sortDirection = defaultCourseOfferingSortDirection,
    signal,
  }: CourseOfferingSearchRequest
): Promise<CourseOfferingSearchResponse> {
  const response = await fetch(
    `${path}?${buildCourseOfferingSearchQueryParams({
      filters,
      offeringStatusCodes,
      termStatusCodes,
      includeInactive,
      page,
      size,
      sortBy,
      sortDirection,
    }).toString()}`,
    {
      headers: getAuthenticatedCatalogRequestHeaders(),
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getFetchErrorMessage(payload, 'Failed to search course offerings.'));
  }

  return CourseOfferingSearchResponseSchema.parse(payload);
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

export async function searchCourseOfferings({
  filters,
  offeringStatusCodes,
  termStatusCodes,
  includeInactive,
  page = 0,
  size = defaultCourseOfferingSearchSize,
  sortBy = defaultCourseOfferingSortBy,
  sortDirection = defaultCourseOfferingSortDirection,
  signal,
}: CourseOfferingSearchRequest): Promise<CourseOfferingSearchResponse> {
  return searchPublicCourseOfferings({
    filters,
    offeringStatusCodes,
    termStatusCodes,
    includeInactive,
    page,
    size,
    sortBy,
    sortDirection,
    signal,
  });
}

async function fetchCourseOfferingById(
  path: string,
  courseOfferingId: number
): Promise<CourseOfferingDetailResponse> {
  const response = await fetch(`${path}/${courseOfferingId}`, {
    headers: getAuthenticatedCatalogRequestHeaders(),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getFetchErrorMessage(payload, 'Failed to fetch course offering detail.'));
  }

  return CourseOfferingDetailResponseSchema.parse(payload);
}

export async function getPublicCourseOfferingById(
  courseOfferingId: number
): Promise<CourseOfferingDetailResponse> {
  return fetchCourseOfferingById('/api/course-offerings/details', courseOfferingId);
}

export async function getAdvancedCourseOfferingById(
  courseOfferingId: number
): Promise<CourseOfferingDetailResponse> {
  return fetchCourseOfferingById('/api/course-offerings/details-advanced', courseOfferingId);
}

export async function getCourseOfferingById(
  courseOfferingId: number
): Promise<CourseOfferingDetailResponse> {
  return getPublicCourseOfferingById(courseOfferingId);
}
