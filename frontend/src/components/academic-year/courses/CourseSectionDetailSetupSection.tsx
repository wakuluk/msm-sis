// Editable setup section for a single course section detail page.
import type { Dispatch, SetStateAction } from 'react';
import { Alert, Button, Grid, Group, Stack } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { CourseSectionAcademicFields } from './CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from './CourseSectionIdentityFields';
import { CourseSectionRegistrationFields } from './CourseSectionRegistrationFields';
import { CourseSectionScheduleFields } from './CourseSectionScheduleFields';
import {
  readableDisabledCheckboxStyles,
  readableDisabledInputStyles,
  readableDisabledSwitchStyles,
} from './courseSectionReadOnlyStyles';
import type {
  CourseSectionDraft,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionDetailSetupSectionProps = {
  academicDivisionOptions: SelectOption[];
  creditOptions: SelectOption[];
  deliveryModeOptions: SelectOption[];
  detailEditing: boolean;
  draft: CourseSectionDraft;
  mutationError: string | null;
  mutating: boolean;
  referencesAreLoading: boolean;
  section: CourseSectionPreview;
  sectionGradingBasisOptions: SelectOption[];
  sectionStatusOptions: SelectOption[];
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  staffLoading: boolean;
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  onCancelEdit: () => void;
  onCancelSection: () => void;
  onSaveSection: () => void;
  onStaffSearchChange: (value: string) => void;
  onStartEdit: () => void;
};

export function CourseSectionDetailSetupSection({
  academicDivisionOptions,
  creditOptions,
  deliveryModeOptions,
  detailEditing,
  draft,
  mutationError,
  mutating,
  referencesAreLoading,
  section,
  sectionGradingBasisOptions,
  sectionStatusOptions,
  setDraft,
  staffLoading,
  staffOptions,
  staffSearchValue,
  onCancelEdit,
  onCancelSection,
  onSaveSection,
  onStaffSearchChange,
  onStartEdit,
}: CourseSectionDetailSetupSectionProps) {
  const fieldsDisabled = !detailEditing;
  const readOnlyInputStyles = fieldsDisabled ? readableDisabledInputStyles : undefined;
  const readOnlySwitchStyles = fieldsDisabled ? readableDisabledSwitchStyles : undefined;
  const readOnlyCheckboxStyles = fieldsDisabled ? readableDisabledCheckboxStyles : undefined;

  return (
    <RecordPageSection
      title="Section Details"
      description="Review and update the section setup."
      action={
        <Group gap="sm" wrap="wrap" justify="flex-end">
          {detailEditing ? (
            <>
              <Button variant="default" onClick={onCancelEdit}>
                Cancel edit
              </Button>
              <Button loading={mutating} onClick={onSaveSection}>
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={onStartEdit}>
                Edit
              </Button>
              <Button
                variant="default"
                loading={mutating}
                disabled={section.statusCode === 'CANCELLED'}
                onClick={onCancelSection}
              >
                Cancel section
              </Button>
            </>
          )}
        </Group>
      }
    >
      <Grid.Col span={12}>
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
          {mutationError ? (
            <Alert color="red" title="Unable to update course section">
              {mutationError}
            </Alert>
          ) : null}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
