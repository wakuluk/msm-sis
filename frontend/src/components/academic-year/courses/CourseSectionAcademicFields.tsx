// Academic setup field group for the course-section form.
// Handles academic division, credits, and grading basis inputs.
import type { Dispatch, SetStateAction } from 'react';
import { Divider, Grid, Select, Stack, type SelectProps, type TextInputProps } from '@mantine/core';
import type { CourseSectionDraft, SelectOption } from './courseSectionsWorkspaceTypes';

type CourseSectionAcademicFieldsProps = {
  academicDivisionOptions: SelectOption[];
  creditOptions: SelectOption[];
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  gradingBasisOptions: SelectOption[];
  readOnlyInputStyles: TextInputProps['styles'];
  referencesAreLoading: boolean;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
};

export function CourseSectionAcademicFields({
  academicDivisionOptions,
  creditOptions,
  draft,
  fieldsDisabled,
  gradingBasisOptions,
  readOnlyInputStyles,
  referencesAreLoading,
  setDraft,
}: CourseSectionAcademicFieldsProps) {
  return (
    <Stack gap="sm">
      <Divider label="Academic setup" labelPosition="left" />
      <Grid>
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
                academicDivision: value ?? null,
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
                gradingBasis: value ?? null,
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
                credits: value ?? null,
              }));
            }}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
