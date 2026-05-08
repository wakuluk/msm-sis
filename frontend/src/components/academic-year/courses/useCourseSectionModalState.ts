// Owns section modal state, draft setup/reset behavior, and duplicate-section flow.
import { useEffect, useMemo, useState } from 'react';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import {
  buildCreditOptions,
  buildDraftFromSection,
} from './courseSectionsWorkspaceUtils';
import {
  initialCourseSectionDraft,
  type CourseSectionDraft,
  type CourseSectionPreview,
} from './courseSectionsWorkspaceTypes';

type UseCourseSectionModalStateParams = {
  activeAction: 'add' | 'view';
  activeOfferings: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  isSearchScope: boolean;
  onCancelAdd: () => void;
  onResetMutationState: () => void;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  setStaffSearchValue: (value: string) => void;
};

export function useCourseSectionModalState({
  activeAction,
  activeOfferings,
  isSearchScope,
  onCancelAdd,
  onResetMutationState,
  selectedOffering,
  setStaffSearchValue,
}: UseCourseSectionModalStateParams) {
  const [courseSectionDraft, setCourseSectionDraft] =
    useState<CourseSectionDraft>(initialCourseSectionDraft);
  const [selectedSection, setSelectedSection] = useState<CourseSectionPreview | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [duplicateOffering, setDuplicateOffering] =
    useState<AcademicYearCourseOfferingSearchResultResponse | null>(null);
  const sectionModalMode: 'detail' | 'create' = selectedSection ? 'detail' : 'create';
  const selectedSectionOffering = selectedSection
    ? (activeOfferings.find(
        (offering) => offering.courseOfferingId === selectedSection.courseOfferingId
      ) ?? null)
    : null;
  const sectionModalOffering = selectedSectionOffering ?? duplicateOffering ?? selectedOffering;
  const sectionModalOpened = Boolean(
    selectedSection ||
      duplicateOffering ||
      (selectedOffering && !isSearchScope && activeAction === 'add')
  );
  const sectionPreviewBase = courseSectionDraft.sectionCode.trim() || 'New';
  const sectionPreview = `${sectionPreviewBase}${courseSectionDraft.honors ? 'H' : ''}`;
  const creditOptions = useMemo(
    () => buildCreditOptions(sectionModalOffering),
    [sectionModalOffering]
  );

  useEffect(() => {
    const nextCreditOptions = buildCreditOptions(selectedOffering);
    setCourseSectionDraft({
      ...initialCourseSectionDraft,
      credits: nextCreditOptions[0]?.value ?? null,
    });
    setStaffSearchValue('');
  }, [selectedOffering, setStaffSearchValue]);

  function clearDuplicateOffering() {
    setDuplicateOffering(null);
  }

  function closeSectionModal() {
    if (selectedSection) {
      setSelectedSection(null);
      setDetailEditing(false);
      return;
    }

    onResetMutationState();
    setDuplicateOffering(null);
    onCancelAdd();
  }

  function applySelectedSectionUpdate(updatedSection: CourseSectionPreview) {
    const nextCreditOptions = buildCreditOptions(sectionModalOffering);

    setSelectedSection(updatedSection);
    setCourseSectionDraft({
      ...buildDraftFromSection(updatedSection),
      credits:
        updatedSection.credits === null
          ? (nextCreditOptions[0]?.value ?? null)
          : String(updatedSection.credits),
    });
    setStaffSearchValue(
      updatedSection.instructor === 'Unassigned' ? '' : updatedSection.instructor
    );
    setDetailEditing(false);
  }

  function handleDuplicateSection() {
    if (!selectedSection) {
      return;
    }

    const sectionOffering =
      activeOfferings.find(
        (offering) => offering.courseOfferingId === selectedSection.courseOfferingId
      ) ?? selectedSectionOffering;
    const nextCreditOptions = buildCreditOptions(sectionOffering);

    setCourseSectionDraft({
      ...buildDraftFromSection(selectedSection),
      sectionCode: '',
      credits:
        selectedSection.credits === null
          ? (nextCreditOptions[0]?.value ?? null)
          : String(selectedSection.credits),
    });
    setStaffSearchValue(
      selectedSection.instructor === 'Unassigned' ? '' : selectedSection.instructor
    );
    setDuplicateOffering(sectionOffering);
    setSelectedSection(null);
    setDetailEditing(false);
    onResetMutationState();
  }

  function resetSelectedSectionDraft() {
    if (selectedSection) {
      setCourseSectionDraft({
        ...buildDraftFromSection(selectedSection),
        credits:
          selectedSection.credits === null
            ? (creditOptions[0]?.value ?? null)
            : String(selectedSection.credits),
      });
    }
    setDetailEditing(false);
  }

  return {
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
  };
}
