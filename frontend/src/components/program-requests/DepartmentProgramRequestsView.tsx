import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Grid, Group, Paper, Select, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import {
  normalizeDateInputValue,
  parseDateInputValue,
} from '@/components/academic-year/academicYearDisplay';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import {
  mapCodeNameReferenceOptionsToSelectOptions,
  mapReferenceOptionsToSelectOptions,
  getProgramReferenceOptions,
  getStudentReferenceOptions,
} from '@/services/reference-service';
import {
  getMyDepartmentProgramRequests,
  getProgramRequests,
} from '@/services/student-program-service';
import type {
  ProgramRequestDepartmentScopeResponse,
  StudentProgramRequestQueueResponse,
  StudentProgramRequestSummaryResponse,
} from '@/services/schemas/student-program-schemas';
import { getErrorMessage } from '@/utils/errors';
import {
  type ProgramRequestQueueResultsView,
  type ProgramRequestQueueSortBy,
  type ProgramRequestQueueSortDirection,
  useProgramRequestQueueTable,
} from './ProgramRequestQueueTable';
import { parseOptionalId } from '@/utils/form-values';

type DepartmentProgramRequestsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: StudentProgramRequestQueueResponse };

const departmentStatusOptions = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'DEPARTMENT_APPROVED', label: 'Department approved' },
  { value: 'ALL', label: 'All pending' },
];

type ProgramRequestSearchFilters = {
  classStandingId: string;
  degreeTypeId: string;
  programQuery: string;
  programTypeId: string;
  requestedFrom: string;
  requestedTo: string;
  schoolId: string;
  status: string;
  studentQuery: string;
};

type ProgramRequestReferenceState =
  | { status: 'loading' }
  | {
      status: 'success';
      classStandingOptions: Array<{ label: string; value: string }>;
      degreeTypeOptions: Array<{ label: string; value: string }>;
      programTypeOptions: Array<{ label: string; value: string }>;
      schoolOptions: Array<{ label: string; value: string }>;
    }
  | { status: 'error'; message: string };

const initialFilters: ProgramRequestSearchFilters = {
  classStandingId: '',
  degreeTypeId: '',
  programQuery: '',
  programTypeId: '',
  requestedFrom: '',
  requestedTo: '',
  schoolId: '',
  status: 'REQUESTED',
  studentQuery: '',
};

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<ProgramRequestPageSize>>;

type ProgramRequestPageSize = '25' | '50' | '100';

const sortByOptions = [
  { value: 'requestedAt', label: 'Requested' },
  { value: 'student', label: 'Student' },
  { value: 'program', label: 'Program' },
  { value: 'department', label: 'Department' },
  { value: 'classStanding', label: 'Class' },
  { value: 'status', label: 'Status' },
] satisfies ReadonlyArray<StringOption<ProgramRequestQueueSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<ProgramRequestQueueSortDirection>>;

const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: ProgramRequestQueueResultsView }>;

type ProgramRequestsViewScope = 'admin' | 'department';

type DepartmentProgramRequestsViewProps = {
  scope?: ProgramRequestsViewScope;
};

function getRequestResultsStatus(state: DepartmentProgramRequestsState): SearchResultsStatus {
  if (state.status === 'success') {
    return state.response.requests.length === 0 ? 'empty' : 'success';
  }

  return state.status;
}

function getRequestResultsSummary(state: DepartmentProgramRequestsState) {
  if (state.status === 'loading') {
    return 'Loading program requests...';
  }

  if (state.status === 'error') {
    return 'Program request search failed.';
  }

  if (state.response.page.totalElements === 0 || state.response.requests.length === 0) {
    return 'No requests matched the current search criteria.';
  }

  const start = state.response.page.page * state.response.page.size + 1;
  const end = state.response.page.page * state.response.page.size + state.response.requests.length;

  return `Showing ${start}-${end} of ${state.response.page.totalElements} requests`;
}

