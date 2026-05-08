import { useEffect, useState } from 'react';
import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  AcademicDepartmentsResultsPanel,
  type AcademicDepartmentsPageState,
} from '@/components/academic-department/AcademicDepartmentsResultsPanel';
import { searchAcademicDepartments } from '@/services/academic-department-service';
import type {
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
} from '@/services/schemas/academic-department-schemas';
import { getErrorMessage } from '@/utils/errors';

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
          message: getErrorMessage(error, 'Failed to load academic departments.'),
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

        <AcademicDepartmentsResultsPanel
          pageState={pageState}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          onOpenDepartment={handleOpenAcademicDepartmentDetail}
        />
      </Stack>
    </Container>
  );
}
