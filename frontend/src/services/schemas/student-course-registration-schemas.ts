import { z } from 'zod';

const NullableDateStringSchema = z.string().nullable();
const NullableNumberSchema = z.number().nullable();
const NullableStringSchema = z.string().nullable();
const OptionalNullableDateStringSchema = z.string().nullable().optional().default(null);
const OptionalNullableNumberSchema = z.number().nullable().optional().default(null);
const OptionalNullableStringSchema = z.string().nullable().optional().default(null);

export const AddStudentCourseRegistrationSelectionRequestSchema = z.object({
  sectionId: z.number(),
  gradingBasisId: z.number().nullable().optional(),
  gradingBasisCode: z.string().trim().max(50).nullable().optional(),
  selectedCredits: z.number().nonnegative().nullable().optional(),
});

export type AddStudentCourseRegistrationSelectionRequest = z.infer<
  typeof AddStudentCourseRegistrationSelectionRequestSchema
>;

export const SubmitStudentCourseRegistrationRequestSchema = z.object({
  selectionIds: z.array(z.number()).nullable().optional(),
  waitlistIfFull: z.boolean().nullable().optional(),
});

export type SubmitStudentCourseRegistrationRequest = z.infer<
  typeof SubmitStudentCourseRegistrationRequestSchema
>;

export const StudentCourseRegistrationSubTermResponseSchema = z.object({
  subTermId: NullableNumberSchema,
  subTermCode: NullableStringSchema,
  subTermName: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  sortOrder: NullableNumberSchema,
});

export type StudentCourseRegistrationSubTermResponse = z.infer<
  typeof StudentCourseRegistrationSubTermResponseSchema
>;

export const StudentCourseRegistrationWindowResponseSchema = z.object({
  registrationGroupId: NullableNumberSchema,
  academicYearId: NullableNumberSchema,
  academicYearCode: NullableStringSchema,
  academicYearName: NullableStringSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  statusCode: NullableStringSchema,
  statusName: NullableStringSchema,
  registrationOpensAt: NullableDateStringSchema,
  registrationClosesAt: NullableDateStringSchema,
  serverTime: z.string(),
  registrationWindowOpen: z.boolean(),
  subTerms: z.array(StudentCourseRegistrationSubTermResponseSchema),
});

export type StudentCourseRegistrationWindowResponse = z.infer<
  typeof StudentCourseRegistrationWindowResponseSchema
>;

export const StudentCourseRegistrationGroupChoiceResponseSchema = z.object({
  registrationGroupId: NullableNumberSchema,
  registrationGroupName: NullableStringSchema,
  academicYearId: NullableNumberSchema,
  academicYearCode: NullableStringSchema,
  academicYearName: NullableStringSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  statusCode: NullableStringSchema,
  statusName: NullableStringSchema,
  registrationOpensAt: NullableDateStringSchema,
  registrationClosesAt: NullableDateStringSchema,
  registrationWindowOpen: z.boolean(),
  defaultSelection: z.boolean(),
});

export type StudentCourseRegistrationGroupChoiceResponse = z.infer<
  typeof StudentCourseRegistrationGroupChoiceResponseSchema
>;

export const StudentCourseRegistrationGroupChoicesResponseSchema = z.object({
  selectedRegistrationGroupId: NullableNumberSchema,
  groups: z.array(StudentCourseRegistrationGroupChoiceResponseSchema),
});

export type StudentCourseRegistrationGroupChoicesResponse = z.infer<
  typeof StudentCourseRegistrationGroupChoicesResponseSchema
>;

export const StudentCourseRegistrationMeetingResponseSchema = z.object({
  sectionMeetingId: NullableNumberSchema,
  meetingTypeId: NullableNumberSchema,
  meetingTypeCode: NullableStringSchema,
  meetingTypeName: NullableStringSchema,
  dayOfWeek: NullableNumberSchema,
  startTime: NullableStringSchema,
  endTime: NullableStringSchema,
  building: NullableStringSchema,
  room: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  sequenceNumber: NullableNumberSchema,
});

export type StudentCourseRegistrationMeetingResponse = z.infer<
  typeof StudentCourseRegistrationMeetingResponseSchema
>;

