import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  ProgramSearchResponse,
  ProgramSearchResultResponse,
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';

export type ProgramSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: ProgramSearchResponse }
  | { status: 'success'; response: ProgramSearchResponse };

export type ProgramSearchResultsView = 'standard' | 'system';

type ProgramSearchResultsPanelProps = {
  resultsState: ProgramSearchResultsState;
  sortBy: ProgramSearchSortBy;
  sortDirection: ProgramSearchSortDirection;
  resultsView: ProgramSearchResultsView;
  onToggleSort: (sortBy: ProgramSearchSortBy) => void;
  onViewChange: (view: ProgramSearchResultsView) => void;
  onPageChange: (page: number) => void;
};

const emptyProgramSearchResults: ProgramSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: ProgramSearchResultsView }>;

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
        {row.original.programTypeName ?? '-'}
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
    cell: ({ row }) => row.original.degreeTypeName ?? '-',
    meta: { sortBy: 'degreeTypeName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'schoolName',
    header: 'School',
    size: 240,
    cell: ({ row }) =>
      row.original.schoolId === null ? (
        '-'
      ) : (
        <Link to={`/academics/schools/${row.original.schoolId}`}>
          {row.original.schoolName ?? '-'}
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
        '-'
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

export function ProgramSearchResultsPanel({
  resultsState,
  sortBy,
  sortDirection,
  resultsView,
  onToggleSort,
  onViewChange,
  onPageChange,
}: ProgramSearchResultsPanelProps) {
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

  return (
    <SearchResultsPanel
      status={resultsState.status}
      summary={getResultsSummary(resultsState)}
      table={programSearchTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      viewOptions={resultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
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
              onPageChange,
            }
          : null
      }
    />
  );
}
