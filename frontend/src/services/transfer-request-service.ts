import { getAccessToken } from '@/auth/auth-store';
import { apiRequest } from './api-client';
import {
  ApproveTransferRequestRequestSchema,
  PatchTransferRequestWorkflowRequestSchema,
  StudentApprovedTransferRequestListResponseSchema,
  StudentTransferRequestSubmissionRequestSchema,
  TransferRequestAttachmentResponseSchema,
  TransferCourseEquivalencyDetailResponseSchema,
  TransferCourseEquivalencySummaryListResponseSchema,
  TransferInstitutionOptionListResponseSchema,
  TransferRequestCourseRequestSchema,
  TransferRequestCourseResponseSchema,
  TransferRequestOutcomeListResponseSchema,
  TransferRequestOutcomeRequestSchema,
  TransferRequestOutcomeResponseSchema,
  TransferRequestPolicyWaiverListResponseSchema,
  TransferRequestPolicyWaiverRequestSchema,
  TransferRequestPolicyWaiverResponseSchema,
  TransferRequestInstitutionMatchRequestSchema,
  TransferRequestInstitutionRequestSchema,
  TransferRequestListResponseSchema,
  TransferRequestMappingComparisonResponseSchema,
  TransferRequestResponseSchema,
  type ApproveTransferRequestRequest,
  type PatchTransferRequestWorkflowRequest,
  type StudentApprovedTransferRequestListResponse,
  type StudentTransferRequestSubmissionRequest,
  type TransferRequestAttachmentResponse,
  type TransferCourseEquivalencyDetailResponse,
  type TransferCourseEquivalencySummaryResponse,
  type TransferRequestCourseRequest,
  type TransferRequestCourseResponse,
  type TransferInstitutionOptionResponse,
  type TransferRequestListResponse,
  type TransferRequestOutcomeRequest,
  type TransferRequestOutcomeResponse,
  type TransferRequestPolicyWaiverRequest,
  type TransferRequestPolicyWaiverResponse,
  type TransferRequestInstitutionMatchRequest,
  type TransferRequestInstitutionRequest,
  type TransferRequestResponse,
  type TransferRequestMappingComparisonResponse,
} from './schemas/transfer-request-schemas';

export type ListAdminTransferRequestsArgs = {
  classOf?: string;
  division?: string;
  signal?: AbortSignal;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  studentEmail?: string;
  studentId?: string;
  studentName?: string;
};

export type SubmitStudentTransferRequestArgs = {
  request: StudentTransferRequestSubmissionRequest;
  signal?: AbortSignal;
};

export type ListStudentApprovedTransferRequestsArgs = {
  signal?: AbortSignal;
};

export type ListStudentTransferRequestsArgs = {
  signal?: AbortSignal;
};

export type ListTransferInstitutionsArgs = {
  search?: string;
  signal?: AbortSignal;
};

export type ListTransferCourseEquivalenciesArgs = {
  search?: string;
  signal?: AbortSignal;
  transferInstitutionId: number;
};

export type GetTransferCourseEquivalencyArgs = {
  signal?: AbortSignal;
  transferCourseEquivalencyId: number;
};

export type TransferRequestIdArgs = {
  signal?: AbortSignal;
  transferRequestId: number;
};

export type TransferRequestCourseIdArgs = {
  signal?: AbortSignal;
  transferRequestCourseId: number;
};

export type UploadAdminTransferRequestTranscriptArgs = TransferRequestIdArgs & {
  file: File;
};

export type UpdateAdminTransferRequestWorkflowArgs = TransferRequestIdArgs & {
  request: PatchTransferRequestWorkflowRequest;
};

export type ApproveAdminTransferRequestArgs = TransferRequestIdArgs & {
  request: ApproveTransferRequestRequest;
};

export type UpdateAdminTransferRequestInstitutionArgs = TransferRequestIdArgs & {
  request: TransferRequestInstitutionRequest;
};

export type UpdateAdminTransferRequestMatchedInstitutionArgs = TransferRequestIdArgs & {
  request: TransferRequestInstitutionMatchRequest;
};

