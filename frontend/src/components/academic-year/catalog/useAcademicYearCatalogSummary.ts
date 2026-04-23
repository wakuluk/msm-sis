import { useEffect, useMemo, useState } from 'react';
import { getAcademicYearCatalogSummary } from '@/services/admin-catalog-service';
import type { AcademicYearCatalogSummaryResponse } from '@/services/schemas/admin-catalog-schemas';
import {
  buildAcademicYearCatalogTermOptions,
  getErrorMessage,
  sortAcademicYearCatalogTermGroups,
  type CatalogTermOption,
} from './academicYearCatalogShared';

type AcademicYearCatalogSummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; summary: AcademicYearCatalogSummaryResponse };

type UseAcademicYearCatalogSummaryArgs = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  refreshKey: number;
};

export function useAcademicYearCatalogSummary({
  academicYearId,
  hasValidAcademicYearId,
  refreshKey,
}: UseAcademicYearCatalogSummaryArgs) {
  const [state, setState] = useState<AcademicYearCatalogSummaryState>({ status: 'loading' });

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

    getAcademicYearCatalogSummary({
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
          message: getErrorMessage(error, 'Failed to load academic year catalog summary.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [academicYearId, hasValidAcademicYearId, refreshKey]);

  const summary = state.status === 'success' ? state.summary : null;
  const sortedTermGroups = useMemo(
    () => (summary ? sortAcademicYearCatalogTermGroups(summary.terms) : []),
    [summary]
  );
  const termOptions = useMemo<ReadonlyArray<CatalogTermOption>>(
    () => buildAcademicYearCatalogTermOptions(sortedTermGroups),
    [sortedTermGroups]
  );

  return {
    state,
    summary,
    sortedTermGroups,
    termOptions,
  };
}
