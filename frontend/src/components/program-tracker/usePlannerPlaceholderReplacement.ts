import { useState } from 'react';
import type { CourseSearchResultResponse } from '@/services/schemas/course-schemas';
import { isSameProgramTrackerCourse } from './program-tracker.helpers';
import type { ProgramTrackerPlannerCourse, ProgramTrackerPlannerYear } from './program-tracker.types';

export function usePlannerPlaceholderReplacement({
  clearPlannerSaveError,
  updatePlannerYearsWithPreview,
}: {
  clearPlannerSaveError: () => void;
  updatePlannerYearsWithPreview: (
    updater: (current: ProgramTrackerPlannerYear[]) => ProgramTrackerPlannerYear[]
  ) => void;
}) {
  const [placeholderCourseToReplace, setPlaceholderCourseToReplace] =
    useState<ProgramTrackerPlannerCourse | null>(null);
  const [placeholderReplaceStatus, setPlaceholderReplaceStatus] =
    useState<'idle' | 'replacing'>('idle');

  function closeReplacePlaceholderCourseModal() {
    if (placeholderReplaceStatus === 'replacing') {
      return;
    }

    setPlaceholderCourseToReplace(null);
  }

  async function replacePlaceholderCourse(selectedCourse: CourseSearchResultResponse) {
    if (!placeholderCourseToReplace) {
      return;
    }

    setPlaceholderReplaceStatus('replacing');
    clearPlannerSaveError();

    updatePlannerYearsWithPreview((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => ({
          ...term,
          courses: term.courses.map((course) => {
            if (!isSameProgramTrackerCourse(course, placeholderCourseToReplace)) {
              return course;
            }

            return {
              ...course,
              code: selectedCourse.courseCode ?? course.code,
              courseId: selectedCourse.courseId,
              credits:
                selectedCourse.minCredits ??
                selectedCourse.maxCredits ??
                course.credits,
              placeholderDepartmentCode: undefined,
              placeholderDepartmentId: undefined,
              placeholderLabel: undefined,
              placeholderMaximumCourseNumber: undefined,
              placeholderMinimumCourseNumber: undefined,
              placeholderSubjectCode: undefined,
              placeholderType: undefined,
              title: selectedCourse.currentVersionTitle ?? undefined,
            };
          }),
        })),
      }))
    );
    setPlaceholderCourseToReplace(null);
    setPlaceholderReplaceStatus('idle');
  }

  return {
    closeReplacePlaceholderCourseModal,
    placeholderCourseToReplace,
    placeholderReplaceStatus,
    replacePlaceholderCourse,
    setPlaceholderCourseToReplace,
  };
}
