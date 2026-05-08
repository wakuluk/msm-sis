import { Badge, Button, Collapse, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { displayDateTime, displayValue } from '@/components/academic-year/academicYearDisplay';
import { StatusProgress } from './StatusProgress';
import { ProgramTrackerCompletionRequirementCard } from './ProgramTrackerCompletionRequirementCard';
import { ProgramTrackerRequirementCard } from './ProgramTrackerRequirementCard';
import { formatProgramProgress } from './program-tracker.helpers';
import type {
  ProgramTrackerCourseSelection,
  ProgramTrackerProgram,
  ProgramTrackerRequestReviewNote,
} from './program-tracker.types';

type ProgramTrackerProgramCardProps = {
  expanded: boolean;
  onAddCourseToPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onOpenCourseDetails: (courseId: number, courseCode: string) => void;
  onRemoveCourseFromPlanner: (selection: ProgramTrackerCourseSelection) => void;
  onRemoveProgram?: (studentProgramId: number) => void;
  onRequestProgram?: (studentProgramId: number) => void;
  onToggleProgram: (programCode: string) => void;
  program: ProgramTrackerProgram;
  readOnly?: boolean;
  removing?: boolean;
  requesting?: boolean;
};

export function ProgramTrackerProgramCard({
  expanded,
  onAddCourseToPlanner,
  onOpenCourseDetails,
  onRemoveCourseFromPlanner,
  onRemoveProgram,
  onRequestProgram,
  onToggleProgram,
  program,
  readOnly = false,
  removing = false,
  requesting = false,
}: ProgramTrackerProgramCardProps) {
  const isExploringProgram = program.status.toUpperCase() === 'EXPLORING';
  const normalizedRequestStatus = program.requestStatus?.toUpperCase();
  const hasRequest = program.requestStatus !== undefined;
  const hasRejectedRequest = normalizedRequestStatus === 'REJECTED';
  const canRequestProgram =
    isExploringProgram && !hasRequest && program.studentProgramId !== undefined;
  const canRemoveProgramPreview =
    isExploringProgram
      && (!hasRequest || hasRejectedRequest)
      && program.studentProgramId !== undefined;

  return (
    <Paper
      key={program.code}
      withBorder
      radius="md"
      p="md"
      bg={isExploringProgram ? 'yellow.0' : undefined}
      style={{
        borderColor: isExploringProgram ? 'var(--mantine-color-yellow-4)' : undefined,
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={6} maw={820} style={{ flex: 1 }}>
            <Group gap="xs" wrap="wrap">
              <Text fw={700}>{program.name}</Text>
              <Badge variant="light">{program.type}</Badge>
              <Badge variant="light" color={isExploringProgram ? 'yellow' : 'green'}>
                {program.status}
              </Badge>
              {program.requestStatus ? (
                <Badge variant="light" color={hasRejectedRequest ? 'red' : 'blue'}>
                  {formatRequestStatus(program.requestStatus)}
                </Badge>
              ) : null}
            </Group>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                {formatProgramProgress(program)}
              </Text>
              <StatusProgress
                completed={program.completed}
                planned={program.planned}
                required={program.required}
                size="md"
              />
            </Stack>
          </Stack>
          <Group gap="xs" justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                onToggleProgram(program.code);
              }}
            >
              {expanded ? 'Hide requirements' : 'Show requirements'}
            </Button>
          </Group>
        </Group>

        <Collapse expanded={expanded}>
          <Stack gap="sm">
            {program.completionRequirements.length > 0 ? (
              <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                {program.completionRequirements.map((completionRequirement) => (
                  <ProgramTrackerCompletionRequirementCard
                    key={completionRequirement.label}
                    completionRequirement={completionRequirement}
                  />
                ))}
              </SimpleGrid>
            ) : null}

            <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
              {program.requirements.map((requirement) => (
                <ProgramTrackerRequirementCard
                  key={requirement.label}
                  program={program}
                  requirement={requirement}
                  onAddCourseToPlanner={onAddCourseToPlanner}
                  onOpenCourseDetails={onOpenCourseDetails}
                  onRemoveCourseFromPlanner={onRemoveCourseFromPlanner}
                  readOnly={readOnly}
                />
              ))}
            </SimpleGrid>

            {hasRejectedRequest && program.requestReview ? (
              <RejectedProgramReviewNotes review={program.requestReview} />
            ) : null}

            {!readOnly && (canRequestProgram || canRemoveProgramPreview) && (
              onRequestProgram || onRemoveProgram
            ) ? (
              <Group justify="flex-end" gap="xs" pt="sm">
                {onRemoveProgram && canRemoveProgramPreview ? (
                  <Button
                    color="red"
                    loading={removing}
                    variant="subtle"
                    onClick={() => {
                      onRemoveProgram(program.studentProgramId!);
                    }}
                  >
                    {hasRejectedRequest ? 'Remove program' : 'Remove preview'}
                  </Button>
                ) : null}
                {onRequestProgram && canRequestProgram ? (
                  <Button
                    loading={requesting}
                    variant="light"
                    onClick={() => {
                      onRequestProgram(program.studentProgramId!);
                    }}
                  >
                    Request program
                  </Button>
                ) : null}
              </Group>
            ) : null}

            {!readOnly && isExploringProgram && hasRequest && !hasRejectedRequest ? (
              <Group justify="flex-end" gap="xs" pt="sm">
                <Text size="sm" c="dimmed">
                  Request submitted.
                </Text>
              </Group>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

function RejectedProgramReviewNotes({
  review,
}: {
  review: NonNullable<ProgramTrackerProgram['requestReview']>;
}) {
  return (
    <Stack
      gap="sm"
      pt="sm"
      style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
    >
      <Stack gap={2}>
        <Text fw={700}>Review notes</Text>
        <Text size="sm" c="dimmed">
          This request was denied. Review the notes below before removing the program or exploring
          another option.
        </Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <ReviewNoteSummary title="Department review" note={review.departmentReview} />
        <ReviewNoteSummary title="Admin review" note={review.adminReview} />
      </SimpleGrid>
    </Stack>
  );
}

function ReviewNoteSummary({
  note,
  title,
}: {
  note?: ProgramTrackerRequestReviewNote;
  title: string;
}) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={700}>
        {title}
      </Text>
      {note ? (
        <>
          <Text size="sm">{displayValue(note.signatureName ?? note.reviewedByEmail)}</Text>
          <Text size="sm" c="dimmed">
            {displayDateTime(note.signatureAt ?? note.reviewedAt)}
          </Text>
          <Text size="sm" c={note.comment ? undefined : 'dimmed'}>
            {note.comment ?? 'No note entered.'}
          </Text>
        </>
      ) : (
        <Text size="sm" c="dimmed">
          No review recorded.
        </Text>
      )}
    </Stack>
  );
}

function formatRequestStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
