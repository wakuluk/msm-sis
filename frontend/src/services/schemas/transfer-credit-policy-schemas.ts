import { z } from 'zod';

export const TransferCreditPolicyResponseSchema = z.object({
  transferCreditPolicyId: z.number(),
  effectiveStartDate: z.string(),
  effectiveEndDate: z.string().nullable(),
  minimumTransferGrade: z.string(),
  fourYearInstitutionCreditThreshold: z.number(),
  requireTranscriptPdf: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferCreditPolicyResponse = z.infer<typeof TransferCreditPolicyResponseSchema>;

export const TransferCreditPolicyListResponseSchema = z.object({
  policies: z.array(TransferCreditPolicyResponseSchema),
});

export type TransferCreditPolicyListResponse = z.infer<
  typeof TransferCreditPolicyListResponseSchema
>;

export const UpsertTransferCreditPolicyRequestSchema = z.object({
  effectiveStartDate: z.string(),
  effectiveEndDate: z.string().nullable(),
  minimumTransferGrade: z.string(),
  fourYearInstitutionCreditThreshold: z.number(),
  requireTranscriptPdf: z.boolean(),
  notes: z.string().nullable(),
});

export type UpsertTransferCreditPolicyRequest = z.infer<
  typeof UpsertTransferCreditPolicyRequestSchema
>;

export const CloseTransferCreditPolicyRequestSchema = z.object({
  effectiveEndDate: z.string(),
});

export type CloseTransferCreditPolicyRequest = z.infer<
  typeof CloseTransferCreditPolicyRequestSchema
>;
