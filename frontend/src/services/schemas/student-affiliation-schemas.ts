import { z } from 'zod';

export const StudentHonorsStatusResponseSchema = z.object({
  studentHonorsId: z.number(),
  studentId: z.number(),
  active: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedByUserId: z.number().nullable(),
  updatedBy: z.string().nullable(),
});

export type StudentHonorsStatusResponse = z.infer<typeof StudentHonorsStatusResponseSchema>;

export const StudentAthleteStatusResponseSchema = z.object({
  studentAthleteId: z.number(),
  studentId: z.number(),
  athleticSportId: z.number(),
  athleticSportCode: z.string(),
  athleticSportName: z.string(),
  active: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedByUserId: z.number().nullable(),
  updatedBy: z.string().nullable(),
});

export type StudentAthleteStatusResponse = z.infer<typeof StudentAthleteStatusResponseSchema>;

export const StudentAffiliationSummaryResponseSchema = z.object({
  studentId: z.number(),
  honors: StudentHonorsStatusResponseSchema.nullable(),
  athletics: z.array(StudentAthleteStatusResponseSchema),
});

export type StudentAffiliationSummaryResponse = z.infer<
  typeof StudentAffiliationSummaryResponseSchema
>;

export const UpdateStudentHonorsRequestSchema = z.object({
  active: z.boolean(),
});

export type UpdateStudentHonorsRequest = z.infer<typeof UpdateStudentHonorsRequestSchema>;

export const AddStudentAthleteRequestSchema = z.object({
  athleticSportId: z.number().positive(),
  active: z.boolean(),
});

export type AddStudentAthleteRequest = z.infer<typeof AddStudentAthleteRequestSchema>;

export const PatchStudentAthleteRequestSchema = z.object({
  athleticSportId: z.number().positive().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export type PatchStudentAthleteRequest = z.infer<typeof PatchStudentAthleteRequestSchema>;
