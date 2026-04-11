import type { Table as TanStackTable } from '@tanstack/react-table';
import { Alert, Badge, Collapse, Group, Loader, Paper, Stack, Table, Text } from '@mantine/core';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
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
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <div>
          <Text className="portal-ui-eyebrow-text">Search Results</Text>
          <Text fw={600}>Course offerings</Text>
        </div>

        {searchResultsState.status === 'empty' || searchResultsState.status === 'success' ? (
          <SearchResultsHeader
            data={[
              { label: 'Standard', value: 'standard' },
              { label: 'Full', value: 'full' },
            ]}
            value={resultsView}
            onChange={(value) => {
              onResultsViewChange(value as CatalogResultsView);
            }}
            summary={getResultsSummary(searchResultsState.response)}
          />
        ) : null}

        <SearchResultsStateNotice
          status={searchResultsState.status}
          idleTitle="Search course offerings"
          idleMessage="Choose filters if needed, then click `Search offerings` to load results."
          loadingMessage="Loading course offerings..."
          errorMessage={searchResultsState.status === 'error' ? searchResultsState.message : null}
          emptyTitle="No course offerings found"
          emptyMessage="No course offerings matched the current search criteria."
        />

        {searchResultsState.status === 'success' ? (
          <Stack gap="lg">
            <SearchResultsTable
              table={table}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onToggleSort={onToggleColumnSort}
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

                return (
                  <Table.Tr
                    className={isExpanded ? classes.expandedRow : classes.expandedRowCollapsed}
                    aria-hidden={!isExpanded}
                  >
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
                                    <Badge variant="outline">{detailState.detail.offeringStatusName}</Badge>
                                  </Group>
                                  <Text fw={600} mt={4}>
                                    {detailState.detail.title}
                                  </Text>
                                  <Text c="dimmed" size="sm" mt={4}>
                                    {detailState.detail.termName} · {formatCredits(detailState.detail)} credits
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
            />

            <SearchPaginationFooter
              page={searchResultsState.response.page}
              totalPages={searchResultsState.response.totalPages}
              onPageChange={onPageChange}
            />
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
