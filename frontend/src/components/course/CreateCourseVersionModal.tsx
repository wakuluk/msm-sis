import { useEffect, useState } from 'react';
import { Grid, Select, Switch, Textarea, TextInput } from '@mantine/core';
import { FormModalShell } from '@/components/modals/FormModalShell';
import type { CreateCourseVersionRequest } from '@/services/schemas/course-schemas';

type CreateCourseVersionState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type CreateCourseVersionFormValues = {
  title: string;
  catalogDescription: string;
  minCredits: string | null;
  maxCredits: string | null;
  variableCredit: boolean;
};

const creditOptions = Array.from({ length: 21 }, (_, index) => {
  const value = (1 + index * 0.25).toFixed(2);

  return {
    value,
    label: value,
  };
});

const initialCreateCourseVersionFormValues: CreateCourseVersionFormValues = {
  title: '',
  catalogDescription: '',
  minCredits: '3.00',
  maxCredits: '3.00',
  variableCredit: false,
};

export function CreateCourseVersionModal({
  opened,
  onClose,
  createState,
  onCreate,
  courseId,
  courseCode,
}: {
  opened: boolean;
  onClose: () => void;
  createState: CreateCourseVersionState;
  onCreate: (request: CreateCourseVersionRequest) => Promise<void>;
  courseId: number;
  courseCode: string | null;
}) {
  const [formValues, setFormValues] = useState<CreateCourseVersionFormValues>(
    initialCreateCourseVersionFormValues
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = createState.status === 'saving';

  useEffect(() => {
    if (!opened) {
      return;
    }

    setFormValues(initialCreateCourseVersionFormValues);
    setValidationMessage(null);
  }, [opened, courseId]);

  async function handleSubmit() {
    const normalizedTitle = formValues.title.trim();
    const normalizedCatalogDescription = formValues.catalogDescription.trim();
    const minCredits = formValues.minCredits ? Number(formValues.minCredits) : Number.NaN;
    const maxCredits = formValues.variableCredit
      ? formValues.maxCredits
        ? Number(formValues.maxCredits)
        : Number.NaN
      : minCredits;

    if (!normalizedTitle) {
      setValidationMessage('Title is required.');
      return;
    }

    if (Number.isNaN(minCredits)) {
      setValidationMessage('Min credits is required.');
      return;
    }

    if (Number.isNaN(maxCredits)) {
      setValidationMessage('Max credits is required.');
      return;
    }

    if (formValues.variableCredit && minCredits > maxCredits) {
      setValidationMessage('Min credits must be less than or equal to max credits.');
      return;
    }

    setValidationMessage(null);

    await onCreate({
      title: normalizedTitle,
      catalogDescription: normalizedCatalogDescription.length > 0 ? normalizedCatalogDescription : null,
      minCredits,
      maxCredits,
      variableCredit: formValues.variableCredit,
    });
  }

  return (
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Create New Version"
      size="lg"
      isSaving={isSaving}
      validationMessage={validationMessage}
      validationTitle="Invalid course version"
      submissionError={createState.status === 'error' ? createState.message : null}
      submissionErrorTitle="Unable to create course version"
      submitLabel="Create Version"
      onSubmit={() => void handleSubmit()}
    >
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Course ID" value={String(courseId)} readOnly />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Course Code" value={courseCode ?? ''} placeholder="—" readOnly />
        </Grid.Col>
        <Grid.Col span={12}>
          <TextInput
            label="Title"
            placeholder="Enter course version title"
            value={formValues.title}
            onChange={(event) => {
              setFormValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Catalog Description"
            placeholder="Enter catalog description"
            minRows={4}
            value={formValues.catalogDescription}
            onChange={(event) => {
              setFormValues((current) => ({
                ...current,
                catalogDescription: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Min Credits"
            placeholder="Select minimum credits"
            data={creditOptions}
            searchable
            value={formValues.minCredits}
            onChange={(value) => {
              setFormValues((current) => ({
                ...current,
                minCredits: value,
                maxCredits: current.variableCredit ? current.maxCredits : value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Max Credits"
            placeholder="Select maximum credits"
            data={creditOptions}
            searchable
            value={formValues.variableCredit ? formValues.maxCredits : formValues.minCredits}
            disabled={!formValues.variableCredit}
            onChange={(value) => {
              setFormValues((current) => ({
                ...current,
                maxCredits: value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Switch
            label="Variable Credit"
            checked={formValues.variableCredit}
            onChange={(event) => {
              const checked = event.currentTarget.checked;

              setFormValues((current) => ({
                ...current,
                variableCredit: checked,
                maxCredits: checked ? current.maxCredits : current.minCredits,
              }));
            }}
          />
        </Grid.Col>
      </Grid>
    </FormModalShell>
  );
}
