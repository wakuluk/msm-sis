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
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCalendarPlus, IconTrash } from '@tabler/icons-react';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  DraggableRequirementCourseRow,
} from './StudentProgramDnd';
import { StatusProgress } from './StatusProgress';
import {
  formatProgramProgress,
  formatRequirementProgress,
  getCourseStatusColor,
  getCourseStatusLabel,
} from './student-programs.helpers';
import type {
  PlannerCourseSelection,
  StudentProgramPreview,
} from './student-programs.types';

type ProgramRequirementsSectionProps = {
  expandedProgramCodes: Set<string>;
  onAddCourseToPlanner: (selection: PlannerCourseSelection) => void;
  onOpenCourseVersion: (courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: PlannerCourseSelection) => void;
  onToggleProgram: (programCode: string) => void;
  programs: StudentProgramPreview[];
};

function AddCourseToPlannerAction({
  onClick,
  selection,
}: {
  onClick: () => void;
  selection: PlannerCourseSelection;
}) {
  return (
    <Tooltip label="Add to planner">
      <ActionIcon
        variant="subtle"
        aria-label={`Add ${selection.courseCode} to planner`}
        onClick={onClick}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <IconCalendarPlus size={18} />
      </ActionIcon>
    </Tooltip>
  );
}

export function ProgramRequirementsSection({
  expandedProgramCodes,
  onAddCourseToPlanner,
  onOpenCourseVersion,
  onRemoveCourseFromPlanner,
  onToggleProgram,
  programs,
}: ProgramRequirementsSectionProps) {
  return (
    <RecordPageSection
      title="Current Programs"
      description="Programs attached to your academic record."
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          {programs.map((program) => {
            const expanded = expandedProgramCodes.has(program.code);

            return (
              <Paper key={program.code} withBorder radius="md" p="md">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                    <Stack gap={4}>
                      <Group gap="xs" wrap="wrap">
                        <Text fw={700}>{program.name}</Text>
                        <Badge variant="light">{program.type}</Badge>
                        <Badge variant="light" color="green">
                          {program.status}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {program.code} · {program.version}
                      </Text>
                    </Stack>
                    <Stack gap={4} miw={220}>
                      <Group justify="space-between" gap="sm" wrap="nowrap">
                        <Text size="sm" fw={600}>
                          Overall progress
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatProgramProgress(program)}
                        </Text>
                      </Group>
                      <StatusProgress
                        completed={program.completed}
                        planned={program.planned}
                        required={program.required}
                        size="md"
                      />
                    </Stack>
                    <Button
                      variant="subtle"
                      onClick={() => {
                        onToggleProgram(program.code);
                      }}
                    >
                      {expanded ? 'Hide requirements' : 'Show requirements'}
                    </Button>
                  </Group>

                  <Collapse expanded={expanded}>
                    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                      {program.requirements.map((requirement) => (
                        <Paper key={requirement.label} withBorder radius="sm" p="sm">
                          <Stack gap="sm">
                            <Stack gap={4}>
                              <Text size="sm" fw={600}>
                                {requirement.label}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {formatRequirementProgress(requirement)}
                              </Text>
                              <StatusProgress
                                completed={requirement.completed}
                                planned={requirement.planned}
                                required={requirement.required}
                                size="xs"
                              />
                            </Stack>

                            <Stack gap={4}>
                              {requirement.rules.map((rule) => (
                                <Text key={rule} size="sm" c="dimmed">
                                  {rule}
                                </Text>
                              ))}
                            </Stack>

                            <Table withColumnBorders withTableBorder striped verticalSpacing="xs">
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Course</Table.Th>
                                  <Table.Th>Status</Table.Th>
                                  <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {requirement.courses.map((course) => {
                                  const plannerSelection = {
                                    courseCode: course.code,
                                    programCode: program.code,
                                    programName: program.name,
                                    requirementLabel: requirement.label,
                                  };

                                  const courseCells = (
                                    <>
                                      <Table.Td>
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
                                      </Table.Td>
                                      <Table.Td>
                                        <Badge
                                          variant="light"
                                          color={getCourseStatusColor(course.status)}
                                        >
                                          {getCourseStatusLabel(course.status)}
                                        </Badge>
                                      </Table.Td>
                                      <Table.Td>
                                        {course.status === 'needed' ? (
                                          <AddCourseToPlannerAction
                                            selection={plannerSelection}
                                            onClick={() => {
                                              onAddCourseToPlanner(plannerSelection);
                                            }}
                                          />
                                        ) : course.status === 'planned' ? (
                                          <Tooltip label="Remove from planner">
                                            <ActionIcon
                                              variant="subtle"
                                              color="red"
                                              aria-label={`Remove ${course.code} from planner`}
                                              onClick={() => {
                                                onRemoveCourseFromPlanner(plannerSelection);
                                              }}
                                            >
                                              <IconTrash size={18} />
                                            </ActionIcon>
                                          </Tooltip>
                                        ) : (
                                          <Text size="sm" c="dimmed">
                                            -
                                          </Text>
                                        )}
                                      </Table.Td>
                                    </>
                                  );

                                  return course.status === 'needed' ? (
                                    <DraggableRequirementCourseRow
                                      key={course.code}
                                      selection={plannerSelection}
                                    >
                                      {courseCells}
                                    </DraggableRequirementCourseRow>
                                  ) : (
                                    <Table.Tr key={course.code}>{courseCells}</Table.Tr>
                                  );
                                })}
                              </Table.Tbody>
                            </Table>
                          </Stack>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  </Collapse>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
