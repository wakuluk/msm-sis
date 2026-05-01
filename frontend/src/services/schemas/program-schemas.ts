import { z } from 'zod';

export const RequirementCourseResponseSchema = z.object({
  requirementCourseId: z.number(),
  courseId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  required: z.boolean(),
  minimumGrade: z.string().nullable(),
});

export type RequirementCourseResponse = z.infer<typeof RequirementCourseResponseSchema>;

export const RequirementCourseRuleResponseSchema = z.object({
  requirementCourseRuleId: z.number(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  minimumCourseNumber: z.number().nullable(),
  maximumCourseNumber: z.number().nullable(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  minimumGrade: z.string().nullable(),
});

export type RequirementCourseRuleResponse = z.infer<typeof RequirementCourseRuleResponseSchema>;

export const ProgramVersionRequirementResponseSchema = z.object({
  programVersionRequirementId: z.number(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  requirementType: z.string().nullable(),
  requirementDescription: z.string().nullable(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  courseMatchMode: z.string().nullable(),
  minimumGrade: z.string().nullable(),
  requirementCourses: z.array(RequirementCourseResponseSchema),
  requirementCourseRules: z.array(RequirementCourseRuleResponseSchema),
  sortOrder: z.number(),
  required: z.boolean(),
  notes: z.string().nullable(),
});

export type ProgramVersionRequirementResponse = z.infer<
  typeof ProgramVersionRequirementResponseSchema
>;

export const ProgramVersionDetailResponseSchema = z.object({
  programVersionId: z.number(),
  versionNumber: z.number(),
  published: z.boolean(),
  classYearStart: z.number(),
  classYearEnd: z.number().nullable(),
  notes: z.string().nullable(),
  requirements: z.array(ProgramVersionRequirementResponseSchema),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type ProgramVersionDetailResponse = z.infer<typeof ProgramVersionDetailResponseSchema>;

export const ProgramDetailResponseSchema = z.object({
  programId: z.number(),
  programTypeId: z.number().nullable(),
  programTypeCode: z.string().nullable(),
  programTypeName: z.string().nullable(),
  degreeTypeId: z.number().nullable(),
  degreeTypeCode: z.string().nullable(),
  degreeTypeName: z.string().nullable(),
  schoolId: z.number().nullable(),
  schoolCode: z.string().nullable(),
  schoolName: z.string().nullable(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  versions: z.array(ProgramVersionDetailResponseSchema),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type ProgramDetailResponse = z.infer<typeof ProgramDetailResponseSchema>;

export const ProgramSearchResultResponseSchema = z.object({
  programId: z.number(),
  programTypeId: z.number().nullable(),
  programTypeCode: z.string().nullable(),
  programTypeName: z.string().nullable(),
  degreeTypeId: z.number().nullable(),
  degreeTypeCode: z.string().nullable(),
  degreeTypeName: z.string().nullable(),
  schoolId: z.number().nullable(),
  schoolCode: z.string().nullable(),
  schoolName: z.string().nullable(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  currentVersionNumber: z.number().nullable(),
  currentVersionPublished: z.boolean().nullable(),
  currentClassYearStart: z.number().nullable(),
  currentClassYearEnd: z.number().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type ProgramSearchResultResponse = z.infer<typeof ProgramSearchResultResponseSchema>;

export const ProgramSearchResponseSchema = z.object({
  results: z.array(ProgramSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type ProgramSearchResponse = z.infer<typeof ProgramSearchResponseSchema>;

export const ProgramSearchSortBySchema = z.enum([
  'programTypeName',
  'degreeTypeName',
  'schoolName',
  'departmentName',
  'code',
  'name',
  'createdAt',
  'updatedAt',
]);

export type ProgramSearchSortBy = z.infer<typeof ProgramSearchSortBySchema>;

export const ProgramSearchSortDirectionSchema = z.enum(['asc', 'desc']);

export type ProgramSearchSortDirection = z.infer<typeof ProgramSearchSortDirectionSchema>;

export const CreateProgramVersionRequestSchema = z.object({
  published: z.boolean().nullable(),
  classYearStart: z.number().int().min(1900),
  classYearEnd: z.number().int().min(1900).nullable(),
  notes: z.string().max(500).nullable(),
});

export type CreateProgramVersionRequest = z.infer<typeof CreateProgramVersionRequestSchema>;

export const CreateProgramRequestSchema = z.object({
  schoolId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  programTypeId: z.number().int().positive(),
  degreeTypeId: z.number().int().positive().nullable(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  description: z.string().nullable(),
  initialVersion: CreateProgramVersionRequestSchema,
});

export type CreateProgramRequest = z.infer<typeof CreateProgramRequestSchema>;

export const CreateProgramResponseSchema = z.object({
  programId: z.number(),
  programVersionId: z.number(),
});

export type CreateProgramResponse = z.infer<typeof CreateProgramResponseSchema>;

export const RequirementSearchResultResponseSchema = z.object({
  requirementId: z.number(),
  code: z.string(),
  name: z.string(),
  requirementType: z.string(),
  description: z.string().nullable(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  courseMatchMode: z.string().nullable(),
  minimumGrade: z.string().nullable(),
  requirementCourseCount: z.number(),
  requirementCourseRuleCount: z.number(),
});

export type RequirementSearchResultResponse = z.infer<
  typeof RequirementSearchResultResponseSchema
>;

export const RequirementSearchResponseSchema = z.object({
  results: z.array(RequirementSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type RequirementSearchResponse = z.infer<typeof RequirementSearchResponseSchema>;

export const RequirementDetailResponseSchema = z.object({
  requirementId: z.number(),
  code: z.string(),
  name: z.string(),
  requirementType: z.string(),
  description: z.string().nullable(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  courseMatchMode: z.string().nullable(),
  minimumGrade: z.string().nullable(),
  requirementCourses: z.array(RequirementCourseResponseSchema),
  requirementCourseRules: z.array(RequirementCourseRuleResponseSchema),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type RequirementDetailResponse = z.infer<typeof RequirementDetailResponseSchema>;

export const UpsertRequirementCourseRequestSchema = z.object({
  courseId: z.number().int().positive(),
  minimumGrade: z.string().max(10).nullable(),
});

export type UpsertRequirementCourseRequest = z.infer<
  typeof UpsertRequirementCourseRequestSchema
>;

export const UpsertRequirementCourseRuleRequestSchema = z.object({
  departmentId: z.number().int().positive(),
  minimumCourseNumber: z.number().int().nonnegative().nullable(),
  maximumCourseNumber: z.number().int().nonnegative().nullable(),
  minimumCredits: z.number().nonnegative().nullable(),
  minimumCourses: z.number().int().nonnegative().nullable(),
  minimumGrade: z.string().max(10).nullable(),
});

export type UpsertRequirementCourseRuleRequest = z.infer<
  typeof UpsertRequirementCourseRuleRequestSchema
>;

export const CreateRequirementRequestSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  requirementType: z.string().trim().min(1).max(50),
  description: z.string().nullable(),
  minimumCredits: z.number().nonnegative().nullable(),
  minimumCourses: z.number().int().nonnegative().nullable(),
  courseMatchMode: z.string().max(50).nullable(),
  minimumGrade: z.string().max(10).nullable(),
  requirementCourses: z.array(UpsertRequirementCourseRequestSchema),
  requirementCourseRules: z.array(UpsertRequirementCourseRuleRequestSchema),
});

export type CreateRequirementRequest = z.infer<typeof CreateRequirementRequestSchema>;

export const PatchRequirementRequestSchema = CreateRequirementRequestSchema.partial();

export type PatchRequirementRequest = z.infer<typeof PatchRequirementRequestSchema>;
