import { apiRequest } from './api-client';
import {
  CourseOfferingSearchResultsListSchema,
  type CourseOfferingSearchResultsList,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from './schemas/catalog-schemas';
import {
  AcademicTermPatchRequestSchema,
  AcademicTermResponseSchema,
  AcademicTermStatusesResponseSchema,
  ShiftAcademicTermStatusRequestSchema,
  type AcademicTermPatchRequest,
  type AcademicTermResponse,
  type AcademicTermStatusesResponse,
  type AcademicTermStatusShiftDirection,
} from './schemas/academic-years-schemas';

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

export type GetAcademicTermStatusesRequest = {
  signal?: AbortSignal;
};

export type ShiftAcademicTermStatusRequest = {
  academicTermId: number;
  direction: AcademicTermStatusShiftDirection;
  signal?: AbortSignal;
};

export type PatchAcademicTermRequest = {
  academicTermId: number;
  request: AcademicTermPatchRequest;
  signal?: AbortSignal;
};

export async function getAcademicTermById({
  academicTermId,
  signal,
}: GetAcademicTermRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-term/${academicTermId}`,
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to load academic term.',
    signal,
  });
}

export async function getAcademicTermCourseOfferings({
  academicTermId,
  sortBy = 'courseCode',
  sortDirection = 'asc',
  signal,
}: GetAcademicTermCourseOfferingsRequest): Promise<CourseOfferingSearchResultsList> {
  const queryParams = new URLSearchParams({
    sortBy,
    sortDirection,
  });

  return apiRequest({
    path: `/api/academic-term/${academicTermId}/course-offerings?${queryParams.toString()}`,
    parser: CourseOfferingSearchResultsListSchema,
    fallbackMessage: 'Failed to load academic term course offerings.',
    signal,
  });
}

export async function getAcademicTermStatuses({
  signal,
}: GetAcademicTermStatusesRequest = {}): Promise<AcademicTermStatusesResponse> {
  return apiRequest({
    path: '/api/academic-term/statuses',
    parser: AcademicTermStatusesResponseSchema,
    fallbackMessage: 'Failed to load academic term statuses.',
    signal,
  });
}

export async function shiftAcademicTermStatus({
  academicTermId,
  direction,
  signal,
}: ShiftAcademicTermStatusRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-term/${academicTermId}/status/shift`,
    method: 'POST',
    body: ShiftAcademicTermStatusRequestSchema.parse({ direction }),
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to shift academic term status.',
    signal,
  });
}

export async function patchAcademicTerm({
  academicTermId,
  request,
  signal,
}: PatchAcademicTermRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-term/${academicTermId}`,
    method: 'PATCH',
    body: AcademicTermPatchRequestSchema.parse(request),
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to save academic term detail.',
    signal,
  });
}
