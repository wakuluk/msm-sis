import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconChecklist, IconSearch, IconTrash } from '@tabler/icons-react';
import { displayDateTime } from '@/components/academic-year/academicYearDisplay';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import tableClasses from '@/components/search/SearchResultsTable.module.css';
import type {
  GetCourseSectionRegistrationDetailRequest,
  SearchCourseSectionsRequest,
} from '@/services/student-course-registration-service';
import type {
  StudentCourseRegistrationEnrollmentResponse,
  StudentCourseRegistrationFailureResponse,
  StudentCourseRegistrationResponse,
  StudentCourseRegistrationScheduleMeetingResponse,
  StudentCourseRegistrationRequisiteGroupResponse,
  StudentCourseRegistrationRequisiteResponse,
  StudentCourseRegistrationSelectionResponse,
  StudentCourseRegistrationSubmitResponse,
  StudentCourseRegistrationWindowResponse,
  StudentCourseSectionDetailResponse,
  StudentCourseSectionSearchResponse,
} from '@/services/schemas/student-course-registration-schemas';
import { StudentCourseRegistrationSchedule } from './StudentCourseRegistrationSchedule';
import { StudentCoursePrerequisitesTable } from './StudentCoursePrerequisitesTable';
import { StudentCourseSectionSearchModal } from './StudentCourseSectionSearchModal';
import type {
  StudentRegistrationCourseStatus,
  StudentRegistrationScheduleView,
  StudentRegistrationSubTermView,
} from './studentCourseRegistrationTypes';
import classes from './StudentCourseRegistrationWindow.module.css';

const STUDENT_REGISTRATION_MODAL_SIZE = 'min(96vw, 112rem)';

type StudentCourseRegistrationWindowProps = {
  actionError?: string | null;
  isMutatingSelection?: boolean;
  isSubmitting?: boolean;
  onAddCourse: (sectionId: number) => Promise<void>;
  onAcceptWaitlistOffer: (request: {
    enrollmentId?: number | null;
    waitlistOfferId?: number | null;
  }) => Promise<void>;
  onRegister: () => Promise<void>;
  onRemoveEnrollment: (enrollmentId: number) => Promise<void>;
  onRemoveCourse: (selectionId: number) => Promise<void>;
  onGetCourseSectionDetail: (
    request: GetCourseSectionRegistrationDetailRequest
  ) => Promise<StudentCourseSectionDetailResponse>;
  onSearchCourseSections: (
    request: SearchCourseSectionsRequest
  ) => Promise<StudentCourseSectionSearchResponse>;
  registration: StudentCourseRegistrationResponse;
  submitResult?: StudentCourseRegistrationSubmitResponse | null;
};

type CourseTableSortBy = 'course' | 'credits' | 'instructor' | 'meeting' | 'section' | 'status';

type SortDirection = 'asc' | 'desc';

type StudentRegistrationCourseRow = {
  capacity: number | null;
  courseCode: string;
  credits: number;
  enrollmentId: number | null;
  enrolledCount: number | null;
  honors: boolean;
  honorsWarningMessage: string | null;
  instructor: string;
  meetingPattern: string;
  sectionCode: string;
  sectionId: number | null;
  selectionId: number | null;
  requisiteGroups: StudentCourseRegistrationRequisiteGroupResponse[];
  requisites: StudentCourseRegistrationRequisiteResponse[];
  status: StudentRegistrationCourseStatus;
  title: string;
  waitlistCount: number | null;
  waitlistOfferExpiresAt: string | null;
  waitlistOfferId: number | null;
  waitlistOfferStatus: string | null;
  warnings: string[];
};

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={800} tt="uppercase">
        {label}
      </Text>
      <Text fw={800}>{value}</Text>
    </Stack>
  );
}

function WindowMetric({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2} className={classes.windowMetric}>
      <Text size="xs" c="dimmed" fw={800} tt="uppercase">
        {label}
      </Text>
      <Text fw={900} className={classes.windowMetricValue}>
        {value}
      </Text>
    </Stack>
  );
}

function displayText(value: string | null | undefined, fallback = '—') {
  return value?.trim() || fallback;
}

function displayNumber(value: number | null | undefined) {
  return value ?? 0;
}

