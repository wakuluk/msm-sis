import { Badge, Button, Grid, Group, Stack, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { PlannerSaveFooter } from './PlannerSaveFooter';
import { PlannerYearPanel } from './PlannerYearPanel';
import type {
  ProgramTrackerPlannerCourse,
  ProgramTrackerPlannerYear,
} from './program-tracker.types';

type SemesterPlannerSectionProps = {
  expandedPlannerYearLabels: Set<string>;
  onAddYear: () => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onReplacePlaceholderCourse: (course: ProgramTrackerPlannerCourse) => void;
  onRemoveCourse: (termCode: string, course: ProgramTrackerPlannerCourse) => void;
  onRemoveYear: (yearLabel: string) => void;
  onSave: () => void;
  onToggleReverseYears: () => void;
  onToggleSubterms: () => void;
  onToggleYear: (yearLabel: string) => void;
  plannerSaveStatus: 'saved' | 'saving' | 'unsaved';
  plannerYears: ProgramTrackerPlannerYear[];
  plannerYearsReversed: boolean;
  saveError: string | null;
  showSubtermToggle: boolean;
  showSubterms: boolean;
};

export function SemesterPlannerSection({
  expandedPlannerYearLabels,
  onAddYear,
  onOpenCourseDetails,
  onReplacePlaceholderCourse,
  onRemoveCourse,
  onRemoveYear,
  onSave,
  onToggleReverseYears,
  onToggleSubterms,
  onToggleYear,
  plannerSaveStatus,
  plannerYears,
  plannerYearsReversed,
  saveError,
  showSubtermToggle,
  showSubterms,
}: SemesterPlannerSectionProps) {
  const displayedYears = plannerYearsReversed ? [...plannerYears].reverse() : plannerYears;

  return (
    <RecordPageSection
      title="Semester Planner"
      description={
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Plan when requirement courses will fit across academic years.
          </Text>
          {plannerSaveStatus === 'unsaved' ? (
            <Badge variant="light" color="yellow" size="lg">
              Unsaved changes will be lost if you leave this page.
            </Badge>
          ) : null}
          {saveError ? (
            <Badge variant="light" color="red" size="lg">
              {saveError}
            </Badge>
          ) : null}
        </Stack>
      }
      action={
        <Group gap="sm">
          <Button
            onClick={onSave}
            disabled={plannerSaveStatus === 'saved' || plannerSaveStatus === 'saving'}
            loading={plannerSaveStatus === 'saving'}
          >
            Save Plan
          </Button>
          <Button variant="subtle" onClick={onToggleReverseYears}>
            {plannerYearsReversed ? 'Show earliest first' : 'Show latest first'}
          </Button>
          {showSubtermToggle ? (
            <Button variant="subtle" onClick={onToggleSubterms}>
              {showSubterms ? 'Hide subterms' : 'Show subterms'}
            </Button>
          ) : null}
          <Button variant="light" onClick={onAddYear}>
            Add Year
          </Button>
        </Group>
      }
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          {displayedYears.map((year) => (
            <PlannerYearPanel
              key={year.label}
              expanded={expandedPlannerYearLabels.has(year.label)}
              year={year}
              onOpenCourseDetails={onOpenCourseDetails}
              onReplacePlaceholderCourse={onReplacePlaceholderCourse}
              onRemoveCourse={onRemoveCourse}
              onRemoveYear={onRemoveYear}
              onToggleYear={onToggleYear}
              showSubterms={showSubterms}
            />
          ))}

          <PlannerSaveFooter onSave={onSave} plannerSaveStatus={plannerSaveStatus} />
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
