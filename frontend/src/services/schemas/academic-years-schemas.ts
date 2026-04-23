import { z } from 'zod';

export const AcademicYearSubTermFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.string(),
});

export type AcademicYearSubTermFormValues = z.infer<typeof AcademicYearSubTermFormValuesSchema>;

export const AcademicTermFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(AcademicYearSubTermFormValuesSchema),
});

export type AcademicTermFormValues = z.infer<typeof AcademicTermFormValuesSchema>;

export const AcademicYearSearchFiltersSchema = z.object({
  query: z.string(),
  yearStatusCode: z.string(),
  currentOnly: z.boolean(),
});

export type AcademicYearSearchFilters = z.infer<typeof AcademicYearSearchFiltersSchema>;

export const initialAcademicYearSearchFilters: AcademicYearSearchFilters = {
  query: '',
  yearStatusCode: '',
  currentOnly: false,
};

export const AcademicYearCreateFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(AcademicTermFormValuesSchema),
});

export type AcademicYearCreateFormValues = z.infer<typeof AcademicYearCreateFormValuesSchema>;

export const AcademicYearAddTermsFormValuesSchema = z.object({
  terms: z.array(AcademicYearSubTermFormValuesSchema),
});

export type AcademicYearAddTermsFormValues = z.infer<typeof AcademicYearAddTermsFormValuesSchema>;

export const AcademicYearDetailFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type AcademicYearDetailFormValues = z.infer<typeof AcademicYearDetailFormValuesSchema>;

export const AcademicTermDetailFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type AcademicTermDetailFormValues = z.infer<
  typeof AcademicTermDetailFormValuesSchema
>;

export const AcademicSubTermDetailFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.string(),
});

export type AcademicSubTermDetailFormValues = z.infer<typeof AcademicSubTermDetailFormValuesSchema>;

export const initialAcademicYearTermFormValues: AcademicYearSubTermFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  sortOrder: '',
};

export const initialAcademicTermFormValues: AcademicTermFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  terms: [],
};

export const initialAcademicYearCreateFormValues: AcademicYearCreateFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  terms: [],
};

export const initialAcademicYearAddTermsFormValues: AcademicYearAddTermsFormValues = {
  terms: [],
};

export const initialAcademicYearDetailFormValues: AcademicYearDetailFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
};

export const initialAcademicTermDetailFormValues: AcademicTermDetailFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
};

export const initialAcademicSubTermDetailFormValues: AcademicSubTermDetailFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  sortOrder: '',
};

export const AcademicYearCreateSubTermRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.number(),
});

export type AcademicYearCreateSubTermRequest = z.infer<typeof AcademicYearCreateSubTermRequestSchema>;

export const AcademicTermCreateRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  subTermIds: z.array(z.number()),
});

export type AcademicTermCreateRequest = z.infer<typeof AcademicTermCreateRequestSchema>;

export const AcademicYearCreateRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(AcademicYearCreateSubTermRequestSchema),
});

export type AcademicYearCreateRequest = z.infer<typeof AcademicYearCreateRequestSchema>;

export const AcademicYearPostSubTermsRequestSchema = z.array(AcademicYearCreateSubTermRequestSchema);

export type AcademicYearPostSubTermsRequest = z.infer<typeof AcademicYearPostSubTermsRequestSchema>;

export const AcademicYearPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export type AcademicYearPatchRequest = z.infer<typeof AcademicYearPatchRequestSchema>;

export const AcademicSubTermPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
});

export type AcademicSubTermPatchRequest = z.infer<typeof AcademicSubTermPatchRequestSchema>;

export const AcademicTermPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  subTermIds: z.array(z.number()).nullable().optional(),
});

export type AcademicTermPatchRequest = z.infer<typeof AcademicTermPatchRequestSchema>;

export const AcademicYearStatusShiftDirectionSchema = z.enum(['UP', 'DOWN']);

export type AcademicYearStatusShiftDirection = z.infer<
  typeof AcademicYearStatusShiftDirectionSchema
>;

export const ShiftAcademicYearStatusRequestSchema = z.object({
  direction: AcademicYearStatusShiftDirectionSchema,
});

export type ShiftAcademicYearStatusRequest = z.infer<typeof ShiftAcademicYearStatusRequestSchema>;

export const AcademicSubTermStatusShiftDirectionSchema = z.enum(['UP', 'DOWN']);

export type AcademicSubTermStatusShiftDirection = z.infer<
  typeof AcademicSubTermStatusShiftDirectionSchema
>;

export const ShiftAcademicSubTermStatusRequestSchema = z.object({
  direction: AcademicSubTermStatusShiftDirectionSchema,
});

