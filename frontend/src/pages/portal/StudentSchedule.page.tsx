import { Badge } from '@mantine/core';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { StudentSchedulePanel } from '@/components/student-schedule/StudentSchedulePanel';
import { getMyStudentSchedule } from '@/services/student-schedule-service';

export function StudentSchedulePage() {
  return (
    <RecordPageShell
      title="My Schedule"
      eyebrow="Student Schedule"
      description="Review courses that belong on your term schedule. Dropped and withdrawn courses stay separate from the calendar."
      badge={
        <Badge size="lg" variant="light" color="green">
          Student View
        </Badge>
      }
      size="xl"
    >
      <StudentSchedulePanel
        loadSchedule={getMyStudentSchedule}
        loadingMessage="Loading your course schedule."
        emptyActivityMessage="No local enrollment activity is available for your schedule yet."
      />
    </RecordPageShell>
  );
}
