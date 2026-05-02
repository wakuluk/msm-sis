import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Container, Paper, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { StudentSearchForm } from '@/components/student/StudentSearchForm';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import {
  getStudentReferenceOptions,
  mapReferenceOptionsToSelectOptions,
} from '@/services/reference-service';
import {
  defaultStudentSearchSize,
  defaultStudentSortBy,
  defaultStudentSortDirection,
  parseStudentSearchSize,
  parseStudentSortBy,
  parseStudentSortDirection,
  searchStudents,
  type StudentSearchSize,
} from '@/services/student-service';
import {
  initialStudentSearchFilters,
  studentSearchFilterKeys,
  type StudentSearchFilters,
  type StudentSearchResultResponse,
  type StudentSearchResponse,
  type StudentSortBy,
  type StudentSortDirection,
} from '@/services/schemas/student-schemas';
import { getErrorMessage } from '@/utils/errors';

const advancedSearchKeys: (keyof StudentSearchFilters)[] = [
  'genderId',
  'ethnicityId',
  'classStandingId',
  'updatedBy',
  'addressLine1',
  'addressLine2',
  'city',
  'stateRegion',
  'postalCode',
  'countryCode',
];

type StudentSearchPageState = {
  filters: StudentSearchFilters;
  hasSearched: boolean;
  page: number;
  size: StudentSearchSize;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
};

type StudentSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: StudentSearchResponse }
  | { status: 'success'; response: StudentSearchResponse };

type StudentResultsView = 'standard' | 'system';

const emptyStudentResults: StudentSearchResultResponse[] = [];
const standardResultsColumnVisibility = {
  updatedBy: false,
  lastUpdated: false,
  disabled: false,
};

function parseStudentSearchParams(searchParams: URLSearchParams): StudentSearchPageState {
  const filters: StudentSearchFilters = { ...initialStudentSearchFilters };

  studentSearchFilterKeys.forEach((key) => {
    filters[key] = searchParams.get(key) ?? initialStudentSearchFilters[key];
  });

  return {
    filters,
    hasSearched: searchParams.get('searched') === '1',
    page: parseStudentSearchPage(searchParams.get('page')),
    size: parseStudentSearchSize(searchParams.get('size')),
    sortBy: parseStudentSortBy(searchParams.get('sortBy')),
    sortDirection: parseStudentSortDirection(searchParams.get('sortDirection')),
  };
}

function buildStudentSearchParams({
  filters,
  hasSearched,
  page,
  size,
  sortBy,
  sortDirection,
}: StudentSearchPageState): URLSearchParams {
  const nextSearchParams = new URLSearchParams();

  studentSearchFilterKeys.forEach((key) => {
    const value = filters[key].trim();

    if (value) {
      nextSearchParams.set(key, value);
    }
  });

  if (hasSearched) {
    nextSearchParams.set('searched', '1');
  }

  if (page > 0) {
    nextSearchParams.set('page', String(page));
  }

  if (sortBy !== defaultStudentSortBy) {
    nextSearchParams.set('sortBy', sortBy);
  }

  if (sortDirection !== defaultStudentSortDirection) {
    nextSearchParams.set('sortDirection', sortDirection);
  }

  if (size !== defaultStudentSearchSize) {
    nextSearchParams.set('size', String(size));
  }

  return nextSearchParams;
}

function hasAdvancedSearchValues(values: StudentSearchFilters): boolean {
  return advancedSearchKeys.some((key) => values[key].trim() !== '');
}

