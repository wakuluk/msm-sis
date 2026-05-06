import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Stack,
  Textarea,
} from '@mantine/core';
import type {
  ProgramVersionCompletionRequirementResponse,
  ProgramVersionDetailResponse,
} from '@/services/schemas/program-schemas';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export type ProgramTypeOption = { value: string; label: string };

export function CompletionRequirementAssignmentModal({
  editingRequirement,
  opened,
  onClose,
  onSubmit,
  programTypeOptions,
  saveState,
  version,
}: {
  editingRequirement: ProgramVersionCompletionRequirementResponse | null;
  opened: boolean;
  onClose: () => void;
  onSubmit: (request: {
    minimumCount: number;
    sortOrder: number | null;
    notes: string | null;
    programTypeIds: number[];
  }) => Promise<void>;
  programTypeOptions: ProgramTypeOption[];
  saveState: SaveState;
  version: ProgramVersionDetailResponse | null;
}) {
  const [minimumCount, setMinimumCount] = useState<number | string>(1);
  const [sortOrder, setSortOrder] = useState<number | string>('');
  const [programTypeIds, setProgramTypeIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = saveState.status === 'saving';
  const isEditing = editingRequirement !== null;

  useEffect(() => {
    if (!opened) {
      return;
    }

    if (editingRequirement !== null) {
      setMinimumCount(editingRequirement.minimumCount);
      setSortOrder(editingRequirement.sortOrder);
      setProgramTypeIds(
        editingRequirement.options
          .map((option) => option.requiredProgramTypeId)
          .filter((programTypeId): programTypeId is number => programTypeId !== null)
          .map(String)
      );
      setNotes(editingRequirement.notes ?? '');
      setValidationMessage(null);
      return;
    }

    const nextSortOrder =
      version === null || version.completionRequirements.length === 0
        ? 10
        : Math.max(
            ...version.completionRequirements.map((requirement) => requirement.sortOrder)
          ) + 10;
    setMinimumCount(1);
    setSortOrder(nextSortOrder);
    setProgramTypeIds(
      programTypeOptions
        .filter((option) => option.label === 'Major' || option.label === 'Minor')
        .map((option) => option.value)
    );
    setNotes('');
    setValidationMessage(null);
  }, [editingRequirement, opened, programTypeOptions, version]);

  async function handleSubmit() {
    const normalizedMinimumCount = Number(minimumCount);
    const normalizedSortOrder = sortOrder === '' ? null : Number(sortOrder);
    const normalizedProgramTypeIds = programTypeIds.map(Number);

    if (!Number.isInteger(normalizedMinimumCount) || normalizedMinimumCount <= 0) {
      setValidationMessage('Minimum count must be a positive number.');
      return;
    }

    if (normalizedSortOrder !== null && Number.isNaN(normalizedSortOrder)) {
      setValidationMessage('Sort order must be a number.');
      return;
    }

    if (normalizedProgramTypeIds.length === 0) {
      setValidationMessage('Choose at least one program type option.');
      return;
    }

    setValidationMessage(null);
    await onSubmit({
      minimumCount: normalizedMinimumCount,
      sortOrder: normalizedSortOrder,
      notes: notes.trim() ? notes.trim() : null,
      programTypeIds: normalizedProgramTypeIds,
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEditing
          ? 'Edit Program Requirement'
          : version
            ? `Add Program Requirement to Version ${version.versionNumber}`
            : 'Add Program Requirement'
      }
      size="48rem"
      centered
      closeOnClickOutside={!isSaving}
      closeOnEscape={!isSaving}
    >
      <Stack gap="md">
        {validationMessage ? (
          <Alert color="red" title="Unable to save completion requirement">
            {validationMessage}
          </Alert>
        ) : null}
        {saveState.status === 'error' ? (
          <Alert color="red" title="Unable to save completion requirement">
            {saveState.message}
          </Alert>
        ) : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Minimum Count"
              min={1}
              value={minimumCount}
              onChange={setMinimumCount}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Sort Order"
              min={0}
              value={sortOrder}
              onChange={setSortOrder}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <MultiSelect
              label="Allowed Program Types"
              description="Use this for requirements like another major or minor."
              data={programTypeOptions}
              value={programTypeIds}
              onChange={setProgramTypeIds}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Notes"
              placeholder="Optional notes"
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
          <Button onClick={() => void handleSubmit()} loading={isSaving}>
            {isEditing ? 'Save Program Requirement' : 'Add Program Requirement'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
