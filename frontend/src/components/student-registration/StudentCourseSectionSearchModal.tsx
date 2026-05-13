import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import {
  StudentCourseRegistrationScheduleConflictError,
  type GetCourseSectionRegistrationDetailRequest,
  type SearchCourseSectionsRequest,
} from '@/services/student-course-registration-service';
import type {
  StudentCourseRegistrationScheduleConflictResponse,
  StudentCourseRegistrationWindowResponse,
  StudentCourseSectionDetailResponse,
  StudentCourseSectionSearchResponse,
  StudentCourseSectionSearchResultResponse,
  StudentCourseSectionSearchRowResponse,
} from '@/services/schemas/student-course-registration-schemas';
import { StudentCoursePrerequisitesTable } from './StudentCoursePrerequisitesTable';
import classes from './StudentCourseSectionSearchModal.module.css';

type StudentCourseSectionSearchModalProps = {
  opened: boolean;
  onAddCourse: (sectionId: number) => Promise<void>;
  onClose: () => void;
  onGetCourseSectionDetail: (
    request: GetCourseSectionRegistrationDetailRequest
  ) => Promise<StudentCourseSectionDetailResponse>;
  onSearch: (request: SearchCourseSectionsRequest) => Promise<StudentCourseSectionSearchResponse>;
  registrationWindow: StudentCourseRegistrationWindowResponse;
};

type SearchFilters = {
  courseCode: string;
  dayOfWeeks: string[];
  honorsFilter: 'ALL' | 'HONORS_ONLY' | 'NON_HONORS_ONLY';
  instructor: string;
  section: string;
  subTermIds: string[];
  startHour: string;
  startMeridiem: Meridiem;
};

type TextSearchFilterKey = 'courseCode' | 'instructor' | 'section';
type Meridiem = 'AM' | 'PM';

type SearchState =
  | { status: 'idle' | 'loading' }
  | { response: StudentCourseSectionSearchResponse; status: 'loaded' }
  | { message: string; status: 'error' };

type AddState =
  | { status: 'idle' | 'loading' }
  | { message: string; status: 'error' }
  | {
      conflicts: StudentCourseRegistrationScheduleConflictResponse[];
      message: string;
      status: 'conflict';
    };

type DetailState =
  | { status: 'idle' }
  | { row: StudentCourseSectionSearchRowResponse; status: 'loading' }
  | { message: string; row: StudentCourseSectionSearchRowResponse; status: 'error' }
  | {
      response: StudentCourseSectionDetailResponse;
      row: StudentCourseSectionSearchRowResponse;
      status: 'loaded';
    };

const PAGE_SIZE = 5;
const COURSE_SECTION_SEARCH_MODAL_SIZE = 'min(96vw, 112rem)';
const DAY_OPTIONS = [
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
  { label: 'Sunday', value: '7' },
];
const MERIDIEM_OPTIONS = [
  { label: 'AM', value: 'AM' },
  { label: 'PM', value: 'PM' },
];
const HONORS_FILTER_OPTIONS = [
  { label: 'All sections', value: 'ALL' },
  { label: 'Honors only', value: 'HONORS_ONLY' },
  { label: 'Non-honors only', value: 'NON_HONORS_ONLY' },
];

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function displayText(value: string | null | undefined, fallback = '—') {
  return value?.trim() || fallback;
}

function displayNumber(value: number | null | undefined, fallback = '—') {
  return value === null || value === undefined ? fallback : String(value);
}

function formatSeats(row: Pick<StudentCourseSectionSearchRowResponse, 'capacity' | 'enrolledCount'>) {
  if (row.enrolledCount === null || row.capacity === null) {
    return '—';
  }

  return `${row.enrolledCount} / ${row.capacity}`;
}

function parseOptionalHour(value: string, meridiem: Meridiem) {
  if (value.trim() === '') {
    return null;
  }

  const hour = Number(value);

  if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
    return null;
  }

  if (meridiem === 'AM') {
    return hour === 12 ? 0 : hour;
  }

  return hour === 12 ? 12 : hour + 12;
}

