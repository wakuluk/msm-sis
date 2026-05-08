import { Badge, Group, Stack, Table, Text } from '@mantine/core';
import type { ProgramVersionRequirementResponse } from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';
import { formatCourseRuleRange } from './programRequirementFormatters';

function formatCourseDisplay(course: ProgramVersionRequirementResponse['requirementCourses'][number]) {
  if (course.subjectCode === null && course.courseNumber === null) {
    return '—';
  }

  return `${course.subjectCode ?? ''}${course.courseNumber ?? ''}`;
}

export function ProgramRequirementCoursesTable({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  if (requirement.requirementCourses.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>
          Specific Courses
        </Text>
        <Badge variant="light">{requirement.requirementCourses.length}</Badge>
      </Group>
      <Table.ScrollContainer minWidth={620}>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Course ID</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Number</Table.Th>
              <Table.Th>Course</Table.Th>
              <Table.Th>Required</Table.Th>
              <Table.Th>Minimum Grade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requirement.requirementCourses.map((course) => (
              <Table.Tr key={course.requirementCourseId}>
                <Table.Td>{displayValue(course.courseId)}</Table.Td>
                <Table.Td>{displayValue(course.subjectCode)}</Table.Td>
                <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
                <Table.Td>{formatCourseDisplay(course)}</Table.Td>
                <Table.Td>{displayValue(course.required)}</Table.Td>
                <Table.Td>{displayValue(course.minimumGrade)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

export function ProgramRequirementCourseRulesTable({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  if (requirement.requirementCourseRules.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>
          Department Course Rules
        </Text>
        <Badge variant="light">{requirement.requirementCourseRules.length}</Badge>
      </Group>
      <Table.ScrollContainer minWidth={820}>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rule ID</Table.Th>
              <Table.Th>Department ID</Table.Th>
              <Table.Th>Department Code</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Range</Table.Th>
              <Table.Th>Minimum Credits</Table.Th>
              <Table.Th>Minimum Courses</Table.Th>
              <Table.Th>Minimum Grade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requirement.requirementCourseRules.map((rule) => (
              <Table.Tr key={rule.requirementCourseRuleId}>
                <Table.Td>{displayValue(rule.requirementCourseRuleId)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentId)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentCode)}</Table.Td>
                <Table.Td>{displayValue(rule.departmentName ?? rule.departmentCode)}</Table.Td>
                <Table.Td>{formatCourseRuleRange(rule)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumCredits)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumCourses)}</Table.Td>
                <Table.Td>{displayValue(rule.minimumGrade)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
