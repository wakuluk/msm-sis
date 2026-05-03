import { type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Group, Paper, Table } from '@mantine/core';
import type {
  PlannerCoursePreview,
  PlannerCourseSelection,
  PlannerTermPreview,
} from './student-programs.types';

type DraggableRequirementCourseRowProps = {
  children: ReactNode;
  selection: PlannerCourseSelection;
};

export function DraggableRequirementCourseRow({
  children,
  selection,
}: DraggableRequirementCourseRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${selection.programCode}-${selection.requirementLabel}-${selection.courseCode}`,
    data: { selection },
  });

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <Table.Tr
      ref={setNodeRef}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.65 : 1,
        transform: transformStyle,
        touchAction: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      {children}
    </Table.Tr>
  );
}

type DraggablePlannerCourseRowProps = {
  children: ReactNode;
  course: PlannerCoursePreview;
  termCode: string;
};

export function DraggablePlannerCourseRow({
  children,
  course,
  termCode,
}: DraggablePlannerCourseRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planner-${termCode}-${course.code}`,
    data: {
      moveSelection: {
        course,
        sourceTermCode: termCode,
      },
    },
  });

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <Group
      ref={setNodeRef}
      justify="space-between"
      align="flex-start"
      py={6}
      style={{
        borderTop: '1px solid var(--mantine-color-gray-2)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.65 : 1,
        transform: transformStyle,
        touchAction: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      {children}
    </Group>
  );
}

type DroppablePlannerTermProps = {
  children: ReactNode;
  term: PlannerTermPreview;
};

export function DroppablePlannerTerm({ children, term }: DroppablePlannerTermProps) {
  const { isOver, setNodeRef } = useDroppable({ id: term.code, disabled: term.isComplete });

  return (
    <Paper
      ref={setNodeRef}
      key={term.code}
      withBorder
      radius="sm"
      p="sm"
      style={{
        backgroundColor: isOver ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isOver ? 'var(--mantine-color-blue-4)' : undefined,
        opacity: term.isComplete ? 0.82 : 1,
      }}
    >
      {children}
    </Paper>
  );
}
