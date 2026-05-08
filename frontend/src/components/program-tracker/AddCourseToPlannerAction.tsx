// Icon action for adding a requirement course to the semester planner.
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconCalendarPlus } from '@tabler/icons-react';
import type { ProgramTrackerCourseSelection } from './program-tracker.types';

type AddCourseToPlannerActionProps = {
  selection: ProgramTrackerCourseSelection;
  onClick: () => void;
};

export function AddCourseToPlannerAction({
  selection,
  onClick,
}: AddCourseToPlannerActionProps) {
  return (
    <Tooltip label="Add to planner">
      <ActionIcon
        variant="subtle"
        aria-label={`Add ${selection.courseCode} to planner`}
        onClick={onClick}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <IconCalendarPlus size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
