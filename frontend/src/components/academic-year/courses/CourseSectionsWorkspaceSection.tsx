// Renders the course-section workspace panel and action controls.
import type { ComponentProps } from 'react';
import { Button, Grid, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { CourseSectionsTablePanel } from './CourseSectionsTablePanel';

type CourseSectionsWorkspaceSectionProps = ComponentProps<typeof CourseSectionsTablePanel> & {
  canAddSection: boolean;
  stageSectionsPath: string;
  workspaceDescription: string;
  onAddSection: () => void;
  onClearSectionFilters: () => void;
};

export function CourseSectionsWorkspaceSection({
  canAddSection,
  stageSectionsPath,
  workspaceDescription,
  onAddSection,
  onClearSectionFilters,
  ...tableProps
}: CourseSectionsWorkspaceSectionProps) {
  return (
    <RecordPageSection
      title="Course Sections"
      description={workspaceDescription}
      action={
        <Group gap="sm" wrap="wrap" justify="flex-end">
          <Button component={Link} to={stageSectionsPath} variant="default">
            Stage sections
          </Button>
          <Button
            variant="default"
            onClick={onClearSectionFilters}
            disabled={!tableProps.hasActiveScope}
          >
            Clear section filters
          </Button>
          <Button variant="light" onClick={onAddSection} disabled={!canAddSection}>
            Add section
          </Button>
        </Group>
      }
    >
      <Grid.Col span={12}>
        <CourseSectionsTablePanel {...tableProps} />
      </Grid.Col>
    </RecordPageSection>
  );
}
