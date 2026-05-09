import { z } from 'zod';
import { CourseSectionMeetingResponseSchema } from './course-section-schemas';
import {
  AcademicDepartmentReferenceOptionSchema,
  CatalogReferenceOptionSchema,
} from './reference-schemas';

export const InstructorScheduleSearchResultResponseSchema = z.object({
  sectionInstructorId: z.number(),
  staffId: z.number().nullable(),
  instructorUserId: z.number().nullable(),
  instructorName: z.string().nullable(),
  instructorEmail: z.string().nullable(),
  sectionId: z.number().nullable(),
  courseOfferingId: z.number().nullable(),
  sectionLetter: z.string().nullable(),
  displaySectionCode: z.string().nullable(),
  sectionTitle: z.string().nullable(),
  honors: z.boolean(),
  statusCode: z.string().nullable(),
  statusName: z.string().nullable(),
  courseId: z.number().nullable(),
  courseCode: z.string().nullable(),
  courseTitle: z.string().nullable(),
  academicYearId: z.number().nullable(),
  academicYearCode: z.string().nullable(),
  academicYearName: z.string().nullable(),
  termId: z.number().nullable(),
  termCode: z.string().nullable(),
  termName: z.string().nullable(),
  subTermId: z.number().nullable(),
  subTermCode: z.string().nullable(),
  subTermName: z.string().nullable(),
  schoolId: z.number().nullable(),
  schoolCode: z.string().nullable(),
  schoolName: z.string().nullable(),
  departmentId: z.number().nullable(),
  departmentCode: z.string().nullable(),
  departmentName: z.string().nullable(),
  roleCode: z.string().nullable(),
  roleName: z.string().nullable(),
  primary: z.boolean(),
  canViewGrades: z.boolean(),
  canManageGrades: z.boolean(),
  deliveryModeCode: z.string().nullable(),
  deliveryModeName: z.string().nullable(),
  credits: z.number().nullable(),
  meetingSummary: z.string().nullable(),
  roomSummary: z.string().nullable(),
  meetings: z.array(CourseSectionMeetingResponseSchema),
});

export type InstructorScheduleSearchResultResponse = z.infer<
  typeof InstructorScheduleSearchResultResponseSchema
>;

export const InstructorScheduleSearchPageResponseSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type InstructorScheduleSearchPageResponse = z.infer<
  typeof InstructorScheduleSearchPageResponseSchema
>;

export const InstructorScheduleSearchResponseSchema = z.object({
  page: InstructorScheduleSearchPageResponseSchema,
  results: z.array(InstructorScheduleSearchResultResponseSchema),
});

export type InstructorScheduleSearchResponse = z.infer<
  typeof InstructorScheduleSearchResponseSchema
>;

export const InstructorScheduleSubTermOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.number().nullable(),
});

export type InstructorScheduleSubTermOptionResponse = z.infer<
  typeof InstructorScheduleSubTermOptionResponseSchema
>;

export const InstructorScheduleTermOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  subTerms: z.array(InstructorScheduleSubTermOptionResponseSchema),
});

export type InstructorScheduleTermOptionResponse = z.infer<
  typeof InstructorScheduleTermOptionResponseSchema
>;

export const InstructorScheduleAcademicYearOptionResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.array(InstructorScheduleTermOptionResponseSchema),
});

export type InstructorScheduleAcademicYearOptionResponse = z.infer<
  typeof InstructorScheduleAcademicYearOptionResponseSchema
>;

export const InstructorScheduleReferenceOptionsResponseSchema = z.object({
  academicYears: z.array(InstructorScheduleAcademicYearOptionResponseSchema),
  schools: z.array(CatalogReferenceOptionSchema),
  departments: z.array(AcademicDepartmentReferenceOptionSchema),
  sectionStatuses: z.array(CatalogReferenceOptionSchema),
  instructorAssignmentRoles: z.array(CatalogReferenceOptionSchema),
  deliveryModes: z.array(CatalogReferenceOptionSchema),
});

export type InstructorScheduleReferenceOptionsResponse = z.infer<
  typeof InstructorScheduleReferenceOptionsResponseSchema
>;
