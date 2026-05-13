import { z } from 'zod';

export const AthleticSportResponseSchema = z.object({
  athleticSportId: z.number(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedByUserId: z.number().nullable(),
  updatedBy: z.string().nullable(),
});

export type AthleticSportResponse = z.infer<typeof AthleticSportResponseSchema>;

export const AthleticSportListResponseSchema = z.object({
  sports: z.array(AthleticSportResponseSchema),
});

export type AthleticSportListResponse = z.infer<typeof AthleticSportListResponseSchema>;

export const CreateAthleticSportRequestSchema = z.object({
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
});

export type CreateAthleticSportRequest = z.infer<typeof CreateAthleticSportRequestSchema>;

export const PatchAthleticSportRequestSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export type PatchAthleticSportRequest = z.infer<typeof PatchAthleticSportRequestSchema>;
