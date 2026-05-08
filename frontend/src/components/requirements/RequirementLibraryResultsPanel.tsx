import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  RequirementSearchResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import {
  formatRequirementTarget,
  formatRequirementType,
} from '@/utils/requirement-formatters';

export type RequirementSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: RequirementSearchResponse }
  | { status: 'success'; response: RequirementSearchResponse };

export type RequirementResultsView = 'standard' | 'system';

type RequirementLibraryResultsPanelProps = {
  resultsState: RequirementSearchResultsState;
  resultsView: RequirementResultsView;
  onViewChange: (view: RequirementResultsView) => void;
  onPageChange: (page: number) => void;
};

const emptyRequirementSearchResults: RequirementSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: RequirementResultsView }>;

const requirementSearchColumns: ColumnDef<RequirementSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 170,
    cell: ({ row }) => (
      <Link to={`/academics/requirements/${row.original.requirementId}`}>
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Requirement',
    size: 300,
  },
  {
    accessorKey: 'requirementType',
    header: 'Type',
    size: 180,
    cell: ({ row }) => (
      <Badge variant="light">{formatRequirementType(row.original.requirementType)}</Badge>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    size: 260,
    cell: ({ row }) => formatRequirementTarget(row.original),
  },
  {
    accessorKey: 'requirementCourseCount',
    header: 'Courses',
    size: 100,
  },
  {
    accessorKey: 'requirementCourseRuleCount',
    header: 'Rules',
    size: 100,
  },
  {
    accessorKey: 'minimumGrade',
    header: 'Minimum Grade',
    size: 140,
    cell: ({ row }) => row.original.minimumGrade ?? '-',
  },
  {
    accessorKey: 'requirementId',
    header: 'ID',
    size: 90,
  },
];

function getResultsSummary(state: RequirementSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading requirement search results...';
  }

  if (state.status === 'error') {
    return 'Requirement search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No requirements matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} requirements`;
  }

  return 'Requirement search is ready.';
}

export function RequirementLibraryResultsPanel({
  resultsState,
  resultsView,
  onViewChange,
  onPageChange,
}: RequirementLibraryResultsPanelProps) {
  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyRequirementSearchResults;

  const requirementSearchTable = useReactTable({
    columns: requirementSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.requirementId),
    state: {
      columnVisibility: {
        requirementId: resultsView === 'system',
      },
    },
  });

  return (
    <SearchResultsPanel
      status={resultsState.status}
      summary={getResultsSummary(resultsState)}
      table={requirementSearchTable}
      sortBy="name"
      sortDirection="asc"
      onToggleSort={() => undefined}
      viewOptions={resultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
      withBorder
      notice={{
        idleTitle: 'Requirement search is ready',
        idleMessage: 'Search reusable requirements by code, name, or type.',
        loadingMessage: 'Loading requirement search results...',
        errorTitle: 'Unable to load requirement search results',
        errorMessage: resultsState.status === 'error' ? resultsState.message : null,
        emptyTitle: 'No requirement search results found',
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