export type UpsertAdminTransferRequestCourseArgs = TransferRequestIdArgs & {
  request: TransferRequestCourseRequest;
};

export type UpsertAdminTransferRequestWaiverArgs = TransferRequestIdArgs & {
  request: TransferRequestPolicyWaiverRequest;
};

export type DeleteAdminTransferRequestWaiverArgs = TransferRequestIdArgs & {
  policyCheckType: string;
};

export type CreateAdminTransferRequestOutcomeArgs = TransferRequestCourseIdArgs & {
  request: TransferRequestOutcomeRequest;
};

export type CreateAdminTransferRequestOutcomesFromEquivalencyArgs = TransferRequestCourseIdArgs & {
  transferCourseEquivalencyId: number;
};

export type UpdateAdminTransferRequestOutcomeArgs = {
  request: TransferRequestOutcomeRequest;
  signal?: AbortSignal;
  transferRequestOutcomeId: number;
};

function appendOptionalParam(params: URLSearchParams, key: string, value?: string) {
  if (value && value.trim().length > 0) {
    params.set(key, value.trim());
  }
}

export async function listAdminTransferRequests({
  classOf,
  division,
  signal,
  sortDirection = 'asc',
  status,
  studentEmail,
  studentId,
  studentName,
}: ListAdminTransferRequestsArgs = {}): Promise<TransferRequestListResponse> {
  const params = new URLSearchParams();

  appendOptionalParam(params, 'studentName', studentName);
  appendOptionalParam(params, 'studentEmail', studentEmail);
  appendOptionalParam(params, 'studentId', studentId);
  appendOptionalParam(params, 'classOf', classOf);
  appendOptionalParam(params, 'division', division);
  appendOptionalParam(params, 'status', status);
  params.set('sortDirection', sortDirection);

  return apiRequest({
    path: `/api/admin/transfer-requests?${params.toString()}`,
    parser: TransferRequestListResponseSchema,
    fallbackMessage: 'Failed to load transfer requests.',
    signal,
  });
}

export async function getAdminTransferRequest({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}`,
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to load transfer request.',
    signal,
  });
}

export async function getAdminTransferRequestMappingComparison({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestMappingComparisonResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/mapping-comparison`,
    parser: TransferRequestMappingComparisonResponseSchema,
    fallbackMessage: 'Failed to load transfer mapping comparison.',
    signal,
  });
}

export async function updateAdminTransferRequestWorkflow({
  request,
  signal,
  transferRequestId,
}: UpdateAdminTransferRequestWorkflowArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/workflow`,
    method: 'PATCH',
    body: PatchTransferRequestWorkflowRequestSchema.parse(request),
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to update transfer request status.',
    signal,
  });
}

export async function approveAdminTransferRequest({
  request,
  signal,
  transferRequestId,
}: ApproveAdminTransferRequestArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/approve`,
    method: 'POST',
    body: ApproveTransferRequestRequestSchema.parse(request),
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to approve transfer request.',
    signal,
  });
}

export async function updateAdminTransferRequestInstitution({
  request,
  signal,
  transferRequestId,
}: UpdateAdminTransferRequestInstitutionArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/institution`,
    method: 'PUT',
    body: TransferRequestInstitutionRequestSchema.parse(request),
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to update transfer request institution.',
    signal,
  });
}

export async function updateAdminTransferRequestMatchedInstitution({
  request,
  signal,
  transferRequestId,
}: UpdateAdminTransferRequestMatchedInstitutionArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/matched-institution`,
    method: 'PATCH',
    body: TransferRequestInstitutionMatchRequestSchema.parse(request),
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to update matched institution.',
    signal,
  });
}

export async function listAdminTransferRequestCourses({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestCourseResponse[]> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/courses`,
    parser: { parse: (payload) => TransferRequestCourseResponseSchema.array().parse(payload) },
    fallbackMessage: 'Failed to load transfer request courses.',
    signal,
  });
}

export async function upsertAdminTransferRequestPrimaryCourse({
  request,
  signal,
  transferRequestId,
}: UpsertAdminTransferRequestCourseArgs): Promise<TransferRequestCourseResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/courses/primary`,
    method: 'PUT',
    body: TransferRequestCourseRequestSchema.parse(request),
    parser: TransferRequestCourseResponseSchema,
    fallbackMessage: 'Failed to update transfer request course.',
    signal,
  });
}