const dayNames = new Map<number, string>([
  [1, 'Monday'],
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
  [7, 'Sunday'],
]);

function getAddDisabledReason(section: StudentCourseSectionSearchResultResponse) {
  if (section.alreadySelected) {
    return 'Already selected in this section.';
  }

  if (section.alreadyEnrolled) {
    return 'Already registered in this section.';
  }

  if (section.sameCourseAlreadySelected) {
    return section.duplicateCourseReason || 'Already selected in another section.';
  }

  if (section.sameCourseAlreadyEnrolled) {
    return section.duplicateCourseReason || 'Already registered in another section.';
  }

  if (!section.prerequisitesSatisfied) {
    return section.unavailableReason || 'Prerequisites are not satisfied.';
  }

  if (!section.registrationEligibilitySatisfied) {
    return (
      section.registrationEligibilityMessage ||
      'Student registration eligibility is not satisfied for this course.'
    );
  }

  if (!section.honorsEligibilitySatisfied) {
    return section.honorsEligibilityMessage || 'Honors eligibility is not satisfied for this section.';
  }

  return section.unavailableReason;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={800} tt="uppercase">
        {label}
      </Text>
      <Text fw={800}>{value}</Text>
    </Stack>
  );
}

function CourseRegistrationScheduleConflictAlert({
  conflicts,
  message,
}: {
  conflicts: StudentCourseRegistrationScheduleConflictResponse[];
  message: string;
}) {
  return (
    <Alert color="red" title="Schedule conflict">
      <Stack gap="sm">
        <Stack gap={4}>
          {formatConflictSummaries(conflicts).map((summary) => (
            <Text key={summary}>{summary}</Text>
          ))}
        </Stack>
        {conflicts.length === 0 ? <Text>{message}</Text> : null}
        <Table.ScrollContainer minWidth={620}>
          <Table withTableBorder withColumnBorders horizontalSpacing="sm" verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Selected course</Table.Th>
                <Table.Th>Conflicts with</Table.Th>
                <Table.Th>Subterm</Table.Th>
                <Table.Th>Day</Table.Th>
                <Table.Th>Selected time</Table.Th>
                <Table.Th>Existing time</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {conflicts.flatMap((conflict) =>
                conflict.meetings.map((meeting, meetingIndex) => (
                  <Table.Tr
                    key={[
                      conflict.proposedSectionId,
                      conflict.conflictingSectionId,
                      meeting.dayOfWeek,
                      meeting.proposedStartTime,
                      meeting.conflictingStartTime,
                      meetingIndex,
                    ].join('-')}
                  >
                    <Table.Td>
                      {formatCourseSection(
                        conflict.proposedCourseCode,
                        conflict.proposedSectionCode
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={700}>
                          {formatCourseSection(
                            conflict.conflictingCourseCode,
                            conflict.conflictingSectionCode
                          )}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatConflictSource(conflict.conflictSource)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      {formatSubTerm(conflict.conflictingSubTermName, conflict.conflictingSubTermCode)}
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
        </Table.ScrollContainer>
      </Stack>
    </Alert>
  );
}

function formatConflictSummaries(
  conflicts: StudentCourseRegistrationScheduleConflictResponse[]
) {
  return conflicts.flatMap((conflict) =>
    conflict.meetings.map((meeting) => {
      const proposedCourse = formatCourseSection(
        conflict.proposedCourseCode,
        conflict.proposedSectionCode
      );
      const conflictingCourse = formatCourseSection(
        conflict.conflictingCourseCode,
        conflict.conflictingSectionCode
      );

      return `${proposedCourse} conflicts with ${conflictingCourse} on ${formatDay(
        meeting.dayOfWeek
      )}, ${formatTimeRange(meeting.proposedStartTime, meeting.proposedEndTime)}.`;
    })
  );
}

function formatCourseSection(
  courseCode: string | null | undefined,
  sectionCode: string | null | undefined
) {
  const course = displayText(courseCode, 'Course');
  const section = sectionCode?.trim();

  return section ? `${course} ${section}` : course;
}

function formatConflictSource(source: string | null | undefined) {
  switch (source) {
    case 'ENROLLMENT':
      return 'Existing registration';
    case 'PRE_REGISTERED':
      return 'Pre-registered course';
    default:
      return 'Schedule conflict';
  }
}

function formatSubTerm(name: string | null | undefined, code: string | null | undefined) {
  const label = displayText(name, 'Subterm');
  const trimmedCode = code?.trim();

  return trimmedCode ? `${label} (${trimmedCode})` : label;
}

function formatDay(dayOfWeek: number | null | undefined) {
  return dayOfWeek === null || dayOfWeek === undefined
    ? '—'
    : dayNames.get(dayOfWeek) ?? `Day ${dayOfWeek}`;
}

function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined
) {
  if (!startTime || !endTime) {
    return '—';
  }

  return `${formatTime(startTime)}-${formatTime(endTime)}`;
}

function formatTime(value: string) {
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

function CourseSectionDetailPanel({
  addState,
  section,
  onAdd,
}: {
  addState: AddState;
  section: StudentCourseSectionSearchResultResponse;
  onAdd: (section: StudentCourseSectionSearchResultResponse) => void;
}) {
  const disabledReason = getAddDisabledReason(section);

  return (
    <div className={classes.detailPanel}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={2}>
            <Group gap="xs" wrap="wrap">
              <Text fw={900}>
                {displayText(section.courseCode)} Section{' '}
                {displayText(section.displaySectionCode ?? section.sectionLetter)}
              </Text>
              {section.honors ? (
                <Badge variant="light" color="blue">
                  Honors
                </Badge>
              ) : null}
              <Badge variant="light" color={section.prerequisitesSatisfied ? 'green' : 'red'}>
                Prerequisites: {section.prerequisitesSatisfied ? 'Met' : 'Missing'}
              </Badge>
              {!section.registrationEligibilitySatisfied ? (
                <Badge variant="light" color="red">
                  Registration eligibility: Blocked
                </Badge>
              ) : null}
              {!section.honorsEligibilitySatisfied ? (
                <Badge variant="light" color="red">
                  Honors eligibility: Blocked
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed">{displayText(section.courseTitle ?? section.sectionTitle)}</Text>
          </Stack>
          <Button
            disabled={disabledReason !== null || section.sectionId === null}
            leftSection={<IconPlus size={16} />}
            loading={addState.status === 'loading'}
            onClick={() => onAdd(section)}
          >
            Add course
          </Button>
        </Group>

        {disabledReason ? (
          <Alert color="yellow" title="Section unavailable">
            {disabledReason}
          </Alert>
        ) : null}

        {!disabledReason && section.corequisiteWarnings.length > 0 ? (
          <Alert color="yellow" title="Corequisite warning">
            <Stack gap={4}>
              {section.corequisiteWarnings.map((warning) => (
                <Text key={warning}>{warning}</Text>
              ))}
            </Stack>
          </Alert>
        ) : null}

        {!disabledReason && section.honorsWarningMessage ? (
          <Alert color="yellow" title="Honors section available">
            {section.honorsWarningMessage}
          </Alert>
        ) : null}

        {addState.status === 'error' ? (
          <Alert color="red" title="Unable to add course">
            {addState.message}
          </Alert>
        ) : null}

        {addState.status === 'conflict' ? (
          <CourseRegistrationScheduleConflictAlert
            conflicts={addState.conflicts}
            message={addState.message}
          />
        ) : null}

        <div className={classes.detailGrid}>
          <DetailField label="Course code" value={displayText(section.courseCode)} />
          <DetailField
            label="Section"
            value={displayText(section.displaySectionCode ?? section.sectionLetter)}
          />
          <DetailField label="Instructor" value={displayText(section.instructorSummary)} />
          <DetailField label="Time" value={displayText(section.meetingSummary, 'No meetings')} />
          <DetailField label="Subterm" value={displayText(section.subTermName)} />
          <DetailField label="Credits" value={displayNumber(section.credits)} />
          <DetailField label="Seats" value={formatSeats(section)} />
          <DetailField label="Seats available" value={displayNumber(section.seatsAvailable)} />
          <DetailField label="Room" value={displayText(section.roomSummary)} />
        </div>

        <StudentCoursePrerequisitesTable
          requisiteGroups={section.requisiteGroups}
          requisites={section.requisites}
        />
      </Stack>
    </div>
  );
}

function CourseSectionDetailLoadingPanel({
  color = 'blue',
  row,
  message = 'Loading course registration details...',
  title = 'Section details',
}: {
  color?: 'blue' | 'red';
  message?: string;
  row: StudentCourseSectionSearchRowResponse;
  title?: string;
}) {
  return (
    <div className={classes.detailPanel}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={2}>
            <Group gap="xs" wrap="wrap">
              <Text fw={900}>
                {displayText(row.courseCode)} Section{' '}
                {displayText(row.displaySectionCode ?? row.sectionLetter)}
              </Text>
              {row.honors ? (
                <Badge variant="light" color="blue">
                  Honors
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed">{displayText(row.courseTitle)}</Text>
          </Stack>
        </Group>
        <Alert color={color} title={title}>
          {message}
        </Alert>
      </Stack>
    </div>
  );
}

export function StudentCourseSectionSearchModal({
  opened,
  onAddCourse,
  onClose,
  onGetCourseSectionDetail,
  onSearch,
  registrationWindow,
}: StudentCourseSectionSearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    courseCode: '',
    dayOfWeeks: [],
    honorsFilter: 'ALL',
    instructor: '',
    section: '',
    startHour: '',
    startMeridiem: 'AM',
    subTermIds: [],
  });
  const [submittedFilters, setSubmittedFilters] = useState<SearchFilters | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<StudentCourseSectionSearchRowResponse | null>(null);
  const [detailState, setDetailState] = useState<DetailState>({ status: 'idle' });
  const [page, setPage] = useState(0);
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });
  const [addState, setAddState] = useState<AddState>({ status: 'idle' });
  const detailRequestIdRef = useRef(0);
  const detailAbortControllerRef = useRef<AbortController | null>(null);
  const subTermOptions = useMemo(
    () =>
      registrationWindow.subTerms
        .filter((subTerm) => subTerm.subTermId !== null)
        .map((subTerm) => ({
          label: formatSubTerm(subTerm.subTermName, subTerm.subTermCode),
          value: String(subTerm.subTermId),
        })),
    [registrationWindow.subTerms]
  );

  function clearSelectedSection() {
    detailRequestIdRef.current += 1;
    detailAbortControllerRef.current?.abort();
    detailAbortControllerRef.current = null;
    setSelectedSection(null);
    setDetailState({ status: 'idle' });
  }

  function selectSection(row: StudentCourseSectionSearchRowResponse) {
    detailRequestIdRef.current += 1;
    detailAbortControllerRef.current?.abort();
    const requestId = detailRequestIdRef.current;
    const controller = new AbortController();
    detailAbortControllerRef.current = controller;

    setSelectedSection(row);
    setAddState({ status: 'idle' });

    if (row.sectionId === null) {
      setDetailState({
        message: 'This section is missing an id, so details cannot be loaded.',
        row,
        status: 'error',
      });
      return;
    }

    setDetailState({ row, status: 'loading' });

    void onGetCourseSectionDetail({
      registrationGroupId: registrationWindow.registrationGroupId,
      sectionId: row.sectionId,
      signal: controller.signal,
      termId: registrationWindow.termId,
    })
      .then((response) => {
        if (detailRequestIdRef.current !== requestId) {
          return;
        }

        setDetailState({ response, row, status: 'loaded' });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || detailRequestIdRef.current !== requestId) {
          return;
        }

        setDetailState({
          message: getErrorMessage(error, 'Failed to load course registration details.'),
          row,
          status: 'error',
        });
      });
  }

  function executeSearch(nextFilters: SearchFilters, nextPage = 0) {
    setPage(nextPage);
    clearSelectedSection();
    setAddState({ status: 'idle' });
    setSearchState({ status: 'loading' });

    void onSearch({
      courseCode: nextFilters.courseCode,
      dayOfWeeks: nextFilters.dayOfWeeks
        .map(Number)
        .filter((dayOfWeek) => Number.isFinite(dayOfWeek)),
      instructor: nextFilters.instructor,
      honorsFilter: nextFilters.honorsFilter,
      page: nextPage,
      section: nextFilters.section,
      size: PAGE_SIZE,
      startHour: parseOptionalHour(nextFilters.startHour, nextFilters.startMeridiem),
      subTermIds: nextFilters.subTermIds
        .map(Number)
        .filter((subTermId) => Number.isFinite(subTermId)),
      registrationGroupId: registrationWindow.registrationGroupId,
      termId: registrationWindow.termId,
      sortBy: 'courseCode',
      sortDirection: 'asc',
    })
      .then((response) => {
        setSearchState({ response, status: 'loaded' });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        setSearchState({
          message: getErrorMessage(error, 'Failed to search course sections.'),
          status: 'error',
        });
      });
  }

  function submitSearch() {
    setSubmittedFilters(filters);
    executeSearch(filters, 0);
  }

  function changePage(nextPage: number) {
    if (submittedFilters === null) {
      return;
    }

    executeSearch(submittedFilters, nextPage);
  }

  const rows = searchState.status === 'loaded' ? searchState.response.results : [];
  const totalElements = searchState.status === 'loaded' ? searchState.response.totalElements : 0;
  const totalPages = searchState.status === 'loaded' ? searchState.response.totalPages : 1;
  const currentPage = useMemo(() => Math.min(page, Math.max(0, totalPages - 1)), [page, totalPages]);

  function updateFilter(key: TextSearchFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function updateSubTermIds(subTermIds: string[]) {
    setFilters((current) => ({ ...current, subTermIds }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function updateDayOfWeeks(dayOfWeeks: string[]) {
    setFilters((current) => ({ ...current, dayOfWeeks }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function updateStartHour(value: string | number) {
    setFilters((current) => ({ ...current, startHour: value === '' ? '' : String(value) }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function updateStartMeridiem(value: string | null) {
    setFilters((current) => ({
      ...current,
      startMeridiem: value === 'PM' ? 'PM' : 'AM',
    }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function updateHonorsFilter(value: string | null) {
    setFilters((current) => ({
      ...current,
      honorsFilter:
        value === 'HONORS_ONLY' || value === 'NON_HONORS_ONLY'
          ? value
          : 'ALL',
    }));
    clearSelectedSection();
    setAddState({ status: 'idle' });
  }

  function closeModal() {
    setPage(0);
    setSubmittedFilters(null);
    clearSelectedSection();
    setAddState({ status: 'idle' });
    setSearchState({ status: 'idle' });
    onClose();
  }

  function handleAddSection(section: StudentCourseSectionSearchResultResponse) {
    if (section.sectionId === null) {
      return;
    }

    setAddState({ status: 'loading' });

    void onAddCourse(section.sectionId)
      .then(() => {
        setAddState({ status: 'idle' });
        closeModal();
      })
      .catch((error: unknown) => {
        if (error instanceof StudentCourseRegistrationScheduleConflictError) {
          setAddState({
            conflicts: error.conflicts,
            message: error.message,
            status: 'conflict',
          });
          return;
        }

        setAddState({
          message: getErrorMessage(error, 'Failed to add course selection.'),
          status: 'error',
        });
      });
  }

  return (
    <Modal
      opened={opened}
      onClose={closeModal}
      title="Find Course Sections"
      size={COURSE_SECTION_SEARCH_MODAL_SIZE}
      centered
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <TextInput
            label="Term"
            readOnly
            value={formatSubTerm(registrationWindow.termName, registrationWindow.termCode)}
          />
          <MultiSelect
            clearable
            data={subTermOptions}
            label="Subterms"
            placeholder="All subterms"
            value={filters.subTermIds}
            onChange={updateSubTermIds}
          />
          <TextInput
            label="Course code"
            placeholder="TOLK 240"
            value={filters.courseCode}
            onChange={(event) => updateFilter('courseCode', event.currentTarget.value)}
          />
          <TextInput
            label="Section"
            placeholder="A"
            value={filters.section}
            onChange={(event) => updateFilter('section', event.currentTarget.value)}
          />
          <TextInput
            label="Instructor"
            placeholder="Instructor name"
            value={filters.instructor}
            onChange={(event) => updateFilter('instructor', event.currentTarget.value)}
          />
          <Select
            allowDeselect={false}
            data={HONORS_FILTER_OPTIONS}
            label="Honors"
            value={filters.honorsFilter}
            onChange={updateHonorsFilter}
          />
          <MultiSelect
            clearable
            data={DAY_OPTIONS}
            label="Days"
            placeholder="Any day"
            value={filters.dayOfWeeks}
            onChange={updateDayOfWeeks}
          />
          <NumberInput
            allowDecimal={false}
            clampBehavior="strict"
            label="Start hour"
            max={12}
            min={1}
            placeholder="9"
            value={filters.startHour === '' ? undefined : Number(filters.startHour)}
            onChange={updateStartHour}
          />
          <Select
            allowDeselect={false}
            data={MERIDIEM_OPTIONS}
            label="AM/PM"
            value={filters.startMeridiem}
            onChange={updateStartMeridiem}
          />
        </SimpleGrid>

        <Group justify="space-between" align="center" wrap="wrap">
          <Text fw={800}>Search Results</Text>
          <Group gap="sm">
            {searchState.status === 'loaded' ? (
              <Badge variant="light" color="blue">
                {totalElements} sections
              </Badge>
            ) : null}
            <Button
              leftSection={<IconSearch size={16} />}
              loading={searchState.status === 'loading'}
              onClick={submitSearch}
            >
              Search
            </Button>
          </Group>
        </Group>

        {searchState.status === 'error' ? (
          <Alert color="red" title="Unable to search course sections">
            {searchState.message}
          </Alert>
        ) : null}

        <Table.ScrollContainer minWidth={760}>
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course</Table.Th>
                <Table.Th>Term</Table.Th>
                <Table.Th>Section</Table.Th>
                <Table.Th>Seats</Table.Th>
                <Table.Th>Instructor</Table.Th>
                <Table.Th>Time</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {searchState.status === 'loading' ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">Searching course sections...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
              {searchState.status === 'idle' ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">Enter criteria and search.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
              {searchState.status === 'loaded' && rows.length > 0
                ? rows.map((row) => (
                    <Table.Tr
                      key={row.sectionId ?? row.displaySectionCode}
                      aria-selected={selectedSection?.sectionId === row.sectionId}
                      className={
                        selectedSection?.sectionId === row.sectionId
                          ? `${classes.clickableRow} ${classes.selectedRow}`
                          : classes.clickableRow
                      }
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSection(row)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          selectSection(row);
                        }
                      }}
                    >
                      <Table.Td>
                        <Stack gap={0}>
                          <Text fw={800}>{displayText(row.courseCode)}</Text>
                          <Text size="sm" c="dimmed">
                            {displayText(row.courseTitle)}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text fw={700}>{displayText(row.termName)}</Text>
                          <Text size="sm" c="dimmed">
                            {displayText(row.subTermName)}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{displayText(row.displaySectionCode ?? row.sectionLetter)}</Table.Td>
                      <Table.Td>{formatSeats(row)}</Table.Td>
                      <Table.Td>{displayText(row.instructorSummary)}</Table.Td>
                      <Table.Td>{displayText(row.meetingSummary, 'No meetings')}</Table.Td>
                    </Table.Tr>
                  ))
                : null}
              {searchState.status === 'loaded' && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">No sections match those filters.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <SearchPaginationFooter
          page={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={changePage}
        />

        {detailState.status === 'loading' ? (
          <CourseSectionDetailLoadingPanel row={detailState.row} />
        ) : null}

        {detailState.status === 'error' ? (
          <CourseSectionDetailLoadingPanel
            color="red"
            row={detailState.row}
            message={detailState.message}
            title="Unable to load section details"
          />
        ) : null}

        {detailState.status === 'loaded' ? (
          <CourseSectionDetailPanel
            addState={addState}
            section={detailState.response}
            onAdd={handleAddSection}
          />
        ) : null}
      </Stack>
    </Modal>
  );
}
