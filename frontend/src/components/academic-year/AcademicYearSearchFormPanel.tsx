import { Checkbox, Grid, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type {
  AcademicYearSearchSize,
} from '@/services/academic-year-search-config';
import {
  academicYearSearchSizeSelectOptions,
  academicYearSortByOptions,
  academicYearSortDirectionOptions,
} from '@/services/academic-year-search-config';
import type {
  AcademicYearSearchFilters,
  AcademicYearSortBy,
  AcademicYearSortDirection,
} from '@/services/schemas/academic-years-schemas';

type AcademicYearSearchFormPanelProps = {
  form: UseFormReturnType<AcademicYearSearchFilters>;
  size: AcademicYearSearchSize;
  sortBy: AcademicYearSortBy;
  sortDirection: AcademicYearSortDirection;
  yearStatusOptions: ReadonlyArray<StringOption>;
  yearStatusOptionsLoading: boolean;
  yearStatusOptionsError: string | null;
  isSubmitting: boolean;
  onSubmit: (values: AcademicYearSearchFilters) => void;
  onClear: () => void;
  onSizeChange: (value: string | null) => void;
  onSortByChange: (value: string | null) => void;
  onSortDirectionChange: (value: string | null) => void;
};

export function AcademicYearSearchFormPanel({
  form,
  size,
  sortBy,
  sortDirection,
  yearStatusOptions,
  yearStatusOptionsLoading,
  yearStatusOptionsError,
  isSubmitting,
  onSubmit,
  onClear,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
}: AcademicYearSearchFormPanelProps) {
  return (
    <Paper p="lg">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="lg">
          <SearchFormActions
            leadingContent={<Title order={1}>Academic Year Search</Title>}
            size={String(size)}
            sortBy={sortBy}
            sortDirection={sortDirection}
            sizeOptions={academicYearSearchSizeSelectOptions}
            sortByOptions={academicYearSortByOptions}
            sortDirectionOptions={academicYearSortDirectionOptions}
            onSizeChange={onSizeChange}
            onSortByChange={onSortByChange}
            onSortDirectionChange={onSortDirectionChange}
            showButtons={false}
          />

          <SearchFormSection legend="Search Filters">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Search"
                placeholder="Search by academic year code or name"
                {...form.getInputProps('query')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                clearable
                label="Year Status"
                placeholder="All years"
                data={yearStatusOptions}
                value={form.values.yearStatusCode || null}
                loading={yearStatusOptionsLoading}
                error={yearStatusOptionsError ?? undefined}
                onChange={(value) => {
                  form.setFieldValue('yearStatusCode', value ?? '');
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Checkbox
                mt="xl"
                label="Current year only"
                {...form.getInputProps('currentOnly', { type: 'checkbox' })}
              />
            </Grid.Col>
          </SearchFormSection>

          <SearchFormActions
            showQueryControls={false}
            clearLabel="Clear"
            submitLabel="Search Academic Years"
            isSubmitting={isSubmitting}
            onClear={onClear}
          />
        </Stack>
      </form>
    </Paper>
  );
}
