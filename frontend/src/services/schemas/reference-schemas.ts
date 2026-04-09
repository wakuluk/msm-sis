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
