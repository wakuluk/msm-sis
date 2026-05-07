import { useEffect, useState } from 'react';
import { Badge, Container, Grid, Group, Paper, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { getCoreRowModel, useReactTable, type ColumnDef, type Row } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { displayDate, displayValue } from '@/components/academic-year/academicYearDisplay';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import type { StringOption } from '@/components/search/SearchQueryControls';
import {
  getProgramReferenceOptions,
  getStudentReferenceOptions,
  mapCodeNameReferenceOptionsToSelectOptions,
  mapReferenceOptionsToSelectOptions,
} from '@/services/reference-service';
import { searchMyDepartmentMajorStudents } from '@/services/student-program-service';
import type {
  StudentProgramAssignmentSearchResponse,
  StudentProgramAssignmentSearchResultResponse,
} from '@/services/schemas/student-program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type DepartmentMajorStudentsState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: StudentProgramAssignmentSearchResponse };

type ReferenceOptionsState =
  | { status: 'loading' }
  | {
      status: 'success';
      classStandingOptions: Array<{ label: string; value: string }>;
      degreeTypeOptions: Array<{ label: string; value: string }>;
    }
  | { status: 'error'; message: string };

type DepartmentMajorStudentFilters = {
  classStandingId: string;
  degreeTypeId: string;
  programQuery: string;
  status: string;
  studentQuery: string;
};

type DepartmentMajorStudentSortBy =
  | 'student'
  | 'program'
  | 'department'
  | 'classStanding'
  | 'declaredDate'
  | 'status';
type DepartmentMajorStudentSortDirection = 'asc' | 'desc';
type DepartmentMajorStudentPageSize = '25' | '50' | '100';

const initialFilters: DepartmentMajorStudentFilters = {
  classStandingId: '',
  degreeTypeId: '',
  programQuery: '',
  status: 'ACTIVE',
  studentQuery: '',
};

const emptyResults: StudentProgramAssignmentSearchResultResponse[] = [];

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<DepartmentMajorStudentPageSize>>;

const sortByOptions = [
  { value: 'student', label: 'Student' },
  { value: 'program', label: 'Program' },
  { value: 'department', label: 'Department' },
  { value: 'classStanding', label: 'Class' },
  { value: 'declaredDate', label: 'Declared' },
  { value: 'status', label: 'Status' },
] satisfies ReadonlyArray<StringOption<DepartmentMajorStudentSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<DepartmentMajorStudentSortDirection>>;

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ALL', label: 'All statuses' },
];

