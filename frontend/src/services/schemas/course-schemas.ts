import { z } from 'zod';

export const CreateCourseVersionRequestSchema = z.object({
  title: z.string().trim().min(1).max(255),
  catalogDescription: z.string().nullable(),
  minCredits: z.number().nonnegative(),
  maxCredits: z.number().nonnegative(),
  variableCredit: z.boolean(),
});

export type CreateCourseVersionRequest = z.infer<typeof CreateCourseVersionRequestSchema>;

export const CourseVersionDetailResponseSchema = z.object({
  courseVersionId: z.number(),
  courseId: z.number().nullable(),
  subjectId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  versionNumber: z.number(),
  title: z.string(),
  catalogDescription: z.string().nullable(),
  minCredits: z.number(),
  maxCredits: z.number(),
  variableCredit: z.boolean(),
  current: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type CourseVersionDetailResponse = z.infer<typeof CourseVersionDetailResponseSchema>;

export const CourseVersionSearchSortBySchema = z.enum([
  'versionNumber',
  'title',
  'credits',
  'current',
]);

export type CourseVersionSearchSortBy = z.infer<typeof CourseVersionSearchSortBySchema>;

export const CourseVersionSearchSortDirectionSchema = z.enum(['asc', 'desc']);

export type CourseVersionSearchSortDirection = z.infer<
  typeof CourseVersionSearchSortDirectionSchema
>;

export const CourseVersionSearchResponseSchema = z.object({
  courseId: z.number().nullable(),
  subjectId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  results: z.array(CourseVersionDetailResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseVersionSearchResponse = z.infer<typeof CourseVersionSearchResponseSchema>;

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
