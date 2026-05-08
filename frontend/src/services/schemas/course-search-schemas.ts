import { z } from 'zod';

export const CourseSearchResultResponseSchema = z.object({
  courseId: z.number(),
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
  lab: z.boolean(),
  currentCourseVersionId: z.number().nullable(),
  currentVersionTitle: z.string().nullable(),
  minCredits: z.number().nullable(),
  maxCredits: z.number().nullable(),
  variableCredit: z.boolean(),
  active: z.boolean(),
});

export type CourseSearchResultResponse = z.infer<typeof CourseSearchResultResponseSchema>;

export const CourseSearchSortBySchema = z.enum([
  'schoolName',
  'departmentName',
  'subjectCode',
  'courseNumber',
  'courseCode',
  'title',
  'active',
]);

export type CourseSearchSortBy = z.infer<typeof CourseSearchSortBySchema>;

export const CourseSearchSortDirectionSchema = z.enum(['asc', 'desc']);

export type CourseSearchSortDirection = z.infer<typeof CourseSearchSortDirectionSchema>;

export const CourseSearchResponseSchema = z.object({
  results: z.array(CourseSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseSearchResponse = z.infer<typeof CourseSearchResponseSchema>;
