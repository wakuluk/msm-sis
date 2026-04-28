// Registration policy field group for the course-section form.
// Currently owns the waitlist-allowed switch and keeps it wired into the shared draft state.
import type { Dispatch, SetStateAction } from 'react';
import { Divider, Stack, Switch, type SwitchProps } from '@mantine/core';
import type { CourseSectionDraft } from './courseSectionsWorkspaceTypes';

type CourseSectionRegistrationFieldsProps = {
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  readOnlySwitchStyles: SwitchProps['styles'];
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
};

export function CourseSectionRegistrationFields({
  draft,
  fieldsDisabled,
  readOnlySwitchStyles,
  setDraft,
}: CourseSectionRegistrationFieldsProps) {
  return (
    <Stack gap="sm">
      <Divider label="Registration" labelPosition="left" />
      <Switch
        label="Waitlist allowed"
        description="Allows students to waitlist when the section reaches capacity."
        checked={draft.waitlistAllowed}
        disabled={fieldsDisabled}
        styles={readOnlySwitchStyles}
        onChange={(event) => {
          setDraft((current) => ({
            ...current,
            waitlistAllowed: event.currentTarget.checked,
          }));
        }}
      />
    </Stack>
  );
}
