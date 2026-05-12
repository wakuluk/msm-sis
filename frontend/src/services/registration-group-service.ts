import { apiRequest } from './api-client';
import {
  AddRegistrationGroupStudentRequestSchema,
  BulkAssignRegistrationGroupStudentsRequestSchema,
  BulkAssignRegistrationGroupStudentsResponseSchema,
  PatchRegistrationGroupRequestSchema,
  RegistrationGroupBuilderPreviewRequestSchema,
  RegistrationGroupBuilderPreviewResponseSchema,
  RegistrationGroupDetailResponseSchema,
  RegistrationGroupEmailNotificationResponseSchema,
  RegistrationGroupGenerationCreateRequestSchema,
  RegistrationGroupGenerationCreateResponseSchema,
  RegistrationGroupPublishRequestSchema,
  RegistrationGroupPublishResultResponseSchema,
  RegistrationGroupPublishValidationResponseSchema,
  RegistrationGroupReferenceOptionsResponseSchema,
  RegistrationGroupSearchResponseSchema,
  RegistrationGroupStudentOptionsResponseSchema,
  UnassignedRegistrationGroupStudentSearchResponseSchema,
  type AddRegistrationGroupStudentRequest,
  type BulkAssignRegistrationGroupStudentsRequest,
  type BulkAssignRegistrationGroupStudentsResponse,
  type PatchRegistrationGroupRequest,
  type RegistrationGroupBuilderPreviewRequest,
  type RegistrationGroupBuilderPreviewResponse,
  type RegistrationGroupDetailResponse,
  type RegistrationGroupEmailNotificationResponse,
  type RegistrationGroupGenerationCreateRequest,
  type RegistrationGroupGenerationCreateResponse,
  type RegistrationGroupPublishRequest,
  type RegistrationGroupPublishResultResponse,
  type RegistrationGroupPublishValidationResponse,
  type RegistrationGroupReferenceOptionsResponse,
  type RegistrationGroupSearchResponse,
  type RegistrationGroupStudentOptionsResponse,
  type UnassignedRegistrationGroupStudentSearchResponse,
} from './schemas/registration-group-schemas';

export type SearchRegistrationGroupsRequest = {
  academicYearId?: number | null;
  termId?: number | null;
  groupQuery?: string | null;
  status?: string | null;
  page?: number;
  size?: number;
  sortBy?: 'academicYear' | 'name' | 'registrationOpensAt' | 'status' | 'studentCount' | 'term';
  sortDirection?: 'asc' | 'desc';
  signal?: AbortSignal;
};

export type SearchUnassignedRegistrationGroupStudentsRequest = {
  academicYearId: number;
  termId: number;
  searchText?: string | null;
  page?: number;
  size?: number;
  sortBy?:
    | 'academicDivision'
    | 'athletics'
    | 'completedCredits'
    | 'currentCredits'
    | 'email'
    | 'honors'
    | 'program'
    | 'student'
    | 'studentNumber'
    | 'totalCredits'
    | 'transferCredits';
  sortDirection?: 'asc' | 'desc';
  signal?: AbortSignal;
};

export type GetRegistrationGroupDetailRequest = {
  registrationGroupId: number;
  signal?: AbortSignal;
};

export type PreviewRegistrationGroupsRequest = {
  request: RegistrationGroupBuilderPreviewRequest;
  signal?: AbortSignal;
};

export type SaveGeneratedRegistrationGroupsRequest = {
  request: RegistrationGroupGenerationCreateRequest;
  signal?: AbortSignal;
};

export type RegistrationGroupPublishServiceRequest = {
  request: RegistrationGroupPublishRequest;
  signal?: AbortSignal;
};

export type PublishRegistrationGroupRequest = {
  registrationGroupId: number;
  signal?: AbortSignal;
};

export type PatchRegistrationGroupServiceRequest = {
  registrationGroupId: number;
  request: PatchRegistrationGroupRequest;
  signal?: AbortSignal;
};

export type SendRegistrationGroupTestEmailRequest = {
  registrationGroupId: number;
  signal?: AbortSignal;
};

export type AddRegistrationGroupStudentServiceRequest = {
  registrationGroupId: number;
  request: AddRegistrationGroupStudentRequest;
  signal?: AbortSignal;
};

export type BulkAddRegistrationGroupStudentsServiceRequest = {
  registrationGroupId: number;
  request: Omit<BulkAssignRegistrationGroupStudentsRequest, 'registrationGroupId'>;
  signal?: AbortSignal;
};

