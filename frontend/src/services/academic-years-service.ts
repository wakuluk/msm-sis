import { getAccessToken } from '@/auth/auth-store';
import {
  CourseOfferingSearchResultsListSchema,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
  type CourseOfferingSearchResultsList,
} from './schemas/catalog-schemas';
import {
  AcademicTermResponseSchema,
  AcademicTermPatchRequestSchema,
  AcademicTermStatusesResponseSchema,
  AcademicYearCreateRequestSchema,
  AcademicYearCreateResponseSchema,
  AcademicYearPatchRequestSchema,
  AcademicYearPostTermsRequestSchema,
  AcademicYearSearchResponseSchema,
  AcademicYearStatusesResponseSchema,
  ShiftAcademicTermStatusRequestSchema,
  ShiftAcademicYearStatusRequestSchema,
  AcademicYearSortBySchema,
  AcademicYearSortDirectionSchema,
  type AcademicTermResponse,
  type AcademicTermPatchRequest,
  type AcademicTermStatusesResponse,
  type AcademicTermStatusShiftDirection,
  type AcademicYearCreateFormValues,
  type AcademicYearCreateTermRequest,
  type AcademicYearCreateRequest,
  type AcademicYearCreateResponse,
  type AcademicYearPatchRequest,
  type AcademicYearSearchFilters,
  type AcademicYearSearchResponse,
  type AcademicYearStatusShiftDirection,
  type AcademicYearStatusesResponse,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from './schemas/academic-years-schemas';

export const academicYearSearchSizeOptions = [10, 25, 50, 100] as const;

export type AcademicYearSearchSize = (typeof academicYearSearchSizeOptions)[number];

export const defaultAcademicYearSearchSize: AcademicYearSearchSize = 25;
export const defaultAcademicYearSortBy: AcademicYearSortBy = 'startDate';
export const defaultAcademicYearSortDirection: AcademicYearSortDirection = 'desc';

export const academicYearSearchSizeSelectOptions: ReadonlyArray<{
  value: string;
  label: string;
}> = academicYearSearchSizeOptions.map((size) => ({
  value: String(size),
  label: String(size),
}));

export const academicYearSortByOptions: ReadonlyArray<{
  value: AcademicYearSortBy;
  label: string;
}> = [
  { value: 'startDate', label: 'Start date' },
  { value: 'endDate', label: 'End date' },
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
  { value: 'yearStatus', label: 'Year status' },
  { value: 'isPublished', label: 'Published' },
];

export const academicYearSortDirectionOptions: ReadonlyArray<{
  value: AcademicYearSortDirection;
  label: string;
}> = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

export type AcademicYearSearchCriteriaRequest = {
  query?: string;
  yearStatusCode?: string;
  currentOnly?: boolean;
};

export type AcademicYearSearchRequest = {
  filters: AcademicYearSearchFilters;
  page?: number;
  size?: number;
  sortBy?: AcademicYearSortBy;
  sortDirection?: AcademicYearSortDirection;
  signal?: AbortSignal;
};

export type GetAcademicYearRequest = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type GetAcademicTermRequest = {
  academicTermId: number;
  signal?: AbortSignal;
};

export type GetAcademicTermCourseOfferingsRequest = {
  academicTermId: number;
  sortBy?: CourseOfferingSearchSortBy;
  sortDirection?: CourseOfferingSortDirection;
  signal?: AbortSignal;
};

export type GetAcademicYearStatusesRequest = {
  signal?: AbortSignal;
};

export type GetAcademicTermStatusesRequest = {
  signal?: AbortSignal;
};

export type PatchAcademicYearRequest = {
  academicYearId: number;
  request: AcademicYearPatchRequest;
  signal?: AbortSignal;
};

export type PatchAcademicTermRequest = {
  academicTermId: number;
  request: AcademicTermPatchRequest;
  signal?: AbortSignal;
};

export type ShiftAcademicYearStatusRequest = {
  academicYearId: number;
  direction: AcademicYearStatusShiftDirection;
  signal?: AbortSignal;
};

export type ShiftAcademicTermStatusRequest = {
  academicTermId: number;
  direction: AcademicTermStatusShiftDirection;
  signal?: AbortSignal;
};

export type PostAcademicYearTermsRequest = {
  academicYearId: number;
  request: AcademicYearCreateTermRequest[];
  signal?: AbortSignal;
};

function trimToUndefined(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function trimRequiredString(value: string, fieldLabel: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return trimmedValue;
}

function trimRequiredIsoDate(value: string, fieldLabel: string): string {
  const trimmedValue = trimRequiredString(value, fieldLabel);

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!dateMatch) {
    throw new Error(`${fieldLabel} must be in YYYY-MM-DD format.`);
  }

  const [, yearPart, monthPart, dayPart] = dateMatch;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    throw new Error(`${fieldLabel} must be a valid calendar date.`);
  }

  return trimmedValue;
}

