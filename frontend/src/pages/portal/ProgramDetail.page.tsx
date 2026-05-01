import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  TextInput,
  Text,
  Textarea,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getProgramDetail } from '@/services/program-service';
import {
  attachProgramVersionRequirement,
  patchProgramVersionRequirement,
  removeProgramVersionRequirement,
  searchRequirements,
} from '@/services/requirement-service';
import type {
  ProgramDetailResponse,
  ProgramVersionDetailResponse,
  ProgramVersionRequirementResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';

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

type RequirementLibrarySearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; results: RequirementSearchResultResponse[]; totalElements: number };

const requirementTypeOptions = [
  { value: 'TOTAL_ELECTIVE_CREDITS', label: 'Elective credits' },
  { value: 'SPECIFIC_COURSES', label: 'Specific courses' },
  { value: 'DEPARTMENT_LEVEL_COURSES', label: 'Department courses' },
  { value: 'MANUAL', label: 'Manual review' },
];

function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function formatClassYearRange(version: ProgramVersionDetailResponse) {
  if (version.classYearEnd === null) {
    return `${version.classYearStart}+`;
  }

  return `${version.classYearStart}-${version.classYearEnd}`;
}

function formatRequirementType(type: string | null): string {
  switch (type) {
    case 'TOTAL_ELECTIVE_CREDITS':
      return 'Elective credits';
    case 'SPECIFIC_COURSES':
      return 'Specific courses';
    case 'DEPARTMENT_LEVEL_COURSES':
      return 'Department courses';
    case 'MANUAL':
      return 'Manual review';
    default:
      return displayValue(type);
  }
}

function formatRequirementTarget(requirement: ProgramVersionRequirementResponse): string {
  const targets = [];

  if (requirement.minimumCredits !== null) {
    targets.push(`${requirement.minimumCredits} credits`);
  }

  if (requirement.minimumCourses !== null) {
    targets.push(`${requirement.minimumCourses} courses`);
  }

  if (requirement.courseMatchMode === 'ALL' && requirement.requirementCourses.length > 0) {
    targets.push('All listed courses');
  }

  if (requirement.courseMatchMode === 'ANY' && requirement.requirementCourses.length > 0) {
    targets.push(`Choose ${requirement.minimumCourses ?? 'from'} listed courses`);
  }

  if (requirement.requirementType === 'DEPARTMENT_LEVEL_COURSES') {
    requirement.requirementCourseRules.forEach((rule) => {
      const department = rule.departmentCode ?? rule.departmentName ?? 'Department';
      const ruleTargets = [];

      if (rule.minimumCredits !== null) {
        ruleTargets.push(`${rule.minimumCredits} credits`);
      }

      if (rule.minimumCourses !== null) {
        ruleTargets.push(`${rule.minimumCourses} courses`);
      }

      if (ruleTargets.length > 0) {
        targets.push(`${department} ${formatCourseRuleRange(rule)}: ${ruleTargets.join(' or ')}`);
      }
    });
  }

  if (requirement.minimumGrade !== null) {
    targets.push(`Minimum grade ${requirement.minimumGrade}`);
  }

  return targets.length === 0 ? '—' : targets.join(', ');
}

function formatCourseRuleRange(rule: ProgramVersionRequirementResponse['requirementCourseRules'][number]) {
  if (rule.minimumCourseNumber === null && rule.maximumCourseNumber === null) {
    return 'any level';
  }

  if (rule.minimumCourseNumber !== null && rule.maximumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}-${rule.maximumCourseNumber}`;
  }

  if (rule.minimumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}+`;
  }

  return `up to ${rule.maximumCourseNumber}`;
}