export type RemoveRegistrationGroupStudentRequest = {
  registrationGroupId: number;
  studentId: number;
  signal?: AbortSignal;
};

export type SearchRegistrationGroupStudentOptionsRequest = {
  academicYearId?: number | null;
  search?: string;
  size?: number;
  termId?: number | null;
  signal?: AbortSignal;
};

function appendNumberQueryParam(queryParams: URLSearchParams, key: string, value?: number | null) {
  if (value !== undefined && value !== null) {
    queryParams.set(key, String(value));
  }
}

function appendStringQueryParam(queryParams: URLSearchParams, key: string, value?: string | null) {
  if (value?.trim()) {
    queryParams.set(key, value.trim());
  }
}

function buildRegistrationGroupSearchParams({
  academicYearId,
  termId,
  groupQuery,
  status,
  page = 0,
  size = 25,
  sortBy = 'name',
  sortDirection = 'asc',
}: SearchRegistrationGroupsRequest) {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  appendNumberQueryParam(queryParams, 'academicYearId', academicYearId);
  appendNumberQueryParam(queryParams, 'termId', termId);
  appendStringQueryParam(queryParams, 'groupQuery', groupQuery);
  appendStringQueryParam(queryParams, 'status', status);

  return queryParams;
}

function buildUnassignedRegistrationGroupStudentSearchParams({
  academicYearId,
  termId,
  searchText,
  page = 0,
  size = 25,
  sortBy = 'student',
  sortDirection = 'asc',
}: SearchUnassignedRegistrationGroupStudentsRequest) {
  const queryParams = new URLSearchParams({
    academicYearId: String(academicYearId),
    termId: String(termId),
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
  });

  appendStringQueryParam(queryParams, 'searchText', searchText);

  return queryParams;
}

export async function getRegistrationGroupReferenceOptions({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<RegistrationGroupReferenceOptionsResponse> {
  return apiRequest({
    path: '/api/registration-groups/reference-options',
    parser: RegistrationGroupReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load registration group reference options.',
    signal,
  });
}

export async function searchRegistrationGroups(
  request: SearchRegistrationGroupsRequest = {}
): Promise<RegistrationGroupSearchResponse> {
  const queryParams = buildRegistrationGroupSearchParams(request);

  return apiRequest({
    path: `/api/registration-groups/search?${queryParams.toString()}`,
    parser: RegistrationGroupSearchResponseSchema,
    fallbackMessage: 'Failed to search registration groups.',
    signal: request.signal,
  });
}

export async function searchUnassignedRegistrationGroupStudents(
  request: SearchUnassignedRegistrationGroupStudentsRequest
): Promise<UnassignedRegistrationGroupStudentSearchResponse> {
  const queryParams = buildUnassignedRegistrationGroupStudentSearchParams(request);

  return apiRequest({
    path: `/api/registration-groups/unassigned-students?${queryParams.toString()}`,
    parser: UnassignedRegistrationGroupStudentSearchResponseSchema,
    fallbackMessage: 'Failed to search unassigned registration group students.',
    signal: request.signal,
  });
}

export async function getRegistrationGroupDetail({
  registrationGroupId,
  signal,
}: GetRegistrationGroupDetailRequest): Promise<RegistrationGroupDetailResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}`,
    parser: RegistrationGroupDetailResponseSchema,
    fallbackMessage: 'Failed to load registration group.',
    signal,
  });
}

export async function previewRegistrationGroups({
  request,
  signal,
}: PreviewRegistrationGroupsRequest): Promise<RegistrationGroupBuilderPreviewResponse> {
  return apiRequest({
    path: '/api/registration-groups/preview',
    method: 'POST',
    body: RegistrationGroupBuilderPreviewRequestSchema.parse(request),
    parser: RegistrationGroupBuilderPreviewResponseSchema,
    fallbackMessage: 'Failed to preview registration groups.',
    signal,
  });
}

export async function saveGeneratedRegistrationGroups({
  request,
  signal,
}: SaveGeneratedRegistrationGroupsRequest): Promise<RegistrationGroupGenerationCreateResponse> {
  return apiRequest({
    path: '/api/registration-groups/generations',
    method: 'POST',
    body: RegistrationGroupGenerationCreateRequestSchema.parse(request),
    parser: RegistrationGroupGenerationCreateResponseSchema,
    fallbackMessage: 'Failed to save generated registration groups.',
    signal,
  });
}

export async function validateRegistrationGroupsForPublish({
  request,
  signal,
}: RegistrationGroupPublishServiceRequest): Promise<RegistrationGroupPublishValidationResponse> {
  return apiRequest({
    path: '/api/registration-groups/publish/validate',
    method: 'POST',
    body: RegistrationGroupPublishRequestSchema.parse(request),
    parser: RegistrationGroupPublishValidationResponseSchema,
    fallbackMessage: 'Failed to validate registration groups for publishing.',
    signal,
  });
}

export async function publishRegistrationGroups({
  request,
  signal,
}: RegistrationGroupPublishServiceRequest): Promise<RegistrationGroupPublishResultResponse> {
  return apiRequest({
    path: '/api/registration-groups/publish',
    method: 'POST',
    body: RegistrationGroupPublishRequestSchema.parse(request),
    parser: RegistrationGroupPublishResultResponseSchema,
    fallbackMessage: 'Failed to publish registration groups.',
    signal,
  });
}

export async function publishRegistrationGroup({
  registrationGroupId,
  signal,
}: PublishRegistrationGroupRequest): Promise<RegistrationGroupDetailResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}/publish`,
    method: 'POST',
    parser: RegistrationGroupDetailResponseSchema,
    fallbackMessage: 'Failed to publish registration group.',
    signal,
  });
}

