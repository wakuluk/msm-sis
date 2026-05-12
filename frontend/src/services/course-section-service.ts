import { getAccessToken } from '@/auth/auth-store';
import {
  CreateCourseSectionRequestSchema,
  type CreateCourseSectionRequest,
  CourseSectionInstructorConflictErrorResponseSchema,
  type CourseSectionInstructorConflictResponse,
  CourseSectionDetailResponseSchema,
  type CourseSectionDetailResponse,
  CourseSectionListResponseSchema,
  type CourseSectionListResponse,
  type CourseSectionSortBy,
  type CourseSectionSortDirection,
  CourseSectionStagingListResponseSchema,
  type CourseSectionStagingListResponse,
  CourseSectionStageTransitionRequestSchema,
  type CourseSectionStageTransitionRequest,
  CourseSectionStageTransitionResponseSchema,
  type CourseSectionStageTransitionResponse,
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

export type GetCourseSectionsForSubTermStagingRequest = {
  subTermId: number;
  sourceStatusCode?: string | null;
  course?: string;
  section?: string;
  instructor?: string;
  meetingPattern?: string;
  room?: string;
  status?: string | null;
  signal?: AbortSignal;
};

export type MoveCourseSectionsToNextStageRequestArgs = {
  request: CourseSectionStageTransitionRequest;
  signal?: AbortSignal;
};

export class CourseSectionInstructorConflictError extends Error {
  readonly conflicts: CourseSectionInstructorConflictResponse[];

  constructor(message: string, conflicts: CourseSectionInstructorConflictResponse[]) {
    super(message);
    this.name = 'CourseSectionInstructorConflictError';
    this.conflicts = conflicts;
  }
}

function getResponseMessage(payload: unknown, fallbackMessage: string): string {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return fallbackMessage;
}

function throwCourseSectionError(payload: unknown, fallbackMessage: string): never {
  const conflictResponse = CourseSectionInstructorConflictErrorResponseSchema.safeParse(payload);

  if (conflictResponse.success) {
    throw new CourseSectionInstructorConflictError(
      conflictResponse.data.message,
      conflictResponse.data.conflicts
    );
  }

  throw new Error(getResponseMessage(payload, fallbackMessage));
}

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

export async function getCourseSectionsForSubTermStaging({
  subTermId,
  sourceStatusCode,
  course,
  section,
  instructor,
  meetingPattern,
  room,
  status,
  signal,
}: GetCourseSectionsForSubTermStagingRequest): Promise<CourseSectionStagingListResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams();

  if (sourceStatusCode) {
    queryParams.set('sourceStatusCode', sourceStatusCode);
  }
  if (course?.trim()) {
    queryParams.set('course', course.trim());
  }
  if (section?.trim()) {
    queryParams.set('section', section.trim());
  }
  if (instructor?.trim()) {
    queryParams.set('instructor', instructor.trim());
  }
  if (meetingPattern?.trim()) {
    queryParams.set('meetingPattern', meetingPattern.trim());
  }
  if (room?.trim()) {
    queryParams.set('room', room.trim());
  }
  if (status) {
    queryParams.set('status', status);
  }

  const queryString = queryParams.toString();
  const response = await fetch(
    `/api/academic-sub-terms/${subTermId}/course-sections/staging${queryString ? `?${queryString}` : ''}`,
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
        : 'Failed to load staged course sections.'
    );
  }

  return CourseSectionStagingListResponseSchema.parse(payload);
}

export const getCourseSectionStageSections = getCourseSectionsForSubTermStaging;

export async function moveCourseSectionsToNextStage({
  request,
  signal,
}: MoveCourseSectionsToNextStageRequestArgs): Promise<CourseSectionStageTransitionResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/course-sections/stage-transitions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CourseSectionStageTransitionRequestSchema.parse(request)),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to move course sections to the next stage.'
    );
  }

  return CourseSectionStageTransitionResponseSchema.parse(payload);
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
    throwCourseSectionError(payload, 'Failed to create course section.');
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
    throwCourseSectionError(payload, 'Failed to update course section.');
  }

  return CourseSectionDetailResponseSchema.parse(payload);
}
