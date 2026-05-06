import type { UseFormReturnType } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { Button, Grid, Group, Text, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  AcademicSubTermDetailFormValues,
  AcademicSubTermResponse,
} from '@/services/schemas/academic-years-schemas';
import {
  displayDate,
  displayDateTime,
  normalizeDateInputValue,
  parseDateInputValue,
} from './academicYearDisplay';
import { displayValue } from '@/utils/form-values';

type AcademicTermInfoSectionProps = {
  academicYearPath: string;
  canSaveChanges: boolean;
  detail: AcademicSubTermResponse;
  form: UseFormReturnType<AcademicSubTermDetailFormValues>;
  hasPendingMutation: boolean;
  isEditing: boolean;
  onCancelEdit: () => void;
  onEdit: () => void;
  onSave: () => void;
  saveInProgress: boolean;
  saveSucceeded: boolean;
  statusShiftInProgress: boolean;
};

export function AcademicTermInfoSection({
  academicYearPath,
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
  statusShiftInProgress,
}: AcademicTermInfoSectionProps) {
  return (
    <RecordPageSection
      title="Sub Term"
      description="These fields reflect the current sub term detail."
      action={
        isEditing ? (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button onClick={onCancelEdit} variant="default" disabled={hasPendingMutation}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              loading={saveInProgress}
              disabled={!canSaveChanges || statusShiftInProgress}
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
            <Button onClick={onEdit} variant="light" disabled={statusShiftInProgress}>
              Edit details
            </Button>
            <Button component={Link} to={academicYearPath} variant="default">
              View academic year
            </Button>
          </Group>
        )
      }
    >
      <ReadOnlyField
        label="Sub term ID"
        value={displayValue(detail.subTermId)}
        span={{ base: 12, md: 4 }}
      />
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
          <Grid.Col span={{ base: 12, md: 5 }}>
            <TextInput withAsterisk label="Name" maxLength={100} {...form.getInputProps('name')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              withAsterisk
              label="Sort order"
              inputMode="numeric"
              {...form.getInputProps('sortOrder')}
            />
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
          <ReadOnlyField label="Name" value={displayValue(detail.name)} span={{ base: 12, md: 5 }} />
          <ReadOnlyField
            label="Sort order"
            value={displayValue(detail.sortOrder)}
            span={{ base: 12, md: 3 }}
          />
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
        label="Current status"
        value={displayValue(detail.subTermStatusName ?? detail.subTermStatusCode)}
        span={{ base: 12, md: 3 }}
      />
      <ReadOnlyField
        label="Active"
        value={displayValue(detail.active)}
        span={{ base: 12, md: 3 }}
      />
      <ReadOnlyField
        label="Updated by"
        value={displayValue(detail.updatedBy)}
        span={{ base: 12, md: 3 }}
      />
      <ReadOnlyField
        label="Last updated"
        value={displayDateTime(detail.lastUpdated)}
        span={{ base: 12, md: 4 }}
      />
    </RecordPageSection>
  );
}
