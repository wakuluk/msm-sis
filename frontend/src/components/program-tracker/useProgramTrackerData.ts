import { type Dispatch, type SetStateAction, useState } from 'react';
import type { StudentProgramsResponse } from '@/services/schemas/student-program-schemas';
import {
  mapAcademicPlanResponseToProgramTrackerYears,
  mapProgramTrackerResponseToPrograms,
} from './program-tracker.mappers';
import type { ProgramTrackerPlannerYear, ProgramTrackerProgram } from './program-tracker.types';

export function useProgramTrackerData({
  setExpandedPlannerYearLabels,
  setPlannerYears,
}: {
  setExpandedPlannerYearLabels: Dispatch<SetStateAction<Set<string>>>;
  setPlannerYears: Dispatch<SetStateAction<ProgramTrackerPlannerYear[]>>;
}) {
  const [programPreviews, setProgramPreviews] = useState<ProgramTrackerProgram[]>([]);
  const [academicPlanId, setAcademicPlanId] = useState<number | null>(null);
  const [academicPlanName, setAcademicPlanName] = useState('My Academic Plan');
  const [showSubtermPlanner, setShowSubtermPlanner] = useState(false);

  function initializeProgramTracker(response: StudentProgramsResponse) {
    const programs = applyProgramTrackerResponse(response);
    setExpandedPlannerYearLabels(
      new Set(response.academicPlan.years.map((year) => year.label))
    );
    return programs;
  }

  function applyProgramTrackerResponse(
    response: StudentProgramsResponse,
    options: { updatePlanIdentity?: boolean } = {}
  ) {
    const updatePlanIdentity = options.updatePlanIdentity ?? true;
    const programs = mapProgramTrackerResponseToPrograms(response);
    const years = mapAcademicPlanResponseToProgramTrackerYears(response.academicPlan);

    setProgramPreviews(programs);
    setShowSubtermPlanner(response.showSubtermPlanner);
    if (updatePlanIdentity && response.academicPlan.studentAcademicPlanId > 0) {
      setAcademicPlanId(response.academicPlan.studentAcademicPlanId);
      setAcademicPlanName(response.academicPlan.name);
    }
    setPlannerYears(years);
    setExpandedPlannerYearLabels((current) => {
      const next = new Set<string>();
      years.forEach((year) => {
        if (current.has(year.label) || current.size === 0) {
          next.add(year.label);
        }
      });
      return next;
    });

    return programs;
  }

  return {
    academicPlanId,
    academicPlanName,
    applyProgramTrackerResponse,
    initializeProgramTracker,
    programPreviews,
    setProgramPreviews,
    showSubtermPlanner,
  };
}
