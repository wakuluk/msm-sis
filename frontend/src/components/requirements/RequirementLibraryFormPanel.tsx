import { Button, Grid, Group, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { requirementTypeOptions } from '@/components/requirements/requirementFormTypes';

export type RequirementSearchFilters = {
  code: string;
  name: string;
  requirementType: string;
};

type RequirementLibraryFormPanelProps<TSize extends string> = {
  form: UseFormReturnType<RequirementSearchFilters>;
  size: TSize;
  sizeOptions: ReadonlyArray<StringOption<TSize>>;
  isSubmitting: boolean;
  onSubmit: (values: RequirementSearchFilters) => void;
  onClear: () => void;
  onCreateRequirement: () => void;
  onSizeChange: (value: string | null) => void;
};

export function RequirementLibraryFormPanel<TSize extends string>({
  form,
  size,
  sizeOptions,
  isSubmitting,
  onSubmit,
  onClear,
  onCreateRequirement,
  onSizeChange,
}: RequirementLibraryFormPanelProps<TSize>) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="center" gap="md">
          <Title order={1}>Requirement Library</Title>
          <Button onClick={onCreateRequirement}>Create Requirement</Button>
        </Group>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <SearchFormSection legend="Requirement Filters">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput label="Requirement Code" {...form.getInputProps('code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <TextInput label="Requirement Name" {...form.getInputProps('name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  clearable
                  label="Requirement Type"
                  placeholder="All types"
                  data={requirementTypeOptions}
                  value={form.values.requirementType || null}
                  onChange={(value) => {
                    form.setFieldValue('requirementType', value ?? '');
                  }}
                />
              </Grid.Col>
            </SearchFormSection>

            <SearchFormActions
              size={size}
              sizeOptions={sizeOptions}
              sortBy="name"
              sortDirection="asc"
              sortByOptions={[]}
              sortDirectionOptions={[]}
              onSizeChange={onSizeChange}
              onSortByChange={() => undefined}
              onSortDirectionChange={() => undefined}
              clearLabel="Clear"
              submitLabel="Search Requirements"
              isSubmitting={isSubmitting}
              onClear={onClear}
            />
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
