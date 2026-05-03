import { useEffect, useMemo, useState } from 'react';
import { getCoursePickerReferenceOptions } from '@/services/reference-service';
import type {
  AcademicDepartmentReferenceOption,
  CourseReferenceOption,
} from '@/services/schemas/reference-schemas';
import { getErrorMessage } from '@/utils/errors';

type CoursePickerOptionsState =
  | { status: 'idle' | 'loading' }
  | {
      status: 'success';
      courses: CourseReferenceOption[];
      departments: AcademicDepartmentReferenceOption[];
    }
  | { status: 'error'; message: string };

export function useCoursePickerOptions(enabled: boolean) {
  const [state, setState] = useState<CoursePickerOptionsState>({ status: 'idle' });

  useEffect(() => {
    if (!enabled || state.status === 'success' || state.status === 'loading') {
      return;
    }

    setState({ status: 'loading' });

    getCoursePickerReferenceOptions()
      .then((response) => {
        setState({
          status: 'success',
          courses: response.courses,
          departments: response.departments,
        });
      })
      .catch((error) => {
        setState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course options.'),
        });
      });
  }, [enabled, state.status]);

  const selectOptions = useMemo(
    () =>
      state.status === 'success'
        ? state.courses.map((course) => ({
            value: String(course.courseId),
            label: course.lab ? `${course.courseCode} (Lab)` : course.courseCode,
          }))
        : [],
    [state]
  );

  const departmentOptions = useMemo(
    () =>
      state.status === 'success'
        ? state.departments.map((department) => ({
            value: String(department.id),
            label: `${department.name} (${department.code})`,
          }))
        : [],
    [state]
  );

  return {
    courses: state.status === 'success' ? state.courses : [],
    departments: state.status === 'success' ? state.departments : [],
    departmentOptions,
    error: state.status === 'error' ? state.message : null,
    loading: state.status === 'idle' || state.status === 'loading',
    selectOptions,
  };
}
