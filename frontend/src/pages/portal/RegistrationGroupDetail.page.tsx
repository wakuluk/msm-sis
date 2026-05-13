import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Combobox,
  Container,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Stepper,
  Table,
  Text,
  TextInput,
  Title,
  useCombobox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useNavigate, useParams } from 'react-router-dom';
import {
  displayDateTime,
  displayValue,
  normalizeDateInputValue,
  parseDateInputValue,
} from '@/components/academic-year/academicYearDisplay';
import {
  formatTimeInputValue,
  normalizeTimeInput,
} from '@/components/academic-year/courses/courseSectionsWorkspaceUtils';
import {
  getRegistrationGroupStatusColor,
  getRegistrationGroupStatusLabel,
  normalizeRegistrationGroupStatus,
} from '@/components/registration-groups/registrationGroupStatusDisplay';
import {
  addRegistrationGroupStudent,
  getRegistrationGroupDetail,
  getRegistrationGroupReferenceOptions,
  patchRegistrationGroup,
  publishRegistrationGroup,
  removeRegistrationGroupStudent,
  searchRegistrationGroupStudentOptions,
  sendRegistrationGroupTestEmail,
  validateRegistrationGroupsForPublish,
} from '@/services/registration-group-service';
import type {
  PatchRegistrationGroupRequest,
  RegistrationGroupAssignedStudentResponse,
  RegistrationGroupDetailResponse,
  RegistrationGroupPublishValidationIssueResponse,
  RegistrationGroupReferenceOptionsResponse,
  RegistrationGroupSavedSearchCriteriaResponse,
  RegistrationGroupStudentOptionResponse,
} from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';

type AddStudentSearchStatus = 'idle' | 'loading' | 'success' | 'error';

type RegistrationGroupEditForm = {
  academicYearId: string;
  registrationClosesDate: string;
  registrationClosesTime: string;
  registrationOpensDate: string;
  registrationOpensTime: string;
  termId: string;
};

type DetailState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; detail: RegistrationGroupDetailResponse };

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupReferenceOptionsResponse }
  | { status: 'error'; message: string };

type MutationState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type StatusWorkflowState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; issues?: RegistrationGroupPublishValidationIssueResponse[] };

type AddStudentSearchState = {
  status: AddStudentSearchStatus;
  results: RegistrationGroupStudentOptionResponse[];
  message?: string;
};

const registrationGroupWorkflowStatuses = [
  { code: 'DRAFT', label: 'Draft', description: 'Setup' },
  { code: 'PUBLISHED', label: 'Published', description: 'Available' },
  { code: 'CLOSED', label: 'Closed', description: 'Finished' },
] as const;

function getDateTimeParts(value: string | null) {
  const [datePart = '', timePart = ''] = (value ?? '').split('T');

  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
}

function combineDateTimeParts(date: string, time: string) {
  return `${date}T${time}:00`;
}

function parseDateTimeValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue;
}

function isRegistrationWindowCurrentlyOpen(detail: RegistrationGroupDetailResponse | null) {
  if (!detail || normalizeRegistrationGroupStatus(detail.summary.statusCode) !== 'PUBLISHED') {
    return false;
  }

  const opensAt = parseDateTimeValue(detail.registrationWindow.opensAt);
  const closesAt = parseDateTimeValue(detail.registrationWindow.closesAt);

  if (!opensAt || !closesAt) {
    return false;
  }

  const now = new Date();
  return opensAt.getTime() <= now.getTime() && closesAt.getTime() > now.getTime();
}

function getRegistrationGroupEditPermissions(
  statusCode: string | null | undefined,
  windowCurrentlyOpen: boolean
) {
  const normalizedStatus = normalizeRegistrationGroupStatus(statusCode);
  const isDraft = normalizedStatus === 'DRAFT';
  const isPublished = normalizedStatus === 'PUBLISHED';

  return {
    canEditAcademicPeriod: isDraft,
    canEditCloseWindow: isDraft || isPublished,
    canEditOpenWindow: isDraft || (isPublished && !windowCurrentlyOpen),
    canOpenModal: isDraft || isPublished,
  };
}

function parseRegistrationGroupId(value: string | undefined) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getInitialEditForm(detail: RegistrationGroupDetailResponse): RegistrationGroupEditForm {
  const opens = getDateTimeParts(detail.registrationWindow.opensAt);
  const closes = getDateTimeParts(detail.registrationWindow.closesAt);

  return {
    academicYearId: detail.summary.academicYearId ? String(detail.summary.academicYearId) : '',
    registrationClosesDate: closes.date,
    registrationClosesTime: closes.time,
    registrationOpensDate: opens.date,
    registrationOpensTime: opens.time,
    termId: detail.summary.termId ? String(detail.summary.termId) : '',
  };
}

