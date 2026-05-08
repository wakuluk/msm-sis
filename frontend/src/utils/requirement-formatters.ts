import type {
  RequirementCourseResponse,
  RequirementCourseRuleResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';

type RequirementTargetSource = Pick<
  RequirementSearchResultResponse,
  | 'minimumCredits'
  | 'minimumCourses'
  | 'courseMatchMode'
  | 'requirementCourseCount'
  | 'minimumGrade'
>;

export function formatRequirementType(type: string | null): string {
  switch (type) {
    case 'TOTAL_ELECTIVE_CREDITS':
      return 'Elective credits';
    case 'SPECIFIC_COURSES':
      return 'Specific courses';
    case 'DEPARTMENT_LEVEL_COURSES':
      return 'Department courses';
    case 'MANUAL':
      return 'Manual review';
    default:
      return displayValue(type);
  }
}

export function formatRequirementTarget(requirement: RequirementTargetSource): string {
  const targets = [];

  if (requirement.minimumCredits !== null) {
    targets.push(`${requirement.minimumCredits} credits`);
  }

  if (requirement.minimumCourses !== null) {
    targets.push(`${requirement.minimumCourses} courses`);
  }

  if (requirement.courseMatchMode === 'ALL' && requirement.requirementCourseCount > 0) {
    targets.push('All listed courses');
  }

  if (requirement.courseMatchMode === 'ANY' && requirement.requirementCourseCount > 0) {
    targets.push(`Choose ${requirement.minimumCourses ?? 'from'} listed courses`);
  }

  if (requirement.minimumGrade !== null) {
    targets.push(`Minimum grade ${requirement.minimumGrade}`);
  }

  return targets.length === 0 ? '-' : targets.join(', ');
}

export function formatRequirementCourseDisplay(course: RequirementCourseResponse): string {
  if (course.subjectCode === null && course.courseNumber === null) {
    return '-';
  }

  return `${course.subjectCode ?? ''}${course.courseNumber ?? ''}`;
}

export function formatRequirementCourseRuleRange(rule: RequirementCourseRuleResponse): string {
  if (rule.minimumCourseNumber === null && rule.maximumCourseNumber === null) {
    return 'any level';
  }

  if (rule.minimumCourseNumber !== null && rule.maximumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}-${rule.maximumCourseNumber}`;
  }

  if (rule.minimumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}+`;
  }

  return `up to ${rule.maximumCourseNumber}`;
}
