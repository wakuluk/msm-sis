import type {
  ProgramVersionRequirementResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';

export const requirementTypeOptions = [
  { value: 'TOTAL_ELECTIVE_CREDITS', label: 'Elective credits' },
  { value: 'SPECIFIC_COURSES', label: 'Specific courses' },
  { value: 'DEPARTMENT_LEVEL_COURSES', label: 'Department courses' },
  { value: 'MANUAL', label: 'Manual review' },
];

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

export function formatCourseRuleRange(
  rule: ProgramVersionRequirementResponse['requirementCourseRules'][number]
) {
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

export function formatRequirementTarget(requirement: ProgramVersionRequirementResponse): string {
  const targets = [];

  if (requirement.minimumCredits !== null) {
    targets.push(`${requirement.minimumCredits} credits`);
  }

  if (requirement.minimumCourses !== null) {
    targets.push(`${requirement.minimumCourses} courses`);
  }

  if (requirement.courseMatchMode === 'ALL' && requirement.requirementCourses.length > 0) {
    targets.push('All listed courses');
  }

  if (requirement.courseMatchMode === 'ANY' && requirement.requirementCourses.length > 0) {
    targets.push(`Choose ${requirement.minimumCourses ?? 'from'} listed courses`);
  }

  if (requirement.requirementType === 'DEPARTMENT_LEVEL_COURSES') {
    requirement.requirementCourseRules.forEach((rule) => {
      const department = rule.departmentCode ?? rule.departmentName ?? 'Department';
      const ruleTargets = [];

      if (rule.minimumCredits !== null) {
        ruleTargets.push(`${rule.minimumCredits} credits`);
      }

      if (rule.minimumCourses !== null) {
        ruleTargets.push(`${rule.minimumCourses} courses`);
      }

      if (ruleTargets.length > 0) {
        targets.push(`${department} ${formatCourseRuleRange(rule)}: ${ruleTargets.join(' or ')}`);
      }
    });
  }

  if (requirement.minimumGrade !== null) {
    targets.push(`Minimum grade ${requirement.minimumGrade}`);
  }

  return targets.length === 0 ? '—' : targets.join(', ');
}

export function formatRequirementSource(requirement: ProgramVersionRequirementResponse): string {
  if (requirement.requirementCourses.length > 0) {
    return `${requirement.requirementCourses.length} listed course${requirement.requirementCourses.length === 1 ? '' : 's'}`;
  }

  if (requirement.requirementCourseRules.length > 0) {
    return requirement.requirementCourseRules
      .map((rule) => {
        const department = rule.departmentCode ?? rule.departmentName ?? 'Department';
        return `${department} ${formatCourseRuleRange(rule)}`;
      })
      .join(', ');
  }

  return requirement.requirementType === 'TOTAL_ELECTIVE_CREDITS' ? 'Any eligible elective' : '—';
}

export function formatRequirementLibraryTarget(requirement: RequirementSearchResultResponse): string {
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

  return targets.length === 0 ? '—' : targets.join(', ');
}
