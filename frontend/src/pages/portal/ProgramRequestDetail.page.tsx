import { useEffect, useState } from 'react';
import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import { ProgramRequestDetailPanel } from '@/components/program-requests/ProgramRequestDetailPanel';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { hasPortalRole, PORTAL_ROLES } from '@/portal/PortalRoles';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import {
  adminApproveProgramRequest,
  departmentApproveProgramRequest,
  getProgramRequestDetail,
  getStudentProgramReviewDetail,
  rejectProgramRequest,
} from '@/services/student-program-service';
import type {
  StudentProgramRequestDetailResponse,
  StudentProgramRequestSummaryResponse,
  StudentProgramReviewDetailResponse,
  StudentProgramReviewSummaryResponse,
} from '@/services/schemas/student-program-schemas';
import { getErrorMessage } from '@/utils/errors';

type ProgramRequestDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: StudentProgramRequestDetailResponse };

export function ProgramRequestDetailPage() {
  const tokenData = useAccessTokenData();
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/degree-requests',
  });
  const { studentProgramId, studentProgramRequestId } = useParams<{
    studentProgramId?: string;
    studentProgramRequestId?: string;
  }>();
  const parsedStudentProgramId = Number(studentProgramId);
  const parsedStudentProgramRequestId = Number(studentProgramRequestId);
  const hasValidStudentProgramId =
    Number.isInteger(parsedStudentProgramId) && parsedStudentProgramId > 0;
  const hasValidStudentProgramRequestId =
    Number.isInteger(parsedStudentProgramRequestId) && parsedStudentProgramRequestId > 0;
  const pageTitle = hasValidStudentProgramRequestId
    ? 'Degree Request Detail'
    : 'Student Program Detail';
  const pageDescription = hasValidStudentProgramRequestId
    ? 'Review the student request, program plan, and approval history.'
    : 'Review the assigned program, student plan, and approval history.';
  const canAdminApprove = hasPortalRole(tokenData?.roles, PORTAL_ROLES.ADMIN);
  const canDepartmentApprove = hasPortalRole(tokenData?.roles, PORTAL_ROLES.DEPARTMENT_HEAD);
  const [pageState, setPageState] = useState<ProgramRequestDetailPageState>({
    status: 'loading',
  });

  useEffect(() => {
    if (!hasValidStudentProgramRequestId && !hasValidStudentProgramId) {
      setPageState({
        status: 'error',
        message: 'Program request or student program ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    const detailRequest = hasValidStudentProgramRequestId
      ? getProgramRequestDetail({
          studentProgramRequestId: parsedStudentProgramRequestId,
          signal: abortController.signal,
        })
      : getStudentProgramReviewDetail({
          studentProgramId: parsedStudentProgramId,
          signal: abortController.signal,
        }).then(mapStudentProgramReviewDetailToRequestDetail);

    detailRequest
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program request detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [
    hasValidStudentProgramId,
    hasValidStudentProgramRequestId,
    parsedStudentProgramId,
    parsedStudentProgramRequestId,
  ]);

  async function handleDepartmentApprove(comment: string | null, programVersionId: number | null) {
    const currentRequestId = resolveCurrentRequestId(pageState);
    const response = await departmentApproveProgramRequest({
      studentProgramRequestId: currentRequestId,
      request: { comment, programVersionId },
    });

    setPageState({ status: 'success', response });
  }

  async function handleAdminApprove(comment: string | null, programVersionId: number | null) {
    const currentRequestId = resolveCurrentRequestId(pageState);
    const response = await adminApproveProgramRequest({
      studentProgramRequestId: currentRequestId,
      request: { comment, programVersionId },
    });

    setPageState({ status: 'success', response });
  }

  async function handleReject(comment: string) {
    const currentRequestId = resolveCurrentRequestId(pageState);
    const response = await rejectProgramRequest({
      studentProgramRequestId: currentRequestId,
      request: { comment, programVersionId: null },
    });

    setPageState({ status: 'success', response });
  }

  return (
    <RecordPageShell
      eyebrow="Academic Administration"
      title={pageTitle}
      description={pageDescription}
      badge={
        <Button onClick={handleBack} variant="default">
          Back
        </Button>
      }
      size="xl"
    >
      <Stack gap="lg">
        {pageState.status === 'loading' ? (
          <RecordPageSection title="Request Detail">
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading request detail.
              </Text>
            </Group>
          </RecordPageSection>
        ) : null}

        {pageState.status === 'error' ? (
          <RecordPageSection title="Request Detail">
            <Alert color="red" title="Unable to load request detail">
              {pageState.message}
            </Alert>
            <Group justify="flex-end" mt="md">
              <Button onClick={handleBack} variant="default">
                Back
              </Button>
            </Group>
          </RecordPageSection>
        ) : null}

        {pageState.status === 'success' ? (
          <ProgramRequestDetailPanel
            canAdminApprove={canAdminApprove}
            canDepartmentApprove={canDepartmentApprove}
            detail={pageState.response}
            onAdminApprove={handleAdminApprove}
            onDepartmentApprove={handleDepartmentApprove}
            onReject={handleReject}
          />
        ) : null}
      </Stack>
    </RecordPageShell>
  );
}

function resolveCurrentRequestId(pageState: ProgramRequestDetailPageState) {
  if (pageState.status !== 'success' || pageState.response.request.studentProgramRequestId === null) {
    throw new Error('This student program does not have an active request to review.');
  }

  return pageState.response.request.studentProgramRequestId;
}

function mapStudentProgramReviewDetailToRequestDetail(
  response: StudentProgramReviewDetailResponse
): StudentProgramRequestDetailResponse {
  return {
    request: response.request ?? mapStudentProgramReviewSummaryToRequestSummary(response.studentProgram),
    programVersions: response.programVersions,
    plan: response.plan,
  };
}

function mapStudentProgramReviewSummaryToRequestSummary(
  studentProgram: StudentProgramReviewSummaryResponse
): StudentProgramRequestSummaryResponse {
  return {
    studentProgramRequestId: null,
    status: studentProgram.status ?? 'ACTIVE',
    requestedAt: null,
    studentId: studentProgram.studentId,
    studentFirstName: studentProgram.studentFirstName,
    studentLastName: studentProgram.studentLastName,
    studentPreferredName: studentProgram.studentPreferredName,
    studentEmail: studentProgram.studentEmail,
    classStandingName: studentProgram.classStandingName,
    estimatedGradDate: studentProgram.estimatedGradDate,
    programId: studentProgram.programId,
    programVersionId: studentProgram.programVersionId,
    programVersionNumber: studentProgram.programVersionNumber,
    programVersionClassYearStart: studentProgram.programVersionClassYearStart,
    programVersionClassYearEnd: studentProgram.programVersionClassYearEnd,
    programCode: studentProgram.programCode,
    programName: studentProgram.programName,
    programTypeCode: studentProgram.programTypeCode,
    programTypeName: studentProgram.programTypeName,
    degreeTypeCode: studentProgram.degreeTypeCode,
    degreeTypeName: studentProgram.degreeTypeName,
    schoolId: studentProgram.schoolId,
    schoolCode: studentProgram.schoolCode,
    schoolName: studentProgram.schoolName,
    departmentId: studentProgram.departmentId,
    departmentCode: studentProgram.departmentCode,
    departmentName: studentProgram.departmentName,
    departmentReviewedAt: null,
    departmentReviewedByEmail: null,
    departmentSignatureAt: null,
    departmentSignatureName: null,
    departmentSignatureEmail: null,
    departmentComment: null,
    adminReviewedAt: null,
    adminReviewedByEmail: null,
    adminSignatureAt: null,
    adminSignatureName: null,
    adminSignatureEmail: null,
    adminComment: null,
  };
}
