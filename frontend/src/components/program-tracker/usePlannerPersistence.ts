import { useEffect, useRef, useState } from 'react';
import type {
  StudentAcademicPlanDraftRequest,
  StudentAcademicPlanResponse,
  StudentProgramsResponse,
} from '@/services/schemas/student-program-schemas';
import { mapProgramTrackerYearsToAcademicPlanDraftRequest } from './program-tracker.mappers';
import type { ProgramTrackerPlannerYear } from './program-tracker.types';

export type PlannerPersistenceActions = {
  loadPrograms: (request?: { signal?: AbortSignal }) => Promise<StudentProgramsResponse>;
  previewPlan: (request: {
    request: StudentAcademicPlanDraftRequest;
    signal?: AbortSignal;
  }) => Promise<StudentProgramsResponse>;
  savePlan: (request: {
    request: StudentAcademicPlanDraftRequest;
    signal?: AbortSignal;
  }) => Promise<StudentAcademicPlanResponse>;
};

export function usePlannerPersistence({
  academicPlanId,
  academicPlanName,
  actions,
  applyProgramTrackerResponse,
  plannerYears,
}: {
  academicPlanId: number | null;
  academicPlanName: string;
  actions: PlannerPersistenceActions;
  applyProgramTrackerResponse: (
    response: StudentProgramsResponse,
    options?: { updatePlanIdentity?: boolean }
  ) => unknown;
  plannerYears: ProgramTrackerPlannerYear[];
}) {
  const [plannerSaveStatus, setPlannerSaveStatus] =
    useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [plannerSaveError, setPlannerSaveError] = useState<string | null>(null);
  const previewDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewAbortControllerRef = useRef<AbortController | null>(null);
  const previewRequestSequenceRef = useRef(0);

  useEffect(
    () => () => {
      cancelPendingPlannerPreview();
    },
    []
  );

  function markPlannerSaved() {
    setPlannerSaveStatus('saved');
  }

  function markPlannerUnsaved() {
    setPlannerSaveError(null);
    setPlannerSaveStatus('unsaved');
  }

  function clearPlannerSaveError() {
    setPlannerSaveError(null);
  }

  function cancelPendingPlannerPreview() {
    if (previewDebounceTimeoutRef.current) {
      clearTimeout(previewDebounceTimeoutRef.current);
      previewDebounceTimeoutRef.current = null;
    }

    previewAbortControllerRef.current?.abort();
    previewAbortControllerRef.current = null;
  }

  function schedulePlannerPreview(nextYears: ProgramTrackerPlannerYear[]) {
    if (previewDebounceTimeoutRef.current) {
      clearTimeout(previewDebounceTimeoutRef.current);
    }

    previewAbortControllerRef.current?.abort();

    const abortController = new AbortController();
    const requestSequence = previewRequestSequenceRef.current + 1;
    previewRequestSequenceRef.current = requestSequence;
    previewAbortControllerRef.current = abortController;

    previewDebounceTimeoutRef.current = setTimeout(() => {
      previewDebounceTimeoutRef.current = null;
      void previewPlannerYears(nextYears, requestSequence, abortController);
    }, 250);
  }

  async function previewPlannerYears(
    nextYears: ProgramTrackerPlannerYear[],
    requestSequence: number,
    abortController: AbortController
  ) {
    try {
      const previewResponse = await actions.previewPlan({
        request: mapProgramTrackerYearsToAcademicPlanDraftRequest({
          name: academicPlanName,
          studentAcademicPlanId: academicPlanId,
          years: nextYears,
        }),
        signal: abortController.signal,
      });

      if (
        abortController.signal.aborted ||
        requestSequence !== previewRequestSequenceRef.current
      ) {
        return;
      }

      applyProgramTrackerResponse(previewResponse, { updatePlanIdentity: false });
      setPlannerSaveError(null);
      setPlannerSaveStatus('unsaved');
    } catch (error) {
      if (
        abortController.signal.aborted ||
        requestSequence !== previewRequestSequenceRef.current
      ) {
        return;
      }

      setPlannerSaveError(
        error instanceof Error ? error.message : 'Failed to preview academic plan.'
      );
      setPlannerSaveStatus('unsaved');
    } finally {
      if (previewAbortControllerRef.current === abortController) {
        previewAbortControllerRef.current = null;
      }
    }
  }

  async function savePlanner() {
    cancelPendingPlannerPreview();
    setPlannerSaveStatus('saving');
    setPlannerSaveError(null);

    try {
      await actions.savePlan({
        request: mapProgramTrackerYearsToAcademicPlanDraftRequest({
          name: academicPlanName,
          studentAcademicPlanId: academicPlanId,
          years: plannerYears,
        }),
      });
      const refreshedResponse = await actions.loadPrograms();
      applyProgramTrackerResponse(refreshedResponse);
      setPlannerSaveStatus('saved');
    } catch (error) {
      setPlannerSaveError(
        error instanceof Error ? error.message : 'Failed to save academic plan.'
      );
      setPlannerSaveStatus('unsaved');
    }
  }

  return {
    clearPlannerSaveError,
    markPlannerSaved,
    markPlannerUnsaved,
    plannerSaveError,
    plannerSaveStatus,
    savePlanner,
    schedulePlannerPreview,
  };
}
