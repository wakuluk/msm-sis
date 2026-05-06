// Planner row for elective placeholder requirements.
import { Badge, Table, Text } from '@mantine/core';
import { AddCourseToPlannerAction } from './AddCourseToPlannerAction';
import { DraggableRequirementCourseRow } from './ProgramTrackerDnd';
import {
  getCourseStatusColor,
  getCourseStatusLabel,
} from './program-tracker.helpers';
import {
  getElectivePlaceholderStatus,
} from './programTrackerRequirementStatus';
import type {
  ProgramTrackerCourseSelection,
  ProgramTrackerRequirement,
} from './program-tracker.types';

type ProgramTrackerElectivePlaceholderActionProps = {
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  requirement: ProgramTrackerRequirement;
  selection: ProgramTrackerCourseSelection;
};

export function ProgramTrackerElectivePlaceholderAction({
  onAddCourseToPlanner,
  requirement,
  selection,
}: ProgramTrackerElectivePlaceholderActionProps) {
  const status = getElectivePlaceholderStatus(requirement);
  const courseCells = (
    <>
      <Table.Td>
        <Text size="sm" fw={600} c="blue">
          {selection.courseCode}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={getCourseStatusColor(status)}>
          {getCourseStatusLabel(status)}
        </Badge>
      </Table.Td>
      <Table.Td>
        {status === 'needed' ? (
          <AddCourseToPlannerAction
            selection={selection}
            onClick={() => {
              onAddCourseToPlanner(selection);
            }}
          />
        ) : (
          <Text size="sm" c="dimmed">
            -
          </Text>
        )}
      </Table.Td>
    </>
  );

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
        {status === 'needed' ? (
          <DraggableRequirementCourseRow selection={selection}>
            {courseCells}
          </DraggableRequirementCourseRow>
        ) : (
          <Table.Tr>{courseCells}</Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
