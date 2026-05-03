import { z } from 'zod';

export const CourseVersionRequisiteTypeSchema = z.enum(['PREREQUISITE', 'COREQUISITE']);

export type CourseVersionRequisiteType = z.infer<typeof CourseVersionRequisiteTypeSchema>;

export const CourseVersionRequisiteConditionTypeSchema = z.enum(['ALL', 'ANY']);

export type CourseVersionRequisiteConditionType = z.infer<
  typeof CourseVersionRequisiteConditionTypeSchema
>;

export const CreateCourseVersionRequisiteCourseRequestSchema = z.object({
  courseId: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative().nullable().optional(),
});

export type CreateCourseVersionRequisiteCourseRequest = z.infer<
  typeof CreateCourseVersionRequisiteCourseRequestSchema
>;

export const CreateCourseVersionRequisiteGroupRequestSchema = z
  .object({
    requisiteType: CourseVersionRequisiteTypeSchema,
    conditionType: CourseVersionRequisiteConditionTypeSchema,
    minimumRequired: z.number().int().positive().nullable().optional(),
    sortOrder: z.number().int().nonnegative().nullable().optional(),
    courses: z.array(CreateCourseVersionRequisiteCourseRequestSchema).min(1),
  })
  .superRefine((value, context) => {
    if (value.conditionType === 'ALL' && value.minimumRequired != null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minimumRequired'],
        message: 'Minimum required can only be set for ANY conditions.',
      });
    }

    if (value.conditionType === 'ANY') {
      if (value.minimumRequired == null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['minimumRequired'],
          message: 'Minimum required is required for ANY conditions.',
        });
      } else if (value.minimumRequired > value.courses.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['minimumRequired'],
          message: 'Minimum required cannot exceed the number of courses.',
        });
      }
    }
  });

export type CreateCourseVersionRequisiteGroupRequest = z.infer<
  typeof CreateCourseVersionRequisiteGroupRequestSchema
>;

export const CreateCourseVersionRequestSchema = z.object({
  title: z.string().trim().min(1).max(255),
  catalogDescription: z.string().nullable(),
  minCredits: z.number().nonnegative(),
  maxCredits: z.number().nonnegative(),
  variableCredit: z.boolean(),
  requisites: z.array(CreateCourseVersionRequisiteGroupRequestSchema).nullable().optional(),
});

export type CreateCourseVersionRequest = z.infer<typeof CreateCourseVersionRequestSchema>;

export const CreateAssociatedLabCourseRequestSchema = z.object({
  courseNumber: z.string().trim().min(1).max(20),
  active: z.boolean().nullable().optional(),
  bidirectionalCorequisite: z.boolean(),
  initialVersion: CreateCourseVersionRequestSchema,
});

export type CreateAssociatedLabCourseRequest = z.infer<
  typeof CreateAssociatedLabCourseRequestSchema
>;

export const CreateCourseRequestSchema = z.object({
  subjectId: z.number().int().positive(),
  courseNumber: z.string().trim().min(1).max(20),
  lab: z.boolean().nullable().optional(),
  active: z.boolean().nullable(),
  initialVersion: CreateCourseVersionRequestSchema,
  associatedLab: CreateAssociatedLabCourseRequestSchema.nullable().optional(),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

export const CourseVersionRequisiteCourseResponseSchema = z.object({
  courseVersionRequisiteCourseId: z.number(),
  courseId: z.number().nullable(),
  subjectId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  lab: z.boolean(),
  sortOrder: z.number(),
});

export type CourseVersionRequisiteCourseResponse = z.infer<
  typeof CourseVersionRequisiteCourseResponseSchema
>;

export const CourseVersionRequisiteGroupResponseSchema = z.object({
  courseVersionRequisiteGroupId: z.number(),
  requisiteType: CourseVersionRequisiteTypeSchema,
  conditionType: CourseVersionRequisiteConditionTypeSchema,
  minimumRequired: z.number().nullable(),
  sortOrder: z.number(),
  courses: z.array(CourseVersionRequisiteCourseResponseSchema),
});

export type CourseVersionRequisiteGroupResponse = z.infer<
  typeof CourseVersionRequisiteGroupResponseSchema
>;

export type CourseVersionDetailResponse = z.infer<typeof CourseVersionDetailResponseSchema>;

export const CourseVersionDetailResponseSchema: z.ZodType<{
  courseVersionId: number;
  courseId: number | null;
  subjectId: number | null;
  subjectCode: string | null;
  courseNumber: string | null;
  courseCode: string | null;
  lab: boolean;
  versionNumber: number;
  title: string;
  catalogDescription: string | null;
  minCredits: number;
  maxCredits: number;
  variableCredit: boolean;
  current: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  requisites?: CourseVersionRequisiteGroupResponse[] | null;
  associatedLab?: CourseVersionDetailResponse | null;
}> = z.object({
  courseVersionId: z.number(),
  courseId: z.number().nullable(),
  subjectId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  lab: z.boolean(),
  versionNumber: z.number(),
  title: z.string(),
  catalogDescription: z.string().nullable(),
  minCredits: z.number(),
  maxCredits: z.number(),
  variableCredit: z.boolean(),
  current: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  requisites: z.array(CourseVersionRequisiteGroupResponseSchema).nullable().optional(),
  associatedLab: z.lazy(() => CourseVersionDetailResponseSchema).nullable().optional(),
});

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
  lab: z.boolean(),
  results: z.array(CourseVersionDetailResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseVersionSearchResponse = z.infer<typeof CourseVersionSearchResponseSchema>;
