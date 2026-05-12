import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChecklist, IconUserSearch, IconUsersGroup } from '@tabler/icons-react';
import { getCoreRowModel, useReactTable, type ColumnDef, type Row } from '@tanstack/react-table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { displayDateTime, displayValue } from '@/components/academic-year/academicYearDisplay';
import {
  getRegistrationGroupStatusColor,
  getRegistrationGroupStatusLabel,
  registrationGroupStatusFilterOptions,
} from '@/components/registration-groups/registrationGroupStatusDisplay';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import type { StringOption } from '@/components/search/SearchQueryControls';
import {
  getRegistrationGroupReferenceOptions,
  searchRegistrationGroups,
} from '@/services/registration-group-service';
import type {
  RegistrationGroupReferenceOptionsResponse,
  RegistrationGroupSearchResponse,
  RegistrationGroupSearchResultResponse,
} from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type RegistrationGroupSearchSortBy =
  | 'academicYear'
  | 'name'
  | 'registrationOpensAt'
  | 'status'
  | 'studentCount'
  | 'term';
type RegistrationGroupSearchSortDirection = 'asc' | 'desc';
type RegistrationGroupSearchPageSize = '25' | '50' | '100';

type RegistrationGroupSearchFilters = {
  academicYearId: string;
  groupQuery: string;
  status: string;
  termId: string;
};

type RegistrationGroupSearchState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: RegistrationGroupSearchResponse };

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupReferenceOptionsResponse }
  | { status: 'error'; message: string };

const initialFilters: RegistrationGroupSearchFilters = {
  academicYearId: '',
  groupQuery: '',
  status: '',
  termId: '',
};

function getInitialFiltersFromSearchParams(
  searchParams: URLSearchParams
): RegistrationGroupSearchFilters {
  return {
    academicYearId: searchParams.get('academicYearId') ?? '',
    groupQuery: searchParams.get('groupQuery') ?? '',
    status: searchParams.get('status') ?? '',
    termId: searchParams.get('termId') ?? '',
  };
}

const sortByOptions = [
  { value: 'name', label: 'Group' },
  { value: 'academicYear', label: 'Academic year' },
  { value: 'term', label: 'Term' },
  { value: 'registrationOpensAt', label: 'Opens' },
  { value: 'studentCount', label: 'Students' },
  { value: 'status', label: 'Status' },
] satisfies ReadonlyArray<StringOption<RegistrationGroupSearchSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<RegistrationGroupSearchSortDirection>>;

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<RegistrationGroupSearchPageSize>>;

const emptyResults: RegistrationGroupSearchResultResponse[] = [];

