import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
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
import { getStudentSchedule } from '@/services/student-schedule-service';
import { getStudentById, getStudentTranscriptById, patchStudent } from '@/services/student-service';
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
