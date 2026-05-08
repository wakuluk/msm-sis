import { getAccessToken } from '@/auth/auth-store';
import {
  CreateCourseSectionRequestSchema,
  type CreateCourseSectionRequest,
  CourseSectionDetailResponseSchema,
  type CourseSectionDetailResponse,
  CourseSectionListResponseSchema,
  type CourseSectionListResponse,
  type CourseSectionSortBy,
  type CourseSectionSortDirection,
  PatchCourseSectionRequestSchema,
  type PatchCourseSectionRequest,
} from './schemas/course-schemas';

export type CreateCourseSectionRequestArgs = {
  courseOfferingId: number;
  request: CreateCourseSectionRequest;
  signal?: AbortSignal;
};

export type PatchCourseSectionRequestArgs = {
  sectionId: number;
  request: PatchCourseSectionRequest;
  signal?: AbortSignal;
};

export type GetCourseSectionsForOfferingRequest = {
  courseOfferingId: number;
  subTermId?: number;
  page?: number;
  size?: number;
  sortBy?: CourseSectionSortBy;
  sortDirection?: CourseSectionSortDirection;
  signal?: AbortSignal;
};

export type GetCourseSectionDetailRequest = {
  sectionId: number;
  signal?: AbortSignal;
};

export async function getCourseSectionsForOffering({
  courseOfferingId,
  subTermId,
  page = 0,
  size = 25,
  sortBy = 'sectionLetter',
  sortDirection = 'asc',
  signal,
}: GetCourseSectionsForOfferingRequest): Promise<CourseSectionListResponse> {
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

  if (subTermId !== undefined) {
    queryParams.set('subTermId', String(subTermId));
  }

  const response = await fetch(
    `/api/course-offerings/${courseOfferingId}/sections?${queryParams.toString()}`,
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
      typeof payload?.message === 'string' ? payload.message : 'Failed to load course sections.'
    );
  }

  return CourseSectionListResponseSchema.parse(payload);
}

export async function getCourseSectionDetail({
  sectionId,
  signal,
}: GetCourseSectionDetailRequest): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to load course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}

export async function createCourseSection({
  courseOfferingId,
  request,
  signal,
}: CreateCourseSectionRequestArgs): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-offerings/${courseOfferingId}/sections`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CreateCourseSectionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to create course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}

export async function patchCourseSection({
  sectionId,
  request,
  signal,
}: PatchCourseSectionRequestArgs): Promise<CourseSectionDetailResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/course-sections/${sectionId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(PatchCourseSectionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to update course section.'
    );
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}
