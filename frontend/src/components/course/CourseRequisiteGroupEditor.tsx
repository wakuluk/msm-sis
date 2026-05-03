import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type {
  CourseVersionRequisiteConditionType,
  CourseVersionRequisiteType,
} from '@/services/schemas/course-schemas';
import type { CourseReferenceOption } from '@/services/schemas/reference-schemas';
import type { CourseRequisiteGroupDraft } from './courseRequisiteDrafts';

type CourseRequisiteGroupEditorProps = {
  courseOptionsForRow: (
    group: CourseRequisiteGroupDraft,
    courseDraft: { departmentId: number | string }
  ) => Array<{ value: string; label: string }>;
  courses: CourseReferenceOption[];
  departmentOptions: Array<{ value: string; label: string }>;
  disabled: boolean;
  error: string | null;
  group: CourseRequisiteGroupDraft;
  groupIndex: number;
  labOnly: boolean;
  loading: boolean;
  onAddCourse: (groupId: number) => void;
  onChangeCourse: (groupId: number, courseDraftId: number, courseId: string | null) => void;
  onChangeDepartment: (
    groupId: number,
    courseDraftId: number,
    departmentId: string | null
  ) => void;
  onRemoveCourse: (groupId: number, courseDraftId: number) => void;
  onRemoveGroup: (groupId: number) => void;
  onToggleLabOnly: (groupId: number, checked: boolean) => void;
  onUpdateGroup: (
    groupId: number,
    patch: Partial<Omit<CourseRequisiteGroupDraft, 'id' | 'courses'>>
  ) => void;
};

const requisiteTypeOptions: Array<{ value: CourseVersionRequisiteType; label: string }> = [
  { value: 'PREREQUISITE', label: 'Prerequisite' },
  { value: 'COREQUISITE', label: 'Corequisite' },
];

const conditionTypeOptions: Array<{
  value: CourseVersionRequisiteConditionType;
  label: string;
}> = [
  { value: 'ALL', label: 'All courses' },
  { value: 'ANY', label: 'Choose from list' },
];

export function CourseRequisiteGroupEditor({
  courseOptionsForRow,
  courses,
  departmentOptions,
  disabled,
  error,
  group,
  groupIndex,
  labOnly,
  loading,
  onAddCourse,
  onChangeCourse,
  onChangeDepartment,
  onRemoveCourse,
  onRemoveGroup,
  onToggleLabOnly,
  onUpdateGroup,
}: CourseRequisiteGroupEditorProps) {
  const locked = disabled || group.id < 0;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Group align="flex-end" gap="sm">
          <Select
            label="Type"
            data={requisiteTypeOptions}
            value={group.requisiteType}
            disabled={locked}
            onChange={(value) => {
              onUpdateGroup(group.id, {
                requisiteType: (value ?? 'PREREQUISITE') as CourseVersionRequisiteType,
              });
            }}
          />
          <Select
            label="Condition"
            data={conditionTypeOptions}
            value={group.conditionType}
            disabled={locked}
            onChange={(value) => {
              const conditionType = (value ?? 'ALL') as CourseVersionRequisiteConditionType;

              onUpdateGroup(group.id, {
                conditionType,
                minimumRequired: conditionType === 'ANY' ? group.minimumRequired : '',
              });
            }}
          />
          {group.conditionType === 'ANY' ? (
            <NumberInput
              label="Minimum required"
              min={1}
              max={Math.max(group.courses.length, 1)}
              value={group.minimumRequired}
              disabled={disabled}
              onChange={(value) => {
                onUpdateGroup(group.id, { minimumRequired: value });
              }}
            />
          ) : null}
        </Group>
        <Group gap="xs">
          {group.requisiteType === 'COREQUISITE' ? (
            <Checkbox
              label="Lab courses only"
              checked={labOnly}
              disabled={locked}
              onChange={(event) => {
                onToggleLabOnly(group.id, event.currentTarget.checked);
              }}
            />
          ) : null}
          <Button
            size="xs"
            variant="light"
            disabled={locked}
            onClick={() => onAddCourse(group.id)}
          >
            Add course
          </Button>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={`Remove requisite group ${groupIndex + 1}`}
            disabled={locked}
            onClick={() => onRemoveGroup(group.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {group.courses.length === 0 ? (
        <Alert color="gray" title="No courses selected">
          Add at least one course to this requisite group.
        </Alert>
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Department</Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Selected</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {group.courses.map((course) => (
                <Table.Tr key={course.id}>
                  <Table.Td>
                    {course.pendingAssociatedLab ? (
                      <Text size="sm" c="dimmed">
                        Pending lab
                      </Text>
                    ) : (
                      <Select
                        searchable
                        clearable
                        placeholder="All departments"
                        data={departmentOptions}
                        value={course.departmentId ? String(course.departmentId) : null}
                        disabled={disabled}
                        onChange={(value) => onChangeDepartment(group.id, course.id, value)}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {course.pendingAssociatedLab ? (
                      <Text size="sm">{course.courseCode}</Text>
                    ) : (
                      <Select
                        searchable
                        clearable
                        placeholder="Select course"
                        data={courseOptionsForRow(group, course)}
                        value={course.courseId ? String(course.courseId) : null}
                        loading={loading}
                        error={error ?? undefined}
                        nothingFoundMessage="No courses found."
                        disabled={disabled}
                        onChange={(value) => onChangeCourse(group.id, course.id, value)}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm">{course.courseCode || '-'}</Text>
                      {course.courseTitle ? (
                        <Text size="xs" c="dimmed">
                          {course.courseTitle}
                        </Text>
                      ) : null}
                      {courses.find((option) => String(option.courseId) === String(course.courseId))?.lab ? (
                        <Badge size="xs" variant="light" color="indigo">
                          Lab
                        </Badge>
                      ) : null}
                      {course.pendingAssociatedLab ? (
                        <Badge size="xs" variant="light" color="indigo">
                          Pending lab
                        </Badge>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remove course"
                      disabled={disabled || course.pendingAssociatedLab}
                      onClick={() => onRemoveCourse(group.id, course.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
