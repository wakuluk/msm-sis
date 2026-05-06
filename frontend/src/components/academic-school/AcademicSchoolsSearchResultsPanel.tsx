import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  AcademicSchoolDepartmentSearchResponse,
  AcademicSchoolDepartmentSearchResultResponse,
} from '@/services/schemas/academic-school-schemas';

export type AcademicSchoolsPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; results: AcademicSchoolDepartmentSearchResponse }
  | { status: 'success'; results: AcademicSchoolDepartmentSearchResponse };

export type AcademicSchoolSearchSortBy =
  | 'schoolCode'
  | 'schoolName'
  | 'schoolActive'
  | 'departmentCode'
  | 'departmentName'
  | 'departmentActive';

export type AcademicSchoolSearchSortDirection = 'asc' | 'desc';
export type AcademicSchoolResultsView = 'standard' | 'system';

type AcademicSchoolsSearchResultsPanelProps = {
  pageState: AcademicSchoolsPageState;
  sortBy: AcademicSchoolSearchSortBy;
  sortDirection: AcademicSchoolSearchSortDirection;
  resultsView: AcademicSchoolResultsView;
  onToggleSort: (sortBy: AcademicSchoolSearchSortBy) => void;
  onViewChange: (view: AcademicSchoolResultsView) => void;
};

const emptyAcademicSchoolSearchResults: AcademicSchoolDepartmentSearchResponse = [];
const academicSchoolResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: AcademicSchoolResultsView }>;

const academicSchoolSearchColumns: ColumnDef<AcademicSchoolDepartmentSearchResultResponse>[] = [
  {
    accessorKey: 'schoolCode',
    header: 'School Code',
    size: 160,
    meta: { sortBy: 'schoolCode' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'schoolName',
    header: 'School Name',
    size: 260,
    cell: ({ row }) => (
      <Link to={`/academics/schools/${row.original.schoolId}`}>{row.original.schoolName}</Link>
    ),
    meta: { sortBy: 'schoolName' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'schoolActive',
    header: 'School Active',
    size: 120,
    cell: ({ row }) => (row.original.schoolActive ? 'Yes' : 'No'),
    meta: { sortBy: 'schoolActive' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentCode',
    header: 'Department Code',
    size: 180,
    cell: ({ row }) => row.original.departmentCode ?? '-',
    meta: { sortBy: 'departmentCode' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department Name',
    size: 280,
    cell: ({ row }) =>
      row.original.departmentId === null ? (
        '-'
      ) : (
        <Link
          to={`/academics/departments/${row.original.departmentId}`}
          state={{ source: 'search', schoolId: row.original.schoolId }}
        >
          {row.original.departmentName ?? '-'}
        </Link>
      ),
    meta: { sortBy: 'departmentName' satisfies AcademicSchoolSearchSortBy },
  },
  {
    accessorKey: 'departmentActive',
    header: 'Department Active',
    size: 140,
    cell: ({ row }) =>
      row.original.departmentId === null ? '-' : row.original.departmentActive ? 'Yes' : 'No',
    meta: { sortBy: 'departmentActive' satisfies AcademicSchoolSearchSortBy },
  },
];

function getResultsSummary(state: AcademicSchoolsPageState): string {
  if (state.status === 'loading') {
    return 'Loading academic school search results...';
  }

  if (state.status === 'error') {
    return 'Academic school search failed.';
  }

  const count = state.results.length;

  if (count === 0) {
    return 'No academic school search results found.';
  }

  return `Showing ${count} academic school search results`;
}

export function AcademicSchoolsSearchResultsPanel({
  pageState,
  sortBy,
  sortDirection,
  resultsView,
  onToggleSort,
  onViewChange,
}: AcademicSchoolsSearchResultsPanelProps) {
  const tableData =
    pageState.status === 'success' || pageState.status === 'empty'
      ? pageState.results
      : emptyAcademicSchoolSearchResults;

  const academicSchoolSearchTable = useReactTable({
    columns: academicSchoolSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => `${row.schoolId}-${row.departmentId ?? 'no-department'}-${index}`,
    state: {
      columnVisibility: {
        schoolActive: resultsView === 'system',
        departmentActive: resultsView === 'system',
      },
    },
  });

  return (
    <SearchResultsPanel
      status={pageState.status}
      summary={getResultsSummary(pageState)}
      table={academicSchoolSearchTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      viewOptions={academicSchoolResultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
      notice={{
        idleTitle: '',
        idleMessage: '',
        loadingMessage: 'Loading academic school search results...',
        errorTitle: 'Unable to load academic school search results',
        errorMessage: pageState.status === 'error' ? pageState.message : null,
        emptyTitle: 'No academic school search results found',
        emptyMessage: 'Try again after academic schools and departments are configured.',
      }}
    />
  );
}
