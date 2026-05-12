import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Group, Paper, Select, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCalendarOff, IconChecklist, IconHistory } from '@tabler/icons-react';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { StudentCourseRegistrationWindow } from '@/components/student-registration/StudentCourseRegistrationWindow';
import {
  addSelection,
  acceptWaitlistOffer,
  getMyCourseRegistration,
  getMyCourseRegistrationGroups,
  removeEnrollment,
  removeSelection,
  searchCourseSections,
  StudentCourseRegistrationScheduleConflictError,
  submitRegistration,
  type SearchCourseSectionsRequest,
} from '@/services/student-course-registration-service';
import type {
  StudentCourseRegistrationGroupChoicesResponse,
  StudentCourseRegistrationResponse,
  StudentCourseRegistrationSubmitResponse,
  StudentCourseSectionSearchResponse,
} from '@/services/schemas/student-course-registration-schemas';

type PageState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { message: string; status: 'error' }
  | { registration: StudentCourseRegistrationResponse; status: 'loaded' };

type ActionState =
  | { status: 'idle' | 'loading' | 'submitting' }
  | { message: string; status: 'error' };

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function displayText(value: string | null | undefined, fallback = '—') {
  return value?.trim() || fallback;
}

function getGroupSelectLabel(
  group: StudentCourseRegistrationGroupChoicesResponse['groups'][number]
) {
  const term = displayText(group.termName ?? group.termCode, 'Term');
  const year = displayText(group.academicYearName ?? group.academicYearCode, 'Academic year');
  const status = displayText(group.statusName ?? group.statusCode, 'Status');

  return `${term} · ${year} · ${status}`;
}

function getGroupStatusColor(statusCode: string | null | undefined) {
  switch (statusCode?.trim().toUpperCase()) {
    case 'PUBLISHED':
      return 'green';
    case 'CLOSED':
      return 'gray';
    default:
      return 'blue';
  }
}

function hasActiveRegistrationWindow(groups: StudentCourseRegistrationGroupChoicesResponse | null) {
  return groups?.groups.some((group) => group.registrationWindowOpen) ?? false;
}

function RegistrationTermSelect({
  groups,
  selectedRegistrationGroupId,
  onChange,
}: {
  groups: StudentCourseRegistrationGroupChoicesResponse | null;
  selectedRegistrationGroupId: number | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <Group justify="flex-start" px="1.6rem" pt="1.4rem" pb="sm">
      <Select
        label="Registration term"
        data={(groups?.groups ?? [])
          .filter((group) => group.registrationGroupId !== null)
          .map((group) => ({
            label: getGroupSelectLabel(group),
            value: String(group.registrationGroupId),
          }))}
        value={selectedRegistrationGroupId === null ? null : String(selectedRegistrationGroupId)}
        w={{ base: '100%', sm: 420 }}
        allowDeselect={false}
        disabled={(groups?.groups.length ?? 0) === 0}
        placeholder="Select a term"
        onChange={onChange}
      />
    </Group>
  );
}

