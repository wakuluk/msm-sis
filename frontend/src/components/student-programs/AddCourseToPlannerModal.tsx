import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import type { PlannerCourseSelection } from './student-programs.types';

type AddCourseToPlannerModalProps = {
  onClose: () => void;
  onSave: () => void;
  onTermChange: (termCode: string | null) => void;
  opened: boolean;
  plannerCourseSelection: PlannerCourseSelection | null;
  plannerTermOptions: Array<{ disabled?: boolean; label: string; value: string }>;
  selectedPlannerTermCode: string | null;
};

export function AddCourseToPlannerModal({
  onClose,
  onSave,
  onTermChange,
  opened,
  plannerCourseSelection,
  plannerTermOptions,
  selectedPlannerTermCode,
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
          </Stack>
        ) : null}

        <Select
          label="Term"
          data={plannerTermOptions}
          value={selectedPlannerTermCode}
          onChange={onTermChange}
          placeholder="Select a term"
        />

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
