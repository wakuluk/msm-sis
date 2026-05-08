import { type ComponentProps, useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import { Alert, Badge, Button, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import {
  fetchStudentProfile,
  type StudentProfileResponse,
} from '@/services/student-profile-service';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';

const editableFieldKeys = [
  'preferredName',
  'addressLine1',
  'addressLine2',
  'city',
  'stateRegion',
  'postalCode',
  'countryCode',
] as const;

type EditableStudentProfileKey = (typeof editableFieldKeys)[number];
type EditableStudentProfileValues = Record<EditableStudentProfileKey, string>;
type GridSpan = ComponentProps<typeof Grid.Col>['span'];

const emptyEditableProfileValues: EditableStudentProfileValues = {
  preferredName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
};

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return '';
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

function displayDate(value: string | null) {
  return formatDate(value) || '—';
}

function getEditableProfileValues(profile: StudentProfileResponse): EditableStudentProfileValues {
  return {
    preferredName: profile.preferredName ?? '',
    addressLine1: profile.addressLine1 ?? '',
    addressLine2: profile.addressLine2 ?? '',
    city: profile.city ?? '',
    stateRegion: profile.stateRegion ?? '',
    postalCode: profile.postalCode ?? '',
    countryCode: profile.countryCode ?? '',
  };
}

function applyEditableProfileValues(
  profile: StudentProfileResponse,
  editableValues: EditableStudentProfileValues
): StudentProfileResponse {
  return {
    ...profile,
    ...editableValues,
  };
}

function hasEditableProfileChanges(
  profile: StudentProfileResponse,
  editableValues: EditableStudentProfileValues
) {
  return editableFieldKeys.some((key) => (profile[key] ?? '') !== editableValues[key]);
}

function EditableField({
  formKey,
  formValues,
  label,
  onChange,
  placeholder,
  span = { base: 12, md: 6 },
}: {
  formKey: EditableStudentProfileKey;
  formValues: EditableStudentProfileValues;
  label: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  span?: GridSpan;
}) {
  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={formValues[formKey]}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        placeholder={placeholder}
      />
    </Grid.Col>
  );
}

export function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applySucceeded, setApplySucceeded] = useState(false);

  const form = useForm<EditableStudentProfileValues>({
    initialValues: emptyEditableProfileValues,
  });

  const applyLoadedProfile = useEffectEvent((studentProfile: StudentProfileResponse) => {
    const editableValues = getEditableProfileValues(studentProfile);

    setProfile(studentProfile);
    form.setValues(editableValues);
    setApplySucceeded(false);
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setError('');
      setIsLoading(true);

      try {
        const studentProfile = await fetchStudentProfile();

        if (!cancelled) {
          applyLoadedProfile(studentProfile);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, 'Failed to load student profile.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!applySucceeded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setApplySucceeded(false);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applySucceeded]);

  if (isLoading) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Student Profile"
        title="Profile"
        description="Loading your student profile."
      >
        <Stack gap={0}>
          <RecordPageSection title="Student Profile" description="Your profile data is loading.">
            <Grid.Col span={12}>
              <Group justify="center" py="md">
                <Loader />
              </Group>
            </Grid.Col>
          </RecordPageSection>
        </Stack>
      </RecordPageShell>
    );
  }

  if (error || !profile) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Student Profile"
        title="Profile"
        description="Your student profile could not be loaded."
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Student Profile"
            description="The profile service did not return student data."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load profile">
                {error || 'Student profile is unavailable.'}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        </Stack>
      </RecordPageShell>
    );
  }

  const loadedProfile = profile;
  const currentProfile = isEditing
    ? applyEditableProfileValues(loadedProfile, form.values)
    : loadedProfile;
  const hasLocalChanges = hasEditableProfileChanges(loadedProfile, form.values);

  function handleStartEditing() {
    form.setValues(getEditableProfileValues(loadedProfile));
    setIsEditing(true);
    setApplySucceeded(false);
  }

  function handleCancelEditing() {
    form.setValues(getEditableProfileValues(loadedProfile));
    setIsEditing(false);
    setApplySucceeded(false);
  }

  function handleApplyLocally() {
    const nextProfile = applyEditableProfileValues(loadedProfile, form.values);

    setProfile(nextProfile);
    form.setValues(getEditableProfileValues(nextProfile));
    setIsEditing(false);
    setApplySucceeded(true);
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Student Profile"
      title={displayValue(currentProfile.fullName)}
      description="Review your personal, student, and contact details."
      badge={
        <Group gap="sm" wrap="wrap">
          <Badge color="blue" variant="light">
            Class standing: {displayValue(currentProfile.classStanding)}
          </Badge>
          <Badge color="indigo" variant="light">
            Class of: {displayValue(currentProfile.classOf)}
          </Badge>
          <Badge color="gray" variant="light">
            Preferred name: {displayValue(currentProfile.preferredName)}
          </Badge>
        </Group>
      }
    >
      <Stack gap={0}>
        {isEditing ? (
          <RecordPageSection
            title="Editing"
            description="Profile edits on this page are still local only."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Local edit mode">
                Changes on this page are not saved to the backend yet.
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <RecordPageSection
          title="Identity"
          description="Core identity and background details from your student record."
          action={
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button onClick={handleCancelEditing} variant="default">
                  Cancel
                </Button>
                <Button onClick={handleApplyLocally} disabled={!hasLocalChanges}>
                  Apply locally
                </Button>
              </Group>
            ) : (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                {applySucceeded ? <Text size="sm" c="green">Changes applied.</Text> : null}
                <Button onClick={handleStartEditing} variant="light">
                  Edit details
                </Button>
              </Group>
            )
          }
        >
          <ReadOnlyField label="Last name" value={displayValue(currentProfile.lastName)} />
          <ReadOnlyField label="First name" value={displayValue(currentProfile.firstName)} />
          <ReadOnlyField label="Middle name" value={displayValue(currentProfile.middleName)} />
          <ReadOnlyField label="Name suffix" value={displayValue(currentProfile.nameSuffix)} />
          {isEditing ? (
            <EditableField
              formKey="preferredName"
              formValues={form.values}
              label="Preferred name"
              onChange={(nextValue) => {
                form.setFieldValue('preferredName', nextValue);
              }}
              placeholder="Enter preferred name"
            />
          ) : (
            <ReadOnlyField label="Preferred name" value={displayValue(currentProfile.preferredName)} />
          )}
          <ReadOnlyField label="Gender" value={displayValue(currentProfile.gender)} />
          <ReadOnlyField label="Ethnicity" value={displayValue(currentProfile.ethnicity)} />
          <ReadOnlyField label="Date of birth" value={displayDate(currentProfile.dateOfBirth)} />
        </RecordPageSection>

        <RecordPageSection
          title="Student"
          description="Student record fields and graduation planning details."
        >
          <ReadOnlyField label="Student ID" value={displayValue(currentProfile.studentId)} />
          <ReadOnlyField label="Class standing" value={displayValue(currentProfile.classStanding)} />
          <ReadOnlyField
            label="Estimated grad date"
            value={displayDate(currentProfile.estimatedGradDate)}
          />
          <ReadOnlyField label="Class of" value={displayValue(currentProfile.classOf)} />
        </RecordPageSection>

        <RecordPageSection
          title="Contact"
          description="Contact information associated with your student profile."
        >
          <ReadOnlyField label="Email" value={displayValue(currentProfile.email)} />
          <ReadOnlyField label="Phone" value={displayValue(currentProfile.phone)} />
        </RecordPageSection>

        <RecordPageSection
          title="Address"
          description="Mailing address information associated with your profile."
        >
          {isEditing ? (
            <>
              <EditableField
                formKey="addressLine1"
                formValues={form.values}
                label="Address line 1"
                onChange={(nextValue) => {
                  form.setFieldValue('addressLine1', nextValue);
                }}
                placeholder="Street address"
                span={12}
              />
              <EditableField
                formKey="addressLine2"
                formValues={form.values}
                label="Address line 2"
                onChange={(nextValue) => {
                  form.setFieldValue('addressLine2', nextValue);
                }}
                placeholder="Apartment, suite, unit, etc."
                span={12}
              />
              <EditableField
                formKey="city"
                formValues={form.values}
                label="City"
                onChange={(nextValue) => {
                  form.setFieldValue('city', nextValue);
                }}
                placeholder="Enter city"
              />
              <EditableField
                formKey="stateRegion"
                formValues={form.values}
                label="State / region"
                onChange={(nextValue) => {
                  form.setFieldValue('stateRegion', nextValue);
                }}
                placeholder="Enter state or region"
              />
              <EditableField
                formKey="postalCode"
                formValues={form.values}
                label="Postal code"
                onChange={(nextValue) => {
                  form.setFieldValue('postalCode', nextValue);
                }}
                placeholder="Enter postal code"
                span={{ base: 12, md: 4 }}
              />
              <EditableField
                formKey="countryCode"
                formValues={form.values}
                label="Country code"
                onChange={(nextValue) => {
                  form.setFieldValue('countryCode', nextValue);
                }}
                placeholder="US"
                span={{ base: 12, md: 4 }}
              />
            </>
          ) : (
            <>
              <ReadOnlyField
                label="Address line 1"
                value={displayValue(currentProfile.addressLine1)}
                span={12}
              />
              <ReadOnlyField
                label="Address line 2"
                value={displayValue(currentProfile.addressLine2)}
                span={12}
              />
              <ReadOnlyField label="City" value={displayValue(currentProfile.city)} />
              <ReadOnlyField
                label="State / region"
                value={displayValue(currentProfile.stateRegion)}
              />
              <ReadOnlyField
                label="Postal code"
                value={displayValue(currentProfile.postalCode)}
                span={{ base: 12, md: 4 }}
              />
              <ReadOnlyField
                label="Country code"
                value={displayValue(currentProfile.countryCode)}
                span={{ base: 12, md: 4 }}
              />
            </>
          )}
        </RecordPageSection>
      </Stack>
    </RecordPageShell>
  );
}