function formatSeats(row: Pick<StudentRegistrationCourseRow, 'capacity' | 'enrolledCount'>) {
  if (row.enrolledCount === null || row.capacity === null) {
    return '—';
  }

  return `${row.enrolledCount} / ${row.capacity}`;
}

function getStatusColor(status: string | null | undefined) {
  switch (status) {
    case 'PUBLISHED':
      return 'green';
    case 'CLOSED':
      return 'gray';
    case 'CANCELLED':
      return 'red';
    default:
      return 'yellow';
  }
}

function getCourseStatusLabel(status: StudentRegistrationCourseStatus) {
  switch (status) {
    case 'PRE_REGISTERED':
      return 'Pre-registered';
    case 'WAITLISTED':
      return 'Waitlisted';
    case 'WAITLIST_EXPIRED':
      return 'Waitlist offer expired';
    case 'ENROLLED':
      return 'Enrolled';
  }
}

function getCourseStatusColor(status: StudentRegistrationCourseStatus) {
  switch (status) {
    case 'PRE_REGISTERED':
      return 'blue';
    case 'WAITLISTED':
      return 'yellow';
    case 'WAITLIST_EXPIRED':
      return 'gray';
    case 'ENROLLED':
      return 'green';
  }
}

function normalizeScheduleStatus(status: string): StudentRegistrationCourseStatus {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'WAITLISTED') {
    return 'WAITLISTED';
  }

  if (normalizedStatus === 'WAITLIST_EXPIRED') {
    return 'WAITLIST_EXPIRED';
  }

  if (normalizedStatus === 'ENROLLED' || normalizedStatus === 'REGISTERED') {
    return 'ENROLLED';
  }

  return 'PRE_REGISTERED';
}

function normalizeWaitlistOfferStatus(status: string | null | undefined) {
  return status?.trim().toUpperCase() ?? null;
}

function hasActiveWaitlistOffer(course: StudentRegistrationCourseRow | null) {
  return (
    (course?.waitlistOfferId !== null && course?.waitlistOfferId !== undefined
      || course?.enrollmentId !== null && course?.enrollmentId !== undefined) &&
    normalizeWaitlistOfferStatus(course.waitlistOfferStatus) === 'OFFERED'
  );
}

function isPublishedRegistrationGroup(window: StudentCourseRegistrationWindowResponse) {
  return window.statusCode?.trim().toUpperCase() === 'PUBLISHED';
}

function getCourseSortValue(course: StudentRegistrationCourseRow, sortBy: CourseTableSortBy) {
  switch (sortBy) {
    case 'course':
      return `${course.courseCode} ${course.title}`;
    case 'credits':
      return course.credits;
    case 'instructor':
      return course.instructor;
    case 'meeting':
      return course.meetingPattern;
    case 'section':
      return course.sectionCode;
    case 'status':
      return getCourseStatusLabel(course.status);
  }
}

