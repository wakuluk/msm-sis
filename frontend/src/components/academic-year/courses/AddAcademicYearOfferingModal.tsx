// Modal for adding catalog courses into an academic year.
// Loads reference/catalog options, collects selected terms, and submits new year-scoped offerings.
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { createAcademicYearCourseOffering } from '@/services/admin-courses-service';
import { getCoursePickerReferenceOptions } from '@/services/reference-service';
import type { CoursePickerReferenceOptionsResponse } from '@/services/schemas/reference-schemas';
import {
  getErrorMessage,
  normalizeNotes,
  type CourseTermOption,
} from './academicYearCoursesShared';

type CoursePickerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; options: CoursePickerReferenceOptionsResponse };

type CreateOfferingState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type AddOfferingFormValues = {
  schoolId: string | null;
  departmentId: string | null;
  subjectId: string | null;
  courseId: string | null;
  subTermIds: string[];
  notes: string;
};

type AddAcademicYearOfferingModalProps = {
  opened: boolean;
  onClose: () => void;
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  termOptions: ReadonlyArray<CourseTermOption>;
  initialSubTermIds?: ReadonlyArray<string>;
  onCreated: () => void;
};

function buildInitialAddOfferingFormValues(
  initialSubTermIds: ReadonlyArray<string> = []
): AddOfferingFormValues {
  return {
    schoolId: null,
    departmentId: null,
    subjectId: null,
    courseId: null,
    subTermIds: [...initialSubTermIds],
    notes: '',
  };
}