function parseStudentSearchPage(value: string | null | undefined): number {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

function formatResultValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function getResultsSummary(response: StudentSearchResponse): string {
  if (response.totalElements === 0 || response.results.length === 0) {
    return 'No students matched the current search criteria.';
  }

  const start = response.page * response.size + 1;
  const end = response.page * response.size + response.results.length;

  return `Showing ${start}-${end} of ${response.totalElements} students`;
}

const studentResultsColumns: ColumnDef<StudentSearchResultResponse>[] = [
  {
    accessorKey: 'studentId',
    header: 'Student ID',
    size: 116,
    meta: { sortBy: 'studentId' satisfies StudentSortBy },
  },
  {
    accessorKey: 'lastName',
    header: 'Last name',
    size: 140,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'lastName' satisfies StudentSortBy },
  },
  {
    accessorKey: 'firstName',
    header: 'First name',
    size: 140,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'firstName' satisfies StudentSortBy },
  },
  {
    accessorKey: 'classOf',
    header: 'Class of',
    size: 112,
    cell: ({ getValue }) => formatResultValue(getValue<number | null>()),
    meta: { sortBy: 'classOf' satisfies StudentSortBy },
  },
  {
    accessorKey: 'city',
    header: 'City',
    size: 124,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'city' satisfies StudentSortBy },
  },
  {
    accessorKey: 'stateRegion',
    header: 'State / region',
    size: 152,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'stateRegion' satisfies StudentSortBy },
  },
  {
    accessorKey: 'updatedBy',
    header: 'Updated by',
    size: 148,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'updatedBy' satisfies StudentSortBy },
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Last updated',
    size: 168,
    cell: ({ getValue }) => formatResultValue(getValue<string | null>()),
    meta: { sortBy: 'lastUpdated' satisfies StudentSortBy },
  },
  {
    id: 'disabled',
    accessorFn: (student) => student.disabled,
    header: 'Disabled',
    size: 96,
    cell: ({ getValue }) => (getValue<boolean>() ? 'Yes' : 'No'),
  },
];

