import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { TuitionCodeCreateModal } from '@/components/billing/TuitionCodeCreateModal';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import { searchTuitionCodes, type SearchTuitionCodesRequest } from '@/services/billing-service';
import type { TuitionCodeSearchResultResponse } from '@/services/schemas/billing-schemas';

type TuitionCodeSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'empty' | 'success';
      results: TuitionCodeSearchResultResponse[];
      page: number;
      totalPages: number;
      totalElements: number;
    };

type TuitionCodeSortBy = 'code' | 'name';
type TuitionCodeSortDirection = 'asc' | 'desc';

type TuitionCodeFilters = {
  code: string;
  name: string;
};

const initialFilters: TuitionCodeFilters = {
  code: '',
  name: '',
};

const pageSize = 25;

const tuitionCodeColumns: ColumnDef<TuitionCodeSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 180,
    cell: ({ row }) => (
      <Link to={`/billing/tuition-codes/${row.original.tuitionCodeId}`}>{row.original.code}</Link>
    ),
    meta: { sortBy: 'code' satisfies TuitionCodeSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 420,
    meta: { sortBy: 'name' satisfies TuitionCodeSortBy },
  },
];

function getResultsSummary(state: TuitionCodeSearchState) {
  if (state.status === 'success') {
    return `Showing ${state.results.length} of ${state.totalElements} tuition codes`;
  }

  if (state.status === 'empty') {
    return 'No tuition codes matched the current search criteria.';
  }

  if (state.status === 'loading') {
    return 'Searching tuition codes...';
  }

  if (state.status === 'error') {
    return 'Unable to search tuition codes.';
  }

  return 'Tuition code search is ready.';
}

export function TuitionCodeSearchPage() {
  const [filters, setFilters] = useState<TuitionCodeFilters>(initialFilters);
  const [submittedFilters, setSubmittedFilters] = useState<TuitionCodeFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<TuitionCodeSortBy>('code');
  const [sortDirection, setSortDirection] = useState<TuitionCodeSortDirection>('asc');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resultsState, setResultsState] = useState<TuitionCodeSearchState>({ status: 'idle' });
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.results
      : [];
  const table = useReactTable({
    columns: tuitionCodeColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.tuitionCodeId),
  });

  async function runSearch({
    nextFilters = submittedFilters,
    nextSortBy = sortBy,
    nextSortDirection = sortDirection,
    page = 0,
  }: {
    nextFilters?: TuitionCodeFilters;
    nextSortBy?: TuitionCodeSortBy;
    nextSortDirection?: TuitionCodeSortDirection;
    page?: number;
  } = {}) {
    setResultsState({ status: 'loading' });
    setCreateMessage(null);

    const request: SearchTuitionCodesRequest = {
      code: nextFilters.code,
      name: nextFilters.name,
      page,
      size: pageSize,
      sortBy: nextSortBy,
      sortDirection: nextSortDirection,
    };

    try {
      const response = await searchTuitionCodes(request);
      setResultsState({
        status: response.results.length === 0 ? 'empty' : 'success',
        results: response.results,
        page: response.page,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      });
    } catch (error) {
      setResultsState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to search tuition codes.',
      });
    }
  }

  function handleToggleSort(nextSortBy: TuitionCodeSortBy) {
    let nextSortDirection: TuitionCodeSortDirection = 'asc';

    if (sortBy === nextSortBy) {
      nextSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortDirection);

    if (hasSearched) {
      void runSearch({ nextSortBy, nextSortDirection, page: 0 });
    }
  }

  return (
    <Container size="xl" py="xl">
      <TuitionCodeCreateModal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        onCreate={(tuitionCode) => {
          setCreateModalOpen(false);
          setSubmittedFilters(initialFilters);
          setFilters(initialFilters);
          setHasSearched(true);
          setCreateMessage(`Created tuition code ${tuitionCode.code}.`);
          void runSearch({ nextFilters: initialFilters, page: 0 });
        }}
      />

      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Title order={1}>Tuition Code Search</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setCreateModalOpen(true);
                }}
              >
                Create tuition code
              </Button>
            </Group>

            {createMessage ? (
              <Alert color="green" title="Tuition code created">
                {createMessage}
              </Alert>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedFilters(filters);
                setHasSearched(true);
                void runSearch({ nextFilters: filters, page: 0 });
              }}
            >
              <Stack gap="lg">
                <SearchFormSection legend="Tuition Code Filters">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Code"
                      value={filters.code}
                      onChange={(event) => {
                        setFilters((current) => ({
                          ...current,
                          code: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput
                      label="Name"
                      value={filters.name}
                      onChange={(event) => {
                        setFilters((current) => ({
                          ...current,
                          name: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormActions
                  showQueryControls={false}
                  clearLabel="Clear"
                  submitLabel="Search Tuition Codes"
                  onClear={() => {
                    setFilters(initialFilters);
                    setSubmittedFilters(initialFilters);
                    setHasSearched(false);
                    setResultsState({ status: 'idle' });
                    setCreateMessage(null);
                  }}
                />
              </Stack>
            </form>
          </Stack>
        </Paper>

        <SearchResultsPanel
          status={resultsState.status}
          summary={getResultsSummary(resultsState)}
          table={table}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          withBorder
          notice={{
            idleTitle: 'Tuition code search is ready',
            idleMessage: 'Search by tuition code or name.',
            loadingMessage: 'Loading tuition codes...',
            errorTitle: 'Unable to load tuition codes',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No tuition code search results found',
            emptyMessage: 'Try adjusting the current search filters.',
          }}
          pagination={
            resultsState.status === 'success' || resultsState.status === 'empty'
              ? {
                  page: resultsState.page,
                  totalPages: resultsState.totalPages,
                  onPageChange: (page) => {
                    void runSearch({ page });
                  },
                }
              : null
          }
        />
      </Stack>
    </Container>
  );
}
