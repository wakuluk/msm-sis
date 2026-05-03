import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Alert, Badge, Button, Grid, Group, Stack, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  SearchResultsTable,
  type SearchResultsTableRowProps,
} from '@/components/search/SearchResultsTable';
import type {
  CourseVersionDetailResponse,
  CourseVersionSearchResponse,
  CourseVersionSearchSortBy,
  CourseVersionSearchSortDirection,
} from '@/services/schemas/course-schemas';
import { displayValue } from '@/utils/form-values';

function displayCredits(courseVersion: CourseVersionDetailResponse): string {
  if (courseVersion.variableCredit) {
    return `${courseVersion.minCredits}-${courseVersion.maxCredits}`;
  }

  return String(courseVersion.minCredits);
}

const courseVersionColumns: ColumnDef<CourseVersionDetailResponse>[] = [
  {
    accessorKey: 'versionNumber',
    header: 'Version',
    size: 120,
    meta: { sortBy: 'versionNumber' satisfies CourseVersionSearchSortBy },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 520,
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text size="sm">{displayValue(row.original.title)}</Text>
        {row.original.catalogDescription ? (
          <Text size="xs" c="dimmed">
            {row.original.catalogDescription}
          </Text>
        ) : null}
      </Stack>
    ),
    meta: { sortBy: 'title' satisfies CourseVersionSearchSortBy },
  },
  {
    id: 'credits',
    header: 'Credits',
    size: 140,
    cell: ({ row }) => displayCredits(row.original),
    meta: { sortBy: 'credits' satisfies CourseVersionSearchSortBy },
  },
  {
    accessorKey: 'current',
    header: 'Current',
    size: 140,
    cell: ({ row }) => (
      <Group gap="xs">
        <Badge size="sm" variant="light" color={row.original.current ? 'green' : 'gray'}>
          {row.original.current ? 'Current' : 'Historical'}
        </Badge>
      </Group>
    ),
    meta: { sortBy: 'current' satisfies CourseVersionSearchSortBy },
  },
];

type CourseVersionsSectionProps = {
  response: CourseVersionSearchResponse | null;
  courseVersions: CourseVersionDetailResponse[];
  selectedCourseVersionId: number | null;
  sortBy: CourseVersionSearchSortBy;
  sortDirection: CourseVersionSearchSortDirection;
  onCreateVersion: () => void;
  onOpenVersion: (courseVersion: CourseVersionDetailResponse) => void;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  onToggleSort: (sortBy: CourseVersionSearchSortBy) => void;
};

export function CourseVersionsSection({
  response,
  courseVersions,
  selectedCourseVersionId,
  sortBy,
  sortDirection,
  onCreateVersion,
  onOpenVersion,
  onPageChange,
  onToggleSort,
}: CourseVersionsSectionProps) {
  const table = useReactTable({
    columns: courseVersionColumns,
    data: courseVersions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseVersionId),
  });

  function getCourseVersionRowProps(
    courseVersion: CourseVersionDetailResponse
  ): SearchResultsTableRowProps {
    return {
      role: 'button',
      tabIndex: 0,
      'aria-expanded': selectedCourseVersionId === courseVersion.courseVersionId,
      onClick: () => {
        onOpenVersion(courseVersion);
      },
      onKeyDown: (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        onOpenVersion(courseVersion);
      },
    };
  }

  return (
    <RecordPageSection
      title="Course Versions"
      description="Versions currently returned by the backend for this course."
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Text size="sm">
              {courseVersions.length === 0
                ? 'This course does not have any versions yet.'
                : `Showing ${courseVersions.length} of ${response?.totalElements ?? 0} course versions`}
            </Text>
            <Button size="xs" onClick={onCreateVersion}>
              New version
            </Button>
          </Group>

          {courseVersions.length === 0 ? (
            <Alert color="gray" title="No course versions found">
              This course does not have any versions yet.
            </Alert>
          ) : (
            <Stack gap="md">
              <Group justify="flex-end" align="center" wrap="wrap">
                <Group gap="sm">
                  <Button
                    size="xs"
                    variant="light"
                    disabled={(response?.page ?? 0) <= 0}
                    onClick={() => {
                      onPageChange((currentPage) => Math.max(0, currentPage - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Text size="sm">
                    Page {(response?.page ?? 0) + 1} of {Math.max(response?.totalPages ?? 0, 1)}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    disabled={(response?.page ?? 0) + 1 >= (response?.totalPages ?? 0)}
                    onClick={() => {
                      onPageChange((currentPage) => currentPage + 1);
                    }}
                  >
                    Next
                  </Button>
                </Group>
              </Group>

              <SearchResultsTable
                table={table}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onToggleSort={onToggleSort}
                getRowProps={(row) => getCourseVersionRowProps(row.original)}
              />
            </Stack>
          )}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
