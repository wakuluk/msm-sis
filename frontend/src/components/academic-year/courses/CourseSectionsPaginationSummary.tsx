// Pagination footer and count summary for course section results.
import { Group, Text } from '@mantine/core';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';

type CourseSectionsPaginationSummaryProps = {
  filteredSectionCount: number;
  page: number;
  pageSize: number;
  pagedSectionCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function CourseSectionsPaginationSummary({
  filteredSectionCount,
  page,
  pageSize,
  pagedSectionCount,
  totalPages,
  onPageChange,
}: CourseSectionsPaginationSummaryProps) {
  return (
    <Group justify="space-between" align="center" gap="sm" wrap="wrap">
      <Text size="sm" c="dimmed">
        Showing {page * pageSize + 1}-
        {Math.min(page * pageSize + pagedSectionCount, filteredSectionCount)} of{' '}
        {filteredSectionCount} sections
      </Text>
      <SearchPaginationFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </Group>
  );
}