function sortCourses(
  courses: ReadonlyArray<StudentRegistrationCourseRow>,
  sortBy: CourseTableSortBy,
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

function getCourseRowKey(course: StudentRegistrationCourseRow) {
  if (course.selectionId !== null) {
    return `selection-${course.selectionId}`;
  }

  if (course.enrollmentId !== null) {
    return `enrollment-${course.enrollmentId}`;
  }

  return `${course.status}-${course.sectionId ?? course.sectionCode}`;
}

function mapSelectionToCourseRow(
  selection: StudentCourseRegistrationSelectionResponse
): StudentRegistrationCourseRow {
  return {
    capacity: selection.capacity,
    courseCode: displayText(selection.courseCode),
    credits: displayNumber(selection.selectedCredits ?? selection.credits),
    enrollmentId: null,
    enrolledCount: selection.enrolledCount,
    honors: selection.honors,
    honorsWarningMessage: selection.honorsWarningMessage,
    instructor: displayText(selection.instructorSummary),
    meetingPattern: displayText(selection.meetingSummary, 'No meetings'),
    sectionCode: displayText(selection.displaySectionCode ?? selection.sectionLetter),
    sectionId: selection.sectionId,
    selectionId: selection.selectionId,
    requisiteGroups: selection.requisiteGroups,
    requisites: selection.requisites,
    status: 'PRE_REGISTERED',
    title: displayText(selection.courseTitle ?? selection.sectionTitle),
    waitlistCount: selection.waitlistCount,
    waitlistOfferExpiresAt: null,
    waitlistOfferId: null,
    waitlistOfferStatus: null,
    warnings: selection.corequisiteWarnings,
  };
}

function mapEnrollmentToCourseRow(
  enrollment: StudentCourseRegistrationEnrollmentResponse,
  status: StudentRegistrationCourseStatus
): StudentRegistrationCourseRow {
  return {
    capacity: enrollment.capacity,
    courseCode: displayText(enrollment.courseCode),
    credits: displayNumber(enrollment.creditsAttempted ?? enrollment.creditsEarned),
    enrollmentId: enrollment.enrollmentId,
    enrolledCount: enrollment.enrolledCount,
    honors: enrollment.honors,
    honorsWarningMessage: null,
    instructor: displayText(enrollment.instructorSummary),
    meetingPattern: displayText(enrollment.meetingSummary, 'No meetings'),
    sectionCode: displayText(enrollment.displaySectionCode ?? enrollment.sectionLetter),
    sectionId: enrollment.sectionId,
    selectionId: null,
    requisiteGroups: enrollment.requisiteGroups,
    requisites: enrollment.requisites,
    status,
    title: displayText(enrollment.courseTitle ?? enrollment.sectionTitle),
    waitlistCount: enrollment.waitlistCount,
    waitlistOfferExpiresAt: enrollment.waitlistOfferExpiresAt,
    waitlistOfferId: enrollment.waitlistOfferId,
    waitlistOfferStatus: enrollment.waitlistOfferStatus,
    warnings: [],
  };
}

function getDateBounds(subTerms: StudentRegistrationSubTermView[]) {
  if (subTerms.length === 0) {
    const today = new Date().toISOString().slice(0, 10);

    return { endDate: today, startDate: today };
  }

  const sortedStarts = subTerms.map((subTerm) => subTerm.startDate).sort();
  const sortedEnds = subTerms.map((subTerm) => subTerm.endDate).sort();

  return {
    endDate: sortedEnds[sortedEnds.length - 1],
    startDate: sortedStarts[0],
  };
}

function mapScheduleMeeting(
  meeting: StudentCourseRegistrationScheduleMeetingResponse
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
    color:
      getCourseStatusColor(normalizeScheduleStatus(meeting.registrationStatus)) === 'yellow'
        ? '#f59f00'
        : getCourseStatusColor(normalizeScheduleStatus(meeting.registrationStatus)) === 'green'
          ? '#2f9e44'
          : '#1c7ed6',
    courseCode: displayText(meeting.courseCode),
    dayOfWeek: meeting.dayOfWeek,
    endTime: meeting.endTime,
    id: meeting.id,
    location: displayText(meeting.location),
    sectionCode: displayText(meeting.displaySectionCode ?? meeting.sectionLetter),
    startTime: meeting.startTime,
    status: normalizeScheduleStatus(meeting.registrationStatus),
    subTermCode: displayText(meeting.subTermCode),
    subTermId: meeting.subTermId,
    subTermName: displayText(meeting.subTermName),
    termId: meeting.termId,
    title: displayText(meeting.courseTitle ?? meeting.sectionTitle),
  };
}

function mapRegistrationToSchedule(
  registration: StudentCourseRegistrationResponse
): StudentRegistrationScheduleView {
  const window = registration.registrationWindow;
  const selectedTermId = window.termId ?? 0;
  const subTerms = window.subTerms
    .filter(
      (subTerm) =>
        subTerm.subTermId !== null &&
        Boolean(subTerm.subTermCode) &&
        Boolean(subTerm.subTermName) &&
        Boolean(subTerm.startDate) &&
        Boolean(subTerm.endDate)
    )
    .map((subTerm) => ({
      code: subTerm.subTermCode ?? '',
      endDate: subTerm.endDate ?? '',
      id: subTerm.subTermId ?? 0,
      name: subTerm.subTermName ?? '',
      startDate: subTerm.startDate ?? '',
    }));
  const { endDate, startDate } = getDateBounds(subTerms);

  return {
    academicYears: [displayText(window.academicYearName)],
    meetings: registration.scheduleMeetings
      .map(mapScheduleMeeting)
      .filter(
        (meeting): meeting is StudentRegistrationScheduleView['meetings'][number] =>
          meeting !== null
      ),
    selectedAcademicYearName: displayText(window.academicYearName),
    selectedTermId,
    terms:
      selectedTermId === 0
        ? []
        : [
            {
              academicYearName: displayText(window.academicYearName),
              code: displayText(window.termCode),
              endDate,
              id: selectedTermId,
              name: displayText(window.termName),
              startDate,
              subTerms,
            },
          ],
    weekStart: startDate,
  };
}