const columns: ColumnDef<StudentProgramAssignmentSearchResultResponse>[] = [
  {
    id: 'student',
    header: 'Student',
    size: 280,
    meta: { sortBy: 'student' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{displayStudentName(row.original)}</Text>
        <Text size="sm" c="dimmed">
          {displayValue(row.original.studentEmail)}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'program',
    header: 'Major',
    size: 260,
    meta: { sortBy: 'program' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => (
      <Stack gap={4}>
        <Text fw={700}>{displayValue(row.original.programName)}</Text>
        <Group gap="xs">
          <Badge variant="light">{displayValue(row.original.programCode)}</Badge>
          {row.original.degreeTypeName ? (
            <Badge variant="outline">{row.original.degreeTypeName}</Badge>
          ) : null}
        </Group>
      </Stack>
    ),
  },
  {
    id: 'department',
    header: 'Department',
    size: 260,
    meta: { sortBy: 'department' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text>{displayDepartment(row.original)}</Text>
        <Text size="sm" c="dimmed">
          {displayValue(row.original.schoolName)}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'classStanding',
    header: 'Class',
    size: 180,
    meta: { sortBy: 'classStanding' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text>{displayValue(row.original.classStandingName)}</Text>
        <Text size="sm" c="dimmed">
          Grad {displayDate(row.original.estimatedGradDate)}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'declaredDate',
    header: 'Declared',
    size: 160,
    meta: { sortBy: 'declaredDate' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => displayDate(row.original.declaredDate),
  },
  {
    id: 'status',
    header: 'Status',
    size: 140,
    meta: { sortBy: 'status' satisfies DepartmentMajorStudentSortBy },
    cell: ({ row }) => (
      <Badge color={row.original.status === 'COMPLETED' ? 'green' : 'blue'} variant="light">
        {displayValue(row.original.status)}
      </Badge>
    ),
  },
];

function displayStudentName(studentProgram: StudentProgramAssignmentSearchResultResponse) {
  const firstName = studentProgram.studentPreferredName ?? studentProgram.studentFirstName;
  const fullName = [firstName, studentProgram.studentLastName].filter(Boolean).join(' ');

  return fullName || 'Unknown student';
}

function displayDepartment(studentProgram: StudentProgramAssignmentSearchResultResponse) {
  if (studentProgram.departmentName && studentProgram.departmentCode) {
    return `${studentProgram.departmentName} (${studentProgram.departmentCode})`;
  }

  return displayValue(studentProgram.departmentName ?? studentProgram.departmentCode);
}

function getResultsStatus(state: DepartmentMajorStudentsState): SearchResultsStatus {
  if (state.status === 'success') {
    return state.response.results.length === 0 ? 'empty' : 'success';
  }

  return state.status;
}

function getResultsSummary(state: DepartmentMajorStudentsState) {
  if (state.status === 'idle') {
    return 'Search students attached to majors in your department.';
  }

  if (state.status === 'loading') {
    return 'Loading major students...';
  }

  if (state.status === 'error') {
    return 'Major student search failed.';
  }

  if (state.status !== 'success') {
    return 'Search students attached to majors in your department.';
  }

  if (state.response.page.totalElements === 0 || state.response.results.length === 0) {
    return 'No students matched the current search criteria.';
  }

  const start = state.response.page.page * state.response.page.size + 1;
  const end = state.response.page.page * state.response.page.size + state.response.results.length;

  return `Showing ${start}-${end} of ${state.response.page.totalElements} students`;
}

export function DepartmentMajorStudentsPage() {
  const navigate = useNavigate();
  const form = useForm<DepartmentMajorStudentFilters>({
    initialValues: initialFilters,
  });
  const [referenceState, setReferenceState] = useState<ReferenceOptionsState>({
    status: 'loading',
  });
  const [resultsState, setResultsState] = useState<DepartmentMajorStudentsState>({
    status: 'idle',
  });
  const [submittedFilters, setSubmittedFilters] =
    useState<DepartmentMajorStudentFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<DepartmentMajorStudentPageSize>('25');
  const [sortBy, setSortBy] = useState<DepartmentMajorStudentSortBy>('student');
  const [sortDirection, setSortDirection] = useState<DepartmentMajorStudentSortDirection>('asc');

  useEffect(() => {
    let isMounted = true;
    setReferenceState({ status: 'loading' });

    Promise.all([getProgramReferenceOptions(), getStudentReferenceOptions()])
      .then(([programOptions, studentOptions]) => {
        if (!isMounted) {
          return;
        }

        setReferenceState({
          status: 'success',
          classStandingOptions: mapReferenceOptionsToSelectOptions(studentOptions.classStandings),
          degreeTypeOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.degreeTypes),
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load major student filters.'),
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchMyDepartmentMajorStudents({
      classStandingId: parseOptionalId(submittedFilters.classStandingId),
      degreeTypeId: parseOptionalId(submittedFilters.degreeTypeId),
      page,
      programQuery: submittedFilters.programQuery,
      size: Number(pageSize),
      sortBy,
      sortDirection,
      status: submittedFilters.status,
      studentQuery: submittedFilters.studentQuery,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search department major students.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, pageSize, sortBy, sortDirection, submittedFilters]);

  const results = resultsState.status === 'success' ? resultsState.response.results : emptyResults;
  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.studentProgramId),
  });
  const referenceOptionsError =
    referenceState.status === 'error' ? referenceState.message : null;
  const classStandingOptions =
    referenceState.status === 'success' ? referenceState.classStandingOptions : [];
  const degreeTypeOptions =
    referenceState.status === 'success' ? referenceState.degreeTypeOptions : [];
  const pagination =
    resultsState.status === 'success'
      ? {
          page: resultsState.response.page.page,
          totalPages: resultsState.response.page.totalPages,
          onPageChange: setPage,
        }
      : null;

  function handleToggleSort(nextSortBy: DepartmentMajorStudentSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
    setPage(0);
  }

  function handleClear() {
    form.setValues(initialFilters);
    setSubmittedFilters(initialFilters);
    setHasSearched(false);
    setPage(0);
    setSortBy('student');
    setSortDirection('asc');
    setPageSize('25');
    setResultsState({ status: 'idle' });
  }

  function getResultRowProps(
    row: Row<StudentProgramAssignmentSearchResultResponse>
  ): SearchResultsTableRowProps | undefined {
    const studentProgramId = row.original.studentProgramId;
    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => {
        navigate(`/academics/student-programs/${studentProgramId}/review`);
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/academics/student-programs/${studentProgramId}/review`);
        }
      },
    };
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <form
            onSubmit={form.onSubmit((values) => {
              setSubmittedFilters({ ...values });
              setHasSearched(true);
              setPage(0);
            })}
          >
            <Stack gap="lg">
              <Text fw={700} fz="xl">
                Department Major Students
              </Text>

              <SearchFormSection legend="Major Student Filters">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput label="Student" placeholder="Name or email" {...form.getInputProps('studentQuery')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput label="Program" placeholder="Program name or code" {...form.getInputProps('programQuery')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Status"
                    data={statusOptions}
                    allowDeselect={false}
                    {...form.getInputProps('status')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Degree type"
                    placeholder="All degrees"
                    data={degreeTypeOptions}
                    disabled={referenceState.status === 'loading'}
                    clearable
                    {...form.getInputProps('degreeTypeId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Class"
                    placeholder="All classes"
                    data={classStandingOptions}
                    disabled={referenceState.status === 'loading'}
                    clearable
                    {...form.getInputProps('classStandingId')}
                  />
                </Grid.Col>
              </SearchFormSection>

              {referenceOptionsError ? (
                <Text c="red" size="sm">
                  {referenceOptionsError}
                </Text>
              ) : null}

              <SearchFormActions
                size={pageSize}
                sortBy={sortBy}
                sortDirection={sortDirection}
                sizeOptions={pageSizeOptions}
                sortByOptions={sortByOptions}
                sortDirectionOptions={sortDirectionOptions}
                isSubmitting={resultsState.status === 'loading'}
                submitLabel="Search Students"
                onClear={handleClear}
                onSizeChange={(value) => {
                  if (value) {
                    setPageSize(value as DepartmentMajorStudentPageSize);
                    setPage(0);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as DepartmentMajorStudentSortBy);
                    setPage(0);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as DepartmentMajorStudentSortDirection);
                    setPage(0);
                  }
                }}
              />
            </Stack>
          </form>
        </Paper>

        <SearchResultsPanel
          status={getResultsStatus(resultsState)}
          summary={getResultsSummary(resultsState)}
          table={table}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          notice={{
            idleTitle: 'Search major students',
            idleMessage: 'Use the filters above to find students attached to majors in your department.',
            loadingMessage: 'Searching major students...',
            errorTitle: 'Unable to search major students',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No major students found',
            emptyMessage: 'No students matched the current filters.',
          }}
          pagination={pagination}
          getRowProps={getResultRowProps}
          withBorder
        />
      </Stack>
    </Container>
  );
}
