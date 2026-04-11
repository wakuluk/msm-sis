import { useEffect, useRef, useState } from 'react';
import {
  getStudentReferenceOptions,
  mapReferenceOptionsToSelectOptions,
} from '@/services/reference-service';

export type StudentReferenceSelectOption = {
  value: string;
  label: string;
};

type StudentReferenceOptionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      classStandingOptions: StudentReferenceSelectOption[];
      ethnicityOptions: StudentReferenceSelectOption[];
      genderOptions: StudentReferenceSelectOption[];
    }
  | { status: 'error'; message: string };

export type UseStudentReferenceOptionsResult = {
  classStandingOptions: StudentReferenceSelectOption[];
  ethnicityOptions: StudentReferenceSelectOption[];
  genderOptions: StudentReferenceSelectOption[];
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
};

const emptyOptions: StudentReferenceSelectOption[] = [];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load student reference options.';
}

export function useStudentReferenceOptions(
  options: { enabled?: boolean } = {}
): UseStudentReferenceOptionsResult {
  const { enabled = true } = options;
  const [state, setState] = useState<StudentReferenceOptionsState>({ status: 'idle' });
  const hasLoadedRef = useRef(false);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasLoadedRef.current || requestInFlightRef.current) {
      return;
    }

    let cancelled = false;
    requestInFlightRef.current = true;
    setState({ status: 'loading' });

    void (async () => {
      try {
        const referenceOptions = await getStudentReferenceOptions();

        if (cancelled) {
          return;
        }

        hasLoadedRef.current = true;
        requestInFlightRef.current = false;
        setState({
          status: 'success',
          classStandingOptions: mapReferenceOptionsToSelectOptions(referenceOptions.classStandings),
          ethnicityOptions: mapReferenceOptionsToSelectOptions(referenceOptions.ethnicities),
          genderOptions: mapReferenceOptionsToSelectOptions(referenceOptions.genders),
        });
      } catch (error) {
        if (!cancelled) {
          requestInFlightRef.current = false;
          setState({
            status: 'error',
            message: getErrorMessage(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    classStandingOptions: state.status === 'success' ? state.classStandingOptions : emptyOptions,
    ethnicityOptions: state.status === 'success' ? state.ethnicityOptions : emptyOptions,
    genderOptions: state.status === 'success' ? state.genderOptions : emptyOptions,
    referenceOptionsError: state.status === 'error' ? state.message : null,
    referenceOptionsLoading: enabled && (state.status === 'idle' || state.status === 'loading'),
  };
}
