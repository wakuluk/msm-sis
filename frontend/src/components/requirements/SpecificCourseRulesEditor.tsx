import { Alert, Button, Checkbox, Group, Select, Stack, Table, TextInput, Title } from '@mantine/core';
import type { SpecificCourseDraft } from '@/components/requirements/requirementFormTypes';

export type CourseSelectOption = {
  value: string;
  label: string;
};

export function SpecificCourseRulesEditor({
  courses,
  courseOptions,
  disabled = false,
  loading,
  error,
  titleVariant = 'title',
  allowRequiredEdit = true,
  emptyMessage = 'Add courses to build the specific-course list for this requirement.',
  onAddCourse,
  onCourseChange,
  onRemoveCourse,
  onUpdateCourse,
}: {
  courses: SpecificCourseDraft[];
  courseOptions: CourseSelectOption[];
  disabled?: boolean;
  loading: boolean;
  error: string | null;
  titleVariant?: 'title' | 'badge';
  allowRequiredEdit?: boolean;
  emptyMessage?: string;
  onAddCourse: () => void;
  onCourseChange: (rowId: number, courseId: string | null) => void;
  onRemoveCourse: (rowId: number) => void;
  onUpdateCourse: (rowId: number, patch: Partial<Omit<SpecificCourseDraft, 'id'>>) => void;
}) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        {titleVariant === 'title' ? (
          <Title order={3}>Specific Courses</Title>
        ) : (
          <Title order={4}>Specific Courses</Title>
        )}
        <Button variant="default" onClick={onAddCourse} disabled={disabled}>
          Add Course
        </Button>
      </Group>

      {courses.length === 0 ? (
        <Alert color="gray" title="No courses added">
          {emptyMessage}
        </Alert>
      ) : (
        <Table.ScrollContainer minWidth={980}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course</Table.Th>
                <Table.Th>Selected</Table.Th>
                <Table.Th>Minimum Grade</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {courses.map((course) => (
                <Table.Tr key={course.id}>
                  <Table.Td>
                    <Select
                      searchable
                      clearable
                      placeholder="Select course"
                      data={courseOptions}
                      value={course.courseId ? String(course.courseId) : null}
                      loading={loading}
                      error={error ?? undefined}
                      nothingFoundMessage="No courses found."
                      onChange={(value) => {
                        onCourseChange(course.id, value);
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    {course.courseCode
                      ? `${course.courseCode}${course.courseTitle ? ` - ${course.courseTitle}` : ''}`
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="Optional"
                      value={course.minimumGrade}
                      onChange={(event) => {
                        onUpdateCourse(course.id, {
                          minimumGrade: event.currentTarget.value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={course.required}
                      disabled={disabled || !allowRequiredEdit}
                      onChange={(event) => {
                        onUpdateCourse(course.id, {
                          required: event.currentTarget.checked,
                        });
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => {
                        onRemoveCourse(course.id);
                      }}
                      disabled={disabled}
                    >
                      Remove
                    </Button>
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
