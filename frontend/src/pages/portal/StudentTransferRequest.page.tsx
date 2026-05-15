import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  List,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconSend } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import {
  fetchStudentProfile,
  type StudentProfileResponse,
} from '@/services/student-profile-service';
import {
  getStudentTransferRequest,
  listStudentTransferRequests,
  submitStudentTransferRequest,
} from '@/services/transfer-request-service';
import type {
  StudentTransferRequestSubmissionRequest,
  TransferRequestResponse,
} from '@/services/schemas/transfer-request-schemas';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';

type TransferRequestFormValues = {
  oneOffInstitutionName: string;
  oneOffInstitutionAddressLine1: string;
  oneOffInstitutionAddressLine2: string;
  oneOffInstitutionCity: string;
  oneOffInstitutionStateRegion: string;
  oneOffInstitutionPostalCode: string;
  oneOffInstitutionCountryCode: string;
  oneOffInstitutionWebsite: string;
  term: string;
  reason: string;
  externalSubjectCode: string;
  externalCourseNumber: string;
  externalCourseTitle: string;
  externalCredits: string;
  requestedLocalCourseEquivalent: string;
  catalogDescription: string;
  studentNotes: string;
};

const initialValues: TransferRequestFormValues = {
  oneOffInstitutionName: '',
  oneOffInstitutionAddressLine1: '',
  oneOffInstitutionAddressLine2: '',
  oneOffInstitutionCity: '',
  oneOffInstitutionStateRegion: '',
  oneOffInstitutionPostalCode: '',
  oneOffInstitutionCountryCode: 'US',
  oneOffInstitutionWebsite: '',
  term: '',
  reason: '',
  externalSubjectCode: '',
  externalCourseNumber: '',
  externalCourseTitle: '',
  externalCredits: '',
  requestedLocalCourseEquivalent: '',
  catalogDescription: '',
  studentNotes: '',
};

const termOptions = ['Summer 2026', 'Fall 2026', 'Winter 2027', 'Spring 2027', 'Summer 2027'].map(
  (term) => ({ value: term, label: term })
);

const reasonOptions = [
  { value: 'Major requirement', label: 'Major requirement' },
  { value: 'Minor requirement', label: 'Minor requirement' },
  { value: 'Core requirement', label: 'Core requirement' },
  { value: 'Elective credit', label: 'Elective credit' },
  { value: 'Other', label: 'Other' },
];

const creditOptions = ['1', '2', '3', '4', '5', '6'].map((credit) => ({
  value: credit,
  label: `${credit} ${credit === '1' ? 'credit' : 'credits'}`,
}));

