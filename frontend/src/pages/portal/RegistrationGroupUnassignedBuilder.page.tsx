import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
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
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { IconUserPlus } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import {
  bulkAddRegistrationGroupStudents,
  getRegistrationGroupReferenceOptions,
  searchRegistrationGroups,
  searchUnassignedRegistrationGroupStudents,
} from '@/services/registration-group-service';
import type {
  RegistrationGroupReferenceOptionsResponse,
  RegistrationGroupSearchResponse,
  RegistrationGroupSearchResultResponse,
  UnassignedRegistrationGroupStudentResponse,
  UnassignedRegistrationGroupStudentSearchResponse,
} from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';

type SortBy = 'academicDivision' | 'program' | 'student' | 'totalCredits';
type SortDirection = 'asc' | 'desc';
type PageSize = '10' | '25' | '50' | '100';

type SearchFilters = {
  academicYearId: string;
  termId: string;
};

type SearchState =
  | { status: 'idle' }
  | { status: 'success'; academicYearId: string; termId: string };

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupReferenceOptionsResponse }
  | { status: 'error'; message: string };

type TargetGroupsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupSearchResponse }
  | { status: 'error'; message: string };

type UnassignedStudentsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: UnassignedRegistrationGroupStudentSearchResponse }
  | { status: 'error'; message: string };

type AddStudentsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const initialFilters: SearchFilters = {
  academicYearId: '',
  termId: '',
};

const emptyTargetGroups: RegistrationGroupSearchResultResponse[] = [];
const emptyStudents: UnassignedRegistrationGroupStudentResponse[] = [];
const pageSizeOptions: { value: PageSize; label: string }[] = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
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

function displayNullable(value: string | null | undefined) {
  return value?.trim() ? value : '—';
}

function displayStudentName(student: UnassignedRegistrationGroupStudentResponse) {
  return displayNullable(student.displayName ?? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim());
}

function displayProgramNames(student: UnassignedRegistrationGroupStudentResponse) {
  return student.programNames.length > 0 ? student.programNames.join(', ') : '—';
}

function getResultsStatus(
  searchState: SearchState,
  unassignedStudentsState: UnassignedStudentsState,
  students: UnassignedRegistrationGroupStudentResponse[]
): SearchResultsStatus {
  if (searchState.status === 'idle') {
    return 'idle';
  }

  if (unassignedStudentsState.status === 'loading') {
    return 'loading';
  }

  if (unassignedStudentsState.status === 'error') {
    return 'error';
  }

  if (unassignedStudentsState.status !== 'success') {
    return 'loading';
  }

  return students.length > 0 ? 'success' : 'empty';
}

function getResultsSummary(
  searchState: SearchState,
  unassignedStudentsState: UnassignedStudentsState,
  searchedTermName: string | null | undefined
) {
  if (searchState.status === 'idle') {
    return 'Search a term to find students not assigned to a registration group.';
  }

  if (unassignedStudentsState.status === 'loading') {
    return 'Searching unassigned students...';
  }

  if (unassignedStudentsState.status === 'error') {
    return 'Unable to search unassigned students.';
  }

  if (unassignedStudentsState.status !== 'success') {
    return 'Search a term to find students not assigned to a registration group.';
  }

  if (unassignedStudentsState.response.page.totalElements === 0) {
    return `No unassigned students found for ${searchedTermName ?? 'the selected term'}.`;
  }

  const start = unassignedStudentsState.response.page.page * unassignedStudentsState.response.page.size + 1;
  const end =
    unassignedStudentsState.response.page.page * unassignedStudentsState.response.page.size +
    unassignedStudentsState.response.results.length;

  return `Showing ${start}-${end} of ${unassignedStudentsState.response.page.totalElements} unassigned students for ${
    searchedTermName ?? 'the selected term'
  }.`;
}

export function RegistrationGroupUnassignedBuilderPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [targetGroupsState, setTargetGroupsState] = useState<TargetGroupsState>({ status: 'idle' });
  const [unassignedStudentsState, setUnassignedStudentsState] = useState<UnassignedStudentsState>({
    status: 'idle',
  });
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });
  const [tableQuery, setTableQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>('25');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [addStudentsState, setAddStudentsState] = useState<AddStudentsState>({ status: 'idle' });
  const [sortBy, setSortBy] = useState<SortBy>('student');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const requestedAcademicYearId = searchParams.get('academicYearId') ?? '';
  const requestedTermId = searchParams.get('termId') ?? '';

  useEffect(() => {
    const abortController = new AbortController();
    setReferenceOptionsState({ status: 'loading' });

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({ status: 'success', response });
        setFilters((currentFilters) => {
          if (currentFilters.academicYearId || response.academicYears.length === 0) {
            return currentFilters;
          }

          const requestedAcademicYear = response.academicYears.find(
            (academicYear) => String(academicYear.id) === requestedAcademicYearId
          );
          const firstAcademicYear = requestedAcademicYear ?? response.academicYears[0];
          const requestedTerm = firstAcademicYear.terms.find(
            (term) => String(term.id) === requestedTermId
          );

          return {
            academicYearId: String(firstAcademicYear.id),
            termId: requestedTerm
              ? String(requestedTerm.id)
              : firstAcademicYear.terms[0]
                ? String(firstAcademicYear.terms[0].id)
                : '',
          };
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group reference options.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [requestedAcademicYearId, requestedTermId]);

  const searchedAcademicYearId =
    searchState.status === 'success' ? Number(searchState.academicYearId) : null;
  const searchedTermId = searchState.status === 'success' ? Number(searchState.termId) : null;

  useEffect(() => {
    if (searchState.status !== 'success' || !searchedAcademicYearId || !searchedTermId) {
      setUnassignedStudentsState({ status: 'idle' });
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => {
        setUnassignedStudentsState({ status: 'loading' });
        searchUnassignedRegistrationGroupStudents({
          academicYearId: searchedAcademicYearId,
          termId: searchedTermId,
          searchText: tableQuery,
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

            setUnassignedStudentsState({ status: 'success', response });
            setSelectedStudentIds((currentIds) => {
              const visibleIds = new Set(response.results.map((student) => student.studentId));
              return new Set([...currentIds].filter((studentId) => visibleIds.has(studentId)));
            });
          })
          .catch((error) => {
            if (abortController.signal.aborted) {
              return;
            }

            setUnassignedStudentsState({
              status: 'error',
              message: getErrorMessage(error, 'Failed to search unassigned students.'),
            });
          });
      },
      tableQuery.trim() ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [page, pageSize, searchState.status, searchedAcademicYearId, searchedTermId, sortBy, sortDirection, tableQuery]);

  const referenceOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.response : null;
  const academicYearOptions = referenceOptions?.academicYears.map(mapAcademicYearOption) ?? [];
  const selectedFilterAcademicYear = referenceOptions?.academicYears.find(
    (academicYear) => String(academicYear.id) === filters.academicYearId
  );
  const termOptions = selectedFilterAcademicYear?.terms.map(mapTermOption) ?? [];
  const searchedAcademicYear =
    searchState.status === 'success'
      ? referenceOptions?.academicYears.find(
          (academicYear) => String(academicYear.id) === searchState.academicYearId
        )
      : null;
  const searchedTerm =
    searchState.status === 'success'
      ? searchedAcademicYear?.terms.find((term) => String(term.id) === searchState.termId)
      : null;
  const targetGroups =
    targetGroupsState.status === 'success' ? targetGroupsState.response.results : emptyTargetGroups;
  const groupOptions = targetGroups.map((group) => ({
    value: String(group.registrationGroupId),
    label: `${group.name} (${groupCounts[String(group.registrationGroupId)] ?? group.studentCount} students)`,
  }));
  const selectedGroup =
    targetGroups.find((group) => String(group.registrationGroupId) === selectedGroupId) ?? null;
  const students =
    unassignedStudentsState.status === 'success' ? unassignedStudentsState.response.results : emptyStudents;
  const visibleStudents = students;
  const visibleStudentIds = visibleStudents.map((student) => student.studentId);
  const visibleSelectedStudentIds = visibleStudentIds.filter((studentId) =>
    selectedStudentIds.has(studentId)
  );
  const allVisibleSelected =
    visibleStudentIds.length > 0 && visibleSelectedStudentIds.length === visibleStudentIds.length;
  const someVisibleSelected = visibleSelectedStudentIds.length > 0 && !allVisibleSelected;

  const columns = useMemo<ColumnDef<UnassignedRegistrationGroupStudentResponse>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            aria-label="Select all visible students"
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setSelectedStudentIds((currentIds) => {
                const nextIds = new Set(currentIds);
                visibleStudentIds.forEach((studentId) => {
                  if (checked) {
                    nextIds.add(studentId);
                  } else {
                    nextIds.delete(studentId);
                  }
                });
                return nextIds;
              });
            }}
          />
        ),
        size: 80,
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${displayStudentName(row.original)}`}
            checked={selectedStudentIds.has(row.original.studentId)}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setSelectedStudentIds((currentIds) => {
                const nextIds = new Set(currentIds);
                if (checked) {
                  nextIds.add(row.original.studentId);
                } else {
                  nextIds.delete(row.original.studentId);
                }
                return nextIds;
              });
            }}
          />
        ),
      },
      {
        id: 'student',
        header: 'Student',
        size: 320,
        meta: { sortBy: 'student' satisfies SortBy },
        cell: ({ row }) => (
          <Stack gap={2}>
            <Text fw={700}>{displayStudentName(row.original)}</Text>
            <Text size="sm" c="dimmed">
              {displayNullable(row.original.studentNumber)} · {displayNullable(row.original.email)}
            </Text>
          </Stack>
        ),
      },
      {
        id: 'division',
        header: 'Division',
        size: 180,
        meta: { sortBy: 'academicDivision' satisfies SortBy },
        cell: ({ row }) => displayNullable(row.original.academicDivisionName),
      },
      {
        id: 'program',
        header: 'Program',
        size: 280,
        meta: { sortBy: 'program' satisfies SortBy },
        cell: ({ row }) => displayProgramNames(row.original),
      },
      {
        id: 'flags',
        header: 'Flags',
        size: 230,
        cell: ({ row }) => (
          <Group gap="xs">
            {row.original.honors ? <Badge variant="light">Honors</Badge> : null}
            {row.original.athleticSports.length > 0 ? (
              <Badge color="green" variant="light">
                Athlete
              </Badge>
            ) : null}
            {!row.original.honors && row.original.athleticSports.length === 0 ? (
              <Text c="dimmed">—</Text>
            ) : null}
          </Group>
        ),
      },
      {
        id: 'credits',
        header: 'Credits',
        size: 150,
        meta: { sortBy: 'totalCredits' satisfies SortBy },
        cell: ({ row }) => row.original.totalCredits,
      },
    ],
    [allVisibleSelected, selectedStudentIds, someVisibleSelected, visibleStudentIds]
  );

  const table = useReactTable({
    columns,
    data: visibleStudents,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.studentId),
  });

  const resultsStatus = getResultsStatus(searchState, unassignedStudentsState, visibleStudents);
  const resultsSummary = getResultsSummary(
    searchState,
    unassignedStudentsState,
    searchedTerm?.name
  );

  async function handleSearch() {
    if (!filters.academicYearId || !filters.termId) {
      return;
    }

    setSearchState({ status: 'success', academicYearId: filters.academicYearId, termId: filters.termId });
    setTargetGroupsState({ status: 'loading' });
    setSelectedGroupId('');
    setSelectedStudentIds(new Set());
    setTableQuery('');
    setPage(0);
    setAddStudentsState({ status: 'idle' });
    setGroupCounts({});

    try {
      const response = await searchRegistrationGroups({
        academicYearId: Number(filters.academicYearId),
        termId: Number(filters.termId),
        page: 0,
        size: 100,
        sortBy: 'registrationOpensAt',
        sortDirection: 'asc',
      });
      setTargetGroupsState({ status: 'success', response });
      setSelectedGroupId(response.results[0] ? String(response.results[0].registrationGroupId) : '');
      setGroupCounts(
        Object.fromEntries(
          response.results.map((group) => [String(group.registrationGroupId), group.studentCount])
        )
      );
    } catch (error) {
      setTargetGroupsState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to load target registration groups.'),
      });
    }
  }

  function handleToggleSort(nextSortBy: SortBy) {
    setPage(0);
    if (nextSortBy === sortBy) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  async function refetchUnassignedStudents() {
    if (searchState.status !== 'success') {
      return;
    }

    const response = await searchUnassignedRegistrationGroupStudents({
      academicYearId: Number(searchState.academicYearId),
      termId: Number(searchState.termId),
      searchText: tableQuery,
      page,
      size: Number(pageSize),
      sortBy,
      sortDirection,
    });
    setUnassignedStudentsState({ status: 'success', response });
  }

  async function handleAddSelectedStudents() {
    if (!selectedGroupId || selectedStudentIds.size === 0) {
      return;
    }

    const selectedIds = [...selectedStudentIds];
    setAddStudentsState({ status: 'loading' });

    try {
      const response = await bulkAddRegistrationGroupStudents({
        registrationGroupId: Number(selectedGroupId),
        request: { studentIds: selectedIds },
      });
      setGroupCounts((currentCounts) => ({
        ...currentCounts,
        [selectedGroupId]: (currentCounts[selectedGroupId] ?? 0) + response.assignedStudentCount,
      }));
      setSelectedStudentIds(new Set());
      await refetchUnassignedStudents();
      setAddStudentsState({
        status: 'success',
        message: `Added ${response.assignedStudentCount} student${
          response.assignedStudentCount === 1 ? '' : 's'
        } to ${response.registrationGroupName}.`,
      });
    } catch (error) {
      setAddStudentsState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add selected students to the registration group.'),
      });
    }
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
            <Title order={1}>Unassigned Registration Students</Title>
            <Text size="sm" c="dimmed">
              Search for students who are not in a registration group for a term, then add checked
              students to one saved group at a time.
            </Text>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="lg">
            {referenceOptionsState.status === 'error' ? (
              <Alert color="red" title="Unable to load filters">
                {referenceOptionsState.message}
              </Alert>
            ) : null}
            <SearchFormSection legend="Search Criteria">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  clearable={false}
                  data={academicYearOptions}
                  disabled={referenceOptionsState.status === 'loading'}
                  label="Academic Year"
                  value={filters.academicYearId}
                  onChange={(value) => {
                    if (!value) {
                      return;
                    }

                    const academicYear = referenceOptions?.academicYears.find(
                      (option) => String(option.id) === value
                    );
                    setFilters({
                      academicYearId: value,
                      termId: academicYear?.terms[0] ? String(academicYear.terms[0].id) : '',
                    });
                    setSearchState({ status: 'idle' });
                    setTargetGroupsState({ status: 'idle' });
                    setUnassignedStudentsState({ status: 'idle' });
                    setSelectedGroupId('');
                    setAddStudentsState({ status: 'idle' });
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  clearable={false}
                  data={termOptions}
                  disabled={referenceOptionsState.status === 'loading' || termOptions.length === 0}
                  label="Term"
                  value={filters.termId}
                  onChange={(value) => {
                    if (value) {
                      setFilters((currentFilters) => ({ ...currentFilters, termId: value }));
                      setSearchState({ status: 'idle' });
                      setTargetGroupsState({ status: 'idle' });
                      setUnassignedStudentsState({ status: 'idle' });
                      setSelectedGroupId('');
                      setAddStudentsState({ status: 'idle' });
                    }
                  }}
                />
              </Grid.Col>
            </SearchFormSection>

            <Group justify="flex-end">
              <Button
                disabled={!filters.academicYearId || !filters.termId}
                loading={targetGroupsState.status === 'loading'}
                onClick={() => {
                  void handleSearch();
                }}
              >
                Search Unassigned Students
              </Button>
            </Group>
          </Stack>
        </Paper>

        {addStudentsState.status === 'success' ? (
          <Alert color="green" title="Students added">
            {addStudentsState.message}
          </Alert>
        ) : null}

        {addStudentsState.status === 'error' ? (
          <Alert color="red" title="Unable to add students">
            {addStudentsState.message}
          </Alert>
        ) : null}

        <SearchResultsPanel
          status={resultsStatus}
          summary={resultsSummary}
          table={table}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          withBorder
          pagination={
            unassignedStudentsState.status === 'success' &&
            unassignedStudentsState.response.page.totalPages > 1
              ? {
                  page: unassignedStudentsState.response.page.page,
                  totalPages: unassignedStudentsState.response.page.totalPages,
                  onPageChange: setPage,
                }
              : null
          }
          headerContent={
            searchState.status === 'success' ? (
              <Stack gap="md">
                <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                  <Stack gap={2}>
                    <Text fw={700}>
                      {searchedAcademicYear?.name} · {searchedTerm?.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Select students below, choose a target group, then add them to remove them
                      from this cleanup list.
                    </Text>
                  </Stack>
                  <Badge
                    color={
                      unassignedStudentsState.status === 'success' &&
                      unassignedStudentsState.response.page.totalElements === 0
                        ? 'green'
                        : 'yellow'
                    }
                    variant="light"
                  >
                    {unassignedStudentsState.status === 'success'
                      ? `${unassignedStudentsState.response.page.totalElements} remaining`
                      : 'Searching'}
                  </Badge>
                </Group>
                {targetGroupsState.status === 'error' ? (
                  <Alert color="red" title="Unable to load target groups">
                    {targetGroupsState.message}
                  </Alert>
                ) : null}
                <Grid align="flex-end">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      clearable={false}
                      data={groupOptions}
                      label="Target Group"
                      placeholder="Choose group"
                      value={selectedGroupId}
                      onChange={(value) => {
                        setSelectedGroupId(value ?? '');
                        setAddStudentsState({ status: 'idle' });
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Search Table"
                      placeholder="Name, ID, email, or program"
                      value={tableQuery}
                      onChange={(event) => {
                        setTableQuery(event.currentTarget.value);
                        setPage(0);
                        setSelectedStudentIds(new Set());
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Select
                      clearable={false}
                      data={pageSizeOptions}
                      label="Page Size"
                      value={pageSize}
                      onChange={(value) => {
                        if (!value) {
                          return;
                        }

                        setPageSize(value as PageSize);
                        setPage(0);
                        setSelectedStudentIds(new Set());
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Button
                      fullWidth
                      leftSection={<IconUserPlus size={18} />}
                      disabled={!selectedGroupId || selectedStudentIds.size === 0}
                      loading={addStudentsState.status === 'loading'}
                      onClick={() => {
                        void handleAddSelectedStudents();
                      }}
                    >
                      Add to Group
                    </Button>
                  </Grid.Col>
                </Grid>
              </Stack>
            ) : null
          }
          notice={{
            idleTitle: 'Search unassigned students',
            idleMessage: 'Choose an academic year and term, then search for students not in a group.',
            loadingMessage: 'Searching unassigned students...',
            errorTitle: 'Unable to search students',
            errorMessage:
              unassignedStudentsState.status === 'error' ? unassignedStudentsState.message : null,
            emptyTitle: 'No unassigned students',
            emptyMessage: 'Everyone in this term is currently assigned, or the table filter is too narrow.',
          }}
          footerContent={
            searchState.status === 'success' && selectedStudentIds.size > 0 ? (
              <Text size="sm" c="dimmed">
                {selectedStudentIds.size} student{selectedStudentIds.size === 1 ? '' : 's'} selected.
              </Text>
            ) : null
          }
        />
      </Stack>
    </Container>
  );
}
