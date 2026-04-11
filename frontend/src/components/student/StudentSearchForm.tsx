import {
  Alert,
  Button,
  Collapse,
  Grid,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import {
  parseStudentSearchSize,
  parseStudentSortBy,
  parseStudentSortDirection,
  studentSearchSizeSelectOptions,
  studentSortByOptions,
  studentSortDirectionOptions,
  type StudentSearchSize,
} from '@/services/student-service';
import type {
  StudentSearchFilters,
  StudentSortBy,
  StudentSortDirection,
} from '@/services/schemas/student-schemas';

type SelectOption = {
  value: string;
  label: string;
};

type StudentFilterSelectOptions = {
  classStandings: SelectOption[];
  ethnicities: SelectOption[];
  genders: SelectOption[];
};

type StudentSearchFormProps = {
  form: UseFormReturnType<StudentSearchFilters>;
  showAdvancedSearch: boolean;
  isSearching: boolean;
  size: StudentSearchSize;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  studentFilterSelectOptions: StudentFilterSelectOptions;
  referenceOptionsError: string | null;
  onPageSizeChange: (size: StudentSearchSize) => void;
  onSortByChange: (sortBy: StudentSortBy) => void;
  onSortDirectionChange: (sortDirection: StudentSortDirection) => void;
  onToggleAdvancedSearch: () => void;
  onClear: () => void;
  onSubmit: (values: StudentSearchFilters) => void;
};

const studentClassOfSelectOptions = Array.from({ length: 41 }, (_, index) => {
  const year = String(new Date().getFullYear() + 10 - index);

  return {
    value: year,
    label: year,
  };
});

export function StudentSearchForm({
  form,
  showAdvancedSearch,
  isSearching,
  size,
  sortBy,
  sortDirection,
  studentFilterSelectOptions,
  referenceOptionsError,
  onPageSizeChange,
  onSortByChange,
  onSortDirectionChange,
  onToggleAdvancedSearch,
  onClear,
  onSubmit,
}: StudentSearchFormProps) {
  return (
    <Paper p="lg">
      <Stack gap="xl">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="lg">
            <SearchFormActions
              leadingContent={<Title order={1}>Student Search</Title>}
              size={String(size)}
              sortBy={sortBy}
              sortDirection={sortDirection}
              sizeOptions={studentSearchSizeSelectOptions}
              sortByOptions={studentSortByOptions}
              sortDirectionOptions={studentSortDirectionOptions}
              onSizeChange={(value) => {
                onPageSizeChange(parseStudentSearchSize(value));
              }}
              onSortByChange={(value) => {
                onSortByChange(parseStudentSortBy(value));
              }}
              onSortDirectionChange={(value) => {
                onSortDirectionChange(parseStudentSortDirection(value));
              }}
              showButtons={false}
            />

            <SearchFormSection legend="Core Filters">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Last name"
                  placeholder="Enter a last name"
                  {...form.getInputProps('lastName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="First name"
                  placeholder="Enter a first name"
                  {...form.getInputProps('firstName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Student ID"
                  placeholder="Enter a student ID"
                  inputMode="numeric"
                  {...form.getInputProps('studentId')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  searchable
                  clearable
                  label="Class of"
                  placeholder="Select a graduation year"
                  data={studentClassOfSelectOptions}
                  value={form.values.classOf || null}
                  onChange={(value) => {
                    form.setFieldValue('classOf', value ?? '');
                  }}
                />
              </Grid.Col>
            </SearchFormSection>

            <SearchFormActions
              leadingContent={
                <Button type="button" variant="light" onClick={onToggleAdvancedSearch}>
                  {showAdvancedSearch ? 'Hide Advanced Search' : 'Advanced Search'}
                </Button>
              }
              showQueryControls={false}
              clearLabel="Clear"
              submitLabel="Search Students"
              isSubmitting={isSearching}
              onClear={onClear}
              align="center"
            />

            <Collapse expanded={showAdvancedSearch}>
              <Stack gap="lg" pt="xs">
                <SearchFormSection legend="Student Filters">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      searchable
                      clearable
                      label="Gender"
                      placeholder="Select a gender"
                      data={studentFilterSelectOptions.genders}
                      value={form.values.genderId || null}
                      onChange={(value) => {
                        form.setFieldValue('genderId', value ?? '');
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      searchable
                      clearable
                      label="Ethnicity"
                      placeholder="Select an ethnicity"
                      data={studentFilterSelectOptions.ethnicities}
                      value={form.values.ethnicityId || null}
                      onChange={(value) => {
                        form.setFieldValue('ethnicityId', value ?? '');
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      searchable
                      clearable
                      label="Class standing"
                      placeholder="Select a class standing"
                      data={studentFilterSelectOptions.classStandings}
                      value={form.values.classStandingId || null}
                      onChange={(value) => {
                        form.setFieldValue('classStandingId', value ?? '');
                      }}
                    />
                  </Grid.Col>
                </SearchFormSection>

                {referenceOptionsError ? (
                  <Alert color="red" title="Unable to load student filter options">
                    {referenceOptionsError}
                  </Alert>
                ) : null}

                <SearchFormSection legend="Address Filters">
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address line 1"
                      placeholder="Enter address line 1"
                      {...form.getInputProps('addressLine1')}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address line 2"
                      placeholder="Enter address line 2"
                      {...form.getInputProps('addressLine2')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="City"
                      placeholder="Enter a city"
                      {...form.getInputProps('city')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="State / region"
                      placeholder="Enter a state or region"
                      {...form.getInputProps('stateRegion')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      label="Postal code"
                      placeholder="Enter a postal code"
                      {...form.getInputProps('postalCode')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      label="Country code"
                      placeholder="Enter a country code"
                      {...form.getInputProps('countryCode')}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormSection legend="System Filters">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Updated by"
                      placeholder="Enter an updated by value"
                      {...form.getInputProps('updatedBy')}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormActions
                  leadingContent={
                    <Button type="button" variant="light" onClick={onToggleAdvancedSearch}>
                      {showAdvancedSearch ? 'Hide Advanced Search' : 'Advanced Search'}
                    </Button>
                  }
                  size={String(size)}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  sizeOptions={studentSearchSizeSelectOptions}
                  sortByOptions={studentSortByOptions}
                  sortDirectionOptions={studentSortDirectionOptions}
                  onSizeChange={(value) => {
                    onPageSizeChange(parseStudentSearchSize(value));
                  }}
                  onSortByChange={(value) => {
                    onSortByChange(parseStudentSortBy(value));
                  }}
                  onSortDirectionChange={(value) => {
                    onSortDirectionChange(parseStudentSortDirection(value));
                  }}
                  queryControlLabelMode="placeholder"
                  clearLabel="Clear"
                  submitLabel="Search Students"
                  isSubmitting={isSearching}
                  onClear={onClear}
                />
              </Stack>
            </Collapse>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
