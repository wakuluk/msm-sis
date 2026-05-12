import { z } from 'zod';

const NullableDateStringSchema = z.string().nullable();
const NullableNumberSchema = z.number().nullable();

export const CodeNameRegistrationOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
});

export type CodeNameRegistrationOptionResponse = z.infer<
  typeof CodeNameRegistrationOptionResponseSchema
>;

export const RegistrationGroupReferenceOptionResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type RegistrationGroupReferenceOptionResponse = z.infer<
  typeof RegistrationGroupReferenceOptionResponseSchema
>;

export const RegistrationGroupTermOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type RegistrationGroupTermOptionResponse = z.infer<
  typeof RegistrationGroupTermOptionResponseSchema
>;

export const RegistrationGroupAcademicYearOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(RegistrationGroupTermOptionResponseSchema),
});

export type RegistrationGroupAcademicYearOptionResponse = z.infer<
  typeof RegistrationGroupAcademicYearOptionResponseSchema
>;

export const RegistrationGroupStatusOptionResponseSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export type RegistrationGroupStatusOptionResponse = z.infer<
  typeof RegistrationGroupStatusOptionResponseSchema
>;

export const RegistrationGroupReferenceOptionsResponseSchema = z.object({
  academicYears: z.array(RegistrationGroupAcademicYearOptionResponseSchema),
  academicDivisions: z.array(CodeNameRegistrationOptionResponseSchema),
  athleticSports: z.array(CodeNameRegistrationOptionResponseSchema),
  statuses: z.array(RegistrationGroupStatusOptionResponseSchema),
});

export type RegistrationGroupReferenceOptionsResponse = z.infer<
  typeof RegistrationGroupReferenceOptionsResponseSchema
>;

export const RegistrationGroupSearchResultResponseSchema = z.object({
  registrationGroupId: z.number(),
  name: z.string(),
  academicYearId: NullableNumberSchema,
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: NullableNumberSchema,
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  registrationOpensAt: NullableDateStringSchema,
  registrationClosesAt: NullableDateStringSchema,
  generationId: NullableNumberSchema,
  generationName: z.string().nullable(),
  createdFrom: z.string().nullable(),
  studentCount: z.number(),
});

export type RegistrationGroupSearchResultResponse = z.infer<
  typeof RegistrationGroupSearchResultResponseSchema
>;

export const RegistrationGroupSearchPageResponseSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type RegistrationGroupSearchPageResponse = z.infer<
  typeof RegistrationGroupSearchPageResponseSchema
>;

export const RegistrationGroupSearchResponseSchema = z.object({
  page: RegistrationGroupSearchPageResponseSchema,
  results: z.array(RegistrationGroupSearchResultResponseSchema),
});

export type RegistrationGroupSearchResponse = z.infer<
  typeof RegistrationGroupSearchResponseSchema
>;

export const UnassignedRegistrationGroupStudentResponseSchema = z.object({
  studentId: z.number(),
  studentNumber: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  academicDivisionCode: z.string().nullable(),
  academicDivisionName: z.string().nullable(),
  classStandingId: z.number().nullable(),
  classStandingName: z.string().nullable(),
  programNames: z.array(z.string()),
  honors: z.boolean(),
  athleticSports: z.array(CodeNameRegistrationOptionResponseSchema),
  completedCredits: z.number(),
  currentCredits: z.number(),
  transferCredits: z.number(),
  totalCredits: z.number(),
});

export type UnassignedRegistrationGroupStudentResponse = z.infer<
  typeof UnassignedRegistrationGroupStudentResponseSchema
>;

