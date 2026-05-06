import { Badge, Button, Collapse, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { PlannerTermPanel } from './PlannerTermPanel';
import {
  formatProgramTrackerPlannerCredits,
  getProgramTrackerYearCompletedCredits,
  getProgramTrackerYearPlannedCredits,
} from './program-tracker.helpers';
import type { ProgramTrackerPlannerCourse, ProgramTrackerPlannerYear } from './program-tracker.types';

type PlannerYearPanelProps = {
  expanded: boolean;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  onRemoveYear: (yearLabel: string) => void;
  onToggleYear: (yearLabel: string) => void;
  showSubterms: boolean;
  year: ProgramTrackerPlannerYear;
};

export function PlannerYearPanel({
  expanded,
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  onRemoveYear,
  onToggleYear,
  showSubterms,
  year,
}: PlannerYearPanelProps) {
  const completedCredits = getProgramTrackerYearCompletedCredits(year);
  const plannedCredits = getProgramTrackerYearPlannedCredits(year);

  return (
    <Paper
      key={year.label}
      withBorder
      radius="md"
      p="md"
      style={{
        backgroundColor: year.readOnly ? 'var(--mantine-color-blue-0)' : undefined,
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={700}>{year.label}</Text>
              {year.readOnly ? (
                <Badge variant="light" color="blue">
                  Completed history
                </Badge>
              ) : null}
            </Group>
            <Text size="sm" c="dimmed">
              {formatProgramTrackerPlannerCredits(completedCredits, plannedCredits)}
            </Text>
          </Stack>
          <Group gap="xs">
            {year.canRemove ? (
              <Button
                variant="subtle"
                color="red"
                onClick={() => {
                  onRemoveYear(year.label);
                }}
              >
                Remove year
              </Button>
            ) : null}
            <Button
              variant="subtle"
              onClick={() => {
                onToggleYear(year.label);
              }}
            >
              {expanded ? 'Hide year' : 'Show year'}
            </Button>
          </Group>
        </Group>

        <Collapse expanded={expanded}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            {year.terms.map((term) => (
              <PlannerTermPanel
                key={term.code}
                term={term}
                onOpenCourseDetails={onOpenCourseDetails}
                onReplacePlaceholderCourse={onReplacePlaceholderCourse}
                onRemoveCourse={onRemoveCourse}
                showSubterms={showSubterms}
              />
            ))}
          </SimpleGrid>
        </Collapse>
      </Stack>
    </Paper>
  );
}
