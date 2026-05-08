// Modal for manually enrolling a student in a course section.
// Collects student id, grading basis, credit, override, and reason values before submit.
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Combobox,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  useCombobox,
} from '@mantine/core';
import { searchStudents } from '@/services/student-service';
import type { StudentSearchResultResponse } from '@/services/schemas/student-schemas';
import type { SelectOption } from './courseSectionsWorkspaceTypes';
import { getErrorMessage } from './courseSectionsWorkspaceUtils';

type CourseSectionAddStudentModalProps = {
  opened: boolean;
  capacity: number;
  hardCapacity: number | null;
  registeredCount: number;
  waitlistAllowed: boolean;
  gradingBasisOptions: SelectOption[];
  defaultCredits: number | null;
  defaultGradingBasisCode: string | null;
  adding: boolean;
  error: string | null;
  onClose: () => void;
  onAdd: (values: AddStudentFormValues) => void;
};

export type AddStudentFormValues = {
  studentId: number;
  statusCode: string | null;
  gradingBasisCode: string | null;
  creditsAttempted: number | null;
  capacityOverride: boolean;
  manualAddReason: string | null;
};

type StudentSearchState =
  | { status: 'idle'; results: StudentSearchResultResponse[] }
  | { status: 'loading'; results: StudentSearchResultResponse[] }
  | { status: 'success'; results: StudentSearchResultResponse[] }
  | { status: 'error'; results: StudentSearchResultResponse[]; message: string };

function buildStudentLabel(student: StudentSearchResultResponse) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unnamed student';
}

function buildStudentDescription(student: StudentSearchResultResponse) {
  return [
    `ID ${student.studentId}`,
    student.classStanding,
    student.classOf === null ? null : `Class of ${student.classOf}`,
  ]
    .filter(Boolean)
    .join(' • ');
}

function buildBaseSearchFilters() {
  return {
    lastName: '',
    firstName: '',
    studentId: '',
    classOf: '',
    genderId: '',
    ethnicityId: '',
    classStandingId: '',
    updatedBy: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    countryCode: '',
  };
}

function buildSearchFilterSets(searchValue: string) {
  const trimmedValue = searchValue.trim();

  if (/^\d+$/.test(trimmedValue)) {
    return [{ ...buildBaseSearchFilters(), studentId: trimmedValue }];
  }

  const [firstToken, secondToken] = trimmedValue.split(/\s+/, 2);

  if (secondToken) {
    return [{ ...buildBaseSearchFilters(), firstName: firstToken, lastName: secondToken }];
  }

  return [
    { ...buildBaseSearchFilters(), firstName: trimmedValue },
    { ...buildBaseSearchFilters(), lastName: trimmedValue },
  ];
}

async function searchStudentOptions(searchValue: string, signal: AbortSignal) {
  const responses = await Promise.all(
    buildSearchFilterSets(searchValue).map((filters) =>
      searchStudents({
        filters,
        size: 10,
        signal,
      })
    )
  );
  const studentsById = new Map<number, StudentSearchResultResponse>();

  responses.forEach((response) => {
    response.results.forEach((student) => {
      studentsById.set(student.studentId, student);
    });
  });

  return [...studentsById.values()].sort((left, right) =>
    buildStudentLabel(left).localeCompare(buildStudentLabel(right))
  );
}

