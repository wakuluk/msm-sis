import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { searchRequirements } from '@/services/requirement-service';
import type {
  ProgramVersionDetailResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import {
  formatRequirementLibraryTarget,
  formatRequirementType,
  requirementTypeOptions,
} from './programRequirementFormatters';

type SaveState = { status: 'idle' } | { status: 'saving' } | { status: 'error'; message: string };

type RequirementLibrarySearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; results: RequirementSearchResultResponse[]; totalElements: number };

export function AddProgramRequirementContent({
  assignedRequirementIds,
  attachState,
  onAttach,
  onClose,
  version,
}: {
  assignedRequirementIds: Set<number>;
  attachState: SaveState;
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
            Showing {searchState.results.length} of {searchState.totalElements} reusable
            requirements.
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
                        <Table.Td>
                          {isAssigned ? 'Already assigned' : isSelected ? 'Selected' : '—'}
                        </Table.Td>
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
