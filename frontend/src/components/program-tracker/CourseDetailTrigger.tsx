// Clickable course code for opening course-version details.
import { Text, UnstyledButton } from '@mantine/core';

type CourseDetailTriggerProps = {
  code: string;
  courseId?: number;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
};

export function CourseDetailTrigger({
  code,
  courseId,
  onOpenCourseDetails,
}: CourseDetailTriggerProps) {
  const content = (
    <Text size="sm" fw={600} c={courseId ? 'blue' : undefined}>
      {code}
    </Text>
  );

  if (!courseId) {
    return content;
  }

  return (
    <UnstyledButton
      onClick={(event) => {
        event.stopPropagation();
        onOpenCourseDetails(courseId, code);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      {content}
    </UnstyledButton>
  );
}
