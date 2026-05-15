import { useEffect, useMemo, useState } from 'react';
import { Badge, Container, Grid, Paper, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { getCoreRowModel, useReactTable, type ColumnDef, type Row } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import {
  SearchResultsPanel,
  type SearchResultsStatus,
} from '@/components/search/SearchResultsPanel';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { listAdminTransferRequests } from '@/services/transfer-request-service';
import type { TransferRequestResponse } from '@/services/schemas/transfer-request-schemas';
import { getErrorMessage } from '@/utils/errors';

type TransferRequestFilters = {
  classYear: string;
  division: string;
  status: string;
  studentEmail: string;
  studentId: string;
  studentName: string;
};

type TransferRequestSortBy = 'requestedAt';
type TransferRequestSortDirection = 'asc' | 'desc';
type TransferRequestPageSize = '25' | '50' | '100';

type TransferRequestRow = {
  classYear: string;
  division: string;
  externalCourse: string;
  institution: string;
  requestId: string;
  requestedAt: string;
  status: string;
  studentEmail: string;
  studentId: string;
  studentName: string;
  term: string;
};

const initialFilters: TransferRequestFilters = {
  classYear: '',
  division: '',
  status: '',
  studentEmail: '',
  studentId: '',
  studentName: '',
};

const divisionOptions = [
  { value: 'Undergraduate', label: 'Undergraduate' },
  { value: 'Graduate', label: 'Graduate' },
];

const statusOptions = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'WAITING_FOR_MORE_INFO', label: 'Waiting for more info' },
  { value: 'REGISTRAR_REVIEW', label: 'Registrar review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const pageSizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<TransferRequestPageSize>>;

const sortByOptions = [{ value: 'requestedAt', label: 'Submitted' }] satisfies ReadonlyArray<
  StringOption<TransferRequestSortBy>
>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<TransferRequestSortDirection>>;

const columns: ColumnDef<TransferRequestRow>[] = [
  {
    id: 'student',
    header: 'Student',
    size: 280,
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.studentName}</Text>
        <Text size="sm" c="dimmed">
          {row.original.studentEmail}
        </Text>
        <Text size="sm" c="dimmed">
          ID {row.original.studentId} / Class {row.original.classYear}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'request',
    header: 'Request',
    size: 280,
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text fw={700}>{row.original.externalCourse}</Text>
        <Text size="sm" c="dimmed">
          {row.original.institution}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'term',
    header: 'Term',
    size: 150,
    cell: ({ row }) => row.original.term,
  },
  {
    id: 'division',
    header: 'Division',
    size: 160,
    cell: ({ row }) => row.original.division,
  },
  {
    id: 'requestedAt',
    header: 'Submitted',
    size: 150,
    meta: { sortBy: 'requestedAt' satisfies TransferRequestSortBy },
    cell: ({ row }) => row.original.requestedAt,
  },
  {
    id: 'status',
    header: 'Status',
    size: 180,
    cell: ({ row }) => (
      <Badge color={statusColor(row.original.status)} variant="light">
        {formatStatus(row.original.status)}
      </Badge>
    ),
  },
];

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'DENIED':
    case 'CANCELLED':
      return 'red';
    case 'REGISTRAR_REVIEW':
      return 'violet';
    case 'WAITING_FOR_MORE_INFO':
      return 'yellow';
    case 'SUBMITTED':
      return 'blue';
    case 'Approved':
      return 'green';
    default:
      return 'gray';
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCourse(request: TransferRequestResponse) {
  const course = request.primaryCourse;

  if (!course) {
    return 'Course details pending';
  }

  return [course.externalSubjectCode, course.externalCourseNumber, course.externalCourseTitle]
    .filter(Boolean)
    .join(' ');
}

function formatInstitution(request: TransferRequestResponse) {
  return (
    request.institution.transferInstitutionName ||
    request.institution.oneOffInstitutionName ||
    'Institution pending'
  );
}

function formatSubmittedAt(submittedAt: string | null) {
  return submittedAt ? submittedAt.slice(0, 10) : 'Not submitted';
}

function mapRequestToRow(request: TransferRequestResponse): TransferRequestRow {
  return {
    requestId: String(request.transferRequestId),
    studentName: request.studentName,
    studentEmail: request.studentEmail ?? '',
    studentId: request.studentNumber ?? String(request.studentId),
    classYear: request.classOf === null ? '' : String(request.classOf),
    division: request.divisionNames.length > 0 ? request.divisionNames.join(', ') : 'No division',
    institution: formatInstitution(request),
    externalCourse: formatCourse(request),
    term: request.primaryCourse?.externalTerm ?? 'Term pending',
    requestedAt: formatSubmittedAt(request.submittedAt),
    status: request.status,
  };
}

