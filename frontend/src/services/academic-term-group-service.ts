import { apiRequest } from './api-client';
import {
  AcademicTermCreateRequestSchema,
  AcademicTermPatchRequestSchema,
  AcademicTermResponseSchema,
  type AcademicTermCreateRequest,
  type AcademicTermPatchRequest,
  type AcademicTermResponse,
} from './schemas/academic-years-schemas';

export type GetAcademicYearTermGroupsRequest = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type GetAcademicTermRequest = {
  academicTermId: number;
  signal?: AbortSignal;
};

export type PatchAcademicTermRequest = {
  academicTermId: number;
  request: AcademicTermPatchRequest;
  signal?: AbortSignal;
};

export type PostAcademicYearTermRequest = {
  academicYearId: number;
  request: AcademicTermCreateRequest;
  signal?: AbortSignal;
};

export async function getAcademicYearTermGroups({
  academicYearId,
  signal,
}: GetAcademicYearTermGroupsRequest): Promise<AcademicTermResponse[]> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/terms`,
    parser: AcademicTermResponseSchema.array(),
    fallbackMessage: 'Failed to load academic year terms.',
    signal,
  });
}

export async function getAcademicTermById({
  academicTermId,
  signal,
}: GetAcademicTermRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-terms/${academicTermId}`,
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to load term.',
    signal,
  });
}

export async function patchAcademicTerm({
  academicTermId,
  request,
  signal,
}: PatchAcademicTermRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-terms/${academicTermId}`,
    method: 'PATCH',
    body: AcademicTermPatchRequestSchema.parse(request),
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to save term detail.',
    signal,
  });
}

export async function postAcademicYearTerm({
  academicYearId,
  request,
  signal,
}: PostAcademicYearTermRequest): Promise<AcademicTermResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/terms`,
    method: 'POST',
    body: AcademicTermCreateRequestSchema.parse(request),
    parser: AcademicTermResponseSchema,
    fallbackMessage: 'Failed to create term.',
    signal,
  });
}
