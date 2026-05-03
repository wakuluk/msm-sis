import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Button } from '@mantine/core';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { AddCourseToPlannerModal } from './AddCourseToPlannerModal';
import { CourseVersionDetailModal } from './CourseVersionDetailModal';
import { ProgramRequirementsSection } from './ProgramRequirementsSection';
import { SemesterPlannerSection } from './SemesterPlannerSection';
import {
  createEmptyPlannerYear,
  findPlannerTerm,
  getCourseVersionPreview,
  getPlannerTermOptions,
} from './student-programs.helpers';
import { initialPlannerYears, initialStudentProgramPreviews } from './student-programs.stub';
import type {
  PlannerCourseMoveSelection,
  PlannerCoursePreview,
  PlannerCourseSelection,
  PlannerYearPreview,
  RequirementCourseStatus,
  StudentProgramPreview,
} from './student-programs.types';

export function StudentProgramsExperience() {
  const [programPreviews, setProgramPreviews] = useState<StudentProgramPreview[]>(
    initialStudentProgramPreviews
  );
  const [expandedProgramCodes, setExpandedProgramCodes] = useState<Set<string>>(
    () => new Set(initialStudentProgramPreviews.map((program) => program.code))
  );
  const [plannerYears, setPlannerYears] = useState<PlannerYearPreview[]>(initialPlannerYears);
  const [expandedPlannerYearLabels, setExpandedPlannerYearLabels] = useState<Set<string>>(
    () => new Set(initialPlannerYears.map((year) => year.label))
  );
  const [plannerYearsReversed, setPlannerYearsReversed] = useState(false);
  const [plannerCourseSelection, setPlannerCourseSelection] =
    useState<PlannerCourseSelection | null>(null);
  const [selectedPlannerTermCode, setSelectedPlannerTermCode] = useState<string | null>(null);
  const [plannerSaveStatus, setPlannerSaveStatus] = useState<'saved' | 'unsaved'>('saved');
  const [selectedCourseVersionCode, setSelectedCourseVersionCode] = useState<string | null>(null);

  const plannerTermOptions = getPlannerTermOptions(plannerYears);
  const selectedCourseVersion = selectedCourseVersionCode
    ? getCourseVersionPreview(selectedCourseVersionCode)
    : null;

  function markPlannerUnsaved() {
    setPlannerSaveStatus('unsaved');
  }

  function toggleProgram(programCode: string) {
    setExpandedProgramCodes((current) => {
      const next = new Set(current);

      if (next.has(programCode)) {
        next.delete(programCode);
      } else {
        next.add(programCode);
      }

      return next;
    });
  }

  function openAddCourseToPlannerModal(selection: PlannerCourseSelection) {
    setPlannerCourseSelection(selection);
    setSelectedPlannerTermCode(
      plannerTermOptions.find((option) => !option.disabled)?.value ?? null
    );
  }

  function closeAddCourseToPlannerModal() {
    setPlannerCourseSelection(null);
    setSelectedPlannerTermCode(null);
  }

  function openCourseVersionModal(courseCode: string) {
    setSelectedCourseVersionCode(courseCode);
  }

  function closeCourseVersionModal() {
    setSelectedCourseVersionCode(null);
  }

  function addPlannerYear() {
    setPlannerYears((current) => {
      const nextYear = createEmptyPlannerYear(current.length + 1);
      setExpandedPlannerYearLabels((expandedLabels) => new Set(expandedLabels).add(nextYear.label));

      return [...current, nextYear];
    });
    markPlannerUnsaved();
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
    setPlannerYears((current) =>
      current.filter((year) => year.label !== yearLabel || !year.canRemove)
    );
    setExpandedPlannerYearLabels((current) => {
      const next = new Set(current);
      next.delete(yearLabel);
      return next;
    });
    markPlannerUnsaved();
  }

  function addCourseSelectionToPlanner(selection: PlannerCourseSelection, termCode: string) {
    const targetTerm = findPlannerTerm(plannerYears, termCode);

    if (targetTerm?.isComplete) {
      return;
    }

    setPlannerYears((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => {
          if (term.code !== termCode) {
            return term;
          }

          const courseAlreadyPlanned = term.courses.some(
            (course) => course.code === selection.courseCode
          );

          if (courseAlreadyPlanned) {
            return term;
          }

          return {
            ...term,
            courses: [
              ...term.courses,
              {
                code: selection.courseCode,
                credits: 3,
                programCode: selection.programCode,
                programName: selection.programName,
                requirement: selection.requirementLabel,
                status: 'planned',
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
    markPlannerUnsaved();
  }

  function movePlannerCourse(selection: PlannerCourseMoveSelection, targetTermCode: string) {
    if (selection.sourceTermCode === targetTermCode) {
      return;
    }

    const targetTerm = findPlannerTerm(plannerYears, targetTermCode);

    if (targetTerm?.isComplete) {
      return;
    }

    setPlannerYears((current) =>
      current.map((year) => {
        const targetAlreadyHasCourse = current.some((currentYear) =>
          currentYear.terms.some(
            (term) =>
              term.code === targetTermCode &&
              term.courses.some(
                (course) => course.code === selection.course.code
              )
          )
        );

        if (targetAlreadyHasCourse) {
          return year;
        }

        return {
          ...year,
          terms: year.terms.map((term) => {
            if (term.code === selection.sourceTermCode) {
              return {
                ...term,
                courses: term.courses.filter((course) => course.code !== selection.course.code),
              };
            }

            if (term.code === targetTermCode) {
              return {
                ...term,
                courses: [...term.courses, selection.course],
              };
            }

            return term;
          }),
        };
      })
    );
    markPlannerUnsaved();
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

  function removeCourseSelectionFromPlanner(selection: PlannerCourseSelection) {
    setPlannerYears((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => ({
          ...term,
          courses: term.courses.filter(
            (course) =>
              course.code !== selection.courseCode ||
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
    markPlannerUnsaved();
  }

  function removePlannerCourse(termCode: string, course: PlannerCoursePreview) {
    setPlannerYears((current) =>
      current.map((year) => ({
        ...year,
        terms: year.terms.map((term) => {
          if (term.code !== termCode) {
            return term;
          }

          return {
            ...term,
            courses: term.courses.filter((plannedCourse) => plannedCourse.code !== course.code),
          };
        }),
      }))
    );

    if (course.status === 'planned') {
      updateRequirementCourseStatus(course.code, course.requirement, 'needed', course.programCode);
    }

    markPlannerUnsaved();
  }

  function addSelectedCourseToPlanner() {
    if (!plannerCourseSelection || !selectedPlannerTermCode) {
      return;
    }

    addCourseSelectionToPlanner(plannerCourseSelection, selectedPlannerTermCode);

    closeAddCourseToPlannerModal();
  }

  function handlePlannerDragEnd(event: DragEndEvent) {
    const selection = event.active.data.current?.selection as PlannerCourseSelection | undefined;
    const moveSelection = event.active.data.current?.moveSelection as
      | PlannerCourseMoveSelection
      | undefined;
    const termCode = typeof event.over?.id === 'string' ? event.over.id : null;

    if (!termCode) {
      return;
    }

    if (selection) {
      addCourseSelectionToPlanner(selection, termCode);
      return;
    }

    if (moveSelection) {
      movePlannerCourse(moveSelection, termCode);
    }
  }

  function savePlanner() {
    setPlannerSaveStatus('saved');
  }

  return (
    <RecordPageShell
      eyebrow="Student Academics"
      title="My Programs"
      description="Review your declared programs, automatic core requirements, and program request options."
      badge={
        <Button variant="light">
          Explore Programs
        </Button>
      }
    >
      <AddCourseToPlannerModal
        opened={plannerCourseSelection !== null}
        onClose={closeAddCourseToPlannerModal}
        onSave={addSelectedCourseToPlanner}
        onTermChange={setSelectedPlannerTermCode}
        plannerCourseSelection={plannerCourseSelection}
        plannerTermOptions={plannerTermOptions}
        selectedPlannerTermCode={selectedPlannerTermCode}
      />

      <CourseVersionDetailModal
        courseVersion={selectedCourseVersion}
        onClose={closeCourseVersionModal}
      />

      <DndContext onDragEnd={handlePlannerDragEnd}>
        <ProgramRequirementsSection
          expandedProgramCodes={expandedProgramCodes}
          programs={programPreviews}
          onAddCourseToPlanner={openAddCourseToPlannerModal}
          onOpenCourseVersion={openCourseVersionModal}
          onRemoveCourseFromPlanner={removeCourseSelectionFromPlanner}
          onToggleProgram={toggleProgram}
        />

        <SemesterPlannerSection
          expandedPlannerYearLabels={expandedPlannerYearLabels}
          plannerSaveStatus={plannerSaveStatus}
          plannerYears={plannerYears}
          plannerYearsReversed={plannerYearsReversed}
          onAddYear={addPlannerYear}
          onOpenCourseVersion={openCourseVersionModal}
          onRemoveCourse={removePlannerCourse}
          onRemoveYear={removePlannerYear}
          onSave={savePlanner}
          onToggleReverseYears={() => {
            setPlannerYearsReversed((current) => !current);
          }}
          onToggleYear={togglePlannerYear}
        />
      </DndContext>
    </RecordPageShell>
  );
}
