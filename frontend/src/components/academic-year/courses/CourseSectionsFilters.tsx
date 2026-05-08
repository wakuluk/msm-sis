// Filter controls for course section search results.
import { Grid, Select, TextInput } from '@mantine/core';
import type {
  CourseSectionSearchValues,
  SelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionsFiltersProps = {
  hasActiveScope: boolean;
  isSearchScope: boolean;
  referencesAreLoading: boolean;
  searchValues: CourseSectionSearchValues;
  sectionStatusOptions: SelectOption[];
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
};

export function CourseSectionsFilters({
  hasActiveScope,
  isSearchScope,
  referencesAreLoading,
  searchValues,
  sectionStatusOptions,
  onSearchValuesChange,
}: CourseSectionsFiltersProps) {
  return (
    <Grid>
      {isSearchScope ? (
        <Grid.Col span={{ base: 12, md: 2 }}>
          <TextInput
            label="Course"
            placeholder="MUS 101"
            value={searchValues.courseCode}
            onChange={(event) => {
              onSearchValuesChange({
                ...searchValues,
                courseCode: event.currentTarget.value,
              });
            }}
            disabled={!hasActiveScope}
          />
        </Grid.Col>
      ) : null}
      <Grid.Col span={{ base: 12, md: 2 }}>
        <TextInput
          label="Section"
          placeholder="01"
          value={searchValues.sectionCode}
          onChange={(event) => {
            onSearchValuesChange({
              ...searchValues,
              sectionCode: event.currentTarget.value,
            });
          }}
          disabled={!hasActiveScope}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: isSearchScope ? 2 : 3 }}>
        <TextInput
          label="Instructor"
          placeholder="Filter by instructor"
          value={searchValues.instructor}
          onChange={(event) => {
            onSearchValuesChange({
              ...searchValues,
              instructor: event.currentTarget.value,
            });
          }}
          disabled={!hasActiveScope}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: isSearchScope ? 2 : 3 }}>
        <TextInput
          label="Meeting Pattern"
          placeholder="Filter by meeting pattern"
          value={searchValues.meetingPattern}
          onChange={(event) => {
            onSearchValuesChange({
              ...searchValues,
              meetingPattern: event.currentTarget.value,
            });
          }}
          disabled={!hasActiveScope}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 2 }}>
        <TextInput
          label="Room"
          placeholder="Room"
          value={searchValues.room}
          onChange={(event) => {
            onSearchValuesChange({
              ...searchValues,
              room: event.currentTarget.value,
            });
          }}
          disabled={!hasActiveScope}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 2 }}>
        <Select
          label="Status"
          placeholder="Any status"
          data={sectionStatusOptions}
          value={searchValues.status}
          onChange={(value) => {
            onSearchValuesChange({
              ...searchValues,
              status: value,
            });
          }}
          clearable
          disabled={!hasActiveScope || referencesAreLoading}
        />
      </Grid.Col>
    </Grid>
  );
}
