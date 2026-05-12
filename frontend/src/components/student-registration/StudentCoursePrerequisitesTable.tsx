import { Badge, Stack, Table, Text } from '@mantine/core';
import type { StudentCourseRegistrationRequisiteResponse } from '@/services/schemas/student-course-registration-schemas';

type StudentCoursePrerequisitesTableProps = {
  requisites?: StudentCourseRegistrationRequisiteResponse[] | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

function formatRequisiteType(value: string | null | undefined) {
  switch (normalize(value)) {
    case 'PREREQUISITE':
      return 'Prerequisite';
    case 'COREQUISITE':
      return 'Corequisite';
    default:
      return value?.trim() || '-';
  }
}

function formatMinimumGrade(row: StudentCourseRegistrationRequisiteResponse) {
  if (normalize(row.requisiteType) !== 'PREREQUISITE') {
    return '-';
  }

  return row.minimumGrade?.trim() || 'Passed course';
}

function getStatusLabel(value: string | null | undefined) {
  switch (normalize(value)) {
    case 'MET':
      return 'Met';
    case 'MISSING':
      return 'Missing';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'PLANNED':
      return 'Planned';
    default:
      return value?.trim() || '-';
  }
}

function getStatusColor(value: string | null | undefined) {
  switch (normalize(value)) {
    case 'MET':
      return 'green';
    case 'MISSING':
      return 'red';
    case 'IN_PROGRESS':
      return 'blue';
    case 'PLANNED':
      return 'indigo';
    default:
      return 'gray';
  }
}

function getRowKey(row: StudentCourseRegistrationRequisiteResponse, index: number) {
  return [
    row.courseVersionRequisiteGroupId ?? 'group',
    row.courseVersionRequisiteCourseId ?? 'course',
    row.requiredCourseId ?? 'required',
    index,
  ].join('-');
}

export function StudentCoursePrerequisitesTable({
  requisites = [],
}: StudentCoursePrerequisitesTableProps) {
  const rows = requisites ?? [];

  return (
    <Stack gap="xs">
      <Stack gap={2}>
        <Text fw={800}>Prerequisites and Corequisites</Text>
        <Text size="sm" c="dimmed">
          Course requirements evaluated against the student record and current registration plan.
        </Text>
      </Stack>
      <Table.ScrollContainer minWidth={640}>
        <Table withTableBorder withColumnBorders horizontalSpacing="sm" verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Required course</Table.Th>
              <Table.Th>Minimum grade</Table.Th>
              <Table.Th>Student evidence</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <Table.Tr key={getRowKey(row, index)}>
                  <Table.Td>{formatRequisiteType(row.requisiteType)}</Table.Td>
                  <Table.Td>
                    <Text fw={700}>{row.requiredCourseCode ?? '-'}</Text>
                    {row.requiredCourseLab ? (
                      <Badge size="xs" variant="light" color="indigo">
                        Lab
                      </Badge>
                    ) : null}
                  </Table.Td>
                  <Table.Td>{formatMinimumGrade(row)}</Table.Td>
                  <Table.Td>{row.studentEvidence ?? '-'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={getStatusColor(row.status)}>
                      {getStatusLabel(row.status)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No prerequisites or corequisites listed.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
