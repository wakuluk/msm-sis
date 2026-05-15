import { z } from 'zod';

export const TransferRequestInstitutionRequestSchema = z.object({
  transferInstitutionId: z.number().nullable().optional(),
  oneOffInstitutionName: z.string().nullable().optional(),
  oneOffInstitutionAddressLine1: z.string().nullable().optional(),
  oneOffInstitutionAddressLine2: z.string().nullable().optional(),
  oneOffInstitutionCity: z.string().nullable().optional(),
  oneOffInstitutionStateRegion: z.string().nullable().optional(),
  oneOffInstitutionPostalCode: z.string().nullable().optional(),
  oneOffInstitutionCountryCode: z.string().nullable().optional(),
  oneOffInstitutionWebsite: z.string().nullable().optional(),
  institutionLevel: z.string().nullable().optional(),
});

export type TransferRequestInstitutionRequest = z.infer<
  typeof TransferRequestInstitutionRequestSchema
>;

export const TransferRequestInstitutionMatchRequestSchema = z.object({
  transferInstitutionId: z.number().nullable(),
});

export type TransferRequestInstitutionMatchRequest = z.infer<
  typeof TransferRequestInstitutionMatchRequestSchema
>;

export const TransferRequestCourseRequestSchema = z.object({
  externalSubjectCode: z.string().nullable().optional(),
  externalCourseNumber: z.string().nullable().optional(),
  externalCourseTitle: z.string(),
  externalCourseDescription: z.string().nullable().optional(),
  externalTerm: z.string().nullable().optional(),
  requestedCredits: z.number().nullable().optional(),
  attemptedCredits: z.number().nullable().optional(),
  earnedCredits: z.number().nullable().optional(),
  grade: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  studentNotes: z.string().nullable().optional(),
  requestedLocalCourseEquivalent: z.string().nullable().optional(),
});

export type TransferRequestCourseRequest = z.infer<typeof TransferRequestCourseRequestSchema>;

