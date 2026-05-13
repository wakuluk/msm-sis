import { z } from 'zod';

const NullableDateStringSchema = z.string().nullable();
const NullableNumberSchema = z.number().nullable();
const NullableStringSchema = z.string().nullable();

export const StudentScheduleTermOptionResponseSchema = z.object({
  termId: NullableNumberSchema,
  termCode: NullableStringSchema,
  termName: NullableStringSchema,
  academicYearId: NullableNumberSchema,
  academicYearCode: NullableStringSchema,
  academicYearName: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
  currentOrFuture: z.boolean(),
  selected: z.boolean(),
});

export type StudentScheduleTermOptionResponse = z.infer<
  typeof StudentScheduleTermOptionResponseSchema
>;

export const StudentScheduleCourseResponseSchema = z.object({
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
  instructorSummary: NullableStringSchema,
  meetingSummary: NullableStringSchema,
  roomSummary: NullableStringSchema,
  startDate: NullableDateStringSchema,
  endDate: NullableDateStringSchema,
});

export type StudentScheduleCourseResponse = z.infer<typeof StudentScheduleCourseResponseSchema>;

export const StudentScheduleHistoricalCourseResponseSchema = z.object({
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
  courseCode: NullableStringSchema,
  courseTitle: NullableStringSchema,
  sectionLetter: NullableStringSchema,
  displaySectionCode: NullableStringSchema,
  sectionTitle: NullableStringSchema,
  enrollmentStatusId: NullableNumberSchema,
  enrollmentStatusCode: NullableStringSchema,
  enrollmentStatusName: NullableStringSchema,
  creditsAttempted: NullableNumberSchema,
  creditsEarned: NullableNumberSchema,
  effectiveDate: NullableDateStringSchema,
  statusChangedAt: NullableDateStringSchema,
});

export type StudentScheduleHistoricalCourseResponse = z.infer<
  typeof StudentScheduleHistoricalCourseResponseSchema
>;

export const StudentScheduleMeetingResponseSchema = z.object({
  id: z.string(),
  enrollmentId: NullableNumberSchema,
  enrollmentStatusCode: NullableStringSchema,
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

export type StudentScheduleMeetingResponse = z.infer<typeof StudentScheduleMeetingResponseSchema>;

export const StudentScheduleResponseSchema = z.object({
  studentId: NullableNumberSchema,
  studentDisplayName: NullableStringSchema,
  selectedTermId: NullableNumberSchema,
  terms: z.array(StudentScheduleTermOptionResponseSchema),
  scheduledCourses: z.array(StudentScheduleCourseResponseSchema),
  notOnScheduleCourses: z.array(StudentScheduleHistoricalCourseResponseSchema),
  scheduleMeetings: z.array(StudentScheduleMeetingResponseSchema),
});

export type StudentScheduleResponse = z.infer<typeof StudentScheduleResponseSchema>;
