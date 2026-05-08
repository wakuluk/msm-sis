import { useMemo, useState } from 'react';
import {
  addRequirementAssignmentToProgram,
  removeRequirementAssignmentFromProgram,
  updateRequirementAssignmentInProgram,
} from '@/components/program/programDetailState';
import {
  attachProgramVersionRequirement,
  patchProgramVersionRequirement,
  removeProgramVersionRequirement,
} from '@/services/requirement-service';
import type {
  ProgramDetailResponse,
  ProgramVersionDetailResponse,
  ProgramVersionRequirementResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type UpdateProgramState = (updater: (program: ProgramDetailResponse) => ProgramDetailResponse) => void;

export function useProgramRequirementAssignments({
  selectedVersion,
  updateProgramInPageState,
}: {
  selectedVersion: ProgramVersionDetailResponse | null;
  updateProgramInPageState: UpdateProgramState;
}) {
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProgramVersionRequirementResponse | null>(null);
  const [isAddRequirementModalOpen, setIsAddRequirementModalOpen] = useState(false);
  const [attachRequirementState, setAttachRequirementState] =
    useState<SaveState>({ status: 'idle' });
  const [assignmentUpdateState, setAssignmentUpdateState] =
    useState<SaveState>({ status: 'idle' });
  const [assignmentRemoveState, setAssignmentRemoveState] =
    useState<SaveState>({ status: 'idle' });

  const assignedRequirementIds = useMemo(
    () =>
      new Set(
        selectedVersion?.requirements
          .map((requirement) => requirement.requirementId)
          .filter((requirementId): requirementId is number => requirementId !== null) ?? []
      ),
    [selectedVersion]
  );

  function resetRequirementAssignmentState() {
    setSelectedRequirement(null);
    setIsAddRequirementModalOpen(false);
    setAttachRequirementState({ status: 'idle' });
    setAssignmentUpdateState({ status: 'idle' });
    setAssignmentRemoveState({ status: 'idle' });
  }

  function openAddRequirementModal() {
    setAttachRequirementState({ status: 'idle' });
    setIsAddRequirementModalOpen(true);
  }

  function closeAddRequirementModal() {
    if (
      attachRequirementState.status === 'saving' ||
      assignmentUpdateState.status === 'saving' ||
      assignmentRemoveState.status === 'saving'
    ) {
      return;
    }

    setAttachRequirementState({ status: 'idle' });
    setIsAddRequirementModalOpen(false);
  }

  function openRequirementAssignment(requirement: ProgramVersionRequirementResponse) {
    setAssignmentUpdateState({ status: 'idle' });
    setAssignmentRemoveState({ status: 'idle' });
    setSelectedRequirement(requirement);
  }

  function closeRequirementAssignmentModal() {
    if (assignmentUpdateState.status === 'saving' || assignmentRemoveState.status === 'saving') {
      return;
    }

    if (selectedRequirement !== null) {
      setAssignmentUpdateState({ status: 'idle' });
      setAssignmentRemoveState({ status: 'idle' });
      setSelectedRequirement(null);
      return;
    }

    closeAddRequirementModal();
  }

  async function handleAttachRequirement(request: {
    requirementId: number;
    sortOrder: number | null;
    courseReusePolicy: string | null;
    notes: string | null;
  }) {
    if (selectedVersion === null || attachRequirementState.status === 'saving') {
      return;
    }

    try {
      setAttachRequirementState({ status: 'saving' });
      const attachedRequirement = await attachProgramVersionRequirement({
        programVersionId: selectedVersion.programVersionId,
        requirementId: request.requirementId,
        sortOrder: request.sortOrder,
        courseReusePolicy: request.courseReusePolicy,
        notes: request.notes,
      });

      updateProgramInPageState((program) =>
        addRequirementAssignmentToProgram(
          program,
          selectedVersion.programVersionId,
          attachedRequirement
        )
      );
      setAttachRequirementState({ status: 'idle' });
      setIsAddRequirementModalOpen(false);
    } catch (error) {
      setAttachRequirementState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to attach requirement.'),
      });
    }
  }

  async function handleUpdateAssignment(request: {
    programVersionRequirementId: number;
    sortOrder: number | null;
    courseReusePolicy: string | null;
    notes: string | null;
  }) {
    if (assignmentUpdateState.status === 'saving') {
      return;
    }

    try {
      setAssignmentUpdateState({ status: 'saving' });
      const updatedAssignment = await patchProgramVersionRequirement(request);
      updateProgramInPageState((program) =>
        updateRequirementAssignmentInProgram(program, updatedAssignment)
      );
      setSelectedRequirement(updatedAssignment);
      setAssignmentUpdateState({ status: 'idle' });
    } catch (error) {
      setAssignmentUpdateState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update requirement assignment.'),
      });
    }
  }

  async function handleRemoveAssignment(programVersionRequirementId: number) {
    if (assignmentRemoveState.status === 'saving') {
      return;
    }

    try {
      setAssignmentRemoveState({ status: 'saving' });
      await removeProgramVersionRequirement({ programVersionRequirementId });
      updateProgramInPageState((program) =>
        removeRequirementAssignmentFromProgram(program, programVersionRequirementId)
      );
      setSelectedRequirement(null);
      setAssignmentRemoveState({ status: 'idle' });
    } catch (error) {
      setAssignmentRemoveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to remove requirement from version.'),
      });
    }
  }

  return {
    assignedRequirementIds,
    assignmentRemoveState,
    assignmentUpdateState,
    attachRequirementState,
    handleAttachRequirement,
    handleRemoveAssignment,
    handleUpdateAssignment,
    isAddRequirementModalOpen,
    openAddRequirementModal,
    openRequirementAssignment,
    requirementModalClose: closeRequirementAssignmentModal,
    resetRequirementAssignmentState,
    selectedRequirement,
  };
}
