import { Badge, Group, Modal, Stack, Table, Text } from '@mantine/core';
import {
  getPrerequisiteStatusColor,
  getPrerequisiteStatusLabel,
} from './student-programs.helpers';
import type { CourseVersionPreview } from './student-programs.types';

type CourseVersionDetailModalProps = {
  courseVersion: CourseVersionPreview | null;
  onClose: () => void;
};

export function CourseVersionDetailModal({
  courseVersion,
  onClose,
}: CourseVersionDetailModalProps) {
  return (
    <Modal
      opened={courseVersion !== null}
      onClose={onClose}
      title="Course details"
      size="xl"
      centered
    >
      {courseVersion ? (
        <Stack gap="md">
          <Stack gap={4}>
            <Group gap="xs" wrap="wrap">
              <Text fw={700}>{courseVersion.code}</Text>
              <Badge variant="light">{courseVersion.credits} credits</Badge>
              <Badge variant="light" color="green">
                {courseVersion.version}
              </Badge>
            </Group>
            <Text size="lg" fw={700}>
              {courseVersion.title}
            </Text>
            <Text size="sm" c="dimmed">
              Effective {courseVersion.effectiveYear}
            </Text>
          </Stack>

          <Text size="sm">{courseVersion.description}</Text>

          <Stack gap="xs">
            <Text size="sm" fw={700}>
              Prerequisites
            </Text>
            {courseVersion.prerequisites.length > 0 ? (
              <Table withColumnBorders withTableBorder striped verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Course</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {courseVersion.prerequisites.map((prerequisite) => (
                    <Table.Tr key={prerequisite.code}>
                      <Table.Td>
                        <Text size="sm">{prerequisite.code}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{prerequisite.note}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={getPrerequisiteStatusColor(prerequisite.status)}
                        >
                          {getPrerequisiteStatusLabel(prerequisite.status)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed">
                No prerequisites listed for the latest course version.
              </Text>
            )}
          </Stack>
        </Stack>
      ) : null}
    </Modal>
  );
}
