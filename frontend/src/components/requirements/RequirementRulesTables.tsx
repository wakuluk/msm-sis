import { Grid, Table } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type {
  RequirementCourseResponse,
  RequirementCourseRuleResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';
import {
  formatRequirementCourseDisplay,
  formatRequirementCourseRuleRange,
} from '@/utils/requirement-formatters';

export function RequirementCoursesTable({
  courses,
}: {
  courses: RequirementCourseResponse[];
}) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <RecordPageSection title="Specific Courses" description="Courses attached to this requirement.">
      <Grid.Col span={12}>
        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course ID</Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Number</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Minimum Grade</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {courses.map((course) => (
                <Table.Tr key={course.requirementCourseId}>
                  <Table.Td>{displayValue(course.courseId)}</Table.Td>
                  <Table.Td>{formatRequirementCourseDisplay(course)}</Table.Td>
                  <Table.Td>{displayValue(course.subjectCode)}</Table.Td>
                  <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
                  <Table.Td>{displayValue(course.required)}</Table.Td>
                  <Table.Td>{displayValue(course.minimumGrade)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>
    </RecordPageSection>
  );
}

export function RequirementCourseRulesTable({
  rules,
}: {
  rules: RequirementCourseRuleResponse[];
}) {
  if (rules.length === 0) {
    return null;
  }

  return (
    <RecordPageSection title="Department Course Rules" description="Department and course-number rules.">
      <Grid.Col span={12}>
        <Table.ScrollContainer minWidth={920}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rule ID</Table.Th>
                <Table.Th>Department ID</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Course Range</Table.Th>
                <Table.Th>Minimum Credits</Table.Th>
                <Table.Th>Minimum Courses</Table.Th>
                <Table.Th>Minimum Grade</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rules.map((rule) => (
                <Table.Tr key={rule.requirementCourseRuleId}>
                  <Table.Td>{displayValue(rule.requirementCourseRuleId)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentId)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentName)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentCode)}</Table.Td>
                  <Table.Td>{formatRequirementCourseRuleRange(rule)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumCredits)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumCourses)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumGrade)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>
    </RecordPageSection>
  );
}
