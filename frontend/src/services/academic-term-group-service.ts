import { apiRequest } from './api-client';
import {
  AcademicTermGroupCreateRequestSchema,
  AcademicTermGroupPatchRequestSchema,
  AcademicTermGroupResponseSchema,
  type AcademicTermGroupCreateRequest,
  type AcademicTermGroupPatchRequest,
  type AcademicTermGroupResponse,
} from './schemas/academic-years-schemas';

export type GetAcademicYearTermGroupsRequest = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type GetAcademicTermGroupRequest = {
  academicTermGroupId: number;
  signal?: AbortSignal;
};

export type PatchAcademicTermGroupRequest = {
  academicTermGroupId: number;
  request: AcademicTermGroupPatchRequest;
  signal?: AbortSignal;
};

export type PostAcademicYearTermGroupRequest = {
  academicYearId: number;
  request: AcademicTermGroupCreateRequest;
  signal?: AbortSignal;
};

export async function getAcademicYearTermGroups({
  academicYearId,
  signal,
}: GetAcademicYearTermGroupsRequest): Promise<AcademicTermGroupResponse[]> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/term-groups`,
    parser: AcademicTermGroupResponseSchema.array(),
    fallbackMessage: 'Failed to load academic year terms.',
    signal,
  });
}

export async function getAcademicTermGroupById({
  academicTermGroupId,
  signal,
}: GetAcademicTermGroupRequest): Promise<AcademicTermGroupResponse> {
  return apiRequest({
    path: `/api/academic-term-group/${academicTermGroupId}`,
    parser: AcademicTermGroupResponseSchema,
    fallbackMessage: 'Failed to load term.',
    signal,
  });
}

export async function patchAcademicTermGroup({
  academicTermGroupId,
  request,
  signal,
}: PatchAcademicTermGroupRequest): Promise<AcademicTermGroupResponse> {
  return apiRequest({
    path: `/api/academic-term-group/${academicTermGroupId}`,
    method: 'PATCH',
    body: AcademicTermGroupPatchRequestSchema.parse(request),
    parser: AcademicTermGroupResponseSchema,
    fallbackMessage: 'Failed to save term detail.',
    signal,
  });
}

export async function postAcademicYearTermGroup({
  academicYearId,
  request,
  signal,
}: PostAcademicYearTermGroupRequest): Promise<AcademicTermGroupResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/term-groups`,
    method: 'POST',
    body: AcademicTermGroupCreateRequestSchema.parse(request),
    parser: AcademicTermGroupResponseSchema,
    fallbackMessage: 'Failed to create term.',
    signal,
  });
}
