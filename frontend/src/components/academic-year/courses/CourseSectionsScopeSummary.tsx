// Displays the current section search scope and summary badges.
import { Alert, Badge, Group, Stack, Text } from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';

type CourseSectionsScopeSummaryProps = {
  activeOfferingCount: number;
  allSectionCount: number;
  hasActiveScope: boolean;
  isSearchScope: boolean;
  sectionsAreLoading: boolean;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  subTermLabel: string;
};

export function CourseSectionsScopeSummary({
  activeOfferingCount,
  allSectionCount,
  hasActiveScope,
  isSearchScope,
  sectionsAreLoading,
  selectedOffering,
  subTermLabel,
}: CourseSectionsScopeSummaryProps) {
  if (isSearchScope && hasActiveScope) {
    return (
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
    );
  }

  if (selectedOffering) {
    return (
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
    );
  }

  return (
    <Alert color="gray" title="Select a course offering">
      Choose a course offering above, or use View offering sections to review the current search
      results.
    </Alert>
  );
}
