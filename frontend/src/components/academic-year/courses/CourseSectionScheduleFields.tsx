import type { Dispatch, SetStateAction } from 'react';
import type { CheckboxProps, SelectProps, SwitchProps, TextInputProps } from '@mantine/core';
import { Checkbox, Divider, Grid, Group, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import type { CourseSectionDraft, SelectOption } from './courseSectionsWorkspaceTypes';
import { meetingDayOptions } from './courseSectionsWorkspaceTypes';
import {
  formatTimeInputValue,
  normalizeTimeInput,
  updateMeetingSchedule,
  updateSelectedMeetingTimes,
} from './courseSectionsWorkspaceUtils';

type CourseSectionScheduleFieldsProps = {
  deliveryModeOptions: SelectOption[];
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  readOnlyCheckboxStyles: CheckboxProps['styles'];
  readOnlyInputStyles: TextInputProps['styles'];
  readOnlySwitchStyles: SwitchProps['styles'];
  referencesAreLoading: boolean;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
};

export function CourseSectionScheduleFields({
  deliveryModeOptions,
  draft,
  fieldsDisabled,
  readOnlyCheckboxStyles,
  readOnlyInputStyles,
  readOnlySwitchStyles,
  referencesAreLoading,
  setDraft,
}: CourseSectionScheduleFieldsProps) {
  const roomDisabled = draft.deliveryMode === 'ONLINE';

  return (
    <Stack gap="sm">
      <Divider label="Schedule and location" labelPosition="left" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Delivery mode"
            placeholder="Select delivery"
            data={deliveryModeOptions}
            value={draft.deliveryMode}
            disabled={fieldsDisabled || referencesAreLoading}
            styles={readOnlyInputStyles as SelectProps['styles']}
            onChange={(value) => {
              setDraft((current) => ({
                ...current,
                deliveryMode: value,
                room: value === 'ONLINE' ? '' : current.room,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <TextInput
            label="Room/location"
            placeholder={roomDisabled ? 'Online' : 'Room'}
            value={draft.room}
            readOnly={fieldsDisabled}
            disabled={roomDisabled}
            styles={readOnlyInputStyles}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                room: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Stack gap="sm">
            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text size="sm" fw={500}>
                Meeting schedule
              </Text>
              <Switch
                label="Same time for selected days"
                checked={draft.sameMeetingTime}
                disabled={fieldsDisabled}
                styles={readOnlySwitchStyles}
                onChange={(event) => {
                  setDraft((current) => {
                    const sameMeetingTime = event.currentTarget.checked;
                    const firstSelectedSchedule = Object.values(current.meetingSchedule).find(
                      (schedule) =>
                        schedule.enabled &&
                        (schedule.startTime !== null || schedule.endTime !== null)
                    );

                    return {
                      ...current,
                      sameMeetingTime,
                      meetingSchedule:
                        sameMeetingTime && firstSelectedSchedule
                          ? updateSelectedMeetingTimes(current.meetingSchedule, {
                              startTime: firstSelectedSchedule.startTime,
                              endTime: firstSelectedSchedule.endTime,
                            })
                          : current.meetingSchedule,
                    };
                  });
                }}
              />
            </Group>
            <Stack gap="xs">
              {meetingDayOptions.map((day) => (
                <div key={day.value}>
                  <Grid align="flex-end">
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Checkbox
                        label={day.label}
                        checked={draft.meetingSchedule[day.value].enabled}
                        disabled={fieldsDisabled}
                        styles={readOnlyCheckboxStyles}
                        onChange={(event) => {
                          setDraft((current) => {
                            const enabled = event.currentTarget.checked;
                            const firstSelectedSchedule = Object.values(
                              current.meetingSchedule
                            ).find(
                              (schedule) =>
                                schedule.enabled &&
                                (schedule.startTime !== null || schedule.endTime !== null)
                            );

                            return {
                              ...current,
                              meetingSchedule: updateMeetingSchedule(
                                current.meetingSchedule,
                                day.value,
                                {
                                  enabled,
                                  startTime:
                                    enabled && current.sameMeetingTime
                                      ? firstSelectedSchedule?.startTime ?? null
                                      : current.meetingSchedule[day.value].startTime,
                                  endTime:
                                    enabled && current.sameMeetingTime
                                      ? firstSelectedSchedule?.endTime ?? null
                                      : current.meetingSchedule[day.value].endTime,
                                }
                              ),
                            };
                          });
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                      <TextInput
                        label="Start"
                        placeholder="9:00 AM"
                        value={formatTimeInputValue(draft.meetingSchedule[day.value].startTime)}
                        disabled={fieldsDisabled || !draft.meetingSchedule[day.value].enabled}
                        styles={readOnlyInputStyles}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            meetingSchedule: current.sameMeetingTime
                              ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                  startTime: value,
                                })
                              : updateMeetingSchedule(current.meetingSchedule, day.value, {
                                  startTime: value,
                                }),
                          }));
                        }}
                        onBlur={(event) => {
                          const value = normalizeTimeInput(event.currentTarget.value);
                          setDraft((current) => ({
                            ...current,
                            meetingSchedule: current.sameMeetingTime
                              ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                  startTime: value,
                                })
                              : updateMeetingSchedule(current.meetingSchedule, day.value, {
                                  startTime: value,
                                }),
                          }));
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                      <TextInput
                        label="End"
                        placeholder="10:15 AM"
                        value={formatTimeInputValue(draft.meetingSchedule[day.value].endTime)}
                        disabled={fieldsDisabled || !draft.meetingSchedule[day.value].enabled}
                        styles={readOnlyInputStyles}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            meetingSchedule: current.sameMeetingTime
                              ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                  endTime: value,
                                })
                              : updateMeetingSchedule(current.meetingSchedule, day.value, {
                                  endTime: value,
                                }),
                          }));
                        }}
                        onBlur={(event) => {
                          const value = normalizeTimeInput(event.currentTarget.value);
                          setDraft((current) => ({
                            ...current,
                            meetingSchedule: current.sameMeetingTime
                              ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                  endTime: value,
                                })
                              : updateMeetingSchedule(current.meetingSchedule, day.value, {
                                  endTime: value,
                                }),
                          }));
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </div>
              ))}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
