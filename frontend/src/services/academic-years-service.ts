import { getAccessToken } from '@/auth/auth-store';
import {
  AcademicYearCreateRequestSchema,
  AcademicYearCreateResponseSchema,
  AcademicYearSearchResponseSchema,
  AcademicYearSortBySchema,
  AcademicYearSortDirectionSchema,
  type AcademicYearCreateFormValues,
  type AcademicYearCreateRequest,
  type AcademicYearCreateResponse,
  type AcademicYearSearchFilters,
  type AcademicYearSearchResponse,
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
  { value: 'active', label: 'Active' },
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
  active?: boolean;
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

export function parseAcademicYearSortBy(
  value: string | null | undefined
): AcademicYearSortBy {
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
    active:
      filters.active === ''
        ? undefined
        : filters.active === 'true',
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
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to search academic years.'
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
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to create academic year.'
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
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load academic year.'
    );
  }

  return AcademicYearCreateResponseSchema.parse(payload);
}
