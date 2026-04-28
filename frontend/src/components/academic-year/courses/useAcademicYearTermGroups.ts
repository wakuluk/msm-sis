// Hook for loading academic-year term groups.
// Keeps term-group loading/error state near the courses page while reusing shared sorting/error helpers.
import { useEffect, useState } from 'react';
import { getAcademicYearTermGroups } from '@/services/academic-term-group-service';
import type { AcademicTermResponse } from '@/services/schemas/academic-years-schemas';
import { getErrorMessage, sortAcademicYearTermGroups } from './academicYearCoursesShared';

type AcademicYearTermGroupsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; termGroups: AcademicTermResponse[] };

type UseAcademicYearTermGroupsArgs = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
};

export function useAcademicYearTermGroups({
  academicYearId,
  hasValidAcademicYearId,
}: UseAcademicYearTermGroupsArgs) {
  const [state, setState] = useState<AcademicYearTermGroupsState>({ status: 'loading' });

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

    getAcademicYearTermGroups({
      academicYearId,
      signal: abortController.signal,
    })
      .then((termGroups) => {
        if (abortController.signal.aborted) {
          return;
        }

        setState({
          status: 'success',
          termGroups: sortAcademicYearTermGroups(termGroups),
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic year terms.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [academicYearId, hasValidAcademicYearId]);

  return {
    state,
    termGroups: state.status === 'success' ? state.termGroups : [],
  };
}
