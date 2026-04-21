import { z } from 'zod';

export const AcademicYearCatalogTermSummarySchema = z.object({
  termId: z.number(),
  code: z.string(),
  name: z.string(),
  courseOfferingCount: z.number(),
});

export type AcademicYearCatalogTermSummary = z.infer<typeof AcademicYearCatalogTermSummarySchema>;

export const AcademicYearCatalogTermGroupSummarySchema = z.object({
  termGroupId: z.number(),
  code: z.string(),
  name: z.string(),
  termCount: z.number(),
  courseOfferingCount: z.number(),
  terms: z.array(AcademicYearCatalogTermSummarySchema),
});

export type AcademicYearCatalogTermGroupSummary = z.infer<
  typeof AcademicYearCatalogTermGroupSummarySchema
>;

export const AcademicYearCatalogSummaryResponseSchema = z.object({
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termGroupCount: z.number(),
  termCount: z.number(),
  courseOfferingCount: z.number(),
  termGroups: z.array(AcademicYearCatalogTermGroupSummarySchema),
});

export type AcademicYearCatalogSummaryResponse = z.infer<
  typeof AcademicYearCatalogSummaryResponseSchema
>;

export const AcademicYearCourseOfferingSearchTermSchema = z.object({
  termId: z.number(),
  code: z.string(),
  name: z.string(),
});

export type AcademicYearCourseOfferingSearchTerm = z.infer<
  typeof AcademicYearCourseOfferingSearchTermSchema
>;

export const AcademicYearCourseOfferingSearchResultResponseSchema = z.object({
  courseOfferingId: z.number(),
  courseId: z.number(),
  courseVersionId: z.number(),
  schoolId: z.number().nullable(),
  schoolCode: z.string().nullable(),
  schoolName: z.string().nullable(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  subjectId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  subjectName: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  title: z.string().nullable(),
  minCredits: z.number().nullable(),
  maxCredits: z.number().nullable(),
  variableCredit: z.boolean(),
  terms: z.array(AcademicYearCourseOfferingSearchTermSchema),
  offeringStatusCode: z.string().nullable(),
  offeringStatusName: z.string().nullable(),
});

export type AcademicYearCourseOfferingSearchResultResponse = z.infer<
  typeof AcademicYearCourseOfferingSearchResultResponseSchema
>;

export const AcademicYearCourseOfferingSearchResponseSchema = z.object({
  results: z.array(AcademicYearCourseOfferingSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type AcademicYearCourseOfferingSearchResponse = z.infer<
  typeof AcademicYearCourseOfferingSearchResponseSchema
>;

export const ImportAcademicYearCourseOfferingsResponseSchema = z.object({
  academicYearId: z.number(),
  eligibleCurrentCourseVersionCount: z.number(),
  createdCourseOfferingCount: z.number(),
  skippedExistingCourseOfferingCount: z.number(),
});

export type ImportAcademicYearCourseOfferingsResponse = z.infer<
  typeof ImportAcademicYearCourseOfferingsResponseSchema
>;

export const SyncAcademicYearCourseOfferingsResponseSchema = z.object({
  academicYearId: z.number(),
  scannedCourseOfferingCount: z.number(),
  updatedCourseOfferingCount: z.number(),
  alreadyCurrentCourseOfferingCount: z.number(),
  skippedMissingCurrentCourseVersionCount: z.number(),
  skippedDuplicateCurrentOfferingCount: z.number(),
});

export type SyncAcademicYearCourseOfferingsResponse = z.infer<
  typeof SyncAcademicYearCourseOfferingsResponseSchema
>;

export const AdminCourseOfferingTermDetailResponseSchema = z.object({
  termId: z.number(),
  code: z.string(),
  name: z.string(),
});

export type AdminCourseOfferingTermDetailResponse = z.infer<
  typeof AdminCourseOfferingTermDetailResponseSchema
>;

export const AdminCourseOfferingDetailResponseSchema = z.object({
  courseOfferingId: z.number(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  courseId: z.number(),
  courseVersionId: z.number(),
  courseCode: z.string(),
  title: z.string(),
  catalogDescription: z.string().nullable(),
  minCredits: z.number(),
  maxCredits: z.number(),
  variableCredit: z.boolean(),
  terms: z.array(AdminCourseOfferingTermDetailResponseSchema),
  offeringStatusCode: z.string(),
  offeringStatusName: z.string(),
  notes: z.string().nullable(),
});

export type AdminCourseOfferingDetailResponse = z.infer<
  typeof AdminCourseOfferingDetailResponseSchema
>;

export const CreateAcademicYearCourseOfferingRequestSchema = z.object({
  courseId: z.number(),
  termIds: z.array(z.number()),
  notes: z.string().nullable().optional(),
});

export type CreateAcademicYearCourseOfferingRequest = z.infer<
  typeof CreateAcademicYearCourseOfferingRequestSchema
>;

export const PatchCourseOfferingRequestSchema = z.object({
  courseOfferingId: z.number().nullable().optional(),
  termIds: z.array(z.number()).nullable().optional(),
  offeringStatusCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type PatchCourseOfferingRequest = z.infer<typeof PatchCourseOfferingRequestSchema>;
