import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  getAcademicYearById,
  getAcademicYearCoursesSummary,
  getAcademicYearStatuses,
  patchAcademicYear,
  postAcademicYearTerms,
  shiftAcademicYearStatus,
} from '@/services/academic-year-service';
import {
  buildPatchAcademicYearRequest,
  buildPostAcademicYearTermsRequest,
  getAcademicYearResponseSubTerms,
  hasAcademicYearDetailChanges,
  mapAcademicYearDetailToFormValues,
} from '@/services/mappers/academic-year-mappers';
import {
  initialAcademicYearAddTermsFormValues,
  type AcademicYearAddTermsFormValues,
  type AcademicYearCoursesSummaryResponse,
  type AcademicYearCreateResponse,
  type AcademicYearDetailFormValues,
  initialAcademicYearDetailFormValues,
  initialAcademicYearTermFormValues,
  type AcademicYearStatusesResponse,
  type AcademicYearStatusShiftDirection,
} from '@/services/schemas/academic-years-schemas';
import { getErrorMessage } from '@/utils/errors';
import { compareAcademicTermGroups, compareAcademicTerms } from './academicYearDisplay';

type AcademicYearDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicYear: AcademicYearCreateResponse };

type AcademicYearDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicYearAddTermsState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicYearStatusShiftState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicYearCoursesSummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; summary: AcademicYearCoursesSummaryResponse };

function getAcademicYearStatusCode(detail: AcademicYearCreateResponse): string | null {
  return (
    detail.yearStatusCode?.trim() ??
    detail.academicYearStatusCode?.trim() ??
    detail.statusCode?.trim() ??
    null
  );
}

export function isConditionalAcademicYearStatus(code: string | null | undefined): boolean {
  const normalizedCode = code?.trim().toUpperCase() ?? null;

  return normalizedCode === 'CANCELLED';
}

