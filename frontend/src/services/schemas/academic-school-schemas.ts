import { z } from 'zod';
import { AcademicDepartmentResponseSchema } from './academic-department-schemas';

export const AcademicSchoolResponseSchema = z.object({
  schoolId: z.number(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  departments: z.array(AcademicDepartmentResponseSchema),
});

export type AcademicSchoolResponse = z.infer<typeof AcademicSchoolResponseSchema>;

export const AcademicSchoolsResponseSchema = z.array(AcademicSchoolResponseSchema);

export type AcademicSchoolsResponse = z.infer<typeof AcademicSchoolsResponseSchema>;

export const AcademicSchoolSearchFiltersSchema = z.object({
  schoolId: z.string(),
  departmentId: z.string(),
});

export type AcademicSchoolSearchFilters = z.infer<typeof AcademicSchoolSearchFiltersSchema>;

export const initialAcademicSchoolSearchFilters: AcademicSchoolSearchFilters = {
  schoolId: '',
  departmentId: '',
};

export const AcademicSchoolDepartmentSearchResultResponseSchema = z.object({
  schoolId: z.number(),
  schoolCode: z.string(),
  schoolName: z.string(),
  schoolActive: z.boolean(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  departmentActive: z.boolean(),
});

export type AcademicSchoolDepartmentSearchResultResponse = z.infer<
  typeof AcademicSchoolDepartmentSearchResultResponseSchema
>;

export const AcademicSchoolDepartmentSearchResponseSchema = z.array(
  AcademicSchoolDepartmentSearchResultResponseSchema
);

export type AcademicSchoolDepartmentSearchResponse = z.infer<
  typeof AcademicSchoolDepartmentSearchResponseSchema
>;