function profileValue(value: number | string | null | undefined) {
  return displayValue(value);
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCourse(request: TransferRequestResponse) {
  const course = request.primaryCourse;
  if (!course) {
    return '-';
  }

  return [course.externalSubjectCode, course.externalCourseNumber, course.externalCourseTitle]
    .filter(Boolean)
    .join(' ');
}

function formatInstitution(request: TransferRequestResponse) {
  return (
    request.institution.transferInstitutionName ??
    request.institution.oneOffInstitutionName ??
    '-'
  );
}

function trimmedOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildSubmitRequest(
  values: TransferRequestFormValues
): StudentTransferRequestSubmissionRequest {
  const requestedCredits = Number(values.externalCredits);

  return {
    institution: {
      oneOffInstitutionName: values.oneOffInstitutionName.trim(),
      oneOffInstitutionAddressLine1: trimmedOrNull(values.oneOffInstitutionAddressLine1),
      oneOffInstitutionAddressLine2: trimmedOrNull(values.oneOffInstitutionAddressLine2),
      oneOffInstitutionCity: trimmedOrNull(values.oneOffInstitutionCity),
      oneOffInstitutionStateRegion: trimmedOrNull(values.oneOffInstitutionStateRegion),
      oneOffInstitutionPostalCode: trimmedOrNull(values.oneOffInstitutionPostalCode),
      oneOffInstitutionCountryCode: trimmedOrNull(values.oneOffInstitutionCountryCode),
      oneOffInstitutionWebsite: trimmedOrNull(values.oneOffInstitutionWebsite),
    },
    course: {
      externalSubjectCode: values.externalSubjectCode.trim(),
      externalCourseNumber: values.externalCourseNumber.trim(),
      externalCourseTitle: values.externalCourseTitle.trim(),
      externalCourseDescription: trimmedOrNull(values.catalogDescription),
      externalTerm: values.term,
      requestedCredits,
      attemptedCredits: requestedCredits,
      reason: values.reason,
      studentNotes: trimmedOrNull(values.studentNotes),
      requestedLocalCourseEquivalent: trimmedOrNull(values.requestedLocalCourseEquivalent),
    },
  };
}

export function StudentTransferRequestPage() {
  const navigate = useNavigate();
  const { transferRequestId } = useParams<{ transferRequestId?: string }>();
  const isNewRequest = transferRequestId === 'new';
  const parsedTransferRequestId =
    transferRequestId && !isNewRequest ? Number(transferRequestId) : null;
  const isDetailRequest =
    parsedTransferRequestId !== null && Number.isInteger(parsedTransferRequestId);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [requests, setRequests] = useState<TransferRequestResponse[]>([]);
  const [detailRequest, setDetailRequest] = useState<TransferRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitState, setSubmitState] = useState<{
    message?: string;
    requestId?: number;
    status: 'idle' | 'submitting' | 'success' | 'error';
  }>({ status: 'idle' });

  const form = useForm<TransferRequestFormValues>({
    initialValues,
    validate: {
      oneOffInstitutionName: (value) =>
        value.trim().length === 0 ? 'Institution name is required.' : null,
      term: (value) => (value.trim().length === 0 ? 'Term is required.' : null),
      reason: (value) => (value.trim().length === 0 ? 'Reason is required.' : null),
      externalSubjectCode: (value) =>
        value.trim().length === 0 ? 'Subject code is required.' : null,
      externalCourseNumber: (value) =>
        value.trim().length === 0 ? 'Course number is required.' : null,
      externalCourseTitle: (value) =>
        value.trim().length === 0 ? 'Course title is required.' : null,
      externalCredits: (value) => (value.trim().length === 0 ? 'Credits are required.' : null),
      requestedLocalCourseEquivalent: (value) =>
        value.trim().length === 0 ? 'MSMU course equivalent is required.' : null,
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setIsLoading(true);
      setLoadError('');

      try {
        if (!transferRequestId) {
          const response = await listStudentTransferRequests();
          if (!cancelled) {
            setRequests(response.requests);
          }
          return;
        }

        if (isDetailRequest && parsedTransferRequestId !== null) {
          const request = await getStudentTransferRequest({
            transferRequestId: parsedTransferRequestId,
          });
          if (!cancelled) {
            setDetailRequest(request);
          }
          return;
        }

        const studentProfile = await fetchStudentProfile();

        if (!cancelled) {
          setProfile(studentProfile);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, 'Failed to load student profile.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [isDetailRequest, parsedTransferRequestId, transferRequestId]);

  async function handleSubmit(values: TransferRequestFormValues) {
    setSubmitState({ status: 'submitting' });

    try {
      const transferRequest = await submitStudentTransferRequest({
        request: buildSubmitRequest(values),
      });

      form.reset();
      setSubmitState({
        status: 'success',
        requestId: transferRequest.transferRequestId,
        message: 'Transfer request submitted for Registrar review.',
      });
      navigate(`/student/transfer-request/${transferRequest.transferRequestId}`);
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to submit transfer request.'),
      });
    }
  }

  if (!transferRequestId) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Student Academics"
        title="Transfer request"
        description="Review your submitted transfer requests or start a new request."
        badge={
          <Badge size="lg" variant="light" color="green">
            Student View
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Transfer requests"
            description="Click a request to view the submitted course and institution details."
            action={
              <Button
                leftSection={<IconSend size={16} />}
                onClick={() => {
                  navigate('/student/transfer-request/new');
                }}
              >
                New request
              </Button>
            }
          >
            <Grid.Col span={12}>
              {isLoading ? (
                <Group gap="sm">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">
                    Loading transfer requests.
                  </Text>
                </Group>
              ) : loadError ? (
                <Alert color="red" variant="light">
                  {loadError}
                </Alert>
              ) : requests.length === 0 ? (
                <Alert color="blue" variant="light">
                  You have not submitted any transfer requests yet.
                </Alert>
              ) : (
                <Table.ScrollContainer minWidth={860}>
                  <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Submitted</Table.Th>
                        <Table.Th>Institution</Table.Th>
                        <Table.Th>Course</Table.Th>
                        <Table.Th>Term</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {requests.map((request) => (
                        <Table.Tr
                          key={request.transferRequestId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            navigate(`/student/transfer-request/${request.transferRequestId}`);
                          }}
                        >
                          <Table.Td>{displayValue(request.submittedAt?.slice(0, 10))}</Table.Td>
                          <Table.Td>{displayValue(formatInstitution(request))}</Table.Td>
                          <Table.Td>{displayValue(formatCourse(request))}</Table.Td>
                          <Table.Td>{displayValue(request.primaryCourse?.externalTerm)}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{formatStatus(request.status)}</Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Grid.Col>
          </RecordPageSection>
        </Stack>
      </RecordPageShell>
    );
  }

  if (isDetailRequest) {
    const course = detailRequest?.primaryCourse;

    return (
      <RecordPageShell
        size="xl"
        eyebrow="Student Academics"
        title="Transfer request detail"
        description="Review the course and institution information submitted for Registrar review."
        badge={
          <Badge size="lg" variant="light" color="green">
            Student View
          </Badge>
        }
      >
        <Stack gap={0}>
          {isLoading ? (
            <Group p="xl" gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading transfer request.
              </Text>
            </Group>
          ) : loadError || !detailRequest ? (
            <Alert color="red" variant="light" mx="xl" mt="xl">
              {loadError || 'Transfer request was not found.'}
            </Alert>
          ) : (
            <>
              <RecordPageSection
                title="Request"
                description="Current transfer request status."
                action={
                  <Button
                    variant="default"
                    onClick={() => {
                      navigate('/student/transfer-request');
                    }}
                  >
                    Back to requests
                  </Button>
                }
              >
                <ReadOnlyField
                  label="Request ID"
                  value={displayValue(detailRequest.transferRequestId)}
                />
                <ReadOnlyField
                  label="Submitted"
                  value={displayValue(detailRequest.submittedAt?.slice(0, 10))}
                />
                <ReadOnlyField label="Status" value={formatStatus(detailRequest.status)} />
                <ReadOnlyField
                  label="Decision at"
                  value={displayValue(detailRequest.decidedAt)}
                />
              </RecordPageSection>

              <RecordPageSection
                title="Institution"
                description="Institution information submitted with the request."
              >
                <ReadOnlyField
                  label="Institution"
                  value={displayValue(detailRequest.institution.oneOffInstitutionName)}
                />
                <ReadOnlyField
                  label="Website"
                  value={displayValue(detailRequest.institution.oneOffInstitutionWebsite)}
                />
                <ReadOnlyField
                  label="Address line 1"
                  value={displayValue(detailRequest.institution.oneOffInstitutionAddressLine1)}
                  span={12}
                />
                <ReadOnlyField
                  label="Address line 2"
                  value={displayValue(detailRequest.institution.oneOffInstitutionAddressLine2)}
                  span={12}
                />
                <ReadOnlyField
                  label="City"
                  value={displayValue(detailRequest.institution.oneOffInstitutionCity)}
                />
                <ReadOnlyField
                  label="State / region"
                  value={displayValue(detailRequest.institution.oneOffInstitutionStateRegion)}
                />
                <ReadOnlyField
                  label="Postal code"
                  value={displayValue(detailRequest.institution.oneOffInstitutionPostalCode)}
                />
                <ReadOnlyField
                  label="Country"
                  value={displayValue(detailRequest.institution.oneOffInstitutionCountryCode)}
                />
              </RecordPageSection>

              <RecordPageSection
                title="Course details"
                description="Course information submitted for review."
              >
                <ReadOnlyField label="Term" value={displayValue(course?.externalTerm)} />
                <ReadOnlyField label="Course title" value={displayValue(course?.externalCourseTitle)} />
                <ReadOnlyField label="Subject code" value={displayValue(course?.externalSubjectCode)} />
                <ReadOnlyField label="Course number" value={displayValue(course?.externalCourseNumber)} />
                <ReadOnlyField label="Reason" value={displayValue(course?.reason)} />
                <ReadOnlyField
                  label="Credits from transferring school"
                  value={displayValue(course?.requestedCredits)}
                />
                <ReadOnlyField
                  label="MSMU Course Equivalent (if any)"
                  value={displayValue(course?.requestedLocalCourseEquivalent)}
                  span={12}
                />
              </RecordPageSection>
            </>
          )}
        </Stack>
      </RecordPageShell>
    );
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Student Academics"
      title="Transfer request"
      description="Submit a course for transfer credit review before you take it at another institution."
      badge={
        <Badge size="lg" variant="light" color="green">
          Student View
        </Badge>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={0}>
          <RecordPageSection
            title="Student responsibilities"
            description="Review these items before submitting your transfer request."
          >
            <Grid.Col span={12}>
              <List size="sm" spacing={6}>
                <List.Item>Discuss your plan with your advisor.</List.Item>
                <List.Item>
                  Check the transfer institution catalog and include a course description.
                </List.Item>
                <List.Item>
                  Request department chair review for major courses and core review when applicable.
                </List.Item>
                <List.Item>
                  Have an official transcript sent to the Registrar after the course is complete.
                </List.Item>
              </List>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Eligibility"
            description="Transfer credit is reviewed against current catalog policy and degree requirements."
          >
            <Grid.Col span={12}>
              <List size="sm" spacing={6}>
                <List.Item>A final grade of C- or better is required for transfer.</List.Item>
                <List.Item>
                  Courses generally cannot transfer back as MSMU pass or fail credit.
                </List.Item>
                <List.Item>
                  Major, minor, and core applicability may require additional academic approval.
                </List.Item>
                <List.Item>
                  Students with 75 or more total credits may be limited to four-year institutions.
                </List.Item>
              </List>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Student information"
            description="This information is pulled from your student profile."
          >
            {isLoading ? (
              <Grid.Col span={12}>
                <Group gap="sm">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">
                    Loading student information.
                  </Text>
                </Group>
              </Grid.Col>
            ) : loadError || !profile ? (
              <Grid.Col span={12}>
                <Alert color="red" variant="light">
                  {loadError || 'Student profile is unavailable.'}
                </Alert>
              </Grid.Col>
            ) : (
              <>
                <ReadOnlyField label="Student name" value={profileValue(profile.fullName)} />
                <ReadOnlyField label="Student ID" value={profileValue(profile.studentId)} />
                <ReadOnlyField label="Student email" value={profileValue(profile.email)} />
                <ReadOnlyField label="Class of" value={profileValue(profile.classOf)} />
                <ReadOnlyField
                  label="Address line 1"
                  value={profileValue(profile.addressLine1)}
                  span={12}
                />
                <ReadOnlyField
                  label="Address line 2"
                  value={profileValue(profile.addressLine2)}
                  span={12}
                />
                <ReadOnlyField label="City" value={profileValue(profile.city)} />
                <ReadOnlyField label="State / region" value={profileValue(profile.stateRegion)} />
                <ReadOnlyField
                  label="Postal code"
                  value={profileValue(profile.postalCode)}
                  span={{ base: 12, md: 4 }}
                />
                <ReadOnlyField
                  label="Country code"
                  value={profileValue(profile.countryCode)}
                  span={{ base: 12, md: 4 }}
                />
              </>
            )}
          </RecordPageSection>

          <RecordPageSection
            title="Course request"
            description="Submit the institution and course details for Registrar review."
          >
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="College or university transferring credit from"
                placeholder="Example: Westfarthing Community College"
                required
                {...form.getInputProps('oneOffInstitutionName')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Institution website"
                placeholder="https://example.edu"
                {...form.getInputProps('oneOffInstitutionWebsite')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Address line 1"
                placeholder="Street address"
                {...form.getInputProps('oneOffInstitutionAddressLine1')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Address line 2"
                placeholder="Suite, building, or campus"
                {...form.getInputProps('oneOffInstitutionAddressLine2')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="City"
                placeholder="City"
                {...form.getInputProps('oneOffInstitutionCity')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="State / region"
                placeholder="State"
                {...form.getInputProps('oneOffInstitutionStateRegion')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Postal code"
                placeholder="Postal code"
                {...form.getInputProps('oneOffInstitutionPostalCode')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Country code"
                placeholder="US"
                {...form.getInputProps('oneOffInstitutionCountryCode')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Term"
                placeholder="Select term"
                data={termOptions}
                required
                {...form.getInputProps('term')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Course title"
                placeholder="Example: World History"
                required
                {...form.getInputProps('externalCourseTitle')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Subject code"
                placeholder="Example: HIST"
                required
                {...form.getInputProps('externalSubjectCode')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Course number"
                placeholder="Example: 110"
                required
                {...form.getInputProps('externalCourseNumber')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Course description"
                placeholder="Paste the catalog description or a short summary for review."
                minRows={4}
                autosize
                {...form.getInputProps('catalogDescription')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Reason for request"
                placeholder="Select reason"
                data={reasonOptions}
                required
                {...form.getInputProps('reason')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Number of credits from transferring school"
                placeholder="Select credits"
                data={creditOptions}
                required
                {...form.getInputProps('externalCredits')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="MSMU Course Equivalent (if any)"
                placeholder="Search by course code"
                required
                {...form.getInputProps('requestedLocalCourseEquivalent')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Student notes"
                placeholder="Add anything the Registrar should know."
                minRows={3}
                autosize
                {...form.getInputProps('studentNotes')}
              />
            </Grid.Col>
          </RecordPageSection>

          {submitState.status === 'success' ? (
            <Alert color="green" variant="light" icon={<IconCheck size={18} />} mx="xl" mb="md">
              {submitState.message} Request #{submitState.requestId} is now submitted.
            </Alert>
          ) : null}

          {submitState.status === 'error' ? (
            <Alert color="red" variant="light" mx="xl" mb="md">
              {submitState.message}
            </Alert>
          ) : null}

          <Group justify="flex-end" p="xl" pt="md">
            <Button
              type="submit"
              leftSection={<IconSend size={18} />}
              loading={submitState.status === 'submitting'}
            >
              Submit request
            </Button>
          </Group>
        </Stack>
      </form>
    </RecordPageShell>
  );
}
