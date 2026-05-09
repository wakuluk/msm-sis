// Modal container for creating, viewing, editing, and duplicating course sections.
// Composes the section field groups, selected-offering context, mutation state, and footer actions.
import type { Dispatch, SetStateAction } from 'react';
import { Modal, Stack } from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type {
  CourseSectionDraft,
  CourseSectionMutationState,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { CourseSectionModalBody } from './CourseSectionModalBody';
import { CourseSectionModalFooter } from './CourseSectionModalFooter';
import { CourseSectionModalHeader } from './CourseSectionModalHeader';
import {
  readableDisabledCheckboxStyles,
  readableDisabledInputStyles,
  readableDisabledSwitchStyles,
} from './courseSectionReadOnlyStyles';

type CourseSectionModalProps = {
  opened: boolean;
  mode: 'create' | 'detail';
  offering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedSection: CourseSectionPreview | null;
  draft: CourseSectionDraft;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  detailEditing: boolean;
  setDetailEditing: (value: boolean) => void;
  subTermLabel: string;
  sectionPreview: string;
  selectedStatusName: string | null;
  sectionStatusOptions: SelectOption[];
  sectionInstructorRoleOptions: SelectOption[];
  academicDivisionOptions: SelectOption[];
  sectionGradingBasisOptions: SelectOption[];
  enrollmentGradingBasisOptions: SelectOption[];
  deliveryModeOptions: SelectOption[];
  creditOptions: SelectOption[];
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  staffLoading: boolean;
  referencesAreLoading: boolean;
  mutationState: CourseSectionMutationState;
  mutating: boolean;
  onStaffSearchChange: (value: string) => void;
  onClose: () => void;
  onCancelEdit: () => void;
  onCreate: () => void;
  onSave: () => void;
  onCancelSection: () => void;
  onDuplicate: () => void;
};

export function CourseSectionModal({
  opened,
  mode,
  offering,
  selectedSection,
  draft,
  setDraft,
  detailEditing,
  setDetailEditing,
  subTermLabel,
  sectionPreview,
  selectedStatusName,
  sectionStatusOptions,
  sectionInstructorRoleOptions,
  academicDivisionOptions,
  sectionGradingBasisOptions,
  enrollmentGradingBasisOptions,
  deliveryModeOptions,
  creditOptions,
  staffOptions,
  staffSearchValue,
  staffLoading,
  referencesAreLoading,
  mutationState,
  mutating,
  onStaffSearchChange,
  onClose,
  onCancelEdit,
  onCreate,
  onSave,
  onCancelSection,
  onDuplicate,
}: CourseSectionModalProps) {
  const fieldsDisabled = mode === 'detail' && !detailEditing;
  const readOnlyInputStyles = fieldsDisabled ? readableDisabledInputStyles : undefined;
  const readOnlySwitchStyles = fieldsDisabled ? readableDisabledSwitchStyles : undefined;
  const readOnlyCheckboxStyles = fieldsDisabled ? readableDisabledCheckboxStyles : undefined;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'detail' ? 'Course Section' : 'Add Course Section'}
      size="96rem"
      centered
    >
      {offering || selectedSection ? (
        <Stack gap="md">
          <CourseSectionModalHeader
            offering={offering}
            sectionPreview={sectionPreview}
            selectedSection={selectedSection}
            selectedStatusName={selectedStatusName}
            subTermLabel={subTermLabel}
          />

          <CourseSectionModalBody
            academicDivisionOptions={academicDivisionOptions}
            creditOptions={creditOptions}
            deliveryModeOptions={deliveryModeOptions}
            draft={draft}
            enrollmentGradingBasisOptions={enrollmentGradingBasisOptions}
            fieldsDisabled={fieldsDisabled}
            mutationState={mutationState}
            mode={mode}
            readOnlyCheckboxStyles={readOnlyCheckboxStyles}
            readOnlyInputStyles={readOnlyInputStyles}
            readOnlySwitchStyles={readOnlySwitchStyles}
            referencesAreLoading={referencesAreLoading}
            sectionInstructorRoleOptions={sectionInstructorRoleOptions}
            sectionGradingBasisOptions={sectionGradingBasisOptions}
            sectionStatusOptions={sectionStatusOptions}
            selectedSection={selectedSection}
            setDraft={setDraft}
            staffLoading={staffLoading}
            staffOptions={staffOptions}
            staffSearchValue={staffSearchValue}
            onStaffSearchChange={onStaffSearchChange}
          />

          <CourseSectionModalFooter
            mutating={mutating}
            mutationState={mutationState}
            detailEditing={detailEditing}
            mode={mode}
            selectedSection={selectedSection}
            onCancelEdit={onCancelEdit}
            onCancelSection={onCancelSection}
            onClose={onClose}
            onCreate={onCreate}
            onDuplicate={onDuplicate}
            onSave={onSave}
            onStartEdit={() => {
              setDetailEditing(true);
            }}
          />
        </Stack>
      ) : null}
    </Modal>
  );
}
