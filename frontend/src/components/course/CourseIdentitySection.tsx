import { Grid, Select, Switch, TextInput } from '@mantine/core';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type { CourseCreateFormValues } from './courseCreateValidation';
import { CourseCreateSectionFrame } from './CourseCreateSectionFrame';

type CourseIdentitySectionProps = {
  departmentId: string | null;
  departmentOptions: ReadonlyArray<{ schoolId: number } & StringOption>;
  formValues: CourseCreateFormValues;
  isSubmitting: boolean;
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
  schoolId: string | null;
  schoolOptions: ReadonlyArray<StringOption>;
  subjectId: string | null;
  subjectOptions: ReadonlyArray<{ departmentId: number } & StringOption>;
  onDepartmentChange: (value: string | null) => void;
  onFormValuesChange: React.Dispatch<React.SetStateAction<CourseCreateFormValues>>;
  onSchoolChange: (value: string | null) => void;
  onSubjectChange: (value: string | null) => void;
};

export function CourseIdentitySection({
  departmentId,
  departmentOptions,
  formValues,
  isSubmitting,
  referenceOptionsError,
  referenceOptionsLoading,
  schoolId,
  schoolOptions,
  subjectId,
  subjectOptions,
  onDepartmentChange,
  onFormValuesChange,
  onSchoolChange,
  onSubjectChange,
}: CourseIdentitySectionProps) {
  const visibleDepartmentOptions =
    schoolId === null
      ? departmentOptions
      : departmentOptions.filter((option) => option.schoolId === Number(schoolId));
  const visibleSubjectOptions =
    departmentId === null
      ? subjectOptions
      : subjectOptions.filter((option) => option.departmentId === Number(departmentId));

  return (
    <CourseCreateSectionFrame
      title="Course Identity"
      description="The stable catalog identity that stays the same across future versions."
    >
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          withAsterisk
          searchable
          label="School"
          placeholder="Select school"
          data={schoolOptions}
          value={schoolId}
          loading={referenceOptionsLoading}
          error={referenceOptionsError ?? undefined}
          disabled={isSubmitting}
          onChange={onSchoolChange}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          withAsterisk
          searchable
          label="Department"
          placeholder="Select department"
          data={visibleDepartmentOptions.map(({ label, value }) => ({ label, value }))}
          value={departmentId}
          loading={referenceOptionsLoading}
          error={referenceOptionsError ?? undefined}
          disabled={schoolId === null || isSubmitting}
          onChange={onDepartmentChange}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          withAsterisk
          searchable
          label="Subject"
          placeholder="Select subject"
          data={visibleSubjectOptions.map(({ label, value }) => ({ label, value }))}
          value={subjectId}
          loading={referenceOptionsLoading}
          error={referenceOptionsError ?? undefined}
          disabled={departmentId === null || isSubmitting}
          onChange={onSubjectChange}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          withAsterisk
          label="Course number"
          placeholder="453"
          maxLength={20}
          value={formValues.courseNumber}
          disabled={isSubmitting}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              courseNumber: event.currentTarget.value,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 8 }}>
        <TextInput
          withAsterisk
          label="Course title"
          placeholder="Algorithms"
          maxLength={160}
          value={formValues.title}
          disabled={isSubmitting}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              title: event.currentTarget.value,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Switch
          label="Active course"
          checked={formValues.active}
          disabled={isSubmitting}
          onChange={(event) => {
            onFormValuesChange((current) => ({
              ...current,
              active: event.currentTarget.checked,
            }));
          }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Switch label="Visible in catalog" defaultChecked disabled={isSubmitting} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Switch label="Repeatable for credit" disabled={isSubmitting} />
      </Grid.Col>
    </CourseCreateSectionFrame>
  );
}
