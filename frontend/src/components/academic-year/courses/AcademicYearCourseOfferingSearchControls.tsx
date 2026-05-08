import type { Dispatch, SetStateAction } from 'react';
import { Alert, Button, Grid, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import type { CourseSectionSearchValues } from './CourseSectionsWorkspace';
import type { CourseTermOption } from './academicYearCoursesShared';
import type {
  YearOfferingReferenceState,
  YearOfferingSearchFormValues,
} from './useAcademicYearCourseOfferingSearch';

type SelectOption = {
  label: string;
  value: string;
};

type AcademicYearCourseOfferingSearchControlsProps = {
  departmentOptions: ReadonlyArray<SelectOption>;
  hasValidAcademicYearId: boolean;
  lockSubTermFilter: boolean;
  onClearSearch: () => void;
  onDepartmentChange: (value: string | null) => void;
  onSchoolChange: (value: string | null) => void;
  onSearch: () => void;
  onSearchValuesChange: Dispatch<SetStateAction<YearOfferingSearchFormValues>>;
  onSectionSearchValuesChange?: (values: CourseSectionSearchValues) => void;
  onSubjectChange: (value: string | null) => void;
  referenceState: YearOfferingReferenceState;
  schoolOptions: ReadonlyArray<SelectOption>;
  searchIsLoading: boolean;
  searchValues: YearOfferingSearchFormValues;
  sectionSearchValues?: CourseSectionSearchValues;
  subjectOptions: ReadonlyArray<SelectOption>;
  termOptions: ReadonlyArray<CourseTermOption>;
};

export function AcademicYearCourseOfferingSearchControls({
  departmentOptions,
  hasValidAcademicYearId,
  lockSubTermFilter,
  onClearSearch,
  onDepartmentChange,
  onSchoolChange,
  onSearch,
  onSearchValuesChange,
  onSectionSearchValuesChange,
  onSubjectChange,
  referenceState,
  schoolOptions,
  searchIsLoading,
  searchValues,
  sectionSearchValues,
  subjectOptions,
  termOptions,
}: AcademicYearCourseOfferingSearchControlsProps) {
  const showSectionSearch = sectionSearchValues && onSectionSearchValuesChange;

  return (
    <>
      {referenceState.status === 'error' ? (
        <Alert color="red" title="Unable to load offering filters">
          {referenceState.message}
        </Alert>
      ) : null}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Term"
            placeholder="Filter by term"
            data={termOptions}
            value={searchValues.subTermId}
            onChange={(value) => {
              onSearchValuesChange((current) => ({
                ...current,
                subTermId: value,
              }));
            }}
            searchable
            clearable={!lockSubTermFilter}
            disabled={!hasValidAcademicYearId || lockSubTermFilter}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="School"
            placeholder="Filter by school"
            data={schoolOptions}
            value={searchValues.schoolId}
            onChange={onSchoolChange}
            searchable
            clearable
            disabled={referenceState.status !== 'success'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Department"
            placeholder="Filter by department"
            data={departmentOptions}
            value={searchValues.departmentId}
            onChange={onDepartmentChange}
            searchable
            clearable
            disabled={referenceState.status !== 'success'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Subject"
            placeholder="Filter by subject"
            data={subjectOptions}
            value={searchValues.subjectId}
            onChange={onSubjectChange}
            searchable
            clearable
            disabled={referenceState.status !== 'success'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <TextInput
            label="Course Code"
            placeholder="Filter by course code"
            value={searchValues.courseCode}
            onChange={(event) => {
              onSearchValuesChange((current) => ({
                ...current,
                courseCode: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <TextInput
            label="Title"
            placeholder="Filter by title"
            value={searchValues.title}
            onChange={(event) => {
              onSearchValuesChange((current) => ({
                ...current,
                title: event.currentTarget.value,
              }));
            }}
          />
        </Grid.Col>
        {showSectionSearch ? (
          <Grid.Col span={12}>
            <Stack gap="sm">
              <Stack gap={2}>
                <Text fw={600}>Course section filters</Text>
                <Text size="sm" c="dimmed">
                  These filters apply when viewing sections for the current offering results.
                </Text>
              </Stack>
              <Grid>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <TextInput
                    label="Section"
                    placeholder="01"
                    value={sectionSearchValues.sectionCode}
                    onChange={(event) => {
                      onSectionSearchValuesChange({
                        ...sectionSearchValues,
                        sectionCode: event.currentTarget.value,
                      });
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Instructor"
                    placeholder="Filter by instructor"
                    value={sectionSearchValues.instructor}
                    onChange={(event) => {
                      onSectionSearchValuesChange({
                        ...sectionSearchValues,
                        instructor: event.currentTarget.value,
                      });
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Meeting Pattern"
                    placeholder="Filter by meeting pattern"
                    value={sectionSearchValues.meetingPattern}
                    onChange={(event) => {
                      onSectionSearchValuesChange({
                        ...sectionSearchValues,
                        meetingPattern: event.currentTarget.value,
                      });
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <TextInput
                    label="Room"
                    placeholder="Room"
                    value={sectionSearchValues.room}
                    onChange={(event) => {
                      onSectionSearchValuesChange({
                        ...sectionSearchValues,
                        room: event.currentTarget.value,
                      });
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    label="Status"
                    placeholder="Any status"
                    data={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Open', label: 'Open' },
                      { value: 'Closed', label: 'Closed' },
                    ]}
                    value={sectionSearchValues.status}
                    onChange={(value) => {
                      onSectionSearchValuesChange({
                        ...sectionSearchValues,
                        status: value,
                      });
                    }}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Grid.Col>
        ) : null}
        <Grid.Col span={12}>
          <Group justify="flex-end" align="center" wrap="wrap">
            <Button variant="default" onClick={onClearSearch}>
              Clear filters
            </Button>
            <Button onClick={onSearch} loading={searchIsLoading}>
              Search offerings
            </Button>
          </Group>
        </Grid.Col>
      </Grid>
    </>
  );
}
