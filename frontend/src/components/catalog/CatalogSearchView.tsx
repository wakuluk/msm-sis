import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Container, Stack } from '@mantine/core';
import { CatalogSearchForm } from '@/components/catalog/CatalogSearchForm';
import { CatalogSearchResultsSection } from '@/components/catalog/CatalogSearchResultsSection';
import {
  useCatalogSearchPage,
  type CatalogSearchVariant,
} from '@/components/catalog/useCatalogSearchPage';
import {
  type CourseOfferingSearchResultResponse,
  type CourseOfferingSearchSortBy,
} from '@/services/schemas/catalog-schemas';

function formatCredits(result: CourseOfferingSearchResultResponse) {
  if (result.variableCredit && result.minCredits !== result.maxCredits) {
    return `${result.minCredits.toFixed(2)}-${result.maxCredits.toFixed(2)}`;
  }

  return result.minCredits.toFixed(2);
}

const courseOfferingResultsColumns: ColumnDef<CourseOfferingSearchResultResponse>[] = [
  {
    accessorKey: 'courseCode',
    header: 'Course',
    size: 126,
    meta: { sortBy: 'courseCode' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 320,
    meta: { sortBy: 'title' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'subTermName',
    header: 'Term',
    size: 156,
    cell: ({ row }) => row.original.subTermName,
    meta: { sortBy: 'subTermCode' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'subjectCode',
    header: 'Subject',
    size: 116,
    meta: { sortBy: 'subjectCode' satisfies CourseOfferingSearchSortBy },
  },
  {
    id: 'credits',
    header: 'Credits',
    size: 112,
    cell: ({ row }) => formatCredits(row.original),
    meta: { sortBy: 'minCredits' satisfies CourseOfferingSearchSortBy },
  },
];

type CatalogSearchViewProps = {
  variant: CatalogSearchVariant;
  title: string;
};

export function CatalogSearchView({ variant, title }: CatalogSearchViewProps) {
  const {
    form,
    academicYearOptions,
    termOptions,
    departmentOptions,
    subjectOptions,
    termStatusOptions,
    hasLoadedReferenceOptions,
    isLoadingReferenceOptions,
    hasSearchValues,
    isSearching,
    size,
    sortBy,
    sortDirection,
    selectedTermStatusCodes,
    includeInactive,
    publishedOnly,
    searchResultsState,
    resultsView,
    expandedCourseOfferingId,
    detailStateByCourseOfferingId,
    tableData,
    tableColumnVisibility,
    referenceOptionsErrorMessage,
    searchResultsIdle,
    setResultsView,
    setSelectedTermStatusCodes,
    setIncludeInactive,
    setPublishedOnly,
    toggleExpandedCourseOffering,
    handlePageSizeChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleClear,
    handleSubmit,
    toggleColumnSort,
    handlePageChange,
  } = useCatalogSearchPage({ variant });

  const courseOfferingResultsTable = useReactTable({
    columns: courseOfferingResultsColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseOfferingId),
    manualPagination: true,
    state: {
      columnVisibility: tableColumnVisibility,
    },
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <CatalogSearchForm
          title={title}
          showAdvancedFilters={variant === 'advanced'}
          form={form}
          academicYearOptions={academicYearOptions}
          termOptions={termOptions}
          departmentOptions={departmentOptions}
          subjectOptions={subjectOptions}
          termStatusOptions={termStatusOptions}
          hasLoadedReferenceOptions={hasLoadedReferenceOptions}
          isLoadingReferenceOptions={isLoadingReferenceOptions}
          hasSearchValues={hasSearchValues}
          isSearching={isSearching}
          pageSize={size}
          sortBy={sortBy}
          sortDirection={sortDirection}
          selectedTermStatusCodes={selectedTermStatusCodes}
          includeInactive={includeInactive}
          publishedOnly={publishedOnly}
          errorMessage={referenceOptionsErrorMessage}
          searchResultsIdle={searchResultsIdle}
          onTermStatusCodesChange={setSelectedTermStatusCodes}
          onIncludeInactiveChange={setIncludeInactive}
          onPublishedOnlyChange={setPublishedOnly}
          onPageSizeChange={handlePageSizeChange}
          onSortByChange={handleSortByChange}
          onSortDirectionChange={handleSortDirectionChange}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />

        <CatalogSearchResultsSection
          searchResultsState={searchResultsState}
          resultsView={resultsView}
          onResultsViewChange={setResultsView}
          table={courseOfferingResultsTable}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleColumnSort={toggleColumnSort}
          expandedCourseOfferingId={expandedCourseOfferingId}
          detailStateByCourseOfferingId={detailStateByCourseOfferingId}
          onToggleExpandedCourseOffering={toggleExpandedCourseOffering}
          onPageChange={handlePageChange}
        />
      </Stack>
    </Container>
  );
}
