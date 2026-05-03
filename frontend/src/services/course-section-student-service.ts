import { getAccessToken } from '@/auth/auth-store';
import {
  AddCourseSectionStudentRequestSchema,
  type AddCourseSectionStudentRequest,
  CourseSectionStudentListResponseSchema,
  type CourseSectionStudentListResponse,
  CourseSectionStudentEnrollmentEventListResponseSchema,
  type CourseSectionStudentEnrollmentEventListResponse,
  CourseSectionStudentResponseSchema,
  type CourseSectionStudentResponse,
  type CourseSectionStudentSortBy,
  type CourseSectionSortDirection,
  PatchCourseSectionStudentEnrollmentRequestSchema,
  type PatchCourseSectionStudentEnrollmentRequest,
} from './schemas/course-schemas';

export type GetCourseSectionStudentsRequest = {
  sectionId: number;
  page?: number;
  size?: number;
  sortBy?: CourseSectionStudentSortBy;
  sortDirection?: CourseSectionSortDirection;
  signal?: AbortSignal;
};

export type AddCourseSectionStudentRequestArgs = {
  sectionId: number;
  request: AddCourseSectionStudentRequest;
  signal?: AbortSignal;
};

export type GetCourseSectionStudentEnrollmentRequest = {
  sectionId: number;
  enrollmentId: number;
  signal?: AbortSignal;
};

export type PatchCourseSectionStudentEnrollmentRequestArgs = {
  sectionId: number;
  enrollmentId: number;
  request: PatchCourseSectionStudentEnrollmentRequest;
  signal?: AbortSignal;
};

export type GetCourseSectionStudentEnrollmentEventsRequest = {
  sectionId: number;
  enrollmentId: number;
  page?: number;
  size?: number;
  signal?: AbortSignal;
};

export async function getCourseSectionStudents({
  sectionId,
  page = 0,
  size = 25,
  sortBy = 'student',
  sortDirection = 'asc',
  signal,
}: GetCourseSectionStudentsRequest): Promise<CourseSectionStudentListResponse> {
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

  const response = await fetch(
    `/api/course-sections/${sectionId}/students?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load course section students.'
    );
  }

  return CourseSectionStudentListResponseSchema.parse(payload);
}

export async function addCourseSectionStudent({
  sectionId,
  request,
  signal,
}: AddCourseSectionStudentRequestArgs): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AddCourseSectionStudentRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to add student to section.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function getCourseSectionStudentEnrollment({
  sectionId,
  enrollmentId,
  signal,
}: GetCourseSectionStudentEnrollmentRequest): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students/${enrollmentId}`, {
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
        : 'Failed to load student enrollment.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function patchCourseSectionStudentEnrollment({
  sectionId,
  enrollmentId,
  request,
  signal,
}: PatchCourseSectionStudentEnrollmentRequestArgs): Promise<CourseSectionStudentResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}/students/${enrollmentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(PatchCourseSectionStudentEnrollmentRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to update student enrollment.'
    );
  }

  return CourseSectionStudentResponseSchema.parse(payload);
}

export async function getCourseSectionStudentEnrollmentEvents({
  sectionId,
  enrollmentId,
  page = 0,
  size = 25,
  signal,
}: GetCourseSectionStudentEnrollmentEventsRequest): Promise<CourseSectionStudentEnrollmentEventListResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await fetch(
    `/api/course-sections/${sectionId}/students/${enrollmentId}/events?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to load enrollment events.'
    );
  }

  return CourseSectionStudentEnrollmentEventListResponseSchema.parse(payload);
}
