import { getAccessToken } from '@/auth/auth-store';
import {
  StudentCreateResponseSchema,
  StudentDetailResponseSchema,
  StudentSearchResponseSchema,
  StudentSortBySchema,
  StudentSortDirectionSchema,
  type StudentCreateRequest,
  type StudentCreateResponse,
  type StudentDetailResponse,
  type StudentPatchRequest,
  type StudentSearchFilters,
  type StudentSearchResponse,
  type StudentSortBy,
  type StudentSortDirection,
} from './schemas/student-schemas';

export const studentSearchSizeOptions = [1, 10, 25, 50, 100] as const;

export type StudentSearchSize = (typeof studentSearchSizeOptions)[number];

export const defaultStudentSortBy: StudentSortBy = 'lastName';
export const defaultStudentSortDirection: StudentSortDirection = 'asc';
export const defaultStudentSearchSize: StudentSearchSize = 25;

export const studentSortByOptions: ReadonlyArray<{ value: StudentSortBy; label: string }> = [
  { value: 'city', label: 'City' },
  { value: 'lastName', label: 'Last name' },
  { value: 'firstName', label: 'First name' },
  { value: 'studentId', label: 'Student ID' },
  { value: 'classOf', label: 'Class of' },
  { value: 'stateRegion', label: 'State / region' },
  { value: 'updatedBy', label: 'Updated by' },
  { value: 'lastUpdated', label: 'Last updated' },
];

export const studentSortDirectionOptions: ReadonlyArray<{
  value: StudentSortDirection;
  label: string;
}> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export const studentSearchSizeSelectOptions: ReadonlyArray<{
  value: string;
  label: string;
}> = studentSearchSizeOptions.map((size) => ({
  value: String(size),
  label: String(size),
}));

export type StudentSearchCriteriaRequest = {
  studentId?: number;
  firstName?: string;
  lastName?: string;
  updatedBy?: string;
  classOf?: number;
  genderId?: number;
  ethnicityId?: number;
  classStandingId?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode?: string;
};

export type StudentSearchRequest = {
  filters: StudentSearchFilters;
  page?: number;
  size?: number;
  sortBy?: StudentSortBy;
  sortDirection?: StudentSortDirection;
  signal?: AbortSignal;
};

function getTrimmedFilterValue(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function parseOptionalWholeNumber(value: string, fieldLabel: string): number | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (!/^\d+$/.test(trimmedValue)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return Number(trimmedValue);
}

export function parseStudentSortBy(value: string | null | undefined): StudentSortBy {
  const result = StudentSortBySchema.safeParse(value);

  return result.success ? result.data : defaultStudentSortBy;
}

export function parseStudentSortDirection(value: string | null | undefined): StudentSortDirection {
  const result = StudentSortDirectionSchema.safeParse(value);

  return result.success ? result.data : defaultStudentSortDirection;
}

export function parseStudentSearchSize(value: string | null | undefined): StudentSearchSize {
  const parsedValue = Number(value);

  return studentSearchSizeOptions.includes(parsedValue as StudentSearchSize)
    ? (parsedValue as StudentSearchSize)
    : defaultStudentSearchSize;
}

export function mapStudentSearchFiltersToCriteria(
  filters: StudentSearchFilters
): StudentSearchCriteriaRequest {
  return {
    studentId: parseOptionalWholeNumber(filters.studentId, 'Student ID'),
    firstName: getTrimmedFilterValue(filters.firstName),
    lastName: getTrimmedFilterValue(filters.lastName),
    updatedBy: getTrimmedFilterValue(filters.updatedBy),
    classOf: parseOptionalWholeNumber(filters.classOf, 'Class of'),
    genderId: parseOptionalWholeNumber(filters.genderId, 'Gender'),
    ethnicityId: parseOptionalWholeNumber(filters.ethnicityId, 'Ethnicity'),
    classStandingId: parseOptionalWholeNumber(filters.classStandingId, 'Class standing'),
    addressLine1: getTrimmedFilterValue(filters.addressLine1),
    addressLine2: getTrimmedFilterValue(filters.addressLine2),
    city: getTrimmedFilterValue(filters.city),
    stateRegion: getTrimmedFilterValue(filters.stateRegion),
    postalCode: getTrimmedFilterValue(filters.postalCode),
    countryCode: getTrimmedFilterValue(filters.countryCode),
  };
}

export function buildStudentSearchQueryParams({
  filters,
  page = 0,
  size = defaultStudentSearchSize,
  sortBy = defaultStudentSortBy,
  sortDirection = defaultStudentSortDirection,
}: Omit<StudentSearchRequest, 'signal'>): URLSearchParams {
  const criteria = mapStudentSearchFiltersToCriteria(filters);
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

export async function searchStudents({
  filters,
  page = 0,
  size = defaultStudentSearchSize,
  sortBy = defaultStudentSortBy,
  sortDirection = defaultStudentSortDirection,
  signal,
}: StudentSearchRequest): Promise<StudentSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = buildStudentSearchQueryParams({
    filters,
    page,
    size,
    sortBy,
    sortDirection,
  });

  const response = await fetch(`/api/students?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to search students.'
    );
  }

  return StudentSearchResponseSchema.parse(payload);
}

export async function getStudentById(studentId: number): Promise<StudentDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/students/${studentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to fetch student detail.'
    );
  }

  return StudentDetailResponseSchema.parse(payload);
}

export async function createStudent(request: StudentCreateRequest): Promise<StudentCreateResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/students/create', {
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
      typeof payload?.message === 'string' ? payload.message : 'Failed to create student.'
    );
  }

  return StudentCreateResponseSchema.parse(payload);
}

export async function patchStudent(
  studentId: number,
  request: StudentPatchRequest
): Promise<StudentDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/students/${studentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to save student detail.'
    );
  }

  return StudentDetailResponseSchema.parse(payload);
}
