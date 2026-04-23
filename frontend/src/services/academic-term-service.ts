import { apiRequest } from './api-client';
import {
  CourseOfferingSearchResultsListSchema,
  type CourseOfferingSearchResultsList,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from './schemas/catalog-schemas';
import {
  AcademicSubTermPatchRequestSchema,
  AcademicSubTermResponseSchema,
  AcademicSubTermStatusesResponseSchema,
  ShiftAcademicSubTermStatusRequestSchema,
  type AcademicSubTermPatchRequest,
  type AcademicSubTermResponse,
  type AcademicSubTermStatusesResponse,
  type AcademicSubTermStatusShiftDirection,
} from './schemas/academic-years-schemas';

export type GetAcademicTermRequest = {
  academicSubTermId: number;
  signal?: AbortSignal;
};

export type GetAcademicTermCourseOfferingsRequest = {
  academicSubTermId: number;
  sortBy?: CourseOfferingSearchSortBy;
  sortDirection?: CourseOfferingSortDirection;
  signal?: AbortSignal;
};

export type GetAcademicTermStatusesRequest = {
  signal?: AbortSignal;
};

export type ShiftAcademicSubTermStatusRequest = {
  academicSubTermId: number;
  direction: AcademicSubTermStatusShiftDirection;
  signal?: AbortSignal;
};

export type PatchAcademicSubTermRequest = {
  academicSubTermId: number;
  request: AcademicSubTermPatchRequest;
  signal?: AbortSignal;
};

export async function getAcademicTermById({
  academicSubTermId,
  signal,
}: GetAcademicTermRequest): Promise<AcademicSubTermResponse> {
  return apiRequest({
    path: `/api/academic-sub-term/${academicSubTermId}`,
    parser: AcademicSubTermResponseSchema,
    fallbackMessage: 'Failed to load sub term.',
    signal,
  });
}

export async function getAcademicTermCourseOfferings({
  academicSubTermId,
  sortBy = 'courseCode',
  sortDirection = 'asc',
  signal,
}: GetAcademicTermCourseOfferingsRequest): Promise<CourseOfferingSearchResultsList> {
  const queryParams = new URLSearchParams({
    sortBy,
    sortDirection,
  });

  return apiRequest({
    path: `/api/academic-sub-term/${academicSubTermId}/course-offerings?${queryParams.toString()}`,
    parser: CourseOfferingSearchResultsListSchema,
    fallbackMessage: 'Failed to load sub term course offerings.',
    signal,
  });
}

export async function getAcademicSubTermStatuses({
  signal,
}: GetAcademicTermStatusesRequest = {}): Promise<AcademicSubTermStatusesResponse> {
  return apiRequest({
    path: '/api/academic-sub-term/statuses',
    parser: AcademicSubTermStatusesResponseSchema,
    fallbackMessage: 'Failed to load sub term statuses.',
    signal,
  });
}

export async function shiftAcademicSubTermStatus({
  academicSubTermId,
  direction,
  signal,
}: ShiftAcademicSubTermStatusRequest): Promise<AcademicSubTermResponse> {
  return apiRequest({
    path: `/api/academic-sub-term/${academicSubTermId}/status/shift`,
    method: 'POST',
    body: ShiftAcademicSubTermStatusRequestSchema.parse({ direction }),
    parser: AcademicSubTermResponseSchema,
    fallbackMessage: 'Failed to shift sub term status.',
    signal,
  });
}

export async function patchAcademicTerm({
  academicSubTermId,
  request,
  signal,
}: PatchAcademicSubTermRequest): Promise<AcademicSubTermResponse> {
  return apiRequest({
    path: `/api/academic-sub-term/${academicSubTermId}`,
    method: 'PATCH',
    body: AcademicSubTermPatchRequestSchema.parse(request),
    parser: AcademicSubTermResponseSchema,
    fallbackMessage: 'Failed to save sub term detail.',
    signal,
  });
}
