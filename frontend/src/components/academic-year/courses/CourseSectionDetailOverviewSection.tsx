// Read-only overview for a single course section detail page.
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { CourseSectionPreview } from './courseSectionsWorkspaceTypes';

type CourseSectionDetailOverviewSectionProps = {
  section: CourseSectionPreview;
};

export function CourseSectionDetailOverviewSection({
  section,
}: CourseSectionDetailOverviewSectionProps) {
  return (
    <RecordPageSection
      title="Section Overview"
      description="This page is scoped to one course section."
    >
      <ReadOnlyField label="Course" value={section.courseCode} span={{ base: 12, md: 3 }} />
      <ReadOnlyField label="Title" value={section.courseTitle} span={{ base: 12, md: 6 }} />
      <ReadOnlyField label="Assignments" value={section.instructor} span={{ base: 12, md: 3 }} />
    </RecordPageSection>
  );
}