export function CourseSectionAddStudentModal({
  opened,
  capacity,
  hardCapacity,
  registeredCount,
  waitlistAllowed,
  gradingBasisOptions,
  defaultCredits,
  defaultGradingBasisCode,
  adding,
  error,
  onClose,
  onAdd,
}: CourseSectionAddStudentModalProps) {
  const combobox = useCombobox({
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [searchValue, setSearchValue] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResultResponse | null>(null);
  const [studentSearchState, setStudentSearchState] = useState<StudentSearchState>({
    status: 'idle',
    results: [],
  });
  const [gradingBasisCode, setGradingBasisCode] = useState<string | null>(defaultGradingBasisCode);
  const [creditsAttempted, setCreditsAttempted] = useState<number | string>(defaultCredits ?? '');
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [manualAddReason, setManualAddReason] = useState('');
  const hasCapacity = registeredCount < capacity;
  const hardCapacityReached = hardCapacity !== null && registeredCount >= hardCapacity;
  const willWaitlist = statusCode === 'WAITLISTED';
  const willRegister = statusCode === 'REGISTERED';
  const requiresCapacityOverride = !hasCapacity && !willWaitlist && !hardCapacityReached;
  const canSubmit =
    selectedStudent !== null &&
    !(hardCapacityReached && willRegister) &&
    (!requiresCapacityOverride || capacityOverride) &&
    (!capacityOverride || manualAddReason.trim().length > 0);
  const statusOptions = [
    { value: 'REGISTERED', label: 'Registered' },
    ...(waitlistAllowed ? [{ value: 'WAITLISTED', label: 'Waitlisted' }] : []),
  ];
  const dropdownContent = useMemo(() => {
    if (studentSearchState.status === 'loading') {
      return <Combobox.Empty>Searching...</Combobox.Empty>;
    }

    if (searchValue.trim().length < 2) {
      return <Combobox.Empty>Type at least 2 characters</Combobox.Empty>;
    }

    if (studentSearchState.status === 'error') {
      return <Combobox.Empty>{studentSearchState.message}</Combobox.Empty>;
    }

    if (studentSearchState.results.length === 0) {
      return <Combobox.Empty>No students found</Combobox.Empty>;
    }

    return studentSearchState.results.map((student) => (
      <Combobox.Option key={student.studentId} value={String(student.studentId)}>
        <Stack gap={0}>
          <Text size="sm">{buildStudentLabel(student)}</Text>
          <Text size="xs" c="dimmed">
            {buildStudentDescription(student)}
          </Text>
        </Stack>
      </Combobox.Option>
    ));
  }, [searchValue, studentSearchState]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setSearchValue('');
    setSelectedStudent(null);
    setStudentSearchState({ status: 'idle', results: [] });
    setGradingBasisCode(defaultGradingBasisCode);
    setCreditsAttempted(defaultCredits ?? '');
    setStatusCode(!hasCapacity && waitlistAllowed ? 'WAITLISTED' : 'REGISTERED');
    setCapacityOverride(false);
    setManualAddReason('');
  }, [defaultCredits, defaultGradingBasisCode, hasCapacity, opened, waitlistAllowed]);

  useEffect(() => {
    if (!opened || searchValue.trim().length < 2 || selectedStudent) {
      setStudentSearchState((current) => ({
        status: 'idle',
        results: selectedStudent ? current.results : [],
      }));
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStudentSearchState((current) => ({
        status: 'loading',
        results: current.results,
      }));

      void searchStudentOptions(searchValue, abortController.signal)
        .then((results) => {
          if (!abortController.signal.aborted) {
            setStudentSearchState({ status: 'success', results });
          }
        })
        .catch((searchError: unknown) => {
          if (!abortController.signal.aborted) {
            setStudentSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(searchError, 'Failed to search students.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [opened, searchValue, selectedStudent]);

  return (
    <Modal opened={opened} onClose={onClose} title="Add Student" size="lg" centered>
      <Stack gap="md">
        {hardCapacityReached ? (
          <Alert color="red" title="Section has reached hard capacity">
            {waitlistAllowed
              ? 'No additional students can be registered. Students can still be added to the waitlist.'
              : 'No additional students can be registered for this section.'}
          </Alert>
        ) : !hasCapacity ? (
          <Alert color={waitlistAllowed ? 'blue' : 'yellow'} title="Section is at capacity">
            {waitlistAllowed
              ? 'Students can be added to the waitlist for this section.'
              : 'Adding another registered student will require a capacity override.'}
          </Alert>
        ) : null}

        <Combobox
          store={combobox}
          onOptionSubmit={(optionValue) => {
            const student = studentSearchState.results.find(
              (result) => result.studentId === Number(optionValue)
            );

            if (student) {
              setSelectedStudent(student);
              setSearchValue(buildStudentLabel(student));
            }

            combobox.closeDropdown();
          }}
        >
          <Combobox.Target>
            <TextInput
              label="Student name or ID"
              placeholder="Search by last name, full name, or ID"
              value={searchValue}
              onFocus={() => {
                combobox.openDropdown();
              }}
              onClick={() => {
                combobox.openDropdown();
              }}
              onChange={(event) => {
                setSelectedStudent(null);
                setSearchValue(event.currentTarget.value);
                combobox.openDropdown();
              }}
            />
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options>{dropdownContent}</Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>

        {selectedStudent ? (
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue">
              Student ID {selectedStudent.studentId}
            </Badge>
            {selectedStudent.classStanding ? (
              <Badge variant="light" color="gray">
                {selectedStudent.classStanding}
              </Badge>
            ) : null}
            {selectedStudent.classOf !== null ? (
              <Badge variant="light" color="gray">
                Class of {selectedStudent.classOf}
              </Badge>
            ) : null}
          </Group>
        ) : null}

        <Group grow align="flex-start">
          <Select
            label="Enrollment status"
            data={statusOptions}
            value={statusCode}
            allowDeselect={false}
            onChange={(value) => {
              const nextStatusCode = value ?? 'REGISTERED';
              setStatusCode(nextStatusCode);

              if (nextStatusCode === 'WAITLISTED') {
                setCapacityOverride(false);
              }
            }}
          />
          <Select
            label="Grading basis"
            placeholder="Default from section"
            data={gradingBasisOptions}
            value={gradingBasisCode}
            clearable
            onChange={setGradingBasisCode}
          />
          <NumberInput
            label="Credits"
            min={0}
            decimalScale={2}
            value={creditsAttempted}
            onChange={setCreditsAttempted}
          />
        </Group>

        {!willWaitlist && !hardCapacityReached ? (
          <Checkbox
            label={`Allow capacity override (${registeredCount}/${capacity} registered)`}
            checked={capacityOverride}
            onChange={(event) => {
              setCapacityOverride(event.currentTarget.checked);
            }}
          />
        ) : null}

        {capacityOverride ? (
          <Textarea
            label="Override reason"
            placeholder="Reason"
            value={manualAddReason}
            autosize
            minRows={2}
            onChange={(event) => {
              setManualAddReason(event.currentTarget.value);
            }}
          />
        ) : null}

        {error ? (
          <Alert color="red" title="Unable to add student">
            {error}
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={adding}
            disabled={!canSubmit}
            onClick={() => {
              if (!selectedStudent) {
                return;
              }

              onAdd({
                studentId: selectedStudent.studentId,
                statusCode,
                gradingBasisCode,
                creditsAttempted:
                  typeof creditsAttempted === 'number'
                    ? creditsAttempted
                    : Number(creditsAttempted) || null,
                capacityOverride,
                manualAddReason: manualAddReason.trim() || null,
              });
            }}
          >
            Add student
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