export function useAcademicYearDetail({
  academicYearId,
  initialAcademicYear,
}: {
  academicYearId: string | undefined;
  initialAcademicYear: AcademicYearCreateResponse | null;
}) {
  const parsedAcademicYearId = Number(academicYearId);
  const hasValidAcademicYearId =
    Number.isInteger(parsedAcademicYearId) && parsedAcademicYearId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTerms, setIsAddingTerms] = useState(false);
  const [saveState, setSaveState] = useState<AcademicYearDetailSaveState>({ status: 'idle' });
  const [addTermsState, setAddTermsState] = useState<AcademicYearAddTermsState>({
    status: 'idle',
  });
  const [statusShiftState, setStatusShiftState] = useState<AcademicYearStatusShiftState>({
    status: 'idle',
  });
  const [academicYearStatuses, setAcademicYearStatuses] = useState<AcademicYearStatusesResponse>(
    []
  );
  const [academicYearStatusesLoading, setAcademicYearStatusesLoading] = useState(true);
  const [academicYearStatusesError, setAcademicYearStatusesError] = useState<string | null>(null);
  const [coursesSummaryState, setCoursesSummaryState] = useState<AcademicYearCoursesSummaryState>({
    status: 'loading',
  });
  const form = useForm<AcademicYearDetailFormValues>({
    initialValues: initialAcademicYear
      ? mapAcademicYearDetailToFormValues(initialAcademicYear)
      : initialAcademicYearDetailFormValues,
  });
  const addTermsForm = useForm<AcademicYearAddTermsFormValues>({
    initialValues: initialAcademicYearAddTermsFormValues,
  });
  const [detailState, setDetailState] = useState<AcademicYearDetailPageState>(() => {
    if (initialAcademicYear) {
      return { status: 'success', academicYear: initialAcademicYear };
    }

    return { status: 'loading' };
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicYearStatusesLoading(true);
    setAcademicYearStatusesError(null);

    getAcademicYearStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicYearStatuses([...response].sort((left, right) => left.order - right.order));
        setAcademicYearStatusesLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicYearStatuses([]);
        setAcademicYearStatusesError(
          getErrorMessage(error, 'Failed to load academic year statuses.')
        );
        setAcademicYearStatusesLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!hasValidAcademicYearId) {
      setCoursesSummaryState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setCoursesSummaryState({ status: 'loading' });

    getAcademicYearCoursesSummary({
      academicYearId: parsedAcademicYearId,
      signal: abortController.signal,
    })
      .then((summary) => {
        setCoursesSummaryState({ status: 'success', summary });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setCoursesSummaryState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic year courses summary.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidAcademicYearId, parsedAcademicYearId]);

  useEffect(() => {
    if (initialAcademicYear) {
      form.setValues(mapAcademicYearDetailToFormValues(initialAcademicYear));
      setIsEditing(false);
      setIsAddingTerms(false);
      setSaveState({ status: 'idle' });
      setStatusShiftState({ status: 'idle' });
      addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
      setAddTermsState({ status: 'idle' });
      setDetailState({ status: 'success', academicYear: initialAcademicYear });
      return;
    }

    if (!hasValidAcademicYearId) {
      setDetailState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getAcademicYearById({
      academicYearId: parsedAcademicYearId,
      signal: abortController.signal,
    })
      .then((response) => {
        form.setValues(mapAcademicYearDetailToFormValues(response));
        setIsEditing(false);
        setIsAddingTerms(false);
        setSaveState({ status: 'idle' });
        setStatusShiftState({ status: 'idle' });
        addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
        setAddTermsState({ status: 'idle' });
        setDetailState({ status: 'success', academicYear: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic year detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidAcademicYearId, initialAcademicYear, parsedAcademicYearId]);

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
    if (statusShiftState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusShiftState((current) =>
        current.status === 'success' ? { status: 'idle' } : current
      );
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusShiftState.status]);

  useEffect(() => {
    if (addTermsState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAddTermsState((current) => (current.status === 'success' ? { status: 'idle' } : current));
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [addTermsState.status]);

  const detail = detailState.status === 'success' ? detailState.academicYear : null;
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const statusShiftInProgress = statusShiftState.status === 'saving';
  const statusShiftError = statusShiftState.status === 'error' ? statusShiftState.message : null;
  const statusShiftSucceeded = statusShiftState.status === 'success';
  const addTermsInProgress = addTermsState.status === 'saving';
  const addTermsError = addTermsState.status === 'error' ? addTermsState.message : null;
  const addTermsSucceeded = addTermsState.status === 'success';
  const hasPendingMutation = saveInProgress || statusShiftInProgress || addTermsInProgress;
  const canSaveChanges = detail ? hasAcademicYearDetailChanges(detail, form.values) : false;
  const sortedTermGroups = detail
    ? [...detail.terms].sort(compareAcademicTermGroups).map((term) => ({
        ...term,
        subTerms: [...term.subTerms].sort(compareAcademicTerms),
      }))
    : [];
  const hasTermGroups = sortedTermGroups.length > 0;
  const sortedLegacyTerms = detail && !hasTermGroups ? getAcademicYearResponseSubTerms(detail) : [];
  const currentAcademicYearStatusCode = detail ? getAcademicYearStatusCode(detail) : null;

  async function saveAcademicYear() {
    if (!detail || saveInProgress) {
      return;
    }

    try {
      const request = buildPatchAcademicYearRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedAcademicYear = await patchAcademicYear({
        academicYearId: detail.academicYearId,
        request,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic year detail.'),
      });
    }
  }

  async function shiftStatus(direction: AcademicYearStatusShiftDirection) {
    if (!detail || statusShiftInProgress) {
      return;
    }

    try {
      setStatusShiftState({ status: 'saving' });
      const updatedAcademicYear = await shiftAcademicYearStatus({
        academicYearId: detail.academicYearId,
        direction,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setStatusShiftState({ status: 'success' });
    } catch (error) {
      setStatusShiftState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to shift academic year status.'),
      });
    }
  }

  function beginEdit() {
    if (!detail) {
      return;
    }

    cancelAddingTerms();
    setSaveState({ status: 'idle' });
    setIsEditing(true);
  }

  function cancelEdit() {
    if (!detail) {
      return;
    }

    form.setValues(mapAcademicYearDetailToFormValues(detail));
    setSaveState({ status: 'idle' });
    setIsEditing(false);
  }

  function startAddingTerms() {
    setSaveState({ status: 'idle' });
    setAddTermsState({ status: 'idle' });
    addTermsForm.setValues({
      terms: [{ ...initialAcademicYearTermFormValues }],
    });
    setIsAddingTerms(true);
  }

  function cancelAddingTerms() {
    addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
    setAddTermsState({ status: 'idle' });
    setIsAddingTerms(false);
  }

  function addTermRow() {
    addTermsForm.insertListItem('terms', { ...initialAcademicYearTermFormValues });
  }

  function removeTermRow(index: number) {
    addTermsForm.removeListItem('terms', index);
  }

  async function saveNewTerms() {
    if (!detail || addTermsInProgress) {
      return;
    }

    try {
      const request = buildPostAcademicYearTermsRequest(detail, addTermsForm.values.terms);

      setAddTermsState({ status: 'saving' });
      const updatedAcademicYear = await postAcademicYearTerms({
        academicYearId: detail.academicYearId,
        request,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setAddTermsState({ status: 'success' });
      setIsAddingTerms(false);
    } catch (error) {
      setAddTermsState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add academic year terms.'),
      });
    }
  }

  return {
    academicYearStatuses,
    academicYearStatusesError,
    academicYearStatusesLoading,
    addTermRow,
    addTermsError,
    addTermsForm,
    addTermsInProgress,
    addTermsSucceeded,
    beginEdit,
    canSaveChanges,
    cancelAddingTerms,
    cancelEdit,
    coursesSummaryState,
    currentAcademicYearStatusCode,
    detail,
    detailState,
    form,
    hasPendingMutation,
    hasTermGroups,
    isAddingTerms,
    isEditing,
    removeTermRow,
    saveAcademicYear,
    saveError,
    saveInProgress,
    saveNewTerms,
    saveSucceeded,
    shiftStatus,
    sortedLegacyTerms,
    sortedTermGroups,
    startAddingTerms,
    statusShiftError,
    statusShiftInProgress,
    statusShiftSucceeded,
  };
}
