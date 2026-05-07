import { Alert, Badge, Button, Grid, Group, Table, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  ProgramVersionCompletionRequirementResponse,
  ProgramVersionDetailResponse,
  ProgramVersionRequirementResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';
import {
  formatRequirementSource,
  formatRequirementTarget,
  formatRequirementType,
} from './programRequirementFormatters';
import {
  formatClassYearRange,
  formatCompletionRequirementSummary,
} from './programVersionFormatters';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export function ProgramVersionDetailSection({
  completionRequirementRemoveState,
  onAddCompletionRequirementClick,
  onAddRequirementClick,
  onCompletionRequirementClick,
  onRemoveCompletionRequirement,
  onRequirementClick,
  version,
}: {
  completionRequirementRemoveState: SaveState;
  onAddCompletionRequirementClick: () => void;
  onAddRequirementClick: () => void;
  onCompletionRequirementClick: (
    completionRequirement: ProgramVersionCompletionRequirementResponse
  ) => void;
  onRemoveCompletionRequirement: (programVersionCompletionRequirementId: number) => Promise<void>;
  onRequirementClick: (requirement: ProgramVersionRequirementResponse) => void;
  version: ProgramVersionDetailResponse;
}) {
  return (
    <RecordPageSection
      title={`Version ${version.versionNumber}`}
      description={`${version.published ? 'Published' : 'Draft'} program version for ${formatClassYearRange(version)}.`}
      action={
        <Group gap="xs">
          <Badge variant="light" color={version.published ? 'green' : 'gray'}>
            {version.published ? 'Published' : 'Draft'}
          </Badge>
          <Button size="xs" onClick={onAddRequirementClick}>
            Add Existing Requirement
          </Button>
          <Button size="xs" variant="default" onClick={onAddCompletionRequirementClick}>
            Add Program Requirement
          </Button>
        </Group>
      }
    >
      <ReadOnlyField label="Years" value={formatClassYearRange(version)} />
      <ReadOnlyField label="Published" value={displayValue(version.published)} />
      <ReadOnlyField label="Notes" value={displayValue(version.notes)} span={12} />

      <Grid.Col span={12}>
        <Text size="sm" fw={700} mb="xs">
          Course and Credit Requirements
        </Text>
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

      <Grid.Col span={12}>
        <Text size="sm" fw={700} mb="xs">
          Program Requirements
        </Text>
        {completionRequirementRemoveState.status === 'error' ? (
          <Alert color="red" title="Unable to remove completion requirement" mb="sm">
            {completionRequirementRemoveState.message}
          </Alert>
        ) : null}
        {version.completionRequirements.length === 0 ? (
          <Alert color="gray" title="No completion requirements assigned">
            This version does not require another major, minor, or program.
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Requirement</Table.Th>
                  <Table.Th>Options</Table.Th>
                  <Table.Th>Notes</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {version.completionRequirements.map((completionRequirement) => (
                  <Table.Tr
                    key={completionRequirement.programVersionCompletionRequirementId}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onCompletionRequirementClick(completionRequirement);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onCompletionRequirementClick(completionRequirement);
                      }
                    }}
                  >
                    <Table.Td>{completionRequirement.sortOrder}</Table.Td>
                    <Table.Td>{formatCompletionRequirementSummary(completionRequirement)}</Table.Td>
                    <Table.Td>{completionRequirement.options.length}</Table.Td>
                    <Table.Td>{displayValue(completionRequirement.notes)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={(event) => {
                            event.stopPropagation();
                            onCompletionRequirementClick(completionRequirement);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="subtle"
                          loading={completionRequirementRemoveState.status === 'saving'}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onRemoveCompletionRequirement(
                              completionRequirement.programVersionCompletionRequirementId
                            );
                          }}
                        >
                          Remove
                        </Button>
                      </Group>
                    </Table.Td>
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
