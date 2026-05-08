import { apiRequest } from './api-client';
import {
  AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema,
  CourseSectionReferenceOptionsResponseSchema,
  CoursePickerReferenceOptionsResponseSchema,
  CourseSearchReferenceOptionsResponseSchema,
  ProgramReferenceOptionsResponseSchema,
  StudentReferenceOptionsResponseSchema,
  type AcademicSchoolDepartmentSearchReferenceOptionsResponse,
  type CatalogReferenceOption,
  type CourseSectionReferenceOptionsResponse,
  type CoursePickerReferenceOptionsResponse,
  type CourseSearchReferenceOptionsResponse,
  type ProgramReferenceOptionsResponse,
  type ReferenceOption,
  type StudentReferenceOptionsResponse,
} from './schemas/reference-schemas';

type ReferenceLoaderOptions = {
  forceRefresh?: boolean;
};

type ResponseParser<TResponse> = {
  parse: (payload: unknown) => TResponse;
};

function createCachedReferenceLoader<TResponse>({
  path,
  parser,
  fallbackMessage,
}: {
  path: string;
  parser: ResponseParser<TResponse>;
  fallbackMessage: string;
}) {
  let cachedResponse: TResponse | null = null;
  let inFlightPromise: Promise<TResponse> | null = null;

  return async (options?: ReferenceLoaderOptions): Promise<TResponse> => {
    if (!options?.forceRefresh && cachedResponse) {
      return cachedResponse;
    }

    if (!options?.forceRefresh && inFlightPromise) {
      return inFlightPromise;
    }

    const requestPromise = apiRequest({
      path,
      parser,
      fallbackMessage,
    }).then((response) => {
      cachedResponse = response;
      return response;
    });

    inFlightPromise = requestPromise;

    try {
      return await requestPromise;
    } finally {
      inFlightPromise = null;
    }
  };
}

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

export const getStudentReferenceOptions = createCachedReferenceLoader<StudentReferenceOptionsResponse>(
  {
    path: '/api/reference/student-options',
    parser: StudentReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load student reference options.',
  }
);

export const getAcademicSchoolDepartmentReferenceOptions =
  createCachedReferenceLoader<AcademicSchoolDepartmentSearchReferenceOptionsResponse>({
    path: '/api/reference/academic-school-department-options',
    parser: AcademicSchoolDepartmentSearchReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load academic school reference options.',
  });

export const getCourseSearchReferenceOptions =
  createCachedReferenceLoader<CourseSearchReferenceOptionsResponse>({
    path: '/api/reference/course-search-options',
    parser: CourseSearchReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load course search reference options.',
  });

export const getProgramReferenceOptions =
  createCachedReferenceLoader<ProgramReferenceOptionsResponse>({
    path: '/api/reference/program-options',
    parser: ProgramReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load program reference options.',
  });

export const getCoursePickerReferenceOptions =
  createCachedReferenceLoader<CoursePickerReferenceOptionsResponse>({
    path: '/api/reference/course-picker-options',
    parser: CoursePickerReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load course picker reference options.',
  });

export const getCourseSectionReferenceOptions =
  createCachedReferenceLoader<CourseSectionReferenceOptionsResponse>({
    path: '/api/reference/course-section-options',
    parser: CourseSectionReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load course section reference options.',
  });
