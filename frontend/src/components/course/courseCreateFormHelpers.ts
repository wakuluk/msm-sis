import {
  removeAssociatedLabCorequisiteDraft,
  upsertAssociatedLabCorequisiteDraft,
} from './courseRequisiteDrafts';
import type { CourseCreateFormValues } from './courseCreateValidation';

export type CreditInputValue = CourseCreateFormValues['credits'];

export function buildDefaultLabCourseNumber(courseNumber: string): string {
  const normalizedCourseNumber = courseNumber.trim();
  return normalizedCourseNumber ? `${normalizedCourseNumber}L` : '';
}

export function buildDefaultLabTitle(title: string): string {
  const normalizedTitle = title.trim();
  return normalizedTitle ? `${normalizedTitle} Lab` : '';
}

export function normalizeCreditInputValue(value: string | number | null): CreditInputValue {
  return value ?? '';
}

export function syncAssociatedLabCorequisite(
  current: CourseCreateFormValues
): CourseCreateFormValues {
  if (!current.createAssociatedLab || !current.associatedLabCorequisite) {
    return {
      ...current,
      requisites: removeAssociatedLabCorequisiteDraft(current.requisites),
    };
  }

  return {
    ...current,
    requisites: upsertAssociatedLabCorequisiteDraft({
      groups: current.requisites,
      courseCode: current.associatedLabCourseNumber,
      courseTitle: current.associatedLabTitle,
    }),
  };
}
