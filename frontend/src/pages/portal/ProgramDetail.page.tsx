import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Stack,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import {
  CompletionRequirementAssignmentModal,
} from '@/components/program/CompletionRequirementAssignmentModal';
import { ProgramInfoSection } from '@/components/program/ProgramInfoSection';
import { ProgramRequirementModal } from '@/components/program/ProgramRequirementModal';
import { ProgramVersionDetailSection } from '@/components/program/ProgramVersionDetailSection';
import { ProgramVersionSummarySection } from '@/components/program/ProgramVersionSummarySection';
import { ProgramVersionsTable } from '@/components/program/ProgramVersionsTable';
import { useProgramCompletionRequirements } from '@/components/program/useProgramCompletionRequirements';
import { useProgramDetailLoader } from '@/components/program/useProgramDetailLoader';
import { useProgramRequirementAssignments } from '@/components/program/useProgramRequirementAssignments';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import type { ProgramDetailResponse } from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';

export function ProgramDetailPage() {
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/programs',
  });
  const { programId } = useParams<{ programId: string }>();
  const parsedProgramId = Number(programId);
  const hasValidProgramId = Number.isInteger(parsedProgramId) && parsedProgramId > 0;
  const {
    pageState,
    programTypeOptions,
    selectedVersionId,
    setPageState,
    setSelectedVersionId,
  } = useProgramDetailLoader({
    hasValidProgramId,
    programId: parsedProgramId,
  });
  const loadedProgram = pageState.status === 'success' ? pageState.program : null;
  const currentVersion = loadedProgram?.versions.find(
    (version) => version.published && version.classYearEnd === null
  );
  const selectedVersion =
    loadedProgram?.versions.find((version) => version.programVersionId === selectedVersionId) ??
    currentVersion ??
    loadedProgram?.versions[0] ??
    null;

  function updateProgramInPageState(updater: (program: ProgramDetailResponse) => ProgramDetailResponse) {
    setPageState((current) => {
      if (current.status !== 'success') {
        return current;
      }

      return {
        status: 'success',
        program: updater(current.program),
      };
    });
  }

  const {
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
    requirementModalClose,
    resetRequirementAssignmentState,
    selectedRequirement,
  } = useProgramRequirementAssignments({
    selectedVersion,
    updateProgramInPageState,
  });
  const {
    completionRequirementModalClose,
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
  } = useProgramCompletionRequirements({
    selectedVersion,
    updateProgramInPageState,
  });

  useEffect(() => {
    resetRequirementAssignmentState();
    resetCompletionRequirementState();
  }, [parsedProgramId]);

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Program Detail"
        description="Loading program detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection title="Program" description="The program detail is loading.">
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading program">
                Fetching program {programId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            <Button onClick={handleBack}>Back</Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'error') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Program Detail"
        description="Program detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="red">
            Load failed
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection title="Program" description="Review the error below.">
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load program">
                {pageState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            <Button onClick={handleBack} variant="default">
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const { program } = pageState;

  return (
    <>
      <ProgramRequirementModal
        addOpened={isAddRequirementModalOpen}
        assignedRequirementIds={assignedRequirementIds}
        attachState={attachRequirementState}
        requirement={selectedRequirement}
        removeState={assignmentRemoveState}
        updateState={assignmentUpdateState}
        version={selectedVersion}
        onAttach={handleAttachRequirement}
        onRemoveAssignment={handleRemoveAssignment}
        onUpdateAssignment={handleUpdateAssignment}
        onClose={requirementModalClose}
      />
      <CompletionRequirementAssignmentModal
        editingRequirement={selectedCompletionRequirement}
        opened={isAddCompletionRequirementModalOpen || selectedCompletionRequirement !== null}
        programTypeOptions={programTypeOptions}
        saveState={completionRequirementSaveState}
        version={selectedVersion}
        onSubmit={
          selectedCompletionRequirement === null
            ? handleCreateCompletionRequirement
            : handleUpdateCompletionRequirement
        }
        onClose={completionRequirementModalClose}
      />
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title={program.name}
        description="Review program details, version history, and assigned requirements."
        badge={
          <Badge variant="light" size="lg" color={program.programTypeCode === 'MAJOR' ? 'blue' : 'gray'}>
            {displayValue(program.programTypeName)}
          </Badge>
        }
      >
        <Stack gap={0}>
          <ProgramInfoSection program={program} />
          <ProgramVersionSummarySection currentVersion={currentVersion ?? null} program={program} />

          <ProgramVersionsTable
            currentVersionId={currentVersion?.programVersionId ?? null}
            onSelectVersion={setSelectedVersionId}
            selectedVersionId={selectedVersion?.programVersionId ?? null}
            versions={program.versions}
          />

          {selectedVersion ? (
            <ProgramVersionDetailSection
              version={selectedVersion}
              onAddRequirementClick={openAddRequirementModal}
              onAddCompletionRequirementClick={openAddCompletionRequirementModal}
              onCompletionRequirementClick={openCompletionRequirement}
              onRemoveCompletionRequirement={handleRemoveCompletionRequirement}
              onRequirementClick={openRequirementAssignment}
              completionRequirementRemoveState={completionRequirementRemoveState}
            />
          ) : (
            <RecordPageSection
              title="Selected Version"
              description="Selected version details."
            >
              <Grid.Col span={12}>
                <Alert color="gray" title="No version selected">
                  This program does not have a version to review yet.
                </Alert>
              </Grid.Col>
            </RecordPageSection>
          )}

          <RecordPageFooter description="Program detail navigation.">
            <Button component={Link} to="/academics/programs" variant="default">
              Program Search
            </Button>
            <Button onClick={handleBack} variant="default">
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    </>
  );
}
