// Field stack and inline mutation feedback for the course-section modal.
import type { Dispatch, SetStateAction } from 'react';
import { Alert, Stack } from '@mantine/core';
import type {
  CourseSectionDraft,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { CourseSectionAcademicFields } from './CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from './CourseSectionIdentityFields';
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
  mutationError: string | null;
  mode: 'create' | 'detail';
  readOnlyCheckboxStyles: object | undefined;
  readOnlyInputStyles: object | undefined;
  readOnlySwitchStyles: object | undefined;
  referencesAreLoading: boolean;
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
  mutationError,
  mode,
  readOnlyCheckboxStyles,
  readOnlyInputStyles,
  readOnlySwitchStyles,
  referencesAreLoading,
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
        staffLoading={staffLoading}
        staffOptions={staffOptions}
        staffSearchValue={staffSearchValue}
        setDraft={setDraft}
        onStaffSearchChange={onStaffSearchChange}
      />

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

      {mutationError ? (
        <Alert
          color="red"
          title={
            mode === 'detail'
              ? 'Unable to update course section'
              : 'Unable to create course section'
          }
        >
          {mutationError}
        </Alert>
      ) : null}
    </Stack>
  );
}
