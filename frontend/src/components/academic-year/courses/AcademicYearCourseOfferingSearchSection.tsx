// Search/results surface for academic-year course offerings.
// Supports year-wide browsing plus sub-term locked searches that can drive the real section workspace.
import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import { searchAcademicYearCourseOfferings } from '@/services/admin-courses-service';
import { getCourseSearchReferenceOptions } from '@/services/reference-service';
import type {
  AcademicYearCourseOfferingSearchResponse,
  AcademicYearCourseOfferingSearchResultResponse,
} from '@/services/schemas/admin-courses-schemas';
import type { CourseSearchReferenceOptionsResponse } from '@/services/schemas/reference-schemas';
import {
  initialCourseSectionSearchValues,
  type CourseSectionSearchValues,
} from './CourseSectionsWorkspace';
import { getErrorMessage, type CourseTermOption } from './academicYearCoursesShared';

type YearOfferingSearchSortBy =
  | 'schoolName'
  | 'departmentName'
  | 'subjectCode'
  | 'courseCode'
  | 'title';

type YearOfferingSearchSortDirection = 'asc' | 'desc';
type YearOfferingResultsView = 'standard' | 'system';

type YearOfferingSearchFormValues = {
  subTermId: string | null;
  schoolId: string | null;
  departmentId: string | null;
  subjectId: string | null;
  courseCode: string;
  title: string;
};

type YearOfferingReferenceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; options: CourseSearchReferenceOptionsResponse };

type YearOfferingSearchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: AcademicYearCourseOfferingSearchResponse };

type AcademicYearCourseOfferingSearchSectionProps = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  termOptions: ReadonlyArray<CourseTermOption>;
  reloadKey: number;
  initialSubTermId?: string | null;
  lockSubTermFilter?: boolean;
  onOfferingSelected?: (offering: AcademicYearCourseOfferingSearchResultResponse) => void;
  onViewSearchSections?: (
    offerings: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>
  ) => void;
  sectionSearchValues?: CourseSectionSearchValues;
  onSectionSearchValuesChange?: (values: CourseSectionSearchValues) => void;
};

function buildInitialYearOfferingSearchFormValues(
  initialSubTermId: string | null = null
): YearOfferingSearchFormValues {
  return {
    subTermId: initialSubTermId,
    schoolId: null,
    departmentId: null,
    subjectId: null,
    courseCode: '',
    title: '',
  };
}

const yearOfferingsPageSize = 25;
const emptyAcademicYearOfferingResults: AcademicYearCourseOfferingSearchResultResponse[] = [];
const yearOfferingResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: YearOfferingResultsView }>;

function getYearOfferingResultsSummary(state: YearOfferingSearchState): string {
  if (state.status === 'loading') {
    return 'Loading academic year offerings...';
  }

  if (state.status === 'error') {
    return 'Academic year offering search failed.';
  }

  if (state.response.totalElements === 0 || state.response.results.length === 0) {
    return 'No course offerings matched the current filters.';
  }

  const start = state.response.page * state.response.size + 1;
  const end = state.response.page * state.response.size + state.response.results.length;

  return `Showing ${start}-${end} of ${state.response.totalElements} offerings`;
}

