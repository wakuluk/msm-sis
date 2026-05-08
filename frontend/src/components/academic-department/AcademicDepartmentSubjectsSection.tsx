import type { ReactNode } from 'react';
import { type ColumnDef, getCoreRowModel, type Row, useReactTable } from '@tanstack/react-table';
import { Button, Grid, Group, Stack, Table } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import type {
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
  AcademicDepartmentSubjectResponse,
} from '@/services/schemas/academic-department-schemas';
import classes from './AcademicDepartmentSubjectsSection.module.css';

type AcademicDepartmentSubjectsSectionProps = {
  actionsDisabled: boolean;
  expandedSubjectIds: number[];
  onAddSubjectClick: () => void;
  onCreateCourseClick: () => void;
  onToggleSort: (sortBy: AcademicDepartmentSortBy) => void;
  onToggleSubjectExpansion: (subjectId: number) => void;
  renderSubjectCourses: (subject: AcademicDepartmentSubjectResponse) => ReactNode;
  sortBy: AcademicDepartmentSortBy;
  sortDirection: AcademicDepartmentSortDirection;
  subjects: AcademicDepartmentSubjectResponse[];
};

export function AcademicDepartmentSubjectsSection({
  actionsDisabled,
  expandedSubjectIds,
  onAddSubjectClick,
  onCreateCourseClick,
  onToggleSort,
  onToggleSubjectExpansion,
  renderSubjectCourses,
  sortBy,
  sortDirection,
  subjects,
}: AcademicDepartmentSubjectsSectionProps) {
  function isSubjectExpanded(subjectId: number): boolean {
    return expandedSubjectIds.includes(subjectId);
  }

  const academicDepartmentSubjectColumns: ColumnDef<AcademicDepartmentSubjectResponse>[] = [
    {
      id: 'expand',
      header: '',
      size: 56,
      cell: ({ row }) => (isSubjectExpanded(row.original.subjectId) ? '▾' : '▸'),
    },
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

  const academicDepartmentSubjectsTable = useReactTable({
    columns: academicDepartmentSubjectColumns,
    data: subjects,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.subjectId),
  });

  return (
    <RecordPageSection
      title="Academic Subjects"
      action={
        <Group gap="sm" wrap="wrap" justify="flex-end">
          <Button variant="light" onClick={onAddSubjectClick} disabled={actionsDisabled}>
            Add subject
          </Button>
          <Button onClick={onCreateCourseClick} disabled={actionsDisabled}>
            Create course
          </Button>
        </Group>
      }
    >
      <Grid.Col span={12}>
        {subjects.length === 0 ? (
          <SearchResultsStateNotice
            status="empty"
            idleTitle=""
            idleMessage=""
            loadingMessage=""
            emptyTitle="No subjects found"
            emptyMessage="Add academic subjects to this department before using this section."
          />
        ) : (
          <SearchResultsTable
            table={academicDepartmentSubjectsTable}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onToggleSort={onToggleSort}
            getRowProps={(row: Row<AcademicDepartmentSubjectResponse>) => ({
              'aria-expanded': isSubjectExpanded(row.original.subjectId),
              className: isSubjectExpanded(row.original.subjectId)
                ? classes.subjectExpandedRow
                : undefined,
              onClick: () => {
                onToggleSubjectExpansion(row.original.subjectId);
              },
              onKeyDown: (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return;
                }

                event.preventDefault();
                onToggleSubjectExpansion(row.original.subjectId);
              },
              role: 'button',
              tabIndex: 0,
            })}
            renderExpandedRow={(row: Row<AcademicDepartmentSubjectResponse>) => {
              if (!isSubjectExpanded(row.original.subjectId)) {
                return null;
              }

              return (
                <Table.Tr key={`${row.id}-expanded`} className={classes.expandedCoursesRow}>
                  <Table.Td
                    colSpan={row.getVisibleCells().length}
                    className={classes.expandedCoursesCell}
                  >
                    <Stack gap="sm" py="sm" className={classes.expandedCoursesContent}>
                      {renderSubjectCourses(row.original)}
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              );
            }}
          />
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}
