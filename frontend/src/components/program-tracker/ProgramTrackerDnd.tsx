import { type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Group, Paper, Table } from '@mantine/core';
import type {
  ProgramTrackerPlannerCourse,
  ProgramTrackerCourseSelection,
  ProgramTrackerPlannerBucket,
  ProgramTrackerPlannerDropTarget,
  ProgramTrackerPlannerTerm,
} from './program-tracker.types';
import {
  getProgramTrackerCourseBucketCode,
  getProgramTrackerCourseKey,
} from './program-tracker.helpers';

type DraggableRequirementCourseRowProps = {
  children: ReactNode;
  selection: ProgramTrackerCourseSelection;
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

type DraggableRequirementCourseCardProps = {
  children: ReactNode;
  selection: ProgramTrackerCourseSelection;
};

export function DraggableRequirementCourseCard({
  children,
  selection,
}: DraggableRequirementCourseCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${selection.programCode}-${selection.requirementLabel}-${selection.courseCode}`,
    data: { selection },
  });

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      radius="sm"
      p="sm"
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
    </Paper>
  );
}

type DraggablePlannerCourseRowProps = {
  children: ReactNode;
  course: ProgramTrackerPlannerCourse;
  hideTopBorder?: boolean;
  termCode: string;
};

export function DraggablePlannerCourseRow({
  children,
  course,
  hideTopBorder = false,
  termCode,
}: DraggablePlannerCourseRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planner-${termCode}-${getProgramTrackerCourseKey(course)}`,
    data: {
      moveSelection: {
        course,
        sourceBucketCode: getProgramTrackerCourseBucketCode(course),
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
        borderTop: hideTopBorder ? undefined : '1px solid var(--mantine-color-gray-2)',
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
  disabled?: boolean;
  term: ProgramTrackerPlannerTerm;
};

export function DroppablePlannerTerm({
  children,
  disabled = false,
  term,
}: DroppablePlannerTermProps) {
  const dropTarget: ProgramTrackerPlannerDropTarget = {
    bucketCode: 'FULL_TERM',
    termCode: term.code,
  };
  const { isOver, setNodeRef } = useDroppable({
    id: term.code,
    disabled: disabled || term.isComplete,
    data: { plannerDropTarget: dropTarget },
  });
  const backgroundColor = isOver
    ? 'var(--mantine-color-blue-0)'
    : term.readOnly
      ? 'var(--mantine-color-gray-0)'
      : undefined;
  const termBackgroundColor = disabled
    ? term.readOnly
      ? 'var(--mantine-color-gray-0)'
      : undefined
    : backgroundColor;

  return (
    <Paper
      ref={setNodeRef}
      key={term.code}
      withBorder
      radius="sm"
      p="sm"
      style={{
        backgroundColor: termBackgroundColor,
        borderColor: !disabled && isOver ? 'var(--mantine-color-blue-4)' : undefined,
        opacity: term.isComplete ? 0.82 : 1,
      }}
    >
      {children}
    </Paper>
  );
}

type DroppablePlannerBucketProps = {
  bucket: ProgramTrackerPlannerBucket;
  children: ReactNode;
  disabled?: boolean;
  term: ProgramTrackerPlannerTerm;
};

export function DroppablePlannerBucket({
  bucket,
  children,
  disabled = false,
  term,
}: DroppablePlannerBucketProps) {
  const dropTarget: ProgramTrackerPlannerDropTarget = {
    bucketCode: bucket.code,
    termCode: term.code,
  };
  const { isOver, setNodeRef } = useDroppable({
    id: `${term.code}-${bucket.code}`,
    disabled: disabled || term.isComplete,
    data: { plannerDropTarget: dropTarget },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? 'var(--mantine-color-blue-0)' : undefined,
        borderRadius: 'var(--mantine-radius-sm)',
        outline: isOver ? '1px solid var(--mantine-color-blue-4)' : undefined,
        padding: 'var(--mantine-spacing-xs)',
      }}
    >
      {children}
    </div>
  );
}
