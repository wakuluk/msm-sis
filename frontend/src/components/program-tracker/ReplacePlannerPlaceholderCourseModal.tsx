import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Table, Text, TextInput } from '@mantine/core';
import { searchCourses } from '@/services/course-service';
import type { CourseSearchResultResponse } from '@/services/schemas/course-schemas';
import type { ProgramTrackerPlannerCourse } from './program-tracker.types';

type CourseSearchState =
  | { status: 'idle'; results: CourseSearchResultResponse[] }
  | { status: 'loading'; results: CourseSearchResultResponse[] }
  | { status: 'error'; message: string; results: CourseSearchResultResponse[] }
  | { status: 'success'; results: CourseSearchResultResponse[] };

type ReplacePlannerPlaceholderCourseModalProps = {
  course: ProgramTrackerPlannerCourse | null;
  onClose: () => void;
  onReplace: (course: CourseSearchResultResponse) => void;
  opened: boolean;
  replacing: boolean;
};

function getCourseCredits(course: CourseSearchResultResponse) {
  return course.minCredits ?? course.maxCredits ?? 0;
}

function getCourseNumberValue(course: CourseSearchResultResponse) {
  const numberText = course.courseNumber ?? course.courseCode ?? '';
  const numericMatch = numberText.match(/\d+/);

  return numericMatch ? Number(numericMatch[0]) : null;
}

function courseMatchesPlaceholder(
  result: CourseSearchResultResponse,
  placeholder: ProgramTrackerPlannerCourse
) {
  if (
    placeholder.placeholderDepartmentId !== undefined &&
    result.departmentId !== placeholder.placeholderDepartmentId
  ) {
    return false;
  }

  if (
    placeholder.placeholderDepartmentCode &&
    result.departmentCode !== placeholder.placeholderDepartmentCode
  ) {
    return false;
  }

  const hasNumberRule =
    placeholder.placeholderMinimumCourseNumber !== undefined ||
    placeholder.placeholderMaximumCourseNumber !== undefined;

  if (!hasNumberRule) {
    return true;
  }

  const courseNumber = getCourseNumberValue(result);

  if (courseNumber === null) {
    return false;
  }

  if (
    placeholder.placeholderMinimumCourseNumber !== undefined &&
    courseNumber < placeholder.placeholderMinimumCourseNumber
  ) {
    return false;
  }

  return !(
    placeholder.placeholderMaximumCourseNumber !== undefined &&
    courseNumber > placeholder.placeholderMaximumCourseNumber
  );
}

function getPlaceholderScopeLabel(course: ProgramTrackerPlannerCourse) {
  const departmentLabel = course.placeholderDepartmentCode ?? 'Any department';
  const minimumCourseNumber = course.placeholderMinimumCourseNumber;
  const maximumCourseNumber = course.placeholderMaximumCourseNumber;

  if (minimumCourseNumber !== undefined && maximumCourseNumber !== undefined) {
    return `${departmentLabel} ${minimumCourseNumber}-${maximumCourseNumber}`;
  }

  if (minimumCourseNumber !== undefined) {
    return `${departmentLabel} ${minimumCourseNumber}+`;
  }

  if (maximumCourseNumber !== undefined) {
    return `${departmentLabel} up to ${maximumCourseNumber}`;
  }

  return departmentLabel;
}

export function ReplacePlannerPlaceholderCourseModal({
  course,
  onClose,
  onReplace,
  opened,
  replacing,
}: ReplacePlannerPlaceholderCourseModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResultResponse | null>(null);
  const [searchState, setSearchState] = useState<CourseSearchState>({
    status: 'idle',
    results: [],
  });

  async function runSearch(nextQuery = query) {
    if (!course) {
      return;
    }

    setSelectedCourse(null);
    setSearchState((current) => ({ status: 'loading', results: current.results }));

    try {
      const response = await searchCourses({
        courseCode: nextQuery,
        departmentId: course.placeholderDepartmentId,
        currentVersionOnly: true,
        includeInactive: false,
        page: 0,
        size: 25,
        sortBy: 'courseNumber',
        sortDirection: 'asc',
      });

      setSearchState({
        status: 'success',
        results: response.results.filter((result) => courseMatchesPlaceholder(result, course)),
      });
    } catch (error) {
      setSearchState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to search courses.',
        results: [],
      });
    }
  }

  useEffect(() => {
    if (!opened) {
      return;
    }

    setQuery('');
    setSelectedCourse(null);
    setSearchState({ status: 'idle', results: [] });
    void runSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, course?.plannerCourseId]);

  return (
    <Modal opened={opened} onClose={onClose} title="Choose planned course" size="xl" centered>
      <Stack gap="md">
        {course ? (
          <Stack gap={2}>
            <Text fw={700}>{course.code}</Text>
            <Text size="sm" c="dimmed">
              {course.programName} · {course.requirement}
            </Text>
            {course.placeholderDepartmentCode ||
            course.placeholderMinimumCourseNumber !== undefined ||
            course.placeholderMaximumCourseNumber !== undefined ? (
              <Text size="sm" c="dimmed">
                Limited to {getPlaceholderScopeLabel(course)}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        <Group align="flex-end">
          <TextInput
            label="Course code"
            placeholder="Search by course code"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void runSearch();
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            onClick={() => {
              void runSearch();
            }}
            loading={searchState.status === 'loading'}
          >
            Search
          </Button>
        </Group>

        {searchState.status === 'error' ? (
          <Alert color="red" title="Unable to search courses">
            {searchState.message}
          </Alert>
        ) : null}

        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Credits</Table.Th>
                <Table.Th>Department</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {searchState.results.map((result) => (
                <Table.Tr
                  key={result.courseId}
                  bg={selectedCourse?.courseId === result.courseId ? 'blue.0' : undefined}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedCourse(result);
                  }}
                >
                  <Table.Td>
                    <Text fw={600}>{result.courseCode}</Text>
                  </Table.Td>
                  <Table.Td>{result.currentVersionTitle ?? '-'}</Table.Td>
                  <Table.Td>{getCourseCredits(result)}</Table.Td>
                  <Table.Td>{result.departmentCode ?? '-'}</Table.Td>
                </Table.Tr>
              ))}
              {searchState.status !== 'loading' && searchState.results.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text size="sm" c="dimmed">
                      No matching courses found for this placeholder.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedCourse}
            loading={replacing}
            onClick={() => {
              if (selectedCourse) {
                onReplace(selectedCourse);
              }
            }}
          >
            Replace placeholder
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
