import { Badge, Group, Stack, Text } from '@mantine/core';
import { DroppablePlannerBucket, DroppablePlannerTerm } from './ProgramTrackerDnd';
import { PlannerCourseRow } from './PlannerCourseRow';
import {
  formatProgramTrackerPlannerCredits,
  getProgramTrackerTermBuckets,
  getProgramTrackerTermCompletedCredits,
  getProgramTrackerTermPlannedCredits,
} from './program-tracker.helpers';
import type {
  ProgramTrackerPlannerBucket,
  ProgramTrackerPlannerCourse,
  ProgramTrackerPlannerTerm,
} from './program-tracker.types';

type PlannerTermPanelProps = {
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  showSubterms: boolean;
  term: ProgramTrackerPlannerTerm;
};

export function PlannerTermPanel({
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  showSubterms,
  term,
}: PlannerTermPanelProps) {
  const completedCredits = getProgramTrackerTermCompletedCredits(term);
  const plannedCredits = getProgramTrackerTermPlannedCredits(term);
  const buckets = getProgramTrackerTermBuckets(term, { includeEmpty: true });

  return (
    <DroppablePlannerTerm term={term} disabled={showSubterms}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="sm" fw={700}>
              {term.label}
            </Text>
            {term.readOnly ? (
              <Badge variant="light" color="blue">
                History
              </Badge>
            ) : term.isComplete ? (
              <Badge variant="light" color="blue">
                Complete
              </Badge>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed" fw={600}>
            {formatProgramTrackerPlannerCredits(completedCredits, plannedCredits)}
          </Text>
        </Group>

        {showSubterms ? (
          <Stack gap="sm">
            {buckets.map((bucket) => (
              <PlannerTermBucketPanel
                key={`${term.code}-${bucket.code}`}
                bucket={bucket}
                term={term}
                termCode={term.code}
                onOpenCourseDetails={onOpenCourseDetails}
                onReplacePlaceholderCourse={onReplacePlaceholderCourse}
                onRemoveCourse={onRemoveCourse}
              />
            ))}
          </Stack>
        ) : (
          <PlannerTermCourseList
            courses={term.courses}
            termCode={term.code}
            onOpenCourseDetails={onOpenCourseDetails}
            onReplacePlaceholderCourse={onReplacePlaceholderCourse}
            onRemoveCourse={onRemoveCourse}
          />
        )}
      </Stack>
    </DroppablePlannerTerm>
  );
}

function PlannerTermBucketPanel({
  bucket,
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  term,
  termCode,
}: {
  bucket: ProgramTrackerPlannerBucket;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  term: ProgramTrackerPlannerTerm;
  termCode: string;
}) {
  const completedCredits = bucket.courses
    .filter((course) => course.readOnly || course.status === 'complete')
    .reduce((total, course) => total + course.credits, 0);
  const plannedCredits = bucket.courses
    .filter((course) => !course.readOnly && course.status === 'planned')
    .reduce((total, course) => total + course.credits, 0);

  return (
    <DroppablePlannerBucket bucket={bucket} term={term}>
      <Stack gap={4}>
        <Stack gap={4} pb={4} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              {bucket.label}
            </Text>
            <Text size="xs" c="dimmed" fw={600}>
              {formatProgramTrackerPlannerCredits(completedCredits, plannedCredits)}
            </Text>
          </Group>
        </Stack>
        <PlannerTermCourseList
          courses={bucket.courses}
          hideFirstCourseTopBorder
          termCode={termCode}
          onOpenCourseDetails={onOpenCourseDetails}
          onReplacePlaceholderCourse={onReplacePlaceholderCourse}
          onRemoveCourse={onRemoveCourse}
        />
      </Stack>
    </DroppablePlannerBucket>
  );
}

function PlannerTermCourseList({
  courses,
  hideFirstCourseTopBorder = false,
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  termCode,
}: {
  courses: ProgramTrackerPlannerCourse[];
  hideFirstCourseTopBorder?: boolean;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  termCode: string;
}) {
  if (courses.length === 0) {
    return (
      <Text size="sm" c="dimmed" py={6}>
        No courses planned.
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {courses.map((course, index) => (
        <PlannerCourseRow
          key={`${termCode}-${course.plannerCourseId ?? course.plannerClientId ?? course.code}`}
          course={course}
          hideTopBorder={hideFirstCourseTopBorder && index === 0}
          termCode={termCode}
          onOpenCourseDetails={onOpenCourseDetails}
          onReplacePlaceholderCourse={onReplacePlaceholderCourse}
          onRemoveCourse={onRemoveCourse}
        />
      ))}
    </Stack>
  );
}
