import { useEffect, useMemo, useState } from 'react';
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
import { searchStudentProgramAssignments } from '@/services/student-program-service';
import type {
  StudentProgramAssignmentSearchResponse,
  StudentProgramAssignmentSearchResultResponse,
} from '@/services/schemas/student-program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type AdminStudentProgramsState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: StudentProgramAssignmentSearchResponse };

type ReferenceOptionsState =
  | { status: 'loading' }
  | {
      status: 'success';
      classStandingOptions: Array<{ label: string; value: string }>;
      departmentOptions: Array<{ label: string; schoolId: number; value: string }>;
      degreeTypeOptions: Array<{ label: string; value: string }>;
      programTypeOptions: Array<{ label: string; value: string }>;
      schoolOptions: Array<{ label: string; value: string }>;
    }
  | { status: 'error'; message: string };

type AdminStudentProgramFilters = {
  classStandingId: string;
  departmentId: string;
  degreeTypeId: string;
  programQuery: string;
  programTypeId: string;
  schoolId: string;
  status: string;
  studentQuery: string;
};

type AdminStudentProgramSortBy =
  | 'student'
  | 'program'
  | 'department'
  | 'classStanding'
  | 'declaredDate'
  | 'status';
type AdminStudentProgramSortDirection = 'asc' | 'desc';
type AdminStudentProgramPageSize = '25' | '50' | '100';

const initialFilters: AdminStudentProgramFilters = {
  classStandingId: '',
  departmentId: '',
  degreeTypeId: '',
  programQuery: '',
  programTypeId: '',
  schoolId: '',
  status: 'ACTIVE',
  studentQuery: '',
};

const emptyResults: StudentProgramAssignmentSearchResultResponse[] = [];

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<AdminStudentProgramPageSize>>;

const sortByOptions = [
  { value: 'student', label: 'Student' },
  { value: 'program', label: 'Program' },
  { value: 'department', label: 'Department' },
  { value: 'classStanding', label: 'Class' },
  { value: 'declaredDate', label: 'Declared' },
  { value: 'status', label: 'Status' },
] satisfies ReadonlyArray<StringOption<AdminStudentProgramSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<AdminStudentProgramSortDirection>>;

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
    meta: { sortBy: 'student' satisfies AdminStudentProgramSortBy },
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
    header: 'Program',
    size: 260,
    meta: { sortBy: 'program' satisfies AdminStudentProgramSortBy },
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
    meta: { sortBy: 'department' satisfies AdminStudentProgramSortBy },
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
    meta: { sortBy: 'classStanding' satisfies AdminStudentProgramSortBy },
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
    meta: { sortBy: 'declaredDate' satisfies AdminStudentProgramSortBy },
    cell: ({ row }) => displayDate(row.original.declaredDate),
  },
  {
    id: 'status',
    header: 'Status',
    size: 140,
    meta: { sortBy: 'status' satisfies AdminStudentProgramSortBy },
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

function getResultsStatus(state: AdminStudentProgramsState): SearchResultsStatus {
  if (state.status === 'success') {
    return state.response.results.length === 0 ? 'empty' : 'success';
  }

  return state.status;
}

function getResultsSummary(state: AdminStudentProgramsState) {
  if (state.status === 'idle') {
    return 'Search students attached to programs.';
  }

  if (state.status === 'loading') {
    return 'Loading student programs...';
  }

  if (state.status === 'error') {
    return 'Student program search failed.';
  }

  if (state.status !== 'success') {
    return 'Search students attached to programs.';
  }

  if (state.response.page.totalElements === 0 || state.response.results.length === 0) {
    return 'No students matched the current search criteria.';
  }

  const start = state.response.page.page * state.response.page.size + 1;
  const end = state.response.page.page * state.response.page.size + state.response.results.length;

  return `Showing ${start}-${end} of ${state.response.page.totalElements} students`;
}

export function AdminStudentProgramsPage() {
  const navigate = useNavigate();
  const form = useForm<AdminStudentProgramFilters>({
    initialValues: initialFilters,
  });
  const [referenceState, setReferenceState] = useState<ReferenceOptionsState>({
    status: 'loading',
  });
  const [resultsState, setResultsState] = useState<AdminStudentProgramsState>({
    status: 'idle',
  });
  const [submittedFilters, setSubmittedFilters] =
    useState<AdminStudentProgramFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminStudentProgramPageSize>('25');
  const [sortBy, setSortBy] = useState<AdminStudentProgramSortBy>('student');
  const [sortDirection, setSortDirection] = useState<AdminStudentProgramSortDirection>('asc');

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
          departmentOptions: programOptions.departments.map((department) => ({
            value: String(department.id),
            label: `${department.name} (${department.code})`,
            schoolId: department.schoolId,
          })),
          degreeTypeOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.degreeTypes),
          programTypeOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.programTypes),
          schoolOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.schools),
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load student program filters.'),
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

    searchStudentProgramAssignments({
      classStandingId: parseOptionalId(submittedFilters.classStandingId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      degreeTypeId: parseOptionalId(submittedFilters.degreeTypeId),
      page,
      programQuery: submittedFilters.programQuery,
      programTypeId: parseOptionalId(submittedFilters.programTypeId),
      schoolId: parseOptionalId(submittedFilters.schoolId),
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
          message: getErrorMessage(error, 'Failed to search student programs.'),
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
  const departmentOptions = useMemo(() => {
    if (referenceState.status !== 'success') {
      return [];
    }

    const schoolId = parseOptionalId(form.values.schoolId);

    return referenceState.departmentOptions
      .filter((department) => schoolId === null || department.schoolId === schoolId)
      .map(({ label, value }) => ({ label, value }));
  }, [form.values.schoolId, referenceState]);
  const degreeTypeOptions =
    referenceState.status === 'success' ? referenceState.degreeTypeOptions : [];
  const programTypeOptions =
    referenceState.status === 'success' ? referenceState.programTypeOptions : [];
  const schoolOptions = referenceState.status === 'success' ? referenceState.schoolOptions : [];
  const pagination =
    resultsState.status === 'success'
      ? {
          page: resultsState.response.page.page,
          totalPages: resultsState.response.page.totalPages,
          onPageChange: setPage,
        }
      : null;

  function handleToggleSort(nextSortBy: AdminStudentProgramSortBy) {
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
                Student Program Assignments
              </Text>

              <SearchFormSection legend="Student Program Filters">
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
                    label="Program type"
                    placeholder="All types"
                    data={programTypeOptions}
                    disabled={referenceState.status === 'loading'}
                    clearable
                    {...form.getInputProps('programTypeId')}
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
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="School"
                    placeholder="All schools"
                    data={schoolOptions}
                    disabled={referenceState.status === 'loading'}
                    clearable
                    {...form.getInputProps('schoolId')}
                    onChange={(value) => {
                      form.setFieldValue('schoolId', value ?? '');
                      form.setFieldValue('departmentId', '');
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Department"
                    placeholder="All departments"
                    data={departmentOptions}
                    disabled={referenceState.status === 'loading'}
                    clearable
                    {...form.getInputProps('departmentId')}
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
                    setPageSize(value as AdminStudentProgramPageSize);
                    setPage(0);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as AdminStudentProgramSortBy);
                    setPage(0);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as AdminStudentProgramSortDirection);
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
            idleTitle: 'Search student programs',
            idleMessage: 'Use the filters above to find students attached to programs.',
            loadingMessage: 'Searching student programs...',
            errorTitle: 'Unable to search student programs',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No student programs found',
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
