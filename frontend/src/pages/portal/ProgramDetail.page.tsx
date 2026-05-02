import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
  Table,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { ProgramRequirementModal } from '@/components/program/ProgramRequirementModal';
import {
  formatRequirementSource,
  formatRequirementTarget,
  formatRequirementType,
} from '@/components/program/programRequirementFormatters';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getProgramDetail } from '@/services/program-service';
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
import { displayValue } from '@/utils/form-values';

type ProgramDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; program: ProgramDetailResponse };

type AttachRequirementState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type AssignmentUpdateState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type AssignmentRemoveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

function formatClassYearRange(version: ProgramVersionDetailResponse) {
  if (version.classYearEnd === null) {
    return `${version.classYearStart}+`;
  }

  return `${version.classYearStart}-${version.classYearEnd}`;
}

function ProgramVersionsTable({
  currentVersionId,
  onSelectVersion,
  selectedVersionId,
  versions,
}: {
  currentVersionId: number | null;
  onSelectVersion: (versionId: number) => void;
  selectedVersionId: number | null;
  versions: ProgramVersionDetailResponse[];
}) {
  return (
    <RecordPageSection
      title="Program Versions"
      description="Version history for this program."
    >
      <Grid.Col span={12}>
        {versions.length === 0 ? (
          <Alert color="gray" title="No versions found">
            This program does not have any versions yet.
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Class Years</Table.Th>
                  <Table.Th>Requirements</Table.Th>
                  <Table.Th>Current</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {versions.map((version) => {
                  const isSelected = version.programVersionId === selectedVersionId;
                  const isCurrent = version.programVersionId === currentVersionId;

                  return (
                    <Table.Tr
                      key={version.programVersionId}
                      role="button"
                      tabIndex={0}
                      aria-selected={isSelected}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                      }}
                      onClick={() => {
                        onSelectVersion(version.programVersionId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectVersion(version.programVersionId);
                        }
                      }}
                    >
                      <Table.Td>Version {version.versionNumber}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={version.published ? 'green' : 'gray'}>
                          {version.published ? 'Published' : 'Draft'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatClassYearRange(version)}</Table.Td>
                      <Table.Td>{version.requirements.length}</Table.Td>
                      <Table.Td>{isCurrent ? 'Yes' : '—'}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}

function ProgramVersionDetailSection({
  onAddRequirementClick,
  onRequirementClick,
  version,
}: {
  onAddRequirementClick: () => void;
  onRequirementClick: (requirement: ProgramVersionRequirementResponse) => void;
  version: ProgramVersionDetailResponse;
}) {
  return (
    <RecordPageSection
      title={`Version ${version.versionNumber}`}
      description={`${version.published ? 'Published' : 'Draft'} program version for class years ${formatClassYearRange(version)}.`}
      action={
        <Group gap="xs">
          <Badge variant="light" color={version.published ? 'green' : 'gray'}>
            {version.published ? 'Published' : 'Draft'}
          </Badge>
          <Button size="xs" onClick={onAddRequirementClick}>
            Add Existing Requirement
          </Button>
        </Group>
      }
    >
      <ReadOnlyField label="Class years" value={formatClassYearRange(version)} />
      <ReadOnlyField label="Published" value={displayValue(version.published)} />
      <ReadOnlyField label="Notes" value={displayValue(version.notes)} span={12} />

      <Grid.Col span={12}>
        {version.requirements.length === 0 ? (
          <Alert color="gray" title="No requirements assigned">
            This version does not have requirements assigned yet.
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={980}>
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Requirement</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>Courses / Rules</Table.Th>
                  <Table.Th>Notes</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {version.requirements.map((requirement) => (
                  <Table.Tr
                    key={requirement.programVersionRequirementId}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onRequirementClick(requirement);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRequirementClick(requirement);
                      }
                    }}
                  >
                    <Table.Td>{requirement.sortOrder}</Table.Td>
                    <Table.Td>{displayValue(requirement.requirementCode)}</Table.Td>
                    <Table.Td>{displayValue(requirement.requirementName)}</Table.Td>
                    <Table.Td>{formatRequirementType(requirement.requirementType)}</Table.Td>
                    <Table.Td>{formatRequirementTarget(requirement)}</Table.Td>
                    <Table.Td>{formatRequirementSource(requirement)}</Table.Td>
                    <Table.Td>{displayValue(requirement.notes)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}

export function ProgramDetailPage() {
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/programs',
  });
  const { programId } = useParams<{ programId: string }>();
  const parsedProgramId = Number(programId);
  const hasValidProgramId = Number.isInteger(parsedProgramId) && parsedProgramId > 0;
  const [pageState, setPageState] = useState<ProgramDetailPageState>({ status: 'loading' });
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProgramVersionRequirementResponse | null>(null);
  const [isAddRequirementModalOpen, setIsAddRequirementModalOpen] = useState(false);
  const [attachRequirementState, setAttachRequirementState] =
    useState<AttachRequirementState>({ status: 'idle' });
  const [assignmentUpdateState, setAssignmentUpdateState] =
    useState<AssignmentUpdateState>({ status: 'idle' });
  const [assignmentRemoveState, setAssignmentRemoveState] =
    useState<AssignmentRemoveState>({ status: 'idle' });

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
    setSelectedRequirement(null);
    setIsAddRequirementModalOpen(false);
    setAttachRequirementState({ status: 'idle' });
    setAssignmentUpdateState({ status: 'idle' });
    setAssignmentRemoveState({ status: 'idle' });

    getProgramDetail({
      programId: parsedProgramId,
      signal: abortController.signal,
    })
      .then((program) => {
        const defaultVersion =
          program.versions.find((version) => version.published && version.classYearEnd === null) ??
          program.versions[0] ??
          null;

        setSelectedVersionId(defaultVersion?.programVersionId ?? null);
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
  }, [hasValidProgramId, parsedProgramId]);

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
  const currentVersion = program.versions.find(
    (version) => version.published && version.classYearEnd === null
  );
  const selectedVersion =
    program.versions.find((version) => version.programVersionId === selectedVersionId) ??
    currentVersion ??
    program.versions[0] ??
    null;
  const assignedRequirementIds = new Set(
    selectedVersion?.requirements
      .map((requirement) => requirement.requirementId)
      .filter((requirementId): requirementId is number => requirementId !== null) ?? []
  );

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

  function updateRequirementAssignmentInPageState(
    updatedAssignment: ProgramVersionRequirementResponse
  ) {
    setPageState((current) => {
      if (current.status !== 'success') {
        return current;
      }

      return {
        status: 'success',
        program: {
          ...current.program,
          versions: current.program.versions.map((version) => ({
            ...version,
            requirements: version.requirements
              .map((requirement) =>
                requirement.programVersionRequirementId ===
                updatedAssignment.programVersionRequirementId
                  ? updatedAssignment
                  : requirement
              )
              .sort((first, second) => first.sortOrder - second.sortOrder),
          })),
        },
      };
    });
  }

  function removeRequirementAssignmentFromPageState(programVersionRequirementId: number) {
    setPageState((current) => {
      if (current.status !== 'success') {
        return current;
      }

      return {
        status: 'success',
        program: {
          ...current.program,
          versions: current.program.versions.map((version) => ({
            ...version,
            requirements: version.requirements.filter(
              (requirement) =>
                requirement.programVersionRequirementId !== programVersionRequirementId
            ),
          })),
        },
      };
    });
  }

  async function handleAttachRequirement(request: {
    requirementId: number;
    sortOrder: number | null;
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
        notes: request.notes,
      });

      setPageState((current) => {
        if (current.status !== 'success') {
          return current;
        }

        return {
          status: 'success',
          program: {
            ...current.program,
            versions: current.program.versions.map((version) => {
              if (version.programVersionId !== selectedVersion.programVersionId) {
                return version;
              }

              return {
                ...version,
                requirements: [...version.requirements, attachedRequirement].sort(
                  (first, second) => first.sortOrder - second.sortOrder
                ),
              };
            }),
          },
        };
      });
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
    notes: string | null;
  }) {
    if (assignmentUpdateState.status === 'saving') {
      return;
    }

    try {
      setAssignmentUpdateState({ status: 'saving' });
      const updatedAssignment = await patchProgramVersionRequirement(request);
      updateRequirementAssignmentInPageState(updatedAssignment);
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
      removeRequirementAssignmentFromPageState(programVersionRequirementId);
      setSelectedRequirement(null);
      setAssignmentRemoveState({ status: 'idle' });
    } catch (error) {
      setAssignmentRemoveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to remove requirement from version.'),
      });
    }
  }

  function openRequirementAssignment(requirement: ProgramVersionRequirementResponse) {
    setAssignmentUpdateState({ status: 'idle' });
    setAssignmentRemoveState({ status: 'idle' });
    setSelectedRequirement(requirement);
  }

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
        onClose={() => {
          if (
            assignmentUpdateState.status === 'saving' ||
            assignmentRemoveState.status === 'saving'
          ) {
            return;
          }

          if (selectedRequirement !== null) {
            setAssignmentUpdateState({ status: 'idle' });
            setAssignmentRemoveState({ status: 'idle' });
            setSelectedRequirement(null);
            return;
          }

          closeAddRequirementModal();
        }}
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
          <RecordPageSection title="Program" description="Core program information.">
            <ReadOnlyField label="Code" value={displayValue(program.code)} />
            <ReadOnlyField label="Name" value={displayValue(program.name)} />
            <ReadOnlyField label="Program type" value={displayValue(program.programTypeName)} />
            <ReadOnlyField label="Degree type" value={displayValue(program.degreeTypeName)} />
            <ReadOnlyField
              label="School"
              value={displayValue(
                program.schoolName && program.schoolCode
                  ? `${program.schoolName} (${program.schoolCode})`
                  : program.schoolName
              )}
            />
            <ReadOnlyField
              label="Department"
              value={displayValue(
                program.departmentName && program.departmentCode
                  ? `${program.departmentName} (${program.departmentCode})`
                  : program.departmentName
              )}
            />
            <ReadOnlyField label="Description" value={displayValue(program.description)} span={12} />
          </RecordPageSection>

          <RecordPageSection
            title="Version Summary"
            description="The current published version is based on the open-ended class-year range."
          >
            <ReadOnlyField
              label="Current published version"
              value={currentVersion ? `Version ${currentVersion.versionNumber}` : '—'}
            />
            <ReadOnlyField
              label="Current class years"
              value={currentVersion ? formatClassYearRange(currentVersion) : '—'}
            />
            <ReadOnlyField label="Total versions" value={displayValue(program.versions.length)} />
            <ReadOnlyField
              label="Published versions"
              value={displayValue(program.versions.filter((version) => version.published).length)}
            />
          </RecordPageSection>

          <ProgramVersionsTable
            currentVersionId={currentVersion?.programVersionId ?? null}
            onSelectVersion={setSelectedVersionId}
            selectedVersionId={selectedVersion?.programVersionId ?? null}
            versions={program.versions}
          />

          {selectedVersion ? (
            <ProgramVersionDetailSection
              version={selectedVersion}
              onAddRequirementClick={() => {
                setAttachRequirementState({ status: 'idle' });
                setIsAddRequirementModalOpen(true);
              }}
              onRequirementClick={openRequirementAssignment}
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
