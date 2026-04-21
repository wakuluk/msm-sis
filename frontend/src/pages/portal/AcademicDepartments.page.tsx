import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import { searchAcademicDepartments } from '@/services/academic-department-service';
import type {
  AcademicDepartmentResponse,
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
  AcademicDepartmentsResponse,
} from '@/services/schemas/academic-department-schemas';

type AcademicDepartmentsPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; departments: AcademicDepartmentsResponse }
  | { status: 'success'; departments: AcademicDepartmentsResponse };

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

function getErrorMessage(
  error: unknown,
  fallbackMessage = 'Failed to load academic departments.'
): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

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

export function AcademicDepartmentsPage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<AcademicDepartmentSortBy>('name');
  const [sortDirection, setSortDirection] = useState<AcademicDepartmentSortDirection>('asc');
  const [pageState, setPageState] = useState<AcademicDepartmentsPageState>({
    status: 'loading',
  });

  useEffect(() => {
    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    searchAcademicDepartments({
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((departments) => {
        setPageState(
          departments.length === 0
            ? { status: 'empty', departments }
            : { status: 'success', departments }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [sortBy, sortDirection]);

  function handleToggleSort(nextSortBy: AcademicDepartmentSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleOpenAcademicDepartmentDetail(departmentId: number) {
    navigate(`/academics/departments/${departmentId}`, {
      state: { source: 'search' },
    });
  }

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
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
            <Title order={1}>Academic Departments</Title>
            <Text size="sm" c="dimmed">
              Review the configured academic departments and their active state.
            </Text>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Stack gap="md">
            <Text size="sm">{getResultsSummary(pageState)}</Text>

            {pageState.status === 'loading' || pageState.status === 'error' || pageState.status === 'empty' ? (
              <SearchResultsStateNotice
                status={pageState.status}
                idleTitle=""
                idleMessage=""
                loadingMessage="Loading academic departments..."
                errorTitle="Unable to load academic departments"
                errorMessage={pageState.status === 'error' ? pageState.message : null}
                emptyTitle="No academic departments found"
                emptyMessage="Add academic departments before using this page."
              />
            ) : (
              <SearchResultsTable
                table={academicDepartmentsTable}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onToggleSort={handleToggleSort}
                getRowProps={(row) => ({
                  role: 'button',
                  tabIndex: 0,
                  onClick: () => {
                    handleOpenAcademicDepartmentDetail(row.original.departmentId);
                  },
                  onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleOpenAcademicDepartmentDetail(row.original.departmentId);
                    }
                  },
                })}
              />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
