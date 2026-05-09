import { useMemo, useRef, useState } from 'react';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type { CourseSectionSearchValues } from './courseSectionsWorkspaceTypes';
import { useCourseSectionList } from './useCourseSectionList';
import { useCourseSectionModalState } from './useCourseSectionModalState';
import { useCourseSectionMutations } from './useCourseSectionMutations';
import { useCourseSectionReferences } from './useCourseSectionReferences';
import { useCourseSectionStaffSearch } from './useCourseSectionStaffSearch';

type CourseSectionDetailState =
  | { status: 'idle' }
  | { status: 'loading'; sectionId: number }
  | { status: 'error'; message: string };

type UseCourseSectionsWorkspaceParams = {
  activeAction: 'add' | 'view';
  onCancelAdd: () => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
  searchValues: CourseSectionSearchValues;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedOfferings?: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  subTermId: number;
};

export function useCourseSectionsWorkspace({
  activeAction,
  onCancelAdd,
  onSearchValuesChange,
  searchValues,
  selectedOffering,
  selectedOfferings,
  subTermId,
}: UseCourseSectionsWorkspaceParams) {
  const [sectionDetailState] = useState<CourseSectionDetailState>({
    status: 'idle',
  });
  const {
    activeOfferings,
    allSections,
    clearSectionFilters,
    filteredSections,
    handleSectionSelected,
    hasActiveScope,
    isSearchScope,
    pagedSections,
    page,
    reloadSectionList,
    sectionListState,
    sectionsAreLoading,
    setPage,
    totalPages,
    workspaceDescription,
  } = useCourseSectionList({
    onSearchValuesChange,
    searchValues,
    selectedOffering,
    selectedOfferings,
    subTermId,
  });
  const { getStaffOptions, setStaffSearchValue, staffSearchState, staffSearchValue } =
    useCourseSectionStaffSearch();
  const resetMutationRef = useRef<() => void>(() => {});
  const {
    applySelectedSectionUpdate,
    clearDuplicateOffering,
    closeSectionModal,
    courseSectionDraft,
    creditOptions,
    detailEditing,
    handleDuplicateSection,
    resetSelectedSectionDraft,
    sectionModalMode,
    sectionModalOffering,
    sectionModalOpened,
    sectionPreview,
    selectedSection,
    setCourseSectionDraft,
    setDetailEditing,
  } = useCourseSectionModalState({
    activeAction,
    activeOfferings,
    isSearchScope,
    onCancelAdd,
    onResetMutationState: () => {
      resetMutationRef.current();
    },
    selectedOffering,
    setStaffSearchValue,
  });
  const {
    handleCancelSection,
    handleCreateSection,
    handleSaveSection,
    resetSectionMutationState,
    sectionMutationState,
  } = useCourseSectionMutations({
    applySelectedSectionUpdate,
    clearDuplicateOffering,
    courseSectionDraft,
    onCancelAdd,
    reloadSectionList,
    sectionModalOffering,
    selectedSection,
    subTermId,
  });
  resetMutationRef.current = resetSectionMutationState;
  const {
    academicDivisionOptions,
    deliveryModeOptions,
    enrollmentGradingBasisOptions,
    gradeMarkOptions,
    gradeTypeOptions,
    referenceState,
    referencesAreLoading,
    sectionGradingBasisOptions,
    sectionInstructorRoleOptions,
    sectionStatusOptions,
    selectedStatusName,
  } = useCourseSectionReferences({
    selectedStatusCode: courseSectionDraft.status,
    selectedStatusName: selectedSection?.statusName,
  });
  const staffOptions = useMemo(
    () => getStaffOptions(courseSectionDraft),
    [courseSectionDraft, getStaffOptions]
  );

  return {
    academicDivisionOptions,
    activeOfferings,
    allSections,
    clearSectionFilters,
    closeSectionModal,
    courseSectionDraft,
    creditOptions,
    deliveryModeOptions,
    detailEditing,
    enrollmentGradingBasisOptions,
    filteredSections,
    gradeMarkOptions,
    gradeTypeOptions,
    handleCancelSection,
    handleCreateSection,
    handleDuplicateSection,
    handleSaveSection,
    handleSectionSelected,
    hasActiveScope,
    isSearchScope,
    pagedSections,
    page,
    referenceState,
    referencesAreLoading,
    resetSelectedSectionDraft,
    sectionDetailState,
    sectionGradingBasisOptions,
    sectionInstructorRoleOptions,
    sectionListState,
    sectionModalMode,
    sectionModalOffering,
    sectionModalOpened,
    sectionMutationState,
    sectionPreview,
    sectionStatusOptions,
    sectionsAreLoading,
    selectedSection,
    selectedStatusName,
    setCourseSectionDraft,
    setDetailEditing,
    setPage,
    setStaffSearchValue,
    staffOptions,
    staffSearchState,
    staffSearchValue,
    totalPages,
    workspaceDescription,
  };
}
