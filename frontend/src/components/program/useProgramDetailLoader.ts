import { useEffect, useState } from 'react';
import type { ProgramTypeOption } from '@/components/program/CompletionRequirementAssignmentModal';
import { getProgramDetail } from '@/services/program-service';
import { getProgramReferenceOptions } from '@/services/reference-service';
import type { ProgramDetailResponse } from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';

export type ProgramDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; program: ProgramDetailResponse };

export function useProgramDetailLoader({
  hasValidProgramId,
  programId,
}: {
  hasValidProgramId: boolean;
  programId: number;
}) {
  const [pageState, setPageState] = useState<ProgramDetailPageState>({ status: 'loading' });
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [programTypeOptions, setProgramTypeOptions] = useState<ProgramTypeOption[]>([]);

  useEffect(() => {
    if (!hasValidProgramId) {
      setPageState({
        status: 'error',
        message: 'Program ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });
    setSelectedVersionId(null);

    Promise.all([
      getProgramDetail({
        programId,
        signal: abortController.signal,
      }),
      getProgramReferenceOptions(),
    ])
      .then(([program, referenceOptions]) => {
        const defaultVersion =
          program.versions.find((version) => version.published && version.classYearEnd === null) ??
          program.versions[0] ??
          null;

        setSelectedVersionId(defaultVersion?.programVersionId ?? null);
        setProgramTypeOptions(
          referenceOptions.programTypes.map((option) => ({
            value: String(option.id),
            label: option.name,
          }))
        );
        setPageState({ status: 'success', program });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidProgramId, programId]);

  return {
    pageState,
    programTypeOptions,
    selectedVersionId,
    setPageState,
    setSelectedVersionId,
  };
}
