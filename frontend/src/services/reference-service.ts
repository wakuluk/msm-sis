import { getAccessToken } from '@/auth/auth-store';
import {
  StudentReferenceOptionsResponseSchema,
  type ReferenceOption,
  type StudentReferenceOptionsResponse,
} from './schemas/reference-schemas';

let cachedStudentReferenceOptions: StudentReferenceOptionsResponse | null = null;
let studentReferenceOptionsPromise: Promise<StudentReferenceOptionsResponse> | null = null;

export function mapReferenceOptionsToSelectOptions(options: ReadonlyArray<ReferenceOption>) {
  return options.map((option) => ({
    value: String(option.id),
    label: option.name,
  }));
}

export async function getStudentReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<StudentReferenceOptionsResponse> {
  if (!options?.forceRefresh && cachedStudentReferenceOptions) {
    return cachedStudentReferenceOptions;
  }

  if (!options?.forceRefresh && studentReferenceOptionsPromise) {
    return studentReferenceOptionsPromise;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  studentReferenceOptionsPromise = (async () => {
    const response = await fetch('/api/reference/student-options', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string'
          ? payload.message
          : 'Failed to load student reference options.'
      );
    }

    const parsedResponse = StudentReferenceOptionsResponseSchema.parse(payload);
    cachedStudentReferenceOptions = parsedResponse;
    return parsedResponse;
  })();

  try {
    return await studentReferenceOptionsPromise;
  } finally {
    studentReferenceOptionsPromise = null;
  }
}
