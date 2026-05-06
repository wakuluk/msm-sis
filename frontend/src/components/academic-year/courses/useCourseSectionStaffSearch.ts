// Owns instructor search state and select-option mapping for course-section forms.
import { useCallback, useEffect, useState } from 'react';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import { searchStaff } from '@/services/staff-service';
import { buildStaffSelectOptions } from './courseSectionRequestBuilders';
import { getErrorMessage } from './courseSectionsWorkspaceUtils';
import type { CourseSectionDraft } from './courseSectionsWorkspaceTypes';

type StaffSearchState =
  | { status: 'idle'; results: StaffReferenceOptionResponse[] }
  | { status: 'loading'; results: StaffReferenceOptionResponse[] }
  | { status: 'success'; results: StaffReferenceOptionResponse[] }
  | { status: 'error'; results: StaffReferenceOptionResponse[]; message: string };

export function useCourseSectionStaffSearch() {
  const [staffSearchState, setStaffSearchState] = useState<StaffSearchState>({
    status: 'idle',
    results: [],
  });
  const [staffSearchValue, setStaffSearchValue] = useState('');
  const getStaffOptions = useCallback(
    (draft: CourseSectionDraft) => buildStaffSelectOptions(staffSearchState.results, draft),
    [staffSearchState.results]
  );

  useEffect(() => {
    if (staffSearchValue.trim().length < 2) {
      setStaffSearchState({ status: 'idle', results: [] });
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStaffSearchState((current) => ({
        status: 'loading',
        results: current.results,
      }));

      void searchStaff({
        search: staffSearchValue,
        size: 10,
        signal: abortController.signal,
      })
        .then((response) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({ status: 'success', results: response.results });
          }
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(error, 'Failed to search staff.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [staffSearchValue]);

  return {
    getStaffOptions,
    setStaffSearchValue,
    staffSearchState,
    staffSearchValue,
  };
}