function buildAcademicYearOfferingColumns(): ColumnDef<AcademicYearCourseOfferingSearchResultResponse>[] {
  return [
    {
      accessorKey: 'schoolName',
      header: 'School',
      size: 220,
      cell: ({ row }) => row.original.schoolName ?? '—',
      meta: { sortBy: 'schoolName' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'departmentName',
      header: 'Department',
      size: 220,
      cell: ({ row }) => row.original.departmentName ?? '—',
      meta: { sortBy: 'departmentName' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'subjectCode',
      header: 'Subject',
      size: 140,
      cell: ({ row }) => row.original.subjectCode ?? '—',
      meta: { sortBy: 'subjectCode' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'courseCode',
      header: 'Course',
      size: 180,
      cell: ({ row }) => row.original.courseCode ?? '—',
      meta: { sortBy: 'courseCode' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 320,
      cell: ({ row }) => row.original.title ?? '—',
      meta: { sortBy: 'title' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'subTerms',
      header: 'Terms',
      size: 220,
      cell: ({ row }) =>
        row.original.subTerms.length > 0
          ? row.original.subTerms.map((subTerm) => subTerm.code).join(', ')
          : 'N/A',
    },
  ];
}

export function AcademicYearCourseOfferingSearchSection({
  academicYearId,
  hasValidAcademicYearId,
  termOptions,
  reloadKey,
  initialSubTermId = null,
  lockSubTermFilter = false,
  onOfferingSelected,
  onViewSearchSections,
  sectionSearchValues,
  onSectionSearchValuesChange,
}: AcademicYearCourseOfferingSearchSectionProps) {
  const initialSearchValues = useMemo(
    () => buildInitialYearOfferingSearchFormValues(initialSubTermId),
    [initialSubTermId]
  );
  const [referenceState, setReferenceState] = useState<YearOfferingReferenceState>({
    status: 'loading',
  });
  const [searchValues, setSearchValues] =
    useState<YearOfferingSearchFormValues>(initialSearchValues);
  const [submittedSearchValues, setSubmittedSearchValues] =
    useState<YearOfferingSearchFormValues>(initialSearchValues);
  const [sortBy, setSortBy] = useState<YearOfferingSearchSortBy>('courseCode');
  const [sortDirection, setSortDirection] = useState<YearOfferingSearchSortDirection>('asc');
  const [resultsView, setResultsView] = useState<YearOfferingResultsView>('standard');
  const [page, setPage] = useState(0);
  const [searchState, setSearchState] = useState<YearOfferingSearchState>({ status: 'loading' });

  useEffect(() => {
    setPage(0);
    setSearchValues(initialSearchValues);
    setSubmittedSearchValues(initialSearchValues);
  }, [initialSearchValues]);

  useEffect(() => {
    let cancelled = false;
    setReferenceState({ status: 'loading' });

    getCourseSearchReferenceOptions()
      .then((options) => {
        if (cancelled) {
          return;
        }

        setReferenceState({ status: 'success', options });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course offering search filters.'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasValidAcademicYearId) {
      setSearchState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setSearchState({ status: 'loading' });

    searchAcademicYearCourseOfferings({
      academicYearId,
      subTermId: submittedSearchValues.subTermId
        ? Number(submittedSearchValues.subTermId)
        : undefined,
      schoolId: submittedSearchValues.schoolId ? Number(submittedSearchValues.schoolId) : undefined,
      departmentId: submittedSearchValues.departmentId
        ? Number(submittedSearchValues.departmentId)
        : undefined,
      subjectId: submittedSearchValues.subjectId
        ? Number(submittedSearchValues.subjectId)
        : undefined,
      courseCode: submittedSearchValues.courseCode,
      title: submittedSearchValues.title,
      page,
      size: yearOfferingsPageSize,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setSearchState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search academic year course offerings.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [
    academicYearId,
    hasValidAcademicYearId,
    page,
    reloadKey,
    sortBy,
    sortDirection,
    submittedSearchValues,
  ]);

  const referenceOptions = referenceState.status === 'success' ? referenceState.options : null;
  const schoolOptions = useMemo(
    () =>
      (referenceOptions?.schools ?? []).map((school) => ({
        value: String(school.id),
        label: `${school.name} (${school.code})`,
      })),
    [referenceOptions]
  );
  const departmentOptions = useMemo(
    () =>
      (referenceOptions?.departments ?? [])
        .filter(
          (department) =>
            !searchValues.schoolId || String(department.schoolId) === searchValues.schoolId
        )
        .map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.code})`,
        })),
    [referenceOptions, searchValues.schoolId]
  );
  const subjectOptions = useMemo(
    () =>
      (referenceOptions?.subjects ?? [])
        .filter(
          (subject) =>
            !searchValues.departmentId || String(subject.departmentId) === searchValues.departmentId
        )
        .map((subject) => ({
          value: String(subject.id),
          label: `${subject.name} (${subject.code})`,
        })),
    [referenceOptions, searchValues.departmentId]
  );
  const columns = useMemo(() => buildAcademicYearOfferingColumns(), []);
  const tableData =
    searchState.status === 'success'
      ? searchState.response.results
      : emptyAcademicYearOfferingResults;
  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseOfferingId),
    state: {
      columnVisibility: {
        subjectCode: resultsView === 'system',
        subTerms: !lockSubTermFilter,
      },
    },
  });
  const showSectionSearch = sectionSearchValues && onSectionSearchValuesChange;

  function handleSchoolChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      schoolId: value,
      departmentId: null,
      subjectId: null,
    }));
  }

  function handleDepartmentChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      departmentId: value,
      subjectId: null,
    }));
  }

  function handleSubjectChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      subjectId: value,
    }));
  }

  function handleSearch() {
    setPage(0);
    setSubmittedSearchValues({ ...searchValues });
  }

  function handleClearSearch() {
    setPage(0);
    setSearchValues(initialSearchValues);
    setSubmittedSearchValues(initialSearchValues);
    onSectionSearchValuesChange?.(initialCourseSectionSearchValues);
  }

  function handleToggleSort(nextSortBy: YearOfferingSearchSortBy) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(nextSortBy);
      setSortDirection('asc');
    }

    setPage(0);
  }

  function handleOfferingSelected(offering: AcademicYearCourseOfferingSearchResultResponse) {
    if (onOfferingSelected) {
      onOfferingSelected(offering);
    }
  }

  function handleViewSearchSections() {
    if (!onViewSearchSections) {
      return;
    }

    onViewSearchSections(tableData);
  }

  return (
    <>
      <Grid.Col span={12}>
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <Stack gap={2}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Academic Year Courses
                </Text>
                <Text fw={600}>Academic year course offerings</Text>
                <Text size="sm" c="dimmed">
                  Search the year-wide course offering list and filter it by school, department,
                  subject, course code, title, and assigned term.
                </Text>
              </Stack>
            </Group>

            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text size="sm" c="dimmed">
                This list pages through the year-scoped course offerings for this academic year.
              </Text>
              <Badge variant="light" color="blue">
                {yearOfferingsPageSize} per page
              </Badge>
            </Group>

            {referenceState.status === 'error' ? (
              <Alert color="red" title="Unable to load offering filters">
                {referenceState.message}
              </Alert>
            ) : null}

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Term"
                  placeholder="Filter by term"
                  data={termOptions}
                  value={searchValues.subTermId}
                  onChange={(value) => {
                    setSearchValues((current) => ({
                      ...current,
                      subTermId: value,
                    }));
                  }}
                  searchable
                  clearable={!lockSubTermFilter}
                  disabled={!hasValidAcademicYearId || lockSubTermFilter}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="School"
                  placeholder="Filter by school"
                  data={schoolOptions}
                  value={searchValues.schoolId}
                  onChange={handleSchoolChange}
                  searchable
                  clearable
                  disabled={referenceState.status !== 'success'}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Department"
                  placeholder="Filter by department"
                  data={departmentOptions}
                  value={searchValues.departmentId}
                  onChange={handleDepartmentChange}
                  searchable
                  clearable
                  disabled={referenceState.status !== 'success'}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Subject"
                  placeholder="Filter by subject"
                  data={subjectOptions}
                  value={searchValues.subjectId}
                  onChange={handleSubjectChange}
                  searchable
                  clearable
                  disabled={referenceState.status !== 'success'}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Course Code"
                  placeholder="Filter by course code"
                  value={searchValues.courseCode}
                  onChange={(event) => {
                    setSearchValues((current) => ({
                      ...current,
                      courseCode: event.currentTarget.value,
                    }));
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <TextInput
                  label="Title"
                  placeholder="Filter by title"
                  value={searchValues.title}
                  onChange={(event) => {
                    setSearchValues((current) => ({
                      ...current,
                      title: event.currentTarget.value,
                    }));
                  }}
                />
              </Grid.Col>
              {showSectionSearch ? (
                <Grid.Col span={12}>
                  <Stack gap="sm">
                    <Stack gap={2}>
                      <Text fw={600}>Course section filters</Text>
                      <Text size="sm" c="dimmed">
                        These filters apply when viewing sections for the current offering results.
                      </Text>
                    </Stack>
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <TextInput
                          label="Section"
                          placeholder="01"
                          value={sectionSearchValues.sectionCode}
                          onChange={(event) => {
                            onSectionSearchValuesChange({
                              ...sectionSearchValues,
                              sectionCode: event.currentTarget.value,
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <TextInput
                          label="Instructor"
                          placeholder="Filter by instructor"
                          value={sectionSearchValues.instructor}
                          onChange={(event) => {
                            onSectionSearchValuesChange({
                              ...sectionSearchValues,
                              instructor: event.currentTarget.value,
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <TextInput
                          label="Meeting Pattern"
                          placeholder="Filter by meeting pattern"
                          value={sectionSearchValues.meetingPattern}
                          onChange={(event) => {
                            onSectionSearchValuesChange({
                              ...sectionSearchValues,
                              meetingPattern: event.currentTarget.value,
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <TextInput
                          label="Room"
                          placeholder="Room"
                          value={sectionSearchValues.room}
                          onChange={(event) => {
                            onSectionSearchValuesChange({
                              ...sectionSearchValues,
                              room: event.currentTarget.value,
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                          label="Status"
                          placeholder="Any status"
                          data={[
                            { value: 'Draft', label: 'Draft' },
                            { value: 'Open', label: 'Open' },
                            { value: 'Closed', label: 'Closed' },
                          ]}
                          value={sectionSearchValues.status}
                          onChange={(value) => {
                            onSectionSearchValuesChange({
                              ...sectionSearchValues,
                              status: value,
                            });
                          }}
                          clearable
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Grid.Col>
              ) : null}
              <Grid.Col span={12}>
                <Group justify="flex-end" align="center" wrap="wrap">
                  <Button variant="default" onClick={handleClearSearch}>
                    Clear filters
                  </Button>
                  <Button onClick={handleSearch} loading={searchState.status === 'loading'}>
                    Search offerings
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>

            {searchState.status === 'error' ? (
              <Alert color="red" title="Unable to load academic year offerings">
                {searchState.message}
              </Alert>
            ) : null}

            {searchState.status === 'loading' ? (
              <Alert color="blue" title="Loading academic year offerings">
                Fetching the paged course offering list for this academic year.
              </Alert>
            ) : null}

            {searchState.status === 'success' && searchState.response.results.length === 0 ? (
              <Alert color="gray" title="No offerings match these filters">
                No course offerings were found for the selected academic year filters.
              </Alert>
            ) : null}

            {searchState.status === 'success' && searchState.response.results.length > 0 ? (
              <>
                <SearchResultsHeader
                  data={yearOfferingResultsViewOptions}
                  value={resultsView}
                  onChange={setResultsView}
                  summary={getYearOfferingResultsSummary(searchState)}
                />

                <SearchResultsTable
                  table={table}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onToggleSort={handleToggleSort}
                  getRowProps={
                    onOfferingSelected
                      ? (row) => ({
                          tabIndex: 0,
                          onClick: () => {
                            handleOfferingSelected(row.original);
                          },
                          onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleOfferingSelected(row.original);
                            }
                          },
                        })
                      : undefined
                  }
                />

                <SearchPaginationFooter
                  page={searchState.response.page}
                  totalPages={searchState.response.totalPages}
                  onPageChange={setPage}
                />

                <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    {searchState.response.totalElements} offerings found, limited to{' '}
                    {searchState.response.size} rows per page.
                  </Text>
                  {onViewSearchSections ? (
                    <Button variant="light" onClick={handleViewSearchSections}>
                      View offering sections
                    </Button>
                  ) : null}
                </Group>
              </>
            ) : null}
          </Stack>
        </Paper>
      </Grid.Col>
    </>
  );
}
