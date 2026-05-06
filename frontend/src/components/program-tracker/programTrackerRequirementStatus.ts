// Requirement card status/selection helpers.
import type {
  ProgramTrackerCourseRule,
  ProgramTrackerCourseSelection,
  ProgramTrackerProgram,
  ProgramTrackerRequirement,
  RequirementCourseStatus,
} from './program-tracker.types';

export function buildElectivePlaceholderSelection({
  program,
  requirement,
  rule,
}: {
  program: ProgramTrackerProgram;
  requirement: ProgramTrackerRequirement;
  rule?: ProgramTrackerCourseRule;
}): ProgramTrackerCourseSelection {
  const minimumCourseNumber = rule?.minimumCourseNumber ?? 100;
  const hasDepartmentRule = Boolean(rule?.departmentCode || rule?.departmentId);
  const courseCode = hasDepartmentRule
    ? `${rule?.departmentCode ?? 'Department'} ${minimumCourseNumber}+ elective`
    : 'ELEC 100+';
  const remainingRequired = Math.max(0, requirement.required - requirement.completed - requirement.planned);
  const plannedCredits = requirement.unit === 'credits' && remainingRequired > 0
    ? remainingRequired
    : 3;

  return {
    courseCode,
    credits: plannedCredits,
    placeholderDepartmentCode: rule?.departmentCode,
    placeholderDepartmentId: rule?.departmentId,
    placeholderLabel: hasDepartmentRule ? courseCode : `${requirement.label} elective`,
    placeholderMaximumCourseNumber: rule?.maximumCourseNumber,
    placeholderMinimumCourseNumber: hasDepartmentRule ? minimumCourseNumber : undefined,
    placeholderSubjectCode: rule?.departmentCode,
    placeholderType: hasDepartmentRule ? 'DEPARTMENT_ELECTIVE' : 'ELECTIVE',
    programCode: program.code,
    programName: program.name,
    requirementId: requirement.requirementId,
    requirementLabel: requirement.label,
    studentProgramId: program.studentProgramId,
  };
}

export function buildRequirementCourseSelection({
  course,
  program,
  requirement,
}: {
  course: ProgramTrackerRequirement['courses'][number];
  program: ProgramTrackerProgram;
  requirement: ProgramTrackerRequirement;
}): ProgramTrackerCourseSelection {
  return {
    courseId: course.courseId,
    courseCode: course.code,
    credits: course.credits,
    programCode: program.code,
    programName: program.name,
    requirementId: requirement.requirementId,
    requirementLabel: requirement.label,
    studentProgramId: program.studentProgramId,
    title: course.title,
  };
}

export function canPlanElectivePlaceholder(requirement: ProgramTrackerRequirement) {
  return (
    requirement.courses.length === 0 &&
    requirement.requirementType?.trim().toUpperCase() !== 'MANUAL'
  );
}

export function getRequirementCourseDisplayStatus(
  courseStatus: RequirementCourseStatus,
  requirement: ProgramTrackerRequirement
): RequirementCourseStatus {
  if (courseStatus !== 'needed') {
    return courseStatus;
  }

  if (requirement.required > 0 && requirement.completed >= requirement.required) {
    return 'not_required';
  }

  if (
    requirement.required > 0 &&
    requirement.completed + requirement.planned >= requirement.required
  ) {
    return 'planned';
  }

  return 'needed';
}

export function getElectivePlaceholderStatus(
  requirement: ProgramTrackerRequirement
): RequirementCourseStatus {
  if (requirement.required > 0 && requirement.completed >= requirement.required) {
    return 'complete';
  }

  if (
    requirement.required > 0 &&
    requirement.planned > 0 &&
    requirement.completed + requirement.planned >= requirement.required
  ) {
    return 'planned';
  }

  return 'needed';
}
