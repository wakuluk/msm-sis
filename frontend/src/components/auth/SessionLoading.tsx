import { Container, Loader, Paper, Stack, Text, Title } from '@mantine/core';

export function SessionLoading() {
  return (
    <Container size={420} my={40}>
      <Title ta="center">WSIS</Title>
      <Paper p={22} mt={30}>
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Checking session...
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
