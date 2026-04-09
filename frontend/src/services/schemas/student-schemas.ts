import { z } from 'zod';

const NullableString = z.string().nullable();
const NullableNumber = z.number().nullable();

export const StudentSearchFiltersSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  studentId: z.string(),
  classOf: z.string(),
  genderId: z.string(),
  ethnicityId: z.string(),
  classStandingId: z.string(),
  updatedBy: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  stateRegion: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
});

export type StudentSearchFilters = z.infer<typeof StudentSearchFiltersSchema>;

export const initialStudentSearchFilters: StudentSearchFilters = {
  lastName: '',
  firstName: '',
  studentId: '',
  classOf: '',
  genderId: '',
  ethnicityId: '',
  classStandingId: '',
  updatedBy: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
};

export const studentSearchFilterKeys = Object.keys(
  initialStudentSearchFilters
) as (keyof StudentSearchFilters)[];

export const StudentSortBySchema = z.enum([
  'city',
  'lastName',
  'firstName',
  'studentId',
  'classOf',
  'stateRegion',
  'updatedBy',
  'lastUpdated',
]);

export type StudentSortBy = z.infer<typeof StudentSortBySchema>;

export const StudentSortDirectionSchema = z.enum(['asc', 'desc']);

export type StudentSortDirection = z.infer<typeof StudentSortDirectionSchema>;

export const StudentCreateFormValuesSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  nameSuffix: z.string(),
  genderId: z.string(),
  ethnicityId: z.string(),
  classStandingId: z.string(),
  preferredName: z.string(),
  dateOfBirth: z.string(),
  estimatedGradDate: z.string(),
  altId: z.string(),
  email: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  stateRegion: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
  addressType: z.string(),
});

export type StudentCreateFormValues = z.infer<typeof StudentCreateFormValuesSchema>;

export const initialStudentCreateFormValues: StudentCreateFormValues = {
  lastName: '',
  firstName: '',
  middleName: '',
  nameSuffix: '',
  genderId: '',
  ethnicityId: '',
  classStandingId: '',
  preferredName: '',
  dateOfBirth: '',
  estimatedGradDate: '',
  altId: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
  addressType: '',
};

export const StudentCreateRequestSchema = z.object({
  lastName: z.string().nullable(),
  firstName: z.string().nullable(),
  middleName: z.string().nullable(),
  nameSuffix: z.string().nullable(),
  genderId: z.number().nullable(),
  ethnicityId: z.number().nullable(),
  classStandingId: z.number().nullable(),
  preferredName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  estimatedGradDate: z.string().nullable(),
  altId: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  stateRegion: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  addressType: z.string().nullable(),
});

export type StudentCreateRequest = z.infer<typeof StudentCreateRequestSchema>;

export const StudentCreateResponseSchema = z.object({
  studentId: z.number(),
});

export type StudentCreateResponse = z.infer<typeof StudentCreateResponseSchema>;

export const StudentDetailResponseSchema = z.object({
  studentId: z.number(),
  userId: z.number().nullable(),
  lastName: NullableString,
  firstName: NullableString,
  middleName: NullableString,
  nameSuffix: NullableString,
  genderId: NullableNumber,
  fullName: NullableString,
  gender: NullableString,
  ethnicityId: NullableNumber,
  ethnicity: NullableString,
  classStandingId: NullableNumber,
  classStanding: NullableString,
  addressId: z.number().nullable(),
  preferredName: NullableString,
  dateOfBirth: NullableString,
  estimatedGradDate: NullableString,
  classOf: NullableNumber,
  altId: NullableString,
  email: NullableString,
  phone: NullableString,
  disabled: z.boolean(),
  lastUpdated: NullableString,
  updatedBy: NullableString,
  addressLine1: NullableString,
  addressLine2: NullableString,
  city: NullableString,
  stateRegion: NullableString,
  postalCode: NullableString,
  countryCode: NullableString,
  addressType: NullableString,
});

export type StudentDetailResponse = z.infer<typeof StudentDetailResponseSchema>;

export const studentDetailEditableFieldKeys = [
  'lastName',
  'firstName',
  'middleName',
  'nameSuffix',
  'genderId',
  'ethnicityId',
  'classStandingId',
  'preferredName',
  'dateOfBirth',
  'estimatedGradDate',
  'altId',
  'email',
  'phone',
  'disabled',
  'addressLine1',
  'addressLine2',
  'city',
  'stateRegion',
  'postalCode',
  'countryCode',
  'addressType',
] as const;

export type StudentDetailEditableFieldKey = (typeof studentDetailEditableFieldKeys)[number];

export const StudentDetailFormValuesSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  nameSuffix: z.string(),
  genderId: z.string(),
  ethnicityId: z.string(),
  classStandingId: z.string(),
  preferredName: z.string(),
  dateOfBirth: z.string(),
  estimatedGradDate: z.string(),
  altId: z.string(),
  email: z.string(),
  phone: z.string(),
  disabled: z.boolean(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  stateRegion: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
  addressType: z.string(),
});

export type StudentDetailFormValues = z.infer<typeof StudentDetailFormValuesSchema>;

export const initialStudentDetailFormValues: StudentDetailFormValues = {
  lastName: '',
  firstName: '',
  middleName: '',
  nameSuffix: '',
  genderId: '',
  ethnicityId: '',
  classStandingId: '',
  preferredName: '',
  dateOfBirth: '',
  estimatedGradDate: '',
  altId: '',
  email: '',
  phone: '',
  disabled: false,
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
  addressType: '',
};

export const StudentPatchRequestSchema = z.object({
  lastName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  middleName: z.string().nullable().optional(),
  nameSuffix: z.string().nullable().optional(),
  genderId: z.number().nullable().optional(),
  ethnicityId: z.number().nullable().optional(),
  classStandingId: z.number().nullable().optional(),
  preferredName: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  estimatedGradDate: z.string().nullable().optional(),
  altId: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  disabled: z.boolean().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  stateRegion: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  addressType: z.string().nullable().optional(),
});

export type StudentPatchRequest = z.infer<typeof StudentPatchRequestSchema>;

export const StudentSearchResultResponseSchema = z.object({
  studentId: z.number(),
  firstName: NullableString,
  lastName: NullableString,
  classOf: NullableNumber,
  classStanding: NullableString,
  addressLine1: NullableString,
  addressLine2: NullableString,
  city: NullableString,
  stateRegion: NullableString,
  postalCode: NullableString,
  countryCode: NullableString,
  disabled: z.boolean(),
  lastUpdated: z.string().nullable(),
  updatedBy: NullableString,
});

export const StudentSearchResponseSchema = z.object({
  results: z.array(StudentSearchResultResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type StudentSearchResultResponse = z.infer<typeof StudentSearchResultResponseSchema>;
export type StudentSearchResponse = z.infer<typeof StudentSearchResponseSchema>;
