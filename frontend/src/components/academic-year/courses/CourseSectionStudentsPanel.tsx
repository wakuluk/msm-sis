import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
  Checkbox,
} from '@mantine/core';
import {
  addCourseSectionStudent,
  getCourseSectionStudentEnrollment,
  getCourseSectionStudentEnrollmentEvents,
  getCourseSectionStudents,
  patchCourseSectionStudentEnrollment,
} from '@/services/course-service';
import { Link } from 'react-router-dom';
import type {
  CourseSectionStudentEnrollmentEventResponse,
  CourseSectionStudentResponse,
} from '@/services/schemas/course-schemas';
import { CourseSectionAddStudentModal, type AddStudentFormValues } from './CourseSectionAddStudentModal';
import type { CourseSectionPreview, SelectOption } from './courseSectionsWorkspaceTypes';
import { getErrorMessage } from './courseSectionsWorkspaceUtils';
import classes from './CourseSectionStudentsPanel.module.css';
import tableClasses from '@/components/search/SearchResultsTable.module.css';

type CourseSectionStudentsPanelProps = {
  selectedSection: CourseSectionPreview;
  gradingBasisOptions: SelectOption[];
  enrollmentStatusOptions?: SelectOption[];
};

type StudentListState =
  | { status: 'idle'; students: CourseSectionStudentResponse[] }
  | { status: 'loading'; students: CourseSectionStudentResponse[] }
  | { status: 'success'; students: CourseSectionStudentResponse[] }
  | { status: 'error'; students: CourseSectionStudentResponse[]; message: string };

type SelectedEnrollmentDetailState =
  | { status: 'idle'; student: CourseSectionStudentResponse | null }
  | { status: 'loading'; student: CourseSectionStudentResponse | null }
  | { status: 'success'; student: CourseSectionStudentResponse }
  | { status: 'error'; student: CourseSectionStudentResponse | null; message: string };