function NoActiveRegistrationLanding({
  groups,
  studentDisplayName,
}: {
  groups: StudentCourseRegistrationGroupChoicesResponse | null;
  studentDisplayName?: string | null;
}) {
  const closedGroups = groups?.groups.filter((group) => group.statusCode === 'CLOSED') ?? [];
  const hasClosedGroups = closedGroups.length > 0;

  return (
    <Paper withBorder p="lg" radius="sm">
      <Stack gap="md">
        <Group align="flex-start" gap="md">
          <ThemeIcon variant="light" color="blue" size="xl">
            <IconCalendarOff size={24} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text className="portal-ui-eyebrow-text">
              {studentDisplayName ? displayText(studentDisplayName) : 'Student registration'}
            </Text>
            <Title order={2}>No active registration window</Title>
            <Text c="dimmed" maw={760}>
              You do not currently have an open registration window. When a registration group is
              published and your window opens, course search and registration actions will be
              available here.
            </Text>
          </Stack>
        </Group>

        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon variant="light" color="green" size="sm">
              <IconChecklist size={14} />
            </ThemeIcon>
            <Text size="sm">
              Check back after your registration window opens, or contact the Registrar if you
              expected current registration access.
            </Text>
          </Group>
          {hasClosedGroups ? (
            <Group gap="xs">
              <ThemeIcon variant="light" color="gray" size="sm">
                <IconHistory size={14} />
              </ThemeIcon>
              <Text size="sm">
                Closed registration terms remain available below for schedule review.
              </Text>
            </Group>
          ) : null}
        </Stack>

        {hasClosedGroups ? (
          <Group gap="xs">
            {closedGroups.slice(0, 4).map((group) => (
              <Badge
                key={group.registrationGroupId ?? group.registrationGroupName}
                color={getGroupStatusColor(group.statusCode)}
                variant="light"
              >
                {displayText(group.termName ?? group.termCode, 'Closed term')}
              </Badge>
            ))}
          </Group>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function StudentCourseRegistrationPage() {
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [actionState, setActionState] = useState<ActionState>({ status: 'idle' });
  const [registrationGroups, setRegistrationGroups] =
    useState<StudentCourseRegistrationGroupChoicesResponse | null>(null);
  const [selectedRegistrationGroupId, setSelectedRegistrationGroupId] = useState<number | null>(
    null
  );
  const [submitResult, setSubmitResult] = useState<StudentCourseRegistrationSubmitResponse | null>(
    null
  );

  useEffect(() => {
    const controller = new AbortController();
    setPageState({ status: 'loading' });

    void getMyCourseRegistrationGroups({ signal: controller.signal })
      .then(async (groups) => {
        const nextSelectedRegistrationGroupId = groups.selectedRegistrationGroupId;
        setRegistrationGroups(groups);
        setSelectedRegistrationGroupId(nextSelectedRegistrationGroupId);

        if (nextSelectedRegistrationGroupId === null) {
          setPageState({ status: 'empty' });
          return;
        }

        const registration = await getMyCourseRegistration({
          registrationGroupId: nextSelectedRegistrationGroupId,
          signal: controller.signal,
        });

        setPageState({ registration, status: 'loaded' });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        setPageState({
          message: getErrorMessage(error, 'Failed to load course registration.'),
          status: 'error',
        });
      });

    return () => controller.abort();
  }, []);

  const handleRegistrationGroupChange = useCallback(async (value: string | null) => {
    const nextRegistrationGroupId = value === null ? null : Number(value);

    if (!Number.isFinite(nextRegistrationGroupId)) {
      return;
    }

    setSelectedRegistrationGroupId(nextRegistrationGroupId);
    setActionState({ status: 'idle' });
    setSubmitResult(null);

    try {
      const registration = await getMyCourseRegistration({
        registrationGroupId: nextRegistrationGroupId,
      });

      setPageState({ registration, status: 'loaded' });
    } catch (error: unknown) {
      setPageState({
        message: getErrorMessage(error, 'Failed to load selected registration.'),
        status: 'error',
      });
    }
  }, []);

  const handleSearchCourseSections = useCallback(
    (request: SearchCourseSectionsRequest): Promise<StudentCourseSectionSearchResponse> =>
      searchCourseSections(request),
    []
  );

  const handleAddCourse = useCallback(
    async (sectionId: number) => {
      setActionState({ status: 'loading' });

      try {
        const registration = await addSelection({
          registrationGroupId: selectedRegistrationGroupId,
          request: { sectionId },
        });
        setPageState({ registration, status: 'loaded' });
        setSubmitResult(null);
        setActionState({ status: 'idle' });
      } catch (error: unknown) {
        if (error instanceof StudentCourseRegistrationScheduleConflictError) {
          setActionState({ status: 'idle' });
          throw error;
        }

        const message = getErrorMessage(error, 'Failed to add course selection.');
        setActionState({ message, status: 'error' });
        throw error;
      }
    },
    [selectedRegistrationGroupId]
  );

  const handleRemoveCourse = useCallback(
    async (selectionId: number) => {
      setActionState({ status: 'loading' });

      try {
        const registration = await removeSelection({
          registrationGroupId: selectedRegistrationGroupId,
          selectionId,
        });
        setPageState({ registration, status: 'loaded' });
        setSubmitResult(null);
        setActionState({ status: 'idle' });
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to remove course selection.');
        setActionState({ message, status: 'error' });
        throw error;
      }
    },
    [selectedRegistrationGroupId]
  );

  const handleRemoveEnrollment = useCallback(
    async (enrollmentId: number) => {
      setActionState({ status: 'loading' });

      try {
        const registration = await removeEnrollment({
          enrollmentId,
          registrationGroupId: selectedRegistrationGroupId,
        });
        setPageState({ registration, status: 'loaded' });
        setSubmitResult(null);
        setActionState({ status: 'idle' });
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to drop course enrollment.');
        setActionState({ message, status: 'error' });
        throw error;
      }
    },
    [selectedRegistrationGroupId]
  );

  const handleSubmitRegistration = useCallback(async () => {
    setActionState({ status: 'submitting' });

    try {
      const result = await submitRegistration({
        registrationGroupId: selectedRegistrationGroupId,
      });
      setPageState({ registration: result.registrationPage, status: 'loaded' });
      setSubmitResult(result);
      setActionState({ status: 'idle' });
    } catch (error: unknown) {
      setActionState({
        message: getErrorMessage(error, 'Failed to submit course registration.'),
        status: 'error',
      });
    }
  }, [selectedRegistrationGroupId]);

  return (
    <RecordPageShell
      eyebrow="Student Registration"
      title="Course Registration"
      description="Review your assigned registration window before building a schedule."
      badge={
        <Badge variant="light" color="blue" size="lg">
          Student View
        </Badge>
      }
      size="xl"
    >
      <Stack gap="lg">
        {pageState.status === 'loading' ? (
          <Alert color="blue" title="Loading registration">
            Loading your registration window and course selections.
          </Alert>
        ) : null}

        {pageState.status === 'error' ? (
          <Alert color="red" title="Unable to load registration">
            {pageState.message}
          </Alert>
        ) : null}

        {pageState.status === 'empty' ? (
          <NoActiveRegistrationLanding groups={registrationGroups} />
        ) : null}

        {pageState.status === 'loaded' ? (
          <>
            <RegistrationTermSelect
              groups={registrationGroups}
              selectedRegistrationGroupId={selectedRegistrationGroupId}
              onChange={handleRegistrationGroupChange}
            />
            {!hasActiveRegistrationWindow(registrationGroups) ? (
              <NoActiveRegistrationLanding
                groups={registrationGroups}
                studentDisplayName={pageState.registration.studentDisplayName}
              />
            ) : null}
            <StudentCourseRegistrationWindow
              actionError={actionState.status === 'error' ? actionState.message : null}
              isMutatingSelection={actionState.status === 'loading'}
              isSubmitting={actionState.status === 'submitting'}
              registration={pageState.registration}
              submitResult={submitResult}
              onAddCourse={handleAddCourse}
              onAcceptWaitlistOffer={async ({ enrollmentId, waitlistOfferId }) => {
                setActionState({ status: 'submitting' });

                try {
                  const registration = await acceptWaitlistOffer({ enrollmentId, waitlistOfferId });
                  setPageState({ registration, status: 'loaded' });
                  setSubmitResult(null);
                  setActionState({ status: 'idle' });
                } catch (error: unknown) {
                  setActionState({
                    message: getErrorMessage(error, 'Failed to enroll from waitlist.'),
                    status: 'error',
                  });
                  throw error;
                }
              }}
              onRegister={handleSubmitRegistration}
              onRemoveCourse={handleRemoveCourse}
              onRemoveEnrollment={handleRemoveEnrollment}
              onSearchCourseSections={handleSearchCourseSections}
            />
          </>
        ) : null}
      </Stack>
    </RecordPageShell>
  );
}
