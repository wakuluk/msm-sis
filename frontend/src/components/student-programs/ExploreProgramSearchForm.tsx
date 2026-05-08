import { Alert, Grid, Select, Stack, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type {
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import { isNonDegreeProgramType } from './explore-programs.helpers';
import type {
  ProgramExploreCatalogOption,
  ProgramExploreDepartmentOption,
  ProgramExploreFilters,
  ProgramExploreSize,
} from './explore-programs.types';

type ExploreProgramSearchFormProps = {
  degreeTypeOptions: ProgramExploreCatalogOption[];
  departmentOptions: ProgramExploreDepartmentOption[];
  form: UseFormReturnType<ProgramExploreFilters>;
  isSubmitting: boolean;
  onClear: () => void;
  onSearch: (values: ProgramExploreFilters) => void;
  onSizeChange: (value: string | null) => void;
  onSortByChange: (value: string | null) => void;
  onSortDirectionChange: (value: string | null) => void;
  programTypeOptions: ProgramExploreCatalogOption[];
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
  schoolOptions: ProgramExploreCatalogOption[];
  size: ProgramExploreSize;
  sizeOptions: ReadonlyArray<StringOption<ProgramExploreSize>>;
  sortBy: ProgramSearchSortBy;
  sortByOptions: ReadonlyArray<StringOption<ProgramSearchSortBy>>;
  sortDirection: ProgramSearchSortDirection;
  sortDirectionOptions: ReadonlyArray<StringOption<ProgramSearchSortDirection>>;
  visibleDepartmentOptions: ProgramExploreDepartmentOption[];
};

export function ExploreProgramSearchForm({
  degreeTypeOptions,
  departmentOptions,
  form,
  isSubmitting,
  onClear,
  onSearch,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
  programTypeOptions,
  referenceOptionsError,
  referenceOptionsLoading,
  schoolOptions,
  size,
  sizeOptions,
  sortBy,
  sortByOptions,
  sortDirection,
  sortDirectionOptions,
  visibleDepartmentOptions,
}: ExploreProgramSearchFormProps) {
  return (
    <form onSubmit={form.onSubmit(onSearch)}>
      <Stack gap="md">
        <SearchFormSection legend="Program Search">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              clearable
              searchable
              label="Program Type"
              placeholder="All requestable types"
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
          <Alert color="red" title="Unable to load program filters">
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
  );
}
