import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
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
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreateProgramModal,
  type ProgramCatalogOption,
  type ProgramDepartmentOption,
} from '@/components/program/CreateProgramModal';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getProgramReferenceOptions } from '@/services/reference-service';
import { searchPrograms } from '@/services/program-service';
import type {
  CreateProgramResponse,
  ProgramSearchResponse,
  ProgramSearchResultResponse,
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type ProgramSearchFilters = {
  programTypeId: string;
  degreeTypeId: string;
  schoolId: string;
  departmentId: string;
  code: string;
  name: string;
};

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | {
      status: 'success';
      programTypeOptions: ProgramCatalogOption[];
      degreeTypeOptions: ProgramCatalogOption[];
      schoolOptions: ProgramCatalogOption[];
      departmentOptions: ProgramDepartmentOption[];
    }
  | { status: 'error'; message: string };

type ProgramSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: ProgramSearchResponse }
  | { status: 'success'; response: ProgramSearchResponse };

type ProgramSearchSize = '25' | '50' | '100';
type ProgramSearchResultsView = 'standard' | 'system';

const initialProgramSearchFilters: ProgramSearchFilters = {
  programTypeId: '',
  degreeTypeId: '',
  schoolId: '',
  departmentId: '',
  code: '',
  name: '',
};

const emptyProgramSearchResults: ProgramSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: ProgramSearchResultsView }>;
const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSize>>;
const sortByOptions = [
  { value: 'programTypeName', label: 'Program type' },
  { value: 'degreeTypeName', label: 'Degree type' },
  { value: 'schoolName', label: 'School' },
  { value: 'departmentName', label: 'Department' },
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortBy>>;
const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortDirection>>;

function formatClassYearRange(program: ProgramSearchResultResponse) {
  if (program.currentClassYearStart === null) {
    return 'No published version';
  }

  if (program.currentClassYearEnd === null) {
    return `${program.currentClassYearStart}+`;
  }

  return `${program.currentClassYearStart}-${program.currentClassYearEnd}`;
}

const programSearchColumns: ColumnDef<ProgramSearchResultResponse>[] = [
  {
    accessorKey: 'programTypeName',
    header: 'Type',
    size: 130,
    cell: ({ row }) => (
      <Badge variant="light" color={row.original.programTypeCode === 'MAJOR' ? 'blue' : 'gray'}>
        {row.original.programTypeName ?? '—'}
      </Badge>
    ),
    meta: { sortBy: 'programTypeName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'code',
    header: 'Code',
    size: 140,
    cell: ({ row }) => (
      <Link to={`/academics/programs/${row.original.programId}`}>{row.original.code}</Link>
    ),
    meta: { sortBy: 'code' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Program',
    size: 280,
    meta: { sortBy: 'name' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'degreeTypeName',
    header: 'Degree',
    size: 130,
    cell: ({ row }) => row.original.degreeTypeName ?? '—',
    meta: { sortBy: 'degreeTypeName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'schoolName',
    header: 'School',
    size: 240,
    cell: ({ row }) =>
      row.original.schoolId === null ? (
        '—'
      ) : (
        <Link to={`/academics/schools/${row.original.schoolId}`}>
          {row.original.schoolName ?? '—'}
        </Link>
      ),
    meta: { sortBy: 'schoolName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department',
    size: 200,
    cell: ({ row }) =>
      row.original.departmentId === null ? (
        '—'
      ) : (
        <Link to={`/academics/departments/${row.original.departmentId}`}>
          {row.original.departmentName}
        </Link>
      ),
    meta: { sortBy: 'departmentName' satisfies ProgramSearchSortBy },
  },
  {
    id: 'currentVersion',
    header: 'Published Version',
    size: 170,
    cell: ({ row }) =>
      row.original.currentVersionNumber === null
        ? 'Draft only'
        : `v${row.original.currentVersionNumber} (${formatClassYearRange(row.original)})`,
  },
];

function getResultsSummary(state: ProgramSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading program search results...';
  }

  if (state.status === 'error') {
    return 'Program search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No programs matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} programs`;
  }

  return 'Program search is ready.';
}

function mapCodeNameOption(option: { code: string; id: number; name: string }) {
  return {
    code: option.code,
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function isNonDegreeProgramType(option: ProgramCatalogOption | undefined) {
  return option?.code === 'MINOR' || option?.code === 'CERTIFICATE';
}

export function ProgramSearchPage() {
  const navigate = useNavigate();
  const form = useForm<ProgramSearchFilters>({
    initialValues: initialProgramSearchFilters,
  });
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [resultsState, setResultsState] = useState<ProgramSearchResultsState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] = useState<ProgramSearchFilters>(
    initialProgramSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<ProgramSearchSortBy>('code');
  const [sortDirection, setSortDirection] = useState<ProgramSearchSortDirection>('asc');
  const [size, setSize] = useState<ProgramSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<ProgramSearchResultsView>('standard');
  const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setReferenceOptionsState({ status: 'loading' });

    getProgramReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'success',
          programTypeOptions: response.programTypes.map(mapCodeNameOption),
          degreeTypeOptions: response.degreeTypes.map(mapCodeNameOption),
          schoolOptions: response.schools.map(mapCodeNameOption),
          departmentOptions: response.departments.map((department) => ({
            value: String(department.id),
            label: `${department.name} (${department.code})`,
            schoolId: department.schoolId,
          })),
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program reference options.'),
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

    searchPrograms({
      programTypeId: parseOptionalId(submittedFilters.programTypeId),
      degreeTypeId: parseOptionalId(submittedFilters.degreeTypeId),
      schoolId: parseOptionalId(submittedFilters.schoolId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      code: submittedFilters.code,
      name: submittedFilters.name,
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
          message: getErrorMessage(error, 'Failed to search programs.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, sortBy, sortDirection, submittedFilters]);

  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyProgramSearchResults;

  const programSearchTable = useReactTable({
    columns: programSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.programId),
    state: {
      columnVisibility: {
        currentVersion: resultsView === 'system',
      },
    },
  });

  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const programTypeOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.programTypeOptions : [];
  const degreeTypeOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.degreeTypeOptions : [];
  const schoolOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.schoolOptions : [];
  const departmentOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.departmentOptions : [];

  const visibleDepartmentOptions = useMemo(() => {
    if (form.values.schoolId.trim() === '') {
      return departmentOptions;
    }

    return departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId));
  }, [departmentOptions, form.values.schoolId]);

  function handleToggleSort(nextSortBy: ProgramSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
    setPage(0);
  }

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialProgramSearchFilters);
    setHasSearched(false);
    setSortBy('code');
    setSortDirection('asc');
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  function handleProgramCreated(response: CreateProgramResponse) {
    setIsCreateProgramModalOpen(false);
    void navigate(`/academics/programs/${response.programId}`);
  }

  return (
    <Container size="xl" py="xl">
      <CreateProgramModal
        opened={isCreateProgramModalOpen}
        onClose={() => {
          setIsCreateProgramModalOpen(false);
        }}
        onCreated={handleProgramCreated}
        programTypeOptions={programTypeOptions}
        degreeTypeOptions={degreeTypeOptions}
        schoolOptions={schoolOptions}
        departmentOptions={departmentOptions}
        referenceOptionsLoading={referenceOptionsLoading}
        referenceOptionsError={referenceOptionsError}
      />
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md">
              <Title order={1}>Program Search</Title>
              <Button
                onClick={() => {
                  setIsCreateProgramModalOpen(true);
                }}
              >
                Create Program
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
                <SearchFormSection legend="Program Filters">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      clearable
                      searchable
                      label="Program Type"
                      placeholder="All types"
                      data={programTypeOptions}
                      value={form.values.programTypeId || null}
                      loading={referenceOptionsLoading}
                      error={referenceOptionsError ?? undefined}
                      onChange={(value) => {
                        form.setFieldValue('programTypeId', value ?? '');

                        const selectedProgramType = programTypeOptions.find(
                          (option) => option.value === value
                        );
                        if (isNonDegreeProgramType(selectedProgramType)) {
                          form.setFieldValue('degreeTypeId', '');
                        }
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      clearable
                      searchable
                      label="Degree Type"
                      placeholder="All degrees"
                      data={degreeTypeOptions}
                      value={form.values.degreeTypeId || null}
                      loading={referenceOptionsLoading}
                      error={referenceOptionsError ?? undefined}
                      disabled={
                        isNonDegreeProgramType(
                          programTypeOptions.find((option) => option.value === form.values.programTypeId)
                        )
                      }
                      onChange={(value) => {
                        form.setFieldValue('degreeTypeId', value ?? '');
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
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
                          return;
                        }

                        if (!value) {
                          form.setFieldValue('departmentId', '');
                        }
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
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
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput label="Program Code" {...form.getInputProps('code')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput label="Program Name" {...form.getInputProps('name')} />
                  </Grid.Col>
                </SearchFormSection>

                {referenceOptionsError ? (
                  <Alert color="red" title="Unable to load program search filters">
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

                    setSize(value as ProgramSearchSize);
                    setPage(0);
                  }}
                  onSortByChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSortBy(value as ProgramSearchSortBy);
                    setPage(0);
                  }}
                  onSortDirectionChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSortDirection(value as ProgramSearchSortDirection);
                    setPage(0);
                  }}
                  clearLabel="Clear"
                  submitLabel="Search Programs"
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
          table={programSearchTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          viewOptions={resultsViewOptions}
          view={resultsView}
          onViewChange={setResultsView}
          withBorder
          notice={{
            idleTitle: 'Program search is ready',
            idleMessage: 'Search programs by type, degree, school, department, code, or name.',
            loadingMessage: 'Loading program search results...',
            errorTitle: 'Unable to load program search results',
            errorMessage: resultsState.status === 'error' ? resultsState.message : null,
            emptyTitle: 'No program search results found',
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