function formatRequirementSource(requirement: ProgramVersionRequirementResponse): string {
  if (requirement.requirementCourses.length > 0) {
    return `${requirement.requirementCourses.length} listed course${requirement.requirementCourses.length === 1 ? '' : 's'}`;
  }

  if (requirement.requirementCourseRules.length > 0) {
    return requirement.requirementCourseRules
      .map((rule) => {
        const department = rule.departmentCode ?? rule.departmentName ?? 'Department';
        return `${department} ${formatCourseRuleRange(rule)}`;
      })
      .join(', ');
  }

  return requirement.requirementType === 'TOTAL_ELECTIVE_CREDITS' ? 'Any eligible elective' : '—';
}

function formatCourseDisplay(course: ProgramVersionRequirementResponse['requirementCourses'][number]) {
  if (course.subjectCode === null && course.courseNumber === null) {
    return '—';
  }

  return `${course.subjectCode ?? ''}${course.courseNumber ?? ''}`;
}

function formatRequirementLibraryTarget(requirement: RequirementSearchResultResponse): string {
  const targets = [];

  if (requirement.minimumCredits !== null) {
    targets.push(`${requirement.minimumCredits} credits`);
  }

  if (requirement.minimumCourses !== null) {
    targets.push(`${requirement.minimumCourses} courses`);
  }

  if (requirement.courseMatchMode === 'ALL' && requirement.requirementCourseCount > 0) {
    targets.push('All listed courses');
  }

  if (requirement.courseMatchMode === 'ANY' && requirement.requirementCourseCount > 0) {
    targets.push(`Choose ${requirement.minimumCourses ?? 'from'} listed courses`);
  }

  if (requirement.minimumGrade !== null) {
    targets.push(`Minimum grade ${requirement.minimumGrade}`);
  }

  return targets.length === 0 ? '—' : targets.join(', ');
}

function ReadOnlyField({
  label,
  value,
  span = { base: 12, md: 6 },
}: {
  label: string;
  value: string;
  span?: ComponentProps<typeof Grid.Col>['span'];
}) {
  const isEmptyValue = value === '—';

  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={isEmptyValue ? '' : value}
        placeholder={isEmptyValue ? '—' : undefined}
        readOnly
      />
    </Grid.Col>
  );
}

function EditableFieldHighlight({
  children,
  span,
}: {
  children: ReactNode;
  span: ComponentProps<typeof Grid.Col>['span'];
}) {
  return (
    <Grid.Col span={span}>
      <div
        style={{
          backgroundColor: 'var(--mantine-color-yellow-0)',
          border: '1px solid var(--mantine-color-yellow-4)',
          borderRadius: 'var(--mantine-radius-sm)',
          padding: 'var(--mantine-spacing-xs)',
        }}
      >
        {children}
      </div>
    </Grid.Col>
  );
}

