import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type {
  StudentAcademicPlanDraftRequest,
  StudentAcademicPlanResponse,
  StudentProgramsResponse,
} from '@/services/schemas/student-program-schemas';
import {
  createNextEmptyProgramTrackerYear,
  findProgramTrackerTerm,
  getProgramTrackerBucketLabel,
  getProgramTrackerTermOptions,
  isSameProgramTrackerCourse,
} from './program-tracker.helpers';
import type {
  ProgramTrackerCourseMoveSelection,
  ProgramTrackerPlannerCourse,
  ProgramTrackerCourseSelection,
  ProgramTrackerPlannerDropTarget,
  ProgramTrackerPlannerYear,
  RequirementCourseStatus,
} from './program-tracker.types';
import { usePlannerCourseSelection } from './usePlannerCourseSelection';
import { usePlannerPlaceholderReplacement } from './usePlannerPlaceholderReplacement';
import { usePlannerPersistence } from './usePlannerPersistence';
import { useProgramTrackerData } from './useProgramTrackerData';

export type ProgramTrackerPlannerActions = {
  loadPrograms: (request?: { signal?: AbortSignal }) => Promise<StudentProgramsResponse>;
  previewPlan: (request: {
    request: StudentAcademicPlanDraftRequest;
    signal?: AbortSignal;
  }) => Promise<StudentProgramsResponse>;
  savePlan: (request: {
    request: StudentAcademicPlanDraftRequest;
    signal?: AbortSignal;
  }) => Promise<StudentAcademicPlanResponse>;
};

