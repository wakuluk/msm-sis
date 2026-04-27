import { z } from 'zod';

export const ReferenceOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type ReferenceOption = z.infer<typeof ReferenceOptionSchema>;

export const StudentReferenceOptionsResponseSchema = z.object({
  genders: z.array(ReferenceOptionSchema),
  ethnicities: z.array(ReferenceOptionSchema),
  classStandings: z.array(ReferenceOptionSchema),
});

export type StudentReferenceOptionsResponse = z.infer<typeof StudentReferenceOptionsResponseSchema>;

export const CatalogReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
});

export type CatalogReferenceOption = z.infer<typeof CatalogReferenceOptionSchema>;

export const AcademicDepartmentReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  schoolId: z.number(),
});

export type AcademicDepartmentReferenceOption = z.infer<
  typeof AcademicDepartmentReferenceOptionSchema
>;

export const AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema = z.object({
  schools: z.array(CatalogReferenceOptionSchema),
  departments: z.array(AcademicDepartmentReferenceOptionSchema),
});

export type AcademicSchoolDepartmentSearchReferenceOptionsResponse = z.infer<
  typeof AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema
>;

export const AcademicSubTermReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
});

export type AcademicSubTermReferenceOption = z.infer<typeof AcademicSubTermReferenceOptionSchema>;

export const AcademicSubjectReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  departmentId: z.number(),
  departmentCode: z.string(),
  departmentName: z.string(),
});

export type AcademicSubjectReferenceOption = z.infer<typeof AcademicSubjectReferenceOptionSchema>;

export const CourseSearchReferenceOptionsResponseSchema = z.object({
  schools: z.array(CatalogReferenceOptionSchema),
  departments: z.array(AcademicDepartmentReferenceOptionSchema),
  subjects: z.array(AcademicSubjectReferenceOptionSchema),
});

export type CourseSearchReferenceOptionsResponse = z.infer<
  typeof CourseSearchReferenceOptionsResponseSchema
>;

export const CourseReferenceOptionSchema = z.object({
  courseId: z.number(),
  schoolId: z.number(),
  schoolCode: z.string(),
  schoolName: z.string(),
  departmentId: z.number(),
  departmentCode: z.string(),
  departmentName: z.string(),
  subjectId: z.number(),
  subjectCode: z.string(),
  subjectName: z.string(),
  courseNumber: z.string(),
  courseCode: z.string(),
  currentCourseVersionId: z.number().nullable(),
  currentVersionTitle: z.string().nullable(),
  minCredits: z.number().nullable(),
  maxCredits: z.number().nullable(),
  variableCredit: z.boolean(),
});

export type CourseReferenceOption = z.infer<typeof CourseReferenceOptionSchema>;

export const CoursePickerReferenceOptionsResponseSchema = z.object({
  schools: z.array(CatalogReferenceOptionSchema),
  departments: z.array(AcademicDepartmentReferenceOptionSchema),
  subjects: z.array(AcademicSubjectReferenceOptionSchema),
  courses: z.array(CourseReferenceOptionSchema),
});

export type CoursePickerReferenceOptionsResponse = z.infer<
  typeof CoursePickerReferenceOptionsResponseSchema
>;

export const GradeMarkReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  qualityPoints: z.number().nullable(),
  earnsCredit: z.boolean(),
  countsInGpa: z.boolean(),
});

export type GradeMarkReferenceOption = z.infer<typeof GradeMarkReferenceOptionSchema>;

export const CourseSectionReferenceOptionsResponseSchema = z.object({
  courseSectionStatuses: z.array(CatalogReferenceOptionSchema),
  academicDivisions: z.array(CatalogReferenceOptionSchema),
  deliveryModes: z.array(CatalogReferenceOptionSchema),
  gradingBases: z.array(CatalogReferenceOptionSchema),
  sectionMeetingTypes: z.array(CatalogReferenceOptionSchema),
  sectionInstructorRoles: z.array(CatalogReferenceOptionSchema),
  studentSectionEnrollmentStatuses: z.array(CatalogReferenceOptionSchema),
  studentSectionGradeTypes: z.array(CatalogReferenceOptionSchema),
  gradeMarks: z.array(GradeMarkReferenceOptionSchema),
});

export type CourseSectionReferenceOptionsResponse = z.infer<
  typeof CourseSectionReferenceOptionsResponseSchema
>;

export const CatalogSearchReferenceOptionsResponseSchema = z.object({
  academicYears: z.array(CatalogReferenceOptionSchema),
  subTerms: z.array(AcademicSubTermReferenceOptionSchema),
  departments: z.array(CatalogReferenceOptionSchema),
  subjects: z.array(AcademicSubjectReferenceOptionSchema),
  subTermStatuses: z.array(CatalogReferenceOptionSchema).default([]),
});

export type CatalogSearchReferenceOptionsResponse = z.infer<
  typeof CatalogSearchReferenceOptionsResponseSchema
>;
