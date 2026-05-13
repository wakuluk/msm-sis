import { z } from 'zod';

const NullableString = z.string().nullable();
const NullableNumber = z.number().nullable();

export const StudentAcademicCareerStatusSchema = z.enum([
  'ACTIVE',
  'INTENT_TO_GRADUATE',
  'GRADUATED',
  'WITHDRAWN',
  'DISMISSED',
  'LEAVE_OF_ABSENCE',
]);

export type StudentAcademicCareerStatus = z.infer<typeof StudentAcademicCareerStatusSchema>;

export const AcademicCareerRegistrationDivisionResponseSchema = z.object({
  academicDivisionId: z.number(),
  code: z.string(),
  name: z.string(),
});

export type AcademicCareerRegistrationDivisionResponse = z.infer<
  typeof AcademicCareerRegistrationDivisionResponseSchema
>;

export const AcademicCareerOptionResponseSchema = z.object({
  academicCareerId: z.number(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  registrationDivisions: z.array(AcademicCareerRegistrationDivisionResponseSchema),
});

export type AcademicCareerOptionResponse = z.infer<typeof AcademicCareerOptionResponseSchema>;

export const StudentAcademicCareerResponseSchema = z.object({
  studentAcademicCareerId: z.number(),
  studentId: NullableNumber,
  academicCareerId: NullableNumber,
  academicCareerCode: NullableString,
  academicCareerName: NullableString,
  status: StudentAcademicCareerStatusSchema,
  effectiveStartDate: z.string().nullable(),
  effectiveEndDate: z.string().nullable(),
  primaryCareer: z.boolean(),
  entryReason: NullableString,
  notes: NullableString,
  registrationDivisions: z.array(AcademicCareerRegistrationDivisionResponseSchema),
  createdByUserId: NullableNumber,
  createdByUserEmail: NullableString,
  updatedByUserId: NullableNumber,
  updatedByUserEmail: NullableString,
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type StudentAcademicCareerResponse = z.infer<typeof StudentAcademicCareerResponseSchema>;

export const CreateStudentAcademicCareerRequestSchema = z.object({
  academicCareerId: z.number(),
  status: StudentAcademicCareerStatusSchema,
  effectiveStartDate: z.string(),
  effectiveEndDate: z.string().nullable().optional(),
  primaryCareer: z.boolean().optional(),
  entryReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateStudentAcademicCareerRequest = z.infer<
  typeof CreateStudentAcademicCareerRequestSchema
>;

export const UpdateStudentAcademicCareerRequestSchema = z.object({
  academicCareerId: z.number().optional(),
  status: StudentAcademicCareerStatusSchema.optional(),
  effectiveStartDate: z.string().optional(),
  effectiveEndDate: z.string().nullable().optional(),
  primaryCareer: z.boolean().optional(),
  entryReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateStudentAcademicCareerRequest = z.infer<
  typeof UpdateStudentAcademicCareerRequestSchema
>;
