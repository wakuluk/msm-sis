import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  getAcademicSubTermStatuses,
  getAcademicTermById,
  patchAcademicTerm,
  shiftAcademicSubTermStatus,
} from '@/services/academic-term-service';
import {
  buildPatchAcademicTermRequest,
  hasAcademicTermDetailChanges,
  mapAcademicTermDetailToFormValues,
} from '@/services/mappers/academic-term-mappers';
import type {
  AcademicSubTermDetailFormValues,
  AcademicSubTermResponse,
  AcademicSubTermStatusesResponse,
  AcademicSubTermStatusShiftDirection,
} from '@/services/schemas/academic-years-schemas';
import { initialAcademicSubTermDetailFormValues } from '@/services/schemas/academic-years-schemas';
import { getErrorMessage } from '@/utils/errors';

type AcademicTermDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicTerm: AcademicSubTermResponse };

type AcademicTermStatusShiftState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicTermDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export function isConditionalAcademicTermStatus(code: string | null | undefined): boolean {
  const normalizedCode = code?.trim().toUpperCase() ?? null;

  return normalizedCode === 'CANCELLED';
}

export function useAcademicTermDetail(subTermId: string | undefined) {
  const parsedAcademicTermId = Number(subTermId);
  const hasValidAcademicTermId =
    Number.isInteger(parsedAcademicTermId) && parsedAcademicTermId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [detailState, setDetailState] = useState<AcademicTermDetailPageState>({
    status: 'loading',
  });
  const [saveState, setSaveState] = useState<AcademicTermDetailSaveState>({ status: 'idle' });
  const [statusShiftState, setStatusShiftState] = useState<AcademicTermStatusShiftState>({
    status: 'idle',
  });
  const [academicTermStatuses, setAcademicTermStatuses] =
    useState<AcademicSubTermStatusesResponse>([]);
  const [academicTermStatusesLoading, setAcademicTermStatusesLoading] = useState(true);
  const [academicTermStatusesError, setAcademicTermStatusesError] = useState<string | null>(null);
  const form = useForm<AcademicSubTermDetailFormValues>({
    initialValues: initialAcademicSubTermDetailFormValues,
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicTermStatusesLoading(true);
    setAcademicTermStatusesError(null);

    getAcademicSubTermStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicTermStatuses([...response].sort((left, right) => left.order - right.order));
        setAcademicTermStatusesLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicTermStatuses([]);
        setAcademicTermStatusesError(getErrorMessage(error, 'Failed to load sub term statuses.'));
        setAcademicTermStatusesLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

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
    if (!hasValidAcademicTermId) {
      setDetailState({
        status: 'error',
        message: 'Sub term ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getAcademicTermById({
      academicSubTermId: parsedAcademicTermId,
      signal: abortController.signal,
    })
      .then((response) => {
        form.setValues(mapAcademicTermDetailToFormValues(response));
        setIsEditing(false);
        setSaveState({ status: 'idle' });
        setStatusShiftState({ status: 'idle' });
        setDetailState({ status: 'success', academicTerm: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load sub term detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidAcademicTermId, parsedAcademicTermId]);

  const detail = detailState.status === 'success' ? detailState.academicTerm : null;
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const statusShiftInProgress = statusShiftState.status === 'saving';
  const statusShiftError = statusShiftState.status === 'error' ? statusShiftState.message : null;
  const statusShiftSucceeded = statusShiftState.status === 'success';
  const hasPendingMutation = saveInProgress || statusShiftInProgress;
  const canSaveChanges = detail ? hasAcademicTermDetailChanges(detail, form.values) : false;

  async function shiftStatus(direction: AcademicSubTermStatusShiftDirection) {
    if (statusShiftInProgress || !detail) {
      return;
    }

    try {
      setStatusShiftState({ status: 'saving' });
      const updatedAcademicTerm = await shiftAcademicSubTermStatus({
        academicSubTermId: detail.subTermId,
        direction,
      });
      form.setValues(mapAcademicTermDetailToFormValues(updatedAcademicTerm));
      setDetailState({ status: 'success', academicTerm: updatedAcademicTerm });
      setStatusShiftState({ status: 'success' });
    } catch (error) {
      setStatusShiftState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to shift sub term status.'),
      });
    }
  }

  async function saveAcademicTerm() {
    if (saveInProgress || !detail) {
      return;
    }

    try {
      const request = buildPatchAcademicTermRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedAcademicTerm = await patchAcademicTerm({
        academicSubTermId: detail.subTermId,
        request,
      });
      form.setValues(mapAcademicTermDetailToFormValues(updatedAcademicTerm));
      setDetailState({ status: 'success', academicTerm: updatedAcademicTerm });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save sub term detail.'),
      });
    }
  }

  function beginEdit() {
    if (!detail) {
      return;
    }

    form.setValues(mapAcademicTermDetailToFormValues(detail));
    setSaveState({ status: 'idle' });
    setIsEditing(true);
  }

  function cancelEdit() {
    if (!detail) {
      return;
    }

    form.setValues(mapAcademicTermDetailToFormValues(detail));
    setSaveState({ status: 'idle' });
    setIsEditing(false);
  }

  return {
    academicTermStatuses,
    academicTermStatusesError,
    academicTermStatusesLoading,
    beginEdit,
    canSaveChanges,
    cancelEdit,
    detail,
    detailState,
    form,
    hasPendingMutation,
    isEditing,
    saveAcademicTerm,
    saveError,
    saveInProgress,
    saveSucceeded,
    shiftStatus,
    statusShiftError,
    statusShiftInProgress,
    statusShiftSucceeded,
  };
}
