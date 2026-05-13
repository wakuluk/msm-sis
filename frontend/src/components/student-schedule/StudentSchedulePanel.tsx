import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Grid,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconCalendarWeek, IconHistory, IconInfoCircle } from '@tabler/icons-react';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import tableClasses from '@/components/search/SearchResultsTable.module.css';
import { StudentCourseRegistrationSchedule } from '@/components/student-registration/StudentCourseRegistrationSchedule';
import type {
  StudentRegistrationCourseStatus,
  StudentRegistrationScheduleView,
  StudentRegistrationSubTermView,
  StudentRegistrationTermView,
} from '@/components/student-registration/studentCourseRegistrationTypes';
import type {
  StudentScheduleCourseResponse,
  StudentScheduleHistoricalCourseResponse,
  StudentScheduleMeetingResponse,
  StudentScheduleResponse,
  StudentScheduleTermOptionResponse,
} from '@/services/schemas/student-schedule-schemas';
import { getErrorMessage } from '@/utils/errors';

type PageState =
  | { status: 'loading' }
  | { message: string; status: 'error' }
  | { schedule: StudentScheduleResponse; status: 'loaded' };

type ScheduledCoursesSortBy =
  | 'course'
  | 'credits'
  | 'instructor'
  | 'location'
  | 'meeting'
  | 'section'
  | 'status';

type SortDirection = 'asc' | 'desc';

export type LoadStudentScheduleRequest = {
  termId?: number | null;
  signal?: AbortSignal;
};

