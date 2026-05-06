// Requirement course rows for specific/choose-from course requirements.
import { ActionIcon, Badge, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { AddCourseToPlannerAction } from './AddCourseToPlannerAction';
import { CourseDetailTrigger } from './CourseDetailTrigger';
import { DraggableRequirementCourseRow } from './ProgramTrackerDnd';
import {
  buildRequirementCourseSelection,
  getRequirementCourseDisplayStatus,
} from './programTrackerRequirementStatus';
import {
  getCourseStatusColor,
  getCourseStatusLabel,
} from './program-tracker.helpers';
import type {
  ProgramTrackerCourseSelection,
  ProgramTrackerProgram,
  ProgramTrackerRequirement,
} from './program-tracker.types';

type ProgramTrackerRequirementCourseTableProps = {
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: ProgramTrackerCourseSelection) => void;
  program: ProgramTrackerProgram;
  requirement: ProgramTrackerRequirement;
};

export function ProgramTrackerRequirementCourseTable({
  onAddCourseToPlanner,
  onOpenCourseDetails,
  onRemoveCourseFromPlanner,
  program,
  requirement,
}: ProgramTrackerRequirementCourseTableProps) {
  return (
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
          const displayStatus = getRequirementCourseDisplayStatus(course.status, requirement);
          const plannerSelection = buildRequirementCourseSelection({
            course,
            program,
            requirement,
          });

          const courseCells = (
            <>
              <Table.Td>
                <CourseDetailTrigger
                  code={course.code}
                  courseId={course.courseId}
                  onOpenCourseDetails={onOpenCourseDetails}
                />
              </Table.Td>
              <Table.Td>
                <Badge variant="light" color={getCourseStatusColor(displayStatus)}>
                  {getCourseStatusLabel(displayStatus)}
                </Badge>
              </Table.Td>
              <Table.Td>
                {displayStatus === 'needed' ? (
                  <AddCourseToPlannerAction
                    selection={plannerSelection}
                    onClick={() => {
                      onAddCourseToPlanner(plannerSelection);
                    }}
                  />
                ) : displayStatus === 'planned' && course.status === 'planned' ? (
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

          return displayStatus === 'needed' ? (
            <DraggableRequirementCourseRow key={course.code} selection={plannerSelection}>
              {courseCells}
            </DraggableRequirementCourseRow>
          ) : (
            <Table.Tr key={course.code}>{courseCells}</Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
