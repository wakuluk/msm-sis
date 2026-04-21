import {
  Alert,
  Checkbox,
  Grid,
  Loader,
  MultiSelect,
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
  courseOfferingSearchSizeSelectOptions,
  courseOfferingSortByOptions,
  courseOfferingSortDirectionOptions,
  parseCourseOfferingSearchSize,
  parseCourseOfferingSortBy,
  parseCourseOfferingSortDirection,
  type CourseOfferingSearchSize,
} from '@/services/course-offering-search-config';
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
  publishedOnly: boolean;
  errorMessage: string | null;
  searchResultsIdle: boolean;
  onOfferingStatusCodesChange: (values: string[]) => void;
  onTermStatusCodesChange: (values: string[]) => void;
  onIncludeInactiveChange: (value: boolean) => void;
  onPublishedOnlyChange: (value: boolean) => void;
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
  publishedOnly,
  errorMessage,
  searchResultsIdle,
  onOfferingStatusCodesChange,
  onTermStatusCodesChange,
  onIncludeInactiveChange,
  onPublishedOnlyChange,
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
          <SearchFormActions
            leadingContent={<Title order={1}>{title}</Title>}
            trailingContent={isLoadingReferenceOptions ? <Loader size="sm" /> : null}
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
            queryControlWidths={{
              size: 150,
              sortBy: 180,
              sortDirection: 170,
            }}
            showButtons={false}
            actionsClassName={classes.actionGroup}
          />

          {errorMessage ? (
            <Alert color="red" variant="light" radius="md">
              {errorMessage}
            </Alert>
          ) : null}

          <SearchFormSection legend="Core Filters">
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
          </SearchFormSection>

          <SearchFormSection legend="Keyword Filters">
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
          </SearchFormSection>

          {showAdvancedFilters ? (
            <SearchFormSection legend="Administrative Filters">
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
              <Grid.Col span={{ base: 12 }}>
                <Checkbox
                  label="Published only"
                  checked={publishedOnly}
                  onChange={(event) => {
                    onPublishedOnlyChange(event.currentTarget.checked);
                  }}
                />
              </Grid.Col>
            </SearchFormSection>
          ) : null}

          <SearchFormActions
            showQueryControls={false}
            clearLabel="Clear"
            submitLabel="Search offerings"
            clearDisabled={!hasSearchValues && searchResultsIdle}
            isSubmitting={isSearching}
            onClear={onClear}
            actionsClassName={classes.actionGroup}
            clearButtonClassName={classes.secondaryAction}
            submitButtonClassName={classes.primaryAction}
          />
        </Stack>
      </form>
    </Paper>
  );
}