export const StudentCourseRegistrationRequisiteResponseSchema = z.object({
  courseVersionRequisiteGroupId: NullableNumberSchema,
  courseVersionRequisiteCourseId: NullableNumberSchema,
  requisiteType: NullableStringSchema,
  conditionType: NullableStringSchema,
  minimumRequired: NullableNumberSchema,
  requiredCourseId: NullableNumberSchema,
  requiredCourseCode: NullableStringSchema,
  requiredCourseLab: z.boolean(),
  minimumGrade: NullableStringSchema,
  studentEvidence: NullableStringSchema,
  status: NullableStringSchema,
});

export type StudentCourseRegistrationRequisiteResponse = z.infer<
  typeof StudentCourseRegistrationRequisiteResponseSchema
>;

export const StudentCourseRegistrationSelectionResponseSchema = z.object({
  selectionId: NullableNumberSchema,
  sectionId: NullableNumberSchema,
  courseId: NullableNumberSchema,
  courseVersionId: NullableNumberSchema,
  courseOfferingId: NullableNumberSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  subTermId: NullableNumberSchema,
  subTermCode: NullableStringSchema,
  subTermName: NullableStringSchema,
  subTermStartDate: NullableDateStringSchema,
  subTermEndDate: NullableDateStringSchema,
  courseCode: NullableStringSchema,
  courseTitle: NullableStringSchema,
  sectionLetter: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  sectionTitle: NullableStringSchema,
  statusId: NullableNumberSchema,
  statusCode: NullableStringSchema,
  statusName: NullableStringSchema,
  gradingBasisId: NullableNumberSchema,
  gradingBasisCode: NullableStringSchema,
  gradingBasisName: NullableStringSchema,
  selectedGradingBasisId: NullableNumberSchema,
  selectedGradingBasisCode: NullableStringSchema,
  selectedGradingBasisName: NullableStringSchema,
  credits: NullableNumberSchema,
  selectedCredits: NullableNumberSchema,
  capacity: NullableNumberSchema,
  waitlistAllowed: z.boolean(),
  enrolledCount: NullableNumberSchema,
  waitlistCount: NullableNumberSchema,
  instructorSummary: NullableStringSchema,
  meetingSummary: NullableStringSchema,
  roomSummary: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  createdAt: NullableDateStringSchema,
  updatedAt: NullableDateStringSchema,
  requisites: z.array(StudentCourseRegistrationRequisiteResponseSchema).optional().default([]),
  corequisiteWarnings: z.array(z.string()).optional().default([]),
  meetings: z.array(StudentCourseRegistrationMeetingResponseSchema),
});

export type StudentCourseRegistrationSelectionResponse = z.infer<
  typeof StudentCourseRegistrationSelectionResponseSchema
>;

export const StudentCourseRegistrationEnrollmentResponseSchema = z.object({
  enrollmentId: NullableNumberSchema,
  sectionId: NullableNumberSchema,
  courseId: NullableNumberSchema,
  courseVersionId: NullableNumberSchema,
  courseOfferingId: NullableNumberSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  subTermId: NullableNumberSchema,
  subTermCode: NullableStringSchema,
  subTermName: NullableStringSchema,
  subTermStartDate: NullableDateStringSchema,
  subTermEndDate: NullableDateStringSchema,
  courseCode: NullableStringSchema,
  courseTitle: NullableStringSchema,
  sectionLetter: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  sectionTitle: NullableStringSchema,
  enrollmentStatusId: NullableNumberSchema,
  enrollmentStatusCode: NullableStringSchema,
  enrollmentStatusName: NullableStringSchema,
  gradingBasisId: NullableNumberSchema,
  gradingBasisCode: NullableStringSchema,
  gradingBasisName: NullableStringSchema,
  creditsAttempted: NullableNumberSchema,
  creditsEarned: NullableNumberSchema,
  waitlistPosition: NullableNumberSchema,
  capacity: NullableNumberSchema,
  enrolledCount: NullableNumberSchema,
  waitlistCount: NullableNumberSchema,
  waitlistOfferId: OptionalNullableNumberSchema,
  waitlistOfferStatus: OptionalNullableStringSchema,
  waitlistOfferExpiresAt: OptionalNullableDateStringSchema,
  instructorSummary: NullableStringSchema,
  meetingSummary: NullableStringSchema,
  roomSummary: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  registeredAt: NullableDateStringSchema,
  waitlistedAt: NullableDateStringSchema,
  requisites: z.array(StudentCourseRegistrationRequisiteResponseSchema).optional().default([]),
  meetings: z.array(StudentCourseRegistrationMeetingResponseSchema),
});

