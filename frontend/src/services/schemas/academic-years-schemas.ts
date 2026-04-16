import { z } from 'zod';

export const AcademicYearTermFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.string(),
});

export type AcademicYearTermFormValues = z.infer<typeof AcademicYearTermFormValuesSchema>;

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
  terms: z.array(AcademicYearTermFormValuesSchema),
});

export type AcademicYearCreateFormValues = z.infer<typeof AcademicYearCreateFormValuesSchema>;

export const AcademicYearAddTermsFormValuesSchema = z.object({
  terms: z.array(AcademicYearTermFormValuesSchema),
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
  sortOrder: z.string(),
});

export type AcademicTermDetailFormValues = z.infer<typeof AcademicTermDetailFormValuesSchema>;

export const initialAcademicYearTermFormValues: AcademicYearTermFormValues = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  sortOrder: '',
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
  sortOrder: '',
};

export const AcademicYearCreateTermRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.number(),
});

export type AcademicYearCreateTermRequest = z.infer<typeof AcademicYearCreateTermRequestSchema>;

export const AcademicYearCreateRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(AcademicYearCreateTermRequestSchema),
});

export type AcademicYearCreateRequest = z.infer<typeof AcademicYearCreateRequestSchema>;

export const AcademicYearPostTermsRequestSchema = z.array(AcademicYearCreateTermRequestSchema);

export type AcademicYearPostTermsRequest = z.infer<typeof AcademicYearPostTermsRequestSchema>;

export const AcademicYearPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export type AcademicYearPatchRequest = z.infer<typeof AcademicYearPatchRequestSchema>;

export const AcademicTermPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
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

export const AcademicTermStatusShiftDirectionSchema = z.enum(['UP', 'DOWN']);

export type AcademicTermStatusShiftDirection = z.infer<
  typeof AcademicTermStatusShiftDirectionSchema
>;

export const ShiftAcademicTermStatusRequestSchema = z.object({
  direction: AcademicTermStatusShiftDirectionSchema,
});

export type ShiftAcademicTermStatusRequest = z.infer<typeof ShiftAcademicTermStatusRequestSchema>;

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

export const AcademicTermStatusResponseSchema = z.object({
  code: z.string(),
  name: z.string(),
  order: z.number(),
});

export type AcademicTermStatusResponse = z.infer<typeof AcademicTermStatusResponseSchema>;

export const AcademicTermStatusesResponseSchema = z.array(AcademicTermStatusResponseSchema);

export type AcademicTermStatusesResponse = z.infer<typeof AcademicTermStatusesResponseSchema>;

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

export const AcademicTermResponseSchema = z.object({
  termId: z.number(),
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.number(),
  termStatusCode: z.string().nullable(),
  termStatusName: z.string().nullable(),
  active: z.boolean(),
  lastUpdated: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
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
  terms: z.array(AcademicTermResponseSchema),
});

export type AcademicYearCreateResponse = z.infer<typeof AcademicYearCreateResponseSchema>;
