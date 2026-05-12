import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  AthleticsSportModal,
  type AthleticsSportFormValues,
} from '@/components/athletics/AthleticsSportModal';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import {
  createAthleticSport,
  getAthleticSports,
  patchAthleticSport,
} from '@/services/athletics-service';
import type { AthleticSportResponse } from '@/services/schemas/athletics-schemas';

type AthleticsSportSortBy = 'active' | 'code' | 'name' | 'updatedAt' | 'updatedBy';
type AthleticsSportSortDirection = 'asc' | 'desc';

const athleticsSportColumns: ColumnDef<AthleticSportResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 130,
    meta: { sortBy: 'code' satisfies AthleticsSportSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Sport',
    size: 280,
    meta: { sortBy: 'name' satisfies AthleticsSportSortBy },
  },
  {
    accessorKey: 'active',
    header: 'Status',
    size: 140,
    cell: ({ row }) => (
      <Badge variant="light" color={row.original.active ? 'green' : 'gray'}>
        {row.original.active ? 'Active' : 'Inactive'}
      </Badge>
    ),
    meta: { sortBy: 'active' satisfies AthleticsSportSortBy },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    size: 210,
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
    meta: { sortBy: 'updatedAt' satisfies AthleticsSportSortBy },
  },
  {
    accessorKey: 'updatedBy',
    header: 'Updated By',
    size: 190,
    meta: { sortBy: 'updatedBy' satisfies AthleticsSportSortBy },
  },
];

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function compareValues(firstValue: string | number | boolean, secondValue: string | number | boolean) {
  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue;
  }

  if (typeof firstValue === 'boolean' && typeof secondValue === 'boolean') {
    return Number(firstValue) - Number(secondValue);
  }

  return String(firstValue).localeCompare(String(secondValue));
}

function getSortValue(sport: AthleticSportResponse, sortBy: AthleticsSportSortBy) {
  switch (sortBy) {
    case 'active':
      return sport.active;
    case 'code':
      return sport.code;
    case 'name':
      return sport.name;
    case 'updatedAt':
      return sport.updatedAt ? new Date(sport.updatedAt).getTime() : 0;
    case 'updatedBy':
      return sport.updatedBy ?? '';
  }
}

function sortSports(
  sports: AthleticSportResponse[],
  sortBy: AthleticsSportSortBy,
  sortDirection: AthleticsSportSortDirection
) {
  const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

  return [...sports].sort((firstSport, secondSport) => {
    const comparison = compareValues(
      getSortValue(firstSport, sortBy),
      getSortValue(secondSport, sortBy)
    );

    return comparison * directionMultiplier;
  });
}

function getResultsSummary(sports: AthleticSportResponse[]) {
  const activeCount = sports.filter((sport) => sport.active).length;

  return `Showing ${sports.length} sports, ${activeCount} active`;
}

export function AthleticsPage() {
  const [sports, setSports] = useState<AthleticSportResponse[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSports, setIsLoadingSports] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingSport, setIsSavingSport] = useState(false);
  const [sortBy, setSortBy] = useState<AthleticsSportSortBy>('name');
  const [sortDirection, setSortDirection] = useState<AthleticsSportSortDirection>('asc');
  const [selectedSport, setSelectedSport] = useState<AthleticSportResponse | null>(null);
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  const sortedSports = useMemo(
    () => sortSports(sports, sortBy, sortDirection),
    [sports, sortBy, sortDirection]
  );
  const resultsStatus = loadError
    ? 'error'
    : isLoadingSports
      ? 'loading'
      : sports.length > 0
        ? 'success'
        : 'empty';
  const sportsTable = useReactTable({
    columns: athleticsSportColumns,
    data: sortedSports,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.athleticSportId),
  });

  useEffect(() => {
    const abortController = new AbortController();
    setIsLoadingSports(true);
    setLoadError(null);

    getAthleticSports({ signal: abortController.signal })
      .then((response) => {
        setSports(response.sports);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : 'Failed to load athletic sports.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingSports(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  function handleToggleSort(nextSortBy: AthleticsSportSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleOpenCreateSportModal() {
    setSelectedSport(null);
    setSaveError(null);
    setIsSportModalOpen(true);
  }

  function handleOpenEditSportModal(sport: AthleticSportResponse) {
    setSelectedSport(sport);
    setSaveError(null);
    setIsSportModalOpen(true);
  }

  function handleCloseSportModal() {
    setIsSportModalOpen(false);
    setSelectedSport(null);
  }

  async function handleSaveSport(values: AthleticsSportFormValues) {
    setIsSavingSport(true);
    setSaveError(null);

    try {
      if (selectedSport) {
        const updatedSport = await patchAthleticSport({
          athleticSportId: selectedSport.athleticSportId,
          request: values,
        });

        setSports((currentSports) =>
          currentSports.map((sport) =>
            sport.athleticSportId === selectedSport.athleticSportId ? updatedSport : sport
          )
        );
        setSelectedSport(updatedSport);
        setIsSportModalOpen(false);
        return;
      }

      const createdSport = await createAthleticSport({ request: values });

      setSports((currentSports) => [...currentSports, createdSport]);
      setSelectedSport(createdSport);
      setIsSportModalOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save athletic sport.');
    } finally {
      setIsSavingSport(false);
    }
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
            <Stack gap="xs">
              <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
              <Title order={1}>Athletics</Title>
              <Text size="sm" c="dimmed">
                Manage sports used for athlete grouping and registration priority.
              </Text>
            </Stack>
            <Button onClick={handleOpenCreateSportModal}>Create Sport</Button>
          </Group>
        </Paper>

        <SearchResultsPanel
          status={resultsStatus}
          summary={getResultsSummary(sports)}
          table={sportsTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          withBorder
          notice={{
            idleTitle: '',
            idleMessage: '',
            loadingMessage: 'Loading sports...',
            errorTitle: 'Unable to load sports',
            errorMessage: loadError,
            emptyTitle: 'No sports found',
            emptyMessage: 'Create a sport before assigning athletes.',
          }}
          getRowProps={(row) => ({
            role: 'button',
            tabIndex: 0,
            'aria-selected': selectedSport?.athleticSportId === row.original.athleticSportId,
            onClick: () => {
              handleOpenEditSportModal(row.original);
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenEditSportModal(row.original);
              }
            },
          })}
        />

      </Stack>

      <AthleticsSportModal
        error={saveError}
        opened={isSportModalOpen}
        saving={isSavingSport}
        sport={selectedSport}
        onClose={handleCloseSportModal}
        onSave={handleSaveSport}
      />
    </Container>
  );
}