function getResultsStatus(
  hasSearched: boolean,
  isLoading: boolean,
  errorMessage: string,
  results: TransferRequestRow[]
): SearchResultsStatus {
  if (isLoading) {
    return 'loading';
  }

  if (errorMessage) {
    return 'error';
  }

  if (!hasSearched) {
    return 'idle';
  }

  return results.length === 0 ? 'empty' : 'success';
}

function getResultsSummary(
  hasSearched: boolean,
  results: TransferRequestRow[],
  visibleCount: number
) {
  if (!hasSearched) {
    return 'Search transfer credit requests.';
  }

  if (results.length === 0) {
    return 'No transfer requests matched the current filters.';
  }

  return `Showing ${visibleCount} of ${results.length} transfer requests`;
}

export function AdminTransferRequestsPage() {
  const navigate = useNavigate();
  const form = useForm<TransferRequestFilters>({
    initialValues: initialFilters,
  });
  const [submittedFilters, setSubmittedFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pageSize, setPageSize] = useState<TransferRequestPageSize>('25');
  const [sortBy, setSortBy] = useState<TransferRequestSortBy>('requestedAt');
  const [sortDirection, setSortDirection] = useState<TransferRequestSortDirection>('asc');
  const [results, setResults] = useState<TransferRequestRow[]>([]);

  const visibleResults = useMemo(() => results.slice(0, Number(pageSize)), [pageSize, results]);
  const table = useReactTable({
    data: hasSearched ? visibleResults : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.requestId,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await listAdminTransferRequests({
          studentName: submittedFilters.studentName,
          studentEmail: submittedFilters.studentEmail,
          studentId: submittedFilters.studentId,
          classOf: submittedFilters.classYear,
          division: submittedFilters.division,
          status: submittedFilters.status,
          sortDirection,
        });

        if (!cancelled) {
          setResults(response.requests.map(mapRequestToRow));
        }
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          setLoadError(getErrorMessage(error, 'Failed to load transfer requests.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (hasSearched) {
      void loadRequests();
    }

    return () => {
      cancelled = true;
    };
  }, [hasSearched, sortDirection, submittedFilters]);

  function handleToggleSort(nextSortBy: TransferRequestSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleClear() {
    form.setValues(initialFilters);
    setSubmittedFilters(initialFilters);
    setHasSearched(true);
    setPageSize('25');
    setSortBy('requestedAt');
    setSortDirection('asc');
  }

  function getResultRowProps(row: Row<TransferRequestRow>): SearchResultsTableRowProps {
    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => {
        navigate(`/academics/transfer-requests/${row.original.requestId}`);
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/academics/transfer-requests/${row.original.requestId}`);
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
              setSubmittedFilters({ ...values });
              setHasSearched(true);
            })}
          >
            <Stack gap="lg">
              <Stack gap={4}>
                <Text fw={700} fz="xl">
                  Transfer Requests
                </Text>
                <Text size="sm" c="dimmed">
                  Review submitted transfer credit requests and find students by record details.
                </Text>
              </Stack>

              <SearchFormSection legend="Request Filters">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Student name"
                    placeholder="Name"
                    {...form.getInputProps('studentName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Student email"
                    placeholder="Email"
                    {...form.getInputProps('studentEmail')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Student ID"
                    placeholder="ID"
                    {...form.getInputProps('studentId')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Class"
                    placeholder="Class year"
                    {...form.getInputProps('classYear')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Division"
                    placeholder="All divisions"
                    data={divisionOptions}
                    clearable
                    {...form.getInputProps('division')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Status"
                    placeholder="All statuses"
                    data={statusOptions}
                    clearable
                    {...form.getInputProps('status')}
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
                submitLabel="Search Requests"
                onClear={handleClear}
                onSizeChange={(value) => {
                  if (value) {
                    setPageSize(value as TransferRequestPageSize);
                  }
                }}
                onSortByChange={(value) => {
                  if (value) {
                    setSortBy(value as TransferRequestSortBy);
                  }
                }}
                onSortDirectionChange={(value) => {
                  if (value) {
                    setSortDirection(value as TransferRequestSortDirection);
                  }
                }}
              />
            </Stack>
          </form>
        </Paper>

        <SearchResultsPanel
          status={getResultsStatus(hasSearched, isLoading, loadError, results)}
          summary={getResultsSummary(hasSearched, results, visibleResults.length)}
          table={table}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          notice={{
            idleTitle: 'Search transfer requests',
            idleMessage: 'Use the filters above to find submitted transfer credit requests.',
            loadingMessage: 'Searching transfer requests...',
            errorMessage: loadError,
            emptyTitle: 'No transfer requests found',
            emptyMessage: 'No requests matched the current filters.',
          }}
          footerContent={
            <Text size="xs" c="dimmed">
              Requests are ordered by submitted date, then request number, so the oldest submitted
              request stays first by default.
            </Text>
          }
          getRowProps={getResultRowProps}
          withBorder
        />
      </Stack>
    </Container>
  );
}