export type StudentCourseRegistrationEnrollmentResponse = z.infer<
  typeof StudentCourseRegistrationEnrollmentResponseSchema
>;

export const StudentCourseRegistrationScheduleMeetingResponseSchema = z.object({
  id: z.string(),
  sourceType: z.string(),
  sourceRecordId: NullableNumberSchema,
  registrationStatus: z.string(),
  sectionId: NullableNumberSchema,
  courseId: NullableNumberSchema,
  courseVersionId: NullableNumberSchema,
  courseOfferingId: NullableNumberSchema,
  courseCode: NullableStringSchema,
  courseTitle: NullableStringSchema,
  sectionLetter: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  sectionTitle: NullableStringSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  subTermId: NullableNumberSchema,
  subTermCode: NullableStringSchema,
  subTermName: NullableStringSchema,
  sectionMeetingId: NullableNumberSchema,
  dayOfWeek: NullableNumberSchema,
  startTime: NullableStringSchema,
  endTime: NullableStringSchema,
  building: NullableStringSchema,
  room: NullableStringSchema,
  location: NullableStringSchema,
});

export type StudentCourseRegistrationScheduleMeetingResponse = z.infer<
  typeof StudentCourseRegistrationScheduleMeetingResponseSchema
>;

export const StudentCourseRegistrationScheduleConflictMeetingResponseSchema = z.object({
  dayOfWeek: NullableNumberSchema,
  proposedStartTime: NullableStringSchema,
  proposedEndTime: NullableStringSchema,
  conflictingStartTime: NullableStringSchema,
  conflictingEndTime: NullableStringSchema,
});

export type StudentCourseRegistrationScheduleConflictMeetingResponse = z.infer<
  typeof StudentCourseRegistrationScheduleConflictMeetingResponseSchema
>;

export const StudentCourseRegistrationScheduleConflictResponseSchema = z.object({
  proposedCourseId: NullableNumberSchema,
  proposedSectionId: NullableNumberSchema,
  proposedCourseCode: NullableStringSchema,
  proposedSectionCode: NullableStringSchema,
  proposedSubTermId: NullableNumberSchema,
  proposedSubTermCode: NullableStringSchema,
  proposedSubTermName: NullableStringSchema,
  conflictingCourseId: NullableNumberSchema,
  conflictingSectionId: NullableNumberSchema,
  conflictingCourseCode: NullableStringSchema,
  conflictingSectionCode: NullableStringSchema,
  conflictingSubTermId: NullableNumberSchema,
  conflictingSubTermCode: NullableStringSchema,
  conflictingSubTermName: NullableStringSchema,
  conflictSource: NullableStringSchema,
  meetings: z.array(StudentCourseRegistrationScheduleConflictMeetingResponseSchema),
});

export type StudentCourseRegistrationScheduleConflictResponse = z.infer<
  typeof StudentCourseRegistrationScheduleConflictResponseSchema
>;

export const StudentCourseRegistrationScheduleConflictErrorResponseSchema = z.object({
  message: z.string(),
  conflicts: z.array(StudentCourseRegistrationScheduleConflictResponseSchema),
});

export type StudentCourseRegistrationScheduleConflictErrorResponse = z.infer<
  typeof StudentCourseRegistrationScheduleConflictErrorResponseSchema
>;

export const StudentCourseRegistrationResponseSchema = z.object({
  studentId: NullableNumberSchema,
  studentDisplayName: NullableStringSchema,
  registrationWindow: StudentCourseRegistrationWindowResponseSchema,
  selections: z.array(StudentCourseRegistrationSelectionResponseSchema),
  enrolled: z.array(StudentCourseRegistrationEnrollmentResponseSchema),
  waitlisted: z.array(StudentCourseRegistrationEnrollmentResponseSchema),
  expiredWaitlist: z.array(StudentCourseRegistrationEnrollmentResponseSchema).optional().default([]),
  scheduleMeetings: z.array(StudentCourseRegistrationScheduleMeetingResponseSchema),
});

