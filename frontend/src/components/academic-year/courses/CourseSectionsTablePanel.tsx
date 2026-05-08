// Search/filter/table panel for course sections.
// Displays sections for either one selected offering or all offerings in the current search scope.
import { Stack } from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import { CourseSectionsFilters } from './CourseSectionsFilters';
import { CourseSectionsPaginationSummary } from './CourseSectionsPaginationSummary';
import { CourseSectionsPanelAlerts } from './CourseSectionsPanelAlerts';
import { CourseSectionsResultsTable } from './CourseSectionsResultsTable';
import { CourseSectionsScopeSummary } from './CourseSectionsScopeSummary';
import type {
  CourseSectionPreview,
  CourseSectionSearchValues,
  SectionReferenceState,
  SelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionListErrorState = { status: 'error'; message: string } | { status: string };
type CourseSectionDetailErrorState = { status: 'error'; message: string } | { status: string };

type CourseSectionsTablePanelProps = {
  activeOfferingCount: number;
  allSectionCount: number;
  filteredSections: CourseSectionPreview[];
  hasActiveScope: boolean;
  isSearchScope: boolean;
  page: number;
  pagedSections: CourseSectionPreview[];
  referencesAreLoading: boolean;
  referenceState: SectionReferenceState;
  searchValues: CourseSectionSearchValues;
  sectionDetailState: CourseSectionDetailErrorState;
  sectionListState: CourseSectionListErrorState;
  sectionStatusOptions: SelectOption[];
  sectionsAreLoading: boolean;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  subTermLabel: string;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
  onSectionSelected: (section: CourseSectionPreview) => void;
};

const courseSectionsPageSize = 10;

export function CourseSectionsTablePanel({
  activeOfferingCount,
  allSectionCount,
  filteredSections,
  hasActiveScope,
  isSearchScope,
  page,
  pagedSections,
  referencesAreLoading,
  referenceState,
  searchValues,
  sectionDetailState,
  sectionListState,
  sectionStatusOptions,
  sectionsAreLoading,
  selectedOffering,
  subTermLabel,
  totalPages,
  onPageChange,
  onSearchValuesChange,
  onSectionSelected,
}: CourseSectionsTablePanelProps) {
  return (
    <Stack gap="md">
      <CourseSectionsScopeSummary
        activeOfferingCount={activeOfferingCount}
        allSectionCount={allSectionCount}
        hasActiveScope={hasActiveScope}
        isSearchScope={isSearchScope}
        sectionsAreLoading={sectionsAreLoading}
        selectedOffering={selectedOffering}
        subTermLabel={subTermLabel}
      />

      <CourseSectionsFilters
        hasActiveScope={hasActiveScope}
        isSearchScope={isSearchScope}
        referencesAreLoading={referencesAreLoading}
        searchValues={searchValues}
        sectionStatusOptions={sectionStatusOptions}
        onSearchValuesChange={onSearchValuesChange}
      />

      <CourseSectionsPanelAlerts
        filteredSectionCount={filteredSections.length}
        hasActiveScope={hasActiveScope}
        referenceState={referenceState}
        sectionDetailState={sectionDetailState}
        sectionListState={sectionListState}
        sectionsAreLoading={sectionsAreLoading}
      />

      {hasActiveScope && filteredSections.length > 0 ? (
        <CourseSectionsResultsTable
          isSearchScope={isSearchScope}
          sections={pagedSections}
          onSectionSelected={onSectionSelected}
        />
      ) : null}

      {hasActiveScope && filteredSections.length > 0 ? (
        <CourseSectionsPaginationSummary
          filteredSectionCount={filteredSections.length}
          page={page}
          pageSize={courseSectionsPageSize}
          pagedSectionCount={pagedSections.length}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </Stack>
  );
}
