import { useEffect, useMemo, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  Badge,
  Button,
  Grid,
  Group,
  Alert,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { displayDate, displayDateTime, displayValue } from '@/components/academic-year/academicYearDisplay';
import { ProgramRequirementsSection } from '@/components/program-tracker/ProgramRequirementsSection';
import { SemesterPlannerSection } from '@/components/program-tracker/SemesterPlannerSection';
import {
  mapAcademicPlanResponseToProgramTrackerYears,
  mapProgramTrackerResponseToPrograms,
} from '@/components/program-tracker/program-tracker.mappers';
import type { ProgramTrackerPlannerYear } from '@/components/program-tracker/program-tracker.types';
import type {
  StudentProgramRequestDetailResponse,
  StudentProgramRequestSummaryResponse,
} from '@/services/schemas/student-program-schemas';
import { ProgramRequestStatusBadge } from './ProgramRequestStatusBadge';

type ProgramRequestDetailPanelProps = {
  canAdminApprove: boolean;
  canDepartmentApprove: boolean;
  detail: StudentProgramRequestDetailResponse;
  onAdminApprove: (comment: string | null, programVersionId: number | null) => Promise<void>;
  onDepartmentApprove: (comment: string | null, programVersionId: number | null) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
};

export function ProgramRequestDetailPanel({
  canAdminApprove: canShowAdminApproval,
  canDepartmentApprove: canShowDepartmentApproval,
  detail,
  onAdminApprove,
  onDepartmentApprove,
  onReject,
}: ProgramRequestDetailPanelProps) {
  const [adminComment, setAdminComment] = useState('');
  const [departmentComment, setDepartmentComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [selectedProgramVersionId, setSelectedProgramVersionId] = useState(
    detail.request.programVersionId === null ? '' : String(detail.request.programVersionId)
  );
  const [adminApprovalState, setAdminApprovalState] = useState<
    { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [departmentApprovalState, setDepartmentApprovalState] = useState<
    { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [rejectionState, setRejectionState] = useState<
    { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }
  >({ status: 'idle' });
  const normalizedStatus = detail.request.status.toUpperCase();
  const requestIsFinal = normalizedStatus === 'ADMIN_APPROVED' || normalizedStatus === 'REJECTED';
  const requestCanBeAdminApproved = normalizedStatus === 'DEPARTMENT_APPROVED';
  const requestCanBeDepartmentApproved = normalizedStatus === 'REQUESTED';
  const requestCanBeRejectedByAdmin =
    normalizedStatus === 'REQUESTED' || normalizedStatus === 'DEPARTMENT_APPROVED';
  const requestCanBeRejectedByDepartment = normalizedStatus === 'REQUESTED';
  const canShowRejectionAction =
    (canShowAdminApproval && requestCanBeRejectedByAdmin)
    || (canShowDepartmentApproval && requestCanBeRejectedByDepartment);
  const versionOptions = detail.programVersions.map((version) => ({
    value: String(version.programVersionId),
    label: formatProgramVersionOption(version),
  }));

  useEffect(() => {
    setSelectedProgramVersionId(
      detail.request.programVersionId === null ? '' : String(detail.request.programVersionId)
    );
  }, [detail.request.programVersionId]);

  async function handleDepartmentApprove() {
    setDepartmentApprovalState({ status: 'submitting' });

    try {
      await onDepartmentApprove(
        departmentComment.trim() === '' ? null : departmentComment.trim(),
        selectedProgramVersionId === '' ? null : Number(selectedProgramVersionId)
      );
      setDepartmentApprovalState({ status: 'idle' });
      setDepartmentComment('');
    } catch (error) {
      setDepartmentApprovalState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve request.',
      });
    }
  }

  async function handleAdminApprove() {
    setAdminApprovalState({ status: 'submitting' });

    try {
      await onAdminApprove(
        adminComment.trim() === '' ? null : adminComment.trim(),
        selectedProgramVersionId === '' ? null : Number(selectedProgramVersionId)
      );
      setAdminApprovalState({ status: 'idle' });
      setAdminComment('');
    } catch (error) {
      setAdminApprovalState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve request.',
      });
    }
  }

  async function handleReject() {
    const trimmedComment = rejectionComment.trim();
    if (trimmedComment === '') {
      setRejectionState({
        status: 'error',
        message: 'A rejection note is required.',
      });
      return;
    }

    setRejectionState({ status: 'submitting' });

    try {
      await onReject(trimmedComment);
      setRejectionState({ status: 'idle' });
      setRejectionComment('');
    } catch (error) {
      setRejectionState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to reject request.',
      });
    }
  }

  return (
    <Stack gap="lg" p="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={4}>
            <Title order={4}>Request Detail</Title>
            <Text c="dimmed">
              {displayStudentName(detail.request)} requesting{' '}
              {detail.request.programName ?? detail.request.programCode ?? 'program'}.
            </Text>
          </Stack>
          <ProgramRequestStatusBadge status={detail.request.status} />
        </Group>

        <Tabs defaultValue="student">
          <Tabs.List>
            <Tabs.Tab value="student">Student</Tabs.Tab>
            <Tabs.Tab value="plan">Plan</Tabs.Tab>
            <Tabs.Tab value="review">Review</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="student" pt="md">
            <StudentRequestOverview request={detail.request} />
          </Tabs.Panel>

          <Tabs.Panel value="plan" pt="md">
            <ProgramRequestReadonlyTracker detail={detail} />
          </Tabs.Panel>

          <Tabs.Panel value="review" pt="md">
            <Stack gap="md">
              {requestIsFinal ? <FinalReviewStatus status={detail.request.status} /> : null}
              <ApprovedProgramVersionCard request={detail.request} />
              <ReviewHistory request={detail.request} />

              {canShowDepartmentApproval && requestCanBeDepartmentApproved ? (
                <ApprovalActionPanel
                  buttonLabel="Approve department review"
                  comment={departmentComment}
                  commentLabel="Department Comment"
                  commentPlaceholder="Optional comment for the request record"
                  errorMessage={
                    departmentApprovalState.status === 'error'
                      ? departmentApprovalState.message
                      : null
                  }
                  loading={departmentApprovalState.status === 'submitting'}
                  selectedProgramVersionId={selectedProgramVersionId}
                  title="Department Approval"
                  versionOptions={versionOptions}
                  onApprove={handleDepartmentApprove}
                  onCommentChange={setDepartmentComment}
                  onProgramVersionChange={setSelectedProgramVersionId}
                />
              ) : null}

              {canShowAdminApproval && requestCanBeAdminApproved ? (
                <ApprovalActionPanel
                  buttonLabel="Approve request"
                  comment={adminComment}
                  commentLabel="Admin Comment"
                  commentPlaceholder="Optional final approval comment"
                  errorMessage={
                    adminApprovalState.status === 'error' ? adminApprovalState.message : null
                  }
                  loading={adminApprovalState.status === 'submitting'}
                  selectedProgramVersionId={selectedProgramVersionId}
                  title="Admin Approval"
                  versionOptions={versionOptions}
                  onApprove={handleAdminApprove}
                  onCommentChange={setAdminComment}
                  onProgramVersionChange={setSelectedProgramVersionId}
                />
              ) : null}

              {canShowRejectionAction ? (
                <RejectionActionPanel
                  comment={rejectionComment}
                  errorMessage={
                    rejectionState.status === 'error' ? rejectionState.message : null
                  }
                  loading={rejectionState.status === 'submitting'}
                  onCommentChange={setRejectionComment}
                  onReject={handleReject}
                />
              ) : null}
            </Stack>
          </Tabs.Panel>
        </Tabs>
    </Stack>
  );
}

