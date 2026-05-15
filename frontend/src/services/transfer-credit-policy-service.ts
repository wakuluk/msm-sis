import { apiRequest } from './api-client';
import {
  CloseTransferCreditPolicyRequestSchema,
  TransferCreditPolicyListResponseSchema,
  TransferCreditPolicyResponseSchema,
  UpsertTransferCreditPolicyRequestSchema,
  type CloseTransferCreditPolicyRequest,
  type TransferCreditPolicyListResponse,
  type TransferCreditPolicyResponse,
  type UpsertTransferCreditPolicyRequest,
} from './schemas/transfer-credit-policy-schemas';

export type GetTransferCreditPoliciesRequest = {
  signal?: AbortSignal;
};

export type SaveTransferCreditPolicyRequest = {
  policyId?: number;
  request: UpsertTransferCreditPolicyRequest;
  signal?: AbortSignal;
};

export type UpdateCurrentTransferCreditPolicyRequest = {
  request: UpsertTransferCreditPolicyRequest;
  signal?: AbortSignal;
};

export type CloseCurrentTransferCreditPolicyRequest = {
  request: CloseTransferCreditPolicyRequest;
  signal?: AbortSignal;
};

export async function getTransferCreditPolicies({
  signal,
}: GetTransferCreditPoliciesRequest = {}): Promise<TransferCreditPolicyListResponse> {
  return apiRequest({
    path: '/api/admin/transfer-credit-policies',
    parser: TransferCreditPolicyListResponseSchema,
    fallbackMessage: 'Failed to load transfer credit policies.',
    signal,
  });
}

export async function saveTransferCreditPolicy({
  policyId,
  request,
  signal,
}: SaveTransferCreditPolicyRequest): Promise<TransferCreditPolicyResponse> {
  return apiRequest({
    path:
      policyId === undefined
        ? '/api/admin/transfer-credit-policies'
        : `/api/admin/transfer-credit-policies/${policyId}`,
    method: policyId === undefined ? 'POST' : 'PATCH',
    body: UpsertTransferCreditPolicyRequestSchema.parse(request),
    parser: TransferCreditPolicyResponseSchema,
    fallbackMessage: 'Failed to save transfer credit policy.',
    signal,
  });
}

export async function updateCurrentTransferCreditPolicy({
  request,
  signal,
}: UpdateCurrentTransferCreditPolicyRequest): Promise<TransferCreditPolicyResponse> {
  return apiRequest({
    path: '/api/admin/transfer-credit-policies/current',
    method: 'PATCH',
    body: UpsertTransferCreditPolicyRequestSchema.parse(request),
    parser: TransferCreditPolicyResponseSchema,
    fallbackMessage: 'Failed to update current transfer credit policy.',
    signal,
  });
}

export async function closeCurrentTransferCreditPolicy({
  request,
  signal,
}: CloseCurrentTransferCreditPolicyRequest): Promise<TransferCreditPolicyResponse> {
  return apiRequest({
    path: '/api/admin/transfer-credit-policies/current/close',
    method: 'PATCH',
    body: CloseTransferCreditPolicyRequestSchema.parse(request),
    parser: TransferCreditPolicyResponseSchema,
    fallbackMessage: 'Failed to close current transfer credit policy.',
    signal,
  });
}
