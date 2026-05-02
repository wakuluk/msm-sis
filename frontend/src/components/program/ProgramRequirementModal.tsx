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
  Text,
  Textarea,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  ProgramVersionDetailResponse,
  ProgramVersionRequirementResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';
import { AddProgramRequirementContent } from './AddProgramRequirementContent';
import {
  formatRequirementSource,
  formatRequirementTarget,
  formatRequirementType,
  requirementTypeOptions,
} from './programRequirementFormatters';
import { ProgramRequirementRuleFields } from './ProgramRequirementRuleFields';
import {
  ProgramRequirementCourseRulesTable,
  ProgramRequirementCoursesTable,
} from './ProgramRequirementTables';

type SaveState = { status: 'idle' } | { status: 'saving' } | { status: 'error'; message: string };

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

export function ProgramRequirementModal({
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
  attachState: SaveState;
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
  removeState: SaveState;
  requirement: ProgramVersionRequirementResponse | null;
  updateState: SaveState;
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

    const normalizedSortOrder = assignmentSortOrder === '' ? null : Number(assignmentSortOrder);

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
            <ProgramRequirementRuleFields requirement={effectiveRequirement} />
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

          <ProgramRequirementCoursesTable requirement={effectiveRequirement} />
          <ProgramRequirementCourseRulesTable requirement={effectiveRequirement} />

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
        <AddProgramRequirementContent
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
