import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useAccessTokenData } from '@/auth/auth-store';

export function SharedPage() {
  const tokenData = useAccessTokenData();

  return (
    <Container size={420} my={40}>
      <Title ta="center">Shared Page</Title>
      <Paper p={22} mt={30}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This page is accessible to users with either the STUDENT or ADMIN role.
          </Text>
          <Text size="sm">Current roles: {tokenData?.roles.join(', ') ?? 'none'}</Text>
        </Stack>
      </Paper>
    </Container>
  );
}
