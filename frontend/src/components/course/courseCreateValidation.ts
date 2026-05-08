import type { CreateCourseRequest } from '@/services/schemas/course-schemas';
import {
  buildCourseRequisitesRequest,
  emptyCourseRequisites,
  type CourseRequisiteGroupDraft,
} from './courseRequisiteDrafts';

export type CourseCreateFormValues = {
  courseNumber: string;
  title: string;
  lab: boolean;
  active: boolean;
  createAssociatedLab: boolean;
  associatedLabCourseNumber: string;
  associatedLabTitle: string;
  associatedLabVersionCode: string;
  associatedLabCredits: number | string;
  associatedLabMinCredits: number | string;
  associatedLabMaxCredits: number | string;
  associatedLabVariableCredit: boolean;
  associatedLabCatalogDescription: string;
  associatedLabCorequisite: boolean;
  credits: number | string;
  minCredits: number | string;
  maxCredits: number | string;
  variableCredit: boolean;
  catalogDescription: string;
  requisites: CourseRequisiteGroupDraft[];
};

export const initialCourseCreateFormValues: CourseCreateFormValues = {
  courseNumber: '',
  title: '',
  lab: false,
  active: true,
  createAssociatedLab: false,
  associatedLabCourseNumber: '',
  associatedLabTitle: '',
  associatedLabVersionCode: '',
  associatedLabCredits: '0.00',
  associatedLabMinCredits: '0.00',
  associatedLabMaxCredits: '0.00',
  associatedLabVariableCredit: false,
  associatedLabCatalogDescription: '',
  associatedLabCorequisite: true,
  credits: '',
  minCredits: '',
  maxCredits: '',
  variableCredit: false,
  catalogDescription: '',
  requisites: emptyCourseRequisites,
};

type BuildCreateCourseRequestArgs = {
  formValues: CourseCreateFormValues;
  subjectId: string | null;
};

type BuildCreateCourseRequestResult =
  | { status: 'valid'; request: CreateCourseRequest }
  | { status: 'invalid'; message: string };

type BuildAssociatedLabRequestResult =
  | { status: 'valid'; associatedLab: CreateCourseRequest['associatedLab'] }
  | { status: 'invalid'; message: string };

function isLabCourseNumber(courseNumber: string): boolean {
  return courseNumber.trim().toUpperCase().endsWith('L');
}

export function buildCreateCourseRequest({
  formValues,
  subjectId,
}: BuildCreateCourseRequestArgs): BuildCreateCourseRequestResult {
  const normalizedCourseNumber = formValues.courseNumber.trim();
  const normalizedTitle = formValues.title.trim();
  const normalizedCatalogDescription = formValues.catalogDescription.trim();
  const credits = formValues.credits === '' ? Number.NaN : Number(formValues.credits);
  const minCredits = formValues.variableCredit
    ? formValues.minCredits === ''
      ? Number.NaN
      : Number(formValues.minCredits)
    : credits;
  const maxCredits = formValues.variableCredit
    ? formValues.maxCredits === ''
      ? Number.NaN
      : Number(formValues.maxCredits)
    : credits;

  if (subjectId === null) {
    return { status: 'invalid', message: 'Subject is required.' };
  }

  if (!normalizedCourseNumber) {
    return { status: 'invalid', message: 'Course number is required.' };
  }

  if (formValues.lab && !isLabCourseNumber(normalizedCourseNumber)) {
    return { status: 'invalid', message: 'Lab course number must end with L.' };
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

  const requisitesResult = buildCourseRequisitesRequest(formValues.requisites);
  if (requisitesResult.status === 'invalid') {
    return { status: 'invalid', message: requisitesResult.message };
  }

  const associatedLabResult = buildAssociatedLabRequest(formValues);
  if (associatedLabResult.status === 'invalid') {
    return { status: 'invalid', message: associatedLabResult.message };
  }

  return {
    status: 'valid',
    request: {
      subjectId: Number(subjectId),
      courseNumber: normalizedCourseNumber,
      lab: formValues.lab,
      active: formValues.active,
      initialVersion: {
        title: normalizedTitle,
        catalogDescription:
          normalizedCatalogDescription.length > 0 ? normalizedCatalogDescription : null,
        minCredits,
        maxCredits,
        variableCredit: formValues.variableCredit,
        requisites: requisitesResult.requisites,
      },
      associatedLab: associatedLabResult.associatedLab,
    },
  };
}

function buildAssociatedLabRequest(
  formValues: CourseCreateFormValues
): BuildAssociatedLabRequestResult {
  if (!formValues.createAssociatedLab) {
    return { status: 'valid', associatedLab: null };
  }

  const normalizedCourseNumber = formValues.associatedLabCourseNumber.trim();
  const normalizedTitle = formValues.associatedLabTitle.trim();
  const normalizedCatalogDescription = formValues.associatedLabCatalogDescription.trim();
  const credits =
    formValues.associatedLabCredits === '' ? Number.NaN : Number(formValues.associatedLabCredits);
  const minCredits = formValues.associatedLabVariableCredit
    ? formValues.associatedLabMinCredits === ''
      ? Number.NaN
      : Number(formValues.associatedLabMinCredits)
    : credits;
  const maxCredits = formValues.associatedLabVariableCredit
    ? formValues.associatedLabMaxCredits === ''
      ? Number.NaN
      : Number(formValues.associatedLabMaxCredits)
    : credits;

  if (!normalizedCourseNumber) {
    return { status: 'invalid', message: 'Lab course number is required.' };
  }

  if (!isLabCourseNumber(normalizedCourseNumber)) {
    return { status: 'invalid', message: 'Lab course number must end with L.' };
  }

  if (!normalizedTitle) {
    return { status: 'invalid', message: 'Lab title is required.' };
  }

  if (Number.isNaN(credits)) {
    return { status: 'invalid', message: 'Lab credits is required.' };
  }

  if (Number.isNaN(minCredits)) {
    return { status: 'invalid', message: 'Lab minimum credits must be a number.' };
  }

  if (Number.isNaN(maxCredits)) {
    return { status: 'invalid', message: 'Lab maximum credits must be a number.' };
  }

  if (minCredits > maxCredits) {
    return {
      status: 'invalid',
      message: 'Lab minimum credits must be less than or equal to lab maximum credits.',
    };
  }

  return {
    status: 'valid',
    associatedLab: {
      courseNumber: normalizedCourseNumber,
      active: true,
      bidirectionalCorequisite: formValues.associatedLabCorequisite,
      initialVersion: {
        title: normalizedTitle,
        catalogDescription:
          normalizedCatalogDescription.length > 0 ? normalizedCatalogDescription : null,
        minCredits,
        maxCredits,
        variableCredit: formValues.associatedLabVariableCredit,
        requisites: [],
      },
    },
  };
}
