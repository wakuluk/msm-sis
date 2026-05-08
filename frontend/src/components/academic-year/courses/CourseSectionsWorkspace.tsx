// Orchestrates the course-section management workspace.
// Delegates workspace state to useCourseSectionsWorkspace and renders the table/modal shell.
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import { CourseSectionModalContainer } from './CourseSectionModalContainer';
import { CourseSectionsWorkspaceSection } from './CourseSectionsWorkspaceSection';
import {
  initialCourseSectionSearchValues,
  type CourseSectionSearchValues,
} from './courseSectionsWorkspaceTypes';
import { useCourseSectionsWorkspace } from './useCourseSectionsWorkspace';

export { initialCourseSectionSearchValues };
export type { CourseSectionSearchValues };

type CourseSectionsWorkspaceProps = {
  activeAction: 'add' | 'view';
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedOfferings?: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  searchValues: CourseSectionSearchValues;
  subTermId: number;
  subTermLabel: string;
  onAddSection: () => void;
  onCancelAdd: () => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
};

export function CourseSectionsWorkspace({
  activeAction,
  selectedOffering,
  selectedOfferings,
  searchValues,
  subTermId,
  subTermLabel,
  onAddSection,
  onCancelAdd,
  onSearchValuesChange,
}: CourseSectionsWorkspaceProps) {
  const workspace = useCourseSectionsWorkspace({
    activeAction,
    onCancelAdd,
    onSearchValuesChange,
    searchValues,
    selectedOffering,
    selectedOfferings,
    subTermId,
  });

  return (
    <>
      <CourseSectionsWorkspaceSection
        activeOfferingCount={workspace.activeOfferings.length}
        allSectionCount={workspace.allSections.length}
        canAddSection={Boolean(selectedOffering && !workspace.isSearchScope)}
        filteredSections={workspace.filteredSections}
        hasActiveScope={workspace.hasActiveScope}
        isSearchScope={workspace.isSearchScope}
        page={workspace.page}
        pagedSections={workspace.pagedSections}
        referencesAreLoading={workspace.referencesAreLoading}
        referenceState={workspace.referenceState}
        searchValues={searchValues}
        sectionDetailState={workspace.sectionDetailState}
        sectionListState={workspace.sectionListState}
        sectionStatusOptions={workspace.sectionStatusOptions}
        sectionsAreLoading={workspace.sectionsAreLoading}
        selectedOffering={selectedOffering}
        subTermLabel={subTermLabel}
        totalPages={workspace.totalPages}
        workspaceDescription={workspace.workspaceDescription}
        onAddSection={onAddSection}
        onClearSectionFilters={workspace.clearSectionFilters}
        onPageChange={workspace.setPage}
        onSearchValuesChange={onSearchValuesChange}
        onSectionSelected={workspace.handleSectionSelected}
      />

      <CourseSectionModalContainer subTermLabel={subTermLabel} workspace={workspace} />
    </>
  );
}
