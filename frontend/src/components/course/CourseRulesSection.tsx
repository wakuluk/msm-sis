import { Checkbox, Grid, Group, TextInput } from '@mantine/core';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';

type CourseRulesSectionProps = {
  isSubmitting: boolean;
};

export function CourseRulesSection({ isSubmitting }: CourseRulesSectionProps) {
  return (
    <CourseCreateSectionFrame
      title="Rules and Relationships"
      description="Optional setup that determines how the course can be used before sections are created."
    >
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Prerequisites"
          placeholder="Example: MATH 120 or placement"
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput label="Corequisites" placeholder="Example: CMSCI 453L" disabled={isSubmitting} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Equivalent courses"
          placeholder="Example: CS 453"
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Mutually exclusive courses"
          placeholder="Example: MATH 453"
          disabled={isSubmitting}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Group gap="xl" align="center">
          <Checkbox label="Can satisfy program requirements" defaultChecked disabled={isSubmitting} />
          <Checkbox label="Can receive transfer substitutions" defaultChecked disabled={isSubmitting} />
          <Checkbox label="Requires department approval" disabled={isSubmitting} />
        </Group>
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