function SortableCourseHeader({
  children,
  sortBy,
  sortDirection,
  value,
  onToggleSort,
}: {
  children: string;
  sortBy: CourseTableSortBy;
  sortDirection: SortDirection;
  value: CourseTableSortBy;
  onToggleSort: (sortBy: CourseTableSortBy) => void;
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

function PreregisteredCourseManagementModal({
  course,
  isRemoving,
  opened,
  onClose,
  onRemove,
}: {
  course: StudentRegistrationCourseRow | null;
  isRemoving: boolean;
  opened: boolean;
  onClose: () => void;
  onRemove: (course: StudentRegistrationCourseRow) => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Pre-registered Course"
      size={STUDENT_REGISTRATION_MODAL_SIZE}
      centered
    >
      {course ? (
        <Stack gap="md">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={900}>{course.courseCode}</Text>
              {course.honors ? (
                <Badge variant="light" color="blue">
                  Honors
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed">{course.title}</Text>
          </Stack>

          {course.warnings.length > 0 ? (
            <Alert color="yellow" title="Corequisite warning">
              <Stack gap={4}>
                {course.warnings.map((warning) => (
                  <Text key={warning}>{warning}</Text>
                ))}
              </Stack>
            </Alert>
          ) : null}

          {course.honorsWarningMessage ? (
            <Alert color="yellow" title="Honors advisory">
              {course.honorsWarningMessage}
            </Alert>
          ) : null}

          <div className={classes.courseManagementGrid}>
            <SummaryField label="Section" value={course.sectionCode} />
            <SummaryField label="Honors" value={course.honors ? 'Yes' : 'No'} />
            <SummaryField label="Credits" value={String(course.credits)} />
            <SummaryField label="Meeting" value={course.meetingPattern} />
            <SummaryField label="Instructor" value={course.instructor} />
          </div>

          <StudentCoursePrerequisitesTable
            requisiteGroups={course.requisiteGroups}
            requisites={course.requisites}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={isRemoving}
              onClick={() => onRemove(course)}
            >
              Remove from pre-registration
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}

function WaitlistedCourseOfferModal({
  course,
  isSubmitting,
  opened,
  onClose,
  onEnroll,
}: {
  course: StudentRegistrationCourseRow | null;
  isSubmitting: boolean;
  opened: boolean;
  onClose: () => void;
  onEnroll: (course: StudentRegistrationCourseRow) => void;
}) {
  const hasActiveOffer = hasActiveWaitlistOffer(course);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Waitlist Offer"
      size={STUDENT_REGISTRATION_MODAL_SIZE}
      centered
    >
      {course ? (
        <Stack gap="md">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={900}>{course.courseCode}</Text>
              {course.honors ? (
                <Badge variant="light" color="blue">
                  Honors
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed">{course.title}</Text>
          </Stack>

          {hasActiveOffer ? (
            <Alert color="blue" title="Seat available">
              You can enroll in this course until {displayDateTime(course.waitlistOfferExpiresAt)}.
            </Alert>
          ) : (
            <Alert color="gray" title="No active offer">
              This course is still on your waitlist, but it is not currently available to enroll.
            </Alert>
          )}

          <div className={classes.courseManagementGrid}>
            <SummaryField label="Section" value={course.sectionCode} />
            <SummaryField label="Honors" value={course.honors ? 'Yes' : 'No'} />
            <SummaryField label="Credits" value={String(course.credits)} />
            <SummaryField label="Meeting" value={course.meetingPattern} />
            <SummaryField label="Instructor" value={course.instructor} />
          </div>

          <StudentCoursePrerequisitesTable
            requisiteGroups={course.requisiteGroups}
            requisites={course.requisites}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
            <Button
              leftSection={<IconChecklist size={16} />}
              loading={isSubmitting}
              disabled={!hasActiveOffer}
              onClick={() => onEnroll(course)}
            >
              Enroll
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}

function EnrolledCourseManagementModal({
  course,
  isRemoving,
  opened,
  registrationEditable,
  onClose,
  onDrop,
}: {
  course: StudentRegistrationCourseRow | null;
  isRemoving: boolean;
  opened: boolean;
  registrationEditable: boolean;
  onClose: () => void;
  onDrop: (course: StudentRegistrationCourseRow) => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Enrolled Course"
      size={STUDENT_REGISTRATION_MODAL_SIZE}
      centered
    >
      {course ? (
        <Stack gap="md">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={900}>{course.courseCode}</Text>
              {course.honors ? (
                <Badge variant="light" color="blue">
                  Honors
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed">{course.title}</Text>
          </Stack>

          <Alert color={registrationEditable ? 'yellow' : 'gray'} title="Drop course">
            {registrationEditable
              ? 'Dropping this course removes it from your registration for the current term. You can add it again while your registration window is open.'
              : 'This registration group is read-only, so enrolled courses cannot be changed.'}
          </Alert>

          <div className={classes.courseManagementGrid}>
            <SummaryField label="Section" value={course.sectionCode} />
            <SummaryField label="Honors" value={course.honors ? 'Yes' : 'No'} />
            <SummaryField label="Credits" value={String(course.credits)} />
            <SummaryField label="Meeting" value={course.meetingPattern} />
            <SummaryField label="Instructor" value={course.instructor} />
          </div>

          <StudentCoursePrerequisitesTable
            requisiteGroups={course.requisiteGroups}
            requisites={course.requisites}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={isRemoving}
              disabled={!registrationEditable || course.enrollmentId === null}
              onClick={() => onDrop(course)}
            >
              Drop course
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}

function PreregisteredCoursesTable({
  courses,
  isMutatingSelection,
  isSubmitting,
  preRegistrationAvailable,
  registrationWindowOpen,
  registrationWindow,
  onAddCourse,
  onRegister,
  onRemoveCourse,
  onGetCourseSectionDetail,
  onSearchCourseSections,
}: {
  courses: ReadonlyArray<StudentRegistrationCourseRow>;
  isMutatingSelection: boolean;
  isSubmitting: boolean;
  preRegistrationAvailable: boolean;
  registrationWindowOpen: boolean;
  onAddCourse: (sectionId: number) => Promise<void>;
  onRegister: () => Promise<void>;
  onRemoveCourse: (selectionId: number) => Promise<void>;
  onGetCourseSectionDetail: (
    request: GetCourseSectionRegistrationDetailRequest
  ) => Promise<StudentCourseSectionDetailResponse>;
  onSearchCourseSections: (
    request: SearchCourseSectionsRequest
  ) => Promise<StudentCourseSectionSearchResponse>;
  registrationWindow: StudentCourseRegistrationWindowResponse;
}) {
  const [searchModalOpened, setSearchModalOpened] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<StudentRegistrationCourseRow | null>(null);
  const [sortBy, setSortBy] = useState<CourseTableSortBy>('course');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const sortedCourses = useMemo(
    () => sortCourses(courses, sortBy, sortDirection),
    [courses, sortBy, sortDirection]
  );

  function toggleSort(nextSortBy: CourseTableSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleRemoveSelectedCourse(course: StudentRegistrationCourseRow) {
    if (course.selectionId === null) {
      return;
    }

    void onRemoveCourse(course.selectionId).then(() => setSelectedCourse(null));
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={2}>
          <Text fw={800}>Pre-registered Courses</Text>
          <Text size="sm" c="dimmed">
            These courses are staged for final registration when your window opens.
          </Text>
        </Stack>
        <Button
          variant="light"
          leftSection={<IconSearch size={16} />}
          disabled={!preRegistrationAvailable}
          onClick={() => setSearchModalOpened(true)}
        >
          Find Course Sections
        </Button>
      </Group>
      <StudentCourseSectionSearchModal
        opened={searchModalOpened}
        registrationWindow={registrationWindow}
        onAddCourse={onAddCourse}
        onClose={() => setSearchModalOpened(false)}
        onGetCourseSectionDetail={onGetCourseSectionDetail}
        onSearch={onSearchCourseSections}
      />
      <PreregisteredCourseManagementModal
        course={selectedCourse}
        isRemoving={isMutatingSelection}
        opened={selectedCourse !== null}
        onClose={() => setSelectedCourse(null)}
        onRemove={handleRemoveSelectedCourse}
      />
      {courses.length === 0 ? (
        <Alert color="gray" title="No pre-registered courses">
          Courses you have planned for registration will appear here.
        </Alert>
      ) : (
        <Table.ScrollContainer minWidth={940}>
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="course"
                    onToggleSort={toggleSort}
                  >
                    Course
                  </SortableCourseHeader>
                </Table.Th>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="section"
                    onToggleSort={toggleSort}
                  >
                    Section
                  </SortableCourseHeader>
                </Table.Th>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="credits"
                    onToggleSort={toggleSort}
                  >
                    Credits
                  </SortableCourseHeader>
                </Table.Th>
                <Table.Th>Seats</Table.Th>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="meeting"
                    onToggleSort={toggleSort}
                  >
                    Meeting
                  </SortableCourseHeader>
                </Table.Th>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="instructor"
                    onToggleSort={toggleSort}
                  >
                    Instructor
                  </SortableCourseHeader>
                </Table.Th>
                <Table.Th>
                  <SortableCourseHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    value="status"
                    onToggleSort={toggleSort}
                  >
                    Status
                  </SortableCourseHeader>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedCourses.map((course) => (
                <Table.Tr
                  key={getCourseRowKey(course)}
                  className={classes.clickableCourseRow}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCourse(course)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCourse(course);
                    }
                  }}
                >
                  <Table.Td>
                    <Stack gap={0}>
                      <Text fw={800}>{course.courseCode}</Text>
                      {course.honors ? (
                        <Badge variant="light" color="blue" size="sm">
                          Honors
                        </Badge>
                      ) : null}
                      <Text size="sm" c="dimmed">
                        {course.title}
                      </Text>
                      {course.warnings.map((warning) => (
                        <Text key={warning} size="xs" c="yellow.8" fw={700}>
                          {warning}
                        </Text>
                      ))}
                      {course.honorsWarningMessage ? (
                        <Text size="xs" c="yellow.8" fw={700}>
                          {course.honorsWarningMessage}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>{course.sectionCode}</Table.Td>
                  <Table.Td>{course.credits}</Table.Td>
                  <Table.Td>{formatSeats(course)}</Table.Td>
                  <Table.Td>{course.meetingPattern}</Table.Td>
                  <Table.Td>{course.instructor}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={getCourseStatusColor(course.status)}>
                      {getCourseStatusLabel(course.status)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
      <Group justify="flex-end">
        <Button
          disabled={!registrationWindowOpen || courses.length === 0}
          leftSection={<IconChecklist size={16} />}
          loading={isSubmitting}
          onClick={() => {
            void onRegister();
          }}
        >
          Register courses
        </Button>
      </Group>
    </Stack>
  );
}

function RegisteredCourseTable({
  courses,
  description,
  title,
  onSelectCourse,
}: {
  courses: ReadonlyArray<StudentRegistrationCourseRow>;
  description?: string;
  title: string;
  onSelectCourse?: (course: StudentRegistrationCourseRow) => void;
}) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Stack gap={2}>
        <Text fw={800}>{title}</Text>
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
      </Stack>
      <Table.ScrollContainer minWidth={840}>
        <Table horizontalSpacing="md" verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Course</Table.Th>
              <Table.Th>Section</Table.Th>
              <Table.Th>Credits</Table.Th>
              <Table.Th>Seats</Table.Th>
              <Table.Th>Meeting</Table.Th>
              <Table.Th>Instructor</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {courses.map((course) => (
              <Table.Tr
                key={getCourseRowKey(course)}
                className={onSelectCourse ? classes.clickableCourseRow : undefined}
                role={onSelectCourse ? 'button' : undefined}
                tabIndex={onSelectCourse ? 0 : undefined}
                onClick={onSelectCourse ? () => onSelectCourse(course) : undefined}
                onKeyDown={
                  onSelectCourse
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectCourse(course);
                        }
                      }
                    : undefined
                }
              >
                <Table.Td>
                  <Stack gap={0}>
                    <Text fw={800}>{course.courseCode}</Text>
                    {course.honors ? (
                      <Badge variant="light" color="blue" size="sm">
                        Honors
                      </Badge>
                    ) : null}
                    <Text size="sm" c="dimmed">
                      {course.title}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>{course.sectionCode}</Table.Td>
                <Table.Td>{course.credits}</Table.Td>
                <Table.Td>{formatSeats(course)}</Table.Td>
                <Table.Td>{course.meetingPattern}</Table.Td>
                <Table.Td>{course.instructor}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={getCourseStatusColor(course.status)}>
                    {getCourseStatusLabel(course.status)}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

function RegistrationSubmitResultAlert({
  result,
}: {
  result: StudentCourseRegistrationSubmitResponse;
}) {
  const failures = [...result.removedFailures, ...result.retryableFailures];
  const scheduleConflictFailures = failures.filter(isScheduleConflictFailure);
  const otherFailures = failures.filter((failure) => !isScheduleConflictFailure(failure));

  return (
    <Stack gap="sm">
      <Alert color={failures.length > 0 ? 'yellow' : 'green'} title="Registration result">
        {result.message}
      </Alert>
      {result.warnings.length > 0 ? (
        <Alert color="yellow" title="Registration warnings">
          <Stack gap={4}>
            {result.warnings.map((warning) => (
              <Text key={`${warning.warningCode}-${warning.selectionId ?? warning.sectionId}`}>
                {displayText(warning.displaySectionCode ?? warning.courseCode)}: {warning.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      ) : null}
      {scheduleConflictFailures.length > 0 ? (
        <Alert color="red" title="Schedule conflicts found">
          <Stack gap={6}>
            <Text>
              These courses are still pre-registered. Remove or change one before registering.
            </Text>
            {scheduleConflictFailures.map((failure) => (
              <Text key={`${failure.failureCode}-${failure.selectionId ?? failure.sectionId}`}>
                {failure.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      ) : null}
      {otherFailures.length > 0 ? (
        <Alert color="red" title="Some courses could not be registered">
          <Stack gap={4}>
            {otherFailures.map((failure) => (
              <Text key={`${failure.failureCode}-${failure.selectionId ?? failure.sectionId}`}>
                {displayText(failure.displaySectionCode ?? failure.courseCode)}: {failure.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      ) : null}
    </Stack>
  );
}

function isScheduleConflictFailure(failure: StudentCourseRegistrationFailureResponse) {
  return failure.failureCode === 'SCHEDULE_CONFLICT';
}

export function StudentCourseRegistrationWindow({
  actionError,
  isMutatingSelection = false,
  isSubmitting = false,
  onAddCourse,
  onAcceptWaitlistOffer,
  onRegister,
  onRemoveEnrollment,
  onRemoveCourse,
  onGetCourseSectionDetail,
  onSearchCourseSections,
  registration,
  submitResult = null,
}: StudentCourseRegistrationWindowProps) {
  const window = registration.registrationWindow;
  const groupIsAssigned = window.registrationGroupId !== null;
  const preRegistrationAvailable = isPublishedRegistrationGroup(window);
  const registrationWindowOpen = window.registrationWindowOpen;
  const registrationEditable = preRegistrationAvailable && registrationWindowOpen;
  const [selectedEnrolledCourse, setSelectedEnrolledCourse] =
    useState<StudentRegistrationCourseRow | null>(null);
  const [selectedWaitlistedCourse, setSelectedWaitlistedCourse] =
    useState<StudentRegistrationCourseRow | null>(null);
  const selectionRows = useMemo(
    () => registration.selections.map(mapSelectionToCourseRow),
    [registration.selections]
  );
  const enrolledRows = useMemo(
    () =>
      registration.enrolled.map((enrollment) => mapEnrollmentToCourseRow(enrollment, 'ENROLLED')),
    [registration.enrolled]
  );
  const waitlistedRows = useMemo(
    () =>
      registration.waitlisted.map((enrollment) =>
        mapEnrollmentToCourseRow(enrollment, 'WAITLISTED')
      ),
    [registration.waitlisted]
  );
  const expiredWaitlistRows = useMemo(
    () =>
      registration.expiredWaitlist.map((enrollment) =>
        mapEnrollmentToCourseRow(enrollment, 'WAITLIST_EXPIRED')
      ),
    [registration.expiredWaitlist]
  );
  const schedule = useMemo(() => mapRegistrationToSchedule(registration), [registration]);

  function handleDropEnrolledCourse(course: StudentRegistrationCourseRow) {
    if (course.enrollmentId === null) {
      return;
    }

    void onRemoveEnrollment(course.enrollmentId).then(() => setSelectedEnrolledCourse(null));
  }

  return (
    <RecordPageSection
      title="Registration Window"
      description="Your assigned registration group controls when you can begin registering for this term."
    >
      <Grid.Col span={12}>
        {groupIsAssigned ? (
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Stack gap={2}>
                <Text fw={800}>{displayText(window.termName)} Registration</Text>
                <Text size="sm" c="dimmed">
                  Pre-register while your group is published, then register when your window opens.
                </Text>
              </Stack>
              <Badge variant="light" color={getStatusColor(window.statusCode)} size="lg">
                {displayText(window.statusName ?? window.statusCode)}
              </Badge>
            </Group>

            <div className={classes.windowPanel}>
              <div className={classes.identitySummary}>
                <SummaryField
                  label="Student"
                  value={displayText(registration.studentDisplayName)}
                />
                <SummaryField label="Academic Year" value={displayText(window.academicYearName)} />
                <SummaryField
                  label="Term"
                  value={`${displayText(window.termName)} (${displayText(window.termCode)})`}
                />
              </div>
              <div className={classes.windowSummary}>
                <WindowMetric label="Opens" value={displayDateTime(window.registrationOpensAt)} />
                <WindowMetric label="Closes" value={displayDateTime(window.registrationClosesAt)} />
              </div>
            </div>

            {actionError ? (
              <Alert color="red" title="Unable to update registration">
                {actionError}
              </Alert>
            ) : null}

            <PreregisteredCoursesTable
              courses={selectionRows}
              isMutatingSelection={isMutatingSelection}
              isSubmitting={isSubmitting}
              preRegistrationAvailable={preRegistrationAvailable}
              registrationWindowOpen={registrationWindowOpen}
              registrationWindow={window}
              onAddCourse={onAddCourse}
              onRegister={onRegister}
              onRemoveCourse={onRemoveCourse}
              onGetCourseSectionDetail={onGetCourseSectionDetail}
              onSearchCourseSections={onSearchCourseSections}
            />

            {submitResult ? <RegistrationSubmitResultAlert result={submitResult} /> : null}

            <RegisteredCourseTable
              courses={enrolledRows}
              title="Enrolled Courses"
              description="Click an enrolled course to review or drop it while your registration window is open."
              onSelectCourse={setSelectedEnrolledCourse}
            />
            <EnrolledCourseManagementModal
              course={selectedEnrolledCourse}
              isRemoving={isMutatingSelection}
              opened={selectedEnrolledCourse !== null}
              registrationEditable={registrationEditable}
              onClose={() => setSelectedEnrolledCourse(null)}
              onDrop={handleDropEnrolledCourse}
            />
            <RegisteredCourseTable
              courses={waitlistedRows}
              title="Waitlisted Courses"
              description="Click a waitlisted course when a seat is available to enroll."
              onSelectCourse={setSelectedWaitlistedCourse}
            />
            <WaitlistedCourseOfferModal
              course={selectedWaitlistedCourse}
              isSubmitting={isSubmitting}
              opened={selectedWaitlistedCourse !== null}
              onClose={() => setSelectedWaitlistedCourse(null)}
              onEnroll={(course) => {
                const waitlistOfferId = course.waitlistOfferId;
                const enrollmentId = course.enrollmentId;
                if (!hasActiveWaitlistOffer(course)) {
                  return;
                }

                void onAcceptWaitlistOffer({ enrollmentId, waitlistOfferId }).then(() =>
                  setSelectedWaitlistedCourse(null)
                );
              }}
            />
            <RegisteredCourseTable
              courses={expiredWaitlistRows}
              title="Expired Waitlist Offers"
              description="These waitlist offers expired before registration was completed. They are shown for your records and cannot be edited."
            />

            <Stack gap="sm">
              <Stack gap={2}>
                <Text fw={800}>Weekly Schedule</Text>
                <Text size="sm" c="dimmed">
                  This shows how your pre-registered, waitlisted, and enrolled courses fit into the
                  selected term.
                </Text>
              </Stack>
              <StudentCourseRegistrationSchedule schedule={schedule} />
            </Stack>
          </Stack>
        ) : (
          <Alert color="yellow" title="No registration group assigned">
            You are not currently assigned to a registration group for an upcoming term.
          </Alert>
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}
