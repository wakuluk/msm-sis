// Search/results surface for academic-year course offerings.
// Supports year-wide browsing plus sub-term locked searches that can drive the real section workspace.
import {
  Badge,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type { CourseSectionSearchValues } from './CourseSectionsWorkspace';
import type { CourseTermOption } from './academicYearCoursesShared';
import { AcademicYearCourseOfferingResults } from './AcademicYearCourseOfferingResults';
import { AcademicYearCourseOfferingSearchControls } from './AcademicYearCourseOfferingSearchControls';
import {
  useAcademicYearCourseOfferingSearch,
  yearOfferingsPageSize,
} from './useAcademicYearCourseOfferingSearch';

type AcademicYearCourseOfferingSearchSectionProps = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  termOptions: ReadonlyArray<CourseTermOption>;
  reloadKey: number;
  initialSubTermId?: string | null;
  lockSubTermFilter?: boolean;
  onOfferingSelected?: (offering: AcademicYearCourseOfferingSearchResultResponse) => void;
  onViewSearchSections?: (
    offerings: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>
  ) => void;
  sectionSearchValues?: CourseSectionSearchValues;
  onSectionSearchValuesChange?: (values: CourseSectionSearchValues) => void;
};

export function AcademicYearCourseOfferingSearchSection({
  academicYearId,
  hasValidAcademicYearId,
  termOptions,
  reloadKey,
  initialSubTermId = null,
  lockSubTermFilter = false,
  onOfferingSelected,
  onViewSearchSections,
  sectionSearchValues,
  onSectionSearchValuesChange,
}: AcademicYearCourseOfferingSearchSectionProps) {
  const {
    departmentOptions,
    handleClearSearch,
    handleDepartmentChange,
    handleSchoolChange,
    handleSearch,
    handleSubjectChange,
    handleToggleSort,
    referenceState,
    resultsPanelStatus,
    resultsSummary,
    resultsView,
    schoolOptions,
    searchState,
    searchValues,
    setPage,
    setResultsView,
    setSearchValues,
    sortBy,
    sortDirection,
    subjectOptions,
    table,
    tableData,
  } = useAcademicYearCourseOfferingSearch({
    academicYearId,
    hasValidAcademicYearId,
    initialSubTermId,
    lockSubTermFilter,
    onSectionSearchValuesChange,
    reloadKey,
  });

  return (
    <>
      <Grid.Col span={12}>
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <Stack gap={2}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Academic Year Courses
                </Text>
                <Text fw={600}>Academic year course offerings</Text>
                <Text size="sm" c="dimmed">
                  Search the year-wide course offering list and filter it by school, department,
                  subject, course code, title, and assigned term.
                </Text>
              </Stack>
            </Group>

            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text size="sm" c="dimmed">
                This list pages through the year-scoped course offerings for this academic year.
              </Text>
              <Badge variant="light" color="blue">
                {yearOfferingsPageSize} per page
              </Badge>
            </Group>

            <AcademicYearCourseOfferingSearchControls
              departmentOptions={departmentOptions}
              hasValidAcademicYearId={hasValidAcademicYearId}
              lockSubTermFilter={lockSubTermFilter}
              referenceState={referenceState}
              schoolOptions={schoolOptions}
              searchIsLoading={searchState.status === 'loading'}
              searchValues={searchValues}
              sectionSearchValues={sectionSearchValues}
              subjectOptions={subjectOptions}
              termOptions={termOptions}
              onClearSearch={handleClearSearch}
              onDepartmentChange={handleDepartmentChange}
              onSchoolChange={handleSchoolChange}
              onSearch={handleSearch}
              onSearchValuesChange={setSearchValues}
              onSectionSearchValuesChange={onSectionSearchValuesChange}
              onSubjectChange={handleSubjectChange}
            />

            <AcademicYearCourseOfferingResults
              resultsPanelStatus={resultsPanelStatus}
              resultsSummary={resultsSummary}
              resultsView={resultsView}
              searchState={searchState}
              sortBy={sortBy}
              sortDirection={sortDirection}
              table={table}
              tableData={tableData}
              onOfferingSelected={onOfferingSelected}
              onPageChange={setPage}
              onToggleSort={handleToggleSort}
              onViewChange={setResultsView}
              onViewSearchSections={onViewSearchSections}
            />
          </Stack>
        </Paper>
      </Grid.Col>
    </>
  );
}
