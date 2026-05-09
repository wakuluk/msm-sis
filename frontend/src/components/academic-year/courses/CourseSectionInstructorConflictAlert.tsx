import { Alert, Stack, Table, Text } from '@mantine/core';
import type { CourseSectionInstructorConflictResponse } from '@/services/schemas/course-schemas';

type CourseSectionInstructorConflictAlertProps = {
  message: string;
  conflicts: CourseSectionInstructorConflictResponse[];
};

const dayNames = new Map<number, string>([
  [1, 'Monday'],
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
  [7, 'Sunday'],
]);

export function CourseSectionInstructorConflictAlert({
  message,
  conflicts,
}: CourseSectionInstructorConflictAlertProps) {
  return (
    <Alert color="red" title="Instructor schedule conflict">
      <Stack gap="sm">
        <Text>{message}</Text>
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Instructor</Table.Th>
              <Table.Th>Conflicting section</Table.Th>
              <Table.Th>Subterm</Table.Th>
              <Table.Th>Day</Table.Th>
              <Table.Th>Proposed time</Table.Th>
              <Table.Th>Existing time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {conflicts.flatMap((conflict) =>
              conflict.meetings.map((meeting, meetingIndex) => (
                <Table.Tr
                  key={[
                    conflict.staffId,
                    conflict.conflictingSectionId,
                    meeting.dayOfWeek,
                    meeting.proposedStartTime,
                    meeting.conflictingStartTime,
                    meetingIndex,
                  ].join('-')}
                >
                  <Table.Td>{conflict.instructorName}</Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text fw={700}>{conflict.conflictingSectionCode}</Text>
                      <Text size="sm" c="dimmed">
                        {conflict.conflictingSectionDisplay}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text>{conflict.subTermName}</Text>
                      <Text size="sm" c="dimmed">
                        {conflict.subTermCode}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>{formatDay(meeting.dayOfWeek)}</Table.Td>
                  <Table.Td>
                    {formatTimeRange(meeting.proposedStartTime, meeting.proposedEndTime)}
                  </Table.Td>
                  <Table.Td>
                    {formatTimeRange(
                      meeting.conflictingStartTime,
                      meeting.conflictingEndTime
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Stack>
    </Alert>
  );
}

function formatDay(dayOfWeek: number): string {
  return dayNames.get(dayOfWeek) ?? `Day ${dayOfWeek}`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
}

function formatTime(value: string): string {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2000, 0, 1, hour, minute));
}
