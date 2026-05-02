import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Button,
  Checkbox,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { searchCourses } from '@/services/course-service';
import { CourseCreateModal } from '@/components/course/CourseCreateModal';
import { useCourseCreateReferenceOptions } from '@/components/course/useCourseCreateReferenceOptions';
import type {
  CourseSearchResponse,
  CourseSearchResultResponse,
  CourseSearchSortBy,
  CourseSearchSortDirection,
} from '@/services/schemas/course-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type CourseSearchFilters = {
  schoolId: string;
  departmentId: string;
  subjectId: string;
  courseNumber: string;
  courseCode: string;
  title: string;
  currentVersionOnly: boolean;
  includeInactive: boolean;
};

type CourseSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: CourseSearchResponse }
  | { status: 'success'; response: CourseSearchResponse };

type CourseSearchSize = '25' | '50' | '100';
type CourseSearchResultsView = 'standard' | 'system';

const initialCourseSearchFilters: CourseSearchFilters = {
  schoolId: '',
  departmentId: '',
  subjectId: '',
  courseNumber: '',
  courseCode: '',
  title: '',
  currentVersionOnly: false,
  includeInactive: false,
};

const emptyCourseSearchResults: CourseSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: CourseSearchResultsView }>;
const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<CourseSearchSize>>;
const sortByOptions = [
  { value: 'schoolName', label: 'School' },
  { value: 'departmentName', label: 'Department' },
  { value: 'subjectCode', label: 'Subject' },
  { value: 'courseNumber', label: 'Course number' },
  { value: 'courseCode', label: 'Course code' },
  { value: 'title', label: 'Title' },
  { value: 'active', label: 'Active' },
] satisfies ReadonlyArray<StringOption<CourseSearchSortBy>>;
const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<CourseSearchSortDirection>>;