export function StudentSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsSnapshot = searchParams.toString();
  const searchParamValues = parseStudentSearchParams(new URLSearchParams(searchParamsSnapshot));
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(() =>
    hasAdvancedSearchValues(searchParamValues.filters)
  );
  const [size, setSize] = useState<StudentSearchSize>(searchParamValues.size);
  const [sortBy, setSortBy] = useState<StudentSortBy>(searchParamValues.sortBy);
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>(
    searchParamValues.sortDirection
  );
  const [searchResultsState, setSearchResultsState] = useState<StudentSearchResultsState>({
    status: searchParamValues.hasSearched ? 'loading' : 'idle',
  });
  const [resultsView, setResultsView] = useState<StudentResultsView>('standard');
  const [referenceOptionsError, setReferenceOptionsError] = useState<string | null>(null);
  const [studentFilterSelectOptions, setStudentFilterSelectOptions] = useState(() => ({
    classStandings: [] as Array<{ value: string; label: string }>,
    ethnicities: [] as Array<{ value: string; label: string }>,
    genders: [] as Array<{ value: string; label: string }>,
  }));

  const form = useForm<StudentSearchFilters>({
    initialValues: searchParamValues.filters,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const referenceOptions = await getStudentReferenceOptions();

        if (cancelled) {
          return;
        }

        setStudentFilterSelectOptions({
          classStandings: mapReferenceOptionsToSelectOptions(referenceOptions.classStandings),
          ethnicities: mapReferenceOptionsToSelectOptions(referenceOptions.ethnicities),
          genders: mapReferenceOptionsToSelectOptions(referenceOptions.genders),
        });
        setReferenceOptionsError(null);
      } catch (error) {
        if (!cancelled) {
          setReferenceOptionsError(getErrorMessage(error, 'Failed to load student reference options.'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextValues = parseStudentSearchParams(new URLSearchParams(searchParamsSnapshot));
    const abortController = new AbortController();

    form.setValues(nextValues.filters);
    setSize(nextValues.size);
    setSortBy(nextValues.sortBy);
    setSortDirection(nextValues.sortDirection);
    setShowAdvancedSearch(hasAdvancedSearchValues(nextValues.filters));

    if (!nextValues.hasSearched) {
      setSearchResultsState({ status: 'idle' });

      return () => {
        abortController.abort();
      };
    }

    setSearchResultsState({ status: 'loading' });

    void (async () => {
      try {
        const response = await searchStudents({
          filters: nextValues.filters,
          page: nextValues.page,
          size: nextValues.size,
          sortBy: nextValues.sortBy,
          sortDirection: nextValues.sortDirection,
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState(
          response.results.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState({ status: 'error', message: getErrorMessage(error, 'Failed to search students.') });
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [searchParamsSnapshot]);

  const isSearching = searchResultsState.status === 'loading';
  const tableData =
    searchResultsState.status === 'success'
      ? searchResultsState.response.results
      : emptyStudentResults;
  const tableColumnVisibility = resultsView === 'standard' ? standardResultsColumnVisibility : {};
  const studentResultsTable = useReactTable({
    columns: studentResultsColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.studentId),
    manualPagination: true,
    state: {
      columnVisibility: tableColumnVisibility,
    },
  });

  function applySearchParams(nextState: StudentSearchPageState) {
    setSearchParams(buildStudentSearchParams(nextState));
  }

  function toggleColumnSort(nextSortBy: StudentSortBy) {
    applySearchParams({
      ...searchParamValues,
      page: 0,
      sortBy: nextSortBy,
      sortDirection:
        searchParamValues.sortBy === nextSortBy && searchParamValues.sortDirection === 'asc'
          ? 'desc'
          : 'asc',
    });
  }

  function openStudentDetail(studentId: number) {
    navigate(`/students/${studentId}`, {
      state: {
        fromSearch: `${location.pathname}${location.search}`,
      },
    });
  }

  function handleSubmit(values: StudentSearchFilters) {
    applySearchParams({
      filters: values,
      hasSearched: true,
      page: 0,
      size,
      sortBy,
      sortDirection,
    });
  }

  function handleClear() {
    form.setValues(initialStudentSearchFilters);
    setSize(defaultStudentSearchSize);
    setSortBy(defaultStudentSortBy);
    setSortDirection(defaultStudentSortDirection);
    setSearchParams(new URLSearchParams());
    setShowAdvancedSearch(false);
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <StudentSearchForm
          form={form}
          showAdvancedSearch={showAdvancedSearch}
          isSearching={isSearching}
          size={size}
          sortBy={sortBy}
          sortDirection={sortDirection}
          studentFilterSelectOptions={studentFilterSelectOptions}
          referenceOptionsError={referenceOptionsError}
          onPageSizeChange={setSize}
          onSortByChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onToggleAdvancedSearch={() => {
            setShowAdvancedSearch((current) => !current);
          }}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />

        <SearchResultsPanel
          title="Results"
          status={searchResultsState.status}
          summary={
            searchResultsState.status === 'empty' || searchResultsState.status === 'success'
              ? getResultsSummary(searchResultsState.response)
              : ''
          }
          table={studentResultsTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={toggleColumnSort}
          showHeader={searchResultsState.status === 'empty' || searchResultsState.status === 'success'}
          viewOptions={[
            { label: 'Standard', value: 'standard' },
            { label: 'System', value: 'system' },
          ]}
          view={resultsView}
          onViewChange={(value) => {
            setResultsView(value as StudentResultsView);
          }}
          notice={{
            idleTitle: 'Search students',
            idleMessage: 'Enter filters if needed, then click `Search Students` to load results.',
            loadingMessage: 'Loading students...',
            errorMessage: searchResultsState.status === 'error' ? searchResultsState.message : null,
            emptyTitle: 'No students found',
            emptyMessage: 'No students matched the current search criteria.',
          }}
          getRowProps={(row) => ({
            role: 'link',
            tabIndex: 0,
            onClick: () => {
              openStudentDetail(row.original.studentId);
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openStudentDetail(row.original.studentId);
              }
            },
          })}
          pagination={
            searchResultsState.status === 'success'
              ? {
                  page: searchResultsState.response.page,
                  totalPages: searchResultsState.response.totalPages,
                  onPageChange: (nextPage) => {
                    applySearchParams({
                      ...searchParamValues,
                      page: nextPage,
                    });
                  },
                }
              : null
          }
        />
      </Stack>
    </Container>
  );
}
