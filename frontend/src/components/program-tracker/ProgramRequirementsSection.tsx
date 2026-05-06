import { Alert, Grid, Stack } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ProgramTrackerProgramCard } from './ProgramTrackerProgramCard';
import type { ProgramTrackerCourseSelection, ProgramTrackerProgram } from './program-tracker.types';

type ProgramRequirementsSectionProps = {
  expandedProgramCodes: Set<string>;
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onRemoveProgram?: (studentProgramId: number) => void;
  onRequestProgram?: (studentProgramId: number) => void;
  onToggleProgram: (programCode: string) => void;
  programRemoveError?: string | null;
  programRequestError?: string | null;
  programs: ProgramTrackerProgram[];
  removingStudentProgramId?: number | null;
  requestingStudentProgramId?: number | null;
};

export function ProgramRequirementsSection({
  expandedProgramCodes,
  onAddCourseToPlanner,
  onOpenCourseDetails,
  onRemoveCourseFromPlanner,
  onRemoveProgram,
  onRequestProgram,
  onToggleProgram,
  programRemoveError,
  programRequestError,
  programs,
  removingStudentProgramId,
  requestingStudentProgramId,
}: ProgramRequirementsSectionProps) {
  return (
    <RecordPageSection
      title="Current Programs"
      description="Programs attached to your academic record."
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          {programRemoveError ? (
            <Alert color="red" title="Unable to remove program">
              {programRemoveError}
            </Alert>
          ) : null}
          {programRequestError ? (
            <Alert color="red" title="Unable to request program">
              {programRequestError}
            </Alert>
          ) : null}

          {programs.map((program) => (
            <ProgramTrackerProgramCard
              key={program.code}
              expanded={expandedProgramCodes.has(program.code)}
              program={program}
              removing={removingStudentProgramId === program.studentProgramId}
              requesting={requestingStudentProgramId === program.studentProgramId}
              onAddCourseToPlanner={onAddCourseToPlanner}
              onOpenCourseDetails={onOpenCourseDetails}
              onRemoveCourseFromPlanner={onRemoveCourseFromPlanner}
              onRemoveProgram={onRemoveProgram}
              onRequestProgram={onRequestProgram}
              onToggleProgram={onToggleProgram}
            />
          ))}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
