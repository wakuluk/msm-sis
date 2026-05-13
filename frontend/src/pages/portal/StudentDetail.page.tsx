import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import createClasses from '@/components/create/RecordPageLayout.module.css';
import { StudentAffiliationsPanel } from '@/components/student-affiliations/StudentAffiliationsPanel';
import {
  StudentSchedulePanel,
  type LoadStudentScheduleRequest,
} from '@/components/student-schedule/StudentSchedulePanel';
import { StudentDetailOverviewSections } from '@/components/student/StudentDetailOverviewSections';
import { StudentTranscriptView } from '@/components/student/StudentTranscriptView';
import { useStudentReferenceOptions } from '@/components/student/useStudentReferenceOptions';
import { hasAnyPortalRole, PORTAL_ROLES, type PortalRole } from '@/portal/PortalRoles';
import {
  buildPatchStudentRequest,
  hasStudentDetailChanges,
  mapStudentDetailToFormValues,
} from '@/services/mappers/student-mappers';
import {
  initialStudentDetailFormValues,
  type StudentDetailFormValues,
  type StudentDetailResponse,
  type StudentTranscriptResponse,
} from '@/services/schemas/student-schemas';
import {
  createStudentAcademicCareer,
  getAcademicCareerOptions,
  getStudentAcademicCareers,
  updateStudentAcademicCareer,
} from '@/services/student-academic-career-service';
import { getStudentSchedule } from '@/services/student-schedule-service';
import { getStudentById, getStudentTranscriptById, patchStudent } from '@/services/student-service';
import type {
  AcademicCareerOptionResponse,
  StudentAcademicCareerResponse,
  StudentAcademicCareerStatus,
} from '@/services/schemas/student-academic-career-schemas';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';
import classes from './StudentDetail.module.css';

type StudentDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; detail: StudentDetailResponse };

type StudentDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type StudentTranscriptTabState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; transcript: StudentTranscriptResponse };

type StudentDetailTabKey =
  | 'overview'
  | 'transcript'
  | 'schedule'
  | 'academic-career'
  | 'affiliations'
  | 'billing'
  | 'medical';

type StudentDetailTabConfig = {
  key: StudentDetailTabKey;
  label: string;
  requiredRoles?: readonly PortalRole[];
};

type PlaceholderTabPanelProps = {
  accessLabel: string;
  description: string;
  title: string;
};

const studentDetailTabs: StudentDetailTabConfig[] = [
  {
    key: 'overview',
    label: 'Overview',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'transcript',
    label: 'Transcript',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'schedule',
    label: 'Schedule',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'academic-career',
    label: 'Academic Career',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'affiliations',
    label: 'Affiliations',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'billing',
    label: 'Billing',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
  {
    key: 'medical',
    label: 'Medical',
    requiredRoles: [PORTAL_ROLES.ADMIN],
  },
];

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

function PlaceholderTabPanel({ accessLabel, description, title }: PlaceholderTabPanelProps) {
  return (
    <div className={classes.placeholderPanel}>
      <div className={classes.placeholderContent}>
        <Stack gap="sm">
          <Group gap="sm" wrap="wrap">
            <Badge variant="light">Coming soon</Badge>
            <Text className="portal-ui-eyebrow-text">{accessLabel}</Text>
          </Group>
          <Title order={3} className={classes.placeholderTitle}>
            {title}
          </Title>
          <Text className={classes.placeholderText}>{description}</Text>
        </Stack>
      </div>
    </div>
  );
}

type StudentAcademicCareerDraft = {
  academicCareerId: string | null;
  effectiveEndDate: string;
  effectiveStartDate: string;
  entryReason: string;
  notes: string;
  primaryCareer: boolean;
  status: StudentAcademicCareerStatus;
  studentAcademicCareerId: number | null;
};

type StudentAcademicCareerModalState =
  | { mode: 'add'; draft: StudentAcademicCareerDraft }
  | { mode: 'edit'; draft: StudentAcademicCareerDraft }
  | null;

type StudentAcademicCareerLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      careers: StudentAcademicCareerResponse[];
      options: AcademicCareerOptionResponse[];
    };

type StudentAcademicCareerSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const academicCareerStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INTENT_TO_GRADUATE', label: 'Intent to graduate' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'LEAVE_OF_ABSENCE', label: 'Leave of absence' },
];

const registrationEligibleAcademicCareerStatuses = new Set<StudentAcademicCareerStatus>([
  'ACTIVE',
  'INTENT_TO_GRADUATE',
]);

function createBlankAcademicCareerDraft(): StudentAcademicCareerDraft {
  return {
    academicCareerId: null,
    effectiveStartDate: '',
    effectiveEndDate: '',
    entryReason: '',
    notes: '',
    primaryCareer: false,
    status: 'ACTIVE',
    studentAcademicCareerId: null,
  };
}

function mapAcademicCareerToDraft(
  academicCareer: StudentAcademicCareerResponse
): StudentAcademicCareerDraft {
  return {
    academicCareerId:
      academicCareer.academicCareerId === null ? null : String(academicCareer.academicCareerId),
    effectiveStartDate: academicCareer.effectiveStartDate ?? '',
    effectiveEndDate: academicCareer.effectiveEndDate ?? '',
    entryReason: academicCareer.entryReason ?? '',
    notes: academicCareer.notes ?? '',
    primaryCareer: academicCareer.primaryCareer,
    status: academicCareer.status,
    studentAcademicCareerId: academicCareer.studentAcademicCareerId,
  };
}

function formatAcademicCareerName(
  academicCareerId: string | null,
  options: AcademicCareerOptionResponse[]
): string {
  if (!academicCareerId) {
    return 'Select academic career';
  }

  const option = options.find(
    (careerOption) => String(careerOption.academicCareerId) === academicCareerId
  );
  return option?.name ?? 'Unknown academic career';
}

function formatAcademicCareerStatus(value: StudentAcademicCareerStatus): string {
  return academicCareerStatusOptions.find((option) => option.value === value)?.label ?? value;
}

function getCareerStatusColor(status: StudentAcademicCareerStatus) {
  if (status === 'ACTIVE') {
    return 'green';
  }

  if (status === 'INTENT_TO_GRADUATE') {
    return 'blue';
  }

  if (status === 'GRADUATED') {
    return 'gray';
  }

  if (status === 'WITHDRAWN' || status === 'DISMISSED') {
    return 'red';
  }

  if (status === 'LEAVE_OF_ABSENCE') {
    return 'yellow';
  }

  return 'gray';
}

function formatRegistrationDivisionSummary(registrationDivisions: Array<{ name: string }>): string {
  if (registrationDivisions.length === 0) {
    return 'No registration divisions configured';
  }

  return registrationDivisions.map((division) => division.name).join(', ');
}

function getRegistrationEligibleAcademicCareers(careers: StudentAcademicCareerResponse[]) {
  return careers.filter(
    (career) =>
      registrationEligibleAcademicCareerStatuses.has(career.status) && !career.effectiveEndDate
  );
}

