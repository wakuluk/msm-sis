import { Badge, Group, Paper, Stack, Table, Text } from '@mantine/core';
import type {
  StudentCourseRegistrationRequisiteGroupResponse,
  StudentCourseRegistrationRequisiteOptionResponse,
  StudentCourseRegistrationRequisiteResponse,
} from '@/services/schemas/student-course-registration-schemas';

type StudentCoursePrerequisitesTableProps = {
  requisiteGroups?: StudentCourseRegistrationRequisiteGroupResponse[] | null;
  requisites?: StudentCourseRegistrationRequisiteResponse[] | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

function getStatusLabel(value: string | null | undefined) {
  switch (normalize(value)) {
    case 'MET':
      return 'Satisfied';
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

function getMinimumRequired(group: StudentCourseRegistrationRequisiteGroupResponse) {
  return group.minimumRequired === null || group.minimumRequired === undefined || group.minimumRequired < 1
    ? 1
    : group.minimumRequired;
}

function isAnyGroup(group: Pick<StudentCourseRegistrationRequisiteGroupResponse, 'conditionType'>) {
  return normalize(group.conditionType) === 'ANY';
}

function defaultGroupTitle(group: StudentCourseRegistrationRequisiteGroupResponse) {
  if (group.title?.trim()) {
    return group.title.trim();
  }

  if (isAnyGroup(group)) {
    return `Complete ${getMinimumRequired(group)} of the following courses`;
  }

  if (normalize(group.requisiteType) === 'COREQUISITE') {
    return 'Take all of the following courses with this registration';
  }

  return 'Complete all of the following courses';
}

function formatMinimumGradeSummary(group: StudentCourseRegistrationRequisiteGroupResponse) {
  return group.minimumGradeSummary?.trim() || 'Pass / completed course';
}

function formatOptionRequirement(
  group: StudentCourseRegistrationRequisiteGroupResponse,
  course: StudentCourseRegistrationRequisiteOptionResponse
) {
  if (course.minimumGrade?.trim()) {
    return `${course.minimumGrade.trim()} or better`;
  }

  return normalize(group.requisiteType) === 'COREQUISITE'
    ? 'Registered or planned'
    : 'Pass / completed course';
}

function getCourseKey(
  group: StudentCourseRegistrationRequisiteGroupResponse,
  course: StudentCourseRegistrationRequisiteOptionResponse,
  index: number
) {
  return [
    group.groupId ?? 'group',
    course.courseVersionRequisiteCourseId ?? 'course',
    course.requiredCourseId ?? 'required',
    index,
  ].join('-');
}

function isSatisfyingStatus(status: string | null | undefined) {
  return ['MET', 'PLANNED', 'IN_PROGRESS'].includes(normalize(status));
}

function groupStatusFromCourses(group: StudentCourseRegistrationRequisiteGroupResponse) {
  if (group.status?.trim()) {
    return group.status;
  }

  const satisfiedCount = group.courses.filter((course) => isSatisfyingStatus(course.status)).length;
  const requiredCount = isAnyGroup(group) ? getMinimumRequired(group) : group.courses.length;

  return satisfiedCount >= requiredCount ? 'MET' : 'MISSING';
}

function minimumGradeSummaryFromRows(rows: StudentCourseRegistrationRequisiteResponse[]) {
  const prerequisiteRows = rows.filter((row) => normalize(row.requisiteType) === 'PREREQUISITE');

  if (prerequisiteRows.length === 0) {
    return 'Registered or planned';
  }

  const minimumGrades = [
    ...new Set(
      prerequisiteRows
        .map((row) => row.minimumGrade?.trim())
        .filter((grade): grade is string => Boolean(grade))
    ),
  ];

  if (minimumGrades.length === 0) {
    return 'Pass / completed course';
  }

  if (minimumGrades.length === 1) {
    return minimumGrades[0];
  }

  return 'Varies by course option';
}

function fallbackGroupStatus(group: StudentCourseRegistrationRequisiteGroupResponse) {
  const satisfiedCount = group.courses.filter((course) => isSatisfyingStatus(course.status)).length;
  const requiredCount = isAnyGroup(group) ? getMinimumRequired(group) : group.courses.length;

  return satisfiedCount >= requiredCount ? 'MET' : 'MISSING';
}

function fallbackTitle(group: StudentCourseRegistrationRequisiteGroupResponse) {
  if (isAnyGroup(group)) {
    return `Complete ${getMinimumRequired(group)} of the following courses`;
  }

  if (normalize(group.requisiteType) === 'COREQUISITE') {
    return 'Take all of the following courses with this registration';
  }

  return 'Complete all of the following courses';
}

function groupFlatRequisites(
  rows: StudentCourseRegistrationRequisiteResponse[]
): StudentCourseRegistrationRequisiteGroupResponse[] {
  const groups = new Map<number | string, StudentCourseRegistrationRequisiteResponse[]>();

  rows.forEach((row, index) => {
    const groupId = row.courseVersionRequisiteGroupId ?? `ungrouped-${index}`;
    const groupRows = groups.get(groupId) ?? [];
    groupRows.push(row);
    groups.set(groupId, groupRows);
  });

  return [...groups.entries()].map(([groupId, groupRows]) => {
    const firstRow = groupRows[0];
    const courses = groupRows.map((row) => ({
      courseVersionRequisiteCourseId: row.courseVersionRequisiteCourseId,
      requiredCourseId: row.requiredCourseId,
      requiredCourseCode: row.requiredCourseCode,
      requiredCourseLab: row.requiredCourseLab,
      minimumGrade: row.minimumGrade,
      studentEvidence: row.studentEvidence,
      status: row.status,
    }));
    const group: StudentCourseRegistrationRequisiteGroupResponse = {
      conditionType: firstRow?.conditionType ?? null,
      courses,
      groupId: typeof groupId === 'number' ? groupId : null,
      minimumGradeSummary: minimumGradeSummaryFromRows(groupRows),
      minimumRequired: firstRow?.minimumRequired ?? null,
      requisiteType: firstRow?.requisiteType ?? null,
      status: null,
      title: null,
    };

    return {
      ...group,
      status: fallbackGroupStatus(group),
      title: fallbackTitle(group),
    };
  });
}

function getDisplayGroups({
  requisiteGroups,
  requisites,
}: StudentCoursePrerequisitesTableProps) {
  if (requisiteGroups && requisiteGroups.length > 0) {
    return requisiteGroups;
  }

  return groupFlatRequisites(requisites ?? []);
}

function RequirementGroupBlock({
  group,
}: {
  group: StudentCourseRegistrationRequisiteGroupResponse;
}) {
  const status = groupStatusFromCourses(group);

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={3}>
            <Text fw={900}>{defaultGroupTitle(group)}</Text>
            <Text size="sm" c="dimmed">
              Minimum grade: {formatMinimumGradeSummary(group)}
            </Text>
          </Stack>
          <Badge variant="light" color={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        </Group>

        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders horizontalSpacing="sm" verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course</Table.Th>
                <Table.Th>Requirement</Table.Th>
                <Table.Th>Student evidence</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {group.courses.map((course, index) => (
                <Table.Tr key={getCourseKey(group, course, index)}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text fw={800}>{course.requiredCourseCode ?? '-'}</Text>
                      {course.requiredCourseLab ? (
                        <Badge size="xs" variant="light" color="indigo">
                          Lab
                        </Badge>
                      ) : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>{formatOptionRequirement(group, course)}</Table.Td>
                  <Table.Td>{course.studentEvidence ?? '-'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={getStatusColor(course.status)}>
                      {getStatusLabel(course.status)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  );
}

function RequirementSection({
  emptyLabel,
  groups,
  title,
}: {
  emptyLabel: string;
  groups: StudentCourseRegistrationRequisiteGroupResponse[];
  title: string;
}) {
  return (
    <Stack gap="sm">
      <Text fw={900}>{title}</Text>
      {groups.length > 0 ? (
        groups.map((group, index) => (
          <RequirementGroupBlock key={`${group.groupId ?? title}-${index}`} group={group} />
        ))
      ) : (
        <Text c="dimmed">{emptyLabel}</Text>
      )}
    </Stack>
  );
}

export function StudentCoursePrerequisitesTable({
  requisiteGroups = [],
  requisites = [],
}: StudentCoursePrerequisitesTableProps) {
  const groups = getDisplayGroups({ requisiteGroups, requisites });
  const prerequisiteGroups = groups.filter((group) => normalize(group.requisiteType) === 'PREREQUISITE');
  const corequisiteGroups = groups.filter((group) => normalize(group.requisiteType) === 'COREQUISITE');

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text fw={800}>Course Requirements</Text>
        <Text size="sm" c="dimmed">
          Requirements evaluated against the student record and current registration plan.
        </Text>
      </Stack>

      <RequirementSection
        emptyLabel="No prerequisites listed."
        groups={prerequisiteGroups}
        title="Prerequisites"
      />
      <RequirementSection
        emptyLabel="No corequisites listed."
        groups={corequisiteGroups}
        title="Corequisites"
      />
    </Stack>
  );
}
