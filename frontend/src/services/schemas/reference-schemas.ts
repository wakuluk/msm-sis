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

export const CatalogTermReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  academicYearId: z.number(),
  academicYearCode: z.string(),
  academicYearName: z.string(),
});

export type CatalogTermReferenceOption = z.infer<typeof CatalogTermReferenceOptionSchema>;

export const CatalogSubjectReferenceOptionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  departmentId: z.number(),
  departmentCode: z.string(),
  departmentName: z.string(),
});

export type CatalogSubjectReferenceOption = z.infer<typeof CatalogSubjectReferenceOptionSchema>;

export const CatalogSearchReferenceOptionsResponseSchema = z.object({
  academicYears: z.array(CatalogReferenceOptionSchema),
  terms: z.array(CatalogTermReferenceOptionSchema),
  departments: z.array(CatalogReferenceOptionSchema),
  subjects: z.array(CatalogSubjectReferenceOptionSchema),
  offeringStatuses: z.array(CatalogReferenceOptionSchema).default([]),
  termStatuses: z.array(CatalogReferenceOptionSchema).default([]),
});

export type CatalogSearchReferenceOptionsResponse = z.infer<
  typeof CatalogSearchReferenceOptionsResponseSchema
>;
