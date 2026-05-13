// Connects course-section workspace state/actions to the section modal.
import { CourseSectionModal } from './CourseSectionModal';
import type { useCourseSectionsWorkspace } from './useCourseSectionsWorkspace';

type CourseSectionModalContainerProps = {
  subTermLabel: string;
  workspace: ReturnType<typeof useCourseSectionsWorkspace>;
};

export function CourseSectionModalContainer({
  subTermLabel,
  workspace,
}: CourseSectionModalContainerProps) {
  return (
    <CourseSectionModal
      opened={workspace.sectionModalOpened}
      mode={workspace.sectionModalMode}
      offering={workspace.sectionModalOffering}
      selectedSection={workspace.selectedSection}
      draft={workspace.courseSectionDraft}
      setDraft={workspace.setCourseSectionDraft}
      detailEditing={workspace.detailEditing}
      setDetailEditing={workspace.setDetailEditing}
      subTermLabel={subTermLabel}
      sectionPreview={workspace.sectionPreview}
      selectedStatusName={workspace.selectedStatusName}
      sectionStatusOptions={workspace.sectionStatusOptions}
      sectionInstructorRoleOptions={workspace.sectionInstructorRoleOptions}
      academicDivisionOptions={workspace.academicDivisionOptions}
      sectionGradingBasisOptions={workspace.sectionGradingBasisOptions}
      enrollmentGradingBasisOptions={workspace.enrollmentGradingBasisOptions}
      gradeMarkOptions={workspace.gradeMarkOptions}
      gradeTypeOptions={workspace.gradeTypeOptions}
      deliveryModeOptions={workspace.deliveryModeOptions}
      creditOptions={workspace.creditOptions}
      referencesAreLoading={workspace.referencesAreLoading}
      staffOptions={workspace.staffOptions}
      staffSearchValue={workspace.staffSearchValue}
      staffLoading={workspace.staffSearchState.status === 'loading'}
      mutationState={workspace.sectionMutationState}
      mutating={workspace.sectionMutationState.status === 'saving'}
      onStaffSearchChange={workspace.setStaffSearchValue}
      onClose={workspace.closeSectionModal}
      onCancelEdit={workspace.resetSelectedSectionDraft}
      onCreate={workspace.handleCreateSection}
      onSave={workspace.handleSaveSection}
      onCancelSection={workspace.handleCancelSection}
      onDuplicate={workspace.handleDuplicateSection}
    />
  );
}
