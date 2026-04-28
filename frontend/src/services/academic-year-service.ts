import { apiRequest } from './api-client';
import {
  defaultAcademicYearSearchSize,
  defaultAcademicYearSortBy,
  defaultAcademicYearSortDirection,
  type AcademicYearSearchSize,
} from './academic-year-search-config';
import {
  buildCreateAcademicYearSubmissionPlan,
  getAcademicYearResponseSubTerms,
} from './mappers/academic-year-mappers';
import {
  AcademicYearCreateRequestSchema,
  AcademicYearCreateResponseSchema,
  AcademicYearCoursesSummaryResponseSchema,
  AcademicYearPatchRequestSchema,
  AcademicYearPostSubTermsRequestSchema,
  AcademicYearSearchResponseSchema,
  AcademicYearStatusesResponseSchema,
  ShiftAcademicYearStatusRequestSchema,
  type AcademicYearCreateFormValues,
  type AcademicYearCreateRequest,
  type AcademicYearCreateResponse,
  type AcademicYearCreateSubTermRequest,
  type AcademicYearCoursesSummaryResponse,
  type AcademicYearPatchRequest,
  type AcademicYearSearchFilters,
  type AcademicYearSearchResponse,
  type AcademicYearStatusesResponse,
  type AcademicYearStatusShiftDirection,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from './schemas/academic-years-schemas';
import { postAcademicYearTerm } from './academic-term-group-service';

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

export type GetAcademicYearCoursesSummaryRequest = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type GetAcademicYearStatusesRequest = {
  signal?: AbortSignal;
};

export type PatchAcademicYearRequest = {
  academicYearId: number;
  request: AcademicYearPatchRequest;
  signal?: AbortSignal;
};

export type ShiftAcademicYearStatusRequest = {
  academicYearId: number;
  direction: AcademicYearStatusShiftDirection;
  signal?: AbortSignal;
};

export type PostAcademicYearTermsRequest = {
  academicYearId: number;
  request: AcademicYearCreateSubTermRequest[];
  signal?: AbortSignal;
};

export class AcademicYearCreateWithTermsError extends Error {
  academicYear: AcademicYearCreateResponse;

  constructor(message: string, academicYear: AcademicYearCreateResponse) {
    super(message);
    Object.setPrototypeOf(this, AcademicYearCreateWithTermsError.prototype);
    this.name = 'AcademicYearCreateWithTermsError';
    this.academicYear = academicYear;
  }
}

function trimToUndefined(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
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

export async function searchAcademicYears({
  filters,
  page = 0,
  size = defaultAcademicYearSearchSize,
  sortBy = defaultAcademicYearSortBy,
  sortDirection = defaultAcademicYearSortDirection,
  signal,
}: AcademicYearSearchRequest): Promise<AcademicYearSearchResponse> {
  const queryParams = buildAcademicYearSearchQueryParams({
    filters,
    page,
    size,
    sortBy,
    sortDirection,
  });

  return apiRequest({
    path: `/api/academic-year?${queryParams.toString()}`,
    parser: AcademicYearSearchResponseSchema,
    fallbackMessage: 'Failed to search academic years.',
    signal,
  });
}

export async function createAcademicYear(
  request: AcademicYearCreateRequest
): Promise<AcademicYearCreateResponse> {
  return apiRequest({
    path: '/api/academic-year/create',
    method: 'POST',
    body: AcademicYearCreateRequestSchema.parse(request),
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to create academic year.',
  });
}

export async function createAcademicYearWithTerms(
  values: AcademicYearCreateFormValues
): Promise<AcademicYearCreateResponse> {
  const submissionPlan = buildCreateAcademicYearSubmissionPlan(values);
  const createdAcademicYear = await createAcademicYear(submissionPlan.academicYearRequest);

  if (submissionPlan.terms.length === 0) {
    return createdAcademicYear;
  }

  const createdSubTerms = getAcademicYearResponseSubTerms(createdAcademicYear);
  const createdSubTermIdByCode = new Map(
    createdSubTerms.map((subTerm) => [subTerm.code.trim(), subTerm.subTermId] as const)
  );

  if (createdSubTermIdByCode.size === 0) {
    throw new Error(
      'Academic year was created, but the response did not include sub terms needed to create terms.'
    );
  }

  try {
    for (const term of submissionPlan.terms) {
      const subTermIds = term.subTermCodes.map((subTermCode) => {
        const matchedSubTermId = createdSubTermIdByCode.get(subTermCode);

        if (matchedSubTermId === undefined) {
          throw new Error(
            `Created sub term "${subTermCode}" could not be matched while creating term "${term.code}".`
          );
        }

        return matchedSubTermId;
      });

      await postAcademicYearTerm({
        academicYearId: createdAcademicYear.academicYearId,
        request: {
          code: term.code,
          name: term.name,
          startDate: term.startDate,
          endDate: term.endDate,
          subTermIds,
        },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'One or more terms could not be created.';

    throw new AcademicYearCreateWithTermsError(
      `Academic year was created, but term setup did not finish. ${message}`,
      createdAcademicYear
    );
  }

  return createdAcademicYear;
}

export async function getAcademicYearById({
  academicYearId,
  signal,
}: GetAcademicYearRequest): Promise<AcademicYearCreateResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}`,
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to load academic year.',
    signal,
  });
}

export async function getAcademicYearCoursesSummary({
  academicYearId,
  signal,
}: GetAcademicYearCoursesSummaryRequest): Promise<AcademicYearCoursesSummaryResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/courses/summary`,
    parser: AcademicYearCoursesSummaryResponseSchema,
    fallbackMessage: 'Failed to load academic year courses summary.',
    signal,
  });
}

export async function getAcademicYearStatuses({
  signal,
}: GetAcademicYearStatusesRequest = {}): Promise<AcademicYearStatusesResponse> {
  return apiRequest({
    path: '/api/academic-year/statuses',
    parser: AcademicYearStatusesResponseSchema,
    fallbackMessage: 'Failed to load academic year statuses.',
    signal,
  });
}

export async function patchAcademicYear({
  academicYearId,
  request,
  signal,
}: PatchAcademicYearRequest): Promise<AcademicYearCreateResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}`,
    method: 'PATCH',
    body: AcademicYearPatchRequestSchema.parse(request),
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to save academic year detail.',
    signal,
  });
}

export async function shiftAcademicYearStatus({
  academicYearId,
  direction,
  signal,
}: ShiftAcademicYearStatusRequest): Promise<AcademicYearCreateResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/status/shift`,
    method: 'POST',
    body: ShiftAcademicYearStatusRequestSchema.parse({ direction }),
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to shift academic year status.',
    signal,
  });
}

export async function postAcademicYearTerms({
  academicYearId,
  request,
  signal,
}: PostAcademicYearTermsRequest): Promise<AcademicYearCreateResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/sub-terms`,
    method: 'POST',
    body: AcademicYearPostSubTermsRequestSchema.parse(request),
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to add academic year sub terms.',
    signal,
  });
}
