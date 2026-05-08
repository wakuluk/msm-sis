import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  StudentSearchResponse,
  StudentSearchResultResponse,
  StudentSortBy,
  StudentSortDirection,
} from '@/services/schemas/student-schemas';

export type StudentSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: StudentSearchResponse }
  | { status: 'success'; response: StudentSearchResponse };

export type StudentResultsView = 'standard' | 'system';

type StudentSearchResultsPanelProps = {
  resultsState: StudentSearchResultsState;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  resultsView: StudentResultsView;
  onToggleSort: (sortBy: StudentSortBy) => void;
  onViewChange: (view: StudentResultsView) => void;
  onOpenStudent: (studentId: number) => void;
  onPageChange: (page: number) => void;
};

const emptyStudentResults: StudentSearchResultResponse[] = [];
const standardResultsColumnVisibility = {
  updatedBy: false,
  lastUpdated: false,
  disabled: false,
};

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

export function StudentSearchResultsPanel({
  resultsState,
  sortBy,
  sortDirection,
  resultsView,
  onToggleSort,
  onViewChange,
  onOpenStudent,
  onPageChange,
}: StudentSearchResultsPanelProps) {
  const tableData =
    resultsState.status === 'success' ? resultsState.response.results : emptyStudentResults;
  const tableColumnVisibility =
    resultsView === 'standard' ? standardResultsColumnVisibility : {};
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

  return (
    <SearchResultsPanel
      title="Results"
      status={resultsState.status}
      summary={
        resultsState.status === 'empty' || resultsState.status === 'success'
          ? getResultsSummary(resultsState.response)
          : ''
      }
      table={studentResultsTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      showHeader={resultsState.status === 'empty' || resultsState.status === 'success'}
      viewOptions={[
        { label: 'Standard', value: 'standard' },
        { label: 'System', value: 'system' },
      ]}
      view={resultsView}
      onViewChange={onViewChange}
      notice={{
        idleTitle: 'Search students',
        idleMessage: 'Enter filters if needed, then click `Search Students` to load results.',
        loadingMessage: 'Loading students...',
        errorMessage: resultsState.status === 'error' ? resultsState.message : null,
        emptyTitle: 'No students found',
        emptyMessage: 'No students matched the current search criteria.',
      }}
      getRowProps={(row) => ({
        role: 'link',
        tabIndex: 0,
        onClick: () => {
          onOpenStudent(row.original.studentId);
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenStudent(row.original.studentId);
          }
        },
      })}
      pagination={
        resultsState.status === 'success'
          ? {
              page: resultsState.response.page,
              totalPages: resultsState.response.totalPages,
              onPageChange,
            }
          : null
      }
    />
  );
}
