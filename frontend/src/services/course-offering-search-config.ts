import {
  CourseOfferingSearchSortBySchema,
  CourseOfferingSortDirectionSchema,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from './schemas/catalog-schemas';

export const courseOfferingSearchSizeOptions = [10, 25, 50, 100] as const;

export type CourseOfferingSearchSize = (typeof courseOfferingSearchSizeOptions)[number];

export const defaultCourseOfferingSearchSize: CourseOfferingSearchSize = 25;
export const defaultCourseOfferingSortBy: CourseOfferingSearchSortBy = 'subTermCode';
export const defaultCourseOfferingSortDirection: CourseOfferingSortDirection = 'asc';

export const courseOfferingSortByOptions: ReadonlyArray<{
  value: CourseOfferingSearchSortBy;
  label: string;
}> = [
  { value: 'subTermCode', label: 'Term' },
  { value: 'subjectCode', label: 'Subject' },
  { value: 'courseNumber', label: 'Course number' },
  { value: 'courseCode', label: 'Course code' },
  { value: 'title', label: 'Title' },
  { value: 'minCredits', label: 'Minimum credits' },
  { value: 'maxCredits', label: 'Maximum credits' },
];

export const courseOfferingSortDirectionOptions: ReadonlyArray<{
  value: CourseOfferingSortDirection;
  label: string;
}> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export const courseOfferingSearchSizeSelectOptions: ReadonlyArray<{
  value: string;
  label: string;
}> = courseOfferingSearchSizeOptions.map((size) => ({
  value: String(size),
  label: String(size),
}));

export function parseCourseOfferingSearchSize(
  value: string | null | undefined
): CourseOfferingSearchSize {
  const parsedValue = Number(value);

  return courseOfferingSearchSizeOptions.includes(parsedValue as CourseOfferingSearchSize)
    ? (parsedValue as CourseOfferingSearchSize)
    : defaultCourseOfferingSearchSize;
}

export function parseCourseOfferingSortBy(
  value: string | null | undefined
): CourseOfferingSearchSortBy {
  const result = CourseOfferingSearchSortBySchema.safeParse(value);

  return result.success ? result.data : defaultCourseOfferingSortBy;
}

export function parseCourseOfferingSortDirection(
  value: string | null | undefined
): CourseOfferingSortDirection {
  const result = CourseOfferingSortDirectionSchema.safeParse(value);

  return result.success ? result.data : defaultCourseOfferingSortDirection;
}
