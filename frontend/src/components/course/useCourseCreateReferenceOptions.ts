import { useEffect, useRef, useState } from 'react';
import type { StringOption } from '@/components/search/SearchQueryControls';
import {
  getCourseSearchReferenceOptions,
  mapCodeNameReferenceOptionsToSelectOptions,
} from '@/services/reference-service';

type CourseCreateReferenceOptionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      schoolOptions: StringOption[];
      departmentOptions: Array<{ schoolId: number } & StringOption>;
      subjectOptions: Array<{ departmentId: number } & StringOption>;
    }
  | { status: 'error'; message: string };

export type UseCourseCreateReferenceOptionsResult = {
  schoolOptions: ReadonlyArray<StringOption>;
  departmentOptions: ReadonlyArray<{ schoolId: number } & StringOption>;
  subjectOptions: ReadonlyArray<{ departmentId: number } & StringOption>;
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
};

const emptySchoolOptions: StringOption[] = [];
const emptyDepartmentOptions: Array<{ schoolId: number } & StringOption> = [];
const emptySubjectOptions: Array<{ departmentId: number } & StringOption> = [];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load course reference options.';
}

export function useCourseCreateReferenceOptions(
  options: { enabled?: boolean } = {}
): UseCourseCreateReferenceOptionsResult {
  const { enabled = true } = options;
  const [state, setState] = useState<CourseCreateReferenceOptionsState>({ status: 'idle' });
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
        const response = await getCourseSearchReferenceOptions();

        if (cancelled) {
          return;
        }

        hasLoadedRef.current = true;
        requestInFlightRef.current = false;
        setState({
          status: 'success',
          schoolOptions: mapCodeNameReferenceOptionsToSelectOptions(response.schools),
          departmentOptions: response.departments.map((department) => ({
            schoolId: department.schoolId,
            value: String(department.id),
            label: `${department.name} (${department.code})`,
          })),
          subjectOptions: response.subjects.map((subject) => ({
            departmentId: subject.departmentId,
            value: String(subject.id),
            label: `${subject.name} (${subject.code})`,
          })),
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
    schoolOptions: state.status === 'success' ? state.schoolOptions : emptySchoolOptions,
    departmentOptions: state.status === 'success' ? state.departmentOptions : emptyDepartmentOptions,
    subjectOptions: state.status === 'success' ? state.subjectOptions : emptySubjectOptions,
    referenceOptionsError: state.status === 'error' ? state.message : null,
    referenceOptionsLoading: enabled && (state.status === 'idle' || state.status === 'loading'),
  };
}
