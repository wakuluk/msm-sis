import type { ComponentProps, ReactNode } from 'react';
import { Alert, Button, Grid, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import createClasses from '@/components/create/RecordPageLayout.module.css';
import {
  StudentAddressFormFields,
  StudentContactFormFields,
  StudentIdentityFormFields,
  StudentRecordFormFields,
} from '@/components/student/StudentProfileFormFields';
import { StudentReferenceOptionsAlert } from '@/components/student/StudentReferenceOptionsAlert';
import type {
  StudentDetailFormValues,
  StudentDetailResponse,
} from '@/services/schemas/student-schemas';
import { displayValue } from '@/utils/form-values';
import classes from '@/pages/portal/StudentDetail.module.css';

type GridSpan = ComponentProps<typeof Grid.Col>['span'];

type ReadOnlyTextFieldProps = {
  label: string;
  value: string;
  span?: GridSpan;
};

type DetailSectionProps = {
  action?: ReactNode;
  children: ReactNode;
  title: string;
};

type StudentDetailOverviewSectionsProps = {
  canSaveChanges: boolean;
  canEdit: boolean;
  classStandingOptions: Array<{ value: string; label: string }>;
  detail: StudentDetailResponse;
  ethnicityOptions: Array<{ value: string; label: string }>;
  form: UseFormReturnType<StudentDetailFormValues>;
  genderOptions: Array<{ value: string; label: string }>;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  saveSucceeded: boolean;
  onStartEdit: () => void;
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
  saveError: string | null;
  saveInProgress: boolean;
  values: StudentDetailFormValues;
};

function displayDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

function displayDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(value.includes('T') ? value : value.replace(' ', 'T'));

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function ReadOnlyTextField({ label, value, span = { base: 12, md: 6 } }: ReadOnlyTextFieldProps) {
  const isEmptyValue = value === '—';

  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={isEmptyValue ? '' : value}
        placeholder={isEmptyValue ? '—' : undefined}
        readOnly
      />
    </Grid.Col>
  );
}

function DetailSection({ action, children, title }: DetailSectionProps) {
  return (
    <section className={createClasses.section}>
      <div className={createClasses.sectionHeader}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Title order={3} className={`${createClasses.sectionTitle} ${classes.sectionTitle}`}>
            {title}
          </Title>
          {action}
        </Group>
      </div>
      <Grid gap="md">{children}</Grid>
    </section>
  );
}

export function StudentDetailOverviewSections({
  canSaveChanges,
  canEdit,
  classStandingOptions,
  detail,
  ethnicityOptions,
  form,
  genderOptions,
  isEditing,
  onCancelEdit,
  onSaveEdit,
  saveSucceeded,
  onStartEdit,
  referenceOptionsError,
  referenceOptionsLoading,
  saveError,
  saveInProgress,
  values,
}: StudentDetailOverviewSectionsProps) {
  return (
    <Stack gap={0}>
      {saveError ? (
        <div className={createClasses.section}>
          <Alert color="red" title="Unable to save changes">
            {saveError}
          </Alert>
        </div>
      ) : null}

      {referenceOptionsError ? (
        <div className={createClasses.section}>
          <StudentReferenceOptionsAlert>
            {referenceOptionsError} The remaining text and date fields are still available.
          </StudentReferenceOptionsAlert>
        </div>
      ) : null}

      <DetailSection
        title="Identity"
        action={
          canEdit ? (
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button onClick={onCancelEdit} variant="default" disabled={saveInProgress}>
                  Cancel
                </Button>
                <Button onClick={onSaveEdit} loading={saveInProgress} disabled={!canSaveChanges}>
                  Save changes
                </Button>
              </Group>
            ) : (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                {saveSucceeded ? <Text className={classes.saveSuccess}>Changes saved.</Text> : null}
                <Button onClick={onStartEdit} variant="light">
                  Edit details
                </Button>
              </Group>
            )
          ) : null
        }
      >
        {isEditing ? (
          <StudentIdentityFormFields
            form={form}
            genderOptions={genderOptions}
            ethnicityOptions={ethnicityOptions}
            referenceOptionsLoading={referenceOptionsLoading}
          />
        ) : (
          <>
            <ReadOnlyTextField label="Last name" value={displayValue(values.lastName)} />
            <ReadOnlyTextField label="First name" value={displayValue(values.firstName)} />
            <ReadOnlyTextField label="Middle name" value={displayValue(values.middleName)} />
            <ReadOnlyTextField label="Name suffix" value={displayValue(values.nameSuffix)} />
            <ReadOnlyTextField label="Preferred name" value={displayValue(values.preferredName)} />
            <ReadOnlyTextField label="Gender" value={displayValue(detail.gender)} />
            <ReadOnlyTextField label="Ethnicity" value={displayValue(detail.ethnicity)} />
            <ReadOnlyTextField label="Date of birth" value={displayDate(values.dateOfBirth)} />
          </>
        )}
      </DetailSection>

      <DetailSection title="Student">
        <ReadOnlyTextField label="Student ID" value={displayValue(detail.studentId)} />
        <ReadOnlyTextField label="User ID" value={displayValue(detail.userId)} />
        <ReadOnlyTextField label="Class of" value={displayValue(detail.classOf)} />
        {isEditing ? (
          <StudentRecordFormFields
            form={form}
            classStandingOptions={classStandingOptions}
            referenceOptionsLoading={referenceOptionsLoading}
          />
        ) : (
          <>
            <ReadOnlyTextField label="Class standing" value={displayValue(detail.classStanding)} />
            <ReadOnlyTextField label="Alt ID" value={displayValue(values.altId)} />
            <ReadOnlyTextField
              label="Estimated grad date"
              value={displayDate(values.estimatedGradDate)}
            />
          </>
        )}
      </DetailSection>

      <DetailSection title="Contact">
        {isEditing ? (
          <StudentContactFormFields form={form} />
        ) : (
          <>
            <ReadOnlyTextField label="Email" value={displayValue(values.email)} />
            <ReadOnlyTextField label="Phone" value={displayValue(values.phone)} />
          </>
        )}
      </DetailSection>

      <DetailSection title="Address">
        {isEditing ? (
          <StudentAddressFormFields form={form} />
        ) : (
          <>
            <ReadOnlyTextField
              label="Address line 1"
              value={displayValue(values.addressLine1)}
              span={12}
            />
            <ReadOnlyTextField
              label="Address line 2"
              value={displayValue(values.addressLine2)}
              span={12}
            />
            <ReadOnlyTextField label="City" value={displayValue(values.city)} />
            <ReadOnlyTextField label="State / region" value={displayValue(values.stateRegion)} />
            <ReadOnlyTextField
              label="Postal code"
              value={displayValue(values.postalCode)}
              span={{ base: 12, md: 4 }}
            />
            <ReadOnlyTextField
              label="Country code"
              value={displayValue(values.countryCode)}
              span={{ base: 12, md: 4 }}
            />
          </>
        )}
      </DetailSection>

      <DetailSection title="System">
        <ReadOnlyTextField label="Disabled" value={displayValue(values.disabled)} />
        <ReadOnlyTextField label="Address ID" value={displayValue(detail.addressId)} />
        <ReadOnlyTextField label="Updated by" value={displayValue(detail.updatedBy)} />
        <ReadOnlyTextField label="Last updated" value={displayDateTime(detail.lastUpdated)} />
      </DetailSection>
    </Stack>
  );
}
