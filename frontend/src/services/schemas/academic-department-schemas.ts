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

export const AcademicDepartmentSortBySchema = z.enum(['code', 'name', 'active']);

export type AcademicDepartmentSortBy = z.infer<typeof AcademicDepartmentSortBySchema>;

export const AcademicDepartmentSortDirectionSchema = z.enum(['asc', 'desc']);

export type AcademicDepartmentSortDirection = z.infer<
  typeof AcademicDepartmentSortDirectionSchema
>;
