import { useEffect, useState } from 'react';
import { Alert, Badge, Grid, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  StudentApprovedTransferRequestCourseResponse,
  StudentApprovedTransferRequestOutcomeResponse,
  StudentApprovedTransferRequestResponse,
} from '@/services/schemas/transfer-request-schemas';
import { listStudentApprovedTransferRequests } from '@/services/transfer-request-service';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';

function formatStatusText(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCourse(course: StudentApprovedTransferRequestCourseResponse) {
  return [course.externalSubjectCode, course.externalCourseNumber, course.externalCourseTitle]
    .filter(Boolean)
    .join(' ');
}

function outcomeCreditLabel(outcome: StudentApprovedTransferRequestOutcomeResponse) {
  if (outcome.outcomeType === 'REQUIREMENT_WAIVER') {
    return 'No credit awarded';
  }

  return displayValue(outcome.acceptedCredits);
}

function CourseDetailsSection({
  course,
  request,
}: {
  course: StudentApprovedTransferRequestCourseResponse;
  request: StudentApprovedTransferRequestResponse;
}) {
  return (
    <RecordPageSection
      title="Course Details"
      description="Final transfer course information approved by the Registrar."
    >
      <ReadOnlyField label="External course" value={displayValue(formatCourse(course))} />
      <ReadOnlyField label="Institution" value={displayValue(request.institutionName)} />
      <ReadOnlyField label="Term" value={displayValue(course.externalTerm)} />
      <ReadOnlyField label="Grade" value={displayValue(course.grade)} />
      <ReadOnlyField label="Requested credits" value={displayValue(course.requestedCredits)} />
      <ReadOnlyField label="Accepted credits" value={displayValue(course.acceptedCredits)} />
      <ReadOnlyField label="Reason" value={displayValue(course.reason)} />
      <ReadOnlyField label="Approved" value={displayValue(request.approvedAt)} />
      <Grid.Col span={12}>
        <Stack gap={4}>
          <Text size="xs" fw={700} c="dimmed">
            Course description
          </Text>
          <Text size="sm">{displayValue(course.externalCourseDescription)}</Text>
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}

function SubstitutionsSection({
  course,
}: {
  course: StudentApprovedTransferRequestCourseResponse;
}) {
  return (
    <RecordPageSection
      title="Substitutions"
      description="Approved transfer outcomes for this course."
    >
      <Grid.Col span={12}>
        <Table.ScrollContainer minWidth={760}>
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>External Course</Table.Th>
                <Table.Th>MSMU Course / Credit</Table.Th>
                <Table.Th>Requirement</Table.Th>
                <Table.Th>Credits</Table.Th>
                <Table.Th>Outcome</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {course.outcomes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      No substitutions or waivers were recorded for this approved course.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                course.outcomes.map((outcome) => (
                  <Table.Tr key={outcome.transferRequestOutcomeId}>
                    <Table.Td>{formatCourse(course)}</Table.Td>
                    <Table.Td>
                      {outcome.localCourseCode ??
                        (outcome.outcomeType === 'REQUIREMENT_WAIVER'
                          ? 'No course credit awarded'
                          : 'Transfer credit')}
                    </Table.Td>
                    <Table.Td>
                      {[outcome.requirementCode, outcome.requirementName].filter(Boolean).join(' ')}
                    </Table.Td>
                    <Table.Td>{outcomeCreditLabel(outcome)}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">{formatStatusText(outcome.outcomeType)}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>
    </RecordPageSection>
  );
}

export function StudentApprovedTransferRequestsPage() {
  const [requests, setRequests] = useState<StudentApprovedTransferRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const abortController = new AbortController();

    async function loadApprovedRequests() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await listStudentApprovedTransferRequests({
          signal: abortController.signal,
        });
        setRequests(response.requests);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setLoadError(getErrorMessage(error, 'Failed to load approved transfer requests.'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadApprovedRequests();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Student Academics"
      title="Approved transfer requests"
      description="Review approved transfer courses, substitutions, and requirement waivers."
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
              Loading approved transfer requests.
            </Text>
          </Group>
        ) : null}

        {loadError ? (
          <Alert color="red" variant="light" mx="xl" mt="xl">
            {loadError}
          </Alert>
        ) : null}

        {!isLoading && !loadError && requests.length === 0 ? (
          <Alert color="blue" variant="light" mx="xl" mt="xl">
            You do not have approved transfer requests yet.
          </Alert>
        ) : null}

        {!isLoading && !loadError
          ? requests.flatMap((request) =>
              request.courses.map((course) => (
                <Stack
                  key={`${request.transferRequestId}-${course.transferRequestCourseId}`}
                  gap={0}
                >
                  <CourseDetailsSection request={request} course={course} />
                  <SubstitutionsSection course={course} />
                </Stack>
              ))
            )
          : null}
      </Stack>
    </RecordPageShell>
  );
}
