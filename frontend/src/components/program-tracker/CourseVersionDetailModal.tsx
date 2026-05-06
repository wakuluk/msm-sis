import {
  Alert,
  Badge,
  Grid,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  Textarea,
} from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import { displayValue } from '@/utils/form-values';

type CourseVersionDetailModalState =
  | { status: 'idle' }
  | { status: 'loading'; courseCode: string }
  | { status: 'error'; courseCode: string; message: string }
  | { status: 'success'; courseVersion: CourseVersionDetailResponse };

type CourseVersionDetailModalProps = {
  onClose: () => void;
  state: CourseVersionDetailModalState;
};

function formatCredits(courseVersion: CourseVersionDetailResponse): string {
  if (courseVersion.variableCredit) {
    return `${courseVersion.minCredits}-${courseVersion.maxCredits}`;
  }

  return String(courseVersion.minCredits);
}

function formatRequisiteType(value: string): string {
  return value === 'COREQUISITE' ? 'Corequisite' : 'Prerequisite';
}

function modalTitle(state: CourseVersionDetailModalState): string {
  if (state.status === 'success') {
    return `${state.courseVersion.courseCode ?? 'Course'} details`;
  }

  if (state.status === 'loading' || state.status === 'error') {
    return `${state.courseCode} details`;
  }

  return 'Course details';
}

export type { CourseVersionDetailModalState };

export function CourseVersionDetailModal({ onClose, state }: CourseVersionDetailModalProps) {
  const opened = state.status !== 'idle';
  const courseVersion = state.status === 'success' ? state.courseVersion : null;

  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle(state)} size="xl" centered>
      {state.status === 'loading' ? (
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading latest course version.
          </Text>
        </Group>
      ) : null}

      {state.status === 'error' ? (
        <Alert color="red" title="Unable to load course details">
          {state.message}
        </Alert>
      ) : null}

      {courseVersion ? (
        <Stack gap="md">
          <Grid gap="md">
            <ReadOnlyField label="Course Code" value={displayValue(courseVersion.courseCode)} />
            <ReadOnlyField
              label="Latest Version"
              value={displayValue(courseVersion.versionNumber)}
            />
            <ReadOnlyField label="Credits" value={formatCredits(courseVersion)} />
            <ReadOnlyField label="Lab Course" value={courseVersion.lab ? 'Yes' : 'No'} />
            <Grid.Col span={12}>
              <ReadOnlyField label="Title" value={courseVersion.title} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Catalog Description"
                value={courseVersion.catalogDescription ?? ''}
                placeholder="-"
                minRows={3}
                readOnly
              />
            </Grid.Col>
          </Grid>

          <Stack gap="sm">
            <Text fw={700}>Requisites</Text>
            {(courseVersion.requisites ?? []).length === 0 ? (
              <Alert color="gray" title="No requisites">
                This course version does not list prerequisites or corequisites.
              </Alert>
            ) : (
              <Table.ScrollContainer minWidth={680}>
                <Table withTableBorder withColumnBorders verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Condition</Table.Th>
                      <Table.Th>Courses</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(courseVersion.requisites ?? []).map((group) => (
                      <Table.Tr key={group.courseVersionRequisiteGroupId}>
                        <Table.Td>{formatRequisiteType(group.requisiteType)}</Table.Td>
                        <Table.Td>
                          {group.conditionType === 'ANY'
                            ? `Choose ${group.minimumRequired ?? 1}`
                            : 'All courses'}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {group.courses.length === 0
                              ? '-'
                              : group.courses.map((course) => (
                                  <Group key={course.courseVersionRequisiteCourseId} gap={4}>
                                    <Text size="sm">{course.courseCode ?? '-'}</Text>
                                    {course.lab ? (
                                      <Badge size="xs" variant="light" color="indigo">
                                        Lab
                                      </Badge>
                                    ) : null}
                                  </Group>
                                ))}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Stack>
      ) : null}
    </Modal>
  );
}
