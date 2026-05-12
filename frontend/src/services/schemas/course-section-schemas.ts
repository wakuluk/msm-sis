import { z } from 'zod';

export const CreateCourseSectionInstructorRequestSchema = z.object({
  staffId: z.number(),
  roleCode: z.string().trim().max(50).nullable(),
  canViewGrades: z.boolean().nullable(),
  canManageGrades: z.boolean().nullable(),
});

export type CreateCourseSectionInstructorRequest = z.infer<
  typeof CreateCourseSectionInstructorRequestSchema
>;

export const CreateCourseSectionMeetingRequestSchema = z.object({
  meetingTypeCode: z.string().trim().max(50).nullable(),
  dayOfWeek: z.number().min(1).max(7).nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  building: z.string().trim().max(100).nullable(),
  room: z.string().trim().max(50).nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  sequenceNumber: z.number().nullable(),
});

export type CreateCourseSectionMeetingRequest = z.infer<
  typeof CreateCourseSectionMeetingRequestSchema
>;

export const CreateCourseSectionRequestSchema = z.object({
  subTermId: z.number(),
  sectionLetter: z.string().trim().min(1).max(5),
  title: z.string().trim().max(255).nullable(),
  honors: z.boolean(),
  statusCode: z.string().trim().max(50).nullable(),
  academicDivisionCode: z.string().trim().max(50).nullable(),
  deliveryModeCode: z.string().trim().min(1).max(50),
  gradingBasisCode: z.string().trim().min(1).max(50),
  credits: z.number().nonnegative(),
  capacity: z.number().int().nonnegative(),
  hardCapacity: z.number().int().nonnegative().nullable(),
  waitlistAllowed: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  linkedGroupCode: z.string().trim().max(50).nullable(),
  notes: z.string().trim().max(500).nullable(),
  instructors: z.array(CreateCourseSectionInstructorRequestSchema).nullable(),
  meetings: z.array(CreateCourseSectionMeetingRequestSchema).nullable(),
});

export type CreateCourseSectionRequest = z.infer<typeof CreateCourseSectionRequestSchema>;

export const PatchCourseSectionRequestSchema = CreateCourseSectionRequestSchema.partial();

export type PatchCourseSectionRequest = z.infer<typeof PatchCourseSectionRequestSchema>;

export const CourseSectionEnrollmentSummaryResponseSchema = z.object({
  enrolledCount: z.number(),
  waitlistedCount: z.number(),
  capacity: z.number(),
  hardCapacity: z.number().nullable(),
  waitlistAllowed: z.boolean(),
});

export type CourseSectionEnrollmentSummaryResponse = z.infer<
  typeof CourseSectionEnrollmentSummaryResponseSchema
>;

export const CourseSectionInstructorResponseSchema = z.object({
  sectionInstructorId: z.number(),
  staffId: z.number().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  roleId: z.number().nullable(),
  roleCode: z.string().nullable(),
  roleName: z.string().nullable(),
  primary: z.boolean(),
  canViewGrades: z.boolean(),
  canManageGrades: z.boolean(),
});

export type CourseSectionInstructorResponse = z.infer<
  typeof CourseSectionInstructorResponseSchema
>;

export const CourseSectionMeetingResponseSchema = z.object({
  sectionMeetingId: z.number(),
  meetingTypeId: z.number().nullable(),
  meetingTypeCode: z.string().nullable(),
  meetingTypeName: z.string().nullable(),
  dayOfWeek: z.number().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  building: z.string().nullable(),
  room: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  sequenceNumber: z.number().nullable(),
});

export type CourseSectionMeetingResponse = z.infer<typeof CourseSectionMeetingResponseSchema>;

export const CourseSectionInstructorConflictMeetingResponseSchema = z.object({
  dayOfWeek: z.number(),
  proposedStartTime: z.string(),
  proposedEndTime: z.string(),
  conflictingStartTime: z.string(),
  conflictingEndTime: z.string(),
});

export type CourseSectionInstructorConflictMeetingResponse = z.infer<
  typeof CourseSectionInstructorConflictMeetingResponseSchema
>;

export const CourseSectionInstructorConflictResponseSchema = z.object({
  staffId: z.number(),
  instructorUserId: z.number(),
  instructorName: z.string(),
  conflictingSectionId: z.number(),
  conflictingSectionCode: z.string(),
  conflictingSectionDisplay: z.string(),
  subTermId: z.number(),
  subTermCode: z.string(),
  subTermName: z.string(),
  conflictingSubTermId: z.number().nullable().optional(),
  conflictingSubTermCode: z.string().nullable().optional(),
  conflictingSubTermName: z.string().nullable().optional(),
  meetings: z.array(CourseSectionInstructorConflictMeetingResponseSchema),
});

