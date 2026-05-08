import type { Table as TanStackTable } from '@tanstack/react-table';
import { Alert, Collapse, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import type {
  CourseOfferingDetailResponse,
  CourseOfferingSearchResponse,
  CourseOfferingSearchResultResponse,
  CourseOfferingSearchSortBy,
  CourseOfferingSortDirection,
} from '@/services/schemas/catalog-schemas';
import classes from './CatalogSearchResultsSection.module.css';

export type CatalogSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: CourseOfferingSearchResponse }
  | { status: 'success'; response: CourseOfferingSearchResponse };

export type CatalogResultsView = 'standard' | 'full';

export type CourseOfferingDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; detail: CourseOfferingDetailResponse };

type CatalogSearchResultsSectionProps = {
  searchResultsState: CatalogSearchResultsState;
  resultsView: CatalogResultsView;
  onResultsViewChange: (view: CatalogResultsView) => void;
  table: TanStackTable<CourseOfferingSearchResultResponse>;
  sortBy: CourseOfferingSearchSortBy;
  sortDirection: CourseOfferingSortDirection;
  onToggleColumnSort: (sortBy: CourseOfferingSearchSortBy) => void;
  expandedCourseOfferingId: number | null;
  detailStateByCourseOfferingId: Record<number, CourseOfferingDetailState>;
  onToggleExpandedCourseOffering: (courseOfferingId: number) => void | Promise<void>;
  onPageChange: (page: number) => void;
};

function getResultsSummary(response: CourseOfferingSearchResponse) {
  if (response.totalElements === 0 || response.results.length === 0) {
    return 'No course offerings matched the current search criteria.';
  }

  const start = response.page * response.size + 1;
  const end = response.page * response.size + response.results.length;

  return `Showing ${start}-${end} of ${response.totalElements} course offerings`;
}

function formatCredits(detail: CourseOfferingDetailResponse) {
  if (detail.variableCredit && detail.minCredits !== detail.maxCredits) {
    return `${detail.minCredits.toFixed(2)}-${detail.maxCredits.toFixed(2)}`;
  }

  return detail.minCredits.toFixed(2);
}

export function CatalogSearchResultsSection({
  searchResultsState,
  resultsView,
  onResultsViewChange,
  table,
  sortBy,
  sortDirection,
  onToggleColumnSort,
  expandedCourseOfferingId,
  detailStateByCourseOfferingId,
  onToggleExpandedCourseOffering,
  onPageChange,
}: CatalogSearchResultsSectionProps) {
  return (
    <SearchResultsPanel
      withBorder
      status={searchResultsState.status}
      summary={
        searchResultsState.status === 'empty' || searchResultsState.status === 'success'
          ? getResultsSummary(searchResultsState.response)
          : ''
      }
      table={table}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onToggleSort={onToggleColumnSort}
      showHeader={searchResultsState.status === 'empty' || searchResultsState.status === 'success'}
      viewOptions={[
        { label: 'Standard', value: 'standard' },
        { label: 'Full', value: 'full' },
      ]}
      view={resultsView}
      onViewChange={(value) => {
        onResultsViewChange(value as CatalogResultsView);
      }}
      headerContent={
        <div>
          <Text className="portal-ui-eyebrow-text">Search Results</Text>
          <Text fw={600}>Course offerings</Text>
        </div>
      }
      notice={{
        idleTitle: 'Search course offerings',
        idleMessage: 'Choose filters if needed, then click `Search offerings` to load results.',
        loadingMessage: 'Loading course offerings...',
        errorMessage: searchResultsState.status === 'error' ? searchResultsState.message : null,
        emptyTitle: 'No course offerings found',
        emptyMessage: 'No course offerings matched the current search criteria.',
      }}
      getRowProps={(row) => {
        const isExpanded = expandedCourseOfferingId === row.original.courseOfferingId;

        return {
          role: 'button',
          tabIndex: 0,
          'aria-expanded': isExpanded,
          onClick: () => {
            void onToggleExpandedCourseOffering(row.original.courseOfferingId);
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              void onToggleExpandedCourseOffering(row.original.courseOfferingId);
            }
          },
        };
      }}
      renderExpandedRow={(row) => {
        const detailState = detailStateByCourseOfferingId[row.original.courseOfferingId];
        const isExpanded = expandedCourseOfferingId === row.original.courseOfferingId;

        if (!isExpanded) {
          return null;
        }

        return (
          <Table.Tr className={classes.expandedRow}>
            <Table.Td colSpan={row.getVisibleCells().length} className={classes.expandedCell}>
              <Collapse expanded={isExpanded} transitionDuration={380} transitionTimingFunction="ease">
                <div className={classes.expandedPanel}>
                  {detailState?.status === 'loading' ? (
                    <Group gap="sm" align="center">
                      <Loader size="sm" />
                      <Text size="sm">Loading course offering details...</Text>
                    </Group>
                  ) : null}

                  {detailState?.status === 'error' ? (
                    <Alert color="red" title="Unable to load details">
                      {detailState.message}
                    </Alert>
                  ) : null}

                  {detailState?.status === 'success' ? (
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start" gap="md">
                        <div>
                          <Group gap="sm" wrap="wrap">
                            <Text fw={700}>{detailState.detail.courseCode}</Text>
                          </Group>
                          <Text fw={600} mt={4}>
                            {detailState.detail.title}
                          </Text>
                          <Text c="dimmed" size="sm" mt={4}>
                            {detailState.detail.subTerms.map((subTerm) => subTerm.name).join(', ')} ·{' '}
                            {formatCredits(detailState.detail)} credits
                          </Text>
                        </div>
                      </Group>

                      <Text size="sm" className={classes.expandedDescription}>
                        {detailState.detail.catalogDescription ?? 'No catalog description available.'}
                      </Text>

                      {detailState.detail.notes ? (
                        <Text size="sm" c="dimmed">
                          Notes: {detailState.detail.notes}
                        </Text>
                      ) : null}
                    </Stack>
                  ) : null}
                </div>
              </Collapse>
            </Table.Td>
          </Table.Tr>
        );
      }}
      pagination={
        searchResultsState.status === 'success'
          ? {
              page: searchResultsState.response.page,
              totalPages: searchResultsState.response.totalPages,
              onPageChange,
            }
          : null
      }
    />
  );
}
