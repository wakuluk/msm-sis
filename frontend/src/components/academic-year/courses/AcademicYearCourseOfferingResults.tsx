import { Button, Group, Text } from '@mantine/core';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import {
  type YearOfferingResultsView,
  type YearOfferingSearchSortBy,
  type YearOfferingSearchSortDirection,
  type YearOfferingSearchState,
  yearOfferingResultsViewOptions,
} from './useAcademicYearCourseOfferingSearch';

type AcademicYearCourseOfferingResultsProps = {
  onOfferingSelected?: (offering: AcademicYearCourseOfferingSearchResultResponse) => void;
  onPageChange: (page: number) => void;
  onToggleSort: (sortBy: YearOfferingSearchSortBy) => void;
  onViewChange: (view: YearOfferingResultsView) => void;
  onViewSearchSections?: (
    offerings: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>
  ) => void;
  resultsPanelStatus: 'idle' | 'loading' | 'error' | 'empty' | 'success';
  resultsSummary: string;
  resultsView: YearOfferingResultsView;
  searchState: YearOfferingSearchState;
  sortBy: YearOfferingSearchSortBy;
  sortDirection: YearOfferingSearchSortDirection;
  table: TanstackTable<AcademicYearCourseOfferingSearchResultResponse>;
  tableData: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
};

export function AcademicYearCourseOfferingResults({
  onOfferingSelected,
  onPageChange,
  onToggleSort,
  onViewChange,
  onViewSearchSections,
  resultsPanelStatus,
  resultsSummary,
  resultsView,
  searchState,
  sortBy,
  sortDirection,
  table,
  tableData,
}: AcademicYearCourseOfferingResultsProps) {
  function handleOfferingSelected(offering: AcademicYearCourseOfferingSearchResultResponse) {
    onOfferingSelected?.(offering);
  }

  function handleViewSearchSections() {
    onViewSearchSections?.(tableData);
  }

  return (
    <SearchResultsPanel
      status={resultsPanelStatus}
      summary={resultsSummary}
      table={table}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleSort}
      viewOptions={yearOfferingResultsViewOptions}
      view={resultsView}
      onViewChange={onViewChange}
      notice={{
        idleTitle: '',
        idleMessage: '',
        loadingMessage: 'Fetching the paged course offering list for this academic year.',
        errorTitle: 'Unable to load academic year offerings',
        errorMessage: searchState.status === 'error' ? searchState.message : null,
        emptyTitle: 'No offerings match these filters',
        emptyMessage: 'No course offerings were found for the selected academic year filters.',
      }}
      getRowProps={
        onOfferingSelected
          ? (row) => ({
              tabIndex: 0,
              onClick: () => {
                handleOfferingSelected(row.original);
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOfferingSelected(row.original);
                }
              },
            })
          : undefined
      }
      pagination={
        searchState.status === 'success' && searchState.response.results.length > 0
          ? {
              page: searchState.response.page,
              totalPages: searchState.response.totalPages,
              onPageChange,
            }
          : null
      }
      footerContent={
        searchState.status === 'success' && searchState.response.results.length > 0 ? (
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Text size="sm" c="dimmed">
              {searchState.response.totalElements} offerings found, limited to{' '}
              {searchState.response.size} rows per page.
            </Text>
            {onViewSearchSections ? (
              <Button variant="light" onClick={handleViewSearchSections}>
                View offering sections
              </Button>
            ) : null}
          </Group>
        ) : null
      }
    />
  );
}
