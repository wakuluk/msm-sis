import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { searchCourses } from '@/services/course-service';
import type { CourseSearchResultResponse } from '@/services/schemas/course-search-schemas';
import type {
  CourseVersionRequisiteConditionType,
  CourseVersionRequisiteType,
} from '@/services/schemas/course-schemas';
import { getErrorMessage } from '@/utils/errors';
import type { CourseRequisiteGroupDraft } from './courseRequisiteDrafts';

type CourseRequisiteGroupEditorProps = {
  departmentOptions: ReadonlyArray<{ value: string; label: string }>;
  disabled: boolean;
  error: string | null;
  group: CourseRequisiteGroupDraft;
  groupIndex: number;
  labOnly: boolean;
  onAddCourse: (groupId: number) => void;
  onChangeCourse: (
    groupId: number,
    courseDraftId: number,
    course: CourseSearchResultResponse | null
  ) => void;
  onChangeDepartment: (
    groupId: number,
    courseDraftId: number,
    departmentId: string | null
  ) => void;
  onRemoveCourse: (groupId: number, courseDraftId: number) => void;
  onRemoveGroup: (groupId: number) => void;
  onToggleLabOnly: (groupId: number, checked: boolean) => void;
  onUpdateGroup: (
    groupId: number,
    patch: Partial<Omit<CourseRequisiteGroupDraft, 'id' | 'courses'>>
  ) => void;
};

const requisiteTypeOptions: Array<{ value: CourseVersionRequisiteType; label: string }> = [
  { value: 'PREREQUISITE', label: 'Prerequisite' },
  { value: 'COREQUISITE', label: 'Corequisite' },
];

const conditionTypeOptions: Array<{
  value: CourseVersionRequisiteConditionType;
  label: string;
}> = [
  { value: 'ALL', label: 'All courses' },
  { value: 'ANY', label: 'Choose from list' },
];

