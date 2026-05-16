import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Group, Loader, Select, Stack, Text, Title } from '@mantine/core';
import createClasses from '@/components/create/RecordPageLayout.module.css';
import {
  getStudentBillingAssignment,
  searchTuitionCodes,
  updateStudentBillingAssignment,
} from '@/services/billing-service';
import type {
  StudentBillingAssignmentResponse,
  TuitionCodeSearchResultResponse,
} from '@/services/schemas/billing-schemas';
import { displayValue } from '@/utils/form-values';

type StudentBillingPanelProps = {
  studentId: number;
  studentName: string | null;
};

type BillingPanelState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      assignment: StudentBillingAssignmentResponse;
      tuitionCodes: TuitionCodeSearchResultResponse[];
    };

export function StudentBillingPanel({ studentId, studentName }: StudentBillingPanelProps) {
  const [panelState, setPanelState] = useState<BillingPanelState>({ status: 'loading' });
  const [tuitionCodeId, setTuitionCodeId] = useState<number | null>(null);
  const [savedTuitionCodeId, setSavedTuitionCodeId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<{
    status: 'idle' | 'loading' | 'error' | 'success';
    message?: string;
  }>({
    status: 'idle',
  });
  const hasUnsavedChanges = tuitionCodeId !== savedTuitionCodeId;

  useEffect(() => {
    const controller = new AbortController();
    setPanelState({ status: 'loading' });

    Promise.all([
      getStudentBillingAssignment({ studentId, signal: controller.signal }),
      searchTuitionCodes({
        size: 100,
        sortBy: 'code',
        sortDirection: 'asc',
        signal: controller.signal,
      }),
    ])
      .then(([assignment, tuitionCodeSearchResponse]) => {
        setPanelState({
          status: 'success',
          assignment,
          tuitionCodes: tuitionCodeSearchResponse.results,
        });
        setTuitionCodeId(assignment.tuitionCodeId);
        setSavedTuitionCodeId(assignment.tuitionCodeId);
        setSaveState({ status: 'idle' });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setPanelState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load student billing.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [studentId]);

  const tuitionCodes = panelState.status === 'success' ? panelState.tuitionCodes : [];
  const tuitionCodeOptions = useMemo(
    () =>
      tuitionCodes.map((tuitionCode) => ({
        value: String(tuitionCode.tuitionCodeId),
        label: `${tuitionCode.code} - ${tuitionCode.name}`,
      })),
    [tuitionCodes]
  );
  const assignedTuitionCode =
    tuitionCodes.find((tuitionCode) => tuitionCode.tuitionCodeId === savedTuitionCodeId) ?? null;

  async function handleSaveAssignment() {
    setSaveState({ status: 'loading' });

    try {
      const assignment = await updateStudentBillingAssignment({
        studentId,
        request: { tuitionCodeId },
      });

      setSavedTuitionCodeId(assignment.tuitionCodeId);
      setTuitionCodeId(assignment.tuitionCodeId);
      setPanelState((current) =>
        current.status === 'success' ? { ...current, assignment } : current
      );
      setSaveState({ status: 'success', message: 'Tuition code assignment saved.' });
    } catch (error) {
      setSaveState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save tuition code assignment.',
      });
    }
  }

  return (
    <Stack gap={0}>
      <div className={createClasses.section}>
        <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Admin only</Text>
            <Title order={3}>Billing</Title>
            <Text c="dimmed" maw="44rem">
              Manually assign a tuition code to {displayValue(studentName)} for billing.
            </Text>
          </Stack>
        </Group>
      </div>

      <div className={createClasses.section}>
        {panelState.status === 'loading' ? (
          <Group justify="center" py="lg">
            <Loader />
          </Group>
        ) : panelState.status === 'error' ? (
          <Alert color="red" title="Unable to load billing">
            {panelState.message}
          </Alert>
        ) : (
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={4}>Tuition code</Title>
              <Text size="sm" c="dimmed">
                This student-facing experience does not expose tuition codes.
              </Text>
            </Stack>

            <Select
              label="Assigned tuition code"
              placeholder="No tuition code assigned"
              clearable
              searchable
              data={tuitionCodeOptions}
              value={tuitionCodeId === null ? null : String(tuitionCodeId)}
              onChange={(value) => {
                setTuitionCodeId(value === null ? null : Number(value));
                setSaveState({ status: 'idle' });
              }}
            />

            <Group justify="space-between" gap="md" wrap="wrap">
              <Text size="sm" c="dimmed">
                Current assignment:{' '}
                {assignedTuitionCode
                  ? `${assignedTuitionCode.code} - ${assignedTuitionCode.name}`
                  : 'No tuition code assigned'}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  disabled={!hasUnsavedChanges}
                  onClick={() => {
                    setTuitionCodeId(savedTuitionCodeId);
                    setSaveState({ status: 'idle' });
                  }}
                >
                  Reset
                </Button>
                <Button
                  disabled={!hasUnsavedChanges}
                  loading={saveState.status === 'loading'}
                  onClick={() => {
                    void handleSaveAssignment();
                  }}
                >
                  Save assignment
                </Button>
              </Group>
            </Group>

            {hasUnsavedChanges ? (
              <Alert color="yellow" variant="light">
                This assignment has unsaved changes.
              </Alert>
            ) : saveState.status === 'error' ? (
              <Alert color="red" title="Unable to save assignment">
                {saveState.message}
              </Alert>
            ) : saveState.status === 'success' ? (
              <Alert color="green" title="Saved">
                {saveState.message}
              </Alert>
            ) : (
              <Alert color="gray" variant="light">
                The current tuition code assignment is saved.
              </Alert>
            )}
          </Stack>
        )}
      </div>
    </Stack>
  );
}
