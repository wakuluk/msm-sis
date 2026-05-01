import { getAccessToken } from '@/auth/auth-store';
import { apiRequest } from './api-client';
import {
  CreateProgramRequestSchema,
  CreateProgramResponseSchema,
  ProgramDetailResponseSchema,
  ProgramSearchResponseSchema,
  type CreateProgramRequest,
  type CreateProgramResponse,
  type ProgramDetailResponse,
  type ProgramSearchResponse,
  type ProgramSearchSortBy,
  type ProgramSearchSortDirection,
} from './schemas/program-schemas';

export type GetProgramDetailRequest = {
  programId: number;
  signal?: AbortSignal;
};

export type SearchProgramsRequest = {
  programTypeId?: number;
  degreeTypeId?: number;
  schoolId?: number;
  departmentId?: number;
  code?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: ProgramSearchSortBy;
  sortDirection?: ProgramSearchSortDirection;
  signal?: AbortSignal;
};

export type CreateProgramServiceRequest = {
  request: CreateProgramRequest;
  signal?: AbortSignal;
};

function appendTrimmedQueryParam(queryParams: URLSearchParams, key: string, value?: string) {
  if (value && value.trim()) {
    queryParams.set(key, value.trim());
  }
}

export async function searchPrograms({
  programTypeId,
  degreeTypeId,
  schoolId,
  departmentId,
  code,
  name,
  page = 0,
  size = 25,
  sortBy = 'code',
  sortDirection = 'asc',
  signal,
}: SearchProgramsRequest): Promise<ProgramSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  if (programTypeId !== undefined) {
    queryParams.set('programTypeId', String(programTypeId));
  }

  if (degreeTypeId !== undefined) {
    queryParams.set('degreeTypeId', String(degreeTypeId));
  }

  if (schoolId !== undefined) {
    queryParams.set('schoolId', String(schoolId));
  }

  if (departmentId !== undefined) {
    queryParams.set('departmentId', String(departmentId));
  }

  appendTrimmedQueryParam(queryParams, 'code', code);
  appendTrimmedQueryParam(queryParams, 'name', name);

  const response = await fetch(`/api/programs/search?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to search programs.'
    );
  }

  return ProgramSearchResponseSchema.parse(payload);
}

export async function getProgramDetail({
  programId,
  signal,
}: GetProgramDetailRequest): Promise<ProgramDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/programs/${programId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load program detail.'
    );
  }

  return ProgramDetailResponseSchema.parse(payload);
}

export async function createProgram({
  request,
  signal,
}: CreateProgramServiceRequest): Promise<CreateProgramResponse> {
  return apiRequest({
    path: '/api/programs',
    method: 'POST',
    body: CreateProgramRequestSchema.parse(request),
    parser: CreateProgramResponseSchema,
    signal,
    fallbackMessage: 'Failed to create program.',
  });
}
