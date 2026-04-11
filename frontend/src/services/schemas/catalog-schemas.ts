import { z } from 'zod';

const NullableString = z.string().nullable();

export const CourseOfferingSearchFiltersSchema = z.object({
  academicYearCode: NullableString,
  termCode: NullableString,
  departmentCode: NullableString,
  subjectCode: NullableString,
  courseCode: z.string(),
  title: z.string(),
  description: z.string(),
});

export type CourseOfferingSearchFilters = z.infer<typeof CourseOfferingSearchFiltersSchema>;

export const initialCourseOfferingSearchFilters: CourseOfferingSearchFilters = {
  academicYearCode: null,
  termCode: null,
  departmentCode: null,
  subjectCode: null,
  courseCode: '',
  title: '',
  description: '',
};

export const CourseOfferingSearchSortBySchema = z.enum([
  'academicYearCode',
  'termCode',
  'departmentCode',
  'subjectCode',
  'courseNumber',
  'courseCode',
  'title',
  'minCredits',
  'maxCredits',
  'variableCredit',
  'offeringStatusCode',
]);

export type CourseOfferingSearchSortBy = z.infer<typeof CourseOfferingSearchSortBySchema>;

export const CourseOfferingSortDirectionSchema = z.enum(['asc', 'desc']);

export type CourseOfferingSortDirection = z.infer<typeof CourseOfferingSortDirectionSchema>;

export const CourseOfferingSearchResultResponseSchema = z.object({
  courseOfferingId: z.number(),
  courseId: z.number(),
  courseVersionId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  subjectCode: z.string(),
  courseNumber: z.string(),
  courseCode: z.string(),
  title: z.string(),
  minCredits: z.number(),
  maxCredits: z.number(),
  variableCredit: z.boolean(),
  offeringStatusCode: z.string(),
  offeringStatusName: z.string(),
});

export type CourseOfferingSearchResultResponse = z.infer<
  typeof CourseOfferingSearchResultResponseSchema
>;

export const CourseOfferingSearchResponseSchema = z.object({
  results: z.array(CourseOfferingSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseOfferingSearchResponse = z.infer<typeof CourseOfferingSearchResponseSchema>;

export const CourseOfferingDetailResponseSchema = z.object({
  courseOfferingId: z.number(),
  courseCode: z.string(),
  title: z.string(),
  catalogDescription: z.string().nullable(),
  minCredits: z.number(),
  maxCredits: z.number(),
  variableCredit: z.boolean(),
  termCode: z.string(),
  termName: z.string(),
  offeringStatusCode: z.string(),
  offeringStatusName: z.string(),
  notes: z.string().nullable(),
});

export type CourseOfferingDetailResponse = z.infer<typeof CourseOfferingDetailResponseSchema>;
