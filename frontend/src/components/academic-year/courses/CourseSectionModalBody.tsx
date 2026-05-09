// Field stack and inline mutation feedback for the course-section modal.
import type { Dispatch, SetStateAction } from 'react';
import { Alert, Stack } from '@mantine/core';
import type {
  CourseSectionDraft,
  CourseSectionMutationState,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { CourseSectionAcademicFields } from './CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from './CourseSectionIdentityFields';
import { CourseSectionInstructorAssignments } from './CourseSectionInstructorAssignments';
import { CourseSectionInstructorConflictAlert } from './CourseSectionInstructorConflictAlert';
import { CourseSectionRegistrationFields } from './CourseSectionRegistrationFields';
import { CourseSectionScheduleFields } from './CourseSectionScheduleFields';
import { CourseSectionStudentsPanel } from './CourseSectionStudentsPanel';

type CourseSectionModalBodyProps = {
  academicDivisionOptions: SelectOption[];
  creditOptions: SelectOption[];
  deliveryModeOptions: SelectOption[];
  draft: CourseSectionDraft;
  enrollmentGradingBasisOptions: SelectOption[];
  fieldsDisabled: boolean;
  mutationState: CourseSectionMutationState;
  mode: 'create' | 'detail';
  readOnlyCheckboxStyles: object | undefined;
  readOnlyInputStyles: object | undefined;
  readOnlySwitchStyles: object | undefined;
  referencesAreLoading: boolean;
  sectionInstructorRoleOptions: SelectOption[];
  sectionGradingBasisOptions: SelectOption[];
  sectionStatusOptions: SelectOption[];
  selectedSection: CourseSectionPreview | null;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  staffLoading: boolean;
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  onStaffSearchChange: (value: string) => void;
};

export function CourseSectionModalBody({
  academicDivisionOptions,
  creditOptions,
  deliveryModeOptions,
  draft,
  enrollmentGradingBasisOptions,
  fieldsDisabled,
  mutationState,
  mode,
  readOnlyCheckboxStyles,
  readOnlyInputStyles,
  readOnlySwitchStyles,
  referencesAreLoading,
  sectionInstructorRoleOptions,
  sectionGradingBasisOptions,
  sectionStatusOptions,
  selectedSection,
  setDraft,
  staffLoading,
  staffOptions,
  staffSearchValue,
  onStaffSearchChange,
}: CourseSectionModalBodyProps) {
  return (
    <Stack gap="lg">
      <CourseSectionIdentityFields
        draft={draft}
        fieldsDisabled={fieldsDisabled}
        readOnlyInputStyles={readOnlyInputStyles}
        readOnlySwitchStyles={readOnlySwitchStyles}
        referencesAreLoading={referencesAreLoading}
        sectionStatusOptions={sectionStatusOptions}
        setDraft={setDraft}
      />

      <CourseSectionAcademicFields
        academicDivisionOptions={academicDivisionOptions}
        creditOptions={creditOptions}
        draft={draft}
        fieldsDisabled={fieldsDisabled}
        gradingBasisOptions={sectionGradingBasisOptions}
        readOnlyInputStyles={readOnlyInputStyles}
        referencesAreLoading={referencesAreLoading}
        setDraft={setDraft}
      />

      <CourseSectionInstructorAssignments
        draft={draft}
        fieldsDisabled={fieldsDisabled}
        roleOptions={sectionInstructorRoleOptions}
        staffLoading={staffLoading}
        staffOptions={staffOptions}
        staffSearchValue={staffSearchValue}
        styles={readOnlyInputStyles}
        selectStyles={readOnlyInputStyles}
        setDraft={setDraft}
        onStaffSearchChange={onStaffSearchChange}
      />

      {mutationState.status === 'conflict' ? (
        <CourseSectionInstructorConflictAlert
          message={mutationState.message}
          conflicts={mutationState.conflicts}
        />
      ) : null}

      {mutationState.status === 'error' ? (
        <Alert
          color="red"
          title={
            mode === 'detail'
              ? 'Unable to update course section'
              : 'Unable to create course section'
          }
        >
          {mutationState.message}
        </Alert>
      ) : null}

      <CourseSectionScheduleFields
        deliveryModeOptions={deliveryModeOptions}
        draft={draft}
        fieldsDisabled={fieldsDisabled}
        readOnlyCheckboxStyles={readOnlyCheckboxStyles}
        readOnlyInputStyles={readOnlyInputStyles}
        readOnlySwitchStyles={readOnlySwitchStyles}
        referencesAreLoading={referencesAreLoading}
        setDraft={setDraft}
      />

      <CourseSectionRegistrationFields
        draft={draft}
        fieldsDisabled={fieldsDisabled}
        readOnlySwitchStyles={readOnlySwitchStyles}
        setDraft={setDraft}
      />

      {mode === 'detail' && selectedSection ? (
        <CourseSectionStudentsPanel
          selectedSection={selectedSection}
          gradingBasisOptions={enrollmentGradingBasisOptions}
        />
      ) : null}
    </Stack>
  );
}
