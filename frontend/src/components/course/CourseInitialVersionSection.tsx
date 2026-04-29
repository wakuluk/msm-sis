import { Grid, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
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
      <Grid.Col span={{ base: 12, md: 3 }}>
        <TextInput withAsterisk label="Version code" placeholder="2026-01" maxLength={20} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
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
            onFormValuesChange((current) => ({
              ...current,
              credits: value,
              minCredits: current.minCredits === '' ? value : current.minCredits,
              maxCredits: current.maxCredits === '' ? value : current.maxCredits,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <NumberInput
          label="Minimum credits"
          placeholder="3.00"
          min={0}
          step={0.5}
          value={formValues.minCredits}
          disabled={isSubmitting}
          onChange={(value) => {
            onFormValuesChange((current) => ({
              ...current,
              minCredits: value,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <NumberInput
          label="Maximum credits"
          placeholder="3.00"
          min={0}
          step={0.5}
          value={formValues.maxCredits}
          disabled={isSubmitting}
          onChange={(value) => {
            onFormValuesChange((current) => ({
              ...current,
              maxCredits: value,
            }));
          }}
        />
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
