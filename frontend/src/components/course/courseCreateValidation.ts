import type { CreateCourseRequest } from '@/services/schemas/course-schemas';

export type CourseCreateFormValues = {
  courseNumber: string;
  title: string;
  active: boolean;
  credits: number | string;
  minCredits: number | string;
  maxCredits: number | string;
  catalogDescription: string;
};

export const initialCourseCreateFormValues: CourseCreateFormValues = {
  courseNumber: '',
  title: '',
  active: true,
  credits: '',
  minCredits: '',
  maxCredits: '',
  catalogDescription: '',
};

type BuildCreateCourseRequestArgs = {
  formValues: CourseCreateFormValues;
  subjectId: string | null;
};

type BuildCreateCourseRequestResult =
  | { status: 'valid'; request: CreateCourseRequest }
  | { status: 'invalid'; message: string };

export function buildCreateCourseRequest({
  formValues,
  subjectId,
}: BuildCreateCourseRequestArgs): BuildCreateCourseRequestResult {
  const normalizedCourseNumber = formValues.courseNumber.trim();
  const normalizedTitle = formValues.title.trim();
  const normalizedCatalogDescription = formValues.catalogDescription.trim();
  const credits = formValues.credits === '' ? Number.NaN : Number(formValues.credits);
  const minCredits = formValues.minCredits === '' ? credits : Number(formValues.minCredits);
  const maxCredits = formValues.maxCredits === '' ? credits : Number(formValues.maxCredits);
  const variableCredit = minCredits !== maxCredits;

  if (subjectId === null) {
    return { status: 'invalid', message: 'Subject is required.' };
  }

  if (!normalizedCourseNumber) {
    return { status: 'invalid', message: 'Course number is required.' };
  }

  if (!normalizedTitle) {
    return { status: 'invalid', message: 'Course title is required.' };
  }

  if (Number.isNaN(credits)) {
    return { status: 'invalid', message: 'Credits is required.' };
  }

  if (Number.isNaN(minCredits)) {
    return { status: 'invalid', message: 'Minimum credits must be a number.' };
  }

  if (Number.isNaN(maxCredits)) {
    return { status: 'invalid', message: 'Maximum credits must be a number.' };
  }

  if (minCredits > maxCredits) {
    return {
      status: 'invalid',
      message: 'Minimum credits must be less than or equal to maximum credits.',
    };
  }

  return {
    status: 'valid',
    request: {
      subjectId: Number(subjectId),
      courseNumber: normalizedCourseNumber,
      active: formValues.active,
      initialVersion: {
        title: normalizedTitle,
        catalogDescription:
          normalizedCatalogDescription.length > 0 ? normalizedCatalogDescription : null,
        minCredits,
        maxCredits,
        variableCredit,
      },
    },
  };
}
