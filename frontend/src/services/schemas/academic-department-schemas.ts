import { z } from 'zod';

export const AcademicDepartmentSubjectResponseSchema = z.object({
  subjectId: z.number(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
});

export type AcademicDepartmentSubjectResponse = z.infer<
  typeof AcademicDepartmentSubjectResponseSchema
>;

export const CourseResponseSchema = z.object({
  courseId: z.number(),
  subjectId: z.number().nullable(),
  courseNumber: z.string(),
  currentVersionTitle: z.string().nullable(),
  active: z.boolean().nullable(),
});

export type CourseResponse = z.infer<typeof CourseResponseSchema>;

export const SubjectCoursesResponseSchema = z.array(CourseResponseSchema);

export type SubjectCoursesResponse = z.infer<typeof SubjectCoursesResponseSchema>;

export const AcademicDepartmentDetailFormValuesSchema = z.object({
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
});

export type AcademicDepartmentDetailFormValues = z.infer<
  typeof AcademicDepartmentDetailFormValuesSchema
>;

export const initialAcademicDepartmentDetailFormValues: AcademicDepartmentDetailFormValues = {
  code: '',
  name: '',
  active: true,
};

export const AcademicDepartmentResponseSchema = z.object({
  departmentId: z.number(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  schoolId: z.number().nullable(),
  schoolCode: z.string().nullable(),
  schoolName: z.string().nullable(),
  subjects: z.array(AcademicDepartmentSubjectResponseSchema),
});

export type AcademicDepartmentResponse = z.infer<typeof AcademicDepartmentResponseSchema>;

export const AcademicDepartmentsResponseSchema = z.array(AcademicDepartmentResponseSchema);

export type AcademicDepartmentsResponse = z.infer<typeof AcademicDepartmentsResponseSchema>;

export const AcademicDepartmentPatchRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export type AcademicDepartmentPatchRequest = z.infer<
  typeof AcademicDepartmentPatchRequestSchema
>;

export const CreateAcademicSubjectRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type CreateAcademicSubjectRequest = z.infer<typeof CreateAcademicSubjectRequestSchema>;

export const initialCreateAcademicSubjectRequest: CreateAcademicSubjectRequest = {
  code: '',
  name: '',
};

export const AcademicDepartmentSortBySchema = z.enum(['code', 'name', 'active']);

export type AcademicDepartmentSortBy = z.infer<typeof AcademicDepartmentSortBySchema>;

export const AcademicDepartmentSortDirectionSchema = z.enum(['asc', 'desc']);

export type AcademicDepartmentSortDirection = z.infer<
  typeof AcademicDepartmentSortDirectionSchema
>;
