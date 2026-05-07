import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { displayDate, displayDateTime } from '@/components/academic-year/academicYearDisplay';
import {
  SearchResultsTable,
  type SearchResultsTableRowProps,
} from '@/components/search/SearchResultsTable';
import type { StudentProgramRequestSummaryResponse } from '@/services/schemas/student-program-schemas';
import { ProgramRequestStatusBadge } from './ProgramRequestStatusBadge';

export type ProgramRequestQueueSortBy =
  | 'classStanding'
  | 'department'
  | 'program'
  | 'requestedAt'
  | 'status'
  | 'student';

export type ProgramRequestQueueSortDirection = 'asc' | 'desc';
export type ProgramRequestQueueResultsView = 'standard' | 'system';

type ProgramRequestQueueTableProps = {
  onReview: (request: StudentProgramRequestSummaryResponse) => void;
  onToggleSort: (sortBy: ProgramRequestQueueSortBy) => void;
  requests: StudentProgramRequestSummaryResponse[];
  resultsView: ProgramRequestQueueResultsView;
  selectedStudentProgramRequestId?: number | null;
  sortBy: ProgramRequestQueueSortBy;
  sortDirection: ProgramRequestQueueSortDirection;
};

export type ProgramRequestQueueTableController = Pick<
  ProgramRequestQueueTableProps,
  | 'onReview'
  | 'onToggleSort'
  | 'requests'
  | 'resultsView'
  | 'selectedStudentProgramRequestId'
  | 'sortBy'
  | 'sortDirection'
>;

function displayStudentName(request: StudentProgramRequestSummaryResponse) {
  const preferredName = request.studentPreferredName?.trim();
  const firstName = preferredName || request.studentFirstName?.trim();
  const lastName = request.studentLastName?.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  return displayName || request.studentEmail || 'Student';
}

function displayProgramName(request: StudentProgramRequestSummaryResponse) {
  return request.programName ?? request.programCode ?? 'Program';
}

function displayDepartment(request: StudentProgramRequestSummaryResponse) {
  if (request.departmentName && request.departmentCode) {
    return `${request.departmentName} (${request.departmentCode})`;
  }

  return request.departmentName ?? request.departmentCode ?? '—';
}

function buildProgramRequestColumns(
  resultsView: ProgramRequestQueueResultsView,
  onReview: (request: StudentProgramRequestSummaryResponse) => void,
  selectedStudentProgramRequestId?: number | null
): ColumnDef<StudentProgramRequestSummaryResponse>[] {
  const columns: ColumnDef<StudentProgramRequestSummaryResponse>[] = [
    {
      id: 'student',
      header: 'Student',
      size: 210,
      cell: ({ row }) => (
        <Stack gap={2}>
          <Text fw={600}>{displayStudentName(row.original)}</Text>
          <Text size="sm" c="dimmed">
            {row.original.studentEmail ?? '—'}
          </Text>
        </Stack>
      ),
      meta: { sortBy: 'student' satisfies ProgramRequestQueueSortBy },
    },
    {
      id: 'program',
      header: 'Program',
      size: 220,
      cell: ({ row }) => (
        <Stack gap={6}>
          <Text fw={600}>{displayProgramName(row.original)}</Text>
          <Group gap={6}>
            <Badge variant="light" color="blue">
              {row.original.programTypeName ?? row.original.programTypeCode ?? 'Program'}
            </Badge>
            {(row.original.degreeTypeName ?? row.original.degreeTypeCode) ? (
              <Badge variant="outline">
                {row.original.degreeTypeName ?? row.original.degreeTypeCode}
              </Badge>
            ) : null}
          </Group>
        </Stack>
      ),
      meta: { sortBy: 'program' satisfies ProgramRequestQueueSortBy },
    },
    {
      id: 'classStanding',
      header: 'Class',
      size: 150,
      cell: ({ row }) => (
        <Stack gap={2}>
          <Text>{row.original.classStandingName ?? '—'}</Text>
          <Text size="sm" c="dimmed">
            Grad {displayDate(row.original.estimatedGradDate)}
          </Text>
        </Stack>
      ),
      meta: { sortBy: 'classStanding' satisfies ProgramRequestQueueSortBy },
    },
    {
      id: 'status',
      header: 'Status',
      size: 140,
      cell: ({ row }) => <ProgramRequestStatusBadge status={row.original.status} />,
      meta: { sortBy: 'status' satisfies ProgramRequestQueueSortBy },
    },
    {
      id: 'actions',
      header: 'Action',
      size: 130,
      cell: ({ row }) => {
        const selected = selectedStudentProgramRequestId === row.original.studentProgramRequestId;

        return (
          <Button
            leftSection={<IconEye size={16} />}
            variant={selected ? 'filled' : 'light'}
            onClick={(event) => {
              event.stopPropagation();
              onReview(row.original);
            }}
          >
            Review
          </Button>
        );
      },
    },
  ];

  if (resultsView === 'standard') {
    return columns;
  }

  columns.splice(
    2,
    0,
    {
      id: 'department',
      header: 'Department',
      size: 230,
      cell: ({ row }) => (
        <Stack gap={2}>
          <Text>{displayDepartment(row.original)}</Text>
          <Text size="sm" c="dimmed">
            {row.original.schoolName ?? row.original.schoolCode ?? '—'}
          </Text>
        </Stack>
      ),
      meta: { sortBy: 'department' satisfies ProgramRequestQueueSortBy },
    },
    {
      id: 'requestedAt',
      header: 'Requested',
      size: 150,
      cell: ({ row }) => displayDateTime(row.original.requestedAt),
      meta: { sortBy: 'requestedAt' satisfies ProgramRequestQueueSortBy },
    }
  );

  return columns;
}

export function useProgramRequestQueueTable({
  onReview,
  requests,
  resultsView,
  selectedStudentProgramRequestId,
}: ProgramRequestQueueTableController) {
  const table = useReactTable({
    columns: buildProgramRequestColumns(resultsView, onReview, selectedStudentProgramRequestId),
    data: requests,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.studentProgramRequestId),
  });

  function getRequestRowProps(
    request: StudentProgramRequestSummaryResponse
  ): SearchResultsTableRowProps {
    return {
      'aria-selected': selectedStudentProgramRequestId === request.studentProgramRequestId,
      onClick: () => {
        onReview(request);
      },
      onKeyDown: (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        onReview(request);
      },
      role: 'button',
      tabIndex: 0,
    };
  }

  return {
    table,
    getRowProps: (row: { original: StudentProgramRequestSummaryResponse }) =>
      getRequestRowProps(row.original),
  };
}

export function ProgramRequestQueueTable(props: ProgramRequestQueueTableProps) {
  const { table, getRowProps } = useProgramRequestQueueTable(props);

  return (
    <SearchResultsTable
      table={table}
      sortBy={props.sortBy}
      sortDirection={props.sortDirection}
      onToggleSort={props.onToggleSort}
      getRowProps={getRowProps}
    />
  );
}
