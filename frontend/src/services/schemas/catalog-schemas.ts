import { z } from 'zod';

const NullableString = z.string().nullable();

export const CourseOfferingSearchFiltersSchema = z.object({
  academicYearCode: NullableString,
  subTermCode: NullableString,
  departmentCode: NullableString,
  subjectCode: NullableString,
  courseCode: z.string(),
  title: z.string(),
  description: z.string(),
});

export type CourseOfferingSearchFilters = z.infer<typeof CourseOfferingSearchFiltersSchema>;

export const initialCourseOfferingSearchFilters: CourseOfferingSearchFilters = {
  academicYearCode: null,
  subTermCode: null,
  departmentCode: null,
  subjectCode: null,
  courseCode: '',
  title: '',
  description: '',
};

export const CourseOfferingSearchSortBySchema = z.enum([
  'academicYearCode',
  'subTermCode',
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
  subTermCode: z.string(),
  subTermName: z.string(),
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

export const CourseOfferingSearchResultsListSchema = z.array(
  CourseOfferingSearchResultResponseSchema
);

export type CourseOfferingSearchResultsList = z.infer<
  typeof CourseOfferingSearchResultsListSchema
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
  subTerms: z.array(
    z.object({
      subTermId: z.number(),
      code: z.string(),
      name: z.string(),
    })
  ),
  offeringStatusCode: z.string(),
  offeringStatusName: z.string(),
  notes: z.string().nullable(),
});

export type CourseOfferingDetailResponse = z.infer<typeof CourseOfferingDetailResponseSchema>;
