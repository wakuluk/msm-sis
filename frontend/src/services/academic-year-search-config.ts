import {
  AcademicYearSortBySchema,
  AcademicYearSortDirectionSchema,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from './schemas/academic-years-schemas';

export const academicYearSearchSizeOptions = [10, 25, 50, 100] as const;

export type AcademicYearSearchSize = (typeof academicYearSearchSizeOptions)[number];

export const defaultAcademicYearSearchSize: AcademicYearSearchSize = 25;
export const defaultAcademicYearSortBy: AcademicYearSortBy = 'startDate';
export const defaultAcademicYearSortDirection: AcademicYearSortDirection = 'desc';

export const academicYearSearchSizeSelectOptions: ReadonlyArray<{
  value: string;
  label: string;
}> = academicYearSearchSizeOptions.map((size) => ({
  value: String(size),
  label: String(size),
}));

export const academicYearSortByOptions: ReadonlyArray<{
  value: AcademicYearSortBy;
  label: string;
}> = [
  { value: 'startDate', label: 'Start date' },
  { value: 'endDate', label: 'End date' },
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
  { value: 'yearStatus', label: 'Year status' },
  { value: 'isPublished', label: 'Published' },
];

export const academicYearSortDirectionOptions: ReadonlyArray<{
  value: AcademicYearSortDirection;
  label: string;
}> = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

export function parseAcademicYearSortBy(value: string | null | undefined): AcademicYearSortBy {
  const result = AcademicYearSortBySchema.safeParse(value);

  return result.success ? result.data : defaultAcademicYearSortBy;
}

export function parseAcademicYearSortDirection(
  value: string | null | undefined
): AcademicYearSortDirection {
  const result = AcademicYearSortDirectionSchema.safeParse(value);

  return result.success ? result.data : defaultAcademicYearSortDirection;
}

export function parseAcademicYearSearchSize(
  value: string | null | undefined
): AcademicYearSearchSize {
  const parsedValue = Number(value);

  return academicYearSearchSizeOptions.includes(parsedValue as AcademicYearSearchSize)
    ? (parsedValue as AcademicYearSearchSize)
    : defaultAcademicYearSearchSize;
}
