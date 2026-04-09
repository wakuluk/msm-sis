import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';

export function PortalPage() {
  const tokenData = useAccessTokenData();

  return (
    <Container size={420} my={40}>
      <Title ta="center">Portal Page</Title>
      <Paper p={22} mt={30}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This route requires authentication.
          </Text>
          <Text size="sm">Current roles: {tokenData?.roles.join(', ') ?? 'none'}</Text>
          <Group justify="flex-start" gap="sm" wrap="wrap">
            <Button variant="light" component={Link} to="/student/profile">
              Student profile
            </Button>
            <Button variant="light" component={Link} to="/student-search">
              Student search
            </Button>
          </Group>
          <Group justify="flex-start">
            <Button variant="default" component={Link} to="/public">
              Public home
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