const courseSearchColumns: ColumnDef<CourseSearchResultResponse>[] = [
  {
    accessorKey: 'schoolName',
    header: 'School',
    size: 220,
    cell: ({ row }) =>
      row.original.schoolId === null ? (
        '—'
      ) : (
        <Link to={`/academics/schools/${row.original.schoolId}`}>{row.original.schoolName ?? '—'}</Link>
      ),
    meta: { sortBy: 'schoolName' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department',
    size: 220,
    cell: ({ row }) =>
      row.original.departmentId === null ? (
        '—'
      ) : (
        <Link
          to={`/academics/departments/${row.original.departmentId}`}
          state={{
            source: 'search',
            schoolId: row.original.schoolId,
          }}
        >
          {row.original.departmentName ?? '—'}
        </Link>
      ),
    meta: { sortBy: 'departmentName' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'subjectCode',
    header: 'Subject',
    size: 140,
    cell: ({ row }) => row.original.subjectCode ?? '—',
    meta: { sortBy: 'subjectCode' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'courseNumber',
    header: 'Course Number',
    size: 160,
    cell: ({ row }) => row.original.courseNumber ?? '—',
    meta: { sortBy: 'courseNumber' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'courseCode',
    header: 'Course Code',
    size: 180,
    cell: ({ row }) =>
      row.original.courseId ? (
        <Link to={`/academics/courses/${row.original.courseId}`} state={{ source: 'search' }}>
          {row.original.courseCode ?? '—'}
        </Link>
      ) : (
        '—'
      ),
    meta: { sortBy: 'courseCode' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'currentVersionTitle',
    header: 'Title',
    size: 320,
    cell: ({ row }) => row.original.currentVersionTitle ?? '—',
    meta: { sortBy: 'title' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 100,
    cell: ({ row }) => (row.original.active ? 'Yes' : 'No'),
    meta: { sortBy: 'active' satisfies CourseSearchSortBy },
  },
];

function getResultsSummary(state: CourseSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading course search results...';
  }

  if (state.status === 'error') {
    return 'Course search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No courses matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} courses`;
  }

  return 'Course search is ready.';
}

export function CourseSearchPage() {
  const navigate = useNavigate();
  const form = useForm<CourseSearchFilters>({
    initialValues: initialCourseSearchFilters,
  });
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [resultsState, setResultsState] = useState<CourseSearchResultsState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] = useState<CourseSearchFilters>(
    initialCourseSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<CourseSearchSortBy>('courseNumber');
  const [sortDirection, setSortDirection] = useState<CourseSearchSortDirection>('asc');
  const [size, setSize] = useState<CourseSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<CourseSearchResultsView>('standard');
  const courseCreateReferenceOptions = useCourseCreateReferenceOptions();
  const {
    schoolOptions,
    departmentOptions,
    subjectOptions,
    referenceOptionsError,
    referenceOptionsLoading,
  } = courseCreateReferenceOptions;

  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyCourseSearchResults;

  const courseSearchTable = useReactTable({
    columns: courseSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseId),
    state: {
      columnVisibility: {
        active: resultsView === 'system',
      },
    },
  });

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchCourses({
      schoolId: parseOptionalId(submittedFilters.schoolId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      subjectId: parseOptionalId(submittedFilters.subjectId),
      courseNumber: submittedFilters.courseNumber,
      courseCode: submittedFilters.courseCode,
      title: submittedFilters.title,
      currentVersionOnly: submittedFilters.currentVersionOnly,
      includeInactive: submittedFilters.includeInactive,
      page,
      size: Number(size),
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState(
          response.results.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search courses.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, sortBy, sortDirection, submittedFilters]);

  function handleToggleSort(nextSortBy: CourseSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialCourseSearchFilters);
    setHasSearched(false);
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  const visibleDepartmentOptions =
    form.values.schoolId.trim() === ''
      ? departmentOptions
      : departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId));
  const visibleSubjectOptions =
    form.values.departmentId.trim() === ''
      ? subjectOptions
      : subjectOptions.filter((option) => option.departmentId === Number(form.values.departmentId));

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md">
              <Title order={1}>Course Search</Title>
              <Button
                type="button"
                onClick={() => {
                  setIsCreateCourseModalOpen(true);
                }}
              >
                Create Course
              </Button>
            </Group>
            <form
              onSubmit={form.onSubmit((values) => {
                setSubmittedFilters({ ...values });
                setHasSearched(true);
                setPage(0);
              })}
            >
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
                  onSizeChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSize(value as CourseSearchSize);
                    setPage(0);
                  }}
                  onSortByChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSortBy(value as CourseSearchSortBy);
                    setPage(0);
                  }}
                  onSortDirectionChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSortDirection(value as CourseSearchSortDirection);
                    setPage(0);
                  }}
                  clearLabel="Clear"
                  submitLabel="Search Courses"
                  isSubmitting={resultsState.status === 'loading'}
                  onClear={handleClear}
                />
              </Stack>
            </form>
          </Stack>
        </Paper>

        <SearchResultsPanel
          status={resultsState.status}
          summary={getResultsSummary(resultsState)}
          table={courseSearchTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          viewOptions={resultsViewOptions}
          view={resultsView}
          onViewChange={setResultsView}
          withBorder
          notice={{
            idleTitle: 'Course search is ready',
            idleMessage:
              'Search for courses using school, department, subject, course number, course code, or title.',
            loadingMessage: 'Loading course search results...',
            errorTitle: 'Unable to load course search results',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No course search results found',
            emptyMessage: 'Try adjusting the current search filters.',
          }}
          pagination={
            resultsState.status === 'success'
              ? {
                  page: resultsState.response.page,
                  totalPages: Math.max(resultsState.response.totalPages, 1),
                  onPageChange: setPage,
                }
              : null
          }
        />
        <CourseCreateModal
          {...courseCreateReferenceOptions}
          opened={isCreateCourseModalOpen}
          onClose={() => {
            setIsCreateCourseModalOpen(false);
          }}
          onCreated={(courseVersion) => {
            if (courseVersion.courseId !== null) {
              navigate(`/academics/courses/${courseVersion.courseId}`);
            }
          }}
        />
      </Stack>
    </Container>
  );
}
