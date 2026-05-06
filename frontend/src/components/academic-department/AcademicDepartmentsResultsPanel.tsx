import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  AcademicDepartmentResponse,
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
  AcademicDepartmentsResponse,
} from '@/services/schemas/academic-department-schemas';

export type AcademicDepartmentsPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; departments: AcademicDepartmentsResponse }
  | { status: 'success'; departments: AcademicDepartmentsResponse };

type AcademicDepartmentsResultsPanelProps = {
  pageState: AcademicDepartmentsPageState;
  sortBy: AcademicDepartmentSortBy;
  sortDirection: AcademicDepartmentSortDirection;
  onToggleSort: (sortBy: AcademicDepartmentSortBy) => void;
  onOpenDepartment: (departmentId: number) => void;
};

const emptyAcademicDepartments: AcademicDepartmentsResponse = [];

const academicDepartmentColumns: ColumnDef<AcademicDepartmentResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 180,
    meta: { sortBy: 'code' satisfies AcademicDepartmentSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 360,
    meta: { sortBy: 'name' satisfies AcademicDepartmentSortBy },
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 120,
    cell: ({ row }) => (row.original.active ? 'Yes' : 'No'),
    meta: { sortBy: 'active' satisfies AcademicDepartmentSortBy },
  },
];

function getResultsSummary(state: AcademicDepartmentsPageState): string {
  if (state.status === 'loading') {
    return 'Loading academic departments...';
  }

  if (state.status === 'error') {
    return 'Academic department load failed.';
  }

  const count = state.departments.length;

  if (count === 0) {
    return 'No academic departments found.';
  }

  return `Showing ${count} academic departments`;
}

export function AcademicDepartmentsResultsPanel({
  pageState,
  sortBy,
  sortDirection,
  onToggleSort,
  onOpenDepartment,
}: AcademicDepartmentsResultsPanelProps) {
  const tableData =
    pageState.status === 'success' || pageState.status === 'empty'
      ? pageState.departments
      : emptyAcademicDepartments;

  const academicDepartmentsTable = useReactTable({
    columns: academicDepartmentColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.departmentId),
  });

  return (
    <SearchResultsPanel
      status={pageState.status}
      summary={getResultsSummary(pageState)}
      table={academicDepartmentsTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      notice={{
        idleTitle: '',
        idleMessage: '',
        loadingMessage: 'Loading academic departments...',
        errorTitle: 'Unable to load academic departments',
        errorMessage: pageState.status === 'error' ? pageState.message : null,
        emptyTitle: 'No academic departments found',
        emptyMessage: 'Add academic departments before using this page.',
      }}
      getRowProps={(row) => ({
        role: 'button',
        tabIndex: 0,
        onClick: () => {
          onOpenDepartment(row.original.departmentId);
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenDepartment(row.original.departmentId);
          }
        },
      })}
    />
  );
}
