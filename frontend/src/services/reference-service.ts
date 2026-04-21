import { getAccessToken } from '@/auth/auth-store';
import {
  AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema,
  CourseSearchReferenceOptionsResponseSchema,
  StudentReferenceOptionsResponseSchema,
  type AcademicSchoolDepartmentSearchReferenceOptionsResponse,
  type CatalogReferenceOption,
  type CourseSearchReferenceOptionsResponse,
  type ReferenceOption,
  type StudentReferenceOptionsResponse,
} from './schemas/reference-schemas';

let cachedStudentReferenceOptions: StudentReferenceOptionsResponse | null = null;
let studentReferenceOptionsPromise: Promise<StudentReferenceOptionsResponse> | null = null;
let cachedAcademicSchoolDepartmentReferenceOptions:
  | AcademicSchoolDepartmentSearchReferenceOptionsResponse
  | null = null;
let academicSchoolDepartmentReferenceOptionsPromise:
  | Promise<AcademicSchoolDepartmentSearchReferenceOptionsResponse>
  | null = null;
let cachedCourseSearchReferenceOptions: CourseSearchReferenceOptionsResponse | null = null;
let courseSearchReferenceOptionsPromise: Promise<CourseSearchReferenceOptionsResponse> | null = null;

export function mapReferenceOptionsToSelectOptions(options: ReadonlyArray<ReferenceOption>) {
  return options.map((option) => ({
    value: String(option.id),
    label: option.name,
  }));
}

export function mapCodeNameReferenceOptionsToSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
) {
  return options.map((option) => ({
    value: String(option.id),
    label: `${option.name} (${option.code})`,
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

export async function getAcademicSchoolDepartmentReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<AcademicSchoolDepartmentSearchReferenceOptionsResponse> {
  if (!options?.forceRefresh && cachedAcademicSchoolDepartmentReferenceOptions) {
    return cachedAcademicSchoolDepartmentReferenceOptions;
  }

  if (!options?.forceRefresh && academicSchoolDepartmentReferenceOptionsPromise) {
    return academicSchoolDepartmentReferenceOptionsPromise;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  academicSchoolDepartmentReferenceOptionsPromise = (async () => {
    const response = await fetch('/api/reference/academic-school-department-options', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string'
          ? payload.message
          : 'Failed to load academic school reference options.'
      );
    }

    const parsedResponse = AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema.parse(
      payload
    );
    cachedAcademicSchoolDepartmentReferenceOptions = parsedResponse;
    return parsedResponse;
  })();

  try {
    return await academicSchoolDepartmentReferenceOptionsPromise;
  } finally {
    academicSchoolDepartmentReferenceOptionsPromise = null;
  }
}

export async function getCourseSearchReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CourseSearchReferenceOptionsResponse> {
  if (!options?.forceRefresh && cachedCourseSearchReferenceOptions) {
    return cachedCourseSearchReferenceOptions;
  }

  if (!options?.forceRefresh && courseSearchReferenceOptionsPromise) {
    return courseSearchReferenceOptionsPromise;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  courseSearchReferenceOptionsPromise = (async () => {
    const response = await fetch('/api/reference/course-search-options', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string'
          ? payload.message
          : 'Failed to load course search reference options.'
      );
    }

    const parsedResponse = CourseSearchReferenceOptionsResponseSchema.parse(payload);
    cachedCourseSearchReferenceOptions = parsedResponse;
    return parsedResponse;
  })();

  try {
    return await courseSearchReferenceOptionsPromise;
  } finally {
    courseSearchReferenceOptionsPromise = null;
  }
}
