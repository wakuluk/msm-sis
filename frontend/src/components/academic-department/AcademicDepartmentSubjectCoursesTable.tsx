import { Badge, Button, Group, Stack, Table } from '@mantine/core';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import type { CourseResponse } from '@/services/schemas/academic-department-schemas';
import { displayValue } from '@/utils/form-values';
import type { SubjectCoursesState } from './academicDepartmentSubjectCoursesTypes';

type AcademicDepartmentSubjectCoursesTableProps = {
  courseState: SubjectCoursesState;
  onCourseClick: (course: CourseResponse) => void;
  onRetry: () => void;
  subjectCode: string;
};

export function AcademicDepartmentSubjectCoursesTable({
  courseState,
  onCourseClick,
  onRetry,
  subjectCode,
}: AcademicDepartmentSubjectCoursesTableProps) {
  if (courseState.status === 'loading' || courseState.status === 'idle') {
    return (
      <SearchResultsStateNotice
        status="loading"
        idleTitle=""
        idleMessage=""
        loadingMessage={`Loading courses for ${subjectCode}.`}
        emptyTitle=""
        emptyMessage=""
      />
    );
  }

  if (courseState.status === 'error') {
    return (
      <Stack gap="sm">
        <SearchResultsStateNotice
          status="error"
          idleTitle=""
          idleMessage=""
          loadingMessage=""
          errorTitle="Unable to load subject courses"
          errorMessage={courseState.message}
          emptyTitle=""
          emptyMessage=""
        />
        <Group justify="flex-end">
          <Button size="xs" variant="light" onClick={onRetry}>
            Retry
          </Button>
        </Group>
      </Stack>
    );
  }

  if (courseState.courses.length === 0) {
    return (
      <SearchResultsStateNotice
        status="empty"
        idleTitle=""
        idleMessage=""
        loadingMessage=""
        emptyTitle="No courses found"
        emptyMessage="Create courses for this subject before using this section."
      />
    );
  }

  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Course Number</Table.Th>
          <Table.Th>Title</Table.Th>
          <Table.Th>Active</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {courseState.courses.map((course) => (
          <Table.Tr
            key={course.courseId}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onCourseClick(course);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') {
                return;
              }

              event.preventDefault();
              onCourseClick(course);
            }}
            tabIndex={0}
          >
            <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
            <Table.Td>{displayValue(course.currentVersionTitle)}</Table.Td>
            <Table.Td>
              <Badge size="sm" variant="light" color={course.active ? 'green' : 'gray'}>
                {course.active ? 'Active' : 'Inactive'}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