function getAllowedRegistrationDivisions(careers: StudentAcademicCareerResponse[]) {
  const divisionsByCode = new Map<string, { code: string; name: string }>();

  getRegistrationEligibleAcademicCareers(careers).forEach((career) => {
    career.registrationDivisions.forEach((division) => {
      divisionsByCode.set(division.code, {
        code: division.code,
        name: division.name,
      });
    });
  });

  return Array.from(divisionsByCode.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

function getDraftRegistrationDivisions(
  draft: StudentAcademicCareerDraft,
  options: AcademicCareerOptionResponse[]
) {
  if (!draft.academicCareerId) {
    return [];
  }

  return (
    options.find((careerOption) => String(careerOption.academicCareerId) === draft.academicCareerId)
      ?.registrationDivisions ?? []
  );
}

function StudentAcademicCareerPanel({
  studentId,
  studentName,
}: {
  studentId: number;
  studentName: string | null;
}) {
  const [careerState, setCareerState] = useState<StudentAcademicCareerLoadState>({
    status: 'loading',
  });
  const [modalState, setModalState] = useState<StudentAcademicCareerModalState>(null);
  const [saveState, setSaveState] = useState<StudentAcademicCareerSaveState>({ status: 'idle' });

  const loadAcademicCareerData = useCallback(
    async (signal?: AbortSignal) => {
      setCareerState({ status: 'loading' });

      try {
        const [careers, options] = await Promise.all([
          getStudentAcademicCareers(studentId, signal),
          getAcademicCareerOptions(signal),
        ]);

        setCareerState({ status: 'success', careers, options });
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        setCareerState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic career data.'),
        });
      }
    },
    [studentId]
  );

  useEffect(() => {
    const abortController = new AbortController();
    void loadAcademicCareerData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadAcademicCareerData]);

  function updateModalDraft(updates: Partial<StudentAcademicCareerDraft>) {
    setModalState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          ...updates,
        },
      };
    });
    setSaveState({ status: 'idle' });
  }

  async function handleSaveModalDraft() {
    if (!modalState || careerState.status !== 'success' || saveState.status === 'saving') {
      return;
    }

    const nextDraft = modalState.draft;
    const academicCareerId = nextDraft.academicCareerId ? Number(nextDraft.academicCareerId) : null;

    if (!academicCareerId) {
      setSaveState({ status: 'error', message: 'Academic career is required.' });
      return;
    }

    if (!nextDraft.effectiveStartDate) {
      setSaveState({ status: 'error', message: 'Effective start date is required.' });
      return;
    }

    try {
      setSaveState({ status: 'saving' });

      if (modalState.mode === 'add') {
        await createStudentAcademicCareer(studentId, {
          academicCareerId,
          status: nextDraft.status,
          effectiveStartDate: nextDraft.effectiveStartDate,
          effectiveEndDate: nextDraft.effectiveEndDate || null,
          primaryCareer: nextDraft.primaryCareer,
          entryReason: nextDraft.entryReason || null,
          notes: nextDraft.notes || null,
        });
      } else {
        if (!nextDraft.studentAcademicCareerId) {
          setSaveState({ status: 'error', message: 'Academic career row is missing an id.' });
          return;
        }

        await updateStudentAcademicCareer(studentId, nextDraft.studentAcademicCareerId, {
          academicCareerId,
          status: nextDraft.status,
          effectiveStartDate: nextDraft.effectiveStartDate,
          effectiveEndDate: nextDraft.effectiveEndDate || null,
          primaryCareer: nextDraft.primaryCareer,
          entryReason: nextDraft.entryReason || null,
          notes: nextDraft.notes || null,
        });
      }

      const [careers, options] = await Promise.all([
        getStudentAcademicCareers(studentId),
        getAcademicCareerOptions(),
      ]);

      setCareerState({ status: 'success', careers, options });
      setModalState(null);
      setSaveState({
        status: 'success',
        message:
          modalState.mode === 'add' ? 'Academic career added.' : 'Academic career changes saved.',
      });
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic career.'),
      });
    }
  }

  const activeDraft = modalState?.draft ?? null;
  const options = careerState.status === 'success' ? careerState.options : [];
  const activeDraftRegistrationDivisions = activeDraft
    ? getDraftRegistrationDivisions(activeDraft, options)
    : [];
  const eligibleCareers =
    careerState.status === 'success'
      ? getRegistrationEligibleAcademicCareers(careerState.careers)
      : [];
  const allowedRegistrationDivisions =
    careerState.status === 'success'
      ? getAllowedRegistrationDivisions(careerState.careers)
      : [];
  const careerOptions = options.map((option) => ({
    value: String(option.academicCareerId),
    label: option.name,
  }));
  const isSavingAcademicCareer = saveState.status === 'saving';

  function openAddModal() {
    const blankDraft = createBlankAcademicCareerDraft();
    setModalState({
      mode: 'add',
      draft: {
        ...blankDraft,
        academicCareerId: careerOptions[0]?.value ?? null,
      },
    });
    setSaveState({ status: 'idle' });
  }

  function openEditModal(academicCareer: StudentAcademicCareerResponse) {
    setModalState({ mode: 'edit', draft: mapAcademicCareerToDraft(academicCareer) });
    setSaveState({ status: 'idle' });
  }

  function renderCareerRows() {
    if (careerState.status === 'loading') {
      return (
        <Table.Tr>
          <Table.Td colSpan={5}>
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading academic careers.
              </Text>
            </Group>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (careerState.status === 'error') {
      return (
        <Table.Tr>
          <Table.Td colSpan={5}>
            <Alert color="red" title="Unable to load academic careers">
              {careerState.message}
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (careerState.careers.length === 0) {
      return (
        <Table.Tr>
          <Table.Td colSpan={5}>
            <Text size="sm" c="dimmed">
              No academic careers have been added for this student yet.
            </Text>
          </Table.Td>
        </Table.Tr>
      );
    }

    return careerState.careers.map((row) => (
      <Table.Tr
        key={row.studentAcademicCareerId}
        className={classes.academicCareerRow}
        role="button"
        tabIndex={0}
        onClick={() => {
          openEditModal(row);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openEditModal(row);
          }
        }}
      >
        <Table.Td>
          <Text fw={600}>{displayValue(row.academicCareerName)}</Text>
          <Text size="sm" c="dimmed">
            {row.entryReason || 'No entry reason recorded'}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge color={getCareerStatusColor(row.status)} variant="light">
            {formatAcademicCareerStatus(row.status)}
          </Badge>
        </Table.Td>
        <Table.Td>
          {row.effectiveStartDate || 'No start date'} - {row.effectiveEndDate || 'Present'}
        </Table.Td>
        <Table.Td>{row.primaryCareer ? 'Yes' : 'No'}</Table.Td>
        <Table.Td>{formatRegistrationDivisionSummary(row.registrationDivisions)}</Table.Td>
      </Table.Tr>
    ));
  }

  return (
    <Stack gap={0}>
      <Modal
        opened={modalState !== null}
        onClose={() => {
          setModalState(null);
        }}
        title={modalState?.mode === 'add' ? 'Add Academic Career' : 'Edit Academic Career'}
        size="lg"
      >
        {activeDraft ? (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Career type"
                data={careerOptions}
                value={activeDraft.academicCareerId}
                onChange={(value) => {
                  updateModalDraft({ academicCareerId: value });
                }}
              />
              <Select
                label="Status"
                data={academicCareerStatusOptions}
                value={activeDraft.status}
                onChange={(value) => {
                  if (value) {
                    updateModalDraft({
                      status: value as StudentAcademicCareerDraft['status'],
                    });
                  }
                }}
              />
              <TextInput
                label="Effective start date"
                type="date"
                value={activeDraft.effectiveStartDate}
                onChange={(event) => {
                  updateModalDraft({ effectiveStartDate: event.currentTarget.value });
                }}
              />
              <TextInput
                label="Effective end date"
                type="date"
                value={activeDraft.effectiveEndDate}
                onChange={(event) => {
                  updateModalDraft({ effectiveEndDate: event.currentTarget.value });
                }}
              />
            </SimpleGrid>

            <Checkbox
              label="Primary academic career"
              checked={activeDraft.primaryCareer}
              onChange={(event) => {
                updateModalDraft({ primaryCareer: event.currentTarget.checked });
              }}
            />

            <TextInput
              label="Entry reason"
              value={activeDraft.entryReason}
              onChange={(event) => {
                updateModalDraft({ entryReason: event.currentTarget.value });
              }}
            />
            <Textarea
              label="Notes"
              minRows={3}
              value={activeDraft.notes}
              onChange={(event) => {
                updateModalDraft({ notes: event.currentTarget.value });
              }}
            />

            <div className={classes.academicCareerPreview}>
              <Text fw={600}>Registration access preview</Text>
              <Text size="sm" c="dimmed">
                {formatAcademicCareerName(activeDraft.academicCareerId, options)} allows{' '}
                {formatRegistrationDivisionSummary(activeDraftRegistrationDivisions).toLowerCase()}.
              </Text>
            </div>

            {saveState.status === 'error' ? (
              <Alert color="red" title="Unable to save academic career">
                {saveState.message}
              </Alert>
            ) : null}

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                disabled={isSavingAcademicCareer}
                onClick={() => {
                  setModalState(null);
                  setSaveState({ status: 'idle' });
                }}
              >
                Cancel
              </Button>
              <Button loading={isSavingAcademicCareer} onClick={handleSaveModalDraft}>
                {modalState?.mode === 'add' ? 'Add career' : 'Save changes'}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <div className={createClasses.section}>
        <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Admin only</Text>
            <Title order={3} className={classes.sectionTitle}>
              Academic Career
            </Title>
            <Text c="dimmed" maw="44rem">
              Track the student&apos;s active academic career history and preview which course
              divisions their career should allow during registration.
            </Text>
          </Stack>
          <Badge variant="light">Admin managed</Badge>
        </Group>
      </div>

      <div className={createClasses.section}>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Stack gap={4}>
              <Title order={4} className={classes.academicCareerSubheading}>
                Career history for {displayValue(studentName)}
              </Title>
              <Text size="sm" c="dimmed">
                Click a row to edit it. Registration access preview is display-only.
              </Text>
            </Stack>
            <Button
              variant="light"
              disabled={careerState.status !== 'success' || careerOptions.length === 0}
              onClick={() => {
                openAddModal();
              }}
            >
              Add academic career
            </Button>
          </Group>

          {careerState.status === 'success' ? (
            <div className={classes.academicCareerAccessPreview}>
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                <Stack gap={4}>
                  <Text fw={600}>Registration access preview</Text>
                  <Text size="sm" c="dimmed">
                    Based on eligible active academic careers. Multiple eligible careers combine
                    their allowed course divisions.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Eligible careers:{' '}
                    {eligibleCareers.length === 0
                      ? 'None'
                      : eligibleCareers
                          .map((career) => displayValue(career.academicCareerName))
                          .join(', ')}
                  </Text>
                </Stack>
                <Group gap="xs" wrap="wrap">
                  {allowedRegistrationDivisions.length === 0 ? (
                    <Badge color="gray" variant="light">
                      No registration access
                    </Badge>
                  ) : (
                    allowedRegistrationDivisions.map((division) => (
                      <Badge key={division.code} color="blue" variant="light">
                        {division.name}
                      </Badge>
                    ))
                  )}
                </Group>
              </Group>
            </div>
          ) : null}

          <Table.ScrollContainer minWidth={760}>
            <Table withTableBorder withColumnBorders horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Career</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Effective dates</Table.Th>
                  <Table.Th>Primary</Table.Th>
                  <Table.Th>Registration divisions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderCareerRows()}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Text size="sm" c={saveState.status === 'success' ? 'green' : 'dimmed'}>
            {saveState.status === 'success'
              ? saveState.message
              : 'Academic career changes are saved to the student record.'}
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}

function StudentDetailTranscriptPanel({ studentId }: { studentId: number }) {
  const [transcriptState, setTranscriptState] = useState<StudentTranscriptTabState>({
    status: 'loading',
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function loadTranscript() {
      setTranscriptState({ status: 'loading' });

      try {
        const transcript = await getStudentTranscriptById(studentId, abortController.signal);
        setTranscriptState({ status: 'success', transcript });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setTranscriptState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load student transcript.'),
        });
      }
    }

    void loadTranscript();

    return () => {
      abortController.abort();
    };
  }, [studentId]);

  if (transcriptState.status === 'loading') {
    return (
      <div className={createClasses.section}>
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading transcript data.
          </Text>
        </Group>
      </div>
    );
  }

  if (transcriptState.status === 'error') {
    return (
      <div className={createClasses.section}>
        <Alert color="red" title="Unable to load transcript">
          {transcriptState.message}
        </Alert>
      </div>
    );
  }

  return <StudentTranscriptView transcript={transcriptState.transcript} />;
}

function StudentDetailSchedulePanel({ studentId }: { studentId: number }) {
  const loadSchedule = useCallback(
    (request?: LoadStudentScheduleRequest) =>
      getStudentSchedule({
        studentId,
        signal: request?.signal,
        termId: request?.termId,
      }),
    [studentId]
  );

  return (
    <StudentSchedulePanel
      loadSchedule={loadSchedule}
      loadingMessage="Loading student course schedule."
      emptyActivityMessage="No local enrollment activity is available for this student's schedule yet."
    />
  );
}

export function StudentDetailPage() {
  const { studentId: studentIdParam } = useParams();
  const navigate = useNavigate();
  const tokenData = useAccessTokenData();
  const canEditStudentDetail = hasAnyPortalRole(tokenData?.roles, [PORTAL_ROLES.ADMIN]);
  const [activeTab, setActiveTab] = useState<StudentDetailTabKey>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [pageState, setPageState] = useState<StudentDetailPageState>({ status: 'loading' });
  const [saveState, setSaveState] = useState<StudentDetailSaveState>({ status: 'idle' });
  const {
    classStandingOptions,
    ethnicityOptions,
    genderOptions,
    referenceOptionsError,
    referenceOptionsLoading,
  } = useStudentReferenceOptions({
    enabled: canEditStudentDetail && isEditing,
  });

  const form = useForm<StudentDetailFormValues>({
    initialValues: initialStudentDetailFormValues,
  });

  const applyLoadedDetail = useEffectEvent((detail: StudentDetailResponse) => {
    setIsEditing(false);
    setSaveState({ status: 'idle' });
    form.setValues(mapStudentDetailToFormValues(detail));
    setPageState({ status: 'success', detail });
  });

  useEffect(() => {
    const parsedStudentId = Number(studentIdParam);

    if (!studentIdParam || !Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
      setPageState({ status: 'error', message: 'Invalid student ID.' });
      return;
    }

    let cancelled = false;

    async function loadStudentDetail() {
      setPageState({ status: 'loading' });

      try {
        const detail = await getStudentById(parsedStudentId);

        if (cancelled) {
          return;
        }

        applyLoadedDetail(detail);
      } catch (error) {
        if (!cancelled) {
          setPageState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load student detail.'),
          });
        }
      }
    }

    void loadStudentDetail();

    return () => {
      cancelled = true;
    };
  }, [studentIdParam]);

  useEffect(() => {
    if (saveState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveState((current) => (current.status === 'success' ? { status: 'idle' } : current));
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveState.status]);

  if (pageState.status === 'loading') {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (pageState.status === 'error') {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Unable to load student detail">
          {pageState.message}
        </Alert>
      </Container>
    );
  }

  const { detail } = pageState;
  const visibleTabs = studentDetailTabs.filter((tab) =>
    hasAnyPortalRole(tokenData?.roles, tab.requiredRoles)
  );
  const currentTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : (visibleTabs[0]?.key ?? 'overview');
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const canSaveChanges = hasStudentDetailChanges(detail, form.values);
  const transcriptPath = `/students/${detail.studentId}/transcript`;

  async function handleSaveEdit() {
    if (saveInProgress) {
      return;
    }

    try {
      const request = buildPatchStudentRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedDetail = await patchStudent(detail.studentId, request);
      form.setValues(mapStudentDetailToFormValues(updatedDetail));
      setPageState({ status: 'success', detail: updatedDetail });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save student detail.'),
      });
    }
  }

  return (
    <Container size="xl" py="lg">
      <Stack className={classes.page}>
        <Paper className={classes.summaryCard}>
          <Stack gap="lg">
            <Group
              justify="space-between"
              align="flex-start"
              wrap="wrap"
              gap="lg"
              className={classes.summaryHeader}
            >
              <Stack gap="xs">
                <Text className="portal-ui-eyebrow-text">Student Detail</Text>
                <Title order={1} className={classes.summaryTitle}>
                  {displayValue(detail.fullName)}
                </Title>
                <Text size="sm" c="dimmed">
                  Last updated {displayDateTime(detail.lastUpdated)} by{' '}
                  {displayValue(detail.updatedBy)}
                </Text>
              </Stack>
              <Button
                variant="light"
                onClick={() => {
                  setActiveTab('transcript');
                  navigate(transcriptPath);
                }}
              >
                View transcript
              </Button>
            </Group>

            <Group gap="sm" wrap="wrap" className={classes.summaryMeta}>
              <Badge
                variant="light"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                Student ID: {detail.studentId}
              </Badge>
              <Badge
                variant="light"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                {displayValue(detail.classStanding)}
              </Badge>
              <Badge
                variant="light"
                classNames={{ label: classes.metaBadgeLabel, root: classes.metaBadge }}
              >
                Class of: {displayValue(detail.classOf)}
              </Badge>
              <Badge color={detail.disabled ? 'red' : 'gray'} variant="light">
                {detail.disabled ? 'Disabled' : 'Active'}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        <Paper className={classes.sectionsPanel}>
          <Tabs
            keepMounted={false}
            value={currentTab}
            onChange={(value) => {
              if (value && !saveInProgress) {
                setIsEditing(false);
                setSaveState({ status: 'idle' });
                setActiveTab(value as StudentDetailTabKey);
              }
            }}
          >
            <div className={classes.tabsHeader}>
              <div className={classes.tabsHeaderContent}>
                <Tabs.List className={classes.tabsList}>
                  {visibleTabs.map((tab) => (
                    <Tabs.Tab key={tab.key} value={tab.key} className={classes.tab}>
                      {tab.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </div>
            </div>

            <Tabs.Panel value="overview" className={classes.tabPanel}>
              <StudentDetailOverviewSections
                canSaveChanges={canSaveChanges}
                canEdit={canEditStudentDetail}
                classStandingOptions={classStandingOptions}
                detail={detail}
                ethnicityOptions={ethnicityOptions}
                form={form}
                genderOptions={genderOptions}
                isEditing={isEditing}
                onCancelEdit={() => {
                  form.setValues(mapStudentDetailToFormValues(detail));
                  setSaveState({ status: 'idle' });
                  setIsEditing(false);
                }}
                onSaveEdit={() => {
                  void handleSaveEdit();
                }}
                saveSucceeded={saveSucceeded}
                onStartEdit={() => {
                  setSaveState({ status: 'idle' });
                  setIsEditing(true);
                }}
                referenceOptionsError={referenceOptionsError}
                referenceOptionsLoading={referenceOptionsLoading}
                saveError={saveError}
                saveInProgress={saveInProgress}
                values={form.values}
              />
            </Tabs.Panel>

            <Tabs.Panel value="transcript" className={classes.tabPanel}>
              <StudentDetailTranscriptPanel studentId={detail.studentId} />
            </Tabs.Panel>

            <Tabs.Panel value="schedule" className={classes.tabPanel}>
              <StudentDetailSchedulePanel studentId={detail.studentId} />
            </Tabs.Panel>

            <Tabs.Panel value="academic-career" className={classes.tabPanel}>
              <StudentAcademicCareerPanel
                studentId={detail.studentId}
                studentName={detail.fullName}
              />
            </Tabs.Panel>

            <Tabs.Panel value="affiliations" className={classes.tabPanel}>
              <StudentAffiliationsPanel
                studentId={detail.studentId}
                canManage={canEditStudentDetail}
              />
            </Tabs.Panel>

            <Tabs.Panel value="billing" className={classes.tabPanel}>
              <PlaceholderTabPanel
                accessLabel="Admin only"
                title="Billing"
                description="Billing records, balances, and payment actions can live under this tab without exposing them to non-admin roles."
              />
            </Tabs.Panel>

            <Tabs.Panel value="medical" className={classes.tabPanel}>
              <PlaceholderTabPanel
                accessLabel="Admin only"
                title="Medical"
                description="Medical records and restricted health details can live here behind a stricter role gate than the general student detail page."
              />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
