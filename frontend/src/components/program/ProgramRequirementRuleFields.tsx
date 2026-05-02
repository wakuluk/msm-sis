import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { ProgramVersionRequirementResponse } from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';

export function ProgramRequirementRuleFields({
  requirement,
}: {
  requirement: ProgramVersionRequirementResponse;
}) {
  switch (requirement.requirementType) {
    case 'TOTAL_ELECTIVE_CREDITS':
      return (
        <>
          <ReadOnlyField
            label="Minimum Credits"
            value={displayValue(requirement.minimumCredits)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    case 'SPECIFIC_COURSES':
      return (
        <>
          <ReadOnlyField
            label="Course Match Mode"
            value={displayValue(requirement.courseMatchMode)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Courses"
            value={displayValue(requirement.minimumCourses)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    case 'DEPARTMENT_LEVEL_COURSES':
      return (
        <>
          <ReadOnlyField
            label="Minimum Grade"
            value={displayValue(requirement.minimumGrade)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Rule Count"
            value={displayValue(requirement.requirementCourseRules.length)}
            span={{ base: 12, md: 4 }}
          />
        </>
      );
    default:
      return null;
  }
}
