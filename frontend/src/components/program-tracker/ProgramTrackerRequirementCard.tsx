import { Paper, Stack, Text } from '@mantine/core';
import { ProgramTrackerElectivePlaceholderAction } from './ProgramTrackerElectivePlaceholderAction';
import { ProgramTrackerRequirementCourseTable } from './ProgramTrackerRequirementCourseTable';
import { StatusProgress } from './StatusProgress';
import { formatRequirementProgress } from './program-tracker.helpers';
import {
  buildElectivePlaceholderSelection,
  canPlanElectivePlaceholder,
} from './programTrackerRequirementStatus';
import type {
  ProgramTrackerCourseSelection,
  ProgramTrackerProgram,
  ProgramTrackerRequirement,
} from './program-tracker.types';

type ProgramTrackerRequirementCardProps = {
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: ProgramTrackerCourseSelection) => void;
  program: ProgramTrackerProgram;
  readOnly?: boolean;
  requirement: ProgramTrackerRequirement;
};

export function ProgramTrackerRequirementCard({
  onAddCourseToPlanner,
  onOpenCourseDetails,
  onRemoveCourseFromPlanner,
  program,
  readOnly = false,
  requirement,
}: ProgramTrackerRequirementCardProps) {
  return (
    <Paper withBorder radius="sm" p="sm">
      <Stack gap="sm">
        <Stack gap={4}>
          <Text size="sm" fw={600}>
            {requirement.label}
          </Text>
          <Text size="xs" c="dimmed">
            {formatRequirementProgress(requirement)}
          </Text>
          <StatusProgress
            completed={requirement.completed}
            planned={requirement.planned}
            required={requirement.required}
            size="xs"
          />
        </Stack>

        {requirement.courses.length > 0 ? (
          <ProgramTrackerRequirementCourseTable
            program={program}
            requirement={requirement}
            readOnly={readOnly}
            onAddCourseToPlanner={onAddCourseToPlanner}
            onOpenCourseDetails={onOpenCourseDetails}
            onRemoveCourseFromPlanner={onRemoveCourseFromPlanner}
          />
        ) : !readOnly && canPlanElectivePlaceholder(requirement) ? (
          <ProgramTrackerElectivePlaceholderAction
            selection={buildElectivePlaceholderSelection({
              program,
              requirement,
              rule: requirement.courseRules[0],
            })}
            requirement={requirement}
            onAddCourseToPlanner={onAddCourseToPlanner}
          />
        ) : null}
      </Stack>
    </Paper>
  );
}
