import { z } from 'zod';
import { getAccessToken } from '@/auth/auth-store';

const NullableString = z.string().nullable();
const NullableNumber = z.number().nullable();

export const StudentProfileResponseSchema = z.object({
  studentId: z.number(),
  lastName: NullableString,
  firstName: NullableString,
  middleName: NullableString,
  nameSuffix: NullableString,
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
  email: NullableString,
  phone: NullableString,
  addressLine1: NullableString,
  addressLine2: NullableString,
  city: NullableString,
  stateRegion: NullableString,
  postalCode: NullableString,
  countryCode: NullableString,
});

export type StudentProfileResponse = z.infer<typeof StudentProfileResponseSchema>;

export async function fetchStudentProfile(): Promise<StudentProfileResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const response = await fetch('/api/students/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to fetch student profile.'
    );
  }

  return StudentProfileResponseSchema.parse(payload);
}