const groupColumns: ColumnDef<RegistrationGroupSearchResultResponse>[] = [
  {
    id: 'name',
    header: 'Group',
    size: 280,
    meta: { sortBy: 'name' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.name}</Text>
        <Text size="sm" c="dimmed">
          {displayValue(row.original.createdFrom ?? row.original.generationName)}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'academicYear',
    header: 'Academic Year',
    size: 240,
    meta: { sortBy: 'academicYear' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => displayValue(row.original.academicYearName),
  },
  {
    id: 'term',
    header: 'Term',
    size: 180,
    meta: { sortBy: 'term' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => displayValue(row.original.termName),
  },
  {
    id: 'registrationWindow',
    header: 'Registration Window',
    size: 260,
    meta: { sortBy: 'registrationOpensAt' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text>{displayDateTime(row.original.registrationOpensAt)}</Text>
        <Text size="sm" c="dimmed">
          closes {displayDateTime(row.original.registrationClosesAt)}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'studentCount',
    header: 'Students',
    size: 140,
    meta: { sortBy: 'studentCount' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => row.original.studentCount,
  },
  {
    id: 'status',
    header: 'Status',
    size: 140,
    meta: { sortBy: 'status' satisfies RegistrationGroupSearchSortBy },
    cell: ({ row }) => (
      <Badge color={getRegistrationGroupStatusColor(row.original.statusCode)} variant="light">
        {getRegistrationGroupStatusLabel(row.original.statusCode, row.original.statusName)}
      </Badge>
    ),
  },
];

function mapAcademicYearOption(option: RegistrationGroupReferenceOptionsResponse['academicYears'][number]) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function mapTermOption(
  option: RegistrationGroupReferenceOptionsResponse['academicYears'][number]['terms'][number]
) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function getResultsStatus(state: RegistrationGroupSearchState): SearchResultsStatus {
  if (state.status === 'success') {
    return state.response.results.length === 0 ? 'empty' : 'success';
  }

  return state.status;
}

function getResultsSummary(state: RegistrationGroupSearchState) {
  if (state.status === 'idle') {
    return 'Search saved registration groups.';
  }

  if (state.status === 'loading') {
    return 'Searching registration groups...';
  }

  if (state.status === 'error') {
    return 'Unable to search registration groups.';
  }

  if (state.status !== 'success') {
    return 'Search saved registration groups.';
  }

  if (state.response.page.totalElements === 0 || state.response.results.length === 0) {
    return 'No registration groups matched the current filters.';
  }

  const start = state.response.page.page * state.response.page.size + 1;
  const end = state.response.page.page * state.response.page.size + state.response.results.length;

  return `Showing ${start}-${end} of ${state.response.page.totalElements} registration groups`;
}

export function RegistrationGroupsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearchFilters = useMemo(
    () => getInitialFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const [sortBy, setSortBy] = useState<RegistrationGroupSearchSortBy>('name');
  const [sortDirection, setSortDirection] = useState<RegistrationGroupSearchSortDirection>('asc');
  const [pageSize, setPageSize] = useState<RegistrationGroupSearchPageSize>('25');
  const [page, setPage] = useState(0);
  const [submittedFilters, setSubmittedFilters] =
    useState<RegistrationGroupSearchFilters>(initialSearchFilters);
  const [hasSearched, setHasSearched] = useState(true);
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [resultsState, setResultsState] = useState<RegistrationGroupSearchState>({
    status: 'idle',
  });
  const form = useForm<RegistrationGroupSearchFilters>({
    initialValues: initialSearchFilters,
  });

  useEffect(() => {
    const abortController = new AbortController();
    setReferenceOptionsState({ status: 'loading' });

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group filters.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchRegistrationGroups({
      academicYearId: parseOptionalId(submittedFilters.academicYearId),
      termId: parseOptionalId(submittedFilters.termId),
      groupQuery: submittedFilters.groupQuery,
      status: submittedFilters.status,
      page,
      size: Number(pageSize),
      sortBy,
      sortDirection,
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
          message: getErrorMessage(error, 'Failed to search registration groups.'),
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
  const academicYearOptions = referenceOptions?.academicYears.map(mapAcademicYearOption) ?? [];
  const termOptions = useMemo(() => {
    const academicYears = referenceOptions?.academicYears ?? [];
    const selectedAcademicYear = academicYears.find(
      (academicYear) => String(academicYear.id) === form.values.academicYearId
    );
    const terms = selectedAcademicYear
      ? selectedAcademicYear.terms
      : academicYears.flatMap((academicYear) => academicYear.terms);

    return terms.map(mapTermOption);
  }, [form.values.academicYearId, referenceOptions]);
  const statusOptions =
    referenceOptions && referenceOptions.statuses.length > 0
      ? registrationGroupStatusFilterOptions
      : [];
  const results = resultsState.status === 'success' ? resultsState.response.results : emptyResults;
  const groupTable = useReactTable({
    columns: groupColumns,
    data: results,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.registrationGroupId),
  });
  const pagination =
    resultsState.status === 'success' && resultsState.response.page.totalPages > 0
      ? {
          page: resultsState.response.page.page,
          totalPages: resultsState.response.page.totalPages,
          onPageChange: setPage,
        }
      : null;

  function handleToggleSort(nextSortBy: RegistrationGroupSearchSortBy) {
    setPage(0);

    if (nextSortBy === sortBy) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleClear() {
    form.setValues(initialFilters);
    setSubmittedFilters({ ...initialFilters });
    setHasSearched(true);
    setPage(0);
    setPageSize('25');
    setSortBy('name');
    setSortDirection('asc');
  }

  function handleSubmit(values: RegistrationGroupSearchFilters) {
    setSubmittedFilters({ ...values });
    setHasSearched(true);
    setPage(0);
  }

  function handleOpenPublishPage() {
    const fallbackAcademicYear = referenceOptions?.academicYears[0] ?? null;
    const nextAcademicYearId =
      form.values.academicYearId || (fallbackAcademicYear ? String(fallbackAcademicYear.id) : '');
    const nextAcademicYear =
      referenceOptions?.academicYears.find((academicYear) => String(academicYear.id) === nextAcademicYearId) ??
      fallbackAcademicYear;
    const nextTermId =
      form.values.termId ||
      (nextAcademicYear?.terms[0] ? String(nextAcademicYear.terms[0].id) : '');

    const queryParams = new URLSearchParams();
    if (nextAcademicYearId) {
      queryParams.set('academicYearId', nextAcademicYearId);
    }
    if (nextTermId) {
      queryParams.set('termId', nextTermId);
    }

    navigate(`/registration/groups/publish${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }

  function getRowProps(
    row: Row<RegistrationGroupSearchResultResponse>
  ): SearchResultsTableRowProps {
    const detailPath = `/registration/groups/${row.original.registrationGroupId}`;

    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => {
        navigate(detailPath);
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(detailPath);
        }
      },
    };
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
            <Stack gap="xs">
              <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
              <Title order={1}>Registration Groups</Title>
              <Text size="sm" c="dimmed">
                Search saved registration groups and open the builder when you need to create a new
                snapshot.
              </Text>
            </Stack>
            <Group gap="sm">
              <Button
                variant="default"
                leftSection={<IconChecklist size={18} />}
                onClick={handleOpenPublishPage}
              >
                Publish Term Groups
              </Button>
              <Button
                variant="default"
                leftSection={<IconUserSearch size={18} />}
                onClick={() => {
                  navigate('/registration/groups/unassigned');
                }}
              >
                Unassigned Students
              </Button>
              <Button
                leftSection={<IconUsersGroup size={18} />}
                onClick={() => {
                  navigate('/registration/groups/builder');
                }}
              >
                Registration Group Builder
              </Button>
            </Group>
          </Group>
        </Paper>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Paper p="lg" withBorder radius="md">
            <Stack gap="lg">
              {referenceOptionsError ? (
                <Alert color="red" title="Unable to load registration group filters">
                  {referenceOptionsError}
                </Alert>
              ) : null}

              <SearchFormSection legend="Registration Group Filters">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Academic Year"
                    placeholder="All academic years"
                    clearable
                    data={academicYearOptions}
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('academicYearId')}
                    onChange={(value) => {
                      form.setFieldValue('academicYearId', value ?? '');
                      form.setFieldValue('termId', '');
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Term"
                    placeholder="All terms"
                    clearable
                    data={termOptions}
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('termId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Status"
                    placeholder="All statuses"
                    clearable
                    data={statusOptions}
                    disabled={referenceOptionsLoading}
                    {...form.getInputProps('status')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Group Name"
                    placeholder="Group name or source"
                    {...form.getInputProps('groupQuery')}
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
                isSubmitting={resultsState.status === 'loading'}
                onSizeChange={(value) => {
                  if (value) {
                    setPageSize(value as RegistrationGroupSearchPageSize);
                    setPage(0);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as RegistrationGroupSearchSortBy);
                    setPage(0);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as RegistrationGroupSearchSortDirection);
                    setPage(0);
                  }
                }}
                clearLabel="Clear"
                submitLabel="Search Groups"
                onClear={handleClear}
              />
            </Stack>
          </Paper>
        </form>

        <SearchResultsPanel
          status={getResultsStatus(resultsState)}
          summary={getResultsSummary(resultsState)}
          table={groupTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          withBorder
          notice={{
            idleTitle: 'Search registration groups',
            idleMessage: 'Use the filters above to find saved registration groups.',
            loadingMessage: 'Searching registration groups...',
            errorTitle: 'Unable to search registration groups',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No groups found',
            emptyMessage: 'Adjust the filters or use the builder to create a group.',
          }}
          pagination={pagination}
          getRowProps={getRowProps}
        />
      </Stack>
    </Container>
  );
}
