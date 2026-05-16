import { apiRequest } from './api-client';
import {
  BillingPeriodDetailResponseSchema,
  BillingPeriodRunListResponseSchema,
  BillingPeriodSearchResponseSchema,
  CreateBillingPeriodRequestSchema,
  CreateTuitionCodeRequestSchema,
  PatchBillingPeriodRequestSchema,
  PatchTuitionCodeRequestSchema,
  RunBillingPeriodRequestSchema,
  RunBillingPeriodResponseSchema,
  StudentBillingAssignmentResponseSchema,
  TuitionCodeDetailResponseSchema,
  TuitionCodeSearchResponseSchema,
  UpdateStudentBillingAssignmentRequestSchema,
  type BillingPeriodDetailResponse,
  type BillingPeriodRunListResponse,
  type BillingPeriodSearchResponse,
  type CreateBillingPeriodRequest,
  type CreateTuitionCodeRequest,
  type PatchBillingPeriodRequest,
  type PatchTuitionCodeRequest,
  type RunBillingPeriodRequest,
  type RunBillingPeriodResponse,
  type StudentBillingAssignmentResponse,
  type TuitionCodeDetailResponse,
  type TuitionCodeSearchResponse,
  type UpdateStudentBillingAssignmentRequest,
} from './schemas/billing-schemas';

type SortDirection = 'asc' | 'desc';

export type SearchTuitionCodesRequest = {
  code?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  signal?: AbortSignal;
};

export type GetTuitionCodeRequest = {
  tuitionCodeId: number;
  signal?: AbortSignal;
};

export type CreateTuitionCodeServiceRequest = {
  request: CreateTuitionCodeRequest;
  signal?: AbortSignal;
};

export type PatchTuitionCodeServiceRequest = {
  tuitionCodeId: number;
  request: PatchTuitionCodeRequest;
  signal?: AbortSignal;
};

export type GetStudentBillingAssignmentRequest = {
  studentId: number;
  signal?: AbortSignal;
};

export type UpdateStudentBillingAssignmentServiceRequest = {
  studentId: number;
  request: UpdateStudentBillingAssignmentRequest;
  signal?: AbortSignal;
};

export type SearchBillingPeriodsRequest = {
  name?: string;
  description?: string;
  status?: string;
  academicTerm?: string;
  financialAidPeriod?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  signal?: AbortSignal;
};

export type GetBillingPeriodRequest = {
  billingPeriodId: number;
  signal?: AbortSignal;
};

export type CreateBillingPeriodServiceRequest = {
  request: CreateBillingPeriodRequest;
  signal?: AbortSignal;
};

export type PatchBillingPeriodServiceRequest = {
  billingPeriodId: number;
  request: PatchBillingPeriodRequest;
  signal?: AbortSignal;
};

export type ListBillingPeriodRunsRequest = {
  billingPeriodId: number;
  signal?: AbortSignal;
};

export type RunBillingPeriodServiceRequest = {
  billingPeriodId: number;
  request?: RunBillingPeriodRequest;
  signal?: AbortSignal;
};

function appendOptionalParam(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  searchParams.set(key, String(value));
}

export async function searchTuitionCodes({
  code,
  name,
  page = 0,
  size = 25,
  sortBy = 'code',
  sortDirection = 'asc',
  signal,
}: SearchTuitionCodesRequest = {}): Promise<TuitionCodeSearchResponse> {
  const searchParams = new URLSearchParams();
  appendOptionalParam(searchParams, 'code', code?.trim());
  appendOptionalParam(searchParams, 'name', name?.trim());
  searchParams.set('page', String(page));
  searchParams.set('size', String(size));
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortDirection', sortDirection);

  return apiRequest({
    path: `/api/billing/tuition-codes?${searchParams.toString()}`,
    parser: TuitionCodeSearchResponseSchema,
    fallbackMessage: 'Failed to search tuition codes.',
    signal,
  });
}

export async function getTuitionCode({
  tuitionCodeId,
  signal,
}: GetTuitionCodeRequest): Promise<TuitionCodeDetailResponse> {
  return apiRequest({
    path: `/api/billing/tuition-codes/${tuitionCodeId}`,
    parser: TuitionCodeDetailResponseSchema,
    fallbackMessage: 'Failed to load tuition code.',
    signal,
  });
}

export async function createTuitionCode({
  request,
  signal,
}: CreateTuitionCodeServiceRequest): Promise<TuitionCodeDetailResponse> {
  return apiRequest({
    path: '/api/billing/tuition-codes',
    method: 'POST',
    body: CreateTuitionCodeRequestSchema.parse(request),
    parser: TuitionCodeDetailResponseSchema,
    fallbackMessage: 'Failed to create tuition code.',
    signal,
  });
}

