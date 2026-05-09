// Student roster section for a single course section detail page.
import { Grid } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { CourseSectionStudentsPanel } from './CourseSectionStudentsPanel';
import type {
  CourseSectionPreview,
  SelectOption,
} from './courseSectionsWorkspaceTypes';

type CourseSectionDetailStudentsSectionProps = {
  canManage?: boolean;
  gradeMarkOptions: SelectOption[];
  gradeTypeOptions: SelectOption[];
  enrollmentGradingBasisOptions: SelectOption[];
  enrollmentStatusOptions: SelectOption[];
  section: CourseSectionPreview;
};

export function CourseSectionDetailStudentsSection({
  canManage = true,
  gradeMarkOptions,
  gradeTypeOptions,
  enrollmentGradingBasisOptions,
  enrollmentStatusOptions,
  section,
}: CourseSectionDetailStudentsSectionProps) {
  return (
    <RecordPageSection
      title="Students"
      description={
        canManage
          ? 'Manage students enrolled or waitlisted in this course section.'
          : 'Review students enrolled or waitlisted in this course section.'
      }
    >
      <Grid.Col span={12}>
        <CourseSectionStudentsPanel
          selectedSection={section}
          canManage={canManage}
          gradeMarkOptions={gradeMarkOptions}
          gradeTypeOptions={gradeTypeOptions}
          gradingBasisOptions={enrollmentGradingBasisOptions}
          enrollmentStatusOptions={enrollmentStatusOptions}
        />
      </Grid.Col>
    </RecordPageSection>
  );
}
