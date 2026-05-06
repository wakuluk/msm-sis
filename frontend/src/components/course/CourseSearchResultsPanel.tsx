import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  CourseSearchResponse,
  CourseSearchResultResponse,
  CourseSearchSortBy,
  CourseSearchSortDirection,
} from '@/services/schemas/course-schemas';

export type CourseSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: CourseSearchResponse }
  | { status: 'success'; response: CourseSearchResponse };

export type CourseSearchResultsView = 'standard' | 'system';

type CourseSearchResultsPanelProps = {
  resultsState: CourseSearchResultsState;
  sortBy: CourseSearchSortBy;
  sortDirection: CourseSearchSortDirection;
  resultsView: CourseSearchResultsView;
  onToggleSort: (sortBy: CourseSearchSortBy) => void;
  onViewChange: (view: CourseSearchResultsView) => void;
  onPageChange: (page: number) => void;
};

const emptyCourseSearchResults: CourseSearchResultResponse[] = [];
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: CourseSearchResultsView }>;

const courseSearchColumns: ColumnDef<CourseSearchResultResponse>[] = [
  {
    accessorKey: 'schoolName',
    header: 'School',
    size: 220,
    cell: ({ row }) =>
      row.original.schoolId === null ? (
        '-'
      ) : (
        <Link to={`/academics/schools/${row.original.schoolId}`}>
          {row.original.schoolName ?? '-'}
        </Link>
      ),
    meta: { sortBy: 'schoolName' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department',
    size: 220,
    cell: ({ row }) =>
      row.original.departmentId === null ? (
        '-'
      ) : (
        <Link
          to={`/academics/departments/${row.original.departmentId}`}
          state={{
            source: 'search',
            schoolId: row.original.schoolId,
          }}
        >
          {row.original.departmentName ?? '-'}
        </Link>
      ),
    meta: { sortBy: 'departmentName' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'subjectCode',
    header: 'Subject',
    size: 140,
    cell: ({ row }) => row.original.subjectCode ?? '-',
    meta: { sortBy: 'subjectCode' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'courseNumber',
    header: 'Course Number',
    size: 160,
    cell: ({ row }) => row.original.courseNumber ?? '-',
    meta: { sortBy: 'courseNumber' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'courseCode',
    header: 'Course Code',
    size: 180,
    cell: ({ row }) =>
      row.original.courseId ? (
        <Link to={`/academics/courses/${row.original.courseId}`} state={{ source: 'search' }}>
          {row.original.courseCode ?? '-'}
        </Link>
      ) : (
        '-'
      ),
    meta: { sortBy: 'courseCode' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'lab',
    header: 'Type',
    size: 100,
    cell: ({ row }) =>
      row.original.lab ? (
        <Badge size="sm" variant="light" color="indigo">
          Lab
        </Badge>
      ) : (
        '-'
      ),
  },
  {
    accessorKey: 'currentVersionTitle',
    header: 'Title',
    size: 320,
    cell: ({ row }) => row.original.currentVersionTitle ?? '-',
    meta: { sortBy: 'title' satisfies CourseSearchSortBy },
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 100,
    cell: ({ row }) => (row.original.active ? 'Yes' : 'No'),
    meta: { sortBy: 'active' satisfies CourseSearchSortBy },
  },
];

function getResultsSummary(state: CourseSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading course search results...';
  }

  if (state.status === 'error') {
    return 'Course search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No courses matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} courses`;
  }

  return 'Course search is ready.';
}

export function CourseSearchResultsPanel({
  resultsState,
  sortBy,
  sortDirection,
  resultsView,
  onToggleSort,
  onViewChange,
  onPageChange,
}: CourseSearchResultsPanelProps) {
  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyCourseSearchResults;

  const courseSearchTable = useReactTable({
    columns: courseSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseId),
    state: {
      columnVisibility: {
        active: resultsView === 'system',
      },
    },
  });

  return (
    <SearchResultsPanel
      status={resultsState.status}
      summary={getResultsSummary(resultsState)}
      table={courseSearchTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      viewOptions={resultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
      withBorder
      notice={{
        idleTitle: 'Course search is ready',
        idleMessage:
          'Search for courses using school, department, subject, course number, course code, or title.',
        loadingMessage: 'Loading course search results...',
        errorTitle: 'Unable to load course search results',
        errorMessage: resultsState.status === 'error' ? resultsState.message : null,
        emptyTitle: 'No course search results found',
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
