import { useEffect, useState } from 'react';
import { Alert, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { RegistrationGroupPublishWorkflow } from '@/components/registration-groups/RegistrationGroupPublishWorkflow';
import { getRegistrationGroupReferenceOptions } from '@/services/registration-group-service';
import type { RegistrationGroupReferenceOptionsResponse } from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupReferenceOptionsResponse }
  | { status: 'error'; message: string };

export function RegistrationGroupPublishPage() {
  const [searchParams] = useSearchParams();
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const initialAcademicYearId = searchParams.get('academicYearId') ?? '';
  const initialTermId = searchParams.get('termId') ?? '';

  useEffect(() => {
    const abortController = new AbortController();
    setReferenceOptionsState({ status: 'loading' });

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        if (!abortController.signal.aborted) {
          setReferenceOptionsState({ status: 'success', response });
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setReferenceOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load registration group reference options.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const referenceOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.response : null;
  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
            <Title order={1}>Publish Registration Groups</Title>
            <Text size="sm" c="dimmed">
              Review the term groups, clean up unassigned students, then publish draft groups for
              registration.
            </Text>
          </Stack>
        </Paper>

        {referenceOptionsState.status === 'error' ? (
          <Alert color="red" title="Unable to load publish workflow">
            {referenceOptionsState.message}
          </Alert>
        ) : null}

        {referenceOptionsLoading && !referenceOptions ? (
          <Paper p="lg" withBorder radius="md">
            <Group gap="md">
              <Loader size="sm" />
              <Text>Loading registration group options...</Text>
            </Group>
          </Paper>
        ) : (
          <RegistrationGroupPublishWorkflow
            initialAcademicYearId={initialAcademicYearId}
            initialTermId={initialTermId}
            referenceOptions={referenceOptions}
            referenceOptionsLoading={referenceOptionsLoading}
          />
        )}
      </Stack>
    </Container>
  );
}