export type StudentCourseRegistrationResponse = z.infer<
  typeof StudentCourseRegistrationResponseSchema
>;

export const StudentCourseRegistrationFailureResponseSchema = z.object({
  selectionId: NullableNumberSchema,
  sectionId: NullableNumberSchema,
  courseCode: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  failureCode: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  selectionRetained: z.boolean(),
});

export type StudentCourseRegistrationFailureResponse = z.infer<
  typeof StudentCourseRegistrationFailureResponseSchema
>;

export const StudentCourseRegistrationSubmitResponseSchema = z.object({
  message: z.string(),
  submittedCount: z.number(),
  registeredCount: z.number(),
  waitlistedCount: z.number(),
  removedFailureCount: z.number(),
  retryableFailureCount: z.number(),
  registered: z.array(StudentCourseRegistrationEnrollmentResponseSchema),
  waitlisted: z.array(StudentCourseRegistrationEnrollmentResponseSchema),
  removedFailures: z.array(StudentCourseRegistrationFailureResponseSchema),
  retryableFailures: z.array(StudentCourseRegistrationFailureResponseSchema),
  registrationPage: StudentCourseRegistrationResponseSchema,
});

export type StudentCourseRegistrationSubmitResponse = z.infer<
  typeof StudentCourseRegistrationSubmitResponseSchema
>;

export const StudentCourseSectionSearchResultResponseSchema = z.object({
  sectionId: NullableNumberSchema,
  courseId: NullableNumberSchema,
  courseVersionId: NullableNumberSchema,
  courseOfferingId: NullableNumberSchema,
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  subTermId: NullableNumberSchema,
  subTermCode: NullableStringSchema,
  subTermName: NullableStringSchema,
  subTermStartDate: NullableDateStringSchema,
  subTermEndDate: NullableDateStringSchema,
  courseCode: NullableStringSchema,
  courseTitle: NullableStringSchema,
  sectionLetter: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  sectionTitle: NullableStringSchema,
  statusId: NullableNumberSchema,
  statusCode: NullableStringSchema,
  statusName: NullableStringSchema,
  academicDivisionId: NullableNumberSchema,
  academicDivisionCode: NullableStringSchema,
  academicDivisionName: NullableStringSchema,
  deliveryModeId: NullableNumberSchema,
  deliveryModeCode: NullableStringSchema,
  deliveryModeName: NullableStringSchema,
  gradingBasisId: NullableNumberSchema,
  gradingBasisCode: NullableStringSchema,
  gradingBasisName: NullableStringSchema,
  credits: NullableNumberSchema,
  capacity: NullableNumberSchema,
  waitlistAllowed: z.boolean(),
  enrolledCount: NullableNumberSchema,
  waitlistCount: NullableNumberSchema,
  seatsAvailable: NullableNumberSchema,
  instructorSummary: NullableStringSchema,
  meetingSummary: NullableStringSchema,
  roomSummary: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  alreadySelected: z.boolean(),
  alreadyEnrolled: z.boolean(),
  sameCourseAlreadySelected: z.boolean(),
  sameCourseAlreadyEnrolled: z.boolean(),
  duplicateCourseReason: NullableStringSchema,
  prerequisitesSatisfied: z.boolean(),
  unavailableReason: NullableStringSchema,
  requisites: z.array(StudentCourseRegistrationRequisiteResponseSchema).optional().default([]),
  corequisiteWarnings: z.array(z.string()).optional().default([]),
  meetings: z.array(StudentCourseRegistrationMeetingResponseSchema),
});

export type StudentCourseSectionSearchResultResponse = z.infer<
  typeof StudentCourseSectionSearchResultResponseSchema
>;

export const StudentCourseSectionSearchResponseSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  results: z.array(StudentCourseSectionSearchResultResponseSchema),
});

export type StudentCourseSectionSearchResponse = z.infer<
  typeof StudentCourseSectionSearchResponseSchema
>;