type StudentMutationState =
  | { status: 'idle' }
  | { status: 'adding' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type EnrollmentEventListState =
  | { status: 'idle'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'loading'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'success'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'error'; events: CourseSectionStudentEnrollmentEventResponse[]; message: string };

type StudentSortBy = 'student' | 'studentId' | 'status' | 'credits' | 'grading' | 'registered';

type StudentSortDirection = 'asc' | 'desc';

type SortableStudentColumn = {
  label: string;
  sortBy: StudentSortBy;
};

type EditEnrollmentValues = {
  statusCode: string | null;
  gradingBasisCode: string | null;
  creditsAttempted: number | null;
  includeInGpa: boolean;
  capacityOverride: boolean;
  manualAddReason?: string | null;
  reason?: string | null;
};

const sortableStudentColumns: SortableStudentColumn[] = [
  { label: 'Student', sortBy: 'student' },
  { label: 'ID', sortBy: 'studentId' },
  { label: 'Status', sortBy: 'status' },
  { label: 'Credits', sortBy: 'credits' },
  { label: 'Grading', sortBy: 'grading' },
  { label: 'Registered', sortBy: 'registered' },
];

function studentStatusColor(statusCode: string | null) {
  switch (statusCode) {
    case 'REGISTERED':
      return 'green';
    case 'WAITLISTED':
      return 'yellow';
    case 'DROPPED':
    case 'WITHDRAWN':
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}

function formatStudentDate(value: string | null) {
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

function formatBoolean(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatEventType(value: string | null) {
  if (!value) {
    return 'Event';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatStatusTransition(event: CourseSectionStudentEnrollmentEventResponse) {
  if (!event.fromStatusName && !event.toStatusName) {
    return 'Not set';
  }

  if (!event.fromStatusName) {
    return event.toStatusName ?? 'Not set';
  }

  if (!event.toStatusName || event.fromStatusName === event.toStatusName) {
    return event.fromStatusName;
  }

  return `${event.fromStatusName} to ${event.toStatusName}`;
}

function studentMatchesSearch(student: CourseSectionStudentResponse, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    student.studentDisplayName,
    student.email,
    student.studentId === null ? null : String(student.studentId),
    student.statusName,
    student.gradingBasisName,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedSearch));
}

function compareNullableString(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = left?.trim() || '';
  const rightValue = right?.trim() || '';

  return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
}

function compareNullableNumber(left: number | null | undefined, right: number | null | undefined) {
  if (left === null || left === undefined) {
    return right === null || right === undefined ? 0 : 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  return left - right;
}

function getRegisteredSortValue(student: CourseSectionStudentResponse) {
  return student.registeredAt ?? student.enrollmentDate;
}

function compareStudentsByColumn(
  left: CourseSectionStudentResponse,
  right: CourseSectionStudentResponse,
  sortBy: StudentSortBy
) {
  switch (sortBy) {
    case 'student':
      return compareNullableString(left.studentDisplayName, right.studentDisplayName);
    case 'studentId':
      return compareNullableNumber(left.studentId, right.studentId);
    case 'status':
      return compareNullableString(left.statusName ?? left.statusCode, right.statusName ?? right.statusCode);
    case 'credits':
      return compareNullableNumber(left.creditsAttempted, right.creditsAttempted);
    case 'grading':
      return compareNullableString(
        left.gradingBasisName ?? left.gradingBasisCode,
        right.gradingBasisName ?? right.gradingBasisCode
      );
    case 'registered':
      return compareNullableString(getRegisteredSortValue(left), getRegisteredSortValue(right));
  }
}

function SortableStudentHeader({
  column,
  sortBy,
  sortDirection,
  onToggleSort,
}: {
  column: SortableStudentColumn;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  onToggleSort: (sortBy: StudentSortBy) => void;
}) {
  const isActive = sortBy === column.sortBy;

  return (
    <UnstyledButton
      className={tableClasses.sortButton}
      onClick={() => {
        onToggleSort(column.sortBy);
      }}
    >
      <span>{column.label}</span>
      <span
        className={
          isActive
            ? `${tableClasses.sortDirection} ${tableClasses.sortDirectionActive}`
            : tableClasses.sortDirection
        }
      >
        {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </UnstyledButton>
  );
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

function CourseSectionStudentDetailsPanel({
  student,
  eventState,
  onEditEnrollment,
}: {
  student: CourseSectionStudentResponse;
  eventState: EnrollmentEventListState;
  onEditEnrollment: () => void;
}) {
  return (
    <Stack
      className={classes.studentDetailsPanel}
      gap="md"
      p="md"
    >
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
            {eventState.status !== 'loading' &&
            eventState.status !== 'error' &&
            eventState.events.length === 0 ? (
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

function CourseSectionEditEnrollmentModal({
  opened,
  student,
  gradingBasisOptions,
  enrollmentStatusOptions,
  saving,
  error,
  onClose,
  onSave,
}: {
  opened: boolean;
  student: CourseSectionStudentResponse | null;
  gradingBasisOptions: SelectOption[];
  enrollmentStatusOptions: SelectOption[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: EditEnrollmentValues) => void;
}) {
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [gradingBasisCode, setGradingBasisCode] = useState<string | null>(null);
  const [creditsAttempted, setCreditsAttempted] = useState<number | string>('');
  const [includeInGpa, setIncludeInGpa] = useState(true);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [manualAddReason, setManualAddReason] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!opened || !student) {
      return;
    }

    setStatusCode(student.statusCode);
    setGradingBasisCode(student.gradingBasisCode);
    setCreditsAttempted(student.creditsAttempted ?? '');
    setIncludeInGpa(student.includeInGpa);
    setCapacityOverride(student.capacityOverride);
    setManualAddReason(student.manualAddReason ?? '');
    setReason('');
  }, [opened, student]);

  const statusChanged = student ? statusCode !== student.statusCode : false;
  const showManualAddReason = capacityOverride;
  const showChangeReason = statusChanged;
  const missingManualAddReason = showManualAddReason && manualAddReason.trim().length === 0;
  const missingChangeReason = showChangeReason && reason.trim().length === 0;
  const canSave = !missingManualAddReason && !missingChangeReason;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Enrollment" size="48rem" centered>
      {student ? (
        <Stack gap="md">
          <Stack gap={4}>
            <Text fw={700}>{student.studentDisplayName ?? 'Student unavailable'}</Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="blue">
                Student ID {student.studentId ?? 'Not set'}
              </Badge>
              <Badge variant="light" color={studentStatusColor(student.statusCode)}>
                {student.statusName ?? 'Unknown'}
              </Badge>
            </Group>
          </Stack>

          {error ? (
            <Alert color="red" title="Unable to update enrollment">
              {error}
            </Alert>
          ) : null}

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Status"
                placeholder="Select status"
                data={enrollmentStatusOptions}
                value={statusCode}
                onChange={setStatusCode}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Grading basis"
                placeholder="Select grading"
                data={gradingBasisOptions}
                value={gradingBasisCode}
                onChange={setGradingBasisCode}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Credits attempted"
                min={0}
                decimalScale={2}
                value={creditsAttempted}
                onChange={setCreditsAttempted}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Stack gap="xs" mt={{ base: 0, sm: 26 }}>
                <Checkbox
                  label="Include in GPA"
                  checked={includeInGpa}
                  onChange={(event) => {
                    setIncludeInGpa(event.currentTarget.checked);
                  }}
                />
                <Checkbox
                  label="Capacity override"
                  checked={capacityOverride}
                  onChange={(event) => {
                    setCapacityOverride(event.currentTarget.checked);
                  }}
                />
              </Stack>
            </Grid.Col>
            {showManualAddReason ? (
              <Grid.Col span={12}>
                <Textarea
                  label="Manual add reason"
                  description="Required when capacity override is enabled."
                  autosize
                  minRows={2}
                  value={manualAddReason}
                  error={missingManualAddReason ? 'Manual add reason is required.' : null}
                  onChange={(event) => {
                    setManualAddReason(event.currentTarget.value);
                  }}
                />
              </Grid.Col>
            ) : null}
            {showChangeReason ? (
              <Grid.Col span={12}>
                <Textarea
                  label="Status change reason"
                  description="Required when changing enrollment status."
                  autosize
                  minRows={2}
                  value={reason}
                  error={missingChangeReason ? 'Status change reason is required.' : null}
                  onChange={(event) => {
                    setReason(event.currentTarget.value);
                  }}
                />
              </Grid.Col>
            ) : null}
          </Grid>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!canSave}
              onClick={() => {
                onSave({
                  statusCode,
                  gradingBasisCode,
                  creditsAttempted:
                    typeof creditsAttempted === 'number'
                      ? creditsAttempted
                      : Number(creditsAttempted) || null,
                  includeInGpa,
                  capacityOverride,
                  ...(showManualAddReason
                    ? { manualAddReason: manualAddReason.trim() || null }
                    : {}),
                  ...(showChangeReason ? { reason: reason.trim() || null } : {}),
                });
              }}
            >
              Save enrollment
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}

export function CourseSectionStudentsPanel({
  selectedSection,
  gradingBasisOptions,
  enrollmentStatusOptions = [
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'WAITLISTED', label: 'Waitlisted' },
    { value: 'DROPPED', label: 'Dropped' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ],
}: CourseSectionStudentsPanelProps) {
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<StudentSortBy>('student');
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>('asc');
  const [addStudentModalOpened, setAddStudentModalOpened] = useState(false);
  const [editEnrollmentModalOpened, setEditEnrollmentModalOpened] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);
  const [studentListState, setStudentListState] = useState<StudentListState>({
    status: 'idle',
    students: [],
  });
  const [studentMutationState, setStudentMutationState] = useState<StudentMutationState>({
    status: 'idle',
  });
  const [studentListReloadKey, setStudentListReloadKey] = useState(0);
  const [selectedEnrollmentDetailReloadKey, setSelectedEnrollmentDetailReloadKey] = useState(0);
  const [selectedEnrollmentDetailState, setSelectedEnrollmentDetailState] =
    useState<SelectedEnrollmentDetailState>({
      status: 'idle',
      student: null,
    });
  const [eventListReloadKey, setEventListReloadKey] = useState(0);
  const [eventListState, setEventListState] = useState<EnrollmentEventListState>({
    status: 'idle',
    events: [],
  });
  const students = studentListState.students;
  const filteredStudents = useMemo(
    () =>
      students
        .filter((student) => studentMatchesSearch(student, searchValue))
        .toSorted((left, right) => {
          const comparison = compareStudentsByColumn(left, right, sortBy);

          if (comparison !== 0) {
            return sortDirection === 'asc' ? comparison : comparison * -1;
          }

          return left.enrollmentId - right.enrollmentId;
        }),
    [searchValue, sortBy, sortDirection, students]
  );
  const registeredCount = students.filter((student) => student.statusCode === 'REGISTERED').length;
  const waitlistCount = students.filter((student) => student.statusCode === 'WAITLISTED').length;
  const capacity = selectedSection.capacity || 0;
  const openSeats = Math.max(capacity - registeredCount, 0);
  const addStudentError =
    studentMutationState.status === 'error' ? studentMutationState.message : null;
  const selectedStudentFromList =
    selectedEnrollmentId === null
      ? null
      : students.find((student) => student.enrollmentId === selectedEnrollmentId) ?? null;
  const selectedStudent = selectedEnrollmentDetailState.student ?? selectedStudentFromList;

  const updateEnrollmentInList = useCallback((updatedStudent: CourseSectionStudentResponse) => {
    setStudentListState((current) => ({
      ...current,
      students: current.students.map((student) =>
        student.enrollmentId === updatedStudent.enrollmentId ? updatedStudent : student
      ),
    }));
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    setStudentListState((current) => ({
      status: 'loading',
      students: current.students,
    }));

    void getCourseSectionStudents({
      sectionId: selectedSection.sectionId,
      size: 100,
      signal: abortController.signal,
    })
      .then((response) => {
        if (!abortController.signal.aborted) {
          setStudentListState({ status: 'success', students: response.results });
        }
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setStudentListState({
            status: 'error',
            students: [],
            message: getErrorMessage(error, 'Failed to load section students.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [selectedSection.sectionId, studentListReloadKey]);

  useEffect(() => {
    if (selectedEnrollmentId === null) {
      setSelectedEnrollmentDetailState({ status: 'idle', student: null });
      return;
    }

    const abortController = new AbortController();

    setSelectedEnrollmentDetailState({
      status: 'loading',
      student: selectedStudentFromList,
    });

    void getCourseSectionStudentEnrollment({
      sectionId: selectedSection.sectionId,
      enrollmentId: selectedEnrollmentId,
      signal: abortController.signal,
    })
      .then((response) => {
        if (!abortController.signal.aborted) {
          updateEnrollmentInList(response);
          setSelectedEnrollmentDetailState({ status: 'success', student: response });
        }
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setSelectedEnrollmentDetailState({
            status: 'error',
            student: selectedStudentFromList,
            message: getErrorMessage(error, 'Failed to load enrollment detail.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [
    selectedEnrollmentDetailReloadKey,
    selectedEnrollmentId,
    selectedSection.sectionId,
    updateEnrollmentInList,
  ]);

  useEffect(() => {
    if (selectedEnrollmentId === null) {
      setEventListState({ status: 'idle', events: [] });
      return;
    }

    const abortController = new AbortController();

    setEventListState((current) => ({
      status: 'loading',
      events: current.events,
    }));

    void getCourseSectionStudentEnrollmentEvents({
      sectionId: selectedSection.sectionId,
      enrollmentId: selectedEnrollmentId,
      size: 25,
      signal: abortController.signal,
    })
      .then((response) => {
        if (!abortController.signal.aborted) {
          setEventListState({ status: 'success', events: response.results });
        }
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setEventListState({
            status: 'error',
            events: [],
            message: getErrorMessage(error, 'Failed to load enrollment history.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [eventListReloadKey, selectedEnrollmentId, selectedSection.sectionId]);

  async function handleAddStudent(values: AddStudentFormValues) {
    if (studentMutationState.status === 'adding') {
      return;
    }

    try {
      setStudentMutationState({ status: 'adding' });
      const addedStudent = await addCourseSectionStudent({
        sectionId: selectedSection.sectionId,
        request: {
          studentId: values.studentId,
          gradingBasisCode: values.gradingBasisCode,
          creditsAttempted: values.creditsAttempted,
          capacityOverride: values.capacityOverride,
          manualAddReason: values.manualAddReason,
        },
      });

      setStudentListState((current) => ({
        ...current,
        students: [...current.students, addedStudent],
      }));
      setSelectedEnrollmentId(addedStudent.enrollmentId);
      setAddStudentModalOpened(false);
      setStudentMutationState({ status: 'idle' });
      setSelectedEnrollmentDetailReloadKey((current) => current + 1);
      setEventListReloadKey((current) => current + 1);
      setStudentListReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setStudentMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add student to section.'),
      });
    }
  }

  async function handleSaveEnrollment(values: EditEnrollmentValues) {
    if (!selectedStudent || studentMutationState.status === 'saving') {
      return;
    }

    try {
      setStudentMutationState({ status: 'saving' });
      const updatedStudent = await patchCourseSectionStudentEnrollment({
        sectionId: selectedSection.sectionId,
        enrollmentId: selectedStudent.enrollmentId,
        request: values,
      });

      updateEnrollmentInList(updatedStudent);
      setSelectedEnrollmentId(updatedStudent.enrollmentId);
      setEditEnrollmentModalOpened(false);
      setStudentMutationState({ status: 'idle' });
      setSelectedEnrollmentDetailReloadKey((current) => current + 1);
      setEventListReloadKey((current) => current + 1);
      setStudentListReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setStudentMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update student enrollment.'),
      });
    }
  }

  function handleToggleSort(nextSortBy: StudentSortBy) {
    setSortDirection((currentDirection) =>
      sortBy === nextSortBy && currentDirection === 'asc' ? 'desc' : 'asc'
    );
    setSortBy(nextSortBy);
  }

  return (
    <Stack gap="sm" w="100%">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Stack gap={2}>
          <Group gap="xs" wrap="wrap">
            <Text size="sm" fw={700}>
              Students
            </Text>
            <Badge variant="light" color="blue">
              {registeredCount}/{capacity} registered
            </Badge>
            <Badge variant="light" color={openSeats > 0 ? 'green' : 'red'}>
              {openSeats} open seats
            </Badge>
            {selectedSection.waitlistAllowed ? (
              <Badge variant="light" color="yellow">
                {waitlistCount} waitlisted
              </Badge>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed">
            {selectedSection.courseCode} Section {selectedSection.sectionCode}
          </Text>
        </Stack>

        <Group gap="xs" wrap="wrap" justify="flex-end" style={{ flex: 1 }}>
          <TextInput
            size="xs"
            placeholder="Search enrolled students"
            value={searchValue}
            w={320}
            onChange={(event) => {
              setSearchValue(event.currentTarget.value);
            }}
          />
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              setStudentMutationState({ status: 'idle' });
              setAddStudentModalOpened(true);
            }}
          >
            Add student
          </Button>
        </Group>
      </Group>

      {studentListState.status === 'error' ? (
        <Alert color="red" title="Unable to load students">
          {studentListState.message}
        </Alert>
      ) : null}

      {studentMutationState.status === 'error' ? (
        <Alert color="red" title="Unable to update enrollment">
          {studentMutationState.message}
        </Alert>
      ) : null}

      {selectedEnrollmentDetailState.status === 'error' ? (
        <Alert color="red" title="Unable to load enrollment detail">
          {selectedEnrollmentDetailState.message}
        </Alert>
      ) : null}

      <Table.ScrollContainer minWidth={960} w="100%">
        <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
          <Table withTableBorder withColumnBorders striped highlightOnHover stickyHeader style={{ width: '100%' }}>
            <Table.Thead>
              <Table.Tr>
                {sortableStudentColumns.map((column) => (
                  <Table.Th key={column.sortBy}>
                    <SortableStudentHeader
                      column={column}
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                      onToggleSort={handleToggleSort}
                    />
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStudents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      {studentListState.status === 'loading'
                        ? 'Loading students...'
                        : 'No students found.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}

              {filteredStudents.map((student) => (
                <Table.Tr
                  key={student.enrollmentId}
                  className={`${tableClasses.clickableRow} ${
                    selectedEnrollmentId === student.enrollmentId ? classes.selectedRow : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-selected={selectedEnrollmentId === student.enrollmentId}
                  onClick={() => {
                    setSelectedEnrollmentId(student.enrollmentId);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedEnrollmentId(student.enrollmentId);
                    }
                  }}
                >
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {student.studentDisplayName ?? 'Student unavailable'}
                    </Text>
                    {student.email ? (
                      <Text size="xs" c="dimmed">
                        {student.email}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>{student.studentId ?? 'Not set'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={studentStatusColor(student.statusCode)}>
                      {student.statusName ?? 'Unknown'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatCredits(student.creditsAttempted)}</Table.Td>
                  <Table.Td>{student.gradingBasisName ?? 'Not set'}</Table.Td>
                  <Table.Td>
                    {formatStudentDate(student.registeredAt ?? student.enrollmentDate)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      </Table.ScrollContainer>

      {selectedStudent ? (
        <CourseSectionStudentDetailsPanel
          student={selectedStudent}
          eventState={eventListState}
          onEditEnrollment={() => {
            setStudentMutationState({ status: 'idle' });
            setEditEnrollmentModalOpened(true);
          }}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Select a student row to review enrollment details.
        </Text>
      )}

      <CourseSectionAddStudentModal
        opened={addStudentModalOpened}
        capacity={capacity}
        registeredCount={registeredCount}
        gradingBasisOptions={gradingBasisOptions}
        defaultCredits={selectedSection.credits}
        defaultGradingBasisCode={selectedSection.gradingBasisCode}
        adding={studentMutationState.status === 'adding'}
        error={addStudentError}
        onClose={() => {
          setAddStudentModalOpened(false);
          if (studentMutationState.status === 'error') {
            setStudentMutationState({ status: 'idle' });
          }
        }}
        onAdd={(values) => {
          void handleAddStudent(values);
        }}
      />
      <CourseSectionEditEnrollmentModal
        opened={editEnrollmentModalOpened}
        student={selectedStudent}
        gradingBasisOptions={gradingBasisOptions}
        enrollmentStatusOptions={enrollmentStatusOptions}
        saving={studentMutationState.status === 'saving'}
        error={studentMutationState.status === 'error' ? studentMutationState.message : null}
        onClose={() => {
          setEditEnrollmentModalOpened(false);
          if (studentMutationState.status === 'error') {
            setStudentMutationState({ status: 'idle' });
          }
        }}
        onSave={(values) => {
          void handleSaveEnrollment(values);
        }}
      />
    </Stack>
  );
}
