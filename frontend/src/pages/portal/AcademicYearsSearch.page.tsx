import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox, Container, Grid, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import {
  academicYearSearchSizeSelectOptions,
  academicYearSortByOptions,
  academicYearSortDirectionOptions,
  defaultAcademicYearSearchSize,
  defaultAcademicYearSortBy,
  defaultAcademicYearSortDirection,
  parseAcademicYearSearchSize,
  parseAcademicYearSortBy,
  parseAcademicYearSortDirection,
  type AcademicYearSearchSize,
} from '@/services/academic-year-search-config';
import { getAcademicYearStatuses, searchAcademicYears } from '@/services/academic-year-service';
import {
  initialAcademicYearSearchFilters,
  type AcademicYearSearchFilters,
  type AcademicYearSearchResponse,
  type AcademicYearSearchResultResponse,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from '@/services/schemas/academic-years-schemas';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getErrorMessage } from '@/utils/errors';

type AcademicYearResultsView = 'standard' | 'system';

type AcademicYearSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: AcademicYearSearchResponse }
  | { status: 'success'; response: AcademicYearSearchResponse };

const academicYearResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: AcademicYearResultsView }>;

const emptyAcademicYearResults: AcademicYearSearchResultResponse[] = [];

const academicYearResultsColumns: ColumnDef<AcademicYearSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 160,
    meta: { sortBy: 'code' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 280,
    meta: { sortBy: 'name' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'startDate',
    header: 'Start date',
    size: 140,
    meta: { sortBy: 'startDate' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'endDate',
    header: 'End date',
    size: 140,
    meta: { sortBy: 'endDate' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'yearStatusName',
    header: 'Year Status',
    size: 160,
    cell: ({ row }) => row.original.yearStatusName ?? row.original.yearStatusCode ?? '—',
    meta: { sortBy: 'yearStatus' satisfies AcademicYearSortBy },
  },
  {
    id: 'isPublished',
    accessorFn: (academicYear) => academicYear.isPublished,
    header: 'Published',
    size: 112,
    cell: ({ getValue }) => (getValue<boolean>() ? 'Yes' : 'No'),
    meta: { sortBy: 'isPublished' satisfies AcademicYearSortBy },
  },
];

function getResultsSummary(
  searchResultsState: AcademicYearSearchResultsState,
  page: number,
  size: AcademicYearSearchSize
): string {
  if (searchResultsState.status === 'idle') {
    return 'No academic year search has been run yet.';
  }

  if (searchResultsState.status === 'loading') {
    return 'Loading academic years...';
  }

  if (searchResultsState.status === 'error') {
    return 'Academic year search failed.';
  }

  if (searchResultsState.response.length === 0) {
    return 'No academic years matched the current search criteria.';
  }

  const start = page * size + 1;
  const end = start + searchResultsState.response.length - 1;

  return `Showing ${start}-${end} academic years`;
}

function getTotalPages(
  searchResultsState: AcademicYearSearchResultsState,
  page: number,
  size: AcademicYearSearchSize
): number {
  if (
    searchResultsState.status !== 'success' &&
    searchResultsState.status !== 'empty'
  ) {
    return 1;
  }

  const resultCount = searchResultsState.response.length;
  const hasPotentialNextPage = resultCount === size;

  return hasPotentialNextPage ? page + 2 : Math.max(page + 1, 1);
}

export function AcademicYearsSearchPage() {
  const navigate = useNavigate();
  const form = useForm<AcademicYearSearchFilters>({
    initialValues: initialAcademicYearSearchFilters,
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState<AcademicYearSearchSize>(defaultAcademicYearSearchSize);
  const [sortBy, setSortBy] = useState<AcademicYearSortBy>(defaultAcademicYearSortBy);
  const [sortDirection, setSortDirection] = useState<AcademicYearSortDirection>(
    defaultAcademicYearSortDirection
  );
  const [resultsView, setResultsView] = useState<AcademicYearResultsView>('standard');
  const [academicYearStatusOptions, setAcademicYearStatusOptions] = useState<
    ReadonlyArray<StringOption>
  >([]);
  const [academicYearStatusOptionsLoading, setAcademicYearStatusOptionsLoading] = useState(true);
  const [academicYearStatusOptionsError, setAcademicYearStatusOptionsError] = useState<
    string | null
  >(null);
  const [submittedFilters, setSubmittedFilters] = useState<AcademicYearSearchFilters | null>(null);
  const [searchResultsState, setSearchResultsState] = useState<AcademicYearSearchResultsState>({
    status: 'idle',
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicYearStatusOptionsLoading(true);
    setAcademicYearStatusOptionsError(null);

    getAcademicYearStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicYearStatusOptions(
          response.map((status) => ({
            value: status.code,
            label: status.name,
          }))
        );
        setAcademicYearStatusOptionsLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicYearStatusOptions([]);
        setAcademicYearStatusOptionsError(
          getErrorMessage(error, 'Failed to load academic year statuses.')
        );
        setAcademicYearStatusOptionsLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!submittedFilters) {
      return;
    }

    const abortController = new AbortController();
    setSearchResultsState({ status: 'loading' });

    searchAcademicYears({
      filters: submittedFilters,
      page,
      size,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setSearchResultsState(
          response.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search academic years.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [submittedFilters, page, size, sortBy, sortDirection]);

  const tableData =
    searchResultsState.status === 'success' || searchResultsState.status === 'empty'
      ? searchResultsState.response
      : emptyAcademicYearResults;

  const academicYearResultsTable = useReactTable({
    columns: academicYearResultsColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.academicYearId),
    state: {
      columnVisibility: {
        yearStatusName: resultsView === 'system',
        isPublished: resultsView === 'system',
      },
    },
  });

  function handleToggleSort(nextSortBy: AcademicYearSortBy) {
    setPage(0);

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
    setPage(0);
    setSize(defaultAcademicYearSearchSize);
    setSortBy(defaultAcademicYearSortBy);
    setSortDirection(defaultAcademicYearSortDirection);
    setResultsView('standard');
    setSubmittedFilters(null);
    setSearchResultsState({ status: 'idle' });
  }

  function handleOpenAcademicYearDetail(academicYearId: number) {
    navigate(`/academics/academic-years/${academicYearId}`);
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Paper p="lg">
          <form
            onSubmit={form.onSubmit((values) => {
              setPage(0);
              setSubmittedFilters({ ...values });
            })}
          >
            <Stack gap="lg">
              <SearchFormActions
                leadingContent={<Title order={1}>Academic Year Search</Title>}
                size={String(size)}
                sortBy={sortBy}
                sortDirection={sortDirection}
                sizeOptions={academicYearSearchSizeSelectOptions}
                sortByOptions={academicYearSortByOptions}
                sortDirectionOptions={academicYearSortDirectionOptions}
                onSizeChange={(value) => {
                  setPage(0);
                  setSize(parseAcademicYearSearchSize(value));
                }}
                onSortByChange={(value) => {
                  setPage(0);
                  setSortBy(parseAcademicYearSortBy(value));
                }}
                onSortDirectionChange={(value) => {
                  setPage(0);
                  setSortDirection(parseAcademicYearSortDirection(value));
                }}
                showButtons={false}
              />

              <SearchFormSection legend="Search Filters">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Search"
                    placeholder="Search by academic year code or name"
                    {...form.getInputProps('query')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    clearable
                    label="Year Status"
                    placeholder="All years"
                    data={academicYearStatusOptions}
                    value={form.values.yearStatusCode || null}
                    loading={academicYearStatusOptionsLoading}
                    error={academicYearStatusOptionsError ?? undefined}
                    onChange={(value) => {
                      form.setFieldValue('yearStatusCode', value ?? '');
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Checkbox
                    mt="xl"
                    label="Current year only"
                    {...form.getInputProps('currentOnly', { type: 'checkbox' })}
                  />
                </Grid.Col>
              </SearchFormSection>

              <SearchFormActions
                showQueryControls={false}
                clearLabel="Clear"
                submitLabel="Search Academic Years"
                isSubmitting={searchResultsState.status === 'loading'}
                onClear={handleClear}
              />
            </Stack>
          </form>
        </Paper>

        <SearchResultsPanel
          status={searchResultsState.status}
          summary={getResultsSummary(searchResultsState, page, size)}
          table={academicYearResultsTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          viewOptions={academicYearResultsViewOptions}
          view={resultsView}
          onViewChange={setResultsView}
          notice={{
            idleTitle: 'Start a search',
            idleMessage: 'Enter one or more search filters, then run the academic year search.',
            loadingMessage: 'Loading academic years...',
            errorMessage: searchResultsState.status === 'error' ? searchResultsState.message : null,
            emptyTitle: 'No academic years found',
            emptyMessage: 'No academic years matched the current search criteria.',
          }}
          getRowProps={(row) => ({
            role: 'button',
            tabIndex: 0,
            onClick: () => {
              handleOpenAcademicYearDetail(row.original.academicYearId);
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenAcademicYearDetail(row.original.academicYearId);
              }
            },
          })}
          pagination={
            submittedFilters &&
            (searchResultsState.status === 'success' || searchResultsState.status === 'empty')
              ? {
                  page,
                  totalPages: getTotalPages(searchResultsState, page, size),
                  onPageChange: setPage,
                }
              : null
          }
        />
      </Stack>
    </Container>
  );
}
