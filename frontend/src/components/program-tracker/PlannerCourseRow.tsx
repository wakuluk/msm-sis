import { ActionIcon, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconSearch, IconTrash } from '@tabler/icons-react';
import { DraggablePlannerCourseRow } from './ProgramTrackerDnd';
import {
  getCourseStatusColor,
  getCourseStatusLabel,
  getProgramTrackerCourseKey,
} from './program-tracker.helpers';
import type { ProgramTrackerPlannerCourse } from './program-tracker.types';

type PlannerCourseRowProps = {
  course: ProgramTrackerPlannerCourse;
  hideTopBorder?: boolean;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  termCode: string;
};

export function PlannerCourseRow({
  course,
  hideTopBorder = false,
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  termCode,
}: PlannerCourseRowProps) {
  const courseRowContent = (
    <>
      <PlannerCourseDetailTrigger course={course} onOpenCourseDetails={onOpenCourseDetails} />
      <Group gap="xs" align="center">
        <Text size="xs" c={getCourseStatusColor(course.status)} fw={600}>
          {getCourseStatusLabel(course.status)}
        </Text>
        {course.status === 'planned' ? (
          <>
            {course.placeholderType ? (
              <Tooltip label="Choose course">
                <ActionIcon
                  variant="subtle"
                  aria-label={`Choose course for ${course.code}`}
                  onClick={() => {
                    onReplacePlaceholderCourse(course);
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <IconSearch size={16} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            <Tooltip label="Remove from planner">
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label={`Remove ${course.code} from planner`}
                onClick={() => {
                  onRemoveCourse(termCode, course);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </>
        ) : null}
      </Group>
    </>
  );
  const readOnlyRowStyle = course.readOnly
    ? {
        backgroundColor: 'var(--mantine-color-gray-0)',
        borderLeft: '3px solid var(--mantine-color-blue-3)',
        paddingLeft: 'var(--mantine-spacing-xs)',
      }
    : {};

  return course.status === 'planned' ? (
    <DraggablePlannerCourseRow
      key={`${termCode}-${getProgramTrackerCourseKey(course)}`}
      course={course}
      hideTopBorder={hideTopBorder}
      termCode={termCode}
    >
      {courseRowContent}
    </DraggablePlannerCourseRow>
  ) : (
    <Group
      key={`${termCode}-${getProgramTrackerCourseKey(course)}`}
      justify="space-between"
      align="flex-start"
      py={6}
      style={{
        borderTop: hideTopBorder ? undefined : '1px solid var(--mantine-color-gray-2)',
        ...readOnlyRowStyle,
      }}
    >
      {courseRowContent}
    </Group>
  );
}

function PlannerCourseWarnings({ course }: { course: ProgramTrackerPlannerCourse }) {
  if (!course.warnings?.length) {
    return null;
  }

  return (
    <Tooltip
      withArrow
      multiline
      w={320}
      label={
        <Stack gap={4}>
          {course.warnings.map((warning) => (
            <Text key={warning} size="xs">
              {warning}
            </Text>
          ))}
        </Stack>
      }
    >
      <ActionIcon
        variant="subtle"
        color="yellow"
        aria-label={`${course.code} planner warning`}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <IconAlertTriangle size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

function PlannerCourseDetailTrigger({
  course,
  onOpenCourseDetails,
}: {
  course: ProgramTrackerPlannerCourse;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
}) {
  const creditLabel = course.readOnly ? 'completed credits' : 'credits';

  const content = (
    <Stack gap={2}>
      <Group gap="xs">
        <Text size="sm" fw={600} c={course.courseId ? 'blue' : undefined}>
          {course.code}
        </Text>
        <Text size="xs" c="dimmed">
          {course.credits} {creditLabel}
        </Text>
        {course.gradeCode ? (
          <Text size="xs" c="dimmed">
            Grade {course.gradeCode}
          </Text>
        ) : null}
        <PlannerCourseWarnings course={course} />
      </Group>
      <Text size="xs" c="dimmed">
        {course.requirement}
      </Text>
    </Stack>
  );

  if (!course.courseId) {
    return content;
  }

  return (
    <UnstyledButton
      onClick={(event) => {
        event.stopPropagation();
        onOpenCourseDetails(course.courseId as number, course.code);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      {content}
    </UnstyledButton>
  );
}
