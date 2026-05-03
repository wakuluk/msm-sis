import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  DraggablePlannerCourseRow,
  DroppablePlannerTerm,
} from './StudentProgramDnd';
import {
  getCourseStatusColor,
  getCourseStatusLabel,
  getTermCredits,
  getYearCredits,
} from './student-programs.helpers';
import type {
  PlannerCoursePreview,
  PlannerYearPreview,
} from './student-programs.types';

type SemesterPlannerSectionProps = {
  expandedPlannerYearLabels: Set<string>;
  onAddYear: () => void;
  onOpenCourseVersion: (courseCode: string) => void;
  onRemoveCourse: (termCode: string, course: PlannerCoursePreview) => void;
  onRemoveYear: (yearLabel: string) => void;
  onSave: () => void;
  onToggleReverseYears: () => void;
  onToggleYear: (yearLabel: string) => void;
  plannerSaveStatus: 'saved' | 'unsaved';
  plannerYears: PlannerYearPreview[];
  plannerYearsReversed: boolean;
};

export function SemesterPlannerSection({
  expandedPlannerYearLabels,
  onAddYear,
  onOpenCourseVersion,
  onRemoveCourse,
  onRemoveYear,
  onSave,
  onToggleReverseYears,
  onToggleYear,
  plannerSaveStatus,
  plannerYears,
  plannerYearsReversed,
}: SemesterPlannerSectionProps) {
  return (
    <RecordPageSection
      title="Semester Planner"
      description={
        <Stack gap="xs">
          <Text inherit>Plan when requirement courses will fit across academic years.</Text>
          {plannerSaveStatus === 'unsaved' ? (
            <Badge variant="light" color="yellow" size="lg">
              Unsaved changes will be lost if you leave this page.
            </Badge>
          ) : null}
        </Stack>
      }
      action={
        <Group gap="sm">
          <Button variant="subtle" onClick={onToggleReverseYears}>
            {plannerYearsReversed ? 'Show earliest first' : 'Show latest first'}
          </Button>
          <Button variant="light" onClick={onAddYear}>
            Add Year
          </Button>
        </Group>
      }
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          {(plannerYearsReversed ? [...plannerYears].reverse() : plannerYears).map((year) => {
            const expanded = expandedPlannerYearLabels.has(year.label);

            return (
              <Paper key={year.label} withBorder radius="md" p="md">
                <Stack gap="md">
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Stack gap={2}>
                      <Text fw={700}>{year.label}</Text>
                      <Text size="sm" c="dimmed">
                        {getYearCredits(year)} planned credits
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
                        <DroppablePlannerTerm key={term.code} term={term}>
                          <Stack gap="xs">
                            <Group justify="space-between" align="center">
                              <Group gap="xs">
                                <Text size="sm" fw={700}>
                                  {term.label}
                                </Text>
                                {term.isComplete ? (
                                  <Badge variant="light" color="blue">
                                    Complete
                                  </Badge>
                                ) : null}
                              </Group>
                              <Text size="xs" c="dimmed" fw={600}>
                                {getTermCredits(term)} credits
                              </Text>
                            </Group>

                            {term.courses.length > 0 ? (
                              <Stack gap={0}>
                                {term.courses.map((course) => {
                                  const courseRowContent = (
                                    <>
                                      <Stack gap={2}>
                                        <Group gap="xs">
                                          <Text size="sm" fw={600}>
                                            <Text
                                              component="button"
                                              type="button"
                                              size="sm"
                                              c="blue"
                                              fw={600}
                                              style={{
                                                background: 'none',
                                                border: 0,
                                                cursor: 'pointer',
                                                padding: 0,
                                              }}
                                              onClick={() => {
                                                onOpenCourseVersion(course.code);
                                              }}
                                              onPointerDown={(event) => {
                                                event.stopPropagation();
                                              }}
                                            >
                                              {course.code}
                                            </Text>
                                          </Text>
                                          <Text size="xs" c="dimmed">
                                            {course.credits} credits
                                          </Text>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                          {course.requirement}
                                        </Text>
                                      </Stack>
                                      <Group gap="xs" align="center">
                                        <Text
                                          size="xs"
                                          c={getCourseStatusColor(course.status)}
                                          fw={600}
                                        >
                                          {getCourseStatusLabel(course.status)}
                                        </Text>
                                        {course.status === 'planned' ? (
                                          <Tooltip label="Remove from planner">
                                            <ActionIcon
                                              variant="subtle"
                                              color="red"
                                              aria-label={`Remove ${course.code} from planner`}
                                              onClick={() => {
                                                onRemoveCourse(term.code, course);
                                              }}
                                              onPointerDown={(event) => {
                                                event.stopPropagation();
                                              }}
                                            >
                                              <IconTrash size={16} />
                                            </ActionIcon>
                                          </Tooltip>
                                        ) : null}
                                      </Group>
                                    </>
                                  );

                                  return course.status === 'planned' ? (
                                    <DraggablePlannerCourseRow
                                      key={`${term.code}-${course.code}`}
                                      course={course}
                                      termCode={term.code}
                                    >
                                      {courseRowContent}
                                    </DraggablePlannerCourseRow>
                                  ) : (
                                    <Group
                                      key={`${term.code}-${course.code}`}
                                      justify="space-between"
                                      align="flex-start"
                                      py={6}
                                      style={{
                                        borderTop: '1px solid var(--mantine-color-gray-2)',
                                      }}
                                    >
                                      {courseRowContent}
                                    </Group>
                                  );
                                })}
                              </Stack>
                            ) : (
                              <Text size="sm" c="dimmed" py={6}>
                                No courses planned.
                              </Text>
                            )}
                          </Stack>
                        </DroppablePlannerTerm>
                      ))}
                    </SimpleGrid>
                  </Collapse>
                </Stack>
              </Paper>
            );
          })}

          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            pt="sm"
            style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
          >
            <Text size="sm" c="dimmed">
              {plannerSaveStatus === 'saved'
                ? 'Your planner changes are saved.'
                : 'Save your semester plan when you are finished editing.'}
            </Text>
            <Button onClick={onSave} disabled={plannerSaveStatus === 'saved'}>
              Save Plan
            </Button>
          </Group>
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
