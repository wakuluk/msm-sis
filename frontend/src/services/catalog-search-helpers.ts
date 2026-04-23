import type {
  CatalogReferenceOption,
  AcademicSubjectReferenceOption,
  AcademicSubTermReferenceOption,
} from './schemas/reference-schemas';
import type { CourseOfferingSearchFilters } from './schemas/catalog-schemas';

function getTrimmedFilterValue(value: string | null | undefined): string | undefined {
  const trimmedValue = (value ?? '').trim();

  return trimmedValue ? trimmedValue : undefined;
}

function buildCodeOptionLabel(code: string, name: string) {
  return `${code} · ${name}`;
}

export function hasCourseOfferingSearchValues(filters: CourseOfferingSearchFilters) {
  return Object.values(filters).some((value) => getTrimmedFilterValue(value) !== undefined);
}

export function getCourseOfferingSearchFilterSummary(filters: CourseOfferingSearchFilters) {
  return [
    filters.academicYearCode,
    filters.subTermCode,
    filters.departmentCode,
    filters.subjectCode,
    getTrimmedFilterValue(filters.courseCode),
    getTrimmedFilterValue(filters.title),
    getTrimmedFilterValue(filters.description),
  ].filter(Boolean) as string[];
}

export function filterAcademicTermsByAcademicYear(
  subTerms: ReadonlyArray<AcademicSubTermReferenceOption>,
  academicYearCode: string | null
) {
  return subTerms.filter(
    (subTerm) => !academicYearCode || subTerm.academicYearCode === academicYearCode
  );
}

export function filterAcademicSubjectsByDepartment(
  subjects: ReadonlyArray<AcademicSubjectReferenceOption>,
  departmentCode: string | null
) {
  return subjects.filter((subject) => !departmentCode || subject.departmentCode === departmentCode);
}

export function mapCatalogReferenceOptionsToSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: buildCodeOptionLabel(option.code, option.name),
  }));
}

export function mapCatalogAcademicYearOptionsToSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: option.name,
  }));
}

export function mapAcademicTermOptionsToSelectOptions(
  options: ReadonlyArray<AcademicSubTermReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: option.name,
  }));
}

export function mapAcademicSubjectOptionsToSelectOptions(
  options: ReadonlyArray<AcademicSubjectReferenceOption>
) {
  return options.map((option) => ({
    value: option.code,
    label: buildCodeOptionLabel(option.code, option.name),
  }));
}

export function appendTrimmedQueryParam(
  queryParams: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const trimmedValue = getTrimmedFilterValue(value);

  if (trimmedValue !== undefined) {
    queryParams.set(key, trimmedValue);
  }
}

export function appendTrimmedMultiValueQueryParams(
  queryParams: URLSearchParams,
  key: string,
  values: ReadonlyArray<string> | undefined
) {
  values?.forEach((value) => {
    const trimmedValue = getTrimmedFilterValue(value);

    if (trimmedValue !== undefined) {
      queryParams.append(key, trimmedValue);
    }
  });
}
