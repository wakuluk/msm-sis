import { Progress } from '@mantine/core';
import { getProgressSegments } from './student-programs.helpers';

type StatusProgressProps = {
  completed: number;
  planned: number;
  required: number;
  size: 'xs' | 'md';
};

export function StatusProgress({ completed, planned, required, size }: StatusProgressProps) {
  const segments = getProgressSegments(completed, planned, required);

  return (
    <Progress.Root size={size} radius="xl">
      <Progress.Section value={segments.completed} color="blue" />
      <Progress.Section value={segments.planned} color="yellow" />
    </Progress.Root>
  );
}
