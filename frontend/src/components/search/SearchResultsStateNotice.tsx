import { Alert, Center, Loader, Stack, Text } from '@mantine/core';

type SearchResultsStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';

type SearchResultsStateNoticeProps = {
  status: SearchResultsStatus;
  idleTitle: string;
  idleMessage: string;
  loadingMessage: string;
  errorMessage?: string | null;
  errorTitle?: string;
  emptyTitle: string;
  emptyMessage: string;
};

export function SearchResultsStateNotice({
  status,
  idleTitle,
  idleMessage,
  loadingMessage,
  errorMessage,
  errorTitle = 'Search failed',
  emptyTitle,
  emptyMessage,
}: SearchResultsStateNoticeProps) {
  if (status === 'idle') {
    return (
      <Alert color="gray" title={idleTitle}>
        {idleMessage}
      </Alert>
    );
  }

  if (status === 'loading') {
    return (
      <Center py="xl">
        <Stack align="center" gap="xs">
          <Loader size="sm" />
          <Text size="sm">{loadingMessage}</Text>
        </Stack>
      </Center>
    );
  }

  if (status === 'error') {
    return (
      <Alert color="red" title={errorTitle}>
        {errorMessage}
      </Alert>
    );
  }

  if (status === 'empty') {
    return (
      <Alert color="gray" title={emptyTitle}>
        {emptyMessage}
      </Alert>
    );
  }

  return null;
}
