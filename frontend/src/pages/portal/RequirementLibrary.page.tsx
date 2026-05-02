import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Badge,
  Button,
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
import { CreateRequirementModal } from '@/components/requirements/CreateRequirementModal';
import { requirementTypeOptions } from '@/components/requirements/requirementFormTypes';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { searchRequirements } from '@/services/requirement-service';
import type {
  RequirementSearchResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import {
  formatRequirementTarget,
  formatRequirementType,
} from '@/utils/requirement-formatters';

type RequirementSearchFilters = {
  code: string;
  name: string;
  requirementType: string;
};

type RequirementSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: RequirementSearchResponse }
  | { status: 'success'; response: RequirementSearchResponse };

type RequirementSearchSize = '25' | '50' | '100';
type RequirementResultsView = 'standard' | 'system';

const initialRequirementSearchFilters: RequirementSearchFilters = {
  code: '',
  name: '',
  requirementType: '',
};
const emptyRequirementSearchResults: RequirementSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: RequirementResultsView }>;
const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<RequirementSearchSize>>;

function getResultsSummary(state: RequirementSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading requirement search results...';
  }

  if (state.status === 'error') {
    return 'Requirement search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No requirements matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} requirements`;
  }

  return 'Requirement search is ready.';
}

const requirementSearchColumns: ColumnDef<RequirementSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 170,
    cell: ({ row }) => (
      <Link to={`/academics/requirements/${row.original.requirementId}`}>
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Requirement',
    size: 300,
  },
  {
    accessorKey: 'requirementType',
    header: 'Type',
    size: 180,
    cell: ({ row }) => (
      <Badge variant="light">
        {formatRequirementType(row.original.requirementType)}
      </Badge>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    size: 260,
    cell: ({ row }) => formatRequirementTarget(row.original),
  },
  {
    accessorKey: 'requirementCourseCount',
    header: 'Courses',
    size: 100,
  },
  {
    accessorKey: 'requirementCourseRuleCount',
    header: 'Rules',
    size: 100,
  },
  {
    accessorKey: 'minimumGrade',
    header: 'Minimum Grade',
    size: 140,
    cell: ({ row }) => row.original.minimumGrade ?? '—',
  },
  {
    accessorKey: 'requirementId',
    header: 'ID',
    size: 90,
  },
];

export function RequirementLibraryPage() {
  const navigate = useNavigate();
  const form = useForm<RequirementSearchFilters>({
    initialValues: initialRequirementSearchFilters,
  });
  const [resultsState, setResultsState] = useState<RequirementSearchResultsState>({
    status: 'idle',
  });
  const [submittedFilters, setSubmittedFilters] = useState<RequirementSearchFilters>(
    initialRequirementSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [size, setSize] = useState<RequirementSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<RequirementResultsView>('standard');
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] = useState(false);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchRequirements({
      code: submittedFilters.code,
      name: submittedFilters.name,
      requirementType: submittedFilters.requirementType || undefined,
      page,
      size: Number(size),
      signal: abortController.signal,
    })
      .then((response) => {
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
          message: getErrorMessage(error, 'Failed to search requirements.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, submittedFilters]);

  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyRequirementSearchResults;

  const requirementSearchTable = useReactTable({
    columns: requirementSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.requirementId),
    state: {
      columnVisibility: {
        requirementId: resultsView === 'system',
      },
    },
  });

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialRequirementSearchFilters);
    setHasSearched(false);
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  function handleRequirementCreated(requirement: RequirementSearchResultResponse) {
    setIsCreateRequirementModalOpen(false);
    void navigate(`/academics/requirements/${requirement.requirementId}`);
  }

  return (
    <Container size="xl" py="xl">
      <CreateRequirementModal
        opened={isCreateRequirementModalOpen}
        onCreated={handleRequirementCreated}
        onClose={() => {
          setIsCreateRequirementModalOpen(false);
        }}
      />
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md">
              <Title order={1}>Requirement Library</Title>
              <Button
                onClick={() => {
                  setIsCreateRequirementModalOpen(true);
                }}
              >
                Create Requirement
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
                <SearchFormSection legend="Requirement Filters">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput label="Requirement Code" {...form.getInputProps('code')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput label="Requirement Name" {...form.getInputProps('name')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      clearable
                      label="Requirement Type"
                      placeholder="All types"
                      data={requirementTypeOptions}
                      value={form.values.requirementType || null}
                      onChange={(value) => {
                        form.setFieldValue('requirementType', value ?? '');
                      }}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormActions
                  size={size}
                  sizeOptions={sizeOptions}
                  sortBy="name"
                  sortDirection="asc"
                  sortByOptions={[]}
                  sortDirectionOptions={[]}
                  onSizeChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSize(value as RequirementSearchSize);
                    setPage(0);
                  }}
                  onSortByChange={() => undefined}
                  onSortDirectionChange={() => undefined}
                  clearLabel="Clear"
                  submitLabel="Search Requirements"
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
          table={requirementSearchTable}
          sortBy="name"
          sortDirection="asc"
          onToggleSort={() => undefined}
          viewOptions={resultsViewOptions}
          view={resultsView}
          onViewChange={setResultsView}
          withBorder
          notice={{
            idleTitle: 'Requirement search is ready',
            idleMessage: 'Search reusable requirements by code, name, or type.',
            loadingMessage: 'Loading requirement search results...',
            errorTitle: 'Unable to load requirement search results',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No requirement search results found',
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
      </Stack>
    </Container>
  );
}
