// Owns create/save/cancel mutations for course sections.
import { useState } from 'react';
import { createCourseSection, patchCourseSection } from '@/services/course-service';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import {
  buildCreateSectionRequest,
  buildPatchSectionRequest,
} from './courseSectionRequestBuilders';
import {
  getErrorMessage,
  mapCourseSectionDetailToPreview,
} from './courseSectionsWorkspaceUtils';
import type {
  CourseSectionDraft,
  CourseSectionPreview,
} from './courseSectionsWorkspaceTypes';

type CourseSectionMutationState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type UseCourseSectionMutationsParams = {
  applySelectedSectionUpdate: (section: CourseSectionPreview) => void;
  clearDuplicateOffering: () => void;
  courseSectionDraft: CourseSectionDraft;
  onCancelAdd: () => void;
  reloadSectionList: () => void;
  sectionModalOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedSection: CourseSectionPreview | null;
  subTermId: number;
};

export function useCourseSectionMutations({
  applySelectedSectionUpdate,
  clearDuplicateOffering,
  courseSectionDraft,
  onCancelAdd,
  reloadSectionList,
  sectionModalOffering,
  selectedSection,
  subTermId,
}: UseCourseSectionMutationsParams) {
  const [sectionMutationState, setSectionMutationState] = useState<CourseSectionMutationState>({
    status: 'idle',
  });

  function resetSectionMutationState() {
    setSectionMutationState({ status: 'idle' });
  }

  async function handleCreateSection() {
    const createOffering = sectionModalOffering;

    if (!createOffering || sectionMutationState.status === 'saving') {
      return;
    }

    const createRequest = buildCreateSectionRequest(courseSectionDraft, subTermId);

    if (typeof createRequest === 'string') {
      setSectionMutationState({ status: 'error', message: createRequest });
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      await createCourseSection({
        courseOfferingId: createOffering.courseOfferingId,
        request: createRequest,
      });
      resetSectionMutationState();
      clearDuplicateOffering();
      reloadSectionList();
      onCancelAdd();
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create course section.'),
      });
    }
  }

  async function handleSaveSection() {
    if (!selectedSection || sectionMutationState.status === 'saving') {
      return;
    }

    const patchRequest = buildPatchSectionRequest(courseSectionDraft, subTermId);

    if (typeof patchRequest === 'string') {
      setSectionMutationState({ status: 'error', message: patchRequest });
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: selectedSection.sectionId,
        request: patchRequest,
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);

      applySelectedSectionUpdate(updatedSection);
      resetSectionMutationState();
      reloadSectionList();
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update course section.'),
      });
    }
  }

  async function handleCancelSection() {
    if (!selectedSection || sectionMutationState.status === 'saving') {
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: selectedSection.sectionId,
        request: {
          statusCode: 'CANCELLED',
        },
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);

      applySelectedSectionUpdate(updatedSection);
      resetSectionMutationState();
      reloadSectionList();
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to cancel course section.'),
      });
    }
  }

  return {
    handleCancelSection,
    handleCreateSection,
    handleSaveSection,
    resetSectionMutationState,
    sectionMutationState,
  };
}
