import type { ReactNode } from 'react';
import type { Row, Table as TanstackTable } from '@tanstack/react-table';
import { Paper, Stack, Text } from '@mantine/core';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import {
  SearchResultsTable,
  type SearchResultsTableRowProps,
} from '@/components/search/SearchResultsTable';

type SearchResultsStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';
type SortDirection = 'asc' | 'desc';

type SearchResultsViewOption<T extends string> = {
  label: string;
  value: T;
};

type SearchResultsNoticeCopy = {
  idleTitle: string;
  idleMessage: string;
  loadingMessage: string;
  errorTitle?: string;
  errorMessage?: string | null;
  emptyTitle: string;
  emptyMessage: string;
};

type SearchResultsPagination = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type SearchResultsPanelProps<TRow, TSortBy extends string, TView extends string> = {
  status: SearchResultsStatus;
  summary: string;
  table: TanstackTable<TRow>;
  sortBy: TSortBy;
  sortDirection: SortDirection;
  onToggleSort: (sortBy: TSortBy) => void;
  notice: SearchResultsNoticeCopy;
  viewOptions?: ReadonlyArray<SearchResultsViewOption<TView>>;
  view?: TView;
  onViewChange?: (value: TView) => void;
  showHeader?: boolean;
  pagination?: SearchResultsPagination | null;
  getRowProps?: (row: Row<TRow>) => SearchResultsTableRowProps | undefined;
  renderExpandedRow?: (row: Row<TRow>) => ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  title?: string;
  withBorder?: boolean;
};

export function SearchResultsPanel<TRow, TSortBy extends string, TView extends string>({
  status,
  summary,
  table,
  sortBy,
  sortDirection,
  onToggleSort,
  notice,
  viewOptions,
  view,
  onViewChange,
  showHeader = true,
  pagination = null,
  getRowProps,
  renderExpandedRow,
  headerContent,
  footerContent,
  title,
  withBorder = false,
}: SearchResultsPanelProps<TRow, TSortBy, TView>) {
  const shouldShowTable = status === 'success';
  const shouldShowNotice = status !== 'success';
  const canShowViewHeader = viewOptions && view && onViewChange;

  return (
    <Paper withBorder={withBorder} radius="md" p="lg">
      <Stack gap="lg">
        {headerContent}
        {title ? <Text fw={600}>{title}</Text> : null}

        {showHeader && canShowViewHeader ? (
          <SearchResultsHeader
            data={viewOptions}
            value={view}
            onChange={onViewChange}
            summary={summary}
          />
        ) : showHeader ? (
          <Text size="sm">{summary}</Text>
        ) : null}

        {shouldShowNotice ? (
          <SearchResultsStateNotice
            status={status}
            idleTitle={notice.idleTitle}
            idleMessage={notice.idleMessage}
            loadingMessage={notice.loadingMessage}
            errorTitle={notice.errorTitle}
            errorMessage={notice.errorMessage}
            emptyTitle={notice.emptyTitle}
            emptyMessage={notice.emptyMessage}
          />
        ) : null}

        {shouldShowTable ? (
          <SearchResultsTable
            table={table}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onToggleSort={onToggleSort}
            getRowProps={getRowProps}
            renderExpandedRow={renderExpandedRow}
          />
        ) : null}

        {pagination ? (
          <SearchPaginationFooter
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        ) : null}

        {footerContent}
      </Stack>
    </Paper>
  );
}
