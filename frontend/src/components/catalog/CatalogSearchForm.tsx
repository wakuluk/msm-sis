import {
  Alert,
  Button,
  Checkbox,
  Fieldset,
  Grid,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { SearchQueryControls } from '@/components/search/SearchQueryControls';
import {
  courseOfferingSearchSizeSelectOptions,
  courseOfferingSortByOptions,
  courseOfferingSortDirectionOptions,
  defaultCourseOfferingSearchSize,
  defaultCourseOfferingSortBy,
  defaultCourseOfferingSortDirection,
  parseCourseOfferingSearchSize,
  parseCourseOfferingSortBy,
  parseCourseOfferingSortDirection,
  type CourseOfferingSearchSize,
} from '@/services/catalog-service';
import type {
  CourseOfferingSearchFilters,
  CourseOfferingSearchSortBy,
  CourseOfferingSortDirection,
} from '@/services/schemas/catalog-schemas';
import classes from '@/pages/portal/Catalog.module.css';

type SelectOption = {
  value: string;
  label: string;
};

type CatalogSearchFormProps = {
  title: string;
  showAdvancedFilters: boolean;
  form: UseFormReturnType<CourseOfferingSearchFilters>;
  academicYearOptions: SelectOption[];
  termOptions: SelectOption[];
  departmentOptions: SelectOption[];
  subjectOptions: SelectOption[];
  offeringStatusOptions: SelectOption[];
  termStatusOptions: SelectOption[];
  hasLoadedReferenceOptions: boolean;
  isLoadingReferenceOptions: boolean;
  hasSearchValues: boolean;
  isSearching: boolean;
  pageSize: CourseOfferingSearchSize;
  sortBy: CourseOfferingSearchSortBy;
  sortDirection: CourseOfferingSortDirection;
  selectedOfferingStatusCodes: string[];
  selectedTermStatusCodes: string[];
  includeInactive: boolean;
  errorMessage: string | null;
  searchResultsIdle: boolean;
  onOfferingStatusCodesChange: (values: string[]) => void;
  onTermStatusCodesChange: (values: string[]) => void;
  onIncludeInactiveChange: (value: boolean) => void;
  onPageSizeChange: (size: CourseOfferingSearchSize) => void;
  onSortByChange: (sortBy: CourseOfferingSearchSortBy) => void;
  onSortDirectionChange: (sortDirection: CourseOfferingSortDirection) => void;
  onClear: () => void;
  onSubmit: (values: CourseOfferingSearchFilters) => void;
};

export function CatalogSearchForm({
  title,
  showAdvancedFilters,
  form,
  academicYearOptions,
  termOptions,
  departmentOptions,
  subjectOptions,
  offeringStatusOptions,
  termStatusOptions,
  hasLoadedReferenceOptions,
  isLoadingReferenceOptions,
  hasSearchValues,
  isSearching,
  pageSize,
  sortBy,
  sortDirection,
  selectedOfferingStatusCodes,
  selectedTermStatusCodes,
  includeInactive,
  errorMessage,
  searchResultsIdle,
  onOfferingStatusCodesChange,
  onTermStatusCodesChange,
  onIncludeInactiveChange,
  onPageSizeChange,
  onSortByChange,
  onSortDirectionChange,
  onClear,
  onSubmit,
}: CatalogSearchFormProps) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
            <Group align="flex-end" gap="sm" wrap="wrap">
              <Title order={1}>{title}</Title>
            </Group>

            <Group justify="flex-end" align="flex-end" gap="md" wrap="wrap" className={classes.actionGroup}>
              <SearchQueryControls
                size={String(pageSize)}
                sortBy={sortBy}
                sortDirection={sortDirection}
                sizeOptions={courseOfferingSearchSizeSelectOptions}
                sortByOptions={courseOfferingSortByOptions}
                sortDirectionOptions={courseOfferingSortDirectionOptions}
                onSizeChange={(value) => {
                  onPageSizeChange(parseCourseOfferingSearchSize(value));
                }}
                onSortByChange={(value) => {
                  onSortByChange(parseCourseOfferingSortBy(value));
                }}
                onSortDirectionChange={(value) => {
                  onSortDirectionChange(parseCourseOfferingSortDirection(value));
                }}
                labelMode="label"
                widths={{
                  size: 150,
                  sortBy: 180,
                  sortDirection: 170,
                }}
              />
            </Group>
            {isLoadingReferenceOptions ? <Loader size="sm" /> : null}
          </Group>

          {errorMessage ? (
            <Alert color="red" variant="light" radius="md">
              {errorMessage}
            </Alert>
          ) : null}

          <Fieldset legend="Core Filters" radius="sm">
            <Grid gap="md" mt="xs">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Academic year"
                  placeholder="Select academic year"
                  data={academicYearOptions}
                  clearable
                  searchable
                  disabled={!hasLoadedReferenceOptions}
                  {...form.getInputProps('academicYearCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Term"
                  placeholder="Select term"
                  data={termOptions}
                  clearable
                  searchable
                  disabled={!hasLoadedReferenceOptions}
                  {...form.getInputProps('termCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Department"
                  placeholder="Select department"
                  data={departmentOptions}
                  clearable
                  searchable
                  disabled={!hasLoadedReferenceOptions}
                  {...form.getInputProps('departmentCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Subject"
                  placeholder="Select subject"
                  data={subjectOptions}
                  clearable
                  searchable
                  disabled={!hasLoadedReferenceOptions}
                  {...form.getInputProps('subjectCode')}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>

          <Fieldset legend="Keyword Filters" radius="sm">
            <Grid gap="md" mt="xs">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Course code"
                  placeholder="TOLK101"
                  {...form.getInputProps('courseCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Title"
                  placeholder="Introduction to Tolkien Studies"
                  {...form.getInputProps('title')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Description"
                  placeholder="Search by catalog description"
                  {...form.getInputProps('description')}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>

          {showAdvancedFilters ? (
            <Fieldset legend="Administrative Filters" radius="sm">
              <Grid gap="md" mt="xs">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <MultiSelect
                    label="Offering statuses"
                    placeholder="Select offering statuses"
                    data={offeringStatusOptions}
                    searchable
                    clearable
                    hidePickedOptions
                    disabled={!hasLoadedReferenceOptions}
                    value={selectedOfferingStatusCodes}
                    onChange={onOfferingStatusCodesChange}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <MultiSelect
                    label="Term statuses"
                    placeholder="Select term statuses"
                    data={termStatusOptions}
                    searchable
                    clearable
                    hidePickedOptions
                    disabled={!hasLoadedReferenceOptions}
                    value={selectedTermStatusCodes}
                    onChange={onTermStatusCodesChange}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12 }}>
                  <Checkbox
                    label="Include inactive"
                    checked={includeInactive}
                    onChange={(event) => {
                      onIncludeInactiveChange(event.currentTarget.checked);
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Fieldset>
          ) : null}

          <Group justify="flex-end" align="flex-end" gap="md" wrap="wrap" className={classes.actionGroup}>
            <Button
              type="button"
              variant="default"
              className={classes.secondaryAction}
              onClick={onClear}
              disabled={!hasSearchValues && searchResultsIdle}
            >
              Clear
            </Button>
            <Button type="submit" loading={isSearching} className={classes.primaryAction}>
              Search offerings
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
