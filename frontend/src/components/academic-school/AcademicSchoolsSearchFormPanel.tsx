import { Grid, Paper, Select, Stack, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type { AcademicSchoolSearchFilters } from '@/services/schemas/academic-school-schemas';

type DepartmentOption = { schoolId: number } & StringOption;

type AcademicSchoolsSearchFormPanelProps = {
  form: UseFormReturnType<AcademicSchoolSearchFilters>;
  schoolOptions: ReadonlyArray<StringOption>;
  departmentOptions: ReadonlyArray<DepartmentOption>;
  visibleDepartmentOptions: ReadonlyArray<DepartmentOption>;
  referenceOptionsLoading: boolean;
  referenceOptionsError: string | null;
  isSubmitting: boolean;
  onSubmit: (values: AcademicSchoolSearchFilters) => void;
  onClear: () => void;
};

export function AcademicSchoolsSearchFormPanel({
  form,
  schoolOptions,
  departmentOptions,
  visibleDepartmentOptions,
  referenceOptionsLoading,
  referenceOptionsError,
  isSubmitting,
  onSubmit,
  onClear,
}: AcademicSchoolsSearchFormPanelProps) {
  return (
    <Paper p="lg">
      <Stack gap="lg">
        <Title order={1}>School Search</Title>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <SearchFormSection legend="Search Filters">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  clearable
                  searchable
                  label="Academic School"
                  placeholder="All schools"
                  data={schoolOptions}
                  value={form.values.schoolId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('schoolId', value ?? '');

                    if (
                      value &&
                      form.values.departmentId &&
                      !departmentOptions.some(
                        (option) =>
                          option.value === form.values.departmentId &&
                          option.schoolId === Number(value)
                      )
                    ) {
                      form.setFieldValue('departmentId', '');
                      return;
                    }

                    if (!value) {
                      return;
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  clearable
                  searchable
                  label="Academic Department"
                  placeholder="All departments"
                  data={visibleDepartmentOptions.map(({ label, value }) => ({ label, value }))}
                  value={form.values.departmentId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('departmentId', value ?? '');
                  }}
                />
              </Grid.Col>
            </SearchFormSection>

            <SearchFormActions
              showQueryControls={false}
              clearLabel="Clear"
              submitLabel="Search Academic Schools"
              isSubmitting={isSubmitting}
              onClear={onClear}
            />
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