function RejectionActionPanel({
  comment,
  errorMessage,
  loading,
  onCommentChange,
  onReject,
}: {
  comment: string;
  errorMessage: string | null;
  loading: boolean;
  onCommentChange: (value: string) => void;
  onReject: () => void;
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={5}>Reject Request</Title>
        <Textarea
          label="Rejection Note"
          placeholder="Explain why this request is being denied."
          description="This note will be visible to the student."
          autosize
          minRows={3}
          maxLength={1000}
          value={comment}
          onChange={(event) => {
            onCommentChange(event.currentTarget.value);
          }}
        />
        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
        <Group justify="flex-end">
          <Button color="red" loading={loading} variant="light" onClick={onReject}>
            Reject request
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function ApprovedProgramVersionCard({
  request,
}: {
  request: StudentProgramRequestSummaryResponse;
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap={4}>
        <Text size="sm" c="dimmed" fw={700} tt="uppercase">
          Approved Version
        </Text>
        <Text fw={700}>{formatApprovedProgramVersion(request)}</Text>
        <Text size="sm" c="dimmed">
          {request.programName ?? request.programCode ?? 'Requested program'}
        </Text>
      </Stack>
    </Paper>
  );
}

function formatApprovedProgramVersion(request: StudentProgramRequestSummaryResponse) {
  if (request.programVersionNumber === null) {
    return 'No approved version selected';
  }

  return `Version ${request.programVersionNumber}, ${formatProgramClassYearRange(
    request.programVersionClassYearStart,
    request.programVersionClassYearEnd
  )}`;
}

function formatProgramClassYearRange(classYearStart: number | null, classYearEnd: number | null) {
  if (classYearStart === null) {
    return 'unknown';
  }

  if (classYearEnd === null) {
    return `${classYearStart}+`;
  }

  return `${classYearStart}-${classYearEnd}`;
}

function ApprovalActionPanel({
  buttonLabel,
  comment,
  commentLabel,
  commentPlaceholder,
  errorMessage,
  loading,
  selectedProgramVersionId,
  title,
  versionOptions,
  onApprove,
  onCommentChange,
  onProgramVersionChange,
}: {
  buttonLabel: string;
  comment: string;
  commentLabel: string;
  commentPlaceholder: string;
  errorMessage: string | null;
  loading: boolean;
  selectedProgramVersionId: string;
  title: string;
  versionOptions: Array<{ label: string; value: string }>;
  onApprove: () => void;
  onCommentChange: (value: string) => void;
  onProgramVersionChange: (value: string) => void;
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={5}>{title}</Title>
        <Select
          label="Program Version"
          description="Version the student will be assigned if this review is approved."
          data={versionOptions}
          value={selectedProgramVersionId || null}
          onChange={(value) => {
            onProgramVersionChange(value ?? '');
          }}
          disabled={versionOptions.length === 0}
        />
        <Textarea
          label={commentLabel}
          placeholder={commentPlaceholder}
          autosize
          minRows={3}
          maxLength={1000}
          value={comment}
          onChange={(event) => {
            onCommentChange(event.currentTarget.value);
          }}
        />
        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
        <Group justify="flex-end">
          <Button loading={loading} onClick={onApprove}>
            {buttonLabel}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function FinalReviewStatus({ status }: { status: string }) {
  const normalizedStatus = status.trim().toUpperCase();
  const isApproved = normalizedStatus === 'ADMIN_APPROVED';

  return (
    <Group justify="flex-start">
      <Badge color={isApproved ? 'green' : 'red'} size="xl" variant="filled">
        {isApproved ? 'Approved' : 'Rejected'}
      </Badge>
    </Group>
  );
}

function StudentRequestOverview({ request }: { request: StudentProgramRequestSummaryResponse }) {
  return (
    <Grid>
      <ReadOnlyField label="Student" value={displayStudentName(request)} span={{ base: 12, md: 4 }} />
      <ReadOnlyField label="Email" value={displayValue(request.studentEmail)} span={{ base: 12, md: 4 }} />
      <ReadOnlyField
        label="Class"
        value={displayValue(request.classStandingName)}
        span={{ base: 12, md: 4 }}
      />
      <ReadOnlyField
        label="Estimated Grad Date"
        value={displayDate(request.estimatedGradDate)}
        span={{ base: 12, md: 4 }}
      />
      <ReadOnlyField label="Program" value={displayValue(request.programName)} span={{ base: 12, md: 4 }} />
      <ReadOnlyField
        label="Program Type"
        value={displayValue(request.programTypeName ?? request.programTypeCode)}
        span={{ base: 12, md: 4 }}
      />
      <ReadOnlyField
        label="Degree"
        value={displayValue(request.degreeTypeName ?? request.degreeTypeCode)}
        span={{ base: 12, md: 4 }}
      />
      <ReadOnlyField
        label="Department"
        value={displayDepartment(request)}
        span={{ base: 12, md: 4 }}
      />
      <ReadOnlyField
        label="Requested"
        value={displayDateTime(request.requestedAt)}
        span={{ base: 12, md: 4 }}
      />
    </Grid>
  );
}

function ProgramRequestReadonlyTracker({ detail }: { detail: StudentProgramRequestDetailResponse }) {
  const programs = useMemo(() => mapProgramTrackerResponseToPrograms(detail.plan), [detail.plan]);
  const plannerYears = useMemo(
    () => mapAcademicPlanResponseToProgramTrackerYears(detail.plan.academicPlan),
    [detail.plan.academicPlan]
  );
  const [expandedProgramCodes, setExpandedProgramCodes] = useState<Set<string>>(
    () => new Set(programs.map((program) => program.code))
  );
  const [expandedPlannerYearLabels, setExpandedPlannerYearLabels] = useState<Set<string>>(
    () => new Set(plannerYears.map((year) => year.label))
  );
  const [plannerYearsReversed, setPlannerYearsReversed] = useState(false);
  const [showSubterms, setShowSubterms] = useState(false);

  return (
    <DndContext>
      <Stack gap="lg">
        <ProgramRequirementsSection
          expandedProgramCodes={expandedProgramCodes}
          programs={programs}
          readOnly
          onAddCourseToPlanner={noop}
          onOpenCourseDetails={noopOpenCourseDetails}
          onRemoveCourseFromPlanner={noop}
          onToggleProgram={(programCode) => {
            setExpandedProgramCodes((current) => toggleSetValue(current, programCode));
          }}
        />
        <SemesterPlannerSection
          expandedPlannerYearLabels={expandedPlannerYearLabels}
          plannerSaveStatus="saved"
          plannerYears={plannerYears}
          plannerYearsReversed={plannerYearsReversed}
          readOnly
          saveError={null}
          showSubtermToggle={detail.plan.showSubtermPlanner}
          showSubterms={showSubterms}
          onAddYear={noopVoid}
          onOpenCourseDetails={noopOpenCourseDetails}
          onReplacePlaceholderCourse={noop}
          onRemoveCourse={noop}
          onRemoveYear={noopVoid}
          onSave={noopVoid}
          onToggleReverseYears={() => {
            setPlannerYearsReversed((current) => !current);
          }}
          onToggleSubterms={() => {
            setShowSubterms((current) => !current);
          }}
          onToggleYear={(yearLabel) => {
            setExpandedPlannerYearLabels((current) => toggleSetValue(current, yearLabel));
          }}
        />
      </Stack>
    </DndContext>
  );
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function noop() {}

function noopVoid() {}

function noopOpenCourseDetails() {}

function ReviewHistory({ request }: { request: StudentProgramRequestSummaryResponse }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
      <SignatureCard
        title="Department Signature"
        name={request.departmentSignatureName}
        email={request.departmentSignatureEmail ?? request.departmentReviewedByEmail}
        timestamp={request.departmentSignatureAt ?? request.departmentReviewedAt}
        comment={request.departmentComment}
      />
      <SignatureCard
        title="Admin Signature"
        name={request.adminSignatureName}
        email={request.adminSignatureEmail ?? request.adminReviewedByEmail}
        timestamp={request.adminSignatureAt ?? request.adminReviewedAt}
        comment={request.adminComment}
      />
    </SimpleGrid>
  );
}

function SignatureCard({
  comment,
  email,
  name,
  timestamp,
  title,
}: {
  comment: string | null;
  email: string | null;
  name: string | null;
  timestamp: string | null;
  title: string;
}) {
  const hasSignature = name !== null || email !== null || timestamp !== null;

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap={4}>
        <Text fw={700}>{title}</Text>
        {hasSignature ? (
          <>
            <Text>{displayValue(name ?? email)}</Text>
            <Text size="sm" c="dimmed">
              {displayDateTime(timestamp)}
            </Text>
            <Stack gap={2} mt="xs">
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Notes
              </Text>
              <Text size="sm" c={comment ? undefined : 'dimmed'}>
                {comment ?? 'No notes entered.'}
              </Text>
            </Stack>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            Not signed yet.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function displayStudentName(request: StudentProgramRequestSummaryResponse) {
  const preferredName = request.studentPreferredName?.trim();
  const firstName = preferredName || request.studentFirstName?.trim();
  const lastName = request.studentLastName?.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  return displayName || request.studentEmail || 'Student';
}

function displayDepartment(request: StudentProgramRequestSummaryResponse) {
  if (request.departmentName && request.departmentCode) {
    return `${request.departmentName} (${request.departmentCode})`;
  }

  return request.departmentName ?? request.departmentCode ?? '—';
}

function formatProgramVersionOption(
  version: StudentProgramRequestDetailResponse['programVersions'][number]
) {
  const versionLabel = `Version ${version.versionNumber ?? version.programVersionId}`;

  if (version.classYearStart === null && version.classYearEnd === null) {
    return versionLabel;
  }

  if (version.classYearEnd === null) {
    return `${versionLabel}, ${version.classYearStart}+`;
  }

  return `${versionLabel}, ${version.classYearStart ?? 'start'}-${version.classYearEnd}`;
}
