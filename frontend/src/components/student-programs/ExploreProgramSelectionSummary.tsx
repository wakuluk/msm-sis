import { Badge, Group, Stack, Text } from '@mantine/core';
import { getProgramTypeBadgeColor } from './explore-programs.helpers';
import type { SelectedExploreProgram } from './explore-programs.types';

type ExploreProgramSelectionSummaryProps = {
  selectedProgram: SelectedExploreProgram;
};

export function ExploreProgramSelectionSummary({
  selectedProgram,
}: ExploreProgramSelectionSummaryProps) {
  if (!selectedProgram) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Group gap="xs" wrap="wrap">
        <Text fw={700}>{selectedProgram.name}</Text>
        <Badge variant="light" color={getProgramTypeBadgeColor(selectedProgram.programTypeCode)}>
          {selectedProgram.programTypeName}
        </Badge>
        {selectedProgram.degreeTypeName ? (
          <Badge variant="outline">{selectedProgram.degreeTypeName}</Badge>
        ) : null}
      </Group>
      <Text size="sm" c="dimmed">
        {selectedProgram.description ??
          'Add this program to your tracker to preview its requirements before submitting a request.'}
      </Text>
    </Stack>
  );
}
