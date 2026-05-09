import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Container,
  Grid,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getCoreRowModel, useReactTable, type ColumnDef, type Row } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import type { StringOption } from '@/components/search/SearchQueryControls';
import {
  instructorScheduleSearchSizeOptions,
  searchInstructorSchedules,
  type InstructorScheduleSearchSize,
  type InstructorScheduleSearchSortBy,
  type InstructorScheduleSearchSortDirection,
} from '@/services/instructor-schedule-service';
import { getInstructorScheduleReferenceOptions } from '@/services/reference-service';
import type {
  InstructorScheduleReferenceOptionsResponse,
  InstructorScheduleSearchResponse,
  InstructorScheduleSearchResultResponse,
} from '@/services/schemas/instructor-schedule-schemas';
import { getErrorMessage } from '@/utils/errors';

type TeachingScheduleSearchFilters = {
  academicYearId: string;
  courseQuery: string;
  deliveryModeCode: string;
  departmentId: string;
  instructorQuery: string;
  roleCode: string;
  schoolId: string;
  statusCode: string;
  subTermIds: string[];
  termId: string;
};

type TeachingScheduleSearchPageSize = '25' | '50' | '100';
type TeachingScheduleSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: InstructorScheduleSearchResponse }
  | { status: 'success'; response: InstructorScheduleSearchResponse };
type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: InstructorScheduleReferenceOptionsResponse }
  | { status: 'error'; message: string };

const initialFilters: TeachingScheduleSearchFilters = {
  academicYearId: '',
  courseQuery: '',
  deliveryModeCode: '',
  departmentId: '',
  instructorQuery: '',
  roleCode: '',
  schoolId: '',
  statusCode: '',
  subTermIds: [],
  termId: '',
};

const pageSizeOptions = instructorScheduleSearchSizeOptions.map((size) => ({
  value: String(size) as TeachingScheduleSearchPageSize,
  label: String(size),
})) satisfies ReadonlyArray<StringOption<TeachingScheduleSearchPageSize>>;

