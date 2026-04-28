import { Badge, Button, Divider, Grid, Group, Modal, Stack, Table, Text } from '@mantine/core';
import type { CourseSectionStudentResponse } from '@/services/schemas/course-schemas';

type CourseSectionStudentDetailModalProps = {
  opened: boolean;
  student: CourseSectionStudentResponse | null;
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCredits(value: number | null) {
  return value === null ? 'Not set' : value.toFixed(1);
}

function statusColor(statusCode: string | null) {
  switch (statusCode) {
    case 'REGISTERED':
      return 'green';
    case 'WAITLISTED':
      return 'yellow';
    case 'DROPPED':
    case 'WITHDRAWN':
    case 'CANCELLED':
      return 'red';
    case 'COMPLETED':
      return 'blue';
    default:
      return 'gray';
  }
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  );
}

export function CourseSectionStudentDetailModal({
  opened,
  student,
  onClose,
}: CourseSectionStudentDetailModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Student Enrollment" size="64rem" centered>
      {student ? (
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Stack gap={4}>
              <Text fw={700}>{student.studentDisplayName ?? 'Student unavailable'}</Text>
              <Group gap="xs" wrap="wrap">
                <Badge variant="light" color="blue">
                  Student ID {student.studentId ?? 'Not set'}
                </Badge>
                <Badge variant="light" color={statusColor(student.statusCode)}>
                  {student.statusName ?? 'Unknown'}
                </Badge>
                {student.classStanding ? (
                  <Badge variant="light" color="gray">
                    {student.classStanding}
                  </Badge>
                ) : null}
              </Group>
            </Stack>

            <Group gap="xs" wrap="wrap">
              <Button size="xs" variant="default">
                Open student profile
              </Button>
              <Button size="xs" variant="light">
                Edit enrollment
              </Button>
            </Group>
          </Group>

          <Divider label="Student" labelPosition="left" />
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="First name" value={student.firstName ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Last name" value={student.lastName ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Preferred name" value={student.preferredName ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DetailField label="Email" value={student.email ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DetailField label="Class standing" value={student.classStanding ?? 'Not set'} />
            </Grid.Col>
          </Grid>

          <Divider label="Enrollment" labelPosition="left" />
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Status" value={student.statusName ?? 'Unknown'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField
                label="Registered"
                value={formatDate(student.registeredAt ?? student.enrollmentDate)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Waitlisted" value={formatDate(student.waitlistedAt)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Dropped" value={formatDate(student.dropDate)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Withdrawn" value={formatDate(student.withdrawDate)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Waitlist position" value={student.waitlistPosition?.toString() ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Grading basis" value={student.gradingBasisName ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Credits attempted" value={formatCredits(student.creditsAttempted)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Credits earned" value={formatCredits(student.creditsEarned)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Include in GPA" value={student.includeInGpa ? 'Yes' : 'No'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Capacity override" value={student.capacityOverride ? 'Yes' : 'No'} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DetailField label="Changed by" value={student.statusChangedByEmail ?? 'Not set'} />
            </Grid.Col>
            <Grid.Col span={12}>
              <DetailField label="Manual add reason" value={student.manualAddReason ?? 'Not set'} />
            </Grid.Col>
          </Grid>

          <Divider label="Grades" labelPosition="left" />
          <Table.ScrollContainer minWidth={560}>
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Grade</Table.Th>
                  <Table.Th>Posted</Table.Th>
                  <Table.Th>Posted by</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {student.grades.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text size="sm" c="dimmed" ta="center" py="sm">
                        No grades posted.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {student.grades.map((grade) => (
                  <Table.Tr key={grade.gradeId}>
                    <Table.Td>{grade.gradeTypeName ?? 'Unknown'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={grade.current ? 'blue' : 'gray'}>
                        {grade.gradeMarkCode ?? 'Not set'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(grade.postedAt)}</Table.Td>
                    <Table.Td>{grade.postedByEmail ?? 'Not set'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Divider label="History" labelPosition="left" />
          <Table.ScrollContainer minWidth={560}>
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Event</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>When</Table.Th>
                  <Table.Th>Actor</Table.Th>
                  <Table.Th>Reason</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>{student.statusCode ?? 'STATUS'}</Table.Td>
                  <Table.Td>{student.statusName ?? 'Unknown'}</Table.Td>
                  <Table.Td>{formatDate(student.statusChangedAt)}</Table.Td>
                  <Table.Td>{student.statusChangedByEmail ?? 'Not set'}</Table.Td>
                  <Table.Td>{student.manualAddReason ?? 'Not set'}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
