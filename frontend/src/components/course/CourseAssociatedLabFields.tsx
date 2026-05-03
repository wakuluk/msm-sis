import { Checkbox, Collapse, Grid, NumberInput, Switch, Textarea, TextInput } from '@mantine/core';
import {
  buildDefaultLabCourseNumber,
  buildDefaultLabTitle,
  normalizeCreditInputValue,
  syncAssociatedLabCorequisite,
} from './courseCreateFormHelpers';
import type { CourseCreateFormValues } from './courseCreateValidation';

type CourseAssociatedLabFieldsProps = {
  disabled: boolean;
  formValues: CourseCreateFormValues;
  onFormValuesChange: React.Dispatch<React.SetStateAction<CourseCreateFormValues>>;
};

export function CourseAssociatedLabFields({
  disabled,
  formValues,
  onFormValuesChange,
}: CourseAssociatedLabFieldsProps) {
  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Lab course number"
          placeholder={buildDefaultLabCourseNumber(formValues.courseNumber) || '101L'}
          maxLength={20}
          value={formValues.associatedLabCourseNumber}
          disabled={disabled}
          onChange={(event) => {
            const associatedLabCourseNumber = event.currentTarget.value;

            onFormValuesChange((current) =>
              syncAssociatedLabCorequisite({
                ...current,
                associatedLabCourseNumber,
              })
            );
          }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Lab title"
          placeholder={buildDefaultLabTitle(formValues.title) || 'Course title Lab'}
          maxLength={255}
          value={formValues.associatedLabTitle}
          disabled={disabled}
          onChange={(event) => {
            const associatedLabTitle = event.currentTarget.value;

            onFormValuesChange((current) =>
              syncAssociatedLabCorequisite({
                ...current,
                associatedLabTitle,
              })
            );
          }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Lab version code"
          placeholder="2026-01"
          maxLength={20}
          value={formValues.associatedLabVersionCode}
          disabled={disabled}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              associatedLabVersionCode: event.currentTarget.value,
            }));
          }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <NumberInput
          label="Lab credits"
          placeholder="0.00"
          min={0}
          step={0.5}
          decimalScale={2}
          value={formValues.associatedLabCredits}
          disabled={disabled}
          onChange={(value) => {
            const nextValue = normalizeCreditInputValue(value);

            onFormValuesChange((current) => ({
              ...current,
              associatedLabCredits: nextValue,
              associatedLabMinCredits:
                !current.associatedLabVariableCredit || current.associatedLabMinCredits === ''
                  ? nextValue
                  : current.associatedLabMinCredits,
              associatedLabMaxCredits:
                !current.associatedLabVariableCredit || current.associatedLabMaxCredits === ''
                  ? nextValue
                  : current.associatedLabMaxCredits,
            }));
          }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Switch
          label="Variable credit lab"
          checked={formValues.associatedLabVariableCredit}
          disabled={disabled}
          mt="lg"
          onChange={(event) => {
            const checked = event.currentTarget.checked;

            onFormValuesChange((current) => ({
              ...current,
              associatedLabVariableCredit: checked,
              associatedLabMinCredits: checked
                ? current.associatedLabMinCredits || current.associatedLabCredits
                : current.associatedLabCredits,
              associatedLabMaxCredits: checked
                ? current.associatedLabMaxCredits || current.associatedLabCredits
                : current.associatedLabCredits,
            }));
          }}
        />
      </Grid.Col>

      <Grid.Col span={12}>
        <Collapse
          expanded={formValues.associatedLabVariableCredit}
          transitionDuration={260}
          transitionTimingFunction="ease"
        >
          <Grid gap="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Lab minimum credits"
                placeholder="0.00"
                min={0}
                step={0.5}
                decimalScale={2}
                value={formValues.associatedLabMinCredits}
                disabled={disabled}
                onChange={(value) => {
                  onFormValuesChange((current) => ({
                    ...current,
                    associatedLabMinCredits: normalizeCreditInputValue(value),
                  }));
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Lab maximum credits"
                placeholder="0.00"
                min={0}
                step={0.5}
                decimalScale={2}
                value={formValues.associatedLabMaxCredits}
                disabled={disabled}
                onChange={(value) => {
                  onFormValuesChange((current) => ({
                    ...current,
                    associatedLabMaxCredits: normalizeCreditInputValue(value),
                  }));
                }}
              />
            </Grid.Col>
          </Grid>
        </Collapse>
      </Grid.Col>

      <Grid.Col span={12}>
        <Textarea
          label="Lab catalog description"
          placeholder="Describe the lab version, or leave blank to generate a paired-lab description later."
          minRows={3}
          autosize
          value={formValues.associatedLabCatalogDescription}
          disabled={disabled}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              associatedLabCatalogDescription: event.currentTarget.value,
            }));
          }}
        />
      </Grid.Col>

      <Grid.Col span={12}>
        <Checkbox
          label="Make the lab a corequisite of this course"
          checked={formValues.associatedLabCorequisite}
          disabled={disabled}
          onChange={(event) => {
            const associatedLabCorequisite = event.currentTarget.checked;

            onFormValuesChange((current) =>
              syncAssociatedLabCorequisite({
                ...current,
                associatedLabCorequisite,
              })
            );
          }}
        />
      </Grid.Col>
    </Grid>
  );
}
