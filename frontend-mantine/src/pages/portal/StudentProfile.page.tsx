import { useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  ProfileSection,
  type ProfileFieldConfig,
} from '@/components/profile/ProfileSection';
import {
  fetchStudentProfile,
  type StudentProfileResponse,
} from '@/services/student-profile-service';
import classes from './StudentProfile.module.css';

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

type StudentProfileSectionConfig = {
  fields: ProfileFieldConfig<StudentProfileResponse, EditableStudentProfileValues>[];
  title: string;
};

const emptyEditableProfileValues: EditableStudentProfileValues = {
  preferredName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
};

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue;
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

const personalSections: StudentProfileSectionConfig[] = [
  {
    title: 'Identity',
    fields: [
      { label: 'First name', value: (profile) => formatValue(profile.firstName) },
      { label: 'Middle name', value: (profile) => formatValue(profile.middleName) },
      { label: 'Last name', value: (profile) => formatValue(profile.lastName) },
      { label: 'Name suffix', value: (profile) => formatValue(profile.nameSuffix) },
    ],
  },
  {
    title: 'Background',
    fields: [
      { label: 'Date of birth', value: (profile) => formatDate(profile.dateOfBirth) },
      { label: 'Gender', value: (profile) => formatValue(profile.gender) },
      { label: 'Ethnicity', value: (profile) => formatValue(profile.ethnicity) },
      {
        editKey: 'preferredName',
        label: 'Preferred name',
        value: (profile) => formatValue(profile.preferredName),
      },
    ],
  },
];

const studentSections: StudentProfileSectionConfig[] = [
  {
    title: 'Student',
    fields: [
      { label: 'Student ID', value: (profile) => formatValue(profile.studentId) },
      { label: 'Class standing', value: (profile) => formatValue(profile.classStanding) },
      { label: 'Estimated grad date', value: (profile) => formatDate(profile.estimatedGradDate) },
      { label: 'Class of', value: (profile) => formatValue(profile.classOf) },
    ],
  },
];

const contactSections: StudentProfileSectionConfig[] = [
  {
    title: 'Contact',
    fields: [
      {
        inputType: 'email',
        label: 'Email',
        value: (profile) => formatValue(profile.email),
      },
      {
        inputType: 'tel',
        label: 'Phone',
        value: (profile) => formatValue(profile.phone),
      },
    ],
  },
  {
    title: 'Address',
    fields: [
      {
        editKey: 'addressLine1',
        label: 'Address line 1',
        value: (profile) => formatValue(profile.addressLine1),
      },
      {
        editKey: 'addressLine2',
        label: 'Address line 2',
        value: (profile) => formatValue(profile.addressLine2),
      },
      {
        editKey: 'city',
        label: 'City',
        value: (profile) => formatValue(profile.city),
      },
      {
        editKey: 'stateRegion',
        label: 'State / region',
        value: (profile) => formatValue(profile.stateRegion),
      },
      {
        editKey: 'postalCode',
        label: 'Postal code',
        value: (profile) => formatValue(profile.postalCode),
      },
      {
        editKey: 'countryCode',
        label: 'Country',
        value: (profile) => formatValue(profile.countryCode),
      },
    ],
  },
];

