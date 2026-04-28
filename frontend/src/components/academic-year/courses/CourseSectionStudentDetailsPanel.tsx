import { Badge, Button, Divider, Grid, Group, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { CourseSectionStudentResponse } from '@/services/schemas/course-schemas';
import classes from './CourseSectionStudentsPanel.module.css';
import type { EnrollmentEventListState } from './courseSectionStudentTypes';
import {
  formatBoolean,
  formatCredits,
  formatEventType,
  formatStatusTransition,
  formatStudentDate,
  studentStatusColor,
} from './courseSectionStudentUtils';

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

type CourseSectionStudentDetailsPanelProps = {
  student: CourseSectionStudentResponse;
  eventState: EnrollmentEventListState;
  onEditEnrollment: () => void;
};

export function CourseSectionStudentDetailsPanel({
  student,
  eventState,
  onEditEnrollment,
}: CourseSectionStudentDetailsPanelProps) {
  return (
    <Stack className={classes.studentDetailsPanel} gap="md" p="md">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Stack gap={4}>
          <Text fw={700}>{student.studentDisplayName ?? 'Student unavailable'}</Text>
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue">
              Student ID {student.studentId ?? 'Not set'}
            </Badge>
            <Badge variant="light" color={studentStatusColor(student.statusCode)}>
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
          {student.studentId === null ? (
            <Button size="xs" variant="default" disabled>
              Open student profile
            </Button>
          ) : (
            <Button component={Link} to={`/students/${student.studentId}`} size="xs" variant="default">
              Open student profile
            </Button>
          )}
          <Button size="xs" variant="light" onClick={onEditEnrollment}>
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
          <DetailField label="Registered" value={formatStudentDate(student.registeredAt ?? student.enrollmentDate)} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField label="Waitlisted" value={formatStudentDate(student.waitlistedAt)} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField label="Dropped" value={formatStudentDate(student.dropDate)} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField label="Withdrawn" value={formatStudentDate(student.withdrawDate)} />
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
          <DetailField label="Include in GPA" value={formatBoolean(student.includeInGpa)} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField label="Capacity override" value={formatBoolean(student.capacityOverride)} />
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
                <Table.Td>{formatStudentDate(grade.postedAt)}</Table.Td>
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
            {eventState.status === 'loading' && eventState.events.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    Loading history...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {eventState.status === 'error' ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="red" ta="center" py="sm">
                    {eventState.message}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {eventState.status !== 'loading' && eventState.status !== 'error' && eventState.events.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    No enrollment history found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {eventState.events.map((event) => (
              <Table.Tr key={event.eventId}>
                <Table.Td>{formatEventType(event.eventType)}</Table.Td>
                <Table.Td>{formatStatusTransition(event)}</Table.Td>
                <Table.Td>{formatStudentDate(event.createdAt)}</Table.Td>
                <Table.Td>{event.actorEmail ?? 'Not set'}</Table.Td>
                <Table.Td>{event.reason ?? 'Not set'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
