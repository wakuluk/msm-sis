import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { buildCreateStudentRequest } from '@/services/mappers/student-mappers';
import {
  getStudentReferenceOptions,
  mapReferenceOptionsToSelectOptions,
} from '@/services/reference-service';
import {
  initialStudentCreateFormValues,
  type StudentCreateFormValues,
} from '@/services/schemas/student-schemas';
import { createStudent } from '@/services/student-service';
import standardInputClasses from '@/styles/StandardInput.module.css';
import classes from './StudentCreate.module.css';

type StudentCreateReferenceOptionsState =
  | { status: 'loading' }
  | {
      status: 'success';
      classStandingOptions: Array<{ value: string; label: string }>;
      ethnicityOptions: Array<{ value: string; label: string }>;
      genderOptions: Array<{ value: string; label: string }>;
    }
  | { status: 'error'; message: string };

type StudentCreateSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function StudentCreatePage() {
  const navigate = useNavigate();
  const [referenceOptionsState, setReferenceOptionsState] =
    useState<StudentCreateReferenceOptionsState>({
      status: 'loading',
    });
  const [submitState, setSubmitState] = useState<StudentCreateSubmitState>({ status: 'idle' });

  const form = useForm<StudentCreateFormValues>({
    initialValues: initialStudentCreateFormValues,
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required.'),
      lastName: (value) => (value.trim() ? null : 'Last name is required.'),
    },
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const referenceOptions = await getStudentReferenceOptions();

        if (cancelled) {
          return;
        }

        setReferenceOptionsState({
          status: 'success',
          classStandingOptions: mapReferenceOptionsToSelectOptions(referenceOptions.classStandings),
          ethnicityOptions: mapReferenceOptionsToSelectOptions(referenceOptions.ethnicities),
          genderOptions: mapReferenceOptionsToSelectOptions(referenceOptions.genders),
        });
      } catch (error) {
        if (!cancelled) {
          setReferenceOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load student reference options.'),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const classStandingOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.classStandingOptions : [];
  const ethnicityOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.ethnicityOptions : [];
  const genderOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.genderOptions : [];
  const isSubmitting = submitState.status === 'submitting';
  const submitError = submitState.status === 'error' ? submitState.message : null;
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const referenceOptionsLoading = referenceOptionsState.status === 'loading';

  async function handleSubmit(values: StudentCreateFormValues) {
    if (isSubmitting) {
      return;
    }

    try {
      setSubmitState({ status: 'submitting' });
      const request = buildCreateStudentRequest(values);
      const createdStudent = await createStudent(request);
      navigate(`/students/${createdStudent.studentId}`, { replace: true });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create student.'),
      });
    }
  }

  return (
    <Container size="lg" py="lg">
      <Stack className={classes.page}>
        <Paper className={classes.summaryCard}>
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
            <Stack gap="xs" className={classes.summaryCopy}>
              <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
              <Title order={1} className={classes.summaryTitle}>
                Create Student
              </Title>
              <Text size="sm" c="dimmed" className={classes.summaryText}>
                Capture the core student record here. After save, the app will redirect straight to
                the new student detail page so you can continue with the full profile.
              </Text>
            </Stack>
            <Badge variant="light" size="lg">
              Admin only
            </Badge>
          </Group>
        </Paper>

        {submitError ? (
          <Alert color="red" title="Unable to create student">
            {submitError}
          </Alert>
        ) : null}

        {referenceOptionsError ? (
          <Alert color="orange" title="Reference options unavailable">
            {referenceOptionsError} You can still create the student, but the gender, ethnicity, and
            class standing lists are unavailable until the reference request succeeds.
          </Alert>
        ) : null}

        <Paper className={classes.formPanel}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap={0}>
              <section className={classes.section}>
                <div className={classes.sectionHeader}>
                  <Title order={3} className={classes.sectionTitle}>
                    Identity
                  </Title>
                  <Text size="sm" c="dimmed">
                    Required name fields plus personal identifiers used throughout the portal.
                  </Text>
                </div>
                <Grid gap="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      withAsterisk
                      label="Last name"
                      placeholder="Enter last name"
                      error={form.errors.lastName}
                      {...form.getInputProps('lastName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      withAsterisk
                      label="First name"
                      placeholder="Enter first name"
                      error={form.errors.firstName}
                      {...form.getInputProps('firstName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Middle name"
                      placeholder="Enter middle name"
                      {...form.getInputProps('middleName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Name suffix"
                      placeholder="Jr., III, etc."
                      {...form.getInputProps('nameSuffix')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Preferred name"
                      placeholder="Enter preferred name"
                      {...form.getInputProps('preferredName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      searchable
                      clearable
                      label="Gender"
                      data={genderOptions}
                      value={form.values.genderId || null}
                      onChange={(value) => {
                        form.setFieldValue('genderId', value ?? '');
                      }}
                      placeholder="Select gender"
                      rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
                      nothingFoundMessage={
                        referenceOptionsLoading ? 'Loading options...' : 'No options found'
                      }
                      classNames={{
                        input: standardInputClasses.input,
                        option: classes.selectOption,
                        section: standardInputClasses.section,
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      searchable
                      clearable
                      label="Ethnicity"
                      data={ethnicityOptions}
                      value={form.values.ethnicityId || null}
                      onChange={(value) => {
                        form.setFieldValue('ethnicityId', value ?? '');
                      }}
                      placeholder="Select ethnicity"
                      rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
                      nothingFoundMessage={
                        referenceOptionsLoading ? 'Loading options...' : 'No options found'
                      }
                      classNames={{
                        input: standardInputClasses.input,
                        option: classes.selectOption,
                        section: standardInputClasses.section,
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateInput
                      value={form.values.dateOfBirth || null}
                      onChange={(value) => {
                        form.setFieldValue('dateOfBirth', value ?? '');
                      }}
                      valueFormat="YYYY-MM-DD"
                      label="Date of birth"
                      placeholder="YYYY-MM-DD"
                      clearable
                    />
                  </Grid.Col>
                </Grid>
              </section>

              <section className={classes.section}>
                <div className={classes.sectionHeader}>
                  <Title order={3} className={classes.sectionTitle}>
                    Student
                  </Title>
                  <Text size="sm" c="dimmed">
                    Enrollment-facing fields that help staff place the record correctly once it
                    opens in detail view.
                  </Text>
                </div>
                <Grid gap="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      searchable
                      clearable
                      label="Class standing"
                      data={classStandingOptions}
                      value={form.values.classStandingId || null}
                      onChange={(value) => {
                        form.setFieldValue('classStandingId', value ?? '');
                      }}
                      placeholder="Select class standing"
                      rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
                      nothingFoundMessage={
                        referenceOptionsLoading ? 'Loading options...' : 'No options found'
                      }
                      classNames={{
                        input: standardInputClasses.input,
                        option: classes.selectOption,
                        section: standardInputClasses.section,
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateInput
                      value={form.values.estimatedGradDate || null}
                      onChange={(value) => {
                        form.setFieldValue('estimatedGradDate', value ?? '');
                      }}
                      valueFormat="YYYY-MM-DD"
                      label="Estimated grad date"
                      placeholder="YYYY-MM-DD"
                      clearable
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Alt ID"
                      placeholder="Enter alternate ID"
                      {...form.getInputProps('altId')}
                    />
                  </Grid.Col>
                </Grid>
              </section>

              <section className={classes.section}>
                <div className={classes.sectionHeader}>
                  <Title order={3} className={classes.sectionTitle}>
                    Contact
                  </Title>
                  <Text size="sm" c="dimmed">
                    Basic communication fields for the first pass of the record.
                  </Text>
                </div>
                <Grid gap="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Email"
                      placeholder="name@example.com"
                      {...form.getInputProps('email')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Phone"
                      placeholder="Enter phone number"
                      {...form.getInputProps('phone')}
                    />
                  </Grid.Col>
                </Grid>
              </section>

              <section className={classes.section}>
                <div className={classes.sectionHeader}>
                  <Title order={3} className={classes.sectionTitle}>
                    Address
                  </Title>
                  <Text size="sm" c="dimmed">
                    Address fields are optional. Leave them blank if the student should start
                    without an address on file.
                  </Text>
                </div>
                <Grid gap="md">
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address line 1"
                      placeholder="Street address"
                      {...form.getInputProps('addressLine1')}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address line 2"
                      placeholder="Apartment, suite, unit, etc."
                      {...form.getInputProps('addressLine2')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="City"
                      placeholder="Enter city"
                      {...form.getInputProps('city')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="State / region"
                      placeholder="Enter state or region"
                      {...form.getInputProps('stateRegion')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Postal code"
                      placeholder="Enter postal code"
                      {...form.getInputProps('postalCode')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Country code"
                      placeholder="US"
                      {...form.getInputProps('countryCode')}
                    />
                  </Grid.Col>
                </Grid>
              </section>

              <div className={classes.footerBar}>
                <Text size="sm" c="dimmed" className={classes.footerText}>
                  The student ID is assigned on save. Once the record is created, you will land on
                  the student detail page to continue editing.
                </Text>
                <Group gap="sm" wrap="wrap" justify="flex-end">
                  <Button
                    component={Link}
                    to="/student-search"
                    variant="default"
                    disabled={isSubmitting}
                  >
                    Back to search
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Create student
                  </Button>
                </Group>
              </div>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