export function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<EditableStudentProfileValues>({
    initialValues: emptyEditableProfileValues,
  });

  const applyLoadedProfile = useEffectEvent((studentProfile: StudentProfileResponse) => {
    const editableValues = getEditableProfileValues(studentProfile);

    setProfile(studentProfile);
    form.setValues(editableValues);
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
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load student profile.'
          );
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

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Unable to load profile">
          {error || 'Student profile is unavailable.'}
        </Alert>
      </Container>
    );
  }

  const currentProfile = isEditing ? applyEditableProfileValues(profile, form.values) : profile;
  const hasLocalChanges = hasEditableProfileChanges(profile, form.values);

  const handleStartEditing = () => {
    form.setValues(getEditableProfileValues(profile));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    form.setValues(getEditableProfileValues(profile));
    setIsEditing(false);
  };

  const handleApplyLocally = () => {
    const nextProfile = applyEditableProfileValues(profile, form.values);

    setProfile(nextProfile);
    form.setValues(getEditableProfileValues(nextProfile));
    setIsEditing(false);
  };

  return (
    <Container size="xl" py="xl">
      <Stack className={classes.page}>
        <div className={classes.summaryCard}>
          <Grid align="center">
            <Grid.Col span={{ base: 12, lg: 9 }}>
              <Stack gap="md">
                <Group gap="xs" className={classes.summaryMeta}>
                  <Text className={joinClasses(classes.eyebrowText, 'portal-ui-eyebrow-text')}>
                    Student profile
                  </Text>
                  {hasLocalChanges ? (
                    <Text className={joinClasses(classes.statusText, 'portal-ui-text')}>
                      Local changes
                    </Text>
                  ) : null}
                </Group>
                <Title order={2} className={classes.summaryTitle}>
                  {formatValue(currentProfile.fullName)}
                </Title>
                <Group gap="xl" className={classes.metaRow}>
                  <Stack gap={2} className={classes.metaItem}>
                    <Text className={joinClasses(classes.label, 'portal-ui-label-text')}>
                      Class standing
                    </Text>
                    <Text className={joinClasses(classes.metaValue, 'portal-ui-value-text')}>
                      Student Profile
                    </Text>
                  </Stack>
                  <Stack gap={2} className={classes.metaItem}>
                    <Text className={joinClasses(classes.label, 'portal-ui-label-text')}>
                      Class of
                    </Text>
                    <Text className={joinClasses(classes.metaValue, 'portal-ui-value-text')}>
                      {formatValue(currentProfile.classOf)}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 3 }}>
              <Stack gap="sm" align="stretch" className={classes.summarySide}>
                <div className={classes.preferredCard}>
                  <Stack gap={6}>
                    <Text className={joinClasses(classes.label, 'portal-ui-label-text')}>
                      Preferred name
                    </Text>
                    <Text className={joinClasses(classes.preferredValue, 'portal-ui-value-text')}>
                      {formatValue(currentProfile.preferredName)}
                    </Text>
                  </Stack>
                </div>
                <Group justify="flex-end">
                  {isEditing ? (
                    <>
                      <Button onClick={handleApplyLocally} disabled={!hasLocalChanges}>
                        Apply locally
                      </Button>
                      <Button variant="default" onClick={handleCancelEditing}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="light" onClick={handleStartEditing}>
                      Edit details
                    </Button>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </div>

        <div className={classes.sectionsPanel}>
          <Tabs
            defaultValue="personal"
            p="lg"
            classNames={{
              list: classes.tabsList,
              panel: classes.tabPanel,
              tab: classes.tab,
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="personal">Personal</Tabs.Tab>
              <Tabs.Tab value="student">Student</Tabs.Tab>
              <Tabs.Tab value="contact">Contact</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="personal" pt="xl">
              <Stack gap="xl">
                {personalSections.map((section) => (
                  <ProfileSection
                    key={section.title}
                    fields={section.fields}
                    form={form}
                    isEditing={isEditing}
                    profile={currentProfile}
                    title={section.title}
                  />
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="student" pt="xl">
              <Stack gap="xl">
                {studentSections.map((section) => (
                  <ProfileSection
                    key={section.title}
                    fields={section.fields}
                    form={form}
                    isEditing={isEditing}
                    profile={currentProfile}
                    title={section.title}
                  />
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="contact" pt="xl">
              <Stack gap="xl">
                {contactSections.map((section) => (
                  <ProfileSection
                    key={section.title}
                    fields={section.fields}
                    form={form}
                    isEditing={isEditing}
                    profile={currentProfile}
                    title={section.title}
                  />
                ))}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </div>
      </Stack>
    </Container>
  );
}