export type CourseSectionInstructorConflictResponse = z.infer<
  typeof CourseSectionInstructorConflictResponseSchema
>;

export const CourseSectionInstructorConflictErrorResponseSchema = z.object({
  message: z.string(),
  conflicts: z.array(CourseSectionInstructorConflictResponseSchema),
});

export type CourseSectionInstructorConflictErrorResponse = z.infer<
  typeof CourseSectionInstructorConflictErrorResponseSchema
>;

export const CourseSectionListResultResponseSchema = z.object({
  sectionId: z.number(),
  courseOfferingId: z.number().nullable(),
  subTermId: z.number().nullable(),
  sectionLetter: z.string().nullable(),
  displaySectionCode: z.string(),
  title: z.string().nullable(),
  honors: z.boolean(),
  statusId: z.number().nullable(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  academicDivisionId: z.number().nullable(),
  academicDivisionCode: z.string().nullable(),
  academicDivisionName: z.string().nullable(),
  deliveryModeId: z.number().nullable(),
  deliveryModeCode: z.string().nullable(),
  deliveryModeName: z.string().nullable(),
  gradingBasisId: z.number().nullable(),
  gradingBasisCode: z.string().nullable(),
  gradingBasisName: z.string().nullable(),
  credits: z.number().nullable(),
  capacity: z.number().nullable(),
  hardCapacity: z.number().nullable(),
  waitlistAllowed: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  primaryInstructorName: z.string().nullable(),
  instructorSummary: z.string().nullable(),
  meetingSummary: z.string().nullable(),
  roomSummary: z.string().nullable(),
  enrollmentSummary: CourseSectionEnrollmentSummaryResponseSchema,
  instructors: z.array(CourseSectionInstructorResponseSchema),
  meetings: z.array(CourseSectionMeetingResponseSchema),
});

export type CourseSectionListResultResponse = z.infer<
  typeof CourseSectionListResultResponseSchema
>;

export const CourseSectionListResponseSchema = z.object({
  courseOfferingId: z.number().nullable(),
  subTermId: z.number().nullable(),
  results: z.array(CourseSectionListResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseSectionListResponse = z.infer<typeof CourseSectionListResponseSchema>;

export const CourseSectionStagingResultResponseSchema = z.object({
  sectionId: z.number(),
  courseOfferingId: z.number().nullable(),
  subTermId: z.number().nullable(),
  courseId: z.number().nullable(),
  courseVersionId: z.number().nullable(),
  courseCode: z.string().nullable(),
  courseTitle: z.string().nullable(),
  sectionLetter: z.string().nullable(),
  displaySectionCode: z.string(),
  title: z.string().nullable(),
  honors: z.boolean(),
  statusId: z.number().nullable(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  academicDivisionId: z.number().nullable(),
  academicDivisionCode: z.string().nullable(),
  academicDivisionName: z.string().nullable(),
  deliveryModeId: z.number().nullable(),
  deliveryModeCode: z.string().nullable(),
  deliveryModeName: z.string().nullable(),
  gradingBasisId: z.number().nullable(),
  gradingBasisCode: z.string().nullable(),
  gradingBasisName: z.string().nullable(),
  credits: z.number().nullable(),
  capacity: z.number().nullable(),
  hardCapacity: z.number().nullable(),
  waitlistAllowed: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  primaryInstructorName: z.string().nullable(),
  instructorSummary: z.string().nullable(),
  meetingSummary: z.string().nullable(),
  roomSummary: z.string().nullable(),
  enrollmentSummary: CourseSectionEnrollmentSummaryResponseSchema,
  instructors: z.array(CourseSectionInstructorResponseSchema),
  meetings: z.array(CourseSectionMeetingResponseSchema),
});

export type CourseSectionStagingResultResponse = z.infer<
  typeof CourseSectionStagingResultResponseSchema
>;

export const CourseSectionStagingListResponseSchema = z.object({
  subTermId: z.number().nullable(),
  results: z.array(CourseSectionStagingResultResponseSchema),
  totalElements: z.number(),
});

export type CourseSectionStagingListResponse = z.infer<
  typeof CourseSectionStagingListResponseSchema
>;

export const CourseSectionStageTransitionRequestSchema = z.object({
  subTermId: z.number(),
  sourceStatusCode: z.string().trim().min(1).max(50),
  targetStatusCode: z.string().trim().min(1).max(50),
  sectionIds: z.array(z.number()).min(1),
});

export type CourseSectionStageTransitionRequest = z.infer<
  typeof CourseSectionStageTransitionRequestSchema
>;

export const CourseSectionStageTransitionIssueResponseSchema = z.object({
  sectionId: z.number().nullable(),
  sectionCode: z.string().nullable(),
  currentStatusCode: z.string().nullable(),
  currentStatusName: z.string().nullable(),
  issueCode: z.string(),
  message: z.string(),
});

export type CourseSectionStageTransitionIssueResponse = z.infer<
  typeof CourseSectionStageTransitionIssueResponseSchema
>;

export const CourseSectionStageTransitionResponseSchema = z.object({
  subTermId: z.number().nullable(),
  sourceStatusCode: z.string(),
  targetStatusCode: z.string(),
  movedRows: z.array(CourseSectionStagingResultResponseSchema),
  blockingIssues: z.array(CourseSectionStageTransitionIssueResponseSchema),
  movedCount: z.number(),
  blockingIssueCount: z.number(),
});

export type CourseSectionStageTransitionResponse = z.infer<
  typeof CourseSectionStageTransitionResponseSchema
>;

export const CourseSectionDetailResponseSchema = z.object({
  sectionId: z.number(),
  courseOfferingId: z.number().nullable(),
  subTermId: z.number().nullable(),
  courseId: z.number().nullable(),
  courseVersionId: z.number().nullable(),
  courseCode: z.string().nullable(),
  courseTitle: z.string().nullable(),
  sectionLetter: z.string().nullable(),
  displaySectionCode: z.string(),
  title: z.string().nullable(),
  honors: z.boolean(),
  statusId: z.number().nullable(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  academicDivisionId: z.number().nullable(),
  academicDivisionCode: z.string().nullable(),
  academicDivisionName: z.string().nullable(),
  deliveryModeId: z.number().nullable(),
  deliveryModeCode: z.string().nullable(),
  deliveryModeName: z.string().nullable(),
  gradingBasisId: z.number().nullable(),
  gradingBasisCode: z.string().nullable(),
  gradingBasisName: z.string().nullable(),
  credits: z.number().nullable(),
  capacity: z.number().nullable(),
  hardCapacity: z.number().nullable(),
  waitlistAllowed: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  parentSectionId: z.number().nullable(),
  linkedGroupCode: z.string().nullable(),
  notes: z.string().nullable(),
  enrollmentSummary: CourseSectionEnrollmentSummaryResponseSchema,
  instructors: z.array(CourseSectionInstructorResponseSchema),
  meetings: z.array(CourseSectionMeetingResponseSchema),
});

export type CourseSectionDetailResponse = z.infer<typeof CourseSectionDetailResponseSchema>;

export const AddCourseSectionStudentRequestSchema = z.object({
  studentId: z.number(),
  statusCode: z.string().trim().max(50).nullable().optional(),
  gradingBasisCode: z.string().trim().max(50).nullable().optional(),
  creditsAttempted: z.number().nonnegative().nullable().optional(),
  includeInGpa: z.boolean().nullable().optional(),
  capacityOverride: z.boolean().nullable().optional(),
  manualAddReason: z.string().trim().max(500).nullable().optional(),
});

export type AddCourseSectionStudentRequest = z.infer<
  typeof AddCourseSectionStudentRequestSchema
>;

export const PatchCourseSectionStudentEnrollmentRequestSchema = z.object({
  statusCode: z.string().trim().max(50).nullable().optional(),
  gradingBasisCode: z.string().trim().max(50).nullable().optional(),
  creditsAttempted: z.number().nonnegative().nullable().optional(),
  creditsEarned: z.number().nonnegative().nullable().optional(),
  waitlistPosition: z.number().int().positive().nullable().optional(),
  includeInGpa: z.boolean().nullable().optional(),
  capacityOverride: z.boolean().nullable().optional(),
  manualAddReason: z.string().trim().max(500).nullable().optional(),
  reason: z.string().trim().max(500).nullable().optional(),
});

export type PatchCourseSectionStudentEnrollmentRequest = z.infer<
  typeof PatchCourseSectionStudentEnrollmentRequestSchema
>;

export const CourseSectionStudentGradeResponseSchema = z.object({
  gradeId: z.number(),
  gradeTypeId: z.number().nullable(),
  gradeTypeCode: z.string().nullable(),
  gradeTypeName: z.string().nullable(),
  gradeMarkId: z.number().nullable(),
  gradeMarkCode: z.string().nullable(),
  gradeMarkName: z.string().nullable(),
  previousGradeMarkId: z.number().nullable(),
  previousGradeMarkCode: z.string().nullable(),
  previousGradeMarkName: z.string().nullable(),
  changedFromGradeId: z.number().nullable(),
  changeReason: z.string().nullable(),
  current: z.boolean(),
  postedByUserId: z.number().nullable(),
  postedByEmail: z.string().nullable(),
  postedAt: z.string().nullable(),
});

export type CourseSectionStudentGradeResponse = z.infer<
  typeof CourseSectionStudentGradeResponseSchema
>;

export const CourseSectionStudentWaitlistOfferResponseSchema = z.object({
  waitlistOfferId: z.number().nullable(),
  status: z.string().nullable(),
  offeredAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  notificationSentAt: z.string().nullable(),
});

export type CourseSectionStudentWaitlistOfferResponse = z.infer<
  typeof CourseSectionStudentWaitlistOfferResponseSchema
>;

export const CourseSectionStudentResponseSchema = z.object({
  enrollmentId: z.number(),
  sectionId: z.number().nullable(),
  studentId: z.number().nullable(),
  studentDisplayName: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  preferredName: z.string().nullable(),
  email: z.string().nullable(),
  classStanding: z.string().nullable(),
  statusId: z.number().nullable(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  gradingBasisId: z.number().nullable(),
  gradingBasisCode: z.string().nullable(),
  gradingBasisName: z.string().nullable(),
  enrollmentDate: z.string().nullable(),
  registeredAt: z.string().nullable(),
  waitlistedAt: z.string().nullable(),
  dropDate: z.string().nullable(),
  withdrawDate: z.string().nullable(),
  statusChangedAt: z.string().nullable(),
  statusChangedByUserId: z.number().nullable(),
  statusChangedByEmail: z.string().nullable(),
  creditsAttempted: z.number().nullable(),
  creditsEarned: z.number().nullable(),
  waitlistPosition: z.number().nullable(),
  waitlistOffer: CourseSectionStudentWaitlistOfferResponseSchema.nullable(),
  includeInGpa: z.boolean(),
  capacityOverride: z.boolean(),
  manualAddReason: z.string().nullable(),
  currentMidtermGrade: CourseSectionStudentGradeResponseSchema.nullable(),
  currentFinalGrade: CourseSectionStudentGradeResponseSchema.nullable(),
  grades: z.array(CourseSectionStudentGradeResponseSchema),
});

export type CourseSectionStudentResponse = z.infer<typeof CourseSectionStudentResponseSchema>;

export const PostCourseSectionStudentGradeRequestSchema = z.object({
  gradeTypeCode: z.string().trim().min(1).max(50),
  gradeMarkCode: z.string().trim().min(1).max(50),
  reason: z.string().trim().max(1000).nullable().optional(),
});

export type PostCourseSectionStudentGradeRequest = z.infer<
  typeof PostCourseSectionStudentGradeRequestSchema
>;

export const CourseSectionStudentListResponseSchema = z.object({
  sectionId: z.number().nullable(),
  results: z.array(CourseSectionStudentResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseSectionStudentListResponse = z.infer<
  typeof CourseSectionStudentListResponseSchema
>;

export const CourseSectionStudentEnrollmentEventResponseSchema = z.object({
  eventId: z.number(),
  enrollmentId: z.number().nullable(),
  eventType: z.string().nullable(),
  fromStatusId: z.number().nullable(),
  fromStatusCode: z.string().nullable(),
  fromStatusName: z.string().nullable(),
  toStatusId: z.number().nullable(),
  toStatusCode: z.string().nullable(),
  toStatusName: z.string().nullable(),
  actorUserId: z.number().nullable(),
  actorEmail: z.string().nullable(),
  reason: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export type CourseSectionStudentEnrollmentEventResponse = z.infer<
  typeof CourseSectionStudentEnrollmentEventResponseSchema
>;

export const CourseSectionStudentEnrollmentEventListResponseSchema = z.object({
  sectionId: z.number().nullable(),
  enrollmentId: z.number().nullable(),
  results: z.array(CourseSectionStudentEnrollmentEventResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CourseSectionStudentEnrollmentEventListResponse = z.infer<
  typeof CourseSectionStudentEnrollmentEventListResponseSchema
>;

export const CourseSectionStudentSortBySchema = z.enum([
  'student',
  'status',
  'registeredAt',
  'waitlistPosition',
  'creditsAttempted',
]);

export type CourseSectionStudentSortBy = z.infer<typeof CourseSectionStudentSortBySchema>;

export const CourseSectionSortBySchema = z.enum([
  'sectionLetter',
  'title',
  'status',
  'deliveryMode',
  'credits',
  'capacity',
  'startDate',
]);

export type CourseSectionSortBy = z.infer<typeof CourseSectionSortBySchema>;

export const CourseSectionSortDirectionSchema = z.enum(['asc', 'desc']);

export type CourseSectionSortDirection = z.infer<typeof CourseSectionSortDirectionSchema>;
