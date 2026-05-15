import { apiRequest } from './api-client';
import {
  TransferRequestPolicyEvaluationResponseSchema,
  type TransferRequestPolicyEvaluationResponse,
} from './schemas/transfer-request-policy-evaluation-schemas';

export type GetTransferRequestPolicyEvaluationRequest = {
  signal?: AbortSignal;
  transferRequestId: number;
};

export async function getTransferRequestPolicyEvaluation({
  signal,
  transferRequestId,
}: GetTransferRequestPolicyEvaluationRequest): Promise<TransferRequestPolicyEvaluationResponse> {
  return apiRequest({
    path: `/api/admin/transfer-requests/${transferRequestId}/policy-evaluation`,
    parser: TransferRequestPolicyEvaluationResponseSchema,
    fallbackMessage: 'Failed to evaluate transfer request policy checks.',
    signal,
  });
}
