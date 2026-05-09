import { useEffect, useState } from 'react';
import { Alert, Badge, Group, Loader, Stack, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { TeachingScheduleDetail } from '@/components/teaching-schedule/TeachingScheduleDetail';
import { mapInstructorScheduleResponseToTeachingScheduleDetail } from '@/components/teaching-schedule/teachingScheduleMapper';
import { PORTAL_ROLES, hasPortalRole } from '@/portal/PortalRoles';
import {
  getInstructorSchedule,
  getMyInstructorSchedule,
} from '@/services/instructor-schedule-service';
import { getInstructorScheduleReferenceOptions } from '@/services/reference-service';
import type { TeachingScheduleDetail as TeachingScheduleDetailModel } from '@/components/teaching-schedule/teachingSchedule.types';
import { getErrorMessage } from '@/utils/errors';

type TeachingScheduleDetailState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; detail: TeachingScheduleDetailModel };

export function TeachingSchedulePage() {
  const { instructorId } = useParams();
  const tokenData = useAccessTokenData();
  const isAdmin = hasPortalRole(tokenData?.roles, PORTAL_ROLES.ADMIN);
  const isReviewMode = Boolean(instructorId);
  const [detailState, setDetailState] = useState<TeachingScheduleDetailState>({ status: 'idle' });

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    const instructorUserId = instructorId ? Number(instructorId) : null;

    if (instructorId && (!Number.isFinite(instructorUserId) || instructorUserId === null)) {
      setDetailState({ status: 'error', message: 'Instructor schedule id is invalid.' });
      return () => {
        abortController.abort();
      };
    }

    setDetailState({ status: 'loading' });

    const schedulePromise =
      instructorUserId === null
        ? getMyInstructorSchedule({
            size: 100,
            sortBy: 'academicYear',
            sortDirection: 'asc',
            signal: abortController.signal,
          })
        : getInstructorSchedule({
            userId: instructorUserId,
            size: 100,
            sortBy: 'academicYear',
            sortDirection: 'asc',
            signal: abortController.signal,
          });

    Promise.all([schedulePromise, getInstructorScheduleReferenceOptions()])
      .then(([scheduleResponse, referenceOptions]) => {
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'success',
          detail: mapInstructorScheduleResponseToTeachingScheduleDetail(
            scheduleResponse,
            referenceOptions
          ),
        });
      })
      .catch((error) => {
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load instructor schedule.'),
        });
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [instructorId]);

  function renderDetailContent() {
    switch (detailState.status) {
      case 'idle':
      case 'loading':
        return (
          <Group gap="sm">
            <Loader size="sm" />
            <Text c="dimmed">Loading instructor schedule...</Text>
          </Group>
        );
      case 'error':
        return (
          <Alert color="red" title="Unable to load instructor schedule">
            {detailState.message}
          </Alert>
        );
      case 'success':
        return (
          <TeachingScheduleDetail
            detail={detailState.detail}
            mode={isReviewMode ? 'admin' : 'staff'}
          />
        );
    }
  }

  return (
    <RecordPageShell
      title={isReviewMode ? 'Instructor Schedule Review' : 'My Schedule'}
      eyebrow="Schedule Detail"
      description={
        isReviewMode
          ? 'Read-only instructor schedule pattern for checking term assignments and meeting overlaps.'
          : 'Read-only weekly pattern of your assigned course sections for a term.'
      }
      badge={
        <Badge size="lg" variant="light" color={isAdmin ? 'violet' : 'blue'}>
          {isReviewMode ? 'Review View' : 'Instructor View'}
        </Badge>
      }
      size="xl"
    >
      <Stack gap="lg">{renderDetailContent()}</Stack>
    </RecordPageShell>
  );
}
