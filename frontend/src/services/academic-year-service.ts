import { apiRequest } from './api-client';
import {
  defaultAcademicYearSearchSize,
  defaultAcademicYearSortBy,
  defaultAcademicYearSortDirection,
  type AcademicYearSearchSize,
} from './academic-year-search-config';
import {
  buildCreateAcademicYearSubmissionPlan,
  getAcademicYearResponseTerms,
} from './mappers/academic-year-mappers';
import {
  AcademicYearCreateRequestSchema,
  AcademicYearCreateResponseSchema,
  AcademicYearCatalogSummaryResponseSchema,
  AcademicYearPatchRequestSchema,
  AcademicYearPostTermsRequestSchema,
  AcademicYearSearchResponseSchema,
  AcademicYearStatusesResponseSchema,
  ShiftAcademicYearStatusRequestSchema,
  type AcademicYearCreateFormValues,
  type AcademicYearCreateRequest,
  type AcademicYearCreateResponse,
  type AcademicYearCreateTermRequest,
  type AcademicYearCatalogSummaryResponse,
  type AcademicYearPatchRequest,
  type AcademicYearSearchFilters,
  type AcademicYearSearchResponse,
  type AcademicYearStatusesResponse,
  type AcademicYearStatusShiftDirection,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from './schemas/academic-years-schemas';
import { postAcademicYearTermGroup } from './academic-term-group-service';

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

export type GetAcademicYearCatalogSummaryRequest = {
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
  request: AcademicYearCreateTermRequest[];
  signal?: AbortSignal;
};

export class AcademicYearCreateWithTermGroupsError extends Error {
  academicYear: AcademicYearCreateResponse;

  constructor(message: string, academicYear: AcademicYearCreateResponse) {
    super(message);
    Object.setPrototypeOf(this, AcademicYearCreateWithTermGroupsError.prototype);
    this.name = 'AcademicYearCreateWithTermGroupsError';
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

export async function createAcademicYearWithTermGroups(
  values: AcademicYearCreateFormValues
): Promise<AcademicYearCreateResponse> {
  const submissionPlan = buildCreateAcademicYearSubmissionPlan(values);
  const createdAcademicYear = await createAcademicYear(submissionPlan.academicYearRequest);

  if (submissionPlan.termGroups.length === 0) {
    return createdAcademicYear;
  }

  const createdTerms = getAcademicYearResponseTerms(createdAcademicYear);
  const createdTermIdByCode = new Map(
    createdTerms.map((term) => [term.code.trim(), term.termId] as const)
  );

  if (createdTermIdByCode.size === 0) {
    throw new Error(
      'Academic year was created, but the response did not include academic terms needed to create term groups.'
    );
  }

  try {
    for (const termGroup of submissionPlan.termGroups) {
      const termIds = termGroup.termCodes.map((termCode) => {
        const matchedTermId = createdTermIdByCode.get(termCode);

        if (matchedTermId === undefined) {
          throw new Error(
            `Created academic term "${termCode}" could not be matched while creating term group "${termGroup.code}".`
          );
        }

        return matchedTermId;
      });

      await postAcademicYearTermGroup({
        academicYearId: createdAcademicYear.academicYearId,
        request: {
          code: termGroup.code,
          name: termGroup.name,
          startDate: termGroup.startDate,
          endDate: termGroup.endDate,
          termIds,
        },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'One or more academic term groups could not be created.';

    throw new AcademicYearCreateWithTermGroupsError(
      `Academic year was created, but term group setup did not finish. ${message}`,
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

export async function getAcademicYearCatalogSummary({
  academicYearId,
  signal,
}: GetAcademicYearCatalogSummaryRequest): Promise<AcademicYearCatalogSummaryResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/catalog/summary`,
    parser: AcademicYearCatalogSummaryResponseSchema,
    fallbackMessage: 'Failed to load academic year catalog summary.',
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
    path: `/api/academic-year/${academicYearId}/terms`,
    method: 'POST',
    body: AcademicYearPostTermsRequestSchema.parse(request),
    parser: AcademicYearCreateResponseSchema,
    fallbackMessage: 'Failed to add academic year terms.',
    signal,
  });
}
