import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Badge,
  Container,
  Grid,
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
  teachingScheduleMock,
  teachingScheduleSearchResultsMock,
  type TeachingScheduleSearchResult,
} from '@/components/teaching-schedule/teachingSchedule.mock';

type TeachingScheduleSearchFilters = {
  academicYearName: string;
  departmentName: string;
  instructorQuery: string;
  meetingType: string;
  schoolName: string;
  subTermName: string;
  termName: string;
};

type TeachingScheduleSearchSortBy =
  | 'academicYear'
  | 'department'
  | 'instructor'
  | 'meetingType'
  | 'sections'
  | 'subTerm'
  | 'term'
  | 'weeklyMeetings';

type TeachingScheduleSearchSortDirection = 'asc' | 'desc';
type TeachingScheduleSearchPageSize = '25' | '50' | '100';
type TeachingScheduleSearchState =
  | { status: 'idle' }
  | { status: 'success'; results: TeachingScheduleSearchResult[] };

const initialFilters: TeachingScheduleSearchFilters = {
  academicYearName: teachingScheduleMock.selectedAcademicYearName,
  departmentName: '',
  instructorQuery: '',
  meetingType: '',
  schoolName: '',
  subTermName: '',
  termName: '',
};

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<TeachingScheduleSearchPageSize>>;

const sortByOptions = [
  { value: 'instructor', label: 'Instructor' },
  { value: 'academicYear', label: 'Year' },
  { value: 'term', label: 'Term' },
  { value: 'subTerm', label: 'Subterm' },
  { value: 'department', label: 'Department' },
  { value: 'meetingType', label: 'Type' },
  { value: 'sections', label: 'Sections' },
  { value: 'weeklyMeetings', label: 'Meetings' },
] satisfies ReadonlyArray<StringOption<TeachingScheduleSearchSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<TeachingScheduleSearchSortDirection>>;

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).sort((first, second) =>
    first.localeCompare(second, undefined, { sensitivity: 'base' })
  );
}

