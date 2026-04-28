// Identity/status field group for the course-section form.
// Covers section code, honors flag, section status, capacity, and waitlist capacity.
import type { Dispatch, SetStateAction } from 'react';
import {
  Divider,
  Grid,
  Select,
  Stack,
  Switch,
  TextInput,
  type SelectProps,
  type SwitchProps,
  type TextInputProps,
} from '@mantine/core';
import type { CourseSectionDraft, SelectOption } from './courseSectionsWorkspaceTypes';

type CourseSectionIdentityFieldsProps = {
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  readOnlyInputStyles: TextInputProps['styles'];
  readOnlySwitchStyles: SwitchProps['styles'];
  referencesAreLoading: boolean;
  sectionStatusOptions: SelectOption[];
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
};

export function CourseSectionIdentityFields({
  draft,
  fieldsDisabled,
  readOnlyInputStyles,
  readOnlySwitchStyles,
  referencesAreLoading,
  sectionStatusOptions,
  setDraft,
}: CourseSectionIdentityFieldsProps) {
  return (
    <Stack gap="sm">
      <Divider label="Section identity" labelPosition="left" />
      <Grid align="flex-start">
        <Grid.Col span={{ base: 12, md: 2 }}>
          <TextInput
            label="Section"
            placeholder="04"
            value={draft.sectionCode}
            readOnly={fieldsDisabled}
            styles={readOnlyInputStyles}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                sectionCode: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Switch
            label="Honors"
            checked={draft.honors}
            disabled={fieldsDisabled}
            styles={readOnlySwitchStyles}
            mt="lg"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                honors: event.currentTarget.checked,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Switch
            label="Lab"
            checked={draft.lab}
            disabled={fieldsDisabled}
            styles={readOnlySwitchStyles}
            mt="lg"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                lab: event.currentTarget.checked,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Status"
            placeholder="Status"
            data={sectionStatusOptions}
            value={draft.status}
            disabled={fieldsDisabled || referencesAreLoading}
            styles={readOnlyInputStyles as SelectProps['styles']}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                status: value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <TextInput
            label="Capacity"
            placeholder="24"
            inputMode="numeric"
            value={draft.capacity}
            readOnly={fieldsDisabled}
            styles={readOnlyInputStyles}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                capacity: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