export async function patchTuitionCode({
  tuitionCodeId,
  request,
  signal,
}: PatchTuitionCodeServiceRequest): Promise<TuitionCodeDetailResponse> {
  return apiRequest({
    path: `/api/billing/tuition-codes/${tuitionCodeId}`,
    method: 'PATCH',
    body: PatchTuitionCodeRequestSchema.parse(request),
    parser: TuitionCodeDetailResponseSchema,
    fallbackMessage: 'Failed to update tuition code.',
    signal,
  });
}

export async function getStudentBillingAssignment({
  studentId,
  signal,
}: GetStudentBillingAssignmentRequest): Promise<StudentBillingAssignmentResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/billing`,
    parser: StudentBillingAssignmentResponseSchema,
    fallbackMessage: 'Failed to load student billing.',
    signal,
  });
}

export async function updateStudentBillingAssignment({
  studentId,
  request,
  signal,
}: UpdateStudentBillingAssignmentServiceRequest): Promise<StudentBillingAssignmentResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/billing/tuition-code`,
    method: 'PATCH',
    body: UpdateStudentBillingAssignmentRequestSchema.parse(request),
    parser: StudentBillingAssignmentResponseSchema,
    fallbackMessage: 'Failed to update student billing.',
    signal,
  });
}

export async function searchBillingPeriods({
  name,
  description,
  status,
  academicTerm,
  financialAidPeriod,
  page = 0,
  size = 25,
  sortBy = 'name',
  sortDirection = 'asc',
  signal,
}: SearchBillingPeriodsRequest = {}): Promise<BillingPeriodSearchResponse> {
  const searchParams = new URLSearchParams();
  appendOptionalParam(searchParams, 'name', name?.trim());
  appendOptionalParam(searchParams, 'description', description?.trim());
  appendOptionalParam(searchParams, 'status', status);
  appendOptionalParam(searchParams, 'academicTerm', academicTerm?.trim());
  appendOptionalParam(searchParams, 'financialAidPeriod', financialAidPeriod?.trim());
  searchParams.set('page', String(page));
  searchParams.set('size', String(size));
  searchParams.set('sortBy', sortBy);
  searchParams.set('sortDirection', sortDirection);

  return apiRequest({
    path: `/api/billing/periods?${searchParams.toString()}`,
    parser: BillingPeriodSearchResponseSchema,
    fallbackMessage: 'Failed to search billing periods.',
    signal,
  });
}

export async function getBillingPeriod({
  billingPeriodId,
  signal,
}: GetBillingPeriodRequest): Promise<BillingPeriodDetailResponse> {
  return apiRequest({
    path: `/api/billing/periods/${billingPeriodId}`,
    parser: BillingPeriodDetailResponseSchema,
    fallbackMessage: 'Failed to load billing period.',
    signal,
  });
}

export async function createBillingPeriod({
  request,
  signal,
}: CreateBillingPeriodServiceRequest): Promise<BillingPeriodDetailResponse> {
  return apiRequest({
    path: '/api/billing/periods',
    method: 'POST',
    body: CreateBillingPeriodRequestSchema.parse(request),
    parser: BillingPeriodDetailResponseSchema,
    fallbackMessage: 'Failed to create billing period.',
    signal,
  });
}

export async function patchBillingPeriod({
  billingPeriodId,
  request,
  signal,
}: PatchBillingPeriodServiceRequest): Promise<BillingPeriodDetailResponse> {
  return apiRequest({
    path: `/api/billing/periods/${billingPeriodId}`,
    method: 'PATCH',
    body: PatchBillingPeriodRequestSchema.parse(request),
    parser: BillingPeriodDetailResponseSchema,
    fallbackMessage: 'Failed to update billing period.',
    signal,
  });
}

export async function listBillingPeriodRuns({
  billingPeriodId,
  signal,
}: ListBillingPeriodRunsRequest): Promise<BillingPeriodRunListResponse> {
  return apiRequest({
    path: `/api/billing/periods/${billingPeriodId}/runs`,
    parser: BillingPeriodRunListResponseSchema,
    fallbackMessage: 'Failed to load billing period runs.',
    signal,
  });
}

export async function runBillingPeriod({
  billingPeriodId,
  request,
  signal,
}: RunBillingPeriodServiceRequest): Promise<RunBillingPeriodResponse> {
  return apiRequest({
    path: `/api/billing/periods/${billingPeriodId}/runs`,
    method: 'POST',
    body: RunBillingPeriodRequestSchema.parse(request ?? {}),
    parser: RunBillingPeriodResponseSchema,
    fallbackMessage: 'Failed to run billing period.',
    signal,
  });
}
