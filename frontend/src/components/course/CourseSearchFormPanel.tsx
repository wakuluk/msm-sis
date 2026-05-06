import {
  Alert,
  Button,
  Checkbox,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type {
  CourseSearchSortBy,
  CourseSearchSortDirection,
} from '@/services/schemas/course-schemas';

type CourseReferenceOption = {
  label: string;
  value: string;
};

type CourseDepartmentOption = CourseReferenceOption & {
  schoolId: number | null;
};

type CourseSubjectOption = CourseReferenceOption & {
  departmentId: number | null;
};

export type CourseSearchFilters = {
  schoolId: string;
  departmentId: string;
  subjectId: string;
  courseNumber: string;
  courseCode: string;
  title: string;
  currentVersionOnly: boolean;
  includeInactive: boolean;
};

type CourseSearchFormPanelProps<TSize extends string> = {
  form: UseFormReturnType<CourseSearchFilters>;
  schoolOptions: ReadonlyArray<CourseReferenceOption>;
  departmentOptions: ReadonlyArray<CourseDepartmentOption>;
  subjectOptions: ReadonlyArray<CourseSubjectOption>;
  visibleDepartmentOptions: ReadonlyArray<CourseDepartmentOption>;
  visibleSubjectOptions: ReadonlyArray<CourseSubjectOption>;
  referenceOptionsLoading: boolean;
  referenceOptionsError: string | null;
  size: TSize;
  sortBy: CourseSearchSortBy;
  sortDirection: CourseSearchSortDirection;
  sizeOptions: ReadonlyArray<StringOption<TSize>>;
  sortByOptions: ReadonlyArray<StringOption<CourseSearchSortBy>>;
  sortDirectionOptions: ReadonlyArray<StringOption<CourseSearchSortDirection>>;
  isSubmitting: boolean;
  onSubmit: (values: CourseSearchFilters) => void;
  onClear: () => void;
  onCreateCourse: () => void;
  onSizeChange: (value: string | null) => void;
  onSortByChange: (value: string | null) => void;
  onSortDirectionChange: (value: string | null) => void;
};

export function CourseSearchFormPanel<TSize extends string>({
  form,
  schoolOptions,
  departmentOptions,
  subjectOptions,
  visibleDepartmentOptions,
  visibleSubjectOptions,
  referenceOptionsLoading,
  referenceOptionsError,
  size,
  sortBy,
  sortDirection,
  sizeOptions,
  sortByOptions,
  sortDirectionOptions,
  isSubmitting,
  onSubmit,
  onClear,
  onCreateCourse,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
}: CourseSearchFormPanelProps<TSize>) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="center" gap="md">
          <Title order={1}>Course Search</Title>
          <Button type="button" onClick={onCreateCourse}>
            Create Course
          </Button>
        </Group>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <SearchFormSection legend="Course Filters">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  clearable
                  searchable
                  label="School"
                  placeholder="All schools"
                  data={schoolOptions}
                  value={form.values.schoolId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('schoolId', value ?? '');

                    if (
                      value &&
                      form.values.departmentId &&
                      !departmentOptions.some(
                        (option) =>
                          option.value === form.values.departmentId &&
                          option.schoolId === Number(value)
                      )
                    ) {
                      form.setFieldValue('departmentId', '');
                      form.setFieldValue('subjectId', '');
                      return;
                    }

                    if (!value) {
                      form.setFieldValue('departmentId', '');
                      form.setFieldValue('subjectId', '');
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  clearable
                  searchable
                  label="Department"
                  placeholder="All departments"
                  data={visibleDepartmentOptions.map(({ label, value }) => ({ label, value }))}
                  value={form.values.departmentId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('departmentId', value ?? '');

                    if (
                      value &&
                      form.values.subjectId &&
                      !subjectOptions.some(
                        (option) =>
                          option.value === form.values.subjectId &&
                          option.departmentId === Number(value)
                      )
                    ) {
                      form.setFieldValue('subjectId', '');
                      return;
                    }

                    if (!value) {
                      form.setFieldValue('subjectId', '');
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  clearable
                  searchable
                  label="Subject"
                  placeholder="All subjects"
                  data={visibleSubjectOptions.map(({ label, value }) => ({ label, value }))}
                  value={form.values.subjectId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('subjectId', value ?? '');
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput label="Course Number" {...form.getInputProps('courseNumber')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput label="Course Code" {...form.getInputProps('courseCode')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput label="Title" {...form.getInputProps('title')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Checkbox
                  label="Current version only"
                  checked={form.values.currentVersionOnly}
                  onChange={(event) => {
                    form.setFieldValue('currentVersionOnly', event.currentTarget.checked);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Checkbox
                  label="Include inactive"
                  checked={form.values.includeInactive}
                  onChange={(event) => {
                    form.setFieldValue('includeInactive', event.currentTarget.checked);
                  }}
                />
              </Grid.Col>
            </SearchFormSection>

            {referenceOptionsError ? (
              <Alert color="red" title="Unable to load course search filters">
                {referenceOptionsError}
              </Alert>
            ) : null}

            <SearchFormActions
              size={size}
              sortBy={sortBy}
              sortDirection={sortDirection}
              sizeOptions={sizeOptions}
              sortByOptions={sortByOptions}
              sortDirectionOptions={sortDirectionOptions}
              onSizeChange={onSizeChange}
              onSortByChange={onSortByChange}
              onSortDirectionChange={onSortDirectionChange}
              clearLabel="Clear"
              submitLabel="Search Courses"
              isSubmitting={isSubmitting}
              onClear={onClear}
            />
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
