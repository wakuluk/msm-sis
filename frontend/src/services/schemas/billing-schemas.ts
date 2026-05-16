import { z } from 'zod';

export const TuitionCodeSearchResultResponseSchema = z.object({
  tuitionCodeId: z.number(),
  code: z.string(),
  name: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TuitionCodeSearchResultResponse = z.infer<typeof TuitionCodeSearchResultResponseSchema>;

export const TuitionCodeSearchResponseSchema = z.object({
  results: z.array(TuitionCodeSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type TuitionCodeSearchResponse = z.infer<typeof TuitionCodeSearchResponseSchema>;

export const TuitionCodeDetailResponseSchema = z.object({
  tuitionCodeId: z.number(),
  code: z.string(),
  name: z.string(),
  createdByUserId: z.number().nullable(),
  createdByUserEmail: z.string().nullable(),
  updatedByUserId: z.number().nullable(),
  updatedByUserEmail: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type TuitionCodeDetailResponse = z.infer<typeof TuitionCodeDetailResponseSchema>;

export const CreateTuitionCodeRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type CreateTuitionCodeRequest = z.infer<typeof CreateTuitionCodeRequestSchema>;

export const PatchTuitionCodeRequestSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
});

export type PatchTuitionCodeRequest = z.infer<typeof PatchTuitionCodeRequestSchema>;

export const StudentBillingAssignmentResponseSchema = z.object({
  studentId: z.number(),
  studentTuitionCodeAssignmentId: z.number().nullable(),
  tuitionCodeId: z.number().nullable(),
  tuitionCode: z.string().nullable(),
  tuitionCodeName: z.string().nullable(),
  createdByUserId: z.number().nullable(),
  createdByUserEmail: z.string().nullable(),
  updatedByUserId: z.number().nullable(),
  updatedByUserEmail: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type StudentBillingAssignmentResponse = z.infer<
  typeof StudentBillingAssignmentResponseSchema
>;

export const UpdateStudentBillingAssignmentRequestSchema = z.object({
  tuitionCodeId: z.number().nullable(),
});

export type UpdateStudentBillingAssignmentRequest = z.infer<
  typeof UpdateStudentBillingAssignmentRequestSchema
>;

export const BillingPeriodStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export type BillingPeriodStatus = z.infer<typeof BillingPeriodStatusSchema>;

export const BillingPeriodTypeSchema = z.enum(['STANDARD', 'OPEN_ENDED']);

export type BillingPeriodType = z.infer<typeof BillingPeriodTypeSchema>;

export const BillingPeriodRunStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);

export type BillingPeriodRunStatus = z.infer<typeof BillingPeriodRunStatusSchema>;

export const BillingPeriodRunTriggerSourceSchema = z.enum(['USER', 'SYSTEM']);

export type BillingPeriodRunTriggerSource = z.infer<
  typeof BillingPeriodRunTriggerSourceSchema
>;

const nullableDateStringSchema = z.string().nullable();
const nullableDateTimeStringSchema = z.string().nullable();
const nullableStringSchema = z.string().nullable();
const nullableNumberSchema = z.number().nullable();

export const BillingPeriodSearchResultResponseSchema = z.object({
  billingPeriodId: z.number(),
  name: z.string(),
  description: z.string(),
  type: BillingPeriodTypeSchema,
  status: BillingPeriodStatusSchema,
  academicYearId: nullableNumberSchema,
  academicYearCode: nullableStringSchema,
  academicYearName: nullableStringSchema,
  termId: nullableNumberSchema,
  termCode: nullableStringSchema,
  termName: nullableStringSchema,
  startDate: nullableDateStringSchema,
  endDate: nullableDateStringSchema,
  taxAcademicTermCode: nullableStringSchema,
  taxAcademicTermName: nullableStringSchema,
  financialAidPeriodCode: nullableStringSchema,
  financialAidPeriodName: nullableStringSchema,
  active: z.boolean(),
});

export type BillingPeriodSearchResultResponse = z.infer<
  typeof BillingPeriodSearchResultResponseSchema
>;

export const BillingPeriodSearchResponseSchema = z.object({
  results: z.array(BillingPeriodSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type BillingPeriodSearchResponse = z.infer<typeof BillingPeriodSearchResponseSchema>;

export const BillingPeriodDetailResponseSchema = z.object({
  billingPeriodId: z.number(),
  name: z.string(),
  description: z.string(),
  type: BillingPeriodTypeSchema,
  status: BillingPeriodStatusSchema,
  academicYearId: nullableNumberSchema,
  academicYearCode: nullableStringSchema,
  academicYearName: nullableStringSchema,
  termId: nullableNumberSchema,
  termCode: nullableStringSchema,
  termName: nullableStringSchema,
  startDate: nullableDateStringSchema,
  endDate: nullableDateStringSchema,
  actualStartPreliminaryEndDate: nullableDateStringSchema,
  taxAcademicYear: nullableStringSchema,
  taxAcademicYearLabel: nullableStringSchema,
  taxAcademicTermCode: nullableStringSchema,
  taxAcademicTermName: nullableStringSchema,
  financialAidPeriodCode: nullableStringSchema,
  financialAidPeriodName: nullableStringSchema,
  courseBillingBasis: z.string(),
  nonCourseBillingBasis: z.string(),
  actualFromToDays: z.number(),
  preliminaryFromToDays: z.number(),
  active: z.boolean(),
  allowReBilling: z.boolean(),
  allowArBilling: z.boolean(),
  includeInArStatements: z.boolean(),
  allowBillingInCampusPortal: z.boolean(),
  runPrelimInCampusPortalOnly: z.boolean(),
  academicRecordsMapped: z.boolean(),
  childrenAssigned: z.boolean(),
  createdByUserId: nullableNumberSchema,
  createdByUserEmail: nullableStringSchema,
  updatedByUserId: nullableNumberSchema,
  updatedByUserEmail: nullableStringSchema,
  createdAt: nullableDateTimeStringSchema,
  updatedAt: nullableDateTimeStringSchema,
});

export type BillingPeriodDetailResponse = z.infer<typeof BillingPeriodDetailResponseSchema>;

const BillingPeriodWriteSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: BillingPeriodTypeSchema,
  status: BillingPeriodStatusSchema,
  academicYearId: z.number().nullable().optional(),
  termId: z.number().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  actualStartPreliminaryEndDate: z.string().nullable().optional(),
  taxAcademicYear: z.string().nullable().optional(),
  taxAcademicYearLabel: z.string().nullable().optional(),
  taxAcademicTermCode: z.string().nullable().optional(),
  taxAcademicTermName: z.string().nullable().optional(),
  financialAidPeriodCode: z.string().nullable().optional(),
  financialAidPeriodName: z.string().nullable().optional(),
  courseBillingBasis: z.string().nullable().optional(),
  nonCourseBillingBasis: z.string().nullable().optional(),
  actualFromToDays: z.number().optional(),
  preliminaryFromToDays: z.number().optional(),
  active: z.boolean().optional(),
  allowReBilling: z.boolean().optional(),
  allowArBilling: z.boolean().optional(),
  includeInArStatements: z.boolean().optional(),
  allowBillingInCampusPortal: z.boolean().optional(),
  runPrelimInCampusPortalOnly: z.boolean().optional(),
  academicRecordsMapped: z.boolean().optional(),
  childrenAssigned: z.boolean().optional(),
});

export const CreateBillingPeriodRequestSchema = BillingPeriodWriteSchema;

export type CreateBillingPeriodRequest = z.infer<typeof CreateBillingPeriodRequestSchema>;

export const PatchBillingPeriodRequestSchema = BillingPeriodWriteSchema.partial();

export type PatchBillingPeriodRequest = z.infer<typeof PatchBillingPeriodRequestSchema>;

export const BillingPeriodRunResponseSchema = z.object({
  billingPeriodRunId: z.number(),
  billingPeriodId: z.number(),
  status: BillingPeriodRunStatusSchema,
  billingPeriodStatusAtRun: BillingPeriodStatusSchema,
  startedAt: nullableDateTimeStringSchema,
  completedAt: nullableDateTimeStringSchema,
  triggerSource: BillingPeriodRunTriggerSourceSchema,
  triggeredByUserId: nullableNumberSchema,
  triggeredByUserEmail: nullableStringSchema,
  message: nullableStringSchema,
  createdByUserId: nullableNumberSchema,
  createdByUserEmail: nullableStringSchema,
  updatedByUserId: nullableNumberSchema,
  updatedByUserEmail: nullableStringSchema,
  createdAt: nullableDateTimeStringSchema,
  updatedAt: nullableDateTimeStringSchema,
});

export type BillingPeriodRunResponse = z.infer<typeof BillingPeriodRunResponseSchema>;

export const BillingPeriodRunListResponseSchema = z.array(BillingPeriodRunResponseSchema);

export type BillingPeriodRunListResponse = z.infer<typeof BillingPeriodRunListResponseSchema>;

export const RunBillingPeriodRequestSchema = z.object({
  message: z.string().nullable().optional(),
});

export type RunBillingPeriodRequest = z.infer<typeof RunBillingPeriodRequestSchema>;

export const RunBillingPeriodResponseSchema = z.object({
  run: BillingPeriodRunResponseSchema,
});

export type RunBillingPeriodResponse = z.infer<typeof RunBillingPeriodResponseSchema>;
