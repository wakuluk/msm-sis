import type { ReactNode } from 'react';
import { Alert, Button, Grid, Group, Stack, Stepper, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';

export type WorkflowStatusStep = {
  code: string;
  name: string;
  order: number;
};

type WorkflowStatusStepperSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  statuses: WorkflowStatusStep[];
  currentStatusCode?: string | null;
  isLoading?: boolean;
  loadError?: string | null;
  shiftError?: string | null;
  shiftSucceeded?: boolean;
  isShifting?: boolean;
  disableShiftControls?: boolean;
  onStepDown?: () => void;
  onStepUp?: () => void;
  isConditionalStatus?: (code: string | null | undefined) => boolean;
  emptyTitle?: ReactNode;
  emptyMessage?: ReactNode;
  invisibleTitle?: ReactNode;
  invisibleMessage?: ReactNode;
  missingCurrentStatusMessage?: ReactNode;
};

function normalizeStatusCode(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue.toUpperCase() : null;
}

export function WorkflowStatusStepperSection({
  title,
  description,
  statuses,
  currentStatusCode = null,
  isLoading = false,
  loadError = null,
  shiftError = null,
  shiftSucceeded = false,
  isShifting = false,
  disableShiftControls = false,
  onStepDown,
  onStepUp,
  isConditionalStatus = () => false,
  emptyTitle = 'No statuses configured',
  emptyMessage = 'Add statuses before using the status tracker.',
  invisibleTitle = 'No visible statuses',
  invisibleMessage = 'No statuses are available for this record.',
  missingCurrentStatusMessage = 'Current status is not available on the detail response yet.',
}: WorkflowStatusStepperSectionProps) {
  const normalizedCurrentStatusCode = normalizeStatusCode(currentStatusCode);
  const sortedStatuses = [...statuses].sort((left, right) => left.order - right.order);
  const visibleStatuses = sortedStatuses.filter(
    (status) =>
      !isConditionalStatus(status.code) ||
      normalizeStatusCode(status.code) === normalizedCurrentStatusCode
  );
  const activeStatusStep = visibleStatuses.findIndex(
    (status) => normalizeStatusCode(status.code) === normalizedCurrentStatusCode
  );
  const hasShiftActions = Boolean(onStepDown || onStepUp);
  const canShiftLinearly =
    hasShiftActions &&
    !disableShiftControls &&
    !isConditionalStatus(normalizedCurrentStatusCode) &&
    activeStatusStep >= 0;
  const canStepDown = Boolean(onStepDown) && canShiftLinearly && activeStatusStep > 0;
  const canStepUp =
    Boolean(onStepUp) && canShiftLinearly && activeStatusStep < visibleStatuses.length - 1;

  return (
    <RecordPageSection
      title={title}
      description={description}
      action={
        hasShiftActions ? (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            {shiftSucceeded ? (
              <Text size="sm" c="teal">
                Status updated.
              </Text>
            ) : null}
            {onStepDown ? (
              <Button
                type="button"
                variant="default"
                onClick={onStepDown}
                loading={isShifting}
                disabled={!canStepDown}
              >
                Step down
              </Button>
            ) : null}
            {onStepUp ? (
              <Button
                type="button"
                variant="light"
                onClick={onStepUp}
                loading={isShifting}
                disabled={!canStepUp}
              >
                Step up
              </Button>
            ) : null}
          </Group>
        ) : null
      }
    >
      <Grid.Col span={12}>
        <Stack gap="sm">
          {shiftError ? (
            <Alert color="red" title="Unable to shift status">
              {shiftError}
            </Alert>
          ) : null}

          {isLoading ? (
            <Text size="sm" c="dimmed">
              Loading statuses.
            </Text>
          ) : loadError ? (
            <Alert color="red" title="Unable to load statuses">
              {loadError}
            </Alert>
          ) : sortedStatuses.length === 0 ? (
            <Alert color="gray" title={emptyTitle}>
              {emptyMessage}
            </Alert>
          ) : visibleStatuses.length === 0 ? (
            <Alert color="gray" title={invisibleTitle}>
              {invisibleMessage}
            </Alert>
          ) : (
            <>
              <Stepper
                active={activeStatusStep >= 0 ? activeStatusStep : -1}
                color="teal"
                size="sm"
                allowNextStepsSelect={false}
              >
                {visibleStatuses.map((status) => (
                  <Stepper.Step key={status.code} label={status.name} />
                ))}
              </Stepper>
              {activeStatusStep < 0 ? (
                <Text size="sm" c="dimmed">
                  {missingCurrentStatusMessage}
                </Text>
              ) : null}
            </>
          )}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
