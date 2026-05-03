import { Collapse, Grid, NumberInput, Select, Switch, Textarea, TextInput } from '@mantine/core';
import { normalizeCreditInputValue } from './courseCreateFormHelpers';
import type { CourseCreateFormValues } from './courseCreateValidation';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';

type CourseInitialVersionSectionProps = {
  formValues: CourseCreateFormValues;
  isSubmitting: boolean;
  onFormValuesChange: React.Dispatch<React.SetStateAction<CourseCreateFormValues>>;
};

export function CourseInitialVersionSection({
  formValues,
  isSubmitting,
  onFormValuesChange,
}: CourseInitialVersionSectionProps) {
  return (
    <CourseCreateSectionFrame
      title="Initial Version"
      description="The first version captures credit value and catalog text."
    >
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput withAsterisk label="Version code" placeholder="2026-01" maxLength={20} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <NumberInput
          withAsterisk
          label="Credits"
          placeholder="3.00"
          min={0}
          step={0.5}
          decimalScale={2}
          value={formValues.credits}
          disabled={isSubmitting}
          onChange={(value) => {
            const nextValue = normalizeCreditInputValue(value);

            onFormValuesChange((current) => ({
              ...current,
              credits: nextValue,
              minCredits:
                !current.variableCredit || current.minCredits === '' ? nextValue : current.minCredits,
              maxCredits:
                !current.variableCredit || current.maxCredits === '' ? nextValue : current.maxCredits,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Switch
          label="Variable credit"
          checked={formValues.variableCredit}
          disabled={isSubmitting}
          mt="lg"
          onChange={(event) => {
            const checked = event.currentTarget.checked;

            onFormValuesChange((current) => ({
              ...current,
              variableCredit: checked,
              minCredits: checked ? current.minCredits || current.credits : current.credits,
              maxCredits: checked ? current.maxCredits || current.credits : current.credits,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Collapse
          expanded={formValues.variableCredit}
          transitionDuration={260}
          transitionTimingFunction="ease"
        >
          <Grid gap="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Minimum credits"
                placeholder="3.00"
                min={0}
                step={0.5}
                decimalScale={2}
                value={formValues.minCredits}
                disabled={isSubmitting}
                onChange={(value) => {
                  onFormValuesChange((current) => ({
                    ...current,
                    minCredits: normalizeCreditInputValue(value),
                  }));
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Maximum credits"
                placeholder="3.00"
                min={0}
                step={0.5}
                decimalScale={2}
                value={formValues.maxCredits}
                disabled={isSubmitting}
                onChange={(value) => {
                  onFormValuesChange((current) => ({
                    ...current,
                    maxCredits: normalizeCreditInputValue(value),
                  }));
                }}
              />
            </Grid.Col>
          </Grid>
        </Collapse>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          label="Grading basis"
          placeholder="Select grading basis"
          data={['Letter grade', 'Pass/Fail', 'Audit only']}
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          label="Default delivery"
          placeholder="Select delivery"
          data={['In person', 'Online', 'Hybrid']}
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          label="Course level"
          placeholder="Select level"
          data={['Undergraduate', 'Graduate']}
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Textarea
          label="Catalog description"
          placeholder="Describe the course as it should appear in the catalog."
          minRows={3}
          autosize
          value={formValues.catalogDescription}
          disabled={isSubmitting}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              catalogDescription: event.currentTarget.value,
            }));
          }}
        />
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
