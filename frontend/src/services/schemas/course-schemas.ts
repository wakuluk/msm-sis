import { z } from 'zod';

export const CreateCourseVersionRequestSchema = z.object({
  title: z.string().trim().min(1).max(255),
  catalogDescription: z.string().nullable(),
  minCredits: z.number().nonnegative(),
  maxCredits: z.number().nonnegative(),
  variableCredit: z.boolean(),
});

export type CreateCourseVersionRequest = z.infer<typeof CreateCourseVersionRequestSchema>;

export const CreateCourseRequestSchema = z.object({
  subjectId: z.number().int().positive(),
  courseNumber: z.string().trim().min(1).max(20),
  active: z.boolean().nullable(),
  initialVersion: CreateCourseVersionRequestSchema,
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

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

export const CreateCourseSectionInstructorRequestSchema = z.object({
  staffId: z.number(),
  roleCode: z.string().trim().max(50).nullable(),
  primary: z.boolean(),
  assignmentStartDate: z.string().nullable(),
  assignmentEndDate: z.string().nullable(),
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
  lab: z.boolean(),
  statusCode: z.string().trim().max(50).nullable(),
  academicDivisionCode: z.string().trim().max(50).nullable(),
  deliveryModeCode: z.string().trim().min(1).max(50),
  gradingBasisCode: z.string().trim().min(1).max(50),
  credits: z.number().nonnegative(),
  capacity: z.number().int().nonnegative(),
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
  assignmentStartDate: z.string().nullable(),
  assignmentEndDate: z.string().nullable(),
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

export const CourseSectionListResultResponseSchema = z.object({
  sectionId: z.number(),
  courseOfferingId: z.number().nullable(),
  subTermId: z.number().nullable(),
  sectionLetter: z.string().nullable(),
  displaySectionCode: z.string(),
  title: z.string().nullable(),
  honors: z.boolean(),
  lab: z.boolean(),
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
  lab: z.boolean(),
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
  current: z.boolean(),
  postedByUserId: z.number().nullable(),
  postedByEmail: z.string().nullable(),
  postedAt: z.string().nullable(),
});

export type CourseSectionStudentGradeResponse = z.infer<
  typeof CourseSectionStudentGradeResponseSchema
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
  includeInGpa: z.boolean(),
  capacityOverride: z.boolean(),
  manualAddReason: z.string().nullable(),
  currentMidtermGrade: CourseSectionStudentGradeResponseSchema.nullable(),
  currentFinalGrade: CourseSectionStudentGradeResponseSchema.nullable(),
  grades: z.array(CourseSectionStudentGradeResponseSchema),
});

export type CourseSectionStudentResponse = z.infer<typeof CourseSectionStudentResponseSchema>;

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
