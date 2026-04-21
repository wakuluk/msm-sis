import { getAccessToken } from '@/auth/auth-store';
import {
  AcademicSchoolDepartmentSearchResponseSchema,
  AcademicSchoolResponseSchema,
  AcademicSchoolsResponseSchema,
  type AcademicSchoolDepartmentSearchResponse,
  type AcademicSchoolResponse,
  type AcademicSchoolsResponse,
} from './schemas/academic-school-schemas';

export type GetAcademicSchoolsRequest = {
  signal?: AbortSignal;
};

export type GetAcademicSchoolByIdRequest = {
  schoolId: number;
  signal?: AbortSignal;
};

export type SearchAcademicSchoolsRequest = {
  schoolId?: number;
  departmentId?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  signal?: AbortSignal;
};

export async function getAcademicSchools({
  signal,
}: GetAcademicSchoolsRequest = {}): Promise<AcademicSchoolsResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/academic-schools', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load academic schools.'
    );
  }

  return AcademicSchoolsResponseSchema.parse(payload);
}

export async function getAcademicSchoolById({
  schoolId,
  signal,
}: GetAcademicSchoolByIdRequest): Promise<AcademicSchoolResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/academic-schools/${schoolId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load academic school.'
    );
  }

  return AcademicSchoolResponseSchema.parse(payload);
}

export async function searchAcademicSchools({
  schoolId,
  departmentId,
  sortBy,
  sortDirection,
  signal,
}: SearchAcademicSchoolsRequest = {}): Promise<AcademicSchoolDepartmentSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const searchParams = new URLSearchParams();

  if (schoolId !== undefined) {
    searchParams.set('schoolId', String(schoolId));
  }

  if (departmentId !== undefined) {
    searchParams.set('departmentId', String(departmentId));
  }

  if (sortBy) {
    searchParams.set('sortBy', sortBy);
  }

  if (sortDirection) {
    searchParams.set('sortDirection', sortDirection);
  }

  const response = await fetch(
    `/api/academic-schools/search${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
    {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
    }
  );

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to search academic schools.'
    );
  }

  return AcademicSchoolDepartmentSearchResponseSchema.parse(payload);
}