export type StudentSchedulePanelProps = {
  emptyActivityMessage?: string;
  loadSchedule: (request?: LoadStudentScheduleRequest) => Promise<StudentScheduleResponse>;
  loadingMessage?: string;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function displayText(value: string | null | undefined, fallback = '—') {
  return value?.trim() || fallback;
}

function displayCredits(value: number | null | undefined) {
  return value ?? 0;
}

function getCourseSortValue(course: StudentScheduleCourseResponse, sortBy: ScheduledCoursesSortBy) {
  switch (sortBy) {
    case 'course':
      return `${displayText(course.courseCode, '')} ${displayText(course.sectionTitle ?? course.courseTitle, '')}`;
    case 'credits':
      return displayCredits(course.creditsAttempted ?? course.creditsEarned);
    case 'instructor':
      return displayText(course.instructorSummary, '');
    case 'location':
      return displayText(course.roomSummary, '');
    case 'meeting':
      return displayText(course.meetingSummary, '');
    case 'section':
      return displayText(course.displaySectionCode ?? course.sectionLetter, '');
    case 'status':
      return getStatusLabel(course.enrollmentStatusCode ?? course.enrollmentStatusName);
  }
}

function sortCourses(
  courses: ReadonlyArray<StudentScheduleCourseResponse>,
  sortBy: ScheduledCoursesSortBy,
  sortDirection: SortDirection
) {
  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...courses].sort((left, right) => {
    const leftValue = getCourseSortValue(left, sortBy);
    const rightValue = getCourseSortValue(right, sortBy);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return (
      String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * direction
    );
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toUpperCase() ?? '';
}

function getStatusColor(status: string | null | undefined) {
  switch (normalizeStatus(status)) {
    case 'COMPLETED':
      return 'gray';
    case 'DROPPED':
      return 'orange';
    case 'IN_PROGRESS':
      return 'blue';
    case 'REGISTERED':
      return 'green';
    case 'WITHDRAWN':
      return 'red';
    default:
      return 'gray';
  }
}

function getStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedStatus) {
    return 'Status unknown';
  }

  return normalizedStatus
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getTermLabel(term: StudentScheduleTermOptionResponse) {
  const termName = displayText(term.termName ?? term.termCode, 'Term');
  const academicYearName = displayText(
    term.academicYearName ?? term.academicYearCode,
    'Academic year'
  );

  return `${termName} · ${academicYearName}`;
}

function getMeetingColor(status: string | null | undefined) {
  switch (normalizeStatus(status)) {
    case 'COMPLETED':
      return '#868e96';
    case 'IN_PROGRESS':
      return '#1c7ed6';
    case 'REGISTERED':
      return '#2f9e44';
    default:
      return '#2f9e44';
  }
}

function getSelectedTerm(schedule: StudentScheduleResponse) {
  return (
    schedule.terms.find((term) => term.termId === schedule.selectedTermId) ?? schedule.terms[0]
  );
}

function buildSubTerms(schedule: StudentScheduleResponse): StudentRegistrationSubTermView[] {
  const subTermsById = new Map<number, StudentRegistrationSubTermView>();

  schedule.scheduledCourses.forEach((course) => {
    if (
      course.subTermId === null ||
      course.subTermStartDate === null ||
      course.subTermEndDate === null
    ) {
      return;
    }

    subTermsById.set(course.subTermId, {
      code: displayText(course.subTermCode, 'SUB'),
      endDate: course.subTermEndDate,
      id: course.subTermId,
      name: displayText(course.subTermName, 'Subterm'),
      startDate: course.subTermStartDate,
    });
  });

  if (subTermsById.size > 0) {
    return [...subTermsById.values()].sort((left, right) =>
      left.startDate.localeCompare(right.startDate)
    );
  }

  const selectedTerm = getSelectedTerm(schedule);
  const fallbackTermId = selectedTerm?.termId ?? schedule.selectedTermId ?? 0;

  return [
    {
      code: displayText(selectedTerm?.termCode, 'TERM'),
      endDate:
        selectedTerm?.endDate ?? selectedTerm?.startDate ?? new Date().toISOString().slice(0, 10),
      id: fallbackTermId,
      name: displayText(selectedTerm?.termName, 'Term'),
      startDate: selectedTerm?.startDate ?? new Date().toISOString().slice(0, 10),
    },
  ];
}

function mapTermOptionToView(
  term: StudentScheduleTermOptionResponse,
  subTerms: StudentRegistrationSubTermView[]
): StudentRegistrationTermView {
  const startDate =
    term.startDate ?? subTerms[0]?.startDate ?? new Date().toISOString().slice(0, 10);
  const endDate = term.endDate ?? subTerms.at(-1)?.endDate ?? startDate;

  return {
    academicYearName: displayText(term.academicYearName ?? term.academicYearCode, 'Academic year'),
    code: displayText(term.termCode, 'TERM'),
    endDate,
    id: term.termId ?? 0,
    name: displayText(term.termName, 'Term'),
    startDate,
    subTerms: term.selected ? subTerms : [],
  };
}

function mapMeetingToScheduleView(
  meeting: StudentScheduleMeetingResponse
): StudentRegistrationScheduleView['meetings'][number] | null {
  if (
    meeting.dayOfWeek === null ||
    meeting.startTime === null ||
    meeting.endTime === null ||
    meeting.subTermId === null ||
    meeting.termId === null
  ) {
    return null;
  }

  return {
    color: getMeetingColor(meeting.enrollmentStatusCode),
    courseCode: displayText(meeting.courseCode, 'Course'),
    dayOfWeek: meeting.dayOfWeek,
    endTime: meeting.endTime,
    id: meeting.id,
    location: displayText(meeting.location, ''),
    sectionCode: displayText(meeting.displaySectionCode ?? meeting.sectionLetter, 'Section'),
    startTime: meeting.startTime,
    status: 'ENROLLED' satisfies StudentRegistrationCourseStatus,
    subTermCode: displayText(meeting.subTermCode, 'SUB'),
    subTermId: meeting.subTermId,
    subTermName: displayText(meeting.subTermName, 'Subterm'),
    termId: meeting.termId,
    title: displayText(meeting.sectionTitle ?? meeting.courseTitle, 'Course meeting'),
  };
}

function mapStudentScheduleToCalendar(schedule: StudentScheduleResponse): StudentRegistrationScheduleView {
  const selectedTerm = getSelectedTerm(schedule);
  const selectedTermId = schedule.selectedTermId ?? selectedTerm?.termId ?? 0;
  const subTerms = buildSubTerms(schedule);
  const terms = schedule.terms.map((term) => mapTermOptionToView(term, subTerms));
  const fallbackStartDate =
    selectedTerm?.startDate ?? subTerms[0]?.startDate ?? new Date().toISOString().slice(0, 10);
  const academicYears = [
    ...new Set(
      schedule.terms
        .map((term) => term.academicYearName ?? term.academicYearCode)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  return {
    academicYears,
    meetings: schedule.scheduleMeetings
      .map(mapMeetingToScheduleView)
      .filter(
        (meeting): meeting is StudentRegistrationScheduleView['meetings'][number] =>
          meeting !== null
      ),
    selectedAcademicYearName: displayText(
      selectedTerm?.academicYearName ?? selectedTerm?.academicYearCode,
      ''
    ),
    selectedTermId,
    terms,
    weekStart: fallbackStartDate,
  };
}

function ScheduledCoursesTable({ courses }: { courses: StudentScheduleCourseResponse[] }) {
  const [sortBy, setSortBy] = useState<ScheduledCoursesSortBy>('course');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const sortedCourses = useMemo(
    () => sortCourses(courses, sortBy, sortDirection),
    [courses, sortBy, sortDirection]
  );

  function handleSort(nextSortBy: ScheduledCoursesSortBy) {
    if (sortBy === nextSortBy) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  if (courses.length === 0) {
    return (
      <Alert color="gray" icon={<IconInfoCircle size={18} />} title="No scheduled courses">
        No registered, in-progress, or completed courses belong on this term schedule.
      </Alert>
    );
  }

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table className={tableClasses.resultsTable}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="course"
                onToggleSort={handleSort}
              >
                Course
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="section"
                onToggleSort={handleSort}
              >
                Section
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="meeting"
                onToggleSort={handleSort}
              >
                Meeting
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="location"
                onToggleSort={handleSort}
              >
                Location
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="instructor"
                onToggleSort={handleSort}
              >
                Instructor
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="credits"
                onToggleSort={handleSort}
              >
                Credits
              </SortableScheduledCourseHeader>
            </Table.Th>
            <Table.Th>
              <SortableScheduledCourseHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                value="status"
                onToggleSort={handleSort}
              >
                Status
              </SortableScheduledCourseHeader>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedCourses.map((course) => (
            <Table.Tr key={course.enrollmentId ?? `${course.courseCode}-${course.sectionId}`}>
              <Table.Td>
                <Stack gap={0}>
                  <Text fw={800}>{displayText(course.courseCode)}</Text>
                  <Text size="sm" c="dimmed">
                    {displayText(course.sectionTitle ?? course.courseTitle)}
                  </Text>
                </Stack>
              </Table.Td>
              <Table.Td>{displayText(course.displaySectionCode ?? course.sectionLetter)}</Table.Td>
              <Table.Td>{displayText(course.meetingSummary, 'No meetings')}</Table.Td>
              <Table.Td>{displayText(course.roomSummary)}</Table.Td>
              <Table.Td>{displayText(course.instructorSummary)}</Table.Td>
              <Table.Td>{displayCredits(course.creditsAttempted ?? course.creditsEarned)}</Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(course.enrollmentStatusCode)} variant="light">
                  {getStatusLabel(course.enrollmentStatusCode ?? course.enrollmentStatusName)}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function SortableScheduledCourseHeader({
  children,
  sortBy,
  sortDirection,
  value,
  onToggleSort,
}: {
  children: string;
  sortBy: ScheduledCoursesSortBy;
  sortDirection: SortDirection;
  value: ScheduledCoursesSortBy;
  onToggleSort: (sortBy: ScheduledCoursesSortBy) => void;
}) {
  const active = sortBy === value;

  return (
    <UnstyledButton className={tableClasses.sortButton} onClick={() => onToggleSort(value)}>
      <span>{children}</span>
      <span
        className={
          active
            ? `${tableClasses.sortDirection} ${tableClasses.sortDirectionActive}`
            : tableClasses.sortDirection
        }
      >
        {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </UnstyledButton>
  );
}

function HistoricalCoursesTable({ courses }: { courses: StudentScheduleHistoricalCourseResponse[] }) {
  if (courses.length === 0) {
    return (
      <Alert color="gray" icon={<IconInfoCircle size={18} />} title="No dropped or withdrawn courses">
        This term has no courses hidden from the schedule.
      </Alert>
    );
  }

  return (
    <Table.ScrollContainer minWidth={620}>
      <Table className={tableClasses.resultsTable}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Course</Table.Th>
            <Table.Th>Section</Table.Th>
            <Table.Th>Credits</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Effective Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {courses.map((course) => (
            <Table.Tr key={course.enrollmentId ?? `${course.courseCode}-${course.statusChangedAt}`}>
              <Table.Td>
                <Stack gap={0}>
                  <Text fw={800}>{displayText(course.courseCode)}</Text>
                  <Text size="sm" c="dimmed">
                    {displayText(course.sectionTitle ?? course.courseTitle)}
                  </Text>
                </Stack>
              </Table.Td>
              <Table.Td>{displayText(course.displaySectionCode ?? course.sectionLetter)}</Table.Td>
              <Table.Td>{displayCredits(course.creditsAttempted ?? course.creditsEarned)}</Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(course.enrollmentStatusCode)} variant="light">
                  {getStatusLabel(course.enrollmentStatusCode ?? course.enrollmentStatusName)}
                </Badge>
              </Table.Td>
              <Table.Td>{formatDate(course.effectiveDate ?? course.statusChangedAt)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export function StudentSchedulePanel({
  emptyActivityMessage = 'No local enrollment activity is available for this schedule yet.',
  loadSchedule,
  loadingMessage = 'Loading course schedule.',
}: StudentSchedulePanelProps) {
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPageState({ status: 'loading' });

    void loadSchedule({ signal: controller.signal })
      .then((schedule) => {
        setSelectedTermId(schedule.selectedTermId === null ? null : String(schedule.selectedTermId));
        setPageState({ schedule, status: 'loaded' });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        setPageState({
          message: getErrorMessage(error, 'Failed to load schedule.'),
          status: 'error',
        });
      });

    return () => controller.abort();
  }, [loadSchedule]);

  const schedule = pageState.status === 'loaded' ? pageState.schedule : null;
  const calendarSchedule = useMemo(
    () => (schedule === null ? null : mapStudentScheduleToCalendar(schedule)),
    [schedule]
  );

  async function handleTermChange(value: string | null) {
    const nextTermId = value === null ? null : Number(value);

    if (nextTermId === null || !Number.isFinite(nextTermId)) {
      return;
    }

    setSelectedTermId(String(nextTermId));
    setPageState({ status: 'loading' });

    try {
      const nextSchedule = await loadSchedule({ termId: nextTermId });
      setSelectedTermId(
        nextSchedule.selectedTermId === null ? null : String(nextSchedule.selectedTermId)
      );
      setPageState({ schedule: nextSchedule, status: 'loaded' });
    } catch (error: unknown) {
      setPageState({
        message: getErrorMessage(error, 'Failed to load the selected term.'),
        status: 'error',
      });
    }
  }

  return (
    <Stack gap="lg">
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group justify="space-between" align="flex-end" gap="md">
          <Stack gap={4}>
            <Group gap="xs">
              <IconCalendarWeek size={18} />
              <Text fw={800}>Term Schedule</Text>
            </Group>
            <Text size="sm" c="dimmed">
              The calendar excludes waitlisted, dropped, and withdrawn courses.
            </Text>
          </Stack>
          <Select
            label="Term"
            data={(schedule?.terms ?? [])
              .filter((term) => term.termId !== null)
              .map((term) => ({
                label: getTermLabel(term),
                value: String(term.termId),
              }))}
            value={selectedTermId}
            w={{ base: '100%', sm: 320 }}
            allowDeselect={false}
            disabled={pageState.status === 'loading' || (schedule?.terms.length ?? 0) === 0}
            placeholder="Select a term"
            onChange={handleTermChange}
          />
        </Group>
      </Box>

      {pageState.status === 'loading' ? (
        <Alert color="blue" title="Loading schedule">
          <Group gap="sm">
            <Loader size="sm" />
            <Text>{loadingMessage}</Text>
          </Group>
        </Alert>
      ) : null}

      {pageState.status === 'error' ? (
        <Alert color="red" title="Unable to load schedule">
          {pageState.message}
        </Alert>
      ) : null}

      {pageState.status === 'loaded' && pageState.schedule.terms.length === 0 ? (
        <Alert color="gray" icon={<IconInfoCircle size={18} />} title="No schedule activity">
          {emptyActivityMessage}
        </Alert>
      ) : null}

      {pageState.status === 'loaded' && pageState.schedule.terms.length > 0 ? (
        <>
          <RecordPageSection
            title="Scheduled Courses"
            description="Registered, in-progress, and completed courses for the selected term."
          >
            <Grid.Col span={12}>
              <ScheduledCoursesTable courses={pageState.schedule.scheduledCourses} />
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Weekly Calendar"
            description="A read-only week view using section meeting patterns."
          >
            <Grid.Col span={12}>
              {calendarSchedule && calendarSchedule.meetings.length > 0 ? (
                <StudentCourseRegistrationSchedule schedule={calendarSchedule} />
              ) : (
                <Alert color="gray" icon={<IconInfoCircle size={18} />} title="No meetings">
                  No scheduled meeting times are available for this term.
                </Alert>
              )}
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Not On Schedule"
            description="Dropped and withdrawn courses are preserved for context but do not appear on the calendar."
          >
            <Grid.Col span={12}>
              <Stack gap="sm">
                <Group gap="xs">
                  <IconHistory size={18} />
                  <Text fw={800}>Historical activity</Text>
                </Group>
                <HistoricalCoursesTable courses={pageState.schedule.notOnScheduleCourses} />
              </Stack>
            </Grid.Col>
          </RecordPageSection>
        </>
      ) : null}
    </Stack>
  );
}
