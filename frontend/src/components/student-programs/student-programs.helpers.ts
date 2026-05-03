import { courseVersionPreviews, plannerTermLabels } from './student-programs.stub';
import type {
  CoursePrerequisitePreview,
  CourseVersionPreview,
  PlannerTermPreview,
  PlannerYearPreview,
  RequirementCourseStatus,
  StudentProgramPreview,
  StudentProgramRequirementPreview,
} from './student-programs.types';

export function formatRequirementProgress(requirement: StudentProgramRequirementPreview) {
  return formatProgressLabel(
    requirement.completed,
    requirement.planned,
    requirement.required,
    requirement.unit
  );
}

export function formatProgramProgress(program: StudentProgramPreview) {
  return formatProgressLabel(program.completed, program.planned, program.required, 'total');
}

export function getProgressSegments(completed: number, planned: number, required: number) {
  if (required <= 0) {
    return { completed: 0, planned: 0 };
  }

  const completedValue = Math.min(100, (completed / required) * 100);
  const plannedValue = Math.min(100 - completedValue, (planned / required) * 100);

  return { completed: completedValue, planned: plannedValue };
}

export function getCourseStatusColor(status: RequirementCourseStatus) {
  if (status === 'complete') {
    return 'blue';
  }

  return status === 'planned' ? 'yellow' : 'gray';
}

export function getCourseStatusLabel(status: RequirementCourseStatus) {
  if (status === 'complete') {
    return 'Complete';
  }

  return status === 'planned' ? 'Planned' : 'Needed';
}

export function getPrerequisiteStatusColor(status: CoursePrerequisitePreview['status']) {
  if (status === 'satisfied') {
    return 'blue';
  }

  return status === 'planned' ? 'yellow' : 'red';
}

export function getPrerequisiteStatusLabel(status: CoursePrerequisitePreview['status']) {
  if (status === 'satisfied') {
    return 'Satisfied';
  }

  return status === 'planned' ? 'Planned' : 'Missing';
}

export function getCourseVersionPreview(courseCode: string): CourseVersionPreview {
  return (
    courseVersionPreviews[courseCode] ?? {
      code: courseCode,
      credits: 3,
      description: 'Latest published course details will appear here.',
      effectiveYear: '2026-2027',
      prerequisites: [],
      title: 'Course Details',
      version: 'Latest published version',
    }
  );
}

export function getTermCredits(term: PlannerTermPreview) {
  return term.courses.reduce((total, course) => total + course.credits, 0);
}

export function getYearCredits(year: PlannerYearPreview) {
  return year.terms.reduce((total, term) => total + getTermCredits(term), 0);
}

export function createEmptyPlannerYear(yearNumber: number): PlannerYearPreview {
  const yearSlug = `year-${yearNumber}`;

  return {
    canRemove: true,
    label: `Year ${yearNumber}`,
    terms: plannerTermLabels.map((label) => ({
      code: `${yearSlug}-${label.toLowerCase().replaceAll(' ', '-')}`,
      courses: [],
      label,
    })),
  };
}

export function getPlannerTermOptions(years: PlannerYearPreview[]) {
  return years.flatMap((year) =>
    year.terms.map((term) => ({
      value: term.code,
      label: `${year.label} ${term.label}`,
      disabled: term.isComplete,
    }))
  );
}

export function findPlannerTerm(years: PlannerYearPreview[], termCode: string) {
  for (const year of years) {
    const term = year.terms.find((plannerTerm) => plannerTerm.code === termCode);

    if (term) {
      return term;
    }
  }

  return null;
}

function formatProgressLabel(
  completed: number,
  planned: number,
  required: number,
  unit: 'credits' | 'courses' | 'total'
) {
  const completedPercentage = formatPercentage(completed, required);
  const plannedPercentage = formatPercentage(planned, required);

  return `${completed} complete (${completedPercentage}) · ${planned} planned (${plannedPercentage}) · ${required} ${unit}`;
}

function formatPercentage(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}
