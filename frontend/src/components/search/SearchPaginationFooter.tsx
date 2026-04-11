import { Group, Pagination, Text } from '@mantine/core';

type SearchPaginationFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function SearchPaginationFooter({
  page,
  totalPages,
  onPageChange,
}: SearchPaginationFooterProps) {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Text size="sm">
        Page {page + 1} of {totalPages}
      </Text>
      <Pagination
        hideWithOnePage
        total={totalPages}
        value={page + 1}
        withEdges
        onChange={(nextPage) => {
          onPageChange(nextPage - 1);
        }}
      />
    </Group>
  );
}