export const UnassignedRegistrationGroupStudentSearchResponseSchema = z.object({
  page: RegistrationGroupSearchPageResponseSchema,
  unassignedStudentCount: z.number(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  results: z.array(UnassignedRegistrationGroupStudentResponseSchema),
});

export type UnassignedRegistrationGroupStudentSearchResponse = z.infer<
  typeof UnassignedRegistrationGroupStudentSearchResponseSchema
>;

export const RegistrationGroupExistingAssignmentResponseSchema = z.object({
  registrationGroupId: z.number(),
  groupName: z.string(),
  statusCode: z.string(),
  statusName: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
});

export type RegistrationGroupExistingAssignmentResponse = z.infer<
  typeof RegistrationGroupExistingAssignmentResponseSchema
>;

export const RegistrationGroupBuilderPreviewStudentResponseSchema = z.object({
  studentId: z.number(),
  studentNumber: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  academicDivisionId: NullableNumberSchema,
  academicDivisionCode: z.string().nullable(),
  academicDivisionName: z.string().nullable(),
  classStandingId: z.number().nullable(),
  classStandingName: z.string().nullable(),
  estimatedGradDate: z.string().nullable(),
  programNames: z.array(z.string()),
  honors: z.boolean(),
  athleticSports: z.array(CodeNameRegistrationOptionResponseSchema),
  completedCredits: z.number(),
  currentCredits: z.number(),
  transferCredits: z.number(),
  totalCredits: z.number(),
  existingAssignment: RegistrationGroupExistingAssignmentResponseSchema.nullable(),
});

export type RegistrationGroupBuilderPreviewStudentResponse = z.infer<
  typeof RegistrationGroupBuilderPreviewStudentResponseSchema
>;

export const RegistrationGroupBuilderPreviewGroupResponseSchema = z.object({
  temporaryGroupId: z.string(),
  name: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  studentCount: z.number(),
  totalCredits: z.number(),
  students: z.array(RegistrationGroupBuilderPreviewStudentResponseSchema),
});

export type RegistrationGroupBuilderPreviewGroupResponse = z.infer<
  typeof RegistrationGroupBuilderPreviewGroupResponseSchema
>;

export const RegistrationGroupBuilderPreviewResponseSchema = z.object({
  matchingStudentCount: z.number(),
  splitCount: z.number(),
  groups: z.array(RegistrationGroupBuilderPreviewGroupResponseSchema),
});

export type RegistrationGroupBuilderPreviewResponse = z.infer<
  typeof RegistrationGroupBuilderPreviewResponseSchema
>;

export const RegistrationGroupRegistrationWindowResponseSchema = z.object({
  opensAt: NullableDateStringSchema,
  closesAt: NullableDateStringSchema,
});

export type RegistrationGroupRegistrationWindowResponse = z.infer<
  typeof RegistrationGroupRegistrationWindowResponseSchema
>;

export const RegistrationGroupDetailSummaryResponseSchema = z.object({
  registrationGroupId: z.number(),
  name: z.string(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  academicYearId: NullableNumberSchema,
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: NullableNumberSchema,
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  generationId: NullableNumberSchema,
  generationName: z.string().nullable(),
});

export type RegistrationGroupDetailSummaryResponse = z.infer<
  typeof RegistrationGroupDetailSummaryResponseSchema
>;

export const RegistrationGroupSavedSearchCriteriaResponseSchema = z.object({
  generationId: z.number(),
  name: z.string(),
  academicYearId: NullableNumberSchema,
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: NullableNumberSchema,
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  studentSearchText: z.string().nullable(),
  programSearchText: z.string().nullable(),
  groupNamePrefix: z.string().nullable(),
  academicDivision: CodeNameRegistrationOptionResponseSchema.nullable(),
  honorsFilter: z.string(),
  athleteFilter: z.string(),
  existingGroupFilter: z.string(),
  minCredits: z.number().nullable(),
  maxCredits: z.number().nullable(),
  includeCurrentCredits: z.boolean(),
  includeTransferCredits: z.boolean(),
  splitCount: z.number().nullable(),
  matchedStudentCount: z.number().nullable(),
  athleticSports: z.array(CodeNameRegistrationOptionResponseSchema),
});

export type RegistrationGroupSavedSearchCriteriaResponse = z.infer<
  typeof RegistrationGroupSavedSearchCriteriaResponseSchema
>;

export const RegistrationGroupDetailCountsResponseSchema = z.object({
  assignedStudentCount: z.number(),
  matchedStudentCount: z.number().nullable(),
  splitCount: z.number().nullable(),
});

export type RegistrationGroupDetailCountsResponse = z.infer<
  typeof RegistrationGroupDetailCountsResponseSchema
>;

export const RegistrationGroupAssignedStudentResponseSchema = z.object({
  registrationGroupStudentId: z.number(),
  studentId: z.number(),
  studentNumber: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  classStandingId: z.number().nullable(),
  classStandingName: z.string().nullable(),
  estimatedGradDate: z.string().nullable(),
  assignmentSource: z.string(),
  assignedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type RegistrationGroupAssignedStudentResponse = z.infer<
  typeof RegistrationGroupAssignedStudentResponseSchema
>;

export const RegistrationGroupDetailResponseSchema = z.object({
  summary: RegistrationGroupDetailSummaryResponseSchema,
  registrationWindow: RegistrationGroupRegistrationWindowResponseSchema,
  searchCriteria: RegistrationGroupSavedSearchCriteriaResponseSchema.nullable(),
  counts: RegistrationGroupDetailCountsResponseSchema,
  students: z.array(RegistrationGroupAssignedStudentResponseSchema),
});

export type RegistrationGroupDetailResponse = z.infer<
  typeof RegistrationGroupDetailResponseSchema
>;

export const RegistrationGroupGenerationCreatedGroupResponseSchema = z.object({
  registrationGroupId: z.number(),
  temporaryGroupId: z.string().nullable(),
  name: z.string(),
  statusCode: z.string(),
  statusName: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  registrationOpensAt: z.string().nullable(),
  registrationClosesAt: z.string().nullable(),
  sortOrder: z.number(),
  studentCount: z.number(),
});

export type RegistrationGroupGenerationCreatedGroupResponse = z.infer<
  typeof RegistrationGroupGenerationCreatedGroupResponseSchema
>;

export const RegistrationGroupGenerationCreateResponseSchema = z.object({
  registrationGroupGenerationId: z.number(),
  name: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  matchedStudentCount: z.number(),
  splitCount: z.number(),
  groupCount: z.number(),
  groups: z.array(RegistrationGroupGenerationCreatedGroupResponseSchema),
});

export type RegistrationGroupGenerationCreateResponse = z.infer<
  typeof RegistrationGroupGenerationCreateResponseSchema
>;

export const RegistrationGroupPublishRequestSchema = z.object({
  academicYearId: z.number(),
  termId: z.number(),
});

export type RegistrationGroupPublishRequest = z.infer<
  typeof RegistrationGroupPublishRequestSchema
>;

export const RegistrationGroupPublishValidationIssueResponseSchema = z.object({
  registrationGroupId: z.number().nullable(),
  groupName: z.string().nullable(),
  field: z.string(),
  code: z.string(),
  message: z.string(),
});

export type RegistrationGroupPublishValidationIssueResponse = z.infer<
  typeof RegistrationGroupPublishValidationIssueResponseSchema
>;

export const RegistrationGroupPublishGroupResponseSchema = z.object({
  registrationGroupId: z.number(),
  name: z.string(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  registrationOpensAt: z.string().nullable(),
  registrationClosesAt: z.string().nullable(),
  studentCount: z.number(),
  hasRegistrationWindow: z.boolean(),
  publishable: z.boolean(),
  validationIssues: z.array(RegistrationGroupPublishValidationIssueResponseSchema),
});

export type RegistrationGroupPublishGroupResponse = z.infer<
  typeof RegistrationGroupPublishGroupResponseSchema
>;

export const RegistrationGroupPublishValidationResponseSchema = z.object({
  academicYearId: z.number(),
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: z.number(),
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  publishable: z.boolean(),
  groupCount: z.number(),
  draftGroupCount: z.number(),
  alreadyPublishedGroupCount: z.number(),
  blockingIssueCount: z.number(),
  groups: z.array(RegistrationGroupPublishGroupResponseSchema),
  issues: z.array(RegistrationGroupPublishValidationIssueResponseSchema),
});

export type RegistrationGroupPublishValidationResponse = z.infer<
  typeof RegistrationGroupPublishValidationResponseSchema
>;

export const RegistrationGroupPublishResultResponseSchema = z.object({
  academicYearId: z.number(),
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: z.number(),
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  requestedGroupCount: z.number(),
  publishedGroupCount: z.number(),
  skippedGroupCount: z.number(),
  groups: z.array(RegistrationGroupPublishGroupResponseSchema),
});

export type RegistrationGroupPublishResultResponse = z.infer<
  typeof RegistrationGroupPublishResultResponseSchema
>;

export const RegistrationGroupEmailNotificationResponseSchema = z.object({
  registrationGroupId: z.number(),
  registrationGroupName: z.string(),
  assignedStudentCount: z.number(),
  sentEmailCount: z.number(),
  recipient: z.string(),
  message: z.string(),
});

export type RegistrationGroupEmailNotificationResponse = z.infer<
  typeof RegistrationGroupEmailNotificationResponseSchema
>;

export const RegistrationGroupStudentOptionResponseSchema = z.object({
  studentId: z.number(),
  studentNumber: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  classStanding: z.string().nullable(),
  classOf: z.number().nullable(),
  existingAssignment: RegistrationGroupExistingAssignmentResponseSchema.nullable(),
});

export type RegistrationGroupStudentOptionResponse = z.infer<
  typeof RegistrationGroupStudentOptionResponseSchema
>;

export const RegistrationGroupStudentOptionsResponseSchema = z.object({
  results: z.array(RegistrationGroupStudentOptionResponseSchema),
});

export type RegistrationGroupStudentOptionsResponse = z.infer<
  typeof RegistrationGroupStudentOptionsResponseSchema
>;

export const RegistrationGroupBuilderPreviewRequestSchema = z.object({
  academicYearId: z.number(),
  termId: z.number(),
  studentSearchText: z.string().nullable().optional(),
  programSearchText: z.string().nullable().optional(),
  groupNamePrefix: z.string().nullable().optional(),
  academicDivisionId: z.number().nullable().optional(),
  honorsFilter: z.string().nullable().optional(),
  athleteFilter: z.string().nullable().optional(),
  athleticSportIds: z.array(z.number()).optional(),
  existingGroupFilter: z.string().nullable().optional(),
  minCredits: z.number().nullable().optional(),
  maxCredits: z.number().nullable().optional(),
  includeCurrentCredits: z.boolean(),
  includeTransferCredits: z.boolean(),
  splitCount: z.number().nullable().optional(),
});

export type RegistrationGroupBuilderPreviewRequest = z.infer<
  typeof RegistrationGroupBuilderPreviewRequestSchema
>;

export const RegistrationGroupGenerationCreateGroupRequestSchema = z.object({
  temporaryGroupId: z.string().nullable().optional(),
  name: z.string(),
  registrationOpensAt: z.string().nullable().optional(),
  registrationClosesAt: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  studentIds: z.array(z.number()),
});

export type RegistrationGroupGenerationCreateGroupRequest = z.infer<
  typeof RegistrationGroupGenerationCreateGroupRequestSchema
>;

export const RegistrationGroupGenerationCreateRequestSchema = z.object({
  name: z.string().nullable().optional(),
  academicYearId: z.number(),
  termId: z.number(),
  studentSearchText: z.string().nullable().optional(),
  programSearchText: z.string().nullable().optional(),
  groupNamePrefix: z.string().nullable().optional(),
  academicDivisionId: z.number().nullable().optional(),
  honorsFilter: z.string().nullable().optional(),
  athleteFilter: z.string().nullable().optional(),
  athleticSportIds: z.array(z.number()).optional(),
  existingGroupFilter: z.string().nullable().optional(),
  minCredits: z.number().nullable().optional(),
  maxCredits: z.number().nullable().optional(),
  includeCurrentCredits: z.boolean(),
  includeTransferCredits: z.boolean(),
  splitCount: z.number().nullable().optional(),
  matchedStudentCount: z.number().nullable().optional(),
  groups: z.array(RegistrationGroupGenerationCreateGroupRequestSchema),
});

export type RegistrationGroupGenerationCreateRequest = z.infer<
  typeof RegistrationGroupGenerationCreateRequestSchema
>;

export const PatchRegistrationGroupRequestSchema = z.object({
  name: z.string().nullable().optional(),
  academicYearId: z.number().nullable().optional(),
  termId: z.number().nullable().optional(),
  registrationOpensAt: z.string().nullable().optional(),
  registrationClosesAt: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export type PatchRegistrationGroupRequest = z.infer<
  typeof PatchRegistrationGroupRequestSchema
>;

export const AddRegistrationGroupStudentRequestSchema = z.object({
  studentId: z.number(),
  moveExistingAssignment: z.boolean().optional(),
});

export type AddRegistrationGroupStudentRequest = z.infer<
  typeof AddRegistrationGroupStudentRequestSchema
>;

export const BulkAssignRegistrationGroupStudentsRequestSchema = z.object({
  registrationGroupId: z.number(),
  studentIds: z.array(z.number()),
});

export type BulkAssignRegistrationGroupStudentsRequest = z.infer<
  typeof BulkAssignRegistrationGroupStudentsRequestSchema
>;

export const BulkAssignRegistrationGroupStudentsResponseSchema = z.object({
  registrationGroupId: z.number(),
  registrationGroupName: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
  termId: z.number(),
  termCode: z.string(),
  termName: z.string(),
  requestedStudentCount: z.number(),
  assignedStudentCount: z.number(),
  remainingUnassignedStudentCount: z.number(),
  assignedStudentIds: z.array(z.number()),
});

export type BulkAssignRegistrationGroupStudentsResponse = z.infer<
  typeof BulkAssignRegistrationGroupStudentsResponseSchema
>;