export type ShiftAcademicSubTermStatusRequest = z.infer<typeof ShiftAcademicSubTermStatusRequestSchema>;

export const AcademicYearSortBySchema = z.enum([
  'code',
  'name',
  'startDate',
  'endDate',
  'yearStatus',
  'isPublished',
]);

export type AcademicYearSortBy = z.infer<typeof AcademicYearSortBySchema>;

export const AcademicYearSortDirectionSchema = z.enum(['asc', 'desc']);

export type AcademicYearSortDirection = z.infer<typeof AcademicYearSortDirectionSchema>;

export const AcademicYearStatusResponseSchema = z.object({
  code: z.string(),
  name: z.string(),
  order: z.number(),
});

export type AcademicYearStatusResponse = z.infer<typeof AcademicYearStatusResponseSchema>;

export const AcademicYearStatusesResponseSchema = z.array(AcademicYearStatusResponseSchema);

export type AcademicYearStatusesResponse = z.infer<typeof AcademicYearStatusesResponseSchema>;

export const AcademicSubTermStatusResponseSchema = z.object({
  code: z.string(),
  name: z.string(),
  order: z.number(),
});

export type AcademicSubTermStatusResponse = z.infer<typeof AcademicSubTermStatusResponseSchema>;

export const AcademicSubTermStatusesResponseSchema = z.array(AcademicSubTermStatusResponseSchema);

export type AcademicSubTermStatusesResponse = z.infer<typeof AcademicSubTermStatusesResponseSchema>;

export const AcademicYearSearchResultResponseSchema = z.object({
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  yearStatusCode: z.string().nullable(),
  yearStatusName: z.string().nullable(),
  active: z.boolean(),
  isPublished: z.boolean(),
});

export type AcademicYearSearchResultResponse = z.infer<
  typeof AcademicYearSearchResultResponseSchema
>;

export const AcademicYearSearchResponseSchema = z.array(AcademicYearSearchResultResponseSchema);

export type AcademicYearSearchResponse = z.infer<typeof AcademicYearSearchResponseSchema>;

export const AcademicSubTermResponseSchema = z.object({
  subTermId: z.number(),
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.number(),
  subTermStatusCode: z.string().nullable(),
  subTermStatusName: z.string().nullable(),
  active: z.boolean(),
  courseOfferingCount: z.number(),
  lastUpdated: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export type AcademicSubTermResponse = z.infer<typeof AcademicSubTermResponseSchema>;

export const AcademicTermResponseSchema = z.object({
  termId: z.number(),
  name: z.string(),
  code: z.string(),
  academicYearId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  subTerms: z.array(AcademicSubTermResponseSchema),
});

export type AcademicTermResponse = z.infer<typeof AcademicTermResponseSchema>;

export const AcademicYearCreateResponseSchema = z.object({
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  yearStatusId: z.number().nullable().optional(),
  statusCode: z.string().nullable().optional(),
  statusName: z.string().nullable().optional(),
  yearStatusCode: z.string().nullable().optional(),
  yearStatusName: z.string().nullable().optional(),
  yearStatusOrder: z.number().nullable().optional(),
  academicYearStatusCode: z.string().nullable().optional(),
  academicYearStatusName: z.string().nullable().optional(),
  active: z.boolean(),
  isPublished: z.boolean(),
  subTerms: z.array(AcademicSubTermResponseSchema).optional().default([]),
  terms: z.array(AcademicTermResponseSchema).optional().default([]),
});

export type AcademicYearCreateResponse = z.infer<typeof AcademicYearCreateResponseSchema>;

export const AcademicYearCatalogSubTermSummarySchema = z.object({
  subTermId: z.number(),
  code: z.string(),
  name: z.string(),
  courseOfferingCount: z.number(),
});

export type AcademicYearCatalogSubTermSummary = z.infer<typeof AcademicYearCatalogSubTermSummarySchema>;

export const AcademicYearCatalogTermSummarySchema = z.object({
  termId: z.number(),
  code: z.string(),
  name: z.string(),
  subTermCount: z.number(),
  courseOfferingCount: z.number(),
  subTerms: z.array(AcademicYearCatalogSubTermSummarySchema),
});

export type AcademicYearCatalogTermSummary = z.infer<
  typeof AcademicYearCatalogTermSummarySchema
>;

export const AcademicYearCatalogSummaryResponseSchema = z.object({
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termCount: z.number(),
  subTermCount: z.number(),
  courseOfferingCount: z.number(),
  terms: z.array(AcademicYearCatalogTermSummarySchema),
});

export type AcademicYearCatalogSummaryResponse = z.infer<
  typeof AcademicYearCatalogSummaryResponseSchema
>;