export function CourseRequisiteGroupEditor({
  departmentOptions,
  disabled,
  error,
  group,
  groupIndex,
  labOnly,
  onAddCourse,
  onChangeCourse,
  onChangeDepartment,
  onRemoveCourse,
  onRemoveGroup,
  onToggleLabOnly,
  onUpdateGroup,
}: CourseRequisiteGroupEditorProps) {
  const locked = disabled || group.id < 0;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Group align="flex-end" gap="sm">
          <Select
            label="Type"
            data={requisiteTypeOptions}
            value={group.requisiteType}
            disabled={locked}
            onChange={(value) => {
              onUpdateGroup(group.id, {
                requisiteType: (value ?? 'PREREQUISITE') as CourseVersionRequisiteType,
              });
            }}
          />
          <Select
            label="Condition"
            data={conditionTypeOptions}
            value={group.conditionType}
            disabled={locked}
            onChange={(value) => {
              const conditionType = (value ?? 'ALL') as CourseVersionRequisiteConditionType;

              onUpdateGroup(group.id, {
                conditionType,
                minimumRequired: conditionType === 'ANY' ? group.minimumRequired : '',
              });
            }}
          />
          {group.conditionType === 'ANY' ? (
            <NumberInput
              label="Minimum required"
              min={1}
              max={Math.max(group.courses.length, 1)}
              value={group.minimumRequired}
              disabled={disabled}
              onChange={(value) => {
                onUpdateGroup(group.id, { minimumRequired: value });
              }}
            />
          ) : null}
        </Group>
        <Group gap="xs">
          {group.requisiteType === 'COREQUISITE' ? (
            <Checkbox
              label="Lab courses only"
              checked={labOnly}
              disabled={locked}
              onChange={(event) => {
                onToggleLabOnly(group.id, event.currentTarget.checked);
              }}
            />
          ) : null}
          <Button
            size="xs"
            variant="light"
            disabled={locked}
            onClick={() => onAddCourse(group.id)}
          >
            Add course
          </Button>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={`Remove requisite group ${groupIndex + 1}`}
            disabled={locked}
            onClick={() => onRemoveGroup(group.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {group.courses.length === 0 ? (
        <Alert color="gray" title="No courses selected">
          Add at least one course to this requisite group.
        </Alert>
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Department</Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Selected</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {group.courses.map((course) => (
                <Table.Tr key={course.id}>
                  <Table.Td>
                    {course.pendingAssociatedLab ? (
                      <Text size="sm" c="dimmed">
                        Pending lab
                      </Text>
                    ) : (
                      <Select
                        searchable
                        clearable
                        placeholder="All departments"
                        data={departmentOptions}
                        value={course.departmentId ? String(course.departmentId) : null}
                        disabled={disabled}
                        onChange={(value) => onChangeDepartment(group.id, course.id, value)}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {course.pendingAssociatedLab ? (
                      <Text size="sm">{course.courseCode}</Text>
                    ) : (
                      <RequisiteCourseAutocomplete
                        courseCode={course.courseCode}
                        courseId={course.courseId}
                        departmentId={course.departmentId}
                        disabled={disabled}
                        error={error}
                        labOnly={group.requisiteType === 'COREQUISITE' && labOnly}
                        placeholder="Select course"
                        onChange={(value) => onChangeCourse(group.id, course.id, value)}
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm">{course.courseCode || '-'}</Text>
                      {course.courseTitle ? (
                        <Text size="xs" c="dimmed">
                          {course.courseTitle}
                        </Text>
                      ) : null}
                      {course.lab ? (
                        <Badge size="xs" variant="light" color="indigo">
                          Lab
                        </Badge>
                      ) : null}
                      {course.pendingAssociatedLab ? (
                        <Badge size="xs" variant="light" color="indigo">
                          Pending lab
                        </Badge>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remove course"
                      disabled={disabled || course.pendingAssociatedLab}
                      onClick={() => onRemoveCourse(group.id, course.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}

function RequisiteCourseAutocomplete({
  courseCode,
  courseId,
  departmentId,
  disabled,
  error,
  labOnly,
  onChange,
  placeholder,
}: {
  courseCode: string;
  courseId: number | string;
  departmentId: number | string;
  disabled: boolean;
  error: string | null;
  labOnly: boolean;
  onChange: (course: CourseSearchResultResponse | null) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState(courseCode);
  const [debouncedInputValue] = useDebouncedValue(inputValue, 250);
  const [searchState, setSearchState] = useState<
    | { status: 'idle'; results: CourseSearchResultResponse[] }
    | { status: 'loading'; results: CourseSearchResultResponse[] }
    | { status: 'success'; results: CourseSearchResultResponse[] }
    | { status: 'error'; message: string; results: CourseSearchResultResponse[] }
  >({ status: 'idle', results: [] });

  useEffect(() => {
    if (courseId || courseCode) {
      setInputValue(courseCode);
    }
  }, [courseCode, courseId]);

  useEffect(() => {
    const query = debouncedInputValue.trim();
    if (disabled || query.length < 2) {
      setSearchState({ status: 'idle', results: [] });
      return;
    }

    const controller = new AbortController();
    setSearchState((current) => ({ status: 'loading', results: current.results }));

    searchCourses({
      courseCode: query,
      currentVersionOnly: true,
      departmentId: departmentId ? Number(departmentId) : undefined,
      includeInactive: false,
      page: 0,
      size: 20,
      sortBy: 'courseCode',
      sortDirection: 'asc',
      signal: controller.signal,
    })
      .then((response) => {
        const results = labOnly
          ? response.results.filter((course) => course.lab)
          : response.results;

        setSearchState({ status: 'success', results });
      })
      .catch((searchError) => {
        if (!controller.signal.aborted) {
          setSearchState({
            status: 'error',
            message: getErrorMessage(searchError, 'Failed to search courses.'),
            results: [],
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedInputValue, departmentId, disabled, labOnly]);

  const autocompleteOptions = searchState.results.map((course) => ({
    value: String(course.courseId),
    label: formatRequisiteCourseOptionLabel(course),
  }));

  return (
    <Autocomplete
      clearable
      data={autocompleteOptions}
      disabled={disabled}
      error={(searchState.status === 'error' ? searchState.message : error) ?? undefined}
      limit={20}
      loading={searchState.status === 'loading'}
      placeholder={placeholder}
      value={inputValue}
      onChange={(value) => {
        setInputValue(value);

        if (!value) {
          onChange(null);
        }
      }}
      onClear={() => {
        setInputValue('');
        onChange(null);
      }}
      onOptionSubmit={(value) => {
        const selectedCourse = searchState.results.find(
          (course) => String(course.courseId) === value
        );

        if (!selectedCourse) {
          return;
        }

        setInputValue(selectedCourse.courseCode ?? '');
        onChange(selectedCourse);
      }}
    />
  );
}

function formatRequisiteCourseOptionLabel(course: CourseSearchResultResponse) {
  const courseCode = course.courseCode ?? 'Course';
  const departmentLabel = course.departmentCode ? ` · ${course.departmentCode}` : '';
  const labLabel = course.lab ? ' · Lab' : '';
  return `${courseCode}${departmentLabel}${labLabel}`;
}
