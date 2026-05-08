// Header context for course-section create/detail modals.
import { Badge, Group, Stack, Text } from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type { CourseSectionPreview } from './courseSectionsWorkspaceTypes';

type CourseSectionModalHeaderProps = {
  offering: AcademicYearCourseOfferingSearchResultResponse | null;
  sectionPreview: string;
  selectedSection: CourseSectionPreview | null;
  selectedStatusName: string | null;
  subTermLabel: string;
};

export function CourseSectionModalHeader({
  offering,
  sectionPreview,
  selectedSection,
  selectedStatusName,
  subTermLabel,
}: CourseSectionModalHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
      <Stack gap={2}>
        <Text fw={700}>
          {selectedSection
            ? `${selectedSection.courseCode} Section ${selectedSection.sectionCode}`
            : (offering?.courseCode ?? 'Course offering')}
        </Text>
        <Text size="sm" c="dimmed">
          {selectedSection?.courseTitle ?? offering?.title ?? 'Title unavailable'}
        </Text>
      </Stack>
      <Group gap="xs" wrap="wrap">
        <Badge variant="light" color="blue">
          {subTermLabel}
        </Badge>
        {selectedSection ? (
          <Badge
            variant="light"
            color={selectedSection.statusCode === 'DRAFT' ? 'gray' : 'green'}
          >
            {selectedStatusName ?? selectedSection.statusName}
          </Badge>
        ) : (
          <Badge variant="light" color="green">
            Section {sectionPreview}
          </Badge>
        )}
      </Group>
    </Group>
  );
}