export const TransferRequestCourseResponseSchema = z.object({
  transferRequestCourseId: z.number(),
  transferRequestId: z.number(),
  externalSubjectCode: z.string().nullable(),
  externalCourseNumber: z.string().nullable(),
  externalCourseTitle: z.string(),
  externalCourseDescription: z.string().nullable(),
  externalTerm: z.string().nullable(),
  requestedCredits: z.number().nullable(),
  attemptedCredits: z.number().nullable(),
  earnedCredits: z.number().nullable(),
  grade: z.string().nullable(),
  reason: z.string().nullable(),
  studentNotes: z.string().nullable(),
  requestedLocalCourseEquivalent: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferRequestCourseResponse = z.infer<typeof TransferRequestCourseResponseSchema>;

export const CreateStudentTransferRequestRequestSchema = z.object({
  institution: TransferRequestInstitutionRequestSchema.nullable().optional(),
  course: TransferRequestCourseRequestSchema.nullable().optional(),
});

export type CreateStudentTransferRequestRequest = z.infer<
  typeof CreateStudentTransferRequestRequestSchema
>;

export const StudentTransferRequestInstitutionRequestSchema = z.object({
  oneOffInstitutionName: z.string(),
  oneOffInstitutionAddressLine1: z.string().nullable().optional(),
  oneOffInstitutionAddressLine2: z.string().nullable().optional(),
  oneOffInstitutionCity: z.string().nullable().optional(),
  oneOffInstitutionStateRegion: z.string().nullable().optional(),
  oneOffInstitutionPostalCode: z.string().nullable().optional(),
  oneOffInstitutionCountryCode: z.string().nullable().optional(),
  oneOffInstitutionWebsite: z.string().nullable().optional(),
});

export const StudentTransferRequestCourseRequestSchema = z.object({
  externalSubjectCode: z.string().nullable().optional(),
  externalCourseNumber: z.string().nullable().optional(),
  externalCourseTitle: z.string(),
  externalCourseDescription: z.string().nullable().optional(),
  externalTerm: z.string().nullable().optional(),
  requestedCredits: z.number().nullable().optional(),
  attemptedCredits: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
  studentNotes: z.string().nullable().optional(),
  requestedLocalCourseEquivalent: z.string().nullable().optional(),
});

export const StudentTransferRequestSubmissionRequestSchema = z.object({
  institution: StudentTransferRequestInstitutionRequestSchema,
  course: StudentTransferRequestCourseRequestSchema,
});

export type StudentTransferRequestSubmissionRequest = z.infer<
  typeof StudentTransferRequestSubmissionRequestSchema
>;

export const TransferRequestInstitutionResponseSchema = z.object({
  transferInstitutionId: z.number().nullable(),
  transferInstitutionName: z.string().nullable(),
  transferInstitutionAddressLine1: z.string().nullable(),
  transferInstitutionAddressLine2: z.string().nullable(),
  transferInstitutionCity: z.string().nullable(),
  transferInstitutionStateRegion: z.string().nullable(),
  transferInstitutionPostalCode: z.string().nullable(),
  transferInstitutionCountryCode: z.string().nullable(),
  transferInstitutionWebsite: z.string().nullable(),
  institutionMatchedByUserId: z.number().nullable(),
  institutionMatchedByEmail: z.string().nullable(),
  institutionMatchedAt: z.string().nullable(),
  oneOffInstitutionName: z.string().nullable(),
  oneOffInstitutionAddressLine1: z.string().nullable(),
  oneOffInstitutionAddressLine2: z.string().nullable(),
  oneOffInstitutionCity: z.string().nullable(),
  oneOffInstitutionStateRegion: z.string().nullable(),
  oneOffInstitutionPostalCode: z.string().nullable(),
  oneOffInstitutionCountryCode: z.string().nullable(),
  oneOffInstitutionWebsite: z.string().nullable(),
  institutionLevel: z.string().nullable(),
});

export const TransferRequestResponseSchema = z.object({
  transferRequestId: z.number(),
  studentId: z.number(),
  studentNumber: z.string().nullable(),
  studentName: z.string(),
  studentEmail: z.string().nullable(),
  classOf: z.number().nullable(),
  divisionNames: z.array(z.string()),
  transferCreditPolicyId: z.number(),
  institution: TransferRequestInstitutionResponseSchema,
  primaryCourse: TransferRequestCourseResponseSchema.nullable(),
  status: z.string(),
  submittedAt: z.string().nullable(),
  decidedByUserId: z.number().nullable(),
  decidedByEmail: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decisionNotes: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferRequestResponse = z.infer<typeof TransferRequestResponseSchema>;

export const TransferRequestListResponseSchema = z.object({
  requests: z.array(TransferRequestResponseSchema),
});

export type TransferRequestListResponse = z.infer<typeof TransferRequestListResponseSchema>;

export const PatchTransferRequestWorkflowRequestSchema = z.object({
  status: z.string(),
  decisionNotes: z.string().nullable().optional(),
});

export type PatchTransferRequestWorkflowRequest = z.infer<
  typeof PatchTransferRequestWorkflowRequestSchema
>;

export const ApproveTransferRequestRequestSchema = z.object({
  decisionNotes: z.string().nullable().optional(),
  saveInstitution: z.boolean().optional(),
  saveOrUpdateInstitutionMapping: z.boolean().optional(),
});

export type ApproveTransferRequestRequest = z.infer<typeof ApproveTransferRequestRequestSchema>;

export const TransferRequestOutcomeRequestSchema = z.object({
  outcomeType: z.string(),
  localCourseId: z.number().nullable().optional(),
  requirementId: z.number().nullable().optional(),
  programVersionRequirementId: z.number().nullable().optional(),
  acceptedCredits: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type TransferRequestOutcomeRequest = z.infer<typeof TransferRequestOutcomeRequestSchema>;

export const TransferRequestOutcomeResponseSchema = z.object({
  transferRequestOutcomeId: z.number(),
  transferRequestCourseId: z.number(),
  outcomeType: z.string(),
  localCourseId: z.number().nullable(),
  localCourseCode: z.string().nullable(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  programVersionRequirementId: z.number().nullable(),
  acceptedCredits: z.number().nullable(),
  notes: z.string().nullable(),
  approvedByUserId: z.number(),
  approvedByEmail: z.string(),
  approvedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferRequestOutcomeResponse = z.infer<typeof TransferRequestOutcomeResponseSchema>;

export const TransferRequestOutcomeListResponseSchema = z.array(
  TransferRequestOutcomeResponseSchema
);

export const TransferCourseEquivalencyOutcomeResponseSchema = z.object({
  transferCourseEquivalencyOutcomeId: z.number(),
  transferCourseEquivalencyId: z.number(),
  outcomeType: z.string(),
  localCourseId: z.number().nullable(),
  localCourseCode: z.string().nullable(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  programVersionRequirementId: z.number().nullable(),
  acceptedCredits: z.number().nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number(),
});

export type TransferCourseEquivalencyOutcomeResponse = z.infer<
  typeof TransferCourseEquivalencyOutcomeResponseSchema
>;

export const TransferCourseEquivalencySummaryResponseSchema = z.object({
  transferCourseEquivalencyId: z.number(),
  transferInstitutionId: z.number(),
  externalSubjectCode: z.string(),
  externalCourseNumber: z.string(),
  externalCourseTitle: z.string().nullable(),
  externalCourseDescription: z.string().nullable(),
  externalCredits: z.number().nullable(),
  active: z.boolean(),
  notes: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferCourseEquivalencySummaryResponse = z.infer<
  typeof TransferCourseEquivalencySummaryResponseSchema
>;

export const TransferCourseEquivalencyDetailResponseSchema = z.object({
  transferCourseEquivalencyId: z.number(),
  transferInstitutionId: z.number(),
  transferInstitutionName: z.string(),
  externalSubjectCode: z.string(),
  externalCourseNumber: z.string(),
  externalCourseTitle: z.string().nullable(),
  externalCourseDescription: z.string().nullable(),
  externalCredits: z.number().nullable(),
  active: z.boolean(),
  notes: z.string().nullable(),
  outcomes: z.array(TransferCourseEquivalencyOutcomeResponseSchema),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferCourseEquivalencyDetailResponse = z.infer<
  typeof TransferCourseEquivalencyDetailResponseSchema
>;

export const TransferCourseEquivalencySummaryListResponseSchema = z.array(
  TransferCourseEquivalencySummaryResponseSchema
);

export const TransferRequestMappingComparisonOutcomeResponseSchema = z.object({
  outcomeType: z.string(),
  localCourseId: z.number().nullable(),
  localCourseCode: z.string().nullable(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  programVersionRequirementId: z.number().nullable(),
  acceptedCredits: z.number().nullable(),
  notes: z.string().nullable(),
});

export type TransferRequestMappingComparisonOutcomeResponse = z.infer<
  typeof TransferRequestMappingComparisonOutcomeResponseSchema
>;

export const TransferRequestMappingComparisonCourseResponseSchema = z.object({
  transferRequestCourseId: z.number(),
  externalSubjectCode: z.string().nullable(),
  externalCourseNumber: z.string().nullable(),
  externalCourseTitle: z.string().nullable(),
  externalCourseDescription: z.string().nullable(),
  requestedCredits: z.number().nullable(),
});

export const TransferRequestMappingComparisonResponseSchema = z.object({
  transferRequestId: z.number(),
  transferInstitutionId: z.number().nullable(),
  transferInstitutionName: z.string().nullable(),
  previousTransferCourseEquivalencyId: z.number().nullable(),
  transferCourse: TransferRequestMappingComparisonCourseResponseSchema,
  previousOutcomes: z.array(TransferRequestMappingComparisonOutcomeResponseSchema),
  proposedOutcomes: z.array(TransferRequestMappingComparisonOutcomeResponseSchema),
});

export type TransferRequestMappingComparisonResponse = z.infer<
  typeof TransferRequestMappingComparisonResponseSchema
>;

export const TransferRequestPolicyWaiverRequestSchema = z.object({
  policyCheckType: z.string(),
  reason: z.string(),
});

export type TransferRequestPolicyWaiverRequest = z.infer<
  typeof TransferRequestPolicyWaiverRequestSchema
>;

export const TransferRequestPolicyWaiverResponseSchema = z.object({
  transferRequestPolicyWaiverId: z.number(),
  transferRequestId: z.number(),
  policyCheckType: z.string(),
  waivedByUserId: z.number(),
  waivedByEmail: z.string(),
  waivedAt: z.string(),
  reason: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TransferRequestPolicyWaiverResponse = z.infer<
  typeof TransferRequestPolicyWaiverResponseSchema
>;

export const TransferRequestPolicyWaiverListResponseSchema = z.array(
  TransferRequestPolicyWaiverResponseSchema
);

export const StudentApprovedTransferRequestOutcomeResponseSchema = z.object({
  transferRequestOutcomeId: z.number(),
  outcomeType: z.string(),
  localCourseId: z.number().nullable(),
  localCourseCode: z.string().nullable(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  programVersionRequirementId: z.number().nullable(),
  acceptedCredits: z.number().nullable(),
});

export type StudentApprovedTransferRequestOutcomeResponse = z.infer<
  typeof StudentApprovedTransferRequestOutcomeResponseSchema
>;

export const StudentApprovedTransferRequestCourseResponseSchema = z.object({
  transferRequestCourseId: z.number(),
  externalSubjectCode: z.string().nullable(),
  externalCourseNumber: z.string().nullable(),
  externalCourseTitle: z.string(),
  externalCourseDescription: z.string().nullable(),
  externalTerm: z.string().nullable(),
  requestedCredits: z.number().nullable(),
  attemptedCredits: z.number().nullable(),
  acceptedCredits: z.number().nullable(),
  grade: z.string().nullable(),
  reason: z.string().nullable(),
  outcomes: z.array(StudentApprovedTransferRequestOutcomeResponseSchema),
});

export type StudentApprovedTransferRequestCourseResponse = z.infer<
  typeof StudentApprovedTransferRequestCourseResponseSchema
>;

export const StudentApprovedTransferRequestResponseSchema = z.object({
  transferRequestId: z.number(),
  institutionName: z.string().nullable(),
  institutionLevel: z.string().nullable(),
  submittedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  courses: z.array(StudentApprovedTransferRequestCourseResponseSchema),
});

export type StudentApprovedTransferRequestResponse = z.infer<
  typeof StudentApprovedTransferRequestResponseSchema
>;

export const StudentApprovedTransferRequestListResponseSchema = z.object({
  requests: z.array(StudentApprovedTransferRequestResponseSchema),
});

export type StudentApprovedTransferRequestListResponse = z.infer<
  typeof StudentApprovedTransferRequestListResponseSchema
>;

export const TransferRequestAttachmentResponseSchema = z.object({
  transferRequestAttachmentId: z.number(),
  transferRequestId: z.number(),
  pdfDocumentId: z.number(),
  storageKey: z.string(),
  originalFileName: z.string(),
  attachmentType: z.string(),
  uploadedByUserId: z.number(),
  uploadedByEmail: z.string(),
  uploadedAt: z.string(),
});

export type TransferRequestAttachmentResponse = z.infer<
  typeof TransferRequestAttachmentResponseSchema
>;

export const TransferInstitutionOptionResponseSchema = z.object({
  transferInstitutionId: z.number(),
  code: z.string(),
  name: z.string(),
  institutionLevel: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  stateRegion: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  website: z.string().nullable(),
});

export type TransferInstitutionOptionResponse = z.infer<
  typeof TransferInstitutionOptionResponseSchema
>;

export const TransferInstitutionOptionListResponseSchema = z.array(
  TransferInstitutionOptionResponseSchema
);
