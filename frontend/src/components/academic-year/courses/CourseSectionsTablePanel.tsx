// Search/filter/table panel for course sections.
// Displays sections for either one selected offering or all offerings in the current search scope.
import { Alert, Badge, Grid, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type {
  CourseSectionPreview,
  CourseSectionSearchValues,
  SectionReferenceState,
  SelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionListErrorState = { status: 'error'; message: string } | { status: string };
type CourseSectionDetailErrorState = { status: 'error'; message: string } | { status: string };

type CourseSectionsTablePanelProps = {
  activeOfferingCount: number;
  allSectionCount: number;
  filteredSections: CourseSectionPreview[];
  hasActiveScope: boolean;
  isSearchScope: boolean;
  page: number;
  pagedSections: CourseSectionPreview[];
  referencesAreLoading: boolean;
  referenceState: SectionReferenceState;
  searchValues: CourseSectionSearchValues;
  sectionDetailState: CourseSectionDetailErrorState;
  sectionListState: CourseSectionListErrorState;
  sectionStatusOptions: SelectOption[];
  sectionsAreLoading: boolean;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  subTermLabel: string;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
  onSectionSelected: (section: CourseSectionPreview) => void;
};

const courseSectionsPageSize = 10;

export function CourseSectionsTablePanel({
  activeOfferingCount,
  allSectionCount,
  filteredSections,
  hasActiveScope,
  isSearchScope,
  page,
  pagedSections,
  referencesAreLoading,
  referenceState,
  searchValues,
  sectionDetailState,
  sectionListState,
  sectionStatusOptions,
  sectionsAreLoading,
  selectedOffering,
  subTermLabel,
  totalPages,
  onPageChange,
  onSearchValuesChange,
  onSectionSelected,
}: CourseSectionsTablePanelProps) {
  return (
    <Stack gap="md">
      {isSearchScope && hasActiveScope ? (
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={2}>
            <Text fw={700}>Current offering search</Text>
            <Text size="sm" c="dimmed">
              Showing sections for the course offerings currently visible in the search results.
            </Text>
          </Stack>
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue">
              {subTermLabel}
            </Badge>
            <Badge variant="light" color="gray">
              {activeOfferingCount} offerings
            </Badge>
            <Badge variant="light" color="green">
              {allSectionCount} sections
            </Badge>
            {sectionsAreLoading ? (
              <Badge variant="light" color="gray">
                Loading
              </Badge>
            ) : null}
          </Group>
        </Group>
      ) : selectedOffering ? (
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={2}>
            <Text fw={700}>{selectedOffering.courseCode ?? 'Course offering'}</Text>
            <Text size="sm" c="dimmed">
              {selectedOffering.title ?? 'Title unavailable'}
            </Text>
          </Stack>
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue">
              {subTermLabel}
            </Badge>
            <Badge variant="light" color="green">
              {allSectionCount} sections
            </Badge>
            {sectionsAreLoading ? (
              <Badge variant="light" color="gray">
                Loading
              </Badge>
            ) : null}
          </Group>
        </Group>
      ) : (
        <Alert color="gray" title="Select a course offering">
          Choose a course offering above, or use View offering sections to review the current search
          results.
        </Alert>
      )}

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

      {referenceState.status === 'error' ? (
        <Alert color="red" title="Unable to load section reference options">
          {referenceState.message}
        </Alert>
      ) : null}

      {isErrorState(sectionListState) ? (
        <Alert color="red" title="Unable to load course sections">
          {sectionListState.message}
        </Alert>
      ) : null}

      {isErrorState(sectionDetailState) ? (
        <Alert color="red" title="Unable to load course section detail">
          {sectionDetailState.message}
        </Alert>
      ) : null}

      {hasActiveScope && sectionsAreLoading && filteredSections.length === 0 ? (
        <Alert color="blue" title="Loading course sections">
          Loading sections for the selected course offering scope.
        </Alert>
      ) : null}

      {hasActiveScope && !sectionsAreLoading && filteredSections.length === 0 ? (
        <Alert color="gray" title="No sections match these filters">
          Adjust the section filters to see more sections for this scope.
        </Alert>
      ) : null}

      {hasActiveScope && filteredSections.length > 0 ? (
        <Table.ScrollContainer minWidth={920}>
          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {isSearchScope ? <Table.Th>Course</Table.Th> : null}
                <Table.Th>Section</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Instructor</Table.Th>
                <Table.Th>Meeting Pattern</Table.Th>
                <Table.Th>Room</Table.Th>
                <Table.Th>Seats</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedSections.map((section) => (
                <Table.Tr
                  key={section.sectionId}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onSectionSelected(section);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSectionSelected(section);
                    }
                  }}
                >
                  {isSearchScope ? (
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {section.courseCode}
                      </Text>
                    </Table.Td>
                  ) : null}
                  <Table.Td>{section.sectionCode}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={section.statusCode === 'DRAFT' ? 'gray' : 'green'}
                    >
                      {section.statusName}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{section.instructor}</Table.Td>
                  <Table.Td>{section.meetingPattern}</Table.Td>
                  <Table.Td>{section.room}</Table.Td>
                  <Table.Td>
                    {section.enrolled}/{section.capacity}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : null}

      {hasActiveScope && filteredSections.length > 0 ? (
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Text size="sm" c="dimmed">
            Showing {page * courseSectionsPageSize + 1}-
            {Math.min(
              page * courseSectionsPageSize + pagedSections.length,
              filteredSections.length
            )}{' '}
            of {filteredSections.length} sections
          </Text>
          <SearchPaginationFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </Group>
      ) : null}
    </Stack>
  );
}

function isErrorState(
  state: CourseSectionListErrorState | CourseSectionDetailErrorState
): state is { status: 'error'; message: string } {
  return state.status === 'error';
}