function matchesText(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function filterTeachingSchedules(
  schedules: TeachingScheduleSearchResult[],
  filters: TeachingScheduleSearchFilters
) {
  return schedules.filter((schedule) => {
    if (filters.academicYearName && schedule.academicYearName !== filters.academicYearName) {
      return false;
    }

    if (filters.termName && schedule.termName !== filters.termName) {
      return false;
    }

    if (filters.subTermName && schedule.subTermName !== filters.subTermName) {
      return false;
    }

    if (filters.schoolName && schedule.schoolName !== filters.schoolName) {
      return false;
    }

    if (filters.departmentName && schedule.departmentName !== filters.departmentName) {
      return false;
    }

    if (filters.meetingType && schedule.meetingType !== filters.meetingType) {
      return false;
    }

    if (filters.instructorQuery.trim()) {
      return matchesText(
        `${schedule.instructorName} ${schedule.instructorEmail}`,
        filters.instructorQuery
      );
    }

    return true;
  });
}

function compareText(firstValue: string, secondValue: string) {
  return firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' });
}

function sortTeachingSchedules(
  schedules: TeachingScheduleSearchResult[],
  sortBy: TeachingScheduleSearchSortBy,
  sortDirection: TeachingScheduleSearchSortDirection
) {
  const sortedSchedules = [...schedules].sort((firstSchedule, secondSchedule) => {
    if (sortBy === 'sections') {
      return firstSchedule.sectionCount - secondSchedule.sectionCount;
    }

    if (sortBy === 'weeklyMeetings') {
      return firstSchedule.weeklyMeetingCount - secondSchedule.weeklyMeetingCount;
    }

    if (sortBy === 'academicYear') {
      return compareText(firstSchedule.academicYearName, secondSchedule.academicYearName);
    }

    if (sortBy === 'term') {
      return compareText(firstSchedule.termName, secondSchedule.termName);
    }

    if (sortBy === 'subTerm') {
      return compareText(firstSchedule.subTermName, secondSchedule.subTermName);
    }

    if (sortBy === 'department') {
      return compareText(firstSchedule.departmentName, secondSchedule.departmentName);
    }

    if (sortBy === 'meetingType') {
      return compareText(firstSchedule.meetingType, secondSchedule.meetingType);
    }

    return compareText(firstSchedule.instructorName, secondSchedule.instructorName);
  });

  return sortDirection === 'asc' ? sortedSchedules : sortedSchedules.reverse();
}

const columns: ColumnDef<TeachingScheduleSearchResult>[] = [
  {
    id: 'instructor',
    header: 'Instructor',
    size: 260,
    meta: { sortBy: 'instructor' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.instructorName}</Text>
        <Text size="sm" c="dimmed">
          {row.original.instructorEmail}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'term',
    header: 'Term',
    size: 220,
    meta: { sortBy: 'term' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={4}>
        <Text fw={700}>{row.original.termName}</Text>
        <Badge variant="light">{row.original.academicYearName}</Badge>
      </Stack>
    ),
  },
  {
    id: 'subTerm',
    header: 'Subterm',
    size: 150,
    meta: { sortBy: 'subTerm' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => <Badge variant="light">{row.original.subTermName}</Badge>,
  },
  {
    id: 'department',
    header: 'Department',
    size: 260,
    meta: { sortBy: 'department' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text>{row.original.departmentName}</Text>
        <Text size="sm" c="dimmed">
          {row.original.schoolName}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'meetingType',
    header: 'Type',
    size: 160,
    meta: { sortBy: 'meetingType' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => <Badge variant="outline">{row.original.meetingType}</Badge>,
  },
  {
    id: 'sections',
    header: 'Sections',
    size: 130,
    meta: { sortBy: 'sections' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => row.original.sectionCount,
  },
  {
    id: 'weeklyMeetings',
    header: 'Meetings',
    size: 130,
    meta: { sortBy: 'weeklyMeetings' satisfies TeachingScheduleSearchSortBy },
    cell: ({ row }) => row.original.weeklyMeetingCount,
  },
];

function getResultsStatus(state: TeachingScheduleSearchState): SearchResultsStatus {
  if (state.status === 'idle') {
    return 'idle';
  }

  return state.results.length === 0 ? 'empty' : 'success';
}

function getResultsSummary(state: TeachingScheduleSearchState) {
  if (state.status === 'idle') {
    return 'Search instructor teaching schedules.';
  }

  if (state.results.length === 0) {
    return 'No teaching schedules matched the current filters.';
  }

  return `Showing ${state.results.length} teaching schedules`;
}

export function TeachingScheduleSearchPage() {
  const navigate = useNavigate();
  const form = useForm<TeachingScheduleSearchFilters>({ initialValues: initialFilters });
  const [resultsState, setResultsState] = useState<TeachingScheduleSearchState>({ status: 'idle' });
  const [pageSize, setPageSize] = useState<TeachingScheduleSearchPageSize>('25');
  const [sortBy, setSortBy] = useState<TeachingScheduleSearchSortBy>('instructor');
  const [sortDirection, setSortDirection] = useState<TeachingScheduleSearchSortDirection>('asc');

  const academicYearOptions = teachingScheduleMock.academicYears;
  const termOptions = useMemo(() => {
    return uniqueOptions(
      teachingScheduleSearchResultsMock
        .filter(
          (schedule) =>
            !form.values.academicYearName ||
            schedule.academicYearName === form.values.academicYearName
        )
        .map((schedule) => schedule.termName)
    );
  }, [form.values.academicYearName]);
  const subTermOptions = useMemo(() => {
    return uniqueOptions(
      teachingScheduleSearchResultsMock
        .filter(
          (schedule) =>
            (!form.values.academicYearName ||
              schedule.academicYearName === form.values.academicYearName) &&
            (!form.values.termName || schedule.termName === form.values.termName)
        )
        .map((schedule) => schedule.subTermName)
    );
  }, [form.values.academicYearName, form.values.termName]);
  const schoolOptions = uniqueOptions(
    teachingScheduleSearchResultsMock.map((schedule) => schedule.schoolName)
  );
  const departmentOptions = useMemo(() => {
    return uniqueOptions(
      teachingScheduleSearchResultsMock
        .filter(
          (schedule) => !form.values.schoolName || schedule.schoolName === form.values.schoolName
        )
        .map((schedule) => schedule.departmentName)
    );
  }, [form.values.schoolName]);
  const meetingTypeOptions = uniqueOptions(
    teachingScheduleSearchResultsMock.map((schedule) => schedule.meetingType)
  );
  const sortedResults = useMemo(() => {
    return resultsState.status === 'success'
      ? sortTeachingSchedules(resultsState.results, sortBy, sortDirection)
      : [];
  }, [resultsState, sortBy, sortDirection]);
  const table = useReactTable({
    columns,
    data: sortedResults.slice(0, Number(pageSize)),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.scheduleId),
  });

  function handleToggleSort(nextSortBy: TeachingScheduleSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleClear() {
    form.setValues(initialFilters);
    setResultsState({ status: 'idle' });
    setPageSize('25');
    setSortBy('instructor');
    setSortDirection('asc');
  }

  function getRowProps(row: Row<TeachingScheduleSearchResult>): SearchResultsTableRowProps {
    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => navigate(`/calendar/instructor-schedules/${row.original.scheduleId}`),
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/calendar/instructor-schedules/${row.original.scheduleId}`);
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
              setResultsState({
                status: 'success',
                results: filterTeachingSchedules(teachingScheduleSearchResultsMock, values),
              });
            })}
          >
            <Stack gap="lg">
              <Text fw={700} fz="xl">
                Instructor Schedule Search
              </Text>

              <SearchFormSection legend="Schedule Filters">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Autocomplete
                    label="Academic Year"
                    data={academicYearOptions}
                    {...form.getInputProps('academicYearName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Term"
                    data={termOptions}
                    placeholder="All terms"
                    clearable
                    {...form.getInputProps('termName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Subterm"
                    data={subTermOptions}
                    placeholder="All subterms"
                    clearable
                    {...form.getInputProps('subTermName')}
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
                  <Select
                    label="School"
                    data={schoolOptions}
                    placeholder="All schools"
                    clearable
                    {...form.getInputProps('schoolName')}
                    onChange={(value) => {
                      form.setFieldValue('schoolName', value ?? '');
                      form.setFieldValue('departmentName', '');
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Department"
                    data={departmentOptions}
                    placeholder="All departments"
                    clearable
                    {...form.getInputProps('departmentName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Meeting Type"
                    data={meetingTypeOptions}
                    placeholder="All types"
                    clearable
                    {...form.getInputProps('meetingType')}
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
                onClear={handleClear}
                onSizeChange={(value) => {
                  if (value) {
                    setPageSize(value as TeachingScheduleSearchPageSize);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as TeachingScheduleSearchSortBy);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as TeachingScheduleSearchSortDirection);
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
            emptyTitle: 'No teaching schedules found',
            emptyMessage: 'No schedules matched the current filters.',
          }}
          getRowProps={getRowProps}
          withBorder
        />
      </Stack>
    </Container>
  );
}
