import { getAccessToken } from '@/auth/auth-store';
import { apiRequest } from './api-client';
import {
  AddStudentCourseRegistrationSelectionRequestSchema,
  StudentCourseRegistrationGroupChoicesResponseSchema,
  StudentCourseRegistrationScheduleConflictErrorResponseSchema,
  StudentCourseRegistrationResponseSchema,
  StudentCourseRegistrationSubmitResponseSchema,
  StudentCourseSectionDetailResponseSchema,
  StudentCourseSectionSearchResponseSchema,
  SubmitStudentCourseRegistrationRequestSchema,
  type AddStudentCourseRegistrationSelectionRequest,
  type StudentCourseSectionDetailResponse,
  type StudentCourseRegistrationGroupChoicesResponse,
  type StudentCourseRegistrationResponse,
  type StudentCourseRegistrationScheduleConflictResponse,
  type StudentCourseRegistrationSubmitResponse,
  type StudentCourseSectionSearchResponse,
  type SubmitStudentCourseRegistrationRequest,
} from './schemas/student-course-registration-schemas';

export type CourseRegistrationSectionSortBy =
  | 'courseCode'
  | 'courseTitle'
  | 'credits'
  | 'instructor'
  | 'section'
  | 'time';

export type CourseRegistrationSortDirection = 'asc' | 'desc';
export type CourseRegistrationHonorsFilter = 'ALL' | 'HONORS_ONLY' | 'NON_HONORS_ONLY';

export type GetMyCourseRegistrationRequest = {
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type SearchCourseSectionsRequest = {
  registrationGroupId?: number | null;
  termId?: number | null;
  subTermIds?: number[] | null;
  courseCode?: string | null;
  section?: string | null;
  instructor?: string | null;
  honorsFilter?: CourseRegistrationHonorsFilter | null;
  dayOfWeeks?: number[] | null;
  startHour?: number | null;
  time?: string | null;
  page?: number;
  size?: number;
  sortBy?: CourseRegistrationSectionSortBy;
  sortDirection?: CourseRegistrationSortDirection;
  signal?: AbortSignal;
};

export type GetCourseSectionRegistrationDetailRequest = {
  sectionId: number;
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type AddSelectionRequest = {
  request: AddStudentCourseRegistrationSelectionRequest;
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type RemoveSelectionRequest = {
  selectionId: number;
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type RemoveEnrollmentRequest = {
  enrollmentId: number;
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type SubmitRegistrationRequest = {
  request?: SubmitStudentCourseRegistrationRequest;
  registrationGroupId?: number | null;
  termId?: number | null;
  signal?: AbortSignal;
};

export type AcceptWaitlistOfferRequest = {
  enrollmentId?: number | null;
  waitlistOfferId?: number | null;
  signal?: AbortSignal;
};

export class StudentCourseRegistrationScheduleConflictError extends Error {
  readonly conflicts: StudentCourseRegistrationScheduleConflictResponse[];

  constructor(message: string, conflicts: StudentCourseRegistrationScheduleConflictResponse[]) {
    super(message);
    this.name = 'StudentCourseRegistrationScheduleConflictError';
    this.conflicts = conflicts;
  }
}

function appendStringQueryParam(queryParams: URLSearchParams, key: string, value?: string | null) {
  if (value?.trim()) {
    queryParams.set(key, value.trim());
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

function throwCourseRegistrationError(payload: unknown, fallbackMessage: string): never {
  const conflictResponse =
    StudentCourseRegistrationScheduleConflictErrorResponseSchema.safeParse(payload);

  if (conflictResponse.success) {
    throw new StudentCourseRegistrationScheduleConflictError(
      conflictResponse.data.message,
      conflictResponse.data.conflicts
    );
  }

  throw new Error(getResponseMessage(payload, fallbackMessage));
}

function buildCourseSectionSearchParams({
  registrationGroupId,
  termId,
  subTermIds,
  courseCode,
  section,
  instructor,
  honorsFilter,
  dayOfWeeks,
  startHour,
  time,
  page = 0,
  size = 10,
  sortBy = 'courseCode',
  sortDirection = 'asc',
}: SearchCourseSectionsRequest) {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  if (registrationGroupId !== null && registrationGroupId !== undefined) {
    queryParams.set('registrationGroupId', String(registrationGroupId));
  }

  if (termId !== null && termId !== undefined) {
    queryParams.set('termId', String(termId));
  }

  subTermIds
    ?.filter((subTermId) => Number.isFinite(subTermId) && subTermId > 0)
    .forEach((subTermId) => queryParams.append('subTermIds', String(subTermId)));
  dayOfWeeks
    ?.filter((dayOfWeek) => Number.isFinite(dayOfWeek) && dayOfWeek >= 1 && dayOfWeek <= 7)
    .forEach((dayOfWeek) => queryParams.append('dayOfWeeks', String(dayOfWeek)));

  if (startHour !== null && startHour !== undefined && Number.isFinite(startHour)) {
    queryParams.set('startHour', String(startHour));
  }

  appendStringQueryParam(queryParams, 'courseCode', courseCode);
  appendStringQueryParam(queryParams, 'section', section);
  appendStringQueryParam(queryParams, 'instructor', instructor);
  appendStringQueryParam(queryParams, 'honorsFilter', honorsFilter);
  appendStringQueryParam(queryParams, 'time', time);

  return queryParams;
}

function buildRegistrationContextParams({
  registrationGroupId,
  termId,
}: {
  registrationGroupId?: number | null;
  termId?: number | null;
}) {
  const queryParams = new URLSearchParams();

  if (registrationGroupId !== null && registrationGroupId !== undefined) {
    queryParams.set('registrationGroupId', String(registrationGroupId));
    return queryParams;
  }

  if (termId !== null && termId !== undefined) {
    queryParams.set('termId', String(termId));
  }

  return queryParams;
}

function withQueryParams(path: string, queryParams: URLSearchParams) {
  const queryString = queryParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function getMyCourseRegistration({
  registrationGroupId,
  termId,
  signal,
}: GetMyCourseRegistrationRequest = {}): Promise<StudentCourseRegistrationResponse> {
  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });

  return apiRequest({
    path: withQueryParams('/api/me/course-registration', queryParams),
    parser: StudentCourseRegistrationResponseSchema,
    fallbackMessage: 'Failed to load course registration.',
    signal,
  });
}

export async function getMyCourseRegistrationGroups({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<StudentCourseRegistrationGroupChoicesResponse> {
  return apiRequest({
    path: '/api/me/course-registration/groups',
    parser: StudentCourseRegistrationGroupChoicesResponseSchema,
    fallbackMessage: 'Failed to load registration groups.',
    signal,
  });
}

export async function searchCourseSections(
  request: SearchCourseSectionsRequest = {}
): Promise<StudentCourseSectionSearchResponse> {
  const queryParams = buildCourseSectionSearchParams(request);

  return apiRequest({
    path: `/api/me/course-registration/course-sections?${queryParams.toString()}`,
    parser: StudentCourseSectionSearchResponseSchema,
    fallbackMessage: 'Failed to search course sections.',
    signal: request.signal,
  });
}

export async function getCourseSectionRegistrationDetail({
  sectionId,
  registrationGroupId,
  termId,
  signal,
}: GetCourseSectionRegistrationDetailRequest): Promise<StudentCourseSectionDetailResponse> {
  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });

  return apiRequest({
    path: withQueryParams(`/api/me/course-registration/course-sections/${sectionId}`, queryParams),
    parser: StudentCourseSectionDetailResponseSchema,
    fallbackMessage: 'Failed to load course section registration details.',
    signal,
  });
}

export async function addSelection({
  request,
  registrationGroupId,
  termId,
  signal,
}: AddSelectionRequest): Promise<StudentCourseRegistrationResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });
  const response = await fetch(
    withQueryParams('/api/me/course-registration/selections', queryParams),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AddStudentCourseRegistrationSelectionRequestSchema.parse(request)),
      signal,
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throwCourseRegistrationError(payload, 'Failed to add course selection.');
  }

  return StudentCourseRegistrationResponseSchema.parse(payload);
}

export async function removeSelection({
  selectionId,
  registrationGroupId,
  termId,
  signal,
}: RemoveSelectionRequest): Promise<StudentCourseRegistrationResponse> {
  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });

  return apiRequest({
    path: withQueryParams(`/api/me/course-registration/selections/${selectionId}`, queryParams),
    method: 'DELETE',
    parser: StudentCourseRegistrationResponseSchema,
    fallbackMessage: 'Failed to remove course selection.',
    signal,
  });
}

