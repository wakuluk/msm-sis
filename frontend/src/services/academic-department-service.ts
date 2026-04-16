import { getAccessToken } from '@/auth/auth-store';
import {
  AcademicDepartmentPatchRequestSchema,
  AcademicDepartmentResponseSchema,
  AcademicDepartmentsResponseSchema,
  type AcademicDepartmentPatchRequest,
  type AcademicDepartmentSortBy,
  type AcademicDepartmentSortDirection,
  type AcademicDepartmentResponse,
  type AcademicDepartmentsResponse,
} from './schemas/academic-department-schemas';

export type SearchAcademicDepartmentsRequest = {
  sortBy?: AcademicDepartmentSortBy;
  sortDirection?: AcademicDepartmentSortDirection;
  signal?: AbortSignal;
};

export type GetAcademicDepartmentRequest = {
  departmentId: number;
  sortBy?: AcademicDepartmentSortBy;
  sortDirection?: AcademicDepartmentSortDirection;
  signal?: AbortSignal;
};

export type PatchAcademicDepartmentRequest = {
  departmentId: number;
  request: AcademicDepartmentPatchRequest;
  signal?: AbortSignal;
};

export async function searchAcademicDepartments({
  sortBy = 'name',
  sortDirection = 'asc',
  signal,
}: SearchAcademicDepartmentsRequest = {}): Promise<AcademicDepartmentsResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    sortBy,
    sortDirection,
  });

  const response = await fetch(`/api/academic-departments?${queryParams.toString()}`, {
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
        : 'Failed to load academic departments.'
    );
  }

  return AcademicDepartmentsResponseSchema.parse(payload);
}

export async function getAcademicDepartmentById({
  departmentId,
  sortBy = 'code',
  sortDirection = 'asc',
  signal,
}: GetAcademicDepartmentRequest): Promise<AcademicDepartmentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    sortBy,
    sortDirection,
  });

  const response = await fetch(`/api/academic-departments/${departmentId}?${queryParams.toString()}`, {
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
        : 'Failed to load academic department.'
    );
  }

  return AcademicDepartmentResponseSchema.parse(payload);
}

export async function patchAcademicDepartment({
  departmentId,
  request,
  signal,
}: PatchAcademicDepartmentRequest): Promise<AcademicDepartmentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-departments/${departmentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AcademicDepartmentPatchRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to save academic department detail.'
    );
  }

  return AcademicDepartmentResponseSchema.parse(payload);
}