export function DepartmentProgramRequestsView({
  scope = 'department',
}: DepartmentProgramRequestsViewProps) {
  const navigate = useNavigate();
  const form = useForm<ProgramRequestSearchFilters>({
    initialValues: initialFilters,
  });
  const [referenceState, setReferenceState] = useState<ProgramRequestReferenceState>({
    status: 'loading',
  });
  const [requestState, setRequestState] = useState<DepartmentProgramRequestsState>({
    status: 'loading',
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<ProgramRequestPageSize>('25');
  const [resultsView, setResultsView] = useState<ProgramRequestQueueResultsView>('standard');
  const [submittedFilters, setSubmittedFilters] =
    useState<ProgramRequestSearchFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<ProgramRequestQueueSortBy>('requestedAt');
  const [sortDirection, setSortDirection] = useState<ProgramRequestQueueSortDirection>('asc');
  const [selectedRequest, setSelectedRequest] =
    useState<StudentProgramRequestSummaryResponse | null>(null);

  const statuses = useMemo(
    () =>
      submittedFilters.status === 'ALL'
        ? ['REQUESTED', 'DEPARTMENT_APPROVED']
        : [submittedFilters.status],
    [submittedFilters.status]
  );
  useEffect(() => {
    let isMounted = true;
    setReferenceState({ status: 'loading' });

    Promise.all([getProgramReferenceOptions(), getStudentReferenceOptions()])
      .then(([programOptions, studentOptions]) => {
        if (!isMounted) {
          return;
        }

        setReferenceState({
          status: 'success',
          classStandingOptions: mapReferenceOptionsToSelectOptions(studentOptions.classStandings),
          degreeTypeOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.degreeTypes),
          programTypeOptions: mapCodeNameReferenceOptionsToSelectOptions(
            programOptions.programTypes
          ),
          schoolOptions: mapCodeNameReferenceOptionsToSelectOptions(programOptions.schools),
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program request filters.'),
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    setRequestState({ status: 'loading' });
    const loadRequests = scope === 'admin' ? getProgramRequests : getMyDepartmentProgramRequests;

    loadRequests({
      page,
      size: Number(pageSize),
      sortBy,
      sortDirection,
      statuses,
      classStandingId: parseOptionalId(submittedFilters.classStandingId),
      degreeTypeId: parseOptionalId(submittedFilters.degreeTypeId),
      programQuery: submittedFilters.programQuery,
      programTypeId: parseOptionalId(submittedFilters.programTypeId),
      requestedFrom: submittedFilters.requestedFrom,
      requestedTo: submittedFilters.requestedTo,
      schoolId: parseOptionalId(submittedFilters.schoolId),
      studentQuery: submittedFilters.studentQuery,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRequestState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRequestState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program requests.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [page, pageSize, scope, sortBy, sortDirection, statuses, submittedFilters]);

  const requests = requestState.status === 'success' ? requestState.response.requests : [];
  const response = requestState.status === 'success' ? requestState.response : null;
  const selectedStudentProgramRequestId = selectedRequest?.studentProgramRequestId ?? null;

  function handleToggleSort(nextSortBy: ProgramRequestQueueSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      setPage(0);
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
    setPage(0);
  }

  function handleSearch(values: ProgramRequestSearchFilters) {
    setSubmittedFilters(values);
    setPage(0);
  }

  function handleClear() {
    form.setValues(initialFilters);
    setSubmittedFilters(initialFilters);
    setPage(0);
  }

  function handleReviewRequest(request: StudentProgramRequestSummaryResponse) {
    setSelectedRequest(request);
    navigate(`/academics/degree-requests/${request.studentProgramRequestId}`);
  }

  const { table, getRowProps } = useProgramRequestQueueTable({
    requests,
    resultsView,
    selectedStudentProgramRequestId,
    sortBy,
    sortDirection,
    onToggleSort: handleToggleSort,
    onReview: handleReviewRequest,
  });

  return (
    <Stack gap="lg" miw={0}>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="lg">
          <form onSubmit={form.onSubmit(handleSearch)}>
                <Stack gap="lg">
                  <SearchFormSection legend="Request Filters">
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        label="Status"
                        data={departmentStatusOptions}
                        value={form.values.status}
                        onChange={(value) => {
                          form.setFieldValue('status', value ?? 'REQUESTED');
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        clearable
                        searchable
                        label="Program Type"
                        placeholder="All types"
                        data={
                          referenceState.status === 'success'
                            ? referenceState.programTypeOptions
                            : []
                        }
                        value={form.values.programTypeId || null}
                        loading={referenceState.status === 'loading'}
                        onChange={(value) => {
                          form.setFieldValue('programTypeId', value ?? '');
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        clearable
                        searchable
                        label="Degree Type"
                        placeholder="All degrees"
                        data={
                          referenceState.status === 'success'
                            ? referenceState.degreeTypeOptions
                            : []
                        }
                        value={form.values.degreeTypeId || null}
                        loading={referenceState.status === 'loading'}
                        onChange={(value) => {
                          form.setFieldValue('degreeTypeId', value ?? '');
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        clearable
                        searchable
                        label="Class"
                        placeholder="All classes"
                        data={
                          referenceState.status === 'success'
                            ? referenceState.classStandingOptions
                            : []
                        }
                        value={form.values.classStandingId || null}
                        loading={referenceState.status === 'loading'}
                        onChange={(value) => {
                          form.setFieldValue('classStandingId', value ?? '');
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        clearable
                        searchable
                        label="School"
                        placeholder="All schools"
                        data={
                          referenceState.status === 'success' ? referenceState.schoolOptions : []
                        }
                        value={form.values.schoolId || null}
                        loading={referenceState.status === 'loading'}
                        onChange={(value) => {
                          form.setFieldValue('schoolId', value ?? '');
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <DateInput
                        clearable
                        label="Requested From"
                        value={parseDateInputValue(form.values.requestedFrom)}
                        onChange={(value) => {
                          form.setFieldValue('requestedFrom', normalizeDateInputValue(value));
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <DateInput
                        clearable
                        label="Requested To"
                        value={parseDateInputValue(form.values.requestedTo)}
                        onChange={(value) => {
                          form.setFieldValue('requestedTo', normalizeDateInputValue(value));
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Student"
                        placeholder="Name or email"
                        {...form.getInputProps('studentQuery')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Program"
                        placeholder="Code or name"
                        {...form.getInputProps('programQuery')}
                      />
                    </Grid.Col>
                  </SearchFormSection>

                  {referenceState.status === 'error' ? (
                    <Alert color="red" title="Unable to load filters">
                      {referenceState.message}
                    </Alert>
                  ) : null}

                  <SearchFormActions
                    size={pageSize}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    sizeOptions={pageSizeOptions}
                    sortByOptions={sortByOptions}
                    sortDirectionOptions={sortDirectionOptions}
                    onSizeChange={(value) => {
                      if (value) {
                        setPageSize(value as ProgramRequestPageSize);
                        setPage(0);
                      }
                    }}
                    onSortByChange={(value) => {
                      if (value) {
                        setSortBy(value as ProgramRequestQueueSortBy);
                        setPage(0);
                      }
                    }}
                    onSortDirectionChange={(value) => {
                      if (value) {
                        setSortDirection(value as ProgramRequestQueueSortDirection);
                        setPage(0);
                      }
                    }}
                    clearLabel="Clear"
                    submitLabel="Search Requests"
                    isSubmitting={requestState.status === 'loading'}
                    onClear={handleClear}
                  />
                </Stack>
          </form>
        </Stack>
      </Paper>

      <SearchResultsPanel
        status={getRequestResultsStatus(requestState)}
        summary={getRequestResultsSummary(requestState)}
        table={table}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onToggleSort={handleToggleSort}
        viewOptions={resultsViewOptions}
        view={resultsView}
        onViewChange={setResultsView}
        withBorder
        getRowProps={getRowProps}
        headerContent={
          scope === 'department' && response && response.departments.length > 0 ? (
            <DepartmentScopeBadges departments={response.departments} />
          ) : null
        }
        notice={{
          idleTitle: 'Program request search is ready',
          idleMessage: 'Search requests by status, program, student, school, or class.',
          loadingMessage: 'Loading program requests...',
          errorTitle: 'Unable to load program requests',
          errorMessage: requestState.status === 'error' ? requestState.message : null,
          emptyTitle: 'No program requests found',
          emptyMessage: 'Try adjusting the current request filters.',
        }}
        pagination={
          response && response.page.totalPages > 0
            ? {
                page: response.page.page,
                totalPages: Math.max(response.page.totalPages, 1),
                onPageChange: setPage,
              }
            : null
        }
      />
    </Stack>
  );
}

function DepartmentScopeBadges({
  departments,
}: {
  departments: ProgramRequestDepartmentScopeResponse[];
}) {
  const departmentLabel = departments.length === 1 ? 'Department' : 'Departments';

  return (
    <Stack gap={6}>
      <Text size="sm" c="dimmed">
        {departmentLabel}
      </Text>
      <Group gap={6}>
        {departments.map((department) => (
          <Badge
            key={department.departmentId ?? department.departmentCode}
            size="lg"
            variant="light"
            color="blue"
          >
            {displayDepartmentScopeLabel(department)}
          </Badge>
        ))}
      </Group>
    </Stack>
  );
}

function displayDepartmentScopeLabel(department: ProgramRequestDepartmentScopeResponse) {
  if (department.departmentName && department.departmentCode) {
    return `${department.departmentName} (${department.departmentCode})`;
  }

  return department.departmentName ?? department.departmentCode ?? 'Department';
}
