import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { getTuitionCode, patchTuitionCode } from '@/services/billing-service';
import type { TuitionCodeDetailResponse } from '@/services/schemas/billing-schemas';

type TuitionCodeDraft = {
  code: string;
  name: string;
};

type TuitionCodeDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; tuitionCode: TuitionCodeDetailResponse };

function mapTuitionCodeToDraft(tuitionCode: TuitionCodeDetailResponse): TuitionCodeDraft {
  return {
    code: tuitionCode.code,
    name: tuitionCode.name,
  };
}

function normalizeTuitionCodeInput(value: string) {
  return value.replace(/\s+/g, '_').toUpperCase();
}

export function TuitionCodeDetailPage() {
  const { tuitionCodeId } = useParams();
  const parsedTuitionCodeId = Number(tuitionCodeId);
  const [pageState, setPageState] = useState<TuitionCodeDetailState>({ status: 'loading' });
  const [draft, setDraft] = useState<TuitionCodeDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(parsedTuitionCodeId) || parsedTuitionCodeId <= 0) {
      return;
    }

    const controller = new AbortController();
    setPageState({ status: 'loading' });

    getTuitionCode({
      tuitionCodeId: parsedTuitionCodeId,
      signal: controller.signal,
    })
      .then((tuitionCode) => {
        setPageState({ status: 'success', tuitionCode });
        setDraft(mapTuitionCodeToDraft(tuitionCode));
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load tuition code.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [parsedTuitionCodeId]);

  if (!Number.isInteger(parsedTuitionCodeId) || parsedTuitionCodeId <= 0) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Invalid tuition code">
          This tuition code route does not include a valid code id.
        </Alert>
      </Container>
    );
  }

  if (pageState.status === 'loading') {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (pageState.status === 'error' || !draft) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Unable to load tuition code">
          {pageState.status === 'error' ? pageState.message : 'Tuition code detail is unavailable.'}
        </Alert>
      </Container>
    );
  }

  const { tuitionCode } = pageState;

  async function handleSave() {
    if (!draft) {
      return;
    }

    const trimmedCode = normalizeTuitionCodeInput(draft.code.trim());
    const trimmedName = draft.name.trim();

    if (!trimmedCode || !trimmedName) {
      setSaveError('Code and name are required.');
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);

    try {
      const updatedTuitionCode = await patchTuitionCode({
        tuitionCodeId: tuitionCode.tuitionCodeId,
        request: {
          code: trimmedCode,
          name: trimmedName,
        },
      });

      setPageState({ status: 'success', tuitionCode: updatedTuitionCode });
      setDraft(mapTuitionCodeToDraft(updatedTuitionCode));
      setIsEditing(false);
      setSaveError(null);
      setSaveMessage('Tuition code changes saved.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save tuition code.');
      setSaveMessage(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Billing</Text>
            <Title order={1}>{tuitionCode.code}</Title>
            <Text c="dimmed">{tuitionCode.name}</Text>
          </Stack>
          <Button component={Link} to="/billing/tuition-codes" variant="default">
            Back to search
          </Button>
        </Group>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Stack gap={4}>
                <Title order={2}>Tuition Code Detail</Title>
                <Text size="sm" c="dimmed">
                  Edit the code and display name used by billing.
                </Text>
              </Stack>
            </Group>

            {isEditing ? (
              <Stack gap="md">
                <TextInput
                  label="Code"
                  maxLength={32}
                  value={draft.code}
                  onChange={(event) => {
                    setDraft((current) =>
                      current
                        ? { ...current, code: normalizeTuitionCodeInput(event.currentTarget.value) }
                        : current
                    );
                    setSaveError(null);
                  }}
                />
                <TextInput
                  label="Name"
                  value={draft.name}
                  onChange={(event) => {
                    setDraft((current) =>
                      current ? { ...current, name: event.currentTarget.value } : current
                    );
                    setSaveError(null);
                  }}
                />
              </Stack>
            ) : (
              <Stack gap="sm">
                <Group gap="xs">
                  <Text fw={600}>Code:</Text>
                  <Text>{tuitionCode.code}</Text>
                </Group>
                <Group gap="xs">
                  <Text fw={600}>Name:</Text>
                  <Text>{tuitionCode.name}</Text>
                </Group>
              </Stack>
            )}

            {saveError ? (
              <Alert color="red" title="Unable to save tuition code">
                {saveError}
              </Alert>
            ) : null}

            {saveMessage ? (
              <Alert color="green" title="Saved">
                {saveMessage}
              </Alert>
            ) : null}

            <Group justify="flex-end" gap="sm">
              {isEditing ? (
                <>
                  <Button
                    variant="default"
                    onClick={() => {
                      setDraft(mapTuitionCodeToDraft(tuitionCode));
                      setIsEditing(false);
                      setSaveError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button loading={isSaving} onClick={handleSave}>
                    Save changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setSaveMessage(null);
                    setIsEditing(true);
                  }}
                >
                  Edit tuition code
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
