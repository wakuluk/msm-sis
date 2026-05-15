import { z } from 'zod';

export const TransferRequestPolicyCheckResponseSchema = z.object({
  checkType: z.string(),
  label: z.string(),
  passed: z.boolean(),
  waived: z.boolean(),
  waivable: z.boolean(),
  status: z.string(),
  message: z.string(),
});

export type TransferRequestPolicyCheckResponse = z.infer<
  typeof TransferRequestPolicyCheckResponseSchema
>;

export const TransferRequestPolicyEvaluationResponseSchema = z.object({
  transferRequestId: z.number(),
  transferCreditPolicyId: z.number(),
  policyEffectiveStartDate: z.string(),
  policyEffectiveEndDate: z.string().nullable(),
  minimumTransferGrade: z.string(),
  fourYearInstitutionCreditThreshold: z.number(),
  requireTranscriptPdf: z.boolean(),
  currentStudentTransferCredits: z.number(),
  requestTransferCredits: z.number(),
  studentTransferCreditsAfterApproved: z.number(),
  institutionLevel: z.string().nullable(),
  thresholdApplies: z.boolean(),
  transcriptPdfAttached: z.boolean(),
  hasFailures: z.boolean(),
  checks: z.array(TransferRequestPolicyCheckResponseSchema),
});

export type TransferRequestPolicyEvaluationResponse = z.infer<
  typeof TransferRequestPolicyEvaluationResponseSchema
>;