export function AddAcademicYearOfferingModal({
  opened,
  onClose,
  academicYearId,
  hasValidAcademicYearId,
  termOptions,
  initialSubTermIds,
  onCreated,
}: AddAcademicYearOfferingModalProps) {
  const initialSubTermIdsKey = (initialSubTermIds ?? []).join('\u0000');
  const normalizedInitialSubTermIds = useMemo(
    () => (initialSubTermIdsKey ? initialSubTermIdsKey.split('\u0000') : []),
    [initialSubTermIdsKey]
  );
  const [coursePickerState, setCoursePickerState] = useState<CoursePickerState>({ status: 'idle' });
  const [createOfferingState, setCreateOfferingState] = useState<CreateOfferingState>({
    status: 'idle',
  });
  const [formValues, setFormValues] = useState<AddOfferingFormValues>(() =>
    buildInitialAddOfferingFormValues(normalizedInitialSubTermIds)
  );

  useEffect(() => {
    setFormValues(buildInitialAddOfferingFormValues(normalizedInitialSubTermIds));
    setCreateOfferingState({ status: 'idle' });

    if (!opened) {
      return;
    }

    let cancelled = false;
    setCoursePickerState({ status: 'loading' });

    getCoursePickerReferenceOptions()
      .then((options) => {
        if (cancelled) {
          return;
        }

        setCoursePickerState({ status: 'success', options });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setCoursePickerState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course picker options.'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [opened, normalizedInitialSubTermIds]);

  const coursePickerOptions =
    coursePickerState.status === 'success' ? coursePickerState.options : null;
  const schoolOptions = useMemo(
    () =>
      (coursePickerOptions?.schools ?? []).map((school) => ({
        value: String(school.id),
        label: `${school.name} (${school.code})`,
      })),
    [coursePickerOptions]
  );
  const departmentOptions = useMemo(
    () =>
      (coursePickerOptions?.departments ?? [])
        .filter(
          (department) =>
            !formValues.schoolId || String(department.schoolId) === formValues.schoolId
        )
        .map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.code})`,
        })),
    [coursePickerOptions, formValues.schoolId]
  );
  const subjectOptions = useMemo(
    () =>
      (coursePickerOptions?.subjects ?? [])
        .filter(
          (subject) =>
            !formValues.departmentId || String(subject.departmentId) === formValues.departmentId
        )
        .map((subject) => ({
          value: String(subject.id),
          label: `${subject.name} (${subject.code})`,
        })),
    [coursePickerOptions, formValues.departmentId]
  );
  const filteredCourses = useMemo(
    () =>
      (coursePickerOptions?.courses ?? []).filter((course) => {
        if (formValues.schoolId && String(course.schoolId) !== formValues.schoolId) {
          return false;
        }

        if (formValues.departmentId && String(course.departmentId) !== formValues.departmentId) {
          return false;
        }

        if (formValues.subjectId && String(course.subjectId) !== formValues.subjectId) {
          return false;
        }

        return true;
      }),
    [coursePickerOptions, formValues.schoolId, formValues.departmentId, formValues.subjectId]
  );
  const courseOptions = useMemo(
    () =>
      filteredCourses.map((course) => ({
        value: String(course.courseId),
        label: `${course.courseCode} - ${course.currentVersionTitle ?? 'Current version'}`,
      })),
    [filteredCourses]
  );
  const selectedCourse = useMemo(
    () => filteredCourses.find((course) => String(course.courseId) === formValues.courseId) ?? null,
    [filteredCourses, formValues.courseId]
  );

  function handleSchoolChange(value: string | null) {
    setFormValues((current) => ({
      ...current,
      schoolId: value,
      departmentId: null,
      subjectId: null,
      courseId: null,
    }));
  }

  function handleDepartmentChange(value: string | null) {
    setFormValues((current) => ({
      ...current,
      departmentId: value,
      subjectId: null,
      courseId: null,
    }));
  }

  function handleSubjectChange(value: string | null) {
    setFormValues((current) => ({
      ...current,
      subjectId: value,
      courseId: null,
    }));
  }

  function handleCourseChange(value: string | null) {
    setFormValues((current) => ({
      ...current,
      courseId: value,
    }));
  }

  async function handleCreateOffering() {
    if (!hasValidAcademicYearId) {
      setCreateOfferingState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const courseId = Number(formValues.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setCreateOfferingState({
        status: 'error',
        message: 'Select a course before creating the offering.',
      });
      return;
    }

    const subTermIds = formValues.subTermIds
      .map((subTermId) => Number(subTermId))
      .filter((subTermId) => Number.isInteger(subTermId) && subTermId > 0);

    if (subTermIds.length === 0) {
      setCreateOfferingState({
        status: 'error',
        message: 'Select at least one sub term before creating the offering.',
      });
      return;
    }

    setCreateOfferingState({ status: 'saving' });

    try {
      await createAcademicYearCourseOffering({
        academicYearId,
        request: {
          courseId,
          subTermIds,
          notes: normalizeNotes(formValues.notes),
        },
      });

      onClose();
      onCreated();
    } catch (error) {
      setCreateOfferingState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create course offering.'),
      });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Offering"
      size="lg"
      closeOnClickOutside={createOfferingState.status !== 'saving'}
      closeOnEscape={createOfferingState.status !== 'saving'}
    >
      <Stack gap="md">
        <Alert color="blue" title="Add course offering">
          Select a course and the sub terms it should appear in for this academic year.
        </Alert>

        {coursePickerState.status === 'loading' ? (
          <Alert color="blue" title="Loading course picker">
            Fetching eligible courses and filter options.
          </Alert>
        ) : null}

        {coursePickerState.status === 'error' ? (
          <Alert color="red" title="Unable to load course picker">
            {coursePickerState.message}
          </Alert>
        ) : null}

        {createOfferingState.status === 'error' ? (
          <Alert color="red" title="Unable to create offering">
            {createOfferingState.message}
          </Alert>
        ) : null}

        <Select
          label="School"
          placeholder="Select a school"
          data={schoolOptions}
          value={formValues.schoolId}
          onChange={handleSchoolChange}
          clearable
          searchable
          disabled={coursePickerState.status !== 'success'}
        />

        <Select
          label="Department"
          placeholder="Select a department"
          data={departmentOptions}
          value={formValues.departmentId}
          onChange={handleDepartmentChange}
          clearable
          searchable
          disabled={coursePickerState.status !== 'success'}
        />

        <Select
          label="Subject"
          placeholder="Select a subject"
          data={subjectOptions}
          value={formValues.subjectId}
          onChange={handleSubjectChange}
          clearable
          searchable
          disabled={coursePickerState.status !== 'success'}
        />

        <Select
          label="Course"
          placeholder="Select a course"
          data={courseOptions}
          value={formValues.courseId}
          onChange={handleCourseChange}
          clearable
          searchable
          disabled={coursePickerState.status !== 'success'}
          nothingFoundMessage="No eligible courses match the selected filters."
        />

        <MultiSelect
          label="Sub Terms"
          placeholder="Select one or more sub terms"
          data={termOptions}
          value={formValues.subTermIds}
          onChange={(value) => {
            setFormValues((current) => ({
              ...current,
              subTermIds: value,
            }));
          }}
          searchable
          disabled={termOptions.length === 0}
        />

        <Textarea
          label="Notes"
          placeholder="Optional notes for this offering"
          minRows={3}
          value={formValues.notes}
          onChange={(event) => {
            setFormValues((current) => ({
              ...current,
              notes: event.currentTarget.value,
            }));
          }}
        />

        {coursePickerState.status === 'success' &&
        coursePickerState.options.courses.length === 0 ? (
          <Alert color="gray" title="No eligible courses">
            There are no active courses with a current version available to add right now.
          </Alert>
        ) : null}

        {selectedCourse ? (
          <Paper withBorder radius="md" p="md">
            <Stack gap={4}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Selected Course
              </Text>
              <Text fw={600}>{selectedCourse.courseCode}</Text>
              <Text size="sm" c="dimmed">
                {selectedCourse.currentVersionTitle ?? 'Current version title unavailable'}
              </Text>
              <Text size="sm" c="dimmed">
                {selectedCourse.schoolName} · {selectedCourse.departmentName} ·{' '}
                {selectedCourse.subjectName}
              </Text>
            </Stack>
          </Paper>
        ) : null}

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={onClose}
            disabled={createOfferingState.status === 'saving'}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleCreateOffering();
            }}
            loading={createOfferingState.status === 'saving'}
            disabled={
              coursePickerState.status !== 'success' ||
              !formValues.courseId ||
              formValues.subTermIds.length === 0
            }
          >
            Create offering
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
