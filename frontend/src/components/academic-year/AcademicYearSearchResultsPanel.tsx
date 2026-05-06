import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { AcademicYearSearchSize } from '@/services/academic-year-search-config';
import type {
  AcademicYearSearchResponse,
  AcademicYearSearchResultResponse,
  AcademicYearSortBy,
  AcademicYearSortDirection,
} from '@/services/schemas/academic-years-schemas';

export type AcademicYearResultsView = 'standard' | 'system';

export type AcademicYearSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: AcademicYearSearchResponse }
  | { status: 'success'; response: AcademicYearSearchResponse };

type AcademicYearSearchResultsPanelProps = {
  resultsState: AcademicYearSearchResultsState;
  page: number;
  size: AcademicYearSearchSize;
  sortBy: AcademicYearSortBy;
  sortDirection: AcademicYearSortDirection;
  resultsView: AcademicYearResultsView;
  canPaginate: boolean;
  onToggleSort: (sortBy: AcademicYearSortBy) => void;
  onOpenAcademicYear: (academicYearId: number) => void;
  onViewChange: (view: AcademicYearResultsView) => void;
  onPageChange: (page: number) => void;
};

const academicYearResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: AcademicYearResultsView }>;

const emptyAcademicYearResults: AcademicYearSearchResultResponse[] = [];

const academicYearResultsColumns: ColumnDef<AcademicYearSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 160,
    meta: { sortBy: 'code' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 280,
    meta: { sortBy: 'name' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'startDate',
    header: 'Start date',
    size: 140,
    meta: { sortBy: 'startDate' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'endDate',
    header: 'End date',
    size: 140,
    meta: { sortBy: 'endDate' satisfies AcademicYearSortBy },
  },
  {
    accessorKey: 'yearStatusName',
    header: 'Year Status',
    size: 160,
    cell: ({ row }) => row.original.yearStatusName ?? row.original.yearStatusCode ?? '-',
    meta: { sortBy: 'yearStatus' satisfies AcademicYearSortBy },
  },
  {
    id: 'isPublished',
    accessorFn: (academicYear) => academicYear.isPublished,
    header: 'Published',
    size: 112,
    cell: ({ getValue }) => (getValue<boolean>() ? 'Yes' : 'No'),
    meta: { sortBy: 'isPublished' satisfies AcademicYearSortBy },
  },
];

function getResultsSummary(
  searchResultsState: AcademicYearSearchResultsState,
  page: number,
  size: AcademicYearSearchSize
): string {
  if (searchResultsState.status === 'idle') {
    return 'No academic year search has been run yet.';
  }

  if (searchResultsState.status === 'loading') {
    return 'Loading academic years...';
  }

  if (searchResultsState.status === 'error') {
    return 'Academic year search failed.';
  }

  if (searchResultsState.response.length === 0) {
    return 'No academic years matched the current search criteria.';
  }

  const start = page * size + 1;
  const end = start + searchResultsState.response.length - 1;

  return `Showing ${start}-${end} academic years`;
}

function getTotalPages(
  searchResultsState: AcademicYearSearchResultsState,
  page: number,
  size: AcademicYearSearchSize
): number {
  if (searchResultsState.status !== 'success' && searchResultsState.status !== 'empty') {
    return 1;
  }

  const resultCount = searchResultsState.response.length;
  const hasPotentialNextPage = resultCount === size;

  return hasPotentialNextPage ? page + 2 : Math.max(page + 1, 1);
}

export function AcademicYearSearchResultsPanel({
  resultsState,
  page,
  size,
  sortBy,
  sortDirection,
  resultsView,
  canPaginate,
  onToggleSort,
  onOpenAcademicYear,
  onViewChange,
  onPageChange,
}: AcademicYearSearchResultsPanelProps) {
  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response
      : emptyAcademicYearResults;

  const academicYearResultsTable = useReactTable({
    columns: academicYearResultsColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.academicYearId),
    state: {
      columnVisibility: {
        yearStatusName: resultsView === 'system',
        isPublished: resultsView === 'system',
      },
    },
  });

  return (
    <SearchResultsPanel
      status={resultsState.status}
      summary={getResultsSummary(resultsState, page, size)}
      table={academicYearResultsTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      viewOptions={academicYearResultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
      notice={{
        idleTitle: 'Start a search',
        idleMessage: 'Enter one or more search filters, then run the academic year search.',
        loadingMessage: 'Loading academic years...',
        errorMessage: resultsState.status === 'error' ? resultsState.message : null,
        emptyTitle: 'No academic years found',
        emptyMessage: 'No academic years matched the current search criteria.',
      }}
      getRowProps={(row) => ({
        role: 'button',
        tabIndex: 0,
        onClick: () => {
          onOpenAcademicYear(row.original.academicYearId);
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenAcademicYear(row.original.academicYearId);
          }
        },
      })}
      pagination={
        canPaginate
          ? {
              page,
              totalPages: getTotalPages(resultsState, page, size),
              onPageChange,
            }
          : null
      }
    />
  );
}
