import { z } from 'zod';

export const StudentRequirementCourseResponseSchema = z.object({
  courseId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  title: z.string().nullable(),
  credits: z.number().nullable(),
  status: z.string(),
  evidenceType: z.string().nullable(),
  evidenceId: z.number().nullable(),
  plannedCourseId: z.number().nullable(),
  warnings: z.array(z.string()),
});

export type StudentRequirementCourseResponse = z.infer<
  typeof StudentRequirementCourseResponseSchema
>;

export const StudentRequirementMatchedCourseResponseSchema = z.object({
  courseId: z.number().nullable(),
  courseCode: z.string().nullable(),
  title: z.string().nullable(),
  credits: z.number().nullable(),
  status: z.string(),
  source: z.string().nullable(),
  sourceRecordId: z.number().nullable(),
  plannedCourseId: z.number().nullable(),
  plannedTermLabel: z.string().nullable(),
  plannedYearLabel: z.string().nullable(),
});

export type StudentRequirementMatchedCourseResponse = z.infer<
  typeof StudentRequirementMatchedCourseResponseSchema
>;

export const StudentRequirementCourseRuleResponseSchema = z.object({
  requirementCourseRuleId: z.number(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  minimumCourseNumber: z.number().nullable(),
  maximumCourseNumber: z.number().nullable(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  minimumGrade: z.string().nullable(),
});

export type StudentRequirementCourseRuleResponse = z.infer<
  typeof StudentRequirementCourseRuleResponseSchema
>;

export const StudentCompletionRequirementResponseSchema = z.object({
  programVersionRequirementId: z.number(),
  requirementId: z.number().nullable(),
  requirementCode: z.string().nullable(),
  requirementName: z.string().nullable(),
  requirementType: z.string().nullable(),
  requirementDescription: z.string().nullable(),
  completed: z.number(),
  planned: z.number(),
  required: z.number(),
  progressUnit: z.string(),
  minimumCredits: z.number().nullable(),
  minimumCourses: z.number().nullable(),
  courseMatchMode: z.string().nullable(),
  minimumGrade: z.string().nullable(),
  requiredInProgram: z.boolean(),
  sortOrder: z.number().nullable(),
  courseReusePolicy: z.string().nullable(),
  notes: z.string().nullable(),
  rules: z.array(z.string()),
  courseRules: z.array(StudentRequirementCourseRuleResponseSchema),
  matchedCourses: z.array(StudentRequirementMatchedCourseResponseSchema),
  courses: z.array(StudentRequirementCourseResponseSchema),
});

export type StudentCompletionRequirementResponse = z.infer<
  typeof StudentCompletionRequirementResponseSchema
>;

export const StudentProgramCompletionRequirementOptionResponseSchema = z.object({
  programVersionCompletionRequirementOptionId: z.number(),
  requiredProgramTypeId: z.number().nullable(),
  requiredProgramTypeCode: z.string().nullable(),
  requiredProgramTypeName: z.string().nullable(),
  requiredProgramId: z.number().nullable(),
  requiredProgramCode: z.string().nullable(),
  requiredProgramName: z.string().nullable(),
  requiredProgramVersionId: z.number().nullable(),
  requiredProgramVersionNumber: z.number().nullable(),
  requiredProgramVersionProgramCode: z.string().nullable(),
  requiredProgramVersionProgramName: z.string().nullable(),
  satisfied: z.boolean(),
  matchedCount: z.number(),
  completedCount: z.number(),
  plannedCount: z.number(),
  status: z.string(),
});

export type StudentProgramCompletionRequirementOptionResponse = z.infer<
  typeof StudentProgramCompletionRequirementOptionResponseSchema
>;

export const StudentProgramCompletionRequirementResponseSchema = z.object({
  programVersionCompletionRequirementId: z.number(),
  minimumCount: z.number(),
  sortOrder: z.number(),
  notes: z.string().nullable(),
  satisfied: z.boolean(),
  matchedCount: z.number(),
  completedCount: z.number(),
  plannedCount: z.number(),
  status: z.string(),
  options: z.array(StudentProgramCompletionRequirementOptionResponseSchema),
});

export type StudentProgramCompletionRequirementResponse = z.infer<
  typeof StudentProgramCompletionRequirementResponseSchema
>;

export const StudentProgramResponseSchema = z.object({
  studentProgramId: z.number(),
  programId: z.number().nullable(),
  programVersionId: z.number().nullable(),
  programCode: z.string().nullable(),
  programName: z.string().nullable(),
  programTypeCode: z.string().nullable(),
  programTypeName: z.string().nullable(),
  degreeTypeCode: z.string().nullable(),
  degreeTypeName: z.string().nullable(),
  versionNumber: z.number().nullable(),
  classYearStart: z.number().nullable(),
  classYearEnd: z.number().nullable(),
  status: z.string().nullable(),
  declaredDate: z.string().nullable(),
  completedDate: z.string().nullable(),
  completed: z.number(),
  planned: z.number(),
  required: z.number(),
  progressUnit: z.string(),
  requirements: z.array(StudentCompletionRequirementResponseSchema),
  completionRequirements: z.array(StudentProgramCompletionRequirementResponseSchema),
});

export type StudentProgramResponse = z.infer<typeof StudentProgramResponseSchema>;

export const StudentAcademicPlanCourseResponseSchema = z.object({
  studentAcademicPlanCourseId: z.number(),
  courseId: z.number().nullable(),
  studentProgramId: z.number().nullable(),
  requirementId: z.number().nullable(),
  subjectCode: z.string().nullable(),
  courseNumber: z.string().nullable(),
  courseCode: z.string().nullable(),
  title: z.string().nullable(),
  credits: z.number().nullable(),
  plannerBucketCode: z.enum(['FULL_TERM', 'SESSION_A', 'SESSION_B']).nullable(),
  plannerBucketLabel: z.string().nullable(),
  placeholderType: z.string().nullable(),
  placeholderLabel: z.string().nullable(),
  placeholderSubjectCode: z.string().nullable(),
  placeholderDepartmentId: z.number().nullable(),
  placeholderDepartmentCode: z.string().nullable(),
  placeholderMinimumCourseNumber: z.number().nullable(),
  placeholderMaximumCourseNumber: z.number().nullable(),
  requirementName: z.string().nullable(),
  programCode: z.string().nullable(),
  programName: z.string().nullable(),
  status: z.string(),
  sortOrder: z.number().nullable(),
  notes: z.string().nullable(),
  source: z.string().nullable(),
  readOnly: z.boolean(),
  gradeCode: z.string().nullable(),
  completedDate: z.string().nullable(),
  warnings: z.array(z.string()),
});

export type StudentAcademicPlanCourseResponse = z.infer<
  typeof StudentAcademicPlanCourseResponseSchema
>;

export const StudentAcademicPlanTermResponseSchema = z.object({
  studentAcademicPlanTermId: z.number(),
  label: z.string(),
  sortOrder: z.number(),
  complete: z.boolean(),
  source: z.string().nullable(),
  readOnly: z.boolean(),
  plannedCredits: z.number(),
  courses: z.array(StudentAcademicPlanCourseResponseSchema),
});

export type StudentAcademicPlanTermResponse = z.infer<
  typeof StudentAcademicPlanTermResponseSchema
>;

export const StudentAcademicPlanYearResponseSchema = z.object({
  studentAcademicPlanYearId: z.number(),
  label: z.string(),
  sortOrder: z.number(),
  canRemove: z.boolean(),
  source: z.string().nullable(),
  readOnly: z.boolean(),
  plannedCredits: z.number(),
  terms: z.array(StudentAcademicPlanTermResponseSchema),
});

export type StudentAcademicPlanYearResponse = z.infer<
  typeof StudentAcademicPlanYearResponseSchema
>;

export const StudentAcademicPlanResponseSchema = z.object({
  studentAcademicPlanId: z.number(),
  name: z.string(),
  active: z.boolean(),
  years: z.array(StudentAcademicPlanYearResponseSchema),
});

export type StudentAcademicPlanResponse = z.infer<typeof StudentAcademicPlanResponseSchema>;

export const StudentProgramsResponseSchema = z.object({
  studentId: z.number(),
  showSubtermPlanner: z.boolean(),
  programs: z.array(StudentProgramResponseSchema),
  academicPlan: StudentAcademicPlanResponseSchema,
});

export type StudentProgramsResponse = z.infer<typeof StudentProgramsResponseSchema>;

export const ExploreStudentProgramRequestSchema = z.object({
  programId: z.number().int().positive(),
});

export type ExploreStudentProgramRequest = z.infer<
  typeof ExploreStudentProgramRequestSchema
>;

export const StudentAcademicPlanDraftCourseRequestSchema = z.object({
  studentAcademicPlanCourseId: z.number().nullable(),
  courseId: z.number().int().positive().nullable(),
  studentProgramId: z.number().int().positive().nullable(),
  requirementId: z.number().int().positive().nullable(),
  credits: z.number().nonnegative().nullable(),
  plannerBucketCode: z.enum(['FULL_TERM', 'SESSION_A', 'SESSION_B']).nullable(),
  plannerBucketLabel: z.string().max(100).nullable(),
  placeholderType: z.string().max(40).nullable(),
  placeholderLabel: z.string().max(120).nullable(),
  placeholderSubjectCode: z.string().max(20).nullable(),
  placeholderDepartmentId: z.number().int().positive().nullable(),
  placeholderMinimumCourseNumber: z.number().int().nonnegative().nullable(),
  placeholderMaximumCourseNumber: z.number().int().nonnegative().nullable(),
  sortOrder: z.number().int().nonnegative(),
  notes: z.string().max(500).nullable(),
});

export type StudentAcademicPlanDraftCourseRequest = z.infer<
  typeof StudentAcademicPlanDraftCourseRequestSchema
>;

export const StudentAcademicPlanDraftTermRequestSchema = z.object({
  studentAcademicPlanTermId: z.number().nullable(),
  label: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().nonnegative(),
  complete: z.boolean(),
  courses: z.array(StudentAcademicPlanDraftCourseRequestSchema),
});

export type StudentAcademicPlanDraftTermRequest = z.infer<
  typeof StudentAcademicPlanDraftTermRequestSchema
>;

export const StudentAcademicPlanDraftYearRequestSchema = z.object({
  studentAcademicPlanYearId: z.number().nullable(),
  label: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().nonnegative(),
  canRemove: z.boolean(),
  terms: z.array(StudentAcademicPlanDraftTermRequestSchema),
});

export type StudentAcademicPlanDraftYearRequest = z.infer<
  typeof StudentAcademicPlanDraftYearRequestSchema
>;

export const StudentAcademicPlanDraftRequestSchema = z.object({
  studentAcademicPlanId: z.number().nullable(),
  name: z.string().trim().min(1).max(255),
  years: z.array(StudentAcademicPlanDraftYearRequestSchema),
});

export type StudentAcademicPlanDraftRequest = z.infer<
  typeof StudentAcademicPlanDraftRequestSchema
>;

export const ReplaceAcademicPlanPlaceholderCourseRequestSchema = z.object({
  courseId: z.number().int().positive(),
  credits: z.number().nonnegative().nullable(),
});

export type ReplaceAcademicPlanPlaceholderCourseRequest = z.infer<
  typeof ReplaceAcademicPlanPlaceholderCourseRequestSchema
>;
