import { Badge } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { TeachingScheduleDetail } from '@/components/teaching-schedule/TeachingScheduleDetail';
import { PORTAL_ROLES, hasPortalRole } from '@/portal/PortalRoles';

export function TeachingSchedulePage() {
  const { instructorId } = useParams();
  const tokenData = useAccessTokenData();
  const isAdmin = hasPortalRole(tokenData?.roles, PORTAL_ROLES.ADMIN);
  const isReviewMode = Boolean(instructorId);

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
      <TeachingScheduleDetail mode={isReviewMode ? 'admin' : 'staff'} />
    </RecordPageShell>
  );
}
