import { z } from 'zod';

export const StaffReferenceOptionResponseSchema = z.object({
  staffId: z.number(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
});

export type StaffReferenceOptionResponse = z.infer<typeof StaffReferenceOptionResponseSchema>;

export const StaffSearchResponseSchema = z.object({
  results: z.array(StaffReferenceOptionResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type StaffSearchResponse = z.infer<typeof StaffSearchResponseSchema>;