const sortByOptions = [
  { value: 'instructor', label: 'Instructor' },
  { value: 'academicYear', label: 'Year' },
  { value: 'subTerm', label: 'Subterm' },
  { value: 'course', label: 'Course' },
  { value: 'section', label: 'Section' },
  { value: 'department', label: 'Department' },
  { value: 'deliveryMode', label: 'Delivery' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
] satisfies ReadonlyArray<StringOption<InstructorScheduleSearchSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<InstructorScheduleSearchSortDirection>>;

function mapCodeNameOption(option: { code: string; id: number; name: string }) {
  return {
    value: option.code,
    label: `${option.name} (${option.code})`,
  };
}

function mapIdCodeNameOption(option: { code: string; id: number; name: string }) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function parseOptionalId(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

function parseOptionalIds(values: string[]): number[] {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

const columns: ColumnDef<InstructorScheduleSearchResultResponse>[] = [
  {
    id: 'instructor',
    header: 'Instructor',
    size: 260,
    meta: { sortBy: 'instructor' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.instructorName ?? 'Unassigned'}</Text>
        <Text size="sm" c="dimmed">
          {row.original.instructorEmail ?? '-'}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'section',
    header: 'Section',
    size: 260,
    meta: { sortBy: 'section' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.displaySectionCode ?? '-'}</Text>
        <Text size="sm" c="dimmed">
          {row.original.sectionTitle ?? row.original.courseTitle ?? '-'}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'term',
    header: 'Term',
    size: 230,
    meta: { sortBy: 'academicYear' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={4}>
        <Text fw={700}>{row.original.termName ?? '-'}</Text>
        <GroupBadge label={row.original.academicYearName} />
        <GroupBadge label={row.original.subTermName} />
      </Stack>
    ),
  },
  {
    id: 'department',
    header: 'Department',
    size: 260,
    meta: { sortBy: 'department' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text>{row.original.departmentName ?? '-'}</Text>
        <Text size="sm" c="dimmed">
          {row.original.schoolName ?? '-'}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'deliveryMode',
    header: 'Delivery',
    size: 160,
    meta: { sortBy: 'deliveryMode' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => <GroupBadge label={row.original.deliveryModeName} variant="outline" />,
  },
  {
    id: 'role',
    header: 'Role',
    size: 180,
    meta: { sortBy: 'role' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => <GroupBadge label={row.original.roleName} />,
  },
  {
    id: 'status',
    header: 'Status',
    size: 140,
    meta: { sortBy: 'status' satisfies InstructorScheduleSearchSortBy },
    cell: ({ row }) => <GroupBadge label={row.original.statusName} color="yellow" />,
  },
];

function GroupBadge({
  color,
  label,
  variant = 'light',
}: {
  color?: string;
  label: string | null;
  variant?: 'light' | 'outline';
}) {
  return label ? (
    <Badge color={color} variant={variant}>
      {label}
    </Badge>
  ) : (
    <Text size="sm" c="dimmed">
      -
    </Text>
  );
}

function getResultsStatus(state: TeachingScheduleSearchState): SearchResultsStatus {
  return state.status;
}

function getResultsSummary(state: TeachingScheduleSearchState) {
  if (state.status === 'idle') {
    return 'Search instructor teaching schedules.';
  }

  if (state.status === 'loading') {
    return 'Searching instructor teaching schedules.';
  }

  if (state.status === 'error') {
    return 'Unable to search instructor schedules.';
  }

  if (state.status === 'empty') {
    return 'No instructor schedules matched the current filters.';
  }

  const start = state.response.page.page * state.response.page.size + 1;
  const end = start + state.response.results.length - 1;

  return `Showing ${start}-${end} of ${state.response.page.totalElements} instructor assignments`;
}

export function TeachingScheduleSearchPage() {
  const navigate = useNavigate();
  const form = useForm<TeachingScheduleSearchFilters>({ initialValues: initialFilters });
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [resultsState, setResultsState] = useState<TeachingScheduleSearchState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] =
    useState<TeachingScheduleSearchFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<TeachingScheduleSearchPageSize>('25');
  const [sortBy, setSortBy] = useState<InstructorScheduleSearchSortBy>('instructor');
  const [sortDirection, setSortDirection] =
    useState<InstructorScheduleSearchSortDirection>('asc');

  useEffect(() => {
    let isMounted = true;
    setReferenceOptionsState({ status: 'loading' });

    getInstructorScheduleReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({ status: 'success', response });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load instructor schedule reference options.'),
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

    searchInstructorSchedules({
      academicYearId: parseOptionalId(submittedFilters.academicYearId),
      termId: parseOptionalId(submittedFilters.termId),
      subTermIds: parseOptionalIds(submittedFilters.subTermIds),
      schoolId: parseOptionalId(submittedFilters.schoolId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      instructorSearch: submittedFilters.instructorQuery,
      courseSearch: submittedFilters.courseQuery,
      statusCode: submittedFilters.statusCode,
      roleCode: submittedFilters.roleCode,
      deliveryModeCode: submittedFilters.deliveryModeCode,
      page,
      size: Number(pageSize) as InstructorScheduleSearchSize,
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
          message: getErrorMessage(error, 'Failed to search instructor schedules.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, pageSize, sortBy, sortDirection, submittedFilters]);

  const referenceOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.response : null;
  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const academicYearOptions = referenceOptions?.academicYears.map(mapIdCodeNameOption) ?? [];
  const termOptions = useMemo(() => {
    const selectedAcademicYear = referenceOptions?.academicYears.find(
      (academicYear) => String(academicYear.id) === form.values.academicYearId
    );
    const terms = selectedAcademicYear
      ? selectedAcademicYear.terms
      : referenceOptions?.academicYears.flatMap((academicYear) => academicYear.terms) ?? [];

    return terms.map(mapIdCodeNameOption);
  }, [form.values.academicYearId, referenceOptions]);
  const subTermOptions = useMemo(() => {
    const terms =
      referenceOptions?.academicYears.flatMap((academicYear) => academicYear.terms) ?? [];
    const selectedTerm = terms.find((term) => String(term.id) === form.values.termId);

    if (selectedTerm) {
      return selectedTerm.subTerms.map(mapIdCodeNameOption);
    }

    const selectedAcademicYear = referenceOptions?.academicYears.find(
      (academicYear) => String(academicYear.id) === form.values.academicYearId
    );
    const visibleTerms = selectedAcademicYear ? selectedAcademicYear.terms : terms;

    return visibleTerms
      .flatMap((term) => term.subTerms)
      .map(mapIdCodeNameOption);
  }, [form.values.academicYearId, form.values.termId, referenceOptions]);
  const schoolOptions = referenceOptions?.schools.map(mapIdCodeNameOption) ?? [];
  const departmentOptions = useMemo(() => {
    const departments = referenceOptions?.departments ?? [];

    if (form.values.schoolId.trim() === '') {
      return departments.map(mapIdCodeNameOption);
    }

    return departments
      .filter((department) => String(department.schoolId) === form.values.schoolId)
      .map(mapIdCodeNameOption);
  }, [form.values.schoolId, referenceOptions]);
  const statusOptions = referenceOptions?.sectionStatuses.map(mapCodeNameOption) ?? [];
  const roleOptions = referenceOptions?.instructorAssignmentRoles.map(mapCodeNameOption) ?? [];
  const deliveryModeOptions = referenceOptions?.deliveryModes.map(mapCodeNameOption) ?? [];
  const searchResults =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : [];
  const table = useReactTable({
    columns,
    data: searchResults,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.sectionInstructorId),
  });

  function handleToggleSort(nextSortBy: InstructorScheduleSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      setPage(0);
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
    setResultsState({ status: 'idle' });
    setPage(0);
    setPageSize('25');
    setSortBy('instructor');
    setSortDirection('asc');
  }

  function getRowProps(
    row: Row<InstructorScheduleSearchResultResponse>
  ): SearchResultsTableRowProps | undefined {
    if (row.original.instructorUserId === null) {
      return undefined;
    }

    const detailPath = `/calendar/instructor-schedules/${row.original.instructorUserId}`;

    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => navigate(detailPath),
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(detailPath);
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
                Instructor Schedule Search
              </Text>
              {referenceOptionsError ? (
                <Alert color="red" title="Unable to load schedule filters">
                  {referenceOptionsError}
                </Alert>
              ) : null}

              <SearchFormSection legend="Schedule Filters">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Academic Year"
                    placeholder="All years"
                    data={academicYearOptions}
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('academicYearId')}
                    onChange={(value) => {
                      form.setFieldValue('academicYearId', value ?? '');
                      form.setFieldValue('termId', '');
                      form.setFieldValue('subTermIds', []);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Term"
                    data={termOptions}
                    placeholder="All terms"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('termId')}
                    onChange={(value) => {
                      form.setFieldValue('termId', value ?? '');
                      form.setFieldValue('subTermIds', []);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <MultiSelect
                    label="Subterm"
                    data={subTermOptions}
                    placeholder="All subterms"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('subTermIds')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Instructor"
                    placeholder="Name or email"
                    {...form.getInputProps('instructorQuery')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Course"
                    placeholder="Course code or title"
                    {...form.getInputProps('courseQuery')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="School"
                    data={schoolOptions}
                    placeholder="All schools"
                    clearable
                    disabled={referenceOptionsLoading}
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
                    data={departmentOptions}
                    placeholder="All departments"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('departmentId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Status"
                    data={statusOptions}
                    placeholder="All statuses"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('statusCode')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Instructor Role"
                    data={roleOptions}
                    placeholder="All roles"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('roleCode')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Delivery Mode"
                    data={deliveryModeOptions}
                    placeholder="All delivery modes"
                    clearable
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('deliveryModeCode')}
                  />
                </Grid.Col>
              </SearchFormSection>

              <SearchFormActions
                size={pageSize}
                sortBy={sortBy}
                sortDirection={sortDirection}
                sizeOptions={pageSizeOptions}
                sortByOptions={sortByOptions}
                sortDirectionOptions={sortDirectionOptions}
                submitLabel="Search Schedules"
                isSubmitting={resultsState.status === 'loading'}
                onClear={handleClear}
                onSizeChange={(value) => {
                  if (value) {
                    setPageSize(value as TeachingScheduleSearchPageSize);
                    setPage(0);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as InstructorScheduleSearchSortBy);
                    setPage(0);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as InstructorScheduleSearchSortDirection);
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
            idleTitle: 'Search teaching schedules',
            idleMessage: 'Use the filters above to find an instructor schedule.',
            loadingMessage: 'Searching teaching schedules...',
            errorTitle: 'Unable to search instructor schedules',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No teaching schedules found',
            emptyMessage: 'No schedules matched the current filters.',
          }}
          pagination={
            resultsState.status === 'success' && resultsState.response.page.totalPages > 0
              ? {
                  page: resultsState.response.page.page,
                  totalPages: resultsState.response.page.totalPages,
                  onPageChange: setPage,
                }
              : null
          }
          getRowProps={getRowProps}
          withBorder
        />
      </Stack>
    </Container>
  );
}
