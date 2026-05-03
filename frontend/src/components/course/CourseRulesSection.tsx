import { Grid } from '@mantine/core';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';
import { CourseRequisitesEditor } from './CourseRequisitesEditor';
import type { CourseRequisiteGroupDraft } from './courseRequisiteDrafts';
import { useCoursePickerOptions } from './useCoursePickerOptions';

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
  const coursePickerOptions = useCoursePickerOptions(true);

  return (
    <CourseCreateSectionFrame
      title="Requisites"
      description="Optional prerequisites and corequisites for the initial course version."
    >
      <Grid.Col span={12}>
        <CourseRequisitesEditor
          groups={requisites}
          courses={coursePickerOptions.courses}
          departmentOptions={coursePickerOptions.departmentOptions}
          loading={coursePickerOptions.loading}
          error={coursePickerOptions.error}
          disabled={isSubmitting}
          onChange={onRequisitesChange}
        />
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
