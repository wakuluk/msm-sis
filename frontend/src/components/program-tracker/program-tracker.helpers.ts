import type {
  PlannerBucketCode,
  ProgramTrackerPlannerBucket,
  ProgramTrackerPlannerCourse,
  ProgramTrackerPlannerTerm,
  ProgramTrackerPlannerYear,
  RequirementCourseStatus,
  ProgramTrackerProgram,
  ProgramTrackerRequirement,
} from './program-tracker.types';

const programTrackerTermLabels = ['Fall', 'Spring', 'Summer I', 'Summer II'];
export const programTrackerPlannerBuckets: Array<{
  code: PlannerBucketCode;
  label: string;
  sortOrder: number;
}> = [
  { code: 'FULL_TERM', label: 'Full Term', sortOrder: 0 },
  { code: 'SESSION_A', label: 'Session A', sortOrder: 1 },
  { code: 'SESSION_B', label: 'Session B', sortOrder: 2 },
];

export function formatRequirementProgress(requirement: ProgramTrackerRequirement) {
  return formatProgressLabel(
    requirement.completed,
    requirement.planned,
    requirement.required,
    requirement.unit
  );
}

export function formatProgramProgress(program: ProgramTrackerProgram) {
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

  if (status === 'not_required') {
    return 'gray';
  }

  return status === 'planned' ? 'yellow' : 'gray';
}

export function getCourseStatusLabel(status: RequirementCourseStatus) {
  if (status === 'complete') {
    return 'Complete';
  }

  if (status === 'not_required') {
    return 'Not required';
  }

  return status === 'planned' ? 'Planned' : 'Needed';
}

export function getProgramTrackerTermCompletedCredits(term: ProgramTrackerPlannerTerm) {
  return getProgramTrackerTermBucketCourses(term)
    .filter((course) => course.readOnly || course.status === 'complete')
    .reduce((total, course) => total + course.credits, 0);
}

export function getProgramTrackerTermPlannedCredits(term: ProgramTrackerPlannerTerm) {
  return getProgramTrackerTermBucketCourses(term)
    .filter((course) => !course.readOnly && course.status === 'planned')
    .reduce((total, course) => total + course.credits, 0);
}

export function getProgramTrackerTermBuckets(
  term: ProgramTrackerPlannerTerm,
  options: { includeEmpty?: boolean } = {}
): ProgramTrackerPlannerBucket[] {
  return programTrackerPlannerBuckets
    .map((bucket) => ({
      ...bucket,
      courses: term.courses.filter(
        (course) => getProgramTrackerCourseBucketCode(course) === bucket.code
      ),
    }))
    .filter((bucket) => options.includeEmpty || bucket.courses.length > 0);
}

export function getProgramTrackerTermBucketCourses(term: ProgramTrackerPlannerTerm) {
  return getProgramTrackerTermBuckets(term).flatMap((bucket) => bucket.courses);
}

export function getProgramTrackerCourseBucketCode(
  course: ProgramTrackerPlannerCourse
): PlannerBucketCode {
  if (course.plannerBucketCode) {
    return course.plannerBucketCode;
  }

  return normalizeProgramTrackerBucketCode(course.plannerBucketLabel);
}

export function normalizeProgramTrackerBucketCode(
  bucketLabel: string | null | undefined
): PlannerBucketCode {
  const normalizedLabel = bucketLabel?.trim().toUpperCase().replaceAll(/[\s-]+/g, '_');

  if (normalizedLabel === 'SESSION_A') {
    return 'SESSION_A';
  }

  if (normalizedLabel === 'SESSION_B') {
    return 'SESSION_B';
  }

  return 'FULL_TERM';
}

export function getProgramTrackerBucketLabel(bucketCode: PlannerBucketCode) {
  return programTrackerPlannerBuckets.find((bucket) => bucket.code === bucketCode)?.label ?? 'Full Term';
}

export function getProgramTrackerYearCompletedCredits(year: ProgramTrackerPlannerYear) {
  return year.terms.reduce(
    (total, term) => total + getProgramTrackerTermCompletedCredits(term),
    0
  );
}

export function getProgramTrackerYearPlannedCredits(year: ProgramTrackerPlannerYear) {
  return year.terms.reduce((total, term) => total + getProgramTrackerTermPlannedCredits(term), 0);
}

export function formatProgramTrackerPlannerCredits(completedCredits: number, plannedCredits: number) {
  if (completedCredits > 0 && plannedCredits > 0) {
    return `${completedCredits} completed credits · ${plannedCredits} planned credits`;
  }

  if (completedCredits > 0) {
    return `${completedCredits} completed credits`;
  }

  return `${plannedCredits} planned credits`;
}

export function createEmptyProgramTrackerYear(yearNumber: number): ProgramTrackerPlannerYear {
  const yearSlug = `year-${yearNumber}`;

  return {
    canRemove: true,
    label: `Year ${yearNumber}`,
    terms: programTrackerTermLabels.map((label) => ({
      code: `${yearSlug}-${label.toLowerCase().replaceAll(' ', '-')}`,
      courses: [],
      label,
      sortOrder: programTrackerTermLabels.indexOf(label),
    })),
    sortOrder: yearNumber - 1,
  };
}

export function createNextEmptyProgramTrackerYear(
  years: ProgramTrackerPlannerYear[]
): ProgramTrackerPlannerYear {
  const nextYearNumber = years.length + 1;
  const nextYear = createEmptyProgramTrackerYear(nextYearNumber);

  return {
    ...nextYear,
    label: getNextProgramTrackerYearLabel(years, nextYearNumber),
  };
}

function getNextProgramTrackerYearLabel(
  years: ProgramTrackerPlannerYear[],
  fallbackYearNumber: number
) {
  const latestAcademicYearStart = years
    .map((year) => parseAcademicYearStart(year.label))
    .filter((year): year is number => year !== null)
    .reduce<number | null>((latest, year) => (
      latest === null || year > latest ? year : latest
    ), null);

  if (latestAcademicYearStart !== null) {
    const nextStartYear = latestAcademicYearStart + 1;
    return `Academic Year ${nextStartYear}-${nextStartYear + 1}`;
  }

  return `Year ${fallbackYearNumber}`;
}

function parseAcademicYearStart(label: string) {
  const match = /^Academic Year (\d{4})-\d{4}$/.exec(label.trim());
  return match ? Number(match[1]) : null;
}

export function getProgramTrackerTermOptions(years: ProgramTrackerPlannerYear[]) {
  return years.flatMap((year) =>
    year.terms.map((term) => ({
      value: term.code,
      label: `${year.label} ${term.label}`,
      disabled: term.isComplete,
    }))
  );
}

export function findProgramTrackerTerm(years: ProgramTrackerPlannerYear[], termCode: string) {
  for (const year of years) {
    const term = year.terms.find((plannerTerm) => plannerTerm.code === termCode);

    if (term) {
      return term;
    }
  }

  return null;
}

export function getProgramTrackerCourseKey(course: ProgramTrackerPlannerCourse) {
  if (course.plannerCourseId !== undefined && course.plannerCourseId > 0) {
    return `saved-${course.plannerCourseId}`;
  }

  if (course.plannerClientId) {
    return course.plannerClientId;
  }

  if (course.plannerCourseId !== undefined) {
    return `draft-${course.plannerCourseId}`;
  }

  return `${course.requirement}-${course.code}`;
}

export function isSameProgramTrackerCourse(
  left: ProgramTrackerPlannerCourse,
  right: ProgramTrackerPlannerCourse
) {
  return getProgramTrackerCourseKey(left) === getProgramTrackerCourseKey(right);
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
