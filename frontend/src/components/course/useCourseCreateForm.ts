import { useEffect, useState } from 'react';
import { createCourse } from '@/services/course-service';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import {
  buildCreateCourseRequest,
  initialCourseCreateFormValues,
  type CourseCreateFormValues,
} from './courseCreateValidation';
import { getErrorMessage } from '@/utils/errors';

type UseCourseCreateFormArgs = {
  initialDepartmentId?: number | null;
  initialSchoolId?: number | null;
  opened: boolean;
  onClose: () => void;
  onCreated?: (courseVersion: CourseVersionDetailResponse) => void;
};

export type CourseCreateSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

export function useCourseCreateForm({
  initialDepartmentId = null,
  initialSchoolId = null,
  opened,
  onClose,
  onCreated,
}: UseCourseCreateFormArgs) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CourseCreateFormValues>(
    initialCourseCreateFormValues
  );
  const [submitState, setSubmitState] = useState<CourseCreateSubmitState>({ status: 'idle' });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSubmitting = submitState.status === 'submitting';

  useEffect(() => {
    if (!opened) {
      return;
    }

    setSchoolId(initialSchoolId === null ? null : String(initialSchoolId));
    setDepartmentId(initialDepartmentId === null ? null : String(initialDepartmentId));
    setSubjectId(null);
    setFormValues(initialCourseCreateFormValues);
    setSubmitState({ status: 'idle' });
    setValidationMessage(null);
  }, [initialDepartmentId, initialSchoolId, opened]);

  function handleSchoolChange(value: string | null) {
    setSchoolId(value);
    setDepartmentId(null);
    setSubjectId(null);
  }

  function handleDepartmentChange(value: string | null) {
    setDepartmentId(value);
    setSubjectId(null);
  }

  async function handleSubmit() {
    const result = buildCreateCourseRequest({ formValues, subjectId });

    if (result.status === 'invalid') {
      setValidationMessage(result.message);
      return;
    }

    setValidationMessage(null);
    setSubmitState({ status: 'submitting' });

    try {
      const courseVersion = await createCourse({ request: result.request });

      setSubmitState({ status: 'idle' });
      onCreated?.(courseVersion);
      onClose();
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create course.'),
      });
    }
  }

  return {
    departmentId,
    formValues,
    handleDepartmentChange,
    handleSchoolChange,
    handleSubmit,
    isSubmitting,
    schoolId,
    setFormValues,
    setSubjectId,
    subjectId,
    submitState,
    validationMessage,
  };
}
