import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useAccessTokenData } from '@/auth/auth-store';

export function AdminPage() {
  const tokenData = useAccessTokenData();

  return (
    <Container size={420} my={40}>
      <Title ta="center">Admin Page</Title>
      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This page is only accessible to users with the ADMIN role.
          </Text>
          <Text size="sm">
            Current roles: {tokenData?.roles.join(', ') ?? 'none'}
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
