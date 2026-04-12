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
  active: z.enum(['', 'true', 'false']),
  currentOnly: z.boolean(),
});

export type AcademicYearSearchFilters = z.infer<typeof AcademicYearSearchFiltersSchema>;

export const initialAcademicYearSearchFilters: AcademicYearSearchFilters = {
  query: '',
  active: '',
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

export const AcademicYearSortBySchema = z.enum([
  'code',
  'name',
  'startDate',
  'endDate',
  'active',
  'isPublished',
]);

export type AcademicYearSortBy = z.infer<typeof AcademicYearSortBySchema>;

export const AcademicYearSortDirectionSchema = z.enum(['asc', 'desc']);

export type AcademicYearSortDirection = z.infer<typeof AcademicYearSortDirectionSchema>;

export const AcademicYearSearchResultResponseSchema = z.object({
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
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
});

export type AcademicTermResponse = z.infer<typeof AcademicTermResponseSchema>;

export const AcademicYearCreateResponseSchema = z.object({
  academicYearId: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  active: z.boolean(),
  isPublished: z.boolean(),
  terms: z.array(AcademicTermResponseSchema),
});

export type AcademicYearCreateResponse = z.infer<typeof AcademicYearCreateResponseSchema>;
