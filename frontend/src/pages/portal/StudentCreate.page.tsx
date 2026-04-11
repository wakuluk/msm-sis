import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import {
  StudentAddressFormFields,
  StudentContactFormFields,
  StudentIdentityFormFields,
  StudentRecordFormFields,
} from '@/components/student/StudentProfileFormFields';
import { StudentReferenceOptionsAlert } from '@/components/student/StudentReferenceOptionsAlert';
import { useStudentReferenceOptions } from '@/components/student/useStudentReferenceOptions';
import { buildCreateStudentRequest } from '@/services/mappers/student-mappers';
import {
  initialStudentCreateFormValues,
  type StudentCreateFormValues,
} from '@/services/schemas/student-schemas';
import { createStudent } from '@/services/student-service';
import classes from './StudentCreate.module.css';

type StudentCreateSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function StudentCreatePage() {
  const navigate = useNavigate();
  const [submitState, setSubmitState] = useState<StudentCreateSubmitState>({ status: 'idle' });
  const {
    classStandingOptions,
    ethnicityOptions,
    genderOptions,
    referenceOptionsError,
    referenceOptionsLoading,
  } = useStudentReferenceOptions();

  const form = useForm<StudentCreateFormValues>({
    initialValues: initialStudentCreateFormValues,
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required.'),
      lastName: (value) => (value.trim() ? null : 'Last name is required.'),
    },
  });

  const isSubmitting = submitState.status === 'submitting';
  const submitError = submitState.status === 'error' ? submitState.message : null;

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
          <StudentReferenceOptionsAlert>
            {referenceOptionsError} You can still create the student, but the gender, ethnicity, and
            class standing lists are unavailable until the reference request succeeds.
          </StudentReferenceOptionsAlert>
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
                  <StudentIdentityFormFields
                    form={form}
                    genderOptions={genderOptions}
                    ethnicityOptions={ethnicityOptions}
                    referenceOptionsLoading={referenceOptionsLoading}
                    showRequiredNames
                  />
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
                  <StudentRecordFormFields
                    form={form}
                    classStandingOptions={classStandingOptions}
                    referenceOptionsLoading={referenceOptionsLoading}
                  />
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
                  <StudentContactFormFields form={form} />
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
                  <StudentAddressFormFields form={form} />
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
