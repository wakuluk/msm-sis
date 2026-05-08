import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { programTrackerPlannerBuckets } from './program-tracker.helpers';
import type { PlannerBucketCode, ProgramTrackerCourseSelection } from './program-tracker.types';

type AddCourseToPlannerModalProps = {
  onClose: () => void;
  onBucketChange: (bucketCode: PlannerBucketCode) => void;
  onSave: () => void;
  onTermChange: (termCode: string | null) => void;
  opened: boolean;
  plannerCourseSelection: ProgramTrackerCourseSelection | null;
  plannerTermOptions: Array<{ disabled?: boolean; label: string; value: string }>;
  selectedPlannerBucketCode: PlannerBucketCode;
  selectedPlannerTermCode: string | null;
  showSubterms: boolean;
};

export function AddCourseToPlannerModal({
  onClose,
  onBucketChange,
  onSave,
  onTermChange,
  opened,
  plannerCourseSelection,
  plannerTermOptions,
  selectedPlannerBucketCode,
  selectedPlannerTermCode,
  showSubterms,
}: AddCourseToPlannerModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Add course to planner" size="lg" centered>
      <Stack gap="md">
        {plannerCourseSelection ? (
          <Stack gap={4}>
            <Text fw={700}>{plannerCourseSelection.courseCode}</Text>
            <Text size="sm" c="dimmed">
              {plannerCourseSelection.programName} · {plannerCourseSelection.requirementLabel}
            </Text>
            {plannerCourseSelection.credits !== undefined ? (
              <Text size="sm" c="dimmed">
                {plannerCourseSelection.credits} planned credits
              </Text>
            ) : null}
          </Stack>
        ) : null}

        <Select
          label="Term"
          data={plannerTermOptions}
          value={selectedPlannerTermCode}
          onChange={onTermChange}
          placeholder="Select a term"
        />

        {showSubterms ? (
          <Select
            label="Subterm"
            data={programTrackerPlannerBuckets.map((bucket) => ({
              label: bucket.label,
              value: bucket.code,
            }))}
            value={selectedPlannerBucketCode}
            onChange={(value) => {
              onBucketChange((value ?? 'FULL_TERM') as PlannerBucketCode);
            }}
            placeholder="Select a subterm"
          />
        ) : null}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!selectedPlannerTermCode}>
            Add to planner
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
