import { Collapse, Grid, Switch } from '@mantine/core';
import {
  buildDefaultLabCourseNumber,
  buildDefaultLabTitle,
  syncAssociatedLabCorequisite,
} from './courseCreateFormHelpers';
import { CourseAssociatedLabFields } from './CourseAssociatedLabFields';
import type { CourseCreateFormValues } from './courseCreateValidation';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';

type CourseAssociatedLabSectionProps = {
  formValues: CourseCreateFormValues;
  isSubmitting: boolean;
  onFormValuesChange: React.Dispatch<React.SetStateAction<CourseCreateFormValues>>;
};

export function CourseAssociatedLabSection({
  formValues,
  isSubmitting,
  onFormValuesChange,
}: CourseAssociatedLabSectionProps) {
  return (
    <CourseCreateSectionFrame
      title="Associated Lab"
      description="Optionally draft a separate lab course to create with this course later."
    >
      <Grid.Col span={12}>
        <Switch
          label="Create lab course with this course"
          checked={formValues.createAssociatedLab}
          disabled={isSubmitting || formValues.lab}
          onChange={(event) => {
            const checked = event.currentTarget.checked;

            onFormValuesChange((current) => ({
              ...syncAssociatedLabCorequisite({
                ...current,
                createAssociatedLab: checked,
                associatedLabCourseNumber:
                  current.associatedLabCourseNumber || buildDefaultLabCourseNumber(current.courseNumber),
                associatedLabTitle: current.associatedLabTitle || buildDefaultLabTitle(current.title),
                associatedLabCredits: current.associatedLabCredits || '0.00',
                associatedLabMinCredits: current.associatedLabMinCredits || '0.00',
                associatedLabMaxCredits: current.associatedLabMaxCredits || '0.00',
                associatedLabCorequisite: checked ? current.associatedLabCorequisite : true,
              }),
            }));
          }}
        />
      </Grid.Col>

      <Grid.Col span={12}>
        <Collapse
          expanded={formValues.createAssociatedLab}
          transitionDuration={320}
          transitionTimingFunction="ease"
        >
          <CourseAssociatedLabFields
            disabled={isSubmitting}
            formValues={formValues}
            onFormValuesChange={onFormValuesChange}
          />
        </Collapse>
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
