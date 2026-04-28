// Hook for loading the academic-year course summary.
// Produces page summary data and normalized term options consumed by course actions and offering search.
import { useEffect, useMemo, useState } from 'react';
import { getAcademicYearCoursesSummary } from '@/services/admin-courses-service';
import type { AcademicYearCoursesSummaryResponse } from '@/services/schemas/admin-courses-schemas';
import {
  buildAcademicYearCoursesTermOptions,
  getErrorMessage,
  sortAcademicYearCoursesTermGroups,
  type CourseTermOption,
} from './academicYearCoursesShared';

type AcademicYearCoursesSummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; summary: AcademicYearCoursesSummaryResponse };

type UseAcademicYearCoursesSummaryArgs = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  refreshKey: number;
};

export function useAcademicYearCoursesSummary({
  academicYearId,
  hasValidAcademicYearId,
  refreshKey,
}: UseAcademicYearCoursesSummaryArgs) {
  const [state, setState] = useState<AcademicYearCoursesSummaryState>({ status: 'loading' });

  useEffect(() => {
    if (!hasValidAcademicYearId) {
      setState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setState({ status: 'loading' });

    getAcademicYearCoursesSummary({
      academicYearId,
      signal: abortController.signal,
    })
      .then((summary) => {
        setState({ status: 'success', summary });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic year courses summary.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [academicYearId, hasValidAcademicYearId, refreshKey]);

  const summary = state.status === 'success' ? state.summary : null;
  const sortedTermGroups = useMemo(
    () => (summary ? sortAcademicYearCoursesTermGroups(summary.terms) : []),
    [summary]
  );
  const termOptions = useMemo<ReadonlyArray<CourseTermOption>>(
    () => buildAcademicYearCoursesTermOptions(sortedTermGroups),
    [sortedTermGroups]
  );

  return {
    state,
    summary,
    sortedTermGroups,
    termOptions,
  };
}