export function parseAcademicYearSortBy(value: string | null | undefined): AcademicYearSortBy {
  const result = AcademicYearSortBySchema.safeParse(value);

  return result.success ? result.data : defaultAcademicYearSortBy;
}

export function parseAcademicYearSortDirection(
  value: string | null | undefined
): AcademicYearSortDirection {
  const result = AcademicYearSortDirectionSchema.safeParse(value);

  return result.success ? result.data : defaultAcademicYearSortDirection;
}

export function parseAcademicYearSearchSize(
  value: string | null | undefined
): AcademicYearSearchSize {
  const parsedValue = Number(value);

  return academicYearSearchSizeOptions.includes(parsedValue as AcademicYearSearchSize)
    ? (parsedValue as AcademicYearSearchSize)
    : defaultAcademicYearSearchSize;
}

export function mapAcademicYearSearchFiltersToCriteria(
  filters: AcademicYearSearchFilters
): AcademicYearSearchCriteriaRequest {
  return {
    query: trimToUndefined(filters.query),
    yearStatusCode: trimToUndefined(filters.yearStatusCode),
    currentOnly: filters.currentOnly ? true : undefined,
  };
}

export function buildAcademicYearSearchQueryParams({
  filters,
  page = 0,
  size = defaultAcademicYearSearchSize,
  sortBy = defaultAcademicYearSortBy,
  sortDirection = defaultAcademicYearSortDirection,
}: Omit<AcademicYearSearchRequest, 'signal'>): URLSearchParams {
  const criteria = mapAcademicYearSearchFiltersToCriteria(filters);
  const queryParams = new URLSearchParams();

  Object.entries(criteria).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  queryParams.set('page', String(page));
  queryParams.set('size', String(size));
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortDirection', sortDirection);

  return queryParams;
}

function parseRequiredWholeNumber(value: string, fieldLabel: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldLabel} is required.`);
  }

  if (!/^\d+$/.test(trimmedValue)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return Number(trimmedValue);
}

export function buildCreateAcademicYearRequest(
  values: AcademicYearCreateFormValues
): AcademicYearCreateRequest {
  return AcademicYearCreateRequestSchema.parse({
    code: trimRequiredString(values.code, 'Academic year code'),
    name: trimRequiredString(values.name, 'Academic year name'),
    startDate: trimRequiredIsoDate(values.startDate, 'Academic year start date'),
    endDate: trimRequiredIsoDate(values.endDate, 'Academic year end date'),
    terms: values.terms.map((term, index) => ({
      code: trimRequiredString(term.code, `Term ${index + 1} code`),
      name: trimRequiredString(term.name, `Term ${index + 1} name`),
      startDate: trimRequiredIsoDate(term.startDate, `Term ${index + 1} start date`),
      endDate: trimRequiredIsoDate(term.endDate, `Term ${index + 1} end date`),
      sortOrder: parseRequiredWholeNumber(term.sortOrder, `Term ${index + 1} sort order`),
    })),
  });
}

export async function searchAcademicYears({
  filters,
  page = 0,
  size = defaultAcademicYearSearchSize,
  sortBy = defaultAcademicYearSortBy,
  sortDirection = defaultAcademicYearSortDirection,
  signal,
}: AcademicYearSearchRequest): Promise<AcademicYearSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = buildAcademicYearSearchQueryParams({
    filters,
    page,
    size,
    sortBy,
    sortDirection,
  });

  const response = await fetch(`/api/academic-year?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to search academic years.'
    );
  }

  return AcademicYearSearchResponseSchema.parse(payload);
}

