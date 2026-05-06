import { useState } from 'react';
import { Button } from '@mantine/core';
import {
  exploreMyStudentProgram,
  getMyLatestCourseVersion,
  getMyStudentPrograms,
  previewMyStudentAcademicPlan,
  replaceMyAcademicPlanPlaceholderCourse,
  removeMyStudentProgram,
  requestMyStudentProgram,
  saveMyStudentAcademicPlan,
} from '@/services/student-program-service';
import type { ProgramSearchResultResponse } from '@/services/schemas/program-schemas';
import type { StudentProgramsResponse } from '@/services/schemas/student-program-schemas';
import {
  ProgramTrackerExperience,
  type ProgramTrackerExperienceActions,
  type ProgramTrackerExperienceCopy,
} from '@/components/program-tracker/ProgramTrackerExperience';
import { ExploreProgramsModal } from './ExploreProgramsModal';

const studentProgramTrackerActions: ProgramTrackerExperienceActions = {
  loadCourseVersion: getMyLatestCourseVersion,
  loadPrograms: getMyStudentPrograms,
  previewPlan: previewMyStudentAcademicPlan,
  replacePlaceholder: replaceMyAcademicPlanPlaceholderCourse,
  removeProgram: removeMyStudentProgram,
  requestProgram: requestMyStudentProgram,
  savePlan: saveMyStudentAcademicPlan,
};

const baseStudentProgramTrackerCopy: Omit<ProgramTrackerExperienceCopy, 'badge'> = {
  description:
    'Review your declared programs, explore possible programs, and plan requirements before submitting a request.',
  errorTitle: 'Unable to load program tracker',
  eyebrow: 'Student Academics',
  loadingDescription: 'Loading your attached programs and academic plan.',
  loadingMessage: 'Loading program tracker.',
  title: 'My Programs',
};

export function StudentProgramsExperience() {
  const [exploreProgramsOpened, setExploreProgramsOpened] = useState(false);
  const [programTrackerResponse, setProgramTrackerResponse] =
    useState<StudentProgramsResponse | null>(null);

  async function handleAddProgramToPreview(program: ProgramSearchResultResponse) {
    const response = await exploreMyStudentProgram({
      request: { programId: program.programId },
    });

    setProgramTrackerResponse(response);
  }

  const studentProgramTrackerCopy: ProgramTrackerExperienceCopy = {
    ...baseStudentProgramTrackerCopy,
    badge: (
      <Button
        variant="light"
        onClick={() => {
          setExploreProgramsOpened(true);
        }}
      >
        Explore Programs
      </Button>
    ),
  };

  return (
    <>
      <ExploreProgramsModal
        opened={exploreProgramsOpened}
        onAddProgramToPreview={handleAddProgramToPreview}
        onClose={() => {
          setExploreProgramsOpened(false);
        }}
      />
      <ProgramTrackerExperience
        actions={studentProgramTrackerActions}
        copy={studentProgramTrackerCopy}
        programTrackerResponse={programTrackerResponse}
      />
    </>
  );
}
