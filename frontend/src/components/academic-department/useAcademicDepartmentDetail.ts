import { useEffect, useRef, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  createAcademicSubject,
  getAcademicDepartmentById,
  getAcademicDepartmentSubjectCourses,
  patchAcademicDepartment,
} from '@/services/academic-department-service';
import {
  buildCreateAcademicSubjectRequest,
  buildPatchAcademicDepartmentRequest,
  hasAcademicDepartmentDetailChanges,
  mapAcademicDepartmentDetailToFormValues,
} from '@/services/mappers/academic-department-mappers';
import type {
  AcademicDepartmentDetailFormValues,
  AcademicDepartmentResponse,
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
  CreateAcademicSubjectRequest,
} from '@/services/schemas/academic-department-schemas';
import {
  initialAcademicDepartmentDetailFormValues,
  initialCreateAcademicSubjectRequest,
} from '@/services/schemas/academic-department-schemas';
import { getErrorMessage } from '@/utils/errors';
import type { SubjectCoursesState } from './academicDepartmentSubjectCoursesTypes';

type AcademicDepartmentDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; department: AcademicDepartmentResponse };

type AcademicDepartmentDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicDepartmentCreateSubjectState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export function useAcademicDepartmentDetail(departmentId: string | undefined) {
  const parsedDepartmentId = Number(departmentId);
  const hasValidDepartmentId = Number.isInteger(parsedDepartmentId) && parsedDepartmentId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [pageState, setPageState] = useState<AcademicDepartmentDetailPageState>({
    status: 'loading',
  });
  const [saveState, setSaveState] = useState<AcademicDepartmentDetailSaveState>({
    status: 'idle',
  });
  const [createSubjectState, setCreateSubjectState] =
    useState<AcademicDepartmentCreateSubjectState>({
      status: 'idle',
    });
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<number[]>([]);
  const [subjectCoursesBySubjectId, setSubjectCoursesBySubjectId] = useState<
    Record<number, SubjectCoursesState>
  >({});
  const [subjectSortBy, setSubjectSortBy] = useState<AcademicDepartmentSortBy>('code');
  const [subjectSortDirection, setSubjectSortDirection] =
    useState<AcademicDepartmentSortDirection>('asc');
  const subjectCourseAbortControllersRef = useRef<Record<number, AbortController>>({});
  const form = useForm<AcademicDepartmentDetailFormValues>({
    initialValues: initialAcademicDepartmentDetailFormValues,
  });
  const createSubjectForm = useForm<CreateAcademicSubjectRequest>({
    initialValues: initialCreateAcademicSubjectRequest,
  });

  useEffect(() => {
    if (saveState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveState((current) => (current.status === 'success' ? { status: 'idle' } : current));
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveState.status]);

  useEffect(() => {
    return () => {
      Object.values(subjectCourseAbortControllersRef.current).forEach((abortController) => {
        abortController.abort();
      });
    };
  }, []);

  useEffect(() => {
    Object.values(subjectCourseAbortControllersRef.current).forEach((abortController) => {
      abortController.abort();
    });
    subjectCourseAbortControllersRef.current = {};
    setExpandedSubjectIds([]);
    setSubjectCoursesBySubjectId({});
  }, [parsedDepartmentId]);

  useEffect(() => {
    if (!hasValidDepartmentId) {
      setPageState({
        status: 'error',
        message: 'Academic department ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    const shouldSyncForm =
      pageState.status !== 'success' || pageState.department.departmentId !== parsedDepartmentId;

    if (shouldSyncForm) {
      setPageState({ status: 'loading' });
    }

    getAcademicDepartmentById({
      departmentId: parsedDepartmentId,
      sortBy: subjectSortBy,
      sortDirection: subjectSortDirection,
      signal: abortController.signal,
    })
      .then((department) => {
        if (shouldSyncForm) {
          form.setValues(mapAcademicDepartmentDetailToFormValues(department));
          setIsEditing(false);
          setSaveState({ status: 'idle' });
        }
        setPageState({ status: 'success', department });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic department detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidDepartmentId, parsedDepartmentId, subjectSortBy, subjectSortDirection]);

  async function saveDepartment(detail: AcademicDepartmentResponse) {
    if (saveState.status === 'saving') {
      return;
    }

    try {
      const request = buildPatchAcademicDepartmentRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      await patchAcademicDepartment({
        departmentId: detail.departmentId,
        request,
      });
      const refreshedDepartment = await getAcademicDepartmentById({
        departmentId: detail.departmentId,
        sortBy: subjectSortBy,
        sortDirection: subjectSortDirection,
      });
      form.setValues(mapAcademicDepartmentDetailToFormValues(refreshedDepartment));
      setPageState({ status: 'success', department: refreshedDepartment });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic department detail.'),
      });
    }
  }

  function cancelEdit(detail: AcademicDepartmentResponse) {
    form.setValues(mapAcademicDepartmentDetailToFormValues(detail));
    setSaveState({ status: 'idle' });
    setIsEditing(false);
  }

  function beginEdit(detail: AcademicDepartmentResponse) {
    form.setValues(mapAcademicDepartmentDetailToFormValues(detail));
    setSaveState({ status: 'idle' });
    setIsEditing(true);
  }

  function openCreateSubjectModal() {
    createSubjectForm.reset();
    setCreateSubjectState({ status: 'idle' });
    setIsCreateSubjectOpen(true);
  }

  function closeCreateSubjectModal() {
    setIsCreateSubjectOpen(false);
    setCreateSubjectState({ status: 'idle' });
    createSubjectForm.reset();
  }

  async function createSubject(detail: AcademicDepartmentResponse) {
    if (createSubjectState.status === 'saving') {
      return;
    }

    try {
      const request = buildCreateAcademicSubjectRequest(createSubjectForm.values);

      setCreateSubjectState({ status: 'saving' });
      await createAcademicSubject({
        departmentId: detail.departmentId,
        request,
      });

      const refreshedDepartment = await getAcademicDepartmentById({
        departmentId: detail.departmentId,
        sortBy: subjectSortBy,
        sortDirection: subjectSortDirection,
      });

      form.setValues(mapAcademicDepartmentDetailToFormValues(refreshedDepartment));
      setPageState({ status: 'success', department: refreshedDepartment });
      closeCreateSubjectModal();
    } catch (error) {
      setCreateSubjectState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create academic subject.'),
      });
    }
  }

  function toggleSubjectSort(nextSortBy: AcademicDepartmentSortBy) {
    if (nextSortBy === subjectSortBy) {
      setSubjectSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSubjectSortBy(nextSortBy);
    setSubjectSortDirection('asc');
  }

  function isSubjectExpanded(subjectId: number): boolean {
    return expandedSubjectIds.includes(subjectId);
  }

  async function loadSubjectCourses(subjectId: number) {
    if (!hasValidDepartmentId) {
      return;
    }

    const existingState = subjectCoursesBySubjectId[subjectId];
    if (existingState?.status === 'loading' || existingState?.status === 'success') {
      return;
    }

    subjectCourseAbortControllersRef.current[subjectId]?.abort();
    const abortController = new AbortController();
    subjectCourseAbortControllersRef.current[subjectId] = abortController;

    setSubjectCoursesBySubjectId((current) => ({
      ...current,
      [subjectId]: { status: 'loading' },
    }));

    try {
      const courses = await getAcademicDepartmentSubjectCourses({
        departmentId: parsedDepartmentId,
        subjectId,
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      setSubjectCoursesBySubjectId((current) => ({
        ...current,
        [subjectId]: { status: 'success', courses },
      }));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setSubjectCoursesBySubjectId((current) => ({
        ...current,
        [subjectId]: {
          status: 'error',
          message: getErrorMessage(error, 'Failed to load subject courses.'),
        },
      }));
    } finally {
      if (subjectCourseAbortControllersRef.current[subjectId] === abortController) {
        delete subjectCourseAbortControllersRef.current[subjectId];
      }
    }
  }

  function toggleSubjectExpansion(subjectId: number) {
    if (isSubjectExpanded(subjectId)) {
      setExpandedSubjectIds((current) =>
        current.filter((currentSubjectId) => currentSubjectId !== subjectId)
      );
      return;
    }

    setExpandedSubjectIds((current) => [...current, subjectId]);
    const existingState = subjectCoursesBySubjectId[subjectId];
    if (existingState?.status !== 'success' && existingState?.status !== 'loading') {
      void loadSubjectCourses(subjectId);
    }
  }

  function retrySubjectCourses(subjectId: number) {
    setSubjectCoursesBySubjectId((current) => ({
      ...current,
      [subjectId]: { status: 'idle' },
    }));
    void loadSubjectCourses(subjectId);
  }

  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const createSubjectError =
    createSubjectState.status === 'error' ? createSubjectState.message : null;
  const createSubjectInProgress = createSubjectState.status === 'saving';
  const detail = pageState.status === 'success' ? pageState.department : null;
  const canSaveChanges = detail ? hasAcademicDepartmentDetailChanges(detail, form.values) : false;

  return {
    beginEdit,
    canSaveChanges,
    closeCreateSubjectModal,
    createSubject,
    createSubjectError,
    createSubjectForm,
    createSubjectInProgress,
    expandedSubjectIds,
    form,
    isCreateCourseModalOpen,
    isCreateSubjectOpen,
    isEditing,
    openCreateSubjectModal,
    pageState,
    parsedDepartmentId,
    retrySubjectCourses,
    saveDepartment,
    saveError,
    saveInProgress,
    saveSucceeded,
    setIsCreateCourseModalOpen,
    subjectCoursesBySubjectId,
    subjectSortBy,
    subjectSortDirection,
    toggleSubjectExpansion,
    toggleSubjectSort,
    cancelEdit,
  };
}
