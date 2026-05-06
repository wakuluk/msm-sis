import { Badge, Button, Collapse, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { StatusProgress } from './StatusProgress';
import { ProgramTrackerCompletionRequirementCard } from './ProgramTrackerCompletionRequirementCard';
import { ProgramTrackerRequirementCard } from './ProgramTrackerRequirementCard';
import { formatProgramProgress } from './program-tracker.helpers';
import type { ProgramTrackerCourseSelection, ProgramTrackerProgram } from './program-tracker.types';

type ProgramTrackerProgramCardProps = {
  expanded: boolean;
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onRemoveProgram?: (studentProgramId: number) => void;
  onRequestProgram?: (studentProgramId: number) => void;
  onToggleProgram: (programCode: string) => void;
  program: ProgramTrackerProgram;
  removing?: boolean;
  requesting?: boolean;
};

export function ProgramTrackerProgramCard({
  expanded,
  onAddCourseToPlanner,
  onOpenCourseDetails,
  onRemoveCourseFromPlanner,
  onRemoveProgram,
  onRequestProgram,
  onToggleProgram,
  program,
  removing = false,
  requesting = false,
}: ProgramTrackerProgramCardProps) {
  const isExploringProgram = program.status.toUpperCase() === 'EXPLORING';
  const canManageProgramPreview =
    isExploringProgram && program.studentProgramId !== undefined;

  return (
    <Paper
      key={program.code}
      withBorder
      radius="md"
      p="md"
      bg={isExploringProgram ? 'yellow.0' : undefined}
      style={{
        borderColor: isExploringProgram ? 'var(--mantine-color-yellow-4)' : undefined,
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={6} maw={820} style={{ flex: 1 }}>
            <Group gap="xs" wrap="wrap">
              <Text fw={700}>{program.name}</Text>
              <Badge variant="light">{program.type}</Badge>
              <Badge variant="light" color={isExploringProgram ? 'yellow' : 'green'}>
                {program.status}
              </Badge>
            </Group>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                {formatProgramProgress(program)}
              </Text>
              <StatusProgress
                completed={program.completed}
                planned={program.planned}
                required={program.required}
                size="md"
              />
            </Stack>
          </Stack>
          <Group gap="xs" justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                onToggleProgram(program.code);
              }}
            >
              {expanded ? 'Hide requirements' : 'Show requirements'}
            </Button>
          </Group>
        </Group>

        <Collapse expanded={expanded}>
          <Stack gap="sm">
            {program.completionRequirements.length > 0 ? (
              <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                {program.completionRequirements.map((completionRequirement) => (
                  <ProgramTrackerCompletionRequirementCard
                    key={completionRequirement.label}
                    completionRequirement={completionRequirement}
                  />
                ))}
              </SimpleGrid>
            ) : null}

            <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
              {program.requirements.map((requirement) => (
                <ProgramTrackerRequirementCard
                  key={requirement.label}
                  program={program}
                  requirement={requirement}
                  onAddCourseToPlanner={onAddCourseToPlanner}
                  onOpenCourseDetails={onOpenCourseDetails}
                  onRemoveCourseFromPlanner={onRemoveCourseFromPlanner}
                />
              ))}
            </SimpleGrid>

            {canManageProgramPreview && (onRequestProgram || onRemoveProgram) ? (
              <Group justify="flex-end" gap="xs" pt="sm">
                {onRemoveProgram ? (
                  <Button
                    color="red"
                    loading={removing}
                    variant="subtle"
                    onClick={() => {
                      onRemoveProgram(program.studentProgramId!);
                    }}
                  >
                    Remove preview
                  </Button>
                ) : null}
                {onRequestProgram ? (
                  <Button
                    loading={requesting}
                    variant="light"
                    onClick={() => {
                      onRequestProgram(program.studentProgramId!);
                    }}
                  >
                    Request program
                  </Button>
                ) : null}
              </Group>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