export function useProgramPlanner({ actions }: { actions: ProgramTrackerPlannerActions }) {
  const [plannerYears, setPlannerYears] = useState<ProgramTrackerPlannerYear[]>([]);
  const [expandedPlannerYearLabels, setExpandedPlannerYearLabels] = useState<Set<string>>(
    () => new Set()
  );
  const [plannerYearsReversed, setPlannerYearsReversed] = useState(false);

  const plannerTermOptions = getProgramTrackerTermOptions(plannerYears);
  const {
    academicPlanId,
    academicPlanName,
    applyProgramTrackerResponse,
    initializeProgramTracker: initializeProgramTrackerData,
    programPreviews,
    setProgramPreviews,
    showSubtermPlanner,
  } = useProgramTrackerData({
    setExpandedPlannerYearLabels,
    setPlannerYears,
  });
  const {
    clearPlannerSaveError,
    markPlannerSaved,
    markPlannerUnsaved,
    plannerSaveError,
    plannerSaveStatus,
    savePlanner,
    schedulePlannerPreview,
  } = usePlannerPersistence({
    academicPlanId,
    academicPlanName,
    actions,
    applyProgramTrackerResponse,
    plannerYears,
  });
  const {
    addSelectedCourseToPlanner,
    closeAddCourseToPlannerModal,
    openAddCourseToPlannerModal,
    plannerCourseSelection,
    selectedPlannerBucketCode,
    selectedPlannerTermCode,
    setSelectedPlannerBucketCode,
    setSelectedPlannerTermCode,
  } = usePlannerCourseSelection({
    firstAvailableTermCode: plannerTermOptions.find((option) => !option.disabled)?.value ?? null,
    onAddCourseToPlanner: addCourseSelectionToPlanner,
  });

  function createPlannerClientId(selection: ProgramTrackerCourseSelection) {
    return [
      'planned',
      selection.programCode,
      selection.requirementId ?? selection.requirementLabel,
      selection.courseId ?? selection.placeholderType ?? selection.courseCode,
      Date.now(),
      Math.random().toString(36).slice(2),
    ].join('-');
  }

  function initializeProgramTracker(response: StudentProgramsResponse) {
    const programs = initializeProgramTrackerData(response);
    markPlannerSaved();
    return programs;
  }

  function updatePlannerYearsWithPreview(
    updater: (current: ProgramTrackerPlannerYear[]) => ProgramTrackerPlannerYear[]
  ) {
    setPlannerYears((current) => {
      const nextYears = updater(current);
      schedulePlannerPreview(nextYears);
      return nextYears;
    });
    markPlannerUnsaved();
  }

  function addPlannerYear() {
    updatePlannerYearsWithPreview((current) => {
      const nextYear = createNextEmptyProgramTrackerYear(current);
      setExpandedPlannerYearLabels((expandedLabels) => new Set(expandedLabels).add(nextYear.label));

      return [...current, nextYear];
    });
  }

  function togglePlannerYear(yearLabel: string) {
    setExpandedPlannerYearLabels((current) => {
      const next = new Set(current);

      if (next.has(yearLabel)) {
        next.delete(yearLabel);
      } else {
        next.add(yearLabel);
      }

      return next;
    });
  }

  function removePlannerYear(yearLabel: string) {
    updatePlannerYearsWithPreview((current) =>
      current.filter((year) => year.label !== yearLabel || !year.canRemove)
    );
    setExpandedPlannerYearLabels((current) => {
      const next = new Set(current);
      next.delete(yearLabel);
      return next;
    });
  }

  function addCourseSelectionToPlanner(
    selection: ProgramTrackerCourseSelection,
    target: ProgramTrackerPlannerDropTarget | string
  ) {
    const dropTarget = normalizePlannerDropTarget(target);
    const { bucketCode, termCode } = dropTarget;
    const targetTerm = findProgramTrackerTerm(plannerYears, termCode);

    if (targetTerm?.isComplete) {
      return;
    }

    updatePlannerYearsWithPreview((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => {
          if (term.code !== termCode) {
            return term;
          }

          const courseAlreadyPlanned =
            selection.courseId !== undefined &&
            term.courses.some((course) => course.courseId === selection.courseId);

          if (courseAlreadyPlanned) {
            return term;
          }

          return {
            ...term,
            courses: [
              ...term.courses,
              {
                code: selection.courseCode,
                courseId: selection.courseId,
                credits: selection.credits ?? 0,
                placeholderDepartmentCode: selection.placeholderDepartmentCode,
                placeholderDepartmentId: selection.placeholderDepartmentId,
                placeholderLabel: selection.placeholderLabel,
                placeholderMaximumCourseNumber: selection.placeholderMaximumCourseNumber,
                placeholderMinimumCourseNumber: selection.placeholderMinimumCourseNumber,
                placeholderSubjectCode: selection.placeholderSubjectCode,
                placeholderType: selection.placeholderType,
                plannerBucketCode: bucketCode,
                plannerBucketLabel: getProgramTrackerBucketLabel(bucketCode),
                plannerClientId: createPlannerClientId(selection),
                programCode: selection.programCode,
                programName: selection.programName,
                requirement: selection.requirementLabel,
                requirementId: selection.requirementId,
                status: 'planned',
                studentProgramId: selection.studentProgramId,
                title: selection.title,
              },
            ],
          };
        }),
      }))
    );

    setProgramPreviews((current) =>
      current.map((program) => {
        if (program.code !== selection.programCode) {
          return program;
        }

        return {
          ...program,
          requirements: program.requirements.map((requirement) => {
            if (requirement.label !== selection.requirementLabel) {
              return requirement;
            }

            return {
              ...requirement,
              courses: requirement.courses.map((course) =>
                course.code === selection.courseCode
                  ? { ...course, status: 'planned' }
                  : course
              ),
            };
          }),
        };
      })
    );
  }

  function movePlannerCourse(
    selection: ProgramTrackerCourseMoveSelection,
    target: ProgramTrackerPlannerDropTarget | string
  ) {
    const dropTarget = normalizePlannerDropTarget(target);
    const { bucketCode, termCode: targetTermCode } = dropTarget;

    if (
      selection.sourceTermCode === targetTermCode &&
      (selection.sourceBucketCode ?? 'FULL_TERM') === bucketCode
    ) {
      return;
    }

    const targetTerm = findProgramTrackerTerm(plannerYears, targetTermCode);

    if (targetTerm?.isComplete) {
      return;
    }

    updatePlannerYearsWithPreview((current) =>
      current.map((year) => {
        const targetAlreadyHasCourse =
          selection.sourceTermCode !== targetTermCode &&
          selection.course.courseId !== undefined &&
          current.some((currentYear) =>
            currentYear.terms.some(
              (term) =>
                term.code === targetTermCode &&
                term.courses.some((course) => course.courseId === selection.course.courseId)
            )
          );

        if (targetAlreadyHasCourse) {
          return year;
        }

        return {
          ...year,
          terms: year.terms.map((term) => {
            if (term.code === selection.sourceTermCode && term.code !== targetTermCode) {
              return {
                ...term,
                courses: term.courses.filter(
                  (course) => !isSameProgramTrackerCourse(course, selection.course)
                ),
              };
            }

            if (term.code === targetTermCode) {
              const movedCourse = {
                ...selection.course,
                plannerBucketCode: bucketCode,
                plannerBucketLabel: getProgramTrackerBucketLabel(bucketCode),
              };

              return {
                ...term,
                courses:
                  selection.sourceTermCode === targetTermCode
                    ? term.courses.map((course) =>
                        isSameProgramTrackerCourse(course, selection.course) ? movedCourse : course
                      )
                    : [...term.courses, movedCourse],
              };
            }

            return term;
          }),
        };
      })
    );
  }

  function updateRequirementCourseStatus(
    courseCode: string,
    requirementLabel: string,
    status: RequirementCourseStatus,
    programCode?: string
  ) {
    setProgramPreviews((current) =>
      current.map((program) => {
        if (programCode && program.code !== programCode) {
          return program;
        }

        return {
          ...program,
          requirements: program.requirements.map((requirement) => {
            if (requirement.label !== requirementLabel) {
              return requirement;
            }

            return {
              ...requirement,
              courses: requirement.courses.map((course) =>
                course.code === courseCode ? { ...course, status } : course
              ),
            };
          }),
        };
      })
    );
  }

  function removeCourseSelectionFromPlanner(selection: ProgramTrackerCourseSelection) {
    updatePlannerYearsWithPreview((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => ({
          ...term,
          courses: term.courses.filter(
            (course) =>
              course.courseId !== selection.courseId ||
              course.requirement !== selection.requirementLabel
          ),
        })),
      }))
    );
    updateRequirementCourseStatus(
      selection.courseCode,
      selection.requirementLabel,
      'needed',
      selection.programCode
    );
  }

  function removePlannerCourse(termCode: string, course: ProgramTrackerPlannerCourse) {
    updatePlannerYearsWithPreview((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => {
          if (term.code !== termCode) {
            return term;
          }

          return {
            ...term,
            courses: term.courses.filter((plannedCourse) => !isSameProgramTrackerCourse(plannedCourse, course)),
          };
        }),
      }))
    );

    if (course.status === 'planned') {
      updateRequirementCourseStatus(course.code, course.requirement, 'needed', course.programCode);
    }
  }

  function handlePlannerDragEnd(event: DragEndEvent) {
    const selection = event.active.data.current?.selection as ProgramTrackerCourseSelection | undefined;
    const moveSelection = event.active.data.current?.moveSelection as
      | ProgramTrackerCourseMoveSelection
      | undefined;
    const dropTarget = event.over?.data.current?.plannerDropTarget as
      | ProgramTrackerPlannerDropTarget
      | undefined;

    if (!dropTarget) {
      return;
    }

    if (selection) {
      addCourseSelectionToPlanner(selection, dropTarget);
      return;
    }

    if (moveSelection) {
      movePlannerCourse(moveSelection, dropTarget);
    }
  }

  const {
    closeReplacePlaceholderCourseModal,
    placeholderCourseToReplace,
    placeholderReplaceStatus,
    replacePlaceholderCourse,
    setPlaceholderCourseToReplace,
  } = usePlannerPlaceholderReplacement({
    clearPlannerSaveError,
    updatePlannerYearsWithPreview,
  });

  return {
    addPlannerYear,
    addSelectedCourseToPlanner,
    closeAddCourseToPlannerModal,
    closeReplacePlaceholderCourseModal,
    expandedPlannerYearLabels,
    handlePlannerDragEnd,
    initializeProgramTracker,
    openAddCourseToPlannerModal,
    placeholderCourseToReplace,
    placeholderReplaceStatus,
    plannerCourseSelection,
    plannerSaveError,
    plannerSaveStatus,
    plannerTermOptions,
    plannerYears,
    plannerYearsReversed,
    programPreviews,
    removeCourseSelectionFromPlanner,
    removePlannerCourse,
    removePlannerYear,
    replacePlaceholderCourse,
    savePlanner,
    selectedPlannerBucketCode,
    selectedPlannerTermCode,
    setSelectedPlannerBucketCode,
    setPlaceholderCourseToReplace,
    setPlannerYearsReversed,
    setSelectedPlannerTermCode,
    showSubtermPlanner,
    togglePlannerYear,
  };
}

function normalizePlannerDropTarget(
  target: ProgramTrackerPlannerDropTarget | string
): ProgramTrackerPlannerDropTarget {
  return typeof target === 'string'
    ? { bucketCode: 'FULL_TERM', termCode: target }
    : target;
}
