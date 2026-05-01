// Main student-enrollment workspace for a selected course section.
// Loads students, selected enrollment detail, enrollment events, and coordinates add/edit mutations.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import {
  addCourseSectionStudent,
  getCourseSectionStudentEnrollment,
  getCourseSectionStudentEnrollmentEvents,
  getCourseSectionStudents,
  patchCourseSectionStudentEnrollment,
} from '@/services/course-service';
import type { CourseSectionStudentResponse } from '@/services/schemas/course-schemas';
import {
  CourseSectionAddStudentModal,
  type AddStudentFormValues,
} from './CourseSectionAddStudentModal';
import { CourseSectionEditEnrollmentModal } from './CourseSectionEditEnrollmentModal';
import { CourseSectionStudentDetailsPanel } from './CourseSectionStudentDetailsPanel';
import { CourseSectionStudentTable } from './CourseSectionStudentTable';
import type {
  EditEnrollmentValues,
  EnrollmentEventListState,
  SelectedEnrollmentDetailState,
  StudentListState,
  StudentMutationState,
  StudentSortBy,
  StudentSortDirection,
} from './courseSectionStudentTypes';
import { compareStudentsByColumn, studentMatchesSearch } from './courseSectionStudentUtils';
import type { CourseSectionPreview, SelectOption } from './courseSectionsWorkspaceTypes';
import { getErrorMessage } from './courseSectionsWorkspaceUtils';

type CourseSectionStudentsPanelProps = {
  selectedSection: CourseSectionPreview;
  gradingBasisOptions: SelectOption[];
  enrollmentStatusOptions?: SelectOption[];
};

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
      : (students.find((student) => student.enrollmentId === selectedEnrollmentId) ?? null);
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
    selectedStudentFromList,
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
          statusCode: values.statusCode,
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

      <CourseSectionStudentTable
        students={filteredStudents}
        loading={studentListState.status === 'loading'}
        selectedEnrollmentId={selectedEnrollmentId}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onToggleSort={handleToggleSort}
        onSelectEnrollment={setSelectedEnrollmentId}
      />

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
        waitlistAllowed={selectedSection.waitlistAllowed}
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