export async function getAdminTransferRequestTranscript({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestAttachmentResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/attachments/transcript`,
    parser: TransferRequestAttachmentResponseSchema,
    fallbackMessage: 'Failed to load transcript PDF metadata.',
    signal,
  });
}

export async function uploadAdminTransferRequestTranscript({
  file,
  signal,
  transferRequestId,
}: UploadAdminTransferRequestTranscriptArgs): Promise<TransferRequestAttachmentResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/admin/transfer-requests/${transferRequestId}/attachments/transcript`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal,
    }
  );
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
        ? payload.message
        : 'Failed to upload transcript PDF.'
    );
  }

  return TransferRequestAttachmentResponseSchema.parse(payload);
}

export async function listAdminTransferRequestOutcomes({
  signal,
  transferRequestCourseId,
}: TransferRequestCourseIdArgs): Promise<TransferRequestOutcomeResponse[]> {
  return apiRequest({
    path: `/api/admin/transfer-request-courses/${transferRequestCourseId}/outcomes`,
    parser: TransferRequestOutcomeListResponseSchema,
    fallbackMessage: 'Failed to load transfer request outcomes.',
    signal,
  });
}

export async function createAdminTransferRequestOutcome({
  request,
  signal,
  transferRequestCourseId,
}: CreateAdminTransferRequestOutcomeArgs): Promise<TransferRequestOutcomeResponse> {
  return apiRequest({
    path: `/api/admin/transfer-request-courses/${transferRequestCourseId}/outcomes`,
    method: 'POST',
    body: TransferRequestOutcomeRequestSchema.parse(request),
    parser: TransferRequestOutcomeResponseSchema,
    fallbackMessage: 'Failed to add transfer request outcome.',
    signal,
  });
}

export async function createAdminTransferRequestOutcomesFromEquivalency({
  signal,
  transferCourseEquivalencyId,
  transferRequestCourseId,
}: CreateAdminTransferRequestOutcomesFromEquivalencyArgs): Promise<TransferRequestOutcomeResponse[]> {
  return apiRequest({
    path: `/api/admin/transfer-request-courses/${transferRequestCourseId}/outcomes/from-equivalency/${transferCourseEquivalencyId}`,
    method: 'POST',
    parser: TransferRequestOutcomeListResponseSchema,
    fallbackMessage: 'Failed to add outcomes from saved equivalency.',
    signal,
  });
}

export async function updateAdminTransferRequestOutcome({
  request,
  signal,
  transferRequestOutcomeId,
}: UpdateAdminTransferRequestOutcomeArgs): Promise<TransferRequestOutcomeResponse> {
  return apiRequest({
    path: `/api/admin/transfer-request-outcomes/${transferRequestOutcomeId}`,
    method: 'PATCH',
    body: TransferRequestOutcomeRequestSchema.parse(request),
    parser: TransferRequestOutcomeResponseSchema,
    fallbackMessage: 'Failed to update transfer request outcome.',
    signal,
  });
}

export async function deleteAdminTransferRequestOutcome({
  signal,
  transferRequestOutcomeId,
}: {
  signal?: AbortSignal;
  transferRequestOutcomeId: number;
}): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(`/api/admin/transfer-request-outcomes/${transferRequestOutcomeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(
      typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
        ? payload.message
        : 'Failed to remove transfer request outcome.'
    );
  }
}

export async function listAdminTransferRequestWaivers({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestPolicyWaiverResponse[]> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/policy-waivers`,
    parser: TransferRequestPolicyWaiverListResponseSchema,
    fallbackMessage: 'Failed to load transfer request policy waivers.',
    signal,
  });
}

