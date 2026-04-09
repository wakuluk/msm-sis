import { useEffect, useState } from 'react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Box,
  Button,
  Center,
  Collapse,
  Container,
  Fieldset,
  Grid,
  Group,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  studentSearchSizeSelectOptions,
  studentSortByOptions,
  studentSortDirectionOptions,
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
import classes from './StudentSearch.module.css';

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
const studentClassOfSelectOptions = Array.from({ length: 41 }, (_, index) => {
  const year = String(new Date().getFullYear() + 10 - index);

  return {
    value: year,
    label: year,
  };
});

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to search students.';
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

function getSortIndicator(
  activeSortBy: StudentSortBy,
  activeSortDirection: StudentSortDirection,
  columnSortBy: StudentSortBy
): string | null {
  if (activeSortBy !== columnSortBy) {
    return null;
  }

  return activeSortDirection === 'asc' ? '↑' : '↓';
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
          setReferenceOptionsError(getErrorMessage(error));
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

        setSearchResultsState({ status: 'error', message: getErrorMessage(error) });
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

  const queryControlStyles = {
    label: { display: 'block', width: '100%', textAlign: 'right' as const },
  };

  const renderQueryControls = (variant: 'header' | 'toolbar') => (
    <>
      <Box miw={130} maw={150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={studentSearchSizeSelectOptions}
          value={String(size)}
          label={variant === 'header' ? 'Page size' : undefined}
          placeholder={variant === 'toolbar' ? 'Page size' : undefined}
          aria-label="Page size"
          styles={queryControlStyles}
          onChange={(value) => {
            setSize(parseStudentSearchSize(value));
          }}
        />
      </Box>
      <Box miw={130} maw={150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={studentSortByOptions}
          value={sortBy}
          label={variant === 'header' ? 'Sort by' : undefined}
          placeholder={variant === 'toolbar' ? 'Sort by' : undefined}
          aria-label="Sort by"
          styles={queryControlStyles}
          onChange={(value) => {
            setSortBy(parseStudentSortBy(value));
          }}
        />
      </Box>
      <Box miw={130} maw={150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={studentSortDirectionOptions}
          value={sortDirection}
          label={variant === 'header' ? 'Order' : undefined}
          placeholder={variant === 'toolbar' ? 'Order' : undefined}
          aria-label="Order"
          styles={queryControlStyles}
          onChange={(value) => {
            setSortDirection(parseStudentSortDirection(value));
          }}
        />
      </Box>
    </>
  );

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg">
          <Stack gap="xl">
            <form
              onSubmit={form.onSubmit((values) => {
                applySearchParams({
                  filters: values,
                  hasSearched: true,
                  page: 0,
                  size,
                  sortBy,
                  sortDirection,
                });
              })}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                  <Group align="flex-end" gap="sm" wrap="wrap">
                    <Title order={1}>Student Search</Title>
                    <Button component={Link} to="/students/new" variant="light">
                      Create student
                    </Button>
                  </Group>
                  <Group align="flex-end" gap="md" wrap="wrap">
                    {renderQueryControls('header')}
                  </Group>
                </Group>

                <Fieldset legend="Core Filters" radius="sm">
                  <Grid gap="md" mt="xs">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Last name"
                        placeholder="Enter a last name"
                        {...form.getInputProps('lastName')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="First name"
                        placeholder="Enter a first name"
                        {...form.getInputProps('firstName')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Student ID"
                        placeholder="Enter a student ID"
                        inputMode="numeric"
                        {...form.getInputProps('studentId')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        searchable
                        clearable
                        label="Class of"
                        placeholder="Select a graduation year"
                        data={studentClassOfSelectOptions}
                        value={form.values.classOf || null}
                        onChange={(value) => {
                          form.setFieldValue('classOf', value ?? '');
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Fieldset>

                <Group justify="space-between" align="center">
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => {
                      setShowAdvancedSearch((current) => !current);
                    }}
                  >
                    {showAdvancedSearch ? 'Hide Advanced Search' : 'Advanced Search'}
                  </Button>
                  <Group>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        form.setValues(initialStudentSearchFilters);
                        setSize(defaultStudentSearchSize);
                        setSortBy(defaultStudentSortBy);
                        setSortDirection(defaultStudentSortDirection);
                        setSearchParams(new URLSearchParams());
                        setShowAdvancedSearch(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button type="submit" loading={isSearching}>
                      Search Students
                    </Button>
                  </Group>
                </Group>

                <Collapse expanded={showAdvancedSearch}>
                  <Stack gap="lg" pt="xs">
                    <Fieldset legend="Student Filters" radius="sm">
                      <Grid gap="md" mt="xs">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            searchable
                            clearable
                            label="Gender"
                            placeholder="Select a gender"
                            data={studentFilterSelectOptions.genders}
                            value={form.values.genderId || null}
                            onChange={(value) => {
                              form.setFieldValue('genderId', value ?? '');
                            }}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            searchable
                            clearable
                            label="Ethnicity"
                            placeholder="Select an ethnicity"
                            data={studentFilterSelectOptions.ethnicities}
                            value={form.values.ethnicityId || null}
                            onChange={(value) => {
                              form.setFieldValue('ethnicityId', value ?? '');
                            }}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            searchable
                            clearable
                            label="Class standing"
                            placeholder="Select a class standing"
                            data={studentFilterSelectOptions.classStandings}
                            value={form.values.classStandingId || null}
                            onChange={(value) => {
                              form.setFieldValue('classStandingId', value ?? '');
                            }}
                          />
                        </Grid.Col>
                      </Grid>
                    </Fieldset>

                    {referenceOptionsError ? (
                      <Alert color="red" title="Unable to load student filter options">
                        {referenceOptionsError}
                      </Alert>
                    ) : null}

                    <Fieldset legend="Address Filters" radius="sm">
                      <Grid gap="md" mt="xs">
                        <Grid.Col span={12}>
                          <TextInput
                            label="Address line 1"
                            placeholder="Enter address line 1"
                            {...form.getInputProps('addressLine1')}
                          />
                        </Grid.Col>
                        <Grid.Col span={12}>
                          <TextInput
                            label="Address line 2"
                            placeholder="Enter address line 2"
                            {...form.getInputProps('addressLine2')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="City"
                            placeholder="Enter a city"
                            {...form.getInputProps('city')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput
                            label="State / region"
                            placeholder="Enter a state or region"
                            {...form.getInputProps('stateRegion')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput
                            label="Postal code"
                            placeholder="Enter a postal code"
                            {...form.getInputProps('postalCode')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput
                            label="Country code"
                            placeholder="Enter a country code"
                            {...form.getInputProps('countryCode')}
                          />
                        </Grid.Col>
                      </Grid>
                    </Fieldset>

                    <Fieldset legend="System Filters" radius="sm">
                      <Grid gap="md" mt="xs">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="Updated by"
                            placeholder="Enter an updated by value"
                            {...form.getInputProps('updatedBy')}
                          />
                        </Grid.Col>
                      </Grid>
                    </Fieldset>

                    <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                      <Button
                        type="button"
                        variant="light"
                        onClick={() => {
                          setShowAdvancedSearch((current) => !current);
                        }}
                      >
                        {showAdvancedSearch ? 'Hide Advanced Search' : 'Advanced Search'}
                      </Button>
                      <Group align="flex-end" gap="md" wrap="wrap">
                        {renderQueryControls('toolbar')}
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => {
                            form.setValues(initialStudentSearchFilters);
                            setSize(defaultStudentSearchSize);
                            setSortBy(defaultStudentSortBy);
                            setSortDirection(defaultStudentSortDirection);
                            setSearchParams(new URLSearchParams());
                            setShowAdvancedSearch(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button type="submit" loading={isSearching}>
                          Search Students
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                </Collapse>
              </Stack>
            </form>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Stack gap="md">
            <Title order={3}>Results</Title>

            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              {searchResultsState.status === 'empty' || searchResultsState.status === 'success' ? (
                <Group align="center" wrap="wrap" gap="xs">
                  <SegmentedControl
                    classNames={{
                      root: classes.resultsViewToggle,
                      indicator: classes.resultsViewToggleIndicator,
                      label: classes.resultsViewToggleLabel,
                    }}
                    data={[
                      { label: 'Standard', value: 'standard' },
                      { label: 'System', value: 'system' },
                    ]}
                    value={resultsView}
                    onChange={(value) => {
                      setResultsView(value as StudentResultsView);
                    }}
                  />
                </Group>
              ) : (
                <div />
              )}
              {searchResultsState.status === 'empty' || searchResultsState.status === 'success' ? (
                <Text size="sm">{getResultsSummary(searchResultsState.response)}</Text>
              ) : null}
            </Group>

            {searchResultsState.status === 'idle' ? (
              <Alert color="gray" title="Search students">
                Enter filters if needed, then click `Search Students` to load results.
              </Alert>
            ) : null}

            {searchResultsState.status === 'loading' ? (
              <Center py="xl">
                <Stack align="center" gap="xs">
                  <Loader size="sm" />
                  <Text size="sm">Loading students...</Text>
                </Stack>
              </Center>
            ) : null}

            {searchResultsState.status === 'error' ? (
              <Alert color="red" title="Search failed">
                {searchResultsState.message}
              </Alert>
            ) : null}

            {searchResultsState.status === 'empty' ? (
              <Alert color="gray" title="No students found">
                No students matched the current search criteria.
              </Alert>
            ) : null}

            {searchResultsState.status === 'success' ? (
              <Stack gap="lg">
                <Box className={classes.resultsTableWrapper}>
                  <Table
                    className={classes.resultsTable}
                    style={{ minWidth: `${studentResultsTable.getTotalSize()}px` }}
                    horizontalSpacing="md"
                    verticalSpacing="sm"
                  >
                    <Table.Thead>
                      {studentResultsTable.getHeaderGroups().map((headerGroup) => (
                        <Table.Tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <Table.Th key={header.id} style={{ width: `${header.getSize()}px` }}>
                              {header.isPlaceholder
                                ? null
                                : (() => {
                                    const columnMeta = header.column.columnDef.meta as
                                      | { sortBy?: StudentSortBy }
                                      | undefined;
                                    const columnSortBy = columnMeta?.sortBy;
                                    const sortIndicator = columnSortBy
                                      ? getSortIndicator(sortBy, sortDirection, columnSortBy)
                                      : null;

                                    if (!columnSortBy) {
                                      return flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      );
                                    }

                                    return (
                                      <UnstyledButton
                                        className={classes.sortButton}
                                        onClick={() => {
                                          toggleColumnSort(columnSortBy);
                                        }}
                                      >
                                        <span>
                                          {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                          )}
                                        </span>
                                        <span
                                          className={
                                            sortIndicator
                                              ? `${classes.sortDirection} ${classes.sortDirectionActive}`
                                              : classes.sortDirection
                                          }
                                        >
                                          {sortIndicator ?? '↕'}
                                        </span>
                                      </UnstyledButton>
                                    );
                                  })()}
                            </Table.Th>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Thead>
                    <Table.Tbody>
                      {studentResultsTable.getRowModel().rows.map((row) => (
                        <Table.Tr
                          key={row.id}
                          className={classes.clickableRow}
                          role="link"
                          tabIndex={0}
                          onClick={() => {
                            openStudentDetail(row.original.studentId);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openStudentDetail(row.original.studentId);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Table.Td key={cell.id} style={{ width: `${cell.column.getSize()}px` }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Text size="sm">
                    Page {searchResultsState.response.page + 1} of{' '}
                    {searchResultsState.response.totalPages}
                  </Text>
                  <Pagination
                    hideWithOnePage
                    total={searchResultsState.response.totalPages}
                    value={searchResultsState.response.page + 1}
                    withEdges
                    onChange={(nextPage) => {
                      applySearchParams({
                        ...searchParamValues,
                        page: nextPage - 1,
                      });
                    }}
                  />
                </Group>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
