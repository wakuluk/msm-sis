// Student roster section for a single course section detail page.
import { Grid } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { CourseSectionStudentsPanel } from './CourseSectionStudentsPanel';
import type {
  CourseSectionPreview,
  SelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionDetailStudentsSectionProps = {
  enrollmentGradingBasisOptions: SelectOption[];
  enrollmentStatusOptions: SelectOption[];
  section: CourseSectionPreview;
};

export function CourseSectionDetailStudentsSection({
  enrollmentGradingBasisOptions,
  enrollmentStatusOptions,
  section,
}: CourseSectionDetailStudentsSectionProps) {
  return (
    <RecordPageSection
      title="Students"
      description="Manage students enrolled or waitlisted in this course section."
    >
      <Grid.Col span={12}>
        <CourseSectionStudentsPanel
          selectedSection={section}
          gradingBasisOptions={enrollmentGradingBasisOptions}
          enrollmentStatusOptions={enrollmentStatusOptions}
        />
      </Grid.Col>
    </RecordPageSection>
  );
}
