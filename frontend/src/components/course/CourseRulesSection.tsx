import { Grid } from '@mantine/core';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';
import { CourseRequisitesEditor } from './CourseRequisitesEditor';
import type { CourseRequisiteGroupDraft } from './courseRequisiteDrafts';
import { useCourseCreateReferenceOptions } from './useCourseCreateReferenceOptions';

type CourseRulesSectionProps = {
  isSubmitting: boolean;
  requisites: CourseRequisiteGroupDraft[];
  onRequisitesChange: React.Dispatch<React.SetStateAction<CourseRequisiteGroupDraft[]>>;
};

export function CourseRulesSection({
  isSubmitting,
  requisites,
  onRequisitesChange,
}: CourseRulesSectionProps) {
  const referenceOptions = useCourseCreateReferenceOptions();

  return (
    <CourseCreateSectionFrame
      title="Requisites"
      description="Optional prerequisites and corequisites for the initial course version."
    >
      <Grid.Col span={12}>
        <CourseRequisitesEditor
          groups={requisites}
          departmentOptions={referenceOptions.departmentOptions}
          error={referenceOptions.referenceOptionsError}
          disabled={isSubmitting}
          onChange={onRequisitesChange}
        />
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