export async function createAcademicYear(
  request: AcademicYearCreateRequest
): Promise<AcademicYearCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/academic-year/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to create academic year.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}

export async function getAcademicYearById({
  academicYearId,
  signal,
}: GetAcademicYearRequest): Promise<AcademicYearCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-year/${academicYearId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load academic year.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}

export async function getAcademicYearStatuses({
  signal,
}: GetAcademicYearStatusesRequest = {}): Promise<AcademicYearStatusesResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/academic-year/statuses', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load academic year statuses.'
    );
  }

  return AcademicYearStatusesResponseSchema.parse(payload);
}

export async function getAcademicTermById({
  academicTermId,
  signal,
}: GetAcademicTermRequest): Promise<AcademicTermResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-term/${academicTermId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load academic term.'
    );
  }

  return AcademicTermResponseSchema.parse(payload);
}

export async function getAcademicTermCourseOfferings({
  academicTermId,
  sortBy = 'courseCode',
  sortDirection = 'asc',
  signal,
}: GetAcademicTermCourseOfferingsRequest): Promise<CourseOfferingSearchResultsList> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    sortBy,
    sortDirection,
  });

  const response = await fetch(
    `/api/academic-term/${academicTermId}/course-offerings?${queryParams.toString()}`,
    {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
    }
  );

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load academic term course offerings.'
    );
  }

  return CourseOfferingSearchResultsListSchema.parse(payload);
}

export async function getAcademicTermStatuses({
  signal,
}: GetAcademicTermStatusesRequest = {}): Promise<AcademicTermStatusesResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/academic-term/statuses', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load academic term statuses.'
    );
  }

  return AcademicTermStatusesResponseSchema.parse(payload);
}

export async function shiftAcademicTermStatus({
  academicTermId,
  direction,
  signal,
}: ShiftAcademicTermStatusRequest): Promise<AcademicTermResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-term/${academicTermId}/status/shift`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ShiftAcademicTermStatusRequestSchema.parse({ direction })),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to shift academic term status.'
    );
  }

  return AcademicTermResponseSchema.parse(payload);
}

export async function patchAcademicTerm({
  academicTermId,
  request,
  signal,
}: PatchAcademicTermRequest): Promise<AcademicTermResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-term/${academicTermId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AcademicTermPatchRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to save academic term detail.'
    );
  }

  return AcademicTermResponseSchema.parse(payload);
}

export async function patchAcademicYear({
  academicYearId,
  request,
  signal,
}: PatchAcademicYearRequest): Promise<AcademicYearCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-year/${academicYearId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AcademicYearPatchRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to save academic year detail.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}

export async function shiftAcademicYearStatus({
  academicYearId,
  direction,
  signal,
}: ShiftAcademicYearStatusRequest): Promise<AcademicYearCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-year/${academicYearId}/status/shift`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ShiftAcademicYearStatusRequestSchema.parse({ direction })),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to shift academic year status.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}

export async function postAcademicYearTerms({
  academicYearId,
  request,
  signal,
}: PostAcademicYearTermsRequest): Promise<AcademicYearCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-year/${academicYearId}/terms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AcademicYearPostTermsRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to add academic year terms.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}
