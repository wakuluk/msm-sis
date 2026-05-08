import { useState } from 'react';
import type {
  PlannerBucketCode,
  ProgramTrackerCourseSelection,
  ProgramTrackerPlannerDropTarget,
} from './program-tracker.types';

export function usePlannerCourseSelection({
  firstAvailableTermCode,
  onAddCourseToPlanner,
}: {
  firstAvailableTermCode: string | null;
  onAddCourseToPlanner: (
    selection: ProgramTrackerCourseSelection,
    target: ProgramTrackerPlannerDropTarget
  ) => void;
}) {
  const [plannerCourseSelection, setPlannerCourseSelection] =
    useState<ProgramTrackerCourseSelection | null>(null);
  const [selectedPlannerBucketCode, setSelectedPlannerBucketCode] =
    useState<PlannerBucketCode>('FULL_TERM');
  const [selectedPlannerTermCode, setSelectedPlannerTermCode] = useState<string | null>(null);

  function openAddCourseToPlannerModal(selection: ProgramTrackerCourseSelection) {
    setPlannerCourseSelection(selection);
    setSelectedPlannerBucketCode('FULL_TERM');
    setSelectedPlannerTermCode(firstAvailableTermCode);
  }

  function closeAddCourseToPlannerModal() {
    setPlannerCourseSelection(null);
    setSelectedPlannerBucketCode('FULL_TERM');
    setSelectedPlannerTermCode(null);
  }

  function addSelectedCourseToPlanner() {
    if (!plannerCourseSelection || !selectedPlannerTermCode) {
      return;
    }

    onAddCourseToPlanner(plannerCourseSelection, {
      bucketCode: selectedPlannerBucketCode,
      termCode: selectedPlannerTermCode,
    });
    closeAddCourseToPlannerModal();
  }

  return {
    addSelectedCourseToPlanner,
    closeAddCourseToPlannerModal,
    openAddCourseToPlannerModal,
    plannerCourseSelection,
    selectedPlannerBucketCode,
    selectedPlannerTermCode,
    setSelectedPlannerBucketCode,
    setSelectedPlannerTermCode,
  };
}
