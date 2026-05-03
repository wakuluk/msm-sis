import { useEffect, useState } from 'react';
import { Divider, Grid, Select, Switch, Textarea, TextInput } from '@mantine/core';
import { FormModalShell } from '@/components/modals/FormModalShell';
import type { CreateCourseVersionRequest } from '@/services/schemas/course-schemas';
import { CourseRequisitesEditor } from './CourseRequisitesEditor';
import {
  buildCourseRequisitesRequest,
  emptyCourseRequisites,
  type CourseRequisiteGroupDraft,
} from './courseRequisiteDrafts';
import { useCoursePickerOptions } from './useCoursePickerOptions';

type CreateCourseVersionState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export type CreateCourseVersionFormValues = {
  title: string;
  catalogDescription: string;
  minCredits: string | null;
  maxCredits: string | null;
  variableCredit: boolean;
  requisites: CourseRequisiteGroupDraft[];
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
  requisites: emptyCourseRequisites,
};

export function CreateCourseVersionModal({
  opened,
  onClose,
  createState,
  onCreate,
  courseId,
  courseCode,
  initialValues,
}: {
  opened: boolean;
  onClose: () => void;
  createState: CreateCourseVersionState;
  onCreate: (request: CreateCourseVersionRequest) => Promise<void>;
  courseId: number;
  courseCode: string | null;
  initialValues?: CreateCourseVersionFormValues | null;
}) {
  const [formValues, setFormValues] = useState<CreateCourseVersionFormValues>(
    initialCreateCourseVersionFormValues
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = createState.status === 'saving';
  const coursePickerOptions = useCoursePickerOptions(opened);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setFormValues(initialValues ?? initialCreateCourseVersionFormValues);
    setValidationMessage(null);
  }, [opened, courseId, initialValues]);

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

    const requisitesResult = buildCourseRequisitesRequest(formValues.requisites);
    if (requisitesResult.status === 'invalid') {
      setValidationMessage(requisitesResult.message);
      return;
    }

    setValidationMessage(null);

    await onCreate({
      title: normalizedTitle,
      catalogDescription: normalizedCatalogDescription.length > 0 ? normalizedCatalogDescription : null,
      minCredits,
      maxCredits,
      variableCredit: formValues.variableCredit,
      requisites: requisitesResult.requisites,
    });
  }

  return (
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Create New Version"
      size="72rem"
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
        <Grid.Col span={12}>
          <Divider />
        </Grid.Col>
        <Grid.Col span={12}>
          <CourseRequisitesEditor
            groups={formValues.requisites}
            courses={coursePickerOptions.courses}
            departmentOptions={coursePickerOptions.departmentOptions}
            loading={coursePickerOptions.loading}
            error={coursePickerOptions.error}
            disabled={isSaving}
            onChange={(requisites) => {
              setFormValues((current) => ({
                ...current,
                requisites:
                  typeof requisites === 'function'
                    ? requisites(current.requisites)
                    : requisites,
              }));
            }}
          />
        </Grid.Col>
      </Grid>
    </FormModalShell>
  );
}