export async function patchRegistrationGroup({
  registrationGroupId,
  request,
  signal,
}: PatchRegistrationGroupServiceRequest): Promise<RegistrationGroupDetailResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}`,
    method: 'PATCH',
    body: PatchRegistrationGroupRequestSchema.parse(request),
    parser: RegistrationGroupDetailResponseSchema,
    fallbackMessage: 'Failed to update registration group.',
    signal,
  });
}

export async function sendRegistrationGroupTestEmail({
  registrationGroupId,
  signal,
}: SendRegistrationGroupTestEmailRequest): Promise<RegistrationGroupEmailNotificationResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}/email-notifications/test`,
    method: 'POST',
    parser: RegistrationGroupEmailNotificationResponseSchema,
    fallbackMessage: 'Failed to send registration group test email.',
    signal,
  });
}

export async function addRegistrationGroupStudent({
  registrationGroupId,
  request,
  signal,
}: AddRegistrationGroupStudentServiceRequest): Promise<RegistrationGroupDetailResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}/students`,
    method: 'POST',
    body: AddRegistrationGroupStudentRequestSchema.parse(request),
    parser: RegistrationGroupDetailResponseSchema,
    fallbackMessage: 'Failed to add student to registration group.',
    signal,
  });
}

export async function bulkAddRegistrationGroupStudents({
  registrationGroupId,
  request,
  signal,
}: BulkAddRegistrationGroupStudentsServiceRequest): Promise<BulkAssignRegistrationGroupStudentsResponse> {
  const body = BulkAssignRegistrationGroupStudentsRequestSchema.parse({
    registrationGroupId,
    ...request,
  });

  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}/students/bulk`,
    method: 'POST',
    body,
    parser: BulkAssignRegistrationGroupStudentsResponseSchema,
    fallbackMessage: 'Failed to add students to registration group.',
    signal,
  });
}

export async function removeRegistrationGroupStudent({
  registrationGroupId,
  studentId,
  signal,
}: RemoveRegistrationGroupStudentRequest): Promise<RegistrationGroupDetailResponse> {
  return apiRequest({
    path: `/api/registration-groups/${registrationGroupId}/students/${studentId}`,
    method: 'DELETE',
    parser: RegistrationGroupDetailResponseSchema,
    fallbackMessage: 'Failed to remove student from registration group.',
    signal,
  });
}

export async function searchRegistrationGroupStudentOptions({
  academicYearId,
  search,
  size = 10,
  termId,
  signal,
}: SearchRegistrationGroupStudentOptionsRequest): Promise<RegistrationGroupStudentOptionsResponse> {
  const queryParams = new URLSearchParams({
    size: String(size),
  });

  appendNumberQueryParam(queryParams, 'academicYearId', academicYearId);
  appendStringQueryParam(queryParams, 'search', search);
  appendNumberQueryParam(queryParams, 'termId', termId);

  return apiRequest({
    path: `/api/registration-groups/student-options?${queryParams.toString()}`,
    parser: RegistrationGroupStudentOptionsResponseSchema,
    fallbackMessage: 'Failed to search students.',
    signal,
  });
}
