// Detail panel for the selected student enrollment in a section.
// Presents student identity, enrollment facts, grades, event history, and profile/edit actions.
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type {
  CourseSectionStudentGradeResponse,
  CourseSectionStudentResponse,
  PostCourseSectionStudentGradeRequest,
} from '@/services/schemas/course-schemas';
import { CourseSectionGradeDetailsModal } from './CourseSectionGradeDetailsModal';
import classes from './CourseSectionStudentsPanel.module.css';
import type { EnrollmentEventListState, GradePostState } from './courseSectionStudentTypes';
import {
  formatBoolean,
  formatCredits,
  formatEventType,
  formatStatusTransition,
  formatStudentDate,
  formatStudentDateTime,
  formatWaitlistOfferStatus,
  studentStatusColor,
  waitlistOfferStatusColor,
} from './courseSectionStudentUtils';
import type { SelectOption } from './courseSectionsWorkspaceTypes';

type SortDirection = 'asc' | 'desc';
type CurrentGradeSortBy = 'type' | 'grade' | 'postedAt' | 'postedBy';
const gradeEventTypes = new Set(['GRADE_POSTED', 'GRADE_CHANGED']);

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

function gradeLabel(grade: CourseSectionStudentGradeResponse) {
  return grade.gradeMarkCode ?? grade.gradeMarkName ?? 'Not set';
}

function isGradeEvent(eventType: string | null) {
  return eventType ? gradeEventTypes.has(eventType.toUpperCase()) : false;
}

function getPostedAtTime(grade: CourseSectionStudentGradeResponse) {
  return grade.postedAt ? new Date(grade.postedAt).getTime() : Number.NEGATIVE_INFINITY;
}

