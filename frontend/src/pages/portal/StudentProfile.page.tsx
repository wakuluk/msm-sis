import { useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  DetailsTableSection,
  type DetailsTableSectionConfig,
} from '@/components/profile/DetailsTableSection';
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

type ProfileTableSectionConfig = DetailsTableSectionConfig<
  StudentProfileResponse,
  EditableStudentProfileValues
>;

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

function displayValue(value: number | string | null | undefined) {
  return formatValue(value) || '—';
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

function getEditablePlaceholder(label: string) {
  if (label === 'Address line 2') {
    return 'Optional';
  }

  return `Enter ${label.toLowerCase()}`;
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
  editableValues: EditableStudentProfileValues,
): StudentProfileResponse {
  return {
    ...profile,
    ...editableValues,
  };
}

function hasEditableProfileChanges(
  profile: StudentProfileResponse,
  editableValues: EditableStudentProfileValues,
) {
  return editableFieldKeys.some((key) => (profile[key] ?? '') !== editableValues[key]);
}

const personalSections: ProfileTableSectionConfig[] = [
  {
    title: 'Identity',
    fields: [
      { label: 'First name', value: (profile) => displayValue(profile.firstName) },
      { label: 'Middle name', value: (profile) => displayValue(profile.middleName) },
      { label: 'Last name', value: (profile) => displayValue(profile.lastName) },
      { label: 'Name suffix', value: (profile) => displayValue(profile.nameSuffix) },
      {
        editKey: 'preferredName',
        label: 'Preferred name',
        value: (profile) => displayValue(profile.preferredName),
      },
    ],
  },
  {
    title: 'Background',
    fields: [
      { label: 'Date of birth', value: (profile) => displayDate(profile.dateOfBirth) },
      { label: 'Gender', value: (profile) => displayValue(profile.gender) },
      { label: 'Ethnicity', value: (profile) => displayValue(profile.ethnicity) },
    ],
  },
];

const studentSections: ProfileTableSectionConfig[] = [
  {
    title: 'Student Record',
    fields: [
      { label: 'Student ID', value: (profile) => displayValue(profile.studentId) },
      { label: 'Class standing', value: (profile) => displayValue(profile.classStanding) },
      { label: 'Estimated grad date', value: (profile) => displayDate(profile.estimatedGradDate) },
      { label: 'Class of', value: (profile) => displayValue(profile.classOf) },
    ],
  },
];

const contactSections: ProfileTableSectionConfig[] = [
  {
    title: 'Contact',
    fields: [
      {
        inputType: 'email',
        label: 'Email',
        value: (profile) => displayValue(profile.email),
      },
      {
        inputType: 'tel',
        label: 'Phone',
        value: (profile) => displayValue(profile.phone),
      },
    ],
  },
  {
    title: 'Address',
    fields: [
      {
        editKey: 'addressLine1',
        label: 'Address line 1',
        value: (profile) => displayValue(profile.addressLine1),
      },
      {
        editKey: 'addressLine2',
        label: 'Address line 2',
        value: (profile) => displayValue(profile.addressLine2),
      },
      {
        editKey: 'city',
        label: 'City',
        value: (profile) => displayValue(profile.city),
      },
      {
        editKey: 'stateRegion',
        label: 'State / region',
        value: (profile) => displayValue(profile.stateRegion),
      },
      {
        editKey: 'postalCode',
        label: 'Postal code',
        value: (profile) => displayValue(profile.postalCode),
      },
      {
        editKey: 'countryCode',
        label: 'Country',
        value: (profile) => displayValue(profile.countryCode),
      },
    ],
  },
];

const summaryBadges = [
  { color: 'blue', label: 'Class standing' },
  { color: 'indigo', label: 'Class of' },
  { color: 'gray', label: 'Preferred name' },
] as const;

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
            loadError instanceof Error ? loadError.message : 'Failed to load student profile.',
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
        <Paper className={classes.summaryCard}>
          <Stack gap="lg">
            <Group justify="space-between" gap="lg" className={classes.summaryHeader}>
              <Stack gap="xs">
                <Group gap="xs" wrap="wrap">
                  <Text className="portal-ui-eyebrow-text">Student profile</Text>
                </Group>
                <Title order={2} className={classes.summaryTitle}>
                  {displayValue(currentProfile.fullName)}
                </Title>
              </Stack>
            </Group>

            <Group gap="sm" wrap="wrap" className={classes.summaryMeta}>
              <Badge
                color={summaryBadges[0].color}
                variant="filled"
                radius="sm"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                {displayValue(currentProfile.classStanding)}
              </Badge>
              <Badge
                color={summaryBadges[1].color}
                variant="filled"
                radius="sm"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                {summaryBadges[1].label}: {displayValue(currentProfile.classOf)}
              </Badge>
              <Badge
                color={summaryBadges[2].color}
                variant="filled"
                radius="sm"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                {summaryBadges[2].label}: {displayValue(currentProfile.preferredName)}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        <Paper className={classes.sectionsPanel}>
          <Tabs
            defaultValue="personal"
            classNames={{
              list: classes.tabsList,
              panel: classes.tabPanel,
              tab: classes.tab,
            }}
          >
            <Group justify="space-between" align="flex-end" gap="md" className={classes.sectionsHeader}>
              <Tabs.List className={classes.tabsHeaderList}>
                <Tabs.Tab value="personal">Personal</Tabs.Tab>
                <Tabs.Tab value="student">Student</Tabs.Tab>
                <Tabs.Tab value="contact">Contact</Tabs.Tab>
              </Tabs.List>

              <Group justify="flex-end" gap="sm" className={classes.sectionActions}>
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
                  <Button color="blue" onClick={handleStartEditing}>
                    Edit details
                  </Button>
                )}
              </Group>
            </Group>

            <Tabs.Panel value="personal">
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" className={classes.panelGrid}>
                {personalSections.map((section) => (
                  <DetailsTableSection
                    key={section.title}
                    form={form}
                    getInputPlaceholder={(field) => getEditablePlaceholder(field.label)}
                    isEditing={isEditing}
                    record={currentProfile}
                    section={section}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="student">
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" className={classes.panelGrid}>
                {studentSections.map((section) => (
                  <DetailsTableSection
                    key={section.title}
                    form={form}
                    getInputPlaceholder={(field) => getEditablePlaceholder(field.label)}
                    isEditing={isEditing}
                    record={currentProfile}
                    section={section}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="contact">
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" className={classes.panelGrid}>
                {contactSections.map((section) => (
                  <DetailsTableSection
                    key={section.title}
                    form={form}
                    getInputPlaceholder={(field) => getEditablePlaceholder(field.label)}
                    isEditing={isEditing}
                    record={currentProfile}
                    section={section}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
