import { useState } from 'react';
import {
  addCompletionRequirementToProgram,
  removeCompletionRequirementFromProgram,
  updateCompletionRequirementInProgram,
} from '@/components/program/programDetailState';
import {
  createProgramVersionCompletionRequirement,
  patchProgramVersionCompletionRequirement,
  removeProgramVersionCompletionRequirement,
} from '@/services/requirement-service';
import type {
  ProgramDetailResponse,
  ProgramVersionCompletionRequirementResponse,
  ProgramVersionDetailResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type UpdateProgramState = (updater: (program: ProgramDetailResponse) => ProgramDetailResponse) => void;

export function useProgramCompletionRequirements({
  selectedVersion,
  updateProgramInPageState,
}: {
  selectedVersion: ProgramVersionDetailResponse | null;
  updateProgramInPageState: UpdateProgramState;
}) {
  const [isAddCompletionRequirementModalOpen, setIsAddCompletionRequirementModalOpen] =
    useState(false);
  const [selectedCompletionRequirement, setSelectedCompletionRequirement] =
    useState<ProgramVersionCompletionRequirementResponse | null>(null);
  const [completionRequirementSaveState, setCompletionRequirementSaveState] =
    useState<SaveState>({ status: 'idle' });
  const [completionRequirementRemoveState, setCompletionRequirementRemoveState] =
    useState<SaveState>({ status: 'idle' });

  function resetCompletionRequirementState() {
    setIsAddCompletionRequirementModalOpen(false);
    setSelectedCompletionRequirement(null);
    setCompletionRequirementSaveState({ status: 'idle' });
    setCompletionRequirementRemoveState({ status: 'idle' });
  }

  function openAddCompletionRequirementModal() {
    setCompletionRequirementSaveState({ status: 'idle' });
    setSelectedCompletionRequirement(null);
    setIsAddCompletionRequirementModalOpen(true);
  }

  function openCompletionRequirement(
    completionRequirement: ProgramVersionCompletionRequirementResponse
  ) {
    setCompletionRequirementSaveState({ status: 'idle' });
    setCompletionRequirementRemoveState({ status: 'idle' });
    setSelectedCompletionRequirement(completionRequirement);
  }

  function closeCompletionRequirementModal() {
    if (completionRequirementSaveState.status === 'saving') {
      return;
    }

    setCompletionRequirementSaveState({ status: 'idle' });
    setIsAddCompletionRequirementModalOpen(false);
    setSelectedCompletionRequirement(null);
  }

  async function handleCreateCompletionRequirement(request: {
    minimumCount: number;
    sortOrder: number | null;
    notes: string | null;
    programTypeIds: number[];
  }) {
    if (selectedVersion === null || completionRequirementSaveState.status === 'saving') {
      return;
    }

    try {
      setCompletionRequirementSaveState({ status: 'saving' });
      const createdCompletionRequirement = await createProgramVersionCompletionRequirement({
        programVersionId: selectedVersion.programVersionId,
        request: {
          minimumCount: request.minimumCount,
          sortOrder: request.sortOrder,
          notes: request.notes,
          options: request.programTypeIds.map((programTypeId) => ({
            requiredProgramTypeId: programTypeId,
          })),
        },
      });
      updateProgramInPageState((program) =>
        addCompletionRequirementToProgram(
          program,
          selectedVersion.programVersionId,
          createdCompletionRequirement
        )
      );
      setCompletionRequirementSaveState({ status: 'idle' });
      setIsAddCompletionRequirementModalOpen(false);
    } catch (error) {
      setCompletionRequirementSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create completion requirement.'),
      });
    }
  }

  async function handleUpdateCompletionRequirement(request: {
    minimumCount: number;
    sortOrder: number | null;
    notes: string | null;
    programTypeIds: number[];
  }) {
    if (
      selectedCompletionRequirement === null ||
      completionRequirementSaveState.status === 'saving'
    ) {
      return;
    }

    try {
      setCompletionRequirementSaveState({ status: 'saving' });
      const updatedCompletionRequirement = await patchProgramVersionCompletionRequirement({
        programVersionCompletionRequirementId:
          selectedCompletionRequirement.programVersionCompletionRequirementId,
        request: {
          minimumCount: request.minimumCount,
          sortOrder: request.sortOrder,
          notes: request.notes,
          options: request.programTypeIds.map((programTypeId) => ({
            requiredProgramTypeId: programTypeId,
          })),
        },
      });
      updateProgramInPageState((program) =>
        updateCompletionRequirementInProgram(program, updatedCompletionRequirement)
      );
      setSelectedCompletionRequirement(updatedCompletionRequirement);
      setCompletionRequirementSaveState({ status: 'idle' });
      setSelectedCompletionRequirement(null);
    } catch (error) {
      setCompletionRequirementSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update completion requirement.'),
      });
    }
  }

  async function handleRemoveCompletionRequirement(programVersionCompletionRequirementId: number) {
    if (completionRequirementRemoveState.status === 'saving') {
      return;
    }

    try {
      setCompletionRequirementRemoveState({ status: 'saving' });
      await removeProgramVersionCompletionRequirement({ programVersionCompletionRequirementId });
      updateProgramInPageState((program) =>
        removeCompletionRequirementFromProgram(program, programVersionCompletionRequirementId)
      );
      if (
        selectedCompletionRequirement?.programVersionCompletionRequirementId ===
        programVersionCompletionRequirementId
      ) {
        setSelectedCompletionRequirement(null);
      }
      setCompletionRequirementRemoveState({ status: 'idle' });
    } catch (error) {
      setCompletionRequirementRemoveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to remove completion requirement.'),
      });
    }
  }

  return {
    completionRequirementModalClose: closeCompletionRequirementModal,
    completionRequirementRemoveState,
    completionRequirementSaveState,
    handleCreateCompletionRequirement,
    handleRemoveCompletionRequirement,
    handleUpdateCompletionRequirement,
    isAddCompletionRequirementModalOpen,
    openAddCompletionRequirementModal,
    openCompletionRequirement,
    resetCompletionRequirementState,
    selectedCompletionRequirement,
  };
}
