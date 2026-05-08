import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import type { ProgramTrackerCompletionRequirement } from './program-tracker.types';

type ProgramTrackerCompletionRequirementCardProps = {
  completionRequirement: ProgramTrackerCompletionRequirement;
};

export function ProgramTrackerCompletionRequirementCard({
  completionRequirement,
}: ProgramTrackerCompletionRequirementCardProps) {
  return (
    <Paper withBorder radius="sm" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Stack gap={2}>
            <Text size="sm" fw={600}>
              {completionRequirement.label}
            </Text>
            <Text size="xs" c="dimmed">
              {formatCompletionRequirementStatusSummary(completionRequirement)}
            </Text>
          </Stack>
          <Badge
            variant="light"
            color={getCompletionRequirementStatusColor(completionRequirement.status)}
          >
            {getCompletionRequirementStatusLabel(completionRequirement.status)}
          </Badge>
        </Group>

        {completionRequirement.notes ? (
          <Text size="xs" c="dimmed">
            {completionRequirement.notes}
          </Text>
        ) : null}

        <Group gap="xs" wrap="wrap">
          {completionRequirement.options.map((option) => (
            <Badge
              key={option.label}
              variant="light"
              color={getCompletionRequirementStatusColor(option.status)}
            >
              {option.label}
            </Badge>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}

function getCompletionRequirementStatusColor(
  status: ProgramTrackerCompletionRequirement['status']
) {
  if (status === 'completed') {
    return 'green';
  }

  return status === 'planned' ? 'yellow' : 'gray';
}

function getCompletionRequirementStatusLabel(
  status: ProgramTrackerCompletionRequirement['status']
) {
  if (status === 'completed') {
    return 'Completed';
  }

  return status === 'planned' ? 'Planned' : 'Needed';
}

function formatCompletionRequirementStatusSummary(
  completionRequirement: ProgramTrackerCompletionRequirement
) {
  return `${completionRequirement.completedCount} completed · ${completionRequirement.plannedCount} planned · ${completionRequirement.minimumCount} required`;
}