function compareNullableString(left: string | null | undefined, right: string | null | undefined) {
  return (left?.trim() || '').localeCompare(right?.trim() || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function isFutureDateTime(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function getGradeTypeRank(grade: CourseSectionStudentGradeResponse) {
  switch (grade.gradeTypeCode?.toUpperCase()) {
    case 'MIDTERM':
      return 0;
    case 'FINAL':
      return 1;
    default:
      return 2;
  }
}

function compareCurrentGrades(
  left: CourseSectionStudentGradeResponse,
  right: CourseSectionStudentGradeResponse,
  sortBy: CurrentGradeSortBy,
  sortDirection: SortDirection
) {
  const modifier = sortDirection === 'asc' ? 1 : -1;
  let result = 0;

  switch (sortBy) {
    case 'type':
      result =
        getGradeTypeRank(left) - getGradeTypeRank(right) ||
        compareNullableString(
          left.gradeTypeName ?? left.gradeTypeCode,
          right.gradeTypeName ?? right.gradeTypeCode
        );
      break;
    case 'grade':
      result = compareNullableString(gradeLabel(left), gradeLabel(right));
      break;
    case 'postedAt':
      result = getPostedAtTime(left) - getPostedAtTime(right);
      break;
    case 'postedBy':
      result = compareNullableString(left.postedByEmail, right.postedByEmail);
      break;
  }

  return result * modifier;
}

function getLatestGradeForType(
  student: CourseSectionStudentResponse,
  gradeTypeCode: 'MIDTERM' | 'FINAL'
) {
  const latestFromHistory =
    student.grades
      .filter((grade) => grade.gradeTypeCode?.toUpperCase() === gradeTypeCode)
      .sort((left, right) => getPostedAtTime(right) - getPostedAtTime(left))[0] ?? null;

  if (latestFromHistory) {
    return latestFromHistory;
  }

  return gradeTypeCode === 'MIDTERM' ? student.currentMidtermGrade : student.currentFinalGrade;
}

function SortableCurrentGradeHeader({
  activeSortBy,
  label,
  onToggleSort,
  sortBy,
  sortDirection,
}: {
  activeSortBy: CurrentGradeSortBy;
  label: string;
  onToggleSort: (sortBy: CurrentGradeSortBy) => void;
  sortBy: CurrentGradeSortBy;
  sortDirection: SortDirection;
}) {
  const active = activeSortBy === sortBy;

  return (
    <UnstyledButton
      fw={700}
      onClick={() => {
        onToggleSort(sortBy);
      }}
    >
      <Group gap={6} wrap="nowrap">
        <span>{label}</span>
        <Text component="span" size="sm" c={active ? 'blue' : 'dimmed'}>
          {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

type CourseSectionStudentDetailsPanelProps = {
  canManage?: boolean;
  gradeMarkOptions: SelectOption[];
  gradePostState: GradePostState;
  gradeTypeOptions: SelectOption[];
  sectionStatusCode: string | null;
  student: CourseSectionStudentResponse;
  eventState: EnrollmentEventListState;
  onEditEnrollment: () => void;
  onExpireWaitlistOfferNow: () => Promise<void>;
  onRunExpiredWaitlistCleanup: () => Promise<void>;
  onPostGrade: (values: PostCourseSectionStudentGradeRequest) => Promise<boolean>;
};

export function CourseSectionStudentDetailsPanel({
  canManage = true,
  gradeMarkOptions,
  gradePostState,
  gradeTypeOptions,
  sectionStatusCode,
  student,
  eventState,
  onEditEnrollment,
  onExpireWaitlistOfferNow,
  onRunExpiredWaitlistCleanup,
  onPostGrade,
}: CourseSectionStudentDetailsPanelProps) {
  const [gradeModalOpened, setGradeModalOpened] = useState(false);
  const [gradeSortBy, setGradeSortBy] = useState<CurrentGradeSortBy>('type');
  const [gradeSortDirection, setGradeSortDirection] = useState<SortDirection>('asc');
  const currentGradeRows = useMemo(
    () =>
      [getLatestGradeForType(student, 'MIDTERM'), getLatestGradeForType(student, 'FINAL')]
        .filter((grade): grade is CourseSectionStudentGradeResponse => grade !== null)
        .sort((left, right) => compareCurrentGrades(left, right, gradeSortBy, gradeSortDirection)),
    [gradeSortBy, gradeSortDirection, student]
  );
  const visibleEnrollmentEvents = useMemo(
    () => eventState.events.filter((event) => !isGradeEvent(event.eventType)),
    [eventState.events]
  );
  const canExpireWaitlistOffer =
    canManage &&
    student.waitlistOffer?.status === 'OFFERED' &&
    isFutureDateTime(student.waitlistOffer.expiresAt) &&
    student.statusCode === 'WAITLISTED';
  const canRunExpiredWaitlistCleanup =
    canManage &&
    student.waitlistOffer?.status === 'OFFERED' &&
    !isFutureDateTime(student.waitlistOffer.expiresAt) &&
    student.statusCode === 'WAITLISTED';

  function handleToggleGradeSort(nextSortBy: CurrentGradeSortBy) {
    if (nextSortBy === gradeSortBy) {
      setGradeSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setGradeSortBy(nextSortBy);
    setGradeSortDirection(nextSortBy === 'postedAt' ? 'desc' : 'asc');
  }

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

        {canManage ? (
          <Group gap="xs" wrap="wrap">
            {student.studentId === null ? (
              <Button size="xs" variant="default" disabled>
                Open student profile
              </Button>
            ) : (
              <Button
                component={Link}
                to={`/students/${student.studentId}`}
                size="xs"
                variant="default"
              >
                Open student profile
              </Button>
            )}
            <Button size="xs" variant="light" onClick={onEditEnrollment}>
              Edit enrollment
            </Button>
            {canExpireWaitlistOffer ? (
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => {
                  void onExpireWaitlistOfferNow();
                }}
              >
                Expire waitlist offer now
              </Button>
            ) : null}
            {canRunExpiredWaitlistCleanup ? (
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => {
                  void onRunExpiredWaitlistCleanup();
                }}
              >
                Run waitlist cleanup now
              </Button>
            ) : null}
          </Group>
        ) : null}
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
            value={formatStudentDate(student.registeredAt ?? student.enrollmentDate)}
          />
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
          <DetailField
            label="Waitlist position"
            value={student.waitlistPosition?.toString() ?? 'Not set'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Waitlist offer
            </Text>
            {student.waitlistOffer ? (
              <Badge variant="light" color={waitlistOfferStatusColor(student.waitlistOffer.status)}>
                {formatWaitlistOfferStatus(student.waitlistOffer.status)}
              </Badge>
            ) : (
              <Text size="sm">No offer</Text>
            )}
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField
            label="Offer expires"
            value={formatStudentDateTime(student.waitlistOffer?.expiresAt ?? null)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField
            label="Offered"
            value={formatStudentDateTime(student.waitlistOffer?.offeredAt ?? null)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <DetailField
            label="Notification sent"
            value={formatStudentDateTime(student.waitlistOffer?.notificationSentAt ?? null)}
          />
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

      <Group justify="space-between" align="center" gap="md" wrap="wrap">
        <Text size="sm" fw={700}>
          Grades
        </Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconEye size={16} />}
          onClick={() => {
            setGradeModalOpened(true);
          }}
        >
          Grade details
        </Button>
      </Group>
      <Table.ScrollContainer minWidth={560}>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <SortableCurrentGradeHeader
                  activeSortBy={gradeSortBy}
                  label="Type"
                  sortBy="type"
                  sortDirection={gradeSortDirection}
                  onToggleSort={handleToggleGradeSort}
                />
              </Table.Th>
              <Table.Th>
                <SortableCurrentGradeHeader
                  activeSortBy={gradeSortBy}
                  label="Grade"
                  sortBy="grade"
                  sortDirection={gradeSortDirection}
                  onToggleSort={handleToggleGradeSort}
                />
              </Table.Th>
              <Table.Th>
                <SortableCurrentGradeHeader
                  activeSortBy={gradeSortBy}
                  label="Posted"
                  sortBy="postedAt"
                  sortDirection={gradeSortDirection}
                  onToggleSort={handleToggleGradeSort}
                />
              </Table.Th>
              <Table.Th>
                <SortableCurrentGradeHeader
                  activeSortBy={gradeSortBy}
                  label="Posted by"
                  sortBy="postedBy"
                  sortDirection={gradeSortDirection}
                  onToggleSort={handleToggleGradeSort}
                />
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {currentGradeRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    No grades posted.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {currentGradeRows.map((grade) => (
              <Table.Tr key={grade.gradeId}>
                <Table.Td>{grade.gradeTypeName ?? 'Unknown'}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue">
                    {gradeLabel(grade)}
                  </Badge>
                </Table.Td>
                <Table.Td>{formatStudentDateTime(grade.postedAt)}</Table.Td>
                <Table.Td>{grade.postedByEmail ?? 'Not set'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <CourseSectionGradeDetailsModal
        error={gradePostState.status === 'error' ? gradePostState.message : null}
        gradeMarkOptions={gradeMarkOptions}
        gradeTypeOptions={gradeTypeOptions}
        opened={gradeModalOpened}
        posting={gradePostState.status === 'saving'}
        sectionStatusCode={sectionStatusCode}
        student={student}
        onClose={() => {
          setGradeModalOpened(false);
        }}
        onSubmit={onPostGrade}
      />

      {canManage ? (
        <>
          <Divider label="Enrollment history" labelPosition="left" />
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
                {eventState.status !== 'loading' &&
                eventState.status !== 'error' &&
                visibleEnrollmentEvents.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed" ta="center" py="sm">
                        No enrollment history found.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {visibleEnrollmentEvents.map((event) => (
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
        </>
      ) : null}
    </Stack>
  );
}
