import { Button, Group, Text } from '@mantine/core';

type PlannerSaveFooterProps = {
  onSave: () => void;
  plannerSaveStatus: 'saved' | 'saving' | 'unsaved';
};

export function PlannerSaveFooter({ onSave, plannerSaveStatus }: PlannerSaveFooterProps) {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="wrap"
      pt="sm"
      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Text size="sm" c="dimmed">
        {plannerSaveStatus === 'saved'
          ? 'Your planner changes are saved.'
          : plannerSaveStatus === 'saving'
            ? 'Saving your semester plan.'
            : 'Save your semester plan when you are finished editing.'}
      </Text>
      <Button
        onClick={onSave}
        disabled={plannerSaveStatus === 'saved' || plannerSaveStatus === 'saving'}
        loading={plannerSaveStatus === 'saving'}
      >
        Save Plan
      </Button>
    </Group>
  );
}
