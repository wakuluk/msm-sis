import type { Dispatch, SetStateAction } from 'react';
import type { SelectProps, TextInputProps } from '@mantine/core';
import { Divider, Grid, Select, Stack } from '@mantine/core';
import type {
  CourseSectionDraft,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { StaffCombobox } from './StaffCombobox';

type CourseSectionAcademicFieldsProps = {
  academicDivisionOptions: SelectOption[];
  creditOptions: SelectOption[];
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  gradingBasisOptions: SelectOption[];
  readOnlyInputStyles: TextInputProps['styles'];
  referencesAreLoading: boolean;
  staffLoading: boolean;
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  onStaffSearchChange: (value: string) => void;
};

export function CourseSectionAcademicFields({
  academicDivisionOptions,
  creditOptions,
  draft,
  fieldsDisabled,
  gradingBasisOptions,
  readOnlyInputStyles,
  referencesAreLoading,
  staffLoading,
  staffOptions,
  staffSearchValue,
  setDraft,
  onStaffSearchChange,
}: CourseSectionAcademicFieldsProps) {
  return (
    <Stack gap="sm">
      <Divider label="Academic setup" labelPosition="left" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <StaffCombobox
            label="Teacher assignment"
            placeholder="Search staff"
            options={staffOptions}
            value={staffSearchValue}
            selectedStaffId={draft.teacherStaffId}
            disabled={fieldsDisabled}
            loading={staffLoading}
            styles={readOnlyInputStyles}
            onSearchChange={(value) => {
              onStaffSearchChange(value);
              setDraft((current) => ({
                ...current,
                teacherStaffId: null,
                teacherAssignment: value,
              }));
            }}
            onSelect={(staffId, label) => {
              onStaffSearchChange(label);
              setDraft((current) => ({
                ...current,
                teacherStaffId: staffId,
                teacherAssignment: label,
              }));
            }}
            onClear={() => {
              onStaffSearchChange('');
              setDraft((current) => ({
                ...current,
                teacherStaffId: null,
                teacherAssignment: '',
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Academic division"
            placeholder="Select division"
            data={academicDivisionOptions}
            value={draft.academicDivision}
            disabled={fieldsDisabled || referencesAreLoading}
            styles={readOnlyInputStyles as SelectProps['styles']}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                academicDivision: value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Select
            label="Grading basis"
            placeholder="Select grading"
            data={gradingBasisOptions}
            value={draft.gradingBasis}
            disabled={fieldsDisabled || referencesAreLoading}
            styles={readOnlyInputStyles as SelectProps['styles']}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                gradingBasis: value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Select
            label="Credits"
            placeholder={creditOptions.length > 0 ? 'Credits' : 'Unavailable'}
            data={creditOptions}
            value={draft.credits}
            disabled={fieldsDisabled || creditOptions.length === 0}
            styles={readOnlyInputStyles as SelectProps['styles']}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                credits: value,
              }));
            }}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
