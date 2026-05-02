import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Grid, Select, Container, Paper, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router-dom';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import {
  getAcademicSchoolDepartmentReferenceOptions,
  mapCodeNameReferenceOptionsToSelectOptions,
} from '@/services/reference-service';
import { searchAcademicSchools } from '@/services/academic-school-service';
import type {
  AcademicSchoolSearchFilters,
  AcademicSchoolDepartmentSearchResponse,
  AcademicSchoolDepartmentSearchResultResponse,
} from '@/services/schemas/academic-school-schemas';
import { initialAcademicSchoolSearchFilters } from '@/services/schemas/academic-school-schemas';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type AcademicSchoolsPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; results: AcademicSchoolDepartmentSearchResponse }
  | { status: 'success'; results: AcademicSchoolDepartmentSearchResponse };

type AcademicSchoolSearchSortBy =
  | 'schoolCode'
  | 'schoolName'
  | 'schoolActive'
  | 'departmentCode'
  | 'departmentName'
  | 'departmentActive';

type AcademicSchoolSearchSortDirection = 'asc' | 'desc';
type AcademicSchoolResultsView = 'standard' | 'system';

const emptyAcademicSchoolSearchResults: AcademicSchoolDepartmentSearchResponse = [];
const academicSchoolResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: AcademicSchoolResultsView }>;

const academicSchoolSearchColumns: ColumnDef<AcademicSchoolDepartmentSearchResultResponse>[] = [
  {
    accessorKey: 'schoolCode',
    header: 'School Code',
    size: 160,
    meta: { sortBy: 'schoolCode' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'schoolName',
    header: 'School Name',
    size: 260,
    cell: ({ row }) => (
      <Link to={`/academics/schools/${row.original.schoolId}`}>{row.original.schoolName}</Link>
    ),
    meta: { sortBy: 'schoolName' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'schoolActive',
    header: 'School Active',
    size: 120,
    cell: ({ row }) => (row.original.schoolActive ? 'Yes' : 'No'),
    meta: { sortBy: 'schoolActive' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentCode',
    header: 'Department Code',
    size: 180,
    cell: ({ row }) => row.original.departmentCode ?? '—',
    meta: { sortBy: 'departmentCode' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department Name',
    size: 280,
    cell: ({ row }) =>
      row.original.departmentId === null ? (
        '—'
      ) : (
        <Link
          to={`/academics/departments/${row.original.departmentId}`}
          state={{ source: 'search', schoolId: row.original.schoolId }}
        >
          {row.original.departmentName ?? '—'}
        </Link>
      ),
    meta: { sortBy: 'departmentName' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentActive',
    header: 'Department Active',
    size: 140,
    cell: ({ row }) => (row.original.departmentId === null ? '—' : row.original.departmentActive ? 'Yes' : 'No'),
    meta: { sortBy: 'departmentActive' satisfies AcademicSchoolSearchSortBy },
  },
];

function getResultsSummary(state: AcademicSchoolsPageState): string {
  if (state.status === 'loading') {
    return 'Loading academic school search results...';
  }

  if (state.status === 'error') {
    return 'Academic school search failed.';
  }

  const count = state.results.length;

  if (count === 0) {
    return 'No academic school search results found.';
  }

  return `Showing ${count} academic school search results`;
}

export function AcademicSchoolsPage() {
  const form = useForm<AcademicSchoolSearchFilters>({
    initialValues: initialAcademicSchoolSearchFilters,
  });
  const [pageState, setPageState] = useState<AcademicSchoolsPageState>({ status: 'loading' });
  const [sortBy, setSortBy] = useState<AcademicSchoolSearchSortBy>('schoolName');
  const [sortDirection, setSortDirection] = useState<AcademicSchoolSearchSortDirection>('asc');
  const [resultsView, setResultsView] = useState<AcademicSchoolResultsView>('standard');
  const [submittedFilters, setSubmittedFilters] = useState<AcademicSchoolSearchFilters>(
    initialAcademicSchoolSearchFilters
  );
  const [schoolOptions, setSchoolOptions] = useState<ReadonlyArray<StringOption>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    ReadonlyArray<{ schoolId: number } & StringOption>
  >([]);
  const [referenceOptionsLoading, setReferenceOptionsLoading] = useState(true);
  const [referenceOptionsError, setReferenceOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setReferenceOptionsLoading(true);
    setReferenceOptionsError(null);

    getAcademicSchoolDepartmentReferenceOptions()
      .then((response) => {
        if (!mounted) {
          return;
        }

        setSchoolOptions(mapCodeNameReferenceOptionsToSelectOptions(response.schools));
        setDepartmentOptions(
          response.departments.map((department) => ({
            schoolId: department.schoolId,
            value: String(department.id),
            label: `${department.name} (${department.code})`,
          }))
        );
        setReferenceOptionsLoading(false);
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        setSchoolOptions([]);
        setDepartmentOptions([]);
        setReferenceOptionsError(
          error instanceof Error ? error.message : 'Failed to load academic school filters.'
        );
        setReferenceOptionsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    const schoolId = parseOptionalId(submittedFilters.schoolId);
    const departmentId = parseOptionalId(submittedFilters.departmentId);

    searchAcademicSchools({
      schoolId,
      departmentId,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((results) => {
        setPageState(
          results.length === 0 ? { status: 'empty', results } : { status: 'success', results }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic schools.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [submittedFilters, sortBy, sortDirection]);

  const tableData =
    pageState.status === 'success' || pageState.status === 'empty'
      ? pageState.results
      : emptyAcademicSchoolSearchResults;

  const academicSchoolSearchTable = useReactTable({
    columns: academicSchoolSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) =>
      `${row.schoolId}-${row.departmentId ?? 'no-department'}-${index}`,
    state: {
      columnVisibility: {
        schoolActive: resultsView === 'system',
        departmentActive: resultsView === 'system',
      },
    },
  });

  function handleToggleSort(nextSortBy: AcademicSchoolSearchSortBy) {
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
    setSubmittedFilters(initialAcademicSchoolSearchFilters);
  }

  const visibleDepartmentOptions =
    form.values.schoolId.trim() === ''
      ? departmentOptions
      : departmentOptions.filter(
          (option) => option.schoolId === Number(form.values.schoolId)
        );

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg">
          <Stack gap="lg">
            <Title order={1}>School Search</Title>

            <form
              onSubmit={form.onSubmit((values) => {
                setSubmittedFilters({ ...values });
              })}
            >
              <Stack gap="lg">
                <SearchFormSection legend="Search Filters">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      clearable
                      searchable
                      label="Academic School"
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
                          return;
                        }
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      clearable
                      searchable
                      label="Academic Department"
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
                </SearchFormSection>

                <SearchFormActions
                  showQueryControls={false}
                  clearLabel="Clear"
                  submitLabel="Search Academic Schools"
                  isSubmitting={pageState.status === 'loading'}
                  onClear={handleClear}
                />
              </Stack>
            </form>
          </Stack>
        </Paper>

        <SearchResultsPanel
          status={pageState.status}
          summary={getResultsSummary(pageState)}
          table={academicSchoolSearchTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          viewOptions={academicSchoolResultsViewOptions}
          view={resultsView}
          onViewChange={setResultsView}
          notice={{
            idleTitle: '',
            idleMessage: '',
            loadingMessage: 'Loading academic school search results...',
            errorTitle: 'Unable to load academic school search results',
            errorMessage: pageState.status === 'error' ? pageState.message : null,
            emptyTitle: 'No academic school search results found',
            emptyMessage: 'Try again after academic schools and departments are configured.',
          }}
        />
      </Stack>
    </Container>
  );
}
