// Editable setup section for a single course section detail page.
import type { Dispatch, SetStateAction } from 'react';
import { Alert, Button, Grid, Group, Stack } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { CourseSectionAcademicFields } from './CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from './CourseSectionIdentityFields';
import { CourseSectionInstructorAssignments } from './CourseSectionInstructorAssignments';
import { CourseSectionRegistrationFields } from './CourseSectionRegistrationFields';
import { CourseSectionScheduleFields } from './CourseSectionScheduleFields';
import {
  readableDisabledCheckboxStyles,
  readableDisabledInputStyles,
  readableDisabledSwitchStyles,
} from './courseSectionReadOnlyStyles';
import type {
  CourseSectionDraft,
  CourseSectionMutationState,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { CourseSectionInstructorConflictAlert } from './CourseSectionInstructorConflictAlert';

type CourseSectionDetailSetupSectionProps = {
  academicDivisionOptions: SelectOption[];
  canManage: boolean;
  creditOptions: SelectOption[];
  deliveryModeOptions: SelectOption[];
  detailEditing: boolean;
  draft: CourseSectionDraft;
  mutationState: CourseSectionMutationState;
  mutating: boolean;
  referencesAreLoading: boolean;
  section: CourseSectionPreview;
  sectionGradingBasisOptions: SelectOption[];
  sectionInstructorRoleOptions: SelectOption[];
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
  canManage,
  creditOptions,
  deliveryModeOptions,
  detailEditing,
  draft,
  mutationState,
  mutating,
  referencesAreLoading,
  section,
  sectionGradingBasisOptions,
  sectionInstructorRoleOptions,
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
  const hasMutationError =
    mutationState.status === 'error' || mutationState.status === 'conflict';

  return (
    <RecordPageSection
      title="Section Details"
      description={
        canManage ? 'Review and update the section setup.' : 'Review the section setup.'
      }
      action={
        canManage ? (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            {detailEditing ? (
              <>
                <Button variant="default" onClick={onCancelEdit}>
                  Cancel edit
                </Button>
                <Button
                  color={hasMutationError ? 'red' : undefined}
                  loading={mutating}
                  onClick={onSaveSection}
                >
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
        ) : null
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
            <Alert color="red" title="Unable to update course section">
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
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
