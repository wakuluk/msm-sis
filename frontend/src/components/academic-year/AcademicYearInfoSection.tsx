import type { UseFormReturnType } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { Button, Grid, Group, Text, TextInput } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  AcademicYearCreateResponse,
  AcademicYearDetailFormValues,
} from '@/services/schemas/academic-years-schemas';
import {
  displayDate,
  displayValue,
  normalizeDateInputValue,
  parseDateInputValue,
} from './academicYearDisplay';

type AcademicYearInfoSectionProps = {
  addTermsInProgress: boolean;
  canSaveChanges: boolean;
  detail: AcademicYearCreateResponse;
  form: UseFormReturnType<AcademicYearDetailFormValues>;
  hasPendingMutation: boolean;
  isEditing: boolean;
  onCancelEdit: () => void;
  onEdit: () => void;
  onSave: () => void;
  saveInProgress: boolean;
  saveSucceeded: boolean;
};

export function AcademicYearInfoSection({
  addTermsInProgress,
  canSaveChanges,
  detail,
  form,
  hasPendingMutation,
  isEditing,
  onCancelEdit,
  onEdit,
  onSave,
  saveInProgress,
  saveSucceeded,
}: AcademicYearInfoSectionProps) {
  return (
    <RecordPageSection
      title="Academic Year"
      action={
        isEditing ? (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button onClick={onCancelEdit} variant="default" disabled={hasPendingMutation}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              loading={saveInProgress}
              disabled={!canSaveChanges || addTermsInProgress}
            >
              Save changes
            </Button>
          </Group>
        ) : (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            {saveSucceeded ? (
              <Text size="sm" c="teal">
                Changes saved.
              </Text>
            ) : null}
            <Button onClick={onEdit} variant="light" disabled={addTermsInProgress}>
              Edit details
            </Button>
          </Group>
        )
      }
    >
      <ReadOnlyField
        label="Academic year ID"
        value={displayValue(detail.academicYearId)}
        span={{ base: 12, md: 4 }}
      />
      {isEditing ? (
        <>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput withAsterisk label="Code" maxLength={20} {...form.getInputProps('code')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput withAsterisk label="Name" maxLength={100} {...form.getInputProps('name')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              withAsterisk
              value={parseDateInputValue(form.values.startDate)}
              onChange={(value) => {
                form.setFieldValue('startDate', normalizeDateInputValue(value));
              }}
              valueFormat="YYYY-MM-DD"
              label="Start date"
              placeholder="YYYY-MM-DD"
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              withAsterisk
              value={parseDateInputValue(form.values.endDate)}
              onChange={(value) => {
                form.setFieldValue('endDate', normalizeDateInputValue(value));
              }}
              valueFormat="YYYY-MM-DD"
              label="End date"
              placeholder="YYYY-MM-DD"
              clearable
            />
          </Grid.Col>
        </>
      ) : (
        <>
          <ReadOnlyField label="Code" value={displayValue(detail.code)} span={{ base: 12, md: 4 }} />
          <ReadOnlyField label="Name" value={displayValue(detail.name)} span={{ base: 12, md: 4 }} />
          <ReadOnlyField
            label="Start date"
            value={displayDate(detail.startDate)}
            span={{ base: 12, md: 3 }}
          />
          <ReadOnlyField
            label="End date"
            value={displayDate(detail.endDate)}
            span={{ base: 12, md: 3 }}
          />
        </>
      )}
      <ReadOnlyField
        label="Active"
        value={displayValue(detail.active)}
        span={{ base: 12, md: 3 }}
      />
      <ReadOnlyField
        label="Published"
        value={displayValue(detail.isPublished)}
        span={{ base: 12, md: 3 }}
      />
    </RecordPageSection>
  );
}