function RequirementRuleFields({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  switch (requirement.requirementType) {
    case 'TOTAL_ELECTIVE_CREDITS':
      return (
        <>
          <ReadOnlyField
            label="Minimum Credits"
            value={displayValue(requirement.minimumCredits)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    case 'SPECIFIC_COURSES':
      return (
        <>
          <ReadOnlyField
            label="Course Match Mode"
            value={displayValue(requirement.courseMatchMode)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Courses"
            value={displayValue(requirement.minimumCourses)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    case 'DEPARTMENT_LEVEL_COURSES':
      return (
        <>
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Rule Count"
            value={displayValue(requirement.requirementCourseRules.length)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    default:
      return null;
  }
}

function RequirementCoursesTable({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  if (requirement.requirementCourses.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>
          Specific Courses
        </Text>
        <Badge variant="light">{requirement.requirementCourses.length}</Badge>
      </Group>
      <Table.ScrollContainer minWidth={620}>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Course ID</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Number</Table.Th>
              <Table.Th>Course</Table.Th>
              <Table.Th>Required</Table.Th>
              <Table.Th>Minimum Grade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requirement.requirementCourses.map((course) => (
              <Table.Tr key={course.requirementCourseId}>
                <Table.Td>{displayValue(course.courseId)}</Table.Td>
                <Table.Td>{displayValue(course.subjectCode)}</Table.Td>
                <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
                <Table.Td>{formatCourseDisplay(course)}</Table.Td>
                <Table.Td>{displayValue(course.required)}</Table.Td>
                <Table.Td>{displayValue(course.minimumGrade)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

function RequirementCourseRulesTable({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  if (requirement.requirementCourseRules.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>
          Department Course Rules
        </Text>
        <Badge variant="light">{requirement.requirementCourseRules.length}</Badge>
      </Group>
      <Table.ScrollContainer minWidth={820}>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rule ID</Table.Th>
              <Table.Th>Department ID</Table.Th>
              <Table.Th>Department Code</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Range</Table.Th>
              <Table.Th>Minimum Credits</Table.Th>
              <Table.Th>Minimum Courses</Table.Th>
              <Table.Th>Minimum Grade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requirement.requirementCourseRules.map((rule) => (
              <Table.Tr key={rule.requirementCourseRuleId}>
                <Table.Td>{displayValue(rule.requirementCourseRuleId)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentId)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentCode)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentName ?? rule.departmentCode)}</Table.Td>
                <Table.Td>{formatCourseRuleRange(rule)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumCredits)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumCourses)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumGrade)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
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

function RequirementDetailModal({
  addOpened,
  assignedRequirementIds,
  attachState,
  onAttach,
  onClose,
  onRemoveAssignment,
  onUpdateAssignment,
  removeState,
  requirement,
  updateState,
  version,
}: {
  addOpened: boolean;
  assignedRequirementIds: Set<number>;
  attachState: AttachRequirementState;
  onAttach: (request: {
    requirementId: number;
    sortOrder: number | null;
    notes: string | null;
  }) => Promise<void>;
  onClose: () => void;
  onRemoveAssignment: (programVersionRequirementId: number) => Promise<void>;
  onUpdateAssignment: (request: {
    programVersionRequirementId: number;
    sortOrder: number | null;
    notes: string | null;
  }) => Promise<void>;
  removeState: AssignmentRemoveState;
  requirement: ProgramVersionRequirementResponse | null;
  updateState: AssignmentUpdateState;
  version: ProgramVersionDetailResponse | null;
}) {
  const [previewRequirementType, setPreviewRequirementType] = useState<string | null>(null);
  const [assignmentSortOrder, setAssignmentSortOrder] = useState<number | string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentValidationMessage, setAssignmentValidationMessage] = useState<string | null>(null);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const isSaving =
    attachState.status === 'saving' ||
    updateState.status === 'saving' ||
    removeState.status === 'saving';

  useEffect(() => {
    setPreviewRequirementType(requirement?.requirementType ?? null);
    setAssignmentSortOrder(requirement?.sortOrder ?? '');
    setAssignmentNotes(requirement?.notes ?? '');
    setAssignmentValidationMessage(null);
    setIsEditingAssignment(false);
  }, [requirement]);

  const effectiveRequirement =
    requirement === null
      ? null
      : {
          ...requirement,
          requirementType: previewRequirementType ?? requirement.requirementType,
        };
  const isAddMode = addOpened && effectiveRequirement === null;

  async function handleUpdateAssignment() {
    if (effectiveRequirement === null) {
      return;
    }

    const normalizedSortOrder =
      assignmentSortOrder === '' ? null : Number(assignmentSortOrder);

    if (normalizedSortOrder !== null && Number.isNaN(normalizedSortOrder)) {
      setAssignmentValidationMessage('Sort order must be a number.');
      return;
    }

    setAssignmentValidationMessage(null);

    await onUpdateAssignment({
      programVersionRequirementId: effectiveRequirement.programVersionRequirementId,
      sortOrder: normalizedSortOrder,
      notes: assignmentNotes.trim() ? assignmentNotes.trim() : null,
    });
    setIsEditingAssignment(false);
  }

  function cancelAssignmentEdit() {
    setAssignmentSortOrder(effectiveRequirement?.sortOrder ?? '');
    setAssignmentNotes(effectiveRequirement?.notes ?? '');
    setAssignmentValidationMessage(null);
    setIsEditingAssignment(false);
  }

  return (
    <Modal
      opened={effectiveRequirement !== null || addOpened}
      onClose={onClose}
      title={
        isAddMode
          ? version
            ? `Add Existing Requirement to Version ${version.versionNumber}`
            : 'Add Existing Requirement'
          : effectiveRequirement?.requirementName ?? 'Requirement Detail'
      }
      size="80rem"
      centered
      closeOnClickOutside={!isSaving}
      closeOnEscape={!isSaving}
    >
      {effectiveRequirement ? (
        <Stack gap="lg">
          {assignmentValidationMessage ? (
            <Alert color="red" title="Unable to update assignment">
              {assignmentValidationMessage}
            </Alert>
          ) : null}

          {updateState.status === 'error' ? (
            <Alert color="red" title="Unable to update assignment">
              {updateState.message}
            </Alert>
          ) : null}

          {removeState.status === 'error' ? (
            <Alert color="red" title="Unable to remove assignment">
              {removeState.message}
            </Alert>
          ) : null}

          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Badge variant="light">
              {formatRequirementType(effectiveRequirement.requirementType)}
            </Badge>
            <Group gap="xs">
              {effectiveRequirement.requirementId !== null ? (
                <Button
                  component={Link}
                  to={`/academics/requirements/${effectiveRequirement.requirementId}`}
                  size="xs"
                  variant="light"
                >
                  Open Requirement
                </Button>
              ) : null}
              <Button
                size="xs"
                variant={isEditingAssignment ? 'light' : 'default'}
                onClick={() => {
                  setIsEditingAssignment(true);
                }}
                disabled={isEditingAssignment || isSaving}
              >
                Edit
              </Button>
            </Group>
          </Group>

          <Text size="sm" c="dimmed">
            {displayValue(effectiveRequirement.requirementDescription)}
          </Text>

          <Grid>
            <ReadOnlyField
              label="Requirement ID"
              value={displayValue(effectiveRequirement.requirementId)}
              span={{ base: 12, md: 3 }}
            />
            <ReadOnlyField
              label="Assignment ID"
              value={displayValue(effectiveRequirement.programVersionRequirementId)}
              span={{ base: 12, md: 3 }}
            />
            <ReadOnlyField
              label="Code"
              value={displayValue(effectiveRequirement.requirementCode)}
              span={{ base: 12, md: 3 }}
            />
            {isEditingAssignment ? (
              <EditableFieldHighlight span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Sort Order"
                  min={0}
                  value={assignmentSortOrder}
                  onChange={setAssignmentSortOrder}
                  disabled={isSaving}
                />
              </EditableFieldHighlight>
            ) : (
              <ReadOnlyField
                label="Sort Order"
                value={displayValue(effectiveRequirement.sortOrder)}
                span={{ base: 12, md: 3 }}
              />
            )}
            <ReadOnlyField label="Name" value={displayValue(effectiveRequirement.requirementName)} />
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Type"
                data={requirementTypeOptions}
                value={effectiveRequirement.requirementType}
                onChange={setPreviewRequirementType}
                allowDeselect={false}
                disabled
              />
            </Grid.Col>
            <ReadOnlyField
              label="Target Summary"
              value={formatRequirementTarget(effectiveRequirement)}
              span={12}
            />
            <ReadOnlyField
              label="Courses / Rules Summary"
              value={formatRequirementSource(effectiveRequirement)}
              span={12}
            />
            <RequirementRuleFields requirement={effectiveRequirement} />
            <ReadOnlyField
              label="Description"
              value={displayValue(effectiveRequirement.requirementDescription)}
              span={12}
            />
            {isEditingAssignment ? (
              <EditableFieldHighlight span={12}>
                <Textarea
                  label="Version Notes"
                  placeholder="Optional notes for this version assignment"
                  value={assignmentNotes}
                  onChange={(event) => {
                    setAssignmentNotes(event.currentTarget.value);
                  }}
                  disabled={isSaving}
                />
              </EditableFieldHighlight>
            ) : (
              <ReadOnlyField
                label="Version Notes"
                value={displayValue(effectiveRequirement.notes)}
                span={12}
              />
            )}
          </Grid>

          <RequirementCoursesTable requirement={effectiveRequirement} />
          <RequirementCourseRulesTable requirement={effectiveRequirement} />

          <Group justify="space-between">
            <Button
              color="red"
              variant="light"
              onClick={() => {
                void onRemoveAssignment(effectiveRequirement.programVersionRequirementId);
              }}
              loading={removeState.status === 'saving'}
              disabled={isSaving && removeState.status !== 'saving'}
            >
              Remove From Version
            </Button>

            {isEditingAssignment ? (
              <Group>
                <Button variant="default" onClick={cancelAssignmentEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleUpdateAssignment()}
                  loading={updateState.status === 'saving'}
                >
                  Save
                </Button>
              </Group>
            ) : null}
          </Group>
        </Stack>
      ) : isAddMode ? (
        <AddRequirementContent
          assignedRequirementIds={assignedRequirementIds}
          attachState={attachState}
          onAttach={onAttach}
          onClose={onClose}
          version={version}
        />
      ) : null}
    </Modal>
  );
}

function AddRequirementContent({
  assignedRequirementIds,
  attachState,
  onAttach,
  onClose,
  version,
}: {
  assignedRequirementIds: Set<number>;
  attachState: AttachRequirementState;
  onAttach: (request: {
    requirementId: number;
    sortOrder: number | null;
    notes: string | null;
  }) => Promise<void>;
  onClose: () => void;
  version: ProgramVersionDetailResponse | null;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [requirementType, setRequirementType] = useState<string | null>(null);
  const [searchState, setSearchState] =
    useState<RequirementLibrarySearchState>({ status: 'idle' });
  const [selectedRequirement, setSelectedRequirement] =
    useState<RequirementSearchResultResponse | null>(null);
  const [sortOrder, setSortOrder] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = attachState.status === 'saving';

  useEffect(() => {
    const nextSortOrder =
      version === null || version.requirements.length === 0
        ? 10
        : Math.max(...version.requirements.map((requirement) => requirement.sortOrder)) + 10;

    setCode('');
    setName('');
    setRequirementType(null);
    setSelectedRequirement(null);
    setSortOrder(nextSortOrder);
    setNotes('');
    setValidationMessage(null);
    setSearchState({ status: 'loading' });

    const abortController = new AbortController();

    searchRequirements({
      page: 0,
      size: 25,
      signal: abortController.signal,
    })
      .then((response) => {
        setSearchState({
          status: 'success',
          results: response.results,
          totalElements: response.totalElements,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search requirements.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [version]);

  async function handleSearch() {
    setSelectedRequirement(null);
    setValidationMessage(null);
    setSearchState({ status: 'loading' });

    try {
      const response = await searchRequirements({
        code,
        name,
        requirementType: requirementType ?? undefined,
        page: 0,
        size: 25,
      });

      setSearchState({
        status: 'success',
        results: response.results,
        totalElements: response.totalElements,
      });
    } catch (error) {
      setSearchState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to search requirements.'),
      });
    }
  }

  async function handleAttach() {
    if (selectedRequirement === null) {
      setValidationMessage('Select a requirement to attach.');
      return;
    }

    const normalizedSortOrder = sortOrder === '' ? null : Number(sortOrder);

    if (normalizedSortOrder !== null && Number.isNaN(normalizedSortOrder)) {
      setValidationMessage('Sort order must be a number.');
      return;
    }

    setValidationMessage(null);

    await onAttach({
      requirementId: selectedRequirement.requirementId,
      sortOrder: normalizedSortOrder,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <Stack gap="lg">
        {validationMessage ? (
          <Alert color="red" title="Unable to add existing requirement">
            {validationMessage}
          </Alert>
        ) : null}

        {attachState.status === 'error' ? (
          <Alert color="red" title="Unable to attach requirement">
            {attachState.message}
          </Alert>
        ) : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="Code"
              placeholder="REQ-HIST"
              value={code}
              onChange={(event) => {
                setCode(event.currentTarget.value);
              }}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Name"
              placeholder="Search by name"
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
              }}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label="Type"
              placeholder="Any type"
              data={requirementTypeOptions}
              value={requirementType}
              onChange={setRequirementType}
              clearable
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button
              fullWidth
              mt="xl"
              variant="default"
              onClick={() => void handleSearch()}
              disabled={isSaving || searchState.status === 'loading'}
            >
              Search
            </Button>
          </Grid.Col>
        </Grid>

        {searchState.status === 'loading' ? (
          <Alert color="blue" title="Searching requirements">
            Loading reusable requirements.
          </Alert>
        ) : null}

        {searchState.status === 'error' ? (
          <Alert color="red" title="Requirement search failed">
            {searchState.message}
          </Alert>
        ) : null}

        {searchState.status === 'success' ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Showing {searchState.results.length} of {searchState.totalElements} reusable requirements.
            </Text>
            {searchState.results.length === 0 ? (
              <Alert color="gray" title="No requirements found">
                Try a different code, name, or type.
              </Alert>
            ) : (
              <Table.ScrollContainer minWidth={900}>
                <Table withTableBorder withColumnBorders striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>Courses</Table.Th>
                      <Table.Th>Rules</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {searchState.results.map((requirement) => {
                      const isAssigned = assignedRequirementIds.has(requirement.requirementId);
                      const isSelected =
                        selectedRequirement?.requirementId === requirement.requirementId;

                      return (
                        <Table.Tr
                          key={requirement.requirementId}
                          role={isAssigned ? undefined : 'button'}
                          tabIndex={isAssigned ? undefined : 0}
                          aria-selected={isSelected}
                          style={{
                            cursor: isAssigned ? 'not-allowed' : 'pointer',
                            opacity: isAssigned ? 0.58 : undefined,
                            backgroundColor: isSelected
                              ? 'var(--mantine-color-blue-light)'
                              : undefined,
                          }}
                          onClick={() => {
                            if (!isAssigned) {
                              setSelectedRequirement(requirement);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (isAssigned || (event.key !== 'Enter' && event.key !== ' ')) {
                              return;
                            }

                            event.preventDefault();
                            setSelectedRequirement(requirement);
                          }}
                        >
                          <Table.Td>{requirement.code}</Table.Td>
                          <Table.Td>{requirement.name}</Table.Td>
                          <Table.Td>{formatRequirementType(requirement.requirementType)}</Table.Td>
                          <Table.Td>{formatRequirementLibraryTarget(requirement)}</Table.Td>
                          <Table.Td>{requirement.requirementCourseCount}</Table.Td>
                          <Table.Td>{requirement.requirementCourseRuleCount}</Table.Td>
                          <Table.Td>{isAssigned ? 'Already assigned' : isSelected ? 'Selected' : '—'}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        ) : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <NumberInput
              label="Sort Order"
              min={0}
              value={sortOrder}
              onChange={setSortOrder}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Textarea
              label="Version Notes"
              placeholder="Optional notes for this version assignment"
              value={notes}
              onChange={(event) => {
                setNotes(event.currentTarget.value);
              }}
              disabled={isSaving}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleAttach()}
            loading={isSaving}
            disabled={selectedRequirement === null}
          >
            Add Existing Requirement
          </Button>
        </Group>
    </Stack>
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
      <RequirementDetailModal
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