export async function removeEnrollment({
  enrollmentId,
  registrationGroupId,
  termId,
  signal,
}: RemoveEnrollmentRequest): Promise<StudentCourseRegistrationResponse> {
  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });

  return apiRequest({
    path: withQueryParams(`/api/me/course-registration/enrollments/${enrollmentId}`, queryParams),
    method: 'DELETE',
    parser: StudentCourseRegistrationResponseSchema,
    fallbackMessage: 'Failed to remove course enrollment.',
    signal,
  });
}

export async function submitRegistration({
  request,
  registrationGroupId,
  termId,
  signal,
}: SubmitRegistrationRequest = {}): Promise<StudentCourseRegistrationSubmitResponse> {
  const queryParams = buildRegistrationContextParams({ registrationGroupId, termId });

  return apiRequest({
    path: withQueryParams('/api/me/course-registration/register', queryParams),
    method: 'POST',
    body:
      request === undefined
        ? undefined
        : SubmitStudentCourseRegistrationRequestSchema.parse(request),
    parser: StudentCourseRegistrationSubmitResponseSchema,
    fallbackMessage: 'Failed to submit course registration.',
    signal,
  });
}

export async function acceptWaitlistOffer({
  enrollmentId,
  waitlistOfferId,
  signal,
}: AcceptWaitlistOfferRequest): Promise<StudentCourseRegistrationResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const path =
    waitlistOfferId !== null && waitlistOfferId !== undefined
      ? `/api/me/course-registration/waitlist-offers/${waitlistOfferId}/accept`
      : enrollmentId !== null && enrollmentId !== undefined
        ? `/api/me/course-registration/waitlist-offers/by-enrollment/${enrollmentId}/accept`
        : null;

  if (path === null) {
    throw new Error('Active waitlist offer was not found.');
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throwCourseRegistrationError(payload, 'Failed to enroll from waitlist.');
  }

  return StudentCourseRegistrationResponseSchema.parse(payload);
}