export async function upsertAdminTransferRequestWaiver({
  request,
  signal,
  transferRequestId,
}: UpsertAdminTransferRequestWaiverArgs): Promise<TransferRequestPolicyWaiverResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/policy-waivers`,
    method: 'PUT',
    body: TransferRequestPolicyWaiverRequestSchema.parse(request),
    parser: TransferRequestPolicyWaiverResponseSchema,
    fallbackMessage: 'Failed to update transfer request policy waiver.',
    signal,
  });
}

export async function deleteAdminTransferRequestWaiver({
  policyCheckType,
  signal,
  transferRequestId,
}: DeleteAdminTransferRequestWaiverArgs): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(
    `/api/admin/transfer-requests/${transferRequestId}/policy-waivers/${policyCheckType}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(
      typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
        ? payload.message
        : 'Failed to remove transfer request policy waiver.'
    );
  }
}

export async function downloadAdminTransferRequestTranscript({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<Blob> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch(
    `/api/admin/transfer-requests/${transferRequestId}/attachments/transcript/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download transcript PDF.');
  }

  return response.blob();
}

export async function listTransferInstitutions({
  search,
  signal,
}: ListTransferInstitutionsArgs = {}): Promise<TransferInstitutionOptionResponse[]> {
  const params = new URLSearchParams();

  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }

  return apiRequest({
    path: `/api/admin/transfer-institutions${params.size > 0 ? `?${params.toString()}` : ''}`,
    parser: TransferInstitutionOptionListResponseSchema,
    fallbackMessage: 'Failed to load saved transfer institutions.',
    signal,
  });
}

export async function listTransferCourseEquivalencies({
  search,
  signal,
  transferInstitutionId,
}: ListTransferCourseEquivalenciesArgs): Promise<TransferCourseEquivalencySummaryResponse[]> {
  const params = new URLSearchParams();

  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }

  return apiRequest({
    path: `/api/admin/transfer-institutions/${transferInstitutionId}/course-equivalencies${params.size > 0 ? `?${params.toString()}` : ''}`,
    parser: TransferCourseEquivalencySummaryListResponseSchema,
    fallbackMessage: 'Failed to load saved course equivalencies.',
    signal,
  });
}

export async function getTransferCourseEquivalency({
  signal,
  transferCourseEquivalencyId,
}: GetTransferCourseEquivalencyArgs): Promise<TransferCourseEquivalencyDetailResponse> {
  return apiRequest({
    path: `/api/admin/transfer-institution-course-equivalencies/${transferCourseEquivalencyId}`,
    parser: TransferCourseEquivalencyDetailResponseSchema,
    fallbackMessage: 'Failed to load saved course equivalency.',
    signal,
  });
}

export async function listStudentApprovedTransferRequests({
  signal,
}: ListStudentApprovedTransferRequestsArgs = {}): Promise<StudentApprovedTransferRequestListResponse> {
  return apiRequest({
    path: '/api/student/transfer-requests/approved',
    parser: StudentApprovedTransferRequestListResponseSchema,
    fallbackMessage: 'Failed to load approved transfer requests.',
    signal,
  });
}

export async function listStudentTransferRequests({
  signal,
}: ListStudentTransferRequestsArgs = {}): Promise<TransferRequestListResponse> {
  return apiRequest({
    path: '/api/student/transfer-requests',
    parser: TransferRequestListResponseSchema,
    fallbackMessage: 'Failed to load transfer requests.',
    signal,
  });
}

export async function getStudentTransferRequest({
  signal,
  transferRequestId,
}: TransferRequestIdArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: `/api/student/transfer-requests/${transferRequestId}`,
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to load transfer request.',
    signal,
  });
}

export async function submitStudentTransferRequest({
  request,
  signal,
}: SubmitStudentTransferRequestArgs): Promise<TransferRequestResponse> {
  return apiRequest({
    path: '/api/student/transfer-request-submissions',
    method: 'POST',
    body: StudentTransferRequestSubmissionRequestSchema.parse(request),
    parser: TransferRequestResponseSchema,
    fallbackMessage: 'Failed to submit transfer request.',
    signal,
  });
}
