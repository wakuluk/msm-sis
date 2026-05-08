import { useState } from 'react';
import { Alert, Badge, Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
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
import { getErrorMessage } from '@/utils/errors';

type StudentCreateSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

export function StudentCreatePage() {
  const navigate = useNavigate();
  const { handleBack } = usePortalBackNavigation({ fallbackPath: '/student-search' });
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
    <RecordPageShell
      eyebrow="Admin Workflow"
      title="Create Student"
      description="Capture the core student record here. After save, the app will redirect straight to the new student detail page so you can continue with the full profile."
      badge={
        <Badge variant="light" size="lg">
          Admin only
        </Badge>
      }
      beforeForm={
        <>
          {submitError ? (
            <Alert color="red" title="Unable to create student">
              {submitError}
            </Alert>
          ) : null}

          {referenceOptionsError ? (
            <StudentReferenceOptionsAlert>
              {referenceOptionsError} You can still create the student, but the gender, ethnicity,
              and class standing lists are unavailable until the reference request succeeds.
            </StudentReferenceOptionsAlert>
          ) : null}
        </>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={0}>
          <RecordPageSection
            title="Identity"
            description="Required name fields plus personal identifiers used throughout the portal."
          >
            <StudentIdentityFormFields
              form={form}
              genderOptions={genderOptions}
              ethnicityOptions={ethnicityOptions}
              referenceOptionsLoading={referenceOptionsLoading}
              showRequiredNames
            />
          </RecordPageSection>

          <RecordPageSection
            title="Student"
            description="Enrollment-facing fields that help staff place the record correctly once it opens in detail view."
          >
            <StudentRecordFormFields
              form={form}
              classStandingOptions={classStandingOptions}
              referenceOptionsLoading={referenceOptionsLoading}
            />
          </RecordPageSection>

          <RecordPageSection
            title="Contact"
            description="Basic communication fields for the first pass of the record."
          >
            <StudentContactFormFields form={form} />
          </RecordPageSection>

          <RecordPageSection
            title="Address"
            description="Address fields are optional. Leave them blank if the student should start without an address on file."
          >
            <StudentAddressFormFields form={form} />
          </RecordPageSection>

          <RecordPageFooter description="The student ID is assigned on save. Once the record is created, you will land on the student detail page to continue editing.">
            <Button type="button" onClick={handleBack} variant="default" disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create student
            </Button>
          </RecordPageFooter>
        </Stack>
      </form>
    </RecordPageShell>
  );
}
