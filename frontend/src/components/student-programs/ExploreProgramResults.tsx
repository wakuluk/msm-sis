import { type ColumnDef, getCoreRowModel, type Row, useReactTable } from '@tanstack/react-table';
import { Badge } from '@mantine/core';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import type {
  ProgramSearchResultResponse,
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import {
  getExploreResultsSummary,
  getProgramTypeBadgeColor,
} from './explore-programs.helpers';
import type { ProgramExploreResultsState, SelectedExploreProgram } from './explore-programs.types';

type ExploreProgramResultsProps = {
  onPageChange: (page: number) => void;
  onSelectProgram: (program: ProgramSearchResultResponse) => void;
  onToggleSort: (sortBy: ProgramSearchSortBy) => void;
  resultsState: ProgramExploreResultsState;
  selectedProgram: SelectedExploreProgram;
  sortBy: ProgramSearchSortBy;
  sortDirection: ProgramSearchSortDirection;
};

const exploreProgramColumns: ColumnDef<ProgramSearchResultResponse>[] = [
  {
    accessorKey: 'programTypeName',
    header: 'Type',
    size: 130,
    cell: ({ row }) => (
      <Badge variant="light" color={getProgramTypeBadgeColor(row.original.programTypeCode)}>
        {row.original.programTypeName ?? '-'}
      </Badge>
    ),
    meta: { sortBy: 'programTypeName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'code',
    header: 'Code',
    size: 130,
    meta: { sortBy: 'code' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Program',
    size: 300,
    meta: { sortBy: 'name' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'degreeTypeName',
    header: 'Degree',
    size: 140,
    cell: ({ row }) => row.original.degreeTypeName ?? '-',
    meta: { sortBy: 'degreeTypeName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'schoolName',
    header: 'School',
    size: 220,
    cell: ({ row }) => row.original.schoolName ?? '-',
    meta: { sortBy: 'schoolName' satisfies ProgramSearchSortBy },
  },
  {
    accessorKey: 'departmentName',
    header: 'Department',
    size: 190,
    cell: ({ row }) => row.original.departmentName ?? '-',
    meta: { sortBy: 'departmentName' satisfies ProgramSearchSortBy },
  },
];

const emptyExplorePrograms: ProgramSearchResultResponse[] = [];

export function ExploreProgramResults({
  onPageChange,
  onSelectProgram,
  onToggleSort,
  resultsState,
  selectedProgram,
  sortBy,
  sortDirection,
}: ExploreProgramResultsProps) {
  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyExplorePrograms;
  const resultsTable = useReactTable({
    columns: exploreProgramColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.programId),
  });

  function getProgramRowProps(row: Row<ProgramSearchResultResponse>): SearchResultsTableRowProps {
    const isSelected = selectedProgram?.programId === row.original.programId;

    return {
      'aria-expanded': isSelected,
      'aria-selected': isSelected,
      onClick: () => {
        onSelectProgram(row.original);
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectProgram(row.original);
        }
      },
      role: 'button',
      tabIndex: 0,
    };
  }

  return (
    <SearchResultsPanel
      status={resultsState.status}
      summary={getExploreResultsSummary(resultsState)}
      table={resultsTable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      notice={{
        idleTitle: 'Search for a program',
        idleMessage: 'Use the filters above to find published programs you can explore.',
        loadingMessage: 'Loading programs...',
        errorTitle: 'Program search failed',
        errorMessage: resultsState.status === 'error' ? resultsState.message : null,
        emptyTitle: 'No programs found',
        emptyMessage: 'Try broadening the filters.',
      }}
      pagination={
        resultsState.status === 'success' || resultsState.status === 'empty'
          ? {
              page: resultsState.response.page,
              totalPages: resultsState.response.totalPages,
              onPageChange,
            }
          : null
      }
      getRowProps={getProgramRowProps}
      withBorder
    />
  );
}
