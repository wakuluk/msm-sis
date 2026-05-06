import { Alert, Button, Grid, Group, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type {
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import type { ProgramCatalogOption, ProgramDepartmentOption } from './CreateProgramModal';

export type ProgramSearchFilters = {
  programTypeId: string;
  degreeTypeId: string;
  schoolId: string;
  departmentId: string;
  code: string;
  name: string;
};

type ProgramSearchFormPanelProps<TSize extends string> = {
  form: UseFormReturnType<ProgramSearchFilters>;
  programTypeOptions: ProgramCatalogOption[];
  degreeTypeOptions: ProgramCatalogOption[];
  schoolOptions: ProgramCatalogOption[];
  departmentOptions: ProgramDepartmentOption[];
  visibleDepartmentOptions: ProgramDepartmentOption[];
  referenceOptionsLoading: boolean;
  referenceOptionsError: string | null;
  size: TSize;
  sortBy: ProgramSearchSortBy;
  sortDirection: ProgramSearchSortDirection;
  sizeOptions: ReadonlyArray<StringOption<TSize>>;
  sortByOptions: ReadonlyArray<StringOption<ProgramSearchSortBy>>;
  sortDirectionOptions: ReadonlyArray<StringOption<ProgramSearchSortDirection>>;
  isSubmitting: boolean;
  onSubmit: (values: ProgramSearchFilters) => void;
  onClear: () => void;
  onCreateProgram: () => void;
  onSizeChange: (value: string | null) => void;
  onSortByChange: (value: string | null) => void;
  onSortDirectionChange: (value: string | null) => void;
};

function isNonDegreeProgramType(option: ProgramCatalogOption | undefined) {
  return option?.code === 'MINOR' || option?.code === 'CERTIFICATE';
}

export function ProgramSearchFormPanel<TSize extends string>({
  form,
  programTypeOptions,
  degreeTypeOptions,
  schoolOptions,
  departmentOptions,
  visibleDepartmentOptions,
  referenceOptionsLoading,
  referenceOptionsError,
  size,
  sortBy,
  sortDirection,
  sizeOptions,
  sortByOptions,
  sortDirectionOptions,
  isSubmitting,
  onSubmit,
  onClear,
  onCreateProgram,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
}: ProgramSearchFormPanelProps<TSize>) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="center" gap="md">
          <Title order={1}>Program Search</Title>
          <Button onClick={onCreateProgram}>Create Program</Button>
        </Group>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <SearchFormSection legend="Program Filters">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  clearable
                  searchable
                  label="Program Type"
                  placeholder="All types"
                  data={programTypeOptions}
                  value={form.values.programTypeId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  onChange={(value) => {
                    form.setFieldValue('programTypeId', value ?? '');

                    const selectedProgramType = programTypeOptions.find(
                      (option) => option.value === value
                    );
                    if (isNonDegreeProgramType(selectedProgramType)) {
                      form.setFieldValue('degreeTypeId', '');
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  clearable
                  searchable
                  label="Degree Type"
                  placeholder="All degrees"
                  data={degreeTypeOptions}
                  value={form.values.degreeTypeId || null}
                  loading={referenceOptionsLoading}
                  error={referenceOptionsError ?? undefined}
                  disabled={isNonDegreeProgramType(
                    programTypeOptions.find((option) => option.value === form.values.programTypeId)
                  )}
                  onChange={(value) => {
                    form.setFieldValue('degreeTypeId', value ?? '');
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  clearable
                  searchable
                  label="School"
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
                      form.setFieldValue('departmentId', '');
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  clearable
                  searchable
                  label="Department"
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
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput label="Program Code" {...form.getInputProps('code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput label="Program Name" {...form.getInputProps('name')} />
              </Grid.Col>
            </SearchFormSection>

            {referenceOptionsError ? (
              <Alert color="red" title="Unable to load program search filters">
                {referenceOptionsError}
              </Alert>
            ) : null}

            <SearchFormActions
              size={size}
              sortBy={sortBy}
              sortDirection={sortDirection}
              sizeOptions={sizeOptions}
              sortByOptions={sortByOptions}
              sortDirectionOptions={sortDirectionOptions}
              onSizeChange={onSizeChange}
              onSortByChange={onSortByChange}
              onSortDirectionChange={onSortDirectionChange}
              clearLabel="Clear"
              submitLabel="Search Programs"
              isSubmitting={isSubmitting}
              onClear={onClear}
            />
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