function buildStudentOptionLabel(student: RegistrationGroupStudentOptionResponse) {
  if (student.displayName) {
    return student.displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  return name || student.email || student.studentNumber || String(student.studentId);
}

function buildStudentOptionDescription(student: RegistrationGroupStudentOptionResponse) {
  return [student.studentNumber, student.email, student.academicDivisionName].filter(Boolean).join(' · ');
}

function displayAssignedStudentName(student: RegistrationGroupAssignedStudentResponse) {
  if (student.displayName) {
    return student.displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  return name || student.email || student.studentNumber || `Student ${student.studentId}`;
}

function getWorkflowStepIndex(statusCode: string | null | undefined) {
  const normalizedStatus = normalizeRegistrationGroupStatus(statusCode);

  return registrationGroupWorkflowStatuses.findIndex((status) => status.code === normalizedStatus);
}

function getNextWorkflowAction(statusCode: string | null | undefined) {
  switch (normalizeRegistrationGroupStatus(statusCode)) {
    case 'DRAFT':
      return {
        label: 'Publish',
        targetStatus: 'PUBLISHED',
        message: 'Registration groups published.',
      };
    case 'PUBLISHED':
      return {
        label: 'Close',
        targetStatus: 'CLOSED',
        message: 'Registration group closed.',
      };
    default:
      return null;
  }
}

function displayFilterValue(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) {
    return 'Any';
  }

  return labels[value] ?? value;
}

function getSearchCriteriaRows(criteria: RegistrationGroupSavedSearchCriteriaResponse | null) {
  if (!criteria) {
    return [];
  }

  return [
    { label: 'Generation', value: criteria.name },
    { label: 'Student', value: criteria.studentSearchText ?? 'Any student' },
    { label: 'Program', value: criteria.programSearchText ?? 'Any program' },
    { label: 'Group Name Prefix', value: criteria.groupNamePrefix ?? 'Registration Group' },
    {
      label: 'Academic Division',
      value:
        criteria.academicDivisions.length > 0
          ? criteria.academicDivisions.map((division) => division.name).join(', ')
          : 'Any division',
    },
    {
      label: 'Honors',
      value: displayFilterValue(criteria.honorsFilter, {
        ANY: 'Any honors status',
        HONORS: 'In honors',
        NOT_HONORS: 'Not in honors',
      }),
    },
    {
      label: 'Athlete',
      value: displayFilterValue(criteria.athleteFilter, {
        ANY: 'Any athlete status',
        ATHLETE: 'Athlete',
        NOT_ATHLETE: 'Not an athlete',
      }),
    },
    {
      label: 'Sports',
      value:
        criteria.athleticSports.length > 0
          ? criteria.athleticSports.map((sport) => sport.name).join(', ')
          : 'Any sport',
    },
    {
      label: 'Existing Group',
      value: displayFilterValue(criteria.existingGroupFilter, {
        ANY: 'Include all students',
        EXCLUDE_ALREADY_GROUPED: 'Exclude students already in a group',
        ONLY_ALREADY_GROUPED: 'Only students already in a group',
      }),
    },
    { label: 'Minimum Credits', value: displayValue(criteria.minCredits) },
    { label: 'Maximum Credits', value: displayValue(criteria.maxCredits) },
    { label: 'Include Current Credits', value: criteria.includeCurrentCredits ? 'Yes' : 'No' },
    { label: 'Include Transfer Credits', value: criteria.includeTransferCredits ? 'Yes' : 'No' },
    { label: 'Split Count', value: displayValue(criteria.splitCount) },
    { label: 'Matched Students', value: displayValue(criteria.matchedStudentCount) },
  ];
}

export function RegistrationGroupDetailPage() {
  const navigate = useNavigate();
  const { registrationGroupId } = useParams<{ registrationGroupId: string }>();
  const parsedRegistrationGroupId = parseRegistrationGroupId(registrationGroupId);
  const addStudentCombobox = useCombobox();
  const [detailState, setDetailState] = useState<DetailState>({ status: 'idle' });
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [mutationState, setMutationState] = useState<MutationState>({ status: 'idle' });
  const [emailTestState, setEmailTestState] = useState<MutationState>({ status: 'idle' });
  const [statusWorkflowState, setStatusWorkflowState] = useState<StatusWorkflowState>({
    status: 'idle',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [addStudentQuery, setAddStudentQuery] = useState('');
  const [selectedAddStudent, setSelectedAddStudent] =
    useState<RegistrationGroupStudentOptionResponse | null>(null);
  const [addStudentSearchState, setAddStudentSearchState] = useState<AddStudentSearchState>({
    status: 'idle',
    results: [],
  });
  const [selectedStudent, setSelectedStudent] =
    useState<RegistrationGroupAssignedStudentResponse | null>(null);
  const [editForm, setEditForm] = useState<RegistrationGroupEditForm | null>(null);

  useEffect(() => {
    if (!parsedRegistrationGroupId) {
      setDetailState({ status: 'error', message: 'Registration group id is invalid.' });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getRegistrationGroupDetail({
      registrationGroupId: parsedRegistrationGroupId,
      signal: abortController.signal,
    })
      .then((detail) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({ status: 'success', detail });
        setEditForm(getInitialEditForm(detail));
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [parsedRegistrationGroupId]);

  useEffect(() => {
    const abortController = new AbortController();
    setReferenceOptionsState({ status: 'loading' });

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group options.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!isAddStudentModalOpen || selectedAddStudent || addStudentQuery.trim().length < 2) {
      setAddStudentSearchState((currentState) => ({
        status: 'idle',
        results: selectedAddStudent ? currentState.results : [],
      }));
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setAddStudentSearchState((currentState) => ({
        status: 'loading',
        results: currentState.results,
      }));

      const currentDetail = detailState.status === 'success' ? detailState.detail : null;
      void searchRegistrationGroupStudentOptions({
        academicYearId: currentDetail?.summary.academicYearId ?? null,
        search: addStudentQuery,
        size: 10,
        termId: currentDetail?.summary.termId ?? null,
        signal: abortController.signal,
      })
        .then((response) => {
          if (!abortController.signal.aborted) {
            setAddStudentSearchState({ status: 'success', results: response.results });
          }
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) {
            setAddStudentSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(error, 'Failed to search students.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [addStudentQuery, detailState, isAddStudentModalOpen, selectedAddStudent]);

  const detail = detailState.status === 'success' ? detailState.detail : null;
  const referenceOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.response : null;
  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const academicYearOptions =
    referenceOptions?.academicYears.map((academicYear) => ({
      label: `${academicYear.name} (${academicYear.code})`,
      value: String(academicYear.id),
    })) ?? [];
  const termOptions = useMemo(() => {
    const academicYears = referenceOptions?.academicYears ?? [];
    const selectedAcademicYear = academicYears.find(
      (academicYear) => String(academicYear.id) === editForm?.academicYearId
    );
    const terms = selectedAcademicYear
      ? selectedAcademicYear.terms
      : academicYears.flatMap((academicYear) => academicYear.terms);

    return terms.map((term) => ({
      label: `${term.name} (${term.code})`,
      value: String(term.id),
    }));
  }, [editForm?.academicYearId, referenceOptions]);
  const selectedAddStudentAlreadyAssigned =
    selectedAddStudent && detail
      ? detail.students.some((student) => student.studentId === selectedAddStudent.studentId)
      : false;
  const selectedAddStudentExistingAssignment = selectedAddStudent?.existingAssignment ?? null;
  const selectedAddStudentAssignedToOtherGroup =
    Boolean(selectedAddStudentExistingAssignment) &&
    selectedAddStudentExistingAssignment?.registrationGroupId !== parsedRegistrationGroupId;
  const normalizedDetailStatus = normalizeRegistrationGroupStatus(detail?.summary.statusCode);
  const registrationWindowCurrentlyOpen = isRegistrationWindowCurrentlyOpen(detail);
  const registrationGroupEditPermissions = getRegistrationGroupEditPermissions(
    detail?.summary.statusCode,
    registrationWindowCurrentlyOpen
  );
  const canSaveEdit = Boolean(
    editForm &&
      registrationGroupEditPermissions.canOpenModal &&
      (!registrationGroupEditPermissions.canEditAcademicPeriod ||
        (editForm.academicYearId && editForm.termId)) &&
      (!registrationGroupEditPermissions.canEditOpenWindow ||
        (editForm.registrationOpensDate && editForm.registrationOpensTime)) &&
      (!registrationGroupEditPermissions.canEditCloseWindow ||
        (editForm.registrationClosesDate && editForm.registrationClosesTime))
  );
  const workflowStepIndex = getWorkflowStepIndex(detail?.summary.statusCode);
  const nextWorkflowAction = getNextWorkflowAction(detail?.summary.statusCode);
  const canCancelGroup = normalizedDetailStatus !== 'CANCELLED';
  const searchCriteriaRows = getSearchCriteriaRows(detail?.searchCriteria ?? null);
  const addStudentDropdownContent = useMemo(() => {
    if (addStudentSearchState.status === 'loading') {
      return <Combobox.Empty>Searching...</Combobox.Empty>;
    }

    if (addStudentQuery.trim().length < 2) {
      return <Combobox.Empty>Type at least 2 characters</Combobox.Empty>;
    }

    if (addStudentSearchState.status === 'error') {
      return <Combobox.Empty>{addStudentSearchState.message}</Combobox.Empty>;
    }

    if (addStudentSearchState.results.length === 0) {
      return <Combobox.Empty>No students found</Combobox.Empty>;
    }

    return addStudentSearchState.results.map((student) => (
      <Combobox.Option key={student.studentId} value={String(student.studentId)}>
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            {buildStudentOptionLabel(student)}
          </Text>
          <Text size="xs" c="dimmed">
            {buildStudentOptionDescription(student)}
          </Text>
        </Stack>
      </Combobox.Option>
    ));
  }, [addStudentQuery, addStudentSearchState]);

  function applyDetail(nextDetail: RegistrationGroupDetailResponse) {
    setDetailState({ status: 'success', detail: nextDetail });
    setEditForm(getInitialEditForm(nextDetail));
  }

  function refreshDetail(nextDetail: RegistrationGroupDetailResponse, message: string) {
    applyDetail(nextDetail);
    setMutationState({ status: 'success', message });
  }

  function handleOpenEditModal() {
    if (!detail || !registrationGroupEditPermissions.canOpenModal) {
      return;
    }

    setEditForm(getInitialEditForm(detail));
    setIsEditModalOpen(true);
    setMutationState({ status: 'idle' });
  }

  async function handleSaveEdit() {
    if (!editForm || !detail || !parsedRegistrationGroupId) {
      return;
    }

    if (!registrationGroupEditPermissions.canOpenModal) {
      setMutationState({
        status: 'error',
        message: 'Closed or cancelled registration groups are read-only.',
      });
      return;
    }

    const request: PatchRegistrationGroupRequest = {};

    if (registrationGroupEditPermissions.canEditAcademicPeriod) {
      if (!editForm.academicYearId || !editForm.termId) {
        setMutationState({ status: 'error', message: 'Academic year and term are required.' });
        return;
      }

      request.academicYearId = Number(editForm.academicYearId);
      request.termId = Number(editForm.termId);
    }

    if (registrationGroupEditPermissions.canEditOpenWindow) {
      const normalizedOpensTime = normalizeTimeInput(editForm.registrationOpensTime);

      if (!editForm.registrationOpensDate || !normalizedOpensTime) {
        setMutationState({ status: 'error', message: 'Registration open date and time are required.' });
        return;
      }

      request.registrationOpensAt = combineDateTimeParts(
        editForm.registrationOpensDate,
        normalizedOpensTime
      );
    }

    if (registrationGroupEditPermissions.canEditCloseWindow) {
      const normalizedClosesTime = normalizeTimeInput(editForm.registrationClosesTime);

      if (!editForm.registrationClosesDate || !normalizedClosesTime) {
        setMutationState({ status: 'error', message: 'Registration close date and time are required.' });
        return;
      }

      request.registrationClosesAt = combineDateTimeParts(
        editForm.registrationClosesDate,
        normalizedClosesTime
      );
    }

    setMutationState({ status: 'loading' });

    try {
      const nextDetail = await patchRegistrationGroup({
        registrationGroupId: parsedRegistrationGroupId,
        request,
      });

      refreshDetail(nextDetail, 'Registration group updated.');
      setIsEditModalOpen(false);
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update registration group.'),
      });
    }
  }

  function handleCloseAddStudentModal() {
    setIsAddStudentModalOpen(false);
    setAddStudentQuery('');
    setSelectedAddStudent(null);
    setAddStudentSearchState({ status: 'idle', results: [] });
  }

  async function handleAddSelectedStudent(moveExistingAssignment = false) {
    if (!selectedAddStudent || selectedAddStudentAlreadyAssigned || !parsedRegistrationGroupId) {
      return;
    }

    setMutationState({ status: 'loading' });

    try {
      const nextDetail = await addRegistrationGroupStudent({
        registrationGroupId: parsedRegistrationGroupId,
        request: { studentId: selectedAddStudent.studentId, moveExistingAssignment },
      });

      refreshDetail(
        nextDetail,
        moveExistingAssignment
          ? 'Student moved to this registration group.'
          : 'Student added to registration group.'
      );
      handleCloseAddStudentModal();
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add student to registration group.'),
      });
    }
  }

  async function handleRemoveSelectedStudent() {
    if (!selectedStudent || !parsedRegistrationGroupId) {
      return;
    }

    setMutationState({ status: 'loading' });

    try {
      const nextDetail = await removeRegistrationGroupStudent({
        registrationGroupId: parsedRegistrationGroupId,
        studentId: selectedStudent.studentId,
      });

      refreshDetail(nextDetail, 'Student removed from registration group.');
      setSelectedStudent(null);
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to remove student from registration group.'),
      });
    }
  }

  async function handleAdvanceStatus() {
    if (!detail || !nextWorkflowAction || !parsedRegistrationGroupId) {
      return;
    }

    setStatusWorkflowState({ status: 'loading' });
    setMutationState({ status: 'idle' });

    try {
      if (normalizedDetailStatus === 'DRAFT') {
        if (!detail.summary.academicYearId || !detail.summary.termId) {
          setStatusWorkflowState({
            status: 'error',
            message: 'Academic year and term are required before publishing.',
          });
          return;
        }

        const validation = await validateRegistrationGroupsForPublish({
          request: {
            academicYearId: detail.summary.academicYearId,
            termId: detail.summary.termId,
          },
        });

        if (!validation.publishable) {
          setStatusWorkflowState({
            status: 'error',
            message:
              'Registration groups are not ready to publish. Fix the blocking issues before publishing.',
            issues: validation.issues,
          });
          return;
        }

        const nextDetail = await publishRegistrationGroup({
          registrationGroupId: parsedRegistrationGroupId,
        });
        applyDetail(nextDetail);
        setStatusWorkflowState({ status: 'success', message: nextWorkflowAction.message });
        return;
      }

      const nextDetail = await patchRegistrationGroup({
        registrationGroupId: parsedRegistrationGroupId,
        request: { status: nextWorkflowAction.targetStatus },
      });

      applyDetail(nextDetail);
      setStatusWorkflowState({ status: 'success', message: nextWorkflowAction.message });
    } catch (error) {
      setStatusWorkflowState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update registration group status.'),
      });
    }
  }

  async function handleCancelRegistrationGroup() {
    if (!parsedRegistrationGroupId) {
      return;
    }

    setStatusWorkflowState({ status: 'loading' });
    setMutationState({ status: 'idle' });

    try {
      const nextDetail = await patchRegistrationGroup({
        registrationGroupId: parsedRegistrationGroupId,
        request: { status: 'CANCELLED' },
      });

      applyDetail(nextDetail);
      setStatusWorkflowState({ status: 'success', message: 'Registration group cancelled.' });
      setIsCancelModalOpen(false);
    } catch (error) {
      setStatusWorkflowState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to cancel registration group.'),
      });
    }
  }

  async function handleSendTestEmail() {
    if (!parsedRegistrationGroupId) {
      return;
    }

    setEmailTestState({ status: 'loading' });

    try {
      const response = await sendRegistrationGroupTestEmail({
        registrationGroupId: parsedRegistrationGroupId,
      });

      setEmailTestState({
        status: 'success',
        message: `${response.message} Sent ${response.sentEmailCount} email to ${response.recipient}.`,
      });
    } catch (error) {
      setEmailTestState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to send registration group test email.'),
      });
    }
  }

  if (detailState.status === 'loading' || detailState.status === 'idle') {
    return (
      <Container size="xl" py="lg">
        <Paper p="lg" withBorder radius="md">
          <Group gap="md">
            <Loader size="sm" />
            <Text>Loading registration group...</Text>
          </Group>
        </Paper>
      </Container>
    );
  }

  if (detailState.status === 'error' || !detail) {
    return (
      <Container size="xl" py="lg">
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Title order={1}>Registration Group Not Found</Title>
            <Text c="dimmed">
              {detailState.status === 'error'
                ? detailState.message
                : 'The selected registration group could not be found.'}
            </Text>
            <Group>
              <Button
                variant="default"
                onClick={() => {
                  navigate('/registration/groups');
                }}
              >
                Back to Registration Groups
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="lg">
      <Modal
        centered
        opened={isEditModalOpen}
        size="lg"
        title="Edit Registration Group"
        onClose={() => {
          setIsEditModalOpen(false);
        }}
      >
        <Stack gap="md">
          {referenceOptionsError ? (
            <Alert color="red" title="Unable to load registration options">
              {referenceOptionsError}
            </Alert>
          ) : null}
          {registrationWindowCurrentlyOpen ? (
            <Alert color="blue" title="Registration window is open">
              The start time is locked while this window is active. You can still extend the close
              time.
            </Alert>
          ) : null}

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={academicYearOptions}
                disabled={
                  referenceOptionsLoading || !registrationGroupEditPermissions.canEditAcademicPeriod
                }
                label="Academic Year"
                value={editForm?.academicYearId ?? null}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  const nextAcademicYear = referenceOptions?.academicYears.find(
                    (academicYear) => String(academicYear.id) === value
                  );
                  const nextTerm = nextAcademicYear?.terms[0];

                  setEditForm((current) =>
                    current
                      ? {
                          ...current,
                          academicYearId: value,
                          termId: nextTerm ? String(nextTerm.id) : '',
                        }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={termOptions}
                disabled={
                  !editForm?.academicYearId ||
                  referenceOptionsLoading ||
                  !registrationGroupEditPermissions.canEditAcademicPeriod
                }
                label="Term"
                value={editForm?.termId ?? null}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  setEditForm((current) => (current ? { ...current, termId: value } : current));
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                clearable
                disabled={!registrationGroupEditPermissions.canEditOpenWindow}
                label="Opens Date"
                placeholder="YYYY-MM-DD"
                value={parseDateInputValue(editForm?.registrationOpensDate ?? '')}
                valueFormat="YYYY-MM-DD"
                onChange={(value) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationOpensDate: normalizeDateInputValue(value) }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                disabled={!registrationGroupEditPermissions.canEditOpenWindow}
                label="Opens Time"
                placeholder="8:00 AM"
                value={formatTimeInputValue(editForm?.registrationOpensTime ?? null)}
                onChange={(event) => {
                  setEditForm((current) =>
                    current ? { ...current, registrationOpensTime: event.currentTarget.value } : current
                  );
                }}
                onBlur={(event) => {
                  const value = normalizeTimeInput(event.currentTarget.value);
                  setEditForm((current) =>
                    current ? { ...current, registrationOpensTime: value ?? '' } : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                clearable
                disabled={!registrationGroupEditPermissions.canEditCloseWindow}
                label="Closes Date"
                placeholder="YYYY-MM-DD"
                value={parseDateInputValue(editForm?.registrationClosesDate ?? '')}
                valueFormat="YYYY-MM-DD"
                onChange={(value) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationClosesDate: normalizeDateInputValue(value) }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                disabled={!registrationGroupEditPermissions.canEditCloseWindow}
                label="Closes Time"
                placeholder="5:00 PM"
                value={formatTimeInputValue(editForm?.registrationClosesTime ?? null)}
                onChange={(event) => {
                  setEditForm((current) =>
                    current ? { ...current, registrationClosesTime: event.currentTarget.value } : current
                  );
                }}
                onBlur={(event) => {
                  const value = normalizeTimeInput(event.currentTarget.value);
                  setEditForm((current) =>
                    current ? { ...current, registrationClosesTime: value ?? '' } : current
                  );
                }}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!canSaveEdit}
              loading={mutationState.status === 'loading'}
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        centered
        opened={isAddStudentModalOpen}
        size="xl"
        title={`Add Student to ${detail.summary.name}`}
        onClose={handleCloseAddStudentModal}
      >
        <Stack gap="md">
          <Combobox
            store={addStudentCombobox}
            onOptionSubmit={(optionValue) => {
              const student = addStudentSearchState.results.find(
                (candidate) => candidate.studentId === Number(optionValue)
              );

              if (student) {
                setSelectedAddStudent(student);
                setAddStudentQuery(buildStudentOptionLabel(student));
              }

              addStudentCombobox.closeDropdown();
            }}
          >
            <Combobox.Target>
              <TextInput
                label="Search students"
                placeholder="Name, email, or student ID"
                value={addStudentQuery}
                onFocus={() => {
                  addStudentCombobox.openDropdown();
                }}
                onClick={() => {
                  addStudentCombobox.openDropdown();
                }}
                onChange={(event) => {
                  setSelectedAddStudent(null);
                  setAddStudentQuery(event.currentTarget.value);
                  addStudentCombobox.openDropdown();
                }}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>{addStudentDropdownContent}</Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          {selectedAddStudent ? (
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={700}>{buildStudentOptionLabel(selectedAddStudent)}</Text>
                  <Text size="sm" c="dimmed">
                    {buildStudentOptionDescription(selectedAddStudent)}
                  </Text>
                  <Group gap="xs">
                    <Badge variant="light">
                      {displayValue(selectedAddStudent.academicDivisionName)}
                    </Badge>
                    {selectedAddStudentAlreadyAssigned ? (
                      <Badge color="yellow" variant="light">
                        Already in this group
                      </Badge>
                    ) : selectedAddStudentAssignedToOtherGroup ? (
                      <Badge color="yellow" variant="light">
                        In another group
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        Not in this group
                      </Badge>
                    )}
                  </Group>
                </Stack>
                {selectedAddStudentAssignedToOtherGroup ? (
                  <Button
                    color="yellow"
                    disabled={selectedAddStudentAlreadyAssigned}
                    loading={mutationState.status === 'loading'}
                    onClick={() => handleAddSelectedStudent(true)}
                  >
                    Move to This Group
                  </Button>
                ) : (
                  <Button
                    disabled={selectedAddStudentAlreadyAssigned}
                    loading={mutationState.status === 'loading'}
                    onClick={() => handleAddSelectedStudent(false)}
                  >
                    Add to Group
                  </Button>
                )}
              </Group>
              {selectedAddStudentAssignedToOtherGroup && selectedAddStudentExistingAssignment ? (
                <Alert color="yellow" title="Student is already grouped">
                  {buildStudentOptionLabel(selectedAddStudent)} is already assigned to{' '}
                  <Text span fw={700}>
                    {selectedAddStudentExistingAssignment.groupName}
                  </Text>{' '}
                  for {selectedAddStudentExistingAssignment.termName}. Moving the student will remove
                  that assignment and add them to this group.
                </Alert>
              ) : null}
            </Paper>
          ) : (
            <Text size="sm" c="dimmed">
              Search by student ID, email, or name. Any active student can be added to this group.
            </Text>
          )}
        </Stack>
      </Modal>

      <Modal
        centered
        opened={Boolean(selectedStudent)}
        size="lg"
        title="Manage Student"
        onClose={() => {
          setSelectedStudent(null);
        }}
      >
        {selectedStudent ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text fw={700}>{displayAssignedStudentName(selectedStudent)}</Text>
              <Text size="sm" c="dimmed">
                {displayValue(selectedStudent.studentNumber)}
                {selectedStudent.email ? ` · ${selectedStudent.email}` : ''}
              </Text>
            </Stack>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Division</Text>
                  <Text fw={700}>{displayValue(selectedStudent.academicDivisionName)}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Assignment Source</Text>
                  <Text fw={700}>{displayValue(selectedStudent.assignmentSource)}</Text>
                </Stack>
              </Grid.Col>
            </Grid>

            <Group justify="space-between">
              <Button
                color="red"
                variant="light"
                loading={mutationState.status === 'loading'}
                onClick={handleRemoveSelectedStudent}
              >
                Remove from Group
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setSelectedStudent(null);
                }}
              >
                Close
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Modal
        centered
        opened={isCancelModalOpen}
        size="md"
        title="Cancel Registration Group"
        onClose={() => {
          setIsCancelModalOpen(false);
        }}
      >
        <Stack gap="md">
          <Alert color="red" title="Cancel this registration group?">
            Cancelling removes this group from the normal draft to published to closed workflow.
            This action can be changed later by an admin if needed.
          </Alert>
          <Stack gap={4}>
            <Text className="portal-ui-eyebrow-text">Group</Text>
            <Text fw={700}>{detail.summary.name}</Text>
          </Stack>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsCancelModalOpen(false);
              }}
            >
              Keep Group
            </Button>
            <Button
              color="red"
              loading={statusWorkflowState.status === 'loading'}
              onClick={handleCancelRegistrationGroup}
            >
              Cancel Group
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
            <Stack gap="xs">
              <Text className="portal-ui-eyebrow-text">Registration Group</Text>
              <Group gap="sm" align="center">
                <Title order={1}>{detail.summary.name}</Title>
                <Badge color={getRegistrationGroupStatusColor(detail.summary.statusCode)} variant="light">
                  {getRegistrationGroupStatusLabel(detail.summary.statusCode, detail.summary.statusName)}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {displayValue(detail.summary.academicYearName)} · {displayValue(detail.summary.termName)}
              </Text>
            </Stack>
            <Group justify="flex-end">
              <Button
                variant="light"
                loading={emailTestState.status === 'loading'}
                onClick={handleSendTestEmail}
              >
                  Send Test Email
                </Button>
              {registrationGroupEditPermissions.canOpenModal ? (
                <Button onClick={handleOpenEditModal}>Edit Group</Button>
              ) : null}
              <Button
                variant="default"
                onClick={() => {
                  navigate('/registration/groups');
                }}
              >
                Back to Search
              </Button>
            </Group>
          </Group>
        </Paper>

        {emailTestState.status === 'success' ? (
          <Alert color="green" title="Test email sent">
            {emailTestState.message}
          </Alert>
        ) : null}
        {emailTestState.status === 'error' ? (
          <Alert color="red" title="Unable to send test email">
            {emailTestState.message}
          </Alert>
        ) : null}

        {mutationState.status === 'success' ? (
          <Alert color="green" title="Registration group updated">
            {mutationState.message}
          </Alert>
        ) : null}
        {mutationState.status === 'error' ? (
          <Alert color="red" title="Unable to update registration group">
            {mutationState.message}
          </Alert>
        ) : null}

        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Title order={2}>Status Workflow</Title>
                <Text size="sm" c="dimmed">
                  Draft groups can be published after the same validation used by the publish wizard.
                </Text>
              </Stack>
              <Group gap="sm" justify="flex-end">
                <Button
                  color="red"
                  variant="light"
                  disabled={!canCancelGroup || statusWorkflowState.status === 'loading'}
                  onClick={() => {
                    setStatusWorkflowState({ status: 'idle' });
                    setIsCancelModalOpen(true);
                  }}
                >
                  Cancel Group
                </Button>
                {nextWorkflowAction ? (
                  <Button
                    loading={statusWorkflowState.status === 'loading'}
                    onClick={handleAdvanceStatus}
                  >
                    {nextWorkflowAction.label}
                  </Button>
                ) : null}
              </Group>
            </Group>

            <Stepper
              active={workflowStepIndex >= 0 ? workflowStepIndex : -1}
              allowNextStepsSelect={false}
              color="teal"
              size="sm"
            >
              {registrationGroupWorkflowStatuses.map((status) => (
                <Stepper.Step
                  key={status.code}
                  label={status.label}
                  description={status.description}
                />
              ))}
            </Stepper>

            {normalizedDetailStatus === 'CANCELLED' ? (
              <Alert color="red" title="Registration group cancelled">
                Cancelled groups are outside the normal publish and close workflow.
              </Alert>
            ) : null}

            {statusWorkflowState.status === 'success' ? (
              <Alert color="green" title="Status updated">
                {statusWorkflowState.message}
              </Alert>
            ) : null}

            {statusWorkflowState.status === 'error' ? (
              <Alert color="red" title="Unable to update status">
                <Stack gap="xs">
                  <Text>{statusWorkflowState.message}</Text>
                  {statusWorkflowState.issues && statusWorkflowState.issues.length > 0 ? (
                    <Stack gap={4}>
                      {statusWorkflowState.issues.map((issue) => (
                        <Text
                          key={`${issue.registrationGroupId ?? 'term'}-${issue.field}-${issue.code}`}
                          size="sm"
                        >
                          {issue.groupName ? `${issue.groupName}: ` : ''}
                          {issue.message}
                        </Text>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Alert>
            ) : null}
          </Stack>
        </Paper>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="lg">
            <Title order={2}>Registration Window</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Academic Year</Text>
                  <Text fw={700}>{displayValue(detail.summary.academicYearName)}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Term</Text>
                  <Text fw={700}>{displayValue(detail.summary.termName)}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Opens</Text>
                  <Text fw={700}>{displayDateTime(detail.registrationWindow.opensAt)}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Closes</Text>
                  <Text fw={700}>{displayDateTime(detail.registrationWindow.closesAt)}</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="lg">
            <Stack gap={2}>
              <Title order={2}>Saved Search Criteria</Title>
              <Text size="sm" c="dimmed">
                Criteria used to create the student population for this registration group.
              </Text>
            </Stack>

            {searchCriteriaRows.length > 0 ? (
              <Grid>
                {searchCriteriaRows.map((criterion) => (
                  <Grid.Col
                    key={`${criterion.label}-${criterion.value}`}
                    span={{ base: 12, md: 4 }}
                  >
                    <Stack gap={4}>
                      <Text className="portal-ui-eyebrow-text">{criterion.label}</Text>
                      <Text fw={700}>{criterion.value}</Text>
                    </Stack>
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Text c="dimmed">No saved search criteria exists for this group.</Text>
            )}
          </Stack>
        </Paper>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Title order={2}>Students</Title>
                <Text size="sm" c="dimmed">
                  {detail.counts.assignedStudentCount} students currently assigned.
                </Text>
              </Stack>
              <Group gap="sm">
                {detail.counts.matchedStudentCount !== null ? (
                  <Badge variant="light">{detail.counts.matchedStudentCount} matched criteria</Badge>
                ) : null}
                <Button
                  onClick={() => {
                    setIsAddStudentModalOpen(true);
                    setMutationState({ status: 'idle' });
                  }}
                >
                  Add Student
                </Button>
              </Group>
            </Group>

            <Table.ScrollContainer minWidth={900}>
              <Table horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Division</Table.Th>
                    <Table.Th>Source</Table.Th>
                    <Table.Th>Assigned</Table.Th>
                    <Table.Th>Updated</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.students.length > 0 ? (
                    detail.students.map((student) => (
                      <Table.Tr
                        key={student.registrationGroupStudentId}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setMutationState({ status: 'idle' });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedStudent(student);
                            setMutationState({ status: 'idle' });
                          }
                        }}
                      >
                        <Table.Td>
                          <Stack gap={2}>
                            <Text fw={700}>{displayAssignedStudentName(student)}</Text>
                            <Text size="sm" c="dimmed">
                              {displayValue(student.studentNumber)}
                              {student.email ? ` · ${student.email}` : ''}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>{displayValue(student.academicDivisionName)}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{displayValue(student.assignmentSource)}</Badge>
                        </Table.Td>
                        <Table.Td>{displayDateTime(student.assignedAt)}</Table.Td>
                        <Table.Td>{displayDateTime(student.updatedAt)}</Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed">No students are assigned to this group.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
